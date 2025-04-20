---
sidebar_position: 6
title: Flujos de Trabajo
description: Implementación de flujos de trabajo y procesos de negocio en NexusData
---

# Flujos de Trabajo

Los flujos de trabajo te permiten modelar y automatizar procesos de negocio complejos, definiendo secuencias de pasos, condiciones y acciones que se ejecutan en respuesta a eventos específicos.

## Conceptos básicos

### ¿Qué son los flujos de trabajo?

Un flujo de trabajo es una secuencia de pasos conectados que representan un proceso de negocio. Cada paso puede ser una acción, una decisión, una espera o una subrutina. Los flujos de trabajo pueden ser:

1. **Lineales**: Una secuencia simple de pasos que se ejecutan en orden
2. **Condicionales**: Incluyen ramas y decisiones basadas en condiciones
3. **Paralelos**: Permiten la ejecución simultánea de múltiples ramas
4. **Iterativos**: Incluyen bucles y repeticiones

### Componentes principales

- **Nodos**: Representan pasos individuales en el flujo
- **Transiciones**: Conexiones entre nodos que definen el flujo
- **Condiciones**: Reglas que determinan qué camino seguir
- **Acciones**: Operaciones que se ejecutan en cada paso
- **Eventos**: Desencadenantes que inician o afectan el flujo
- **Estados**: Representan el progreso del flujo

## Configuración del sistema de flujos

Para utilizar el sistema de flujos de trabajo, debes configurarlo en tu archivo de configuración:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  workflows: {
    enabled: true,
    storage: {
      driver: 'database', // 'database', 'redis', 'memory'
      // Configuración específica del driver
    },
    execution: {
      concurrency: 10, // Número máximo de flujos concurrentes
      timeout: 3600000, // Tiempo máximo de ejecución (ms)
      retries: 3 // Número de reintentos por defecto
    },
    monitoring: {
      enabled: true,
      retention: {
        completed: 30, // Días para retener flujos completados
        failed: 90 // Días para retener flujos fallidos
      }
    }
  }
};
```
## Definición de flujos de trabajo
### Estructura básica
```javascript
// src/workflows/OrderProcessingWorkflow.js
import { Workflow } from '@nexusdata/core';

class OrderProcessingWorkflow extends Workflow {
  // Nombre único del flujo
  static name = 'order-processing';
  
  // Versión del flujo (para migraciones)
  static version = '1.0.0';
  
  // Descripción del flujo
  static description = 'Procesa pedidos desde la creación hasta la entrega';
  
  // Definición del flujo
  static definition = {
    // Nodo inicial
    start: {
      type: 'start',
      next: 'validate_order'
    },
    
    // Validación del pedido
    validate_order: {
      type: 'action',
      action: 'validateOrder',
      next: 'check_inventory'
    },
    
    // Verificación de inventario
    check_inventory: {
      type: 'action',
      action: 'checkInventory',
      next: 'inventory_decision'
    },
    
    // Decisión basada en inventario
    inventory_decision: {
      type: 'decision',
      decision: 'inventoryAvailable',
      outcomes: {
        true: 'process_payment',
        false: 'notify_backorder'
      }
    },
    
    // Notificación de pedido pendiente
    notify_backorder: {
      type: 'action',
      action: 'notifyBackorder',
      next: 'wait_for_inventory'
    },
    
    // Espera por inventario
    wait_for_inventory: {
      type: 'wait',
      event: 'inventory.available',
      timeout: {
        duration: '7d',
        next: 'cancel_order'
      },
      next: 'process_payment'
    },
    
    // Procesamiento de pago
    process_payment: {
      type: 'action',
      action: 'processPayment',
      next: 'payment_decision'
    },
    
    // Decisión basada en pago
    payment_decision: {
      type: 'decision',
      decision: 'paymentSuccessful',
      outcomes: {
        true: 'prepare_shipment',
        false: 'handle_payment_failure'
      }
    },
    
    // Manejo de fallo de pago
    handle_payment_failure: {
      type: 'action',
      action: 'handlePaymentFailure',
      next: 'payment_retry_decision'
    },
    
    // Decisión de reintento de pago
    payment_retry_decision: {
      type: 'decision',
      decision: 'shouldRetryPayment',
      outcomes: {
        true: 'wait_for_payment_retry',
        false: 'cancel_order'
      }
    },
    
    // Espera para reintento de pago
    wait_for_payment_retry: {
      type: 'wait',
      event: 'payment.retry',
      timeout: {
        duration: '3d',
        next: 'cancel_order'
      },
      next: 'process_payment'
    },
    
    // Preparación de envío
    prepare_shipment: {
      type: 'action',
      action: 'prepareShipment',
      next: 'create_shipping_label'
    },
    
    // Creación de etiqueta de envío
    create_shipping_label: {
      type: 'action',
      action: 'createShippingLabel',
      next: 'notify_shipment'
    },
    
    // Notificación de envío
    notify_shipment: {
      type: 'action',
      action: 'notifyShipment',
      next: 'wait_for_delivery'
    },
    
    // Espera por entrega
    wait_for_delivery: {
      type: 'wait',
      event: 'order.delivered',
      timeout: {
        duration: '14d',
        next: 'check_delivery_status'
      },
      next: 'complete_order'
    },
    
    // Verificación de estado de entrega
    check_delivery_status: {
      type: 'action',
      action: 'checkDeliveryStatus',
      next: 'delivery_status_decision'
    },
    
    // Decisión basada en estado de entrega
    delivery_status_decision: {
      type: 'decision',
      decision: 'isDelivered',
      outcomes: {
        true: 'complete_order',
        false: 'handle_delivery_issue'
      }
    },
    
    // Manejo de problemas de entrega
    handle_delivery_issue: {
      type: 'action',
      action: 'handleDeliveryIssue',
      next: 'wait_for_resolution'
    },
    
    // Espera por resolución
    wait_for_resolution: {
      type: 'wait',
      event: 'delivery.issue.resolved',
      timeout: {
        duration: '7d',
        next: 'escalate_issue'
      },
      next: 'complete_order'
    },
    
    // Escalado de problema
    escalate_issue: {
      type: 'action',
      action: 'escalateDeliveryIssue',
      next: 'wait_for_manual_resolution'
    },
    
    // Espera por resolución manual
    wait_for_manual_resolution: {
      type: 'wait',
      event: 'manual.resolution',
      next: 'complete_order'
    },
    
    // Completar pedido
    complete_order: {
      type: 'action',
      action: 'completeOrder',
      next: 'request_feedback'
    },
    
    // Solicitar retroalimentación
    request_feedback: {
      type: 'action',
      action: 'requestFeedback',
      next: 'end'
    },
    
    // Cancelar pedido
    cancel_order: {
      type: 'action',
      action: 'cancelOrder',
      next: 'end'
    },
    
    // Nodo final
    end: {
      type: 'end'
    }
  };
  
