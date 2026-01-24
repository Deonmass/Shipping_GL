import React, {useState, useRef, useEffect} from 'react';
import {Plus, Trash2, Edit, Search, Eye, X, FileText, XCircle, RefreshCcwIcon} from 'lucide-react';
import {Bar, Doughnut} from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";
import {
    UseAddCallOffer, UseAddCallOfferTask,
    UseDeleteCallOffer, UseDeleteCallOfferTask,
    UseGetCallOffers, UseGetCallOfferTasks,
    UseGetPartners,
    UseGetUsers,
    UseUpdateCallOffer, UseUpdateCallOfferTask
} from "../../services";
import AppToast from "../../utils/AppToast.ts";
import {format} from "date-fns";
import Swal from "sweetalert2";

interface DetailProps {
    label: string;
    value?: string | number;
    children?: React.ReactNode;
}

const typeDataSelect = [
    {
        id: "AO",
    },
    {
        id: "AMi",
    },
]

const statusDataKeys = {
    "0": "Perdu",
    "1": "En cours",
    "2": "Envoyé",
    "3": "Cloturé",
    "4": "Gagné",
}

const Detail: React.FC<DetailProps> = ({label, value, children}) => (
    <div className="space-y-1">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="text-sm text-gray-900 dark:text-gray-100">
            {children || value || '-'}
        </dd>
    </div>
);

// Enregistrer les composants nécessaires de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels,
    ArcElement,
    PointElement,
    LineElement
);

// Types

interface Tache {
    id?: string;
    assigned_to: string;
    title: string;
    assigned_name?: string;
    end_date: string;
    closed_at?: string;
    status: string;
}

interface AppelOffre {
    id: string;
    ref: string;
    title: string;
    type: string
    reception_date: string | Date;
    limit_date: string | Date;
    sending_date: string | Date | null;
    status: '0' | '1' | '2' | '3' | '4';
    comment: string;
    manager_name: string;
    amount: number;
    created_at: string;
    partner_id: string;
    partner_title: string;
    numero: string;
    closed_task_count: string;
    open_task_count: string;
    task_count: string;
}

const emptyItem = {
    ref: '',
    title: '',
    type: '',
    reception_date: new Date(),
    limit_date: new Date(),
    sending_date: null,
    status: '',
    comment: '',
    managed_by: '',
    partner_id: '',
}

const emptyTaskItem = {
    title: '',
    assigned_to: '',
    end_date: new Date().toISOString().split('T')[0],
    status: ''
}

const isTaskClosed = (t: any) => t.closed_at !== null;

