---
sidebar_position: 2
---

# Relaciones entre Modelos

Las relaciones son una parte fundamental del modelado de datos en NexusData, permitiendo conectar diferentes entidades y realizar consultas eficientes.

## Tipos de Relaciones

NexusData soporta los siguientes tipos de relaciones:

1. **Uno a Uno (One-to-One)**
2. **Uno a Muchos (One-to-Many)**
3. **Muchos a Uno (Many-to-One)**
4. **Muchos a Muchos (Many-to-Many)**

## Relaciones Uno a Uno

Una relación uno a uno conecta una instancia de un modelo con exactamente una instancia de otro modelo.

### Ejemplo: Usuario y Perfil

```javascript
// Modelo User
module.exports = {
  name: 'User',
  fields: {
    id: { type: 'id' },
    email: { type: 'string', unique: true },
    // Relación uno a uno con Profile
    profile: { 
      type: 'relation', 
      model: 'Profile', 
      foreignKey: 'userId',
      relation: 'hasOne'
    }
  }
};

// Modelo Profile
module.exports = {
  name: 'Profile',
  fields: {
    id: { type: 'id' },
    userId: { type: 'id', unique: true }, // Garantiza relación uno a uno
    bio: { type: 'text', nullable: true },
    avatarUrl: { type: 'string', nullable: true },
    // Relación inversa con User
    user: { 
      type: 'relation', 
      model: 'User', 
      localKey: 'userId',
      relation: 'belongsTo'
    }
  }
};
```
## Relaciones Uno a Muchos / Muchos a Uno
Una relación uno a muchos conecta una instancia de un modelo con múltiples instancias de otro modelo.

### Ejemplo: Autor y Artículos
```javascript
// Modelo Author
module.exports = {
  name: 'Author',
  fields: {
    id: { type: 'id' },
    name: { type: 'string', required: true },
    // Relación uno a muchos con Article
    articles: { 
      type: 'relation', 
      model: 'Article', 
      foreignKey: 'authorId',
      relation: 'hasMany'
    }
  }
};

// Modelo Article
module.exports = {
  name: 'Article',
  fields: {
    id: { type: 'id' },
    title: { type: 'string', required: true },
    content: { type: 'text', required: true },
    authorId: { type: 'id', required: true },
    // Relación muchos a uno con Author
    author: { 
      type: 'relation', 
      model: 'Author', 
      localKey: 'authorId',
      relation: 'belongsTo'
    }
  }
};
```

## Relaciones Muchos a Muchos
Una relación muchos a muchos conecta múltiples instancias de un modelo con múltiples instancias de otro modelo, utilizando una tabla de unión.

### Ejemplo: Productos y Categorías
```javascript
// Modelo Product
module.exports = {
  name: 'Product',
  fields: {
    id: { type: 'id' },
    name: { type: 'string', required: true },
    price: { type: 'number', required: true },
    // Relación muchos a muchos con Category
    categories: { 
      type: 'relation', 
      model: 'Category', 
      through: 'ProductCategory',
      foreignKey: 'productId',
      otherKey: 'categoryId',
      relation: 'belongsToMany'
    }
  }
};

// Modelo Category
module.exports = {
  name: 'Category',
  fields: {
    id: { type: 'id' },
    name: { type: 'string', required: true },
    // Relación muchos a muchos con Product
    products: { 
      type: 'relation', 
      model: 'Product', 
      through: 'ProductCategory',
      foreignKey: 'categoryId',
      otherKey: 'productId',
      relation: 'belongsToMany'
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
    featured: { type: 'boolean', default: false },
    sortOrder: { type: 'integer', default: 0 }
  },
  indexes: [
    // Índice compuesto para garantizar unicidad
    { fields: ['productId', 'categoryId'], unique: true }
  ]
};
```

## Relaciones Polimórficas
Las relaciones polimórficas permiten que un modelo se relacione con múltiples tipos de modelos.

