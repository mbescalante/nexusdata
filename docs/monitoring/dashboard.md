---
sidebar_position: 1
---

# Dashboard de Monitoreo

El dashboard de monitoreo proporciona una visión centralizada del estado y rendimiento de tu aplicación NexusData, permitiéndote identificar problemas, analizar tendencias y tomar decisiones informadas.

## Características principales

- **Monitoreo en tiempo real**: Visualiza métricas clave en tiempo real
- **Alertas configurables**: Recibe notificaciones cuando las métricas superen umbrales definidos
- **Análisis histórico**: Analiza tendencias y patrones a lo largo del tiempo
- **Personalización**: Adapta el dashboard a tus necesidades específicas
- **Exportación de datos**: Exporta datos para análisis externos

## Configuración del dashboard

### Configuración básica

Para habilitar el dashboard de monitoreo, debes configurarlo en tu archivo de configuración:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  monitoring: {
    enabled: true,
    dashboard: {
      enabled: true,
      port: 3030,
      basePath: '/monitoring',
      auth: {
        enabled: true,
        type: 'basic', // 'basic', 'jwt', 'oauth'
        users: [
          {
            username: process.env.MONITORING_USER || 'admin',
            password: process.env.MONITORING_PASSWORD || 'admin'
          }
        ]
      }
    },
    metrics: {
      enabled: true,
      interval: 10000, // ms
      retention: {
        detailed: '7d',
        hourly: '30d',
        daily: '365d'
      }
    },
    logging: {
      level: 'info', // 'debug', 'info', 'warn', 'error'
      console: true,
      file: true,
      filePath: './logs/monitoring.log'
    }
  }
};
```
### Configuración avanzada
Para una configuración más avanzada, puedes personalizar los siguientes aspectos:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  monitoring: {
    // ... configuración básica
    dashboard: {
      // ... configuración básica del dashboard
      customization: {
        title: 'NexusData Monitoring',
        logo: '/path/to/logo.png',
        theme: 'dark', // 'light', 'dark', 'custom'
        colors: {
          primary: '#3498db',
          secondary: '#2ecc71',
          danger: '#e74c3c',
          warning: '#f39c12',
          info: '#1abc9c'
        },
        defaultView: 'overview', // 'overview', 'services', 'database', 'api'
        refreshInterval: 30000 // ms
      },
      access: {
        ip: ['127.0.0.1'], // IPs permitidas, vacío para permitir todas
        roles: ['admin', 'monitoring'] // Roles con acceso
      }
    },
    alerts: {
      enabled: true,
      channels: {
        email: {
          enabled: true,
          recipients: ['admin@example.com'],
          throttle: '15m' // Tiempo mínimo entre alertas similares
        },
        slack: {
          enabled: process.env.SLACK_WEBHOOK ? true : false,
          webhook: process.env.SLACK_WEBHOOK,
          channel: '#monitoring',
          username: 'NexusData Monitor',
          throttle: '5m'
        },
        webhook: {
          enabled: process.env.ALERT_WEBHOOK ? true : false,
          url: process.env.ALERT_WEBHOOK,
          headers: {
            'Authorization': `Bearer ${process.env.ALERT_WEBHOOK_TOKEN}`
          },
          throttle: '1m'
        }
      },
      rules: [
        {
          name: 'high-cpu-usage',
          metric: 'system.cpu.usage',
          condition: '> 90',
          duration: '5m',
          severity: 'critical',
          message: 'CPU usage is above 90% for more than 5 minutes',
          channels: ['email', 'slack']
        },
        {
          name: 'high-memory-usage',
          metric: 'system.memory.usage',
          condition: '> 85',
          duration: '10m',
          severity: 'warning',
          message: 'Memory usage is above 85% for more than 10 minutes',
          channels: ['slack']
        },
        {
          name: 'api-error-rate',
          metric: 'api.error.rate',
          condition: '> 5',
          duration: '3m',
          severity: 'critical',
          message: 'API error rate is above 5% for more than 3 minutes',
          channels: ['email', 'slack', 'webhook']
        }
      ]
    }
  }
};
```

