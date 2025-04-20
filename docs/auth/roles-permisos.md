---
sidebar_position: 3
---

# Roles y Permisos

NexusData proporciona un sistema completo de control de acceso basado en roles (RBAC) que te permite definir quién puede acceder a qué recursos en tu aplicación.

## Conceptos básicos

- **Rol**: Una función o posición que un usuario puede tener (ej. Admin, Editor, Usuario)
- **Permiso**: Una capacidad específica para realizar una acción (ej. crear:artículo, leer:usuario)
- **Política**: Reglas que determinan si una acción está permitida

## Configuración de roles

Define los roles y sus permisos asociados en tu configuración:

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
## Modelo de usuario con roles
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
      password:
        type: string
        private: true
      firstName:
        type: string
        nullable: true
      lastName:
        type: string
        nullable: true
      role:
        type: enum
        values: [ADMIN, EDITOR, USER]
        default: USER
      isActive:
        type: boolean
        default: true
    relations:
      permissions:
        type: hasMany
        model: Permission
        foreignKey: userId
        
  Permission:
    fields:
      id:
        type: uuid
        primary: true
      action:
        type: string
      resource:
        type: string
      conditions:
        type: json
        nullable: true
      createdAt:
        type: datetime
        default: now()
    relations:
      user:
        type: belongsTo
        model: User
        foreignKey: userId
    indexes:
      - name: userId_action_resource
        fields: [userId, action, resource]
        unique: true
 ```
 ## Definición de políticas
Las políticas definen reglas más complejas para el acceso a recursos:

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
## Configuración de políticas
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

 ## Trae AI
Used 1 Reference

Veo que necesitas arreglar la estructura de archivos para la documentación de autenticación. El problema es que tienes un archivo auth.md dentro de una carpeta auth , lo que puede causar confusión en la navegación.

Para arreglar esto, te recomiendo reorganizar la estructura de la siguiente manera:

1. Renombrar el archivo actual auth/auth.md a auth/index.md para que sea la página principal de la sección de autenticación
2. Actualizar las referencias en el sidebar
Aquí está el cambio que debes hacer:

1. Primero, mueve el contenido del archivo actual a un nuevo archivo index.md:
```markdown
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
```

// ... resto del contenido sin cambios ...

```plaintext

2. Luego, actualiza el archivo sidebars.js para que apunte al nuevo archivo:

```javascript:c%3A%5CUsers%5CShawm%5CDesktop%5Cdocux%5Cmy-website%5Csidebars.js
// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introducción'
    },
    {
      type: 'doc',
      id: 'quickstart',
      label: 'Inicio Rápido'
    },
    {
      type: 'doc',
      id: 'data-sources',
      label: 'Fuentes de Datos'
    },
    {
      type: 'doc',
      id: 'data-modeling',
      label: 'Modelado de Datos'
    },
    {
      type: 'doc',
      id: 'graphql-api',
      label: 'API GraphQL'
    },
    {
      type: 'doc',
      id: 'servicios-http',
      label: 'Servicios HTTP'
    },
    {
      type: 'category',
      label: 'Autenticación',
      items: [
        'auth/index',
        // Aquí puedes añadir más documentos relacionados con autenticación
        // Por ejemplo:
        // 'auth/jwt',
        // 'auth/oauth',
        // 'auth/roles-permisos'
      ]
    },
    {
      type: 'doc',
      id: 'business-logic',
      label: 'Lógica de Negocio'
    },
    // ... resto del sidebar sin cambios ...
  ]
};

module.exports = sidebars;
 ```
```

3. Después de hacer estos cambios, puedes eliminar el archivo original auth.md si ya has confirmado que el nuevo index.md funciona correctamente.
Estos cambios permitirán que:

- La documentación de autenticación sea la página principal de la sección de autenticación
- Puedas agregar más archivos relacionados con autenticación en la misma carpeta
- La estructura sea más clara y organizada

## mbescalante
Copy

Delete

'auth/jwt',

'auth/oauth',

'auth/roles-permisos'

puedes crearme esos 3 archivos

## Trae AI
Used 1 Reference

sidebars.js 39-39

Voy a crear los tres archivos solicitados para la sección de autenticación y luego actualizaré el sidebar para incluirlos.

Primero, vamos a actualizar el sidebar para incluir las referencias a estos archivos:

```javascript
// ... código existente ...
    {
      type: 'category',
      label: 'Autenticación',
      items: [
        'auth/index',
        'auth/jwt',
        'auth/oauth',
        'auth/roles-permisos'
      ]
    },