### Ejemplo: Comentarios en diferentes entidades
```javascript
// Modelo Comment (puede pertenecer a un Post o a un Product)
module.exports = {
  name: 'Comment',
  fields: {
    id: { type: 'id' },
    content: { type: 'text', required: true },
    // Campos para relación polimórfica
    commentableId: { type: 'id', required: true },
    commentableType: { type: 'string', required: true }, // 'Post' o 'Product'
    // Relación polimórfica
    commentable: { 
      type: 'relation', 
      polymorphic: true,
      morphType: 'commentableType',
      morphId: 'commentableId'
    }
  }
};

// Modelo Post
module.exports = {
  name: 'Post',
  fields: {
    id: { type: 'id' },
    title: { type: 'string', required: true },
    // Relación polimórfica inversa
    comments: { 
      type: 'relation', 
      model: 'Comment',
      polymorphic: true,
      as: 'commentable',
      relation: 'morphMany'
    }
  }
};

// Modelo Product
module.exports = {
  name: 'Product',
  fields: {
    id: { type: 'id' },
    name: { type: 'string', required: true },
    // Relación polimórfica inversa
    comments: { 
      type: 'relation', 
      model: 'Comment',
      polymorphic: true,
      as: 'commentable',
      relation: 'morphMany'
    }
  }
};
```

## Relaciones Recursivas
Las relaciones recursivas permiten que un modelo se relacione consigo mismo.

### Ejemplo: Estructura jerárquica de categorías
```javascript
// Modelo Category con relación recursiva
module.exports = {
  name: 'Category',
  fields: {
    id: { type: 'id' },
    name: { type: 'string', required: true },
    parentId: { type: 'id', nullable: true },
    // Relación con categoría padre
    parent: { 
      type: 'relation', 
      model: 'Category', 
      localKey: 'parentId',
      relation: 'belongsTo'
    },
    // Relación con categorías hijas
    children: { 
      type: 'relation', 
      model: 'Category', 
      foreignKey: 'parentId',
      relation: 'hasMany'
    }
  }
};
```

## Opciones de Relaciones
NexusData proporciona varias opciones para personalizar el comportamiento de las relaciones:

```javascript
module.exports = {
  name: 'Post',
  fields: {
    id: { type: 'id' },
    title: { type: 'string', required: true },
    // Relación con opciones avanzadas
    comments: { 
      type: 'relation', 
      model: 'Comment', 
      foreignKey: 'postId',
      relation: 'hasMany',
      // Opciones adicionales
      query: {
        // Filtro predeterminado
        where: { isApproved: true },
        // Ordenamiento predeterminado
        orderBy: { createdAt: 'desc' },
        // Límite predeterminado
        limit: 10
      },
      // Comportamiento en cascada
      onDelete: 'CASCADE', // Eliminar comentarios cuando se elimina el post
      // Carga automática (eager loading)
      autoFetch: true
    }
  }
};
```

## Consultas con Relaciones
NexusData facilita las consultas que involucran relaciones:

### Carga de Relaciones (Eager Loading)
```javascript
// Obtener todos los posts con sus comentarios
const posts = await nexus.models.Post.findMany({
  include: {
    comments: true
  }
});

// Carga profunda de relaciones anidadas
const authors = await nexus.models.Author.findMany({
  include: {
    posts: {
      include: {
        comments: {
          include: {
            user: true
          }
        },
        categories: true
      }
    }
  }
});
```

### Filtrado por Relaciones
```javascript
// Encontrar todos los posts que tengan al menos un comentario
const postsWithComments = await nexus.models.Post.findMany({
  where: {
    comments: {
      some: {
        content: {
          contains: 'great'
        }
      }
    }
  }
});

// Encontrar productos en múltiples categorías
const products = await nexus.models.Product.findMany({
  where: {
    categories: {
      some: {
        name: {
          in: ['Electronics', 'Gadgets']
        }
      }
    }
  }
});
```

## Mejores Prácticas
1. Nombres claros : Usa nombres descriptivos para tus relaciones.
2. Índices : Crea índices en las claves foráneas para mejorar el rendimiento.
3. Integridad referencial : Configura acciones en cascada apropiadas (onDelete, onUpdate).
4. Carga selectiva : Evita cargar relaciones innecesarias para mejorar el rendimiento.
5. Normalización : Diseña tus relaciones siguiendo principios de normalización de bases de datos.
## Próximos Pasos
- Aprende sobre validación de datos
- Explora consultas avanzadas con GraphQL
- Implementa lógica de negocio utilizando hooks y middleware