---
sidebar_position: 3
---

# Fuentes de Datos

NexusData puede conectarse a múltiples fuentes de datos simultáneamente, permitiéndote crear APIs unificadas sobre sistemas heterogéneos.

## Fuentes soportadas

NexusData admite las siguientes fuentes de datos:

### Bases de datos relacionales

- PostgreSQL
- MySQL/MariaDB
- SQL Server
- SQLite
- Oracle

### Bases de datos NoSQL

- MongoDB
- DynamoDB
- Firebase/Firestore
- Cassandra

### Servicios y APIs

- REST APIs existentes
- GraphQL APIs
- gRPC
- SOAP/XML
- Servicios OData

### Archivos

- CSV
- Excel
- JSON
- XML

## Configuración de fuentes de datos

Las fuentes de datos se definen en el archivo `datasources.yaml` o en la sección `datasources` de tu archivo `nexusdata.config.js`.

### Ejemplos de configuración

#### PostgreSQL

```yaml
datasources:
  postgres:
    type: postgresql
    url: postgres://usuario:contraseña@localhost:5432/mi_db
    schema: public
    ssl: false
    poolConfig:
      min: 2
      max: 10
```

#### MySQL

```yaml
datasources:
  mysql:
    type: mysql
    host: localhost
    port: 3306
    user: root
    password: ${env.MYSQL_PASSWORD}
    database: mi_db
    charset: utf8mb4
```

#### MongoDB

```yaml
datasources:
  mongo:
    type: mongodb
    url: mongodb://usuario:contraseña@localhost:27017/mi_db
    options:
      useNewUrlParser: true
      useUnifiedTopology: true
```

#### API REST externa

```yaml
datasources:
  external_api:
    type: rest
    baseUrl: https://api.ejemplo.com/v1
    headers:
      Authorization: Bearer ${env.API_TOKEN}
      Content-Type: application/json
    timeout: 5000
    mapping:
      users: /users
      posts: /posts
```

## Variables de entorno

Para mantener seguras tus credenciales, puedes usar variables de entorno:

```yaml
datasources:
  postgres:
    type: postgresql
    url: ${env.DATABASE_URL}
    schema: public
```

Luego, crea un archivo `.env` en la raíz de tu proyecto:

```
DATABASE_URL=postgres://usuario:contraseña@localhost:5432/mi_db
API_TOKEN=tu_token_secreto
```

## Múltiples fuentes de datos

Puedes configurar varias fuentes de datos en un solo proyecto:

```yaml
datasources:
  users_db:
    type: postgresql
    url: postgres://usuario:contraseña@localhost:5432/usuarios
    
  products_db:
    type: mysql
    host: db.ejemplo.com
    port: 3306
    user: root
    password: ${env.PRODUCTS_DB_PASSWORD}
    database: productos
    
  analytics:
    type: mongodb
    url: mongodb://usuario:contraseña@localhost:27017/analytics
```

## Conexión a modelos

Puedes especificar qué fuente de datos usar para cada modelo:

```yaml
models:
  User:
    datasource: users_db
    fields:
      id: uuid
      name: string
      email: string
      
  Product:
    datasource: products_db
    fields:
      id: integer
      name: string
      price: decimal
      
  UserAnalytics:
    datasource: analytics
    fields:
      userId: string
      lastLogin: datetime
      activityScore: integer
```

## Replicación y sincronización

NexusData permite configurar replicación entre fuentes de datos:

```yaml
replication:
  users_to_analytics:
    source:
      datasource: users_db
      model: User
    target:
      datasource: analytics
      model: UserProfile
    triggers:
      - create
      - update
    mapping:
      id: userId
      name: userName
      email: userEmail
    schedule: every 30 minutes
```

## Conexiones en tiempo de ejecución

También puedes conectar fuentes de datos dinámicamente:

```javascript
// src/datasources/dynamicConnection.js
export default async function connectDynamicDatabase(config) {
  return {
    type: 'postgresql',
    url: `postgres://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`
  };
}
```

```yaml
datasources:
  dynamic:
    type: function
    handler: src/datasources/dynamicConnection.js
    config:
      host: ${env.DYNAMIC_DB_HOST}
      port: ${env.DYNAMIC_DB_PORT}
      username: ${env.DYNAMIC_DB_USER}
      password: ${env.DYNAMIC_DB_PASSWORD}
      database: ${env.DYNAMIC_DB_NAME}
```

## Monitoreo de conexiones

NexusData proporciona métricas de salud de las conexiones:

```bash
nexusdata datasource:status
```

Resultado:

```
Datasource: postgres
Status: Connected
Connection Pool: 2/10 (active/max)
Ping: 5ms

Datasource: mysql
Status: Connected
Connection Pool: 1/5 (active/max)
Ping: 8ms

Datasource: mongo
Status: Connected
Ping: 12ms
```

## Transacciones entre fuentes de datos

NexusData admite transacciones distribuidas:

```javascript
// src/business-logic/transferFunds.js
export default async function transferFunds(from, to, amount, context) {
  const { transaction } = context;
  
  // Inicia una transacción distribuida
  return transaction.withTransaction(async (tx) => {
    // Operación en la fuente de datos 'accounts'
    await tx.accounts.Account.update({
      where: { id: from },
      data: { balance: { decrement: amount } }
    });
    
    // Operación en la fuente de datos 'analytics'
    await tx.analytics.Transaction.create({
      data: {
        fromAccount: from,
        toAccount: to,
        amount: amount,
        timestamp: new Date()
      }
    });
    
    // Operación en la fuente de datos 'accounts'
    await tx.accounts.Account.update({
      where: { id: to },
      data: { balance: { increment: amount } }
    });
  });
}
```

## Migración entre fuentes de datos

NexusData facilita la migración de datos:

```bash
# Migrar esquema
nexusdata migrate --from=postgres --to=mysql

# Migrar datos
nexusdata data:transfer --from=postgres --to=mysql --models=User,Post
```

## Próximos pasos

- Aprende a [definir modelos](/docs/data-modeling) para tus fuentes de datos
- Explora cómo [implementar la lógica de negocio](/docs/business-logic) entre múltiples fuentes
- Configura [políticas de caché](/docs/performance) para optimizar el acceso a datos 