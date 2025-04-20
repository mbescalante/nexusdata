// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introducción'
    },
    {
      type: 'doc',
      id: 'quickstart',
      label: 'Inicio Rápido'
    },
    {
      type: 'category',
      label: 'Fuente de Datos',
      items: [
        'data-sources/index',
        'data-sources/sql',
        'data-sources/nosql',
        'data-sources/rest-api'
      ]
    },
    {
      type: 'category',
      label: 'Modelado de Datos',
      items: [
        'data-modeling/index',
        'data-modeling/schemas',
        'data-modeling/relationships',
        'data-modeling/validation',
      ]
    },
    {
      type: 'category',
      label: 'API GraphQL',
      items: [
        'graphql-api/index',
        'graphql-api/queries',
        'graphql-api/mutations',
        'graphql-api/subscriptions'
      ]
    },
    {
      type: 'category',
      label: 'Servicios HTTP',
      items: [
        'servicios-http/index',
        'servicios-http/rest',
       'servicios-http/webhooks',
      ]
    },
    {
      type: 'category',
      label: 'Autenticación',
      items: [
        'auth/index',
        'auth/jwt',
        'auth/oauth',
        'auth/roles-permisos',
      ]
    },
    {
      type: 'category',
      label: 'Lógica de Negocio',
      items: [
        'business-logic/index',
        'business-logic/hooks',
        'business-logic/servicios',
        'business-logic/acciones',
        'business-logic/eventos',
        'business-logic/tareas',
        'business-logic/flujos'
      ]
    },
    {
      type: 'category',
      label: 'Plugins',
      items: [
        'plugins/index',
        'plugins/desarrollo',
        'plugins/marketplace'
      ]
    },

    {
      type: 'category',
      label: 'Implementación',
      items: [
        'deployment/index',
      ]
    },
    {
      type: 'category',
      label: 'Monitorización',
      items: [
        'monitoring/index',
        'monitoring/logs',
        'monitoring/metrics',
        'monitoring/alertas',
        'monitoring/dashboard'
      ]
    },
    {
      type: 'doc',
      id: 'reference',
      label: 'Referencia'
    }
  ]
};

module.exports = sidebars;
