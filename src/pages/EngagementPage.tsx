import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BadgeCheck, ShieldCheck, Leaf, Globe, Users, Clock, Heart } from 'lucide-react';

// Images d'exemple - À remplacer par vos propres images
const heroBg = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80';
const galleryImages = [
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
];

const certifications = [
  {
    title: 'ISO 9001:2015',
    description: 'Certification internationale pour notre système de management de la qualité',
    icon: <BadgeCheck className="w-10 h-10" />,
    color: 'bg-red-50',
    textColor: 'text-red-600',
    hoverColor: 'hover:bg-red-100'
  },
  {
    title: 'Environnement',
    description: 'Engagement pour des opérations respectueuses de l\'environnement',
    icon: <Leaf className="w-10 h-10" />,
    color: 'bg-green-50',
    textColor: 'text-green-600',
    hoverColor: 'hover:bg-green-100'
  },
  {
    title: 'Sécurité',
    description: 'Normes de sécurité strictes pour nos employés et partenaires',
    icon: <ShieldCheck className="w-10 h-10" />,
    color: 'bg-blue-50',
    textColor: 'text-blue-600',
    hoverColor: 'hover:bg-blue-100'
  },
  {
    title: 'Développement Durable',
    description: 'Stratégies durables pour un avenir meilleur',
    icon: <Globe className="w-10 h-10" />,
    color: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    hoverColor: 'hover:bg-yellow-100'
  },
  {
    title: 'Équipe Qualifiée',
    description: 'Des professionnels expérimentés à votre service',
    icon: <Users className="w-10 h-10" />,
    color: 'bg-purple-50',
    textColor: 'text-purple-600',
    hoverColor: 'hover:bg-purple-100'
  },
  {
    title: 'Service 24/7',
    description: 'Disponible pour vous à tout moment',
    icon: <Clock className="w-10 h-10" />,
    color: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    hoverColor: 'hover:bg-indigo-100'
  }
];

const AnimatedNumber = ({ value }: { value: string }) => {
  const [count, setCount] = useState(0);
  const target = parseInt(value) || 0;
  const isNumber = !isNaN(target);
  
  useEffect(() => {
    if (!isNumber) return;
    
    const duration = 2000; // 2 secondes
    const step = Math.ceil(target / (duration / 16)); // 60fps
    
    const timer = setInterval(() => {
      setCount((prev: number) => {
        const newCount = prev + step;
        if (newCount >= target) {
          clearInterval(timer);
          return target;
        }
        return newCount;
      });
    }, 16);
    
    return () => clearInterval(timer);
  }, [target, isNumber]);
  
  return <>{isNumber ? count : value}</>;
};

const stats = [
  { value: '10', label: 'Années d\'expérience', icon: <Clock className="w-8 h-8" /> },
  { value: '500', label: 'Clients satisfaits', icon: <Users className="w-8 h-8" /> },
  { value: '50', label: 'Pays desservis', icon: <Globe className="w-8 h-8" /> },
  { value: '24/7', label: 'Support client', icon: <Heart className="w-8 h-8" /> }
];

const EngagementPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-50"
    >
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroBg} 
            alt="Engagement" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-red-900/70 mix-blend-multiply" />
        </div>
        
        <div className="container-custom relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Notre Engagement envers l'Excellence
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Découvrez nos engagements envers la qualité, l'environnement et la responsabilité sociale.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <button className="bg-white text-red-700 font-semibold px-8 py-3 rounded-full hover:bg-red-50 transition-colors duration-300 transform hover:scale-105">
                En savoir plus
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="p-6 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-4xl font-bold mb-2 flex items-center justify-center">
                  {stat.icon}
                  <span className="ml-2">
                    <AnimatedNumber value={stat.value} />
                    {stat.value.includes('+') && '+'}
                  </span>
                </div>
                <p className="text-red-100">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-20 bg-white">
        <div className="container-custom px-4">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Nos Certifications & Engagements
            </motion.h2>
            <div className="w-20 h-1 bg-red-600 mx-auto mb-6"></div>
            <motion.p 
              className="text-gray-600 max-w-3xl mx-auto text-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Découvrez nos engagements envers l'excellence, la qualité et le développement durable
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {certifications.map((cert, index) => (
              <motion.div
                key={index}
                className={`p-8 rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-2 ${cert.hoverColor}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className={`w-16 h-16 ${cert.color} ${cert.textColor} rounded-full flex items-center justify-center mb-6 mx-auto`}>
                  {React.cloneElement(cert.icon, { className: 'w-8 h-8' })}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center text-gray-900">{cert.title}</h3>
                <p className="text-gray-600 text-center">{cert.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre Engagement en Images</h2>
            <div className="w-20 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Découvrez comment nous mettons en œuvre nos engagements au quotidien
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {galleryImages.map((img, index) => (
              <motion.div 
                key={index}
                className="relative overflow-hidden rounded-xl aspect-square"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <img 
                  src={img} 
                  alt={`Galerie ${index + 1}`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="text-white text-center p-4">
                    <span className="text-sm font-medium bg-red-600 px-3 py-1 rounded-full">
                      Engagement {index + 1}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      

    </motion.div>
  );
};

export default EngagementPage;