  // Implementación de acciones
  async validateOrder(context, input, state) {
    const { orderId } = input;
    
    // Obtener detalles del pedido
    const order = await context.db.findOne('Order', { id: orderId });
    
    if (!order) {
      throw new Error(`Pedido no encontrado: ${orderId}`);
    }
    
    // Validar pedido
    if (!order.items || order.items.length === 0) {
      throw new Error('El pedido no contiene artículos');
    }
    
    // Actualizar estado del pedido
    await context.db.update('Order', {
      id: orderId,
      status: 'validating',
      workflowId: state.workflowId
    });
    
    // Devolver datos para el siguiente paso
    return {
      order,
      valid: true
    };
  }
  
  async checkInventory(context, input, state) {
    const { order } = state.data;
    
    // Verificar inventario para cada artículo
    const inventoryChecks = await Promise.all(
      order.items.map(async (item) => {
        const product = await context.db.findOne('Product', { id: item.productId });
        return {
          productId: item.productId,
          requested: item.quantity,
          available: product.stock,
          sufficient: product.stock >= item.quantity
        };
      })
    );
    
    // Determinar si hay suficiente inventario
    const allAvailable = inventoryChecks.every(check => check.sufficient);
    
    // Actualizar estado del pedido
    await context.db.update('Order', {
      id: order.id,
      status: allAvailable ? 'in_stock' : 'backorder',
      inventoryStatus: allAvailable ? 'available' : 'partial',
      inventoryCheckedAt: new Date()
    });
    
    // Registrar verificación de inventario
    await context.db.create('OrderInventoryCheck', {
      orderId: order.id,
      results: inventoryChecks,
      allAvailable,
      checkedAt: new Date()
    });
    
    return {
      inventoryChecks,
      allAvailable
    };
  }
  
  // Decisión: ¿Hay inventario disponible?
  inventoryAvailable(context, input, state) {
    return state.data.allAvailable;
  }
  
  // Implementación de otras acciones y decisiones...
  
  // Manejadores de eventos
  async onStart(context, input, state) {
    // Se ejecuta cuando se inicia el flujo
    await context.db.create('WorkflowLog', {
      workflowId: state.workflowId,
      type: 'start',
      message: `Iniciando flujo de procesamiento para pedido ${input.orderId}`,
      data: input,
      createdAt: new Date()
    });
  }
  
  async onComplete(context, input, state) {
    // Se ejecuta cuando se completa el flujo
    await context.db.create('WorkflowLog', {
      workflowId: state.workflowId,
      type: 'complete',
      message: `Flujo de procesamiento completado para pedido ${input.orderId}`,
      data: state.data,
      createdAt: new Date()
    });
  }
  
  async onError(context, error, state) {
    // Se ejecuta cuando ocurre un error
    await context.db.create('WorkflowLog', {
      workflowId: state.workflowId,
      type: 'error',
      message: `Error en flujo de procesamiento: ${error.message}`,
      data: {
        error: error.message,
        stack: error.stack,
        currentNode: state.currentNode
      },
      createdAt: new Date()
    });
    
    // Notificar al equipo de soporte
    await context.services.NotificationService.notifyTeam('support', {
      title: 'Error en flujo de trabajo',
      message: `Error en flujo de procesamiento de pedido ${state.data.order?.id}: ${error.message}`,
      data: {
        workflowId: state.workflowId,
        orderId: state.data.order?.id,
        error: error.message,
        currentNode: state.currentNode
      }
    });
  }
}

