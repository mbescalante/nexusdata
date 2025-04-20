---
sidebar_position: 2
title: Servicios REST
description: Implementación y uso de servicios REST en NexusData para crear APIs robustas y escalables
---

# Servicios REST

NexusData implementa una API REST completa que te permite interactuar con tus datos de manera estructurada y predecible. Esta guía explica los principios REST aplicados en NexusData y cómo aprovecharlos al máximo.

## Principios REST en NexusData

NexusData sigue los principios fundamentales de REST (Representational State Transfer):

1. **Interfaz uniforme**: Recursos identificados por URLs, manipulados mediante representaciones estándar
2. **Sin estado**: Cada solicitud contiene toda la información necesaria
3. **Cacheable**: Las respuestas indican si pueden ser almacenadas en caché
4. **Sistema en capas**: El cliente no puede distinguir si está conectado directamente al servidor
5. **Código bajo demanda** (opcional): Capacidad de extender la funcionalidad del cliente

## Estructura de recursos

### Colecciones y elementos

Los recursos en NexusData siguen una estructura jerárquica:
| Endpoint                             | Descripción                                      |
|--------------------------------------|--------------------------------------------------|
| `/api/productos`                     | Colección de productos                          |
| `/api/productos/123`                 | Producto específico con ID `123`                |
| `/api/productos/123/variantes`       | Colección de variantes del producto `123`       |
| `/api/productos/123/variantes/456`   | Variante específica con ID `456`                |
| `/api/productos/123/variantes/456/atributos` | Colección de atributos de la variante `456` |


### Convenciones de nomenclatura

- Usa sustantivos en plural para colecciones (`productos`, no `producto`)
- Usa kebab-case para recursos con múltiples palabras (`ordenes-compra`, no `ordenesCompra`)
- Evita verbos en las URLs (usa `/api/usuarios/123` en lugar de `/api/obtenerUsuario/123`)

## Métodos HTTP

NexusData implementa los métodos HTTP estándar para operaciones CRUD:

| Método | Propósito | Ejemplo |
|--------|-----------|---------|
| GET | Recuperar recursos | `GET /api/productos` |
| POST | Crear recursos | `POST /api/productos` |
| PUT | Actualizar recursos (reemplazo completo) | `PUT /api/productos/123` |
| PATCH | Actualizar recursos (modificación parcial) | `PATCH /api/productos/123` |
| DELETE | Eliminar recursos | `DELETE /api/productos/123` |

### Ejemplos de uso

#### Obtener una lista de productos

```bash
curl -X GET https://api.nexusdata.io/api/productos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Crear un nuevo producto

```bash
curl -X POST https://api.nexusdata.io/api/productos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Teclado Mecánico RGB",
    "descripcion": "Teclado mecánico con retroiluminación RGB personalizable",
    "precio": 89.99,
    "categoria": "Periféricos",
    "inventario": 50
  }'
```
#### Actualizar un producto (Completo)
```bash
curl -X PUT https://api.nexusdata.io/api/productos/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Teclado Mecánico RGB Pro",
    "descripcion": "Teclado mecánico profesional con retroiluminación RGB personalizable",
    "precio": 99.99,
    "categoria": "Periféricos",
    "inventario": 45
  }'
```

#### Actualizar un producto (Parcial)
```bash
curl -X PATCH https://api.nexusdata.io/api/productos/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "precio": 94.99,
    "inventario": 40
  }'
```
#### Eliminar un producto
```bash
curl -X DELETE https://api.nexusdata.io/api/productos/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
## Parámetros de consulta
NexusData soporta varios parámetros de consulta para filtrar, ordenar y paginar resultados:
### Paginación
```plaintext
/api/productos?limit=20&offset=40  # Obtiene 20 productos, saltando los primeros 40
/api/productos?page=3&perPage=15   # Obtiene la página 3 con 15 productos por página
```

### Ordenamiento
```plaintext
/api/productos?sort=precio&order=asc   # Ordena por precio ascendente
/api/productos?sort=createdAt&order=desc  # Ordena por fecha de creación descendente
/api/productos?sort=nombre,precio  # Ordena por nombre y luego por precio
```


### Filtrado
NexusData proporciona un sistema de filtrado flexible:

```plaintext
/api/productos?filter[precio][gt]=50  # Productos con precio mayor a 50
/api/productos?filter[categoria]=Electrónicos  # Productos en categoría Electrónicos
/api/productos?filter[nombre][like]=laptop  # Productos cuyo nombre contiene "laptop"
/api/productos?filter[createdAt][gte]=2023-01-01  # Productos creados desde 2023
```
Operadores de filtrado disponibles:
| Operador  | Descripción             | Ejemplo                                 |
|-----------|-------------------------|-----------------------------------------|
| `eq`      | Igual a (predeterminado) | `filter[estado]=activo`                |
| `ne`      | No igual a               | `filter[estado][ne]=inactivo`          |
| `gt`      | Mayor que                | `filter[precio][gt]=100`               |
| `gte`     | Mayor o igual que        | `filter[edad][gte]=18`                 |
| `lt`      | Menor que                | `filter[inventario][lt]=10`            |
| `lte`     | Menor o igual que        | `filter[descuento][lte]=50`            |
| `like`    | Contiene (búsqueda)      | `filter[nombre][like]=pro`             |
| `in`      | En lista                 | `filter[categoria][in]=electrónicos,computadoras` |
| `between` | Entre valores            | `filter[precio][between]=100,500`      |
| `not`     | No en lista              | `filter[categoria][not]=electrónicos` |
| `or`      | O                        | `filter[estado][or]=activo,inactivo` |
| `and`     | Y                       | `filter[estado][and]=activo,activo` |
| `not`     | No                      | `filter[estado][not]=inactivo` |
| `null`    | Nulo                    | `filter[estado][null]=true` |
| `exists`  | Existe                   | `filter[estado][exists]=true` |
| `notExists` | No existe                | `filter[estado][notExists]=true` |
| `regex`   | Coincide con expresión regular | `filter[nombre][regex]=/^pro/` |
| `notRegex` | No coincide con expresión regular | `filter[nombre][notRegex]=/^pro/` |
| `in`      | En lista                 | `filter[categoria][in]=electrónicos,computadoras` |
| `notIn`   | No en lista              | `filter[categoria][notIn]=electrónicos,computadoras` |
| `between` | Entre valores            | `filter[precio][between]=100,500`      |
| `notBetween` | No entre valores          | `filter[precio][notBetween]=100,500` |

### Selección de campos
Puedes especificar qué campos deseas recibir:

```plaintext
/api/productos?fields=id,nombre,precio  # Solo devuelve id, nombre y precio
 ```


### Inclusión de relaciones
Puedes incluir datos relacionados en una sola solicitud:

```plaintext
/api/productos?include=categoria,proveedor  # Incluye datos de categoría y proveedor
/api/pedidos?include=cliente,productos.categoria  # Incluye cliente y productos con sus categorías
```
## Respuestas
### Estructura de respuesta
NexusData utiliza una estructura de respuesta consistente:

```json
{
  "data": {
    "id": "123",
    "nombre": "Teclado Mecánico RGB",
    "precio": 89.99,
    "createdAt": "2023-05-15T10:30:00Z",
    "updatedAt": "2023-05-15T10:30:00Z"
  },
  "meta": {
    "timestamp": "2023-06-10T14:22:35Z"
  }
}
 ```

Para colecciones:

```json
{
  "data": [
    {
      "id": "123",
      "nombre": "Teclado Mecánico RGB",
      "precio": 89.99
    },
    {
      "id": "124",
      "nombre": "Mouse Inalámbrico",
      "precio": 45.99
    }
  ],
  "meta": {
    "totalCount": 243,
    "filteredCount": 2,
    "limit": 10,
    "offset": 0
  }
}
```

### Códigos de estado HTTP
NexusData utiliza códigos de estado HTTP estándar:
| Código | Descripción              | Uso típico                                        |
|--------|--------------------------|--------------------------------------------------|
| 200    | OK                       | Solicitud exitosa (GET, PUT, PATCH)              |
| 201    | Created                  | Recurso creado exitosamente (POST)               |
| 204    | No Content               | Solicitud exitosa sin contenido (DELETE)         |
| 400    | Bad Request              | Solicitud con formato incorrecto                 |
| 401    | Unauthorized             | Autenticación requerida                          |
| 403    | Forbidden                | Sin permiso para el recurso                      |
| 404    | Not Found                | Recurso no encontrado                            |
| 409    | Conflict                 | Conflicto (ej. violación de unicidad)            |
| 422    | Unprocessable Entity     | Validación fallida                               |
| 429    | Too Many Requests        | Límite de tasa excedido                          |
| 500    | Internal Server Error    | Error del servidor                               |
| 503    | Service Unavailable      | Servicio no disponible                           |

### Manejo de errores
Las respuestas de error siguen un formato consistente:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "No se pudo procesar la solicitud debido a datos inválidos",
    "details": [
      {
        "field": "precio",
        "message": "El precio debe ser un número positivo"
      },
      {
        "field": "inventario",
        "message": "El inventario no puede ser negativo"
      }
    ]
  },
  "meta": {
    "timestamp": "2023-06-10T14:22:35Z",
    "requestId": "req_7f8a9b2c3d4e"
  }
}
```

## Operaciones por lotes
NexusData permite realizar operaciones por lotes para mejorar el rendimiento:

### Crear múltiples recursos
```bash
curl -X POST https://api.nexusdata.io/api/batch/productos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "nombre": "Producto 1",
        "precio": 29.99
      },
      {
        "nombre": "Producto 2",
        "precio": 39.99
      }
    ]
  }'
 ```


### Actualizar múltiples recursos
```bash
curl -X PATCH https://api.nexusdata.io/api/batch/productos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "123",
        "precio": 34.99
      },
      {
        "id": "124",
        "precio": 44.99
      }
    ]
  }'
