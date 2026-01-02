import React from 'react';
import { MapPin, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {UseGetOpenOffices} from "../../services";

const CtaSection: React.FC = () => {

    const {data: offices, isLoading: isGettingOffices} = UseGetOpenOffices()

  return (
    <section className="relative bg-primary-900 text-white min-h-screen scroll-snap-align-start flex items-center overflow-hidden">
      {/* Globe background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ 
          backgroundImage: 'url(https://i.pinimg.com/1200x/5a/11/24/5a112425344fe8c9a3ad6377a27843aa.jpg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)'
        }}
      />
      
      {/* Gradient overlay */}
      <div className="inset-0 bg-gradient-to-br from-primary-900/95 via-primary-900/90 to-primary-800/95" />

      <div className="container-custom py-20 md:py-1 relative z-1">
        <div className="max-w-6xl mx-auto">
          {/* Offices Section */}
          <div>
            <div className="text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-1">
                Nos Bureaux Stratégiques
              </h3>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-4">
                Positionnés stratégiquement près des principaux ports d'entrée pour la RDC, 
                nos bureaux garantissent une logistique optimale et un accès privilégié aux corridors commerciaux africains.
              </p>
            </div>

              {isGettingOffices ? <div>Chargement ...</div> : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {offices?.responseData?.data?.map((office: any, index: null) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-primary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-700/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <MapPin className="w-6 h-6 text-accent-400 mr-3" />
                      <h4 className="text-xl font-semibold text-white">{office.title}</h4>
                    </div>
                    {office?.is_hq?.toString() === "1" && (
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-accent-400 mr-1" />
                        <span className="text-sm text-accent-400 font-medium">Siège</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1 mb-4">
                      <p className="text-gray-300 text-sm">{office?.address_line_1}</p>
                      <p className="text-gray-300 text-sm">{office?.address_line_2}</p>
                      <p className="text-gray-300 text-sm">{office?.address_line_3}</p>
                  </div>
                  
                  <div className="bg-primary-700/30 rounded-lg p-3">
                    <p className="text-gray-200 text-sm italic">
                      <strong>Avantage stratégique :</strong> {office.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;