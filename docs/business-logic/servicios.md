---
sidebar_position: 2
title: Servicios
description: Implementación de servicios para encapsular lógica de negocio compleja en NexusData
---

# Servicios

Los servicios en NexusData te permiten encapsular lógica de negocio compleja y reutilizable, facilitando la organización y mantenimiento de tu código.

## ¿Qué son los servicios?

Los servicios son clases que contienen métodos para implementar operaciones de negocio que:

- Involucran múltiples modelos
- Requieren transacciones
- Implementan flujos de trabajo complejos
- Interactúan con APIs externas
- Encapsulan lógica que se utiliza en múltiples partes de la aplicación

## Creación de servicios

### Estructura básica

```javascript
// src/services/UserService.js
import { Service } from '@nexusdata/core';

class UserService extends Service {
  async registerUser(userData, context) {
    // Implementación del método
  }
  
  async resetPassword(email, context) {
    // Implementación del método
  }
}

export default UserService;
```

### Servicio con lógica compleja

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
  
  async cancelOrder(orderId, reason, context) {
    return this.db.transaction(async (tx) => {
      const order = await tx.findOne(Order, { id: orderId });
      
      if (!order) {
        throw new Error('Orden no encontrada');
      }
      
      if (!['pending', 'paid'].includes(order.status)) {
        throw new Error(`No se puede cancelar una orden en estado ${order.status}`);
      }
      
      // Actualizar estado de la orden
      await tx.update(Order, {
        id: order.id,
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason
      });
      
      // Restaurar stock
      const lineItems = await tx.findMany(LineItem, { orderId: order.id });
      
      for (const item of lineItems) {
        await tx.update(Product, {
          id: item.productId,
          stock: { increment: item.quantity }
        });
      }
      
      // Notificar al usuario
      await tx.create(Notification, {
        userId: order.userId,
        type: 'order_cancelled',
        title: 'Pedido cancelado',
        message: `Tu pedido #${order.id} ha sido cancelado: ${reason}`,
        data: { orderId: order.id }
      });
      
      // Si ya se había pagado, procesar reembolso
      if (order.status === 'paid' && order.paymentId) {
        try {
          const refundResult = await this.paymentGateway.refundPayment(order.paymentId);
          
          await tx.create(Refund, {
            orderId: order.id,
            amount: order.total,
            status: 'completed',
            refundId: refundResult.id,
            reason
          });
          
          // Enviar correo de confirmación de reembolso
          await this.emailService.sendRefundConfirmation(order.id);
        } catch (error) {
          // Registrar error pero continuar con la cancelación
          await tx.create(RefundError, {
            orderId: order.id,
            error: error.message,
            data: JSON.stringify(error)
          });
          
          // Notificar al equipo de soporte
          await this.notificationService.notifyTeam('support', {
            title: 'Error en reembolso',
            message: `Error al procesar reembolso para orden #${order.id}: ${error.message}`
          });
        }
      }
      
      return { success: true, order: await tx.findOne(Order, { id: order.id }) };
    });
  }
}

export default OrderService;
```

## Registro de servicios

Para que tus servicios estén disponibles en toda la aplicación, debes registrarlos en el archivo de configuración:

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
```

## Uso de servicios

### En resolvers de GraphQL

```javascript
// src/graphql/resolvers.js
const resolvers = {
  Mutation: {
    createOrder: async (_, { input }, context) => {
      const orderService = context.services.OrderService;
      return orderService.createOrder(input, context);
    },
    
    processPayment: async (_, { orderId, paymentData }, context) => {
      const orderService = context.services.OrderService;
      return orderService.processPayment(orderId, paymentData, context);
    },
    
    cancelOrder: async (_, { orderId, reason }, context) => {
      const orderService = context.services.OrderService;
      return orderService.cancelOrder(orderId, reason, context);
    }
  }
};

export default resolvers;
```

### En controladores HTTP

