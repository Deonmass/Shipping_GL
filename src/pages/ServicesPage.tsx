import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {motion} from 'framer-motion';
import {Plane, Ship, Truck, Warehouse, Home, FileCheck} from 'lucide-react';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {UseAddOpenQuoteRequests, UseGetOpenServices} from "../services";

const QUOTE_EDITOR_MODULES = {
    toolbar: [
        [{header: [1, 2, 3, false]}],
        ['bold', 'italic', 'underline'],
        [{list: 'ordered'}, {list: 'bullet'}],
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

export const ServiceIcon = (code: string) => {
    switch (code) {
        case 'AFR':
            return <Plane className="w-8 h-8"/>;
        case 'OFR':
            return <Ship className="w-8 h-8"/>;
        case 'WHS':
            return <Warehouse className="w-8 h-8"/>;
        case 'DOM':
            return <Truck className="w-8 h-8"/>;
        case 'MOV':
            return <Home className="w-8 h-8"/>;
        case 'CCI':
        case 'CCE':
        case 'COI':
        case 'SAP':
        default:
            return <FileCheck className="w-8 h-8"/>;
    }
}

const ServicesPage: React.FC = () => {
    const {t} = useTranslation();
    const [quoteService, setQuoteService] = useState<any>(null);
    const [detailModalService, setDetailModalService] = useState<any>(null);
    const [quoteForm, setQuoteForm] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        details: '',
    });

    const {data: services, isLoading: isGettingServices} = UseGetOpenServices()
    const {isPending: isAddingRequest, data: addResult, mutate: addRequest} = UseAddOpenQuoteRequests()

    // Update document title
    useEffect(() => {
        document.title = t('services.title') + ' - SHIPPING GL';
    }, [t]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setQuoteService(null);
            }
        };

        if (quoteService) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [quoteService]);


    useEffect(() => {
        if (addResult) {
            if (addResult?.responseData?.error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: 'Une erreur est survenue lors de l\'envoi de votre demande. Merci de réessayer plus tard.',
                    confirmButtonText: 'OK',
                });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Demande envoyée',
                    text: 'Votre demande de devis a été envoyée. Nous vous répondrons dans les meilleurs délais.',
                    confirmButtonText: 'OK',
                });
                setQuoteService(null);
                setQuoteForm({name: '', email: '', phone: '', company: '', details: ''});
            }
        }
    }, [addResult]);

    const handleQuoteChange = (field: keyof typeof quoteForm, value: string) => {
        setQuoteForm(prev => ({...prev, [field]: value}));
    };

    const handleSubmitQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quoteService) return;

        const {name, email, details, phone, company} = quoteForm;
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

        addRequest({
            service_id: quoteService?.id,
            name,
            email,
            phone,
            details,
            company
        })
    };

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.3}}
        >
            {isGettingServices && (
                <section className="pt-32 pb-10 bg-primary-700">
                    <div className="container-custom flex flex-col items-center justify-center text-center text-white">
                        <div
                            className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent mb-4"/>
                        <p className="text-sm opacity-90">Chargement des services...</p>
                    </div>
                </section>
            )}
            {/*{loadError && !loading && (*/}
            {/*    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 text-center">*/}
            {/*        {loadError}*/}
            {/*    </div>*/}
            {/*)}*/}
            {/* Bannière d'en-tête avec image de fond */}
            <div className="relative py-20 md:py-28 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1200px-World_map_-_low_resolution.svg.png)',
                        opacity: 1.15,
                        filter: 'grayscale(100%) brightness(3.5)'
                    }}
                />
                <div className="absolute inset-0 bg-red-900/90"/>
                <div className="relative z-10 container-custom text-center px-4">
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.5}}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">
                            {t('services.title')}
                        </h1>
                        <p className="text-xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
                            {t('services.subtitle')}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Section principale des services */}
            <section className="relative py-12 bg-white">

                {/* Grille pleine largeur avec léger padding latéral */}
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                        {services?.responseData?.data?.map((service: any, index: number) => (
                            <motion.button
                                key={service.code}
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{duration: 0.5, delay: index * 0.1}}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setDetailModalService(service);
                                }}
                                className="relative bg-white border border-gray-100 hover:border-transparent rounded-none shadow-sm hover:shadow-xl transition-all duration-300 p-8 text-center group overflow-hidden cursor-pointer w-full text-left"
                            >
                                <div className="absolute inset-0 pointer-events-none">
                                    {service?.image_url && (
                                        <img
                                            src={service?.image_url}
                                            alt={service.title}
                                            className="w-full h-full object-cover opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                                        />
                                    )}
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 transition-opacity duration-300"/>
                                </div>
                                <div className="relative z-10 flex flex-col h-full text-left">
                                    {/* Ligne titre + badge */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-primary-600 group-hover:bg-white/10 group-hover:text-white transition-colors duration-300 shadow-sm">
                                                {ServiceIcon(service.code)}
                                            </div>
                                            <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-white transition-colors">
                                                {service.title}
                                            </h3>
                                        </div>
                                        <span
                                            className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 group-hover:bg-white/15 group-hover:text-white border border-primary-100/60">
                      {service.code}
                    </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-[13px] text-gray-600 group-hover:text-gray-100 leading-snug mb-4 flex-1 transition-colors line-clamp-3">
                                        {service?.description}
                                    </p>

                                    {/* Boutons d'action */}
                                    <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setDetailModalService(service);
                                                }}
                                                className="inline-flex items-center text-[11px] font-medium text-primary-600 group-hover:text-white"
                                            >
                                                <span className="mr-1">Voir le détail</span>
                                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                                                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M9 5l7 7-7 7"/>
                                                </svg>
                                            </button>

                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setQuoteService(service);
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
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                            <div className="relative bg-gray-900">
                                {detailModalService.image_url && (
                                    <img
                                        src={detailModalService.image_url}
                                        alt={detailModalService.title}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="flex flex-col p-6 md:p-8">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{detailModalService.title}</h2>

                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDetailModalService(null)}
                                        className="text-gray-400 hover:text-gray-700 text-xl leading-none"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div
                                    className="text-sm text-gray-700 leading-relaxed mb-4 overflow-y-auto max-h-[50vh] pr-1">
                                    {detailModalService.description}
                                </div>
                                <div className="mt-auto flex justify-end pt-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDetailModalService(null);
                                            setQuoteService(detailModalService);
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

            {quoteService && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
                    onClick={() => setQuoteService(null)}
                >
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className="max-w-xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Demande de devis</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Service concerné : <span className="font-semibold">{quoteService?.title}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setQuoteService(null)}
                                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSubmitQuote}
                              className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto pb-6">
                            <p className="text-sm text-gray-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
                                Merci de renseigner un maximum de détails (type de marchandise, volumes et poids, villes
                                ou ports de départ et d'arrivée, Incoterm souhaité, délais, services complémentaires,
                                etc.) afin que nous puissions établir un devis précis.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet
                                        *</label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Votre demande en détail
                                    *</label>
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
                                    onClick={() => setQuoteService(null)}
                                    className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    disabled={isAddingRequest}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAddingRequest}
                                    className="px-5 py-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isAddingRequest ? 'Envoi en cours...' : 'Envoyer la demande'}
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