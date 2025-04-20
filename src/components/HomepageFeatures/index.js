import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import { FaFolder, FaEdit, FaLayerGroup, FaGlobe, FaTools, FaChartLine } from 'react-icons/fa';

const FeatureList = [
  {
    title: 'Fácil Creación de Contenido',
    icon: <FaEdit className={styles.featureIcon} />,
    description: (
      <>
        Crea contenido rápidamente con nuestra interfaz intuitiva. Publica páginas, documentos y blogs con solo unos clics.
      </>
    ),
  },
  {
    title: 'Organización Perfecta',
    icon: <FaFolder className={styles.featureIcon} />,
    description: (
      <>
        Estructura tu contenido de manera lógica y accesible. Mantén todo organizado en secciones y categorías claras.
      </>
    ),
  },
  {
    title: 'Diseño Adaptable',
    icon: <FaLayerGroup className={styles.featureIcon} />,
    description: (
      <>
        Tu sitio se verá espectacular en cualquier dispositivo. Nuestro diseño responde automáticamente a diferentes tamaños de pantalla.
      </>
    ),
  },
  {
    title: 'Implementación Global',
    icon: <FaGlobe className={styles.featureIcon} />,
    description: (
      <>
        Publica tu sitio a nivel mundial con solo unos pasos. Opciones de alojamiento flexibles para adaptarse a tus necesidades.
      </>
    ),
  },
  {
    title: 'Personalización Total',
    icon: <FaTools className={styles.featureIcon} />,
    description: (
      <>
        Adapta cada aspecto de tu sitio con opciones avanzadas. Colores, fuentes, layouts y mucho más a tu disposición.
      </>
    ),
  },
  {
    title: 'SEO Optimizado',
    icon: <FaChartLine className={styles.featureIcon} />,
    description: (
      <>
        Mejora la visibilidad de tu contenido en los buscadores. Herramientas integradas para optimizar tus páginas.
      </>
    ),
  },
];

function Feature({icon, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={styles.featureIconContainer}>
          {icon}
        </div>
        <div className={styles.featureContent}>
          <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
          <p className={styles.featureDescription}>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <Heading as="h2" className={styles.featuresTitle}>
          Características Principales
        </Heading>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
