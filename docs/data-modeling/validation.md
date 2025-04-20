---
sidebar_position: 3
---

# Validación de Datos

La validación de datos es esencial para mantener la integridad y consistencia de tu aplicación. NexusData proporciona un sistema completo de validación que te permite definir reglas para tus modelos.

## Validaciones Básicas

NexusData incluye validaciones básicas que puedes aplicar directamente en la definición de tus campos:

```javascript
module.exports = {
  name: 'User',
  fields: {
    id: { type: 'id' },
    username: { 
      type: 'string', 
      required: true,           // Campo obligatorio
      minLength: 3,             // Longitud mínima
      maxLength: 50,            // Longitud máxima
      pattern: '^[a-zA-Z0-9_]+$' // Expresión regular para validación
    },
    email: { 
      type: 'string', 
      required: true,
      format: 'email',          // Formato predefinido
      unique: true              // Valor único en la base de datos
    },
    age: {
      type: 'number',
      min: 18,                  // Valor mínimo
      max: 120,                 // Valor máximo
      integer: true             // Debe ser un número entero
    },
    website: {
      type: 'string',
      format: 'url',            // Validación de URL
      nullable: true            // Puede ser nulo
    },
    role: {
      type: 'string',
      enum: ['admin', 'editor', 'user'], // Valores permitidos
      default: 'user'           // Valor predeterminado
    }
  }
};
```
## Validadores Personalizados
Para lógica de validación más compleja, puedes definir validadores personalizados:

```javascript
module.exports = {
  name: 'Product',
  fields: {
    id: { type: 'id' },
    name: { type: 'string', required: true },
    price: { 
      type: 'number', 
      required: true,
      validate: {
        validator: (value) => value > 0,
        message: 'El precio debe ser mayor que cero'
      }
    },
    discountPrice: { 
      type: 'number', 
      nullable: true,
      validate: {
        validator: function(value, data) {
          // Solo validar si hay un precio con descuento
          if (value === null) return true;
          
          // El precio con descuento debe ser menor que el precio regular
          return value < data.price;
        },
        message: 'El precio con descuento debe ser menor que el precio regular'
      }
    },
    sku: {
      type: 'string',
      validate: {
        // Validador asíncrono (útil para verificaciones en base de datos)
        async validator(value, data, context) {
          // Verificar si el SKU ya existe (excluyendo el producto actual)
          const existingProduct = await context.models.Product.findFirst({
            where: {
              sku: value,
              id: { not: data.id } // Excluir el producto actual en actualizaciones
            }
          });
          
          // Retorna true si no existe un producto con el mismo SKU
          return !existingProduct;
        },
        message: 'Este SKU ya está en uso'
      }
    }
  }
};
```

## Validación Condicional
Puedes aplicar validaciones condicionales basadas en otros campos:

```javascript
module.exports = {
  name: 'Subscription',
  fields: {
    id: { type: 'id' },
    type: { 
      type: 'string', 
      enum: ['free', 'basic', 'premium'], 
      required: true 
    },
    paymentMethod: { 
      type: 'string',
      // Solo requerido si el tipo no es 'free'
      required: function(data) {
        return data.type !== 'free';
      },
      // Mensaje personalizado
      messages: {
        required: 'Se requiere un método de pago para suscripciones de pago'
      }
    },
    cardNumber: {
      type: 'string',
      // Solo validar si el método de pago es 'credit_card'
      validate: {
        validator: function(value, data) {
          // Omitir validación si no aplica
          if (data.paymentMethod !== 'credit_card') return true;
          
          // Validar número de tarjeta (ejemplo simplificado)
          return /^\d{16}$/.test(value);
        },
        message: 'Número de tarjeta inválido'
      }
    }
  }
};
```

## Validación de Relaciones
También puedes validar relaciones entre modelos:

```javascript
module.exports = {
  name: 'Order',
  fields: {
    id: { type: 'id' },
    userId: { type: 'id', required: true },
    items: { 
      type: 'json', 
      required: true,
      // Validar que la orden tenga al menos un item
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'La orden debe tener al menos un item'
      }
    },
    shippingAddressId: { 
      type: 'id',
      // Validación asíncrona para verificar que la dirección pertenezca al usuario
      validate: {
        async validator(value, data, context) {
          if (!value) return true;
          
          const address = await context.models.Address.findUnique({
            where: { id: value }
          });
          
          return address && address.userId === data.userId;
        },
        message: 'La dirección de envío debe pertenecer al usuario'
      }
    }
  }
};
```

