import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {
    Eye,
    Trash2,
    X,
    AlertCircle,
    Search,
    MessageSquare,
    TrendingUp,
    Calendar,
    BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import {format, subMonths} from 'date-fns';
import {fr} from 'date-fns/locale';
import {StatsCard} from '../../components/admin/StatsCard';
import {ChartPanel} from '../../components/admin/ChartPanel';
import {ChartModal} from '../../components/admin/ChartModal';
import {useOutletContext} from 'react-router-dom';
import {UseDeletePostComment, UseGetPostComments, UseUpdatePostComment} from "../../services";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import AppToast from "../../utils/AppToast.ts";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";

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

const isActive = (u: any) =>
    u?.status?.toString() === "1"

const CommentsPage: React.FC = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>() || { theme: 'dark'};
    const isDark = theme === 'dark';
    const [selectedComment, setSelectedComment] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [showPostModal, setShowPostModal] = useState<any | null>(null);
    const [expandedChart, setExpandedChart] = useState<{
        title: string;
        type: 'line' | 'bar' | 'pie';
        data: any[];
        dataKeys?: { key: string; name: string; color: string }[];
    } | null>(null);
    // -------------------------------------------------------------------------------

    const {isPending: isGettingComments, data: comments, refetch: reGetComments} = UseGetPostComments({format: "stats"})
    const {isPending: isDeleting, mutate: deleteComment, data: deleteResult} = UseDeletePostComment()
    const {isPending: isUpdating, mutate: updateComment, data: updateResult} = UseUpdatePostComment()


    useEffect(() => {
        if (updateResult) {
            if (updateResult?.responseData?.error) {
                AppToast.error(theme === "dark", updateResult?.responseData?.message || "Erreur lors de la mise a jour")
            } else {
                reGetComments()
                AppToast.success(theme === "dark", 'Commentaire mis a jour avec succès')
            }
        }
    }, [updateResult]);

    useEffect(() => {
        if (deleteResult) {
            if (deleteResult?.responseData?.error) {
                AppToast.error(theme === "dark", deleteResult?.responseData?.message || "Erreur lors de la suppression")
            } else {
                reGetComments()
                AppToast.success(theme === "dark", 'Commentaire supprimé avec succès')
                setShowDeleteConfirm(null);
            }
        }
    }, [deleteResult]);

    const handleDelete = async (id: string) => {
        deleteComment({id: id})
    };

    const filteredComments = comments?.responseData?.data?.items?.filter(comment =>
        comment?.comment?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        comment?.visitor_name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        comment?.post_title?.toLowerCase().includes(searchTerm?.toLowerCase())
    );

    // Charts data
    const monthlyComments = React.useMemo(() => {
        const now = new Date();
        const data: { name: string; comments: number }[] = [];
        for (let i = 11; i >= 0; i--) {
            const d = subMonths(now, i);
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
            const count = comments?.responseData?.data?.items?.filter(c => {
                const dt = new Date(c.created_at);
                return dt >= monthStart && dt <= monthEnd;
            }).length;
            data.push({name: format(d, 'MMM yyyy', {locale: fr}), comments: count});
        }
        return data;
    }, [comments]);

    const approvalDistribution = React.useMemo(() => {
        return [
            {name: 'Approuvés', value: comments?.responseData?.data?.totals?.active},
            {name: 'En attente', value: comments?.responseData?.data?.totals?.inactive},
        ];
    }, [comments]);

    // Early return for loading is now safe because ALL hooks were declared before it
    if (isGettingComments) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div
                    className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    const handleToggleVisibility = async (comment: Comment) => {
        if(!HasPermission(appPermissions.comments, appOps.update)){
            toast.error("Vous n'avez pas la permission requise");
            return
        }
        updateComment({
            id: comment.id,
            status: isActive(comment) ? "0" : "1"
        })
    };

    return (
        <div>
            <AdminPageHeader
                Icon={<MessageSquare className="w-6 h-6 text-primary-500"/>}
                title=" Gestion des commentaires"
                onRefresh={() => reGetComments()}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-6">
                <StatsCard
                    title="Total commentaires"
                    value={comments?.responseData?.data?.items?.length || "-"}
                    icon={MessageSquare}
                    className="bg-gradient-to-br from-sky-600 to-sky-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="Approuvés"
                    value={comments?.responseData?.data?.totals?.active || "-"}
                    icon={Calendar}
                    className="bg-gradient-to-br from-indigo-600 to-indigo-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="En attente"
                    value={comments?.responseData?.data?.totals?.inactive || "-"}
                    icon={TrendingUp}
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
                    {filteredComments?.map((comment: any) => (
                        <tr
                            key={comment.id}
                            className={`${
                                isDark
                                    ? 'hover:bg-gray-700/50'
                                    : 'hover:bg-gray-50'
                            } ${!isActive(comment) ? (isDark ? 'bg-yellow-900/20' : 'bg-yellow-50') : ''}`}
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                    <div
                                        className={`text-sm font-medium ${
                                            isDark ? 'text-white' : 'text-gray-900'
                                        }`}
                                    >
                                        {comment.visitor_name || 'Utilisateur inconnu'}
                                    </div>
                                    <div
                                        className={`text-xs ${
                                            isDark ? 'text-gray-400' : 'text-gray-500'
                                        }`}
                                    >
                                        {comment.visitor_email || 'N/A'}
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
                                    {comment.post_title || 'Article non trouvé'}
                                </button>
                            </td>
                            <td className="px-6 py-4">
                                <div
                                    className={`text-sm truncate max-w-md ${
                                        isDark ? 'text-white' : 'text-gray-800'
                                    }`}
                                >
                                    {comment.comment}
                                </div>
                            </td>
                            <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${
                                    isDark ? 'text-gray-300' : 'text-gray-600'
                                }`}
                            >
                                {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', {locale: fr})}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                    <button
                                        className={`px-2 py-1 text-xs rounded-full ${isActive(comment) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                                        title={isActive(comment) ? 'Approuvé' : 'En attente'}
                                    >
                                        {isActive(comment) ? 'Approuvé' : 'En attente'}
                                    </button>
                                    <button
                                        onClick={() => handleToggleVisibility(comment)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive(comment) ? 'bg-primary-600' : 'bg-gray-600'}`}
                                        title={isActive(comment) ? 'Visible' : 'Masqué'}
                                    >
                                        <span
                                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isActive(comment) ? 'translate-x-5' : 'translate-x-1'}`}/>
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
                                        <Eye className="w-4 h-4"/>
                                    </button>
                                    {HasPermission(appPermissions.comments, appOps.delete) ? <button
                                        onClick={() => setShowDeleteConfirm(comment.id)}
                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${
                                            isDark
                                                ? 'border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30'
                                                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button> : null}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {!filteredComments?.length && (
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
                    <BarChart3 className="w-5 h-5 text-primary-400"/>
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
                        dataKeys={[{key: 'comments', name: 'Commentaires', color: '#60A5FA'}]}
                        onExpand={() =>
                            setExpandedChart({
                                title: 'Commentaires mensuels (12 mois)',
                                type: 'line',
                                data: monthlyComments,
                                dataKeys: [{key: 'comments', name: 'Commentaires', color: '#60A5FA'}]
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
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
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
                                <X className="w-6 h-6"/>
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
                                        {selectedComment.visitor_name || 'Utilisateur inconnu'}
                                    </p>
                                    <p
                                        className={`text-sm ${
                                            isDark ? 'text-gray-400' : 'text-gray-500'
                                        }`}
                                    >
                                        {selectedComment.visitor_email || 'N/A'}
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
                                        {selectedComment.post_title || 'Article non trouvé'}
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
                                        {format(new Date(selectedComment.created_at), 'dd/MM/yyyy HH:mm', {locale: fr})}
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
                                    {selectedComment.comment}
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
                                            {selectedComment.visitor_id}
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
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
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
                                <X className="w-6 h-6"/>
                            </button>
                        </div>

                        <div className="p-6">
                            <h3
                                className={`text-2xl font-bold mb-4 ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                }`}
                            >
                                {showPostModal.post_title || 'Article supprimé'}
                            </h3>
                            <div
                                className={`leading-relaxed ql-editor ${
                                    isDark ? 'text-gray-300' : 'text-gray-800'
                                }`}
                                // if content is HTML, we use dangerouslySetInnerHTML; otherwise render as text
                                dangerouslySetInnerHTML={{__html: showPostModal.post_description || 'Contenu non disponible'}}
                            />
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Delete confirm */}
            {showDeleteConfirm && (
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
                            <AlertCircle className="w-6 h-6 text-red-500 mr-2"/>
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
                                {isDeleting ? "Chargement ... " : "Supprimer"}
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