// ... código existente ...
 ```

Ahora, vamos a crear los tres archivos solicitados:

1. Archivo JWT:
```markdown
---
sidebar_position: 1
---

# Autenticación con JWT

JSON Web Tokens (JWT) es el método de autenticación recomendado para aplicaciones modernas en NexusData. Este enfoque sin estado permite una escalabilidad sencilla y es ideal para arquitecturas de microservicios.

## Configuración básica

Para habilitar la autenticación JWT en tu aplicación NexusData:

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
```

## Estructura del token
Los tokens JWT generados por NexusData contienen la siguiente información:

```json
{
  "sub": "1234567890", // ID del usuario
  "name": "John Doe",
  "role": "ADMIN",
  "permissions": ["article:create", "article:read"],
  "iat": 1516239022, // Fecha de emisión
  "exp": 1516325422  // Fecha de expiración
}
 ```
```

## Flujo de autenticación
1. Registro/Login : El usuario proporciona credenciales y recibe un token JWT y un refresh token
2. Solicitudes autenticadas : El cliente incluye el token JWT en el header Authorization
3. Verificación : NexusData verifica automáticamente el token en cada solicitud
4. Renovación : Cuando el token expira, el cliente usa el refresh token para obtener un nuevo JWT
## Implementación del login
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
    
    // Generar token JWT
    const token = await services.auth.generateToken({
      userId: user.id,
      role: user.role
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
        role: user.role
      }
    };
  }
};
 ```
```

## Renovación de tokens
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
    const { services } = context;
    
    // Verificar refresh token
    const payload = await services.auth.verifyRefreshToken(refreshToken);
    
    if (!payload || !payload.userId) {
      throw new Error('Token inválido o expirado');
    }
    
    // Generar nuevo token JWT
    const newToken = await services.auth.generateToken({
      userId: payload.userId,
      role: payload.role
    });
    
    // Generar nuevo refresh token
    const newRefreshToken = await services.auth.generateRefreshToken(payload.userId);
    
    return {
      token: newToken,
      refreshToken: newRefreshToken
    };
  }
};
 ```
```

## Seguridad de los tokens
Para garantizar la seguridad de tus tokens JWT:

1. Usa un secreto fuerte : Genera un secreto aleatorio y seguro
2. Configura tiempos de expiración cortos : Recomendamos entre 15 minutos y 1 día
3. Implementa rotación de secretos : Cambia periódicamente el secreto
4. Usa HTTPS : Siempre transmite tokens a través de conexiones seguras
5. Almacenamiento seguro : Guarda los tokens en localStorage o cookies HttpOnly
## Revocación de tokens
Aunque los JWT son sin estado, NexusData proporciona un mecanismo de revocación:

```javascript
// Revocar token para un usuario específico
await services.auth.revokeTokens(userId);

// Revocar todos los tokens (útil en caso de compromiso)
await services.auth.revokeAllTokens();
 ```
```

## Uso en clientes
### React
```jsx
// Ejemplo de uso en React con axios
import axios from 'axios';

// Configurar interceptor para incluir token
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Función de login
const login = async (email, password) => {
  try {
    const response = await axios.post('/api/auth/login', {
      email,
      password
    });
    
    const { token, refreshToken, user } = response.data;
    
    // Guardar tokens
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    
    return user;
  } catch (error) {
    console.error('Error de login:', error);
    throw error;
  }
};
 ```
```

## Próximos pasos
- Implementa autenticación multi-factor para mayor seguridad
- Configura políticas de acceso basadas en roles
- Explora la integración con OAuth para login social
```plaintext

2. Archivo OAuth:

```markdown:c%3A%5CUsers%5CShawm%5CDesktop%5Cdocux%5Cmy-website%5Cdocs%5Cauth%5Coauth.md
---
sidebar_position: 2
---

# Autenticación con OAuth

NexusData proporciona integración completa con proveedores OAuth 2.0, permitiendo a los usuarios iniciar sesión con sus cuentas existentes de Google, GitHub, Facebook y otros servicios populares.

## Configuración de proveedores

Para habilitar la autenticación OAuth en tu aplicación NexusData:

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
        },
        facebook: {
          clientId: process.env.FACEBOOK_CLIENT_ID,
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          callbackURL: '/auth/facebook/callback',
          scope: ['email', 'public_profile']
        }
      }
    }
  }
};
 ```
```