```javascript
// src/controllers/orderController.js
export const createOrder = async (req, res) => {
  try {
    const orderService = req.context.services.OrderService;
    const result = await orderService.createOrder(req.body, req.context);
    
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const processPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderService = req.context.services.OrderService;
    const result = await orderService.processPayment(orderId, req.body, req.context);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

### En otros servicios

Los servicios pueden utilizar otros servicios para implementar funcionalidades complejas:

```javascript
// src/services/CheckoutService.js
import { Service } from '@nexusdata/core';

class CheckoutService extends Service {
  async completeCheckout(checkoutData, context) {
    // Crear orden
    const orderService = this.services.OrderService;
    const order = await orderService.createOrder({
      items: checkoutData.items,
      shippingAddress: checkoutData.shippingAddress,
      billingAddress: checkoutData.billingAddress
    }, context);
    
    // Procesar pago
    const paymentResult = await orderService.processPayment(order.id, checkoutData.payment, context);
    
    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error,
        step: 'payment'
      };
    }
    
    // Generar factura
    const invoiceService = this.services.InvoiceService;
    const invoice = await invoiceService.generateInvoice(order.id, context);
    
    // Enviar correo de confirmación
    const emailService = this.services.EmailService;
    await emailService.sendOrderConfirmationWithInvoice(order.id, invoice.id, context);
    
    return {
      success: true,
      order: paymentResult.order,
      invoice
    };
  }
}

export default CheckoutService;
```

## Inyección de dependencias

NexusData inyecta automáticamente las siguientes dependencias en tus servicios:

- **this.db**: Instancia del cliente de base de datos
- **this.services**: Objeto con todos los servicios registrados
- **this.events**: Sistema de eventos para emitir y suscribirse a eventos
- **this.config**: Configuración de la aplicación

También puedes inyectar dependencias personalizadas:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  services: [
    'src/services/OrderService',
    'src/services/UserService'
  ],
  dependencies: {
    paymentGateway: () => require('./lib/paymentGateway'),
    emailClient: () => require('./lib/emailClient'),
    logger: () => require('./lib/logger')
  }
};

// Uso en servicios
class OrderService extends Service {
  async processPayment(orderId, paymentData) {
    // this.paymentGateway está disponible automáticamente
    const result = await this.paymentGateway.processPayment({
      amount: order.total,
      // ...
    });
    
    // this.logger está disponible automáticamente
    this.logger.info(`Procesado pago para orden ${orderId}`);
    
    return result;
  }
}
```

## Patrones comunes

### Servicio de notificaciones

```javascript
// src/services/NotificationService.js
import { Service } from '@nexusdata/core';

class NotificationService extends Service {
  async notify(userId, notification) {
    // Crear notificación en la base de datos
    const dbNotification = await this.db.create('Notification', {
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      data: notification.data || {},
      read: false,
      createdAt: new Date()
    });
    
    // Emitir evento para notificaciones en tiempo real
    this.events.emit('notification.created', dbNotification);
    
    // Enviar push notification si está habilitado
    const user = await this.db.findOne('User', { id: userId });
    
    if (user.pushEnabled && user.pushToken) {
      await this.pushService.send({
        token: user.pushToken,
        title: notification.title,
        body: notification.message,
        data: notification.data
      });
    }
    
    return dbNotification;
  }
  
  async notifyTeam(teamId, notification) {
    // Obtener todos los miembros del equipo
    const teamMembers = await this.db.findMany('TeamMember', { teamId });
    
    // Notificar a cada miembro
    const notifications = [];
    
    for (const member of teamMembers) {
      const userNotification = await this.notify(member.userId, notification);
      notifications.push(userNotification);
    }
    
    return notifications;
  }
  
  async markAsRead(notificationId, userId) {
    const notification = await this.db.findOne('Notification', { id: notificationId });
    
    if (!notification) {
      throw new Error('Notificación no encontrada');
    }
    
    if (notification.userId !== userId) {
      throw new Error('No tienes permiso para marcar esta notificación como leída');
    }
    
    return this.db.update('Notification', {
      id: notificationId,
      read: true,
      readAt: new Date()
    });
  }
  
  async getUnreadCount(userId) {
    return this.db.count('Notification', {
      userId,
      read: false
    });
  }
}

export default NotificationService;
```
```