## Paneles disponibles
### Panel de visión general
El panel de visión general proporciona una vista de alto nivel del estado de tu aplicación, incluyendo:

- Estado general del sistema
- Uso de recursos (CPU, memoria, disco)
- Tasa de solicitudes API
- Tasa de errores
- Tiempo de respuesta promedio
- Estado de servicios críticos
- Alertas activas
### Panel de servicios
El panel de servicios muestra información detallada sobre cada servicio de tu aplicación:

- Estado de cada servicio
- Tiempo de actividad
- Uso de recursos por servicio
- Tasa de solicitudes
- Tiempo de respuesta
- Errores por servicio
- Dependencias entre servicios
### Panel de base de datos
El panel de base de datos proporciona información sobre el rendimiento de tu base de datos:

- Conexiones activas
- Tiempo de respuesta de consultas
- Consultas por segundo
- Consultas lentas
- Uso de índices
- Tamaño de la base de datos
- Operaciones de escritura/lectura
### Panel de API
El panel de API muestra métricas relacionadas con tus endpoints API:

- Solicitudes por endpoint
- Tiempo de respuesta por endpoint
- Tasa de errores por endpoint
- Códigos de estado HTTP
- Usuarios activos
- Distribución geográfica de solicitudes
- Endpoints más utilizados
### Panel de logs
El panel de logs te permite visualizar y buscar en los logs de tu aplicación:

- Logs en tiempo real
- Búsqueda avanzada
- Filtrado por nivel, servicio, fecha
- Análisis de patrones
- Exportación de logs
- Correlación de eventos
## Métricas disponibles
### Métricas del sistema 📊
| **Métrica**            | **Descripción**                  | **Unidad** |
|------------------------|----------------------------------|------------|
| `system.cpu.usage`     | Porcentaje de uso de CPU         | %          |
| `system.memory.usage`  | Porcentaje de uso de memoria     | %          |
| `system.memory.free`   | Memoria libre                    | MB         |
| `system.disk.usage`    | Porcentaje de uso de disco       | %          |
| `system.disk.free`     | Espacio libre en disco           | GB         |
| `system.load.1m`       | Carga del sistema (1 minuto)     | -          |
| `system.load.5m`       | Carga del sistema (5 minutos)    | -          |
| `system.load.15m`      | Carga del sistema (15 minutos)   | -          |
| `system.network.in`    | Tráfico de red entrante          | KB/s       |
| `system.network.out`   | Tráfico de red saliente          | KB/s       |
### Métricas de aplicación 🚀
| **Métrica**           | **Descripción**                     | **Unidad**  |
|-----------------------|-------------------------------------|-------------|
| `app.uptime`          | Tiempo de actividad de la aplicación| segundos    |
| `app.instances`       | Número de instancias en ejecución   | -           |
| `app.memory.usage`    | Uso de memoria de la aplicación     | MB          |
| `app.cpu.usage`       | Uso de CPU de la aplicación         | %           |
| `app.errors.count`    | Número total de errores             | -           |
| `app.warnings.count`  | Número total de advertencias        | -           |

### Métricas de API 🌐
| **Métrica**           | **Descripción**                    | **Unidad** |
|-----------------------|------------------------------------|------------|
| `api.requests.total`  | Número total de solicitudes        | -          |
| `api.requests.rate`   | Tasa de solicitudes                | req/s      |
| `api.response.time`   | Tiempo de respuesta promedio       | ms         |
| `api.error.rate`      | Tasa de errores                    | %          |
| `api.status.2xx`      | Respuestas con código 2xx          | -          |
| `api.status.3xx`      | Respuestas con código 3xx          | -          |
| `api.status.4xx`      | Respuestas con código 4xx          | -          |
| `api.status.5xx`      | Respuestas con código 5xx          | -          |

