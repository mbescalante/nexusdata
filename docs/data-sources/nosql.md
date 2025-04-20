---
sidebar_position: 3
title: NoSQL
description: Configuración y uso de bases de datos NoSQL como fuentes de datos en NexusData
---

# NoSQL

NexusData proporciona soporte completo para bases de datos NoSQL, permitiéndote aprovechar la flexibilidad y escalabilidad de estos sistemas para tus aplicaciones.

## Bases de Datos Soportadas

NexusData soporta las siguientes bases de datos NoSQL:

- **MongoDB** (4.0+)
- **DynamoDB** (AWS)
- **Cassandra** (3.0+)
- **Redis** (5.0+)
- **Elasticsearch** (7.0+)
- **Firebase Firestore**
- **CouchDB** (3.0+)

## Configuración de Conexión

### MongoDB

```javascript
// config/datasources.js
module.exports = {
  datasources: {
    mongodb: {
      type: 'mongodb',
      host: 'localhost',
      port: 27017,
      database: 'mi_base_de_datos',
      username: 'usuario',
      password: 'contraseña',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        authSource: 'admin'
      }
    }
  }
};
```

#### Conexión con URI

```javascript
mongodb: {
  type: 'mongodb',
  uri: 'mongodb://usuario:contraseña@localhost:27017/mi_base_de_datos?authSource=admin',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
}
```

#### Opciones Avanzadas

```javascript
mongodb: {
  type: 'mongodb',
  uri: 'mongodb://localhost:27017/mi_base_de_datos',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    maxPoolSize: 50,
    minPoolSize: 5,
    maxIdleTimeMS: 120000,
    replicaSet: 'rs0',
    readPreference: 'secondaryPreferred',
    ssl: true,
    retryWrites: true,
    w: 'majority',
    wtimeoutMS: 2500
  }
}
```

### DynamoDB

```javascript
dynamodb: {
  type: 'dynamodb',
  region: 'us-east-1',
  accessKeyId: 'TU_ACCESS_KEY',
  secretAccessKey: 'TU_SECRET_KEY',
  options: {
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    apiVersion: '2012-08-10',
    maxRetries: 3
  }
}
```

#### Uso de Credenciales del Sistema

```javascript
dynamodb: {
  type: 'dynamodb',
  region: 'us-east-1',
  // AWS SDK utilizará automáticamente las credenciales del sistema
  options: {
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com'
  }
}
```

### Redis

```javascript
redis: {
  type: 'redis',
  host: 'localhost',
  port: 6379,
  password: 'contraseña',
  database: 0,
  options: {
    connectTimeout: 10000,
    retryStrategy: (times) => Math.min(times * 50, 2000)
  }
}
```

#### Conexión a Cluster

```javascript
redisCluster: {
  type: 'redis',
  cluster: true,
  nodes: [
    { host: 'redis-node1', port: 6379 },
    { host: 'redis-node2', port: 6379 },
    { host: 'redis-node3', port: 6379 }
  ],
  options: {
    redisOptions: {
      password: 'contraseña'
    },
    scaleReads: 'all',
    maxRedirections: 16
  }
}
```

### Elasticsearch

```javascript
elasticsearch: {
  type: 'elasticsearch',
  node: 'http://localhost:9200',
  auth: {
    username: 'usuario',
    password: 'contraseña'
  },
  options: {
    ssl: {
      rejectUnauthorized: false
    },
    maxRetries: 3,
    requestTimeout: 30000
  }
}
```

#### Múltiples Nodos

```javascript
elasticsearch: {
  type: 'elasticsearch',
  nodes: [
    'http://es-node1:9200',
    'http://es-node2:9200',
    'http://es-node3:9200'
  ],
  auth: {
    username: 'usuario',
    password: 'contraseña'
  }
}
```

### Firebase Firestore

```javascript
firestore: {
  type: 'firestore',
  projectId: 'mi-proyecto-firebase',
  credentials: {
    client_email: 'firebase-adminsdk@mi-proyecto.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n'
  },
  options: {
    databaseURL: 'https://mi-proyecto.firebaseio.com'
  }
}
```

#### Uso de Archivo de Credenciales

