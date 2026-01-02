import React, {useEffect, useState} from "react";
import {Building2, Edit, Eye, Trash2, CheckCircle, XCircle, X, CheckCircle2, Circle} from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {useOutletContext} from "react-router-dom";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {UseAddOffice, UseGetOffices, UseUpdateOffice} from "../../services";
import {motion} from "framer-motion";
import AppToast from "../../utils/AppToast.ts";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";

const emptyItem = {
    title: "",
    description: "",
    address_line_1: "",
    address_line_2: "",
    address_line_3: "",
    is_hq: "",
}

const OfficesPage = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>();
    const isDark = theme === 'dark';

    const [formData, setFormData] = useState<any>(emptyItem);
    const [showAddModal, setShowAddModal] = useState<boolean>(false);

    const {
        isLoading: isGettingOffices,
        isRefetching: isReGettingOffices,
        data: offices,
        refetch: reGetOffices
    } = UseGetOffices()
    const {isPending: isAdding, data: addResult, mutate: addItem} = UseAddOffice()
    const {isPending: isUpdating, data: updateResult, mutate: updateItem} = UseUpdateOffice()


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


    const handleToggleVisibility = (item: any) => {
        console.log(item)
    }
    const onSelectItem = (item: any) => {
        console.log(item)
    }

    const onEdit = (item: any) => {
        console.log(item)
    }

    const onDelete = (item: any) => {
        console.log(item)
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
            is_hq: formData.is_hq,
        })
        console.log("item", formData)
    }


    return (
        <div>
            <AdminPageHeader
                title="Gestion des Bureaux"
                Icon={<Building2 className={`w-7 h-7 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}/>}
                //onExport={handleExportToExcel}
                onRefresh={reGetOffices}
                onAdd={HasPermission(appPermissions.offices, appOps.create) ? () => {
                    setFormData(emptyItem);
                    setShowAddModal(true);
                } : undefined}
            />

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
                            } ${!item.is_visible ? (isDark ? 'bg-red-900/10' : 'bg-red-50') : ''}`}
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
                                <button
                                    onClick={() => handleToggleVisibility(item)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        item.is_visible ? 'bg-primary-600' : 'bg-gray-600'
                                    }`}
                                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            item.is_visible ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                                </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => onSelectItem(item)}
                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition border ${
                                            isDark
                                                ? 'border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/60'
                                                : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                                        }`}
                                        title="Voir détails"
                                    >
                                        <Eye className="w-5 h-5"/>
                                    </button>
                                    <button
                                        onClick={() => onEdit(item)}
                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition border ${
                                            isDark
                                                ? 'border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:border-green-500/60'
                                                : 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                                        }`}
                                        title="Modifier"
                                    >
                                        <Edit className="w-5 h-5"/>
                                    </button>
                                    <button
                                        onClick={() => onDelete(item)}
                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition border ${
                                            isDark
                                                ? 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/60'
                                                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-5 h-5"/>
                                    </button>
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
                                un utilisateur</h2>
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
        </div>
    )
}

export default OfficesPage