---
sidebar_position: 2
---

# Mutaciones

Las mutaciones GraphQL te permiten modificar datos en tu API NexusData. A diferencia de las consultas que solo recuperan datos, las mutaciones están diseñadas para crear, actualizar o eliminar información.

## Estructura Básica de Mutaciones

Una mutación GraphQL básica tiene la siguiente estructura:

```graphql
mutation {
  actionName(input: { field: value }) {
    field1
    field2
    relation {
      field1
      field2
    }
  }
}
```
## Mutaciones Generadas Automáticamente
NexusData genera automáticamente las siguientes mutaciones para cada modelo:

### Crear Registro (create)
Crea un nuevo registro:

```graphql
mutation {
  createUser(data: {
    email: "nuevo@ejemplo.com",
    firstName: "Nuevo",
    lastName: "Usuario",
    role: USER
  }) {
    id
    email
    createdAt
  }
}
```

### Crear Múltiples Registros (createMany)
Crea múltiples registros en una sola operación:

```graphql
mutation {
  createManyProducts(data: [
    { name: "Producto 1", price: 99.99, categoryId: "cat1" },
    { name: "Producto 2", price: 149.99, categoryId: "cat1" },
    { name: "Producto 3", price: 199.99, categoryId: "cat2" }
  ]) {
    count
  }
}
 ```


### Actualizar Registro (update)
Actualiza un registro existente:

```graphql
mutation {
  updateUser(
    where: { id: "123" },
    data: {
      firstName: "Nombre Actualizado",
      lastName: "Apellido Actualizado",
      profile: {
        update: {
          bio: "Nueva biografía"
        }
      }
    }
  ) {
    id
    firstName
    lastName
    profile {
      bio
    }
    updatedAt
  }
}
 ```

### Actualizar Múltiples Registros (updateMany)
Actualiza múltiples registros que coincidan con ciertos criterios:

```graphql
mutation {
  updateManyProducts(
    where: { category: "Electronics", price: { lt: 100 } },
    data: { onSale: true, discountPercentage: 10 }
  ) {
    count
  }
}
```

### Upsert (upsert)
Crea un registro si no existe, o lo actualiza si existe:

```graphql
mutation {
  upsertProduct(
    where: { sku: "ABC123" },
    create: {
      name: "Nuevo Producto",
      sku: "ABC123",
      price: 129.99,
      categoryId: "cat1"
    },
    update: {
      price: 129.99,
      stock: { increment: 10 }
    }
  ) {
    id
    name
    price
    stock
  }
}
 ```

### Eliminar Registro (delete)
Elimina un registro existente:

```graphql
mutation {
  deleteUser(where: { id: "123" }) {
    id
    email
  }
}
 ```

### Eliminar Múltiples Registros (deleteMany)
Elimina múltiples registros que coincidan con ciertos criterios:

```graphql
mutation {
  deleteManyCarts(where: { 
    updatedAt: { lt: "2023-01-01T00:00:00Z" },
    items: { none: {} }
  }) {
    count
  }
}
```

## Operaciones Anidadas
NexusData permite realizar operaciones anidadas en relaciones:

### Crear con Relaciones
```graphql
mutation {
  createPost(data: {
    title: "Nuevo Artículo",
    content: "Contenido del artículo...",
    published: true,
    author: {
      connect: { id: "author123" }
    },
    categories: {
      connect: [{ id: "cat1" }, { id: "cat2" }]
    },
    tags: {
      create: [
        { name: "GraphQL" },
        { name: "Tutorial" }
      ]
    },
    comments: {
      createMany: {
        data: [
          { content: "¡Gran artículo!", userId: "user1" },
          { content: "Muy informativo", userId: "user2" }
        ]
      }
    }
  }) {
    id
    title
    author {
      name
    }
    categories {
      name
    }
    tags {
      name
    }
    comments {
      content
      user {
        name
      }
    }
  }
}
 ```


### Actualizar con Relaciones
```graphql
mutation {
  updatePost(
    where: { id: "post123" },
    data: {
      title: "Título Actualizado",
      categories: {
        disconnect: [{ id: "cat3" }],
        connect: [{ id: "cat4" }]
      },
      tags: {
        deleteMany: { name: { contains: "obsoleto" } },
        create: [{ name: "Actualizado" }]
      },
      comments: {
        updateMany: {
          where: { approved: false },
          data: { approved: true }
        }
      }
    }
  ) {
    id
    title
    categories {
      name
    }
    tags {
      name
    }
    comments {
      content
      approved
    }
  }
}
```

## Operadores de Actualización
NexusData proporciona operadores especiales para actualizaciones:

```graphql
mutation {
  updateProduct(
    where: { id: "prod123" },
    data: {
      price: { increment: 10.5 },  // Incrementar valor
      stock: { decrement: 5 },     // Decrementar valor
      views: { multiply: 2 },      // Multiplicar valor
      rating: { divide: 1.1 },     // Dividir valor
      tags: { push: "nuevo-tag" }, // Añadir a array
      description: { set: "Nueva descripción" } // Establecer valor
    }
  ) {
    id
    price
    stock
    views
    rating
    tags
    description
  }
}
 ```


