import React, { useState, useEffect, ErrorInfo, ReactNode } from 'react';
import { useOutletContext } from 'react-router-dom';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabase';
import { 
  Eye,
  RefreshCw, 
  Trash2, 
  X, 
  FileText, 
  User as UserIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OutletContext {
  theme: 'light' | 'dark';
}

// Interface pour les données de profil
interface Profile {
  id: string;
  email: string;
  nom_complet: string;
  telephone: string;
  poste_recherche?: string;
  cv_url?: string;
  created_at: string;
  updated_at?: string;
  status: 'en_attente' | 'en_cours' | 'acceptee' | 'refusee';
};

// Fonction utilitaire pour formater les dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Composant ErrorBoundary pour capturer les erreurs de rendu
class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error in CandidaturePage:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Une erreur est survenue
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Désolé, nous rencontrons des difficultés pour charger cette page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const CandidaturePageContent: React.FC = () => {
  // Récupérer le thème du contexte
  const context = useOutletContext<OutletContext>();
  const theme = context?.theme || 'light';
  
  // États pour les profils et le chargement
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isChartModalOpen, setIsChartModalOpen] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  
  // Obtenir la liste des 10 dernières années à partir de 2024
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 2024;
    const endYear = Math.max(currentYear, startYear + 9); // Jusqu'à 2033 ou l'année actuelle si plus récente
    const years = [];
    
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }
    
    return years;
  };
  
  // Fonctions pour les statistiques
  // Ces variables sont commentées car non utilisées actuellement
  // const totalCandidats = profiles.length;
  // const totalGmail = profiles.filter(profile => profile.email?.includes('@gmail.')).length;
  // const totalPro = profiles.filter(profile => !profile.email?.includes('@gmail.')).length;
  
  // Calcul de la moyenne de réception par mois
  const getMoyenneParMois = () => {
    if (profiles.length === 0) return 0;
    
    const dates = profiles
      .map(p => new Date(p.created_at))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (dates.length === 0) return 0;
    
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    // Calcul du nombre de mois entre la première et la dernière date
    const months = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                  lastDate.getMonth() - firstDate.getMonth() + 1;
    
    return (profiles.length / Math.max(1, months)).toFixed(1);
  };
  
  
  // Statistiques des candidatures
  const [stats, setStats] = useState({
    total: 0,
    en_attente: 0,
    en_cours: 0,
    acceptee: 0,
    refusee: 0
  });

  // Effet de chargement initial
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Fonction pour charger les profils
  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setProfiles(data || []);
      
      // Calculer le nombre total de profils
      setStats({
        total: filteredProfiles.length,
        en_attente: 0,
        en_cours: 0,
        acceptee: 0,
        refusee: 0
      });
    } catch (error) {
      console.error('Erreur lors du chargement des profils:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les profils'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des profils par recherche
  const filteredProfiles = profiles.filter((profil: Profile) => {
    return searchTerm === '' || 
      (profil.email && profil.email.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (profil.nom_complet && profil.nom_complet.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (profil.telephone && profil.telephone.toString().includes(searchTerm));
  });

  // Fonction pour obtenir la classe de couleur en fonction du statut
  const getStatusColor = (status: Profile['status']) => {
    switch (status) {
      case 'acceptee':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'refusee':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'en_cours':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'en_attente':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    }
  };

  // Fonction pour mettre à jour le statut d'une candidature
  const updateStatus = async (id: string, newStatus: 'acceptee' | 'refusee' | 'en_attente' | 'en_cours') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setProfiles(prev => 
        prev.map(profil => 
          profil.id === id ? { ...profil, status: newStatus } : profil
        )
      );
      
      // Mettre à jour les statistiques
      fetchProfiles();
      
      Swal.fire({
        icon: 'success',
        title: 'Statut mis à jour',
        text: `Le statut a été marqué comme ${getStatusLabel(newStatus)}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      Swal.fire('Erreur', 'Impossible de mettre à jour le statut', 'error');
    }
  };

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status: Profile['status']) => {
    switch (status) {
      case 'en_attente':
        return 'En attente';
      case 'en_cours':
        return 'En cours';
      case 'acceptee':
        return 'Acceptée';
      case 'refusee':
        return 'Refusée';
      default:
        return status;
    }
  };

  // Préparer les données pour le graphique par mois
  const getDateChartData = () => {
    const monthsData = [];
    
    // Créer un objet pour stocker le nombre de candidatures par mois
    const monthCounts: { [key: number]: number } = {};
    
    // Initialiser tous les mois à 0
    for (let month = 0; month < 12; month++) {
      monthCounts[month] = 0;
    }
    
    // Compter les candidatures par mois pour l'année sélectionnée
    profiles.forEach(profile => {
      const date = new Date(profile.created_at);
      if (date.getFullYear() === selectedYear) {
        const month = date.getMonth(); // 0-11
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });
    
    // Créer le tableau de données pour le graphique
    for (let month = 0; month < 12; month++) {
      const date = new Date(selectedYear, month);
      monthsData.push({
        monthNumber: month + 1,
        monthName: date.toLocaleString('fr-FR', { month: 'long' }),
        monthShortName: date.toLocaleString('fr-FR', { month: 'short' }),
        year: selectedYear,
        count: monthCounts[month] || 0,
        date: date
      });
    }
    
    return monthsData;
  };
  
  const dateChartData = getDateChartData();

  return  (
    <div className={`mt-10 min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl text-white font-bold">Gestion des Candidatures</h1>
          <p className="text-gray-500">
            Consultez et gérez les profils candidats
          </p>
        </div>
        <button
          onClick={fetchProfiles}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="Actualiser les données"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Actualiser
        </button>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Carte Total Candidats */}
        <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-800/50' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-200' : 'text-blue-600'}`}>Total Candidats</p>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <UserIcon className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{profiles.length}</p>
        </div>

        {/* Carte Comptes Gmail */}
        <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-800/50' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-red-200' : 'text-red-600'}`}>Comptes Gmail</p>
            <div className="p-2 rounded-lg bg-red-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            {profiles.filter(profile => profile.email?.includes('@gmail.')).length}
          </p>
          <div className="mt-1 text-sm">
            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              {profiles.length > 0 ? 
                ((profiles.filter(p => p.email?.includes('@gmail.')).length / profiles.length) * 100).toFixed(1) + 
                '% des candidats' : '0% des candidats'}
            </span>
          </div>
        </div>

        {/* Carte Comptes Professionnels */}
        <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-800/50' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-green-200' : 'text-green-600'}`}>Comptes Pro</p>
            <div className="p-2 rounded-lg bg-green-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            {profiles.filter(profile => !profile.email?.includes('@gmail.')).length}
          </p>
          <div className="mt-1 text-sm">
            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              {profiles.length > 0 ? 
                ((profiles.filter(p => !p.email?.includes('@gmail.')).length / profiles.length) * 100).toFixed(1) + 
                '% des candidats' : '0% des candidats'}
            </span>
          </div>
        </div>

        {/* Carte Moyenne par mois */}
        <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-800/50' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-200' : 'text-purple-600'}`}>Moyenne / mois</p>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            {(() => {
              if (profiles.length === 0) return '0';
              
              const dates = profiles
                .map(p => new Date(p.created_at))
                .sort((a, b) => a.getTime() - b.getTime());
              
              if (dates.length === 0) return '0';
              
              const firstDate = dates[0];
              const lastDate = dates[dates.length - 1];
              const months = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                            lastDate.getMonth() - firstDate.getMonth() + 1;
              
              return (profiles.length / Math.max(1, months)).toFixed(1);
            })()}
          </p>
          <div className="mt-1 text-sm">
            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              {profiles.length > 0 ? 
                `sur ${new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date())}` :
                'Pas de données'
              }
            </span>
          </div>
        </div>
      </div>


      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="w-full">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border border-gray-200'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tableau des profils */}
      <div className={`rounded-lg shadow overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        {loading ? (
          <div className="p-8 text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${
              theme === 'dark' ? 'border-blue-400' : 'border-blue-600'
            }`}></div>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Chargement des profils...
            </p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-8 text-center">
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              Aucun profil trouvé
            </p>
          </div>
        ) : (
          <div className={`overflow-hidden rounded-lg border ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <table className="min-w-full divide-y">
              <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th scope="col" className={`px-6 py-3.5 text-left text-sm font-semibold ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    <div className="flex items-center gap-x-2">
                      <span>Nom complet</span>
                    </div>
                  </th>
                  <th scope="col" className={`px-6 py-3.5 text-left text-sm font-semibold ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    Téléphone
                  </th>
                  <th scope="col" className={`px-6 py-3.5 text-left text-sm font-semibold ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    Date
                  </th>
                  <th scope="col" className={`px-6 py-3.5 text-left text-sm font-semibold ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    CV
                  </th>
                  <th scope="col" className="relative px-6 py-3.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'
              }`}>
                {filteredProfiles.map((profil) => (
                  <tr 
                    key={profil.id}
                    className={`transition-colors ${
                      theme === 'dark' 
                        ? 'hover:bg-gray-700/50' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-x-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          theme === 'dark' 
                            ? 'bg-gray-700 text-gray-200' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div className="truncate">
                          <div className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {profil.nom_complet || 'Non renseigné'}
                          </div>
                          <div className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {profil.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {profil.telephone || 'Non renseigné'}
                      </div>
                    </td>
                    <td className={`whitespace-nowrap px-6 py-4 text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {formatDate(profil.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {profil.cv_url ? (
                        <a
                          href={profil.cv_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-x-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="Télécharger le CV"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="currentColor" 
                              className="h-5 w-5">
                            <path d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8.828a2 2 0 00-.586-1.414l-4.828-4.828A2 2 0 0013.172 2H6zm7 1.414L18.586 9H13V3.414z" />
                            <path d="M7 14h2.5a1.5 1.5 0 010 3H8v1H7v-4zm1 1v1h1.5a.5.5 0 000-1H8zM12 14h1.5a1.5 1.5 0 110 3H13v1h-1v-4zm1 1v1h.5a.5.5 0 000-1H13zM16 14h2v1h-1v1h1v1h-2v-4z" />
                          </svg>
                          
                        </a>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {/* Bouton Voir les détails */}
                        <button
                          onClick={() => {
                            setSelectedProfile(profil);
                            setIsDetailModalOpen(true);
                          }}
                          type="button"
                          className={`
                            inline-flex h-9 w-9 items-center justify-center 
                            rounded-md border text-xs font-medium
                            ${
                              theme === 'dark'
                                ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
                                : 'bg-blue-100 border-blue-200 text-blue-600 hover:bg-blue-200/50'
                            }
                            hover:shadow-md hover:-translate-y-0.5 
                            transition-all duration-150
                          `}
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Bouton Supprimer */}
                        <button
                          onClick={async () => {
                            const { isConfirmed } = await Swal.fire({
                              title: 'Supprimer la candidature',
                              text: 'Êtes-vous sûr de vouloir supprimer cette candidature ?',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#ef4444',
                              cancelButtonColor: '#6b7280',
                              confirmButtonText: 'Oui, supprimer',
                              cancelButtonText: 'Annuler'
                            });

                            if (isConfirmed) {
                              try {
                                const { error } = await supabase
                                  .from('profiles')
                                  .delete()
                                  .eq('id', profil.id);

                                if (error) throw error;

                                setProfiles(profiles.filter(p => p.id !== profil.id));
                                
                                Swal.fire({
                                  title: 'Supprimé !',
                                  text: 'La candidature a été supprimée.',
                                  icon: 'success',
                                  confirmButtonColor: '#3b82f6',
                                });
                              } catch (error) {
                                console.error('Erreur lors de la suppression :', error);
                                Swal.fire({
                                  title: 'Erreur',
                                  text: 'Une erreur est survenue lors de la suppression',
                                  icon: 'error',
                                  confirmButtonColor: '#3b82f6',
                                });
                              }
                            }
                          }}
                          className={`
                            inline-flex h-9 w-9 items-center justify-center 
                            rounded-md border text-xs font-medium
                            ${
                              theme === 'dark'
                                ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
                                : 'bg-red-100 border-red-200 text-red-600 hover:bg-red-200/50'
                            }
                            hover:shadow-md hover:-translate-y-0.5 
                            transition-all duration-150
                          `}
                          title="Supprimer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section graphiques */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Statistiques des candidatures {selectedYear}
          </h2>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Année :
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className={`px-3 py-1 text-sm rounded-md border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              {getAvailableYears().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Graphique par mois */}
        <div className={`p-6 rounded-lg shadow ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} mb-6`}>
          <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Candidatures par mois
            <span className="text-sm text-blue-500 ml-2 cursor-pointer hover:underline" onClick={() => setIsChartModalOpen(true)}>
              Afficher en grand
            </span>
          </h3>
          <div className="h-80 cursor-pointer" onClick={() => setIsChartModalOpen(true)}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dateChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#4B5563' : '#E5E7EB'} />
                <XAxis 
                  dataKey="monthShortName" 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  tick={{ fontSize: 12 }}
                  height={40}
                  interval={0}
                />
                <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number) => [`${value} candidature${value > 1 ? 's' : ''}`, 'Nombre']}
                  labelFormatter={(label) => `Mois: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, stroke: '#2563EB', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modal pour le graphique en plein écran */}
      {isChartModalOpen && (
        <div 
          className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${
            theme === 'dark' ? 'bg-black/75' : 'bg-black/50'
          }`}
          onClick={() => setIsChartModalOpen(false)}
        >
          <div 
            className={`relative rounded-lg p-6 w-full max-w-6xl h-[90vh] flex flex-col ${
              theme === 'dark' 
                ? 'bg-gray-800 text-gray-100' 
                : 'bg-white text-gray-900 shadow-xl'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Candidatures par mois - Vue détaillée
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Année :
                  </span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className={`px-3 py-1.5 text-sm rounded-md border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                        : 'bg-white border-gray-300 text-gray-800 hover:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  >
                    {getAvailableYears().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => setIsChartModalOpen(false)}
                  className={`p-1.5 rounded-full ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  } transition-colors`}
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dateChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={theme === 'dark' ? '#4B5563' : '#E5E7EB'} 
                  />
                  <XAxis 
                    dataKey="monthShortName" 
                    stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    tick={{ fontSize: 12 }}
                    height={40}
                    interval={0}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                      borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
                      borderRadius: '0.5rem',
                      color: theme === 'dark' ? '#F3F4F6' : '#111827',
                      boxShadow: theme === 'dark' 
                        ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    formatter={(value: number) => [`${value} candidature${value > 1 ? 's' : ''}`, 'Nombre']}
                    labelFormatter={(label) => `Mois: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Candidatures"
                    stroke={theme === 'dark' ? '#60A5FA' : '#3B82F6'}
                    strokeWidth={2}
                    dot={{ 
                      r: 4,
                      fill: theme === 'dark' ? '#3B82F6' : '#2563EB',
                      stroke: theme === 'dark' ? '#93C5FD' : '#1D4ED8',
                      strokeWidth: 1
                    }}
                    activeDot={{ 
                      r: 6, 
                      stroke: theme === 'dark' ? '#93C5FD' : '#1D4ED8', 
                      strokeWidth: 2,
                      fill: theme === 'dark' ? '#3B82F6' : '#2563EB'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal des détails du profil */}
      {isDetailModalOpen && selectedProfile && (
        <DetailModal 
          profile={selectedProfile} 
          onClose={() => setIsDetailModalOpen(false)}
          theme={theme}
        />
      )}
    </div>
    </div>
  );
};

// Composant de modale pour afficher les détails d'un profil
interface DetailModalProps {
  profile: Profile | null;
  onClose: () => void;
  theme: 'dark' | 'light';
}

const DetailModal: React.FC<DetailModalProps> = ({ profile, onClose, theme }) => {
  if (!profile) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${theme === 'dark' ? 'bg-black/70' : 'bg-black/50'}`}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-lg shadow-xl">
          <div className="absolute right-4 top-4">
            <button
              onClick={onClose}
              className={`rounded-full p-1.5 ${theme === 'dark' ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className={`p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Détails du candidat
            </h2>
            
            <div className={`space-y-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <div>
                <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Informations personnelles</h3>
                <dl className="space-y-4">
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Nom complet</dt>
                    <dd className={`mt-1 text-sm sm:col-span-2 sm:mt-0 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {profile?.nom_complet || 'Non renseigné'}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Email</dt>
                    <dd className={`mt-1 text-sm sm:col-span-2 sm:mt-0 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {profile?.email || 'Non renseigné'}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Téléphone</dt>
                    <dd className={`mt-1 text-sm sm:col-span-2 sm:mt-0 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {profile?.telephone || 'Non renseigné'}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Poste recherché</dt>
                    <dd className={`mt-1 text-sm sm:col-span-2 sm:mt-0 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {profile?.poste_recherche || 'Non spécifié'}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Date de candidature</dt>
                    <dd className={`mt-1 text-sm sm:col-span-2 sm:mt-0 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {profile?.created_at ? formatDate(profile.created_at) : 'Date inconnue'}
                    </dd>
                  </div>
                </dl>
              </div>

              {profile?.cv_url && (
                <div className={`pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>CV</h3>
                  <a
                    href={profile?.cv_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FileText className="-ml-1 mr-2 h-5 w-5" />
                    Télécharger le CV
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap the main component with ErrorBoundary
export default function CandidaturePage() {
  return (
    <ErrorBoundary>
      <CandidaturePageContent />
    </ErrorBoundary>
  );
}