export default OrderProcessingWorkflow;
```
### Registro de flujos de trabajo
Para que tus flujos de trabajo estén disponibles en la aplicación, debes registrarlos en el archivo de configuración:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  workflows: {
    // ... configuración de flujos
    definitions: [
      'src/workflows/OrderProcessingWorkflow',
      'src/workflows/CustomerOnboardingWorkflow',
      'src/workflows/RefundProcessingWorkflow',
      'src/workflows/ContentApprovalWorkflow'
    ]
  }
};
 ```


## Tipos de nodos
### Nodo de inicio
```javascript
start: {
  type: 'start',
  next: 'primer_paso'
}
```
### Nodo de acción
```javascript
realizar_accion: {
  type: 'action',
  action: 'nombreDelMetodo',
  retry: {
    attempts: 3,
    delay: '1m'
  },
  next: 'siguiente_paso'
}
 ```

### Nodo de decisión
```javascript
tomar_decision: {
  type: 'decision',
  decision: 'nombreDelMetodoDeDecision',
  outcomes: {
    true: 'camino_verdadero',
    false: 'camino_falso',
    default: 'camino_por_defecto'
  }
}
```

### Nodo de espera
```javascript
esperar_evento: {
  type: 'wait',
  event: 'nombre.del.evento',
  timeout: {
    duration: '24h',
    next: 'paso_timeout'
  },
  next: 'paso_despues_evento'
}
 ```

### Nodo de subproceso
```javascript
ejecutar_subproceso: {
  type: 'subprocess',
  workflow: 'nombre-del-subproceso',
  input: {
    // Datos para el subproceso
    param1: '{{data.valor}}',
    param2: 'valor_estatico'
  },
  next: 'paso_despues_subproceso'
}
```

### Nodo paralelo
```javascript
ejecutar_en_paralelo: {
  type: 'parallel',
  branches: {
    rama1: 'primer_paso_rama1',
    rama2: 'primer_paso_rama2',
    rama3: 'primer_paso_rama3'
  },
  join: {
    type: 'all', // 'all', 'any', 'n'
    count: 2, // Solo para tipo 'n'
    next: 'paso_despues_paralelo'
  }
}
 ```

### Nodo de fin
```javascript
fin: {
  type: 'end'
}
 ```

## Iniciando flujos de trabajo
### Inicio manual
```javascript
// src/services/OrderService.js
import { Service } from '@nexusdata/core';

class OrderService extends Service {
  async createOrder(data, context) {
    // Crear pedido
    const order = await this.db.create('Order', {
      userId: context.user.id,
      items: data.items,
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingAddress,
      paymentMethod: data.paymentMethod,
      status: 'created',
      createdAt: new Date()
    });
    
    // Iniciar flujo de trabajo
    const workflow = await this.workflows.start('order-processing', {
      orderId: order.id
    });
    
    // Actualizar pedido con ID del flujo
    await this.db.update('Order', {
      id: order.id,
      workflowId: workflow.id
    });
    
    return {
      order,
      workflowId: workflow.id
    };
  }
}

export default OrderService;
```
### Inicio automático mediante eventos
```javascript
// src/models/Order.js
import { Model } from '@nexusdata/core';

class Order extends Model {
  static config = {
    hooks: {
      afterCreate: async (order, context) => {
        // Iniciar flujo de trabajo automáticamente después de crear un pedido
        if (order.status === 'created') {
          const workflow = await context.workflows.start('order-processing', {
            orderId: order.id
          });
          
          // Actualizar pedido con ID del flujo
          await context.db.update('Order', {
            id: order.id,
            workflowId: workflow.id
          });
        }
        
        return order;
      }
    }
  };
}

export default Order;
```
## Interacción con flujos en ejecución
### Envío de eventos
```javascript
// src/services/InventoryService.js
import { Service } from '@nexusdata/core';

class InventoryService extends Service {
  async receiveInventory(data, context) {
    // Procesar recepción de inventario
    const { productId, quantity } = data;
    
    // Actualizar inventario
    const product = await this.db.findOne('Product', { id: productId });
    
    await this.db.update('Product', {
      id: productId,
      stock: product.stock + quantity
    });
    
    // Registrar movimiento
    await this.db.create('InventoryMovement', {
      productId,
      type: 'receipt',
      quantity,
      previousStock: product.stock,
      newStock: product.stock + quantity,
      createdBy: context.user.id,
      createdAt: new Date()
    });
    
    // Buscar pedidos pendientes por este producto
    const backorders = await this.db.findMany('Order', {
      where: {
        status: 'backorder',
        items: {
          some: {
            productId
          }
        }
      }
    });
    
    // Enviar eventos para flujos de trabajo
    for (const order of backorders) {
      if (order.workflowId) {
        await this.workflows.sendEvent('inventory.available', {
          orderId: order.id,
          productId,
          availableQuantity: product.stock + quantity
        }, {
          workflowId: order.workflowId
        });
      }
    }
    
    return {
      product: {
        id: productId,
        newStock: product.stock + quantity
      },
      backordersNotified: backorders.length
    };
  }
}

export default InventoryService;
```

