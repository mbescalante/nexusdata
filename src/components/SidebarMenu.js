import React from 'react';
import { 
  FaHome, 
  FaBook, 
  FaDatabase, 
  FaCode, 
  FaServer, 
  FaCloud,
  FaTools,
  FaPlug,
  FaProjectDiagram,
  FaShieldAlt,
  FaBusinessTime,
  FaChartLine
} from 'react-icons/fa';
import Link from '@docusaurus/Link';
import styles from './SidebarMenu.module.css';

const menuItems = [
  {
    to: '/docs/intro',
    label: 'Introducción',
    icon: <FaHome className={styles.menuIcon} />,
  },
  {
    to: '/docs/quickstart',
    label: 'Inicio Rápido',
    icon: <FaCode className={styles.menuIcon} />,
  },
  {
    to: '/docs/data-sources',
    label: 'Fuentes de Datos',
    icon: <FaDatabase className={styles.menuIcon} />,
  },
  {
    to: '/docs/data-modeling',
    label: 'Modelado de Datos',
    icon: <FaProjectDiagram className={styles.menuIcon} />,
  },
  {
    to: '/docs/graphql-api',
    label: 'API GraphQL',
    icon: <FaCloud className={styles.menuIcon} />,
  },
  {
    to: '/docs/servicios-http',
    label: 'Servicios HTTP',
    icon: <FaServer className={styles.menuIcon} />,
  },
  {
    to: '/docs/auth',
    label: 'Autenticación',
    icon: <FaShieldAlt className={styles.menuIcon} />,
  },
  {
    to: '/docs/business-logic',
    label: 'Lógica de Negocio',
    icon: <FaBusinessTime className={styles.menuIcon} />,
  },
  {
    to: '/docs/plugins',
    label: 'Plugins',
    icon: <FaPlug className={styles.menuIcon} />,
  },
  {
    to: '/docs/deployment',
    label: 'Implementación',
    icon: <FaTools className={styles.menuIcon} />,
  },
  {
    to: '/docs/monitoring',
    label: 'Monitorización',
    icon: <FaChartLine className={styles.menuIcon} />,
  },
  {
    to: '/docs/reference',
    label: 'Referencia',
    icon: <FaBook className={styles.menuIcon} />,
  },
];

export default function SidebarMenu() {
  return (
    <div className={styles.menuContainer}>
      <h3 className={styles.menuTitle}>NexusData API</h3>
      <ul className={styles.menuList}>
        {menuItems.map((item, index) => (
          <li key={index} className={styles.menuItem}>
            <Link to={item.to} className={styles.menuLink}>
              <span className={styles.iconContainer}>{item.icon}</span>
              <span className={styles.menuText}>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
} 