```javascript
firestore: {
  type: 'firestore',
  projectId: 'mi-proyecto-firebase',
  credentialsPath: './config/firebase-credentials.json',
  options: {
    databaseURL: 'https://mi-proyecto.firebaseio.com'
  }
}
```

## Modelado de Datos

### MongoDB

```javascript
// models/Producto.js
module.exports = {
  name: 'Producto',
  datasource: 'mongodb',
  collection: 'productos', // Nombre de la colección
  schema: {
    _id: {
      type: 'objectId',
      primaryKey: true,
      auto: true
    },
    nombre: {
      type: 'string',
      required: true,
      index: true
    },
    precio: {
      type: 'number',
      required: true,
      min: 0
    },
    descripcion: {
      type: 'string'
    },
    categorias: {
      type: 'array',
      items: {
        type: 'string'
      },
      index: true
    },
    atributos: {
      type: 'object'
    },
    activo: {
      type: 'boolean',
      default: true
    },
    createdAt: {
      type: 'date',
      default: () => new Date()
    },
    updatedAt: {
      type: 'date',
      default: () => new Date(),
      onUpdate: () => new Date()
    }
  },
  indexes: [
    {
      name: 'idx_producto_nombre_precio',
      fields: { nombre: 1, precio: -1 }
    },
    {
      name: 'idx_producto_texto',
      fields: { '$**': 'text' }
    }
  ]
};
```

### DynamoDB

```javascript
// models/Usuario.js
module.exports = {
  name: 'Usuario',
  datasource: 'dynamodb',
  tableName: 'usuarios',
  schema: {
    id: {
      type: 'string',
      primaryKey: true,
      hashKey: true // Clave de partición
    },
    email: {
      type: 'string',
      required: true,
      unique: true
    },
    nombre: {
      type: 'string',
      required: true
    },
    createdAt: {
      type: 'date',
      default: () => new Date(),
      sortKey: true // Clave de ordenación
    },
    ultimoAcceso: {
      type: 'date'
    },
    configuracion: {
      type: 'map' // Tipo de dato Map en DynamoDB
    },
    roles: {
      type: 'list', // Tipo de dato List en DynamoDB
      items: {
        type: 'string'
      }
    }
  },
  indexes: [
    {
      name: 'EmailIndex',
      type: 'global',
      hashKey: 'email',
      projection: {
        type: 'all'
      }
    }
  ]
};
```

### Elasticsearch

```javascript
// models/Articulo.js
module.exports = {
  name: 'Articulo',
  datasource: 'elasticsearch',
  index: 'articulos',
  schema: {
    id: {
      type: 'keyword',
      primaryKey: true
    },
    titulo: {
      type: 'text',
      fields: {
        keyword: {
          type: 'keyword'
        }
      }
    },
    contenido: {
      type: 'text',
      analyzer: 'spanish'
    },
    autor: {
      type: 'keyword'
    },
    tags: {
      type: 'keyword'
    },
    fechaPublicacion: {
      type: 'date'
    },
    puntuacion: {
      type: 'float'
    },
    publicado: {
      type: 'boolean',
      default: false
    }
  },
  settings: {
    number_of_shards: 3,
    number_of_replicas: 1,
    analysis: {
      analyzer: {
        spanish: {
          type: 'spanish'
        }
      }
    }
  }
};
```

## Operaciones CRUD

### MongoDB

