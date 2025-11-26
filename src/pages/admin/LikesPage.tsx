import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Trash2, X, AlertCircle, Search, Heart, TrendingUp, Calendar, BarChart3, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StatsCard } from '../../components/admin/StatsCard';
import { ChartPanel } from '../../components/admin/ChartPanel';
import { ChartModal } from '../../components/admin/ChartModal';
import { useOutletContext } from 'react-router-dom';

interface Like {
  id: string;
  post_id: string;
  user_id: string;
  is_visible: boolean;
  created_at: string;
  news_posts?: {
    id?: string;
    title: string;
    short_description?: string;
    content?: string;
    image_url?: string;
    author_name?: string;
    category?: string;
    created_at?: string;
  };
  user_info?: {
    full_name: string;
    email: string;
  };
}

interface LikeStats {
  total: number;
  thisMonth: number;
  avgPerPost: number;
  trend: number;
}

const LikesPage: React.FC = () => {
  const { theme } = useOutletContext<{ theme: 'dark' | 'light' }>();
  const isDark = theme === 'dark';
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [stats, setStats] = useState<LikeStats>({
    total: 0,
    thisMonth: 0,
    avgPerPost: 0,
    trend: 0
  });
  const [displayStats, setDisplayStats] = useState<LikeStats>({
    total: 0,
    thisMonth: 0,
    avgPerPost: 0,
    trend: 0,
  });

  useEffect(() => {
    fetchLikes();
  }, []);

  // Animation douce des compteurs pendant le chargement
  useEffect(() => {
    if (!loading) {
      setDisplayStats(stats);
      return;
    }

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    const jitter = (value: number, maxDelta: number, min: number, max: number) => {
      const delta = (Math.random() * 2 - 1) * maxDelta;
      return clamp(Math.round(value + delta), min, max);
    };

    const interval = setInterval(() => {
      setDisplayStats(prev => ({
        total: jitter(prev.total || 0, 20, 0, 999999),
        thisMonth: jitter(prev.thisMonth || 0, 6, 0, 99999),
        avgPerPost: jitter(prev.avgPerPost || 0, 2, 0, 100),
        trend: jitter(prev.trend || 0, 4, -100, 100),
      }));
    }, 900);

    return () => clearInterval(interval);
  }, [loading, stats]);

  const effectiveStats = loading ? displayStats : stats;

  const calculateStats = async (likeList: Like[]) => {
    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);
    const twoMonthsAgo = subMonths(now, 2);

    const thisMonth = likeList.filter(l => new Date(l.created_at) >= oneMonthAgo).length;
    const lastMonth = likeList.filter(l => {
      const date = new Date(l.created_at);
      return date >= twoMonthsAgo && date < oneMonthAgo;
    }).length;

    const trend = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    const { count, error: countError } = await supabase
      .from('news_posts')
      .select('*', { count: 'exact', head: true });

    if (countError) console.error(countError);

    const avgPerPost = count ? likeList.length / count : 0;

    setStats({
      total: likeList.length,
      thisMonth,
      avgPerPost: Math.round(avgPerPost * 10) / 10,
      trend
    });
  };

  const fetchLikes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('post_likes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return setLikes([]);

      const likesWithPosts = await Promise.all(
        data.map(async (like) => {
          const { data: post, error: postError } = await supabase
            .from('news_posts')
            .select('id, title, short_description, content, image_url, author_name, category, created_at')
            .eq('id', like.post_id)
            .maybeSingle();

          const { data: userProfile, error: userErr } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', like.user_id)
            .maybeSingle();

          if (postError) console.warn('Post not found:', postError);
          if (userErr) console.warn('User not found:', userErr);

          return {
            ...like,
            is_visible: like.is_visible !== false,
            news_posts: post || { title: 'Post supprimé' },
            user_info: userProfile || undefined
          };
        })
      );

      setLikes(likesWithPosts);
      await calculateStats(likesWithPosts);
    } catch (error: any) {
      console.error(error);
      toast.error('Erreur lors du chargement des likes');
      setLikes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Like supprimé');
      fetchLikes();
    } catch (error: any) {
      console.error(error);
      toast.error('Erreur lors de la suppression');
    }
    setShowDeleteConfirm(null);
  };

  const handleToggleVisibility = async (like: Like) => {
    try {
      const { error } = await supabase
        .from('post_likes')
        .update({ is_visible: !like.is_visible })
        .eq('id', like.id);

      if (error) throw error;

      toast.success(like.is_visible ? 'Like masqué' : 'Like visible');
      fetchLikes();
    } catch (error: any) {
      console.error(error);
      toast.error('Erreur lors de la modification');
    }
  };

  const filteredLikes = likes.filter(like =>
    (like.user_info?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (like.user_info?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (like.news_posts?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    like.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    like.post_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [showPostModal, setShowPostModal] = useState<Like | null>(null);
  const [expandedChart, setExpandedChart] = useState<{
    title: string;
    type: 'line' | 'bar' | 'pie';
    data: any[];
    dataKeys?: { key: string; name: string; color: string }[];
  } | null>(null);

  // Chart data
  const monthlyLikes = React.useMemo(() => {
    const now = new Date();
    const data: { name: string; likes: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const count = likes.filter(l => {
        const dt = new Date(l.created_at);
        return dt >= monthStart && dt <= monthEnd;
      }).length;
      data.push({ name: format(d, 'MMM yyyy', { locale: fr }), likes: count });
    }
    return data;
  }, [likes]);

  const visibilityDistribution = React.useMemo(() => {
    const visible = likes.filter(l => l.is_visible).length;
    const hidden = likes.length - visible;
    return [
      { name: 'Visible', value: visible },
      { name: 'Non visible', value: hidden }
    ];
  }, [likes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 mt-[60px] flex items-center justify-between">
        <h1
          className={`text-2xl font-bold flex items-center gap-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          <Heart
            className={`w-7 h-7 ${isDark ? 'text-pink-400' : 'text-pink-600'}`}
          />
          Gestion des likes
        </h1>
        <button
          onClick={fetchLikes}
          className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors border ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total likes"
          value={effectiveStats.total}
          icon={Heart}
          className="bg-gradient-to-br from-pink-600 to-pink-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Ce mois"
          value={effectiveStats.thisMonth}
          icon={Calendar}
          className="bg-gradient-to-br from-indigo-600 to-indigo-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Moyenne par post"
          value={effectiveStats.avgPerPost}
          icon={BarChart3}
          className="bg-gradient-to-br from-emerald-600 to-emerald-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Tendance"
          value={Math.abs(Math.round(effectiveStats.trend))}
          icon={TrendingUp}
          trend={{ value: effectiveStats.trend, label: '%' }}
          className="bg-gradient-to-br from-amber-600 to-amber-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
      </div>

      <div className="relative w-64 mb-6">
        <Search
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
            isDark ? 'text-gray-400' : 'text-gray-400'
          }`}
        />
        <input
          type="search"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-primary-500 focus:border-primary-500 ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 shadow-sm'
          }`}
        />
      </div>

      <div
        className={`rounded-lg shadow overflow-hidden border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <table className="w-full">
          <thead className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
            <tr>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Utilisateur
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Post
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Date
              </th>
              <th
                className={`px-6 py-3 text-center text-xs font-medium uppercase ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Visible
              </th>
              <th
                className={`px-6 py-3 text-right text-xs font-medium uppercase ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
            {filteredLikes.map(like => (
              <tr
                key={like.id}
                className={`${
                  isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                } ${!like.is_visible ? (isDark ? 'bg-red-900/10' : 'bg-red-50') : ''}`}
              >
                <td className="px-6 py-4">
                  <div
                    className={`text-sm font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {like.user_info?.full_name || 'Utilisateur'}
                  </div>
                  <div
                    className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {like.user_info?.email || like.user_id}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <button
                    onClick={() => setShowPostModal(like)}
                    className={`text-sm underline truncate max-w-xs block ${
                      isDark
                        ? 'text-primary-400 hover:text-primary-300'
                        : 'text-primary-600 hover:text-primary-700'
                    }`}
                  >
                    {like.news_posts?.title || 'Post supprimé'}
                  </button>
                </td>

                <td
                  className={`px-6 py-4 text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {format(new Date(like.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleToggleVisibility(like)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${like.is_visible ? 'bg-primary-600' : 'bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${like.is_visible ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowPostModal(like)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${
                        isDark
                          ? 'border-green-700 bg-green-900/20 text-green-400 hover:bg-green-900/30'
                          : 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      title="Voir le post"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(like.id)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${
                        isDark
                          ? 'border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30'
                          : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary-400" />
          <h2
            className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Analyse des likes
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartPanel
            title="Likes mensuels (12 mois)"
            type="line"
            data={monthlyLikes}
            dataKeys={[{ key: 'likes', name: 'Likes', color: '#F472B6' }]}
            onExpand={() =>
              setExpandedChart({
                title: 'Likes mensuels (12 mois)',
                type: 'line',
                data: monthlyLikes,
                dataKeys: [{ key: 'likes', name: 'Likes', color: '#F472B6' }]
              })
            }
            theme={theme}
          />
          <ChartPanel
            title="Répartition par visibilité"
            type="pie"
            data={visibilityDistribution}
            onExpand={() =>
              setExpandedChart({
                title: 'Répartition par visibilité',
                type: 'pie',
                data: visibilityDistribution
              })
            }
            theme={theme}
          />
        </div>
      </div>

      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200 shadow-lg'
            }`}
          >
            <div
              className={`p-6 flex justify-between border-b sticky top-0 ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-slate-50'
              }`}
            >
              <h2
                className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Détails du Post
              </h2>
              <button
                onClick={() => setShowPostModal(null)}
                className={
                  isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {showPostModal.news_posts?.image_url && (
              <img
                src={showPostModal.news_posts.image_url}
                alt={showPostModal.news_posts.title}
                className="w-full h-64 object-cover"
              />
            )}
            <div className="p-6 space-y-4">
              <h3
                className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {showPostModal.news_posts?.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Auteur
                  </label>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {showPostModal.news_posts?.author_name || '—'}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Catégorie
                  </label>
                  <p className={isDark ? 'text-white' : 'text-gray-900 capitalize'}>
                    {showPostModal.news_posts?.category || '—'}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Créé le
                  </label>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {showPostModal.news_posts?.created_at
                      ? format(new Date(showPostModal.news_posts.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                      : '—'}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    ID du Post
                  </label>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {showPostModal.news_posts?.id || showPostModal.post_id}
                  </p>
                </div>
              </div>
              {showPostModal.news_posts?.short_description && (
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Description courte
                  </label>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {showPostModal.news_posts.short_description}
                  </p>
                </div>
              )}
              {showPostModal.news_posts?.content && (
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Contenu
                  </label>
                  <div
                    className={`whitespace-pre-line ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    {showPostModal.news_posts.content}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-lg p-6 max-w-md w-full border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200 shadow-lg'
            }`}
          >
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
              <h3
                className={`text-lg ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Confirmer la suppression
              </h3>
            </div>
            <p
              className={`mb-6 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Supprimer
              </button>
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
          onClose={() => setExpandedChart(null)}
          theme={theme}
        />
      )}
    </div>
  );
};

export default LikesPage;
