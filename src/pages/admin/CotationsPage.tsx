import React, {useState, useEffect, useRef} from 'react';
import {
    Trash2,
    Eye,
    XCircle,
    X,
    Edit,
    Search, ClipboardEditIcon, RefreshCcwIcon
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {Bar, Pie} from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement,
    PointElement,
    Chart
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {
    UseAddCotation,
    UseUpdateCotation,
    UseGetCotations,
    UseGetPartners,
    UseGetServices,
    UseGetUsers
} from "../../services";
import AppToast from "../../utils/AppToast.ts";

// Enregistrer les composants nécessaires de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
);

// Créer une instance personnalisée de SweetAlert2
const MySwal = withReactContent(Swal);

// Fonction pour obtenir le thème actuel
const getTheme = (): keyof typeof swalThemes => {
    if (typeof window === 'undefined') return 'dark';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

const regimeData = [
    {
        id: "Exonération Totale",
    },
    {
        id: "Exonération Partielle",
    },
    {
        id: "TVA Pleine",
    }
]

const typeDataSelect = [
    {
        id: "Import",
    },
    {
        id: "Export",
    },
    {
        id: "Domestique",
    }
]

const modeDataSelect = [
    {
        id: "Aérien",
    },
    {
        id: "Maritime",
    },
    {
        id: "Routier",
    },
    {
        id: "Autre",
    }
]

const statusDataSelect = [
    {
        id: "1",
        title: "À faire"
    },
    {
        id: "2",
        title: "En cours"
    },
    {
        id: "3",
        title: "En attente"
    },
    {
        id: "4",
        title: "Envoyée"
    },
    {
        id: "5",
        title: "Gagnée"
    },
    {
        id: "0",
        title: "Annulée"
    },
]

const statusDataKeys = {
    "0": "Annulée",
    "1": "À faire",
    "2": "En cours",
    "3": "En attente",
    "4": "Envoyée",
    "5": "Gagnée",
}


// Configuration des thèmes
const swalThemes = {
    light: {
        background: '#ffffff',
        text: '#1a1a1a',
        confirmButton: '#d33',
        cancelButton: '#6b7280',
    },
    dark: {
        background: '#1f2937',
        text: '#f3f4f6',
        confirmButton: '#ef4444',
        cancelButton: '#4b5563',
    },
};

type ModeTransport = 'aerien' | 'maritime' | 'routier' | 'autre';
type Statut = 'todo' | 'pending' | 'en_attente' | 'envoyee' | 'annulee' | 'gagne';

interface Cotation {
    id: string;
    numero: string;
    partner_id: string;
    partner_title: string;
    regime: string;
    service_id: string;
    service_title: string;
    type: string;
    transportation_mode: string;
    reception_date: Date;
    updated_at: Date;
    created_at: Date;
    sale_price: number;
    buy_price: number;
    comment: string;
    ref: string;
    status: string;
    managed_by: string;
    manager_name: string;
    created_by: string;
}

const emptyItem = {
    numero: '',
    client: '',
    regime: 'exo_total',
    services: '',
    type: 'import',
    mode: 'maritime',
    dateReception: new Date(),
    vente: 0,
    achat: 0,
    commentaire: '',
    reference: '',
    utilisateur: ''
}

const CotationsPage: React.FC = () => {
    // Fonction utilitaire pour formater les nombres avec séparateurs de milliers
    const formatNumber = (num: number): string => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const theme = getTheme()
    const [activeTab, setActiveTab] = useState<'statistiques' | 'analyse' | 'base'>('base');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const years = Array.from(
        {length: 5},
        (_, i) => new Date().getFullYear() - i
    );
    const [filteredCotations, setFilteredCotations] = useState<Cotation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [userFilter, setUserFilter] = useState<string>('all');
    const [serviceFilter, setServiceFilter] = useState<string>('');
    const [activeSeries, setActiveSeries] = useState<Record<string, boolean>>({
        '0': true,
        '1': true,
        '2': true,
        '3': true,
        '4': true,
        '5': true,
    });
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [monthFilter, setMonthFilter] = useState<string>(new Date().getMonth().toString());
    const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
    const [dateRange, setDateRange] = useState<{ start: string, end: string }>({start: '', end: ''});

    // État pour le formulaire
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedCotation, setSelectedCotation] = useState<Cotation | null>(null);
    const [statusHistory, setStatusHistory] = useState<{ statut: string, date: string, jours: number }[]>([]);
    const [newStatus, setNewStatus] = useState<Statut>('todo');
    const [statusDate, setStatusDate] = useState('');
    const [cancelData, setCancelData] = useState({date: '', raison: ''});


    const [isModalOpen, setIsModalOpen] = useState<"add" | "edit" | "detail" | null>(null);
    const [formData, setFormData] = useState<any>(emptyItem);

    const {data: services, isLoading: isGettingServices} = UseGetServices({noPermission: 1})
    const {data: partners, isLoading: isGettingPartners} = UseGetPartners({noPermission: 1})
    const {data: users, isLoading: isGettingUsers} = UseGetUsers({noPermission: 1})
    const {
        data: cotations,
        isLoading: isGettingCotations,
        isRefetching: isReGettingCotations,
        refetch: reGetCotations
    } = UseGetCotations({format: "stats"})

    const {isPending: isAdding, mutate: addCotation, data: addResult} = UseAddCotation()
    const {isPending: isUpdating, mutate: updateCotation, data: updateResult} = UseUpdateCotation()


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const {name, value, type} = e.target as HTMLInputElement;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number'
                ? parseFloat(value) || 0
                : value
        }));
    };

    const calculateProcessingTime = (cotation: Cotation) => {
        // const lastDate = cotation.status === 'annulee' && cotation.dateAnnulation ?
        //     new Date(cotation.dateAnnulation) :
        //     cotation.statut === 'envoyee' && cotation.dateSoumissionClient ?
        //         new Date(cotation.dateSoumissionClient) :
        //         cotation.statut === 'en_attente' && cotation.dateSoumissionValidation ?
        //             new Date(cotation.dateSoumissionValidation) :
        //             new Date();
        const lastDate = cotation.updated_at ?
            new Date(cotation.updated_at) :
            new Date();
        const receptionDate = new Date(cotation.reception_date);
        const diffTime = Math.abs(lastDate.getTime() - receptionDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convertir en jours
    };

    // Fonction pour filtrer les cotations par année
    const getCotationsByYear = (year: number) => {
        return filteredCotations?.filter(cotation => {
            const date = new Date(cotation.reception_date);
            return date.getFullYear() === year;
        });
    };

    // Comptage des statuts pour le graphique circulaire
    const getStatusStats = () => {
        const statusCounts = {
            "0": 0,
            "1": 0,
            "2": 0,
            "3": 0,
            "4": 0,
            "5": 0
        };

        const cotationsAnnee = getCotationsByYear(selectedYear);

        cotationsAnnee.forEach(cotation => {
            statusCounts[`${cotation.status}`]++;
        });

        return statusCounts;
    };

    // Compter les cotations par client pour l'année sélectionnée
    const getTopClients = () => {
        const clientCounts: Record<string, number> = {};

        // Filtrer d'abord les cotations par année sélectionnée
        const cotationsAnnee = getCotationsByYear(selectedYear);

        // Compter les cotations par client
        cotationsAnnee.forEach(cotation => {
            if (cotation.partner_title) {
                clientCounts[cotation.partner_title] = (clientCounts[cotation.partner_title] || 0) + 1;
            }
        });

        // Trier les clients par nombre de cotations (du plus élevé au plus bas)
        return Object.entries(clientCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Prendre les 5 premiers
    };

    // Données pour l'histogramme des meilleurs clients
    const topClients = getTopClients();
    const clientsData = {
        labels: topClients.map(([client]) => client),
        datasets: [{
            label: 'Nombre de cotations',
            data: topClients.map(([_, count]) => count),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 1,
            hoverBackgroundColor: 'rgba(29, 100, 216, 0.9)',
            hoverBorderColor: '#ffffff',
            hoverBorderWidth: 2
        }]
    };

    const clientsOptions = {
        responsive: true,
        maintainAspectRatio: false,
        backgroundColor: 'transparent',
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: '',
                color: '#ffffff',
                font: {
                    size: 14,
                    weight: 'bold'
                },
                padding: {
                    bottom: 10
                }
            },
            datalabels: {
                color: '#ffffff',
                font: {
                    weight: 'bold',
                    size: 12
                },
                anchor: 'end',
                align: 'top',
                formatter: (value: number) => value > 0 ? value : ''
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function (context: any) {
                        return `Cotations: ${context.raw}`;
                    },
                    labelColor: function () {
                        return {
                            borderColor: 'transparent',
                            backgroundColor: 'transparent'
                        };
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#ffffff',
                    stepSize: 1,
                    font: {
                        weight: '500'
                    }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                    borderDash: [5, 5]
                },
                border: {
                    dash: [4, 4],
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            x: {
                ticks: {
                    color: '#ffffff',
                    font: {
                        weight: '500'
                    }
                },
                grid: {
                    display: false
                }
            }
        }
    };

    // Compter les cotations par type pour une année donnée
    const getTypeStats = (year: number) => {
        const typeCounts = {
            import: 0,
            export: 0,
            domestique: 0
        };

        filteredCotations?.forEach(cotation => {
            const cotationYear = new Date(cotation.reception_date).getFullYear();
            const type = cotation.type?.toLowerCase()
            if (cotationYear === year && (type === 'import' || type === 'export' || type === 'domestique')) {
                typeCounts[type]++;
            }
        });

        return typeCounts;
    };

    // Interface pour les statistiques de transport
    interface TransportStats {
        mode: ModeTransport;
        totalVente: number;
        totalAchat: number;
        marge: number;
        margePourcentage: number;
        count: number;
    }

    // Obtenir les statistiques financières par mode de transport
    const getTransportStats = (): TransportStats[] => {
        const stats: any = {}

        filteredCotations?.forEach(cotation => {
            const mode = cotation.transportation_mode;
            if (stats[mode]) {
                stats[mode].totalVente += cotation?.sale_price || 0;
                stats[mode].totalAchat += cotation?.buy_price || 0;
                stats[mode].count++;
            } else {
                stats[mode] = {
                    totalVente: cotation?.sale_price || 0,
                    totalAchat: cotation?.buy_price || 0,
                    count: 1,
                }
            }

        });

        return Object.entries(stats).map(([mode, data]) => ({
            mode: mode,
            totalVente: data.totalVente,
            totalAchat: data.totalAchat,
            marge: data.totalVente - data.totalAchat,
            margePourcentage: data.totalVente > 0
                ? ((data.totalVente - data.totalAchat) / data.totalVente) * 100
                : 0,
            count: data.count
        })).filter(item => item.count > 0); // Ne retourner que les modes avec des données
    };

    // Création d'un dégradé pour l'arrière-plan
    const createGradient = (ctx: any, color1: string, color2: string) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
    };

    // Fonction pour obtenir les données mensuelles par statut
    const getMonthlyStatsByStatus = (cotationsList: Cotation[], year: number) => {
        // Initialiser les données pour chaque mois (0-11 pour janvier à décembre)
        const monthsData = Array(12).fill(0).map(() => ({
            "0": 0,
            "1": 0,
            "2": 0,
            "3": 0,
            "4": 0,
            "5": 0
        }));

        // Formater les mois pour l'affichage
        const monthLabels = [
            'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
            'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
        ];

        // Filtrer les cotations pour l'année sélectionnée
        const yearlyCotations = cotationsList.filter(cotation => {
            const date = new Date(cotation.reception_date);
            return date.getFullYear() === year;
        });

        // Compter les cotations par statut et par mois
        yearlyCotations.forEach(cotation => {
            const date = new Date(cotation.reception_date);
            const month = date.getMonth(); // 0-11
            const status = cotation.status?.toString();

            // Incrémenter le compteur pour le statut correspondant
            if (status in monthsData[month]) {
                monthsData[month][status]++;
            }
        });

        // Créer les tableaux de données pour chaque statut
        const todoData = monthsData.map(m => m["1"]);
        const pendingData = monthsData.map(m => m["2"]);
        const enAttenteData = monthsData.map(m => m["3"]);
        const envoyeeData = monthsData.map(m => m["4"]);
        const gagneData = monthsData.map(m => m["5"]);
        const annuleeData = monthsData.map(m => m["0"]);

        return {
            monthLabels,
            todoData,
            pendingData,
            enAttenteData,
            envoyeeData,
            annuleeData,
            gagneData
        };
    };

    // Données pour le graphique
    const monthlyData = (canvas: any) => {
        const ctx = canvas.getContext('2d');

        // Filtrer les cotations pour l'année sélectionnée
        const yearlyFilteredCotations = filteredCotations.filter(cotation => {
            return new Date(cotation.reception_date).getFullYear() === selectedYear;
        });

        const {
            monthLabels,
            todoData,
            pendingData,
            enAttenteData,
            envoyeeData,
            annuleeData
        } = getMonthlyStatsByStatus(yearlyFilteredCotations, selectedYear);

        return {
            labels: monthLabels,
            datasets: [
                {
                    label: statusDataKeys["1"],
                    data: todoData,
                    borderColor: 'rgba(156, 163, 175, 1)',
                    backgroundColor: createGradient(ctx, 'rgba(156, 163, 175, 0.4)', 'rgba(156, 163, 175, 0.05)'),
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(156, 163, 175, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(156, 163, 175, 1)',
                    pointHoverBorderWidth: 2,
                    pointHitRadius: 10,
                    pointBorderWidth: 2,
                    shadowColor: 'rgba(156, 163, 175, 0.5)',
                    shadowBlur: 15,
                    shadowOffsetX: 0,
                    shadowOffsetY: 10,
                    hidden: !activeSeries['1']
                },
                {
                    label: statusDataKeys["2"],
                    data: pendingData,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: createGradient(ctx, 'rgba(59, 130, 246, 0.4)', 'rgba(59, 130, 246, 0.05)'),
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
                    pointHoverBorderWidth: 2,
                    pointHitRadius: 10,
                    pointBorderWidth: 2,
                    shadowColor: 'rgba(59, 130, 246, 0.5)',
                    shadowBlur: 15,
                    shadowOffsetX: 0,
                    shadowOffsetY: 10,
                    hidden: !activeSeries['2']
                },
                {
                    label: statusDataKeys["3"],
                    data: enAttenteData,
                    borderColor: 'rgba(245, 158, 11, 1)',
                    backgroundColor: createGradient(ctx, 'rgba(245, 158, 11, 0.4)', 'rgba(245, 158, 11, 0.05)'),
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(245, 158, 11, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(245, 158, 11, 1)',
                    pointHoverBorderWidth: 2,
                    pointHitRadius: 10,
                    pointBorderWidth: 2,
                    shadowColor: 'rgba(245, 158, 11, 0.5)',
                    shadowBlur: 15,
                    shadowOffsetX: 0,
                    shadowOffsetY: 10,
                    hidden: !activeSeries['3']
                },
                {
                    label: statusDataKeys["4"],
                    data: envoyeeData,
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: createGradient(ctx, 'rgba(16, 185, 129, 0.4)', 'rgba(16, 185, 129, 0.05)'),
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(16, 185, 129, 1)',
                    pointHoverBorderWidth: 2,
                    pointHitRadius: 10,
                    pointBorderWidth: 2,
                    shadowColor: 'rgba(16, 185, 129, 0.5)',
                    shadowBlur: 15,
                    shadowOffsetX: 0,
                    shadowOffsetY: 10,
                    hidden: !activeSeries['4']
                },
                {
                    label: statusDataKeys["5"],
                    data: todoData,
                    borderColor: 'rgba(156, 163, 175, 1)',
                    backgroundColor: createGradient(ctx, 'rgba(18,64,26,0.4)', 'rgba(15,53,11,0.05)'),
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(156, 163, 175, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(156, 163, 175, 1)',
                    pointHoverBorderWidth: 2,
                    pointHitRadius: 10,
                    pointBorderWidth: 2,
                    shadowColor: 'rgba(64,80,31,0.5)',
                    shadowBlur: 15,
                    shadowOffsetX: 0,
                    shadowOffsetY: 10,
                    hidden: !activeSeries['5']
                },
                {
                    label: statusDataKeys["0"],
                    data: annuleeData,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: createGradient(ctx, 'rgba(239, 68, 68, 0.4)', 'rgba(239, 68, 68, 0.05)'),
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(239, 68, 68, 1)',
                    pointHoverBorderWidth: 2,
                    pointHitRadius: 10,
                    pointBorderWidth: 2,
                    shadowColor: 'rgba(239, 68, 68, 0.5)',
                    shadowBlur: 15,
                    shadowOffsetX: 0,
                    shadowOffsetY: 10,
                    hidden: !activeSeries['0']
                }
            ]
        };
    };

    // Gestion du clic sur un élément de la légende
    const toggleSeries = (label: string) => {
        setActiveSeries(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    // Compter le nombre total de cotations par statut pour l'année sélectionnée
    const getStatusCounts = () => {
        const counts = {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0
        };

        filteredCotations.forEach(cotation => {
            const cotationYear = new Date(cotation.reception_date).getFullYear();
            if (cotationYear === selectedYear) {
                switch (cotation.status?.toString()) {
                    case '0':
                        counts['0']++;
                        break;
                    case '1':
                        counts['1']++;
                        break;
                    case '2':
                        counts['2']++;
                        break;
                    case '3':
                        counts['3']++;
                        break;
                    case '4':
                        counts['4']++;
                        break;
                    case '5':
                        counts['5']++;
                        break;
                }
            }
        });

        return counts;
    };

    const statusCounts = getStatusCounts();

    // Options du graphique analytique moderne
    const monthlyOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        backgroundColor: 'transparent',
        layout: {
            padding: {
                top: 20,
                bottom: 40,
                left: 20,
                right: 20
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: false, // On désactive la légende par défaut de Chart.js
                container: '#chart-legend', // On spécifie le conteneur personnalisé
                fullSize: false,
                labels: {
                    color: '#9CA3AF',
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 8,
                    boxHeight: 8
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#F9FAFB',
                bodyColor: '#E5E7EB',
                borderColor: 'rgba(75, 85, 99, 0.5)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                usePointStyle: true,
                callbacks: {
                    label: function (context: any) {
                        const label = context.dataset.label || '';
                        const value = context.raw;
                        return ` ${label}: ${value} cotations`;
                    },
                    labelColor: function () {
                        return {
                            borderColor: 'transparent',
                            backgroundColor: 'transparent'
                        };
                    }
                }
            },
            datalabels: {
                display: function (context: any) {
                    // Afficher uniquement les points avec une valeur > 0
                    return context.dataset.data[context.dataIndex] > 0;
                },
                color: '#ffffff',
                font: {
                    weight: 'bold',
                    size: 10
                },
                anchor: 'end',
                align: 'top',
                offset: -30, // Augmenter l'offset pour plus d'espace
                padding: {
                    top: -20, // Ajout d'un padding en haut
                    bottom: 0,
                    left: 0,
                    right: 0
                },
                clip: false
            },
            crosshair: {
                line: {
                    color: 'rgba(156, 163, 175, 0.3)',
                    width: 1,
                    dash: [4, 4]
                },
                sync: {
                    enabled: false
                },
                zoom: {
                    enabled: false
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(75, 85, 99, 0.2)',
                    borderDash: [4, 4],
                    drawBorder: false,
                },
                ticks: {
                    color: '#9CA3AF',
                    font: {
                        size: 11,
                        weight: '500'
                    },
                    padding: 8,
                    callback: function (value: any) {
                        return value % 10 === 0 ? value : '';
                    }
                },
                border: {
                    display: false
                }
            },
            x: {
                grid: {
                    display: false,
                    drawBorder: false
                },
                ticks: {
                    color: '#9CA3AF',
                    font: {
                        size: 11,
                        weight: '500'
                    },
                    padding: 10
                },
                border: {
                    display: false
                }
            }
        },
        elements: {
            line: {
                tension: 0.4,
                borderWidth: 2
            },
            point: {
                radius: 3,
                hoverRadius: 6,
                hoverBorderWidth: 2,
                backgroundColor: function (context: any) {
                    return context.dataset.borderColor;
                },
                borderColor: '#fff',
                borderWidth: 2
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        },
        transitions: {
            show: {
                animations: {
                    x: {
                        from: 0
                    },
                    y: {
                        from: 0
                    }
                }
            },
            hide: {
                animations: {
                    x: {
                        to: 0
                    },
                    y: {
                        to: 0
                    }
                }
            }
        }
    };

    // Création d'un composant Canvas pour le rendu du graphique
    const ChartCanvas = ({data, options}: { data: any, options: any }) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const chartRef = useRef<any>(null);
        const legendContainerRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    // Détruire le graphique existant s'il y en a un
                    if (chartRef.current) {
                        chartRef.current.destroy();
                    }

                    // Créer un nouveau graphique
                    chartRef.current = new Chart(ctx, {
                        type: 'line',
                        data: data(ctx.canvas),
                        options: options
                    });
                }
            }

            // Nettoyage lors du démontage
            return () => {
                if (chartRef.current) {
                    chartRef.current.destroy();
                }
            };
        }, [data, options]);

        return (
            <>
                <div ref={legendContainerRef} id="chart-legend" className="mb-2"></div>
                <canvas ref={canvasRef} style={{width: '100%', height: 'calc(100% - 2rem)'}}/>
            </>
        );
    };

    // Données pour le graphique circulaire des types
    const typeStats = getTypeStats(selectedYear);
    const typeData = {
        labels: ['Import', 'Export', 'Domestique'],
        datasets: [{
            data: [
                typeStats.import,
                typeStats.export,
                typeStats.domestique
            ],
            backgroundColor: [
                'rgba(59, 130, 246, 0.7)',    // bleu pour Import
                'rgba(16, 185, 129, 0.7)',    // vert pour Export
                'rgba(139, 92, 246, 0.7)'     // violet pour Domestique
            ],
            borderColor: [
                'rgba(59, 130, 246, 1)',
                'rgba(16, 185, 129, 1)',
                'rgba(139, 92, 246, 1)'
            ],
            borderWidth: 1
        }]
    };

    const typeOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        backgroundColor: 'transparent',
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: '#ffffff',
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    padding: 15
                }
            },
            title: {
                display: true,
                text: '',
                color: '#ffffff',
                font: {
                    size: 14,
                    weight: 'bold'
                },
                padding: {
                    bottom: 10
                }
            },
            tooltip: {
                backgroundColor: '#ffffff',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#ffffff',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    label: function (context: any) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${!isNaN(percentage) ? percentage : 0}%)`;
                    },
                    labelColor: function () {
                        return {
                            borderColor: 'transparent',
                            backgroundColor: 'transparent'
                        };
                    }
                }
            },
            datalabels: {
                formatter: (value: number) => {
                    const total = typeData.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return value > 0 ? `${percentage}%` : '';
                },
                color: '#ffffff',
                font: {
                    weight: 'bold' as const,
                    size: 12
                },
                textShadowBlur: 10,
                textShadowColor: 'rgba(0, 0, 0, 0.8)'
            }
        }
    };

    // Données pour le graphique circulaire des statuts
    const statusStats = getStatusStats();
    const statusData = {
        labels: ['À faire', 'En attente client', 'En attente validation', 'Envoyée', 'Annulée', 'Gagnée'],
        datasets: [{
            data: [statusStats["1"], statusStats["2"], statusStats["3"], statusStats["4"], statusStats["0"], statusStats["5"]],
            backgroundColor: [
                'rgba(107, 114, 128, 0.7)',    // gris pour À faire
                'rgba(59, 130, 246, 0.7)',     // bleu pour En attente client
                'rgba(245, 158, 11, 0.7)',     // jaune pour En attente validation
                'rgba(16, 185, 129, 0.7)',     // vert pour Envoyée
                'rgba(239, 68, 68, 0.7)',       // rouge pour Annulée
                'rgba(32,57,12,0.7)'       // rouge pour Gagnée
            ],
            borderColor: [
                'rgba(107, 114, 128, 1)',
                'rgba(59, 130, 246, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(16, 185, 129, 1)',
                'rgba(239, 68, 68, 1)',
                'rgba(32,57,12,0.7)'
            ],
            borderWidth: 1
        }]
    };

    const statusOptions = {
        responsive: true,
        maintainAspectRatio: false,
        backgroundColor: 'transparent',
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: '#ffffff',
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    padding: 15
                }
            },
            tooltip: {
                backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                titleColor: theme === 'dark' ? '#ffffff' : '#1f2937',
                bodyColor: theme === 'dark' ? '#e5e7eb' : '#4b5563',
                borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    label: function (context: any) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                    },
                    labelColor: function () {
                        return {
                            borderColor: 'transparent',
                            backgroundColor: 'transparent'
                        };
                    }
                }
            },
            datalabels: {
                formatter: (value: number) => {
                    const total = statusData.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return value > 0 ? `${percentage}%` : '';
                },
                color: '#ffffff',
                font: {
                    weight: 'bold' as const,
                    size: 12
                },
                textShadowBlur: 10,
                textShadowColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'
            }
        }
    };


    useEffect(() => {
        let result = cotations?.responseData?.data?.items?.length ? cotations?.responseData?.data?.items : [];

        // Trier par date de réception (du plus récent au plus ancien)
        result.sort((a, b) => new Date(b?.reception_date).getTime() - new Date(a?.reception_date).getTime());

        // Appliquer le filtre de statut
        if (statusFilter !== 'all') {
            result = result.filter(cotation => cotation?.status?.toString() === statusFilter);
        }

        // Appliquer le filtre par utilisateur
        if (userFilter && userFilter !== 'all') {
            result = result.filter(cotation => cotation?.managed_by?.toString() === userFilter?.toString());
        }

        // Appliquer le filtre par service
        if (serviceFilter) {
            result = result.filter(cotation => cotation.service_id?.toString() === serviceFilter?.toString())
        }

        // Appliquer le filtre de date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === 'today') {
            result = result.filter(cotation =>
                new Date(cotation?.reception_date).toDateString() === today.toDateString()
            );
        } else if (dateFilter === 'week') {
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            result = result.filter(cotation =>
                new Date(cotation?.reception_date) >= lastWeek
            );
        } else if (dateFilter === 'month') {
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            result = result.filter(cotation =>
                new Date(cotation?.reception_date) >= firstDayOfMonth
            );
        } else if (dateFilter === 'specific-month') {
            const month = parseInt(monthFilter);
            const year = parseInt(yearFilter);
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            endDate.setHours(23, 59, 59, 999);

            result = result.filter(cotation => {
                const cotationDate = new Date(cotation.reception_date);
                return cotationDate >= startDate && cotationDate <= endDate;
            });
        } else if (dateFilter === 'specific-year') {
            const year = parseInt(yearFilter);
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

            result = result.filter(cotation => {
                const cotationDate = new Date(cotation.reception_date);
                return cotationDate >= startDate && cotationDate <= endDate;
            });
        } else if (dateFilter === 'custom-range' && dateRange.start && dateRange.end) {
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);

            result = result.filter(cotation => {
                const cotationDate = new Date(cotation.reception_date);
                return cotationDate >= startDate && cotationDate <= endDate;
            });
        }

        // Appliquer la recherche
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(cotation =>
                cotation?.numero?.toLowerCase().includes(term) ||
                cotation?.partner_title?.toLowerCase().includes(term) ||
                cotation?.ref?.toLowerCase().includes(term) ||
                cotation?.service_title?.toLowerCase().includes(term)
            );
        }

        setFilteredCotations(result);
    }, [cotations, searchTerm, statusFilter, dateFilter, monthFilter, yearFilter, dateRange, userFilter, serviceFilter]);


    const deleteCotation = async (id: string) => {
        const themeConfig = swalThemes[theme];
        const result = await MySwal.fire({
            title: 'Êtes-vous sûr ?',
            text: 'Voulez-vous vraiment supprimer cette cotation ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: themeConfig.confirmButton,
            cancelButtonColor: themeConfig.cancelButton,
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler',
            background: themeConfig.background,
            color: themeConfig.text,
            customClass: {
                popup: 'dark:bg-gray-800',
                title: 'dark:text-white',
                htmlContainer: 'dark:text-gray-300',
                confirmButton: 'dark:bg-red-600 dark:hover:bg-red-700',
                cancelButton: 'dark:bg-gray-600 dark:hover:bg-gray-500',
            },
        });

        if (result.isConfirmed) {
            //setCotations(cotations.filter(c => c.id !== id));

        }
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setNewStatus(e.target.value as Statut);
    };

    const handleStatusSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCotation && statusDate) {

            setShowStatusModal(false);
            setStatusDate('');
        }
    };

    const openStatusModal = (cotation: Cotation) => {
        setSelectedCotation(cotation);

        // Créer l'historique des statuts
        const history = [];
        const creationDate = new Date(cotation.reception_date);

        // Date de création
        history.push({
            statut: 'Création',
            date: creationDate.toLocaleDateString('fr-FR'),
            jours: 0
        });

        // Autres dates de statut
        if (cotation.dateSoumissionValidation) {
            const date = new Date(cotation.dateSoumissionValidation);
            history.push({
                statut: 'En attente de validation',
                date: date.toLocaleDateString('fr-FR'),
                jours: Math.ceil((date.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
            });
        }

        if (cotation.dateSoumissionClient) {
            const date = new Date(cotation.dateSoumissionClient);
            history.push({
                statut: 'Envoyée au client',
                date: date.toLocaleDateString('fr-FR'),
                jours: Math.ceil((date.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
            });
        }

        if (cotation.dateAnnulation) {
            const date = new Date(cotation.dateAnnulation);
            history.push({
                statut: 'Annulée',
                date: date.toLocaleDateString('fr-FR'),
                jours: Math.ceil((date.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24)),
                raison: cotation.raisonAnnulation
            });
        }

        setStatusHistory(history);
        setNewStatus(cotation.status);
        setShowStatusModal(true);
    };


    const getStatutBadge = (statut: string) => {
        const statutClasses = {
            "1": 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white text-[9.199px]',
            "2": 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-[9.199px]',
            "5": 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100  text-[9.199px]',
            "3": 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 text-[9.199px]',
            "4": 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-[9.199px]',
            "0": 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 text-[9.199px]'
        };
        return (
            <span className={`px-3 py-1 text-sm rounded-full ${statutClasses[statut]}`}>
        {statusDataKeys[statut]}
      </span>
        );
    };

    useEffect(() => {
        if (addResult) {
            if (addResult?.responseData?.error) {
                AppToast.error(theme === "dark", addResult?.responseData?.message || "Erreur lors de l'enregistrement")
            } else {
                reGetCotations()
                AppToast.success(theme === "dark", 'Cotation ajoutée avec succès')
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
                reGetCotations()
                AppToast.success(theme === "dark", 'Cotation mise a jour avec avec succès')
                setIsModalOpen(null);
                setSelectedCotation(null)
                setFormData(emptyItem);
            }
        }
    }, [updateResult]);


    const handleSubmitCotation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.service_id || !formData.managed_by || !formData.regime || !formData.type || !formData.mode) {
            AppToast.error(theme === "dark", 'Veuillez remplir tous les champs requis');
            return;
        }
        const body = {
            numero: formData?.numero,
            reception_date: formData?.reception_date,
            partner_id: formData?.partner_id,
            service_id: formData?.service_id,
            regime: formData?.regime,
            type: formData?.type,
            transportation_mode: formData?.transportation_mode,
            sale_price: formData?.sale_price,
            buy_price: formData?.buy_price,
            ref: formData?.ref,
            comment: formData?.comment,
            managed_by: formData?.managed_by,
        }
        if (isModalOpen === "add") {
            addCotation(body);
        }
        if (isModalOpen === "edit") {
            updateCotation({
                id: selectedCotation?.id,
                ...body
            })
        }
    };

    const getStatsByUser = () => {
        const userStats: Record<string, {
            total: number;
            import: number;
            export: number;
            domestique: number;
            totalVente: number;
            totalAchat: number;
            marge: number;
            margePourcentage: number;
        }> = {};

        filteredCotations.forEach(cotation => {
            if (!cotation.managed_by) return;

            if (!userStats[cotation.managed_by]) {
                userStats[cotation.managed_by] = {
                    manager_name: cotation.manager_name,
                    total: 0,
                    import: 0,
                    export: 0,
                    domestique: 0,
                    totalVente: 0,
                    totalAchat: 0,
                    marge: 0,
                    margePourcentage: 0
                };
            }

            const type = cotation?.type?.toLowerCase()
            userStats[cotation.managed_by].total++;
            userStats[cotation.managed_by][type] =
                (userStats[cotation.managed_by][type] || 0) + 1;
            userStats[cotation.managed_by].totalVente += parseFloat(`${cotation.sale_price}`) || 0;
            userStats[cotation.managed_by].totalAchat += parseFloat(`${cotation.buy_price}`) || 0;
            userStats[cotation.managed_by].marge = userStats[cotation.managed_by].totalVente - userStats[cotation.managed_by].totalAchat;
            userStats[cotation.managed_by].margePourcentage = userStats[cotation.managed_by].totalVente > 0
                ? (userStats[cotation.managed_by].marge / userStats[cotation.managed_by].totalVente) * 100
                : 0;
        });

        return Object.entries(userStats).map(([managed_by, stats]) => ({
            managed_by,
            ...stats
        }));
    };

    const getServiceStats = () => {
        const serviceStats: Record<string, {
            service_id: string;
            service_title: string;
            totalVente: number;
            totalAchat: number;
            marge: number;
            margePourcentage: number;
            count: number;
        }> = {};

        filteredCotations.forEach(cotation => {
            if (cotation.service_id) {
                const service_id = cotation.service_id
                const service_title = cotation.service_title
                if (!serviceStats[service_id]) {
                    serviceStats[service_id] = {
                        service_id,
                        service_title,
                        totalVente: 0,
                        totalAchat: 0,
                        marge: 0,
                        margePourcentage: 0,
                        count: 0
                    };
                }

                serviceStats[service_id].totalVente += cotation.sale_price || 0;
                serviceStats[service_id].totalAchat += cotation.buy_price || 0;
                serviceStats[service_id].marge = serviceStats[service_id].totalVente - serviceStats[service_id].totalAchat;
                serviceStats[service_id].margePourcentage = serviceStats[service_id].totalVente > 0
                    ? (serviceStats[service_id].marge / serviceStats[service_id].totalVente) * 100
                    : 0;
                serviceStats[service_id].count++;
            }
        });

        return Object.values(serviceStats).sort((a, b) => b.totalVente - a.totalVente);
    };


    const getActionItems = (item: any) => [
        {
            visible: HasPermission(appPermissions.cotation, appOps.read),
            label: 'Voir détails',
            icon: Eye,
            onClick: () => {
                setIsModalOpen("detail");
                setSelectedCotation(item);
            },
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20',
            borderColor: 'border-blue-500/30'
        },
        {
            visible: HasPermission(appPermissions.cotation, appOps.update),
            label: 'Modifier',
            icon: Edit,
            onClick: () => {
                console.log(item);
                setSelectedCotation(item);
                setFormData(item);
                setIsModalOpen("edit");
            },
            color: 'text-green-400',
            bgColor: 'bg-green-500/20',
            borderColor: 'border-green-500/30'
        },
        {
            visible: HasPermission(appPermissions.cotation, appOps.delete),
            label: 'Supprimer',
            icon: Trash2,
            onClick: () => {
                // setShowDeleteConfirm(item.id);
            },
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            borderColor: 'border-red-500/30'
        }
    ];


    return (
        <div className="p-6">

            <div className="flex flex-col sticky top-0 z-10">

                <div className="bg-white dark:bg-gray-900">
                    <AdminPageHeader
                        Icon={<ClipboardEditIcon
                            className={`w-7 h-7 ${
                                theme === 'dark' ? 'text-sky-400' : 'text-sky-600'
                            }`}
                        />}
                        title="Gestion des Cotations"
                        isRefreshing={isGettingCotations || isReGettingCotations}
                        onRefresh={() => reGetCotations()}
                        onAdd={HasPermission(appPermissions.cotation, appOps.create) ? () => {
                            setIsModalOpen("add");
                            setFormData(emptyItem);
                        } : undefined}
                    />
                </div>

                {/* Onglets */}
                <div
                    className="bg-white -mt-6 dark:bg-gray-900 pt-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                    <ul className="flex flex-wrap -mb-px">
                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('statistiques')}
                                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                                    activeTab === 'statistiques'
                                        ? 'text-red-600 border-red-600 dark:text-red-400 dark:border-red-400'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border-transparent hover:border-gray-300 dark:hover:border-gray-200'
                                }`}
                            >
                                Statistiques
                            </button>
                        </li>
                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('analyse')}
                                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                                    activeTab === 'analyse'
                                        ? 'text-red-600 border-red-600 dark:text-red-400 dark:border-red-400'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border-transparent hover:border-gray-300 dark:hover:border-gray-200'
                                }`}
                                aria-current="page"
                            >
                                Analyse
                            </button>
                        </li>
                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('base')}
                                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                                    activeTab === 'base'
                                        ? 'text-red-600 border-red-600 dark:text-red-400 dark:border-red-400'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border-transparent hover:border-gray-300 dark:hover:border-gray-200'
                                }`}
                            >
                                Base de données
                            </button>
                        </li>
                    </ul>
                </div>

            </div>

            {/* Contenu des onglets */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                {activeTab === 'statistiques' && (
                    <div className="p-6">
                        {/* Graphique des cotations par mois */}
                        <div className="mb-8">
                            <div className="bg-white dark:bg-[#111827] p-4 rounded-lg shadow">
                                <div className="flex flex-col">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Cotations par
                                            mois</h2>
                                        <div className="flex items-center">
                                            <div className="flex flex-wrap gap-2 mr-4">
                                                {[
                                                    {label: 'À faire', color: 'bg-gray-400'},
                                                    {label: 'En cours', color: 'bg-blue-500'},
                                                    {label: 'En attente', color: 'bg-yellow-500'},
                                                    {label: 'Envoyée', color: 'bg-green-500'},
                                                    {label: 'Annulée', color: 'bg-red-500'},
                                                    {label: 'Gagnée', color: 'bg-green-500'}
                                                ].map((item) => (
                                                    <div
                                                        key={item.label}
                                                        className={`flex items-center cursor-pointer transition-opacity ${!activeSeries[item.label] ? 'opacity-40' : ''}`}
                                                        onClick={() => toggleSeries(item.label)}
                                                    >
                                                        <span
                                                            className={`w-3 h-3 rounded-full ${item.color} mr-1`}></span>
                                                        <div className="flex items-baseline">
                                                            <span
                                                                className="text-xs text-gray-600 dark:text-gray-300 mr-1">{item.label}</span>
                                                            <span
                                                                className="text-xs text-gray-400 dark:text-gray-500">({statusCounts[item.label]})</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center">
                                                <span
                                                    className="text-sm text-gray-600 dark:text-gray-300 mr-2">Année :</span>
                                                <select
                                                    value={selectedYear}
                                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 h-9"
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
                                </div>
                                <div className="h-80 w-full">
                                    <ChartCanvas
                                        data={monthlyData}
                                        options={monthlyOptions}
                                    />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Statistiques des
                            cotations</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-64">
                                <div className="flex justify-between items-center mb-0">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Répartition par
                                        statut</h3>
                                    <span
                                        className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded">
                    {selectedYear}
                  </span>
                                </div>
                                <div className="h-52">
                                    <Pie data={statusData} options={statusOptions}/>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-64">
                                <div className="flex justify-between items-center mb-0">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Top clients</h3>
                                    <span
                                        className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded">
                    {selectedYear}
                  </span>
                                </div>
                                <div className="h-52">
                                    <Bar data={clientsData} options={clientsOptions}/>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-64">
                                <div className="flex justify-between items-center mb-0">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Répartition par
                                        type</h3>
                                    <span
                                        className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded">
                    {selectedYear}
                  </span>
                                </div>
                                <div className="h-52">
                                    <Pie data={typeData} options={typeOptions}/>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analyse' && (
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Analyse des
                            cotations</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                                <h3 className="font-medium mb-4 text-gray-900 dark:text-white">Chiffre d'affaire par
                                    service</h3>

                                <div className="mt-6 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                        <thead className="bg-gray-100 dark:bg-gray-600">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                Service
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                Ventes
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                Achats
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                Marge
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Marge %
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody
                                            className="bg-white dark:bg-black-900 divide-y divide-black-200 dark:divide-black-600">
                                        {(() => {
                                            const transportStats = getServiceStats();
                                            const totalVente = transportStats.reduce((sum, s) => sum + s.totalVente, 0);
                                            const totalAchat = transportStats.reduce((sum, s) => sum + s.totalAchat, 0);
                                            const totalMarge = totalVente - totalAchat;
                                            const totalMargePourcentage = totalVente > 0 ? (totalMarge / totalVente) * 100 : 0;

                                            return (
                                                <>
                                                    {transportStats.map((stat, index) => (
                                                        <tr key={index}
                                                            className={index % 2 === 0 ? 'bg-white dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-600'}>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                                {stat.service_title}
                                                            </td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                                                                {formatNumber(stat.totalVente)} $
                                                            </td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                                                                {formatNumber(stat.totalAchat)} $
                                                            </td>
                                                            <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-medium ${
                                                                stat.marge >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                            }`}>
                                                                {formatNumber(stat.marge)} $
                                                            </td>
                                                            <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-medium ${
                                                                stat.margePourcentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                            }`}>
                                                                {stat.margePourcentage.toFixed(1)}%
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {/* Ligne de total */}
                                                    <tr className="bg-[#1f2937] font-semibold">
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-white">
                                                            Total
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-white">
                                                            {formatNumber(totalVente)} $
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-white">
                                                            {formatNumber(totalAchat)} $
                                                        </td>
                                                        <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-medium ${
                                                            totalMarge >= 0 ? 'text-green-400' : 'text-red-400'
                                                        }`}>
                                                            {formatNumber(totalMarge)} $
                                                        </td>
                                                        <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-medium ${
                                                            totalMargePourcentage >= 0 ? 'text-green-400' : 'text-red-400'
                                                        }`}>
                                                            {totalMargePourcentage.toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                </>
                                            );
                                        })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                                <h3 className="font-medium mb-4 text-gray-900 dark:text-white">Chiffre d'affaire par
                                    mode</h3>

                                <div className="mt-6 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                        <thead className="bg-gray-100 dark:bg-gray-600">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                Mode
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                Ventes
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                Achats
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                Marge
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Marge %
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody
                                            className="bg-white dark:bg-black-900 divide-y divide-black-200 dark:divide-black-600">
                                        {(() => {
                                            const transportStats = getTransportStats();
                                            const totalVente = transportStats.reduce((sum, s) => sum + s.totalVente, 0);
                                            const totalAchat = transportStats.reduce((sum, s) => sum + s.totalAchat, 0);
                                            const totalMarge = totalVente - totalAchat;
                                            const totalMargePourcentage = totalVente > 0 ? (totalMarge / totalVente) * 100 : 0;

                                            return (
                                                <>
                                                    {transportStats.map((stat, index) => (
                                                        <tr key={index}
                                                            className={index % 2 === 0 ? 'bg-white dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-600'}>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                                {stat.mode}
                                                            </td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                                                                {formatNumber(stat.totalVente)} $
                                                            </td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                                                                {formatNumber(stat.totalAchat)} $
                                                            </td>
                                                            <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-medium ${
                                                                stat.marge >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                            }`}>
                                                                {formatNumber(stat.marge)} $
                                                            </td>
                                                            <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-medium ${
                                                                stat.margePourcentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                            }`}>
                                                                {stat.margePourcentage.toFixed(1)}%
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {/* Ligne de total */}
                                                    <tr className="bg-[#1f2937] font-semibold">
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-white">
                                                            Total
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-white">
                                                            {formatNumber(totalVente)} $
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-white">
                                                            {formatNumber(totalAchat)} $
                                                        </td>
                                                        <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-medium ${
                                                            totalMarge >= 0 ? 'text-green-400' : 'text-red-400'
                                                        }`}>
                                                            {formatNumber(totalMarge)} $
                                                        </td>
                                                        <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-medium ${
                                                            totalMargePourcentage >= 0 ? 'text-green-400' : 'text-red-400'
                                                        }`}>
                                                            {totalMargePourcentage.toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                </>
                                            );
                                        })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8">
                            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Statistiques par
                                utilisateur</h3>
                            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Utilisateur
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Import
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Export
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Domestique
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Vente
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Achat
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Marge
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Marge %
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody
                                            className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {(() => {
                                            const userStats = getStatsByUser();
                                            const totals = userStats.reduce((acc, stat) => ({
                                                total: parseFloat(`${acc.total}`) + stat.total,
                                                import: parseFloat(`${acc.import}`) + (stat.import || 0),
                                                export: parseFloat(`${acc.export}`) + (stat.export || 0),
                                                domestique: parseFloat(`${acc.domestique}`) + (stat.domestique || 0),
                                                totalVente: parseFloat(`${acc.totalVente}`) + parseFloat(stat.totalVente),
                                                totalAchat: parseFloat(`${acc.totalAchat}`) + parseFloat(stat.totalAchat),
                                                marge: parseFloat(`${acc.marge}`) + parseFloat(stat.marge)
                                            }), {
                                                total: 0,
                                                import: 0,
                                                export: 0,
                                                domestique: 0,
                                                totalVente: 0,
                                                totalAchat: 0,
                                                marge: 0
                                            });

                                            return (
                                                <>
                                                    {userStats.map((stat, index) => (
                                                        <tr key={index}
                                                            className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                                {stat.manager_name}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                                {stat.total}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                                {stat.import || 0}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                                {stat.export || 0}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                                {stat.domestique || 0}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                                {formatNumber(stat.totalVente)} $
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                                {formatNumber(stat.totalAchat)} $
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                                {formatNumber(stat.marge)} $
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                                {stat.margePourcentage.toFixed(2)}%
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {/* Ligne de total */}
                                                    <tr className="bg-[#1f2937] font-semibold">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                            Total
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                            {totals.total}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                            {totals.import}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                            {totals.export}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                            {totals.domestique}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                            {formatNumber(totals.totalVente)} $
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                            {formatNumber(totals.totalAchat)} $
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                            {formatNumber(totals.marge)} $
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                            {totals.totalVente > 0 ? ((totals.marge / totals.totalVente) * 100).toFixed(2) + '%' : '0.00%'}
                                                        </td>
                                                    </tr>
                                                </>
                                            );
                                        })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'base' && (
                    <div>
                        <div
                            className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des cotations
                                ({filteredCotations.length})</h2>
                        </div>


                        {activeTab === 'base' && (
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex flex-wrap items-end gap-2 mb-4">
                                    {/* Barre de recherche */}
                                    <div className="relative flex-shrink min-w-[100px] w-100 ">
                                        <div
                                            className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-gray-400"/>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Rechercher..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="block w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Filtre de statut */}
                                    <div className="w-48 flex-shrink-0">
                                        <select
                                            className="block w-full pl-2 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="all">Tous les statuts</option>
                                            {
                                                statusDataSelect?.map((stat) => <option key={stat?.id}
                                                                                        value={stat?.id}>{stat.title}</option>)
                                            }

                                        </select>
                                    </div>

                                    {/* Filtre de date */}
                                    <div className="w-48 flex-shrink-0">
                                        <select
                                            className="block w-full pl-2 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                        >
                                            <option value="all">Toutes les dates</option>
                                            <option value="today">Aujourd'hui</option>
                                            <option value="week">7 derniers jours</option>
                                            <option value="month">Ce mois-ci</option>
                                            <option value="specific-month">Mois spécifique</option>
                                            <option value="specific-year">Année spécifique</option>
                                            <option value="custom-range">Période personnalisée</option>
                                        </select>
                                    </div>

                                    {/* Filtres de date avancés */}
                                    {dateFilter === 'specific-month' && (
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={monthFilter}
                                                onChange={(e) => setMonthFilter(e.target.value)}
                                                className="w-32 pl-2 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                {Array.from({length: 12}, (_, i) => (
                                                    <option key={i} value={i}>
                                                        {new Date(0, i).toLocaleString('fr-FR', {month: 'long'})}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={yearFilter}
                                                onChange={(e) => setYearFilter(e.target.value)}
                                                className="w-32 pl-2 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                {Array.from({length: 5}, (_, i) => {
                                                    const year = new Date().getFullYear() - 2 + i;
                                                    return <option key={year} value={year}>{year}</option>;
                                                })}
                                            </select>
                                        </div>
                                    )}

                                    {dateFilter === 'specific-year' && (
                                        <div className="flex-1">
                                            <select
                                                value={yearFilter}
                                                onChange={(e) => setYearFilter(e.target.value)}
                                                className="w-32 pl-2 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                {Array.from({length: 5}, (_, i) => {
                                                    const year = new Date().getFullYear() - 2 + i;
                                                    return <option key={year} value={year}>{year}</option>;
                                                })}
                                            </select>
                                        </div>
                                    )}

                                    {dateFilter === 'custom-range' && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center">
                                                <span
                                                    className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap mr-1">Du</span>
                                                <input
                                                    type="date"
                                                    value={dateRange.start}
                                                    onChange={(e) => setDateRange({
                                                        ...dateRange,
                                                        start: e.target.value
                                                    })}
                                                    className="w-36 pl-2 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    max={dateRange.end || new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                            <div className="flex items-center">
                                                <span
                                                    className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap mx-1">Au</span>
                                                <input
                                                    type="date"
                                                    value={dateRange.end}
                                                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                                    className="w-36 pl-2 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    min={dateRange.start}
                                                    max={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Filtre par utilisateur */}
                                    <div className="w-48 flex-shrink-0">
                                        <select
                                            className="block w-full pl-2 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={userFilter}
                                            onChange={(e) => setUserFilter(e.target.value)}
                                        >
                                            <option value="all">Tous les utilisateurs</option>
                                            {users?.responseData?.data?.map(user => (
                                                <option key={user?.id} value={user?.id}>{user?.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre par service */}
                                    <div className="w-48 flex-shrink-0">
                                        <select
                                            className="block w-full pl-2 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={serviceFilter}
                                            onChange={(e) => setServiceFilter(e.target.value)}
                                        >
                                            <option value="">Tous les services</option>
                                            {services?.responseData?.data?.map((service: any) => (
                                                <option key={service?.id} value={service?.id}>{service?.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tableau des cotations */}
                        <div className="w-full">
                            <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        N° Cotation
                                    </th>
                                    <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Service
                                    </th>
                                    <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Dates
                                    </th>
                                    <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        TT (j)
                                    </th>
                                    <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Utilisateur
                                    </th>
                                    <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="w-40 px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                                </thead>
                                <tbody
                                    className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredCotations.length === 0 ? (
                                    <tr>
                                        <td colSpan={9}
                                            className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                            Aucune cotation pour le moment
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCotations?.map((cotation) => (
                                        <tr key={cotation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white truncate">
                                                <div className="truncate" title={cotation.numero}>
                                                    {cotation.numero}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                                                <div className="truncate" title={cotation?.partner_title}>
                                                    {cotation?.partner_title}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                                                <div className="truncate" title={cotation?.service_title}>
                                                    {cotation?.service_title}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                                                {cotation.type}
                                            </td>
                                            <td className="px-4 py-3 text-[12px] text-gray-500 dark:text-gray-300">
                                                <div>Reception: {new Date(cotation.reception_date).toLocaleDateString('fr-FR')}</div>
                                                <div className="mt-2"
                                                     title={new Date(cotation.updated_at).toLocaleDateString('fr-FR')}>
                                                    Status: {new Date(cotation.updated_at).toLocaleDateString('fr-FR')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-500 dark:text-gray-300">
                                                {calculateProcessingTime(cotation)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                                                {cotation.manager_name || '-'}
                                            </td>
                                            <td className="px-0 py-0 ">
                                                <div
                                                    className="w-full cursor-pointer hover:opacity-80 transition-opacity flex justify-left"
                                                    onClick={() => openStatusModal(cotation)}
                                                >
                                                    {getStatutBadge(cotation?.status?.toString())}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div
                                                    className="inline-flex w-full flex-wrap items-center justify-end gap-2">

                                                    {getActionItems(cotation)
                                                        .map((action) => {
                                                            return action?.visible ? (<button
                                                                key={action.label}
                                                                type="button"
                                                                onClick={action.onClick}
                                                                className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-xs font-medium ${
                                                                    action.bgColor
                                                                } ${action.borderColor} ${action.color} hover:shadow-md hover:-translate-y-0.5 transition transform duration-150`}
                                                                title={action.label}
                                                            >
                                                                <action.icon className="h-4 w-4"/>
                                                            </button>) : null

                                                        })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>


            {isModalOpen === "add" || isModalOpen === "edit" ? (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div
                            className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {isModalOpen === "edit" ? 'Modifier la cotation' : 'Nouvelle cotation'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(null)}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <XCircle className="h-6 w-6"/>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitCotation}
                              className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">N° Cotation</label>
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
                                <label className="block text-sm font-medium mb-1">Régime</label>
                                <select
                                    name="regime"
                                    value={formData.regime}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value=""></option>
                                    {regimeData.map((regime) => <option key={regime.id}
                                                                        value={regime.id}>{regime.id}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Services</label>
                                <select
                                    name="service_id"
                                    value={formData.service_id}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">{isGettingServices ? "Chargement..." : ""}</option>
                                    {services?.responseData?.data?.map((service: any) => <option
                                        key={service?.id}
                                        value={service?.id}>{service?.title}</option>)}
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
                            <div>
                                <label className="block text-sm font-medium mb-1">Mode de transport</label>
                                <select
                                    name="transportation_mode"
                                    value={formData.transportation_mode}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value=""></option>
                                    {modeDataSelect.map((mode) => <option key={mode.id}
                                                                          value={mode.id}>{mode.id}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date de réception</label>
                                <input
                                    type="date"
                                    id="reception_date"
                                    name="reception_date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={formData.reception_date ? formData.reception_date : ''}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Prix de vente ($)</label>
                                <input
                                    type="number"
                                    name="sale_price"
                                    value={formData.sale_price}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Prix d'achat ($)</label>
                                <input
                                    type="number"
                                    name="buy_price"
                                    value={formData.buy_price}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    step="0.01"
                                    min="0"
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

            {/* Modal de gestion des statuts */}
            {showStatusModal && selectedCotation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Historique des statuts - {selectedCotation.numero}
                                </h3>
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                >
                                    <X className="h-6 w-6"/>
                                </button>
                            </div>

                            <div className="mb-6 overflow-auto max-h-96">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Statut
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Jours écoulés
                                        </th>
                                        {selectedCotation?.status?.toString() === '0' && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Raison
                                            </th>
                                        )}
                                    </tr>
                                    </thead>
                                    <tbody
                                        className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {statusHistory.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {item.statut}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                {item.date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                {item.jours} j
                                            </td>
                                            {selectedCotation.statut === 'annulee' && item.raison && (
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                    {item.raison}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <form onSubmit={handleStatusSubmit}
                                  className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Modifier le
                                    statut</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Nouveau statut
                                        </label>
                                        <select
                                            value={newStatus}
                                            onChange={handleStatusChange}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="todo">À faire</option>
                                            <option value="pending">En attente client</option>
                                            <option value="en_attente">En attente validation</option>
                                            <option value="envoyee">Envoyée</option>
                                            <option value="annulee">Annulée</option>
                                            <option value="gagne">Gagnée</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={statusDate}
                                            onChange={(e) => setStatusDate(e.target.value)}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>
                                    {newStatus === 'annulee' && (
                                        <div>
                                            <label
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Raison de l'annulation
                                            </label>
                                            <input
                                                type="text"
                                                value={cancelData.raison}
                                                onChange={(e) => setCancelData({...cancelData, raison: e.target.value})}
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                required={newStatus === 'annulee'}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowStatusModal(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Enregistrer les modifications
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de détails de la cotation */}
            {isModalOpen === "detail" && selectedCotation ? (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div
                            className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Détails de la
                                        cotation</h3>
                                    {selectedCotation.numero && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">N° {selectedCotation.numero}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(null)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                >
                                    <X className="h-6 w-6"/>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Numéro</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedCotation?.numero}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Client/Partenaire</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedCotation?.partner_title}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Régime</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {selectedCotation?.regime}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                                        {selectedCotation?.type}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mode de
                                        transport</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                                        {selectedCotation?.transportation_mode}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de
                                        réception</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {new Date(selectedCotation.reception_date).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>

                                <div className="md:col-span-1">
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Services</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {selectedCotation?.service_title || 'Aucun service spécifié'}
                                    </p>
                                </div>
                                <div className="md:col-span-1">
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Référence</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {selectedCotation.ref || 'Non spécifiée'}
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Commentaires</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-line">
                                        {selectedCotation.comment || 'Aucun commentaire'}
                                    </p>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Récapitulatif
                                    financier</h4>
                                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rubriques</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Montant</th>
                                        </tr>
                                        </thead>
                                        <tbody
                                            className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        <tr>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Prix
                                                de vente HT
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                                                {selectedCotation?.sale_price?.toLocaleString('fr-FR', {
                                                    style: 'currency',
                                                    currency: 'USD'
                                                })}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Prix
                                                d'achat HT
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                                                {selectedCotation?.buy_price?.toLocaleString('fr-FR', {
                                                    style: 'currency',
                                                    currency: 'USD'
                                                })}
                                            </td>
                                        </tr>
                                        <tr className="border-t border-gray-200 dark:border-gray-700">
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">Marge
                                                brute
                                            </td>
                                            <td className={`px-4 py-2 whitespace-nowrap text-sm font-semibold text-right ${
                                                (selectedCotation?.sale_price - selectedCotation?.buy_price) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {(selectedCotation?.sale_price - selectedCotation?.buy_price).toLocaleString('fr-FR', {
                                                    style: 'currency',
                                                    currency: 'USD'
                                                })}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">Marge
                                                brute (%)
                                            </td>
                                            <td className={`px-4 py-2 whitespace-nowrap text-sm font-semibold text-right ${
                                                (selectedCotation.sale_price > 0 && ((selectedCotation.sale_price - selectedCotation?.buy_price) / selectedCotation?.sale_price * 100) < 15)
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-green-600 dark:text-green-400'
                                            }`}>
                                                {selectedCotation.sale_price > 0 ? ((selectedCotation.sale_price - selectedCotation?.buy_price) / selectedCotation?.sale_price * 100).toFixed(2) : '0.00'}%
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="md:col-span-2 mt-4">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Historique des
                                    status</h4>
                                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Statut
                                            </th>
                                            <th scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Détails
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody
                                            className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">

                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                selectedCotation?.status?.toString() === '1' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>En cours</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                {new Date(selectedCotation.reception_date).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                Réception de la demande
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-right sm:px-6 rounded-b-lg">
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                onClick={() => setIsModalOpen(null)}
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

export default CotationsPage;