---
sidebar_position: 2
title: Desarrollo de Plugins
description: Guía completa para desarrollar plugins personalizados para NexusData
---

# Desarrollo de Plugins

Esta guía te enseñará cómo desarrollar plugins personalizados para extender la funcionalidad de NexusData según tus necesidades específicas.

## Introducción

Los plugins de NexusData te permiten:

- Añadir nuevas funcionalidades al sistema
- Integrar servicios externos
- Personalizar el comportamiento existente
- Crear conectores para fuentes de datos específicas
- Implementar lógica de negocio reutilizable

## Estructura de un Plugin

Un plugin de NexusData sigue una estructura estándar:

### Archivo package.json

El archivo `package.json` define los metadatos del plugin:

```json
{
  "name": "nexusdata-plugin-mi-plugin",
  "version": "1.0.0",
  "description": "Mi plugin personalizado para NexusData",
  "main": "index.js",
  "keywords": [
    "nexusdata",
    "plugin",
    "mi-plugin"
  ],
  "author": "Tu Nombre",
  "license": "MIT",
  "dependencies": {
    // Dependencias específicas del plugin
  },
  "peerDependencies": {
    "@nexusdata/core": "^2.0.0"
  },
  "nexusdata": {
    "id": "mi-plugin",
    "displayName": "Mi Plugin",
    "description": "Añade funcionalidades específicas a NexusData",
    "category": "integración",
    "icon": "./assets/icon.png",
    "compatibility": {
      "minVersion": "2.0.0",
      "maxVersion": "3.0.0"
    }
  }
}
```

### Archivo index.js
El punto de entrada del plugin:

```javascript
// index.js
module.exports = function(context) {
  // Registrar componentes, servicios, hooks, etc.
  
  // Registrar modelos
  context.registerModel(require('./src/models/MiModelo'));
  
  // Registrar servicios
  context.registerService('MiServicio', require('./src/services/MiServicio'));
  
  // Registrar hooks
  context.registerHook('beforeCreate', require('./src/hooks/beforeCreate'));
  
  // Registrar componentes de UI (si es aplicable)
  if (context.ui) {
    context.ui.registerComponent('MiComponente', require('./src/components/MiComponente'));
    context.ui.addMenuItem({
      label: 'Mi Plugin',
      icon: 'puzzle-piece',
      path: '/mi-plugin'
    });
  }
  
  // Registrar comandos CLI (si es aplicable)
  if (context.cli) {
    context.cli.registerCommand(require('./src/commands/miComando'));
  }
  
  // Inicialización del plugin
  context.onInit(async () => {
    // Código que se ejecuta al inicializar el plugin
    context.logger.info('Mi Plugin inicializado correctamente');
  });
  
  // Limpieza al desactivar el plugin
  context.onDeactivate(async () => {
    // Código que se ejecuta al desactivar el plugin
    context.logger.info('Mi Plugin desactivado correctamente');
  });
  
  return {
    name: 'mi-plugin',
    version: '1.0.0'
  };
};
```
Este archivo exporta una función que se pasa al contexto del plugin. Dentro de esta función, puedes registrar modelos, servicios, hooks, componentes de UI, comandos CLI, etc. También puedes definir eventos de inicialización y desactivación.

### Esquema de configuración
Define las opciones configurables del plugin:

```javascript
// config/schema.js
module.exports = {
  apiKey: {
    type: 'string',
    required: true,
    sensitive: true,
    description: 'API Key para el servicio externo'
  },
  endpoint: {
    type: 'string',
    default: 'https://api.servicio.com/v1',
    description: 'URL del endpoint del servicio'
  },
  timeout: {
    type: 'number',
    default: 5000,
    description: 'Tiempo de espera en milisegundos'
  },
  features: {
    type: 'object',
    properties: {
      featureA: {
        type: 'boolean',
        default: true,
        description: 'Habilitar característica A'
      },
      featureB: {
        type: 'boolean',
        default: false,
        description: 'Habilitar característica B'
      }
    }
  }
};
```
## Tipos de Plugins
### Plugins de Modelo
Extienden o crean nuevos modelos de datos:

