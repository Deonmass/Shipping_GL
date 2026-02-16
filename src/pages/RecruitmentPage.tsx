import {useState, useEffect, useMemo} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {Briefcase, X, MapPin, Check} from 'lucide-react';
import {toast} from 'react-hot-toast';
import {supabase} from '../lib/supabase';
import {UseGetOpenCategories, UseGetOpenJobOffers} from "../services";
import {format} from "date-fns";
import {fr} from "date-fns/locale";

// Fonction pour formater la description en respectant le HTML existant
const formatDescription = (html: string): string => {
    if (!html) return '';

    // Nettoyer les balises non autorisées
    const cleanHtml = html
        // Supprimer les styles en ligne qui pourraient affecter la couleur
        .replace(/style="[^"]*"/g, '')
        // Nettoyer les balises
        .replace(/<[^>]*(>|$)/g, (tag) => {
            const allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'span', 'div'];
            const tagMatch = tag.match(/<\s*([a-zA-Z0-9]+)/);
            const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
            return allowedTags.includes(tagName) ? tag : '';
        });

    return cleanHtml;
};


// Interface pour les offres d'emploi
interface JobOffer {
    id: string;
    title: string;
    description: string;
    location: string;
    type: 'CDI' | 'CDD' | 'Stage' | 'Alternance';
    status: 'draft' | 'published' | 'archived';
    created_at: string;
    updated_at?: string;
    salary_min?: number;
    salary_max?: number;
    salary?: string;
    experience_level?: string;
    experience?: string;
    department?: string;
    category?: string;
    closing_date?: string;
    responsibilities?: string[];
    requirements?: string[];
    benefits?: string[];
    urgent?: boolean;
    publishedDate?: string;
    closingDate?: string;

    [key: string]: any; // Pour gérer les propriétés dynamiques
}

const RecruitmentPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'offers' | 'cv'>('offers');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [cvForm, setCvForm] = useState({
        cvFile: null as File | null,
        postesRecherches: [] as string[],
        nomComplet: '',
        telephone: '',
        email: ''
    });

    const {data: jobOffers, isLoading: isGettingJobOffers} = UseGetOpenJobOffers()
    const {data: jobCategories, isLoading: isGettingCategories} = UseGetOpenCategories({type: "job"})

    interface Filters {
        search: string;
        location: string;
        type: string;
        category: string;
        urgent: boolean;
    }

    const [filters, setFilters] = useState<Filters>({
        search: '',
        location: '',
        type: '',
        category: '',
        urgent: false
    });
    const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [showDropdown, setShowDropdown] = useState(false);

    // Mettre à jour l'onglet actif en fonction de l'URL
    useEffect(() => {
        const path = location.pathname;
        if (path.endsWith('/cv')) {
            setActiveTab('cv');
        } else {
            setActiveTab('offers');
        }
    }, [location]);

    // Gérer le changement d'onglet
    const handleTabChange = (tab: 'offers' | 'cv') => {
        setActiveTab(tab);
        navigate(tab === 'offers' ? '/recrutement/offres' : '/recrutement/cv');
    };

    // Gérer les changements de filtre
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Gérer les changements des champs du formulaire
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setCvForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Réinitialiser les filtres
    const resetFilters = () => {
        setFilters({
            search: '',
            location: '',
            type: '',
            category: '',
            urgent: false
        });
    };

    // Filtrer les offres
    const filteredOffers = useMemo(() => {
        return jobOffers?.responseData?.data?.filter((offer: any) => {
            const matchesSearch = !filters.search ||
                offer.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                (offer.description && offer.description.toLowerCase().includes(filters.search.toLowerCase()));
            const matchesLocation = !filters.location ||
                (offer.location && offer.location.toLowerCase().includes(filters.location.toLowerCase()));
            const matchesType = !filters.type || offer.type === filters.type;
            //const matchesCategory = !filters.category || offer.category === filters.category;
            const matchesUrgent = !filters.urgent || offer.urgent === true;

            return matchesSearch && matchesLocation && matchesType && matchesUrgent;
        });
    }, [jobOffers, filters]);

    // Search input for categories
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Filter categories based on search term
    const filteredCategories = useMemo(() => {
        if (!searchTerm) return jobCategories?.responseData?.data || [];
        return jobCategories?.responseData?.data?.filter(category =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [jobCategories, searchTerm]);

    // Add this near your other JSX where you want the search input to appear
    // Make sure to place it in the appropriate location in your component's return statement
    /*
    <div className="mb-4">
      <input
        type="text"
        placeholder="Rechercher une catégorie..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="w-full p-2 border rounded"
      />
    </div>
    */

    // Gérer la sélection/désélection des catégories
    const toggleCategory = (categoryId: string) => {
        setCvForm(prev => {
            const isSelected = prev.postesRecherches.includes(categoryId);
            if (isSelected) {
                return {
                    ...prev,
                    postesRecherches: prev.postesRecherches.filter(id => id !== categoryId)
                };
            } else {
                return {
                    ...prev,
                    postesRecherches: [...prev.postesRecherches, categoryId]
                };
            }
        });
    };

    // Vérifier si l'utilisateur est sur l'onglet CV
    useEffect(() => {
        if (activeTab === 'cv') {
            // Vérifier si l'email est présent dans l'URL (ex: après une redirection de connexion)
            const urlParams = new URLSearchParams(window.location.search);
            const email = urlParams.get('email');

            if (email) {
                setCvForm(prev => ({
                    ...prev,
                    email: email
                }));
            }
        }
    }, [activeTab]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Vérification du type de fichier
        const validTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-word.document.macroEnabled.12',
            'application/vnd.ms-word.template.macroEnabled.12'
        ];

        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const isValidType = validTypes.includes(file.type) ||
            ['.pdf', '.doc', '.docx'].includes(`.${fileExt}`);

        if (!isValidType) {
            toast.error('Veuillez sélectionner un fichier PDF ou Word valide');
            return;
        }

        // Vérification de la taille du fichier (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Le fichier est trop volumineux. Taille maximale : 5MB');
            return;
        }

        // Mise à jour de l'état avec le fichier
        setCvForm(prev => ({
            ...prev,
            cvFile: file
        }));
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmitCV = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('handleSubmitCV called with step:', currentStep);

        // Étape 1: Vérification des champs obligatoires
        if (currentStep === 1) {
            if (cvForm.postesRecherches.length === 0) {
                toast.error('Veuillez sélectionner au moins un poste');
                return;
            }

            if (!cvForm.nomComplet) {
                toast.error('Veuillez saisir votre nom complet');
                return;
            }

            if (!cvForm.email) {
                toast.error('Veuillez saisir votre email');
                return;
            }

            // Passer à l'étape 2 (téléchargement du CV)
            nextStep();
            return;
        }

        // Étape 2: Vérification du CV
        if (currentStep === 2) {
            if (!cvForm.cvFile) {
                toast.error('Veuillez sélectionner un CV');
                return;
            }

            // Passer à l'étape de confirmation
            nextStep();
            return;
        }

        // Étape 3: Confirmation et soumission
        if (currentStep === 3) {
            setIsSubmitting(true);
            const toastId = toast.loading('Traitement de votre candidature...');

            try {
                // 1. Vérifier le fichier CV
                if (!cvForm.cvFile) {
                    throw new Error('CV file is required');
                }

                const fileExt = cvForm.cvFile.name.split('.').pop();
                const fileName = `cv_${Date.now()}.${fileExt}`;
                const filePath = `cvs/${fileName}`;

                // 2. Téléverser le fichier
                console.log('Uploading file to storage...');
                const {error: uploadError} = await supabase.storage
                    .from('cvs')
                    .upload(filePath, cvForm.cvFile);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    throw uploadError;
                }

                // Convertir le tableau de postes en une chaîne lisible
                const postesText = cvForm.postesRecherches
                    .map(id => jobCategories?.responseData?.data?.find(cat => cat.id === id)?.name || id)
                    .join(', ');

                // 3. Mettre à jour ou créer le profil dans la table 'profiles' avec le poste_recherche
                console.log('Updating/creating profile with poste_recherche...');
                const profileData = {
                    nom_complet: cvForm.nomComplet,
                    telephone: cvForm.telephone,
                    email: cvForm.email,
                    cv_url: filePath,
                    poste_recherche: postesText, // Ajout du champ poste_recherche
                    updated_at: new Date().toISOString(),
                    cv_uploaded_at: new Date().toISOString()
                };

                console.log('Données du profil à enregistrer:', profileData);

                // Vérifier si un profil avec cet email existe déjà
                const {data: existingProfile, error: fetchError} = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('email', cvForm.email)
                    .single();

                let result;

                if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = aucun résultat trouvé
                    console.error('Erreur lors de la recherche du profil existant:', fetchError);
                    throw fetchError;
                }

                if (existingProfile) {
                    // Mettre à jour le profil existant
                    const {data: updatedProfile, error: updateError} = await supabase
                        .from('profiles')
                        .update(profileData)
                        .eq('email', cvForm.email)
                        .select()
                        .single();

                    result = {data: updatedProfile, error: updateError};
                } else {
                    // Créer un nouveau profil
                    const {data: newProfile, error: insertError} = await supabase
                        .from('profiles')
                        .insert([profileData])
                        .select()
                        .single();

                    result = {data: newProfile, error: insertError};
                }

                console.log('Résultat de l\'opération sur le profil:', result);

                if (result.error) {
                    console.error('Erreur lors de l\'opération sur le profil:', result.error);
                    throw result.error;
                }

                // Réinitialiser le formulaire
                setCvForm({
                    cvFile: null,
                    postesRecherches: [],
                    nomComplet: '',
                    telephone: '',
                    email: ''
                });

                // Réinitialiser l'étape et fermer la modale
                setCurrentStep(1);
                setIsModalOpen(false);

                toast.dismiss(toastId);
                toast.success('Votre candidature a été enregistrée avec succès !');
            } catch (error) {
                console.error('Erreur lors de l\'envoi de la candidature:', error);
                toast.dismiss(toastId);
                toast.error('Une erreur est survenue lors de l\'envoi de votre candidature');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const renderFormStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <form onSubmit={handleSubmitCV} className="space-y-6">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Poste(s) recherché(s) *
                                </label>
                                <div className="relative">
                                    <div
                                        className="flex flex-wrap gap-2 p-2 min-h-[42px] border border-gray-300 rounded-md bg-white"
                                        onClick={() => setShowDropdown(!showDropdown)}
                                    >
                                        {cvForm.postesRecherches.length === 0 ? (
                                            <span className="text-gray-400 text-sm self-center px-2">Sélectionnez un ou plusieurs postes</span>
                                        ) : (
                                            cvForm.postesRecherches.map(catId => {
                                                const category = jobCategories?.responseData?.data?.find(c => c.id === catId);
                                                return category ? (
                                                    <span
                                                        key={catId}
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                    >
                            {category.name}
                                                        <button
                                                            type="button"
                                                            className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleCategory(catId);
                                                            }}
                                                        >
                              <X className="h-3 w-3"/>
                            </button>
                          </span>
                                                ) : null;
                                            })
                                        )}
                                        <input
                                            type="text"
                                            className="flex-1 min-w-[100px] border-0 focus:ring-0 focus:outline-none text-sm"
                                            placeholder="Rechercher un poste..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onFocus={() => setShowDropdown(true)}
                                        />
                                    </div>

                                    {showDropdown && (
                                        <div
                                            className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                            {filteredCategories.length === 0 ? (
                                                <div className="px-4 py-2 text-sm text-gray-700">Aucun résultat
                                                    trouvé</div>
                                            ) : (
                                                filteredCategories.map((category) => (
                                                    <div
                                                        key={category.id}
                                                        className="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-100"
                                                        onClick={() => toggleCategory(category.id)}
                                                    >
                                                        <div className="flex items-center">
                              <span className="block truncate">
                                {category.name}
                              </span>
                                                            {cvForm.postesRecherches.includes(category.id) && (
                                                                <span
                                                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                  <Check className="h-5 w-5"/>
                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="nomComplet"
                                           className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom complet *
                                    </label>
                                    <input
                                        type="text"
                                        id="nomComplet"
                                        name="nomComplet"
                                        value={cvForm.nomComplet}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={cvForm.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
                                        Téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        id="telephone"
                                        name="telephone"
                                        value={cvForm.telephone}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Votre CV *
                            </label>
                            <div
                                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <div className="flex text-sm text-gray-600">
                                        <label
                                            htmlFor="cv-upload"
                                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                        >
                                            <span>Télécharger un fichier</span>
                                            <input
                                                id="cv-upload"
                                                name="cv-upload"
                                                type="file"
                                                className="sr-only"
                                                accept=".pdf,.doc,.docx"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                        <p className="pl-1">ou glissez-déposez</p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        PDF, DOC, DOCX (max. 5MB)
                                    </p>
                                    {cvForm.cvFile && (
                                        <p className="text-sm text-green-600 mt-2">
                                            {cvForm.cvFile.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-md">
                            <h3 className="text-lg font-medium text-blue-800">Récapitulatif de votre candidature</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p className="font-semibold">Poste(s) :</p>
                                <ul className="list-disc pl-5 mt-1">
                                    {cvForm.postesRecherches.map(postId => {
                                        const post = jobCategories?.responseData?.data?.find(cat => cat.id === postId);
                                        return post ? <li key={postId}>{post.name}</li> : null;
                                    })}
                                </ul>
                                <p>Nom complet : {cvForm.nomComplet}</p>
                                <p>Email : {cvForm.email}</p>
                                <p>Téléphone : {cvForm.telephone}</p>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <Check className="h-6 w-6 text-green-600"/>
                        </div>
                        <h3 className="mt-3 text-lg font-medium text-gray-900">Veillez à confirmer votre
                            candidature</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Assurez-vous que toutes vos informations sont correctes avant de soumettre.
                        </p>
                        <div className="mt-6">
                            <button
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={() => {
                                    setCurrentStep(1);
                                    setIsModalOpen(false);
                                }}
                            >
                                Abandoner
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Récupérer les options uniques pour les filtres
    const locations = [...new Set(jobOffers?.responseData?.data?.map(offer => offer.location))];
    const types = [...new Set(jobOffers?.responseData?.data?.map(offer => offer.type))];

    // Afficher un indicateur de chargement
    if (isGettingJobOffers) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des offres d'emploi...</p>
            </div>
        );
    }

    // Afficher un message d'erreur s'il y en a un
    // if (error) {
    //   return (
    //     <div className="container mx-auto px-4 py-12 text-center">
    //       <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
    //         <strong className="font-bold">Erreur ! </strong>
    //         <span className="block sm:inline">Une erreur s'est produite, actualisez svp.</span>
    //       </div>
    //     </div>
    //   );
    // }

    // Afficher un indicateur de chargement
    if (isGettingJobOffers || isGettingCategories) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des offres d'emploi...</p>
            </div>
        );
    }


    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.3}}
        >
            {/* Hero Section */}
            <section
                className="relative py-28 md:py-36 overflow-hidden bg-gradient-to-r from-primary-700 to-primary-900">
                <div
                    className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="container-custom relative z-10">
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.5}}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
                            Faites carrière chez SHIPPING GL
                        </h1>
                        <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                            Rejoignez une entreprise en pleine croissance et participez à des projets ambitieux dans le
                            domaine du transport et de la logistique en RDC.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <a
                                href="#offres"
                                className="px-8 py-4 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-300"
                            >
                                Voir nos offres
                            </a>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors duration-300"
                            >
                                Postuler spontanément
                            </button>
                        </div>
                    </motion.div>
                </div>

            </section>


            {/* Main Content */}
            <div id="offres" className="bg-gray-50 py-12">
                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Filters */}
                        <motion.div
                            initial={{opacity: 0, x: -20}}
                            animate={{opacity: 1, x: 0}}
                            transition={{duration: 0.3}}
                            className="w-full lg:w-72 bg-white p-6 shadow-sm rounded-xl border border-gray-100 h-fit sticky top-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
                                <button
                                    onClick={resetFilters}
                                    className="text-sm text-primary-600 hover:text-primary-800 transition-colors"
                                >
                                    Réinitialiser
                                </button>
                            </div>

                            {/* Search */}
                            <div className="mb-6">
                                <label htmlFor="search"
                                       className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                        </svg>
                                    </div>
                                    <input
                                        id="search"
                                        type="text"
                                        name="search"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        placeholder="Mots-clés, poste..."
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Location Filter */}
                            <div className="mb-6">
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-gray-500"/>
                  Localisation
                </span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="location"
                                        name="location"
                                        value={filters.location}
                                        onChange={handleFilterChange}
                                        className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                                    >
                                        <option value="">Toutes les localisations</option>
                                        {locations?.map((location, index) => (
                                            <option key={index} value={location}>
                                                {location}
                                            </option>
                                        ))}
                                    </select>
                                    <div
                                        className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                  d="M19 9l-7 7-7-7"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Type Filter */}
                            <div className="mb-6">
                                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                                    Type d'offre
                                </label>
                                <div className="relative">
                                    <select
                                        id="type"
                                        name="type"
                                        value={filters.type}
                                        onChange={handleFilterChange}
                                        className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                                    >
                                        <option value="">Tous les types</option>
                                        {types?.map((type, index) => (
                                            <option key={index} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                    <div
                                        className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                  d="M19 9l-7 7-7-7"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="mb-6">
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                    Domaine
                                </label>
                                <div className="relative">
                                    <select
                                        id="category"
                                        name="category"
                                        value={filters.category}
                                        onChange={handleFilterChange}
                                        className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                                    >
                                        <option value="">Tous les domaines</option>
                                        {jobCategories?.responseData?.data?.map((category) => (
                                            <option key={category.id} value={category.name}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div
                                        className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                  d="M19 9l-7 7-7-7"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Urgent Filter */}
                            {/*<div className="flex items-center mb-6 p-3 bg-amber-50 rounded-lg border border-amber-100">*/}
                            {/*  <input*/}
                            {/*    id="urgent-filter"*/}
                            {/*    type="checkbox"*/}
                            {/*    name="urgent"*/}
                            {/*    checked={filters.urgent}*/}
                            {/*    onChange={(e) => setFilters(prev => ({ ...prev, urgent: e.target.checked }))}*/}
                            {/*    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"*/}
                            {/*  />*/}
                            {/*  <label htmlFor="urgent-filter" className="ml-2 text-sm font-medium text-amber-800">*/}
                            {/*    Afficher uniquement les offres urgentes*/}
                            {/*  </label>*/}
                            {/*</div>*/}
                        </motion.div>

                        {/* Job Listings */}
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Nos offres
                                        d'emploi</h2>
                                    <p className="text-gray-600 mt-1">
                                        {filteredOffers?.length} offre{filteredOffers?.length !== 1 ? 's' : ''} disponible{filteredOffers?.length !== 1 ? 's' : ''}
                                        {filters?.search || filters?.location || filters?.type || filters?.category ? ' avec les filtres actuels' : ''}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredOffers?.length > 0 ? (
                                    filteredOffers?.map((offer, index) => (
                                        <motion.article
                                            key={offer.id}
                                            initial={{opacity: 0, y: 20}}
                                            animate={{opacity: 1, y: 0}}
                                            transition={{duration: 0.3, delay: index * 0.05}}
                                            whileHover={{
                                                y: -5,
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                                            }}
                                            className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full group"
                                        >
                                            <div className="p-6 flex-1 flex flex-col">
                                                {/* En-tête avec badge urgent */}
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                offer.type === 'CDI' ? 'bg-green-100 text-green-800' :
                                    offer.type === 'CDD' ? 'bg-blue-100 text-blue-800' :
                                        'bg-purple-100 text-purple-800'
                            }`}>
                              {offer.type}
                            </span>
                                                        {offer.urgent && (
                                                            <span
                                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Urgent
                              </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                            Publié le {offer.published_at
                                                        ? format(new Date(offer.published_at), 'dd/MM/yyyy', {locale: fr})
                                                        : 'Non définie'}
                          </span>
                                                </div>

                                                {/* Titre et localisation */}
                                                <div className="mb-4">
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                                                        {offer.title}
                                                    </h3>
                                                    <div className="flex items-center text-gray-600">
                                                        <MapPin className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0"/>
                                                        <span className="truncate">{offer.location}</span>
                                                    </div>
                                                </div>

                                                {/* Description courte */}
                                                <div
                                                    className="text-gray-700 text-xs mb-6 line-clamp-3 [&_*]:text-xs [&_*]:text-gray-700 [&_*]:font-normal [&_*]:text-inherit [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-xs [&_h3]:font-medium [&_strong]:font-medium"
                                                    dangerouslySetInnerHTML={{__html: formatDescription(offer.description || '')}}
                                                />

                                                {/* Métadonnées */}
                                                <div className="mt-auto pt-4 border-t border-gray-100">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div className="flex items-center space-x-2">
                              <span
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {offer.category}
                              </span>
                                                            {offer.experience_level && (
                                                                <span className="text-xs text-amber-600 font-medium">
                                  {offer.experience_level}
                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-500 flex items-center">
                              <svg className="h-3.5 w-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor"
                                   viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              Clôture: {offer?.closing_date
                                                            ? format(new Date(offer.closing_date), 'dd/MM/yyyy', {locale: fr})
                                                            : 'Non définie'}
                            </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bouton d'action */}
                                            <div className="px-6 pb-6 pt-2">
                                                <button
                                                    onClick={() => setSelectedOffer(offer)}
                                                    className="w-full py-2.5 px-4 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors border border-primary-100"
                                                >
                                                    Voir les détails
                                                </button>
                                            </div>
                                        </motion.article>
                                    ))
                                ) : (
                                    <div
                                        className="col-span-full text-center py-16 px-4 bg-white rounded-xl border-2 border-dashed border-gray-200">
                                        <div
                                            className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <Briefcase className="w-8 h-8 text-gray-400"/>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune offre ne
                                            correspond à vos critères</h3>
                                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                            Nous n'avons trouvé aucune offre correspondant à votre recherche. Essayez de
                                            modifier vos filtres ou revenez plus tard.
                                        </p>
                                        <button
                                            onClick={resetFilters}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                        >
                                            Réinitialiser les filtres
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Job Offer Modal */}
            {selectedOffer && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog"
                     aria-modal="true">
                    <div
                        className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"
                             onClick={() => setSelectedOffer(null)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"
                              aria-hidden="true">&#8203;</span>

                        <div
                            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl leading-6 font-bold text-gray-900"
                                                    id="modal-title">
                                                    {selectedOffer.title}
                                                </h3>
                                                <div className="mt-1 flex flex-wrap gap-2">
                          <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {selectedOffer.type}
                          </span>
                                                    <span
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {selectedOffer.category}
                          </span>
                                                    {selectedOffer.urgent && (
                                                        <span
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Urgent
                            </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                                onClick={() => setSelectedOffer(null)}
                                            >
                                                <span className="sr-only">Fermer</span>
                                                <X className="h-6 w-6"/>
                                            </button>
                                        </div>

                                        <div className="mt-4 space-y-6">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="flex items-start">
                                                        <div
                                                            className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <MapPin className="h-5 w-5 text-blue-600"/>
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-gray-500">Lieu</p>
                                                            <p className="text-sm text-gray-900">{selectedOffer.location}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start">
                                                        <div
                                                            className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                            <svg className="h-5 w-5 text-amber-600" fill="none"
                                                                 stroke="currentColor" viewBox="0 0 24 24"
                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth="2"
                                                                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M12 16h.01"></path>
                                                            </svg>
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-gray-500">Expérience</p>
                                                            <p className="text-sm text-gray-900">{selectedOffer.experience_level || 'Non spécifié'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start">
                                                        <div
                                                            className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                            <svg className="h-5 w-5 text-green-600" fill="none"
                                                                 stroke="currentColor" viewBox="0 0 24 24"
                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth="2"
                                                                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                            </svg>
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-gray-500">Salaire</p>
                                                            <p className="text-sm text-gray-900">
                                                                {selectedOffer.salary_min && selectedOffer.salary_max
                                                                    ? `${selectedOffer.salary_min} USD - ${selectedOffer.salary_max} USD`
                                                                    : 'Non spécifié'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <svg className="h-4 w-4 text-gray-400 mr-1.5" fill="none"
                                                                 stroke="currentColor" viewBox="0 0 24 24"
                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth="2"
                                                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                            </svg>
                                                            <span
                                                                className="text-sm text-gray-500">Publié le  {selectedOffer.published_at
                                                                ? format(new Date(selectedOffer.published_at), 'dd/MM/yyyy', {locale: fr})
                                                                : 'Non définie'}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <svg className="h-4 w-4 text-red-400 mr-1.5" fill="none"
                                                                 stroke="currentColor" viewBox="0 0 24 24"
                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth="2"
                                                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                            </svg>
                                                            <span
                                                                className="text-sm font-medium text-red-600">Clôture: {selectedOffer.closing_date
                                                                ? format(new Date(selectedOffer.closing_date), 'dd/MM/yyyy', {locale: fr})
                                                                : 'Non définie'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="prose max-w-none">
                                                <h4 className="text-lg font-semibold text-gray-900 mb-3">Description du
                                                    poste</h4>
                                                <div
                                                    className="text-gray-700 text-xs leading-relaxed [&_*]:text-xs [&_*]:text-gray-700 [&_*]:font-normal [&_*]:text-inherit [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0.5 [&_ul]:mb-3 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h3]:text-xs [&_h3]:font-medium [&_h3]:mt-3 [&_h3]:mb-1 [&_strong]:font-medium"
                                                    dangerouslySetInnerHTML={{__html: formatDescription(selectedOffer.description || '')}}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => {
                                        setSelectedOffer(null);
                                        setActiveTab('cv');
                                    }}
                                >
                                    Postuler maintenant
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setSelectedOffer(null)}
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* CTA Section */}
            <section id="apply-now" className="py-16 bg-gradient-to-r from-primary-700 to-primary-900 text-white">
                <div className="container-custom px-4 text-center">
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{duration: 0.5}}
                    >
                        <h2 className="text-3xl text-white md:text-4xl font-bold mb-6">Vous cherchez a commencer votre
                            carrière ?</h2>
                        <p className="text-xl text-primary max-w-3xl mx-auto mb-8">
                            Envoyez-nous votre profil. Notre équipe l'examinera et vous contactera si un poste vous
                            correspond .
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => {
                                    setCurrentStep(1);
                                    setIsModalOpen(true);
                                }}
                                className="bg-white text-primary-700 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-300 transform hover:scale-105"
                            >
                                Cliquez ici
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-16 bg-white">
                <div className="container-custom px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Pourquoi nous rejoindre ?</h2>
                        <div className="w-20 h-1 bg-primary-600 mx-auto"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: (
                                    <svg className="h-12 w-12 text-primary-600" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                ),
                                title: "Environnement de travail stimulant",
                                description: "Rejoignez une équipe dynamique et bienveillante qui valorise l'innovation et la collaboration."
                            },
                            {
                                icon: (
                                    <svg className="h-12 w-12 text-primary-600" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M12 16h.01"></path>
                                    </svg>
                                ),
                                title: "Évolution de carrière",
                                description: "Bénéficiez d'opportunités d'évolution et de formations pour développer vos compétences."
                            },
                            {
                                icon: (
                                    <svg className="h-12 w-12 text-primary-600" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                ),
                                title: "Rémunération attractive",
                                description: "Bénéficiez d'une rémunération compétitive avec des avantages sociaux attrayants."
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                className="bg-gray-50 p-8 rounded-xl text-center"
                                initial={{opacity: 0, y: 20}}
                                whileInView={{opacity: 1, y: 0}}
                                viewport={{once: true}}
                                transition={{duration: 0.3, delay: index * 0.1}}
                            >
                                <div
                                    className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-50 mb-4 mx-auto">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-600">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Modal de candidature */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: 20}}
                        className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8"
                    >
                        <div
                            className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b border-gray-200 rounded-t-xl">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold text-gray-900">Postuler spontanément</h3>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setCurrentStep(1);
                                    }}
                                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-full p-1"
                                >
                                    <X className="h-6 w-6"/>
                                </button>
                            </div>

                            {/* Indicateur d'étapes */}
                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center">
                                    <div
                                        className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                        1
                                    </div>
                                    <div
                                        className={`h-1 w-8 mx-1 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                                    <div
                                        className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                        2
                                    </div>
                                    <div
                                        className={`h-1 w-8 mx-1 ${currentStep >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                                    <div
                                        className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                        3
                                    </div>
                                </div>
                                <span className="text-sm text-gray-500">Étape {currentStep} sur 3</span>
                            </div>
                        </div>

                        <div className="max-h-[calc(100vh-250px)] overflow-y-auto p-6">
                            <form onSubmit={handleSubmitCV} className="space-y-6">
                                {/* Contenu du formulaire par étape */}
                                {renderFormStep()}

                                <div
                                    className="flex flex-col sm:flex-row justify-between pt-6 border-t border-gray-200 gap-3">
                                    {/* Bouton Précédent uniquement si on n'est pas à la première étape */}
                                    {currentStep > 1 && (
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex-1 sm:flex-none sm:w-auto"
                                        >
                                            Précédent
                                        </button>
                                    )}

                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        {/* Bouton Annuler qui apparaît à toutes les étapes */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsModalOpen(false);
                                                setCurrentStep(1);
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex-1 sm:flex-none sm:w-auto"
                                        >
                                            Annuler
                                        </button>

                                        {/* Bouton Suivant ou Soumettre selon l'étape */}
                                        <button
                                            type={currentStep === 3 ? 'button' : 'button'}
                                            onClick={currentStep === 3 ? handleSubmitCV : nextStep}
                                            disabled={isSubmitting}
                                            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                                isSubmitting ? 'bg-blue-400' : 'bg-primary-600 hover:bg-primary-700'
                                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 flex-1 sm:flex-none sm:w-auto`}
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                               fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                    strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Envoi en cours...
                        </span>
                                            ) : currentStep === 3 ? (
                                                'Soumettre ma candidature'
                                            ) : (
                                                'Suivant'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default RecruitmentPage;
