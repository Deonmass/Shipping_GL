import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import {UseGetOpenCategories, UseGetOpenPartners} from "../services";

interface Partner {
  id: string;
  title: string;
  description: string;
  logo_url: string;
  website: string;
  phone: string;
  email: string;
  status: string;
  category_id: string;
  company_name: string;
}

interface PartnerCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface PartnersByCategory {
  category: PartnerCategory;
  partners: Partner[];
}

const PartnersPage: React.FC = () => {
  const { t } = useTranslation();
  const [partnersByCategory, setPartnersByCategory] = useState<PartnersByCategory[]>([]);

  const {data: partners, isLoading: isGettingPartners} = UseGetOpenPartners()
  const {data: categories, isLoading: isGettingCategories} = UseGetOpenCategories({type: "partner"})

  useEffect(() => {
    document.title = t('partners.title') + ' - SHIPPING GL';
    fetchPartners();
  }, [partners, categories]);

  const fetchPartners = async () => {
    try {
      const grouped = categories?.responseData?.data?.map((category: any) => ({
        category,
        partners: partners?.responseData?.data?.filter((p: any) => p.category_id === category.id)
      })).filter((group: any) => group.partners.length > 0);

      setPartnersByCategory(grouped);
    } catch (error: any) {
      toast.error(`Erreur lors du chargement des partenaires: ${error.message || 'Erreur inconnue'}`);
    }
  };

  if (isGettingPartners || isGettingCategories) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gray-50 flex items-center justify-center"
      >
        <Loader className="w-12 h-12 text-primary-600 animate-spin" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <section className="relative bg-primary-900 text-white py-20 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)',
            backgroundPosition: '50% 30%'
          }}
        >
          <div className="absolute inset-0 bg-primary-900 opacity-75"></div>
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('partners.hero.title')}</h1>
            <p className="text-xl text-gray-300 mb-8">
              {t('partners.hero.subtitle')}
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full">
            <path
              fill="#f9fafb"
              fillOpacity="1"
              d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            ></path>
          </svg>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          {!partnersByCategory?.length ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Aucun partenaire disponible pour le moment.</p>
            </div>
          ) : (
            <>
              {partnersByCategory?.map((group) => (
                <div key={group.category.id} className="mb-16 last:mb-0">
                  <h2 className="text-2xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-primary-200">
                    {group.category.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {group?.partners?.map((partner, partnerIndex) => (
                      <motion.div
                        key={partner.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: partnerIndex * 0.1 }}
                        whileHover={{
                          scale: 1.03,
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }}
                        className="bg-white rounded-xl shadow-sm overflow-hidden relative transform transition-all duration-300 hover:z-10"
                      >
                        <div className="absolute top-4 right-4 group">
                          <CheckCircle className="w-6 h-6 text-primary-600" />
                          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-primary-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap">
                              Partenaire vérifié
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="h-20 flex items-center justify-center mb-6">
                            {partner.logo_url ? (
                              <img
                                src={partner.logo_url}
                                alt={partner?.title}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <div className="text-2xl font-bold text-gray-400">
                                {partner?.title}
                              </div>
                            )}
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">{partner.company_name}</h3>
                          <p className="text-gray-600 text-justify mb-4">{partner.description || 'Partenaire de confiance'}</p>
                          <div className="text-sm text-gray-500">
                            {partner.email && (
                              <p className="mb-2"><strong>Email:</strong> {partner.email}</p>
                            )}
                            {partner.phone && (
                              <p className="mb-2"><strong>Téléphone:</strong> {partner.phone}</p>
                            )}
                            {partner.website && (
                              <p>
                                <strong>Site web:</strong>{' '}
                                <a
                                  href={partner.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-600 hover:text-primary-700"
                                >
                                  Visiter
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Mur de logos de tous les partenaires visibles */}
              <div className="mt-20">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
                  {t('partners.logoWallTitle', 'Ils nous font confiance')}
                </h2>
                <p className="text-sm md:text-base text-gray-600 text-center mb-10 max-w-2xl mx-auto">
                  {t('partners.logoWallSubtitle', 'Une sélection de nos partenaires approuvés, réunis sur un même mur de logos.')}
                </p>

                <div className="bg-white rounded-2xl shadow-inner p-4 md:p-6">
                  <div className="flex flex-wrap justify-center gap-2 md:gap-3 lg:gap-4">
                    {partnersByCategory
                      .flatMap(group => group.partners)
                      .map((partner, index) => {
                        // Générateur de tailles aléatoires
                        const sizes = [
                          'w-24 h-16', 'w-28 h-20', 'w-32 h-16', 'w-20 h-16',
                          'w-36 h-16', 'w-24 h-20', 'w-28 h-16', 'w-32 h-20'
                        ];
                        const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
                        
                        // Rotation aléatoire légère
                        const rotations = ['rotate-0', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-2'];
                        const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];
                        
                        // Délai d'animation aléatoire
                        const delay = Math.random() * 0.5;
                        
                        return (
                          <motion.div
                            key={`logo-wall-${partner.id}`}
                            className={`${randomSize} ${randomRotation} m-1 md:m-2 flex-shrink-0`}
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay }}
                            whileHover={{ 
                              scale: 1.05,
                              zIndex: 10,
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            <div className="w-full h-full flex items-center justify-center p-2 bg-white rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/40 transition-all duration-200">
                              {partner.logo_url ? (
                                <img
                                  src={partner.logo_url}
                                  alt={partner.title}
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/180x60?text=' + partner.company_name;
                                  }}
                                />
                              ) : (
                                <span className="text-[10px] font-semibold text-gray-500 text-center px-1 line-clamp-2">
                                  {partner.title}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </motion.div>
  );
};

export default PartnersPage;