```javascript
// src/models/MiModelo.js
const { Model } = require('@nexusdata/core');

class ProductoExtendido extends Model {
  static config = {
    name: 'ProductoExtendido',
    extends: 'Producto', // Extiende el modelo base Producto
    fields: {
      caracteristicasAvanzadas: {
        type: 'json',
        description: 'Características avanzadas del producto'
      },
      puntuacionCalidad: {
        type: 'number',
        min: 0,
        max: 100,
        description: 'Puntuación de calidad (0-100)'
      }
    },
    hooks: {
      beforeCreate: async (data, context) => {
        // Lógica personalizada antes de crear
        if (!data.puntuacionCalidad) {
          data.puntuacionCalidad = 50; // Valor por defecto
        }
        return data;
      }
    },
    indexes: [
      {
        fields: ['puntuacionCalidad'],
        type: 'btree'
      }
    ]
  };
}

module.exports = ProductoExtendido;
```
### Plugins de Servicio
Implementan nuevos servicios:

```javascript
// src/services/MiServicio.js
const { Service } = require('@nexusdata/core');
const axios = require('axios');

class ServicioIntegracion extends Service {
  constructor(context) {
    super(context);
    this.config = context.config.get('mi-plugin');
    this.client = axios.create({
      baseURL: this.config.endpoint,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  async sincronizarDatos(options = {}) {
    try {
      // Obtener datos del servicio externo
      const response = await this.client.get('/datos', {
        params: options.params || {}
      });
      
      // Procesar y almacenar los datos
      const items = response.data.items || [];
      
      this.logger.info(`Sincronizando ${items.length} elementos`);
      
      // Usar transacción para garantizar consistencia
      return await this.db.transaction(async (tx) => {
        const results = [];
        
        for (const item of items) {
          // Transformar datos si es necesario
          const transformedItem = this.transformarItem(item);
          
          // Buscar si ya existe
          const existing = await tx.findOne('MiModelo', {
            externalId: transformedItem.externalId
          });
          
          if (existing) {
            // Actualizar
            const updated = await tx.update('MiModelo', {
              id: existing.id,
              ...transformedItem,
              lastSyncAt: new Date()
            });
            results.push({ action: 'updated', item: updated });
          } else {
            // Crear nuevo
            const created = await tx.create('MiModelo', {
              ...transformedItem,
              lastSyncAt: new Date(),
              createdAt: new Date()
            });
            results.push({ action: 'created', item: created });
          }
        }
        
        return {
          total: items.length,
          created: results.filter(r => r.action === 'created').length,
          updated: results.filter(r => r.action === 'updated').length,
          items: results
        };
      });
    } catch (error) {
      this.logger.error('Error al sincronizar datos', error);
      throw new Error(`Error en sincronización: ${error.message}`);
    }
  }
  
  transformarItem(item) {
    // Implementar lógica de transformación
    return {
      externalId: item.id,
      nombre: item.name,
      descripcion: item.description,
      metadatos: item.metadata || {}
    };
  }
  
  // Otros métodos del servicio...
}

module.exports = ServicioIntegracion;
```

### Plugins de UI
Extienden la interfaz de usuario:

```javascript
// src/components/MiComponente.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form } from '@nexusdata/ui';

function MiComponente({ context }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await context.services.MiServicio.obtenerDatos();
      setData(result.items);
    } catch (error) {
      context.ui.showNotification({
        type: 'error',
        message: `Error al cargar datos: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await context.services.MiServicio.sincronizarDatos();
      context.ui.showNotification({
        type: 'success',
        message: `Sincronización completada: ${result.created} creados, ${result.updated} actualizados`
      });
      loadData();
    } catch (error) {
      context.ui.showNotification({
        type: 'error',
        message: `Error en sincronización: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Renderizado del componente
  return (
    <Card title="Mi Plugin - Panel de Control">
      <div className="actions">
        <Button 
          onClick={handleSync} 
          loading={loading}
          icon="sync"
        >
          Sincronizar Datos
        </Button>
        <Button 
          onClick={() => setShowModal(true)}
          variant="outline"
          icon="settings"
        >
          Configuración
        </Button>
      </div>
      
      <Table
        data={data}
        columns={[
          { key: 'id', title: 'ID' },
          { key: 'nombre', title: 'Nombre' },
          { key: 'lastSyncAt', title: 'Última Sincronización', type: 'datetime' },
          { 
            key: 'actions', 
            title: 'Acciones',
            render: (row) => (
              <Button size="small" onClick={() => handleViewDetails(row)}>
                Ver Detalles
              </Button>
            )
          }
        ]}
        loading={loading}
        pagination={true}
      />
      
      {/* Modal de configuración */}
      <Modal
        title="Configuración del Plugin"
        open={showModal}
        onClose={() => setShowModal(false)}
      >
        {/* Contenido del modal */}
      </Modal>
    </Card>
  );
}

export default MiComponente;
```

### Plugins de Autenticación
Implementan nuevos métodos de autenticación:

```javascript
// src/auth/MiProveedor.js
const { AuthProvider } = require('@nexusdata/core');

class MiProveedorAuth extends AuthProvider {
  constructor(context) {
    super(context);
    this.config = context.config.get('mi-plugin');
  }
  
  async authenticate(credentials) {
    try {
      // Implementar lógica de autenticación con servicio externo
      const response = await fetch(this.config.authEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          apiKey: this.config.apiKey
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error de autenticación');
      }
      
      const authData = await response.json();
      
      // Buscar o crear usuario en el sistema
      let user = await this.db.findOne('Usuario', {
        where: {
          externalId: authData.userId
        }
      });
      
      if (!user) {
        // Crear nuevo usuario
        user = await this.db.create('Usuario', {
          externalId: authData.userId,
          username: credentials.username,
          email: authData.email,
          nombre: authData.name,
          authProvider: 'mi-proveedor',
          createdAt: new Date()
        });
      }
      
      // Actualizar información si es necesario
      if (authData.name !== user.nombre || authData.email !== user.email) {
        user = await this.db.update('Usuario', {
          id: user.id,
          nombre: authData.name,
          email: authData.email,
          lastLoginAt: new Date()
        });
      }
      
      // Generar token de sesión
      const token = this.auth.createToken({
        userId: user.id,
        externalId: user.externalId,
        roles: authData.roles || []
      });
      
      return {
        user,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      };
    } catch (error) {
      this.logger.error('Error de autenticación', error);
      throw new Error(`Error de autenticación: ${error.message}`);
    }
  }
  
  async validateToken(token) {
    // Implementar validación de token
    // ...
  }
  
  async getUserInfo(userId) {
    // Obtener información adicional del usuario
    // ...
  }
}

module.exports = MiProveedorAuth;
```

## Ciclo de Desarrollo
### 1. Configuración del Entorno
Crea un nuevo directorio para tu plugin:

```bash
mkdir mi-plugin
cd mi-plugin
npm init -y
 ```

Instala las dependencias necesarias:

```bash
npm install --save-dev @nexusdata/core @nexusdata/plugin-dev
```

### 2. Estructura Inicial
Crea la estructura básica del plugin:

```bash
npx @nexusdata/plugin-dev init
```
Esto generará la estructura de directorios y archivos básicos.

### 3. Desarrollo
Implementa la funcionalidad de tu plugin siguiendo las mejores prácticas:

- Mantén una clara separación de responsabilidades
- Documenta tu código
- Escribe pruebas unitarias
- Maneja errores adecuadamente
- Utiliza el sistema de logging
### 4. Pruebas
Ejecuta pruebas unitarias:

```bash
npm test
```
Prueba el plugin en un entorno de desarrollo:

```bash
npx @nexusdata/plugin-dev test-plugin
```

### 5. Empaquetado
Empaqueta tu plugin para distribución:

```bash
npm pack
```
## Mejores Prácticas
### Seguridad
- Nunca incluyas credenciales en el código
- Marca los campos sensibles como sensitive: true en el esquema de configuración
- Valida y sanitiza todas las entradas de usuario
- Implementa límites de tasa y protección contra ataques
### Rendimiento
- Optimiza consultas a bases de datos
- Implementa caché cuando sea apropiado
- Evita bloquear el hilo principal
- Usa operaciones por lotes para actualizaciones masivas
### Compatibilidad
- Especifica claramente las versiones compatibles de NexusData
- Prueba tu plugin con diferentes versiones
- Implementa verificaciones de compatibilidad en tiempo de ejecución
### Documentación
- Proporciona un README.md completo
- Documenta todas las opciones de configuración
- Incluye ejemplos de uso
- Proporciona información de solución de problemas

## Ejemplos Completos
### Plugin de Integración con Servicio Externo
```javascript
// Ejemplo de plugin que integra con un servicio externo de análisis
module.exports = function(context) {
  // Registrar modelo para almacenar resultados de análisis
  context.registerModel(require('./src/models/ResultadoAnalisis'));
  
  // Registrar servicio de integración
  context.registerService('ServicioAnalisis', require('./src/services/ServicioAnalisis'));
  
  // Registrar hooks para análisis automático
  context.registerHook('afterCreate', 'Producto', async (producto, ctx) => {
    // Programar análisis automático para nuevos productos
    await ctx.services.ServicioAnalisis.programarAnalisis({
      entidadId: producto.id,
      tipoEntidad: 'Producto',
      prioridad: 'normal'
    });
  });
  
  // Registrar componentes UI
  if (context.ui) {
    context.ui.registerComponent('PanelAnalisis', require('./src/components/PanelAnalisis'));
    context.ui.registerComponent('ResultadosAnalisis', require('./src/components/ResultadosAnalisis'));
    
    // Añadir elementos de menú
    context.ui.addMenuItem({
      label: 'Análisis',
      icon: 'chart-bar',
      path: '/analisis'
    });
    
    // Añadir acciones a entidades existentes
    context.ui.addEntityAction('Producto', {
      label: 'Analizar',
      icon: 'microscope',
      action: async (producto, ctx) => {
        await ctx.services.ServicioAnalisis.analizarAhora(producto.id);
        ctx.ui.showNotification({
          type: 'success',
          message: 'Análisis iniciado correctamente'
        });
      }
    });
  }
  
  // Inicialización
  context.onInit(async () => {
    const config = context.config.get('plugin-analisis');
    
    // Verificar configuración
    if (!config.apiKey) {
      context.logger.warn('Plugin de Análisis: API Key no configurada');
      return;
    }
    
    // Inicializar servicio
    await context.services.ServicioAnalisis.inicializar();
    
    // Programar tarea periódica
    context.scheduler.schedule('analisis.sincronizar', {
      cron: '0 */4 * * *', // Cada 4 horas
      handler: async () => {
        await context.services.ServicioAnalisis.sincronizarResultados();
      }
    });
    
    context.logger.info('Plugin de Análisis inicializado correctamente');
  });
  
  return {
    name: 'plugin-analisis',
    version: '1.0.0'
  };
};
```
## Publicación en el Marketplace
Para publicar tu plugin en el Marketplace de NexusData:

  1. Crea una cuenta en el Portal de Desarrolladores de NexusData
  2. Registra tu plugin proporcionando la información requerida
  3. Sube tu paquete siguiendo las instrucciones del portal
  4. Completa la documentación con ejemplos de uso y capturas de pantalla
  5. Envía para revisión y espera la aprobación del equipo de NexusData
Una vez aprobado, tu plugin estará disponible para todos los usuarios de NexusData a través del Marketplace.