### Consulta de estado
```javascript
// src/services/WorkflowService.js
import { Service } from '@nexusdata/core';

class WorkflowService extends Service {
  async getWorkflowStatus(workflowId) {
    return this.workflows.getStatus(workflowId);
  }
  
  async getWorkflowHistory(workflowId) {
    return this.workflows.getHistory(workflowId);
  }
  
  async listActiveWorkflows(type = null, limit = 100, offset = 0) {
    return this.workflows.listActive(type, limit, offset);
  }
  
  async listWorkflowsByEntity(entityType, entityId) {
    return this.workflows.listByEntity(entityType, entityId);
  }
}

export default WorkflowService;
 ```


### Intervención manual
```javascript
// src/services/SupportService.js
import { Service } from '@nexusdata/core';

class SupportService extends Service {
  async resolveDeliveryIssue(data, context) {
    const { orderId, resolution, notes } = data;
    
    // Verificar permisos
    if (!context.user.hasPermission('order.resolve_issues')) {
      throw new Error('No tienes permiso para resolver problemas de entrega');
    }
    
    // Obtener pedido
    const order = await this.db.findOne('Order', { id: orderId });
    
    if (!order) {
      throw new Error(`Pedido no encontrado: ${orderId}`);
    }
    
    // Registrar resolución
    await this.db.create('OrderIssueResolution', {
      orderId,
      type: 'delivery',
      resolution,
      notes,
      resolvedBy: context.user.id,
      resolvedAt: new Date()
    });
    
    // Actualizar estado del pedido
    await this.db.update('Order', {
      id: orderId,
      deliveryIssueResolved: true,
      deliveryIssueResolution: resolution,
      deliveryIssueResolvedAt: new Date(),
      deliveryIssueResolvedBy: context.user.id
    });
    
    // Enviar evento al flujo de trabajo
    if (order.workflowId) {
      await this.workflows.sendEvent('delivery.issue.resolved', {
        orderId,
        resolution,
        resolvedBy: context.user.id
      }, {
        workflowId: order.workflowId
      });
    }
    
    return {
      success: true,
      order: await this.db.findOne('Order', { id: orderId })
    };
  }
  
  async manuallyCompleteWorkflowStep(data, context) {
    const { workflowId, step, reason } = data;
    
    // Verificar permisos
    if (!context.user.hasPermission('workflow.manual_intervention')) {
      throw new Error('No tienes permiso para intervenir manualmente en flujos de trabajo');
    }
    
    // Registrar intervención
    await this.db.create('WorkflowIntervention', {
      workflowId,
      step,
      reason,
      performedBy: context.user.id,
      performedAt: new Date()
    });
    
    // Avanzar el flujo manualmente
    await this.workflows.advanceToStep(workflowId, step);
    
    return {
      success: true,
      workflow: await this.workflows.getStatus(workflowId)
    };
  }
}

export default SupportService;
```

## Ejemplos de flujos comunes
### Flujo de incorporación de clientes
```javascript
// src/workflows/CustomerOnboardingWorkflow.js
import { Workflow } from '@nexusdata/core';

class CustomerOnboardingWorkflow extends Workflow {
  static name = 'customer-onboarding';
  static version = '1.0.0';
  static description = 'Proceso de incorporación de nuevos clientes';
  
  static definition = {
    start: {
      type: 'start',
      next: 'verify_email'
    },
    
    verify_email: {
      type: 'action',
      action: 'sendVerificationEmail',
      next: 'wait_for_email_verification'
    },
    
    wait_for_email_verification: {
      type: 'wait',
      event: 'email.verified',
      timeout: {
        duration: '3d',
        next: 'send_reminder_email'
      },
      next: 'collect_profile_info'
    },
    
    send_reminder_email: {
      type: 'action',
      action: 'sendReminderEmail',
      next: 'wait_for_email_verification_after_reminder'
    },
    
    wait_for_email_verification_after_reminder: {
      type: 'wait',
      event: 'email.verified',
      timeout: {
        duration: '4d',
        next: 'mark_inactive'
      },
      next: 'collect_profile_info'
    },
    
    collect_profile_info: {
      type: 'action',
      action: 'requestProfileInfo',
      next: 'wait_for_profile_completion'
    },
    
    wait_for_profile_completion: {
      type: 'wait',
      event: 'profile.completed',
      timeout: {
        duration: '7d',
        next: 'send_profile_reminder'
      },
      next: 'verify_profile'
    },
    
    send_profile_reminder: {
      type: 'action',
      action: 'sendProfileReminder',
      next: 'wait_for_profile_completion_after_reminder'
    },
    
    wait_for_profile_completion_after_reminder: {
      type: 'wait',
      event: 'profile.completed',
      timeout: {
        duration: '7d',
        next: 'mark_incomplete'
      },
      next: 'verify_profile'
    },
    
    verify_profile: {
      type: 'action',
      action: 'verifyProfile',
      next: 'profile_decision'
    },
    
    profile_decision: {
      type: 'decision',
      decision: 'isProfileValid',
      outcomes: {
        true: 'setup_preferences',
        false: 'request_profile_correction'
      }
    },
    
    request_profile_correction: {
      type: 'action',
      action: 'requestProfileCorrection',
      next: 'wait_for_profile_correction'
    },
    
    wait_for_profile_correction: {
      type: 'wait',
      event: 'profile.updated',
      next: 'verify_profile'
    },
    
    setup_preferences: {
      type: 'action',
      action: 'setupPreferences',
      next: 'recommend_products'
    },
    
    recommend_products: {
      type: 'action',
      action: 'generateRecommendations',
      next: 'send_welcome_package'
    },
    
    send_welcome_package: {
      type: 'action',
      action: 'sendWelcomePackage',
      next: 'assign_account_manager'
    },
    
    assign_account_manager: {
      type: 'action',
      action: 'assignAccountManager',
      next: 'schedule_followup'
    },
    
    schedule_followup: {
      type: 'action',
      action: 'scheduleFollowup',
      next: 'mark_active'
    },
    
    mark_active: {
      type: 'action',
      action: 'markCustomerActive',
      next: 'end'
    },
    
    mark_inactive: {
      type: 'action',
      action: 'markCustomerInactive',
      next: 'end'
    },
    
    mark_incomplete: {
      type: 'action',
      action: 'markCustomerIncomplete',
      next: 'end'
    },
    
    end: {
      type: 'end'
    }
  };
  
  // Implementación de acciones y decisiones...
}

export default CustomerOnboardingWorkflow;
```

