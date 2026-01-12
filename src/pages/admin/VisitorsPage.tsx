import {useEffect, useState} from "react";
import {
    Eye,
    Trash2,
    XCircle,
    X,
    CheckCircle2,
    AlertTriangle, UserRoundSearch, EyeOff
} from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {useOutletContext} from "react-router-dom";
import {format, parseISO} from "date-fns";
import {fr} from "date-fns/locale";
import {
    UseDeleteVisitor,
    UseGetVisitors,
    UseUpdateVisitor
} from "../../services";
import {motion} from "framer-motion";
import AppToast from "../../utils/AppToast.ts";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";
import {StatsCard} from "../../components/admin/StatsCard.tsx";

const isActive = (u: any) =>
    u?.status?.toString() === "1"

const VisitorsPage = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>();
    const isDark = theme === 'dark';
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<any>();
    const [showViewModal, setShowViewModal] = useState<any>(null);

    const {
        isLoading: isGetVisitors,
        isRefetching: isReGettingVisitors,
        data: visitors,
        refetch: reGetVisitors,
    } = UseGetVisitors({format: "stats"})
    const {isPending: isUpdating, data: updateResult, mutate: updateItem} = UseUpdateVisitor()
    const {isPending: isDeleting, data: deleteResult, mutate: deleteItem} = UseDeleteVisitor()



    useEffect(() => {
        if (updateResult) {
            if (updateResult?.responseData?.error) {
                AppToast.error(theme === "dark", updateResult?.responseData?.message || "Erreur lors de la mise a jour")
            } else {
                reGetVisitors()
                AppToast.success(theme === "dark", 'Visiteur mis a jour avec succès')
            }
        }
    }, [updateResult]);

    useEffect(() => {
        if (deleteResult) {
            if (deleteResult?.responseData?.error) {
                AppToast.error(theme === "dark", deleteResult?.responseData?.message || "Erreur lors de la suppression")
            } else {
                reGetVisitors()
                AppToast.success(theme === "dark", 'Visiteur supprimé avec succès')
                setShowDeleteConfirm(null);
            }
        }
    }, [deleteResult]);


    const handleToggleVisibility = (item: any) => {
        updateItem({
            id: item.id,
            status: isActive(item) ? "0" : "1"
        })
    }

    const onDelete = (item: any) => {
        deleteItem({id: item.id,})
    }


    return (
        <div className="p-6 space-y-6">
            <AdminPageHeader
                Icon={<UserRoundSearch className="w-6 h-6 text-primary-500"/>}
                title="Gestion des Comptes Visiteurs"
                onRefresh={() => reGetVisitors()}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatsCard
                    title="Total Comptes"
                    value={visitors?.responseData?.data?.items?.length || "0"}
                    icon={UserRoundSearch}
                    className="bg-gradient-to-br from-blue-600 to-blue-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="Actifs"
                    value={visitors?.responseData?.data?.totals?.active || "0"}
                    icon={Eye}
                    className="bg-gradient-to-br from-green-600 to-green-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="Bloqués"
                    value={visitors?.responseData?.data?.totals?.inactive || "0"}
                    icon={EyeOff}
                    className="bg-gradient-to-br from-purple-600 to-purple-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
            </div>

            {
                isReGettingVisitors || isGetVisitors ? (
                    <div className="flex items-center justify-center min-h-screen">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
                    </div>
                ) : null
            }

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
                            Noms
                        </th>
                        <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Contacts
                        </th>
                        <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Crée le
                        </th>
                        <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Entreprise
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
                    {visitors?.responseData?.data?.items?.map((item: any) => (
                        <tr
                            key={item.id}
                            className={`${
                                isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                            } ${!isActive(item) ? (isDark ? 'bg-red-900/10' : 'bg-red-50') : ''}`}
                        >
                            <td className="px-6 py-4">
                                <div
                                    className={`text-sm font-medium ${
                                        isDark ? 'text-white' : 'text-gray-900'
                                    }`}
                                >
                                    {item.name}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                    className={`text-sm ${
                                        isDark ? 'text-gray-300' : 'text-gray-600'
                                    }`}
                                >
                                    <a className="text-blue-500" href={`mailto:${item.email}`}>{item.email}</a> <br/>
                                    {item.phone}
                                </div>
                            </td>
                            <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${
                                    isDark ? 'text-gray-300' : 'text-gray-600'
                                }`}
                            >
                                {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', {locale: fr})}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {item?.company || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                {HasPermission(appPermissions.visitor_accounts, appOps.update) ? <button
                                    onClick={() => handleToggleVisibility(item)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        isActive(item) ? 'bg-primary-600' : 'bg-gray-600'
                                    }`}
                                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isActive(item) ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                                </button> : null}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => setShowViewModal(item)}
                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition border ${
                                            isDark
                                                ? 'border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/60'
                                                : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                                        }`}
                                        title="Voir détails"
                                    >
                                        <Eye className="w-5 h-5"/>
                                    </button>
                                    {HasPermission(appPermissions.visitor_accounts, appOps.delete) ? <button
                                        onClick={() => setShowDeleteConfirm(item)}
                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition border ${
                                            isDark
                                                ? 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/60'
                                                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-5 h-5"/>
                                    </button> : null}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>


            {showViewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className={theme === 'dark' ? 'bg-gray-800 rounded-lg p-6 w-full max-w-lg border border-gray-700' : 'bg-white rounded-lg p-6 w-full max-w-lg border border-gray-200'}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-3">
                                <div
                                    className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                                    <UserRoundSearch className="w-5 h-5 text-primary-400"/>
                                </div>
                                <div>
                                    <h2 className={theme === 'dark' ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-gray-900'}>
                                        {showViewModal?.name}
                                    </h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowViewModal(null)}
                                    className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                                    aria-label="Fermer"
                                >
                                    <X className="w-6 h-6"/>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div
                                className={theme === 'dark' ? 'bg-gray-700/50 rounded-lg p-3' : 'bg-gray-50 rounded-lg p-3'}>
                                <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Statut</div>
                                <div>
                                         <span
                                             className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium border ${
                                                 isActive(showViewModal)
                                                     ? 'border-emerald-500/60 bg-emerald-500/5 text-emerald-600'
                                                     : 'border-red-500/60 bg-red-500/5 text-red-600'
                                             }`}
                                         >
                                {isActive(showViewModal) ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500"/>
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500"/>
                                )}
                                             <span>{isActive(showViewModal) ? 'Actif' : 'Bloqué'}</span>
                              </span>
                                </div>
                            </div>
                            <div
                                className={theme === 'dark' ? 'bg-gray-700/50 rounded-lg p-3' : 'bg-gray-50 rounded-lg p-3'}>
                                <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Date de
                                    création
                                </div>
                                <div
                                    className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
                                    {showViewModal.created_at ? format(parseISO(showViewModal.created_at), 'dd/MM/yyyy HH:mm', {locale: fr}) : '—'}
                                </div>
                            </div>
                            <div
                                className={theme === 'dark' ? 'md:col-span-2 bg-gray-700/50 rounded-lg p-3' : 'md:col-span-2 bg-gray-50 rounded-lg p-3'}>
                                <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Nom
                                    Contacts
                                </div>
                                <div
                                    className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
                                    {showViewModal?.email || '—'} <br/>
                                    {showViewModal?.phone || '—'}
                                </div>
                                <div className={theme === 'dark' ? 'text-gray-400 mt-2' : 'text-gray-500 mt-2'}>Nom
                                    Entreprise
                                </div>
                                <div
                                    className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
                                    {showViewModal?.company || '—'}
                                </div>
                                <div
                                    className={theme === 'dark' ? 'text-gray-400 mt-2' : 'text-gray-500 mt-2'}>Derniere connexion
                                </div>
                                <div
                                    className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
                                    {showViewModal.updated_at ? format(parseISO(showViewModal.updated_at), 'dd/MM/yyyy HH:mm', {locale: fr}) : '—'}
                                </div>


                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowViewModal(null)}
                                className={theme === 'dark' ? 'px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600' : 'px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200'}
                            >
                                Fermer
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className={theme === 'dark' ? 'bg-gray-800 rounded-lg p-6 w-full max-w-md' : 'bg-white rounded-lg p-6 w-full max-w-md border border-gray-200'}
                    >
                        <div className="flex items-center mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-500 mr-3"/>
                            <h2 className={theme === 'dark' ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-gray-900'}>Attention</h2>
                        </div>
                        <p className={theme === 'dark' ? 'text-gray-300 mb-6' : 'text-gray-700 mb-6'}>
                            Êtes-vous sûr de vouloir éxécuter cette action ?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className={theme === 'dark' ? 'px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600' : 'px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200'}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => onDelete(showDeleteConfirm)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                {isDeleting || isUpdating ? "Chargement..." : "Valider"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

        </div>
    )
}

export default VisitorsPage