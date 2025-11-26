import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Heart, FileText, Handshake,
  Calendar, MessageSquare, X, ArrowRight,
  Settings, BarChart3, Bell, Wrench
} from 'lucide-react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ChartModal } from '../components/admin/ChartModal';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

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
}

interface DetailedData {
  title: string;
  data: any[];
  columns: { key: string; header: string }[];
}

const AdminDashboardPage: React.FC = () => {
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [stats, setStats] = useState<Stats>({
    partners: { total: 0, newThisMonth: 0, trend: 0 },
    likes: { total: 0, avgPerPost: 0, trend: 0 },
    posts: { total: 0, published: 0, pending: 0 },
    notifications: { total: 0, unread: 0 },
    users: { total: 0, admins: 0, regular: 0, active: 0, inactive: 0, newThisMonth: 0 },
    comments: { total: 0, trend: 0 },
    events: { upcoming: 0, total: 0 },
    quotes: { total: 0, pending: 0, processed: 0, newThisMonth: 0 },
    services: { total: 0, active: 0, withQuotes: 0 }
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
    services: { total: 0, active: 0, withQuotes: 0 }
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
    userStatus: []
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

  const safeNavigate = (key: string, path: string) => {
    if (!canSeeMenuKey(key)) return;
    navigate(path);
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

  const fetchDashboardData = async () => {
    try {
      setStatsLoading(true);
      
      // Charger d'abord les statistiques critiques
      await Promise.allSettled([
        fetchQuoteStats(),
        fetchServiceStats()
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

  const fetchQuoteStats = async () => {
    try {
      // Vérifier si la table existe
      const { data: tableExists } = await supabase
        .from('quote_requests')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!tableExists) {
        console.warn('La table quote_requests n\'existe pas');
        return;
      }

      // Exécuter les requêtes en parallèle
      const [
        { count: totalCount = 0 },
        { count: pendingCount = 0 },
        { count: processedCount = 0 },
        { count: newThisMonthCount = 0 }
      ] = await Promise.all([
        supabase
          .from('quote_requests')
          .select('*', { count: 'exact', head: true })
          .then(({ count }) => ({ count: count || 0 }))
          .catch(() => ({ count: 0 })),

        supabase
          .from('quote_requests')
          .select('*', { count: 'exact', head: true })
          .is('processed_at', null)
          .then(({ count }) => ({ count: count || 0 }))
          .catch(() => ({ count: 0 })),

        supabase
          .from('quote_requests')
          .select('*', { count: 'exact', head: true })
          .not('processed_at', 'is', null)
          .then(({ count }) => ({ count: count || 0 }))
          .catch(() => ({ count: 0 })),

        (async () => {
          const startOfCurrentMonth = new Date();
          startOfCurrentMonth.setDate(1);
          startOfCurrentMonth.setHours(0, 0, 0, 0);

          const { count } = await supabase
            .from('quote_requests')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfCurrentMonth.toISOString())
            .catch(() => ({ count: 0 }));

          return { count: count || 0 };
        })()
      ]);

      setStats(prev => ({
        ...prev,
        quotes: {
          total: totalCount,
          pending: pendingCount,
          processed: processedCount,
          newThisMonth: newThisMonthCount,
        }
      }));

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques des devis:', error);
    }
  };

  const fetchServiceStats = async () => {
    try {
      // Vérifier si la table existe
      const { data: tableExists } = await supabase
        .from('services')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!tableExists) {
        console.warn('La table services n\'existe pas');
        return;
      }

      // Exécuter les requêtes en parallèle
      const [
        { count: totalCount = 0 },
        { count: activeCount = 0 },
        { count: withQuotesCount = 0 }
      ] = await Promise.all([
        supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .then(({ count }) => ({ count: count || 0 }))
          .catch(() => ({ count: 0 })),

        supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .then(({ count }) => ({ count: count || 0 }))
          .catch(() => ({ count: 0 })),

        supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .not('quote_requests', 'is', null)
          .then(({ count }) => ({ count: count || 0 }))
          .catch(() => ({ count: 0 }))
      ]);

      setStats(prev => ({
        ...prev,
        services: {
          total: totalCount,
          active: activeCount,
          withQuotes: withQuotesCount
        }
      }));

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques des services:', error);
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
    const { count: likesCount } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true });
    const { count: postsCount } = await supabase
      .from('news_posts')
      .select('*', { count: 'exact', head: true });
    const avgPerPost = postsCount ? (likesCount || 0) / postsCount : 0;

    setStats(prev => ({
      ...prev,
      likes: { total: likesCount || 0, avgPerPost: Math.round(avgPerPost * 10) / 10, trend: 15 }
    }));
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

  const fetchCommentStats = async () => {
    const { count: commentsCount } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true });

    setStats(prev => ({
      ...prev,
      comments: { total: commentsCount || 0, trend: 12 }
    }));
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

  const fetchChartData = async () => {
    try {
      setChartsLoading(true);
      const now = new Date();
      const months = Array.from({ length: 6 }, (_, idx) => 5 - idx).map((i) => {
        const monthDate = subMonths(now, i);
        return {
          monthDate,
          start: startOfMonth(monthDate),
          end: endOfMonth(monthDate),
        };
      });

      const rangeStart = months[0].start;
      const { data: partnersAll } = await supabase
        .from('partners')
        .select('created_at')
        .gte('created_at', rangeStart.toISOString());

      const { data: { session } } = await supabase.auth.getSession();
      let allUsers: any[] = [];
      if (session?.access_token) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        if (response.ok) {
          const payload = await response.json();
          allUsers = payload.users || [];
        }
      }

      const monthlyTrends = months.map(({ monthDate, start, end }) => {
        const partnersCount = (partnersAll || []).filter(p => {
          const d = new Date(p.created_at);
          return d >= start && d <= end;
        }).length;
        const usersCount = allUsers.filter((u: any) => {
          const d = new Date(u.created_at);
          return d >= start && d <= end;
        }).length;
        return {
          month: format(monthDate, 'MMM', { locale: fr }),
          partners: partnersCount,
          users: usersCount
        };
      });

      const verified = allUsers.filter((u: any) => u.email_confirmed_at).length;
      const pending = allUsers.length - verified;
      const userStatus: { name: string; value: number }[] = [
        { name: 'Vérifiés', value: verified },
        { name: 'En attente', value: pending }
      ];

      setChartData({
        monthlyTrends,
        userStatus
      });
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-20">
        <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
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
          onClick={() => safeNavigate('services', '/admin/services')}
          className="relative overflow-hidden rounded-xl px-5 py-4 flex flex-col items-start justify-between text-left bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-600 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Services</span>
            </div>
            <span className="text-xs font-semibold text-cyan-900 bg-cyan-200 px-2 py-1 rounded-full">
              {effectiveStats.services.active} actifs
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-tight">{effectiveStats.services.total}</p>
            <p className="text-xs text-cyan-100 mt-1">Services au total</p>
          </div>
          <div className="mt-3 flex items-center justify-between w-full text-xs text-cyan-100/80">
            <span>Gérer les services</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => safeNavigate('posts', '/admin/posts')}
          className={`group relative overflow-hidden rounded-lg p-6 cursor-pointer border transition-colors ${
            theme === 'dark'
              ? 'border-gray-700 hover:border-white/30 bg-gray-800'
              : 'border-gray-200 hover:border-primary-300/60 bg-white shadow-sm'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <FileText
                className={`w-8 h-8 ${
                  theme === 'dark'
                    ? 'text-gray-300 group-hover:text-white'
                    : 'text-gray-500 group-hover:text-white'
                }`}
              />
              <span className="text-sm font-medium text-yellow-500">{effectiveStats.posts.pending} en attente</span>
            </div>
            <h3
              className={`text-3xl font-bold mb-2 ${
                theme === 'dark'
                  ? 'text-white group-hover:text-white'
                  : 'text-gray-900 group-hover:text-white'
              }`}
            >
              {effectiveStats.posts.total}
            </h3>
            <p
              className={
                theme === 'dark'
                  ? 'text-gray-200 text-sm group-hover:text-white'
                  : 'text-gray-800 text-sm group-hover:text-white'
              }
            >
              Posts
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
                    ? 'text-green-300 font-medium group-hover:text-white'
                    : 'text-emerald-500 font-medium group-hover:text-white'
                }
              >
                {effectiveStats.posts.published}
              </span>{' '}
              publiés
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => safeNavigate('users', '/admin/users')}
          className={`group relative overflow-hidden rounded-lg p-6 cursor-pointer border transition-colors ${
            theme === 'dark'
              ? 'border-gray-700 hover:border-white/30 bg-gray-800'
              : 'border-gray-200 hover:border-primary-300/60 bg-white shadow-sm'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Users
                className={`w-8 h-8 ${
                  theme === 'dark'
                    ? 'text-gray-300 group-hover:text-white'
                    : 'text-gray-500 group-hover:text-white'
                }`}
              />
              <span className="text-xs font-medium text-green-900 bg-green-300 px-2 py-1 rounded-full">
                +{effectiveStats.users.newThisMonth} ce mois
              </span>
            </div>
            <h3
              className={`text-3xl font-bold mb-2 ${
                theme === 'dark'
                  ? 'text-white group-hover:text-white'
                  : 'text-gray-900 group-hover:text-white'
              }`}
            >
              {effectiveStats.users.total}
            </h3>
            <p
              className={
                theme === 'dark'
                  ? 'text-gray-200 text-sm mb-1 group-hover:text-white'
                  : 'text-gray-800 text-sm mb-1 group-hover:text-white'
              }
            >
              <span
                className={
                  theme === 'dark'
                    ? 'text-amber-200 font-semibold group-hover:text-white'
                    : 'text-amber-500 font-semibold group-hover:text-white'
                }
              >
                {effectiveStats.users.admins}
              </span>{' '}
              admins ·{' '}
              <span
                className={
                  theme === 'dark'
                    ? 'text-blue-200 font-semibold group-hover:text-white'
                    : 'text-blue-500 font-semibold group-hover:text-white'
                }
              >
                {effectiveStats.users.regular}
              </span>{' '}
              users
            </p>
            <p
              className={
                theme === 'dark'
                  ? 'text-gray-100 text-xs group-hover:text-white'
                  : 'text-gray-700 text-xs group-hover:text-white'
              }
            >
              <span
                className={
                  theme === 'dark'
                    ? 'text-emerald-200 font-medium group-hover:text-white'
                    : 'text-emerald-500 font-medium group-hover:text-white'
                }
              >
                {effectiveStats.users.active}
              </span>{' '}
              actifs ·{' '}
              <span
                className={
                  theme === 'dark'
                    ? 'text-red-200 font-medium group-hover:text-white'
                    : 'text-red-500 font-medium group-hover:text-white'
                }
              >
                {effectiveStats.users.inactive}
              </span>{' '}
              inactifs
            </p>
          </div>
        </motion.div>
      </div>

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
                  theme === 'dark' ? 'text-green-200' : 'text-emerald-600'
                }`}
              >
                +{effectiveStats.likes.trend}%
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
                  theme === 'dark' ? 'text-green-200' : 'text-emerald-600'
                }`}
              >
                +{effectiveStats.comments.trend}%
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