Voy a continuar con el contenido del archivo flujos.md desde la sección "Flujo de aprobación de contenido" y completar lo que falta.

```markdown:c:\Users\Shawm\Desktop\docux\my-website\docs\business-logic\flujos.md
// ... código existente ...

### Flujo de aprobación de contenido

```javascript
// src/workflows/ContentApprovalWorkflow.js
import { Workflow } from '@nexusdata/core';

class ContentApprovalWorkflow extends Workflow {
  static name = 'content-approval';
  static version = '1.0.0';
  static description = 'Proceso de aprobación de contenido';
  
  static definition = {
    start: {
      type: 'start',
      next: 'initial_review'
    },
    
    initial_review: {
      type: 'action',
      action: 'assignInitialReviewer',
      next: 'wait_for_initial_review'
    },
    
    wait_for_initial_review: {
      type: 'wait',
      event: 'content.reviewed.initial',
      timeout: {
        duration: '3d',
        next: 'send_review_reminder'
      },
      next: 'initial_review_decision'
    },
    
    send_review_reminder: {
      type: 'action',
      action: 'sendReviewReminder',
      next: 'wait_for_initial_review_after_reminder'
    },
    
    wait_for_initial_review_after_reminder: {
      type: 'wait',
      event: 'content.reviewed.initial',
      timeout: {
        duration: '2d',
        next: 'escalate_review'
      },
      next: 'initial_review_decision'
    },
    
    escalate_review: {
      type: 'action',
      action: 'escalateReview',
      next: 'wait_for_escalated_review'
    },
    
    wait_for_escalated_review: {
      type: 'wait',
      event: 'content.reviewed.escalated',
      next: 'initial_review_decision'
    },
    
    initial_review_decision: {
      type: 'decision',
      decision: 'initialReviewPassed',
      outcomes: {
        true: 'check_content_type',
        false: 'request_revisions'
      }
    },
    
    request_revisions: {
      type: 'action',
      action: 'requestRevisions',
      next: 'wait_for_revisions'
    },
    
    wait_for_revisions: {
      type: 'wait',
      event: 'content.revised',
      next: 'initial_review'
    },
    
    check_content_type: {
      type: 'decision',
      decision: 'requiresExpertReview',
      outcomes: {
        true: 'expert_review',
        false: 'final_review'
      }
    },
    
    expert_review: {
      type: 'action',
      action: 'assignExpertReviewer',
      next: 'wait_for_expert_review'
    },
    
    wait_for_expert_review: {
      type: 'wait',
      event: 'content.reviewed.expert',
      next: 'expert_review_decision'
    },
    
    expert_review_decision: {
      type: 'decision',
      decision: 'expertReviewPassed',
      outcomes: {
        true: 'final_review',
        false: 'request_expert_revisions'
      }
    },
    
    request_expert_revisions: {
      type: 'action',
      action: 'requestExpertRevisions',
      next: 'wait_for_expert_revisions'
    },
    
    wait_for_expert_revisions: {
      type: 'wait',
      event: 'content.revised.expert',
      next: 'expert_review'
    },
    
    final_review: {
      type: 'action',
      action: 'assignFinalReviewer',
      next: 'wait_for_final_review'
    },
    
    wait_for_final_review: {
      type: 'wait',
      event: 'content.reviewed.final',
      next: 'final_review_decision'
    },
    
    final_review_decision: {
      type: 'decision',
      decision: 'finalReviewPassed',
      outcomes: {
        true: 'publish_content',
        false: 'request_final_revisions'
      }
    },
    
    request_final_revisions: {
      type: 'action',
      action: 'requestFinalRevisions',
      next: 'wait_for_final_revisions'
    },
    
    wait_for_final_revisions: {
      type: 'wait',
      event: 'content.revised.final',
      next: 'final_review'
    },
    
    publish_content: {
      type: 'action',
      action: 'publishContent',
      next: 'notify_stakeholders'
    },
    
    notify_stakeholders: {
      type: 'action',
      action: 'notifyStakeholders',
      next: 'end'
    },
    
    end: {
      type: 'end'
    }
  };
  
