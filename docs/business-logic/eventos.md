---
sidebar_position: 4
title: Sistema de Eventos
description: Implementación del sistema de eventos para comunicación entre componentes en NexusData
---

# Sistema de Eventos

El sistema de eventos de NexusData proporciona un mecanismo de comunicación entre diferentes partes de tu aplicación, permitiendo un acoplamiento débil entre componentes y facilitando la implementación de arquitecturas orientadas a eventos.

## Conceptos básicos

### ¿Qué son los eventos?

Los eventos son mensajes que se emiten cuando ocurre algo significativo en tu aplicación. Otros componentes pueden escuchar estos eventos y reaccionar en consecuencia. Esto permite:

- **Desacoplamiento**: Los componentes no necesitan conocerse entre sí
- **Extensibilidad**: Puedes añadir nuevos comportamientos sin modificar el código existente
- **Reactividad**: Tu aplicación puede responder a cambios de estado de forma dinámica

### Tipos de eventos

NexusData soporta varios tipos de eventos:

1. **Eventos de modelo**: Se emiten automáticamente cuando se crean, actualizan o eliminan registros
2. **Eventos personalizados**: Definidos por ti para casos de uso específicos
3. **Eventos del sistema**: Emitidos por el framework para notificar sobre cambios importantes

## Emisión de eventos

### Emisión desde servicios

```javascript
// src/services/OrderService.js
import { Service } from '@nexusdata/core';

class OrderService extends Service {
  async approveOrder(orderId, context) {
    const order = await this.db.findOne('Order', { id: orderId });
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    // Actualizar la orden
    const updatedOrder = await this.db.update('Order', {
      id: orderId,
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: context.user.id
    });
    
    // Emitir evento personalizado
    this.events.emit('order.approved', {
      order: updatedOrder,
      approvedBy: context.user.id,
      timestamp: new Date()
    });
    
    return updatedOrder;
  }
}

export default OrderService;
```

### Emisión desde acciones

```javascript
// src/models/Product.js
import { Model } from '@nexusdata/core';

class Product extends Model {
  static config = {
    actions: {
      markAsFeatured: {
        input: {
          featured: 'Boolean!'
        },
        output: 'Product!',
        resolver: async (product, { featured }, context) => {
          // Actualizar el producto
          const updatedProduct = await context.db.update('Product', {
            id: product.id,
            featured,
            featuredAt: featured ? new Date() : null
          });
          
          // Emitir evento personalizado
          context.events.emit('product.featured.changed', {
            product: updatedProduct,
            featured,
            changedBy: context.user.id,
            timestamp: new Date()
          });
          
          return updatedProduct;
        }
      }
    }
  };
}

export default Product;
```

## Escucha de eventos

### Suscripción a eventos en servicios

```javascript
// src/services/NotificationService.js
import { Service } from '@nexusdata/core';

class NotificationService extends Service {
  initialize() {
    // Suscribirse a eventos cuando se inicializa el servicio
    
    // Evento de modelo: cuando se crea un nuevo usuario
    this.events.on('User.created', this.handleNewUser.bind(this));
    
    // Evento personalizado: cuando se aprueba una orden
    this.events.on('order.approved', this.handleOrderApproved.bind(this));
    
    // Evento personalizado: cuando cambia el estado destacado de un producto
    this.events.on('product.featured.changed', this.handleProductFeaturedChanged.bind(this));
  }
  
  async handleNewUser(user) {
    // Enviar correo de bienvenida
    await this.emailService.sendWelcomeEmail(user.email, {
      name: user.name
    });
    
    // Crear notificación de bienvenida
    await this.db.create('Notification', {
      userId: user.id,
      type: 'welcome',
      title: '¡Bienvenido a nuestra plataforma!',
      message: 'Gracias por registrarte. Explora todas nuestras funcionalidades.',
      read: false,
      createdAt: new Date()
    });
  }
  
  async handleOrderApproved({ order, approvedBy }) {
    // Notificar al cliente
    await this.db.create('Notification', {
      userId: order.userId,
      type: 'order_approved',
      title: 'Pedido aprobado',
      message: `Tu pedido #${order.id} ha sido aprobado y está siendo procesado.`,
      data: { orderId: order.id },
      read: false,
      createdAt: new Date()
    });
    
    // Enviar correo de confirmación
    await this.emailService.sendOrderApprovedEmail(order.id);
  }
  
  async handleProductFeaturedChanged({ product, featured }) {
    if (featured) {
      // Notificar a los administradores
      const admins = await this.db.findMany('User', { role: 'admin' });
      
      for (const admin of admins) {
        await this.db.create('Notification', {
          userId: admin.id,
          type: 'product_featured',
          title: 'Nuevo producto destacado',
          message: `El producto "${product.name}" ha sido marcado como destacado.`,
          data: { productId: product.id },
          read: false,
          createdAt: new Date()
        });
      }
    }
  }
}

