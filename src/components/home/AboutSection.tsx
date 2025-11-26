import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const AboutSection: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    'Service client 24/7',
    'Suivi en temps réel',
    'Solutions logistiques sur mesure',
    'Équipe multilingue',
    'Présence en Afrique et à l\'international',
    'Certifications ISO'
  ];

  return (
    <section className="section bg-white min-h-screen scroll-snap-align-start flex items-center">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image side */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-xl overflow-hidden shadow-xl">
              <img 
                src="https://i.postimg.cc/Px4f1PLF/home.jpg" 
                alt="SHIPPING GL Team" 
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Floating accent */}
            <div className="absolute -bottom-6 -right-6 bg-accent-500 w-32 h-32 rounded-xl shadow-lg flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-2xl font-bold">10+</div>
                <div className="text-sm">Années</div>
                <div className="text-xs">d'expérience</div>
              </div>
            </div>
          </motion.div>

          {/* Content side */}
          <motion.div
            className="lg:pl-6"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-primary-950 mb-6">{t('home.about.title')}</h2>
            <h3 className="text-2xl font-medium text-primary-800 mb-6">{t('home.about.subtitle')}</h3>
            
            <p className="text-gray-700 mb-8 leading-relaxed text-justify">
              {t('home.about.description')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-gray-50 rounded-lg px-3 py-2 shadow-sm"
                >
                  <div className="bg-primary-100 rounded-full p-1 flex items-center justify-center mt-[2px]">
                    <Check className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-gray-700 text-sm leading-snug text-left">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <Link to="/a-propos" className="btn btn-primary">
              {t('home.about.cta')}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;