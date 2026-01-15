import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Heart, FileText, Handshake,
  Calendar, MessageSquare, X, ArrowRight,
  Settings, BarChart3, Bell, Wrench, Briefcase,
  RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Cell, Area, AreaChart, PieChart, Pie, LabelList
} from 'recharts';
import { supabase } from '../../lib/supabase.ts';
import { useNavigate } from 'react-router-dom';
import { ChartModal } from '../../components/admin/ChartModal.tsx';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const [statsLoading, setStatsLoading] = useState(true);
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
  const [stats, setStats] = useState<Stats>({
    partners: { total: 0, newThisMonth: 0, trend: 0 },
    likes: { total: 0, avgPerPost: 0, trend: 0 },
    posts: { total: 0, published: 0, pending: 0 },
    notifications: { total: 0, unread: 0 },
    users: { total: 0, admins: 0, regular: 0, active: 0, inactive: 0, newThisMonth: 0 },
    comments: { total: 0, trend: 0 },
    events: { upcoming: 0, total: 0 },
    quotes: { total: 0, pending: 0, processed: 0, newThisMonth: 0 },
    services: { total: 0, active: 0, withQuotes: 0 },
    candidatures: { total: 0, newThisMonth: 0, pending: 0, approved: 0, rejected: 0, trend: 0 },
    jobOffers: { 
      total: 0, 
      published: 0, 
      draft: 0, 
      archived: 0, 
      expiringSoon: 0, 
      newThisMonth: 0, 
      trend: 0 
    }
  });
  const [displayStats, setDisplayStats] = useState<Stats>({
    partners: { total: 0, newThisMonth: 0, trend: 0 },
    likes: { total: 0, avgPerPost: 0, trend: 0 },
    posts: { total: 0, published: 0, pending: 0 },
    notifications: { total: 0, unread: 0 },
    users: { total: 0, admins: 0, regular: 0, active: 0, inactive: 0, newThisMonth: 0 },
    comments: { total: 0, trend: 0 },
    events: { upcoming: 0, total: 0 },
    quotes: { total: 0, pending: 0, processed: 0, newThisMonth: 0 },
    services: { total: 0, active: 0, withQuotes: 0 },
    candidatures: { total: 0, newThisMonth: 0, pending: 0, approved: 0, rejected: 0, trend: 0 },
    jobOffers: { 
      total: 0, 
      published: 0, 
      draft: 0, 
      archived: 0, 
      expiringSoon: 0, 
      newThisMonth: 0, 
      trend: 0 
    }
  });

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
  const [allowedMenuKeys, setAllowedMenuKeys] = useState<Set<string>>(new Set());
  const [menuPermissionsActive, setMenuPermissionsActive] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const loadUserMenuAccess = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const currentUserId = auth.user?.id;
        if (!currentUserId) {
          setMenuPermissionsActive(false);
          setAllowedMenuKeys(new Set());
          return;
        }

        const { data, error } = await supabase
          .from('user_menu_access')
          .select('menu_items')
          .eq('user_id', currentUserId)
          .maybeSingle();

        if (error || !data) {
          setMenuPermissionsActive(false);
          setAllowedMenuKeys(new Set());
          return;
        }

        const items = (data.menu_items as string[] | null) || [];
        const keys = new Set<string>(items);
        setAllowedMenuKeys(keys);
        setMenuPermissionsActive(true);
      } catch {
        setMenuPermissionsActive(false);
        setAllowedMenuKeys(new Set());
      }
    };

    loadUserMenuAccess();
  }, []);

  const canSeeMenuKey = (key: string): boolean => {
    if (!menuPermissionsActive) return true;
    return allowedMenuKeys.has(key);
  };

  const safeNavigate = (chart: string, path: string) => {
    setExpandedChart(expandedChart === chart ? null : chart);
    navigate(path);
  };

  const navigateToJobOffers = () => {
    navigate('/admin/offres-emploi');
  };

  // Pendant le chargement des statistiques, animons des chiffres aléatoires
  useEffect(() => {
    if (!statsLoading) {
      // Une fois le chargement terminé, on fige les valeurs sur les vraies stats
      setDisplayStats(stats);
      return;
    }

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    const jitter = (value: number, maxDelta: number, min: number, max: number) => {
      const delta = (Math.random() * 2 - 1) * maxDelta; // [-maxDelta, +maxDelta]
      return clamp(Math.round(value + delta), min, max);
    };

    const interval = setInterval(() => {
      setDisplayStats(prev => ({
        ...prev,
        partners: {
          ...prev.partners,
          total: jitter(prev.partners.total || 0, 8, 0, 9999),
          newThisMonth: jitter(prev.partners.newThisMonth || 0, 3, 0, 999),
          trend: jitter(prev.partners.trend || 0, 4, -100, 100),
        },
        likes: {
          ...prev.likes,
          total: jitter(prev.likes.total || 0, 40, 0, 99999),
          avgPerPost: jitter(prev.likes.avgPerPost || 0, 2, 0, 100),
          trend: jitter(prev.likes.trend || 0, 4, -100, 100),
        },
        posts: {
          ...prev.posts,
          total: jitter(prev.posts.total || 0, 10, 0, 9999),
          published: jitter(prev.posts.published || 0, 8, 0, 9999),
          pending: jitter(prev.posts.pending || 0, 3, 0, 9999),
        },
        notifications: {
          ...prev.notifications,
          total: jitter(prev.notifications.total || 0, 12, 0, 9999),
          unread: jitter(prev.notifications.unread || 0, 4, 0, 9999),
        },
        users: {
          ...prev.users,
          total: jitter(prev.users.total || 0, 15, 0, 99999),
          admins: jitter(prev.users.admins || 0, 2, 0, 9999),
          regular: jitter(prev.users.regular || 0, 10, 0, 99999),
          active: jitter(prev.users.active || 0, 10, 0, 99999),
          inactive: jitter(prev.users.inactive || 0, 5, 0, 99999),
          newThisMonth: jitter(prev.users.newThisMonth || 0, 5, 0, 9999),
        },
        comments: {
          ...prev.comments,
          total: jitter(prev.comments.total || 0, 20, 0, 99999),
          trend: jitter(prev.comments.trend || 0, 4, -100, 100),
        },
        events: {
          ...prev.events,
          upcoming: jitter(prev.events.upcoming || 0, 2, 0, 999),
          total: jitter(prev.events.total || 0, 4, 0, 9999),
        },
      }));
    }, 900);

    return () => clearInterval(interval);
  }, [statsLoading, stats]);

  // Stats effectivement affichées : valeurs aléatoires pendant le chargement, vraies valeurs ensuite
  const effectiveStats = statsLoading ? displayStats : stats;

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

  const fetchCandidaturesStats = async () => {
    try {
      // Récupérer tous les profils
      const { data: allCandidatures, error } = await supabase
        .from('profiles')
        .select('id, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des candidatures:', error);
        return;
      }

      console.log('Tous les profils récupérés:', allCandidatures);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
      startOfCurrentMonth.setHours(0, 0, 0, 0);

      // Compter les candidatures
      const stats = {
        total: allCandidatures?.length || 0,
        newThisMonth: allCandidatures?.filter(c => {
          const created = new Date(c.created_at);
          return created >= startOfCurrentMonth;
        }).length || 0,
        pending: 0, // Ces valeurs ne sont plus utilisées
        approved: 0, // car on ne filtre plus par statut
        rejected: 0,
        trend: 0
      };

      console.log('Statistiques des candidatures (depuis profiles):', stats);

      setStats(prev => ({
        ...prev,
        candidatures: stats
      }));

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques des candidatures:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setStatsLoading(true);
      
      // Charger d'abord les statistiques critiques
      await Promise.allSettled([
        fetchQuoteStats(),
        fetchServiceStats(),
        fetchCandidaturesStats(),
        fetchJobOffersStats(),
        fetchLikesStats()
      ]);

      // Ensuite, charger les autres statistiques en arrière-plan
      Promise.allSettled([
        fetchPartnerStats(),
        fetchPostStats(),
        fetchUserStats(),
        fetchCommentStats(),
        fetchEventStats(),
        fetchNotificationStats(),
        fetchChartData()
      ]).catch(console.error);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchQuoteStats = async () => {
    try {
      // Récupérer toutes les demandes de devis
      const { data: allQuotes, error } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des demandes de devis:', error);
        return;
      }

      console.log('Toutes les demandes de devis récupérées:', allQuotes);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
      startOfCurrentMonth.setHours(0, 0, 0, 0);

      // Compter les demandes de devis
      const stats = {
        total: allQuotes?.length || 0,
        pending: allQuotes?.filter(q => q.status === 'pending').length || 0,
        processed: allQuotes?.filter(q => q.status !== 'pending').length || 0,
        newThisMonth: allQuotes?.filter(q => {
          const created = new Date(q.created_at);
          return created >= startOfCurrentMonth;
        }).length || 0
      };

      console.log('Statistiques des demandes de devis:', stats);

      setStats(prev => ({
        ...prev,
        quotes: stats
      }));

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques des devis:', error);
    }
  };

  const fetchServiceStats = async () => {
    try {
      // Récupérer tous les services
      const { data: services } = await supabase
        .from('service')
        .select('id, service_name, service_code, email_reception');

      const totalCount = services?.length || 0;
      
      // Puisque nous n'avons pas de colonne is_active, on considère tous les services comme actifs
      const activeCount = totalCount;

      // Compter les services avec des devis
      const { count: withQuotesCount } = await supabase
        .from('quotations')
        .select('service_id', { count: 'exact', head: true })
        .not('service_id', 'is', null);

      setStats(prev => ({
        ...prev,
        services: {
          total: totalCount,
          active: activeCount, // Même valeur que totalCount car pas de statut actif/inactif
          withQuotes: withQuotesCount || 0
        }
      }));

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques des services:', error);
    }
  };

  const fetchJobOffersStats = async () => {
    try {
      const { data: allOffers, error } = await supabase
        .from('job_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des offres d\'emploi:', error);
        return;
      }

      console.log('Toutes les offres d\'emploi récupérées:', allOffers);

      const now = new Date();
      const oneMonthAgo = subMonths(now, 1);
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(now.getDate() + 14);

      const stats = {
        total: allOffers?.length || 0,
        published: allOffers?.filter(o => o.status === 'published').length || 0,
        draft: allOffers?.filter(o => o.status === 'draft').length || 0,
        archived: allOffers?.filter(o => o.status === 'archived').length || 0,
        expiringSoon: allOffers?.filter(o => 
          o.closing_date && 
          new Date(o.closing_date) >= now && 
          new Date(o.closing_date) <= twoWeeksFromNow
        ).length || 0,
        newThisMonth: allOffers?.filter(o => 
          new Date(o.created_at) >= oneMonthAgo
        ).length || 0,
        trend: 0
      };

      console.log('Statistiques des offres d\'emploi:', stats);

      setStats(prev => ({
        ...prev,
        jobOffers: stats
      }));

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques des offres d\'emploi:', error);
    }
  };

  const fetchPartnerStats = async () => {
    const { data: partners } = await supabase.from('partners').select('created_at');
    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);
    const newThisMonth = partners?.filter(p => new Date(p.created_at) >= oneMonthAgo).length || 0;
    const twoMonthsAgo = subMonths(now, 2);
    const lastMonth = partners?.filter(p => {
      const date = new Date(p.created_at);
      return date >= twoMonthsAgo && date < oneMonthAgo;
    }).length || 0;

    const trend = lastMonth > 0 ? ((newThisMonth - lastMonth) / lastMonth) * 100 : 0;

    setStats(prev => ({
      ...prev,
      partners: { total: partners?.length || 0, newThisMonth, trend }
    }));
  };

  const fetchLikesStats = async () => {
    try {
      // Récupérer le nombre total de likes
      const { count: totalLikes, error: countError } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Calculer la tendance (comparaison avec le mois précédent)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { count: lastMonthLikes, error: lastMonthError } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonth.toISOString());

      if (lastMonthError) throw lastMonthError;

      const trend = lastMonthLikes 
        ? Math.round(((totalLikes || 0) - lastMonthLikes) / lastMonthLikes * 100) 
        : (totalLikes ? 100 : 0);

      setStats(prev => ({
        ...prev,
        likes: { 
          total: totalLikes || 0, 
          avgPerPost: 0, // On ne calcule plus la moyenne par post
          trend 
        }
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de likes:', error);
    }
  };

  const fetchCommentStats = async () => {
    try {
      // Récupérer le nombre total de commentaires
      const { count: totalComments, error: countError } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Calculer la tendance (comparaison avec le mois précédent)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { count: lastMonthComments, error: lastMonthError } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonth.toISOString());

      if (lastMonthError) throw lastMonthError;

      const trend = lastMonthComments 
        ? Math.round(((totalComments || 0) - lastMonthComments) / lastMonthComments * 100) 
        : (totalComments ? 100 : 0);

      setStats(prev => ({
        ...prev,
        comments: { 
          total: totalComments || 0,
          trend 
        }
      }));
      
      return; // Sortie anticipée car on a terminé

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de commentaires:', error);
    }
  };

  const fetchPostStats = async () => {
    const { data: allPosts } = await supabase.from('news_posts').select('is_published');
    const published = allPosts?.filter(p => p.is_published).length || 0;
    const pending = allPosts?.filter(p => !p.is_published).length || 0;

    setStats(prev => ({
      ...prev,
      posts: { total: allPosts?.length || 0, published, pending }
    }));
  };

  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, created_at, status');

      if (error) {
        console.error('[AdminDashboard] Error fetching users from public.users:', error);
        return;
      }

      const baseUsers = (data || []).map((u: any) => ({
        id: u.id as string,
        created_at: u.created_at as string,
        status: (u.status ?? 'active') as string,
      }));

      if (baseUsers.length === 0) {
        setStats(prev => ({
          ...prev,
          users: { total: 0, admins: 0, regular: 0, active: 0, inactive: 0, newThisMonth: 0 }
        }));
        return;
      }

      const { data: allUserRoles, error: allUserRolesError } = await supabase
        .from('user_roles')
        .select('user_id, roles:roles(name, is_system, is_admin)');

      if (allUserRolesError) {
        console.warn('[AdminDashboard] Error fetching user roles:', allUserRolesError);
      }

      const rolesByUser: Record<string, { slug: string; name: string; is_system: boolean | null; is_admin: boolean | null }[]> = {};
      (allUserRoles || []).forEach((row: any) => {
        const role = row.roles;
        if (!role || !role.name) return;

        const slug = role.name
          .toString()
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        if (!rolesByUser[row.user_id]) rolesByUser[row.user_id] = [];
        rolesByUser[row.user_id].push({
          slug,
          name: role.name,
          is_system: role.is_system ?? false,
          is_admin: role.is_admin ?? false,
        });
      });

      const now = new Date();
      const oneMonthAgo = subMonths(now, 1);

      let admins = 0;
      let regular = 0;
      let active = 0;
      let inactive = 0;
      let newThisMonth = 0;

      for (const u of baseUsers) {
        const roles = rolesByUser[u.id] || [];
        const adminRole = roles.find(r => r.is_admin);
        const partnerRole = roles.find(r => r.slug === 'partner');
        const customRoles = roles.filter(r => !r.is_system);

        const isAdmin = !!adminRole;
        const isPartner = !!partnerRole;
        const hasCustom = customRoles.length > 0;

        if (isAdmin) {
          admins++;
        } else if (!isPartner && !hasCustom) {
          regular++;
        }

        const isActive = (u.status ?? 'active') === 'active';
        if (isActive) active++; else inactive++;

        const createdAt = new Date(u.created_at);
        if (createdAt >= oneMonthAgo) {
          newThisMonth++;
        }
      }

      setStats(prev => ({
        ...prev,
        users: {
          total: baseUsers.length,
          admins,
          regular,
          active,
          inactive,
          newThisMonth,
        }
      }));
    } catch (err) {
      console.error('[AdminDashboard] Unexpected error while computing user stats:', err);
    }
  };

  const fetchEventStats = async () => {
    const { data: allEvents } = await supabase.from('news_events').select('event_date');
    const now = new Date();
    const upcoming = allEvents?.filter(e => new Date(e.event_date) >= now).length || 0;

    setStats(prev => ({
      ...prev,
      events: { upcoming, total: allEvents?.length || 0 }
    }));
  };

  const fetchNotificationStats = async () => {
    const { count: totalCount } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true });

    const { count: unreadCount } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    setStats(prev => ({
      ...prev,
      notifications: {
        total: totalCount || 0,
        unread: unreadCount || 0
      }
    }));
  };

  // Fonction pour compter les candidatures par mois
  const countCandidaturesByMonth = (candidatures: any[], monthStart: Date, monthEnd: Date) => {
    return candidatures.filter(c => {
      const date = new Date(c.created_at);
      return date >= monthStart && date <= monthEnd;
    }).length;
  };

  const fetchChartData = async () => {
    try {
      setChartsLoading(true);
      const now = new Date();
      
      // Récupérer les commentaires avec leur date de création depuis post_comments
      console.log('Récupération des commentaires depuis post_comments...');
      const { data: allComments, error: commentsError } = await supabase
        .from('post_comments')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (commentsError) {
        console.error('Erreur lors de la récupération des commentaires:', commentsError);
      } else {
        console.log('Commentaires récupérés depuis post_comments:', allComments);
        if (allComments && allComments.length > 0) {
          allComments.forEach(comment => {
            console.log('Commentaire (post_comments):', {
              id: comment.id,
              post_id: comment.post_id,
              user_id: comment.user_id,
              content: comment.content,
              created_at: comment.created_at ? new Date(comment.created_at).toLocaleDateString('fr-FR') : 'Date invalide',
              updated_at: comment.updated_at
            });
          });
        } else {
          console.log('Aucun commentaire trouvé dans post_comments');
        }
      }
      
      // Récupérer d'abord les candidatures
      const { data: allCandidatures, error: candidaturesError } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: false });

      if (candidaturesError) {
        console.error('Erreur lors de la récupération des candidatures:', candidaturesError);
        return;
      }
      
      // Générer les données pour les 12 derniers mois
      const monthsData: MonthData[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        // Compter les candidatures pour ce mois
        const candidaturesCount = allCandidatures 
          ? countCandidaturesByMonth(allCandidatures, monthStart, monthEnd)
          : 0;
        
        monthsData.push({
          monthDate,
          start: monthStart,
          end: monthEnd,
          name: format(monthDate, 'MMMM yyyy', { locale: fr }),
          shortName: format(monthDate, 'MMM', { locale: fr }),
          jobApplications: candidaturesCount,
          // Compter les commentaires pour ce mois (depuis post_comments)
          comments: allComments && allComments.length > 0 
            ? allComments.filter(comment => {
                if (!comment || !comment.created_at) return false;
                try {
                  const commentDate = new Date(comment.created_at);
                  const isInRange = commentDate >= monthStart && commentDate <= monthEnd;
                  if (isInRange) {
                    console.log(`Commentaire trouvé pour ${format(monthDate, 'MMMM yyyy', { locale: fr })}:`, {
                      id: comment.id,
                      post_id: comment.post_id,
                      created_at: comment.created_at
                    });
                  }
                  return isInRange;
                } catch (e) {
                  console.error('Erreur lors du traitement de la date du commentaire:', e, comment);
                  return false;
                }
              }).length 
            : 0,
          // Conserver les autres métriques avec des valeurs par défaut pour l'instant
          newsletters: 0,
          quoteRequests: 0,
          publishedOffers: 0,
          publishedPosts: 0
        });
      }

      // Afficher le décompte des commentaires par mois pour le débogage
      console.log('Résumé des commentaires par mois:');
      monthsData.forEach(month => {
        console.log(`${month.name}: ${month.comments} commentaire(s)`);
      });

      // Création des données pour le graphique
      const monthlyTrends = monthsData.map(monthData => {
        const result = {
          name: monthData.shortName,
          fullName: monthData.name,
          monthDate: monthData.monthDate,
          start: monthData.start,
          end: monthData.end,
          jobApplications: monthData.jobApplications || 0,
          comments: monthData.comments || 0,
          newsletters: monthData.newsletters || 0,
          quoteRequests: monthData.quoteRequests || 0,
          publishedOffers: monthData.publishedOffers || 0,
          publishedPosts: monthData.publishedPosts || 0
        };
        
        console.log(`Données pour ${monthData.name}:`, result);
        return result;
      });

      const rangeStart = monthsData[0].start;
      
      // Récupération des autres données en parallèle
      const [
        { data: quotesWithServices, error: quotesError },
        { data: newsletters },
        { data: publishedPosts, error: postsError },
        { data: jobOffers, error: jobOffersError },
        sessionData
      ] = await Promise.all([
        // Récupération des demandes de devis avec les services associés
        (async () => {
          console.log('Début de la récupération des demandes de devis...');
          const { data, error } = await supabase
            .from('quote_requests')
            .select('id, created_at, service_name')
            .not('service_name', 'is', null)
            .gte('created_at', monthsData[0].start.toISOString());
          
          console.log('Résultat brut de la requête quote_requests:', { data, error });
          return { data, error };
        })(),
        
        // Récupération des abonnements newsletter
        supabase
          .from('newsletter_subscribers')
          .select('subscribed_at, status')
          .gte('subscribed_at', monthsData[0].start.toISOString())
          .eq('status', 'active'),
        
        // Récupération des articles publiés avec leur date d'événement
        supabase
          .from('news_posts')
          .select('event_date, is_published')
          .eq('is_published', true)
          .not('event_date', 'is', null)
          .gte('event_date', monthsData[0].start.toISOString()),
        
        // Récupération des offres d'emploi
        supabase
          .from('job_offers')
          .select('created_at, status')
          .gte('created_at', monthsData[0].start.toISOString()),
        
        // Session utilisateur
        supabase.auth.getSession()
      ]);

      // Mise à jour des articles publiés avec les vrais comptages
      if (publishedPosts) {
        console.log('Articles publiés récupérés:', publishedPosts);
        monthsData.forEach(monthData => {
          const postsInMonth = publishedPosts.filter((post: any) => {
            if (!post.event_date) return false;
            try {
              const eventDate = new Date(post.event_date);
              return eventDate >= monthData.start && eventDate <= monthData.end;
            } catch (e) {
              console.error('Erreur de format de date:', post.event_date, e);
              return false;
            }
          });
          monthData.publishedPosts = postsInMonth.length;
          console.log(`Mois ${monthData.name}: ${postsInMonth.length} articles`);
        });
        console.log('Résumé des articles publiés par mois:', monthsData.map(m => ({
          mois: m.name, 
          debut: m.start.toISOString().split('T')[0],
          fin: m.end.toISOString().split('T')[0],
          articles: m.publishedPosts
        })));

        // Mise à jour des autres métriques dans monthlyTrends
        monthlyTrends.forEach((month, index) => {
          // Ne pas écraser publishedOffers qui a déjà été mis à jour
          month.publishedPosts = monthsData[index].publishedPosts || 0;
          month.newsletters = monthsData[index].newsletters || 0;
          month.quoteRequests = monthsData[index].quoteRequests || 0;
          
          // Débogage des valeurs
          console.log(`Mois ${month.name} - Métriques:`, {
            articles: month.publishedPosts,
            newsletters: month.newsletters,
            devis: month.quoteRequests,
            offres: month.publishedOffers
          });
        });
      }

      // Mise à jour des newsletters avec les vrais comptages
      if (newsletters) {
        console.log('=== DÉBOGAGE - Newsletters récupérées ===');
        console.log('Nombre total d\'abonnés newsletter:', newsletters.length);
        console.log('Détail des abonnements:', newsletters.map((n: any) => ({
          id: n.id,
          subscribed_at: n.subscribed_at,
          status: n.status,
          date: n.subscribed_at ? new Date(n.subscribed_at).toISOString() : 'DATE_INVALIDE'
        })));
        
        monthsData.forEach((monthData, index) => {
          console.log(`\n=== Traitement du mois: ${monthData.name} (${monthData.start.toISOString()} - ${monthData.end.toISOString()}) ===`);
          
          const newslettersInMonth = newsletters.filter((n: any) => {
            try {
              if (!n.subscribed_at) {
                console.log('Abonnement sans date d\'abonnement:', n);
                return false;
              }
              
              const date = new Date(n.subscribed_at);
              const isInDateRange = date >= monthData.start && date <= monthData.end;
              
              // Log pour le débogage
              if (isInDateRange) {
                console.log(`- Abonnement #${n.id}:`, {
                  date: date.toISOString(),
                  status: n.status,
                  inDateRange: 'OUI'
                });
              }
              
              return isInDateRange && n.status === 'active';
            } catch (e) {
              console.error('Erreur de format de date d\'abonnement:', n?.subscribed_at, e);
              return false;
            }
          });
          
          const newslettersCount = newslettersInMonth.length;
          monthData.newsletters = newslettersCount;
          
          // Mettre à jour directement monthlyTrends
          if (monthlyTrends[index]) {
            monthlyTrends[index].newsletters = newslettersCount;
          }
          
          console.log(`Résultat pour ${monthData.name}: ${newslettersCount} abonnements actifs`);
        });
        
        console.log('=== FIN DU DÉBOGAGE DES NEWSLETTERS ===\n');
        console.log('Vérification de monthlyTrends après mise à jour des newsletters:', 
          JSON.parse(JSON.stringify(monthlyTrends.map(m => ({
            mois: m.name,
            newsletters: m.newsletters,
            dateDebut: m.start.toISOString().split('T')[0],
            dateFin: m.end.toISOString().split('T')[0]
          }))))
        );
      }

      // Mise à jour des demandes de devis avec les vrais comptages
      if (quotesWithServices) {
        console.log('=== DÉBOGAGE - Demandes de devis récupérées ===');
        console.log('Nombre total de demandes de devis:', quotesWithServices.length);
        console.log('Détail des demandes:', quotesWithServices.map((q: any) => ({
          id: q.id,
          created_at: q.created_at,
          date: new Date(q.created_at).toISOString()
        })));
        
        monthsData.forEach((monthData, index) => {
          console.log(`\n=== Traitement du mois: ${monthData.name} (${monthData.start.toISOString()} - ${monthData.end.toISOString()}) ===`);
          
          // Compter les demandes de devis pour ce mois
          const quotesInMonth = quotesWithServices.filter((quote: any) => {
            try {
              const quoteDate = new Date(quote.created_at);
              const isInDateRange = quoteDate >= monthData.start && quoteDate <= monthData.end;
              
              // Log pour le débogage
              if (isInDateRange) {
                console.log(`- Demande #${quote.id}:`, {
                  date: quoteDate.toISOString(),
                  inDateRange: 'OUI'
                });
              }
              
              return isInDateRange;
            } catch (e) {
              console.error('Erreur de format de date de devis:', quote?.created_at, e);
              return false;
            }
          });
          
          const quotesCount = quotesInMonth.length;
          monthData.quoteRequests = quotesCount;
          
          // Mettre à jour directement monthlyTrends
          if (monthlyTrends[index]) {
            monthlyTrends[index].quoteRequests = quotesCount;
          }
          
          console.log(`Résultat pour ${monthData.name}: ${quotesCount} demandes de devis`);
        });
        
        console.log('=== FIN DU DÉBOGAGE DES DEMANDES DE DEVIS ===\n');
        console.log('Vérification de monthlyTrends après mise à jour des demandes de devis:', JSON.parse(JSON.stringify(monthlyTrends)));
      }

      // Mise à jour des offres d'emploi avec les vrais comptages
      if (jobOffers) {
        console.log('=== DÉBOGAGE - Offres d\'emploi récupérées ===');
        console.log('Nombre total d\'offres:', jobOffers.length);
        console.log('Détail des offres:', jobOffers.map((o: any) => ({
          id: o.id,
          status: o.status,
          created_at: o.created_at,
          is_published: o.status === 'published' ? 'OUI' : 'NON',
          date: new Date(o.created_at).toISOString()
        })));
        
        monthsData.forEach((monthData, index) => {
          console.log(`\n=== Traitement du mois: ${monthData.name} (${monthData.start.toISOString()} - ${monthData.end.toISOString()}) ===`);
          
          // Compter les offres publiées pour ce mois
          const offersInMonth = jobOffers.filter((offer: any) => {
            try {
              const offerDate = new Date(offer.created_at);
              const isInDateRange = offerDate >= monthData.start && offerDate <= monthData.end;
              const isPublished = String(offer.status).toLowerCase() === 'published';
              
              // Log pour le débogage
              if (isPublished) {
                console.log(`- Offre #${offer.id}:`, {
                  date: offerDate.toISOString(),
                  status: offer.status,
                  inDateRange: isInDateRange ? 'OUI' : 'NON',
                  isPublished: isPublished ? 'OUI' : 'NON'
                });
              }
              
              return isPublished && isInDateRange;
            } catch (e) {
              console.error('Erreur de format de date d\'offre:', offer?.created_at, e);
              return false;
            }
          });
          
          const publishedOffersCount = offersInMonth.length;
          monthData.publishedOffers = publishedOffersCount;
          
          // Mettre à jour directement monthlyTrends
          if (monthlyTrends[index]) {
            monthlyTrends[index].publishedOffers = publishedOffersCount;
          }
          
          console.log(`Résultat pour ${monthData.name}: ${publishedOffersCount} offres publiées`);
        });
        
        console.log('=== FIN DU DÉBOGAGE DES OFFRES ===\n');
        console.log('Vérification de monthlyTrends après mise à jour des offres:', JSON.parse(JSON.stringify(monthlyTrends)));
      }

      // Préparation des données pour le graphique des demandes par service
      const serviceStatsMap = new Map();
      
      if (quotesWithServices && quotesWithServices.length > 0) {
        console.log('Demandes de devis avec services:', quotesWithServices); // Debug
        
        quotesWithServices.forEach(quote => {
          // Utiliser directement service_name puisque c'est ce qu'on récupère
          const serviceName = quote.service_name || 'Sans service';
          const count = serviceStatsMap.get(serviceName) || 0;
          serviceStatsMap.set(serviceName, count + 1);
        });
      } else {
        console.log('Aucune demande de devis trouvée ou erreur de chargement');
      }

      const serviceStats = Array.from(serviceStatsMap.entries()).map(([name, value], index) => ({
        name: name,
        value: value,
        active: true,
        color: `hsl(${index * 70 % 360}, 70%, 60%)`
      }));
      
      console.log('Résultat de la requête quotesWithServices:', { quotesWithServices, quotesError }); // Debug
      console.log('Statistiques des services calculées:', serviceStats); // Debug

      // Mise à jour de l'état avec les nouvelles données
      console.log('Mise à jour du graphique avec les données:', {
        monthlyTrends,
        publishedPosts: monthlyTrends.map(m => ({
          mois: m.name,
          articles: m.publishedPosts
        }))
      });
      
      setChartData({
        monthlyTrends,
        serviceStats,
        comments: monthlyTrends.map((item: any) => item.comments || 0),
        quoteRequests: monthlyTrends.map((item: any) => item.quoteRequests || 0),
        jobApplications: monthlyTrends.map((item: any) => item.jobApplications || 0),
        publishedOffers: monthlyTrends.map((item: any) => item.publishedOffers || 0),
        publishedPosts: monthlyTrends.map((item: any) => item.publishedPosts || 0),
        userStatus: [
          { name: 'Commentaires', value: allComments?.length || 0, color: '#8b5cf6' },
          { name: 'Candidatures', value: allCandidatures?.length || 0, color: '#3b82f6' },
          { name: 'Demandes de devis', value: quotesWithServices?.length || 0, color: '#8b5cf6' },
          { name: 'Abonnés newsletter', value: newsletters?.length || 0, color: '#8b5cf6' }
        ]
      });

      setChartsLoading(false);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setChartsLoading(false);
    }
  };

  const handleStatClick = async (type: string) => {
    let detailData: DetailedData | null = null;

    switch(type) {
      case 'partners':
        const { data: partners } = await supabase
          .from('partners')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        detailData = {
          title: 'Derniers Partenaires',
          data: partners?.map(p => ({
            nom: p.name,
            type: p.type || '-',
            statut: p.status || 'Actif',
            date: format(new Date(p.created_at), 'dd/MM/yyyy', { locale: fr })
          })) || [],
          columns: [
            { key: 'nom', header: 'Nom' },
            { key: 'type', header: 'Type' },
            { key: 'statut', header: 'Statut' },
            { key: 'date', header: 'Date' }
          ]
        };
        break;

      case 'posts':
        const { data: posts } = await supabase
          .from('news_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        detailData = {
          title: 'Derniers Posts',
          data: posts?.map(p => ({
            titre: p.title,
            auteur: p.author_name,
            statut: p.is_published ? 'Publié' : 'En attente',
            date: format(new Date(p.created_at), 'dd/MM/yyyy', { locale: fr })
          })) || [],
          columns: [
            { key: 'titre', header: 'Titre' },
            { key: 'auteur', header: 'Auteur' },
            { key: 'statut', header: 'Statut' },
            { key: 'date', header: 'Date' }
          ]
        };
        break;

      case 'likes':
        const { data: topPosts } = await supabase
          .from('news_posts')
          .select('id, title');

        const postsWithLikes = await Promise.all(
          (topPosts || []).map(async (post) => {
            const { count } = await supabase
              .from('post_likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);
            return { ...post, likes: count || 0 };
          })
        );

        const sortedPosts = postsWithLikes.sort((a, b) => b.likes - a.likes).slice(0, 10);

        detailData = {
          title: 'Posts les Plus Aimés',
          data: sortedPosts.map(p => ({
            titre: p.title,
            likes: p.likes.toString()
          })),
          columns: [
            { key: 'titre', header: 'Titre' },
            { key: 'likes', header: 'Likes' }
          ]
        };
        break;

      case 'users':
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
            { headers: { Authorization: `Bearer ${session.access_token}` } }
          );
          if (response.ok) {
            const { users } = await response.json();
            const recentUsers = users.slice(0, 10);
            detailData = {
              title: 'Derniers Utilisateurs',
              data: recentUsers.map((u: any) => ({
                email: u.email,
                statut: u.email_confirmed_at ? 'Vérifié' : 'En attente',
                date: format(new Date(u.created_at), 'dd/MM/yyyy', { locale: fr })
              })),
              columns: [
                { key: 'email', header: 'Email' },
                { key: 'statut', header: 'Statut' },
                { key: 'date', header: 'Date' }
              ]
            };
          }
        }
        break;
    }

    setSelectedDetail(detailData);
  };

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      await fetchDashboardData();
    } catch (error) {
      console.error('Erreur lors de l\'actualisation des données:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-20">
        <div className="flex items-center gap-4">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
          <button
            onClick={refreshData}
            disabled={isRefreshing || statsLoading}
            className={`p-2 rounded-full ${isRefreshing || statsLoading ? 'text-gray-400' : 'text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Actualiser les données"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing || statsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {statsLoading && (
          <div className={`flex items-center gap-2 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
            <span>Mise à jour des statistiques...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => safeNavigate('notifications', '/admin/notifications')}
          className="relative overflow-hidden rounded-xl px-5 py-4 flex flex-col items-start justify-between text-left bg-gradient-to-br from-red-600 via-pink-600 to-fuchsia-600 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Notifications</span>
            </div>
            {effectiveStats.notifications.unread > 0 && (
              <span className="text-xs font-semibold text-white bg-black/20 px-2 py-1 rounded-full">
                {effectiveStats.notifications.unread} non lue(s)
              </span>
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats.notifications.total}</p>
            <p className="text-xs text-pink-100 mt-1">Notifications totales</p>
          </div>
          <div className="mt-3 flex items-center justify-between w-full text-xs text-pink-100/80">
            <span>Voir le centre de notifications</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

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
            {effectiveStats.posts.pending > 0 && (
              <span className="text-xs font-semibold text-yellow-900 bg-yellow-300 px-2 py-1 rounded-full">
                {effectiveStats.posts.pending} en attente
              </span>
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats.posts.total}</p>
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
              +{effectiveStats.partners.newThisMonth} ce mois
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats.partners.total}</p>
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
              +{effectiveStats.users.newThisMonth} ce mois
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats.users.total}</p>
            <p className="text-xs text-amber-100 mt-1">Utilisateurs au total</p>
            <div className="mt-2 text-xs text-amber-100/80 space-y-1">
              <p>{effectiveStats.users.admins} admin{effectiveStats.users.admins > 1 ? 's' : ''} · {effectiveStats.users.regular} utilisateur{effectiveStats.users.regular > 1 ? 's' : ''}</p>
              <p>{effectiveStats.users.active} actif{effectiveStats.users.active > 1 ? 's' : ''} · {effectiveStats.users.inactive} inactif{effectiveStats.users.inactive > 1 ? 's' : ''}</p>
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
            {effectiveStats.quotes.pending > 0 && (
              <span className="text-xs font-semibold text-purple-900 bg-purple-200 px-2 py-1 rounded-full">
                {effectiveStats.quotes.pending} en attente
              </span>
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats.quotes.total}</p>
            <p className="text-xs text-purple-100 mt-1">Demandes au total</p>
          </div>
          <div className="mt-3 flex items-center justify-between w-full text-xs text-purple-100/80">
            <span>Voir toutes les demandes</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={() => safeNavigate('candidatures', '/admin/candidatures')}
          className="relative overflow-hidden rounded-xl px-5 py-4 flex flex-col items-start justify-between text-left bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-600 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Candidatures</span>
            </div>
            <span className="text-xs font-semibold text-rose-200 bg-rose-900/30 px-2 py-1 rounded-full">
              +{effectiveStats.candidatures.newThisMonth} ce mois
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats.candidatures.total}</p>
            <p className="text-xs text-pink-100 mt-1">Candidatures au total</p>
          </div>
          <div className="mt-3 flex items-center justify-between w-full text-xs text-pink-100/80">
            <span>Voir toutes les candidatures</span>
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
              {effectiveStats.services?.total || 0} services
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats.services?.total || 0}</p>
            <p className="text-xs text-emerald-100 mt-1">Services disponibles</p>
          </div>
          <div className="mt-3 flex items-center justify-between w-full text-xs text-emerald-100/80">
            <span>Gérer les services</span>
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
              {effectiveStats.jobOffers.published} publiées
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats.jobOffers.total}</p>
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
                  effectiveStats.partners.trend >= 0
                    ? theme === 'dark'
                      ? 'text-green-200'
                      : 'text-emerald-600'
                    : theme === 'dark'
                      ? 'text-red-200'
                      : 'text-red-500'
                }`}
              >
                {effectiveStats.partners.trend >= 0 ? '+' : ''}{effectiveStats.partners.trend.toFixed(0)}%
              </span>
            </div>
            <h3
              className={`text-3xl font-bold mb-2 ${
                theme === 'dark'
                  ? 'text-white group-hover:text-white'
                  : 'text-gray-900 group-hover:text-white'
              }`}
            >
              {effectiveStats.partners.total}
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
                +{effectiveStats.partners.newThisMonth}
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
                  effectiveStats.likes.trend >= 0 
                    ? theme === 'dark' ? 'text-green-200' : 'text-emerald-600'
                    : theme === 'dark' ? 'text-red-200' : 'text-red-600'
                }`}
              >
                {effectiveStats.likes.trend >= 0 ? '+' : ''}{effectiveStats.likes.trend}%
              </span>
            </div>
            <h3
              className={`text-3xl font-bold mb-2 ${
                theme === 'dark'
                  ? 'text-white group-hover:text-white'
                  : 'text-gray-900 group-hover:text-white'
              }`}
            >
              {effectiveStats.likes.total}
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
            {effectiveStats.likes.avgPerPost > 0 && (
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
                  {effectiveStats.likes.avgPerPost}
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
                  effectiveStats.comments.trend >= 0 
                    ? theme === 'dark' ? 'text-green-200' : 'text-emerald-600'
                    : theme === 'dark' ? 'text-red-200' : 'text-red-600'
                }`}
              >
                {effectiveStats.comments.trend >= 0 ? '+' : ''}{effectiveStats.comments.trend}%
              </span>
            </div>
            <h3
              className={`text-3xl font-bold mb-2 ${
                theme === 'dark'
                  ? 'text-white group-hover:text-white'
                  : 'text-gray-900 group-hover:text-white'
              }`}
            >
              {effectiveStats.comments.total}
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
                {effectiveStats.events.upcoming} à venir
              </span>
            </div>
            <h3
              className={`text-3xl font-bold mb-2 ${
                theme === 'dark'
                  ? 'text-white group-hover:text-white'
                  : 'text-gray-900 group-hover:text-white'
              }`}
            >
              {effectiveStats.events.total}
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
