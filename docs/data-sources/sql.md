---
sidebar_position: 2
title: SQL
description: Configuración y uso de bases de datos SQL como fuentes de datos en NexusData
---

# SQL

NexusData proporciona soporte robusto para bases de datos SQL, permitiéndote conectar y trabajar con diversos sistemas de gestión de bases de datos relacionales.

## Bases de Datos Soportadas

NexusData soporta las siguientes bases de datos SQL:

- **PostgreSQL** (9.6+)
- **MySQL** (5.7+)
- **MariaDB** (10.3+)
- **Microsoft SQL Server** (2016+)
- **Oracle Database** (12c+)
- **SQLite** (3.x)

## Configuración de Conexión

### Configuración Básica

Para configurar una conexión a una base de datos SQL, debes definir los parámetros en tu archivo de configuración:

```javascript
// config/datasources.js
module.exports = {
  datasources: {
    postgres: {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'mi_base_de_datos',
      username: 'usuario',
      password: 'contraseña',
      ssl: false
    },
    mysql: {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      database: 'mi_base_de_datos',
      username: 'usuario',
      password: 'contraseña'
    },
    sqlserver: {
      type: 'mssql',
      host: 'localhost',
      port: 1433,
      database: 'mi_base_de_datos',
      username: 'usuario',
      password: 'contraseña',
      options: {
        encrypt: true
      }
    },
    sqlite: {
      type: 'sqlite',
      database: './data/database.sqlite',
      synchronize: true
    }
  }
};
```

### Opciones Avanzadas

Cada tipo de base de datos admite opciones específicas para optimizar el rendimiento y la seguridad:

#### PostgreSQL

```javascript
postgres: {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'mi_base_de_datos',
  username: 'usuario',
  password: 'contraseña',
  schema: 'public',
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync('/ruta/al/certificado.crt').toString()
  },
  poolSize: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
}
```

#### MySQL/MariaDB

```javascript
mysql: {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'mi_base_de_datos',
  username: 'usuario',
  password: 'contraseña',
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectionLimit: 10,
  acquireTimeout: 10000,
  waitForConnections: true,
  queueLimit: 0
}
```

#### SQL Server

```javascript
sqlserver: {
  type: 'mssql',
  host: 'localhost',
  port: 1433,
  database: 'mi_base_de_datos',
  username: 'usuario',
  password: 'contraseña',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
}
```

#### Oracle

```javascript
oracle: {
  type: 'oracle',
  host: 'localhost',
  port: 1521,
  sid: 'ORCL',
  username: 'usuario',
  password: 'contraseña',
  connectString: 'localhost:1521/ORCL',
  poolMax: 10,
  poolMin: 2,
  poolIncrement: 1,
  poolTimeout: 60
}
```

### Conexión mediante URL

También puedes configurar la conexión utilizando una URL de conexión:

```javascript
postgres: {
  type: 'postgres',
  url: 'postgresql://usuario:contraseña@localhost:5432/mi_base_de_datos'
},
mysql: {
  type: 'mysql',
  url: 'mysql://usuario:contraseña@localhost:3306/mi_base_de_datos'
}
```

### Variables de Entorno

Para mayor seguridad, es recomendable utilizar variables de entorno para las credenciales:

```javascript
postgres: {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true'
}
```

## Configuración de Modelos

### Mapeo de Tablas

Puedes mapear tus modelos a tablas existentes:

```javascript
// models/Usuario.js
module.exports = {
  name: 'Usuario',
  datasource: 'postgres',
  tableName: 'usuarios', // Nombre de la tabla en la base de datos
  columns: {
    id: {
      type: 'integer',
      primaryKey: true,
      autoIncrement: true,
      columnName: 'usuario_id' // Nombre de la columna en la tabla
    },
    nombre: {
      type: 'string',
      length: 100,
      columnName: 'nombre_completo'
    },
    email: {
      type: 'string',
      unique: true
    },
    fechaRegistro: {
      type: 'datetime',
      columnName: 'fecha_registro',
      defaultValue: () => new Date()
    }
  }
};
```

### Índices

Puedes definir índices para optimizar las consultas:

