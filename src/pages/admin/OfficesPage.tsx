import React, {useEffect, useState} from "react";
import {
    Building2,
    Edit,
    Eye,
    Trash2,
    CheckCircle,
    XCircle,
    X,
    CheckCircle2,
    AlertTriangle
} from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {useOutletContext} from "react-router-dom";
import {format, parseISO} from "date-fns";
import {fr} from "date-fns/locale";
import {UseAddOffice, UseDeleteOffice, UseGetOffices, UseUpdateOffice} from "../../services";
import {motion} from "framer-motion";
import AppToast from "../../utils/AppToast.ts";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";
import OfficeMap from "../../components/maps/OfficeMap";

const emptyItem = {
    title: "",
    description: "",
    address_line_1: "",
    address_line_2: "",
    address_line_3: "",
    is_hq: "",
}

const isActive = (u: any) =>
    u?.status?.toString() === "1"

const getCoordinate = (value: string, type : "lat" | "lng") => {
    if(value) {
        if(type === "lat") return  value.split(",")[0]
        return  value.split(",")[1]
    }
    return ""
}

const OfficesPage = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>();
    const isDark = theme === 'dark';

    const [formData, setFormData] = useState<any>(emptyItem);
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<any>();
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [showViewModal, setShowViewModal] = useState<any>(null);

    const {
        isLoading: isGettingOffices,
        isRefetching: isReGettingOffices,
        data: offices,
        refetch: reGetOffices
    } = UseGetOffices()
    const {isPending: isAdding, data: addResult, mutate: addItem} = UseAddOffice()
    const {isPending: isUpdating, data: updateResult, mutate: updateItem} = UseUpdateOffice()
    const {isPending: isDeleting, data: deleteResult, mutate: deleteItem} = UseDeleteOffice()


    useEffect(() => {
        if (addResult) {
            if (addResult?.responseData?.error) {
                AppToast.error(theme === "dark", addResult?.responseData?.message || "Erreur lors de l'enregistrement")
            } else {
                reGetOffices()
                AppToast.success(theme === "dark", 'Bureau ajouté avec succès')
                setShowAddModal(false);
                setFormData(emptyItem);
            }
        }
    }, [addResult]);

    useEffect(() => {
        if (updateResult) {
            if (updateResult?.responseData?.error) {
                AppToast.error(theme === "dark", updateResult?.responseData?.message || "Erreur lors de la mise a jour")
            } else {
                reGetOffices()
                AppToast.success(theme === "dark", 'Bureau mis a jour avec succès')
                setShowAddModal(false);
                setFormData(emptyItem);
            }
        }
    }, [updateResult]);

    useEffect(() => {
        if (deleteResult) {
            if (deleteResult?.responseData?.error) {
                AppToast.error(theme === "dark", deleteResult?.responseData?.message || "Erreur lors de la suppression")
            } else {
                reGetOffices()
                AppToast.success(theme === "dark", 'Bureau supprimé avec succès')
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

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData?.id) return
        if (!formData.title) {
            AppToast.error(theme === "dark", 'Veuillez remplir tous les champs requis')
            return;
        }
        updateItem({
            id: formData.id,
            description: formData.description,
            address_line_1: formData.address_line_1,
            address_line_2: formData.address_line_2,
            address_line_3: formData.address_line_3,
            latlng: formData.latlng,
            is_hq: formData.is_hq,
        })
    }

    const onDelete = (item: any) => {
        deleteItem({id: item.id,})
    }

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) {
            AppToast.error(theme === "dark", 'Veuillez remplir tous les champs requis')
            return;
        }
        addItem({
            title: formData.title,
            description: formData.description,
            address_line_1: formData.address_line_1,
            address_line_2: formData.address_line_2,
            address_line_3: formData.address_line_3,
            latlng: formData.latlng,
            is_hq: formData.is_hq,
        })
    }


    // Préparer les données pour la carte
    const officeLocations = offices?.responseData?.data
        ?.filter((office: any) => office.latlng)
        .map((office: any) => ({
            id: office.id,
            name: office.title,
            latitude: parseFloat(getCoordinate(office.latlng, "lat")),
            longitude: parseFloat(getCoordinate(office.latlng, "lng")),
            address: [
                office.address_line_1,
                office.address_line_2,
                office.address_line_3
            ].filter(Boolean).join(', ')
        })) || [];

    return (
        <div className="p-6 space-y-6">
            <AdminPageHeader
                Icon={<Building2 className="w-6 h-6 text-primary-500"/>}
                title="Gestion des Bureaux"
                onRefresh={() => reGetOffices()}
                onAdd={HasPermission(appPermissions.offices, appOps.create) ? () => {
                    setFormData(emptyItem);
                    setShowAddModal(true);
                } : undefined}
            />
            
            {/* Carte des bureaux */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <OfficeMap offices={officeLocations} className="h-96" />
            </div>

            {
                isGettingOffices || isReGettingOffices ? (
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
                            Ville
                        </th>
                        <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Adresse
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
                            HQ
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
                    {offices?.responseData?.data.map((item: any) => (
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
                                    {item.title}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                    className={`text-sm ${
                                        isDark ? 'text-gray-300' : 'text-gray-600'
                                    }`}
                                >
                                    {item.address_line_1} <br/>
                                    {item.address_line_2} <br/>
                                    {item.address_line_3}
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
                                {item?.is_hq?.toString() === "1" ? <CheckCircle className="text-green-700"/> :
                                    <XCircle className="text-red-600"/>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                {HasPermission(appPermissions.offices, appOps.update) ? <button
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
                                    {HasPermission(appPermissions.offices, appOps.update) ? <button
                                        onClick={() => {
                                            setShowEditModal(true);
                                            setFormData(item);
                                        }}
                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition border ${
                                            isDark
                                                ? 'border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:border-green-500/60'
                                                : 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                                        }`}
                                        title="Modifier"
                                    >
                                        <Edit className="w-5 h-5"/>
                                    </button> : null}
                                    {HasPermission(appPermissions.offices, appOps.delete) ? <button
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


            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className={
                            isDark
                                ? 'bg-gray-800 rounded-lg p-6 w-full max-w-lg border border-gray-700'
                                : 'bg-white rounded-lg p-6 w-full max-w-lg border border-gray-200'
                        }
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className={theme === 'dark' ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-gray-900'}>Ajouter
                                un Bureau</h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                }}
                                className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                                aria-label="Fermer"
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>

                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label
                                    className={isDark ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                    Nom / Ville
                                </label>
                                <input
                                    type="text"
                                    value={formData?.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className={
                                        isDark
                                            ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                    Adresse
                                </label>
                                <input
                                    type="text"
                                    value={formData?.address_line_1}
                                    placeholder="1e ligne"
                                    onChange={(e) => setFormData({...formData, address_line_1: e.target.value})}
                                    className={
                                        theme === 'dark'
                                            ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                />
                                <input
                                    type="text"
                                    value={formData?.address_line_2}
                                    placeholder="2e ligne"
                                    onChange={(e) => setFormData({...formData, address_line_2: e.target.value})}
                                    className={
                                        theme === 'dark'
                                            ? 'w-full my-2 bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full my-2 bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                />
                                <input
                                    type="text"
                                    value={formData?.address_line_3}
                                    placeholder="3e ligne"
                                    onChange={(e) => setFormData({...formData, address_line_3: e.target.value})}
                                    className={
                                        theme === 'dark'
                                            ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                />
                            </div>
                            <div>
                                <label
                                    className={isDark ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                    Latitude,Longitude
                                </label>
                                <input
                                    type="text"
                                    placeholder="-4.322447,15.307045"
                                    value={formData?.latlng}
                                    onChange={(e) => setFormData({...formData, latlng: e.target.value})}
                                    className={
                                        isDark
                                            ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                />
                            </div>
                            <div>
                                <label
                                    className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                    Description
                                </label>
                                <textarea
                                    value={formData?.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className={
                                        theme === 'dark'
                                            ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                />
                            </div>

                            <div>
                                <label
                                    className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                    HQ ?
                                </label>
                                <select
                                    value={formData?.is_hq}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        is_hq: e.target.value
                                    })}
                                    className={
                                        theme === 'dark'
                                            ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                >
                                    <option value="0">NON</option>
                                    <option value="1">OUI</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                    }}
                                    className={
                                        theme === 'dark'
                                            ? 'px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg'
                                            : 'px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg'
                                    }
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                                >
                                    {isAdding ? "Chargement..." : "Enregistrer"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

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
                                    <Building2 className="w-5 h-5 text-primary-400"/>
                                </div>
                                <div>
                                    <h2 className={theme === 'dark' ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-gray-900'}>
                                        {showViewModal?.title}
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
                                             <span>{isActive(showViewModal) ? 'Visible' : 'Masqué'}</span>
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
                                    Addresse
                                </div>
                                <div
                                    className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
                                    {showViewModal?.address_line_1 || '—'} <br/>
                                    {showViewModal?.address_line_2 || '—'} <br/>
                                    {showViewModal?.address_line_3 || '—'}
                                </div>
                                <div className={theme === 'dark' ? 'text-gray-400 mt-2' : 'text-gray-500 mt-2'}>Nom
                                    Lat,Lng
                                </div>
                                <div
                                    className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
                                    {showViewModal?.latlng || '—'}
                                </div>
                                <div
                                    className={theme === 'dark' ? 'text-gray-400 mt-2' : 'text-gray-500 mt-2'}>Description
                                </div>
                                <div
                                    className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>{showViewModal?.description || '—'}</div>
                                <div
                                    className={theme === 'dark' ? 'text-gray-400 mt-2' : 'text-gray-500 mt-2'}>HQ
                                </div>
                                <div
                                    className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>{showViewModal?.is_hq?.toString() === "1" ? "Oui" : 'Non'}</div>
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

            {showEditModal && formData?.id && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className={theme === 'dark' ? 'bg-gray-800 rounded-lg p-6 w-full max-w-lg border border-gray-700' : 'bg-white rounded-lg p-6 w-full max-w-lg border border-gray-200'}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className={theme === 'dark' ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-gray-900'}>Modifier
                                le Bureau</h2>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setFormData(emptyItem);
                                }}
                                className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                                aria-label="Fermer"
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateItem} className="space-y-4">
                            <div>
                                <label
                                    className={isDark ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                    Nom / Ville
                                </label>
                                <input
                                    type="text"
                                    value={formData?.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className={
                                        isDark
                                            ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                    Adresse
                                </label>
                                <input
                                    type="text"
                                    value={formData?.address_line_1}
                                    placeholder="1e ligne"
                                    onChange={(e) => setFormData({...formData, address_line_1: e.target.value})}
                                    className={
                                        theme === 'dark'
                                            ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                />
                                <input
                                    type="text"
                                    value={formData?.address_line_2}
                                    placeholder="2e ligne"
                                    onChange={(e) => setFormData({...formData, address_line_2: e.target.value})}
                                    className={
                                        theme === 'dark'
                                            ? 'w-full my-2 bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full my-2 bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                />
                                <input
                                    type="text"
                                    value={formData?.address_line_3}
                                    placeholder="3e ligne"
                                    onChange={(e) => setFormData({...formData, address_line_3: e.target.value})}
                                    className={
                                        theme === 'dark'
                                            ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                />
                            </div>
                            <div>
                                <label
                                    className={isDark ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                    Latitude,Longitude
                                </label>
                                <input
                                    type="text"
                                    placeholder="-4.322447,15.307045"
                                    value={formData?.latlng}
                                    onChange={(e) => setFormData({...formData, latlng: e.target.value})}
                                    className={
                                        isDark
                                            ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                />
                            </div>
                            <div>
                                <label
                                    className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                    Description
                                </label>
                                <textarea
                                    value={formData?.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className={
                                        theme === 'dark'
                                            ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                />
                            </div>

                            <div>
                                <label
                                    className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                    HQ ?
                                </label>
                                <select
                                    value={formData?.is_hq}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        is_hq: e.target.value
                                    })}
                                    className={
                                        theme === 'dark'
                                            ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                    }
                                >
                                    <option value="0">NON</option>
                                    <option value="1">OUI</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setFormData(emptyItem);
                                    }}
                                    className={
                                        theme === 'dark'
                                            ? 'px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg'
                                            : 'px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg'
                                    }
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                                >
                                    {isAdding ? "Chargement..." : "Enregistrer"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

export default OfficesPage