import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, Mail, FileText, DollarSign, Info, X, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {UseGetOpenOffices} from "../services";

const ContactPage: React.FC = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactModal, setShowContactModal] = useState<string | null>(null);
  const {data: offices, isLoading: isGettingOffices} = UseGetOpenOffices()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const contactServices = [
    {
      id: 'quotations',
      title: t('about.contact.quotations.title'),
      email: 'quotations@shippinggreatlakes.com',
      whatsapp: '+243977813241',
      icon: FileText,
      description: t('about.contact.quotations.description')
    },
    {
      id: 'accounting',
      title: t('about.contact.accounting.title'),
      email: 'accounting@shippinggreatlakes.com',
      whatsapp: '+243977813241',
      icon: DollarSign,
      description: t('about.contact.accounting.description')
    },
    {
      id: 'general',
      title: t('about.contact.general.title'),
      email: 'info@shippinggreatlakes.com',
      whatsapp: '+243977813241',
      icon: Info,
      description: t('about.contact.general.description')
    }
  ];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'email est invalide';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Le sujet est requis';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Le message est requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setIsSubmitting(true);
    
    // Simulation d'envoi
    setTimeout(() => {
      console.log('Formulaire soumis:', formData);
      toast.success('Votre message a été envoyé avec succès !');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Composant d'arrière-plan de section avec carte du monde
  interface SectionWithMapBackgroundProps {
    children: React.ReactNode;
    className?: string;
    showMap?: boolean;
  }

  const SectionWithMapBackground: React.FC<SectionWithMapBackgroundProps> = ({ 
    children, 
    className = '',
    showMap = false
  }) => (
    <div className={`relative overflow-hidden ${className}`}>
      {showMap && (
        <div 
          className="fixed inset-0 z-0 w-screen"
          style={{
            backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1200px-World_map_-_low_resolution.svg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.1,
            filter: 'grayscale(100%) brightness(1.5)',
            pointerEvents: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.66)',
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw',
            width: '100vw',
          }}
        />
      )}
      
      {/* Contenu de la section */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white"
    >
      
      {/* Section 1: Services de Contact avec carte en fond */}
      <SectionWithMapBackground className="min-h-screen bg-white/80" showMap={true}>
      <section className="py-24 md:py-20 relative">
        {/* Background elements */}
        <div className="absolute inset-0 bg-[url('/src/assets/pattern-grid.svg')] bg-center opacity-10"></div>
        
        <div className="container-custom px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Contactez-nous
            </motion.h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Notre équipe dédiée est là pour répondre à toutes vos questions et vous accompagner dans vos projets de transport et logistique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {contactServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <service.icon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <p className="text-sm text-gray-500 mb-4">{service.email}</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowContactModal(service.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer un email
                  </button>
                  <a
                    href={`https://wa.me/${service.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour, je souhaite contacter le service ${service.title}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center border border-green-500 text-green-600 hover:bg-green-50 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      </SectionWithMapBackground>
      
      {/* Section 2: Nos Bureaux - Sans carte en fond */}
      <SectionWithMapBackground className="bg-white">
        <section className="py-16">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <motion.h1 
                className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Nos Bureaux
            </motion.h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Retrouvez-nous dans nos différents bureaux à travers le monde pour un service personnalisé et de qualité.
              </p>
            </motion.div>

            {isGettingOffices ? <div>Chargement ...</div> : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
              {offices?.responseData?.data?.length && offices?.responseData?.data?.map((office: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6 relative hover:shadow-md transition-shadow"
                >
                  <div className="absolute top-4 left-4">
                    <MapPin className="w-6 h-6 text-red-600" />
                  </div>
                  {office.is_hq?.toString() === "1" && (
                    <div className="absolute top-4 right-4 bg-red-50 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                      Siège Social
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 mt-8">{office.title}</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600 text-sm">{office?.address_line_1}</p>
                    <p className="text-gray-600 text-sm">{office?.address_line_2}</p>
                    <p className="text-gray-600 text-sm">{office?.address_line_3}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </SectionWithMapBackground>
      
      {/* Map Section - Pleine largeur */}
      <SectionWithMapBackground className="w-full">
        <section className="relative w-full">
          <div className="w-full h-[500px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.1234567890123!2d15.304333!3d-4.306139!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMTgnMjIuMSJTIDE1wrAxOCcxNS42IkU!5e0!3m2!1sfr!2scg!4v1234567890123!5m2!1sfr!2scg"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Localisation de SHIPPING GL"
              className="w-full h-full"
            ></iframe>
          </div>
        </section>
      </SectionWithMapBackground>
    </motion.div>
  );
};

export default ContactPage;