### Métricas de base de datos 🗄️
| **Métrica**           | **Descripción**                   | **Unidad** |
|-----------------------|-----------------------------------|------------|
| `db.connections`      | Conexiones activas                | -          |
| `db.queries.rate`     | Consultas por segundo             | q/s        |
| `db.response.time`    | Tiempo de respuesta promedio      | ms         |
| `db.slow.queries`     | Consultas lentas                  | -          |
| `db.transactions`     | Transacciones por segundo         | tx/s       |
| `db.size`             | Tamaño de la base de datos        | MB         |
| `db.reads`            | Operaciones de lectura            | op/s       |
| `db.writes`           | Operaciones de escritura          | op/s       |

## ersonalización del dashboard
### Creación de paneles personalizados
Puedes crear paneles personalizados para visualizar métricas específicas de tu aplicación:

```javascript
// src/monitoring/dashboards/CustomDashboard.js
import { Dashboard } from '@nexusdata/monitoring';

class CustomDashboard extends Dashboard {
  static name = 'custom-dashboard';
  static title = 'Mi Dashboard Personalizado';
  static description = 'Dashboard personalizado para métricas específicas';
  
  configure() {
    return {
      layout: [
        { i: 'widget1', x: 0, y: 0, w: 6, h: 8 },
        { i: 'widget2', x: 6, y: 0, w: 6, h: 8 },
        { i: 'widget3', x: 0, y: 8, w: 12, h: 8 }
      ],
      widgets: [
        {
          id: 'widget1',
          type: 'line-chart',
          title: 'Usuarios Activos',
          metric: 'custom.users.active',
          timeRange: '24h',
          refreshInterval: 60000
        },
        {
          id: 'widget2',
          type: 'bar-chart',
          title: 'Transacciones por Hora',
          metric: 'custom.transactions.hourly',
          timeRange: '7d',
          aggregation: 'sum',
          groupBy: 'hour'
        },
        {
          id: 'widget3',
          type: 'table',
          title: 'Últimos Errores',
          dataSource: 'errors',
          limit: 10,
          columns: [
            { field: 'timestamp', label: 'Fecha', type: 'datetime' },
            { field: 'service', label: 'Servicio' },
            { field: 'message', label: 'Mensaje' },
            { field: 'count', label: 'Ocurrencias', type: 'number' }
          ],
          sortBy: 'timestamp',
          sortDirection: 'desc'
        }
      ]
    };
  }
  
  // Opcional: Lógica personalizada para procesar datos
  async processData(data, context) {
    // Transformar o enriquecer datos antes de mostrarlos
    return data;
  }
}

export default CustomDashboard;
```

### Registro de paneles personalizados
Para registrar tus paneles personalizados, debes incluirlos en tu archivo de configuración:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  monitoring: {
    // ... configuración de monitoreo
    dashboard: {
      // ... configuración del dashboard
      customDashboards: [
        'src/monitoring/dashboards/CustomDashboard',
        'src/monitoring/dashboards/SalesDashboard',
        'src/monitoring/dashboards/UserActivityDashboard'
      ]
    }
  }
};
 ```


## Recolección de métricas personalizadas
### Definición de métricas personalizadas
Puedes definir métricas personalizadas para tu aplicación:

```javascript
// src/monitoring/metrics/CustomMetrics.js
import { MetricCollector } from '@nexusdata/monitoring';

class CustomMetrics extends MetricCollector {
  static name = 'custom-metrics';
  static description = 'Recolector de métricas personalizadas';
  static interval = 30000; // ms
  
  async collect(context) {
    const metrics = [];
    
    // Obtener datos para métricas personalizadas
    const activeUsers = await this.getActiveUsers(context);
    const salesData = await this.getSalesData(context);
    
    // Registrar métricas
    metrics.push({
      name: 'custom.users.active',
      value: activeUsers.count,
      tags: {
        type: 'user_metric'
      }
    });
    
    metrics.push({
      name: 'custom.users.active.by_region',
      value: activeUsers.count,
      tags: {
        type: 'user_metric',
        region: 'europe'
      }
    });
    
    metrics.push({
      name: 'custom.sales.total',
      value: salesData.total,
      tags: {
        type: 'business_metric',
        currency: 'USD'
      }
    });
    
    metrics.push({
      name: 'custom.sales.count',
      value: salesData.count,
      tags: {
        type: 'business_metric'
      }
    });
    
    return metrics;
  }
  
