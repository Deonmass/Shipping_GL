import React, {useState, useEffect, useMemo, lazy, Suspense} from 'react';
import {useOutletContext} from 'react-router-dom';
import {
    Search,
    Eye,
    Pencil,
    Trash2,
    ClipboardEditIcon,
    CheckCircle, Clock, RefreshCcwIcon
} from 'lucide-react';
import Swal from 'sweetalert2';

// Import dynamique de ReactQuill pour éviter les problèmes de rendu côté navigateur
const ReactQuill = lazy(() => import('react-quill'));
import 'react-quill/dist/quill.snow.css';
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";
import {UseAddJobOffer, UseDeleteJobOffer, UseGetJobOffers, UseUpdateJobOffer} from "../../services";
import {StatsCard} from "../../components/admin/StatsCard.tsx";
import AppToast from "../../utils/AppToast.ts";

interface OutletContext {
    theme: 'light' | 'dark';
}

interface JobOffer {
    id: string;
    title: string;
    description: string;
    location: string;
    type: string;
    status: string,
    created_at: string;
    updated_at?: string;
    salary_min?: string;
    salary_max?: string;
    experience_level?: string;
    department?: string;
    closing_date?: string;
    published_at?: string;
}

const emptyItem: JobOffer = {
    id: "",
    title: "",
    description: "",
    location: "",
    type: "",
    status: "",
    created_at: "",
    updated_at: "",
    salary_min: "",
    salary_max: "",
    experience_level: "",
    department: "",
    closing_date: "",
    published_at: "",
}

const isActive = (u: any) =>
    u?.status?.toString() === "1"