export default NotificationService;
```

### Suscripción a eventos en hooks de modelo

```javascript
// src/models/Order.js
import { Model } from '@nexusdata/core';

class Order extends Model {
  static config = {
    hooks: {
      afterCreate: async (order, context) => {
        // Emitir evento personalizado cuando se crea una orden
        context.events.emit('order.created', {
          order,
          createdBy: context.user?.id,
          timestamp: new Date()
        });
        
        return order;
      },
      
      afterUpdate: async (updatedOrder, originalOrder, context) => {
        // Emitir evento cuando cambia el estado de la orden
        if (updatedOrder.status !== originalOrder.status) {
          context.events.emit('order.status.changed', {
            order: updatedOrder,
            previousStatus: originalOrder.status,
            newStatus: updatedOrder.status,
            changedBy: context.user?.id,
            timestamp: new Date()
          });
        }
        
        return updatedOrder;
      }
    }
  };
}

export default Order;
```

## Eventos del sistema

NexusData emite automáticamente eventos para operaciones CRUD en todos los modelos:

| Evento | Descripción | Datos |
|--------|-------------|-------|
| `Model.created` | Se emite cuando se crea un nuevo registro | El registro creado |
| `Model.updated` | Se emite cuando se actualiza un registro | El registro actualizado y el original |
| `Model.deleted` | Se emite cuando se elimina un registro | El registro eliminado |

Donde `Model` es el nombre de tu modelo (por ejemplo, `User.created`, `Product.updated`, etc.).

## Eventos en tiempo real

NexusData permite transmitir eventos a los clientes en tiempo real a través de WebSockets:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  realtime: {
    enabled: true,
    events: [
      // Eventos de modelo que se transmitirán en tiempo real
      'User.created',
      'Product.updated',
      'Order.updated',
      
      // Eventos personalizados
      'order.approved',
      'product.featured.changed',
      'notification.created'
    ],
    // Función para determinar qué clientes reciben qué eventos
    authorize: (event, payload, client) => {
      // Ejemplo: solo enviar actualizaciones de órdenes al usuario propietario
      if (event.startsWith('Order.') || event === 'order.approved') {
        return client.user?.id === payload.order.userId;
      }
      
      // Ejemplo: solo enviar notificaciones al usuario destinatario
      if (event === 'notification.created') {
        return client.user?.id === payload.userId;
      }
      
      // Por defecto, permitir todos los eventos para usuarios autenticados
      return !!client.user;
    }
  }
};
```

### Suscripción en el cliente

```javascript
// Cliente JavaScript
import { createClient } from '@nexusdata/client';

const client = createClient({
  url: 'https://api.example.com',
  token: 'user-auth-token'
});

// Suscribirse a eventos en tiempo real
client.realtime.subscribe('Order.updated', (order) => {
  console.log('Orden actualizada:', order);
  // Actualizar la UI
});

client.realtime.subscribe('notification.created', (notification) => {
  console.log('Nueva notificación:', notification);
  // Mostrar notificación en la UI
});
```

## Eventos programados

Puedes programar eventos para que se emitan en momentos específicos:

