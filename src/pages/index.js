import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import SidebarMenu from '../components/SidebarMenu';
import { FaArrowRight, FaGithub, FaPlay } from 'react-icons/fa';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <div className="row">
          <div className="col col--8">
            <Heading as="h1" className={styles.title}>
              {siteConfig.title}
            </Heading>
            <p className={styles.subtitle}>{siteConfig.tagline}</p>
            <p className={styles.description}>
              NexusData API simplifica el desarrollo y operación de APIs modernas y federadas, 
              abordando <span className={styles.highlight}>desafíos clave</span> en este proceso.
            </p>
            <div className={styles.buttons}>
              <Link
                className={clsx('button button--primary', styles.button)}
                to="/docs/quickstart">
                Inicio Rápido <FaArrowRight className={styles.buttonIcon} />
              </Link>
              <Link
                className={clsx('button button--secondary', styles.button)}
                to="/docs/intro">
                Documentación
              </Link>
              <a
                className={clsx('button button--secondary', styles.button)}
                href="https://github.com/nexusdata/nexusdata-api"
                target="_blank"
                rel="noopener noreferrer">
                <FaGithub className={styles.buttonIcon} style={{marginRight: '0.5rem'}} />
                GitHub
              </a>
            </div>
          </div>
          <div className="col col--4">
            <div className={styles.videoContainer}>
              <div className={styles.videoWrapper}>
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="NexusData API Overview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className={styles.videoOverlay}>
                <FaPlay className={styles.playIcon} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function ApiFeature() {
  return (
    <section className={styles.apiFeature}>
      <div className="container">
        <div className="row">
          <div className="col col--7">
            <Heading as="h2" className={styles.featureTitle}>
              Crea una API en menos de un minuto con NexusData
            </Heading>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>+</span>
                <span>Conecta tu propia fuente de datos de manera eficiente</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>+</span>
                <span>Colabora fácilmente con tu equipo y otros departamentos</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>+</span>
                <span>Crea y documenta tus APIs con metadatos declarativos</span>
              </li>
            </ul>
            <div className={styles.ctaContainer}>
              <Link
                className={clsx('button button--primary', styles.ctaButton)}
                to="/docs/quickstart">
                Prueba NexusData API hoy gratis
                <FaArrowRight className={styles.buttonIcon} />
              </Link>
            </div>
          </div>
          <div className="col col--5">
            <div className={styles.imageContainer}>
              <img 
                src="/img/api-diagram.svg" 
                alt="NexusData API Diagrama" 
                className={styles.featureImage}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Bienvenido a ${siteConfig.title}`}
      description="NexusData API - La plataforma definitiva para desarrollo de APIs modernas">
      <HomepageHeader />
      <main>
        <div className="container">
          <div className="row">
            <div className="col col--3">
              <SidebarMenu />
            </div>
            <div className="col col--9">
              <div className={styles.mainContent}>
                <Heading as="h2" className={styles.mainTitle}>
                  Documentación de NexusData API
                </Heading>
                <p className={styles.mainDescription}>
                  NexusData API simplifica el desarrollo y operación de APIs modernas y federadas. 
                  Con un potente sistema de modelado y un flujo de trabajo orientado al código, 
                  NexusData API no es solo una mejora en la parte de acceso a datos de tu ciclo de desarrollo, 
                  sino un cambio completo en la forma en que creas, usas y gestionas APIs.
                </p>
                <p className={styles.upgradeNote}>
                  Para información sobre cómo actualizar desde versiones anteriores, consulta la <Link to="/docs/upgrades">guía de actualizaciones</Link>.
                </p>
                <ApiFeature />
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
