import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {
    Mail,
    Trash2,
    AlertCircle,
    Search,
    UserCheck,
    UserX,
    BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import {format} from 'date-fns';
import {fr} from 'date-fns/locale';
import {StatsCard} from '../../components/admin/StatsCard';
import {ChartPanel} from '../../components/admin/ChartPanel';
import {ChartModal} from '../../components/admin/ChartModal';
import * as XLSX from 'xlsx';
import {useOutletContext} from 'react-router-dom';
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {UseDeleteNewsletter, UseGetNewsletters, UseUpdateNewsletter} from "../../services";
import AppToast from "../../utils/AppToast.ts";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";

interface Subscriber {
    id: string;
    email: string;
    status: string;
    created_at: string;
    unsubscribed_at?: string;
}


const isActive = (u: any) =>
    u?.status?.toString() === "1"


const NewsletterPage: React.FC = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>() || { theme: 'dark'};
    const isDark = theme === 'dark';
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [expandedChart, setExpandedChart] = useState<{
        title: string;
        type: 'line' | 'bar' | 'pie';
        data: any[];
        dataKeys?: { key: string; name: string; color: string }[];
    } | null>(null);

    const {
        data: newsletters,
        isPending: isGettingNewsletters,
        refetch: reGetNewsletters
    } = UseGetNewsletters({format: "stats"})
    const {isPending: isDeleting, mutate: deleteNewsletter, data: deleteResult} = UseDeleteNewsletter()
    const {isPending: isUpdating, mutate: updateNewsletter, data: updateResult} = UseUpdateNewsletter()


    useEffect(() => {
        if (deleteResult) {
            if (deleteResult?.responseData?.error) {
                AppToast.error(theme === "dark", deleteResult?.responseData?.message || "Erreur lors de la suppression")
            } else {
                reGetNewsletters()
                AppToast.success(theme === "dark", 'Abonné supprimé avec succès')
                setShowDeleteConfirm(null);
            }
        }
    }, [deleteResult]);

    useEffect(() => {
        if (updateResult) {
            if (updateResult?.responseData?.error) {
                AppToast.error(theme === "dark", updateResult?.responseData?.message || "Erreur lors de la modification")
            } else {
                reGetNewsletters()
                AppToast.success(theme === "dark", 'Abonné mis a jour avec succès')
            }
        }
    }, [updateResult]);

    const handleToggleStatus = async (subscriber: Subscriber) => {
        if (!subscriber?.id) {
            AppToast.error(isDark, "Une erreur s'est produite.");
            return;
        }
        updateNewsletter({
            id: subscriber?.id,
            status: isActive(subscriber) ? "0" : "1",
            unsubscribed_at: isActive(subscriber) ? format(new Date(), 'yyyy/MM/dd HH:mm:ss') : null
        });
    };

    const handleExportToExcel = () => {
        const exportData = newsletters?.responseData?.data?.items?.map(sub => ({
            'Email': sub.email,
            'Statut': isActive(sub) ? 'Actif' : 'Désabonné',
            'Date d\'inscription': format(new Date(sub.created_at), 'dd/MM/yyyy HH:mm', {locale: fr}),
            'Date de désabonnement': sub.unsubscribed_at
                ? format(new Date(sub.unsubscribed_at), 'dd/MM/yyyy HH:mm', {locale: fr})
                : '-'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Abonnés Newsletter');

        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        XLSX.writeFile(wb, `newsletter_subscribers_${timestamp}.xlsx`);

        toast.success('Export Excel réussi');
    };

    const filteredSubscribers = newsletters?.responseData?.data?.items?.filter(subscriber =>
        subscriber.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Charts data
    const monthlySubs = React.useMemo(() => {
        // last 12 months
        const data: { name: string; inscriptions: number; desabonnements: number }[] = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
            const inscriptions = newsletters?.responseData?.data?.items?.filter(s => {
                const dt = new Date(s.created_at);
                return dt >= monthStart && dt <= monthEnd;
            }).length;
            const desabonnements = newsletters?.responseData?.data?.items?.filter(s => {
                if (!s.unsubscribed_at) return false;
                const dt = new Date(s.unsubscribed_at);
                return dt >= monthStart && dt <= monthEnd;
            }).length;
            data.push({
                name: d.toLocaleDateString('fr-FR', {month: 'short', year: 'numeric'}),
                inscriptions,
                desabonnements
            });
        }
        return data;
    }, [newsletters]);

    const statusDistribution = React.useMemo(() => {
        return [
            {name: 'Actifs', value: newsletters?.responseData?.data?.totals?.active},
            {name: 'Désabonnés', value: newsletters?.responseData?.data?.totals?.inactive}
        ];
    }, [newsletters]);

    if (isGettingNewsletters) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div
                    className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div>
            <AdminPageHeader
                title="Gestion Newsletter"
                Icon={<Mail className={`w-7 h-7 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}/>}
                onExport={handleExportToExcel}
                onRefresh={reGetNewsletters}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <StatsCard
                    title="Total abonnés"
                    value={newsletters?.responseData?.data?.items?.length || "0"}
                    icon={Mail}
                    className="bg-gradient-to-br from-sky-600 to-sky-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="Actifs"
                    value={newsletters?.responseData?.data?.totals?.active || "0"}
                    icon={UserCheck}
                    className="bg-gradient-to-br from-emerald-600 to-emerald-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="Désabonnés"
                    value={newsletters?.responseData?.data?.totals?.inactive || "0"}
                    icon={UserX}
                    className="bg-gradient-to-br from-rose-600 to-rose-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
            </div>

            <div className="mb-6">
                <div className="relative w-64">
                    <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                            isDark ? 'text-gray-400' : 'text-gray-400'
                        }`}
                    />
                    <input
                        type="search"
                        placeholder="Rechercher un email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-primary-500 focus:border-primary-500 ${
                            isDark
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 shadow-sm'
                        }`}
                    />
                </div>
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
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Email
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
                            Date d'inscription
                        </th>
                        <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Date de désabonnement
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
                    {filteredSubscribers?.map((subscriber: any) => (
                        <tr
                            key={subscriber.id}
                            className={`${
                                isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                            } ${subscriber.status !== 'active' ? (isDark ? 'bg-red-900/10' : 'bg-red-50') : ''}`}
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    <Mail
                                        className={`w-4 h-4 mr-2 ${
                                            isDark ? 'text-gray-400' : 'text-gray-500'
                                        }`}
                                    />
                                    <span
                                        className={`text-sm ${
                                            isDark ? 'text-white' : 'text-gray-900'
                                        }`}
                                    >
                      {subscriber.email}
                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                    onClick={() => handleToggleStatus(subscriber)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        isActive(subscriber)
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                                    }`}
                                >
                                    {isUpdating ? "..." : isActive(subscriber) ? 'Actif' : 'Désabonné'}
                                </button>
                            </td>
                            <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${
                                    isDark ? 'text-gray-300' : 'text-gray-600'
                                }`}
                            >
                                {format(new Date(subscriber.created_at), 'dd/MM/yyyy HH:mm', {locale: fr})}
                            </td>
                            <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${
                                    isDark ? 'text-gray-300' : 'text-gray-600'
                                }`}
                            >
                                {subscriber.unsubscribed_at
                                    ? format(new Date(subscriber.unsubscribed_at), 'dd/MM/yyyy HH:mm', {locale: fr})
                                    : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    {HasPermission(appPermissions.newsletter, appOps.delete) ? <button
                                        onClick={() => setShowDeleteConfirm(subscriber.id)}
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
                        Analyse des abonnés
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ChartPanel
                        title="Tendances mensuelles"
                        type="line"
                        data={monthlySubs}
                        dataKeys={[
                            {key: 'inscriptions', name: 'Inscriptions', color: '#22C55E'},
                            {key: 'desabonnements', name: 'Désabonnements', color: '#EF4444'}
                        ]}
                        onExpand={() =>
                            setExpandedChart({
                                title: 'Tendances mensuelles',
                                type: 'line',
                                data: monthlySubs,
                                dataKeys: [
                                    {key: 'inscriptions', name: 'Inscriptions', color: '#22C55E'},
                                    {key: 'desabonnements', name: 'Désabonnements', color: '#EF4444'}
                                ]
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
                            Êtes-vous sûr de vouloir supprimer cet abonné ? Cette action est irréversible.
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
                                onClick={() => deleteNewsletter({id: showDeleteConfirm})}
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

export default NewsletterPage;
