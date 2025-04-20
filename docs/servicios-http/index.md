---
sidebar_position: 6
title: Guía Práctica de Servicios HTTP
description: Aprende a utilizar los Servicios HTTP de NexusData mediante ejemplos prácticos y casos de uso reales
---

# Guía Práctica de Servicios HTTP

NexusData ofrece potentes Servicios HTTP que te permiten interactuar con tus datos de forma intuitiva. En esta guía, aprenderás a utilizar estos servicios mediante casos de uso reales y ejemplos prácticos.

## Primeros pasos con los Servicios HTTP

### Explorar tus datos

La forma más sencilla de comenzar es recuperando datos de tus modelos. Por ejemplo, para obtener una lista de productos:

```bash
curl https://api.nexusdata.io/api/productos
```

Respuesta:

```json
{
  "data": [
    {
      "id": "1",
      "nombre": "Laptop Pro X",
      "precio": 1299.99,
      "disponible": true
    },
    {
      "id": "2",
      "nombre": "Smartphone Galaxy Z",
      "precio": 899.99,
      "disponible": true
    }
  ],
  "meta": {
    "totalCount": 24,
    "currentPage": 1,
    "perPage": 20
  }
}
```

### Autenticarse en los servicios

Antes de realizar operaciones protegidas, necesitas autenticarte:

```bash
# Obtener token de acceso
curl -X POST https://api.nexusdata.io/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@ejemplo.com", "password": "contraseña_segura"}'
```

Respuesta:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

Ahora puedes usar este token para autenticar tus solicitudes:

```bash
curl https://api.nexusdata.io/api/usuarios/perfil \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Caso de uso: Gestión de inventario

Vamos a ver cómo utilizar los Servicios HTTP para gestionar un inventario de productos.

### 1. Crear un nuevo producto

```javascript
// Usando JavaScript y Fetch API
async function crearProducto() {
  const nuevoProducto = {
    nombre: "Monitor Curvo 32\"",
    descripcion: "Monitor curvo de alta resolución",
    precio: 349.99,
    categoria: "Electrónicos",
    inventario: 45
  };

  const response = await fetch('https://api.nexusdata.io/api/productos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nuevoProducto)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error al crear producto:', error);
    return null;
  }

  return await response.json();
}
```

### 2. Actualizar inventario cuando se realiza una venta

```python
# Usando Python con Requests
import requests

def actualizar_inventario(producto_id, cantidad_vendida):
    # Primero obtenemos el producto actual
    response = requests.get(
        f'https://api.nexusdata.io/api/productos/{producto_id}',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if response.status_code != 200:
        print(f"Error al obtener producto: {response.json()}")
        return False
    
    producto = response.json()['data']
    nuevo_inventario = producto['inventario'] - cantidad_vendida
    
    if nuevo_inventario < 0:
        print("Error: Inventario insuficiente")
        return False
    
    # Actualizamos el inventario
    response = requests.patch(
        f'https://api.nexusdata.io/api/productos/{producto_id}',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        },
        json={'inventario': nuevo_inventario}
    )
    
    return response.status_code == 200
```

### 3. Obtener productos con bajo inventario

```php
<?php
// Usando PHP con cURL
function obtenerProductosBajoInventario($umbral = 10) {
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://api.nexusdata.io/api/productos?filter[inventario][lt]={$umbral}&sort=inventario&order=asc",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer " . $token,
            "Content-Type: application/json"
        ]
    ]);
    
    $response = curl_exec($curl);
    $productos = json_decode($response, true);
    curl_close($curl);
    
    return $productos['data'] ?? [];
}

// Alertar sobre productos con inventario bajo
$productosBajos = obtenerProductosBajoInventario(5);
foreach ($productosBajos as $producto) {
    enviarAlerta("Inventario bajo para {$producto['nombre']}. Quedan {$producto['inventario']} unidades.");
}
?>
```

## Caso de uso: Procesamiento de pedidos

### 1. Crear un nuevo pedido

```javascript
// Usando Node.js con Axios
const axios = require('axios');