## Mutaciones con Variables
Las variables GraphQL te permiten reutilizar mutaciones y pasar valores dinámicos:

```graphql
mutation CreateUser($data: UserCreateInput!) {
  createUser(data: $data) {
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
  "data": {
    "email": "usuario@ejemplo.com",
    "firstName": "Nombre",
    "lastName": "Apellido",
    "role": "USER"
  }
}
```

## Mutaciones en Lote
Para operaciones complejas, puedes combinar múltiples mutaciones en una sola solicitud:

```graphql
mutation {
  # Crear un nuevo usuario
  newUser: createUser(data: {
    email: "nuevo@ejemplo.com",
    firstName: "Nuevo",
    lastName: "Usuario"
  }) {
    id
  }
  
  # Actualizar un usuario existente
  updatedUser: updateUser(
    where: { id: "user123" },
    data: { role: ADMIN }
  ) {
    id
    role
  }
  
  # Eliminar un usuario
  deletedUser: deleteUser(where: { id: "user456" }) {
    id
  }
}
 ```


## Manejo de Errores
NexusData proporciona información detallada sobre errores en mutaciones:

```graphql
mutation {
  createUser(data: {
    email: "usuario@ejemplo.com",
    firstName: "Nombre"
    # Error: lastName es requerido pero falta
  }) {
    id
    email
  }
}
 ```

Respuesta de error:

```json
{
  "errors": [
    {
      "message": "Field 'lastName' of required type 'String!' was not provided.",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": ["createUser"],
      "extensions": {
        "code": "BAD_USER_INPUT",
        "field": "lastName",
        "model": "User"
      }
    }
  ],
  "data": null
}
 ```


## Mutaciones Personalizadas
Además de las mutaciones generadas automáticamente, puedes definir mutaciones personalizadas:

```javascript
// src/resolvers/orders/processPayment.js
module.exports = {
  name: 'processPayment',
  type: 'PaymentResult',
  args: {
    orderId: 'ID!',
    paymentMethod: 'PaymentMethodInput!'
  },
  resolve: async (parent, args, context) => {
    const { orderId, paymentMethod } = args;
    const { models, services } = context;
    
    // Obtener la orden
    const order = await models.Order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    // Procesar el pago
    const paymentResult = await services.payments.processPayment({
      amount: order.totalAmount,
      method: paymentMethod,
      orderId: order.id
    });
    
    // Actualizar el estado de la orden
    await models.Order.update({
      where: { id: orderId },
      data: {
        status: paymentResult.success ? 'PAID' : 'PAYMENT_FAILED',
        paymentId: paymentResult.paymentId
      }
    });
    
    return paymentResult;
  }
};
```

Uso:

```graphql
mutation {
  processPayment(
    orderId: "order123",
    paymentMethod: {
      type: CREDIT_CARD,
      cardNumber: "4242424242424242",
      expiryMonth: 12,
      expiryYear: 2025,
      cvc: "123"
    }
  ) {
    success
    paymentId
    message
  }
}
 ```

## Transacciones
NexusData maneja automáticamente transacciones para garantizar la integridad de los datos:

```javascript
// src/resolvers/inventory/transferStock.js
module.exports = {
  name: 'transferStock',
  type: 'TransferResult',
  args: {
    fromWarehouseId: 'ID!',
    toWarehouseId: 'ID!',
    productId: 'ID!',
    quantity: 'Int!'
  },
  resolve: async (parent, args, context) => {
    const { fromWarehouseId, toWarehouseId, productId, quantity } = args;
    const { models, db } = context;
    
    // Usar transacción para garantizar atomicidad
    return await db.transaction(async (tx) => {
      // Verificar stock disponible
      const sourceStock = await tx.WarehouseStock.findUnique({
        where: {
          warehouseId_productId: {
            warehouseId: fromWarehouseId,
            productId
          }
        }
      });
      
      if (!sourceStock || sourceStock.quantity < quantity) {
        throw new Error('Stock insuficiente para transferir');
      }
      
      // Reducir stock en almacén origen
      await tx.WarehouseStock.update({
        where: {
          warehouseId_productId: {
            warehouseId: fromWarehouseId,
            productId
          }
        },
        data: {
          quantity: { decrement: quantity }
        }
      });
      
      // Aumentar stock en almacén destino
      await tx.WarehouseStock.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: toWarehouseId,
            productId
          }
        },
        create: {
          warehouseId: toWarehouseId,
          productId,
          quantity
        },
        update: {   
          quantity: { increment: quantity }
        }
      });
      
      // Registrar la transferencia
      const transfer = await tx.StockTransfer.create({
        data: {
          fromWarehouseId,
          toWarehouseId,
          productId,
          quantity,
          status: 'COMPLETED'
        }
      });
      
      return {
        success: true,
        transferId: transfer.id,
        message: `Transferencia de ${quantity} unidades completada`
      };
    });
  }
};
```

## Próximos Pasos
- Aprende sobre consultas GraphQL para recuperar datos
- Explora suscripciones GraphQL para datos en tiempo real
- Implementa lógica de negocio personalizada en tus resolvers