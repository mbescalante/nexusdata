---
sidebar_position: 5
---

# Estructura de Datos

NexusData API proporciona un sistema robusto para modelar tus datos de manera eficiente y flexible.

## Conceptos Básicos

El modelado de datos en NexusData se basa en esquemas declarativos que definen:
- La estructura de tus datos
- Las relaciones entre diferentes modelos
- Las validaciones y restricciones
- Los comportamientos personalizados

## Definiendo un Modelo

```javascript
module.exports = {
  name: 'User',
  fields: {
    id: { type: 'id' },
    username: { type: 'string', required: true },
    email: { type: 'string', unique: true },
    createdAt: { type: 'datetime', default: 'now()' }
  }
};
```
### Tipos de Datos Soportados

NexusData soporta una amplia variedad de tipos de datos para adaptarse a tus necesidades:

- **string** : Para texto y cadenas de caracteres
- **number** : Para valores numéricos (enteros y decimales)
- **boolean** : Para valores verdadero/falso
- **date** : Para fechas sin información de hora
- **datetime** : Para fechas con información de hora
- **id** : Identificador único, generalmente UUID o autoincremental
- **json** : Para almacenar objetos JSON complejos

#### Ejemplo con Varios Tipos

```javascript
module.exports = {
  name: 'Product',
  fields: {
    id: { type: 'id' },
    name: { type: 'string', required: true },
    price: { type: 'number', min: 0 },
    isAvailable: { type: 'boolean', default: true },
    releaseDate: { type: 'date' },
    metadata: { type: 'json' }
  }
};
```
## Relaciones entre Modelos

NexusData permite definir relaciones entre modelos de forma sencilla:

### Relaciones de Uno a Muchos

```javascript
// Modelo User
module.exports = {
  name: 'User',
  fields: {
    id: { type: 'id' },
    username: { type: 'string', required: true },
    // Relación uno a muchos (un usuario tiene muchos posts)
    posts: { type: 'relation', model: 'Post', foreignKey: 'authorId' }
  }
};

// Modelo Post
module.exports = {
  name: 'Post',
  fields: {
    id: { type: 'id' },
    title: { type: 'string', required: true },
    content: { type: 'string' },
    // Relación muchos a uno (muchos posts pertenecen a un usuario)
    authorId: { type: 'id', required: true },
    author: { type: 'relation', model: 'User', localKey: 'authorId' }
  }
};
```
### Relaciones de Muchos a Muchos

```javascript
// Modelo Product
module.exports = {
  name: 'Product',
  fields: {
    id: { type: 'id' },
    name: { type: 'string', required: true },
    // Relación muchos a muchos (un producto tiene muchas categorías)
    categories: { 
      type: 'relation', 
      model: 'Category', 
      through: 'ProductCategory',
      foreignKey: 'productId',
      otherKey: 'categoryId'
    }
  }
};

// Modelo Category
module.exports = {
  name: 'Category',
  fields: {
    id: { type: 'id' },
    name: { type: 'string', required: true },
    // Relación muchos a muchos (una categoría tiene muchos productos)
    products: { 
      type: 'relation', 
      model: 'Product', 
      through: 'ProductCategory',
      foreignKey: 'categoryId',
      otherKey: 'productId'
    }
  }
};

// Modelo de unión (tabla pivote)
module.exports = {
  name: 'ProductCategory',
  fields: {
    id: { type: 'id' },
    productId: { type: 'id', required: true },
    categoryId: { type: 'id', required: true },
    // Campos adicionales si es necesario
    featured: { type: 'boolean', default: false }
  }
};
```
## Validaciones y Restricciones

NexusData ofrece un sistema completo de validaciones para garantizar la integridad de tus datos:

