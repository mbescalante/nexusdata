---
sidebar_position: 6
---

# Autenticación y Autorización

NexusData proporciona un sistema completo de autenticación y autorización para proteger tus APIs y datos.

## Métodos de autenticación

NexusData soporta varios métodos de autenticación:

### JWT (JSON Web Tokens)

El método más recomendado para aplicaciones modernas:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '1d', // 1 día
      refreshToken: {
        enabled: true,
        expiresIn: '7d', // 7 días
      }
    }
  }
};
```

### API Keys

Útil para integraciones y servicios:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  auth: {
    apiKey: {
      enabled: true,
      headerName: 'X-API-Key', // Nombre personalizado del header
      allowQuery: false, // No permitir API key en querystring
    }
  }
};
```

### OAuth 2.0

Para integración con proveedores externos:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  auth: {
    oauth: {
      providers: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/auth/google/callback',
          scope: ['profile', 'email']
        },
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: '/auth/github/callback',
          scope: ['user:email']
        }
      }
    }
  }
};
```

### Magic Links

Para un inicio de sesión sin contraseña:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  auth: {
    magicLink: {
      enabled: true,
      expiresIn: '15m', // 15 minutos
      emailService: 'sendgrid', // O cualquier otro servicio configurado
      emailTemplate: 'magic-link',
      redirectURL: process.env.FRONTEND_URL + '/auth/verify'
    }
  }
};
```

## Modelo de Usuario

Por defecto, NexusData proporciona un modelo de usuario básico que puedes extender:

```yaml
# models.yaml
models:
  User:
    fields:
      id:
        type: uuid
        primary: true
      email:
        type: string
        unique: true
        validate:
          format: email
      password:
        type: string
        private: true  # No se expone en API
      firstName:
        type: string
        nullable: true
      lastName:
        type: string
        nullable: true
      role:
        type: enum
        values: [ADMIN, USER, EDITOR]
        default: USER
      isActive:
        type: boolean
        default: true
      lastLogin:
        type: datetime
        nullable: true
      createdAt:
        type: datetime
        default: now()
      updatedAt:
        type: datetime
        default: now()
        onUpdate: now()
```

## Autenticación

### Registro de usuario

```javascript
// src/resolvers/auth/register.js
module.exports = {
  name: 'register',
  type: 'AuthPayload',
  args: {
    email: 'String!',
    password: 'String!',
    firstName: 'String',
    lastName: 'String'
  },
  resolve: async (parent, args, context) => {
    const { email, password, firstName, lastName } = args;
    const { services, models } = context;
    
    // Verificar si el usuario ya existe
    const existingUser = await models.User.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }
    
    // Hash de la contraseña
    const hashedPassword = await services.auth.hashPassword(password);
    
    // Crear el usuario
    const user = await models.User.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName
      }
    });
    
    // Generar token
    const token = await services.auth.generateToken({
      userId: user.id,
      role: user.role
    });
    
    // Generar refresh token
    const refreshToken = await services.auth.generateRefreshToken(user.id);
    
    // Enviar email de bienvenida
    await services.email.send({
      to: user.email,
      subject: 'Bienvenido a nuestra aplicación',
      template: 'welcome-email',
      data: { user }
    });
    
    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  }
};
```

### Inicio de sesión

```javascript
// src/resolvers/auth/login.js
module.exports = {
  name: 'login',
  type: 'AuthPayload',
  args: {
    email: 'String!',
    password: 'String!'
  },
  resolve: async (parent, args, context) => {
    const { email, password } = args;
    const { services, models } = context;
    
    // Buscar usuario
    const user = await models.User.findUnique({
      where: { email }
    });
    
    if (!user || !user.isActive) {
      throw new Error('Credenciales inválidas');
    }
    
    // Verificar contraseña
    const passwordValid = await services.auth.verifyPassword(
      password, 
      user.password
    );
    
    if (!passwordValid) {
      throw new Error('Credenciales inválidas');
    }
    
    // Actualizar último inicio de sesión
    await models.User.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    // Generar token
    const token = await services.auth.generateToken({
      userId: user.id,
      role: user.role
    });
    
    // Generar refresh token
    const refreshToken = await services.auth.generateRefreshToken(user.id);
    
    // Registrar evento de login
    await context.events.emit('user.login', { 
      userId: user.id,
      timestamp: new Date(),
      ip: context.request.ip 
    });
    
    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  }
};
```

### Renovación de tokens

