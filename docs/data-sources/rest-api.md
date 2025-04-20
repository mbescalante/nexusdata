---
sidebar_position: 4
title: REST API
description: Configuración y uso de APIs REST como fuentes de datos en NexusData
---

# REST API

NexusData permite integrar APIs REST externas como fuentes de datos, facilitando la conexión con servicios de terceros y la incorporación de datos de múltiples orígenes en tu aplicación.

## Configuración Básica

Para configurar una API REST como fuente de datos, debes definir los parámetros de conexión en tu archivo de configuración:

```javascript
// config/datasources.js
module.exports = {
  datasources: {
    weatherApi: {
      type: 'rest',
      baseURL: 'https://api.weatherapi.com/v1',
      auth: {
        type: 'apiKey',
        name: 'key',
        value: 'TU_API_KEY',
        in: 'query' // 'query', 'header', o 'cookie'
      },
      defaultHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 5000 // ms
    }
  }
};
```

## Tipos de Autenticación

NexusData soporta varios métodos de autenticación para APIs REST:

### API Key

```javascript
auth: {
  type: 'apiKey',
  name: 'api-key', // Nombre del parámetro
  value: process.env.API_KEY,
  in: 'header' // Ubicación: 'header', 'query', o 'cookie'
}
```

### Bearer Token

```javascript
auth: {
  type: 'bearer',
  token: process.env.API_TOKEN
}
```

### OAuth 2.0

```javascript
auth: {
  type: 'oauth2',
  tokenUrl: 'https://api.example.com/oauth/token',
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  scopes: ['read', 'write']
}
```

### Autenticación Básica

```javascript
auth: {
  type: 'basic',
  username: process.env.API_USERNAME,
  password: process.env.API_PASSWORD
}
```

### Personalizada

```javascript
auth: {
  type: 'custom',
  prepare: async (request, context) => {
    // Obtener token de alguna fuente (base de datos, servicio, etc.)
    const token = await context.services.auth.getToken();
    
    // Añadir token a la solicitud
    request.headers['Authorization'] = `Custom ${token}`;
    
    return request;
  }
}
```

## Configuración Avanzada

### Opciones de Solicitud

```javascript
githubApi: {
  type: 'rest',
  baseURL: 'https://api.github.com',
  auth: {
    type: 'bearer',
    token: process.env.GITHUB_TOKEN
  },
  defaultHeaders: {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'NexusData-App'
  },
  timeout: 10000,
  retry: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
    factor: 2,
    statusCodes: [408, 429, 500, 502, 503, 504]
  },
  proxy: {
    host: 'proxy.example.com',
    port: 8080,
    auth: {
      username: 'proxyuser',
      password: 'proxypass'
    }
  },
  validateStatus: (status) => status >= 200 && status < 300,
  decompress: true,
  maxRedirects: 5
}
```

### Interceptores

Los interceptores permiten modificar solicitudes y respuestas:

```javascript
salesforceApi: {
  type: 'rest',
  baseURL: 'https://yourinstance.salesforce.com/services/data/v52.0',
  auth: {
    type: 'bearer',
    token: process.env.SF_TOKEN
  },
  interceptors: {
    request: [
      async (config, context) => {
        // Añadir timestamp a cada solicitud
        config.headers['X-Request-Time'] = new Date().toISOString();
        return config;
      }
    ],
    response: [
      async (response, context) => {
        // Transformar datos de respuesta
        if (response.data && response.data.records) {
          response.data.items = response.data.records.map(record => ({
            id: record.Id,
            ...record
          }));
          delete response.data.records;
        }
        return response;
      }
    ],
    error: [
      async (error, context) => {
        // Manejar errores específicos
        if (error.response && error.response.status === 401) {
          // Intentar renovar token
          const newToken = await context.services.auth.refreshToken();
          
          // Actualizar configuración
          context.datasources.salesforceApi.setAuthToken(newToken);
          
          // Reintentar solicitud original
          return context.datasources.salesforceApi.request(error.config);
        }
        
        throw error;
      }
    ]
  }
}
```

## Definición de Modelos

### Modelo Básico

