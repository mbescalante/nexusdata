---
sidebar_position: 12
title: Referencia API
description: Documentación completa de todos los endpoints, métodos y modelos disponibles en NexusData API
---

# Referencia API

Documentación completa de todos los endpoints, métodos y modelos disponibles en NexusData API.

## Endpoints REST

### Usuarios

#### Obtener Usuario

```http
GET /api/users/{id}
```
#### Parámetros:

- id (obligatorio): Identificador único del usuario
  Respuesta exitosa:

  ```json
  {
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2023-01-15T14:30:00Z"
  }
  ```
  #### Listar Usuarios
  ```http
  GET /api/users?limit=10&offset=0
  ```

#### Parámetros de consulta:

- **limit (opcional):** Número máximo de resultados (predeterminado: 10)
- **offset (opcional):** Número de resultados a omitir (predeterminado: 0)
- **sort (opcional):** Campo por el cual ordenar (ejemplo: name )
- **order (opcional):** Dirección de ordenamiento ( asc o desc ) 

#### Crear Usuario:
```http
POST /api/users
 ```

#### Cuerpo de la solicitud:

```json
  {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
  }
  ```

#### Respuesta exitosa:

```json
  {
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2023-06-15T14:30:00Z"
  }
 ```
#### Actualizar Usuario:
```http
  PUT /api/users/{id}
  ```

#### Parámetros:

- id (obligatorio): Identificador único del usuario
Cuerpo de la solicitud:

```json
  {
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```
Eliminar Usuario
```http
DELETE /api/users/{id}
 ```

Parámetros:
- id (obligatorio): Identificador único del usuario

### Productos Obtener Producto

  ```http
  GET /api/products/{id}
  ```

Parámetros:

- id (obligatorio): Identificador único del producto

Respuesta exitosa:

  ```json
  {
  "id": "456",
  "name": "Smartphone XYZ",
  "price": 599.99,
  "description": "El último modelo con características avanzadas",
  "stock": 42,
  "createdAt": "2023-05-10T09:15:00Z"
  }
  ```

 Listar Productos
```http
GET /api/products?category=electronics&limit=20
 ```


**Parámetros de consulta:**

- **category (opcional):** Filtrar por categoría
- **minPrice (opcional):** Precio mínimo
- **maxPrice (opcional):** Precio máximo
- **inStock (opcional):** Filtrar productos en stock ( true o false )
- **limit (opcional):** Número máximo de resultados
- **offset (opcional):** Número de resultados a omitir Crear Producto

```http
POST /api/products
 ```

#### Cuerpo de la solicitud:

```json
{
  "name": "Smartphone XYZ",
  "price": 599.99,
  "description": "El último modelo con características avanzadas",
  "categoryId": "electronics",
  "stock": 42
}
 ```
#### Actualizar Producto
```http
PUT /api/products/{id}
 ```

#### Parámetros:

- **id (obligatorio):** Identificador único del producto
#### Cuerpo de la solicitud:

```json
{
  "price": 549.99,
  "stock": 38
}
 ```
#### Eliminar Producto
```http
DELETE /api/products/{id}
 ```

#### Parámetros:

- id (obligatorio): Identificador único del producto
## Endpoints GraphQL
### Usuarios Obtener Usuario
```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    createdAt
    roles {
      id
      name
    }
  }
}
 ```

#### Variables:

```json
{
  "id": "123"
}
 ```
####  Listar Usuarios
```graphql
query ListUsers($limit: Int, $offset: Int, $filter: UserFilterInput) {
  users(limit: $limit, offset: $offset, filter: $filter) {
    items {
      id
      name
      email
      createdAt
    }
    total
    hasMore
  }
}
 ```


#### Variables:

```json
{
  "limit": 10,
  "offset": 0,
  "filter": {
    "nameContains": "John"
  }
}
 ```
#### Crear Usuario
```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
    createdAt
  }
}
 ```


#### Variables:

```json
{
  "input": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }
}
 ```
####  Actualizar Usuario
```graphql
mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    name
    email
    updatedAt
  }
}
 ```


#### Variables:

```json
{
  "id": "123",
  "input": {
    "name": "Jane Doe"
  }
}
 ```
 Eliminar Usuario
```graphql
mutation DeleteUser($id: ID!) {
  deleteUser(id: $id) {
    id
    name
    email
  }
}
 ```

#### Variables:

```json
{
  "id": "123"
}
 ```

### Roles Obtener Rol
```graphql
query GetRole($id: ID!) {
  role(id: $id) {
    id
    name
    permissions
    createdAt
  }
}
 ```