async function crearPedido(clienteId, items) {
  try {
    // Validar disponibilidad
    for (const item of items) {
      const { data } = await axios.get(`/api/productos/${item.productoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (data.data.inventario < item.cantidad) {
        throw new Error(`Inventario insuficiente para ${data.data.nombre}`);
      }
    }
    
    // Calcular totales
    let subtotal = 0;
    const lineasPedido = [];
    
    for (const item of items) {
      const { data } = await axios.get(`/api/productos/${item.productoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const producto = data.data;
      const precioUnitario = producto.precio;
      const subtotalLinea = precioUnitario * item.cantidad;
      
      lineasPedido.push({
        productoId: item.productoId,
        nombre: producto.nombre,
        precioUnitario,
        cantidad: item.cantidad,
        subtotal: subtotalLinea
      });
      
      subtotal += subtotalLinea;
    }
    
    const impuestos = subtotal * 0.16; // 16% de impuestos
    const total = subtotal + impuestos;
    
    // Crear el pedido
    const { data } = await axios.post('/api/pedidos', {
      clienteId,
      lineasPedido,
      subtotal,
      impuestos,
      total,
      estado: 'PENDIENTE'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Actualizar inventario
    for (const item of items) {
      const { data: producto } = await axios.get(`/api/productos/${item.productoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      await axios.patch(`/api/productos/${item.productoId}`, {
        inventario: producto.data.inventario - item.cantidad
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error al crear pedido:', error.response?.data || error.message);
    throw error;
  }
}
```

### 2. Actualizar estado de un pedido

```python
# Usando Python
def actualizar_estado_pedido(pedido_id, nuevo_estado, notas=None):
    datos_actualizacion = {
        'estado': nuevo_estado
    }
    
    if notas:
        datos_actualizacion['notas'] = notas
    
    response = requests.patch(
        f'https://api.nexusdata.io/api/pedidos/{pedido_id}',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        },
        json=datos_actualizacion
    )
    
    if response.status_code == 200:
        # Registrar el cambio en el historial
        requests.post(
            'https://api.nexusdata.io/api/historial-pedidos',
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            },
            json={
                'pedidoId': pedido_id,
                'estadoAnterior': 'PENDIENTE',  # En un caso real, obtendríamos esto del pedido
                'estadoNuevo': nuevo_estado,
                'notas': notas,
                'usuarioId': usuario_actual_id
            }
        )
        
        # Si el pedido está completado, enviar confirmación al cliente
        if nuevo_estado == 'COMPLETADO':
            enviar_confirmacion_cliente(pedido_id)
            
        return True
    
    return False
```

## Caso de uso: Análisis de datos de ventas

### Obtener estadísticas de ventas por período

```javascript
// Usando JavaScript
async function obtenerEstadisticasVentas(fechaInicio, fechaFin) {
  try {
    const params = new URLSearchParams({
      'filter[fechaCreacion][gte]': fechaInicio,
      'filter[fechaCreacion][lte]': fechaFin,
      'filter[estado]': 'COMPLETADO'
    }).toString();
    
    const response = await fetch(`https://api.nexusdata.io/api/pedidos?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    const pedidos = data.data;
    
    // Calcular estadísticas
    const totalVentas = pedidos.reduce((sum, pedido) => sum + pedido.total, 0);
    const ventasPorCategoria = {};
    
    // Procesar líneas de pedido para estadísticas por categoría
    for (const pedido of pedidos) {
      const detalleResponse = await fetch(`https://api.nexusdata.io/api/pedidos/${pedido.id}?include=lineasPedido`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const detalleData = await detalleResponse.json();
      const lineasPedido = detalleData.data.lineasPedido;
      
      for (const linea of lineasPedido) {
        const productoResponse = await fetch(`https://api.nexusdata.io/api/productos/${linea.productoId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const producto = await productoResponse.json();
        const categoria = producto.data.categoria;
        
        if (!ventasPorCategoria[categoria]) {
          ventasPorCategoria[categoria] = 0;
        }
        
        ventasPorCategoria[categoria] += linea.subtotal;
      }
    }
    
    return {
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      totalPedidos: pedidos.length,
      totalVentas,
      ventasPorCategoria,
      ticketPromedio: totalVentas / pedidos.length
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
}
```

## Caso de uso: Integración con sistemas externos

### Sincronizar datos con sistema externo

```php
<?php
// Obtener productos actualizados desde cierta fecha y sincronizarlos con sistema externo
function sincronizarProductos($fechaUltimaSincronizacion) {
    // Configurar cliente HTTP
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://api.nexusdata.io/api/productos?filter[updatedAt][gte]={$fechaUltimaSincronizacion}&limit=100",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer " . $token,
            "Content-Type: application/json"
        ]
    ]);
    
    $response = curl_exec($curl);
    $productos = json_decode($response, true);
    curl_close($curl);
    
    if (!isset($productos['data'])) {
        return [
            'exito' => false,
            'mensaje' => 'Error al obtener productos',
            'datos' => $productos
        ];
    }
    
    $resultados = [
        'total' => count($productos['data']),
        'exito' => 0,
        'error' => 0,
        'detalles' => []
    ];
    
    // Enviar cada producto al sistema externo
    foreach ($productos['data'] as $producto) {
        $resultado = enviarProductoSistemaExterno($producto);
        
        if ($resultado['exito']) {
            $resultados['exito']++;
        } else {
            $resultados['error']++;
        }
        
        $resultados['detalles'][] = [
            'id' => $producto['id'],
            'nombre' => $producto['nombre'],
            'resultado' => $resultado
        ];
    }
    
    return $resultados;
}

// Función que envía datos al sistema externo
function enviarProductoSistemaExterno($producto) {
    // Mapear datos al formato del sistema externo
    $datosSistemaExterno = [
        'external_id' => $producto['id'],
        'name' => $producto['nombre'],
        'description' => $producto['descripcion'] ?? '',
        'price' => $producto['precio'],
        'stock_quantity' => $producto['inventario'],
        'category' => $producto['categoria'],
        'last_updated' => $producto['updatedAt']
    ];
    
    // Enviar datos al sistema externo
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://sistema-externo.ejemplo.com/api/products",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($datosSistemaExterno),
        CURLOPT_HTTPHEADER => [
            "API-Key: " . SISTEMA_EXTERNO_API_KEY,
            "Content-Type: application/json"
        ]
    ]);
    
    $response = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    $responseData = json_decode($response, true);
    
    return [
        'exito' => $status >= 200 && $status < 300,
        'codigo' => $status,
        'respuesta' => $responseData
    ];
}
?>
```

## Referencia rápida: URLs y formatos

### Estructura de URL

Las URLs de los Servicios HTTP siguen un formato predecible:

```
/api/[nombreDelModelo]                # Colección de recursos (ej: /api/productos)
/api/[nombreDelModelo]/[id]           # Recurso individual (ej: /api/productos/123)
/api/[nombreDelModelo]/[id]/[relacion] # Relación de un recurso (ej: /api/productos/123/categorias)
/api/batch/[nombreDelModelo]          # Operaciones por lotes (ej: /api/batch/productos)
```

**Nota importante**: `[nombreDelModelo]` es un placeholder y debe reemplazarse con el nombre real del modelo (como "productos", "usuarios", "pedidos", etc.) al hacer las peticiones. No uses literalmente la palabra "[nombreDelModelo]" en tus URLs.

### Métodos HTTP soportados

| Método | Endpoint | Descripción | Ejemplo |
|--------|----------|-------------|---------|
| GET | /api/[nombreDelModelo] | Listar recursos | GET /api/productos |
| GET | /api/[nombreDelModelo]/[id] | Obtener un recurso | GET /api/productos/123 |
| POST | /api/[nombreDelModelo] | Crear recurso | POST /api/usuarios |
| PUT | /api/[nombreDelModelo]/[id] | Actualizar completamente | PUT /api/pedidos/456 |
| PATCH | /api/[nombreDelModelo]/[id] | Actualizar parcialmente | PATCH /api/clientes/789 |
| DELETE | /api/[nombreDelModelo]/[id] | Eliminar recurso | DELETE /api/productos/321 |

### Parámetros comunes

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `limit` | Registros por página | `?limit=20` |
| `offset` | Registros a omitir | `?offset=40` |
| `sort` | Campo para ordenar | `?sort=createdAt` |
| `order` | Dirección (asc/desc) | `?order=desc` |
| `filter` | Filtrar resultados | `?filter[estado]=ACTIVO` |
| `include` | Incluir relaciones | `?include=autor,comentarios` |
| `fields` | Seleccionar campos | `?fields=id,titulo,fecha` |

## Buenas prácticas

1. **Autenticación**: Almacena el token de forma segura y renuévalo antes de que expire
2. **Manejo de errores**: Implementa manejo de errores robusto para diferentes códigos HTTP
3. **Límite de peticiones**: Implementa backoff exponencial para evitar problemas con rate limits
4. **Caché**: Utiliza el encabezado `ETag` para optimizar peticiones repetidas
5. **Seguridad**: Nunca envíes credenciales o tokens en URLs, siempre en encabezados

## Próximos pasos

- Explora [la autenticación avanzada](/docs/auth) para implementar flujos de OAuth y SSO
- Aprende a [implementar lógica de negocio](/docs/business-logic) con hooks personalizados
- Consulta cómo [integrar con servicios externos](/docs/integrations) para expandir funcionalidades 