## Flujo de autenticación OAuth
1. Redirección al proveedor : El usuario hace clic en "Iniciar sesión con X" y es redirigido al proveedor
2. Autorización : El usuario autoriza tu aplicación en el sitio del proveedor
3. Callback : El proveedor redirige de vuelta a tu aplicación con un código de autorización
4. Intercambio de tokens : Tu aplicación intercambia el código por un token de acceso
5. Obtención de perfil : Se obtiene la información del perfil del usuario
6. Creación/actualización de usuario : Se crea o actualiza el usuario en tu base de datos
7. Generación de JWT : Se genera un JWT para la sesión del usuario
## Endpoints generados
NexusData genera automáticamente los siguientes endpoints para cada proveedor configurado:

- /auth/google - Inicia el flujo de autenticación con Google
- /auth/google/callback - URL de callback para Google
- /auth/github - Inicia el flujo de autenticación con GitHub
- /auth/github/callback - URL de callback para GitHub
- /auth/facebook - Inicia el flujo de autenticación con Facebook
- /auth/facebook/callback - URL de callback para Facebook
## Personalización del proceso
Puedes personalizar el comportamiento durante la autenticación OAuth:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  auth: {
    oauth: {
      // ... configuración de proveedores
      
      // Función ejecutada después de obtener el perfil del usuario
      onSuccess: async (profile, provider, context) => {
        const { models, services } = context;
        
        // Buscar usuario existente por email o ID del proveedor
        let user = await models.User.findFirst({
          where: {
            OR: [
              { email: profile.email },
              {
                oauthConnections: {
                  some: {
                    provider,
                    providerId: profile.id
                  }
                }
              }
            ]
          },
          include: {
            oauthConnections: true
          }
        });
        
        if (!user) {
          // Crear nuevo usuario
          user = await models.User.create({
            data: {
              email: profile.email,
              firstName: profile.firstName || profile.given_name,
              lastName: profile.lastName || profile.family_name,
              avatar: profile.picture || profile.avatar_url,
              oauthConnections: {
                create: {
                  provider,
                  providerId: profile.id,
                  data: JSON.stringify(profile)
                }
              }
            }
          });
          
          // Enviar email de bienvenida
          await services.email.send({
            to: user.email,
            subject: 'Bienvenido a nuestra aplicación',
            template: 'welcome-oauth',
            data: { user, provider }
          });
        } else if (!user.oauthConnections.some(conn => conn.provider === provider)) {
          // Conectar cuenta existente con nuevo proveedor
          await models.OAuthConnection.create({
            data: {
              userId: user.id,
              provider,
              providerId: profile.id,
              data: JSON.stringify(profile)
            }
          });
        }
        
        // Generar token JWT
        const token = await services.auth.generateToken({
          userId: user.id,
          role: user.role
        });
        
        // Generar refresh token
        const refreshToken = await services.auth.generateRefreshToken(user.id);
        
        return {
          token,
          refreshToken,
          user
        };
      },
      
      // Función ejecutada en caso de error
      onError: async (error, provider, context) => {
        console.error(`Error de autenticación OAuth con ${provider}:`, error);
        
        // Registrar error
        await context.models.AuthError.create({
          data: {
            provider,
            error: error.message,
            stack: error.stack
          }
        });
        
        // Redirigir a página de error
        return {
          redirect: `/auth/error?provider=${provider}&message=${encodeURIComponent(error.message)}`
        };
      }
    }
  }
};
 ```
```

## Implementación en el frontend
### Botones de login social
```jsx
// Componente de botones de login social
import React from 'react';

const SocialLoginButtons = () => {
  return (
    <div className="social-buttons">
      <button 
        className="social-button google"
        onClick={() => window.location.href = '/auth/google'}
      >
        <svg>...</svg>
        Continuar con Google
      </button>
      
      <button 
        className="social-button github"
        onClick={() => window.location.href = '/auth/github'}
      >
        <svg>...</svg>
        Continuar con GitHub
      </button>
      
      <button 
        className="social-button facebook"
        onClick={() => window.location.href = '/auth/facebook'}
      >
        <svg>...</svg>
        Continuar con Facebook
      </button>
    </div>
  );
};

export default SocialLoginButtons;
 ```
