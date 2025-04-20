---
sidebar_position: 3
title: Acciones Personalizadas
description: Implementación de acciones personalizadas para modelos en NexusData
---

# Acciones Personalizadas

Las acciones personalizadas te permiten definir operaciones específicas para tus modelos, extendiendo la funcionalidad básica CRUD con lógica de negocio personalizada.

## ¿Qué son las acciones?

Las acciones son métodos personalizados que puedes definir en tus modelos para realizar operaciones específicas sobre ellos. A diferencia de los servicios, que pueden abarcar múltiples modelos, las acciones están vinculadas a un modelo específico y generalmente operan sobre una instancia concreta de ese modelo.

## Definición de acciones

Las acciones se definen en la configuración del modelo:

```javascript
// src/models/Product.js
import { Model } from '@nexusdata/core';

class Product extends Model {
  static config = {
    actions: {
      // Acción para ajustar el stock de un producto
      adjustStock: {
        input: {
          quantity: 'Int!', // La cantidad a ajustar (positivo para añadir, negativo para restar)
          reason: 'String!'  // Razón del ajuste
        },
        output: 'Product!', // Tipo de retorno
        resolver: async (product, { quantity, reason }, context) => {
          const newStock = product.stock + quantity;
          
          if (newStock < 0) {
            throw new Error('El stock no puede ser negativo');
          }
          
          // Registrar el ajuste
          await context.db.create('StockAdjustment', {
            productId: product.id,
            quantity,
            reason,
            previousStock: product.stock,
            newStock,
            userId: context.user?.id,
            createdAt: new Date()
          });
          
          // Actualizar el stock
          const updatedProduct = await context.db.update('Product', {
            id: product.id,
            stock: newStock
          });
          
          // Emitir evento
          context.events.emit('product.stock.adjusted', {
            product: updatedProduct,
            adjustment: {
              quantity,
              reason,
              previousStock: product.stock,
              newStock
            }
          });
          
          return updatedProduct;
        }
      },
      
      // Acción para marcar un producto como destacado
      markAsFeatured: {
        input: {
          featured: 'Boolean!', // true para destacar, false para quitar destacado
          position: 'Int'       // posición en la lista de destacados (opcional)
        },
        output: 'Product!',
        resolver: async (product, { featured, position }, context) => {
          if (!context.user.hasPermission('product.feature')) {
            throw new Error('No tienes permiso para destacar productos');
          }
          
          return context.db.update('Product', {
            id: product.id,
            featured,
            featuredPosition: featured ? (position || null) : null,
            featuredAt: featured ? new Date() : null,
            featuredBy: featured ? context.user.id : null
          });
        }
      }
    }
  };
}

export default Product;
```

## Estructura de una acción

Cada acción tiene la siguiente estructura:

```javascript
actionName: {
  input: {
    // Definición de los parámetros de entrada
    param1: 'Type1',
    param2: 'Type2',
    // ...
  },
  output: 'OutputType', // Tipo de retorno
  resolver: async (instance, inputs, context) => {
    // Implementación de la acción
    // ...
    return result;
  }
}
```

Donde:

- **actionName**: Es el nombre de la acción.
- **input**: Define los parámetros que acepta la acción.
- **output**: Define el tipo de retorno de la acción.
- **resolver**: Es la función que implementa la lógica de la acción.
  - **instance**: Es la instancia del modelo sobre la que se ejecuta la acción.
  - **inputs**: Son los parámetros de entrada proporcionados.
  - **context**: Es el contexto de la solicitud, que incluye información como el usuario actual, la base de datos, etc.

## Exposición de acciones en GraphQL

Las acciones se exponen automáticamente en GraphQL como mutaciones:

```graphql
type Mutation {
  # Otras mutaciones...
  
  # Acción para ajustar el stock de un producto
  productAdjustStock(id: ID!, input: ProductAdjustStockInput!): Product!
  
  # Acción para marcar un producto como destacado
  productMarkAsFeatured(id: ID!, input: ProductMarkAsFeaturedInput!): Product!
}

input ProductAdjustStockInput {
  quantity: Int!
  reason: String!
}

input ProductMarkAsFeaturedInput {
  featured: Boolean!
  position: Int
}
```

## Exposición de acciones en REST API

Las acciones también se exponen automáticamente en la API REST:

```
POST /api/products/:id/adjustStock
{
  "quantity": 10,
  "reason": "Reposición de inventario"
}

POST /api/products/:id/markAsFeatured
{
  "featured": true,
  "position": 1
}
```

## Ejemplos de acciones comunes

### Acción para aprobar un comentario