```javascript
// services/ProductoService.js
module.exports = {
  async crearProducto(datos) {
    return await this.app.models.Producto.create(datos);
  },
  
  async obtenerProducto(id) {
    return await this.app.models.Producto.findById(id);
  },
  
  async buscarProductos(filtros = {}) {
    const { nombre, categorias, precioMin, precioMax, ordenar, pagina = 1, limite = 20 } = filtros;
    
    const query = {};
    
    if (nombre) {
      query.nombre = { $regex: nombre, $options: 'i' };
    }
    
    if (categorias && categorias.length > 0) {
      query.categorias = { $in: Array.isArray(categorias) ? categorias : [categorias] };
    }
    
    if (precioMin !== undefined || precioMax !== undefined) {
      query.precio = {};
      
      if (precioMin !== undefined) {
        query.precio.$gte = precioMin;
      }
      
      if (precioMax !== undefined) {
        query.precio.$lte = precioMax;
      }
    }
    
    const options = {
      skip: (pagina - 1) * limite,
      limit: limite
    };
    
    if (ordenar) {
      const [campo, direccion] = ordenar.split(':');
      options.sort = { [campo]: direccion === 'desc' ? -1 : 1 };
    } else {
      options.sort = { createdAt: -1 };
    }
    
    const [items, total] = await Promise.all([
      this.app.models.Producto.find(query, options),
      this.app.models.Producto.count(query)
    ]);
    
    return {
      items,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite)
    };
  },
  
  async actualizarProducto(id, datos) {
    return await this.app.models.Producto.updateById(id, datos);
  },
  
  async eliminarProducto(id) {
    return await this.app.models.Producto.deleteById(id);
  },
  
  async busquedaTexto(texto) {
    return await this.app.models.Producto.find({
      $text: { $search: texto }
    }, {
      score: { $meta: 'textScore' },
      sort: { score: { $meta: 'textScore' } }
    });
  }
};
```

### DynamoDB

```javascript
// services/UsuarioService.js
module.exports = {
  async crearUsuario(datos) {
    return await this.app.models.Usuario.create({
      id: this.app.utils.generateId(),
      ...datos,
      createdAt: new Date()
    });
  },
  
  async obtenerUsuario(id) {
    return await this.app.models.Usuario.get({ id });
  },
  
  async obtenerUsuarioPorEmail(email) {
    const result = await this.app.models.Usuario.query({
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    });
    
    return result.Items[0];
  },
  
  async actualizarUsuario(id, datos) {
    // Construir expresiones de actualización
    const updates = {};
    const values = {};
    const names = {};
    
    Object.entries(datos).forEach(([key, value], index) => {
      if (key !== 'id' && key !== 'createdAt') {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        
        updates[attrName] = attrValue;
        values[attrValue] = value;
        names[attrName] = key;
      }
    });
    
    const updateExpression = 'SET ' + Object.entries(updates)
      .map(([name, value]) => `${name} = ${value}`)
      .join(', ');
    
    return await this.app.models.Usuario.update({
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW'
    });
  },
  
  async eliminarUsuario(id) {
    return await this.app.models.Usuario.delete({ id });
  },
  
  async listarUsuarios(opciones = {}) {
    const { limite, ultimaClave } = opciones;
    
    const params = {};
    
    if (limite) {
      params.Limit = limite;
    }
    
    if (ultimaClave) {
      params.ExclusiveStartKey = ultimaClave;
    }
    
    const result = await this.app.models.Usuario.scan(params);
    
    return {
      items: result.Items,
      ultimaClave: result.LastEvaluatedKey
    };
  }
};
```

### Elasticsearch

