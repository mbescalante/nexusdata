---
sidebar_position: 2
---

# OAuth

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
## Flujo de autenticación OAuth
1. **Redirección al proveedor** : El usuario hace clic en "Iniciar sesión con X" y es redirigido al proveedor
2. **Autorización** : El usuario autoriza tu aplicación en el sitio del proveedor
3. **Callback** : El proveedor redirige de vuelta a tu aplicación con un código de autorización
4. **Intercambio de tokens** : Tu aplicación intercambia el código por un token de acceso
5. **Obtención de perfil** : Se obtiene la información del perfil del usuario
6. **Creación/actualización de usuario** : Se crea o actualiza el usuario en tu base de datos
7. **Generación de JWT** : Se genera un JWT para la sesión del usuario
## Endpoints generados
NexusData genera automáticamente los siguientes endpoints para cada proveedor configurado:

- **/auth/google** - Inicia el flujo de autenticación con Google
- **/auth/google/callback** - URL de callback para Google
- **/auth/github** - Inicia el flujo de autenticación con GitHub
- **/auth/github/callback** - URL de callback para GitHub
- **/auth/facebook** - Inicia el flujo de autenticación con Facebook
- **/auth/facebook/callback** - URL de callback para Facebook

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
Este código utiliza la función `onSuccess` para manejar el caso de éxito de la autenticación OAuth. En este caso, se crea un nuevo usuario si no existe, se actualiza el usuario existente, se crea una nueva conexión de OAuth y se generan tokens JWT y refresh token.
La función `onError` se utiliza para manejar el caso de error de la autenticación OAuth. En este caso, se registra el error en la base de datos y se redirige al usuario a una página de error.

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