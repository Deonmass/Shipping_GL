import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Heart, FileText, Handshake,
  Calendar, MessageSquare, X, ArrowRight,
  Settings, BarChart3, Wrench, Briefcase,
  RefreshCw, UserSearch
} from 'lucide-react';
import {
   XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, LabelList
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ChartModal } from '../../components/admin/ChartModal.tsx';
import {UseGetDashboardStats} from "../../services";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#1F2937',
        border: '1px solid #374151',
        borderRadius: '0.5rem',
        padding: '10px',
        color: '#FFFFFF',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          // Remplacer les noms des séries par des libellés plus conviviaux
          const displayName = entry.name === 'quoteRequests' ? 'Demande de Devis' : 
                            entry.name === 'jobApplications' ? 'Candidatures' :
                            entry.name === 'newsletters' ? 'Newsletters' :
                            entry.name === 'publishedOffers' ? 'Offres publiées' :
                            entry.name === 'publishedPosts' ? 'Articles publiés' : entry.name;
          
          return (
            <div key={`item-${index}`} style={{ 
              display: 'flex',
              alignItems: 'center',
              marginBottom: '4px',
              color: '#E5E7EB'
            }}>
              <div style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                backgroundColor: entry.color,
                marginRight: '8px',
                borderRadius: '2px'
              }} />
              <span style={{ marginRight: '8px' }}>{displayName}:</span>
              <span style={{ fontWeight: 600, color: '#FFFFFF' }}>
                {typeof entry.value === 'number' ? entry.value.toLocaleString('fr-FR') : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

interface Stats {
  partners: { total: number; newThisMonth: number; trend: number };
  likes: { total: number; avgPerPost: number; trend: number };
  posts: { total: number; published: number; pending: number };
  notifications: { total: number; unread: number };
  users: {
    total: number;
    admins: number;
    regular: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  comments: { total: number; trend: number };
  events: { upcoming: number; total: number };
  quotes: {
    total: number;
    pending: number;
    processed: number;
    newThisMonth: number;
  };
  services: {
    total: number;
    active: number;
    withQuotes: number;
  };
  candidatures: {
    total: number;
    newThisMonth: number;
    pending: number;
    approved: number;
    rejected: number;
    trend: number;
  };
  jobOffers: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    expiringSoon: number;
    newThisMonth: number;
    trend: number;
  };
}

interface DetailedData {
  title: string;
  data: any[];
  columns: { key: string; header: string }[];
}

interface MonthData {
  monthDate: Date;
  start: Date;
  end: Date;
  name: string;
  shortName: string;
  jobApplications: number;
  comments: number;
  newsletters: number;
  quoteRequests: number;
  publishedOffers: number;
  publishedPosts: number;
}

interface MonthlyTrendItem {
  monthDate?: string;
  name?: string;
  // Add other properties as needed
  [key: string]: any;
}

// Fonction utilitaire pour vérifier s'il y a des données à afficher
const hasData = (data: any[]) => {
  return data && data.length > 0 && data.some(item => 
    (item.newsletters && item.newsletters > 0) || 
    (item.quoteRequests && item.quoteRequests > 0) || 
    (item.jobApplications && item.jobApplications > 0) || 
    (item.publishedOffers && item.publishedOffers > 0) || 
    (item.publishedPosts && item.publishedPosts > 0)
  );
};

const AdminDashboardPage: React.FC = () => {
  const [chartsLoading, setChartsLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  // État pour gérer la visibilité de chaque série dans le graphique
  const [visibleSeries, setVisibleSeries] = useState({
    comments: true,
    newsletters: true,
    quoteRequests: true,
    jobApplications: true,
    publishedOffers: true,
    publishedPosts: true
  });


  const [effectiveStats, setEffectiveStats] = useState<any>({})
  const {isPending: isGettingStats, data: stats, isRefetching: isReGettingStats, refetch: reGetStats} = UseGetDashboardStats()
  
  // Fonction pour basculer la visibilité d'une série
  const toggleSeriesVisibility = (key: string) => {
    setVisibleSeries(prev => {
      const newState = {
        ...prev,
        [key]: !prev[key as keyof typeof prev]
      };
      console.log(`Toggle visibility for ${key}:`, newState);
      return newState;
    });
  };
  // const [stats, setStats] = useState<Stats>({
  //   partners: { total: 0, newThisMonth: 0, trend: 0 },
  //   likes: { total: 0, avgPerPost: 0, trend: 0 },
  //   posts: { total: 0, published: 0, pending: 0 },
  //   notifications: { total: 0, unread: 0 },
  //   users: { total: 0, admins: 0, regular: 0, active: 0, inactive: 0, newThisMonth: 0 },
  //   comments: { total: 0, trend: 0 },
  //   events: { upcoming: 0, total: 0 },
  //   quotes: { total: 0, pending: 0, processed: 0, newThisMonth: 0 },
  //   services: { total: 0, active: 0, withQuotes: 0 },
  //   candidatures: { total: 0, newThisMonth: 0, pending: 0, approved: 0, rejected: 0, trend: 0 },
  //   jobOffers: {
  //     total: 0,
  //     published: 0,
  //     draft: 0,
  //     archived: 0,
  //     expiringSoon: 0,
  //     newThisMonth: 0,
  //     trend: 0
  //   }
  // });
  // const [displayStats, setDisplayStats] = useState<Stats>({
  //   partners: { total: 0, newThisMonth: 0, trend: 0 },
  //   likes: { total: 0, avgPerPost: 0, trend: 0 },
  //   posts: { total: 0, published: 0, pending: 0 },
  //   notifications: { total: 0, unread: 0 },
  //   users: { total: 0, admins: 0, regular: 0, active: 0, inactive: 0, newThisMonth: 0 },
  //   comments: { total: 0, trend: 0 },
  //   events: { upcoming: 0, total: 0 },
  //   quotes: { total: 0, pending: 0, processed: 0, newThisMonth: 0 },
  //   services: { total: 0, active: 0, withQuotes: 0 },
  //   candidatures: { total: 0, newThisMonth: 0, pending: 0, approved: 0, rejected: 0, trend: 0 },
  //   jobOffers: {
  //     total: 0,
  //     published: 0,
  //     draft: 0,
  //     archived: 0,
  //     expiringSoon: 0,
  //     newThisMonth: 0,
  //     trend: 0
  //   }
  // });

  const [selectedDetail, setSelectedDetail] = useState<DetailedData | null>(null);
  const [expandedChart, setExpandedChart] = useState<{
    title: string;
    type: 'line' | 'bar' | 'pie';
    data: any[];
    dataKeys?: { key: string; name: string; color: string }[];
    legend?: string;
  } | null>(null);
  const [chartData, setChartData] = useState<any>({
    monthlyTrends: [],
    userStatus: [],
    quoteRequests: [],
    jobApplications: [],
    publishedOffers: [],
    publishedPosts: []
  });

  const navigate = useNavigate();

  const safeNavigate = (chart: string, path: string) => {
    setExpandedChart(expandedChart === chart ? null : chart);
    navigate(path);
  };

  const navigateToJobOffers = () => {
    navigate('/admin/offres-emploi');
  };

  useEffect(() => {
    if(stats){
      setEffectiveStats(stats?.responseData?.data)
    }
  }, [stats]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const readTheme = () => {
      const saved = localStorage.getItem('admin_theme');
      setTheme(saved === 'light' ? 'light' : 'dark');
    };

    readTheme();

    const handler = () => readTheme();
    window.addEventListener('storage', handler);
    window.addEventListener('admin_theme_change', handler as EventListener);

    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('admin_theme_change', handler as EventListener);
    };
  }, []);


  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-20">
        <div className="flex items-center gap-4">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
          <button
            onClick={() => reGetStats()}
            disabled={isReGettingStats || isGettingStats}
            className={`p-2 rounded-full ${isGettingStats || isReGettingStats ? 'text-gray-400' : 'text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Actualiser les données"
          >
            <RefreshCw className={`w-5 h-5 ${isGettingStats || isReGettingStats ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {isReGettingStats && (
          <div className={`flex items-center gap-2 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
            <span>Mise à jour des statistiques...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

        <button
          onClick={() => safeNavigate('posts', '/admin/posts')}
          className="relative overflow-hidden rounded-xl px-5 py-4 flex flex-col items-start justify-between text-left bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-600 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Gestion des posts</span>
            </div>
            {effectiveStats?.posts?.pending > 0 && (
              <span className="text-xs font-semibold text-yellow-900 bg-yellow-300 px-2 py-1 rounded-full">
                {effectiveStats?.posts?.pending} en attente
              </span>
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats?.posts?.total}</p>
            <p className="text-xs text-blue-100 mt-1">Posts au total</p>
          </div>
          <div className="mt-3 flex items-center justify-between w-full text-xs text-blue-100/80">
            <span>Accéder à la gestion des posts</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={() => safeNavigate('partners', '/admin/partners')}
          className="relative overflow-hidden rounded-xl px-5 py-4 flex flex-col items-start justify-between text-left bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Handshake className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Gestion des partenaires</span>
            </div>
            <span className="text-xs font-semibold text-emerald-900 bg-emerald-200 px-2 py-1 rounded-full">
              +{effectiveStats?.partners?.newThisMonth} ce mois
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats?.partners?.total}</p>
            <p className="text-xs text-emerald-100 mt-1">Partenaires au total</p>
          </div>
          <div className="mt-3 flex items-center justify-between w-full text-xs text-emerald-100/80">
            <span>Voir tous les partenaires</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={() => safeNavigate('users', '/admin/users')}
          className="relative overflow-hidden rounded-xl px-5 py-4 flex flex-col items-start justify-between text-left bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Gestion des utilisateurs</span>
            </div>
            <span className="text-xs font-semibold text-amber-900 bg-amber-200 px-2 py-1 rounded-full">
              +{effectiveStats?.admins?.newThisMonth} ce mois
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats?.admins?.total}</p>
            <p className="text-xs text-amber-100 mt-1">Utilisateurs au total</p>
            <div className="mt-2 text-xs text-amber-100/80 space-y-1">
              <p>{effectiveStats?.admins?.active} actif{effectiveStats?.admins?.active > 1 ? 's' : ''} · {effectiveStats?.users?.inactive} inactif{effectiveStats?.users?.inactive > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between w-full text-xs text-amber-100/80">
            <span>Voir la liste des utilisateurs</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={() => safeNavigate('quote_requests', '/admin/quote-requests')}
          className="relative overflow-hidden rounded-xl px-5 py-4 flex flex-col items-start justify-between text-left bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Demandes de devis</span>
            </div>
            {effectiveStats?.quotes?.pending > 0 && (
              <span className="text-xs font-semibold text-purple-900 bg-purple-200 px-2 py-1 rounded-full">
                {effectiveStats?.quotes?.pending} en attente
              </span>
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats?.quotes?.total}</p>
            <p className="text-xs text-purple-100 mt-1">Demandes au total</p>
          </div>
          <div className="mt-3 flex items-center justify-between w-full text-xs text-purple-100/80">
            <span>Voir toutes les demandes</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={() => safeNavigate('cotations', '/admin/cotations')}
          className="relative overflow-hidden rounded-xl px-5 py-4 flex flex-col items-start justify-between text-left bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-600 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Cotations</span>
            </div>
            <span className="text-xs font-semibold text-rose-200 bg-rose-900/30 px-2 py-1 rounded-full">
              +{effectiveStats?.cotations?.newThisMonth} ce mois
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats?.cotations?.total}</p>
            <p className="text-xs text-pink-100 mt-1">Cotations au total</p>
          </div>
          <div className="mt-3 flex items-center justify-between w-full text-xs text-pink-100/80">
            <span>Voir toutes les Cotations</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={() => safeNavigate('services', '/admin/services')}
          className="relative overflow-hidden rounded-xl px-5 py-4 flex flex-col items-start justify-between text-left bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Services</span>
            </div>
            <span className="text-xs font-semibold text-emerald-900 bg-emerald-200 px-2 py-1 rounded-full">
              {effectiveStats?.services?.total || 0} services
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats?.services?.total || 0}</p>
            <p className="text-xs text-emerald-100 mt-1">Services disponibles</p>
          </div>
          <div className="mt-3 flex items-center justify-between w-full text-xs text-emerald-100/80">
            <span>Gérer les services</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        <button
            onClick={() => safeNavigate('visitors', '/admin/visitors')}
            className="relative overflow-hidden rounded-xl px-5 py-4 flex flex-col items-start justify-between text-left bg-gradient-to-br from-red-600 via-pink-600 to-fuchsia-600 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <UserSearch className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Comptes Visiteurs</span>
            </div>
            {effectiveStats?.visitors?.active > 0 && (
                <span className="text-xs font-semibold text-white bg-black/20 px-2 py-1 rounded-full">
                {effectiveStats?.visitors?.active} non lue(s)
              </span>
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats?.visitors?.total}</p>
            <p className="text-xs text-pink-100 mt-1">Comptes Visiteurs total</p>
          </div>
          <div className="mt-3 flex items-center justify-between w-full text-xs text-pink-100/80">
            <span>Voir les Comptes Visiteurs</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={navigateToJobOffers}
          className="relative overflow-hidden rounded-xl px-5 py-4 flex flex-col items-start justify-between text-left bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Offres d'emploi</span>
            </div>
            <span className="text-xs font-semibold text-indigo-900 bg-indigo-200 px-2 py-1 rounded-full">
              {effectiveStats?.jobOffers?.published} publiées
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats?.jobOffers?.total}</p>
            <p className="text-xs text-indigo-100 mt-1">Offres au total</p>
          </div>
          <div className="mt-3 flex items-center justify-between w-full text-xs text-indigo-100/80">
            <span>Gérer les offres</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Graphique des abonnements newsletter */}
        <div className="col-span-1 lg:col-span-2 bg-transparent">
          <div className="flex flex-col items-center text-center mb-4 gap-2">
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Évolution des indicateurs mensuels
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-2">
              <div className="flex flex-wrap justify-center items-center gap-2">
                {[
                  { key: 'comments', label: 'Commentaires', color: '#10b981' },
                  { key: 'newsletters', label: 'Newsletters', color: '#8b5cf6' },
                  { key: 'quoteRequests', label: 'Devis', color: '#f59e0b' },
                  { key: 'jobApplications', label: 'Candidatures', color: '#3b82f6' },
                  { key: 'publishedOffers', label: 'Offres publiées', color: '#ec4899' },
                  { key: 'publishedPosts', label: 'Articles', color: '#14b8a6' }
                ].map(({ key, label, color }) => (
                  <div 
                    key={key}
                    className="flex items-center cursor-pointer px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => toggleSeriesVisibility(key)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-1 transition-opacity"
                      style={{ 
                        backgroundColor: color,
                        opacity: visibleSeries[key as keyof typeof visibleSeries] ? 1 : 0.3,
                        transition: 'opacity 0.2s ease-in-out'
                      }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-sm rounded border border-gray-300 px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ml-2"
              >
                {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="h-72 pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData.monthlyTrends.filter((item: MonthlyTrendItem) => {
                  const dateString = item.monthDate || item.name || new Date().toISOString();
                  const itemYear = new Date(dateString).getFullYear();
                  return itemYear === selectedYear;
                })}
                margin={{ top: 30, right: 30, left: 0, bottom: 0 }}
                stackOffset="none"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF"
                  tick={{ 
                    fill: theme === 'dark' ? '#9CA3AF' : '#4B5563',
                    fontSize: '0.75rem' // Réduire la taille de la police
                  }}
                  tickFormatter={(value, index) => {
                    // Récupérer la date complète depuis les données
                    const item = chartData.monthlyTrends[index];
                    if (!item) return value;
                    
                    // Formater la date au format "MMM-YY" (ex: "jan-25")
                    const date = new Date(item.monthDate || item.start || new Date());
                    const month = date.toLocaleString('fr-FR', { month: 'short' }).substring(0, 3);
                    const year = date.getFullYear().toString().slice(-2);
                    return `${month}-${year}`;
                  }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563' }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {hasData(chartData.monthlyTrends) ? (
                  <>
                    <defs>
                      <linearGradient id="colorNewsletter" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorQuoteRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorJobApplications" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorPublishedOffers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorPublishedPosts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                <defs>
                  <linearGradient id="colorNewsletter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorQuoteRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorJobApplications" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorPublishedOffers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorPublishedPosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name"
                  tick={{
                    fill: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    fontSize: '0.75rem'
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ 
                    fill: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    fontSize: '0.75rem'
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
                  vertical={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  labelStyle={{
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                    fontWeight: 500
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="newsletters" 
                  name="Newsletters"
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorNewsletter)"
                  hide={!visibleSeries.newsletters}
                >
                  <LabelList 
                    dataKey="newsletters" 
                    position="top" 
                    fill="#8b5cf6"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    offset={5}  // Légèrement décalé vers le haut
                    formatter={(value: number) => value > 0 ? value : null}
                  />
                </Area>
                <Area 
                  type="monotone" 
                  dataKey="quoteRequests" 
                  name="Devis" 
                  stroke="#f59e0b" 
                  fillOpacity={1} 
                  fill="url(#colorQuoteRequests)"
                  hide={!visibleSeries.quoteRequests}
                >
                  <LabelList 
                    dataKey="quoteRequests" 
                    position="top" 
                    fill="#f59e0b"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    offset={3}  // Légèrement décalé vers le bas
                    formatter={(value: number) => value > 0 ? value : null}
                  />
                </Area>
                <Area 
                  type="monotone" 
                  dataKey="jobApplications" 
                  name="Candidatures" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorJobApplications)"
                  hide={!visibleSeries.jobApplications}
                >
                  <LabelList 
                    dataKey="jobApplications" 
                    position="top" 
                    fill="#3b82f6"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    formatter={(value: number) => value > 0 ? value : null}
                  />
                </Area>
                <Area 
                  type="monotone" 
                  dataKey="publishedOffers" 
                  name="Offres publiées" 
                  stroke="#f59e0b" 
                  fillOpacity={1} 
                  fill="url(#colorPublishedOffers)"
                  hide={!visibleSeries.publishedOffers}
                  activeDot={{
                    r: 4,
                    fill: '#f59e0b',
                    stroke: '#fff',
                    strokeWidth: 1
                  }}
                >
                  <LabelList 
                    dataKey="publishedOffers" 
                    position="top" 
                    fill="#f59e0b"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    formatter={(value: number) => value > 0 ? value : null}
                  />
                </Area>
                <Area 
                  type="monotone" 
                  dataKey="comments" 
                  name="Commentaires" 
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorComments)" 
                  hide={!visibleSeries.comments}
                  activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                >
                  <LabelList 
                    dataKey="comments" 
                    position="top" 
                    fill="#10b981" 
                    fontSize={12} 
                    fontWeight={500}
                    offset={10}  // Décalage vers le haut
                    formatter={(value: number) => visibleSeries.comments && value > 0 ? value : null}
                  />
                </Area>
                <Area 
                  type="monotone" 
                  dataKey="publishedPosts" 
                  name="Articles publiés"
                  stroke="#ec4899" 
                  fillOpacity={1} 
                  fill="url(#colorPublishedPosts)"
                  hide={!visibleSeries.publishedPosts}
                  activeDot={{
                    r: 4,
                    fill: '#ec4899',
                    stroke: '#fff',
                    strokeWidth: 1
                  }}
                >
                  <LabelList 
                    dataKey="publishedPosts" 
                    position="top" 
                    fill="#ec4899"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    offset={-10}  // Décalage vers le bas
                    formatter={(value: number) => value > 0 ? value : null}
                  />
                </Area>
                  </>
                ) : (
                  <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    fill="#9CA3AF"
                  >
                    Aucune donnée disponible
                  </text>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
                
      </div>

      {/* Blocs de statistiques existants */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => safeNavigate('partners', '/admin/partners')}
          className={`group relative overflow-hidden rounded-lg p-6 cursor-pointer border transition-colors ${
            theme === 'dark'
              ? 'border-gray-700 hover:border-white/30 bg-gray-800'
              : 'border-gray-200 hover:border-primary-300/60 bg-white shadow-sm'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Handshake
                className={`w-8 h-8 ${
                  theme === 'dark'
                    ? 'text-gray-300 group-hover:text-white'
                    : 'text-gray-500 group-hover:text-white'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  effectiveStats?.partners?.trend >= 0
                    ? theme === 'dark'
                      ? 'text-green-200'
                      : 'text-emerald-600'
                    : theme === 'dark'
                      ? 'text-red-200'
                      : 'text-red-500'
                }`}
              >
                {effectiveStats?.partners?.trend >= 0 ? '+' : ''}{effectiveStats?.partners?.trend}%
              </span>
            </div>
            <h3
              className={`text-3xl font-bold mb-2 ${
                theme === 'dark'
                  ? 'text-white group-hover:text-white'
                  : 'text-gray-900 group-hover:text-white'
              }`}
            >
              {effectiveStats?.partners?.total}
            </h3>
            <p
              className={
                theme === 'dark'
                  ? 'text-gray-200 text-sm group-hover:text-white'
                  : 'text-gray-800 text-sm group-hover:text-white'
              }
            >
              Partenaires
            </p>
            <p
              className={
                theme === 'dark'
                  ? 'text-gray-100 text-xs mt-2 group-hover:text-white'
                  : 'text-gray-700 text-xs mt-2 group-hover:text-white'
              }
            >
              <span
                className={
                  theme === 'dark'
                    ? 'text-green-200 font-medium group-hover:text-white'
                    : 'text-emerald-500 font-medium group-hover:text-white'
                }
              >
                +{effectiveStats?.partners?.newThisMonth}
              </span>{' '}
              ce mois
            </p>
          </div>
        </motion.div>


        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => safeNavigate('likes', '/admin/likes')}
          className={`group relative overflow-hidden rounded-lg p-6 cursor-pointer border transition-colors ${
            theme === 'dark'
              ? 'border-gray-700 hover:border-white/30 bg-gray-800'
              : 'border-gray-200 hover:border-primary-300/60 bg-white shadow-sm'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Heart
                className={`w-8 h-8 ${
                  theme === 'dark'
                    ? 'text-gray-300 group-hover:text-white'
                    : 'text-gray-500 group-hover:text-white'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  effectiveStats?.likes?.trend >= 0 
                    ? theme === 'dark' ? 'text-green-200' : 'text-emerald-600'
                    : theme === 'dark' ? 'text-red-200' : 'text-red-600'
                }`}
              >
                {effectiveStats?.likes?.trend >= 0 ? '+' : ''}{effectiveStats?.likes?.trend}%
              </span>
            </div>
            <h3
              className={`text-3xl font-bold mb-2 ${
                theme === 'dark'
                  ? 'text-white group-hover:text-white'
                  : 'text-gray-900 group-hover:text-white'
              }`}
            >
              {effectiveStats?.likes?.total}
            </h3>
            <p
              className={
                theme === 'dark'
                  ? 'text-gray-200 text-sm group-hover:text-white'
                  : 'text-gray-800 text-sm group-hover:text-white'
              }
            >
              Likes totaux
            </p>
            {effectiveStats?.likes?.avgPerPost > 0 && (
              <p
                className={
                  theme === 'dark'
                    ? 'text-gray-100 text-xs mt-2 group-hover:text-white'
                    : 'text-gray-700 text-xs mt-2 group-hover:text-white'
                }
              >
                <span
                  className={
                    theme === 'dark'
                      ? 'text-pink-200 font-medium group-hover:text-white'
                      : 'text-pink-500 font-medium group-hover:text-white'
                  }
                >
                  {effectiveStats?.likes?.avgPerPost}
                </span>{' '}
                moy. par post
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => safeNavigate('comments', '/admin/comments')}
          className={`group relative overflow-hidden rounded-lg p-6 cursor-pointer border transition-colors ${
            theme === 'dark'
              ? 'border-gray-700 hover:border-white/30 bg-gray-800'
              : 'border-gray-200 hover:border-primary-300/60 bg-white shadow-sm'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare
                className={`w-8 h-8 ${
                  theme === 'dark'
                    ? 'text-gray-300 group-hover:text-white'
                    : 'text-gray-500 group-hover:text-white'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  effectiveStats?.comments?.trend >= 0 
                    ? theme === 'dark' ? 'text-green-200' : 'text-emerald-600'
                    : theme === 'dark' ? 'text-red-200' : 'text-red-600'
                }`}
              >
                {effectiveStats?.comments?.trend >= 0 ? '+' : ''}{effectiveStats?.comments?.trend}%
              </span>
            </div>
            <h3
              className={`text-3xl font-bold mb-2 ${
                theme === 'dark'
                  ? 'text-white group-hover:text-white'
                  : 'text-gray-900 group-hover:text-white'
              }`}
            >
              {effectiveStats?.comments?.total}
            </h3>
            <p
              className={
                theme === 'dark'
                  ? 'text-gray-200 text-sm group-hover:text-white'
                  : 'text-gray-800 text-sm group-hover:text-white'
              }
            >
              Commentaires
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => safeNavigate('events', '/admin/events')}
          className={`group relative overflow-hidden rounded-lg p-6 cursor-pointer border transition-colors ${
            theme === 'dark'
              ? 'border-gray-700 hover:border-white/30 bg-gray-800'
              : 'border-gray-200 hover:border-primary-300/60 bg-white shadow-sm'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Calendar
                className={`w-8 h-8 ${
                  theme === 'dark'
                    ? 'text-gray-300 group-hover:text-white'
                    : 'text-gray-500 group-hover:text-white'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-blue-200' : 'text-sky-600'
                }`}
              >
                {effectiveStats?.events?.upcoming} à venir
              </span>
            </div>
            <h3
              className={`text-3xl font-bold mb-2 ${
                theme === 'dark'
                  ? 'text-white group-hover:text-white'
                  : 'text-gray-900 group-hover:text-white'
              }`}
            >
              {effectiveStats?.events?.total}
            </h3>
            <p
              className={
                theme === 'dark'
                  ? 'text-gray-200 text-sm group-hover:text-white'
                  : 'text-gray-800 text-sm group-hover:text-white'
              }
            >
              Événements
            </p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => safeNavigate('settings', '/admin/settings')}
          className={`group relative overflow-hidden rounded-xl p-8 cursor-pointer border flex items-center justify-between min-h-[140px] transition-colors ${
            theme === 'dark'
              ? 'border-gray-700 hover:border-white/30 bg-gray-800'
              : 'border-gray-200 hover:border-primary-300/60 bg-white shadow-sm'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex items-center justify-between w-full">
            <div>
              <h3
                className={`text-lg font-semibold mb-1 ${
                  theme === 'dark'
                    ? 'text-white group-hover:text-white'
                    : 'text-gray-900 group-hover:text-white'
                }`}
              >
                Paramètres
              </h3>
              <p
                className={
                  theme === 'dark'
                    ? 'text-gray-300 text-sm group-hover:text-white'
                    : 'text-gray-800 text-sm group-hover:text-white'
                }
              >
                Gérer les rôles, permissions et préférences admin.
              </p>
            </div>
            <Settings
              className={`w-12 h-12 ${
                theme === 'dark'
                  ? 'text-slate-300 group-hover:text-white'
                  : 'text-slate-500 group-hover:text-white'
              }`}
            />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => safeNavigate('reports', '/admin/reports')}
          className={`group relative overflow-hidden rounded-xl p-8 cursor-pointer border flex items-center justify-between min-h-[140px] transition-colors ${
            theme === 'dark'
              ? 'border-gray-700 hover:border-white/30 bg-gray-800'
              : 'border-gray-200 hover:border-primary-300/60 bg-white shadow-sm'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-fuchsia-700 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex items-center justify-between w-full">
            <div>
              <h3
                className={`text-lg font-semibold mb-1 ${
                  theme === 'dark'
                    ? 'text-white group-hover:text-white'
                    : 'text-gray-900 group-hover:text-white'
                }`}
              >
                Rapports
              </h3>
              <p
                className={
                  theme === 'dark'
                    ? 'text-gray-300 text-sm group-hover:text-white'
                    : 'text-gray-600 text-sm group-hover:text-white'
                }
              >
                Consulter les rapports d'activité et exports.
              </p>
            </div>
            <BarChart3
              className={`w-12 h-12 ${
                theme === 'dark'
                  ? 'text-fuchsia-200 group-hover:text-white'
                  : 'text-fuchsia-500 group-hover:text-white'
              }`}
            />
          </div>
        </motion.div>
      </div>

      {selectedDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden border border-gray-700"
          >
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{selectedDetail.title}</h2>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(80vh-100px)]">
              <table className="w-full">
                <thead className="bg-gray-700 sticky top-0">
                  <tr>
                    {selectedDetail.columns.map((col, index) => (
                      <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {selectedDetail.data.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-700/50">
                      {selectedDetail.columns.map((col, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 text-sm text-gray-300">
                          {row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {expandedChart && (
        <ChartModal
          title={expandedChart.title}
          type={expandedChart.type}
          data={expandedChart.data}
          dataKeys={expandedChart.dataKeys}
          legend={expandedChart.legend}
          onClose={() => setExpandedChart(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