```

## Modelo de datos para OAuth
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
      firstName:
        type: string
        nullable: true
      lastName:
        type: string
        nullable: true
      avatar:
        type: string
        nullable: true
      role:
        type: enum
        values: [ADMIN, USER]
        default: USER
    relations:
      oauthConnections:
        type: hasMany
        model: OAuthConnection
        foreignKey: userId
        
  OAuthConnection:
    fields:
      id:
        type: uuid
        primary: true
      provider:
        type: string
      providerId:
        type: string
      data:
        type: json
        nullable: true
      createdAt:
        type: datetime
        default: now()
      updatedAt:
        type: datetime
        default: now()
        onUpdate: now()
    relations:
      user:
        type: belongsTo
        model: User
        foreignKey: userId
    indexes:
      - name: provider_providerId
        fields: [provider, providerId]
        unique: true
      - name: userId_provider
        fields: [userId, provider]
        unique: true
 ```

## Consideraciones de seguridad
1. Nunca expongas tus Client Secrets : Almacénalos en variables de entorno
2. Valida los emails : Algunos proveedores no verifican emails, considera marcarlos como no verificados
3. Configura correctamente los dominios : Registra solo dominios que controles en la consola del proveedor
4. Implementa CSRF protection : Usa el estado OAuth para prevenir ataques CSRF
5. Limita los permisos : Solicita solo los permisos mínimos necesarios
## Proveedores soportados
NexusData soporta los siguientes proveedores OAuth:

- Google
- GitHub
- Facebook
- Twitter
- LinkedIn
- Microsoft
- Apple
- Discord
- Slack
- Spotify
## Próximos pasos
- Configura autenticación multi-factor para mayor seguridad
- Implementa JWT personalizado para tus tokens
- Explora el control de acceso basado en roles
```plaintext

3. Archivo Roles y Permisos:

```markdown:c%3A%5CUsers%5CShawm%5CDesktop%5Cdocux%5Cmy-website%5Cdocs%5Cauth%5Croles-permisos.md
---
sidebar_position: 3
---

# Roles y Permisos

NexusData proporciona un sistema completo de control de acceso basado en roles (RBAC) que te permite definir quién puede acceder a qué recursos en tu aplicación.

## Conceptos básicos

- **Rol**: Una función o posición que un usuario puede tener (ej. Admin, Editor, Usuario)
- **Permiso**: Una capacidad específica para realizar una acción (ej. crear:artículo, leer:usuario)
- **Política**: Reglas que determinan si una acción está permitida

## Configuración de roles

Define los roles y sus permisos asociados en tu configuración:

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
```

## Modelo de usuario con roles
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
      password:
        type: string
        private: true
      firstName:
        type: string
        nullable: true
      lastName:
        type: string
        nullable: true
      role:
        type: enum
        values: [ADMIN, EDITOR, USER]
        default: USER
      isActive:
        type: boolean
        default: true
    relations:
      permissions:
        type: hasMany
        model: Permission
        foreignKey: userId
        
  Permission:
    fields:
      id:
        type: uuid
        primary: true
      action:
        type: string
      resource:
        type: string
      conditions:
        type: json
        nullable: true
      createdAt:
        type: datetime
        default: now()
    relations:
      user:
        type: belongsTo
        model: User
        foreignKey: userId
    indexes:
      - name: userId_action_resource
        fields: [userId, action, resource]
        unique: true
 ```

## Definición de políticas
Las políticas definen reglas más complejas para el acceso a recursos:

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
```

## Configuración de políticas
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

## Uso en resolvers GraphQL
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

## Uso en REST API
NexusData también aplica automáticamente las políticas en los endpoints REST:

```plaintext
POST /api/articles        // Verifica article.create
GET /api/articles/:id     // Verifica article.read
PUT /api/articles/:id     // Verifica article.update
DELETE /api/articles/:id  // Verifica article.delete
 ```

## Verificación de permisos en el código
Puedes verificar permisos manualmente en cualquier parte de tu código:

```javascript
// Verificar si el usuario tiene un permiso específico
const canCreateArticle = await context.services.rbac.hasPermission(
  user, 
  'article:create'
);

// Verificar si el usuario tiene acceso a un recurso específico
const canUpdateArticle = await context.services.rbac.can(
  user,
  'update',
  'article',
  articleId
);

