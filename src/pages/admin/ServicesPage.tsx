import React, {useEffect, useMemo, useState} from 'react';
import {motion} from 'framer-motion';
import {useOutletContext} from 'react-router-dom';
import {StatsCard} from '../../components/admin/StatsCard';
import {FilterBar} from '../../components/admin/FilterBar';
import {
    Wrench,
    FileText,
    Edit,
    Trash2, ToggleRight, ToggleLeft, AlertCircle, XCircle, CheckCircle,
} from 'lucide-react';
import {UseAddService, UseDeleteService, UseGetServices, UseUpdateService} from "../../services";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import AppToast from "../../utils/AppToast.ts";

interface ServiceRow {
    id?: number;
    title: string;
    code: string;
    description: string | null;
    email: string | null;
}

const emptyItem = {
    title: "",
    code: "",
    description: "",
    email: ""
}

const isActive = (u: any) =>
    u?.status?.toString() === "1"

const AdminServicesPage: React.FC = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>();
    const isDark = theme === 'dark';
    const [searchTerm, setSearchTerm] = useState('');
    const [groupBy, setGroupBy] = useState('');
    const [showFormModal, setShowFormModal] = useState<"add" | "edit" | null>(null);
    const [formData, setFormData] = useState<ServiceRow>(emptyItem);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [showStatusConfirm, setShowStatusConfirm] = useState<ServiceRow | null>(null);

    const {data: services, isPending: isGettingServices, refetch: reGetServices} = UseGetServices({format: "stats"})
    const {mutate: addService, isPending: isAdding, data: addResult} = UseAddService()
    const {mutate: updateService, isPending: isUpdating, data: updateResult} = UseUpdateService()
    const {mutate: deleteService, isPending: isDeleting, data: deleteResult} = UseDeleteService()


    useEffect(() => {
        if (addResult) {
            if (addResult?.responseData?.error) {
                AppToast.error(theme === "dark", addResult?.responseData?.message || "Erreur lors de l'enregistrement")
            } else {
                reGetServices()
                AppToast.success(theme === "dark", 'Service ajouté avec succès')
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
                reGetServices()
                AppToast.success(theme === "dark", 'Service mis a jour avec succès')
                setShowFormModal(null);
                setFormData(emptyItem);
                setShowStatusConfirm(null);
            }
        }
    }, [updateResult]);

    useEffect(() => {
        if (deleteResult) {
            if (deleteResult?.responseData?.error) {
                AppToast.error(theme === "dark", deleteResult?.responseData?.message || "Erreur lors de la suppression")
            } else {
                reGetServices()
                AppToast.success(theme === "dark", 'Service supprimé avec succès')
                setShowDeleteConfirm(null);
            }
        }
    }, [deleteResult]);

    const handleFormChange = (field: keyof ServiceRow, value: string) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleChangeStatus = async (item: any) => {
        if (!item?.id) {
            AppToast.error(isDark, "Une erreur s'est produite ! Reesayez svp.");
            return;
        }
        updateService({
            id: item?.id,
            status: isActive(item) ? "0" : "1",
        })
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.code.trim()) {
            AppToast.error(isDark,'Nom et code du service sont obligatoires');
            return;
        }

        const body = {
            title: formData.title,
            code: formData.code,
            description: formData.description,
            email: formData.email,
        }

        if(showFormModal === "add") {
            addService(body)
        }else{
            if (!formData.id) {
                AppToast.error(isDark, "Une erreur s'est produite");
                return;
            }
            updateService({id: formData?.id, ...body})
        }
    };

    const filteredServices = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return services?.responseData?.data?.items?.filter((s: any) => {
            const matchesSearch =
                !q ||
                s.title.toLowerCase().includes(q) ||
                s.code.toLowerCase().includes(q) ||
                (s.description || '').toLowerCase().includes(q);
            return matchesSearch;
        });
    }, [services, searchTerm]);


    const groupedServices = useMemo(() => {
        if (!groupBy) return {'': filteredServices} as Record<string, ServiceRow[]>;

        return filteredServices.reduce((acc, s) => {
            let key = '';
            if (groupBy === 'status') {
                key = s?.status?.toString() === '1' ? 'Actifs' : "Inactifs"
            }

            if (!acc[key]) acc[key] = [];
            acc[key].push(s);
            return acc;
        }, {} as Record<string, ServiceRow[]>);
    }, [filteredServices, groupBy]);


    const getActionItems = (item: any) => [
        {
            visible: HasPermission(appPermissions.services, appOps.delete),
            label: isActive(item) ? 'Désactiver' : 'Activer',
            icon: isActive(item) ? ToggleRight : ToggleLeft,
            onClick: () => {
                setShowStatusConfirm(item);
            },
            color: (isActive(item) ? 'text-emerald-400' : 'text-red-400'),
            bgColor: '',
            borderColor: (isActive(item) ? 'border-emerald-500/60' : 'border-red-500/60'),
        },
        // {
        //     visible: HasPermission(appPermissions.services, appOps.read),
        //     label: 'Voir détails',
        //     icon: Eye,
        //     onClick: () => {
        //         //  setShowViewModal(user);
        //     },
        //     color: 'text-blue-400',
        //     bgColor: 'bg-blue-500/20',
        //     borderColor: 'border-blue-500/30'
        // },
        {
            visible: HasPermission(appPermissions.services, appOps.update),
            label: 'Modifier',
            icon: Edit,
            onClick: () => {
                setFormData(item);
                setShowFormModal("edit");
            },
            color: 'text-green-400',
            bgColor: 'bg-green-500/20',
            borderColor: 'border-green-500/30'
        },
        {
            visible: HasPermission(appPermissions.services, appOps.delete),
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


    return (
        <div>
            <AdminPageHeader
                Icon={<Wrench className={`w-7 h-7 ${isDark ? 'text-red-400' : 'text-red-600'}`}/>}
                title="Gestion des Services"
                onRefresh={() => reGetServices()}
                onAdd={HasPermission(appPermissions.services, appOps.create) ? () => {
                    setFormData(emptyItem);
                    setShowFormModal("add");
                } : undefined}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <StatsCard
                    title="Total services"
                    value={services?.responseData?.data?.items?.length || "0"}
                    icon={FileText}
                    className="bg-gradient-to-br from-blue-600 to-blue-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="Services actifs"
                    value={services?.responseData?.data?.totals?.active || "0"}
                    icon={Wrench}
                    className="bg-gradient-to-br from-amber-500 to-amber-600"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="Services inactifs"
                    value={services?.responseData?.data?.totals?.inactive || "0"}
                    icon={Wrench}
                    className="bg-gradient-to-br from-red-500 to-red-600"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />

            </div>

            <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={[]}
                groupBy={{
                    label: 'Regrouper par',
                    value: groupBy,
                    options: [
                        {label: 'Status', value: 'status'},
                    ],
                    onChange: setGroupBy,
                }}
                activeFiltersCount={groupBy ? 1 : 0}
                onClearFilters={() => setGroupBy('')}
                theme={theme}
            />

            <div className="space-y-6">
                {Object.entries(groupedServices).map(([groupName, rows]) => (
                    <div
                        key={groupName || 'default'}
                        className={
                            isDark
                                ? 'rounded-lg shadow overflow-hidden border bg-gray-800 border-gray-700'
                                : 'rounded-lg shadow overflow-hidden border bg-white border-gray-200'
                        }
                    >
                        {groupName && (
                            <div className={isDark ? 'bg-gray-900 px-6 py-3' : 'bg-gray-100 px-6 py-3'}>
                                <h2 className={isDark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-gray-800'}>
                                    {groupName}
                                </h2>
                            </div>
                        )}
                        <table className="w-full">
                            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
                            <tr>
                                <th className={isDark ? 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300' : 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600'}>
                                    Nom du service
                                </th>
                                <th className={isDark ? 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300' : 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600'}>
                                    Code
                                </th>
                                <th className={isDark ? 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300' : 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600'}>
                                    Description
                                </th>
                                <th className={isDark ? 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300' : 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600'}>
                                    Email de réception
                                </th>
                                <th className={isDark ? 'px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-300' : 'px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600'}>
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
                            {isGettingServices ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sm">
                                        <div className="flex items-center justify-center gap-2">
                                            <div
                                                className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"/>
                                            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                          Chargement des services...
                        </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sm">
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                        Aucun service trouvé.
                      </span>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((service) => (
                                    <tr
                                        key={service.id}
                                        className={isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
                                    >
                                        <td className="px-6 py-4">
                                            <div
                                                className={isDark ? 'text-sm font-medium text-white' : 'text-sm font-medium text-gray-900'}>
                                                {service.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                          {service.code}
                        </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className={isDark ? 'text-sm text-gray-300' : 'text-sm text-gray-600'}>
                                                {service.description || '—'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className={isDark ? 'text-sm text-gray-300' : 'text-sm text-gray-600'}>
                                                {service.email || '—'}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div
                                                className="inline-flex w-full flex-wrap items-center justify-end gap-2">

                                                {/* Autres actions ensuite */}
                                                {getActionItems(service)
                                                    .map((action) => {
                                                        if (action.label === 'Désactiver' || action.label === 'Activer') {
                                                            return action?.visible ? (
                                                                <button
                                                                    key={action.label}
                                                                    type="button"
                                                                    onClick={action.onClick}
                                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                                                        isActive(service)
                                                                            ? 'bg-red-600'
                                                                            : theme === 'dark'
                                                                                ? 'bg-gray-600'
                                                                                : 'bg-gray-300'
                                                                    }`}
                                                                    title={action.label}
                                                                >
                                      <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                              isActive(service) ? 'translate-x-6' : 'translate-x-1'
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
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                ))}
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
                            Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.
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
                                onClick={() => deleteService({id: showDeleteConfirm})}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                                {isDeleting ? "Chargement ..." : "Supprimer"}
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
                                {isActive(showStatusConfirm) ? "Desactiver ce Service" : "Approuver ce Service"}
                            </h3>
                        </div>
                        <p
                            className={`mb-6 ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}
                        >
                            Voulez-vous vraiment changer le statut ce service :
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

            {showFormModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className="rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                    >
                        <div
                            className="p-6 border-b flex items-center justify-between sticky top-0 z-10 bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <h2 className={isDark ? 'text-xl font-bold text-white' : 'text-xl font-bold text-gray-900'}>
                                {showFormModal === "edit" ? 'Modifier le service' : 'Ajouter un service'}
                            </h2>
                            <button
                                onClick={() => setShowFormModal(false)}
                                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label
                                    className={isDark ? 'block text-sm font-medium mb-1 text-gray-200' : 'block text-sm font-medium mb-1 text-gray-700'}>
                                    Nom du service
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleFormChange('title', e.target.value)}
                                    className={
                                        isDark
                                            ? 'w-full px-3 py-2 rounded-md border text-sm bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
                                            : 'w-full px-3 py-2 rounded-md border text-sm bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500'
                                    }
                                    placeholder="Service Administratif Ponctuel"
                                />
                            </div>

                            <div>
                                <label
                                    className={isDark ? 'block text-sm font-medium mb-1 text-gray-200' : 'block text-sm font-medium mb-1 text-gray-700'}>
                                    Code du service
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
                                    className={
                                        isDark
                                            ? 'w-full px-3 py-2 rounded-md border text-sm bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
                                            : 'w-full px-3 py-2 rounded-md border text-sm bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500'
                                    }
                                    placeholder="SAP, AFR, OFR..."
                                />
                            </div>

                            <div>
                                <label
                                    className={isDark ? 'block text-sm font-medium mb-1 text-gray-200' : 'block text-sm font-medium mb-1 text-gray-700'}>
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleFormChange('description', e.target.value)}
                                    rows={4}
                                    className={
                                        isDark
                                            ? 'w-full px-3 py-2 rounded-md border text-sm resize-none bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
                                            : 'w-full px-3 py-2 rounded-md border text-sm resize-none bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500'
                                    }
                                    placeholder="Décrivez brièvement le service..."
                                />
                            </div>

                            <div>
                                <label
                                    className={isDark ? 'block text-sm font-medium mb-1 text-gray-200' : 'block text-sm font-medium mb-1 text-gray-700'}>
                                    Email de réception
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleFormChange('email', e.target.value)}
                                    className={
                                        isDark
                                            ? 'w-full px-3 py-2 rounded-md border text-sm bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
                                            : 'w-full px-3 py-2 rounded-md border text-sm bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500'
                                    }
                                    placeholder="email@exemple.com"
                                />
                            </div>

                            <div className="pt-4 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(null)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
                                >
                                    Annuler
                                </button>
                                <button
                                    disabled={isAdding || isUpdating}
                                    type="submit"
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white"
                                >
                                    {isAdding || isUpdating ? 'Chargement ... ' : 'Valider'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminServicesPage;
