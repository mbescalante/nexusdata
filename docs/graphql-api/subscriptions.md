---
sidebar_position: 3
---

# Suscripciones

Las suscripciones GraphQL te permiten recibir actualizaciones en tiempo real cuando ocurren cambios en los datos. A diferencia de las consultas y mutaciones que siguen un modelo de solicitud-respuesta, las suscripciones establecen una conexión persistente que envía datos al cliente cuando ocurren eventos específicos.

## Estructura Básica de Suscripciones

Una suscripción GraphQL básica tiene la siguiente estructura:

```graphql
subscription {
  eventName(filter: { field: value }) {
    field1
    field2
    relation {
      field1
      field2
    }
  }
}
```

## Suscripciones Generadas Automáticamente
NexusData genera automáticamente las siguientes suscripciones para cada modelo:

### Suscripción a Creaciones (onCreate)
Recibe notificaciones cuando se crea un nuevo registro:

```graphql
subscription {
  onCreateUser {
    id
    email
    firstName
    lastName
    role
    createdAt
  }
}
 ```

### Suscripción a Actualizaciones (onUpdate)
Recibe notificaciones cuando se actualiza un registro existente:

```graphql
subscription {
  onUpdateProduct(where: { category: "Electronics" }) {
    id
    name
    price
    stock
    updatedAt
    updatedFields
  }
}
```

### Suscripción a Eliminaciones (onDelete)
Recibe notificaciones cuando se elimina un registro:

```graphql
subscription {
  onDeleteOrder {
    id
    status
    deletedAt
  }
}
 ```

## Filtros en Suscripciones
Puedes filtrar las notificaciones que recibes:

```graphql
subscription {
  onUpdateUser(
    where: {
      role: { in: [ADMIN, EDITOR] },
      OR: [
        { isActive: { equals: false } },
        { lastLogin: { lt: "2023-01-01T00:00:00Z" } }
      ]
    }
  ) {
    id
    email
    role
    isActive
    lastLogin
    updatedFields
  }
}
 ```


## Suscripciones a Campos Específicos
Puedes suscribirte a cambios en campos específicos:

```graphql
subscription {
  onUpdateProduct(
    where: { 
      id: "prod123",
      updatedFields: { contains: "price" }
    }
  ) {
    id
    name
    price
    previousValues {
      price
    }
    updatedFields
  }
}
```

## Implementación de Suscripciones
NexusData utiliza WebSockets para implementar suscripciones GraphQL. La configuración básica es automática, pero puedes personalizarla:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  graphql: {
    subscriptions: {
      enabled: true,
      path: '/graphql/subscriptions',
      keepAlive: 30000, // 30 segundos
      onConnect: async (connectionParams, webSocket, context) => {
        // Lógica de autenticación para suscripciones
        if (connectionParams.authToken) {
          const user = await verifyToken(connectionParams.authToken);
          return { user };
        }
        throw new Error('Autenticación requerida para suscripciones');
      },
      onDisconnect: async (webSocket, context) => {
        // Limpiar recursos cuando el cliente se desconecta
        console.log('Cliente desconectado');
      }
    }
  }
};
```

## Suscripciones Personalizadas
Además de las suscripciones generadas automáticamente, puedes definir suscripciones personalizadas:

```javascript
// src/resolvers/notifications/userActivity.js
module.exports = {
  name: 'userActivity',
  type: 'UserActivityEvent',
  args: {
    userId: 'ID',
    activityType: '[ActivityType!]'
  },
  subscribe: async (parent, args, context) => {
    const { userId, activityType } = args;
    const { pubsub } = context;
    
    // Crear un filtro basado en los argumentos
    const filter = (payload) => {
      if (userId && payload.userId !== userId) return false;
      if (activityType && !activityType.includes(payload.type)) return false;
      return true;
    };
    
    // Suscribirse al canal de eventos con filtro
    return pubsub.asyncIterator('USER_ACTIVITY', filter);
  },
  resolve: (payload) => {
    return payload;
  }
};
 ```


Publicación de eventos:

```javascript
// En cualquier parte de tu código
context.pubsub.publish('USER_ACTIVITY', {
  userId: user.id,
  type: 'LOGIN',
  timestamp: new Date(),
  metadata: {
    ip: request.ip,
    userAgent: request.headers['user-agent']
  }
});
 ```

Uso:

```graphql
subscription {
  userActivity(userId: "user123", activityType: [LOGIN, LOGOUT, PROFILE_UPDATE]) {
    userId
    type
    timestamp
    metadata {
      ip
      userAgent
    }
  }
}
```

## Suscripciones con Autenticación
Puedes proteger tus suscripciones con autenticación:

```javascript
// src/resolvers/chat/messageReceived.js
module.exports = {
  name: 'messageReceived',
  type: 'ChatMessage',
  args: {
    channelId: 'ID!'
  },
  authenticate: true, // Requiere autenticación
  authorize: async (user, args, context) => {
    // Verificar si el usuario tiene acceso al canal
    const { channelId } = args;
    const channel = await context.models.Channel.findUnique({
      where: { id: channelId },
      include: { members: true }
    });
    
    return channel && channel.members.some(member => member.userId === user.id);
  },
  subscribe: async (parent, args, context) => {
    const { channelId } = args;
    const { pubsub } = context;
    
    // Suscribirse al canal específico
    return pubsub.asyncIterator(`CHAT:${channelId}`);
  },
  resolve: (payload) => {
    return payload;
  }
};
```

## Uso en el Cliente
### Apollo Client
```javascript
import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';