#### Validaciones de Basicas

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
      pattern: '^[a-zA-Z0-9_]+$' // Solo alfanuméricos y guiones bajos
    },
    email: { 
      type: 'string', 
      required: true,
      unique: true,
      format: 'email' // Validación de formato de email
    },
    age: {
      type: 'number',
      min: 18,
      max: 120
    },
    website: {
      type: 'string',
      format: 'url', // Validación de URL
      nullable: true // Puede ser nulo
    }
  }
};
```

#### Validaciones Personalizadas

```javascript
module.exports = {
  name: 'Order',
  fields: {
    id: { type: 'id' },
    items: { type: 'json', required: true },
    totalAmount: { 
      type: 'number', 
      required: true,
      validate: {
        validator: function(value, data) {
          // Calcular la suma de los precios de los items
          const calculatedTotal = data.items.reduce(
            (sum, item) => sum + (item.price * item.quantity), 
            0
          );
          // Verificar que el total coincida con la suma
          return Math.abs(value - calculatedTotal) < 0.01; // Permitir pequeñas diferencias por redondeo
        },
        message: 'El monto total no coincide con la suma de los items'
      }
    }
  }
};
```
## Indices y Rendimiento

Optimiza el rendimiento de tus consultas definiendo índices:

```javascript
module.exports = {
  name: 'Product',
  fields: {
    id: { type: 'id' },
    name: { type: 'string', required: true },
    price: { type: 'number' },
    categoryId: { type: 'id' },
    tags: { type: 'json' }
  },
  indexes: [
    // Índice simple
    { fields: ['name'] },
    // Índice compuesto
    { fields: ['categoryId', 'price'] },
    // Índice único
    { fields: ['sku'], unique: true },
    // Índice parcial (solo para productos activos)
    { 
      fields: ['tags'],
      where: { isActive: true },
      type: 'json' // Índice para campo JSON
    }
  ]
};
```
## Hooks y Midleware

Extiende la funcionalidad de tus modelos con hooks que se ejecutan en diferentes momentos del ciclo de vida:

```javascript
module.exports = {
  name: 'User',
  fields: {
    id: { type: 'id' },
    username: { type: 'string', required: true },
    email: { type: 'string', unique: true },
    password: { type: 'string', private: true }, // Campo privado, no expuesto en API
    lastLogin: { type: 'datetime', nullable: true }
  },
  hooks: {
    // Se ejecuta antes de crear un registro
    beforeCreate: async (data, context) => {
      // Hashear contraseña antes de guardar
      if (data.password) {
        data.password = await context.services.auth.hashPassword(data.password);
      }
      return data;
    },
    
    // Se ejecuta después de crear un registro
    afterCreate: async (record, context) => {
      // Enviar email de bienvenida
      await context.services.email.send({
        to: record.email,
        subject: 'Bienvenido a nuestra plataforma',
        template: 'welcome'
      });
      return record;
    },
    
    // Se ejecuta antes de actualizar un registro
    beforeUpdate: async (data, context) => {
      // Si se actualiza la contraseña, hashearla
      if (data.password) {
        data.password = await context.services.auth.hashPassword(data.password);
      }
      return data;
    }
  }
};
```
## Herencia y Composición

NexusData permite crear modelos más complejos mediante herencia y composición:

#### Herencia de Modelos

```javascript
// Modelo base
const BaseModel = {
  fields: {
    id: { type: 'id' },
    createdAt: { type: 'datetime', default: 'now()' },
    updatedAt: { type: 'datetime', default: 'now()', onUpdate: 'now()' }
  }
};

// Modelo que hereda del base
module.exports = {
  name: 'Product',
  extends: BaseModel,
  fields: {
    name: { type: 'string', required: true },
    price: { type: 'number', required: true }
    // Hereda automáticamente id, createdAt y updatedAt
  }
};
```
## Migraciones y Versionado

NexusData facilita la evolución de tus modelos con un sistema de migraciones:

```javascript
// migrations/001_initial_schema.js
module.exports = {
  up: async (db) => {
    await db.createTable('users', {
      id: { type: 'id' },
      username: { type: 'string', required: true },
      email: { type: 'string', unique: true },
      createdAt: { type: 'datetime', default: 'now()' }
    });
    
    await db.createTable('posts', {
      id: { type: 'id' },
      title: { type: 'string', required: true },
      content: { type: 'text' },
      authorId: { type: 'id', references: { table: 'users', field: 'id' } },
      createdAt: { type: 'datetime', default: 'now()' }
    });
  },
  
  down: async (db) => {
    await db.dropTable('posts');
    await db.dropTable('users');
  }
};
```