// Verificar múltiples permisos
const permissions = await context.services.rbac.checkPermissions(
  user,
  ['article:create', 'article:update:own', 'category:read']
);
// Resultado: { 'article:create': true, 'article:update:own': true, 'category:read': false }
 ```

## Roles dinámicos
Además de los roles estáticos, puedes implementar roles dinámicos:

```javascript
// src/services/rbac.js
module.exports = {
  // ... otros métodos
  
  getUserPermissions: async (userId) => {
    const { models } = context;
    
    // Obtener usuario con su rol
    const user = await models.User.findUnique({
      where: { id: userId },
      include: {
        permissions: true
      }
    });
    
    if (!user) return [];
    
    // Obtener permisos base del rol
    const rolePermissions = config.rbac.roles[user.role]?.permissions || [];
    
    // Obtener permisos personalizados del usuario
    const customPermissions = user.permissions.map(p => 
      `${p.resource}:${p.action}${p.conditions ? ':own' : ''}`
    );
    
    // Combinar permisos
    return [...new Set([...rolePermissions, ...customPermissions])];
  }
};
 ```

## Jerarquía de roles
Puedes implementar una jerarquía de roles donde los roles superiores heredan permisos de los inferiores:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  rbac: {
    hierarchy: {
      ADMIN: ['EDITOR', 'USER'],
      EDITOR: ['USER']
    },
    roles: {
      // ... definición de roles
    }
  }
};
 ```

 ## Permisos a nivel de campo
NexusData también permite controlar el acceso a nivel de campo:

```javascript
// models.yaml
models:
  Article:
    fields:
      id:
        type: uuid
        primary: true
      title:
        type: string
      content:
        type: text
      status:
        type: enum
        values: [DRAFT, PUBLISHED, ARCHIVED]
      secretNotes:
        type: text
        nullable: true
        permissions: {
          read: ['ADMIN', 'EDITOR'],
          write: ['ADMIN']
        }
      authorId:
        type: uuid
    relations:
      author:
        type: belongsTo
        model: User
        foreignKey: authorId
 ```

## Implementación en el frontend
### React con Context API
```jsx
// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Cargar usuario al iniciar
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Obtener datos del usuario
          const { data } = await api.get('/api/auth/me');
          setUser(data.user);
          
          // Obtener permisos del usuario
          const { data: permsData } = await api.get('/api/auth/permissions');
          setPermissions(permsData.permissions);
        }
      } catch (error) {
        console.error('Error al cargar usuario:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Administradores tienen todos los permisos
    if (user.role === 'ADMIN') return true;
    
    // Verificar permiso específico
    return permissions.includes(permission);
  };
  
  // Verificar si el usuario puede realizar una acción en un recurso
  const can = (action, resource, id = null) => {
    if (!user) return false;
    
    // Administradores pueden hacer todo
    if (user.role === 'ADMIN') return true;
    
    // Verificar permiso general
    const generalPermission = `${resource}:${action}`;
    if (permissions.includes(generalPermission)) return true;
    
    // Verificar permiso para recursos propios
    const ownPermission = `${resource}:${action}:own`;
    if (permissions.includes(ownPermission)) {
      // Aquí se podría implementar lógica para verificar si el recurso pertenece al usuario
      // Por simplicidad, asumimos que si se pasa un ID, se debe verificar en el backend
      return id ? null : true; // null significa "verificar en el backend"
    }
    
    return false;
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      hasPermission, 
      can,
      permissions
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### Componente de protección de rutas
```jsx
// src/components/ProtectedRoute.js
import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ 
  component: Component, 
  permission, 
  resource, 
  action,
  ...rest 
}) => {
  const { user, loading, hasPermission, can } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  return (
    <Route
      {...rest}
      render={props => {
        // Verificar si el usuario está autenticado
        if (!user) {
          return <Redirect to={{
            pathname: '/login',
            state: { from: props.location }
          }} />;
        }
        
        // Verificar permiso específico si se proporciona
        if (permission && !hasPermission(permission)) {
          return <Redirect to="/forbidden" />;
        }
        
        // Verificar acción en recurso si se proporciona
        if (resource && action && !can(action, resource)) {
          return <Redirect to="/forbidden" />;
        }
        
        // Si pasa todas las verificaciones, renderizar el componente
        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;
```

## Próximos pasos
- Implementa autenticación JWT para tus tokens
- Configura OAuth para login social
- Explora la autenticación multi-factor para mayor seguridad