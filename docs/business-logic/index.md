---
sidebar_position: 7
---

# Procesos de Negocio

NexusData proporciona múltiples formas de implementar la lógica de negocio y los flujos de trabajo de tu aplicación.

## Hooks y Middleware

Los hooks te permiten ejecutar código antes o después de operaciones específicas en tus modelos.

### Hooks de modelo

```javascript
// src/models/Order.js
import { Model } from '@nexusdata/core';

class Order extends Model {
  static config = {
    hooks: {
      // Se ejecuta antes de crear un nuevo registro
      beforeCreate: async (data, context) => {
        if (!data.orderNumber) {
          data.orderNumber = await generateOrderNumber();
        }
        return data;
      },
      
      // Se ejecuta después de crear un nuevo registro
      afterCreate: async (record, context) => {
        await sendOrderConfirmation(record);
        return record;
      },
      
      // Se ejecuta antes de actualizar un registro
      beforeUpdate: async (data, record, context) => {
        if (data.status === 'completed' && record.status !== 'completed') {
          data.completedAt = new Date();
        }
        return data;
      },
      
      // Se ejecuta después de actualizar un registro
      afterUpdate: async (updatedRecord, originalRecord, context) => {
        if (updatedRecord.status !== originalRecord.status) {
          await notifyStatusChange(updatedRecord);
        }
        return updatedRecord;
      },
      
      // Se ejecuta antes de eliminar un registro
      beforeDelete: async (record, context) => {
        if (record.status === 'completed') {
          throw new Error('No se pueden eliminar órdenes completadas');
        }
        return true; // Debe devolver true para permitir la eliminación
      },
      
      // Se ejecuta después de eliminar un registro
      afterDelete: async (deletedRecord, context) => {
        await logOrderDeletion(deletedRecord);
      }
    }
  };
}

export default Order;
```

### Middleware global

```javascript
// src/middleware/auditLog.js
export default function auditLogMiddleware() {
  return {
    beforeCreate: async (data, context, { model }) => {
      console.log(`Creando ${model.name}:`, data);
      return data;
    },
    
    afterCreate: async (record, context, { model }) => {
      await createAuditRecord({
        action: 'CREATE',
        model: model.name,
        recordId: record.id,
        userId: context.user?.id,
        timestamp: new Date(),
        changes: record
      });
      return record;
    },
    
    beforeUpdate: async (data, record, context, { model }) => {
      console.log(`Actualizando ${model.name}:`, { id: record.id, changes: data });
      return data;
    },
    
    afterUpdate: async (updatedRecord, originalRecord, context, { model }) => {
      const changes = calculateChanges(updatedRecord, originalRecord);
      
      await createAuditRecord({
        action: 'UPDATE',
        model: model.name,
        recordId: updatedRecord.id,
        userId: context.user?.id,
        timestamp: new Date(),
        changes
      });
      
      return updatedRecord;
    },
    
    beforeDelete: async (record, context, { model }) => {
      console.log(`Eliminando ${model.name}:`, record.id);
      return true;
    },
    
    afterDelete: async (deletedRecord, context, { model }) => {
      await createAuditRecord({
        action: 'DELETE',
        model: model.name,
        recordId: deletedRecord.id,
        userId: context.user?.id,
        timestamp: new Date(),
        changes: deletedRecord
      });
    }
  };
}

// Registrar middleware globalmente
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  middleware: [
    'src/middleware/auditLog.js',
    // otros middleware
  ]
};
```

## Servicios

Los servicios te permiten encapsular lógica compleja y reutilizable.

