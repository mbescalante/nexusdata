---
sidebar_position: 1
title: Hooks y Middleware
description: Implementación de hooks y middleware para extender la funcionalidad de modelos en NexusData
---

# Hooks y Middleware

Los hooks y middleware son mecanismos poderosos que te permiten interceptar y modificar el comportamiento de las operaciones CRUD en tus modelos.

## Hooks de modelo

Los hooks de modelo te permiten ejecutar código antes o después de operaciones específicas en un modelo particular.

### Ciclo de vida de los hooks

NexusData proporciona los siguientes hooks para cada modelo:

- **beforeCreate**: Se ejecuta antes de crear un nuevo registro
- **afterCreate**: Se ejecuta después de crear un nuevo registro
- **beforeUpdate**: Se ejecuta antes de actualizar un registro
- **afterUpdate**: Se ejecuta después de actualizar un registro
- **beforeDelete**: Se ejecuta antes de eliminar un registro
- **afterDelete**: Se ejecuta después de eliminar un registro

### Implementación de hooks

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
### Parámetros de los hooks
Cada tipo de hook recibe diferentes parámetros:
| **Hook**        | **Parámetros**                              | **Descripción**                                                                 |
|-----------------|----------------------------------------------|----------------------------------------------------------------------------------|
| `beforeCreate`  | `(data, context)`                            | `data` contiene los datos a insertar. `context` incluye información de la solicitud. |
| `afterCreate`   | `(record, context)`                          | `record` es el registro recién creado. `context` incluye información de la solicitud. |
| `beforeUpdate`  | `(data, record, context)`                    | `data` contiene los cambios. `record` es el registro actual. `context` incluye información de la solicitud. |
| `afterUpdate`   | `(updatedRecord, originalRecord, context)`   | `updatedRecord` es el registro actualizado. `originalRecord` es el original. `context` incluye información de la solicitud. |
| `beforeDelete`  | `(record, context)`                          | `record` es el registro que se va a eliminar. `context` incluye información de la solicitud. |
| `afterDelete`   | `(deletedRecord, context)`                   | `deletedRecord` es el registro eliminado. `context` incluye información de la solicitud. |

## Middleware global
El middleware global te permite aplicar lógica a múltiples modelos de manera consistente.

### Implementación de middleware
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
```

### Registro de middleware
Para registrar middleware globalmente, debes incluirlo en tu archivo de configuración:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  middleware: [
    'src/middleware/auditLog.js',
    'src/middleware/validation.js',
    'src/middleware/caching.js'
    // otros middleware
  ]
};
```
### Parámetros de middleware
Los middleware reciben los mismos parámetros que los hooks de modelo, más un objeto adicional con metadatos:

```javascript
async (/* parámetros normales del hook */, { model, operation }) => {
  // model: referencia al modelo afectado
  // operation: tipo de operación ('create', 'update', 'delete')
}
 ```


## Middleware específico de modelo
También puedes aplicar middleware específicamente a ciertos modelos:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  models: {
    User: {
      middleware: ['src/middleware/userAudit.js']
    },
    Order: {
      middleware: ['src/middleware/orderTracking.js']
    }
  }
};
```

## Orden de ejecución
Cuando se realizan operaciones en un modelo, los hooks y middleware se ejecutan en el siguiente orden:

1. Middleware global (beforeXXX)
2. Middleware específico de modelo (beforeXXX)
3. Hooks de modelo (beforeXXX)
4. Operación de base de datos
5. Hooks de modelo (afterXXX)
6. Middleware específico de modelo (afterXXX)
7. Middleware global (afterXXX)
## Casos de uso comunes
### Validación avanzada
```javascript
// src/middleware/validation.js
export default function validationMiddleware() {
  return {
    beforeCreate: async (data, context, { model }) => {
      if (model.name === 'User' && data.email) {
        // Verificar que el email no esté ya registrado
        const existingUser = await context.db.findOne('User', { email: data.email });
        if (existingUser) {
          throw new Error(`El email ${data.email} ya está registrado`);
        }
      }
      
      return data;
    },
    
    beforeUpdate: async (data, record, context, { model }) => {
      if (model.name === 'User' && data.email && data.email !== record.email) {
        // Verificar que el nuevo email no esté ya registrado
        const existingUser = await context.db.findOne('User', { email: data.email });
        if (existingUser) {
          throw new Error(`El email ${data.email} ya está registrado`);
        }
      }
      
      return data;
    }
  };
}
```

### Generación automática de slugs
```javascript
// src/middleware/slugify.js
import slugify from 'slugify';

export default function slugifyMiddleware() {
  return {
    beforeCreate: async (data, context, { model }) => {
      // Aplicar solo a modelos con campo 'title' y 'slug'
      if (data.title && model.schema.fields.slug) {
        data.slug = data.slug || slugify(data.title, { lower: true });
      }
      
      return data;
    },
    
    beforeUpdate: async (data, record, context, { model }) => {
      // Actualizar slug si cambia el título
      if (data.title && data.title !== record.title && model.schema.fields.slug) {
        data.slug = data.slug || slugify(data.title, { lower: true });
      }
      
      return data;
    }
  };
}
 ```


### Registro de actividad
```javascript
// src/middleware/activityLog.js
export default function activityLogMiddleware() {
  return {
    afterCreate: async (record, context, { model }) => {
      if (context.user) {
        await context.db.create('Activity', {
          userId: context.user.id,
          action: 'CREATE',
          resourceType: model.name,
          resourceId: record.id,
          timestamp: new Date(),
          details: `Creó ${model.name.toLowerCase()} #${record.id}`
        });
      }
      
      return record;
    },
    
    afterUpdate: async (updatedRecord, originalRecord, context, { model }) => {
      if (context.user) {
        await context.db.create('Activity', {
          userId: context.user.id,
          action: 'UPDATE',
          resourceType: model.name,
          resourceId: updatedRecord.id,
          timestamp: new Date(),
          details: `Actualizó ${model.name.toLowerCase()} #${updatedRecord.id}`
        });
      }
      
      return updatedRecord;
    },
    
    afterDelete: async (deletedRecord, context, { model }) => {
      if (context.user) {
        await context.db.create('Activity', {
          userId: context.user.id,
          action: 'DELETE',
          resourceType: model.name,
          resourceId: deletedRecord.id,
          timestamp: new Date(),
          details: `Eliminó ${model.name.toLowerCase()} #${deletedRecord.id}`
        });
      }
    }
  };
}
```

## Mejores prácticas
1. Mantén los hooks simples : Cada hook debe tener una responsabilidad única y clara.
2. Evita operaciones bloqueantes : Los hooks pueden afectar el rendimiento, así que evita operaciones costosas.
3. Maneja errores adecuadamente : Asegúrate de capturar y manejar errores para evitar comportamientos inesperados.
4. Usa transacciones cuando sea necesario : Para operaciones que afectan a múltiples modelos, considera usar transacciones.
5. Documenta tus hooks : Documenta claramente qué hacen tus hooks para facilitar el mantenimiento.