const JobOfferPage: React.FC = () => {
    // ... (le reste du code du composant)
    const context = useOutletContext<OutletContext>();
    const theme = context?.theme || 'dark';

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<"add" | "edit" | null>(null);
    const [formData, setFormData] = useState<JobOffer>(emptyItem);

    const {data: jobOffers, isPending: isGettingJobs, refetch: reGetJobs} = UseGetJobOffers({format: "stats"})
    const {data: addResult, isPending: isAdding, mutate: addJobOffer} = UseAddJobOffer()
    const {data: updateResult, isPending: isUpdating, mutate: updateJobOffer} = UseUpdateJobOffer()
    const {data: deleteResult, isPending: isDeleting, mutate: deleteJobOffer} = UseDeleteJobOffer()


    useEffect(() => {
        if (addResult) {
            if (addResult?.responseData?.error) {
                AppToast.error(theme === "dark", addResult?.responseData?.message || "Erreur lors de l'enregistrement")
            } else {
                reGetJobs()
                AppToast.success(theme === "dark", 'Offre ajoutée avec succès')
                setIsModalOpen(null);
                setFormData(emptyItem);
            }
        }
    }, [addResult]);

    useEffect(() => {
        if (updateResult) {
            if (updateResult?.responseData?.error) {
                AppToast.error(theme === "dark", updateResult?.responseData?.message || "Erreur lors de la modification")
            } else {
                reGetJobs()
                AppToast.success(theme === "dark", 'Offre mise a jour avec succès')
                setIsModalOpen(null);
                setFormData(emptyItem);
                //setShowStatusConfirm(null);
            }
        }
    }, [updateResult]);

    useEffect(() => {
        if (deleteResult) {
            if (deleteResult?.responseData?.error) {
                AppToast.error(theme === "dark", deleteResult?.responseData?.message || "Erreur lors de la suppression")
            } else {
                reGetJobs()
                AppToast.success(theme === "dark", 'Offre supprimé avec succès')
                //setShowDeleteConfirm(null);
            }
        }
    }, [deleteResult]);

    const handleEdit = (offer: JobOffer) => {
        setFormData({
            ...offer,
            closing_date: offer.closing_date ? offer.closing_date.split('T')[0] : '',
            published_at: offer.published_at ? offer.published_at.split('T')[0] : ''
        });
        setIsModalOpen(null);
    };

    const handleDelete = async (id: string) => {
        if (!id) {
            AppToast.error(theme === "dark", 'Aucun ID fourni pour la suppression');
            return;
        }

        const result = await Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: 'Cette action est irréversible !',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler',
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#111827',
        });
        if (result.isConfirmed) {
            deleteJobOffer({id: id})
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.location.trim() || !formData.description) {
            AppToast.error(theme === "dark", 'Veuillez remplir tous les champs requis');
            return;
        }
        const body = {
            title: formData.title,
            description: formData.description,
            location: formData.location,
            department: formData.department,
            closing_date: formData.closing_date,
            published_at: formData.published_at,
            salary_min: formData.salary_min,
            salary_max: formData.salary_max,
            type: formData.type || "CDI",
            experience_level: formData.experience_level,
            status: formData.status ? formData.status : "0",
        }

        if (isModalOpen === "add") {
            addJobOffer(body);
        } else {
            if (!formData?.id) {
                AppToast.error(theme === "dark", "Une erreur s'est produite.");
                return;
            }
            updateJobOffer({id: formData?.id, ...body});
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target as HTMLInputElement;

        setFormData(prev => {
            // Pour les champs de type date, on conserve le format YYYY-MM-DD
            if (type === 'date') {
                return {
                    ...prev,
                    [name]: value // On garde la valeur brute pour l'input date
                };
            }
            return {
                ...prev,
                [name]: value
            };
        });
    };

    // Configuration de l'éditeur de texte riche
    const modules = useMemo(() => ({
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{'header': 1}, {'header': 2}],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            [{'script': 'sub'}, {'script': 'super'}],
            [{'indent': '-1'}, {'indent': '+1'}],
            [{'direction': 'rtl'}],
            [{'size': ['small', false, 'large', 'huge']}],
            [{'header': [1, 2, 3, 4, 5, 6, false]}],
            [{'color': []}, {'background': []}],
            [{'font': []}],
            [{'align': []}],
            ['clean'],
            ['link', 'image']
        ],
    }), []);

    // Calculate days remaining for closing date with color coding
    const getDaysRemaining = (closingDate: string) => {
        if (!closingDate) return {days: null, color: 'gray'};

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const closing = new Date(closingDate);
        closing.setHours(0, 0, 0, 0);

        // If closing date is in the past
        if (closing < today) return {days: 0, color: 'red'};

        const diffTime = closing.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 3) return {days: diffDays, color: 'red'};
        if (diffDays <= 7) return {days: diffDays, color: 'orange'};
        return {days: diffDays, color: 'green'};
    };

    // Toggle offer status between published and draft
    const toggleOfferStatus = async (offer: JobOffer) => {
        if (!offer?.id) {
            AppToast.error(theme === "dark", "Une erreur s'est produite.");
            return;
        }
        if (!HasPermission(appPermissions.jobOffers, appOps.update)) {
            AppToast.error(theme === "dark", "Vous n'avez pas l'autorisation necessaire pour effectuer cette action");
            return;
        }
        updateJobOffer({id: offer?.id, status: isActive(offer) ? "0" : "1"});
    };

    // Handle view details
    const handleViewDetails = (offer: JobOffer) => {
        // You can implement a modal or navigate to a details page here
        // For now, we'll just show an alert with the details
        Swal.fire({
            title: offer.title,
            html: `
        <div class="text-left">
          <p><strong>Type:</strong> ${offer.type}</p>
          <p><strong>Localisation:</strong> ${offer.location}</p>
          <p><strong>Département:</strong> ${offer.department || 'Non spécifié'}</p>
          <p><strong>Date de Publication:</strong> ${offer.published_at ? new Date(offer.published_at).toLocaleDateString('fr-FR') : 'Non définie'}</p>
          <p><strong>Date de clôture:</strong> ${offer.closing_date ? new Date(offer.closing_date).toLocaleDateString('fr-FR') : 'Non définie'}</p>
          <p><strong>Statut:</strong> ${isActive(offer) ? 'Publiée' : 'Brouillon'}</p>
          <div class="mt-4">
            <h4 class="font-bold">Description:</h4>
            <div class="border rounded p-2 max-h-40 overflow-y-auto">${offer.description || 'Aucune description'}</div>
          </div>
        </div>
      `,
            showCloseButton: true,
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#111827',
        });
    };

    // Filtrer les offres par recherche
    const filteredOffers = useMemo(() => {
        return jobOffers?.responseData?.data?.items?.filter((offer: any) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                offer.title.toLowerCase().includes(searchLower) ||
                (offer.description && offer.description.toLowerCase().includes(searchLower)) ||
                (offer.location && offer.location.toLowerCase().includes(searchLower)) ||
                (offer.department && offer.department.toLowerCase().includes(searchLower))
            );
        });
    }, [jobOffers, searchTerm]);

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            <Suspense fallback={<div>Chargement...</div>}>
                <div className="mb-8 mt-20 ">
                    <AdminPageHeader
                        Icon={<ClipboardEditIcon
                            className={`w-7 h-7 ${
                                theme === 'dark' ? 'text-sky-400' : 'text-sky-600'
                            }`}
                        />}
                        title="Gestion des offres d'emploi"
                        onRefresh={() => reGetJobs()}
                        onAdd={HasPermission(appPermissions.jobOffers, appOps.create) ? () => {
                            setFormData(emptyItem);
                            setIsModalOpen("add");
                        } : undefined}
                    />


                    {/* Barre de recherche */}
                    <div className="mb-6">
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400"/>
                            </div>
                            <input
                                type="text"
                                className={`block w-full pl-10 pr-3 py-2 border ${
                                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                } rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                placeholder="Rechercher une offre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                                         stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Cartes de statistiques */}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <StatsCard
                            title="Total partenaires"
                            value={jobOffers?.responseData?.data?.items?.length || "0"}
                            icon={ClipboardEditIcon}
                            className="bg-gradient-to-br from-sky-600 to-sky-700"
                            iconClassName="text-white"
                            titleClassName="text-white"
                        />
                        <StatsCard
                            title="Publiées"
                            value={jobOffers?.responseData?.data?.totals?.active || "0"}
                            icon={CheckCircle}
                            className="bg-gradient-to-br from-emerald-600 to-emerald-700"
                            iconClassName="text-white"
                            titleClassName="text-white"
                        />
                        <StatsCard
                            title="Brouillons"
                            value={jobOffers?.responseData?.data?.totals?.inactive || "0"}
                            icon={Clock}
                            className="bg-gradient-to-br from-red-600 to-red-700"
                            iconClassName="text-white"
                            titleClassName="text-white"
                        />
                    </div>


                </div>

                <div className={`rounded-lg shadow overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                    {isGettingJobs ? (
                        <div className="p-8 text-center">
                            <div
                                className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-gray-500 dark:text-gray-400">Chargement des offres...</p>
                        </div>
                    ) : (
                        <div className={`overflow-hidden rounded-lg border ${
                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                            <table className="min-w-full divide-y">
                                <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}>
                                <tr>
                                    <th scope="col" className={`px-6 py-3.5 text-left text-sm font-semibold ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        Titre
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3.5 text-left text-sm font-semibold text-gray-500">
                                        Localisation
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3.5 text-left text-sm font-semibold text-gray-500">
                                        Dates
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3.5 text-left text-sm font-semibold text-gray-500">
                                        Jours restants
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3.5 text-left text-sm font-semibold text-gray-500">
                                        Statut
                                    </th>
                                    <th scope="col" className="relative px-6 py-3.5">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                                </thead>
                                <tbody className={`divide-y ${
                                    theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                                } ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                                {!filteredOffers?.length ? (
                                    <tr>
                                        <td colSpan={7}
                                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                            Aucune offre trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOffers?.map((offer) => (
                                        <tr
                                            key={offer.id}
                                            className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div
                                                            className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                            {offer.title}
                                                        </div>
                                                        {offer.department && (
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {offer.department}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {offer.location || 'Non spécifiée'}
                                                </div>
                                                {offer.department && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">

                                                        <div className="mt-1">
                              <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-full ${
                                  theme === 'dark' ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {offer.type}
                              </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                                            }`}>
                                                <div className="space-y-1">
                                                    <div>
                                                        <span
                                                            className="font-medium">Création:</span> {new Date(offer.created_at).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })}
                                                    </div>
                                                    <div>
                                                        <span
                                                            className="font-medium">Publication:</span> {new Date(offer.published_at).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })}
                                                    </div>
                                                    <div>
                                                        <span
                                                            className="font-medium">Clôture:</span> {offer.closing_date ? new Date(offer.closing_date).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    }) : 'Non définie'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {offer.closing_date ? (
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            getDaysRemaining(offer.closing_date).color === 'red'
                                                                ? 'bg-red-100 text-red-800'
                                                                : getDaysRemaining(offer.closing_date).color === 'orange'
                                                                    ? 'bg-orange-100 text-orange-800'
                                                                    : 'bg-green-100 text-green-800'
                                                        }`}>
                            {getDaysRemaining(offer.closing_date).days === 0
                                ? 'Expiré'
                                : `${getDaysRemaining(offer.closing_date).days} j`}
                          </span>
                                                ) : (
                                                    <span
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Non défini
                          </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex justify-end">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={isActive(offer)}
                                                            onChange={() => toggleOfferStatus(offer)}
                                                            // disabled={!!(offer.closing_date && getDaysRemaining(offer.closing_date).days === 0)}
                                                        />
                                                        <div
                                                            className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isActive(offer) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end items-center space-x-3">
                                                    <button
                                                        onClick={() => handleViewDetails(offer)}
                                                        className={`inline-flex h-9 w-9 items-center justify-center 
                            rounded-md border text-xs font-medium
                            ${
                                                            theme === 'dark'
                                                                ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
                                                                : 'bg-blue-100 border-blue-200 text-blue-600 hover:bg-blue-200/50'
                                                        }
                            hover:shadow-md hover:-translate-y-0.5 
                            transition-all duration-150`}
                                                        title="Voir les détails"
                                                    >
                                                        <Eye className="h-4 w-4"/>
                                                    </button>
                                                    {HasPermission(appPermissions.jobOffers, appOps.update) ? <button
                                                        onClick={() => handleEdit(offer)}
                                                        className={`inline-flex h-9 w-9 items-center justify-center 
                            rounded-md border text-xs font-medium
                            ${
                                                            theme === 'dark'
                                                                ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30'
                                                                : 'bg-yellow-100 border-yellow-200 text-yellow-600 hover:bg-yellow-200/50'
                                                        }
                            hover:shadow-md hover:-translate-y-0.5 
                            transition-all duration-150`}
                                                        title="Modifier"
                                                    >
                                                        <Pencil className="h-4 w-4"/>
                                                    </button> : null}
                                                    {HasPermission(appPermissions.jobOffers, appOps.delete) ? <button
                                                        onClick={() => handleDelete(offer.id)}
                                                        className={`inline-flex h-9 w-9 items-center justify-center 
                            rounded-md border text-xs font-medium
                            ${
                                                            theme === 'dark'
                                                                ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
                                                                : 'bg-red-100 border-red-200 text-red-600 hover:bg-red-200/50'
                                                        }
                            hover:shadow-md hover:-translate-y-0.5 
                            transition-all duration-150`}
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-4 w-4"/>
                                                    </button> : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal pour afficher/modifier une offre */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div
                            className={`rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {isModalOpen === "edit" ? "Modifier l'offre" : "Nouvelle offre"}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setIsModalOpen(null);
                                        }}
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                    >
                                        <span className="sr-only">Fermer</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="title" className="block text-sm font-medium mb-1">
                                                Titre du poste *
                                            </label>
                                            <input
                                                type="text"
                                                id="title"
                                                name="title"
                                                required
                                                value={formData.title || ''}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                placeholder="Ex: Développeur Full Stack"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="type" className="block text-sm font-medium mb-1">
                                                    Type de contrat *
                                                </label>
                                                <select
                                                    id="type"
                                                    name="type"
                                                    required
                                                    value={formData.type}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                >
                                                    <option value="CDI">CDI</option>
                                                    <option value="CDD">CDD</option>
                                                    <option value="Stage">Stage</option>
                                                    <option value="Alternance">Alternance</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="location" className="block text-sm font-medium mb-1">
                                                    Localisation *
                                                </label>
                                                <input
                                                    type="text"
                                                    id="location"
                                                    name="location"
                                                    required
                                                    value={formData.location || ''}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    placeholder="Ex: Paris, France"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="department" className="block text-sm font-medium mb-1">
                                                    Département / Service
                                                </label>
                                                <input
                                                    type="text"
                                                    id="department"
                                                    name="department"
                                                    value={formData.department || ''}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    placeholder="Ex: Développement"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="experience_level"
                                                       className="block text-sm font-medium mb-1">
                                                    Niveau d'expérience
                                                </label>
                                                <input
                                                    type="text"
                                                    id="experience_level"
                                                    name="experience_level"
                                                    value={formData.experience_level || ''}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    placeholder="Ex: Débutant accepté"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="salary_min" className="block text-sm font-medium mb-1">
                                                    Salaire minimum (USD)
                                                </label>
                                                <input
                                                    type="number"
                                                    id="salary_min"
                                                    name="salary_min"
                                                    min="0"
                                                    step="100"
                                                    value={formData.salary_min || ''}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    placeholder="Ex: 30000"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="salary_max" className="block text-sm font-medium mb-1">
                                                    Salaire maximum (USD)
                                                </label>
                                                <input
                                                    type="number"
                                                    id="salary_max"
                                                    name="salary_max"
                                                    min="0"
                                                    step="100"
                                                    value={formData.salary_max || ''}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    placeholder="Ex: 45000"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium mb-1">
                                                Description du poste *
                                            </label>
                                            <div
                                                className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-md`}>
                                                <Suspense fallback={<div className="p-2 text-gray-500">Chargement de
                                                    l'éditeur...</div>}>
                                                    <div className={theme === 'dark' ? 'quill-dark' : ''}>
                                                        <ReactQuill
                                                            theme="snow"
                                                            value={formData.description || ''}
                                                            onChange={(value) => setFormData(prev => ({
                                                                ...prev,
                                                                description: value
                                                            }))}
                                                            modules={modules}
                                                            className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                                                            placeholder="Décrivez en détail le poste, les missions, les responsabilités..."
                                                        />
                                                    </div>
                                                </Suspense>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="status" className="block text-sm font-medium mb-1">
                                                Statut *
                                            </label>
                                            <select
                                                id="status"
                                                name="status"
                                                required
                                                value={formData.status || 'draft'}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                            >
                                                <option value="0">Brouillon</option>
                                                <option value="1">Publiée</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="closing_date" className="block text-sm font-medium mb-1">
                                                Date de publication *
                                            </label>
                                            <input
                                                type="date"
                                                id="published_at"
                                                name="published_at"
                                                required
                                                max={new Date().toISOString().split('T')[0]}
                                                value={formData.published_at ? formData.published_at.split('T')[0] : ''}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="closing_date" className="block text-sm font-medium mb-1">
                                                Date de clôture *
                                            </label>
                                            <input
                                                type="date"
                                                id="closing_date"
                                                name="closing_date"
                                                required
                                                min={new Date().toISOString().split('T')[0]}
                                                value={formData.closing_date ? formData.closing_date.split('T')[0] : ''}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsModalOpen(null);
                                            }}
                                            className={`px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            disabled={isAdding || isUpdating}
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            {isAdding || isUpdating ? <RefreshCcwIcon className="animate-spin"/> : 'Valider'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </Suspense>
        </div>
    );
};

export default JobOfferPage;