```javascript
// src/services/OrderService.js
import { Service } from '@nexusdata/core';
import { Order, LineItem, Product, Notification } from '../models';
import { InsufficientStockError } from '../errors';

class OrderService extends Service {
  async createOrder(data, context) {
    // Iniciar transacción
    return this.db.transaction(async (tx) => {
      // Verificar stock disponible
      for (const item of data.items) {
        const product = await tx.findOne(Product, { id: item.productId });
        
        if (!product) {
          throw new Error(`Producto no encontrado: ${item.productId}`);
        }
        
        if (product.stock < item.quantity) {
          throw new InsufficientStockError(product.name, product.stock, item.quantity);
        }
      }
      
      // Calcular total
      let total = 0;
      const lineItems = [];
      
      for (const item of data.items) {
        const product = await tx.findOne(Product, { id: item.productId });
        const price = item.price || product.price;
        const subtotal = price * item.quantity;
        
        lineItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price,
          subtotal
        });
        
        total += subtotal;
        
        // Actualizar stock
        await tx.update(Product, {
          id: product.id,
          stock: product.stock - item.quantity
        });
      }
      
      // Crear orden
      const order = await tx.create(Order, {
        userId: context.user.id,
        status: 'pending',
        total,
        ...data,
      });
      
      // Crear líneas de orden
      for (const item of lineItems) {
        await tx.create(LineItem, {
          ...item,
          orderId: order.id
        });
      }
      
      // Enviar notificación
      await tx.create(Notification, {
        userId: context.user.id,
        type: 'order_created',
        title: 'Nuevo pedido',
        message: `Tu pedido #${order.id} ha sido creado exitosamente.`,
        data: { orderId: order.id }
      });
      
      return order;
    });
  }
  
  async processPayment(orderId, paymentData, context) {
    const order = await this.db.findOne(Order, { id: orderId });
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    if (order.status !== 'pending') {
      throw new Error(`No se puede procesar el pago para una orden en estado ${order.status}`);
    }
    
    // Procesar pago con un gateway externo
    const paymentResult = await this.paymentGateway.processPayment({
      amount: order.total,
      currency: 'EUR',
      description: `Pago de orden #${order.id}`,
      ...paymentData
    });
    
    if (paymentResult.success) {
      // Actualizar estado de la orden
      await this.db.update(Order, {
        id: order.id,
        status: 'paid',
        paymentId: paymentResult.id,
        paymentMethod: paymentData.method
      });
      
      // Notificar al usuario
      await this.db.create(Notification, {
        userId: order.userId,
        type: 'payment_successful',
        title: 'Pago procesado',
        message: `El pago para tu pedido #${order.id} ha sido procesado exitosamente.`,
        data: { orderId: order.id }
      });
      
      // Enviar correo de confirmación
      await this.emailService.sendOrderConfirmation(order.id);
      
      return { success: true, order: await this.db.findOne(Order, { id: order.id }) };
    } else {
      // Registrar error de pago
      await this.db.create(PaymentError, {
        orderId: order.id,
        code: paymentResult.error.code,
        message: paymentResult.error.message,
        data: paymentResult.error
      });
      
      return { success: false, error: paymentResult.error };
    }
  }
}

export default OrderService;
```

### Registro y uso de servicios

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  services: [
    'src/services/OrderService',
    'src/services/UserService',
    'src/services/NotificationService',
    'src/services/ReportingService'
  ]
};

// Uso en resolvers de GraphQL
const resolvers = {
  Mutation: {
    createOrder: async (_, { input }, context) => {
      const orderService = context.services.OrderService;
      return orderService.createOrder(input, context);
    },
    
    processPayment: async (_, { orderId, paymentData }, context) => {
      const orderService = context.services.OrderService;
      return orderService.processPayment(orderId, paymentData, context);
    }
  }
};
```

## Acciones personalizadas

Las acciones te permiten definir operaciones específicas de modelo.

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
            timestamp: new Date()
          });
          
          // Actualizar el producto
          return context.db.update('Product', {
            id: product.id,
            stock: newStock
          });
        }
      },
      
      // Acción para aplicar un descuento
      applyDiscount: {
        input: {
          percentage: 'Float!', // Porcentaje de descuento (entre 0 y 100)
          validUntil: 'DateTime' // Fecha opcional de expiración
        },
        output: 'Product!',
        resolver: async (product, { percentage, validUntil }, context) => {
          if (percentage < 0 || percentage > 100) {
            throw new Error('El porcentaje debe estar entre 0 y 100');
          }
          
          const originalPrice = product.originalPrice || product.price;
          const discountedPrice = originalPrice * (1 - percentage / 100);
          
          return context.db.update('Product', {
            id: product.id,
            price: discountedPrice,
            originalPrice: product.originalPrice || product.price,
            discountPercentage: percentage,
            discountValidUntil: validUntil
          });
        }
      }
    }
  };
}

