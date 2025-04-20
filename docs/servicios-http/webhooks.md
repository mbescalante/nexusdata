---
sidebar_position: 5
---

# Webhooks

Los **webhooks** son mecanismos que permiten a tu aplicación **NexusData API** enviar automáticamente información a otra aplicación cuando ocurre un evento determinado. Son ideales para integraciones en tiempo real sin necesidad de hacer peticiones constantes (polling).

---

##  ¿Qué es un Webhook?

Un webhook es una **llamada HTTP automática** enviada desde tu aplicación a una URL externa cuando ocurre un evento específico. Por ejemplo:

- Cuando se crea un nuevo usuario
- Cuando se actualiza un pedido
- Cuando se detecta un error crítico

---

## ¿Cómo funciona?

1. Un evento ocurre en **NexusData API**
2. Se dispara el webhook automáticamente
3. Se realiza una petición HTTP (`POST`) a la URL configurada
4. La aplicación receptora procesa los datos recibidos

---

##  Ejemplo de payload enviado

```json
{
  "evento": "usuario_creado",
  "timestamp": "2025-04-19T15:30:00Z",
  "datos": {
    "id": 101,
    "nombre": "Andrea",
    "correo": "andrea@nexusdata.com"
  }
}
```

---
## Cómo configurar un Webhook
### Registrar la URL destino
```javascript
// nexusdata.config.js

module.exports = {
  // ...
  webhooks: {
    enabled: true,
    events: {
      usuario_creado: 'https://miapp.com/api/webhook/usuarios',
      pedido_confirmado: 'https://miapp.com/api/webhook/pedidos'
    },
    retries: 3,
    timeout: 5000 // ms
  }
};
```
### Enviar el Webhook
Ejemplo de envio con fetch:
```javascript
async function enviarWebhook(evento, payload) {
  const url = config.webhooks.events[evento];

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);
    console.log(`Webhook enviado a ${url}`);
  } catch (err) {
    console.error('Error al enviar webhook:', err.message);
    // Implementar lógica de reintento
  }
}
```
## Eventos comunes disponibles
| Evento              | Descripción                                           |
|---------------------|-------------------------------------------------------|
| `usuario_creado`    | Se ejecuta al registrar un nuevo usuario              |
| `pedido_confirmado` | Disparado al confirmar un pedido                      |
| `reporte_generado`  | Cuando se completa la generación de un informe        |
| `error_detectado`   | Cuando ocurre un error crítico en producción          |

## Seguridad en Webhooks
- **Validación de firmas**: Usa tokens o hashes para validar que la petición venga de una fuente confiable.

- **Cabeceras personalizadas**: Agrega una clave secreta en los headers.

## Pruebas con Webhooks
Puedes usar herramientas como:

- Webhook.site

- RequestBin

- Ngrok para exponer tu backend local