// Crear enlace HTTP para consultas y mutaciones
const httpLink = new HttpLink({
  uri: 'https://api.ejemplo.com/graphql',
  headers: {
    authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

// Crear enlace WebSocket para suscripciones
const wsLink = new WebSocketLink({
  uri: 'wss://api.ejemplo.com/graphql/subscriptions',
  options: {
    reconnect: true,
    connectionParams: {
      authToken: localStorage.getItem('token')
    }
  }
});

// Usar el enlace adecuado según la operación
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

// Crear cliente Apollo
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});
```

### Uso de Suscripciones en React
```jsx
import { useSubscription, gql } from '@apollo/client';

const NEW_MESSAGE_SUBSCRIPTION = gql`
  subscription OnNewMessage($channelId: ID!) {
    messageReceived(channelId: $channelId) {
      id
      text
      createdAt
      sender {
        id
        name
        avatar
      }
    }
  }
`;

function ChatRoom({ channelId }) {
  const { data, loading, error } = useSubscription(
    NEW_MESSAGE_SUBSCRIPTION,
    { variables: { channelId } }
  );
  
  // Cuando llega un nuevo mensaje
  useEffect(() => {
    if (data && data.messageReceived) {
      // Actualizar la UI con el nuevo mensaje
      addMessageToChat(data.messageReceived);
    }
  }, [data]);
  
  // Resto del componente
  // ...
}
```

## Escalabilidad de Suscripciones
Para aplicaciones a gran escala, NexusData soporta múltiples estrategias de publicación/suscripción:

### Redis PubSub
```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  graphql: {
    subscriptions: {
      enabled: true,
      pubsub: {
        type: 'redis',
        options: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD,
          retryStrategy: (times) => Math.min(times * 50, 2000)
        }
      }
    }
  }
};
```

### Kafka PubSub
```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  graphql: {
    subscriptions: {
      enabled: true,
      pubsub: {
        type: 'kafka',
        options: {
          clientId: 'nexusdata-subscriptions',
          brokers: [process.env.KAFKA_BROKER],
          ssl: true,
          sasl: {
            mechanism: 'plain',
            username: process.env.KAFKA_USERNAME,
            password: process.env.KAFKA_PASSWORD
          }
        }
      }
    }
  }
};
 ```


## Limitación de Recursos
Para evitar problemas de rendimiento, es importante configurar límites adecuados:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  graphql: {
    subscriptions: {
      enabled: true,
      // Límites para evitar sobrecarga
      maxSubscriptionsPerClient: 10,
      maxSubscriptionLifetime: 3600000, // 1 hora en milisegundos
      throttle: {
        rate: 5, // eventos por segundo
        burst: 10 // máximo de eventos en ráfaga
      }
    }
  }
};
```

## Depuración de Suscripciones
NexusData proporciona herramientas para depurar suscripciones:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  graphql: {
    subscriptions: {
      enabled: true,
      debug: process.env.NODE_ENV === 'development',
      onOperation: (message, params, webSocket) => {
        console.log(`Operación de suscripción: ${message.payload.operationName}`);
        return params;
      }
    }
  }
};
```

## Mejores Prácticas
1. Limitar el alcance : Define suscripciones específicas en lugar de notificar sobre todos los cambios.
2. Filtrar en el servidor : Aplica filtros en el servidor para reducir el tráfico de red.
3. Autenticación : Siempre protege tus suscripciones con autenticación adecuada.
4. Manejo de desconexiones : Implementa lógica para manejar reconexiones y recuperación de estado.
5. Monitoreo : Supervisa el número de conexiones activas y el uso de recursos.
6. Pruebas de carga : Verifica cómo se comportan tus suscripciones bajo carga.
7. Timeouts : Configura timeouts adecuados para liberar recursos cuando los clientes se desconectan.
## Casos de Uso Comunes
- Actualizaciones de chat en tiempo real : Notificar a los usuarios cuando se reciben nuevos mensajes.
- Notificaciones de sistema : Alertar a los usuarios sobre eventos importantes.
- Tableros en tiempo real : Actualizar dashboards con métricas en vivo.
- Colaboración en tiempo real : Sincronizar cambios entre múltiples usuarios trabajando en el mismo documento.
- Monitoreo de estado : Seguir el estado de procesos de larga duración.
## Próximos Pasos
- Aprende sobre consultas GraphQL para recuperar datos
- Explora mutaciones GraphQL para modificar datos
- Implementa lógica de negocio personalizada en tus resolvers