const AppelsOffresPage: React.FC = () => {
    const chartRef = useRef<any>(null);
    // États
    const [mainActiveTab, setMainActiveTab] = useState<'statistiques' | 'base'>('base');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const years = Array.from(
        {length: 5},
        (_, i) => new Date().getFullYear() - i
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAppelOffre, setSelectedAppelOffre] = useState<AppelOffre | null>(null);
    const [detailsActiveTab, setDetailsActiveTab] = useState<'details' | 'taches'>('details');
    const [taches, setTaches] = useState<Tache[]>([]);
    const [nouvelleTache, setNouvelleTache] = useState<Tache>(emptyTaskItem);
    const [showTacheForm, setShowTacheForm] = useState<"add" | "edit" | null>(null);
    const [editingTache, setEditingTache] = useState<Tache | null>(null);
    const [hiddenDatasets, setHiddenDatasets] = useState<Record<number, boolean>>({});

    const [isModalOpen, setIsModalOpen] = useState<"add" | "edit" | "detail" | 'status' | null>(null);
    const [formData, setFormData] = useState<any>(emptyItem);

    const {data: partners, isLoading: isGettingPartners} = UseGetPartners({noPermission: 1})
    const {data: users, isLoading: isGettingUsers} = UseGetUsers({noPermission: 1})
    const {
        data: callOffers,
        isLoading: isGettingCallOffers,
        isRefetching: isReGettingCallOffers,
        refetch: reGetCallOffers
    } = UseGetCallOffers({format: "stats"})

    const {isPending: isAdding, mutate: addCallOffer, data: addResult} = UseAddCallOffer()
    const {isPending: isUpdating, mutate: updateCallOffer, data: updateResult} = UseUpdateCallOffer()
    const {isPending: isDeleting, mutate: deleteCallOffer, data: deleteResult} = UseDeleteCallOffer()

    const {
        isRefetching: isGettingTasks,
        data: callOfferTasks,
        refetch: reGetCallOfferTasks,
    } = UseGetCallOfferTasks({
        call_offer_id: selectedAppelOffre?.id,
        enabled: !!(selectedAppelOffre?.id && (isModalOpen === 'detail'))
    })
    const {isPending: isAddingTask, mutate: addCallOfferTask, data: addResultTask} = UseAddCallOfferTask()
    const {isPending: isUpdatingTask, mutate: updateCallOfferTask, data: updateResultTask} = UseUpdateCallOfferTask()
    const {isPending: isDeletingTask, mutate: deleteCallOfferTask, data: deleteResultTask} = UseDeleteCallOfferTask()

    // Fonction pour afficher les détails d'un appel d'offre
    const handleReferenceClick = (appelOffre: AppelOffre) => {
        setSelectedAppelOffre(appelOffre);
        setIsModalOpen("detail");
    };

    const handleViewDetails = (appelOffre: AppelOffre) => {
        setSelectedAppelOffre(appelOffre);
        setDetailsActiveTab('details');
        setIsModalOpen("detail");
    };

    // Fonction pour gérer l'édition d'une tâche
    const handleEditTache = (tache: Tache) => {
        setNouvelleTache(tache);
        setShowTacheForm("edit");
    };

    // Fonction pour formater la date
    const formatDate = (date: Date | string) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // Fonction pour calculer les jours restants avant la date limite
    const getDaysRemaining = (deadline: Date | string): number => {
        if (!deadline) return 0;
        const deadlineDate = new Date(deadline);
        const today = new Date();
        // Reset hours to avoid time of day affecting the calculation
        today.setHours(0, 0, 0, 0);
        deadlineDate.setHours(0, 0, 0, 0);

        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    };

    // Fonction pour obtenir la couleur en fonction du statut
    const getStatusColor = (statut: string) => {
        switch (statut) {
            case '1':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case '2':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case '3':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case '0':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case '4':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    // Fonction pour filtrer les appels d'offres
    const filteredAppelsOffres = callOffers?.responseData?.data?.items?.filter(ao =>
        ao.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ao.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ao.partner_title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleDeleteAppelOffre = async (id: string) => {
        if (!id) {
            AppToast.error(true, 'Aucun ID fourni pour la suppression');
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
            background: '#1f2937',
            color: '#ffffff',
        });
        if (result.isConfirmed) {
            deleteCallOffer({id: id})
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!id) {
            AppToast.error(true, 'Aucun ID fourni pour la suppression');
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
            background: '#1f2937',
            color: '#ffffff',
        });
        if (result.isConfirmed) {
            deleteCallOfferTask({id: id})
        }
    };


    // Fonction pour éditer un appel d'offre
    const handleEditAppelOffre = (appelOffre: AppelOffre) => {
        setSelectedAppelOffre(appelOffre);
        setFormData(appelOffre);
        setIsModalOpen("edit");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const {name, value, type} = e.target as HTMLInputElement;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number'
                ? parseFloat(value) || 0
                : value
        }));
    };

    useEffect(() => {
        if(selectedAppelOffre?.id){
            if(callOffers?.responseData?.data?.items?.length > 0){
                const filteredAppelOffre = callOffers?.responseData?.data?.items?.find(ao => ao.id === selectedAppelOffre?.id)
                setSelectedAppelOffre(filteredAppelOffre)
            }
        }
    }, [callOffers?.responseData?.data?.items]);

    useEffect(() => {
        if (addResult) {
            if (addResult?.responseData?.error) {
                AppToast.error(true, addResult?.responseData?.message || "Erreur lors de l'enregistrement")
            } else {
                reGetCallOffers()
                AppToast.success(true, "Appel d'offre ajouté avec succès")
                setIsModalOpen(null);
                setFormData(emptyItem);
            }
        }
    }, [addResult]);

    useEffect(() => {
        if (updateResult) {
            if (updateResult?.responseData?.error) {
                AppToast.error(true, updateResult?.responseData?.message || "Erreur lors de la modification")
            } else {
                reGetCallOffers()
                AppToast.success(true, "Appel d'offre mis a jour avec avec succès")
                setIsModalOpen(null);
                setSelectedAppelOffre(null)
                setFormData(emptyItem);
            }
        }
    }, [updateResult]);

    useEffect(() => {
        if (deleteResult) {
            if (deleteResult?.responseData?.error) {
                AppToast.error(true, deleteResult?.responseData?.message || "Erreur lors de la suppression")
            } else {
                reGetCallOffers()
                AppToast.success(true, "Appel d'offre supprimée avec avec succès")
                setIsModalOpen(null);
                setSelectedAppelOffre(null)
                setFormData(emptyItem);
            }
        }
    }, [deleteResult]);

    useEffect(() => {
        if (deleteResultTask) {
            if (deleteResultTask?.responseData?.error) {
                AppToast.error(true, deleteResult?.responseData?.message || "Erreur lors de la suppression")
            } else {
                reGetCallOffers()
                reGetCallOfferTasks()
                AppToast.success(true, "Tache supprimée avec avec succès")
                setNouvelleTache(emptyTaskItem);
            }
        }
    }, [deleteResultTask]);

    useEffect(() => {
        if (addResultTask) {
            if (addResultTask?.responseData?.error) {
                AppToast.error(true, addResultTask?.responseData?.message || "Erreur lors de l'enregistrement de la tache")
            } else {
                reGetCallOffers()
                reGetCallOfferTasks()
                AppToast.success(true, "Tache ajoutée avec succès")
                setShowTacheForm(null);
                setNouvelleTache(emptyTaskItem);
            }
        }
    }, [addResultTask]);

    useEffect(() => {
        if (updateResultTask) {
            if (updateResultTask?.responseData?.error) {
                AppToast.error(true, updateResultTask?.responseData?.message || "Erreur lors de la modification de la tache")
            } else {
                reGetCallOffers()
                reGetCallOfferTasks()
                AppToast.success(true, "Tache mise a jour avec avec succès")
                setShowTacheForm(null);
                setNouvelleTache(emptyTaskItem);
            }
        }
    }, [updateResultTask]);


    // Fonction pour gérer la soumission du formulaire
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.partner_id || !formData.managed_by || !formData.reception_date || !formData.type || !formData.limit_date) {
            AppToast.error(true, 'Veuillez remplir tous les champs requis');
            return;
        }
        const body = {
            numero: formData?.numero,
            reception_date: formData?.reception_date,
            limit_date: formData?.limit_date,
            sending_date: formData?.sending_date,
            partner_id: formData?.partner_id,
            type: formData?.type,
            amount: formData?.amount,
            title: formData?.title,
            ref: formData?.ref,
            comment: formData?.comment,
            managed_by: formData?.managed_by,
        }
        if (isModalOpen === "add") {
            addCallOffer(body);
        }
        if (isModalOpen === "edit") {
            updateCallOffer({
                id: selectedAppelOffre?.id,
                ...body
            })
        }
    };

    const handleSubmitTache = () => {
        if (!nouvelleTache.assigned_to || !nouvelleTache.title || !nouvelleTache.end_date) {
            AppToast.error(true, 'Veuillez remplir tous les champs requis');
            return;
        }
        if (showTacheForm === "add") {
            addCallOfferTask({
                call_offer_id: selectedAppelOffre?.id,
                assigned_to: nouvelleTache?.assigned_to,
                title: nouvelleTache?.title,
                end_date: nouvelleTache?.end_date,
            })
        }
        if (showTacheForm === "edit") {
            if (!nouvelleTache.id) {
                AppToast.error(true, 'Aucun ID trouvé');
                return;
            }
            updateCallOfferTask({
                id: nouvelleTache?.id,
                assigned_to: nouvelleTache?.assigned_to,
                title: nouvelleTache?.title,
                end_date: nouvelleTache?.end_date,
            })
        }

    }

    // Filtrer les appels d'offres par année sélectionnée
    const appelsAnneeEnCours = callOffers?.responseData?.data?.items?.filter(ao => {
        const aoYear = new Date(ao.reception_date).getFullYear();
        return aoYear === selectedYear;
    }) || [];

    // Données pour les graphiques
    const statsData = {
        total: appelsAnneeEnCours.length,
        enCours: appelsAnneeEnCours.filter(ao => ao.status === '1').length,
        gagnes: appelsAnneeEnCours.filter(ao => ao.status === '4').length,
        tauxReussite: appelsAnneeEnCours.length > 0
            ? Math.round((appelsAnneeEnCours.filter(ao => ['4', '0'].includes(ao.status)).length > 0
                ? (appelsAnneeEnCours.filter(ao => ao.status === '4').length /
                appelsAnneeEnCours.filter(ao => ['4', '0'].includes(ao.status)).length) * 100
                : 0))
            : 0
    };

    // Données pour le graphique de répartition par statut
    const getStatutData = (filteredAppels: AppelOffre[] = callOffers?.responseData?.data?.items || []) => {
        // Filtrer d'abord par année sélectionnée
        const appelsFiltres = filteredAppels.filter(ao => {
            const aoYear = new Date(ao.reception_date).getFullYear();
            return aoYear === selectedYear;
        });

        const statuts = {
            "1": 0,
            "2": 0,
            "3": 0,
            "4": 0,
            "0": 0,
        };

        appelsFiltres.forEach(ao => {
            if (ao.status in statuts) {
                statuts[ao.status as keyof typeof statuts]++;
            }
        });

        return {
            labels: ['En cours', 'Envoyé', 'Cloturé', 'Gagné', 'Perdu'],
            datasets: [
                {
                    data: [
                        statuts['1'],
                        statuts['2'],
                        statuts['3'],
                        statuts['4'],
                        statuts['0'],
                    ],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',  // bleu pour en cours
                        'rgba(99, 102, 241, 0.7)',  // indigo pour envoyée
                        'rgba(16, 185, 129, 0.7)',  // vert pour gagné
                        'rgba(239, 68, 68, 0.7)',   // rouge pour perdu
                        'rgba(245, 158, 11, 0.7)',  // jaune pour annulé
                        'rgba(107, 114, 128, 0.7)'  // gris pour clôturé
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(99, 102, 241, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(107, 114, 128, 1)'
                    ],
                    borderWidth: 1,
                },
            ],
        };
    };

    // Fonction pour rendre une couleur plus pâle
    const lightenColor = (color: string, opacity: number) => {
        // Si la couleur est déjà au format rgba, on met juste à jour l'opacité
        if (color.startsWith('rgba')) {
            return color.replace(/[\d\.]+\)$/, `${opacity})`);
        }
        // Sinon, on convertit en rgba avec l'opacité
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const statutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',

        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 16,

                    generateLabels: (chart: any) => {
                        const data = chart.data;
                        if (!data.labels?.length || !data.datasets.length) return [];

                        const dataset = data.datasets[0];
                        const meta = chart.getDatasetMeta(0);
                        const total = dataset.data.reduce((a: number, b: number) => a + b, 0);

                        return data.labels.map((label: string, i: number) => {
                            const value = dataset.data[i] as number;
                            const percentage =
                                total > 0 ? Math.round((value / total) * 100) : 0;

                            const hidden = meta.data[i]?.hidden === true;

                            return {
                                text: hidden
                                    ? `🚫 ${label} (${percentage}%)`
                                    : `${label} (${percentage}%)`,

                                fillStyle: dataset.backgroundColor[i],
                                strokeStyle: dataset.backgroundColor[i],
                                lineWidth: hidden ? 1 : 0,

                                // 🔥 COULEUR DU TEXTE
                                fontColor: hidden ? '#6B7280' : '#FFFFFF', // gray-500 / white
                                fontStyle: hidden ? 'italic' : 'normal',

                                hidden,
                                index: i,
                                datasetIndex: 0,
                                pointStyle: hidden ? 'rectRounded' : 'circle',
                            };
                        });
                    },
                },
                onClick: (_: any, legendItem: any, legend: any) => {
                    const chart = legend.chart;
                    const index = legendItem.index;
                    const meta = chart.getDatasetMeta(0);

                    meta.data[index].hidden = !meta.data[index].hidden;
                    chart.update();
                },
            },

            datalabels: {
                color: (context: any) => {
                    const meta = context.chart.getDatasetMeta(context.datasetIndex);
                    const hidden = meta.data[context.dataIndex]?.hidden;
                    return hidden ? 'rgba(255,255,255,0.4)' : '#FFFFFF';
                },
                font: {
                    weight: 'bold' as const,
                    size: 14,
                },
                formatter: (value: number, context: any) => {
                    const total = context.dataset.data.reduce(
                        (a: number, b: number) => a + b,
                        0
                    );
                    if (!total || value === 0) return '';
                    return `${Math.round((value / total) * 100)}%`;
                },
            },

            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.85)',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
                padding: 12,
                callbacks: {
                    label: (context: any) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce(
                            (a: number, b: number) => a + b,
                            0
                        );
                        const percentage = total
                            ? Math.round((value / total) * 100)
                            : 0;

                        return ` ${label}: ${value} (${percentage}%)`;
                    },
                },
            },
        },

        elements: {
            arc: {
                borderWidth: 0,
            },
        },

        onHover: (event: any, elements: any) => {
            event.native.target.style.cursor = elements.length
                ? 'pointer'
                : 'default';
        },
    };

    // Gestionnaire de clic sur la légende
    const handleLegendClick = (chart: any, legendItem: any, legend: any) => {
        // Basculer l'état de visibilité
        const meta = chart.getDatasetMeta(legendItem.datasetIndex);
        meta.hidden = meta.hidden === null ? !chart.data.datasets[legendItem.datasetIndex].hidden : null;

        // Mettre à jour l'état pour forcer le rendu
        setHiddenDatasets(prev => ({
            ...prev,
            [legendItem.index]: !prev[legendItem.index]
        }));
    };

    // Mettre à jour le graphique quand l'année change
    useEffect(() => {
        // Forcer la mise à jour du graphique
        const chart = chartRef.current;
        if (chart) {
            chart.update();
        }
    }, [selectedYear]);

    // Filtrer les appels d'offres par année sélectionnée
    const getFilteredAppelsOffres = () => {
        return callOffers?.responseData?.data?.items?.filter(ao => {
            const aoYear = new Date(ao.reception_date).getFullYear();
            return aoYear === selectedYear;
        });
    };

    // Fonction pour obtenir les données mensuelles
    const getMonthlyData = () => {
        // Créer un tableau pour stocker le nombre d'AO par mois
        const monthlyData = new Array(12).fill(0);

        // Filtrer d'abord par année sélectionnée
        const appelsAnneeEnCours = callOffers?.responseData?.data?.items?.filter(ao => {
            const aoYear = new Date(ao.reception_date).getFullYear();
            return aoYear === selectedYear;
        });

        // Parcourir les appels d'offres filtrés
        appelsAnneeEnCours.forEach(ao => {
            const date = new Date(ao.reception_date);
            const month = date.getMonth(); // 0-11
            monthlyData[month]++;
        });

        // Noms des mois en français (format abrégé)
        const monthNames = [
            'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
            'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
        ];

        return {
            labels: monthNames,
            datasets: [
                {
                    label: "Nombre d'appels d'offres",
                    data: monthlyData,
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }
            ]
        };
    };

    // Options pour le graphique mensuel
    const monthlyOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        return `${context.parsed.y} AO`;
                    }
                }
            },
            datalabels: {
                color: '#FFFFFF'
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#FFFFFF',
                    font: {
                        size: 12
                    }
                },
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    precision: 0,
                    color: '#FFFFFF',
                    font: {
                        size: 12
                    }
                },
                grid: {
                    display: false
                }
            }
        }
    };

    // Préparer les données avec les états de visibilité
    const getChartData = () => {
        const data = getStatutData(getFilteredAppelsOffres());

        if (data.datasets && data.datasets[0]) {
            data.datasets[0].backgroundColor = data.datasets[0].backgroundColor.map((color: string, index: number) => {
                return hiddenDatasets[index] ? lightenColor(color, 0.3) : color;
            });
        }

        return data;
    };

    return (
        <div className="p-6 text-gray-900 dark:text-white">

            <AdminPageHeader
                Icon={<FileText
                    className={`w-7 h-7`}
                />}
                title="Gestion des Appels d'Offres"
                isRefreshing={isGettingCallOffers || isReGettingCallOffers}
                onRefresh={() => reGetCallOffers()}
                onAdd={HasPermission(appPermissions.appelOffre, appOps.create) ? () => {
                    setIsModalOpen("add");
                    setFormData(emptyItem);
                } : undefined}
            />
            {isModalOpen === "add" || isModalOpen === "edit" ? (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div
                            className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {isModalOpen === "edit" ? "Modifier l'Appel d'offre" : "Nouvel Appel d'Offre"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(null)}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <XCircle className="h-6 w-6"/>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}
                              className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">N° Appel d'Offre</label>
                                <input
                                    type="text"
                                    name="numero"
                                    value={formData?.numero}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Client/Partenaire</label>
                                <select
                                    name="partner_id"
                                    value={formData.partner_id}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">{isGettingPartners ? "Chargement..." : ""}</option>
                                    {partners?.responseData?.data?.map((partner: any) => <option
                                        key={partner?.id}
                                        value={partner?.id}>{partner?.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value=""></option>
                                    {typeDataSelect.map((type) => <option key={type.id}
                                                                          value={type.id}>{type.id}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Titre</label>
                                <input
                                    required
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Montant ($)</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date de réception</label>
                                <input
                                    type="date"
                                    id="reception_date"
                                    name="reception_date"
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                    value={formData.reception_date ? formData.reception_date : ''}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date d'envoi</label>
                                <input
                                    type="date"
                                    id="sending_date"
                                    name="sending_date"
                                    required
                                    //max={new Date().toISOString().split('T')[0]}
                                    value={formData.sending_date ? formData.sending_date : ''}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date limite</label>
                                <input
                                    type="date"
                                    id="limit_date"
                                    name="limit_date"
                                    required
                                    //max={new Date().toISOString().split('T')[0]}
                                    value={formData.limit_date ? formData.limit_date : ''}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Référence</label>
                                <input
                                    required
                                    type="text"
                                    name="ref"
                                    value={formData.ref}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">BID Manager</label>
                                <select
                                    name="managed_by"
                                    value={formData.managed_by}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">{isGettingUsers ? "Chargement..." : ""}</option>
                                    {users?.responseData?.data?.map((user: any) => <option key={user?.id}
                                                                                           value={user?.id}>{user?.name}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium mb-1">Commentaire</label>
                                <textarea
                                    name="comment"
                                    value={formData.comment}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end space-x-2 md:col-span-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(null)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    disabled={isAdding}
                                    type="submit"
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                >
                                    {isAdding || isUpdating ?
                                        <RefreshCcwIcon className="animate-spin"/> : "Enregistrer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}


            {/* Onglets */}
            <div
                className="sticky top-10 z-10 bg-white dark:bg-gray-900 pt-4 pb-2 -mx-4 px-4 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto">
                    <ul className="flex flex-wrap -mb-px">
                        <li className="mr-2">
                            <button
                                onClick={() => setMainActiveTab('statistiques')}
                                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                                    mainActiveTab === 'statistiques'
                                        ? 'text-red-600 border-red-600 dark:text-red-400 dark:border-red-400'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border-transparent hover:border-gray-300 dark:hover:border-gray-200'
                                }`}
                            >
                                Statistiques
                            </button>
                        </li>
                        <li className="mr-2">
                            <button
                                onClick={() => setMainActiveTab('base')}
                                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                                    mainActiveTab === 'base'
                                        ? 'text-red-600 border-red-600 dark:text-red-400 dark:border-red-400'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border-transparent hover:border-gray-300 dark:hover:border-gray-200'
                                }`}
                                aria-current="page"
                            >
                                Base de données
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Contenu des onglets */}
            {mainActiveTab === 'statistiques' && (
                <div className="grid gap-6">
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg text-gray-800 dark:text-white font-semibold">Statistiques des appels
                                d'offres</h2>
                            <div className="mt-2 flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    >
                                        {years.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 text-gray-900 dark:text-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                <div
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</div>
                                    <div
                                        className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{statsData.total}</div>
                                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Appels d'offres</div>
                                </div>
                                <div
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">En cours</div>
                                    <div
                                        className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">{statsData.enCours}</div>
                                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">En cours
                                        d'évaluation
                                    </div>
                                </div>
                                <div
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Gagnés</div>
                                    <div
                                        className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">{statsData.gagnes}</div>
                                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Appels d'offres
                                        remportés
                                    </div>
                                </div>
                                <div
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux de
                                        réussite
                                    </div>
                                    <div
                                        className="mt-1 text-2xl font-semibold text-purple-600 dark:text-purple-400">{statsData.tauxReussite}%
                                    </div>
                                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Taux de réussite
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow">
                                    <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Répartition
                                        par statut</h3>
                                    <div className="h-64 text-white">
                                        {callOffers?.responseData?.data?.items?.length ? (
                                            <Doughnut
                                                ref={chartRef}
                                                data={getChartData()}
                                                options={{
                                                    ...statutOptions,
                                                    onClick: (e: any, legendItem: any) => {
                                                        if (legendItem.length > 0) {
                                                            const chart = e.chart;
                                                            handleLegendClick(chart, legendItem[0], chart.legend);
                                                        }
                                                    }
                                                }}
                                                className="text-white"
                                            />
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <div className="text-center text-gray-500 dark:text-gray-400">
                                                    <p>Aucun appel d'offre à afficher</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow">
                                    <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Évolution
                                        mensuelle</h3>
                                    <div className="h-64">
                                        {callOffers?.responseData?.data?.items?.length ? (
                                            <Bar
                                                data={getMonthlyData()}
                                                options={monthlyOptions}
                                            />
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <div className="text-center text-gray-500 dark:text-gray-400">
                                                    <p>Aucun appel d'offre à afficher</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {mainActiveTab === 'base' && (
                <div className="grid gap-6">
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div
                            className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-lg dark:text-white font-semibold">Liste des appels d'offres</h2>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-6 w-6 text-gray-400"/>
                                    </div>
                                    <input
                                        type="text"
                                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        placeholder="Rechercher..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col"
                                        className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Client & Référence
                                    </th>
                                    <th scope="col"
                                        className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Dates (Réception / Limite)
                                    </th>
                                    <th scope="col"
                                        className="w-1/6 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        % Tâches
                                    </th>
                                    <th scope="col"
                                        className="w-1/6 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        BID
                                    </th>
                                    <th scope="col"
                                        className="w-1/6 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th scope="col"
                                        className="w-1/6 px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                                </thead>
                                <tbody
                                    className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredAppelsOffres.length > 0 ? (
                                    filteredAppelsOffres.map((ao) => (
                                        <tr key={ao.id}
                                            className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${getDaysRemaining(ao.limit_date) <= 5 && getDaysRemaining(ao.limit_date) >= 0 ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                                            <td className="w-1/4 px-4 py-4">
                                                <div
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer font-medium"
                                                    onClick={() => handleReferenceClick(ao)}
                                                >
                                                    {ao.partner_title}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {ao.ref}
                                                </div>
                                            </td>
                                            <td className="w-1/4 px-4 py-4">
                                                <div className="text-sm">
                                                    <div>Reçue: {formatDate(ao.reception_date)}</div>
                                                    <div>Limite: {formatDate(ao.limit_date)}</div>
                                                    <div className="mt-1">
                              <span
                                  className={`px-2 py-1 rounded-full text-xs ${getDaysRemaining(ao.limit_date) <= 5 ? 'text-red-800 bg-red-100 dark:text-red-100 dark:bg-red-900/50' : 'text-gray-800 bg-gray-100 dark:text-gray-200 dark:bg-gray-700'}`}>
                                {getDaysRemaining(ao.limit_date)} j restants
                              </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="w-1/6 px-2 py-4">
                                                <div className="flex items-center">
                                                    <div
                                                        className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-2"
                                                        style={{width: '60px'}}>
                                                        <div
                                                            className="bg-green-600 h-2.5 rounded-full"
                                                            style={{
                                                                width: `${ao?.task_count ? (parseInt(ao.closed_task_count)  /parseInt(ao.task_count)) * 100 : 0}%`,
                                                                transition: 'width 0.3s ease-in-out'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-gray-600 dark:text-gray-300">
                              {ao.task_count ? Math.round((parseInt(ao.closed_task_count) / parseInt(ao.task_count)) * 100) : 0}%
                            </span>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {ao.closed_task_count}/{ao.task_count} tâches
                                                </div>
                                            </td>
                                            <td className="w-1/6 px-2 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                {ao.manager_name}
                                            </td>
                                            <td className="w-1/6 px-2 py-4 whitespace-nowrap">
                          <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ao.status)}`}>
                            {statusDataKeys[`${ao.status}`]}
                          </span>
                                            </td>
                                            <td className="w-1/6 px-2 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <div className="inline-flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewDetails(ao)}
                                                        className="p-2 rounded-lg bg-gray-100/70 hover:bg-gray-200/70 dark:bg-gray-700/50 dark:hover:bg-gray-600/70 transition-colors"
                                                        title="Voir détails"
                                                    >
                                                        <Eye className="h-5 w-5 text-gray-700 dark:text-gray-200"/>
                                                    </button>
                                                    {HasPermission(appPermissions.appelOffre, appOps.update) ? <button
                                                        onClick={() => handleEditAppelOffre(ao)}
                                                        className="p-2 rounded-lg bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                                                    </button> : null}
                                                    {HasPermission(appPermissions.appelOffre, appOps.delete) ? <button
                                                        onClick={() => handleDeleteAppelOffre(ao.id)}
                                                        className="p-2 rounded-lg bg-red-50/70 hover:bg-red-100/70 dark:bg-red-900/30 dark:hover:bg-red-800/50 transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400"/>
                                                    </button> : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8}
                                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                            Aucun appel d'offre trouvé
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                        <div
                            className="bg-white dark:bg-gray-800 px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                                    Précédent
                                </button>
                                <button
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                                    Suivant
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Affichage de <span className="font-medium">0</span> à <span
                                        className="font-medium">0</span> sur{' '}
                                        <span className="font-medium">0</span> résultats
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                         aria-label="Pagination">
                                        <button
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                                            <span className="sr-only">Précédent</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"
                                                 viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd"
                                                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                                      clipRule="evenodd"/>
                                            </svg>
                                        </button>
                                        <button
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                                            <span className="sr-only">Suivant</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"
                                                 viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd"
                                                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                      clipRule="evenodd"/>
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen === "detail" && selectedAppelOffre ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                    <div
                        className="relative w-full max-w-3xl rounded-lg bg-white dark:bg-gray-800 shadow-lg max-h-[90vh] overflow-y-auto">

                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Détails de l'appel d'offre
                                </h3>
                                {selectedAppelOffre.ref && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Référence : {selectedAppelOffre.ref}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsModalOpen(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="flex -mb-px px-6">
                                <button
                                    onClick={() => setDetailsActiveTab('details')}
                                    className={`py-4 px-6 text-sm font-medium border-b-2 ${
                                        detailsActiveTab === 'details'
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    Détails
                                </button>
                                <button
                                    onClick={() => setDetailsActiveTab('taches')}
                                    className={`py-4 px-6 text-sm font-medium border-b-2 ${
                                        detailsActiveTab === 'taches'
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    Tâches
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="px-6 py-4 space-y-6 text-sm">
                            {detailsActiveTab === 'details' ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Detail label="Référence" value={selectedAppelOffre.ref}/>
                                        <Detail label="Numéro" value={selectedAppelOffre.numero}/>
                                        <Detail label="Client" value={selectedAppelOffre.partner_title}/>
                                        <Detail label="BID Manager" value={selectedAppelOffre.manager_name}/>

                                        <Detail label="Type" value={selectedAppelOffre.type}/>
                                        <Detail label="Statut">
                <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedAppelOffre.status)}`}>
                  {statusDataKeys[`${selectedAppelOffre.status}`]}
                </span>
                                        </Detail>

                                        <Detail
                                            label="Date de réception"
                                            value={formatDate(selectedAppelOffre.reception_date)}
                                        />
                                        <Detail
                                            label="Date limite"
                                            value={formatDate(selectedAppelOffre.limit_date)}
                                        />

                                        <Detail
                                            label="Date d'envoi"
                                            value={
                                                selectedAppelOffre.sending_date
                                                    ? formatDate(selectedAppelOffre.sending_date)
                                                    : '—'
                                            }
                                        />

                                        <Detail
                                            label="Montant"
                                            value={`${selectedAppelOffre.amount.toLocaleString()} $`}
                                        />
                                    </div>

                                    <div>
                                        <p className="font-medium text-gray-500 dark:text-gray-400">Référence</p>
                                        <p className="mt-1 text-gray-900 dark:text-white">
                                            {selectedAppelOffre.ref || 'Non spécifiée'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="font-medium text-gray-500 dark:text-gray-400">Titre</p>
                                        <p className="mt-1 text-gray-900 dark:text-white">
                                            {selectedAppelOffre.title}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="font-medium text-gray-500 dark:text-gray-400">Commentaire</p>
                                        <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-line">
                                            {selectedAppelOffre.comment || 'Aucun commentaire'}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="p-4">
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Liste des
                                                tâches</h3>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowTacheForm("add")
                                                    setNouvelleTache(emptyTaskItem)
                                                }}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <Plus className="-ml-1 mr-1 h-6 w-6"/>
                                                Nouvelle tâche
                                            </button>
                                        </div>
                                        {callOfferTasks?.responseData?.data?.length ? (
                                            <div className="mt-2">
                                                <div className="flex items-center">
                                                    <div
                                                        className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-2"
                                                        style={{width: '200px'}}>
                                                        <div
                                                            className="bg-green-600 h-2.5 rounded-full"
                                                            style={{
                                                                width: `${(parseInt(selectedAppelOffre?.closed_task_count) / callOfferTasks?.responseData?.data?.length) * 100}%`,
                                                                transition: 'width 0.3s ease-in-out'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {Math.round((parseInt(selectedAppelOffre?.closed_task_count) / callOfferTasks?.responseData?.data?.length) * 100)}% terminé
                      ({selectedAppelOffre?.closed_task_count}/{callOfferTasks?.responseData?.data?.length} tâches)
                    </span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    N°
                                                </th>
                                                <th scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Tâche
                                                </th>
                                                <th scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Assigné à
                                                </th>
                                                <th scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Date fin
                                                </th>
                                                <th scope="col"
                                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Terminé
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody
                                                className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {callOfferTasks?.responseData?.data?.map((tache: any, index: number) => (
                                                <tr key={tache.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-white">
                                                        {tache.title}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        {tache.assigned_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        {new Date(tache.end_date).toLocaleDateString()}

                                                        <div>
                                                            {tache.end_date && tache.closed_at ? (
                                                                <div className="flex flex-col">
                            <span
                                className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Terminé
                            </span>
                                                                    <span className="text-xs text-gray-500 mt-1">
                              Le {new Date(tache.closed_at).toLocaleDateString()}
                            </span>
                                                                </div>
                                                            ) : (
                                                                <span
                                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                        new Date(tache.end_date) < new Date()
                                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                    }`}>
                            {new Date(tache.end_date) < new Date() ? 'En retard' :
                                `${Math.ceil((new Date(tache.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}j`}
                          </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                        <div className="inline-flex space-x-2">
                                                            <button
                                                                onClick={() => handleEditTache(tache)}
                                                                className="p-2 rounded-lg bg-gray-100/70 hover:bg-gray-200/70 dark:bg-gray-700/50 dark:hover:bg-gray-600/70 transition-colors"
                                                                title="Modifier"
                                                            >
                                                                <Edit
                                                                    className="h-5 w-5 text-gray-700 dark:text-gray-200"/>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTask(tache.id)}
                                                                className="p-2 rounded-lg bg-red-50/70 hover:bg-red-100/70 dark:bg-red-900/30 dark:hover:bg-red-800/50 transition-colors"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2
                                                                    className="h-5 w-5 text-red-600 dark:text-red-400"/>
                                                            </button>
                                                            {isTaskClosed(tache) ? null :<input
                                                                type="checkbox"
                                                                checked={isTaskClosed(tache)}
                                                                onChange={() => {
                                                                    updateCallOfferTask({
                                                                        id: tache.id,
                                                                        closed_at: isTaskClosed(tache)
                                                                            ? null
                                                                            : format(new Date(), 'yyyy/MM/dd HH:mm:ss')
                                                                    })
                                                                }}
                                                                className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-2"
                                                            />}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                        {!callOfferTasks?.responseData?.data?.length && (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                Aucune tâche n'a été ajoutée pour le moment.
                                            </div>
                                        )}
                                    </div>

                                    {/* Modal d'ajout de tâche */}
                                    {showTacheForm === "add" || showTacheForm === "edit" ? (
                                        <div
                                            className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                                            <div
                                                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                                        {showTacheForm === "edit" ? 'Modifier la tâche' : 'Nouvelle tâche'}
                                                    </h3>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowTacheForm(null)
                                                            setNouvelleTache(emptyTaskItem)
                                                        }}
                                                        className="text-gray-400 hover:text-gray-500"
                                                    >
                                                        <X className="h-6 w-6"/>
                                                    </button>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label htmlFor="description"
                                                               className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Description de la tâche *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="description"
                                                            value={nouvelleTache.title}
                                                            onChange={(e) => setNouvelleTache({
                                                                ...nouvelleTache,
                                                                title: e.target.value
                                                            })}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="assigneA"
                                                               className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Assigné à *
                                                        </label>
                                                        <select
                                                            name="assigned_to"
                                                            value={nouvelleTache.assigned_to}
                                                            onChange={(e) => setNouvelleTache({
                                                                ...nouvelleTache,
                                                                assigned_to: e.target.value
                                                            })}
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            required
                                                        >
                                                            <option
                                                                value="">{isGettingUsers ? "Chargement..." : ""}</option>
                                                            {users?.responseData?.data?.map((user: any) => <option
                                                                key={user?.id}
                                                                value={user?.id}>{user?.name}</option>)}
                                                        </select>

                                                    </div>
                                                    <div>
                                                        <label htmlFor="dateFin"
                                                               className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Date de fin *
                                                        </label>
                                                        <input
                                                            type="date"
                                                            id="end_date"
                                                            value={nouvelleTache.end_date}
                                                            onChange={(e) => setNouvelleTache({
                                                                ...nouvelleTache,
                                                                end_date: e.target.value
                                                            })}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex justify-end space-x-3 pt-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowTacheForm(null)
                                                                setNouvelleTache(emptyTaskItem)
                                                            }}
                                                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                                        >
                                                            Annuler
                                                        </button>
                                                        <button
                                                            disabled={isUpdatingTask || isAddingTask}
                                                            type="button"
                                                            onClick={() => handleSubmitTache()}
                                                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        >
                                                            {isUpdatingTask || isAddingTask ? <RefreshCcwIcon className="animate-spin" /> : showTacheForm === "edit" ? 'Mettre à jour' : 'Enregistrer'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            {detailsActiveTab === 'details' && (
                                <button
                                    onClick={() => {
                                        handleEditAppelOffre(selectedAppelOffre);
                                    }}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                    <Edit className="h-6 w-6 mr-2"/>
                                    Modifier
                                </button>
                            )}

                            <button
                                onClick={() => setIsModalOpen(null)}
                                className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

        </div>


    );
};

export default AppelsOffresPage;