export default Product;
```

### Uso de acciones en GraphQL

Las acciones se exponen automáticamente como mutaciones de GraphQL:

```graphql
mutation AdjustProductStock($id: ID!, $input: ProductAdjustStockInput!) {
  productAdjustStock(id: $id, input: $input) {
    id
    name
    stock
  }
}

mutation ApplyProductDiscount($id: ID!, $input: ProductApplyDiscountInput!) {
  productApplyDiscount(id: $id, input: $input) {
    id
    name
    price
    originalPrice
    discountPercentage
    discountValidUntil
  }
}
```

## Eventos y suscripciones

El sistema de eventos te permite implementar comunicación asíncrona entre componentes.

### Definición y emisión de eventos

```javascript
// src/events/orderEvents.js
import { defineEvents } from '@nexusdata/core';

export default defineEvents({
  'order.created': {
    description: 'Se dispara cuando se crea una nueva orden',
    payload: 'Order!'
  },
  'order.statusChanged': {
    description: 'Se dispara cuando cambia el estado de una orden',
    payload: {
      order: 'Order!',
      previousStatus: 'String!',
      newStatus: 'String!'
    }
  },
  'order.completed': {
    description: 'Se dispara cuando una orden se marca como completada',
    payload: 'Order!'
  }
});

// Emisión de eventos en un hook
// src/models/Order.js
import { Model } from '@nexusdata/core';

class Order extends Model {
  static config = {
    hooks: {
      afterCreate: async (record, context) => {
        // Emitir evento order.created
        await context.events.emit('order.created', record);
        return record;
      },
      
      afterUpdate: async (updatedRecord, originalRecord, context) => {
        // Si el estado cambió, emitir evento order.statusChanged
        if (updatedRecord.status !== originalRecord.status) {
          await context.events.emit('order.statusChanged', {
            order: updatedRecord,
            previousStatus: originalRecord.status,
            newStatus: updatedRecord.status
          });
          
          // Si se completó la orden, emitir evento order.completed
          if (updatedRecord.status === 'completed') {
            await context.events.emit('order.completed', updatedRecord);
          }
        }
        
        return updatedRecord;
      }
    }
  };
}

export default Order;
```

### Suscripción a eventos

```javascript
// src/subscribers/orderSubscribers.js
import { defineSubscribers } from '@nexusdata/core';

export default defineSubscribers({
  'order.created': async (order, context) => {
    // Enviar correo de confirmación
    await context.services.EmailService.sendTemplate('order_confirmation', {
      to: order.email,
      subject: `Confirmación de pedido #${order.id}`,
      data: {
        orderNumber: order.id,
        customer: order.customerName,
        total: formatCurrency(order.total)
      }
    });
    
    // Notificar al equipo de ventas
    await context.services.NotificationService.notifyTeam('sales', {
      title: 'Nueva orden recibida',
      message: `Orden #${order.id} por ${formatCurrency(order.total)}`,
      data: { orderId: order.id }
    });
  },
  
  'order.statusChanged': async ({ order, previousStatus, newStatus }, context) => {
    // Enviar notificación al cliente
    await context.services.EmailService.sendTemplate('order_status_changed', {
      to: order.email,
      subject: `Actualización de tu pedido #${order.id}`,
      data: {
        orderNumber: order.id,
        customer: order.customerName,
        previousStatus,
        newStatus,
        statusDescription: getStatusDescription(newStatus)
      }
    });
    
    // Registrar cambio de estado
    await context.db.create('OrderStatusHistory', {
      orderId: order.id,
      previousStatus,
      newStatus,
      timestamp: new Date(),
      userId: context.user?.id
    });
  },
  
  'order.completed': async (order, context) => {
    // Generar factura
    const invoice = await context.services.InvoiceService.generateInvoice(order.id);
    
    // Enviar factura por correo
    await context.services.EmailService.sendTemplate('order_invoice', {
      to: order.email,
      subject: `Factura para tu pedido #${order.id}`,
      data: {
        orderNumber: order.id,
        customer: order.customerName,
        invoiceNumber: invoice.number,
        invoiceUrl: invoice.downloadUrl
      },
      attachments: [
        {
          filename: `factura-${invoice.number}.pdf`,
          path: invoice.filePath
        }
      ]
    });
    
    // Actualizar estadísticas de ventas
    await context.services.ReportingService.updateSalesStats(order);
  }
});
```

### Registro de eventos y suscriptores

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  events: [
    'src/events/orderEvents',
    'src/events/userEvents',
    'src/events/productEvents'
  ],
  subscribers: [
    'src/subscribers/orderSubscribers',
    'src/subscribers/userSubscribers',
    'src/subscribers/notificationSubscribers'
  ]
};
```

