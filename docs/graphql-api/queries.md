---
sidebar_position: 1
---

# Consultas

Las consultas GraphQL te permiten solicitar exactamente los datos que necesitas de tu API NexusData. A diferencia de las API REST tradicionales, GraphQL te da la flexibilidad de especificar la estructura exacta de la respuesta.

## Estructura Básica de Consultas

Una consulta GraphQL básica tiene la siguiente estructura:

```graphql
query {
  modelName(where: { field: value }) {
    field1
    field2
    relation {
      field1
      field2
    }
  }
};
```
## Consultas Generadas Automáticamente
NexusData genera automáticamente las siguientes consultas para cada modelo:

### Consulta Individual (findUnique)
Recupera un único registro por su ID o campo único:

```graphql
query {
  user(where: { id: "123" }) {
    id
    email
    firstName
    lastName
  }
}
```
También puedes consultar por cualquier campo único:

```graphql
query {
  user(where: { email: "usuario@ejemplo.com" }) {
    id
    email
    profile {
      bio
      avatarUrl
    }
  }
}
```
### Consulta de Múltiples Registros (findMany)
Recupera múltiples registros con filtros, ordenamiento y paginación:

```graphql
query {
  users(
    where: { role: "ADMIN" }
    orderBy: { createdAt: DESC }
    skip: 0
    take: 10
  ) {
    id
    email
    firstName
    lastName
    createdAt
  }
}
```

### Consulta de Primer Registro (findFirst)
Recupera el primer registro que coincida con los criterios:

```graphql
query {
  firstActiveUser: user(
    where: { isActive: true }
    orderBy: { createdAt: ASC }
  ) {
    id
    email
    lastLogin
  }
}
```

### Consulta de Agregación (aggregate)
Realiza operaciones de agregación en tus datos:

```graphql
query {
  aggregateProducts(where: { category: "Electronics" }) {
    count
    price {
      avg
      min
      max
      sum
    }
  }
}
```

### Consulta de Conteo (count)
Cuenta registros que coinciden con ciertos criterios:

```graphql
query {
  userCount(where: { role: "USER", isActive: true })
}
```

## Filtros Avanzados
NexusData soporta una amplia variedad de operadores de filtrado:

### Operadores de Comparación
```graphql
query {
  products(
    where: {
      AND: [
        { price: { gt: 100 } },
        { price: { lt: 500 } },
        { stock: { gte: 10 } },
        { name: { contains: "Phone" } }
      ]
    }
  ) {
    id
    name
    price
  }
}
```

### Operadores Lógicos
```graphql
query {
  articles(
    where: {
      OR: [
        { category: "Technology" },
        { category: "Science" }
      ],
      AND: [
        { publishedAt: { not: null } },
        { publishedAt: { lt: "2023-01-01T00:00:00Z" } }
      ]
    }
  ) {
    id
    title
    publishedAt
  }
}
```

### Filtros en Relaciones
```graphql
query {
  posts(
    where: {
      author: {
        is: {
          role: "EDITOR"
        }
      },
      comments: {
        some: {
          content: {
            contains: "great"
          }
        }
      }
    }
  ) {
    id
    title
    author {
      name
      role
    }
    commentCount
  }
}
```

## Selección de Campos
GraphQL te permite seleccionar exactamente los campos que necesitas:

```graphql
query {
  products(where: { category: "Electronics" }) {
    id
    name
    price
    # Solo incluir la descripción para productos específicos
    ... on SmartphoneProduct {
      description
      specifications {
        cpu
        memory
        storage
      }
    }
    # Incluir información del fabricante
    manufacturer {
      name
      country
    }
  }
}
```

## Paginación
NexusData soporta múltiples estrategias de paginación:

### Paginación Offset
```graphql
query {
  products(
    skip: 20,
    take: 10,
    orderBy: { createdAt: DESC }
  ) {
    id
    name
    price
  }
}
```

### Paginación por Cursor
```graphql
query {
  products(
    first: 10,
    after: "cursor_value",
    orderBy: { createdAt: DESC }
  ) {
    edges {
      node {
        id
        name
        price
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
 ```

 ## Consultas con Variables
Las variables GraphQL te permiten reutilizar consultas y pasar valores dinámicos:

```graphql
query GetUserById($id: ID!) {
  user(where: { id: $id }) {
    id
    email
    firstName
    lastName
  }
}
 ```

Variables:

```json
{
  "id": "123"
}
 ```

## Fragmentos
Los fragmentos te permiten reutilizar partes de tus consultas:

```graphql
fragment UserBasicInfo on User {
  id
  email
  firstName
  lastName
}

fragment UserDetailedInfo on User {
  ...UserBasicInfo
  role
  createdAt
  lastLogin
  profile {
    bio
    avatarUrl
  }
}

query {
  activeUsers: users(where: { isActive: true }) {
    ...UserBasicInfo
  }
  
  adminUsers: users(where: { role: "ADMIN" }) {
    ...UserDetailedInfo
  }
}
```

## Alias
Los alias te permiten renombrar campos y consultar el mismo tipo múltiples veces:

```graphql
query {
  activeUsers: users(where: { isActive: true }) {
    id
    email
  }
  
  inactiveUsers: users(where: { isActive: false }) {
    id
    email
  }
  
  adminUser: user(where: { id: "123" }) {
    id
    email
  }
}
```

## Directivas
Las directivas te permiten incluir o excluir campos condicionalmente:

```graphql
query GetUser($id: ID!, $includeDetails: Boolean!) {
  user(where: { id: $id }) {
    id
    email
    firstName
    lastName
    # Solo incluir estos campos si includeDetails es true
    role @include(if: $includeDetails)
    createdAt @include(if: $includeDetails)
    profile @include(if: $includeDetails) {
      bio
      avatarUrl
    }
  }
}
 ```


Variables:
```json
{
  "id": "123",
  "includeDetails": true
}
 ```

## Consultas Personalizadas
Además de las consultas generadas automáticamente, puedes definir consultas personalizadas:

```javascript
// src/resolvers/analytics/topProducts.js
module.exports = {
  name: 'topProducts',
  type: '[Product]',
  args: {
    category: 'String',
    period: { type: 'String', default: '30days' }
  },
  resolve: async (parent, args, context) => {
    const { category, period } = args;
    const { models } = context;
    
    // Lógica personalizada para calcular productos más vendidos
    // ...
    
    return topProducts;
  }
};
```

Uso:

```graphql
query {
  topProducts(category: "Electronics", period: "90days") {
    id
    name
    price
    salesCount
  }
}
 ```


## Próximos Pasos
- Aprende sobre mutaciones GraphQL para modificar datos
- Explora suscripciones GraphQL para datos en tiempo real
- Implementa lógica de negocio personalizada en tus resolvers