```javascript
// src/services/ReminderService.js
import { Service } from '@nexusdata/core';

class ReminderService extends Service {
  initialize() {
    // Programar evento diario a las 9:00 AM
    this.events.schedule('daily-reminders', '0 9 * * *', this.sendDailyReminders.bind(this));
    
    // Programar evento para ejecutarse cada hora
    this.events.schedule('hourly-check', '0 * * * *', this.hourlyCheck.bind(this));
  }
  
  async sendDailyReminders() {
    // Buscar usuarios con tareas pendientes
    const usersWithTasks = await this.db.findMany('User', {
      where: {
        tasks: {
          some: {
            status: 'pending',
            dueDate: { lte: new Date(Date.now() + 24 * 60 * 60 * 1000) } // Próximas 24 horas
          }
        }
      }
    });
    
    // Enviar recordatorios
    for (const user of usersWithTasks) {
      await this.notificationService.notify(user.id, {
        title: 'Recordatorio de tareas',
        message: 'Tienes tareas pendientes que vencen pronto.',
        type: 'reminder'
      });
    }
  }
  
  async hourlyCheck() {
    // Verificar órdenes abandonadas
    const abandonedCarts = await this.db.findMany('Cart', {
      where: {
        status: 'active',
        updatedAt: { lte: new Date(Date.now() - 4 * 60 * 60 * 1000) } // No actualizadas en 4 horas
      }
    });
    
    // Enviar recordatorios
    for (const cart of abandonedCarts) {
      // Emitir evento
      this.events.emit('cart.abandoned', {
        cart,
        timestamp: new Date()
      });
    }
  }
}

export default ReminderService;
```

## Eventos asíncronos y colas

Para eventos que requieren procesamiento pesado, puedes utilizar colas asíncronas:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  queues: {
    enabled: true,
    connections: {
      default: {
        driver: 'redis',
        config: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379
        }
      }
    },
    queues: [
      {
        name: 'emails',
        connection: 'default',
        attempts: 3,
        backoff: 60 // segundos
      },
      {
        name: 'notifications',
        connection: 'default',
        attempts: 2,
        backoff: 30 // segundos
      },
      {
        name: 'reports',
        connection: 'default',
        attempts: 1
      }
    ]
  }
};

// src/services/EmailService.js
import { Service } from '@nexusdata/core';

class EmailService extends Service {
  initialize() {
    // Suscribirse a eventos y procesarlos de forma asíncrona
    this.events.onAsync('order.created', 'emails', this.sendOrderConfirmation.bind(this));
    this.events.onAsync('user.created', 'emails', this.sendWelcomeEmail.bind(this));
    this.events.onAsync('password.reset.requested', 'emails', this.sendPasswordResetEmail.bind(this));
  }
  
  async sendOrderConfirmation({ order }) {
    // Lógica para enviar correo de confirmación de orden
    // ...
    console.log(`Enviando correo de confirmación para orden ${order.id}`);
  }
  
  async sendWelcomeEmail(user) {
    // Lógica para enviar correo de bienvenida
    // ...
    console.log(`Enviando correo de bienvenida a ${user.email}`);
  }
  
  async sendPasswordResetEmail({ user, token }) {
    // Lógica para enviar correo de restablecimiento de contraseña
    // ...
    console.log(`Enviando correo de restablecimiento de contraseña a ${user.email}`);
  }
}

export default EmailService;
```

## Mejores prácticas

1. **Nombres descriptivos**: Usa nombres de eventos que describan claramente lo que ha ocurrido.
2. **Estructura consistente**: Mantén una estructura consistente para los datos de eventos.
3. **Documentación**: Documenta todos los eventos que emite tu aplicación.
4. **Idempotencia**: Diseña manejadores de eventos para ser idempotentes (pueden procesar el mismo evento múltiples veces sin efectos secundarios).
5. **Manejo de errores**: Implementa manejo de errores robusto en tus manejadores de eventos.
6. **Monitoreo**: Monitorea la emisión y procesamiento de eventos para detectar problemas.
7. **Seguridad**: Asegúrate de que los eventos no contengan información sensible que no debería ser accesible para todos los suscriptores.
8. **Rendimiento**: Para eventos de alto volumen, considera usar colas asíncronas.

## Ejemplo completo: Sistema de notificaciones

```javascript
// src/services/NotificationService.js
import { Service } from '@nexusdata/core';

