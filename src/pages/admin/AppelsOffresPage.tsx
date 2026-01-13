import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit, Search, Eye, X } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

interface DetailProps {
  label: string;
  value?: string | number;
  children?: React.ReactNode;
}

const Detail: React.FC<DetailProps> = ({ label, value, children }) => (
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
type StatutAppelOffre = 'en_cours' | 'cloture' | 'gagne' | 'perdu' | 'annule' | 'envoyee';
type TypeAppelOffre = 'national' | 'international';

type StatutTache = 'en_cours' | 'termine' | 'en_retard';

interface Tache {
  id: string;
  numero: number;
  description: string;
  assigneA: string;
  dateFin: string;
  dateCompletion?: string;
  statut: StatutTache;
  estTerminee: boolean;
}

interface AppelOffre {
  id: string;
  reference: string;
  Titre: string;
  type: 'national' | 'international' | 'import';
  dateReception: string | Date;
  deadline: string | Date;
  dateEnvoi: string | Date | null;
  statut: 'en_cours' | 'envoyee' | 'gagne' | 'perdu' | 'annule';
  commentaire: string;
  BID_manager: string;
  montant: number;
  dateCreation: string;
  client: string;
  numero: string;
}

const AppelsOffresPage: React.FC = () => {
  const chartRef = useRef<any>(null);
  // États
  const [mainActiveTab, setMainActiveTab] = useState<'statistiques' | 'base'>('base');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAppelOffre, setEditingAppelOffre] = useState<AppelOffre | null>(null);
  const [selectedAppelOffre, setSelectedAppelOffre] = useState<AppelOffre | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsActiveTab, setDetailsActiveTab] = useState<'details' | 'taches'>('details');
  const [taches, setTaches] = useState<Tache[]>([]);
  const [nouvelleTache, setNouvelleTache] = useState<Omit<Tache, 'id' | 'numero' | 'estTerminee'> & { id?: string, numero?: number, estTerminee?: boolean }>({
    description: '',
    assigneA: '',
    dateFin: new Date().toISOString().split('T')[0],
    statut: 'en_cours'
  });
  const [showTacheForm, setShowTacheForm] = useState(false);
  const [editingTache, setEditingTache] = useState<Tache | null>(null);
  const [hiddenDatasets, setHiddenDatasets] = useState<Record<number, boolean>>({});
  const [appelsOffres, setAppelsOffres] = useState<AppelOffre[]>([
    {
      id: '2026-01-01',
      numero: 'AO-2026-001',
      client: 'Ministère de la Santé',
      Titre: 'Fourniture de matériel médical d\'urgence 2026',
      type: 'national',
      reference: 'AO-MS-2026-01',
      dateReception: new Date('2026-01-10').toISOString(),
      deadline: new Date('2026-02-15').toISOString(),
      dateEnvoi: null,
      statut: 'en_cours',
      commentaire: 'Appel d\'offres urgent - Délai de réponse de 30 jours',
      BID_manager: 'Gédéon Massadi',
      montant: 5000000, // Ajout du montant manquant
      dateCreation: new Date('2026-01-01').toISOString()
    },
    {
      id: '2026-01-15',
      numero: 'AO-2026-015',
      client: 'Entreprise des Eaux du Cameroun',
      Titre: 'Dédouanement de pièces détachées pour stations de traitement d\'eau',
      type: 'import',
      reference: 'AO-EEC-2026-02',
      dateReception: new Date('2026-01-15').toISOString(),
      deadline: new Date('2026-03-01').toISOString(),
      dateEnvoi: new Date('2026-02-01').toISOString(),
      statut: 'envoyee',
      commentaire: 'En attente de réponse du comité de sélection',
      BID_manager: 'Félix Luaba',
      montant: 3500000, // Ajout du montant manquant
      dateCreation: new Date('2026-01-15').toISOString()
    },
    {
      id: '2026-02-01',
      numero: 'AO-2026-027',
      client: 'Hôpital Central de Yaoundé',
      Titre: 'Acquisition de consommables médicaux stériles 2026',
      type: 'international',
      reference: 'AO-HCY-2026-03',
      dateReception: new Date('2026-02-01').toISOString(),
      deadline: new Date('2026-02-28').toISOString(),
      dateEnvoi: null,
      statut: 'en_cours',
      commentaire: 'Appel d\'offres ouvert aux fournisseurs internationaux',
      BID_manager: 'Gédéon Massadi',
      montant: 7500000, // Ajout du montant manquant
      dateCreation: new Date('2026-02-01').toISOString()
    },
    {
      id: '2026-02-10',
      numero: 'AO-2026-035',
      client: 'Société Nationale des Hydrocarbures',
      Titre: 'Services logistiques pour le transport de produits pétroliers',
      type: 'national',
      reference: 'AO-SNH-2026-04',
      dateReception: new Date('2026-02-10').toISOString(),
      deadline: new Date('2026-03-31').toISOString(),
      dateEnvoi: null,
      statut: 'en_cours',
      commentaire: 'Nécessite une certification ISO 9001:2015',
      BID_manager: 'Félix Luaba',
      montant: 2500000, // Ajout du montant manquant
      dateCreation: new Date('2026-02-10').toISOString()
    },
    {
      id: '2026-02-15',
      numero: 'AO-2026-042',
      client: 'Ambassade de France au Cameroun',
      Titre: 'Fourniture de matériel informatique pour la coopération',
      type: 'international',
      reference: 'AO-FR-2026-05',
      dateReception: new Date('2026-02-15').toISOString(),
      deadline: new Date('2026-04-15').toISOString(),
      dateEnvoi: new Date('2026-02-20').toISOString(),
      statut: 'gagne',
      commentaire: 'Dossier technique et financier déposé',
      BID_manager: 'Gédéon Massadi',
      montant: 15000000,
      dateCreation: new Date('2026-02-15').toISOString()
    },
    {
      id: '2026-03-01',
      numero: 'AO-2026-056',
      client: 'Programme Alimentaire Mondial (PAM)',
      Titre: 'Services logistiques pour la distribution alimentaire d\'urgence',
      type: 'international',
      reference: 'AO-PAM-2026-06',
      dateReception: new Date('2026-03-01').toISOString(),
      deadline: new Date('2026-03-20').toISOString(),
      dateEnvoi: new Date('2026-03-05').toISOString(),
      statut: 'perdu',
      commentaire: 'Offre non retenue - Manque d\'expérience dans la zone d\'intervention',
      BID_manager: 'Félix Luaba',
      montant: 18000000,
      dateCreation: new Date('2026-03-01').toISOString()
    }
  ]);
  const [newAppelOffre, setNewAppelOffre] = useState<Omit<AppelOffre, 'id' | 'dateCreation'>>(
    {
      reference: '',
      Titre: '',
      type: 'national',
      dateReception: new Date(),
      deadline: new Date(),
      montant: 0,
      dateEnvoi: null,
      statut: 'en_cours',
      commentaire: '',
      BID_manager: 'Admin',
      client: '',
      numero: ''
    }
  );

  // Fonction pour afficher les détails d'un appel d'offre
  const handleReferenceClick = (appelOffre: AppelOffre) => {
    setSelectedAppelOffre(appelOffre);
    setShowDetailsModal(true);
  };

  const handleViewDetails = (appelOffre: AppelOffre) => {
    setSelectedAppelOffre(appelOffre);
    setDetailsActiveTab('details');
    setShowDetailsModal(true);
  };

  // Fonction pour gérer l'édition d'une tâche
  const handleEditTache = (tache: Tache) => {
    setNouvelleTache({
      description: tache.description,
      assigneA: tache.assigneA,
      dateFin: tache.dateFin,
      statut: tache.statut
    });
    setEditingTache(tache);
    setShowTacheForm(true);
  };

  // Fonction pour gérer la suppression d'une tâche
  const handleDeleteTache = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      setTaches(taches.filter(t => t.id !== id));
    }
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

  // Fonction pour formater le temps restant
  const formatRemainingTime = (days: number): string => {
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return '1 jour';
    if (days > 0) return `${days} jours`;
    return 'Dépassé';
  };

  // Fonction pour formater la date pour les champs input de type date
  const formatDateForInput = (date: Date | string) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fonction pour obtenir la couleur en fonction du statut
  const getStatusColor = (statut: StatutAppelOffre) => {
    switch (statut) {
      case 'en_cours':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cloture':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'gagne':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'perdu':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'annule':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Fonction pour filtrer les appels d'offres
  const filteredAppelsOffres = appelsOffres.filter(ao =>
    ao.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ao.Titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ao.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonction pour ajouter un nouvel appel d'offre
  const handleAddAppelOffre = () => {
    setNewAppelOffre({
      reference: '',
      Titre: '',
      type: 'national',
      dateReception: new Date(),
      deadline: new Date(),
      dateEnvoi: null,
      statut: 'en_cours',
      commentaire: '',
      BID_manager: 'Admin',
      client: '',
      numero: '',
      montant: 0
    });
    setEditingAppelOffre(null);
    setShowAddForm(true);
  };

  // Fonction pour supprimer un appel d'offre
  const handleDeleteAppelOffre = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet appel d\'offre ?')) {
      setAppelsOffres(appelsOffres.filter(ao => ao.id !== id));
    }
  };

  // Fonction pour éditer un appel d'offre
  const handleEditAppelOffre = (appelOffre: AppelOffre) => {
    // Créer une copie profonde pour éviter les références partagées
    const appelOffreCopy = {
      ...appelOffre,
      dateReception: new Date(appelOffre.dateReception),
      deadline: new Date(appelOffre.deadline),
      dateEnvoi: appelOffre.dateEnvoi ? new Date(appelOffre.dateEnvoi) : null
    };
    setEditingAppelOffre(appelOffreCopy);
    setShowAddForm(true);
  };

  // Fonction pour gérer les changements dans le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name, value } = target;

    if (editingAppelOffre) {
      setEditingAppelOffre({
        ...editingAppelOffre,
        [name]: value,
      });
    } else {
      setNewAppelOffre({
        ...newAppelOffre,
        [name]: value,
      });
    }
  };

  // Fonction pour gérer les changements de date
  const handleDateChange = (name: 'dateReception' | 'deadline' | 'dateEnvoi', date: Date | null) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Date invalide:', date);
      return;
    }

    if (editingAppelOffre) {
      setEditingAppelOffre({
        ...editingAppelOffre,
        [name]: date,
      });
    } else {
      setNewAppelOffre({
        ...newAppelOffre,
        [name]: date,
      });
    }
  };

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setNewAppelOffre({
      reference: '',
      Titre: '',
      type: 'national',
      dateReception: new Date(),
      deadline: new Date(),
      dateEnvoi: null,
      statut: 'en_cours',
      commentaire: '',
      BID_manager: 'Admin',
      client: '',
      numero: '',
      montant: 0
    });
  };

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // S'assurer que les dates sont des objets Date valides
    const prepareAppelOffre = (ao: any) => ({
      ...ao,
      dateReception: ao.dateReception instanceof Date ? ao.dateReception.toISOString() : ao.dateReception,
      deadline: ao.deadline instanceof Date ? ao.deadline.toISOString() : ao.deadline,
      dateEnvoi: ao.dateEnvoi instanceof Date ? ao.dateEnvoi.toISOString() : ao.dateEnvoi,
    });

    if (editingAppelOffre) {
      // Mise à jour d'un appel d'offre existant
      const updatedAppelOffre = prepareAppelOffre(editingAppelOffre);
      setAppelsOffres(appelsOffres.map(ao => 
        ao.id === editingAppelOffre.id ? updatedAppelOffre : ao
      ));
    } else {
      // Ajout d'un nouvel appel d'offre
      const newId = Math.random().toString(36).substr(2, 9);
      const newAppelOffreToAdd = prepareAppelOffre({
        ...newAppelOffre,
        id: newId,
        dateCreation: new Date().toISOString()
      });
      setAppelsOffres([...appelsOffres, newAppelOffreToAdd]);
      resetForm();
    }
    
    setShowAddForm(false);
    setEditingAppelOffre(null);
  };

  // Filtrer les appels d'offres par année sélectionnée
  const appelsAnneeEnCours = appelsOffres.filter(ao => {
    const aoYear = new Date(ao.dateReception).getFullYear();
    return aoYear === selectedYear;
  });

  // Données pour les graphiques
  const statsData = {
    total: appelsAnneeEnCours.length,
    enCours: appelsAnneeEnCours.filter(ao => ao.statut === 'en_cours').length,
    gagnes: appelsAnneeEnCours.filter(ao => ao.statut === 'gagne').length,
    tauxReussite: appelsAnneeEnCours.length > 0 
      ? Math.round((appelsAnneeEnCours.filter(ao => ['gagne', 'perdu'].includes(ao.statut)).length > 0 
          ? (appelsAnneeEnCours.filter(ao => ao.statut === 'gagne').length / 
             appelsAnneeEnCours.filter(ao => ['gagne', 'perdu'].includes(ao.statut)).length) * 100 
          : 0)) 
      : 0
  };

  // Données pour le graphique de répartition par statut
  const getStatutData = (filteredAppels: AppelOffre[] = appelsOffres) => {
    // Filtrer d'abord par année sélectionnée
    const appelsFiltres = filteredAppels.filter(ao => {
      const aoYear = new Date(ao.dateReception).getFullYear();
      return aoYear === selectedYear;
    });

    const statuts = {
      en_cours: 0,
      envoyee: 0,
      gagne: 0,
      perdu: 0,
      annule: 0,
      cloture: 0
    };

    appelsFiltres.forEach(ao => {
      if (ao.statut in statuts) {
        statuts[ao.statut as keyof typeof statuts]++;
      }
    });

    return {
      labels: ['En cours', 'Envoyée', 'Gagné', 'Perdu', 'Annulé', 'Clôturé'],
      datasets: [
        {
          data: [
            statuts.en_cours,
            statuts.envoyee,
            statuts.gagne,
            statuts.perdu,
            statuts.annule,
            statuts.cloture
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

    // Mettre à jour le graphique quand l'année change
    useEffect(() => {
      // Forcer la mise à jour du graphique
      const chart = chartRef.current;
      if (chart) {
        chart.update();
      }
    }, [selectedYear]);
  };

  // Filtrer les appels d'offres par année sélectionnée
  const getFilteredAppelsOffres = () => {
    return appelsOffres.filter(ao => {
      const aoYear = new Date(ao.dateReception).getFullYear();
      return aoYear === selectedYear;
    });
  };

  // Fonction pour obtenir les données mensuelles
  const getMonthlyData = () => {
    // Créer un tableau pour stocker le nombre d'AO par mois
    const monthlyData = new Array(12).fill(0);
    
    // Filtrer d'abord par année sélectionnée
    const appelsAnneeEnCours = appelsOffres.filter(ao => {
      const aoYear = new Date(ao.dateReception).getFullYear();
      return aoYear === selectedYear;
    });

    // Parcourir les appels d'offres filtrés
    appelsAnneeEnCours.forEach(ao => {
      const date = new Date(ao.dateReception);
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
          label: function(context: any) {
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
      {/* Modal d'ajout/édition */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden text-gray-900 dark:text-white">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingAppelOffre !== null ? 'Modifier' : 'Nouvel'} appel d'offre
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAppelOffre(null);
                }}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Référence *
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={editingAppelOffre !== null ? editingAppelOffre.reference : newAppelOffre.reference}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Intitulé *
                  </label>
                  <input
                    type="text"
                    name="Titre"
                    value={editingAppelOffre !== null ? editingAppelOffre.Titre : newAppelOffre.Titre}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={editingAppelOffre !== null ? editingAppelOffre.type : newAppelOffre.type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="national">National</option>
                    <option value="international">International</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Statut *
                  </label>
                  <select
                    name="statut"
                    value={editingAppelOffre !== null ? editingAppelOffre.statut : newAppelOffre.statut}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="en_cours">En cours</option>
                    <option value="cloture">Clôturé</option>
                    <option value="gagne">Gagné</option>
                    <option value="perdu">Perdu</option>
                    <option value="annule">Annulé</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date de publication *
                  </label>
                  <input
                    type="date"
                    name="dateReception"
                    value={formatDateForInput(editingAppelOffre !== null ? editingAppelOffre.dateReception : newAppelOffre.dateReception)}
                    onChange={(e) => handleDateChange('dateReception', e.target.value ? new Date(e.target.value) : new Date())}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date limite *
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formatDateForInput(editingAppelOffre !== null ? editingAppelOffre.deadline : newAppelOffre.deadline)}
                    onChange={(e) => handleDateChange('deadline', e.target.value ? new Date(e.target.value) : new Date())}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

              </div>

              <div className="mt-6 space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={editingAppelOffre !== null ? editingAppelOffre.Titre : newAppelOffre.Titre}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingAppelOffre(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:border-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingAppelOffre ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-6 mt-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Appels d'Offres</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Consultez et gérez les appels d'offres en cours et à venir
        </p>
      </div>

      {/* Onglets */}
      <div className="sticky top-10 z-10 bg-white dark:bg-gray-900 pt-4 pb-2 -mx-4 px-4 border-b border-gray-200 dark:border-gray-700">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg text-gray-800 dark:text-white font-semibold">Statistiques des appels d'offres</h2>
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
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{statsData.total}</div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Appels d'offres</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">En cours</div>
                  <div className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">{statsData.enCours}</div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">En cours d'évaluation</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Gagnés</div>
                  <div className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">{statsData.gagnes}</div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Appels d'offres remportés</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux de réussite</div>
                  <div className="mt-1 text-2xl font-semibold text-purple-600 dark:text-purple-400">{statsData.tauxReussite}%</div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Taux de réussite</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow">
                  <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Répartition par statut</h3>
                  <div className="h-64 text-white">
                    {appelsOffres.length > 0 ? (
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
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow">
                  <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Évolution mensuelle</h3>
                  <div className="h-64">
                    {appelsOffres.length > 0 ? (
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
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg dark:text-white font-semibold">Liste des appels d'offres</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-6 w-6 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAppelOffre}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Nouvel appel d'offre
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Client & Référence
                    </th>
                    <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Dates (Réception / Limite)
                    </th>
                    <th scope="col" className="w-1/6 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      % Tâches
                    </th>
                    <th scope="col" className="w-1/6 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      BID
                    </th>
                    <th scope="col" className="w-1/6 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="w-1/6 px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAppelsOffres.length > 0 ? (
                    filteredAppelsOffres.map((ao) => (
                      <tr key={ao.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${getDaysRemaining(ao.deadline) <= 5 && getDaysRemaining(ao.deadline) >= 0 ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                        <td className="w-1/4 px-4 py-4">
                          <div 
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer font-medium"
                            onClick={() => handleReferenceClick(ao)}
                          >
                            {ao.client}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {ao.reference}
                          </div>
                        </td>
                        <td className="w-1/4 px-4 py-4">
                          <div className="text-sm">
                            <div>Reçue: {formatDate(ao.dateReception)}</div>
                            <div>Limite: {formatDate(ao.deadline)}</div>
                            <div className="mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs ${getDaysRemaining(ao.deadline) <= 5 ? 'text-red-800 bg-red-100 dark:text-red-100 dark:bg-red-900/50' : 'text-gray-800 bg-gray-100 dark:text-gray-200 dark:bg-gray-700'}`}>
                                {getDaysRemaining(ao.deadline)} j restants
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="w-1/6 px-2 py-4">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-2" style={{ width: '60px' }}>
                              <div 
                                className="bg-green-600 h-2.5 rounded-full" 
                                style={{ 
                                  width: `${taches.length > 0 ? (taches.filter(t => t.estTerminee).length / taches.length) * 100 : 0}%`,
                                  transition: 'width 0.3s ease-in-out'
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {taches.length > 0 ? Math.round((taches.filter(t => t.estTerminee).length / taches.length) * 100) : 0}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {taches.filter(t => t.estTerminee).length}/{taches.length} tâches
                          </div>
                        </td>
                        <td className="w-1/6 px-2 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {ao.BID_manager}
                        </td>
                        <td className="w-1/6 px-2 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ao.statut)}`}>
                            {ao.statut === 'en_cours' && 'En cours'}
                            {ao.statut === 'envoyee' && 'Envoyée'}
                            {ao.statut === 'gagne' && 'Gagné'}
                            {ao.statut === 'perdu' && 'Perdu'}
                            {ao.statut === 'annule' && 'Annulé'}
                          </span>
                        </td>
                        <td className="w-1/6 px-2 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <div className="inline-flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(ao)}
                              className="p-2 rounded-lg bg-gray-100/70 hover:bg-gray-200/70 dark:bg-gray-700/50 dark:hover:bg-gray-600/70 transition-colors"
                              title="Voir détails"
                            >
                              <Eye className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                            </button>
                            <button
                              onClick={() => handleEditAppelOffre(ao)}
                              className="p-2 rounded-lg bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 transition-colors"
                              title="Modifier"
                            >
                              <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteAppelOffre(ao.id)}
                              className="p-2 rounded-lg bg-red-50/70 hover:bg-red-100/70 dark:bg-red-900/30 dark:hover:bg-red-800/50 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Aucun appel d'offre trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-white dark:bg-gray-800 px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                  Précédent
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                  Suivant
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage de <span className="font-medium">0</span> à <span className="font-medium">0</span> sur{' '}
                    <span className="font-medium">0</span> résultats
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      <span className="sr-only">Précédent</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      <span className="sr-only">Suivant</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    {showDetailsModal && selectedAppelOffre && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
    <div className="relative w-full max-w-3xl rounded-lg bg-white dark:bg-gray-800 shadow-lg max-h-[90vh] overflow-y-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Détails de l'appel d'offre
          </h3>
          {selectedAppelOffre.reference && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Référence : {selectedAppelOffre.reference}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowDetailsModal(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-6 w-6" />
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
              <Detail label="Référence" value={selectedAppelOffre.reference} />
              <Detail label="Numéro" value={selectedAppelOffre.numero} />
              <Detail label="Client" value={selectedAppelOffre.client} />
              <Detail label="BID Manager" value={selectedAppelOffre.BID_manager} />

              <Detail label="Type" value={selectedAppelOffre.type} />
              <Detail label="Statut">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedAppelOffre.statut)}`}>
                  {selectedAppelOffre.statut}
                </span>
              </Detail>

              <Detail
                label="Date de réception"
                value={formatDate(selectedAppelOffre.dateReception)}
              />
              <Detail
                label="Date limite"
                value={formatDate(selectedAppelOffre.deadline)}
              />

              <Detail
                label="Date d'envoi"
                value={
                  selectedAppelOffre.dateEnvoi
                    ? formatDate(selectedAppelOffre.dateEnvoi)
                    : '—'
                }
              />

              <Detail
                label="Montant"
                value={`${selectedAppelOffre.montant.toLocaleString()} €`}
              />
            </div>

            <div>
              <p className="font-medium text-gray-500 dark:text-gray-400">Référence</p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {selectedAppelOffre.reference || 'Non spécifiée'}
              </p>
            </div>

            <div>
              <p className="font-medium text-gray-500 dark:text-gray-400">Titre</p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {selectedAppelOffre.Titre}
              </p>
            </div>

            <div>
              <p className="font-medium text-gray-500 dark:text-gray-400">Commentaire</p>
              <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-line">
                {selectedAppelOffre.commentaire || 'Aucun commentaire'}
              </p>
            </div>
          </>
        ) : (
          <div className="p-4">
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Liste des tâches</h3>
                <button
                  type="button"
                  onClick={() => setShowTacheForm(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-1 h-6 w-6" />
                  Nouvelle tâche
                </button>
              </div>
              {taches.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-2" style={{ width: '200px' }}>
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${(taches.filter(t => t.estTerminee).length / taches.length) * 100}%`,
                          transition: 'width 0.3s ease-in-out'
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {Math.round((taches.filter(t => t.estTerminee).length / taches.length) * 100)}% terminé
                      ({taches.filter(t => t.estTerminee).length}/{taches.length} tâches)
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      N°
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tâche
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Assigné à
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date fin
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Jours restants
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Terminé
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {taches.map((tache) => (
                    <tr key={tache.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {tache.numero}
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-white">
                        {tache.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {tache.assigneA}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(tache.dateFin).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tache.estTerminee && tache.dateCompletion ? (
                          <div className="flex flex-col">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Terminé
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              Le {new Date(tache.dateCompletion).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            new Date(tache.dateFin) < new Date() 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {new Date(tache.dateFin) < new Date() ? 'En retard' : 
                             `${Math.ceil((new Date(tache.dateFin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}j`}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <div className="inline-flex space-x-2">
                          <button
                            onClick={() => handleEditTache(tache)}
                            className="p-2 rounded-lg bg-gray-100/70 hover:bg-gray-200/70 dark:bg-gray-700/50 dark:hover:bg-gray-600/70 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                          </button>
                          <button
                            onClick={() => handleDeleteTache(tache.id)}
                            className="p-2 rounded-lg bg-red-50/70 hover:bg-red-100/70 dark:bg-red-900/30 dark:hover:bg-red-800/50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </button>
                          <input
                            type="checkbox"
                            checked={tache.estTerminee}
                            onChange={() => {
                              const now = new Date().toISOString();
                              const updatedTaches = taches.map(t => 
                                t.id === tache.id 
                                  ? { 
                                      ...t, 
                                      estTerminee: !t.estTerminee, 
                                      statut: !t.estTerminee ? 'termine' : 'en_cours' as StatutTache,
                                      dateCompletion: !t.estTerminee ? now : undefined
                                    }
                                  : t
                              );
                              setTaches(updatedTaches);
                            }}
                            className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-2"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {taches.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Aucune tâche n'a été ajoutée pour le moment.
                </div>
              )}
            </div>

            {/* Modal d'ajout de tâche */}
            {showTacheForm && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {editingTache ? 'Modifier la tâche' : 'Nouvelle tâche'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowTacheForm(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description de la tâche *
                      </label>
                      <input
                        type="text"
                        id="description"
                        value={nouvelleTache.description}
                        onChange={(e) => setNouvelleTache({...nouvelleTache, description: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="assigneA" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Assigné à *
                      </label>
                      <input
                        type="text"
                        id="assigneA"
                        value={nouvelleTache.assigneA}
                        onChange={(e) => setNouvelleTache({...nouvelleTache, assigneA: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="dateFin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date de fin *
                      </label>
                      <input
                        type="date"
                        id="dateFin"
                        value={nouvelleTache.dateFin}
                        onChange={(e) => setNouvelleTache({...nouvelleTache, dateFin: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowTacheForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const handleAddTache = () => {
                            if (nouvelleTache.description && nouvelleTache.assigneA && nouvelleTache.dateFin) {
                              if (editingTache) {
                                // Mise à jour de la tâche existante
                                const updatedTaches = taches.map(t => 
                                  t.id === editingTache.id 
                                    ? { 
                                        ...nouvelleTache, 
                                        id: editingTache.id,
                                        numero: editingTache.numero,
                                        estTerminee: editingTache.estTerminee,
                                        dateCompletion: editingTache.dateCompletion
                                      } 
                                    : t
                                );
                                setTaches(updatedTaches);
                                setEditingTache(null);
                              } else {
                                // Création d'une nouvelle tâche
                                const nouvelleTacheComplete: Tache = {
                                  ...nouvelleTache,
                                  id: Date.now().toString(),
                                  numero: taches.length + 1,
                                  estTerminee: false,
                                  statut: 'en_cours' as StatutTache
                                };
                                setTaches([...taches, nouvelleTacheComplete]);
                              }
                              
                              // Réinitialiser le formulaire
                              setNouvelleTache({
                                description: '',
                                assigneA: '',
                                dateFin: new Date().toISOString().split('T')[0],
                                statut: 'en_cours'
                              });
                              setShowTacheForm(false);
                            }
                          };

                          handleAddTache();
                          setEditingTache(null);
                        }}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {editingTache ? 'Mettre à jour' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        {detailsActiveTab === 'details' && (
          <button
            onClick={() => {
              handleEditAppelOffre(selectedAppelOffre);
              setShowDetailsModal(false);
            }}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Edit className="h-6 w-6 mr-2" />
            Modifier
          </button>
        )}

        <button
          onClick={() => setShowDetailsModal(false)}
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
)}

    </div>



  );
};

export default AppelsOffresPage;