  async getActiveUsers(context) {
    // Lógica para obtener usuarios activos
    const count = await context.db.count('Session', {
      where: {
        lastActivity: {
          gt: new Date(Date.now() - 15 * 60 * 1000) // Últimos 15 minutos
        }
      }
    });
    
    return { count };
  }
  
  async getSalesData(context) {
    // Lógica para obtener datos de ventas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sales = await context.db.findMany('Order', {
      where: {
        status: 'completed',
        completedAt: {
          gte: today
        }
      },
      select: {
        id: true,
        total: true
      }
    });
    
    const total = sales.reduce((sum, order) => sum + order.total, 0);
    
    return {
      count: sales.length,
      total
    };
  }
}

export default CustomMetrics;
```

### Registro de recolectores de métricas
Para registrar tus recolectores de métricas personalizadas, debes incluirlos en tu archivo de configuración:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  monitoring: {
    // ... configuración de monitoreo
    metrics: {
      // ... configuración de métricas
      collectors: [
        'src/monitoring/metrics/CustomMetrics',
        'src/monitoring/metrics/PerformanceMetrics',
        'src/monitoring/metrics/BusinessMetrics'
      ]
    }
  }
};
```

## Integración con servicios externos
### Exportación a Prometheus
Puedes exportar métricas a Prometheus para su visualización en Grafana u otras herramientas:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  monitoring: {
    // ... configuración de monitoreo
    exporters: {
      prometheus: {
        enabled: true,
        port: 9090,
        path: '/metrics',
        defaultLabels: {
          app: 'nexusdata',
          environment: process.env.NODE_ENV || 'development'
        }
      }
    }
  }
};
```

### Integración con Datadog
Para enviar métricas a Datadog:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  monitoring: {
    // ... configuración de monitoreo
    exporters: {
      datadog: {
        enabled: process.env.DATADOG_API_KEY ? true : false,
        apiKey: process.env.DATADOG_API_KEY,
        appKey: process.env.DATADOG_APP_KEY,
        host: process.env.HOSTNAME || 'unknown',
        tags: [
          `env:${process.env.NODE_ENV || 'development'}`,
          'service:nexusdata'
        ],
        flushIntervalSeconds: 15
      }
    }
  }
};
 ```


### Integración con New Relic
Para enviar métricas a New Relic:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  monitoring: {
    // ... configuración de monitoreo
    exporters: {
      newrelic: {
        enabled: process.env.NEW_RELIC_LICENSE_KEY ? true : false,
        licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
        appName: process.env.NEW_RELIC_APP_NAME || 'NexusData',
        distributed: true,
        logging: {
          level: 'info'
        }
      }
    }
  }
};
```

## Alertas y notificaciones
### Configuración de reglas de alerta
Puedes configurar reglas de alerta basadas en umbrales para recibir notificaciones cuando las métricas superen ciertos valores:

```javascript
// src/monitoring/alerts/PerformanceAlerts.js
import { AlertRule } from '@nexusdata/monitoring';

class HighApiLatencyAlert extends AlertRule {
  static name = 'high-api-latency';
  static description = 'Alerta cuando la latencia de la API es alta';
  
  configure() {
    return {
      metric: 'api.response.time',
      condition: '> 500', // ms
      duration: '5m', // Duración mínima para activar la alerta
      severity: 'warning',
      message: 'La latencia de la API es superior a 500ms durante más de 5 minutos',
      runbook: 'https://wiki.example.com/runbooks/high-api-latency',
      channels: ['email', 'slack'],
      throttle: '30m', // Tiempo mínimo entre alertas similares
      recovery: {
        condition: '< 300', // ms
        duration: '5m', // Duración mínima para considerar recuperada
        message: 'La latencia de la API ha vuelto a niveles normales'
      }
    };
  }
  