```javascript
// src/resolvers/auth/refreshToken.js
module.exports = {
  name: 'refreshToken',
  type: 'RefreshTokenPayload',
  args: {
    refreshToken: 'String!'
  },
  resolve: async (parent, args, context) => {
    const { refreshToken } = args;
    const { services, models } = context;
    
    // Verificar refresh token
    const payload = await services.auth.verifyRefreshToken(refreshToken);
    
    if (!payload || !payload.userId) {
      throw new Error('Token inválido o expirado');
    }
    
    // Buscar usuario
    const user = await models.User.findUnique({
      where: { id: payload.userId }
    });
    
    if (!user || !user.isActive) {
      throw new Error('Usuario no encontrado o inactivo');
    }
    
    // Generar nuevo token
    const newToken = await services.auth.generateToken({
      userId: user.id,
      role: user.role
    });
    
    // Generar nuevo refresh token
    const newRefreshToken = await services.auth.generateRefreshToken(user.id);
    
    return {
      token: newToken,
      refreshToken: newRefreshToken
    };
  }
};
```

## Autorización

### Definición de políticas

```javascript
// src/policies/article.js
module.exports = {
  create: (user) => {
    return user && (user.role === 'ADMIN' || user.role === 'EDITOR');
  },
  
  update: async (user, context, resourceId) => {
    if (!user) return false;
    
    // Administradores pueden actualizar cualquier artículo
    if (user.role === 'ADMIN') return true;
    
    // Editores solo pueden actualizar sus propios artículos
    if (user.role === 'EDITOR') {
      const article = await context.models.Article.findUnique({
        where: { id: resourceId }
      });
      return article && article.authorId === user.id;
    }
    
    return false;
  },
  
  delete: (user) => {
    return user && user.role === 'ADMIN';
  },
  
  read: () => {
    // Cualquiera puede leer artículos
    return true;
  }
};
```

### Configuración de políticas

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  permissions: {
    article: 'src/policies/article.js',
    user: 'src/policies/user.js',
    comment: 'src/policies/comment.js'
  }
};
```

### Uso en resolvers

```javascript
// src/resolvers/article/updateArticle.js
module.exports = {
  name: 'updateArticle',
  type: 'Article',
  args: {
    id: 'ID!',
    title: 'String',
    content: 'String',
    published: 'Boolean'
  },
  authenticate: true, // Requiere autenticación
  authorize: {
    policy: 'article.update', // Usa la política definida
    args: ['id'] // Pasa el ID como resourceId
  },
  resolve: async (parent, args, context) => {
    const { id, ...data } = args;
    
    return context.models.Article.update({
      where: { id },
      data
    });
  }
};
```

### Uso en REST API

NexusData también aplica automáticamente las políticas en los endpoints REST:

```
POST /api/articles        // Verifica article.create
GET /api/articles/:id     // Verifica article.read
PUT /api/articles/:id     // Verifica article.update
DELETE /api/articles/:id  // Verifica article.delete
```

## RBAC (Control de Acceso Basado en Roles)

NexusData proporciona un sistema RBAC completo:

### Definición de roles y permisos

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  rbac: {
    roles: {
      ADMIN: {
        description: 'Administrador del sistema',
        permissions: ['*'] // Todos los permisos
      },
      EDITOR: {
        description: 'Editor de contenido',
        permissions: [
          'article:create',
          'article:read',
          'article:update:own', // Solo propios
          'article:delete:own', // Solo propios
          'comment:create',
          'comment:read',
          'comment:update:own',
          'comment:delete:own',
          'category:read'
        ]
      },
      USER: {
        description: 'Usuario regular',
        permissions: [
          'article:read',
          'comment:create',
          'comment:read',
          'comment:update:own',
          'comment:delete:own',
          'profile:read:own',
          'profile:update:own'
        ]
      }
    }
  }
};
```

### Verificación de permisos

```javascript
// src/resolvers/article/deleteArticle.js
module.exports = {
  name: 'deleteArticle',
  type: 'Boolean',
  args: {
    id: 'ID!'
  },
  authenticate: true,
  authorize: async (user, args, context) => {
    const { id } = args;
    const { services } = context;
    
    // Verificar si el usuario tiene permiso para eliminar cualquier artículo
    if (await services.rbac.hasPermission(user, 'article:delete')) {
      return true;
    }
    
    // Verificar si el usuario tiene permiso para eliminar sus propios artículos
    if (await services.rbac.hasPermission(user, 'article:delete:own')) {
      // Verificar si el artículo pertenece al usuario
      const article = await context.models.Article.findUnique({
        where: { id }
      });
      
      return article && article.authorId === user.id;
    }
    
    return false;
  },
  resolve: async (parent, args, context) => {
    const { id } = args;
    
    await context.models.Article.delete({
      where: { id }
    });
    
    return true;
  }
};
```

## Autenticación Multi-factor (MFA)