## Tareas programadas

Las tareas programadas te permiten ejecutar código en intervalos específicos.

```javascript
// src/tasks/cleanupTask.js
import { defineTask } from '@nexusdata/core';

export default defineTask({
  name: 'cleanup',
  description: 'Elimina datos temporales y registros antiguos',
  schedule: '0 3 * * *', // Ejecutar a las 3 AM todos los días (formato cron)
  handler: async (context) => {
    const { db } = context;
    
    // Eliminar sesiones expiradas
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await db.delete('Session', {
      where: {
        lastActive: {
          lt: thirtyDaysAgo
        }
      }
    });
    
    console.log(`Eliminadas ${result.count} sesiones expiradas`);
    
    // Archivar notificaciones leídas antiguas
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const notificationsToArchive = await db.findMany('Notification', {
      where: {
        read: true,
        createdAt: {
          lt: sevenDaysAgo
        },
        archived: false
      }
    });
    
    for (const notification of notificationsToArchive) {
      await db.update('Notification', {
        id: notification.id,
        archived: true
      });
    }
    
    console.log(`Archivadas ${notificationsToArchive.length} notificaciones`);
    
    return {
      sessionsDeleted: result.count,
      notificationsArchived: notificationsToArchive.length
    };
  }
});

// src/tasks/reportingTask.js
import { defineTask } from '@nexusdata/core';

export default defineTask({
  name: 'dailyReporting',
  description: 'Genera informes diarios de ventas y actividad',
  schedule: '0 5 * * *', // Ejecutar a las 5 AM todos los días
  handler: async (context) => {
    const { db, services } = context;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Formatear fecha para consultas y nombres de archivo
    const dateStr = yesterday.toISOString().split('T')[0];
    
    // Generar informe de ventas
    const salesReport = await services.ReportingService.generateDailySalesReport(dateStr);
    
    // Enviar informe a administradores
    const admins = await db.findMany('User', {
      where: {
        role: 'ADMIN'
      }
    });
    
    for (const admin of admins) {
      await services.EmailService.sendTemplate('daily_report', {
        to: admin.email,
        subject: `Informe diario de ventas: ${dateStr}`,
        data: {
          date: dateStr,
          salesTotal: salesReport.total,
          orderCount: salesReport.orderCount,
          averageOrderValue: salesReport.averageOrderValue,
          topProducts: salesReport.topProducts
        },
        attachments: [
          {
            filename: `ventas-diarias-${dateStr}.pdf`,
            path: salesReport.pdfPath
          }
        ]
      });
    }
    
    return {
      date: dateStr,
      reportGenerated: true,
      recipientCount: admins.length
    };
  }
});
```

### Registro de tareas programadas

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  tasks: [
    'src/tasks/cleanupTask',
    'src/tasks/reportingTask',
    'src/tasks/backupTask',
    'src/tasks/inventoryCheckTask'
  ]
};
```

## Flujos de trabajo

Los flujos de trabajo te permiten definir procesos de negocio complejos con múltiples pasos.

```javascript
// src/workflows/orderFulfillment.js
import { defineWorkflow } from '@nexusdata/core';