```javascript
// models/Clima.js
module.exports = {
  name: 'Clima',
  datasource: 'weatherApi',
  endpoint: '/current.json',
  schema: {
    id: {
      type: 'string',
      primaryKey: true,
      generated: (data) => `${data.location.name}_${data.location.country}`
    },
    ciudad: {
      type: 'string',
      path: 'location.name'
    },
    pais: {
      type: 'string',
      path: 'location.country'
    },
    temperatura: {
      type: 'number',
      path: 'current.temp_c'
    },
    condicion: {
      type: 'string',
      path: 'current.condition.text'
    },
    icono: {
      type: 'string',
      path: 'current.condition.icon'
    },
    humedad: {
      type: 'number',
      path: 'current.humidity'
    },
    viento: {
      type: 'number',
      path: 'current.wind_kph'
    },
    actualizado: {
      type: 'date',
      path: 'current.last_updated',
      transform: (value) => new Date(value)
    }
  },
  operations: {
    findByCity: {
      method: 'GET',
      endpoint: '/current.json',
      params: {
        q: '{city}'
      },
      transform: (response) => response.data
    }
  }
};
```

### Operaciones Personalizadas

```javascript
// models/Producto.js
module.exports = {
  name: 'Producto',
  datasource: 'ecommerceApi',
  endpoint: '/products',
  schema: {
    // Definición del esquema...
  },
  operations: {
    findAll: {
      method: 'GET',
      endpoint: '/products',
      params: {
        limit: '{limit:10}',
        offset: '{offset:0}',
        sort: '{sort:id}',
        order: '{order:asc}'
      },
      transform: (response) => ({
        items: response.data.products,
        total: response.data.total,
        limit: response.data.limit,
        offset: response.data.offset
      })
    },
    
    findById: {
      method: 'GET',
      endpoint: '/products/{id}',
      transform: (response) => response.data.product
    },
    
    findByCategory: {
      method: 'GET',
      endpoint: '/products',
      params: {
        category: '{categoryId}',
        limit: '{limit:10}',
        offset: '{offset:0}'
      },
      transform: (response) => ({
        items: response.data.products,
        total: response.data.total
      })
    },
    
    search: {
      method: 'GET',
      endpoint: '/products/search',
      params: {
        q: '{query}',
        limit: '{limit:10}',
        offset: '{offset:0}'
      },
      transform: (response) => ({
        items: response.data.products,
        total: response.data.total
      })
    },
    
    create: {
      method: 'POST',
      endpoint: '/products',
      body: '{data}',
      transform: (response) => response.data.product
    },
    
    update: {
      method: 'PUT',
      endpoint: '/products/{id}',
      body: '{data}',
      transform: (response) => response.data.product
    },
    
    delete: {
      method: 'DELETE',
      endpoint: '/products/{id}',
      transform: (response) => ({ success: response.status === 204 })
    }
  }
};
```

## Uso de Modelos REST

### Operaciones Básicas

```javascript
// services/ClimaService.js
module.exports = {
  async obtenerClimaPorCiudad(ciudad) {
    try {
      return await this.app.models.Clima.findByCity({ city: ciudad });
    } catch (error) {
      this.app.logger.error('Error al obtener clima', { ciudad, error: error.message });
      throw new Error(`No se pudo obtener el clima para ${ciudad}: ${error.message}`);
    }
  },
  
  async obtenerClimaMultiplesCiudades(ciudades) {
    const resultados = [];
    const errores = [];
    
    for (const ciudad of ciudades) {
      try {
        const clima = await this.app.models.Clima.findByCity({ city: ciudad });
        resultados.push(clima);
      } catch (error) {
        errores.push({ ciudad, error: error.message });
      }
    }
    
    return {
      resultados,
      errores,
      total: resultados.length,
      totalErrores: errores.length
    };
  }
};
```

### Operaciones CRUD