```javascript
// services/ArticuloService.js
module.exports = {
  async crearArticulo(datos) {
    const id = datos.id || this.app.utils.generateId();
    
    await this.app.models.Articulo.index({
      id,
      ...datos,
      fechaPublicacion: datos.fechaPublicacion || new Date()
    });
    
    return await this.app.models.Articulo.get({ id });
  },
  
  async obtenerArticulo(id) {
    return await this.app.models.Articulo.get({ id });
  },
  
  async buscarArticulos(opciones = {}) {
    const {
      texto,
      autor,
      tags,
      fechaDesde,
      fechaHasta,
      publicado = true,
      ordenar = 'fechaPublicacion:desc',
      pagina = 1,
      limite = 20
    } = opciones;
    
    const query = {
      bool: {
        must: [],
        filter: []
      }
    };
    
    // Filtro por texto
    if (texto) {
      query.bool.must.push({
        multi_match: {
          query: texto,
          fields: ['titulo^3', 'contenido'],
          type: 'best_fields'
        }
      });
    }
    
    // Filtro por autor
    if (autor) {
      query.bool.filter.push({
        term: { autor }
      });
    }
    
    // Filtro por tags
    if (tags && tags.length > 0) {
      query.bool.filter.push({
        terms: { tags: Array.isArray(tags) ? tags : [tags] }
      });
    }
    
    // Filtro por fecha
    if (fechaDesde || fechaHasta) {
      const rangeFilter = {
        range: {
          fechaPublicacion: {}
        }
      };
      
      if (fechaDesde) {
        rangeFilter.range.fechaPublicacion.gte = fechaDesde;
      }
      
      if (fechaHasta) {
        rangeFilter.range.fechaPublicacion.lte = fechaHasta;
      }
      
      query.bool.filter.push(rangeFilter);
    }
    
    // Filtro por estado de publicación
    query.bool.filter.push({
      term: { publicado }
    });
    
    // Ordenamiento
    const [campo, direccion] = ordenar.split(':');
    
    const result = await this.app.models.Articulo.search({
      from: (pagina - 1) * limite,
      size: limite,
      query,
      sort: [
        { [campo]: { order: direccion || 'desc' } }
      ],
      highlight: {
        fields: {
          titulo: {},
          contenido: {
            fragment_size: 150,
            number_of_fragments: 3
          }
        }
      }
    });
    
    return {
      items: result.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score,
        highlight: hit.highlight
      })),
      total: result.hits.total.value,
      pagina,
      limite,
      totalPaginas: Math.ceil(result.hits.total.value / limite)
    };
  },
  
  async actualizarArticulo(id, datos) {
    await this.app.models.Articulo.update({
      id,
      doc: datos
    });
    
    return await this.app.models.Articulo.get({ id });
  },
  
  async eliminarArticulo(id) {
    return await this.app.models.Articulo.delete({ id });
  }
};
```

## Consultas Avanzadas

### MongoDB - Agregaciones

```javascript
// services/ReporteService.js
module.exports = {
  async ventasPorCategoria(fechaInicio, fechaFin) {
    const pipeline = [
      {
        $match: {
          fecha: {
            $gte: new Date(fechaInicio),
            $lte: new Date(fechaFin)
          },
          estado: 'completado'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'productos',
          localField: 'items.productoId',
          foreignField: '_id',
          as: 'producto'
        }
      },
      {
        $unwind: '$producto'
      },
      {
        $group: {
          _id: '$producto.categorias',
          totalVentas: { $sum: { $multiply: ['$items.cantidad', '$items.precio'] } },
          cantidadVendida: { $sum: '$items.cantidad' },
          pedidos: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          categoria: '$_id',
          totalVentas: 1,
          cantidadVendida: 1,
          numeroPedidos: { $size: '$pedidos' },
          _id: 0
        }
      },
      {
        $sort: { totalVentas: -1 }
      }
    ];
    
    return await this.app.models.Pedido.aggregate(pipeline);
  },
  
  async clientesTop(limite = 10) {
    const pipeline = [
      {
        $match: {
          estado: 'completado'
        }
      },
      {
        $group: {
          _id: '$clienteId',
          totalGastado: { $sum: '$total' },
          numeroPedidos: { $sum: 1 },
          ultimoPedido: { $max: '$fecha' }
        }
      },
      {
        $lookup: {
          from: 'clientes',
          localField: '_id',
          foreignField: '_id',
          as: 'cliente'
        }
      },
      {
        $unwind: '$cliente'
      },
      {
        $project: {
          _id: 0,
          clienteId: '$_id',
          nombre: '$cliente.nombre',
          email: '$cliente.email',
          totalGastado: 1,
          numeroPedidos: 1,
          ultimoPedido: 1,
          promedioCompra: { $divide: ['$totalGastado', '$numeroPedidos'] }
        }
      },
      {
        $sort: { totalGastado: -1 }
      },
      {
        $limit: limite
      }
    ];
    
    return await this.app.models.Pedido.aggregate(pipeline);
  }
};
```

### DynamoDB - Consultas Complejas

