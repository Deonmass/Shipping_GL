import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronRight, Truck, Ship, Plane, Warehouse, Home, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const HeroSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="relative bg-primary-900 text-white overflow-hidden min-h-screen scroll-snap-align-start flex items-center">
      {/* Background video with overlay */}
      <div 
        className="absolute inset-0 z-0"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          
          
          <source src="https://res.cloudinary.com/dsiuvwqah/video/upload/matadidare_ulfcgj.mp4" type="video/mp4" />
          {/*<source src="https://res.cloudinary.com/dbjl923hl/video/upload/v1756728993/matadidare_bjhd0f.mp4" type="video/mp4" />*/}
          
          {/* Fallback image if video doesn't load */}
          <img 
            src="https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260" 
            alt="Logistics background"
            className="w-full h-full object-cover"
          />
        </video>
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="container-custom relative z-10 py-20">
        <div className="max-w-3xl">
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t('home.hero.title')}
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-100 mb-10 drop-shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('home.hero.subtitle')}
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link to="/services" className="btn bg-white text-primary-900 hover:bg-gray-100 btn-lg shadow-lg hover:shadow-xl transition-all duration-300">
              {t('navigation.services')}
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Services Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm py-4">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: <Plane className="w-6 h-6 text-primary-600" />, text: t('home.services.airFreight.title') },
              { icon: <Ship className="w-6 h-6 text-primary-600" />, text: t('home.services.seaFreight.title') },
              { icon: <Truck className="w-6 h-6 text-primary-600" />, text: t('home.services.transport.title') },
              { icon: <Warehouse className="w-6 h-6 text-primary-600" />, text: t('home.services.warehousing.title') },
              { icon: <Home className="w-6 h-6 text-primary-600" />, text: t('home.services.moving.title') },
              { icon: <FileCheck className="w-6 h-6 text-primary-600" />, text: t('home.services.customs.title') }
            ].map((service, index) => (
              <motion.div 
                key={index}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index + 0.6 }}
              >
                <div className="flex-shrink-0">
                  {service.icon}
                </div>
                <span className="text-sm font-medium text-gray-800">{service.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;