```javascript
// services/ProductoService.js
module.exports = {
  async listarProductos(opciones = {}) {
    const { limite = 10, pagina = 1, ordenar = 'id', direccion = 'asc' } = opciones;
    
    return await this.app.models.Producto.findAll({
      limit: limite,
      offset: (pagina - 1) * limite,
      sort: ordenar,
      order: direccion
    });
  },
  
  async obtenerProducto(id) {
    return await this.app.models.Producto.findById({ id });
  },
  
  async buscarProductos(termino, opciones = {}) {
    const { limite = 10, pagina = 1 } = opciones;
    
    return await this.app.models.Producto.search({
      query: termino,
      limit: limite,
      offset: (pagina - 1) * limite
    });
  },
  
  async crearProducto(datos) {
    return await this.app.models.Producto.create({ data: datos });
  },
  
  async actualizarProducto(id, datos) {
    return await this.app.models.Producto.update({ id, data: datos });
  },
  
  async eliminarProducto(id) {
    return await this.app.models.Producto.delete({ id });
  }
};
```

## Caché y Optimización

NexusData permite implementar estrategias de caché para optimizar el rendimiento y reducir las llamadas a APIs externas:

```javascript
// config/datasources.js
module.exports = {
  datasources: {
    weatherApi: {
      type: 'rest',
      baseURL: 'https://api.weatherapi.com/v1',
      auth: {
        type: 'apiKey',
        name: 'key',
        value: process.env.WEATHER_API_KEY,
        in: 'query'
      },
      cache: {
        enabled: true,
        ttl: 3600, // Tiempo de vida en segundos (1 hora)
        storage: 'memory', // 'memory', 'redis', o 'custom'
        maxSize: 100, // Número máximo de entradas en caché (para 'memory')
        keyGenerator: (config) => {
          // Generar clave de caché basada en URL y parámetros
          const url = config.url;
          const params = new URLSearchParams(config.params).toString();
          return `${url}?${params}`;
        }
      }
    }
  }
};
```

### Configuración de Caché con Redis

```javascript
weatherApi: {
  // Configuración básica...
  cache: {
    enabled: true,
    ttl: 3600,
    storage: 'redis',
    redis: {
      host: 'localhost',
      port: 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0,
      keyPrefix: 'weather_api:'
    }
  }
}
```

### Caché Personalizado

```javascript
weatherApi: {
  // Configuración básica...
  cache: {
    enabled: true,
    storage: 'custom',
    get: async (key, context) => {
      // Implementación personalizada para obtener de caché
      return await context.services.cache.get(key);
    },
    set: async (key, value, ttl, context) => {
      // Implementación personalizada para guardar en caché
      await context.services.cache.set(key, value, ttl);
    },
    invalidate: async (key, context) => {
      // Implementación personalizada para invalidar caché
      await context.services.cache.delete(key);
    }
  }
}
```

## Sincronización de Datos

NexusData permite sincronizar datos de APIs externas con tu base de datos local:

```javascript
// services/SincronizacionService.js
module.exports = {
  async sincronizarProductos() {
    const db = this.app.datasources.postgres;
    const api = this.app.models.Producto;
    
    let pagina = 1;
    const limite = 100;
    let totalSincronizados = 0;
    let hayMasPaginas = true;
    
    this.app.logger.info('Iniciando sincronización de productos');
    
    while (hayMasPaginas) {
      // Obtener datos de la API
      const { items, total } = await api.findAll({
        limit: limite,
        offset: (pagina - 1) * limite
      });
      
      if (!items || items.length === 0) {
        hayMasPaginas = false;
        break;
      }
      
      // Procesar en lotes usando transacción
      await db.transaction(async (tx) => {
        for (const item of items) {
          // Verificar si el producto ya existe
          const existente = await tx.findOne('ProductoLocal', {
            where: { externalId: item.id }
          });
          
          if (existente) {
            // Actualizar producto existente
            await tx.update('ProductoLocal', {
              id: existente.id,
              nombre: item.nombre,
              descripcion: item.descripcion,
              precio: item.precio,
              categoria: item.categoria,
              imagen: item.imagen,
              ultimaSincronizacion: new Date()
            });
          } else {
            // Crear nuevo producto
            await tx.create('ProductoLocal', {
              externalId: item.id,
              nombre: item.nombre,
              descripcion: item.descripcion,
              precio: item.precio,
              categoria: item.categoria,
              imagen: item.imagen,
              creado: new Date(),
              ultimaSincronizacion: new Date()
            });
          }
        }
      });
      
      totalSincronizados += items.length;
      this.app.logger.info(`Sincronizados ${totalSincronizados} de ${total} productos`);
      
      // Verificar si hay más páginas
      hayMasPaginas = totalSincronizados < total;
      pagina++;
    }
    
    this.app.logger.info(`Sincronización completada. Total: ${totalSincronizados} productos`);
    
    return {
      total: totalSincronizados,
      fecha: new Date()
    };
  },
  
  async programarSincronizacion() {
    // Programar tarea periódica
    this.app.scheduler.schedule('sincronizacion.productos', {
      cron: '0 0 * * *', // Ejecutar diariamente a medianoche
      handler: async () => {
        await this.sincronizarProductos();
      }
    });
    
    return {
      mensaje: 'Sincronización programada correctamente',
      proximaEjecucion: this.app.scheduler.getNextRun('sincronizacion.productos')
    };
  }
};
```