class NotificationService extends Service {
  initialize() {
    // Suscribirse a eventos del sistema
    this.events.on('User.created', this.handleUserCreated.bind(this));
    this.events.on('Order.updated', this.handleOrderUpdated.bind(this));
    
    // Suscribirse a eventos personalizados
    this.events.on('order.approved', this.handleOrderApproved.bind(this));
    this.events.on('order.shipped', this.handleOrderShipped.bind(this));
    this.events.on('product.stock.low', this.handleProductStockLow.bind(this));
    
    // Suscribirse a eventos asíncronos
    this.events.onAsync('notification.send', 'notifications', this.processNotification.bind(this));
  }
  
  async handleUserCreated(user) {
    await this.createNotification({
      userId: user.id,
      type: 'welcome',
      title: '¡Bienvenido!',
      message: 'Gracias por registrarte en nuestra plataforma.'
    });
  }
  
  async handleOrderUpdated(order, previousOrder) {
    if (order.status !== previousOrder.status) {
      await this.createNotification({
        userId: order.userId,
        type: 'order_status',
        title: 'Estado de pedido actualizado',
        message: `Tu pedido #${order.id} ahora está en estado: ${order.status}`,
        data: { orderId: order.id, status: order.status }
      });
    }
  }
  
  async handleOrderApproved({ order }) {
    await this.createNotification({
      userId: order.userId,
      type: 'order_approved',
      title: 'Pedido aprobado',
      message: `Tu pedido #${order.id} ha sido aprobado y está siendo procesado.`,
      data: { orderId: order.id }
    });
  }
  
  async handleOrderShipped({ order, tracking }) {
    await this.createNotification({
      userId: order.userId,
      type: 'order_shipped',
      title: 'Pedido enviado',
      message: `Tu pedido #${order.id} ha sido enviado. Número de seguimiento: ${tracking.number}`,
      data: { orderId: order.id, tracking }
    });
  }
  
  async handleProductStockLow({ product, currentStock, threshold }) {
    // Notificar a los administradores
    const admins = await this.db.findMany('User', { role: 'admin' });
    
    for (const admin of admins) {
      await this.createNotification({
        userId: admin.id,
        type: 'stock_alert',
        title: 'Alerta de stock bajo',
        message: `El producto "${product.name}" tiene stock bajo (${currentStock} unidades).`,
        data: { productId: product.id, currentStock, threshold }
      });
    }
  }
  
  async createNotification(data) {
    // Crear notificación en la base de datos
    const notification = await this.db.create('Notification', {
      ...data,
      read: false,
      createdAt: new Date()
    });
    
    // Emitir evento para notificaciones en tiempo real
    this.events.emit('notification.created', notification);
    
    // Encolar para procesamiento adicional (push notifications, emails, etc.)
    this.events.emitAsync('notification.send', notification);
    
    return notification;
  }
  
  async processNotification(notification) {
    // Obtener usuario
    const user = await this.db.findOne('User', { id: notification.userId });
    
    // Enviar push notification si está habilitado
    if (user.pushEnabled && user.pushToken) {
      try {
        await this.pushService.send({
          token: user.pushToken,
          title: notification.title,
          body: notification.message,
          data: notification.data
        });
        
        // Actualizar estado de envío
        await this.db.update('Notification', {
          id: notification.id,
          pushSent: true,
          pushSentAt: new Date()
        });
      } catch (error) {
        console.error('Error al enviar push notification:', error);
        
        // Registrar error
        await this.db.create('NotificationError', {
          notificationId: notification.id,
          type: 'push',
          error: error.message,
          data: JSON.stringify(error),
          createdAt: new Date()
        });
      }
    }
    
    // Enviar email para ciertos tipos de notificaciones
    const emailTypes = ['welcome', 'order_shipped', 'password_reset'];
    
    if (emailTypes.includes(notification.type)) {
      try {
        await this.emailService.sendNotificationEmail(user.email, notification);
        
        // Actualizar estado de envío
        await this.db.update('Notification', {
          id: notification.id,
          emailSent: true,
          emailSentAt: new Date()
        });
      } catch (error) {
        console.error('Error al enviar email de notificación:', error);
        
        // Registrar error
        await this.db.create('NotificationError', {
          notificationId: notification.id,
          type: 'email',
          error: error.message,
          data: JSON.stringify(error),
          createdAt: new Date()
        });
      }
    }
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