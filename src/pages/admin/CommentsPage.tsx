import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Edit, Trash2, X, AlertCircle, Search, MessageSquare, TrendingUp, Calendar, RefreshCw, Power, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StatsCard } from '../../components/admin/StatsCard';
import { ChartPanel } from '../../components/admin/ChartPanel';
import { ChartModal } from '../../components/admin/ChartModal';
import { useOutletContext } from 'react-router-dom';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  approved: boolean;
  is_visible: boolean;
  // optional local fields that may come from the post_comments table
  user_name?: string;
  user_email?: string;
  users?: {
    full_name?: string;
    email: string;
  };
  news_posts?: {
    title: string;
    content: string;
  };
}

interface CommentStats {
  total: number;
  thisMonth: number;
  trend: number;
}

const CommentsPage: React.FC = () => {
  // --------------- ALL HOOKS AT THE TOP (no hooks after early returns) ---------------
  const { theme } = useOutletContext<{ theme: 'dark' | 'light' }>();
  const isDark = theme === 'dark';
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [stats, setStats] = useState<CommentStats>({
    total: 0,
    thisMonth: 0,
    trend: 0
  });
  const [displayStats, setDisplayStats] = useState<CommentStats>({
    total: 0,
    thisMonth: 0,
    trend: 0
  });
  const [showPostModal, setShowPostModal] = useState<Comment | null>(null);
  const [expandedChart, setExpandedChart] = useState<{
    title: string;
    type: 'line' | 'bar' | 'pie';
    data: any[];
    dataKeys?: { key: string; name: string; color: string }[];
  } | null>(null);
  // -------------------------------------------------------------------------------

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pendant le chargement, animer légèrement les compteurs (total / ce mois / tendance)
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
        total: jitter(prev.total || 0, 15, 0, 99999),
        thisMonth: jitter(prev.thisMonth || 0, 5, 0, 9999),
        trend: jitter(prev.trend || 0, 4, -100, 100),
      }));
    }, 900);

    return () => clearInterval(interval);
  }, [loading, stats]);

  const effectiveStats = loading ? displayStats : stats;

  const calculateStats = (commentList: Comment[]) => {
    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);
    const twoMonthsAgo = subMonths(now, 2);

    const thisMonth = commentList.filter(c => {
      const createdAt = new Date(c.created_at);
      return createdAt >= oneMonthAgo;
    }).length;

    const lastMonth = commentList.filter(c => {
      const createdAt = new Date(c.created_at);
      return createdAt >= twoMonthsAgo && createdAt < oneMonthAgo;
    }).length;

    const trend = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    setStats({
      total: commentList.length,
      thisMonth,
      trend
    });
  };

  const fetchComments = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      if (!data) {
        setComments([]);
        setLoading(false);
        return;
      }

      // For performance: if you have many comments, consider selecting only required fields
      const commentsWithDetails = await Promise.all(
        data.map(async (comment) => {
          try {
            // NOTE: `.single()` used for supabase v1 compatibility. If you're on v2, .maybeSingle() is available.
            const { data: post, error: postError } = await supabase
              .from('news_posts')
              .select('title, content')
              .eq('id', comment.post_id)
              .single();

            if (postError) {
              // Post not found or other error; log but continue
              console.warn('Post fetch error for comment:', comment.id, postError);
            }

            return {
              ...comment,
              approved: comment.approved !== false,
              is_visible: comment.is_visible !== false,
              users: {
                full_name: comment.user_name || 'Utilisateur inconnu',
                email: comment.user_email || ''
              },
              news_posts: postError || !post ? { title: 'Article supprimé', content: '' } : post
            };
          } catch (err) {
            console.error('Error fetching post for comment:', err);
            return {
              ...comment,
              approved: comment.approved !== false,
              is_visible: comment.is_visible !== false,
              users: {
                full_name: comment.user_name || 'Utilisateur inconnu',
                email: comment.user_email || ''
              },
              news_posts: { title: 'Article supprimé', content: '' }
            };
          }
        })
      );

      setComments(commentsWithDetails);
      calculateStats(commentsWithDetails);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast.error('Erreur lors du chargement des commentaires');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Commentaire supprimé avec succès');
      // refresh
      fetchComments();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
    setShowDeleteConfirm(null);
  };

  const filteredComments = comments.filter(comment =>
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.news_posts?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Charts data
  const monthlyComments = React.useMemo(() => {
    const now = new Date();
    const data: { name: string; comments: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const count = comments.filter(c => {
        const dt = new Date(c.created_at);
        return dt >= monthStart && dt <= monthEnd;
      }).length;
      data.push({ name: format(d, 'MMM yyyy', { locale: fr }), comments: count });
    }
    return data;
  }, [comments]);

  const approvalDistribution = React.useMemo(() => {
    const approved = comments.filter(c => c.approved).length;
    const pending = comments.length - approved;
    return [
      { name: 'Approuvés', value: approved },
      { name: 'En attente', value: pending }
    ];
  }, [comments]);

  // Early return for loading is now safe because ALL hooks were declared before it
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const handleToggleApproval = async (comment: Comment) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ approved: !comment.approved })
        .eq('id', comment.id);

      if (error) throw error;

      toast.success(comment.approved ? 'Commentaire rejeté' : 'Commentaire approuvé');
      fetchComments();
    } catch (error: any) {
      console.error('Error toggling approval:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  const handleToggleVisibility = async (comment: Comment) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ is_visible: !comment.is_visible })
        .eq('id', comment.id);

      if (error) throw error;

      toast.success(comment.is_visible ? 'Commentaire masqué' : 'Commentaire visible');
      fetchComments();
    } catch (error: any) {
      console.error('Error toggling visibility:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  return (
    <div>
      <div className="mb-6 mt-[60px] flex items-center justify-between">
        <h1
          className={`text-2xl font-bold flex items-center gap-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          <MessageSquare
            className={`w-7 h-7 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}
          />
          Gestion des commentaires
        </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchComments}
            className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
          {/* <button
            onClick={() => {
              // quick action: clear filters
              setSearchTerm('');
            }}
            className="btn bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg flex items-center"
            title="Réinitialiser la recherche"
          >
            <Power className="w-4 h-4 mr-2" />
            Reset
          </button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-6">
        <StatsCard
          title="Total commentaires"
          value={effectiveStats.total}
          icon={MessageSquare}
          className="bg-gradient-to-br from-sky-600 to-sky-700"
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
          title="Tendance"
          value={Math.abs(Math.round(effectiveStats.trend))}
          icon={TrendingUp}
          trend={{ value: effectiveStats.trend, label: '%' }}
          className="bg-gradient-to-br from-amber-600 to-amber-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="relative w-64">
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
              className={`w-full pl-10 pr-4 py-2 rounded-lg focus:ring-primary-500 focus:border-primary-500 border ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 shadow-sm'
              }`}
            />
          </div>
        </div>
      </div>

      <div
        className={`rounded-lg shadow overflow-hidden border mt-4 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <table className="w-full">
          <thead className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
            <tr>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Utilisateur
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Article
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Contenu
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Date
              </th>
              <th
                className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Statut
              </th>
              <th
                className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
            {filteredComments.map((comment) => (
              <tr
                key={comment.id}
                className={`${
                  isDark
                    ? 'hover:bg-gray-700/50'
                    : 'hover:bg-gray-50'
                } ${!comment.approved ? (isDark ? 'bg-yellow-900/20' : 'bg-yellow-50') : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div
                      className={`text-sm font-medium ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {comment.users?.full_name || 'Utilisateur inconnu'}
                    </div>
                    <div
                      className={`text-xs ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {comment.users?.email || 'N/A'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setShowPostModal(comment)}
                    className={`text-sm underline truncate max-w-xs block ${
                      isDark
                        ? 'text-primary-400 hover:text-primary-300'
                        : 'text-primary-600 hover:text-primary-700'
                    }`}
                  >
                    {comment.news_posts?.title || 'Article supprimé'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div
                    className={`text-sm truncate max-w-md ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    {comment.content}
                  </div>
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleToggleApproval(comment)}
                      className={`px-2 py-1 text-xs rounded-full ${comment.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                      title={comment.approved ? 'Approuvé' : 'En attente'}
                    >
                      {comment.approved ? 'Approuvé' : 'En attente'}
                    </button>
                    <button
                      onClick={() => handleToggleVisibility(comment)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${comment.is_visible ? 'bg-primary-600' : 'bg-gray-600'}`}
                      title={comment.is_visible ? 'Visible' : 'Masqué'}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${comment.is_visible ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedComment(comment)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${
                        isDark
                          ? 'border-green-700 bg-green-900/20 text-green-400 hover:bg-green-900/30'
                          : 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${
                        isDark
                          ? 'border-yellow-700 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30'
                          : 'border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                      }`}
                      title="Modifier"
                      onClick={() => {
                        toast('Édition non implémentée', { icon: '✏️' });
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(comment.id)}
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
            {filteredComments.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className={`px-6 py-8 text-center ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  Aucun commentaire trouvé.
                </td>
              </tr>
            )}
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
            Analyse des commentaires
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartPanel
            title="Commentaires mensuels (12 mois)"
            type="line"
            data={monthlyComments}
            dataKeys={[{ key: 'comments', name: 'Commentaires', color: '#60A5FA' }]}
            onExpand={() =>
              setExpandedChart({
                title: 'Commentaires mensuels (12 mois)',
                type: 'line',
                data: monthlyComments,
                dataKeys: [{ key: 'comments', name: 'Commentaires', color: '#60A5FA' }]
              })
            }
            theme={theme}
          />
          <ChartPanel
            title="Répartition par statut"
            type="pie"
            data={approvalDistribution}
            onExpand={() =>
              setExpandedChart({
                title: 'Répartition par statut',
                type: 'pie',
                data: approvalDistribution
              })
            }
            theme={theme}
          />
        </div>
      </div>

      {/* Selected comment modal */}
      {selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-lg max-w-2xl w-full border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200 shadow-lg'
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark
                  ? 'border-gray-700'
                  : 'border-gray-200 bg-slate-50'
              }`}
            >
              <h2
                className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Détails du Commentaire
              </h2>
              <button
                onClick={() => setSelectedComment(null)}
                className={
                  isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Utilisateur
                  </label>
                  <p
                    className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {selectedComment.users?.full_name || 'Utilisateur inconnu'}
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {selectedComment.users?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Article
                  </label>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {selectedComment.news_posts?.title || 'Article supprimé'}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Date
                  </label>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {format(new Date(selectedComment.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Contenu
                </label>
                <div
                  className={`p-4 rounded-lg whitespace-pre-line ${
                    isDark
                      ? 'text-white bg-gray-700'
                      : 'text-gray-800 bg-gray-50 border border-gray-200'
                  }`}
                >
                  {selectedComment.content}
                </div>
              </div>
              <details className="mt-4">
                <summary
                  className={`text-sm cursor-pointer hover:underline ${
                    isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Afficher les identifiants techniques
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label
                      className={`block mb-1 ${
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}
                    >
                      ID Utilisateur
                    </label>
                    <p
                      className={`font-mono break-all ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {selectedComment.user_id}
                    </p>
                  </div>
                  <div>
                    <label
                      className={`block mb-1 ${
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}
                    >
                      ID Post
                    </label>
                    <p
                      className={`font-mono break-all ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {selectedComment.post_id}
                    </p>
                  </div>
                </div>
              </details>
            </div>
          </motion.div>
        </div>
      )}

      {/* Post modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-lg max-w-2xl w-full border max-h-[80vh] overflow-y-auto ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200 shadow-lg'
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between sticky top-0 z-10 ${
                isDark
                  ? 'border-gray-700 bg-gray-800'
                  : 'border-gray-200 bg-slate-50'
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

            <div className="p-6">
              <h3
                className={`text-2xl font-bold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {showPostModal.news_posts?.title || 'Article supprimé'}
              </h3>
              <div
                className={`leading-relaxed ql-editor ${
                  isDark ? 'text-gray-300' : 'text-gray-800'
                }`}
                // if content is HTML, we use dangerouslySetInnerHTML; otherwise render as text
                dangerouslySetInnerHTML={{ __html: showPostModal.news_posts?.content || 'Contenu non disponible' }}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-lg p-6 max-w-md w-full mx-4 border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200 shadow-lg'
            }`}
          >
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
              <h3
                className={`text-lg font-semibold ${
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
              Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.
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

export default CommentsPage;