## Manejo de Errores

Es importante implementar un manejo adecuado de errores al trabajar con APIs externas:

```javascript
// services/ApiService.js
module.exports = {
  async ejecutarConReintentos(fn, opciones = {}) {
    const {
      maxIntentos = 3,
      retrasoInicial = 1000,
      factorRetraso = 2,
      codigosReintentar = [429, 500, 502, 503, 504]
    } = opciones;
    
    let intento = 0;
    let retraso = retrasoInicial;
    
    while (intento < maxIntentos) {
      try {
        return await fn();
      } catch (error) {
        intento++;
        
        // Verificar si debemos reintentar
        const codigoError = error.response?.status;
        const debeReintentar = intento < maxIntentos && 
          codigosReintentar.includes(codigoError);
        
        if (!debeReintentar) {
          throw error;
        }
        
        // Registrar intento fallido
        this.app.logger.warn(`Intento ${intento}/${maxIntentos} fallido. Reintentando en ${retraso}ms`, {
          error: error.message,
          codigo: codigoError
        });
        
        // Esperar antes de reintentar
        await new Promise(resolve => setTimeout(resolve, retraso));
        
        // Aumentar retraso para el próximo intento
        retraso *= factorRetraso;
      }
    }
  },
  
  async manejarErrorApi(error) {
    if (!error.response) {
      // Error de red o timeout
      return {
        tipo: 'red',
        mensaje: 'Error de conexión con el servidor',
        detalles: error.message
      };
    }
    
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          tipo: 'validacion',
          mensaje: 'Datos de solicitud inválidos',
          detalles: data.errors || data.message || 'Verifica los datos enviados'
        };
      
      case 401:
        // Posiblemente token expirado
        return {
          tipo: 'autenticacion',
          mensaje: 'Credenciales inválidas o expiradas',
          detalles: data.message || 'Es necesario volver a autenticarse'
        };
      
      case 403:
        return {
          tipo: 'autorizacion',
          mensaje: 'No tienes permisos para realizar esta acción',
          detalles: data.message || 'Contacta al administrador'
        };
      
      case 404:
        return {
          tipo: 'notFound',
          mensaje: 'Recurso no encontrado',
          detalles: data.message || 'El recurso solicitado no existe'
        };
      
      case 429:
        return {
          tipo: 'limitacion',
          mensaje: 'Has excedido el límite de solicitudes',
          detalles: data.message || 'Intenta nuevamente más tarde',
          esperarSegundos: parseInt(error.response.headers['retry-after'] || '60')
        };
      
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          tipo: 'servidor',
          mensaje: 'Error en el servidor',
          detalles: data.message || 'Intenta nuevamente más tarde'
        };
      
      default:
        return {
          tipo: 'desconocido',
          mensaje: `Error ${status}`,
          detalles: data.message || 'Error desconocido'
        };
    }
  }
};
```

## Monitoreo y Diagnóstico

### Logging de Solicitudes