## Validación de Objetos Anidados
Para validar estructuras de datos complejas:

```javascript
module.exports = {
  name: 'Product',
  fields: {
    id: { type: 'id' },
    name: { type: 'string', required: true },
    // Validación de objeto anidado
    dimensions: {
      type: 'object',
      fields: {
        width: { 
          type: 'number', 
          required: true,
          min: 0
        },
        height: { 
          type: 'number', 
          required: true,
          min: 0
        },
        depth: { 
          type: 'number', 
          required: true,
          min: 0
        }
      },
      // Validación del objeto completo
      validate: {
        validator: function(value) {
          // Calcular volumen
          const volume = value.width * value.height * value.depth;
          // Verificar que el volumen sea razonable
          return volume <= 1000000; // Ejemplo: máximo 1m³
        },
        message: 'Las dimensiones del producto son demasiado grandes'
      }
    },
    // Validación de array de objetos
    variants: {
      type: 'array',
      of: {
        type: 'object',
        fields: {
          color: { type: 'string', required: true },
          size: { type: 'string', required: true },
          price: { type: 'number', required: true, min: 0 }
        }
      },
      // Validación del array completo
      validate: {
        validator: function(variants) {
          // Verificar que no haya combinaciones duplicadas de color/tamaño
          const combinations = new Set();
          for (const variant of variants) {
            const key = `${variant.color}-${variant.size}`;
            if (combinations.has(key)) return false;
            combinations.add(key);
          }
          return true;
        },
        message: 'No puede haber variantes duplicadas con la misma combinación de color y tamaño'
      }
    }
  }
};
```

## Mensajes de Error Personalizados
Puedes personalizar los mensajes de error para cada validación:

```javascript
module.exports = {
  name: 'User',
  fields: {
    id: { type: 'id' },
    username: { 
      type: 'string', 
      required: true,
      minLength: 3,
      maxLength: 50,
      // Mensajes personalizados para cada validación
      messages: {
        required: 'El nombre de usuario es obligatorio',
        minLength: 'El nombre de usuario debe tener al menos 3 caracteres',
        maxLength: 'El nombre de usuario no puede exceder los 50 caracteres'
      }
    },
    email: { 
      type: 'string', 
      required: true,
      format: 'email',
      messages: {
        required: 'El correo electrónico es obligatorio',
        format: 'Por favor, introduce un correo electrónico válido'
      }
    }
  }
};
```

## Validación a Nivel de Modelo
Además de validar campos individuales, puedes definir validaciones a nivel de modelo:

```javascript
module.exports = {
  name: 'Reservation',
  fields: {
    id: { type: 'id' },
    startDate: { type: 'date', required: true },
    endDate: { type: 'date', required: true },
    roomId: { type: 'id', required: true },
    guestCount: { type: 'integer', required: true, min: 1 }
  },
  // Validaciones a nivel de modelo
  validate: [
    {
      // Validar que la fecha de fin sea posterior a la de inicio
      validator: function(data) {
        return new Date(data.endDate) > new Date(data.startDate);
      },
      message: 'La fecha de salida debe ser posterior a la fecha de entrada'
    },
    {
      // Validación asíncrona para verificar disponibilidad
      async validator(data, context) {
        // Omitir en actualizaciones donde no cambian las fechas o habitación
        if (data.id) {
          const existing = await context.models.Reservation.findUnique({
            where: { id: data.id }
          });
          
          if (existing && 
              existing.startDate === data.startDate && 
              existing.endDate === data.endDate &&
              existing.roomId === data.roomId) {
            return true;
          }
        }
        
        // Verificar si hay reservas que se solapan
        const overlapping = await context.models.Reservation.findFirst({
          where: {
            roomId: data.roomId,
            id: { not: data.id }, // Excluir la reserva actual en actualizaciones
            OR: [
              {
                // Caso 1: La nueva reserva comienza durante una existente
                startDate: { lte: data.startDate },
                endDate: { gte: data.startDate }
              },
              {
                // Caso 2: La nueva reserva termina durante una existente
                startDate: { lte: data.endDate },
                endDate: { gte: data.endDate }
              },
              {
                // Caso 3: La nueva reserva engloba completamente una existente
                startDate: { gte: data.startDate },
                endDate: { lte: data.endDate }
              }
            ]
          }
        });
        
        return !
```