---
sidebar_position: 2
---

# Sistema de Alertas

El sistema de alertas de **NexusData API** permite detectar automáticamente comportamientos anómalos o eventos críticos dentro de tu aplicación y notificarte a tiempo para tomar decisiones inmediatas.

---

## Características de las alertas

- 🔔 **Alertas en tiempo real**: Notificación inmediata al alcanzar un umbral.
- ⚙️ **Configuración flexible**: Define umbrales personalizados por métrica.
- 📧 **Integración con servicios externos**: Soporte para email, Slack, Webhooks, entre otros.
- 🕒 **Historial de alertas**: Consulta eventos pasados para auditoría o análisis.

---

## Tipos de alertas soportadas

| **Tipo de Alerta**     | **Descripción**                                                                   |
|------------------------|-----------------------------------------------------------------------------------|
| **CPU**                | Se dispara si el uso de CPU supera el porcentaje establecido                     |
| **Memoria**            | Alerta si el consumo de memoria excede el límite configurado                     |
| **Errores HTTP**       | Detecta picos de errores 4xx/5xx o excepciones                                     |
| **Latencia elevada**   | Se dispara si el tiempo de respuesta promedio supera el umbral definido           |
| **Personalizadas**     | Puedes crear alertas basadas en cualquier métrica o lógica propia                 |

---

## Configuración de alertas

Puedes definir las alertas dentro de tu archivo `nexusdata.config.js` de la siguiente manera:

```javascript
// nexusdata.config.js
module.exports = {
  monitoring: {
    alerts: {
      enabled: true,
      rules: [
        {
          id: 'cpu-high',
          metric: 'cpu',
          threshold: 80, // porcentaje
          operator: '>',
          duration: '1m',
          message: 'Uso de CPU superior al 80% por más de 1 minuto',
          notify: ['email', 'slack']
        },
        {
          id: 'errors-5xx',
          metric: 'errors',
          threshold: 5,
          operator: '>=',
          duration: '5m',
          message: 'Se detectaron más de 5 errores 5xx en los últimos 5 minutos',
          notify: ['webhook']
        }
      ],
      channels: {
        email: {
          enabled: true,
          to: ['admin@nexusdata.com']
        },
        slack: {
          enabled: true,
          webhookUrl: process.env.SLACK_ALERTS_WEBHOOK
        },
        webhook: {
          enabled: true,
          url: 'https://api.tusistemaexterno.com/alerta'
        }
      }
    }
  }
};
```

## 🧪 Lógica de activación
Una alerta se activa cuando se cumplen todas estas condiciones:
  1. La métrica definida supera (o cumple con el operador) el umbral.
  2. Esa condición persiste por al menos el tiempo definido en duration.
  3. La alerta no ha sido enviada recientemente (anti-spam control).
Esto evita falsos positivos y asegura que las notificaciones sean relevantes.

## 📬 Canales de notificación
Puedes integrar las alertas con los siguientes canales:
  - Email: Envía alertas a direcciones configuradas.
  - Slack: Utiliza Webhooks para notificar a canales específicos.
  - Webhooks: Envío de datos estructurados a APIs externas o sistemas personalizados.
Cada canal puede ser activado o desactivado individualmente.

## 🔎 Ejemplo visual de alerta
Puedes incluir una alerta visual en tu dashboard como esta:
```html
<div class="alert alert-danger">
  🚨 <strong>Alerta crítica:</strong> Uso de CPU superior al 90%
</div>
```
## 🧠 Buenas prácticas
- ✅ Usa nombres descriptivos en tus alertas (id) para facilitar su mantenimiento.

- ⏳ Utiliza la duración (duration) para filtrar picos temporales.

- 🔐 Protege tus webhooks con tokens o autenticación.

- 📝 Documenta las reglas de alerta para tu equipo.

## 📁 Histórico y seguimiento
Todas las alertas generadas pueden ser registradas en archivos de log si habilitas la opción en el sistema de logging:
```javascript
monitoring: {
  logging: {
    file: true,
    filePath: './logs/alerts.log'
  }
}
```

## 📌 Conclusión
El sistema de alertas en NexusData API es una herramienta esencial para mantener tu aplicación bajo control. Su configuración flexible, capacidad de integración y soporte para múltiples métricas lo convierten en un componente clave del ecosistema de monitoreo.

### 💡 Recuerda: 
Una alerta bien configurada puede ahorrarte horas de trabajo y proteger tu reputación.