```javascript
// config/datasources.js
module.exports = {
  datasources: {
    externalApi: {
      type: 'rest',
      baseURL: 'https://api.example.com',
      // Configuración básica...
      logging: {
        enabled: true,
        level: 'debug', // 'debug', 'info', 'warn', 'error'
        request: true,
        response: true,
        error: true,
        // Función personalizada para formatear logs
        formatter: (info) => {
          const { config, response, error, duration } = info;
          
          if (error) {
            return {
              level: 'error',
              message: `API Error: ${error.message}`,
              method: config.method,
              url: config.url,
              status: error.response?.status,
              duration: `${duration}ms`,
              error: {
                message: error.message,
                stack: error.stack,
                response: error.response?.data
              }
            };
          }
          
          return {
            level: 'info',
            message: `API Request: ${config.method} ${config.url}`,
            method: config.method,
            url: config.url,
            status: response?.status,
            duration: `${duration}ms`,
            requestSize: JSON.stringify(config.data || {}).length,
            responseSize: JSON.stringify(response?.data || {}).length
          };
        }
      }
    }
  }
};
```

### Métricas

```javascript
// plugins/api-metrics.js
module.exports = function(context) {
  // Registrar interceptor para todas las fuentes de datos REST
  Object.values(context.datasources)
    .filter(ds => ds.type === 'rest')
    .forEach(datasource => {
      // Añadir interceptor para métricas
      datasource.interceptors.request.push(async (config) => {
        // Añadir timestamp para medir duración
        config.metadata = {
          startTime: Date.now()
        };
        return config;
      });
      
      datasource.interceptors.response.push(async (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        
        // Registrar métrica
        context.metrics.record('api.request', {
          value: duration,
          tags: {
            datasource: datasource.name,
            method: response.config.method,
            endpoint: response.config.url,
            status: response.status
          }
        });
        
        // Histograma de duración
        context.metrics.histogram('api.request.duration', duration, {
          datasource: datasource.name
        });
        
        // Contador de solicitudes
        context.metrics.increment('api.request.count', {
          datasource: datasource.name,
          status: `${Math.floor(response.status / 100)}xx`
        });
        
        return response;
      });
      
      datasource.interceptors.error.push(async (error) => {
        const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
        
        // Registrar error
        context.metrics.increment('api.request.error', {
          datasource: datasource.name,
          method: error.config?.method,
          endpoint: error.config?.url,
          status: error.response?.status || 'network',
          errorCode: error.code || 'unknown'
        });
        
        // Histograma de duración de errores
        context.metrics.histogram('api.request.error.duration', duration, {
          datasource: datasource.name
        });
        
        throw error;
      });
    });
  
  // Exponer endpoint para métricas
  context.http.get('/metrics/api', async (req, res) => {
    const metrics = await context.metrics.getMetrics('api.*');
    res.json(metrics);
  });
};
```

## Mejores Prácticas

1. **Seguridad**:
   - Nunca almacenes credenciales en el código fuente
   - Utiliza variables de entorno o servicios de gestión de secretos
   - Implementa HTTPS para todas las comunicaciones
   - Valida y sanitiza todas las entradas y salidas

2. **Rendimiento**:
   - Implementa caché para reducir llamadas a APIs externas
   - Utiliza compresión para reducir el tamaño de las respuestas
   - Implementa solicitudes en paralelo cuando sea posible
   - Monitorea y optimiza el tiempo de respuesta

3. **Resiliencia**:
   - Implementa reintentos con backoff exponencial
   - Utiliza circuit breakers para evitar sobrecarga de servicios
   - Implementa timeouts adecuados
   - Prepárate para manejar interrupciones de servicio

4. **Mantenimiento**:
   - Documenta todas las integraciones con APIs externas
   - Mantén un registro de versiones de API utilizadas
   - Implementa pruebas automatizadas para integraciones
   - Monitorea cambios en las APIs externas

## Ejemplos de Integración

### Integración con API de Pagos