  // Implementación de acciones y decisiones...
}

export default ContentApprovalWorkflow;
```

### Flujo de procesamiento de reembolsos

```javascript
// src/workflows/RefundProcessingWorkflow.js
import { Workflow } from '@nexusdata/core';

class RefundProcessingWorkflow extends Workflow {
  static name = 'refund-processing';
  static version = '1.0.0';
  static description = 'Procesa solicitudes de reembolso';
  
  static definition = {
    start: {
      type: 'start',
      next: 'validate_refund_request'
    },
    
    validate_refund_request: {
      type: 'action',
      action: 'validateRefundRequest',
      next: 'check_eligibility'
    },
    
    check_eligibility: {
      type: 'action',
      action: 'checkRefundEligibility',
      next: 'eligibility_decision'
    },
    
    eligibility_decision: {
      type: 'decision',
      decision: 'isEligibleForRefund',
      outcomes: {
        true: 'check_refund_type',
        false: 'reject_refund'
      }
    },
    
    check_refund_type: {
      type: 'decision',
      decision: 'requiresApproval',
      outcomes: {
        true: 'request_approval',
        false: 'process_automatic_refund'
      }
    },
    
    request_approval: {
      type: 'action',
      action: 'requestRefundApproval',
      next: 'wait_for_approval'
    },
    
    wait_for_approval: {
      type: 'wait',
      event: 'refund.approval.decision',
      timeout: {
        duration: '5d',
        next: 'escalate_approval'
      },
      next: 'approval_decision'
    },
    
    escalate_approval: {
      type: 'action',
      action: 'escalateApproval',
      next: 'wait_for_escalated_approval'
    },
    
    wait_for_escalated_approval: {
      type: 'wait',
      event: 'refund.approval.escalated',
      next: 'approval_decision'
    },
    
    approval_decision: {
      type: 'decision',
      decision: 'isApproved',
      outcomes: {
        true: 'process_refund',
        false: 'reject_refund'
      }
    },
    
    process_automatic_refund: {
      type: 'action',
      action: 'processAutomaticRefund',
      next: 'verify_refund'
    },
    
    process_refund: {
      type: 'action',
      action: 'processRefund',
      next: 'verify_refund'
    },
    
    verify_refund: {
      type: 'action',
      action: 'verifyRefundProcessed',
      next: 'refund_verification_decision'
    },
    
    refund_verification_decision: {
      type: 'decision',
      decision: 'refundProcessedSuccessfully',
      outcomes: {
        true: 'update_inventory',
        false: 'handle_refund_failure'
      }
    },
    
    handle_refund_failure: {
      type: 'action',
      action: 'handleRefundFailure',
      next: 'retry_decision'
    },
    
    retry_decision: {
      type: 'decision',
      decision: 'shouldRetryRefund',
      outcomes: {
        true: 'process_refund',
        false: 'manual_intervention'
      }
    },
    
    manual_intervention: {
      type: 'action',
      action: 'requestManualIntervention',
      next: 'wait_for_manual_resolution'
    },
    
    wait_for_manual_resolution: {
      type: 'wait',
      event: 'refund.manual.resolved',
      next: 'update_inventory'
    },
    
    update_inventory: {
      type: 'decision',
      decision: 'requiresInventoryUpdate',
      outcomes: {
        true: 'process_inventory_update',
        false: 'notify_customer'
      }
    },
    
    process_inventory_update: {
      type: 'action',
      action: 'updateInventory',
      next: 'notify_customer'
    },
    
    notify_customer: {
      type: 'action',
      action: 'notifyCustomer',
      next: 'close_refund'
    },
    
    reject_refund: {
      type: 'action',
      action: 'rejectRefund',
      next: 'notify_rejection'
    },
    
    notify_rejection: {
      type: 'action',
      action: 'notifyRejection',
      next: 'end'
    },
    
    close_refund: {
      type: 'action',
      action: 'closeRefund',
      next: 'end'
    },
    
    end: {
      type: 'end'
    }
  };
  
  // Implementación de acciones y decisiones...
}

export default RefundProcessingWorkflow;
```

## Interacción con flujos en ejecución

### Envío de eventos

```javascript
// src/services/InventoryService.js
import { Service } from '@nexusdata/core';

class InventoryService extends Service {
  async receiveInventory(data, context) {
    // Procesar recepción de inventario
    const { productId, quantity } = data;
    
    // Actualizar inventario
    const product = await this.db.findOne('Product', { id: productId });
    
    await this.db.update('Product', {
      id: productId,
      stock: product.stock + quantity
    });
    
    // Registrar movimiento
    await this.db.create('InventoryMovement', {
      productId,
      type: 'receipt',
      quantity,
      previousStock: product.stock,
      newStock: product.stock + quantity,
      createdBy: context.user.id,
      createdAt: new Date()
    });
    
    // Buscar pedidos pendientes por este producto
    const backorders = await this.db.findMany('Order', {
      where: {
        status: 'backorder',
        items: {
          some: {
            productId
          }
        }
      }
    });
    
    // Enviar eventos para flujos de trabajo
    for (const order of backorders) {
      if (order.workflowId) {
        await this.workflows.sendEvent('inventory.available', {
          orderId: order.id,
          productId,
          availableQuantity: product.stock + quantity
        }, {
          workflowId: order.workflowId
        });
      }
    }
    
    return {
      product: {
        id: productId,
        newStock: product.stock + quantity
      },
      backordersNotified: backorders.length
    };
  }
}

