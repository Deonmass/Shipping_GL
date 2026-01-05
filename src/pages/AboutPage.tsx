import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, CheckCircle, X, FileText, DollarSign, Info, Mail, Send, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {UseGetOpenOffices, UseGetOpenTeams} from '../services';


const AboutPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    email: '',
    cc: '',
    message: ''
  });

  const {isLoading: isGettingOffices, data: offices} = UseGetOpenOffices()
  const {isLoading: isGettingTeams, data: teams} = UseGetOpenTeams()

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

  const handleSendEmail = (serviceEmail: string) => {
    if (!contactForm.email.trim()) {
      toast.error('Veuillez saisir votre adresse email');
      return;
    }
    if (!contactForm.message.trim()) {
      toast.error('Veuillez saisir votre message');
      return;
    }
    
    // Simulate email sending
    toast.success(`Email envoyé à ${serviceEmail}`);
    setContactForm({ email: '', cc: '', message: '' });
    setShowContactModal(null);
  };

  useEffect(() => {
    document.title = t('about.title') + ' - SHIPPING GL';
  }, [t]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero Section */}
      <section className="relative py-20 md:py-24 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ 
            backgroundImage: 'url(https://images.pexels.com/photos/1427541/pexels-photo-1427541.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)',
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
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">{t('about.title')}</h1>
            <p className="text-xl text-gray-200">
              {t('about.subtitle')}
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

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('about.team.title')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('about.team.description')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {isGettingTeams ? <div>Chargment ...</div>: null}
            {teams?.responseData?.data.map((member: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center cursor-pointer group"
                onClick={() => setSelectedMember(member)}
              >
                <div className="relative mb-4 mx-auto">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto group-hover:shadow-xl transition-shadow">
                    <img
                      src={member.image_url}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{member.name}</h3>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors">{member.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-gradient-to-r from-primary-50 to-blue-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('about.vision.title')}</h2>
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <p className="text-gray-700 leading-relaxed text-lg mb-6">
                {t('about.vision.paragraph1')}
              </p>
              <p className="text-gray-700 leading-relaxed text-lg mb-6">
                {t('about.vision.paragraph2')}
              </p>
              <p className="text-gray-700 leading-relaxed text-lg">
                {t('about.vision.paragraph3')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('about.mission.title')}</h2>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-8 md:p-12">
              <p className="text-gray-700 leading-relaxed text-lg mb-6">
                {t('about.mission.paragraph1')}
              </p>
              <p className="text-gray-700 leading-relaxed text-lg">
                {t('about.mission.paragraph2')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statement Section */}
      <section className="py-16 bg-gradient-to-r from-green-50 to-teal-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('about.statement.title')}</h2>
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <p className="text-gray-700 leading-relaxed text-lg">
                {t('about.statement.paragraph1')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('about.values.title')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('about.values.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gray-50 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedValue('integrity')}
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('about.values.integrity.title')}</h3>
              <p className="text-gray-600">{t('about.values.integrity.description')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-50 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedValue('excellence')}
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('about.values.excellence.title')}</h3>
              <p className="text-gray-600">{t('about.values.excellence.description')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gray-50 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedValue('reliability')}
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('about.values.reliability.title')}</h3>
              <p className="text-gray-600">{t('about.values.reliability.description')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gray-50 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedValue('innovation')}
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('about.values.innovation.title')}</h3>
              <p className="text-gray-600">{t('about.values.innovation.description')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-gray-50 rounded-xl p-6 text-center md:col-span-2 lg:col-span-1 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedValue('customerFocus')}
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('about.values.customerFocus.title')}</h3>
              <p className="text-gray-600">{t('about.values.customerFocus.description')}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('about.history.title')}</h2>
              <p className="text-gray-700 leading-relaxed text-lg text-justify">
                {t('about.history.description')}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">10+</div>
                  <div className="text-gray-600">Années d'expérience</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">4</div>
                  <div className="text-gray-600">Bureaux en Afrique</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">50+</div>
                  <div className="text-gray-600">Partenaires actifs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">1000+</div>
                  <div className="text-gray-600">Projets réalisés</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="rounded-xl overflow-hidden shadow-xl">
                <img
                  src="https://images.pexels.com/photos/1427541/pexels-photo-1427541.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260"
                  alt="Histoire de SHIPPING GL"
                  className="w-full h-96 object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary-600 text-white p-6 rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">2015</div>
                  <div className="text-sm">Année de création</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Services Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('about.contact.title')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('about.contact.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <service.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <p className="text-sm text-gray-500 mb-4">{service.email}</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowContactModal(service.id)}
                    className="btn btn-primary w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {t('about.contact.sendEmail')}
                  </button>
                  <a
                    href={`https://wa.me/${service.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour, je souhaite contacter le service ${service.title}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline w-full inline-flex items-center justify-center border-green-500 text-green-600 hover:bg-green-50"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp: {service.whatsapp}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Offices Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('about.offices.title')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('about.offices.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isGettingOffices && (
              <div className="col-span-full text-center text-gray-600">
                {t('about.offices.loading')}
              </div>
            )}
            {offices?.responseData?.data?.length && offices?.responseData?.data?.map((office: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6 relative"
              >
                <div className="absolute top-4 left-4">
                  <MapPin className="w-6 h-6 text-primary-600" />
                </div>
                {office.isHeadquarters && (
                  <div className="absolute bottom-4 right-4">
                    <CheckCircle className="w-6 h-6 text-primary-600" />
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-4 mt-8">{office.title}</h3>
                <div className="space-y-1">
                  <p className="text-gray-600">{office.address_line_1}</p>
                  <p className="text-gray-600">{office.address_line_2}</p>
                  <p className="text-gray-600">{office.address_line_3}</p>
                </div>
                {office.is_hq?.toString() === "1" && (
                  <div className="mt-4 inline-block bg-primary-50 text-primary-700 text-sm font-medium px-3 py-1 rounded-full">
                    {t('about.offices.headquarters')}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Member Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{t('about.team.memberDetails')}</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-100 mx-auto mb-4">
                <img
                  src={selectedMember.image_url}
                  alt={selectedMember.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">{selectedMember.name}</h4>
              <p className="text-primary-600 font-medium mb-4">{selectedMember.title}</p>
              <p className="text-gray-600 leading-relaxed">{selectedMember.description}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Value Details Modal */}
      {selectedValue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl p-6 max-w-lg w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{t(`about.values.${selectedValue}.title`)}</h3>
              <button
                onClick={() => setSelectedValue(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-600" />
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">{t(`about.values.${selectedValue}.description`)}</p>
              <p className="text-gray-700 leading-relaxed">{t(`about.values.${selectedValue}.details`)}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{t('about.contact.emailForm.title')}</h3>
              <button
                onClick={() => setShowContactModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const service = contactServices.find(s => s.id === showContactModal);
              if (service) handleSendEmail(service.email);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('about.contact.emailForm.to')}
                  </label>
                  <input
                    type="email"
                    value={contactServices.find(s => s.id === showContactModal)?.email || ''}
                    className="input bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('about.contact.emailForm.yourEmail')}
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('about.contact.emailForm.cc')}
                  </label>
                  <input
                    type="email"
                    value={contactForm.cc}
                    onChange={(e) => setContactForm(prev => ({ ...prev, cc: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('about.contact.emailForm.message')}
                  </label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowContactModal(null)}
                  className="btn btn-outline"
                >
                  {t('about.contact.emailForm.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {t('about.contact.emailForm.send')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};

export default AboutPage;