```javascript
// src/models/Comment.js
import { Model } from '@nexusdata/core';

class Comment extends Model {
  static config = {
    actions: {
      approve: {
        input: {
          sendNotification: 'Boolean' // Opcional, por defecto true
        },
        output: 'Comment!',
        resolver: async (comment, { sendNotification = true }, context) => {
          if (!context.user.hasPermission('comment.approve')) {
            throw new Error('No tienes permiso para aprobar comentarios');
          }
          
          if (comment.status === 'approved') {
            return comment; // Ya está aprobado
          }
          
          const updatedComment = await context.db.update('Comment', {
            id: comment.id,
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: context.user.id
          });
          
          // Notificar al autor si se solicita
          if (sendNotification && comment.authorId) {
            await context.db.create('Notification', {
              userId: comment.authorId,
              type: 'comment_approved',
              title: 'Comentario aprobado',
              message: 'Tu comentario ha sido aprobado y ya es visible.',
              data: {
                commentId: comment.id,
                contentId: comment.contentId,
                contentType: comment.contentType
              }
            });
          }
          
          return updatedComment;
        }
      },
      
      reject: {
        input: {
          reason: 'String',
          sendNotification: 'Boolean' // Opcional, por defecto true
        },
        output: 'Comment!',
        resolver: async (comment, { reason, sendNotification = true }, context) => {
          if (!context.user.hasPermission('comment.reject')) {
            throw new Error('No tienes permiso para rechazar comentarios');
          }
          
          if (comment.status === 'rejected') {
            return comment; // Ya está rechazado
          }
          
          const updatedComment = await context.db.update('Comment', {
            id: comment.id,
            status: 'rejected',
            rejectedAt: new Date(),
            rejectedBy: context.user.id,
            rejectionReason: reason || null
          });
          
          // Notificar al autor si se solicita
          if (sendNotification && comment.authorId) {
            await context.db.create('Notification', {
              userId: comment.authorId,
              type: 'comment_rejected',
              title: 'Comentario rechazado',
              message: reason 
                ? `Tu comentario ha sido rechazado: ${reason}`
                : 'Tu comentario ha sido rechazado.',
              data: {
                commentId: comment.id,
                contentId: comment.contentId,
                contentType: comment.contentType
              }
            });
          }
          
          return updatedComment;
        }
      }
    }
  };
}

export default Comment;
```

### Acción para procesar un pedido

```javascript
// src/models/Order.js
import { Model } from '@nexusdata/core';

class Order extends Model {
  static config = {
    actions: {
      process: {
        input: {
          trackingNumber: 'String',
          carrier: 'String',
          notes: 'String'
        },
        output: 'Order!',
        resolver: async (order, { trackingNumber, carrier, notes }, context) => {
          if (!context.user.hasPermission('order.process')) {
            throw new Error('No tienes permiso para procesar pedidos');
          }
          
          if (order.status !== 'paid') {
            throw new Error(`No se puede procesar un pedido en estado ${order.status}`);
          }
          
          // Actualizar el pedido
          const updatedOrder = await context.db.update('Order', {
            id: order.id,
            status: 'processing',
            processingStartedAt: new Date(),
            processingNotes: notes || null,
            processedBy: context.user.id
          });
          
          // Crear envío si se proporciona información de seguimiento
          if (trackingNumber && carrier) {
            await context.db.create('Shipment', {
              orderId: order.id,
              trackingNumber,
              carrier,
              status: 'pending',
              createdAt: new Date(),
              createdBy: context.user.id
            });
            
            // Notificar al cliente
            await context.db.create('Notification', {
              userId: order.userId,
              type: 'order_processing',
              title: 'Pedido en proceso',
              message: `Tu pedido #${order.id} está siendo procesado.`,
              data: { orderId: order.id }
            });
          }
          
          return updatedOrder;
        }
      },
      
      markAsShipped: {
        input: {
          trackingNumber: 'String!',
          carrier: 'String!',
          estimatedDelivery: 'DateTime'
        },
        output: 'Order!',
        resolver: async (order, { trackingNumber, carrier, estimatedDelivery }, context) => {
          if (!context.user.hasPermission('order.ship')) {
            throw new Error('No tienes permiso para marcar pedidos como enviados');
          }
          
          if (!['paid', 'processing'].includes(order.status)) {
            throw new Error(`No se puede enviar un pedido en estado ${order.status}`);
          }
          
          // Buscar o crear envío
          let shipment = await context.db.findOne('Shipment', { orderId: order.id });
          
          if (shipment) {
            // Actualizar envío existente
            shipment = await context.db.update('Shipment', {
              id: shipment.id,
              trackingNumber,
              carrier,
              status: 'shipped',
              shippedAt: new Date(),
              estimatedDelivery: estimatedDelivery || null
            });
          } else {
            // Crear nuevo envío
            shipment = await context.db.create('Shipment', {
              orderId: order.id,
              trackingNumber,
              carrier,
              status: 'shipped',
              createdAt: new Date(),
              shippedAt: new Date(),
              createdBy: context.user.id,
              estimatedDelivery: estimatedDelivery || null
            });
          }
          
          // Actualizar pedido
          const updatedOrder = await context.db.update('Order', {
            id: order.id,
            status: 'shipped',
            shippedAt: new Date(),
            shippedBy: context.user.id
          });
          
          // Notificar al cliente
          await context.db.create('Notification', {
            userId: order.userId,
            type: 'order_shipped',
            title: 'Pedido enviado',
            message: `Tu pedido #${order.id} ha sido enviado. Puedes seguirlo con el número ${trackingNumber} a través de ${carrier}.`,
            data: { 
              orderId: order.id,
              trackingNumber,
              carrier,
              estimatedDelivery
            }
          });
          
          // Enviar correo de confirmación
          await context.services.EmailService.sendShippingConfirmation(order.id, shipment);
          
          return updatedOrder;
        }
      }
    }
  };
}

