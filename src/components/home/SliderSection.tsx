import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { MapPin, Anchor, Ship } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const SliderSection: React.FC = () => {
  const { t } = useTranslation();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      image: 'https://container-news.com/wp-content/uploads/2023/06/Matadi-Gateway.jpg',
      title: 'Port de Matadi',
      description: 'Le principal port maritime de la République Démocratique du Congo, situé sur le fleuve Congo. Point d\'entrée crucial pour 80% des importations du pays, Matadi constitue la porte d\'entrée maritime principale vers l\'intérieur du continent.',
      details: [
        'Capacité de traitement : 500,000 TEU/an',
        'Principal corridor d\'accès vers Kinshasa',
        'Hub logistique pour l\'Afrique centrale',
        'Connexion directe avec l\'Océan Atlantique'
      ]
    },
    {
      image: 'https://open.enabel.be/files/pictures/project/TZA23004_1738679673.jpg',
      title: 'Port de Dar es Salaam',
      description: 'Un port majeur en Tanzanie et l\'une des principales portes d\'entrée maritimes de l\'Afrique de l\'Est. Ce port dessert non seulement la Tanzanie mais aussi les pays enclavés comme la RDC orientale, le Rwanda, le Burundi et l\'Ouganda.',
      details: [
        'Plus grand port de l\'Afrique de l\'Est',
        'Corridor vers la RDC via Kigoma',
        'Capacité moderne de conteneurs',
        'Hub régional pour 6 pays enclavés'
      ]
    },
    {
      image: 'https://tbywordpress.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/09/23124301/shutterstock_1068814604.jpg',
      title: 'Port de Mombasa',
      description: 'Le plus grand port du Kenya et un hub logistique crucial pour l\'Afrique de l\'Est. Mombasa sert de porte d\'entrée pour les marchandises à destination de la RDC via les corridors terrestres, particulièrement pour les régions du Nord et de l\'Est du pays.',
      details: [
        'Port le plus moderne d\'Afrique de l\'Est',
        'Connexion ferroviaire vers l\'intérieur',
        'Terminal à conteneurs ultramoderne',
        'Corridor Northern vers la RDC'
      ]
    },
    {
      image: 'https://www.tresor.economie.gouv.fr/Articles/a9624c66-07a2-4f68-a92b-f83eec642c3c/images/visuel',
      title: 'Port de Durban',
      description: 'Le plus grand et le plus actif port d\'Afrique subsaharienne, crucial pour le commerce sud-africain. Durban constitue un point d\'entrée stratégique pour les marchandises à destination de la RDC via le corridor Sud et Kasumbalesa.',
      details: [
        'Plus grand port d\'Afrique subsaharienne',
        'Corridor Sud vers Lubumbashi',
        'Infrastructure portuaire de classe mondiale',
        'Hub pour les minerais et produits manufacturés'
      ]
    }
  ];

  return (
    <section className="relative w-full min-h-screen scroll-snap-align-start bg-gray-50 pt-8">
      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-5">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Nos Points Stratégiques</h2>
          <p className="section-subtitle mx-auto py-6">
            Découvrez nos principales installations portuaires en Afrique et leur importance stratégique
          </p>

          {/* Port indicators */}
            <div className="flex justify-center space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activeSlide ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                  onClick={() => {
                    // This would require a ref to the Swiper instance to programmatically change slides
                  }}
                />
              ))}
            </div>
          
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
        >
          
          {/* Left Column - Swiper */}
          <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-2xl">
            <Swiper
              modules={[Navigation, Pagination, Autoplay, EffectFade]}
              spaceBetween={0}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              effect="fade"
              onSlideChange={(swiper) => setActiveSlide(swiper.activeIndex)}
              className="h-full w-full"
            >
              {slides.map((slide, index) => (
                <SwiperSlide key={index} className="relative">
                  <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: `url(${slide.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Right Column - Dynamic Content */}
          <div className="space-y-6 h-[600px] flex flex-col justify-center">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-lg p-8 flex-1"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <Anchor className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {slides[activeSlide].title}
                </h3>
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                {slides[activeSlide].description}
              </p>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <Ship className="w-5 h-5 mr-2 text-primary-600" />
                  Caractéristiques clés :
                </h4>
                {slides[activeSlide].details.map((detail, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <p className="text-gray-600">{detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SliderSection;