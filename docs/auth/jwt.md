---
sidebar_position: 1
---

# JWT

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
## Próximos pasos
- Implementa autenticación multi-factor para mayor seguridad
- Configura políticas de acceso basadas en roles
- Explora la integración con OAuth para login social