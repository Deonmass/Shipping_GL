import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plane, Ship, Truck, Warehouse, Home, FileCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  delay: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, title, description, link, delay }) => {
  return (
    <motion.div 
      className="card group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="p-6 md:p-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-5 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-gray-600 mb-5">{description}</p>
        <Link to={link} className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
          <span>En savoir plus</span>
          <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
};

const ServicesSection: React.FC = () => {
  const { t } = useTranslation();

  const services = [
    {
      icon: <Plane className="w-7 h-7" />,
      title: t('home.services.airFreight.title'),
      description: t('home.services.airFreight.description'),
      link: '/services#air-freight',
      delay: 0.1
    },
    {
      icon: <Ship className="w-8 h-8" />,
      title: t('home.services.seaFreight.title'),
      description: t('home.services.seaFreight.description'),
      link: '/services#sea-freight',
      delay: 0.2
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: t('home.services.transport.title'),
      description: t('home.services.transport.description'),
      link: '/services#transport',
      delay: 0.3
    },
    {
      icon: <Warehouse className="w-8 h-8" />,
      title: t('home.services.warehousing.title'),
      description: t('home.services.warehousing.description'),
      link: '/services#warehousing',
      delay: 0.4
    },
    {
      icon: <Home className="w-8 h-8" />,
      title: t('home.services.moving.title'),
      description: t('home.services.moving.description'),
      link: '/services#moving',
      delay: 0.5
    },
    {
      icon: <FileCheck className="w-8 h-8" />,
      title: t('home.services.customs.title'),
      description: t('home.services.customs.description'),
      link: '/services#customs',
      delay: 0.6
    }
  ];

  return (
    <section
      className="section relative min-h-screen scroll-snap-align-start flex items-center bg-white"
      id="services"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)), url(/image copy.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="container-custom py-12">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title text-black">{t('home.services.title')}</h2>
          <p className="section-subtitle mx-auto text-gray-700 max-w-3xl text-justify">
            {t('home.services.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              link={service.link}
              delay={service.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;