  // Opcional: Lógica personalizada para evaluar la alerta
  async evaluate(value, context) {
    // Lógica personalizada para determinar si se debe activar la alerta
    // Por defecto, se usa la condición configurada
    
    // Ejemplo: Solo alertar durante horario laboral
    const now = new Date();
    const hour = now.getHours();
    const isWorkingHour = hour >= 9 && hour <= 18;
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    
    if (!isWorkingHour || !isWeekday) {
      // Aumentar el umbral fuera del horario laboral
      return value > 1000;
    }
    
    // Usar el umbral normal durante horario laboral
    return value > 500;
  }
  
  // Opcional: Personalizar el mensaje de la alerta
  formatMessage(value, context) {
    return `[${this.getSeverityEmoji()}] La latencia de la API es de ${value.toFixed(2)}ms, superando el umbral de 500ms durante más de 5 minutos. Endpoint más lento: ${context.slowestEndpoint || 'desconocido'}`;
  }
  
  getSeverityEmoji() {
    const emojis = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '🔴',
      critical: '🚨'
    };
    
    return emojis[this.config.severity] || '⚠️';
  }
}

class DatabaseConnectionsAlert extends AlertRule {
  static name = 'high-db-connections';
  static description = 'Alerta cuando hay demasiadas conexiones a la base de datos';
  
  configure() {
    return {
      metric: 'db.connections',
      condition: '> 80%', // Porcentaje del máximo configurado
      duration: '10m',
      severity: 'error',
      message: 'El número de conexiones a la base de datos está por encima del 80% del máximo permitido',
      channels: ['email', 'slack', 'pagerduty'],
      throttle: '15m'
    };
  }
}

export { HighApiLatencyAlert, DatabaseConnectionsAlert };
```
### Registro de reglas de alerta
Para registrar tus reglas de alerta, debes incluirlas en tu archivo de configuración:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  monitoring: {
    // ... configuración de monitoreo
    alerts: {
      // ... configuración de alertas
      rules: [
        'src/monitoring/alerts/PerformanceAlerts',
        'src/monitoring/alerts/SecurityAlerts',
        'src/monitoring/alerts/BusinessAlerts'
      ]
    }
  }
};
 ```


## Acceso al dashboard
### Acceso web
El dashboard de monitoreo está disponible en la URL configurada:

```plaintext
http://tu-servidor:3030/monitoring
```
### Acceso a la API
La API de monitoreo está disponible en la URL configurada:
```plaintext

URL_ADDRESS-servidor:3030/api/monitoring
```
### Acceso a la API de alertas
La API de alertas está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/alerts
```
### Acceso a la API de reglas de alerta
La API de reglas de alerta está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/alerts/rules
```
### Acceso a la API de eventos de alerta
La API de eventos de alerta está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/alerts/events
```
### Acceso a la API de métricas
La API de métricas está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/metrics
```
### Acceso a la API de configuración
La API de configuración está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/config
```
### Acceso a la API de paneles personalizados
La API de paneles personalizados está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/dashboards
```
### Acceso a la API de gráficos
La API de gráficos está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/charts
```
### Acceso a la API de tablas
La API de tablas está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/tables
```
### Acceso a la API de gráficos de barras
La API de gráficos de barras está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/bar-charts
```
### Acceso a la API de gráficos de líneas
La API de gráficos de líneas está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/line-charts
```
### Acceso a la API de gráficos de pastel
La API de gráficos de pastel está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/pie-charts
```
### Acceso a la API de gráficos de dispersión
La API de gráficos de dispersión está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/scatter-charts
```
### Acceso a la API de gráficos de histogramas
La API de gráficos de histogramas está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/histogram-charts
```
### Acceso a la API de gráficos de áreas
La API de gráficos de áreas está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/area-charts
```
### Acceso a la API de gráficos de columnas
La API de gráficos de columnas está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/column-charts
```
### Acceso a la API de gráficos de burbujas

La API de gráficos de burbujas está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/bubble-charts
```
### Acceso a la API de gráficos de radar
La API de gráficos de radar está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/radar-charts
```
### Acceso a la API de gráficos de polígonos
La API de gráficos de polígonos está disponible en la URL configurada:
```plaintext
URL_ADDRESS-servidor:3030/api/monitoring/polygon-charts
```
