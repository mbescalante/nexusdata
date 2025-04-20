---
sidebar_position: 2
title: Inicio Rápido
description: Comienza a usar NexusData API en minutos
---

# Inicio Rápido con NexusData API

Esta guía te ayudará a configurar y ejecutar NexusData API en menos de 5 minutos. Aprenderás a conectar una fuente de datos, crear tu primera API y realizar consultas básicas.

## Requisitos previos

- [Node.js](https://nodejs.org/) versión 14 o superior
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) (opcional, para contenedores)

## Instalación

Instala NexusData API utilizando npm:

```bash
npm install -g nexusdata-cli
```

O con yarn:

```bash
yarn global add nexusdata-cli
```

## Crear un nuevo proyecto

Inicia un nuevo proyecto de NexusData API:

```bash
nexusdata init mi-proyecto-api
cd mi-proyecto-api
```

## Configurar una fuente de datos

NexusData puede conectarse a varias fuentes de datos. Como ejemplo, configuraremos una base de datos PostgreSQL.

Crea un archivo `datasource.yaml` o edita el existente:

```yaml
datasources:
  postgres:
    type: postgresql
    url: postgres://usuario:contraseña@localhost:5432/mi_base_datos
    schema: public
```

## Definir los modelos de datos

Crea modelos para tus entidades en el archivo `models.yaml`:

```yaml
models:
  User:
    fields:
      id: 
        type: uuid
        primary: true
        default: gen_random_uuid()
      name: 
        type: string
        nullable: false
      email: 
        type: string
        unique: true
      created_at:
        type: timestamp
        default: now()
  
  Post:
    fields:
      id:
        type: uuid
        primary: true
        default: gen_random_uuid()
      title:
        type: string
        nullable: false
      content:
        type: text
      published:
        type: boolean
        default: false
      author_id:
        type: uuid
        references: User.id
    relationships:
      author:
        type: belongsTo
        model: User
        foreignKey: author_id
```

## Generar y ejecutar la API

Genera tu API basada en los modelos definidos:

```bash
nexusdata generate
```

Inicia el servidor:

```bash
nexusdata start
```

¡Listo! Tu API ahora está ejecutándose en `http://localhost:4000`.

## Explorar la API

### Consola GraphQL

Accede a la consola GraphQL navegando a:

```
http://localhost:4000/graphql
```

### Ejemplo de consulta GraphQL

```graphql
query {
  users {
    id
    name
    email
    posts {
      id
      title
      published
    }
  }
}
```

### Ejemplo de mutación para crear un usuario

```graphql
mutation {
  createUser(input: {
    name: "Ana García",
    email: "ana@ejemplo.com"
  }) {
    id
    name
    email
  }
}
```

## API REST

También puedes acceder a tus datos a través de endpoints REST:

```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

## Siguiente paso

Ahora que tienes tu API funcionando, explora estas secciones para aprender más:

- [Fuentes de Datos](/docs/data-sources) - Configura conexiones a diferentes bases de datos
- [Modelado de Datos](/docs/data-modeling) - Aprende a definir modelos más complejos
- [Autenticación](/docs/auth) - Protege tu API con diferentes métodos de autenticación
- [Lógica de Negocio](/docs/business-logic) - Agrega reglas y lógica personalizada a tu API 