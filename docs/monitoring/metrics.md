---
sidebar_position: 1
---

# Métricas

El dashboard de métricas proporciona una vista centralizada y detallada del comportamiento y rendimiento de tu aplicación **NexusData**, facilitando la supervisión de indicadores clave y el análisis de datos históricos para la toma de decisiones basada en métricas.

## Características principales

- **Visualización en tiempo real**: Consulta métricas actualizadas cada pocos segundos para una respuesta inmediata.
- **Alertas inteligentes**: Define umbrales críticos y recibe notificaciones automáticas cuando se detecten anomalías.
- **Análisis de tendencias**: Explora el comportamiento de las métricas a lo largo del tiempo para detectar patrones relevantes.
- **Dashboards personalizables**: Diseña vistas a medida con las métricas más importantes para tu operación.
- **Exportación y reportes**: Extrae métricas en formatos compatibles para análisis avanzados o generación de informes.

## Configuración del dashboard de métricas

### Configuración básica

Para activar el dashboard enfocado en métricas, asegúrate de habilitarlo en el archivo de configuración de NexusData:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  monitoring: {
    enabled: true,
    dashboard: {
      enabled: true,
      port: 3030,
      basePath: '/metrics-dashboard',
      auth: {
        enabled: true,
        type: 'basic', // 'basic', 'jwt', 'oauth'
        users: [
          {
            username: process.env.METRICS_DASHBOARD_USER || 'admin',
            password: process.env.METRICS_DASHBOARD_PASSWORD || 'admin'
          }
        ]
      }
    },
    metrics: {
      enabled: true,
      interval: 10000, // Intervalo de recopilación en milisegundos
      retention: {
        detailed: '7d',   // Datos detallados por 7 días
        hourly: '30d',    // Métricas por hora por 30 días
        daily: '365d'     // Métricas diarias por 1 año
      }
    },
    logging: {
      level: 'info', // Niveles: 'debug', 'info', 'warn', 'error'
      console: true,
      file: true,
      filePath: './logs/metrics-dashboard.log'
    }
  }
};
```

### Acceso al dashboard
Una vez configurado, puedes acceder al dashboard desde el navegador mediante:

```bash
http://localhost:3030/monitoring/metrics-dashboard
```
Si la autenticación está activada, se solicitarán las credenciales configuradas en MONITORING_USER y MONITORING_PASSWORD.

## Métricas disponibles

El dashboard puede mostrar múltiples tipos de métricas útiles para evaluar el estado de tu aplicación:

| **Tipo de Métrica**     | **Descripción**                                                                 |
|--------------------------|---------------------------------------------------------------------------------|
| **CPU**                  | Uso actual del procesador                                                      |
| **Memoria**              | Consumo de memoria RAM del proceso                                             |
| **Solicitudes HTTP**     | Cantidad de peticiones entrantes, errores y latencia promedio por endpoint     |
| **Errores**              | Tasa de errores, excepciones capturadas, códigos 4xx/5xx                       |
| **Tiempos de respuesta** | Medición del tiempo promedio de respuesta                                      |
| **Métricas personalizadas** | Puedes definir tus propias métricas según tus necesidades                   |
| **Promedio de peticiones** | Cantidad de peticiones por segundo en un intervalo de tiempo                  |

### Ejemplo de personalización de métricas
Puedes extender las métricas incorporando funciones personalizadas:
```javascript
metrics: {
  enabled: true,
  custom: [
    {
      name: 'active_sessions',
      value: () => getActiveSessionCount() // lógica interna definida por ti
    }
  ]
}
```

### Buenas prácticas recomendadas
- Activa autenticación para restringir el acceso al dashboard
- Ajusta el interval de recolección de métricas según la carga de tu sistema
- Utiliza los logs generados para análisis forense o trazabilidad de errores
- Exporta las métricas regularmente si necesitas integrarlas con herramientas externas como Grafana o Prometheus
- Usa los datos históricos para analizar patrones de crecimiento, detectar cuellos de botella y tomar decisiones técnicas más acertadas
- Considera la escalabilidad de tu sistema al agregar más métricas o usuarios

## Visualización de gráficos

El dashboard incluye soporte para visualizar métricas a través de gráficos dinámicos e interactivos, lo que facilita el análisis visual del comportamiento de la aplicación.

### Tipos de gráficos compatibles

Puedes representar las métricas del sistema con los siguientes tipos de gráficos:

- 📊 **Líneas**: Ideal para mostrar cambios de una métrica en el tiempo (por ejemplo, uso de CPU o latencia)
- 📈 **Áreas**: Visualización acumulativa útil para métricas como memoria utilizada
- 📉 **Barras**: Comparación entre diferentes endpoints o usuarios concurrentes
- 🔥 **Tortas (Pie charts)**: Para representar distribución (por ejemplo, tipos de errores o tipos de peticiones)
- ⏱️ **Indicadores de tiempo real**: Uso actual de recursos o número de usuarios activos

## Librerías sugeridas

Puedes integrar tu dashboard con librerías de gráficos como:

- [Chart.js](https://www.chartjs.org/)
- [ECharts](https://echarts.apache.org/)
- [D3.js](https://d3js.org/)
- [Recharts (React)](https://recharts.org/)
- [Plotly](https://plotly.com/javascript/)

Estas librerías permiten generar visualizaciones potentes y adaptables para mostrar los datos recopilados por NexusData.

---

## Ejemplo de integración con Chart.js

```html
<canvas id="cpuChart"></canvas>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  const ctx = document.getElementById('cpuChart').getContext('2d');
  const cpuChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['10:00', '10:01', '10:02', '10:03'],
      datasets: [{
        label: 'Uso de CPU (%)',
        data: [25, 40, 32, 47],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
</script>
```
Puedes enlazar este gráfico con un endpoint de la API que devuelva las métricas en tiempo real usando fetch() o Axios.

## API de métricas personalizada
Si deseas crear una API específica para alimentar tus gráficos con datos reales, puedes exponer un endpoint como este:
```javascript
// routes/metrics.js
app.get('/api/metrics/cpu', async (req, res) => {
  const usage = await getCpuUsage(); // tu función personalizada
  res.json({ time: Date.now(), value: usage });
});
```
Luego puedes consumirlo desde tu gráfico y actualizarlo en intervalos:
```javascript
setInterval(async () => {
  const response = await fetch('/api/metrics/cpu');
  const data = await response.json();
  // actualizar el gráfico dinámicamente...
}, 5000);
```
## Exportación gráfica de métricas
Además de visualizarlas en el dashboard, también puedes:

- 📥 Exportar gráficos como imágenes (.png, .svg, .pdf)
- 🧾 Generar reportes PDF automáticos con herramientas como:
  - jsPDF
  - Puppeteer (captura de pantallas del dashboard)
  - html2canvas

