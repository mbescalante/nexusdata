// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'NexusData API',
  tagline: 'La plataforma definitiva para desarrollo de APIs modernas',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://mbescalante.github.io',
  baseUrl: '/nexusdata/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'mbescalante', // Usually your GitHub org/user name.
  projectName: 'nexusdata', // Usually your repo name.
  deploymentBranch: 'gh-pages', // The branch where your site will be deployed
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/mbescalante/nexusdata/edit/main/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/mbescalante/nexusdata/edit/main/blog/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/nexusdata-social-card.jpg',
      navbar: {
        title: 'NexusData API',
        logo: {
          alt: 'NexusData API Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentación',
          },
          {to: '/docs/quickstart', label: 'Inicio Rápido', position: 'left'},
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/mbescalante/nexusdata',
            label: 'GitHub',
            position: 'right',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
                                    // Añadir botón de inicio de sesión
          {
            to: '/login',
            label: 'Login',
            position: 'right',
            className: 'navbar-login-button',
          },
          // Añadir botón de registro
          {
            to: '/signup',
            label: 'Registrarse',
            position: 'right',
            className: 'navbar-signup-button button button--primary',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Documentación',
                to: '/docs/intro',
              },
              {
                label: 'Inicio Rápido',
                to: '/docs/quickstart',
              },
              {
                label: 'API Referencias',
                to: '/docs/api',
              },
            ],
          },
          {
            title: 'Comunidad',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.gg/nexusdata',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/nexusdata',
              },
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/nexusdata',
              },
            ],
          },
          {
            title: 'Más',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/mbescalante/nexusdata',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} NexusData. Todos los derechos reservados.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
    }),
};

export default config;