export default InventoryService;
```

### Consulta de estado

```javascript
// src/services/WorkflowService.js
import { Service } from '@nexusdata/core';

class WorkflowService extends Service {
  async getWorkflowStatus(workflowId) {
    return this.workflows.getStatus(workflowId);
  }
  
  async getWorkflowHistory(workflowId) {
    return this.workflows.getHistory(workflowId);
  }
  
  async listActiveWorkflows(type = null, limit = 100, offset = 0) {
    return this.workflows.listActive(type, limit, offset);
  }
  
  async listWorkflowsByEntity(entityType, entityId) {
    return this.workflows.listByEntity(entityType, entityId);
  }
}

export default WorkflowService;
```

### Intervención manual

```javascript
// src/services/SupportService.js
import { Service } from '@nexusdata/core';

class SupportService extends Service {
  async resolveDeliveryIssue(data, context) {
    const { orderId, resolution, notes } = data;
    
    // Verificar permisos
    if (!context.user.hasPermission('order.resolve_issues')) {
      throw new Error('No tienes permiso para resolver problemas de entrega');
    }
    
    // Obtener pedido
    const order = await this.db.findOne('Order', { id: orderId });
    
    if (!order) {
      throw new Error(`Pedido no encontrado: ${orderId}`);
    }
    
    // Registrar resolución
    await this.db.create('OrderIssueResolution', {
      orderId,
      type: 'delivery',
      resolution,
      notes,
      resolvedBy: context.user.id,
      resolvedAt: new Date()
    });
    
    // Actualizar estado del pedido
    await this.db.update('Order', {
      id: orderId,
      deliveryIssueResolved: true,
      deliveryIssueResolution: resolution,
      deliveryIssueResolvedAt: new Date(),
      deliveryIssueResolvedBy: context.user.id
    });
    
    // Enviar evento al flujo de trabajo
    if (order.workflowId) {
      await this.workflows.sendEvent('delivery.issue.resolved', {
        orderId,
        resolution,
        resolvedBy: context.user.id
      }, {
        workflowId: order.workflowId
      });
    }
    
    return {
      success: true,
      order: await this.db.findOne('Order', { id: orderId })
    };
  }
  
  async manuallyCompleteWorkflowStep(data, context) {
    const { workflowId, step, reason } = data;
    
    // Verificar permisos
    if (!context.user.hasPermission('workflow.manual_intervention')) {
      throw new Error('No tienes permiso para intervenir manualmente en flujos de trabajo');
    }
    
    // Registrar intervención
    await this.db.create('WorkflowIntervention', {
      workflowId,
      step,
      reason,
      performedBy: context.user.id,
      performedAt: new Date()
    });
    
    // Avanzar el flujo manualmente
    await this.workflows.advanceToStep(workflowId, step);
    
    return {
      success: true,
      workflow: await this.workflows.getStatus(workflowId)
    };
  }
}

export default SupportService;
```

## Visualización y monitoreo de flujos

### Panel de control de flujos

```javascript
// src/services/WorkflowDashboardService.js
import { Service } from '@nexusdata/core';

class WorkflowDashboardService extends Service {
  async getWorkflowStats() {
    // Obtener estadísticas generales de flujos de trabajo
    const stats = {
      active: await this.db.count('Workflow', { status: 'active' }),
      completed: await this.db.count('Workflow', { status: 'completed' }),
      failed: await this.db.count('Workflow', { status: 'failed' }),
      waiting: await this.db.count('Workflow', { status: 'waiting' })
    };
    
    // Obtener estadísticas por tipo de flujo
    const typeStats = await this.db.aggregate('Workflow', {
      groupBy: ['type'],
      count: true,
      where: { status: 'active' }
    });
    
    // Obtener flujos bloqueados (esperando por más tiempo del normal)
    const blockedWorkflows = await this.db.findMany('Workflow', {
      where: {
        status: 'waiting',
        updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Más de 7 días
      },
      limit: 10,
      orderBy: { updatedAt: 'asc' }
    });
    
    return {
      stats,
      typeStats,
      blockedWorkflows
    };
  }
  