```

### Eliminar múltiples recursos
```bash
curl -X DELETE https://api.nexusdata.io/api/batch/productos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["123", "124", "125"]
  }'
 ```


## Versionado de API
NexusData soporta versionado de API para garantizar la compatibilidad:

```plaintext
/api/v1/productos  # Versión 1 de la API
/api/v2/productos  # Versión 2 de la API
```
## Autenticación y autorización
### Autenticación mediante token
```bash
curl https://api.nexusdata.io/api/usuarios/perfil \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 ```
```

### Autenticación mediante API Key
```bash
curl https://api.nexusdata.io/api/productos \
  -H "X-API-Key: tu_api_key_aqui"
 ```

## Límites de tasa
NexusData implementa límites de tasa para proteger la API:

```plaintext
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1623348000
```
Cuando excedes el límite, recibirás un error 429 Too Many Requests.

## Webhooks
NexusData permite configurar webhooks para recibir notificaciones sobre eventos:

```javascript
// Configuración de webhook
const webhookConfig = {
  url: "https://tu-servidor.com/webhooks/nexusdata",
  events: ["producto.creado", "producto.actualizado", "pedido.completado"],
  secret: "tu_clave_secreta_para_verificar_firmas"
};

// Ejemplo de payload de webhook
{
  "event": "producto.creado",
  "timestamp": "2023-06-10T14:22:35Z",
  "data": {
    "id": "123",
    "nombre": "Nuevo Producto",
    "precio": 99.99
  },
  "signature": "sha256=..."
}
```
## Mejores prácticas
1. Utiliza HTTPS : Todas las solicitudes deben realizarse a través de HTTPS
2. Implementa caché : Utiliza los encabezados ETag y Cache-Control
3. Maneja errores adecuadamente : Implementa reintentos con retroceso exponencial
4. Limita campos : Usa el parámetro fields para reducir el tamaño de las respuestas
5. Usa operaciones por lotes : Combina múltiples operaciones en una sola solicitud
6. Monitorea límites de tasa : Observa los encabezados de límite de tasa
7. Valida tokens : Verifica que los tokens no hayan expirado antes de usarlos
## Herramientas de desarrollo
### Explorador de API
NexusData proporciona un explorador de API interactivo en /api/explorer que te permite:

- Explorar recursos disponibles
- Probar solicitudes directamente desde el navegador
- Ver documentación detallada de cada endpoint
- Generar código de ejemplo para diferentes lenguajes
### Colección de Postman
Puedes descargar una colección de Postman preconfigurada para tu API:
```plaintext
GET /api/postman-collection
```
## Ejemplos de integración
### JavaScript (Fetch API)
```javascript
// Función para obtener productos con manejo de paginación
async function obtenerProductos(pagina = 1, porPagina = 20) {
  try {
    const response = await fetch(`https://api.nexusdata.io/api/productos?page=${pagina}&perPage=${porPagina}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message || 'Error desconocido');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
}
 ```


### Python (Requests)
```python
import requests

class NexusDataAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json'
        }
    
    def get_productos(self, filtros=None, ordenar=None, pagina=1, por_pagina=20):
        params = {
            'page': pagina,
            'perPage': por_pagina
        }
        
        # Añadir filtros
        if filtros:
            for key, value in filtros.items():
                if isinstance(value, dict):
                    for op, val in value.items():
                        params[f'filter[{key}][{op}]'] = val
                else:
                    params[f'filter[{key}]'] = value
        
        # Añadir ordenamiento
        if ordenar:
            params['sort'] = ordenar.get('campo', 'createdAt')
            params['order'] = ordenar.get('direccion', 'desc')
        
        response = requests.get(
            f'{self.base_url}/api/productos',
            headers=self.headers,
            params=params
        )
        
        response.raise_for_status()
        return response.json()
```

### PHP (cURL)
```php
<?php
class NexusDataAPI {
    private $baseUrl;
    private $token;
    
    public function __construct($baseUrl, $token) {
        $this->baseUrl = $baseUrl;
        $this->token = $token;
    }
    
    public function request($method, $endpoint, $data = null, $params = []) {
        $url = $this->baseUrl . $endpoint;
        
        // Añadir parámetros de consulta
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }
        
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->token,
                'Content-Type: application/json',
                'Accept: application/json'
            ]
        ]);
        
        if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        
        $responseData = json_decode($response, true);
        
        if ($status >= 400) {
            throw new Exception(
                $responseData['error']['message'] ?? 'Error desconocido',
                $status
            );
        }
        
        return $responseData;
    }
    
    public function getProductos($filtros = [], $ordenar = null, $pagina = 1, $porPagina = 20) {
        $params = [
            'page' => $pagina,
            'perPage' => $porPagina
        ];
        
        // Añadir filtros
        foreach ($filtros as $campo => $valor) {
            if (is_array($valor)) {
                foreach ($valor as $operador => $val) {
                    $params["filter[$campo][$operador]"] = $val;
                }
            } else {
                $params["filter[$campo]"] = $valor;
            }
        }
        
        // Añadir ordenamiento
        if ($ordenar) {
            $params['sort'] = $ordenar['campo'] ?? 'createdAt';
            $params['order'] = $ordenar['direccion'] ?? 'desc';
        }
        
        return $this->request('GET', '/api/productos', null, $params);
    }
}
?>
```