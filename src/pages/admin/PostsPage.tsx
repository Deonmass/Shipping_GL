import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Edit, Trash2, Plus, X, AlertCircle, Search, FileText, Calendar, CheckCircle, FileEdit, RefreshCw, Power, BarChart3, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { StatsCard } from '../../components/admin/StatsCard';
import { ChartPanel } from '../../components/admin/ChartPanel';
import { ChartModal } from '../../components/admin/ChartModal';
import { FilterBar } from '../../components/admin/FilterBar';
import RichTextEditor from '../../components/admin/RichTextEditor';
import { useOutletContext } from 'react-router-dom';

interface Post {
  id: string;
  title: string;
  short_description: string;
  content: string;
  category: string;
  author_name: string;
  author_id: string;
  author_avatar?: string;
  image_url?: string;
  image_urls?: string[];
  is_published: boolean;
  is_pinned: boolean;
  is_active: boolean;
  event_date?: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PostFormData {
  title: string;
  short_description: string;
  content: string;
  category: string;
  image_url: string;
  image_urls: string[];
  is_published: boolean;
  is_pinned: boolean;
  is_active: boolean;
  event_date: string;
}

interface PostStats {
  total: number;
  published: number;
  drafts: number;
  thisMonth: number;
}

const PostsPage: React.FC = () => {
  const { theme } = useOutletContext<{ theme: 'dark' | 'light' }>();
  const isDark = theme === 'dark';
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    short_description: '',
    content: '',
    category: 'official',
    image_url: '',
    image_urls: [],
    is_published: true,
    is_pinned: false,
    is_active: true,
    event_date: ''
  });
  const [stats, setStats] = useState<PostStats>({
    total: 0,
    published: 0,
    drafts: 0,
    thisMonth: 0
  });
  const [displayStats, setDisplayStats] = useState<PostStats>({
    total: 0,
    published: 0,
    drafts: 0,
    thisMonth: 0,
  });
  const [expandedChart, setExpandedChart] = useState<{
    title: string;
    type: 'line' | 'bar' | 'pie';
    data: any[];
    dataKeys?: { key: string; name: string; color: string }[];
  } | null>(null);
  const { user } = useAuth();

  // Chart data (hooks must come before any early returns)
  const monthlyPosts = React.useMemo(() => {
    const now = new Date();
    const data: { name: string; posts: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const count = posts.filter(p => {
        const dt = p.event_date ? new Date(p.event_date) : new Date(p.created_at);
        return dt >= monthStart && dt <= monthEnd;
      }).length;
      data.push({ name: format(d, 'MMM yyyy', { locale: fr }), posts: count });
    }
    return data;
  }, [posts]);

  const statusDistribution = React.useMemo(() => {
    const published = posts.filter(p => p.is_published).length;
    const drafts = posts.length - published;
    return [
      { name: 'Publiés', value: published },
      { name: 'Brouillons', value: drafts }
    ];
  }, [posts]);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [user]);

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
        published: jitter(prev.published || 0, 10, 0, 999999),
        drafts: jitter(prev.drafts || 0, 6, 0, 999999),
        thisMonth: jitter(prev.thisMonth || 0, 6, 0, 999999),
      }));
    }, 900);

    return () => clearInterval(interval);
  }, [loading, stats]);

  const effectiveStats = loading ? displayStats : stats;

  const calculateStats = (postList: Post[]) => {
    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);

    const thisMonth = postList.filter(p => {
      const eventDate = p.event_date ? new Date(p.event_date) : new Date(p.created_at);
      return eventDate >= oneMonthAgo;
    }).length;

    setStats({
      total: postList.length,
      published: postList.filter(p => p.is_published).length,
      drafts: postList.filter(p => !p.is_published).length,
      thisMonth
    });
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('news_posts')
        .select('*')
        .order('created_at', { ascending: false });

      // Charger les rôles du user pour adapter la portée des données
      if (user) {
        const { data: roleRows, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (!rolesError) {
          const roles = (roleRows || []).map((r: any) => r.role as string);
          const isAdmin = roles.includes('admin');

          // Règle: admin voit tout; autres rôles (≠ user) ne voient que leurs propres posts
          if (!isAdmin) {
            query = query.eq('author_id', user.id);
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setPosts(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast.error('Erreur lors du chargement des posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('news_categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAdd = () => {
    setEditingPost(null);
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormData({
      title: '',
      short_description: '',
      content: '',
      category: 'official',
      image_url: '',
      image_urls: [],
      is_published: true,
      is_pinned: false,
      is_active: true,
      event_date: localDate
    });
    setShowFormModal(true);
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    const eventDate = post.event_date
      ? new Date(post.event_date).toISOString().slice(0, 16)
      : localDate;
    setFormData({
      title: post.title,
      short_description: post.short_description,
      content: post.content,
      category: post.category,
      image_url: post.image_url || '',
      image_urls: (post.image_urls && post.image_urls.length > 0)
        ? post.image_urls
        : (post.image_url ? [post.image_url] : []),
      is_published: post.is_published,
      is_pinned: post.is_pinned,
      is_active: post.is_active ?? true,
      event_date: eventDate
    });
    setShowFormModal(true);
  };

  const handleFormChange = (field: keyof PostFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addImageUrl = () => {
    setFormData(prev => {
      const next = [...(prev.image_urls || [])];
      next.push('');
      return { ...prev, image_urls: next };
    });
  };

  const updateImageUrl = (index: number, value: string) => {
    setFormData(prev => {
      const next = [...(prev.image_urls || [])];
      next[index] = value;
      const primary = next.find(u => u && u.trim().length > 0) || '';
      return { ...prev, image_urls: next, image_url: primary };
    });
  };

  const removeImageUrl = (index: number) => {
    setFormData(prev => {
      const next = (prev.image_urls || []).filter((_, i) => i !== index);
      const primary = next.find(u => u && u.trim().length > 0) || '';
      return { ...prev, image_urls: next, image_url: primary };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.short_description.trim() || !formData.content.trim() || !formData.event_date) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      const authorName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Administrateur';
      const authorAvatar = user.user_metadata?.avatar_url || null;

      if (editingPost) {
        const { error } = await supabase
          .from('news_posts')
          .update({
            title: formData.title,
            short_description: formData.short_description,
            content: formData.content,
            category: formData.category,
            image_url: ((formData.image_urls && formData.image_urls.length > 0) ? formData.image_urls[0] : formData.image_url) || null,
            image_urls: (formData.image_urls && formData.image_urls.length > 0) ? formData.image_urls : null,
            is_published: formData.is_published,
            is_pinned: formData.is_pinned,
            is_active: formData.is_active,
            event_date: new Date(formData.event_date).toISOString()
          })
          .eq('id', editingPost.id);

        if (error) throw error;
        toast.success('Post modifié avec succès');
      } else {
        const { error } = await supabase
          .from('news_posts')
          .insert([{
            title: formData.title,
            short_description: formData.short_description,
            content: formData.content,
            category: formData.category,
            image_url: ((formData.image_urls && formData.image_urls.length > 0) ? formData.image_urls[0] : formData.image_url) || null,
            image_urls: (formData.image_urls && formData.image_urls.length > 0) ? formData.image_urls : null,
            author_id: user.id,
            author_name: authorName,
            author_avatar: authorAvatar,
            is_published: formData.is_published,
            is_pinned: formData.is_pinned,
            is_active: formData.is_active,
            event_date: new Date(formData.event_date).toISOString()
          }]);

        if (error) throw error;
        toast.success('Post ajouté avec succès');
      }

      setShowFormModal(false);
      fetchPosts();
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('news_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Post supprimé avec succès');
      fetchPosts();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
    setShowDeleteConfirm(null);
  };

  const handleToggleActive = async (post: Post) => {
    try {
      const { error } = await supabase
        .from('news_posts')
        .update({ is_active: !post.is_active })
        .eq('id', post.id);

      if (error) throw error;

      toast.success(post.is_active ? 'Post désactivé avec succès' : 'Post activé avec succès');
      fetchPosts();
    } catch (error: any) {
      console.error('Error toggling post active status:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !categoryFilter || post.category === categoryFilter;
    const matchesStatus = !statusFilter ||
      (statusFilter === 'published' && post.is_published) ||
      (statusFilter === 'draft' && !post.is_published) ||
      (statusFilter === 'active' && post.is_active) ||
      (statusFilter === 'inactive' && !post.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const groupedPosts = () => {
    if (!groupBy) return { '': filteredPosts };

    return filteredPosts.reduce((acc, post) => {
      let key = '';

      if (groupBy === 'category') {
        key = categories.find(cat => cat.id === post.category)?.name || post.category;
      } else if (groupBy === 'status') {
        key = post.is_published ? 'Publiés' : 'Brouillons';
      } else if (groupBy === 'active') {
        key = post.is_active ? 'Actifs' : 'Désactivés';
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(post);
      return acc;
    }, {} as Record<string, Post[]>);
  };

  const activeFiltersCount = [categoryFilter, statusFilter, groupBy].filter(Boolean).length;

  const clearFilters = () => {
    setCategoryFilter('');
    setStatusFilter('');
    setGroupBy('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const grouped = groupedPosts();
  return (
    <div>
      <div className="mb-6 mt-[60px] flex items-center justify-between">
        <h1
          className={`text-2xl font-bold flex items-center gap-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          <FileText
            className={`w-7 h-7 ${
              isDark ? 'text-sky-400' : 'text-sky-600'
            }`}
          />
          Gestion des posts
        </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchPosts}
            className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium border transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg flex items-center text-sm font-medium shadow-sm bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter un post
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total posts"
          value={effectiveStats.total}
          icon={FileText}
          className="bg-gradient-to-br from-sky-600 to-sky-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Publiés"
          value={effectiveStats.published}
          icon={CheckCircle}
          className="bg-gradient-to-br from-emerald-600 to-emerald-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Brouillons"
          value={effectiveStats.drafts}
          icon={FileEdit}
          className="bg-gradient-to-br from-amber-600 to-amber-700"
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
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={[
          {
            label: 'Filtrer par catégorie',
            value: categoryFilter,
            options: categories.map(cat => ({ label: cat.name, value: cat.id })),
            onChange: setCategoryFilter
          },
          {
            label: 'Filtrer par statut',
            value: statusFilter,
            options: [
              { label: 'Publié', value: 'published' },
              { label: 'Brouillon', value: 'draft' },
              { label: 'Actif', value: 'active' },
              { label: 'Désactivé', value: 'inactive' }
            ],
            onChange: setStatusFilter
          }
        ]}
        groupBy={{
          label: 'Regrouper par',
          value: groupBy,
          options: [
            { label: 'Catégorie', value: 'category' },
            { label: 'Statut', value: 'status' },
            { label: 'Actif/Désactivé', value: 'active' }
          ],
          onChange: setGroupBy
        }}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={clearFilters}
        theme={theme}
      />


      <div className="space-y-6">
        {Object.entries(grouped).map(([groupName, groupPosts]) => (
          <div
            key={groupName}
            className={`rounded-lg shadow overflow-hidden border ${
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
                Titre
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Auteur
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Catégorie
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Statut
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
                Visible
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
            {filteredPosts.map((post) => (
              <tr
                key={post.id}
                className={isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
              >
                <td className="px-6 py-4">
                  <div
                    className={`text-sm font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {post.title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {post.author_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm capitalize ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {post.category}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    post.is_published
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {post.is_published ? 'Publié' : 'Brouillon'}
                  </span>
                  {post.is_pinned && (
                    <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Épinglé
                    </span>
                  )}
                </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      {format(new Date(post.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleActive(post)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                          post.is_active
                            ? 'bg-red-600'
                            : isDark
                              ? 'bg-gray-600'
                              : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            post.is_active ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPost(post)}
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
                          onClick={() => handleEdit(post)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${
                            isDark
                              ? 'border-yellow-700 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30'
                              : 'border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                          }`}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(post.id)}
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
        ))}
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
            Analyse des posts
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartPanel
            title="Posts mensuels (12 mois)"
            type="line"
            data={monthlyPosts}
            dataKeys={[{ key: 'posts', name: 'Posts', color: '#60A5FA' }]}
            onExpand={() =>
              setExpandedChart({
                title: 'Posts mensuels (12 mois)',
                type: 'line',
                data: monthlyPosts,
                dataKeys: [{ key: 'posts', name: 'Posts', color: '#60A5FA' }]
              })
            }
            theme={theme}
          />
          <ChartPanel
            title="Répartition par statut"
            type="pie"
            data={statusDistribution}
            onExpand={() =>
              setExpandedChart({
                title: 'Répartition par statut',
                type: 'pie',
                data: statusDistribution
              })
            }
            theme={theme}
          />
        </div>
      </div>

      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
          >
            <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
              <h2 className="text-xl font-bold text-white">Détails du Post</h2>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {(selectedPost.image_urls && selectedPost.image_urls.length > 0) ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
                {selectedPost.image_urls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`${selectedPost.title} ${idx + 1}`}
                    className="w-full h-48 object-cover rounded"
                  />
                ))}
              </div>
            ) : (
              selectedPost.image_url && (
                <img
                  src={selectedPost.image_url}
                  alt={selectedPost.title}
                  className="w-full h-64 object-cover"
                />
              )
            )}

            <div className="p-6">
              <h3 className="text-2xl font-bold text-white mb-4">{selectedPost.title}</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Auteur</label>
                  <p className="text-white">{selectedPost.author_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Catégorie</label>
                  <p className="text-white capitalize">{selectedPost.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Date de création</label>
                  <p className="text-white">{format(new Date(selectedPost.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Statut</label>
                  <p className="text-white">{selectedPost.is_published ? 'Publié' : 'Brouillon'}</p>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-1">Description courte</label>
                <p className="text-white">{selectedPost.short_description}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Contenu</label>
                <div className="text-white whitespace-pre-line">{selectedPost.content}</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
          >
            <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-white">
                {editingPost ? 'Modifier le post' : 'Ajouter un post'}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Titre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Titre du post"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Catégorie <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                      className="w-full bg-gray-700 border-gray-600 text-white rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Images du post
                  </label>
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-700 text-gray-300">
                          <th className="px-3 py-2 text-left w-14">#</th>
                          <th className="px-3 py-2 text-left">URL</th>
                          <th className="px-3 py-2 text-right w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {formData.image_urls.map((url, idx) => (
                          <tr key={idx} className="hover:bg-gray-700/40">
                            <td className="px-3 py-2 text-gray-300 align-top">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <input
                                type="url"
                                value={url}
                                onChange={(e) => updateImageUrl(idx, e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder={`https://exemple.com/image-${idx + 1}.jpg`}
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              {idx === 0 ? (
                                <span
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-yellow-700 bg-yellow-900/20 text-yellow-400 cursor-default"
                                  title="Image principale"
                                >
                                  <Star className="w-4 h-4" />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => removeImageUrl(idx)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30 transition"
                                  title="Supprimer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {formData.image_urls.length === 0 && (
                          <tr>
                            <td className="px-3 py-4 text-gray-400" colSpan={3}>Aucune image. Cliquez sur "Ajouter une image".</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                    >
                      Ajouter une image
                    </button>
                    {formData.image_urls.length > 0 && (
                      <span className="text-xs text-gray-400">La première URL sera utilisée comme image principale.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date de l'événement <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.event_date}
                    onChange={(e) => handleFormChange('event_date', e.target.value)}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Permet d'enregistrer des posts antérieurs liés à un événement</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description courte <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.short_description}
                    onChange={(e) => handleFormChange('short_description', e.target.value)}
                    rows={2}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Bref résumé du post..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contenu <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(value) => handleFormChange('content', value)}
                    placeholder="Écrivez le contenu complet du post..."
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => handleFormChange('is_published', e.target.checked)}
                      className="w-5 h-5 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-300">Publier immédiatement</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_pinned}
                      onChange={(e) => handleFormChange('is_pinned', e.target.checked)}
                      className="w-5 h-5 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-300">Épingler en haut</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleFormChange('is_active', e.target.checked)}
                      className="w-5 h-5 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-300">Activer le post</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingPost ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700"
          >
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-white">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PostsPage;
