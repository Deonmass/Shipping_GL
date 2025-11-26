import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BadgeCheck, ShieldCheck, Leaf, Award, Globe } from 'lucide-react';

const certifications = [
  {
    title: 'ISO 9001:2015',
    description: 'Certification internationale pour notre système de management de la qualité',
    icon: <BadgeCheck className="w-12 h-12 text-primary-600 mb-4" />
  },
  {
    title: 'Environnement',
    description: 'Engagement pour des opérations respectueuses de l\'environnement',
    icon: <Leaf className="w-12 h-12 text-green-600 mb-4" />
  },
  {
    title: 'Sécurité',
    description: 'Normes de sécurité strictes pour nos employés et partenaires',
    icon: <ShieldCheck className="w-12 h-12 text-blue-600 mb-4" />
  },
  {
    title: 'Responsabilité Sociale',
    description: 'Engagement envers les communautés locales et le développement durable',
    icon: <Globe className="w-12 h-12 text-yellow-600 mb-4" />
  }
];

const EngagementPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero Section */}
      <section className="relative py-20 md:py-24 overflow-hidden bg-gradient-to-r from-primary-700 to-primary-900">
        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Notre Engagement
            </h1>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              Découvrez nos engagements envers la qualité, l'environnement et la responsabilité sociale.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos Certifications et Engagements</h2>
            <div className="w-20 h-1 bg-primary-600 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {certifications.map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex justify-center">
                  {cert.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{cert.title}</h3>
                <p className="text-gray-600">{cert.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Engagement Details */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 rounded-lg shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Notre Vision pour un Avenir Durable</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-primary-700 flex items-center">
                    <Award className="mr-2" /> Notre Engagement Environnemental
                  </h3>
                  <p className="text-gray-700">
                    Chez SHIPPING GL, nous nous engageons à réduire notre empreinte carbone et à promouvoir des pratiques logistiques durables. 
                    Nous investissons dans des technologies propres et optimisons nos itinéraires pour minimiser notre impact sur l'environnement.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-primary-700 flex items-center">
                    <ShieldCheck className="mr-2" /> Sécurité et Qualité
                  </h3>
                  <p className="text-gray-700">
                    La sécurité de nos employés, partenaires et clients est notre priorité absolue. 
                    Nous maintenons les normes les plus élevées en matière de sécurité et de qualité à chaque étape de notre chaîne logistique.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-primary-700 flex items-center">
                    <Globe className="mr-2" /> Responsabilité Sociale
                  </h3>
                  <p className="text-gray-700">
                    Nous croyons en la responsabilité sociale des entreprises. 
                    À travers diverses initiatives, nous contribuons au développement des communautés locales et à l'amélioration des conditions de vie.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default EngagementPage;