export default defineWorkflow({
  name: 'orderFulfillment',
  description: 'Proceso de cumplimiento de pedidos desde la recepción hasta la entrega',
  
  // Definir los estados posibles del flujo
  states: {
    RECEIVED: {
      description: 'Pedido recibido y pago confirmado',
      initial: true
    },
    PROCESSING: {
      description: 'Pedido en procesamiento'
    },
    READY_FOR_SHIPPING: {
      description: 'Pedido listo para envío'
    },
    SHIPPED: {
      description: 'Pedido enviado'
    },
    DELIVERED: {
      description: 'Pedido entregado'
    },
    CANCELLED: {
      description: 'Pedido cancelado',
      terminal: true
    },
    COMPLETED: {
      description: 'Pedido completado satisfactoriamente',
      terminal: true
    }
  },
  
  // Definir las transiciones posibles entre estados
  transitions: {
    startProcessing: {
      from: 'RECEIVED',
      to: 'PROCESSING',
      action: async (context, order) => {
        // Verificar inventario
        const lineItems = await context.db.findMany('LineItem', {
          where: { orderId: order.id }
        });
        
        for (const item of lineItems) {
          const product = await context.db.findOne('Product', { id: item.productId });
          
          if (product.stock < item.quantity) {
            throw new Error(`Stock insuficiente para ${product.name}`);
          }
        }
        
        // Reservar inventario
        for (const item of lineItems) {
          await context.db.update('Product', {
            id: item.productId,
            reservedStock: { increment: item.quantity }
          });
        }
        
        // Asignar a un operador
        const availableOperators = await context.db.findMany('User', {
          where: {
            role: 'OPERATOR',
            status: 'ACTIVE'
          },
          orderBy: {
            assignedOrders: {
              _count: 'asc'
            }
          },
          take: 1
        });
        
        if (availableOperators.length > 0) {
          await context.db.create('OrderAssignment', {
            orderId: order.id,
            userId: availableOperators[0].id,
            assignedAt: new Date()
          });
        }
        
        // Notificar al equipo de operaciones
        await context.services.NotificationService.notifyTeam('operations', {
          title: 'Nuevo pedido para procesar',
          message: `El pedido #${order.id} está listo para ser procesado`,
          data: { orderId: order.id }
        });
        
        return {
          message: `Pedido #${order.id} en procesamiento`,
          assignedTo: availableOperators[0]?.id
        };
      }
    },
    
    markReadyForShipping: {
      from: 'PROCESSING',
      to: 'READY_FOR_SHIPPING',
      action: async (context, order) => {
        // Generar etiqueta de envío
        const shippingLabel = await context.services.ShippingService.generateLabel(order.id);
        
        // Actualizar orden con información de envío
        await context.db.update('Order', {
          id: order.id,
          shippingLabelUrl: shippingLabel.url,
          trackingNumber: shippingLabel.trackingNumber,
          shippingCarrier: shippingLabel.carrier
        });
        
        // Notificar al equipo de logística
        await context.services.NotificationService.notifyTeam('logistics', {
          title: 'Pedido listo para envío',
          message: `El pedido #${order.id} está listo para ser enviado`,
          data: { 
            orderId: order.id,
            trackingNumber: shippingLabel.trackingNumber
          }
        });
        
        return {
          message: `Pedido #${order.id} listo para envío`,
          trackingNumber: shippingLabel.trackingNumber
        };
      }
    },
    
    markShipped: {
      from: 'READY_FOR_SHIPPING',
      to: 'SHIPPED',
      action: async (context, order) => {
        // Actualizar orden
        await context.db.update('Order', {
          id: order.id,
          shippedAt: new Date()
        });
        
        // Actualizar inventario (convertir stock reservado a retirado)
        const lineItems = await context.db.findMany('LineItem', {
          where: { orderId: order.id }
        });
        
        for (const item of lineItems) {
          await context.db.update('Product', {
            id: item.productId,
            reservedStock: { decrement: item.quantity },
            stock: { decrement: item.quantity }
          });
        }
        
        // Notificar al cliente
        await context.services.EmailService.sendTemplate('order_shipped', {
          to: order.email,
          subject: `Tu pedido #${order.id} ha sido enviado`,
          data: {
            orderNumber: order.id,
            trackingNumber: order.trackingNumber,
            carrier: order.shippingCarrier,
            trackingUrl: getTrackingUrl(order.shippingCarrier, order.trackingNumber)
          }
        });
        
        return {
          message: `Pedido #${order.id} enviado`,
          shippedAt: new Date()
        };
      }
    },
    
    markDelivered: {
      from: 'SHIPPED',
      to: 'DELIVERED',
      action: async (context, order) => {
        // Actualizar orden
        await context.db.update('Order', {
          id: order.id,
          deliveredAt: new Date()
        });
        
        // Notificar al cliente
        await context.services.EmailService.sendTemplate('order_delivered', {
          to: order.email,
          subject: `Tu pedido #${order.id} ha sido entregado`,
          data: {
            orderNumber: order.id,
            deliveryDate: new Date().toLocaleDateString()
          }
        });
        
        // Enviar solicitud de valoración después de un día
        await context.services.SchedulerService.scheduleTask({
          taskId: `review-request-${order.id}`,
          executeAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas después
          handler: async () => {
            await context.services.EmailService.sendTemplate('review_request', {
              to: order.email,
              subject: `¿Cómo valorarías tu experiencia con tu pedido #${order.id}?`,
              data: {
                orderNumber: order.id,
                reviewUrl: `https://tutienda.com/reviews?order=${order.id}&token=${generateReviewToken(order.id)}`
              }
            });
          }
        });
        
        return {
          message: `Pedido #${order.id} entregado`,
          deliveredAt: new Date()
        };
      }
    },
    
    completeOrder: {
      from: 'DELIVERED',
      to: 'COMPLETED',
      action: async (context, order) => {
        // Marcar como completado
        await context.db.update('Order', {
          id: order.id,
          completedAt: new Date(),
          status: 'completed'
        });
        
        // Actualizar estadísticas del cliente
        await context.services.CustomerService.updatePurchaseStats(order.userId);
        
        // Aplicar puntos de fidelidad
        if (order.userId) {
          const loyaltyPoints = Math.floor(order.total / 10); // 1 punto por cada 10€
          
          await context.services.LoyaltyService.addPoints(order.userId, loyaltyPoints, {
            source: 'purchase',
            reference: order.id
          });
          
          // Notificar al cliente sobre los puntos
          await context.services.NotificationService.notify(order.userId, {
            title: 'Puntos de fidelidad añadidos',
            message: `Has ganado ${loyaltyPoints} puntos por tu compra #${order.id}`,
            type: 'loyalty_points',
            data: { 
              points: loyaltyPoints,
              orderId: order.id
            }
          });
        }
        
        return {
          message: `Pedido #${order.id} completado`,
          completedAt: new Date(),
          loyaltyPointsAwarded: loyaltyPoints
        };
      }
    },
    
    cancelOrder: {
      from: ['RECEIVED', 'PROCESSING', 'READY_FOR_SHIPPING'],
      to: 'CANCELLED',
      action: async (context, order, { reason }) => {
        // Actualizar orden
        await context.db.update('Order', {
          id: order.id,
          cancelledAt: new Date(),
          cancellationReason: reason,
          status: 'cancelled'
        });
        
        // Devolver stock reservado
        if (order.state === 'PROCESSING' || order.state === 'READY_FOR_SHIPPING') {
          const lineItems = await context.db.findMany('LineItem', {
            where: { orderId: order.id }
          });
          
          for (const item of lineItems) {
            await context.db.update('Product', {
              id: item.productId,
              reservedStock: { decrement: item.quantity }
            });
          }
        }
        
        // Procesar reembolso si es necesario
        if (order.paymentId) {
          try {
            const refundResult = await context.services.PaymentService.refundPayment(order.paymentId);
            
            await context.db.create('Refund', {
              orderId: order.id,
              amount: order.total,
              paymentId: order.paymentId,
              refundId: refundResult.id,
              status: 'completed',
              reason
            });
            
            // Notificar al cliente sobre el reembolso
            await context.services.EmailService.sendTemplate('order_cancelled_with_refund', {
              to: order.email,
              subject: `Tu pedido #${order.id} ha sido cancelado`,
              data: {
                orderNumber: order.id,
                refundAmount: formatCurrency(order.total),
                reason
              }
            });
          } catch (error) {
            // Registrar error y notificar al equipo de soporte
            await context.db.create('RefundError', {
              orderId: order.id,
              paymentId: order.paymentId,
              error: error.message,
              errorDetails: JSON.stringify(error)
            });
            
            await context.services.NotificationService.notifyTeam('support', {
              title: 'Error en reembolso',
              message: `Error al procesar reembolso para pedido #${order.id}: ${error.message}`,
              data: { 
                orderId: order.id,
                error: error.message
              },
              priority: 'high'
            });
          }
        } else {
          // Notificar al cliente sin reembolso
          await context.services.EmailService.sendTemplate('order_cancelled', {
            to: order.email,
            subject: `Tu pedido #${order.id} ha sido cancelado`,
            data: {
              orderNumber: order.id,
              reason
            }
          });
        }
        
        return {
          message: `Pedido #${order.id} cancelado`,
          cancelledAt: new Date(),
          reason
        };
      }
    }
  },
  
  // Listeners para eventos externos que pueden afectar al workflow
  listeners: {
    'payment.failed': async (context, { orderId }) => {
      const order = await context.db.findOne('Order', { id: orderId });
      
      if (order && order.state === 'RECEIVED') {
        await context.workflows.orderFulfillment.transition(order.id, 'cancelOrder', {
          reason: 'Fallo en el pago'
        });
      }
    },
    
    'shipping.delayed': async (context, { trackingNumber }) => {
      const order = await context.db.findOne('Order', { trackingNumber });
      
      if (order && order.state === 'SHIPPED') {
        // Notificar al cliente sobre el retraso
        await context.services.EmailService.sendTemplate('shipping_delay', {
          to: order.email,
          subject: `Retraso en la entrega de tu pedido #${order.id}`,
          data: {
            orderNumber: order.id,
            trackingNumber: order.trackingNumber,
            newEstimatedDelivery: calculateNewDeliveryDate()
          }
        });
        
        // Registrar incidencia
        await context.db.create('OrderIncident', {
          orderId: order.id,
          type: 'SHIPPING_DELAY',
          description: 'Retraso en la entrega informado por el transportista',
          timestamp: new Date()
        });
      }
    }
  }
});
```

### Registro y uso de flujos de trabajo

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  workflows: [
    'src/workflows/orderFulfillment',
    'src/workflows/returnProcess',
    'src/workflows/userOnboarding'
  ]
};

// Uso en resolvers o servicios
const orderService = {
  async processOrder(orderId, context) {
    // Iniciar flujo de trabajo
    const workflow = context.workflows.orderFulfillment;
    
    // Obtener estado actual
    const currentState = await workflow.getState(orderId);
    
    // Realizar transición
    if (currentState === 'RECEIVED') {
      return workflow.transition(orderId, 'startProcessing');
    }
    
    throw new Error(`No se puede procesar orden en estado ${currentState}`);
  },
  
  async markOrderShipped(orderId, context) {
    const workflow = context.workflows.orderFulfillment;
    const currentState = await workflow.getState(orderId);
    
    if (currentState === 'READY_FOR_SHIPPING') {
      return workflow.transition(orderId, 'markShipped');
    }
    
    throw new Error(`No se puede enviar orden en estado ${currentState}`);
  }
};
```

## Próximos pasos

- Aprende a [implementar validaciones complejas](/docs/business-logic/validations)
- Explora los [patrones para pruebas unitarias](/docs/testing/unit-testing)
- Implementa [políticas de seguridad avanzadas](/docs/security/policies)
- Configura [integraciones con sistemas externos](/docs/integrations) 