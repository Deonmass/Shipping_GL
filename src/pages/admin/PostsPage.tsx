import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {
    Eye,
    Edit,
    Trash2,
    X,
    AlertCircle,
    FileText,
    CheckCircle,
    FileEdit,
    BarChart3,
    Star, ToggleRight, ToggleLeft, XCircle
} from 'lucide-react';
import {supabase} from '../../lib/supabase';
import toast from 'react-hot-toast';
import {format, subMonths} from 'date-fns';
import {fr} from 'date-fns/locale';
import {StatsCard} from '../../components/admin/StatsCard';
import {ChartPanel} from '../../components/admin/ChartPanel';
import {FilterBar} from '../../components/admin/FilterBar';
import RichTextEditor from '../../components/admin/RichTextEditor';
import {useOutletContext} from 'react-router-dom';
import {UseAddPost, UseDeletePost, UseGetCategories, UseGetPosts, UseUpdatePost} from "../../services";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";
import AppToast from "../../utils/AppToast.ts";

interface Post {
    id?: string;
    title: string;
    short_description: string;
    content: string;
    category_id: string;
    category_name: string;
    image_url?: string;
    image_urls?: string[];
    event_date?: string;
    created_at?: string;
    author_name?: string;
    is_active?: boolean;
    is_pinned?: boolean;
}

const emptyItem = {
    title: "",
    short_description: "",
    content: "",
    category_id: "",
    category_name: "",
    image_url: "",
    image_urls: [],
    event_date: "",
    created_at: ""
}

const isActive = (u: any) =>
    u?.status?.toString() === "1"

const isPinned = (u: any) =>
    u?.status?.toString() === "2"