export default Order;
```

## Acciones a nivel de colección

Además de las acciones que operan sobre instancias específicas, también puedes definir acciones a nivel de colección que operan sobre el modelo en general:

```javascript
// src/models/Product.js
import { Model } from '@nexusdata/core';

class Product extends Model {
  static config = {
    collectionActions: {
      importFromCsv: {
        input: {
          fileUrl: 'String!',
          updateExisting: 'Boolean',
          notifyOnCompletion: 'Boolean'
        },
        output: 'ImportResult!',
        resolver: async (_, { fileUrl, updateExisting = true, notifyOnCompletion = true }, context) => {
          if (!context.user.hasPermission('product.import')) {
            throw new Error('No tienes permiso para importar productos');
          }
          
          // Crear tarea de importación
          const importTask = await context.db.create('ImportTask', {
            type: 'product',
            fileUrl,
            status: 'pending',
            options: {
              updateExisting,
              notifyOnCompletion
            },
            createdBy: context.user.id,
            createdAt: new Date()
          });
          
          // Iniciar proceso de importación en segundo plano
          context.services.ImportService.processImport(importTask.id);
          
          return {
            success: true,
            message: 'Importación iniciada',
            taskId: importTask.id
          };
        }
      },
      
      recalculatePrices: {
        input: {
          category: 'String',
          adjustmentPercentage: 'Float!',
          applyToDiscounted: 'Boolean'
        },
        output: 'BatchUpdateResult!',
        resolver: async (_, { category, adjustmentPercentage, applyToDiscounted = false }, context) => {
          if (!context.user.hasPermission('product.updatePrices')) {
            throw new Error('No tienes permiso para actualizar precios');
          }
          
          // Construir condición de filtrado
          const where = {};
          
          if (category) {
            where.category = category;
          }
          
          if (!applyToDiscounted) {
            where.discountedPrice = null;
          }
          
          // Actualizar precios
          const factor = 1 + (adjustmentPercentage / 100);
          
          const result = await context.db.updateMany('Product', {
            where,
            data: {
              price: { multiply: factor }
            }
          });
          
          // Registrar la operación
          await context.db.create('PriceAdjustmentLog', {
            category: category || 'all',
            adjustmentPercentage,
            applyToDiscounted,
            affectedProducts: result.count,
            performedBy: context.user.id,
            performedAt: new Date()
          });
          
          return {
            success: true,
            count: result.count,
            message: `Se actualizaron ${result.count} productos con un ajuste del ${adjustmentPercentage}%`
          };
        }
      }
    }
  };
}

export default Product;
```

Estas acciones se exponen en GraphQL como:

```graphql
type Mutation {
  # Otras mutaciones...
  
  # Acción para importar productos desde CSV
  productImportFromCsv(input: ProductImportFromCsvInput!): ImportResult!
  
  # Acción para recalcular precios
  productRecalculatePrices(input: ProductRecalculatePricesInput!): BatchUpdateResult!
}

input ProductImportFromCsvInput {
  fileUrl: String!
  updateExisting: Boolean
  notifyOnCompletion: Boolean
}

input ProductRecalculatePricesInput {
  category: String
  adjustmentPercentage: Float!
  applyToDiscounted: Boolean
}

type ImportResult {
  success: Boolean!
  message: String
  taskId: ID
}

type BatchUpdateResult {
  success: Boolean!
  count: Int!
  message: String
}
```

Y en REST API como:

```
POST /api/products/importFromCsv
{
  "fileUrl": "https://example.com/products.csv",
  "updateExisting": true,
  "notifyOnCompletion": true
}

POST /api/products/recalculatePrices
{
  "category": "electronics",
  "adjustmentPercentage": 5.5,
  "applyToDiscounted": false
}
```

## Mejores prácticas

1. **Nombres descriptivos**: Usa nombres de acciones que describan claramente lo que hacen.
2. **Validación de permisos**: Siempre verifica que el usuario tiene los permisos necesarios para ejecutar la acción.
3. **Validación de estado**: Verifica que el modelo está en un estado válido para la acción.
4. **Transacciones**: Usa transacciones cuando la acción modifica múltiples registros.
5. **Notificaciones**: Considera enviar notificaciones cuando sea apropiado.
6. **Auditoría**: Registra quién realizó la acción y cuándo.
7. **Idempotencia**: Cuando sea posible, diseña acciones que sean idempotentes (pueden ejecutarse múltiples veces sin efectos secundarios).
8. **Documentación**: Documenta claramente qué hace cada acción, qué parámetros acepta y qué devuelve.
```