---
sidebar_position: 1
---

# Esquemas de Datos

Los esquemas son la base del modelado de datos en NexusData. Definen la estructura, tipos y comportamientos de tus modelos.

## Definición de Esquemas

Un esquema en NexusData se define como un objeto JavaScript que especifica los campos, tipos, y propiedades de un modelo:

```javascript
module.exports = {
  name: 'Product',
  fields: {
    id: { type: 'id' },
    name: { type: 'string', required: true },
    description: { type: 'text', nullable: true },
    price: { type: 'number', min: 0 },
    category: { type: 'string', enum: ['Electronics', 'Clothing', 'Food'] },
    isAvailable: { type: 'boolean', default: true },
    createdAt: { type: 'datetime', default: 'now()' },
    updatedAt: { type: 'datetime', default: 'now()', onUpdate: 'now()' }
  }
};
```
## Tipos de Datos Principales
NexusData proporciona una amplia variedad de tipos de datos nativos:

| **Tipo**     | **Descripción**                        | **Ejemplo**                                                                 |
|--------------|----------------------------------------|-----------------------------------------------------------------------------|
| `string`     | Texto de cualquier longitud            | `name: { type: 'string' }`                                                 |
| `text`       | Texto largo optimizado                 | `description: { type: 'text' }`                                            |
| `number`     | Valores numéricos (enteros o decimales)| `price: { type: 'number' }`                                                |
| `integer`    | Valores numéricos enteros              | `quantity: { type: 'integer' }`                                            |
| `boolean`    | Valores verdadero/falso                | `active: { type: 'boolean' }`                                              |
| `date`       | Fecha sin hora                         | `birthDate: { type: 'date' }`                                              |
| `datetime`   | Fecha con hora                         | `createdAt: { type: 'datetime' }`                                          |
| `time`       | Solo hora                              | `openingTime: { type: 'time' }`                                            |
| `id`         | Identificador único                    | `id: { type: 'id' }`                                                       |
| `uuid`       | UUID v4                                | `id: { type: 'uuid' }`                                                     |
| `email`      | Correo electrónico con validación      | `email: { type: 'email' }`                                                 |
| `url`        | URL con validación                     | `website: { type: 'url' }`                                                 |
| `json`       | Datos JSON                             | `metadata: { type: 'json' }`                                               |
| `enum`       | Valores de una lista predefinida       | `status: { type: 'enum', values: ['draft', 'published'] }`                |

## Propiedades Comunes
Cada campo puede tener varias propiedades que definen su comportamiento:

```javascript
module.exports = {
  name: 'User',
  fields: {
    id: { 
      type: 'id',
      primary: true,           // Clave primaria
      autoIncrement: true      // Auto-incremento
    },
    username: { 
      type: 'string',
      required: true,          // Campo obligatorio
      unique: true,            // Valor único
      minLength: 3,            // Longitud mínima
      maxLength: 50            // Longitud máxima
    },
    email: { 
      type: 'string',
      unique: true,
      index: true              // Crear índice para búsquedas rápidas
    },
    role: { 
      type: 'string',
      enum: ['admin', 'user', 'guest'],  // Valores permitidos
      default: 'user'          // Valor predeterminado
    },
    profile: { 
      type: 'json',
      nullable: true           // Puede ser nulo
    },
    password: { 
      type: 'string',
      private: true            // No se expone en API
    },
    lastLogin: { 
      type: 'datetime',
      nullable: true,
      onUpdate: 'now()'        // Actualizar automáticamente
    }
  }
};
```
## Esquemas Anidados
Puedes definir estructuras de datos complejas utilizando esquemas anidados:

```javascript
module.exports = {
  name: 'Order',
  fields: {
    id: { type: 'id' },
    customer: { 
      type: 'object',          // Objeto anidado
      fields: {
        name: { type: 'string', required: true },
        email: { type: 'string', required: true },
        phone: { type: 'string', nullable: true }
      }
    },
    items: { 
      type: 'array',           // Array de objetos
      of: {
        type: 'object',
        fields: {
          productId: { type: 'id', required: true },
          quantity: { type: 'integer', min: 1, default: 1 },
          price: { type: 'number', required: true }
        }
      }
    },
    shippingAddress: {
      type: 'object',
      fields: {
        street: { type: 'string', required: true },
        city: { type: 'string', required: true },
        state: { type: 'string', required: true },
        zipCode: { type: 'string', required: true },
        country: { type: 'string', required: true }
      }
    }
  }
};
```

## Herencia de Esquemas
NexusData permite la herencia de esquemas para reutilizar definiciones comunes:

```javascript
// Base model con campos comunes
const BaseModel = {
  fields: {
    id: { type: 'id' },
    createdAt: { type: 'datetime', default: 'now()' },
    updatedAt: { type: 'datetime', default: 'now()', onUpdate: 'now()' }
  }
};

// Modelo que extiende el base
module.exports = {
  name: 'Article',
  extends: BaseModel,
  fields: {
    title: { type: 'string', required: true },
    content: { type: 'text', required: true },
    authorId: { type: 'id', required: true }
    // Hereda automáticamente id, createdAt y updatedAt
  }
};
```

## Esquemas Dinámicos
Para casos de uso avanzados, puedes generar esquemas dinámicamente:

```javascript
// Generador de esquema basado en configuración
function createProductSchema(config) {
  const fields = {
    id: { type: 'id' },
    name: { type: 'string', required: true },
    price: { type: 'number', required: true }
  };
  
  // Añadir campos según configuración
  if (config.withInventory) {
    fields.stock = { type: 'integer', default: 0 };
    fields.sku = { type: 'string', unique: true };
  }
  
  if (config.withCategories) {
    fields.categoryId = { type: 'id', nullable: true };
    fields.tags = { type: 'array', of: { type: 'string' } };
  }
  
  return {
    name: 'Product',
    fields
  };
}

// Uso
module.exports = createProductSchema({
  withInventory: true,
  withCategories: true
});
```

## Mejores Prácticas
1. **Nombres descriptivos** : Usa nombres claros y descriptivos para tus modelos y campos.
2. **Consistencia** : Mantén una convención de nomenclatura consistente (camelCase o snake_case).
3. **Validación** : Define validaciones para garantizar la integridad de los datos.
4. **Documentación** : Documenta el propósito de cada campo con comentarios.
5. **Normalización** : Evita la duplicación de datos siguiendo principios de normalización.
6. **Índices** : Crea índices para campos que se utilizan frecuentemente en consultas.
## Próximos Pasos
- Explora cómo definir relaciones entre modelos
- Aprende sobre validación avanzada
- Implementa hooks y middleware para extender la funcionalidad