const PostsPage: React.FC = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>();
    const isDark = theme === 'dark';
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [groupBy, setGroupBy] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [showFormModal, setShowFormModal] = useState<"add" | "edit" | null>(null);
    const [showStatusConfirm, setShowStatusConfirm] = useState<Post | null>(null);
    const [formData, setFormData] = useState<Post>(emptyItem);

    const [expandedChart, setExpandedChart] = useState<{
        title: string;
        type: 'line' | 'bar' | 'pie';
        data: any[];
        dataKeys?: { key: string; name: string; color: string }[];
    } | null>(null);

    const {data: categories} = UseGetCategories({noPermission: 1, type: "news"})
    const {data: posts, isPending: isGettingPosts, refetch: reGetPosts} = UseGetPosts({format: "stats"})
    const {data: addResult, isPending: isAdding, mutate: addPost} = UseAddPost()
    const {data: updateResult, isPending: isUpdating, mutate: updatePost} = UseUpdatePost()
    const {data: deleteResult, isPending: isDeleting, mutate: deletePost} = UseDeletePost()


    useEffect(() => {
        if (addResult) {
            if (addResult?.responseData?.error) {
                AppToast.error(isDark, addResult?.responseData?.message || "Erreur lors de l'enregistrement")
            } else {
                reGetPosts()
                AppToast.success(isDark, 'Post ajouté avec succès')
                setShowFormModal(null);
                setFormData(emptyItem);
            }
        }
    }, [addResult]);

    useEffect(() => {
        if (updateResult) {
            if (updateResult?.responseData?.error) {
                AppToast.error(isDark, updateResult?.responseData?.message || "Erreur lors de la modification")
            } else {
                reGetPosts()
                AppToast.success(isDark, 'Post mis a jour avec succès')
                setShowFormModal(null);
                setFormData(emptyItem);
                setShowStatusConfirm(null);
            }
        }
    }, [updateResult]);

    useEffect(() => {
        if (deleteResult) {
            if (deleteResult?.responseData?.error) {
                AppToast.error(isDark, deleteResult?.responseData?.message || "Erreur lors de la suppression")
            } else {
                reGetPosts()
                AppToast.success(isDark, 'Post supprimé avec succès')
                setShowDeleteConfirm(null);
            }
        }
    }, [deleteResult]);

    // Chart data (hooks must come before any early returns)
    const monthlyPosts = React.useMemo(() => {
        const now = new Date();
        const data: { name: string; posts: number }[] = [];
        for (let i = 11; i >= 0; i--) {
            const d = subMonths(now, i);
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
            const count = posts?.responseData?.data?.items?.filter(p => {
                const dt = p.event_date ? new Date(p.event_date) : new Date(p.created_at);
                return dt >= monthStart && dt <= monthEnd;
            }).length;
            data.push({name: format(d, 'MMM yyyy', {locale: fr}), posts: count});
        }
        return data;
    }, [posts]);

    const statusDistribution = React.useMemo(() => {
        return [
            {name: 'Publiés', value: posts?.responseData?.data?.totals?.active},
            {name: 'Brouillons', value: posts?.responseData?.data?.totals?.inactive}
        ];
    }, [posts]);


    const handleFormChange = (field: keyof Post, value: any) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const addImageUrl = () => {
        setFormData(prev => {
            const next = [...(prev.image_urls || [])];
            next.push('');
            return {...prev, image_urls: next};
        });
    };

    const updateImageUrl = (index: number, value: string) => {
        setFormData(prev => {
            const next = [...(prev.image_urls || [])];
            next[index] = value;
            const primary = next.find(u => u && u.trim().length > 0) || '';
            return {...prev, image_urls: next, image_url: primary};
        });
    };

    const removeImageUrl = (index: number) => {
        setFormData(prev => {
            const next = (prev.image_urls || []).filter((_, i) => i !== index);
            const primary = next.find(u => u && u.trim().length > 0) || '';
            return {...prev, image_urls: next, image_url: primary};
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData?.title?.trim() || !formData?.short_description?.trim() || !formData?.content.trim() || !formData?.event_date) {
            AppToast.error(isDark, 'Veuillez remplir tous les champs requis');
            return;
        }

        const body = {
            title: formData?.title,
            short_description: formData?.short_description,
            content: formData?.content,
            event_date: formData?.event_date,
            category_id: formData?.category_id,
            image_url: ((formData.image_urls && formData.image_urls.length > 0) ? formData.image_urls[0] : formData.image_url) || null,
            image_urls: (formData.image_urls && formData.image_urls.length > 0) ? formData.image_urls.join(",") : null,
            status: formData?.is_active ? "1" : formData?.is_pinned ? "2" : "0",
        }

        if (showFormModal === "add") {
            addPost(body);
        } else {
            if (!formData?.id) {
                AppToast.error(isDark, "Une erreur s'est produite !");
                return;
            }
            updatePost({id: formData?.id, ...body});
        }
    };

    const handleChangeStatus = async (post: any) => {
        if (!post?.id) {
            AppToast.error(isDark, "Une erreur s'est produite ! Reessayez svp.");
            return;
        }
        updatePost({
            id: post?.id,
            status: isActive(post) ? "0" : "1",
        })
    };

    const filteredPosts = posts?.responseData?.data?.items?.filter(post => {
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
        if (!groupBy) return {'': filteredPosts};

        return filteredPosts?.reduce((acc, post) => {
            let key = '';

            if (groupBy === 'category') {
                key = categories.find(cat => cat?.id?.toString() === post?.category_id?.toString());
            } else if (groupBy === 'status') {
                key = isActive(post) ? 'Publiés' : 'Brouillons';
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

    const getActionItems = (item: any) => [
        {
            visible: HasPermission(appPermissions.posts, appOps.delete),
            label: isActive(item) ? 'Désactiver' : 'Activer',
            icon: isActive(item) ? ToggleRight : ToggleLeft,
            onClick: () => {
                setShowStatusConfirm(item);
            },
            color: (isActive(item) ? 'text-emerald-400' : 'text-red-400'),
            bgColor: '',
            borderColor: (isActive(item) ? 'border-emerald-500/60' : 'border-red-500/60'),
        },
        {
            visible: HasPermission(appPermissions.posts, appOps.read),
            label: 'Voir détails',
            icon: Eye,
            onClick: () => {
                setSelectedPost(item);
            },
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20',
            borderColor: 'border-blue-500/30'
        },
        {
            visible: HasPermission(appPermissions.posts, appOps.update),
            label: 'Modifier',
            icon: Edit,
            onClick: () => {
                setFormData({...item, is_pinned: isPinned(item), is_active: isActive(item)});
                setShowFormModal("edit");
            },
            color: 'text-green-400',
            bgColor: 'bg-green-500/20',
            borderColor: 'border-green-500/30'
        },
        {
            visible: HasPermission(appPermissions.posts, appOps.delete),
            label: 'Supprimer',
            icon: Trash2,
            onClick: () => {
                setShowDeleteConfirm(item.id);
            },
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            borderColor: 'border-red-500/30'
        }
    ];

    if (isGettingPosts) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div
                    className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    const grouped = groupedPosts();
    return (
        <div>
            <AdminPageHeader
                Icon={<FileText
                    className={`w-7 h-7 ${
                        isDark ? 'text-sky-400' : 'text-sky-600'
                    }`}
                />}
                title="Gestion des Posts"
                onRefresh={() => reGetPosts()}
                onAdd={HasPermission(appPermissions.posts, appOps.create) ? () => {
                    setFormData(emptyItem);
                    setShowFormModal("add");
                } : undefined}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <StatsCard
                    title="Total posts"
                    value={posts?.responseData?.data?.items?.length || "0"}
                    icon={FileText}
                    className="bg-gradient-to-br from-sky-600 to-sky-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="Publiés"
                    value={posts?.responseData?.data?.totals?.active || "0"}
                    icon={CheckCircle}
                    className="bg-gradient-to-br from-emerald-600 to-emerald-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="Brouillons"
                    value={posts?.responseData?.data?.totals?.inactive || "0"}
                    icon={FileEdit}
                    className="bg-gradient-to-br from-red-600 to-red-700"
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
                        options: categories?.responseData?.data?.map(cat => ({label: cat.name, value: cat.id})),
                        onChange: setCategoryFilter
                    },
                    {
                        label: 'Filtrer par statut',
                        value: statusFilter,
                        options: [
                            {label: 'Publié', value: 'published'},
                            {label: 'Brouillon', value: 'draft'},
                        ],
                        onChange: setStatusFilter
                    }
                ]}
                groupBy={{
                    label: 'Regrouper par',
                    value: groupBy,
                    options: [
                        {label: 'Catégorie', value: 'category'},
                        {label: 'Statut', value: 'status'},
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
                                    className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                                        isDark ? 'text-gray-300' : 'text-gray-600'
                                    }`}
                                >
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
                            {filteredPosts?.map((post) => (
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
                                            {post.category_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      isActive(post)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {isActive(post) ? 'Publié' : 'Brouillon'}
                  </span>
                                        {isPinned(post) && (
                                            <span
                                                className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Épinglé
                    </span>
                                        )}
                                    </td>
                                    <td
                                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                                            isDark ? 'text-gray-300' : 'text-gray-600'
                                        }`}
                                    >
                                        {post.event_date
                                            ? format(new Date(post.event_date), 'dd/MM/yyyy', {locale: fr})
                                            : 'Non définie'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div
                                            className="inline-flex w-full flex-wrap items-center justify-end gap-2">

                                            {/* Autres actions ensuite */}
                                            {getActionItems(post)
                                                .map((action) => {
                                                    if (action.label === 'Désactiver' || action.label === 'Activer') {
                                                        return action?.visible ? (
                                                            <button
                                                                key={action.label}
                                                                type="button"
                                                                onClick={action.onClick}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                                                    isActive(post)
                                                                        ? 'bg-red-600'
                                                                        : theme === 'dark'
                                                                            ? 'bg-gray-600'
                                                                            : 'bg-gray-300'
                                                                }`}
                                                                title={action.label}
                                                            >
                                      <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                              isActive(post) ? 'translate-x-6' : 'translate-x-1'
                                          }`}
                                      />
                                                            </button>
                                                        ) : null
                                                    } else {
                                                        return action?.visible ? (<button
                                                            key={action.label}
                                                            type="button"
                                                            onClick={action.onClick}
                                                            className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-xs font-medium ${
                                                                action.bgColor
                                                            } ${action.borderColor} ${action.color} hover:shadow-md hover:-translate-y-0.5 transition transform duration-150`}
                                                            title={action.label}
                                                        >
                                                            <action.icon className="h-4 w-4"/>
                                                        </button>) : null
                                                    }
                                                })}
                                        </div>
                                    </td>
                                    {/*            <td className="px-6 py-4 whitespace-nowrap text-center">*/}
                                    {/*                <button*/}
                                    {/*                    onClick={() => handleToggleActive(post)}*/}
                                    {/*                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${*/}
                                    {/*                        isActive(post)*/}
                                    {/*                            ? 'bg-red-600'*/}
                                    {/*                            : isDark*/}
                                    {/*                                ? 'bg-gray-600'*/}
                                    {/*                                : 'bg-gray-300'*/}
                                    {/*                    }`}*/}
                                    {/*                >*/}
                                    {/*<span*/}
                                    {/*    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${*/}
                                    {/*        isActive(post) ? 'translate-x-4' : 'translate-x-1'*/}
                                    {/*    }`}*/}
                                    {/*/>*/}
                                    {/*                </button>*/}
                                    {/*            </td>*/}
                                    {/*            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">*/}
                                    {/*                <div className="flex items-center justify-end gap-2">*/}
                                    {/*                    <button*/}
                                    {/*                        onClick={() => setSelectedPost(post)}*/}
                                    {/*                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${*/}
                                    {/*                            isDark*/}
                                    {/*                                ? 'border-green-700 bg-green-900/20 text-green-400 hover:bg-green-900/30'*/}
                                    {/*                                : 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'*/}
                                    {/*                        }`}*/}
                                    {/*                        title="Voir détails"*/}
                                    {/*                    >*/}
                                    {/*                        <Eye className="w-4 h-4"/>*/}
                                    {/*                    </button>*/}
                                    {/*                    <button*/}
                                    {/*                        onClick={() => handleEdit(post)}*/}
                                    {/*                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${*/}
                                    {/*                            isDark*/}
                                    {/*                                ? 'border-yellow-700 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30'*/}
                                    {/*                                : 'border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100'*/}
                                    {/*                        }`}*/}
                                    {/*                        title="Modifier"*/}
                                    {/*                    >*/}
                                    {/*                        <Edit className="w-4 h-4"/>*/}
                                    {/*                    </button>*/}
                                    {/*                    <button*/}
                                    {/*                        onClick={() => setShowDeleteConfirm(post.id)}*/}
                                    {/*                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${*/}
                                    {/*                            isDark*/}
                                    {/*                                ? 'border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30'*/}
                                    {/*                                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'*/}
                                    {/*                        }`}*/}
                                    {/*                        title="Supprimer"*/}
                                    {/*                    >*/}
                                    {/*                        <Trash2 className="w-4 h-4"/>*/}
                                    {/*                    </button>*/}
                                    {/*                </div>*/}
                                    {/*            </td>*/}
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
                    <BarChart3 className="w-5 h-5 text-primary-400"/>
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
                        dataKeys={[{key: 'posts', name: 'Posts', color: '#60A5FA'}]}
                        onExpand={() =>
                            setExpandedChart({
                                title: 'Posts mensuels (12 mois)',
                                type: 'line',
                                data: monthlyPosts,
                                dataKeys: [{key: 'posts', name: 'Posts', color: '#60A5FA'}]
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
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
                    >
                        <div
                            className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
                            <h2 className="text-xl font-bold text-white">Détails du Post</h2>
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-6 h-6"/>
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
                                    <p className="text-white capitalize">{selectedPost.category_name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Date de
                                        création</label>
                                    <p className="text-white">{format(new Date(selectedPost?.created_at), 'dd/MM/yyyy HH:mm', {locale: fr})}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Statut</label>
                                    <p className="text-white">{isActive(selectedPost) ? 'Publié' : 'Brouillon'}</p>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description
                                    courte</label>
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
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
                    >
                        <div
                            className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800 z-10">
                            <h2 className="text-xl font-bold text-white">
                                {showFormModal === "edit" ? 'Modifier le post' : 'Ajouter un post'}
                            </h2>
                            <button
                                onClick={() => setShowFormModal(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-6 h-6"/>
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
                                            value={formData.category_id}
                                            onChange={(e) => handleFormChange('category_id', e.target.value)}
                                            className="w-full bg-gray-700 border-gray-600 text-white rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            {categories?.responseData?.data?.map(cat => (
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
                                            {formData?.image_urls?.map((url, idx) => (
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
                                  <Star className="w-4 h-4"/>
                                </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeImageUrl(idx)}
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30 transition"
                                                                title="Supprimer"
                                                            >
                                                                <X className="w-4 h-4"/>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {formData?.image_urls?.length === 0 && (
                                                <tr>
                                                    <td className="px-3 py-4 text-gray-400" colSpan={3}>Aucune image.
                                                        Cliquez sur "Ajouter une image".
                                                    </td>
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
                                        {formData?.image_urls?.length > 0 && (
                                            <span className="text-xs text-gray-400">La première URL sera utilisée comme image principale.</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Date de l'événement <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.event_date}
                                        onChange={(e) => handleFormChange('event_date', e.target.value)}
                                        className="w-full bg-gray-700 border-gray-600 text-white rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Permet d'enregistrer des posts antérieurs
                                        liés à un événement</p>
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
                                            checked={formData?.is_active}
                                            onChange={(e) => handleFormChange('is_active', e.target.checked)}
                                            className="w-5 h-5 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-300">Publier immédiatement</span>
                                    </label>

                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData?.is_pinned}
                                            onChange={(e) => handleFormChange('is_pinned', e.target.checked)}
                                            className="w-5 h-5 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-300">Épingler en haut</span>
                                    </label>

                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(null)}
                                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                >
                                    Annuler
                                </button>
                                <button
                                    disabled={isAdding || isUpdating}
                                    type="submit"
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    {isAdding || isUpdating ? 'Chargement ... ' : 'Valider'}
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
                        className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700"
                    >
                        <div className="flex items-center mb-4">
                            <AlertCircle className="w-6 h-6 text-red-500 mr-2"/>
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
                                disabled={isDeleting}
                                onClick={() => deletePost({id: showDeleteConfirm})}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                {isDeleting ? "Chargement ... " : "Supprimer"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {showStatusConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className={`rounded-lg p-6 max-w-md w-full mx-4 border ${
                            isDark
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-white border-gray-200 shadow-lg'
                        }`}
                    >
                        <div className="flex items-center mb-4">
                            {isActive(showStatusConfirm) ? <XCircle className="w-6 h-6 text-red-500 mr-2"/> :
                                <CheckCircle className="w-6 h-6 text-green-500 mr-2"/>}
                            <h3
                                className={`text-lg font-semibold ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                }`}
                            >
                                {isActive(showStatusConfirm) ? "Desactiver ce Post" : "Approuver ce Post"}
                            </h3>
                        </div>
                        <p
                            className={`mb-6 ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}
                        >
                            Voulez-vous vraiment changer le statut ce Post :
                            {showStatusConfirm && (
                                <span className="font-semibold"> {showStatusConfirm.title} </span>
                            )}
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowStatusConfirm(null)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isDark
                                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleChangeStatus(showStatusConfirm)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                            >
                                {isUpdating ? "Chargement ... " : "Valider"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

        </div>
    );
};

export default PostsPage;