```javascript
// models/Producto.js
module.exports = {
  name: 'Producto',
  datasource: 'mysql',
  tableName: 'productos',
  columns: {
    // Definición de columnas...
  },
  indexes: [
    {
      name: 'idx_producto_nombre',
      columns: ['nombre']
    },
    {
      name: 'idx_producto_categoria_precio',
      columns: ['categoriaId', 'precio']
    },
    {
      name: 'idx_producto_sku',
      columns: ['sku'],
      unique: true
    }
  ]
};
```

### Relaciones

Define relaciones entre tus modelos:

```javascript
// models/Pedido.js
module.exports = {
  name: 'Pedido',
  datasource: 'postgres',
  tableName: 'pedidos',
  columns: {
    // Definición de columnas...
    clienteId: {
      type: 'integer',
      columnName: 'cliente_id'
    }
  },
  relations: {
    cliente: {
      type: 'belongsTo',
      target: 'Cliente',
      foreignKey: 'clienteId',
      targetKey: 'id'
    },
    items: {
      type: 'hasMany',
      target: 'PedidoItem',
      foreignKey: 'pedidoId',
      cascade: true
    }
  }
};
```

## Sincronización de Esquema

NexusData puede sincronizar automáticamente tus modelos con la base de datos:

```javascript
// config/datasources.js
module.exports = {
  datasources: {
    postgres: {
      // Configuración básica...
      synchronize: true, // Sincroniza automáticamente el esquema
      dropSchema: false, // No elimina el esquema existente
      migrationsRun: true, // Ejecuta migraciones pendientes
      logging: true // Muestra consultas SQL en la consola
    }
  }
};
```

### Opciones de Sincronización

- **synchronize**: Sincroniza el esquema automáticamente (no recomendado para producción)
- **dropSchema**: Elimina el esquema existente antes de sincronizar (¡usar con precaución!)
- **migrationsRun**: Ejecuta migraciones pendientes al iniciar
- **logging**: Muestra consultas SQL en la consola

## Migraciones

Para entornos de producción, es recomendable utilizar migraciones en lugar de sincronización automática:

### Crear una Migración

```bash
nexusdata migration:create --name=crear-tabla-usuarios
```

Esto generará un archivo de migración en `migrations/TIMESTAMP-crear-tabla-usuarios.js`:

```javascript
// migrations/20230615123456-crear-tabla-usuarios.js
module.exports = {
  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_usuarios_email ON usuarios(email)
    `);
  },
  
  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE IF EXISTS usuarios`);
  }
};
```

### Ejecutar Migraciones

```bash
# Ejecutar todas las migraciones pendientes
nexusdata migration:run

# Revertir la última migración
nexusdata migration:revert

# Mostrar migraciones pendientes
nexusdata migration:show
```

## Consultas Personalizadas

### Consultas SQL Directas

Puedes ejecutar consultas SQL directamente:

```javascript
// services/ReporteService.js
module.exports = {
  async generarReporteVentas(fechaInicio, fechaFin) {
    const datasource = this.app.datasources.postgres;
    
    const result = await datasource.query(`
      SELECT 
        p.categoria_id,
        c.nombre AS categoria,
        SUM(pi.cantidad) AS unidades_vendidas,
        SUM(pi.cantidad * pi.precio) AS total_ventas
      FROM pedidos p
      JOIN pedido_items pi ON p.id = pi.pedido_id
      JOIN productos pr ON pi.producto_id = pr.id
      JOIN categorias c ON pr.categoria_id = c.id
      WHERE p.fecha BETWEEN $1 AND $2
      GROUP BY p.categoria_id, c.nombre
      ORDER BY total_ventas DESC
    `, [fechaInicio, fechaFin]);
    
    return result;
  }
};
```

### Consultas con QueryBuilder

NexusData proporciona un constructor de consultas para crear consultas complejas de forma programática:

```javascript
// services/ProductoService.js
module.exports = {
  async buscarProductos(filtros) {
    const { categoriaId, precioMin, precioMax, termino, ordenar, pagina, porPagina } = filtros;
    
    const queryBuilder = this.app.models.Producto.createQueryBuilder('p')
      .leftJoin('p.categoria', 'c')
      .select(['p.*', 'c.nombre AS categoria_nombre']);
    
    if (categoriaId) {
      queryBuilder.where('p.categoria_id = :categoriaId', { categoriaId });
    }
    
    if (precioMin) {
      queryBuilder.andWhere('p.precio >= :precioMin', { precioMin });
    }
    
    if (precioMax) {
      queryBuilder.andWhere('p.precio <= :precioMax', { precioMax });
    }
    
    if (termino) {
      queryBuilder.andWhere('(p.nombre LIKE :termino OR p.descripcion LIKE :termino)', 
        { termino: `%${termino}%` });
    }
    
    // Ordenamiento
    if (ordenar) {
      const [campo, direccion] = ordenar.split(':');
      queryBuilder.orderBy(`p.${campo}`, direccion || 'ASC');
    } else {
      queryBuilder.orderBy('p.nombre', 'ASC');
    }
    
    // Paginación
    const limit = porPagina || 20;
    const offset = ((pagina || 1) - 1) * limit;
    
    queryBuilder.limit(limit).offset(offset);
    
    // Ejecutar consulta
    const [items, total] = await Promise.all([
      queryBuilder.getMany(),
      queryBuilder.clone().count('p.id as total').getRawOne()
    ]);
    
    return {
      items,
      total: parseInt(total.total),
      pagina: pagina || 1,
      porPagina: limit,
      totalPaginas: Math.ceil(parseInt(total.total) / limit)
    };
  }
};
```

## Transacciones

Las transacciones garantizan la integridad de los datos:

```javascript
// services/PedidoService.js
module.exports = {
  async crearPedido(datos) {
    const datasource = this.app.datasources.postgres;
    
    // Iniciar transacción
    return await datasource.transaction(async (transactionManager) => {
      // Crear pedido
      const pedido = await transactionManager.create('Pedido', {
        clienteId: datos.clienteId,
        fecha: new Date(),
        estado: 'pendiente',
        total: 0
      });
      
      let totalPedido = 0;
      
      // Crear items del pedido
      for (const item of datos.items) {
        // Verificar stock
        const producto = await transactionManager.findOne('Producto', {
          where: { id: item.productoId }
        });
        
        if (!producto) {
          throw new Error(`Producto no encontrado: ${item.productoId}`);
        }
        
        if (producto.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${producto.nombre}`);
        }
        
        // Crear item
        await transactionManager.create('PedidoItem', {
          pedidoId: pedido.id,
          productoId: item.productoId,
          cantidad: item.cantidad,
          precio: producto.precio,
          subtotal: producto.precio * item.cantidad
        });
        
        // Actualizar stock
        await transactionManager.update('Producto', {
          id: producto.id,
          stock: producto.stock - item.cantidad
        });
        
        totalPedido += producto.precio * item.cantidad;
      }
      
      // Actualizar total del pedido
      await transactionManager.update('Pedido', {
        id: pedido.id,
        total: totalPedido
      });
      
      // Registrar historial
      await transactionManager.create('PedidoHistorial', {
        pedidoId: pedido.id,
        estado: 'pendiente',
        fecha: new Date(),
        comentario: 'Pedido creado'
      });
      
      // Obtener pedido completo con relaciones
      return await transactionManager.findOne('Pedido', {
        where: { id: pedido.id },
        include: ['cliente', 'items', 'items.producto']
      });
    });
  }
};
```

## Procedimientos Almacenados y Funciones

Puedes utilizar procedimientos almacenados y funciones de la base de datos:

```javascript
// services/InventarioService.js
module.exports = {
  async actualizarInventario(productoId, cantidad, tipo) {
    const datasource = this.app.datasources.postgres;
    
    // Llamar a un procedimiento almacenado
    return await datasource.query(
      'CALL actualizar_inventario($1, $2, $3)',
      [productoId, cantidad, tipo]
    );
  },
  
  async calcularValorInventario() {
    const datasource = this.app.datasources.postgres;
    
    // Llamar a una función
    const result = await datasource.query(
      'SELECT calcular_valor_inventario() AS valor'
    );
    
    return result[0].valor;
  }
};
```

## Optimización de Rendimiento

### Configuración de Pool de Conexiones

```javascript
postgres: {
  type: 'postgres',
  // Configuración básica...
  poolSize: 20, // Número máximo de conexiones
  idleTimeoutMillis: 30000, // Tiempo máximo de inactividad (ms)
  connectionTimeoutMillis: 2000 // Tiempo máximo para establecer conexión (ms)
}
```

### Consultas Optimizadas

- **Selecciona solo las columnas necesarias**:

```javascript
const usuarios = await this.app.models.Usuario.find({
  select: ['id', 'nombre', 'email'],
  where: { activo: true }
});
```

- **Utiliza índices adecuados**:

```javascript
// models/Producto.js
module.exports = {
  // ...
  indexes: [
    {
      name: 'idx_producto_busqueda',
      columns: ['nombre', 'sku', 'categoriaId'],
      type: 'FULLTEXT' // Para MySQL
    }
  ]
};
```

- **Paginación eficiente**:

```javascript
const { items, total } = await this.app.models.Producto.findAndCount({
  where: { categoriaId: 5 },
  order: { createdAt: 'DESC' },
  skip: (pagina - 1) * porPagina,
  take: porPagina
});
```

## Monitoreo y Diagnóstico

### Logging de Consultas

```javascript
postgres: {
  type: 'postgres',
  // Configuración básica...
  logging: true, // Habilita el logging de todas las consultas
  maxQueryExecutionTime: 1000 // Registra consultas que tarden más de 1000ms
}
```

### Estadísticas de Conexión

```javascript
// services/AdminService.js
module.exports = {
  async obtenerEstadisticasDB() {
    const datasource = this.app.datasources.postgres;
    
    // Obtener estadísticas del pool de conexiones
    const stats = await datasource.getPoolStats();
    
    return {
      total: stats.total,
      idle: stats.idle,
      used: stats.used,
      waiting: stats.waiting,
      maxConnections: datasource.options.poolSize
    };
  }
};
```

## Mejores Prácticas

1. **Seguridad**:
   - Nunca almacenes credenciales en el código fuente
   - Utiliza variables de entorno o servicios de gestión de secretos
   - Implementa parámetros preparados para evitar inyección SQL
   - Limita los permisos del usuario de base de datos

2. **Rendimiento**:
   - Utiliza índices adecuados para consultas frecuentes
   - Implementa paginación para conjuntos de datos grandes
   - Optimiza consultas complejas con EXPLAIN
   - Configura adecuadamente el pool de conexiones

3. **Mantenimiento**:
   - Utiliza migraciones para cambios en el esquema
   - Implementa respaldos regulares
   - Monitorea el rendimiento de la base de datos
   - Mantén actualizado el sistema de gestión de base de datos

4. **Desarrollo**:
   - Utiliza entornos separados para desarrollo, pruebas y producción
   - Implementa pruebas automatizadas para la capa de datos
   - Documenta el esquema y las relaciones
   - Utiliza herramientas de análisis estático para SQL

## Solución de Problemas Comunes

### Problemas de Conexión

```javascript
// Verificar conexión
async function verificarConexion() {
  try {
    await app.datasources.postgres.query('SELECT 1');
    console.log('Conexión exitosa');
  } catch (error) {
    console.error('Error de conexión:', error.message);
    
    // Verificar problemas comunes
    if (error.code === 'ECONNREFUSED') {
      console.error('El servidor de base de datos no está disponible');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Tiempo de espera agotado al conectar');
    } else if (error.code === '28P01') {
      console.error('Credenciales incorrectas');
    } else if (error.code === '3D000') {
      console.error('Base de datos no existe');
    }
  }
}
```

### Problemas de Rendimiento

```javascript
// Analizar consulta lenta
async function analizarConsulta(consulta, parametros) {
  try {
    const resultado = await app.datasources.postgres.query(
      `EXPLAIN ANALYZE ${consulta}`,
      parametros
    );
    console.log('Plan de ejecución:', resultado);
  } catch (error) {
    console.error('Error al analizar consulta:', error.message);
  }
}
```

## Conclusión

Las fuentes de datos SQL en NexusData proporcionan una forma potente y flexible de trabajar con bases de datos relacionales. Con soporte para múltiples sistemas de gestión de bases de datos, características avanzadas como transacciones y migraciones, y herramientas para optimizar el rendimiento, NexusData te permite aprovechar al máximo tus datos relacionales.

Para casos de uso más avanzados, consulta la [Referencia de API](/docs/reference) y la documentación específica de cada sistema de gestión de base de datos.
```

Este archivo proporciona una documentación completa sobre cómo configurar y utilizar fuentes de datos SQL en NexusData, incluyendo configuración de conexión, mapeo de modelos, migraciones, consultas personalizadas, transacciones y optimización de rendimiento.