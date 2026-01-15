import React, {useState, useEffect} from 'react';
import {useOutletContext} from 'react-router-dom';
import {motion} from 'framer-motion';
import {Eye, Edit, Trash2, X, AlertCircle, Search, Tag, BarChart3} from 'lucide-react';
import {StatsCard} from '../../components/admin/StatsCard';
import {ChartPanel} from '../../components/admin/ChartPanel';
import {ChartModal} from '../../components/admin/ChartModal';
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps, categoriesTypes} from "../../constants";
import {UseAddCategory, UseDeleteCategory, UseGetCategories, UseUpdateCategory} from "../../services";
import AppToast from "../../utils/AppToast.ts";

interface Category {
    id?: string;
    name: string;
    slug: string;
    description?: string;
    type: 'news' | 'partner' | 'job';
}

const emptyItem: Category = {name: '', slug: '', type: 'news', description: ''}

const CategoriesPage: React.FC = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>();
    const isDark = theme === 'dark';
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
    const [showFormModal, setShowFormModal] = useState<"add" | "edit" | null>(null);
    const [formData, setFormData] = useState<Category>(emptyItem);

    const {
        isPending: isGettingCategories,
        isRefetching: isReGettingCategories,
        data: categories,
        refetch: reGetCategories
    } = UseGetCategories({format: "stats"})
    const {isPending: isAdding, data: addResult, mutate: addCategory} = UseAddCategory()
    const {isPending: isUpdating, data: updateResult, mutate: updateCategory} = UseUpdateCategory()
    const {isPending: isDeleting, data: deleteResult, mutate: deleteCategory} = UseDeleteCategory()

    useEffect(() => {
        if (addResult) {
            if (addResult?.responseData?.error) {
                AppToast.error(theme === "dark", addResult?.responseData?.message || "Erreur lors de l'enregistrement")
            } else {
                reGetCategories()
                AppToast.success(theme === "dark", 'Categorie ajoutée avec succès')
                setShowFormModal(null);
                setFormData(emptyItem);
            }
        }
    }, [addResult]);

    useEffect(() => {
        if (updateResult) {
            if (updateResult?.responseData?.error) {
                AppToast.error(theme === "dark", updateResult?.responseData?.message || "Erreur lors de la modification")
            } else {
                reGetCategories()
                AppToast.success(theme === "dark", 'Categorie modifiée avec succès')
                setShowFormModal(null);
                setFormData(emptyItem);
            }
        }
    }, [updateResult]);


    useEffect(() => {
        if (deleteResult) {
            if (deleteResult?.responseData?.error) {
                AppToast.error(theme === "dark", deleteResult?.responseData?.message || "Erreur lors de la suppression")
            } else {
                reGetCategories()
                AppToast.success(theme === "dark", 'Categorie supprimée avec succès')
                setShowDeleteConfirm(null);
            }
        }
    }, [deleteResult]);

    const handleAdd = () => {
        setFormData(emptyItem);
        setShowFormModal("add");
    };

    const handleFormChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            AppToast.error(theme === "dark", 'Veuillez remplir tous les champs requis')
            return;
        }
        if (showFormModal === "add") {
            addCategory({
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                type: formData.type || null
            })
        } else {
            if (!formData.id) {
                AppToast.error(theme === "dark", 'Aucun ID passé')
                return;
            }
            updateCategory({
                id: formData.id,
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                type: formData.type || null
            })
        }

    };

    const handleDelete = async (id: string) => {
        deleteCategory({
            id: id,
        })
    };

    const filteredCategories = categories?.responseData?.data?.items?.filter((category: any) => {
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
            const count = categories?.responseData?.data?.items?.filter(c => {
                if (!c.created_at) return false;
                const dt = new Date(c.created_at);
                return dt >= monthStart && dt <= monthEnd;
            }).length;
            data.push({name: d.toLocaleDateString('fr-FR', {month: 'short', year: 'numeric'}), categories: count});
        }
        return data;
    }, [categories]);

    const typeDistribution = React.useMemo(() => {
        const news = categories?.responseData?.data?.items?.filter(c => c.type === 'news').length;
        const partner = categories?.responseData?.data?.items?.filter(c => c.type === 'partner').length;
        const job = categories?.responseData?.data?.items?.filter(c => c.type === 'job').length;
        return [
            {name: 'Actualités', value: news},
            {name: 'Partenaires', value: partner},
            {name: 'Postes', value: job}
        ];
    }, [categories]);

    if (isGettingCategories) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div
                    className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="p-0">
            <div className="mb-6 mt-[60px]">
                <AdminPageHeader
                    title="Gestion des catégories"
                    Icon={<Tag className={isDark ? 'w-7 h-7 text-white' : 'w-7 h-7 text-primary-500'}/>}
                    isRefreshing={isReGettingCategories}
                    onRefresh={reGetCategories}
                    onAdd={HasPermission(appPermissions.categories, appOps.create) ? () => {
                        handleAdd()
                    } : undefined}
                />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <StatsCard
                        title="Total catégories"
                        value={categories?.responseData?.data?.items?.length}
                        icon={Tag}
                        className="bg-gradient-to-br from-sky-600 to-sky-700"
                        iconClassName="text-white"
                        titleClassName="text-white"
                    />
                    <StatsCard
                        title="Actualités"
                        value={categories?.responseData?.data?.totals?.news || "0"}
                        icon={Tag}
                        className="bg-gradient-to-br from-indigo-600 to-indigo-700"
                        iconClassName="text-white"
                        titleClassName="text-white"
                    />
                    <StatsCard
                        title="Partenaires"
                        value={categories?.responseData?.data?.totals?.partner || "0"}
                        icon={Tag}
                        className="bg-gradient-to-br from-emerald-600 to-emerald-700"
                        iconClassName="text-white"
                        titleClassName="text-white"
                    />
                    <StatsCard
                        title="Postes"
                        value={categories?.responseData?.data?.totals?.job || "0"}
                        icon={Tag}
                        className="bg-gradient-to-br from-purple-600 to-purple-700"
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
                            {categoriesTypes?.map((item) => <option key={item.value}
                                                                    value={item.value}>{item.name}</option>)}

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
                    {filteredCategories?.map((category: any) => (
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
                  <span className={`px-2 py-1 text-xs rounded-full ${
                      category.type === 'news'
                          ? 'bg-blue-100 text-blue-800'
                          : category.type === 'partner'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                  }`}>
                    {category.type === 'news' ? 'Actualités' : category.type === 'partner' ? 'Partenaires' : 'Poste'}
                  </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => setSelectedCategory(category)}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-green-700 bg-green-900/20 text-green-400 hover:bg-green-900/30 transition"
                                        title="Voir détails"
                                    >
                                        <Eye className="w-4 h-4"/>
                                    </button>
                                    {HasPermission(appPermissions.categories, appOps.update) ? <button
                                        onClick={() => {
                                            setShowFormModal("edit")
                                            setFormData(category)
                                        }}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-yellow-700 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30 transition"
                                        title="Modifier"
                                    >
                                        <Edit className="w-4 h-4"/>
                                    </button> : null}
                                    {HasPermission(appPermissions.categories, appOps.delete) ? <button
                                        onClick={() => setShowDeleteConfirm(category.id)}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30 transition"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button> : null}
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
                    <BarChart3 className="w-5 h-5 text-primary-400"/>
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
                        dataKeys={[{key: 'categories', name: 'Catégories', color: '#60A5FA'}]}
                        onExpand={() => setExpandedChart({
                            title: 'Créations mensuelles (12 mois)',
                            type: 'line',
                            data: monthlyCategories,
                            dataKeys: [{key: 'categories', name: 'Catégories', color: '#60A5FA'}]
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
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
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
                                <X className="w-6 h-6"/>
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
                                        {selectedCategory.type === 'news' ? 'Actualités' : selectedCategory.type === 'partner' ? 'Partenaires' : 'Poste'}
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
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
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
                                onClick={() => setShowFormModal(null)}
                                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}
                            >
                                <X className="w-6 h-6"/>
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
                            <div className="grid grid-cols-1 gap-4">
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
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            type: e.target.value as 'news' | 'partner' | 'job'
                                        })}
                                        className={
                                            isDark
                                                ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                        }
                                        required
                                    >
                                        {categoriesTypes?.map((item) => <option key={item.value}
                                                                                value={item.value}>{item.name}</option>)}
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
                                    <textarea
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
                                    onClick={() => setShowFormModal(null)}
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
                                    {isAdding || isUpdating ? "Chargement ..." : "Valider"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className={`rounded-lg p-6 max-w-md w-full mx-4 border ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}
                    >
                        <div className="flex items-center mb-4">
                            <AlertCircle className="w-6 h-6 text-red-500 mr-2"/>
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
                                    handleDelete(showDeleteConfirm);
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                                {isDeleting ? "Suppression ..." : "Supprimer"}
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
