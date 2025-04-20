---
sidebar_position: 3
---

# Sistema de Logs

El sistema de logs de **NexusData API** permite registrar eventos relevantes en tiempo real y almacenar un historial detallado de la actividad de la aplicación. Los registros son fundamentales para identificar errores, analizar el comportamiento de los usuarios y mantener la trazabilidad del sistema.

---

## Objetivo del sistema de logs

- Diagnóstico y depuración de errores
- Análisis de rendimiento
- Auditoría de operaciones críticas
- Alertas y trazabilidad de eventos del sistema
- Integración con herramientas externas de monitoreo

---

## Configuración de logging

La configuración se define en el archivo `nexusdata.config.js`, dentro del bloque `monitoring.logging`:

```javascript
module.exports = {
  monitoring: {
    logging: {
      level: 'info', // 'debug' | 'info' | 'warn' | 'error'
      console: true, // Mostrar logs en consola
      file: true,    // Registrar en archivo
      filePath: './logs/monitoring.log' // Ruta del archivo
    }
  }
};
```
## Niveles de log disponibles

| Nivel  | Descripción                                      |
|--------|--------------------------------------------------|
| `debug` | Información detallada para depurar              |
| `info`  | Eventos normales del sistema                    |
| `warn`  | Advertencias que requieren atención             |
| `error` | Errores críticos que afectan la ejecución       |

Puedes cambiar el nivel dinámicamente si el sistema lo permite:

```javascript
// Cambiar el nivel de log en tiempo de ejecución
nexusdata.logger.setLevel('warn');
```
## Ejemplo de registros
```html
[2025-04-19 14:21:11] [INFO] API iniciada en el puerto 3030
[2025-04-19 14:22:04] [DEBUG] Consulta SQL ejecutada: SELECT * FROM usuarios
[2025-04-19 14:23:10] [WARN] Tiempo de respuesta elevado en /auth/login
[2025-04-19 14:24:30] [ERROR] No se pudo conectar con MongoDB
```
Formato general:
```css
[TIMESTAMP] [NIVEL] Mensaje del evento
```
## Leer logs en consola
Puedes usar comandos de Bash para inspeccionar los registros fácilmente:

```bash
# Ver los últimos 20 registros
tail -n 20 ./logs/monitoring.log

# Ver los logs en tiempo real
tail -f ./logs/monitoring.log

# Filtrar solo errores
grep '\[ERROR\]' ./logs/monitoring.log

# Mostrar todos los eventos WARN y ERROR
egrep '\[WARN\]|\[ERROR\]' ./logs/monitoring.log
```
## Rotación de logs (manual)
Para evitar archivos de log excesivamente grandes, puedes crear un script para rotarlos:

```bash
#!/bin/bash
LOG_FILE="./logs/monitoring.log"
BACKUP_DIR="./logs/archive"

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
cp "$LOG_FILE" "$BACKUP_DIR/monitoring-$TIMESTAMP.log"
echo "" > "$LOG_FILE"
```
Ejecuta este script automáticamente con cron:

```bash
# Edita el cron
crontab -e

# Añade la rotación diaria a las 23:59
59 23 * * * /ruta/al/script/rotar-logs.sh
```

## Integración con herramientas externas
Los logs pueden integrarse con:
- Elastic Stack (ELK): Filebeat para enviar logs a Elasticsearch.
- Prometheus + Grafana: Para correlacionar logs y métricas.
- Sentry / Loggly / Graylog: Para alertas en tiempo real y dashboards visuales.

## Buenas prácticas
- Evita registrar datos sensibles (tokens, contraseñas, etc.)
- Usa niveles de log apropiados para cada tipo de evento
- Implementa limpieza automática de archivos viejos
- Protege los archivos de log de accesos no autorizados
- Asegura el uso de timestamps en formato ISO 8601 o UTC
## Ejemplo en tiempo de ejecución (JavaScript)
```javascript
const fs = require('fs');
const path = './logs/monitoring.log';

function log(level, message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  fs.appendFileSync(path, entry);
}

// Ejemplo de uso:
log('info', 'Servidor escuchando en el puerto 3030');
log('error', 'Fallo de autenticación en /login');
```