  async getWorkflowTimelines(type, limit = 20) {
    // Obtener flujos completados recientemente
    const workflows = await this.db.findMany('Workflow', {
      where: {
        type,
        status: 'completed'
      },
      limit,
      orderBy: { completedAt: 'desc' }
    });
    
    // Obtener historial de cada flujo
    const timelines = await Promise.all(
      workflows.map(async (workflow) => {
        const history = await this.db.findMany('WorkflowHistory', {
          where: { workflowId: workflow.id },
          orderBy: { timestamp: 'asc' }
        });
        
        return {
          workflow,
          history,
          duration: workflow.completedAt - workflow.createdAt,
          steps: history.length
        };
      })
    );
    
    // Calcular estadísticas de duración
    const durations = timelines.map(t => t.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    return {
      timelines,
      stats: {
        avgDuration,
        minDuration,
        maxDuration,
        count: timelines.length
      }
    };
  }
  
  async getWorkflowBottlenecks(type, period = '30d') {
    // Determinar fecha de inicio según el período
    const startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    
    // Obtener historial de pasos para flujos completados
    const steps = await this.db.findMany('WorkflowHistory', {
      where: {
        workflow: {
          type,
          status: 'completed',
          completedAt: { gt: startDate }
        }
      }
    });
    
    // Agrupar por nombre de paso y calcular duración promedio
    const stepStats = {};
    
    for (const step of steps) {
      if (!stepStats[step.step]) {
        stepStats[step.step] = {
          count: 0,
          totalDuration: 0,
          maxDuration: 0
        };
      }
      
      const duration = step.completedAt - step.startedAt;
      stepStats[step.step].count++;
      stepStats[step.step].totalDuration += duration;
      
      if (duration > stepStats[step.step].maxDuration) {
        stepStats[step.step].maxDuration = duration;
      }
    }
    
    // Calcular duración promedio y ordenar por duración
    const bottlenecks = Object.entries(stepStats).map(([step, stats]) => ({
      step,
      avgDuration: stats.totalDuration / stats.count,
      maxDuration: stats.maxDuration,
      count: stats.count
    }));
    
    bottlenecks.sort((a, b) => b.avgDuration - a.avgDuration);
    
    return {
      bottlenecks: bottlenecks.slice(0, 10),
      period,
      totalWorkflows: await this.db.count('Workflow', {
        where: {
          type,
          status: 'completed',
          completedAt: { gt: startDate }
        }
      })
    };
  }
}

export default WorkflowDashboardService;
```

## Mejores prácticas

1. **Diseño modular**: Divide flujos complejos en subprocesos más pequeños y manejables.

2. **Idempotencia**: Diseña acciones para ser idempotentes, permitiendo reintentos seguros.

3. **Manejo de errores**: Implementa estrategias robustas de manejo de errores en cada paso.

4. **Timeouts**: Configura tiempos de espera adecuados para evitar flujos bloqueados indefinidamente.

5. **Registro y auditoría**: Mantén un registro detallado de cada paso y decisión para facilitar la depuración.

6. **Versionado**: Implementa un sistema de versionado para flujos de trabajo que permita migraciones seguras.

7. **Pruebas**: Crea pruebas automatizadas para validar el comportamiento de tus flujos de trabajo.

8. **Monitoreo**: Implementa alertas para flujos bloqueados o con errores frecuentes.

9. **Documentación**: Documenta claramente el propósito y comportamiento esperado de cada flujo.

10. **Transacciones**: Usa transacciones de base de datos cuando sea apropiado para mantener la consistencia.

## Patrones comunes

### Patrón de aprobación

Implementa flujos que requieren aprobación de uno o varios usuarios antes de continuar:

```javascript
approval_flow: {
  type: 'action',
  action: 'requestApproval',
  next: 'wait_for_approval'
},

wait_for_approval: {
  type: 'wait',
  event: 'approval.decision',
  next: 'check_approval'
},

check_approval: {
  type: 'decision',
  decision: 'isApproved',
  outcomes: {
    true: 'process_approved',
    false: 'process_rejected'
  }
}
```

### Patrón de escalamiento

Implementa un mecanismo de escalamiento cuando un paso no se completa en un tiempo determinado:

```javascript
assign_task: {
  type: 'action',
  action: 'assignTask',
  next: 'wait_for_completion'
},

wait_for_completion: {
  type: 'wait',
  event: 'task.completed',
  timeout: {
    duration: '2d',
    next: 'escalate_task'
  },
  next: 'process_completion'
},

escalate_task: {
  type: 'action',
  action: 'escalateTask',
  next: 'wait_after_escalation'
},

wait_after_escalation: {
  type: 'wait',
  event: 'task.completed',
  timeout: {
    duration: '1d',
    next: 'escalate_to_manager'
  },
  next: 'process_completion'
}
```

### Patrón de compensación

Implementa acciones de compensación para revertir cambios cuando un flujo falla:

```javascript
process_payment: {
  type: 'action',
  action: 'processPayment',
  next: 'update_inventory'
},

update_inventory: {
  type: 'action',
  action: 'updateInventory',
  next: 'send_confirmation',
  onError: 'revert_payment'
},

revert_payment: {
  type: 'action',
  action: 'revertPayment',
  next: 'notify_failure'
}
```

## Mejores prácticas

Los flujos de trabajo son una herramienta poderosa para modelar y automatizar procesos de negocio complejos. NexusData proporciona un sistema flexible y robusto para definir, ejecutar y monitorear flujos de trabajo, permitiéndote implementar lógica de negocio sofisticada de manera estructurada y mantenible.

Al utilizar flujos de trabajo, puedes:

- Mejorar la consistencia de tus procesos de negocio
- Reducir errores humanos en procesos complejos
- Aumentar la visibilidad y trazabilidad de tus operaciones
- Facilitar la adaptación a cambios en los requisitos del negocio
- Escalar tus operaciones manteniendo la calidad y consistencia