#### Variables:

```json
{
  "id": "123"
}
 ```
####  Listar Roles
```graphql
query ListRoles {
  roles {
    id
    name
    permissions
  }
}
 ```
####  Crear Rol
```graphql
mutation CreateRole($input: CreateRoleInput!) {
  createRole(input: $input) {
    id
    name
    permissions
  }
}
 ```


#### Variables:

```json
{
  "input": {
    "name": "Admin",
    "permissions": ["READ", "WRITE", "DELETE"]
  }
}
 ```

####  Actualizar Rol
```graphql
mutation UpdateRole($id: ID!, $input: UpdateRoleInput!) {
  updateRole(id: $id, input: $input) {
    id
    name
    permissions
  }
}
 ```


#### Variables:

```json
{
  "id": "123",
  "input": {
    "name": "Super Admin",
    "permissions": ["READ", "WRITE", "DELETE", "ADMIN"]
  }
}
 ```

####  Eliminar Rol
```graphql
mutation DeleteRole($id: ID!) {
  deleteRole(id: $id) {
    id
    name
  }
}
 ```

#### Variables:

```json
{
  "id": "123"
}
 ```

### Productos Obtener Producto
```graphql
query GetProduct($id: ID!) {
  product(id: $id) {
    id
    name
    price
    description
    stock
    category {
      id
      name
    }
    createdAt
  }
}
 ```

#### Variables:

```json
{
  "id": "456"
}
 ```
####  Listar Productos
```graphql
query ListProducts($filter: ProductFilterInput, $limit: Int, $offset: Int) {
  products(filter: $filter, limit: $limit, offset: $offset) {
    items {
      id
      name
      price
      stock
      category {
        name
      }
    }
    total
    hasMore
  }
}
 ```


#### Variables:

```json
{
  "filter": {
    "categoryId": "electronics",
    "minPrice": 100,
    "inStock": true
  },
  "limit": 20,
  "offset": 0
}
 ```

## Códigos de Estado HTTP Código Descripción 200

| **Código** | **Descripción**            | **Significado**                                      |
|------------|-----------------------------|-------------------------------------------------------|
| 200        | OK                          | La solicitud se ha completado correctamente.         |
| 201        | Created                     | El recurso se ha creado correctamente.               |
| 400        | Bad Request                 | La solicitud contiene datos inválidos.               |
| 401        | Unauthorized                | Autenticación requerida.                             |
| 403        | Forbidden                   | No tiene permisos para acceder al recurso.           |
| 404        | Not Found                   | El recurso solicitado no existe.                     |
| 422        | Unprocessable Entity        | Error de validación.                                 |
| 500        | Internal Server Error       | Error del servidor.                                  |

## Tipos de Datos Comunes
### Usuario Campo Tipo Descripción id

| **Campo**     | **Tipo**     | **Descripción**                                 |
|---------------|--------------|--------------------------------------------------|
| `id`          | ID           | Identificador único                             |
| `name`        | String       | Nombre completo                                 |
| `email`       | String       | Correo electrónico (único)                      |
| `password`    | String       | Contraseña (solo en creación)                   |
| `roles`       | [Role]       | Roles asignados al usuario                      |
| `createdAt`   | DateTime     | Fecha de creación                               |
| `updatedAt`   | DateTime     | Fecha de última actualización                   |

### Rol Campo Tipo Descripción id

| **Campo**     | **Tipo**     | **Descripción**                                 |
|---------------|--------------|--------------------------------------------------|
| `id`          | ID           | Identificador único                             |
| `name`        | String       | Nombre del rol                                  |
| `permissions` | [String]     | Lista de permisos                               |
| `createdAt`   | DateTime     | Fecha de creación                               |
| `updatedAt`   | DateTime     | Fecha de última actualización                   |

### Producto Campo Tipo Descripción id


| **Campo**      | **Tipo**     | **Descripción**                                  |
|----------------|--------------|---------------------------------------------------|
| `id`           | ID           | Identificador único                              |
| `name`         | String       | Nombre del producto                              |
| `price`        | Float        | Precio                                           |
| `description`  | String       | Descripción detallada                            |
| `stock`        | Int          | Cantidad disponible                              |
| `categoryId`   | ID           | ID de la categoría                               |
| `category`     | Category     | Categoría del producto                           |
| `createdAt`    | DateTime     | Fecha de creación                                |
| `updatedAt`    | DateTime     | Fecha de última actualización                    |