NexusData soporta autenticación multi-factor:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  auth: {
    mfa: {
      enabled: true,
      methods: ['totp', 'sms'],
      issuer: 'MiApp', // Para TOTP
      smsProvider: 'twilio', // Proveedor de SMS
      codeLength: 6, // Longitud del código
      codeExpiry: '5m' // 5 minutos
    }
  }
};
```

### Configuración de MFA

```javascript
// src/resolvers/auth/setupMFA.js
module.exports = {
  name: 'setupMFA',
  type: 'MFASetupPayload',
  args: {
    method: 'MFAMethod!' // TOTP o SMS
  },
  authenticate: true,
  resolve: async (parent, args, context) => {
    const { method } = args;
    const { user, services } = context;
    
    if (method === 'TOTP') {
      // Generar secreto TOTP
      const { secret, uri, qrCode } = await services.auth.generateTOTPSecret(user.id);
      
      // Guardar secreto para verificación posterior
      await context.models.User.update({
        where: { id: user.id },
        data: {
          mfaSetup: {
            upsert: {
              create: {
                method: 'TOTP',
                secret: secret,
                verified: false
              },
              update: {
                secret: secret,
                verified: false
              }
            }
          }
        }
      });
      
      return {
        method: 'TOTP',
        qrCode,
        secret,
        uri
      };
    } else if (method === 'SMS') {
      // Validar que el usuario tenga número de teléfono
      if (!user.phone) {
        throw new Error('Se requiere número de teléfono para MFA por SMS');
      }
      
      // Generar y enviar código
      const code = await services.auth.generateSMSCode(user.id);
      await services.sms.send(user.phone, `Tu código de verificación es: ${code}`);
      
      return {
        method: 'SMS',
        phone: user.phone.replace(/\d(?=\d{4})/g, '*') // Ocultar parte del número
      };
    }
    
    throw new Error('Método MFA no soportado');
  }
};
```

### Verificación de MFA

```javascript
// src/resolvers/auth/verifyMFA.js
module.exports = {
  name: 'verifyMFA',
  type: 'AuthPayload',
  args: {
    method: 'MFAMethod!',
    code: 'String!'
  },
  authenticate: true,
  resolve: async (parent, args, context) => {
    const { method, code } = args;
    const { user, services } = context;
    
    let verified = false;
    
    if (method === 'TOTP') {
      // Obtener configuración MFA del usuario
      const mfaSetup = await context.models.MFASetup.findUnique({
        where: {
          userId_method: {
            userId: user.id,
            method: 'TOTP'
          }
        }
      });
      
      if (!mfaSetup) {
        throw new Error('MFA no configurado');
      }
      
      // Verificar código TOTP
      verified = await services.auth.verifyTOTP(code, mfaSetup.secret);
    } else if (method === 'SMS') {
      // Verificar código SMS
      verified = await services.auth.verifySMSCode(user.id, code);
    }
    
    if (!verified) {
      throw new Error('Código inválido');
    }
    
    // Marcar MFA como verificado
    await context.models.MFASetup.update({
      where: {
        userId_method: {
          userId: user.id,
          method
        }
      },
      data: {
        verified: true
      }
    });
    
    // Generar token con nivel de seguridad aumentado
    const token = await services.auth.generateToken({
      userId: user.id,
      role: user.role,
      mfaVerified: true
    });
    
    // Generar refresh token
    const refreshToken = await services.auth.generateRefreshToken(user.id);
    
    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        mfaEnabled: true
      }
    };
  }
};
```

## Seguridad Adicional

### CSRF (Cross-Site Request Forgery)

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  security: {
    csrf: {
      enabled: true,
      cookieName: 'nexus-csrf-token',
      headerName: 'X-CSRF-Token',
      expiresIn: '1h'
    }
  }
};
```

### Rate Limiting

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  security: {
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // límite de solicitudes por ventana
      message: 'Demasiadas solicitudes, intente más tarde',
      paths: ['/api/*', '/graphql'],
      keyGenerator: (req) => req.ip || 'anonymous',
      skipSuccessfulRequests: false,
      // Rutas más críticas tienen límites más restrictivos
      rules: [
        {
          path: '/api/auth/*',
          windowMs: 60 * 60 * 1000, // 1 hora
          max: 10 // 10 intentos por hora
        },
        {
          path: '/graphql',
          windowMs: 60 * 1000, // 1 minuto
          max: 30 // 30 solicitudes por minuto
        }
      ]
    }
  }
};
```

### Encriptación de datos sensibles

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  security: {
    encryption: {
      enabled: true,
      key: process.env.ENCRYPTION_KEY,
      algorithm: 'aes-256-gcm',
      fields: [
        'User.creditCardNumber',
        'Customer.taxId',
        'PaymentMethod.cardDetails'
      ]
    }
  }
};
```

## Próximos pasos

- Aprende a [personalizar el modelo de usuario](/docs/auth/user-model)
- Configura [integraciones con OAuth](/docs/auth/oauth-integrations)
- Explora la [gestión de sesiones](/docs/auth/session-management)
- Implementa [autenticación por WebAuthn](/docs/auth/webauthn) 