```javascript
// services/ProductoService.js
module.exports = {
  async buscarProductosPorPrecioYCategoria(categoriaId, precioMin, precioMax) {
    // Usando el índice global GSI1 (categoriaId-precio-index)
    const result = await this.app.models.Producto.query({
      IndexName: 'GSI1',
      KeyConditionExpression: 'categoriaId = :catId AND precio BETWEEN :min AND :max',
      ExpressionAttributeValues: {
        ':catId': categoriaId,
        ':min': precioMin,
        ':max': precioMax
      }
    });
    
    return result.Items;
  },
  
  async buscarProductosConFiltros(filtros) {
    const { categoriaId, estado, precioMin, precioMax, atributos } = filtros;
    
    let KeyConditionExpression = 'categoriaId = :catId';
    const ExpressionAttributeValues = {
      ':catId': categoriaId
    };
    
    // Construir expresión de filtro
    let FilterExpression = [];
    
    if (estado !== undefined) {
      FilterExpression.push('activo = :estado');
      ExpressionAttributeValues[':estado'] = estado;
    }
    
    if (precioMin !== undefined || precioMax !== undefined) {
      if (precioMin !== undefined && precioMax !== undefined) {
        FilterExpression.push('precio BETWEEN :min AND :max');
        ExpressionAttributeValues[':min'] = precioMin;
        ExpressionAttributeValues[':max'] = precioMax;
      } else if (precioMin !== undefined) {
        FilterExpression.push('precio >= :min');
        ExpressionAttributeValues[':min'] = precioMin;
      } else {
        FilterExpression.push('precio <= :max');
        ExpressionAttributeValues[':max'] = precioMax;
      }
    }
    
    // Filtrar por atributos específicos
    if (atributos && Object.keys(atributos).length > 0) {
      const ExpressionAttributeNames = {};
      
      Object.entries(atributos).forEach(([key, value], index) => {
        const nameKey = `#attr${index}`;
        const valueKey = `:val${index}`;
        
        FilterExpression.push(`${nameKey} = ${valueKey}`);
        ExpressionAttributeNames[nameKey] = `atributos.${key}`;
        ExpressionAttributeValues[valueKey] = value;
      });
      
      const params = {
        IndexName: 'GSI1',
        KeyConditionExpression,
        FilterExpression: FilterExpression.join(' AND '),
        ExpressionAttributeValues,
        ExpressionAttributeNames
      };
      
      const result = await this.app.models.Producto.query(params);
      return result.Items;
    } else {
      const params = {
        IndexName: 'GSI1',
        KeyConditionExpression,
        FilterExpression: FilterExpression.length > 0 ? FilterExpression.join(' AND ') : undefined,
        ExpressionAttributeValues
      };
      
      const result = await this.app.models.Producto.query(params);
      return result.Items;
    }
  }
};
```

### Elasticsearch - Búsqueda Avanzada

```javascript
// services/BusquedaService.js
module.exports = {
  async busquedaAvanzada(opciones) {
    const {
      texto,
      filtros = {},
      facets = [],
      pagina = 1,
      limite = 20
    } = opciones;
    
    // Construir query
    const query = {
      bool: {
        must: [],
        filter: [],
        should: [],
        must_not: []
      }
    };
    
    // Búsqueda por texto
    if (texto) {
      query.bool.must.push({
        multi_match: {
          query: texto,
          fields: ['titulo^3', 'contenido', 'tags^2'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    } else {
      query.bool.must.push({ match_all: {} });
    }
    
    // Aplicar filtros
    Object.entries(filtros).forEach(([campo, valor]) => {
      if (Array.isArray(valor)) {
        query.bool.filter.push({
          terms: { [campo]: valor }
        });
      } else if (typeof valor === 'object' && (valor.min !== undefined || valor.max !== undefined)) {
        const range = {};
        
        if (valor.min !== undefined) {
          range.gte = valor.min;
        }
        
        if (valor.max !== undefined) {
          range.lte = valor.max;
        }
        
        query.bool.filter.push({
          range: { [campo]: range }
        });
      } else if (valor !== undefined) {
        query.bool.filter.push({
          term: { [campo]: valor }
        });
      }
    });
    
    // Construir agregaciones para facets
    const aggs = {};
    
    facets.forEach(facet => {
      if (facet.tipo === 'terminos') {
        aggs[facet.nombre] = {
          terms: {
            field: facet.campo,
            size: facet.limite || 10
          }
        };
      } else if (facet.tipo === 'rango') {
        aggs[facet.nombre] = {
          range: {
            field: facet.campo,
            ranges: facet.rangos
          }
        };
      } else if (facet.tipo === 'estadisticas') {
        aggs[facet.nombre] = {
          stats: {
            field: facet.campo
          }
        };
      }
    });
    
    // Ejecutar búsqueda
    const result = await this.app.models.Articulo.search({
      from: (pagina - 1) * limite,
      size: limite,
      query,
      aggs,
      highlight: {
        fields: {
          titulo: {},
          contenido: {
            fragment_size: 150,
            number_of_fragments: 3,
            pre_tags: ['<strong>'],
            post_tags: ['</strong>']
          }
        }
      }
    });
    
    // Procesar resultados
    const items = result.hits.hits.map(hit => ({
      ...hit._source,
      score: hit._score,
      highlight: hit.highlight
    }));
    
    // Procesar facets
    const facetsResult = {};
    
    facets.forEach(facet => {
      if (result.aggregations && result.aggregations[facet.nombre]) {
        if (facet.tipo === 'terminos') {
          facetsResult[facet.nombre] = {
            tipo: 'terminos',
            campo: facet.campo,
            valores: result.aggregations[facet.nombre].buckets.map(bucket => ({
              valor: bucket.key,
              count: bucket.doc_count
            }))
          };
        } else if (facet.tipo === 'rango') {
          facetsResult[facet.nombre] = {
            tipo: 'rango',
            campo: facet.campo,
            rangos: result.aggregations[facet.nombre].buckets.map(bucket => ({
              desde: bucket.from,
              hasta: bucket.to,
              count: bucket.doc_count
            }))
          };
        } else if (facet.tipo === 'estadisticas') {
          facetsResult[facet.nombre] = {
            tipo: 'estadisticas',
            campo: facet.campo,
            ...result.aggregations[facet.nombre]
          };
        }
      }
    });
    
    return {
      items,
      total: result.hits.total.value,
      pagina,
      limite,
      totalPaginas: Math.ceil(result.hits.total.value / limite),
      facets: facetsResult
    };
  }
};
```

## Transacciones

### MongoDB

```javascript
// services/PedidoService.js
module.exports = {
  async crearPedido(datos) {
    const { clienteId, items } = datos;
    
    // Iniciar sesión de transacción
    const session = await this.app.datasources.mongodb.startSession();
    
    try {
      // Iniciar transacción
      session.startTransaction();
      
      // Verificar stock y calcular total
      let total = 0;
      const itemsConDetalles = [];
      
      for (const item of items) {
        const producto = await this.app.models.Producto.findById(item.productoId, { session });
        
        if (!producto) {
          throw new Error(`Producto no encontrado: ${item.productoId}`);
        }
        
        if (producto.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${producto.nombre}`);
        }
        
        const subtotal = producto.precio * item.cantidad;
        
        itemsConDetalles.push({
          productoId: producto._id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: item.cantidad,
          subtotal
        });
        
        total += subtotal;
        
        // Actualizar stock
        await this.app.models.Producto.updateById(
          producto._id,
          { $inc: { stock: -item.cantidad } },
          { session }
        );
      }
      
      // Crear pedido
      const pedido = await this.app.models.Pedido.create({
        clienteId,
        items: itemsConDetalles,
        total
      }, { session });

      // Confirmar transacción
      await session.commitTransaction();

      return pedido;
    } catch (error) {
      // Abortar transacción en caso de error
      await session.abortTransaction();

      throw error;
    } finally {
      // Finalizar sesión
      session.endSession();
    }
  }
};
```
Este código utiliza la biblioteca Mongoose para interactuar con la base de datos MongoDB. La función `crearPedido` realiza las siguientes acciones:

1. Inicia una sesión de transacción.
2. Inicia la transacción.
3. Verifica el stock de cada producto y calcula el total del pedido.
4. Actualiza el stock de cada producto en la base de datos.
5. Crea el pedido en la base de datos.
6. Confirma la transacción.
7. Finaliza la sesión de transacción.
8. En caso de error, aborta la transacción y lanza el error.
La función `crearPedido` devuelve el pedido creado en la base de datos. Si hay algún error durante el proceso, se lanza una excepción y la transacción se aborta.

### DynamoDB

```javascript
// services/PedidoService.js
module.exports = {
  async crearPedido(datos) {
    const { clienteId, items } = datos; 
  } 
};
```

