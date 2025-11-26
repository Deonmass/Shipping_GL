import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plane, Ship, Truck, Warehouse, Home, FileCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const QUOTE_EDITOR_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const QUOTE_EDITOR_FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'list',
  'bullet',
  'link',
];

type ServiceRow = {
  id: number;
  service_name: string;
  service_code: string;
  service_description: string | null;
};

type QuoteRequestRow = {
  service_code: string | null;
};

const ServicesPage: React.FC = () => {
  const { t } = useTranslation();
  const [dbServices, setDbServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteService, setQuoteService] = useState<{ code: string; name: string } | null>(null);
  const [detailModalService, setDetailModalService] = useState<{
    code: string;
    name: string;
    description: string;
    image: string;
  } | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    details: '',
  });
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [quoteCountsByService, setQuoteCountsByService] = useState<Record<string, number>>({});

  // Update document title
  useEffect(() => {
    document.title = t('services.title') + ' - SHIPPING GL';
  }, [t]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setQuoteModalOpen(false);
      }
    };

    if (quoteModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quoteModalOpen]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const { data, error } = await supabase
          .from('service')
          .select('id, service_name, service_code, service_description')
          .order('id', { ascending: true });

        if (error) {
          console.error('Erreur lors du chargement des services depuis Supabase', error);
          setLoadError("Impossible de charger la liste des services pour le moment.");
          setDbServices([]);
          return;
        }

        setDbServices(data || []);
      } catch (e) {
        console.error('Erreur inattendue lors du chargement des services:', e);
        setLoadError("Une erreur inattendue est survenue lors du chargement des services.");
        setDbServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const fetchQuoteCounts = async () => {
      try {
        const { data, error } = await supabase
          .from('quote_requests')
          .select('service_code');

        if (error) {
          console.error('Erreur lors du chargement des demandes de devis par service', error);
          return;
        }

        const counts: Record<string, number> = {};
        (data as QuoteRequestRow[]).forEach((row) => {
          if (!row.service_code) return;
          counts[row.service_code] = (counts[row.service_code] || 0) + 1;
        });

        setQuoteCountsByService(counts);
      } catch (e) {
        console.error('Erreur inattendue lors du chargement des demandes de devis par service:', e);
      }
    };

    fetchQuoteCounts();
  }, []);

  const services = [
    {
      id: 'air-freight',
      title: t('services.airFreight.title'),
      description: t('services.airFreight.description'),
      features: t('services.airFreight.features', { returnObjects: true }) as string[],
      image: 'https://i.pinimg.com/736x/74/84/08/748408ea5a6eac160a5d18721c8baa38.jpg',
      icon: <Plane className="w-8 h-8" />,
      reversed: false
    },
    {
      id: 'sea-freight',
      title: t('services.seaFreight.title'),
      description: t('services.seaFreight.description'),
      features: t('services.seaFreight.features', { returnObjects: true }) as string[],
      image: 'https://i.pinimg.com/736x/80/81/c5/8081c519bd631844e676e42af2d7e41b.jpg',
      icon: <Ship className="w-8 h-8" />,
      reversed: true
    },
    {
      id: 'transport',
      title: t('services.transport.title'),
      description: t('services.transport.description'),
      features: t('services.transport.features', { returnObjects: true }) as string[],
      image: 'https://i.pinimg.com/736x/24/40/8b/24408b43c55bd2d8c6e00386eb2b3241.jpg',
      icon: <Truck className="w-8 h-8" />,
      reversed: false
    },
    {
      id: 'warehousing',
      title: t('services.warehousing.title'),
      description: t('services.warehousing.description'),
      features: t('services.warehousing.features', { returnObjects: true }) as string[],
      image: 'https://i.pinimg.com/1200x/f5/7f/cb/f57fcb397ff74d081ca95a2e039c419e.jpg',
      icon: <Warehouse className="w-8 h-8" />,
      reversed: true
    },
    {
      id: 'moving',
      title: t('services.moving.title'),
      description: t('services.moving.description'),
      features: t('services.moving.features', { returnObjects: true }) as string[],
      image: 'https://i.pinimg.com/736x/eb/e7/b6/ebe7b60acb7a8489ea5ac5a71fd4c901.jpg',
      icon: <Home className="w-8 h-8" />,
      reversed: false
    },
    {
      id: 'customs',
      title: t('services.customs.title'),
      description: t('services.customs.description'),
      features: t('services.customs.features', { returnObjects: true }) as string[],
      image: 'https://i.postimg.cc/hjchD78h/decl.png',
      icon: <FileCheck className="w-8 h-8" />,
      reversed: true
    }
  ];

  const getServiceDescription = (anchorId: string) => {
    const match = services.find((s) => s.id === anchorId);
    return match?.description;
  };

  const getServiceImage = (anchorId: string) => {
    const match = services.find((s) => s.id === anchorId);
    return match?.image;
  };

  const heroServices = dbServices.map((row) => {
    let icon: React.ReactNode = <FileCheck className="w-8 h-8" />;
    let anchorId = 'customs';

    switch (row.service_code) {
      case 'AFR':
        icon = <Plane className="w-8 h-8" />;
        anchorId = 'air-freight';
        break;
      case 'OFR':
        icon = <Ship className="w-8 h-8" />;
        anchorId = 'sea-freight';
        break;
      case 'WHS':
        icon = <Warehouse className="w-8 h-8" />;
        anchorId = 'warehousing';
        break;
      case 'DOM':
        icon = <Truck className="w-8 h-8" />;
        anchorId = 'transport';
        break;
      case 'MOV':
        icon = <Home className="w-8 h-8" />;
        anchorId = 'moving';
        break;
      case 'CCI':
      case 'CCE':
      case 'COI':
      case 'SAP':
      default:
        icon = <FileCheck className="w-8 h-8" />;
        anchorId = 'customs';
        break;
    }

    return {
      code: row.service_code,
      name: row.service_name,
      description: row.service_description,
      icon,
      anchorId,
    };
  });

  const openQuoteModal = (service: { id: string; title: string }) => {
    setQuoteService({ code: service.id, name: service.title });
    setQuoteModalOpen(true);
  };

  const openDetailModal = (service: { code: string; name: string; anchorId: string }) => {
    const description = getServiceDescription(service.anchorId) || '';
    const image = getServiceImage(service.anchorId) || '';

    setDetailModalService({
      code: service.code,
      name: service.name,
      description,
      image,
    });
  };

  const handleQuoteChange = (field: keyof typeof quoteForm, value: string) => {
    setQuoteForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteService) return;

    const { name, email, details, phone, company } = quoteForm;
    const plainDetails = details
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim();

    if (!name.trim() || !email.trim() || !plainDetails) {
      await Swal.fire({
        icon: 'warning',
        title: 'Informations manquantes',
        text: 'Merci de renseigner au moins votre nom, votre email et les détails de la demande.',
        confirmButtonText: 'OK',
      });
      return;
    }

    try {
      setIsSendingQuote(true);

      const serviceRow = dbServices.find(s => s.service_code === quoteService.code);
      const effectiveServiceName = serviceRow?.service_name || quoteService.name;

      const { error: quoteError } = await supabase
        .from('quote_requests')
        .insert([
          {
            service_code: quoteService.code,
            service_name: effectiveServiceName,
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            company: company.trim() || null,
            details,
          },
        ]);

      if (quoteError) throw quoteError;

      const { error: notifError } = await supabase
        .from('admin_notifications')
        .insert([
          {
            type: 'quote',
            title: `Demande de devis - ${effectiveServiceName}`,
            message: `${name.trim()} a soumis une demande de devis pour ${effectiveServiceName}.`,
            data: {
              service_code: quoteService.code,
              service_name: effectiveServiceName,
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim() || null,
              company: company.trim() || null,
            },
            is_read: false,
          },
        ]);

      if (notifError) {
        console.warn('Erreur lors de la création de la notification de devis:', notifError);
      }

      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-quote-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_code: quoteService.code,
            service_name: effectiveServiceName,
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            company: company.trim() || null,
            details: details.trim(),
          }),
        });
      } catch (edgeError) {
        console.warn('Erreur lors de l\'appel de la fonction send-quote-request:', edgeError);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Demande envoyée',
        text: 'Votre demande de devis a été envoyée. Nous vous répondrons dans les meilleurs délais.',
        confirmButtonText: 'OK',
      });
      setQuoteModalOpen(false);
      setQuoteForm({ name: '', email: '', phone: '', company: '', details: '' });
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la demande de devis:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Une erreur est survenue lors de l\'envoi de votre demande. Merci de réessayer plus tard.',
        confirmButtonText: 'OK',
      });
    } finally {
      setIsSendingQuote(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {loading && (
        <section className="pt-32 pb-10 bg-primary-700">
          <div className="container-custom flex flex-col items-center justify-center text-center text-white">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent mb-4" />
            <p className="text-sm opacity-90">Chargement des services...</p>
          </div>
        </section>
      )}
      {loadError && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 text-center">
          {loadError}
        </div>
      )}
      {/* Services Overview Section */}
      <section className="relative pt-24 pb-28 bg-primary-700">
        {/* Titre centré dans la largeur du site */}
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-lg">{t('services.title')}</h1>
            <p className="text-xl text-red-50 max-w-3xl mx-auto drop-shadow-md">
              {t('services.subtitle')}
            </p>
          </motion.div>
        </div>

        {/* Grille pleine largeur avec léger padding latéral */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {heroServices.map((service, index) => (
              <motion.button
                key={service.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={(e) => {
                  e.preventDefault();
                  openDetailModal({ code: service.code, name: service.name, anchorId: service.anchorId });
                }}
                className="relative bg-white border border-gray-100 hover:border-transparent rounded-none shadow-sm hover:shadow-xl transition-all duration-300 p-8 text-center group overflow-hidden cursor-pointer w-full text-left"
              >
                <div className="absolute inset-0 pointer-events-none">
                  {getServiceImage(service.anchorId) && (
                    <img
                      src={getServiceImage(service.anchorId)}
                      alt={service.name}
                      className="w-full h-full object-cover opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                    />
                  )}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 transition-opacity duration-300" />
                </div>
                <div className="relative z-10 flex flex-col h-full text-left">
                  {/* Ligne titre + badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-primary-600 group-hover:bg-white/10 group-hover:text-white transition-colors duration-300 shadow-sm">
                        {service.icon}
                      </div>
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-white transition-colors">
                        {service.name}
                      </h3>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 group-hover:bg-white/15 group-hover:text-white border border-primary-100/60">
                      {service.code}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-[13px] text-gray-600 group-hover:text-gray-100 leading-snug mb-4 flex-1 transition-colors line-clamp-3">
                    {getServiceDescription(service.anchorId) || t('services.learnMore')}
                  </p>

                  {/* Boutons d'action */}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          openDetailModal({ code: service.code, name: service.name, anchorId: service.anchorId });
                        }}
                        className="inline-flex items-center text-[11px] font-medium text-primary-600 group-hover:text-white"
                      >
                        <span className="mr-1">Voir le détail</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {(quoteCountsByService[service.code] ?? 0) > 0 && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-[10px] font-semibold border border-primary-100/60 group-hover:bg-white/15 group-hover:text-white">
                          {quoteCountsByService[service.code]} demande{quoteCountsByService[service.code] > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        openQuoteModal({ id: service.code, title: service.name });
                      }}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-semibold shadow-sm"
                    >
                      Demander un devis
                    </button>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Modal de détail de service */}
      {detailModalService && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setDetailModalService(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 h-full">
              <div className="relative bg-gray-900">
                {detailModalService.image && (
                  <img
                    src={detailModalService.image}
                    alt={detailModalService.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{detailModalService.name}</h2>
                    <p className="text-sm text-gray-600">
                      {t('services.subtitle')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailModalService(null)}
                    className="text-gray-400 hover:text-gray-700 text-xl leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="text-sm text-gray-700 leading-relaxed mb-4 overflow-y-auto max-h-[50vh] pr-1">
                  {detailModalService.description}
                </div>
                <div className="mt-auto flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalService(null);
                      openQuoteModal({ id: detailModalService.code, title: detailModalService.name });
                    }}
                    className="inline-flex items-center px-4 py-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm"
                  >
                    Demander un devis pour ce service
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {quoteModalOpen && quoteService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setQuoteModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Demande de devis</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Service concerné : <span className="font-semibold">{quoteService.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuoteModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitQuote} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto pb-6">
              <p className="text-sm text-gray-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
                Merci de renseigner un maximum de détails (type de marchandise, volumes et poids, villes ou ports de départ et d'arrivée, Incoterm souhaité, délais, services complémentaires, etc.) afin que nous puissions établir un devis précis.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                  <input
                    type="text"
                    value={quoteForm.name}
                    onChange={(e) => handleQuoteChange('name', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={quoteForm.email}
                    onChange={(e) => handleQuoteChange('email', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={quoteForm.phone}
                    onChange={(e) => handleQuoteChange('phone', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Société</label>
                  <input
                    type="text"
                    value={quoteForm.company}
                    onChange={(e) => handleQuoteChange('company', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Votre demande en détail *</label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={quoteForm.details}
                    onChange={(value) => handleQuoteChange('details', value)}
                    modules={QUOTE_EDITOR_MODULES}
                    formats={QUOTE_EDITOR_FORMATS}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 pb-4">
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isSendingQuote}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSendingQuote}
                  className="px-5 py-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSendingQuote ? 'Envoi en cours...' : 'Envoyer la demande'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ServicesPage;