```javascript
// config/datasources.js
module.exports = {
  datasources: {
    stripe: {
      type: 'rest',
      baseURL: 'https://api.stripe.com/v1',
      auth: {
        type: 'basic',
        username: process.env.STRIPE_SECRET_KEY,
        password: ''
      },
      defaultHeaders: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  }
};

// models/Pago.js
module.exports = {
  name: 'Pago',
  datasource: 'stripe',
  endpoint: '/charges',
  operations: {
    create: {
      method: 'POST',
      endpoint: '/charges',
      body: '{data}',
      transform: (response) => response.data
    },
    retrieve: {
      method: 'GET',
      endpoint: '/charges/{id}',
      transform: (response) => response.data
    },
    list: {
      method: 'GET',
      endpoint: '/charges',
      params: {
        limit: '{limit:10}',
        starting_after: '{startingAfter}',
        customer: '{customerId}'
      },
      transform: (response) => ({
        items: response.data.data,
        hasMore: response.data.has_more,
        lastId: response.data.data.length > 0 ? response.data.data[response.data.data.length - 1].id : null
      })
    },
    refund: {
      method: 'POST',
      endpoint: '/refunds',
      body: {
        charge: '{chargeId}',
        amount: '{amount}',
        reason: '{reason}'
      },
      transform: (response) => response.data
    }
  }
};

// services/PagoService.js
module.exports = {
  async procesarPago(datos) {
    try {
      const { monto, moneda, descripcion, cliente, tarjeta } = datos;
      
      // Crear pago en Stripe
      const pago = await this.app.models.Pago.create({
        data: {
          amount: monto * 100, // Convertir a centavos
          currency: moneda || 'usd',
          description: descripcion,
          customer: cliente,
          source: tarjeta,
          metadata: {
            orderId: datos.ordenId
          }
        }
      });
      
      // Registrar pago en base de datos local
      await this.app.models.TransaccionPago.create({
        externalId: pago.id,
        monto: monto,
        moneda: moneda || 'usd',
        estado: pago.status,
        proveedor: 'stripe',
        clienteId: datos.clienteId,
        ordenId: datos.ordenId,
        metadatos: {
          tarjeta: {
            ultimos4: pago.source.last4,
            marca: pago.source.brand
          },
          recibo: pago.receipt_url
        },
        createdAt: new Date()
      });
      
      return {
        id: pago.id,
        estado: pago.status,
        monto: pago.amount / 100,
        moneda: pago.currency,
        recibo: pago.receipt_url
      };
    } catch (error) {
      this.app.logger.error('Error al procesar pago', { error: error.message });
      
      // Manejar errores específicos de Stripe
      if (error.response && error.response.data) {
        const stripeError = error.response.data.error;
        
        throw new Error(`Error de pago: ${stripeError.message} (${stripeError.code})`);
      }
      
      throw error;
    }
  }
};
```

### Integración con API de Redes Sociales

```javascript
// config/datasources.js
module.exports = {
  datasources: {
    twitter: {
      type: 'rest',
      baseURL: 'https://api.twitter.com/2',
      auth: {
        type: 'oauth2',
        tokenUrl: 'https://api.twitter.com/oauth2/token',
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET
      }
    }
  }
};

// models/Tweet.js
module.exports = {
  name: 'Tweet',
  datasource: 'twitter',
  operations: {
    search: {
      method: 'GET',
      endpoint: '/tweets/search/recent',
      params: {
        query: '{query}',
        max_results: '{maxResults:10}',
        next_token: '{nextToken}',
        expansions: 'author_id,attachments.media_keys',
        'tweet.fields': 'created_at,public_metrics,entities',
        'user.fields': 'name,username,profile_image_url'
      },
      transform: (response) => ({
        
      })
    }
  }
};
```
### Ejemplo de uso
```javascript
// services/TwitterService.js
module.exports = {
  async buscarTweets(query, maxResults = 10) {
    try {
      const tweets = await this.app.models.Tweet.search({
        query: query,
        maxResults: maxResults
      }); 
    } 
  } 
};
```
### Consideraciones
*   La configuración de la API de Twitter se almacena en un archivo de configuración
*   El modelo de datos para la búsqueda de tweets se define en el archivo `models/Tweet
*   El servicio de Twitter utiliza el modelo de datos para realizar la búsqueda de tweets
*   La búsqueda de tweets se realiza mediante un método `search` en el modelo de datos
*   El método `search` utiliza el método `GET` para realizar la búsqueda de tweets
*   El método `search` utiliza los parámetros `query`, `maxResults` y `nextToken` para realizar la búsqueda de tweets
*   El método `search` utiliza la transformación para convertir la respuesta de la API de Twitter en un objeto de datos
*   El servicio de Twitter utiliza el método `search` del modelo de datos para realizar la búsqueda de tweets

