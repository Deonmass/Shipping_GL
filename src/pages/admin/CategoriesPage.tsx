import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Edit, Trash2, Plus, X, AlertCircle, Search, Tag, BarChart3, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { StatsCard } from '../../components/admin/StatsCard';
import { ChartPanel } from '../../components/admin/ChartPanel';
import { ChartModal } from '../../components/admin/ChartModal';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: 'news' | 'partner';
  created_at: string;
}

const CategoriesPage: React.FC = () => {
  const { theme } = useOutletContext<{ theme: 'dark' | 'light' }>();
  const isDark = theme === 'dark';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'news' | 'partner'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [expandedChart, setExpandedChart] = useState<{
    title: string;
    type: 'line' | 'bar' | 'pie';
    data: any[];
    dataKeys?: { key: string; name: string; color: string }[];
  } | null>(null);
  const [stats, setStats] = useState({ total: 0, news: 0, partner: 0 });
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState<{ name: string; slug: string; type: 'news' | 'partner'; description: string }>({
    name: '',
    slug: '',
    type: 'news',
    description: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data: newsCategories, error: newsError } = await supabase
        .from('news_categories')
        .select('*');

      const { data: partnerCategories, error: partnerError } = await supabase
        .from('partner_categories')
        .select('*');

      if (newsError) throw newsError;
      if (partnerError) throw partnerError;

      const allCategories: Category[] = [
        ...(newsCategories || []).map(cat => ({ ...cat, type: 'news' as const })),
        ...(partnerCategories || []).map(cat => ({ ...cat, type: 'partner' as const }))
      ];

      setCategories(allCategories);
      setStats({
        total: allCategories.length,
        news: allCategories.filter(c => c.type === 'news').length,
        partner: allCategories.filter(c => c.type === 'partner').length
      });
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: '', slug: '', type: 'news', description: '' });
    setShowFormModal(true);
  };

  const handleFormChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Nom et slug sont requis");
      return;
    }
    try {
      const table = formData.type === 'news' ? 'news_categories' : 'partner_categories';
      const { error } = await supabase
        .from(table)
        .insert([{ name: formData.name, slug: formData.slug, description: formData.description }]);
      if (error) throw error;
      toast.success('Catégorie ajoutée');
      setShowFormModal(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erreur lors de l\'ajout');
    }
  };

  const handleDelete = async (id: string, type: 'news' | 'partner') => {
    try {
      const tableName = type === 'news' ? 'news_categories' : 'partner_categories';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Catégorie supprimée avec succès');
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
    setShowDeleteConfirm(null);
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          category.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || category.type === filterType;
    return matchesSearch && matchesType;
  });

  // Charts data
  const monthlyCategories = React.useMemo(() => {
    const data: { name: string; categories: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const count = categories.filter(c => {
        if (!c.created_at) return false;
        const dt = new Date(c.created_at);
        return dt >= monthStart && dt <= monthEnd;
      }).length;
      data.push({ name: d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }), categories: count });
    }
    return data;
  }, [categories]);

  const typeDistribution = React.useMemo(() => {
    const news = categories.filter(c => c.type === 'news').length;
    const partner = categories.filter(c => c.type === 'partner').length;
    return [
      { name: 'Actualités', value: news },
      { name: 'Partenaires', value: partner }
    ];
  }, [categories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-0">
      <div className="mb-6 mt-[60px]">
        <div className="mb-4 flex items-center justify-between">
          <h1
            className={`text-2xl font-bold flex items-center gap-3 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            <Tag className={isDark ? 'w-7 h-7 text-white' : 'w-7 h-7 text-primary-500'} />
            Gestion des catégories
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchCategories}
              className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium border ${
                isDark
                  ? 'bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700'
                  : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
              }`}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-lg flex items-center text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Plus className="w-5 h-5 mr-2" /> Ajouter une catégorie
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatsCard
            title="Total catégories"
            value={stats.total}
            icon={Tag}
            className="bg-gradient-to-br from-sky-600 to-sky-700"
            iconClassName="text-white"
            titleClassName="text-white"
          />
          <StatsCard
            title="Actualités"
            value={stats.news}
            icon={Tag}
            className="bg-gradient-to-br from-indigo-600 to-indigo-700"
            iconClassName="text-white"
            titleClassName="text-white"
          />
          <StatsCard
            title="Partenaires"
            value={stats.partner}
            icon={Tag}
            className="bg-gradient-to-br from-emerald-600 to-emerald-700"
            iconClassName="text-white"
            titleClassName="text-white"
          />
        </div>
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-4">
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
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className={`px-4 py-2 rounded-lg focus:ring-primary-500 focus:border-primary-500 border text-sm font-medium ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">Tous les types</option>
              <option value="news">Actualités</option>
              <option value="partner">Partenaires</option>
            </select>
          </div>
          {/* Add button moved to header */}
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
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Nom
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Slug
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Type
              </th>
              <th
                className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {filteredCategories.map((category) => (
              <tr
                key={`${category.type}-${category.id}`}
                className={isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
              >
                <td className="px-6 py-4">
                  <div
                    className={`text-sm font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {category.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {category.slug}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    category.type === 'news'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {category.type === 'news' ? 'Actualités' : 'Partenaires'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedCategory(category)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-green-700 bg-green-900/20 text-green-400 hover:bg-green-900/30 transition"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-yellow-700 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30 transition"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(`${category.type}-${category.id}`)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30 transition"
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
            Analyse des catégories
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartPanel
            title="Créations mensuelles (12 mois)"
            type="line"
            data={monthlyCategories}
            dataKeys={[{ key: 'categories', name: 'Catégories', color: '#60A5FA' }]}
            onExpand={() => setExpandedChart({
              title: 'Créations mensuelles (12 mois)',
              type: 'line',
              data: monthlyCategories,
              dataKeys: [{ key: 'categories', name: 'Catégories', color: '#60A5FA' }]
            })}
            theme={theme}
          />
          <ChartPanel
            title="Répartition par type"
            type="pie"
            data={typeDistribution}
            onExpand={() => setExpandedChart({
              title: 'Répartition par type',
              type: 'pie',
              data: typeDistribution
            })}
            theme={theme}
          />
        </div>
      </div>

      {selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-lg max-w-2xl w-full border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <h2
                className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Détails de la catégorie
              </h2>
              <button
                onClick={() => setSelectedCategory(null)}
                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    Nom
                  </label>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {selectedCategory.name}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    Slug
                  </label>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {selectedCategory.slug}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    Type
                  </label>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {selectedCategory.type === 'news' ? 'Actualités' : 'Partenaires'}
                  </p>
                </div>
                {selectedCategory.description && (
                  <div className="col-span-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-gray-400' : 'text-gray-700'
                      }`}
                    >
                      Description
                    </label>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                      {selectedCategory.description}
                    </p>
                  </div>
                )}
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
            className={`rounded-lg max-w-xl w-full border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Ajouter une catégorie
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className={`w-full rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Nom de la catégorie"
                  required
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleFormChange('slug', e.target.value)}
                  className={`w-full rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="slug-exemple"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value as 'news' | 'partner')}
                    className={`w-full rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="news">Actualités</option>
                    <option value="partner">Partenaires</option>
                  </select>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Description (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className={`w-full rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Brève description"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    isDark
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                >
                  Ajouter
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
            className={`rounded-lg p-6 max-w-md w-full mx-4 border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
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
            <p className={isDark ? 'text-gray-300 mb-6' : 'text-gray-700 mb-6'}>
              Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isDark
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const [type, id] = showDeleteConfirm.split('-');
                  handleDelete(id, type as 'news' | 'partner');
                }}
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
        />
      )}
    </div>
  );
};

export default CategoriesPage;
