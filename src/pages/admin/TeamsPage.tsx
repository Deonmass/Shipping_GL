import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {
    Eye, Edit, Trash2, X, AlertCircle,
    Building2, CheckCircle, Clock, BarChart3,
    XCircle, Users
} from 'lucide-react';
import {format, parseISO, subMonths, startOfMonth, endOfMonth} from 'date-fns';
import {fr} from 'date-fns/locale';
import {StatsCard} from '../../components/admin/StatsCard';
import {FilterBar} from '../../components/admin/FilterBar';
import {ChartPanel} from '../../components/admin/ChartPanel';
import {ChartModal} from '../../components/admin/ChartModal';
import {useOutletContext} from 'react-router-dom';
import {
    UseAddTeam,
    UseGetTeams,
    UseDeleteTeam, UseUpdateTeam
} from "../../services";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";
import AppToast from "../../utils/AppToast.ts";

interface TeamFormData {
    id?: string;
    title: string;
    description: string;
    image_url: string;
    name: string;
    status: string;
    created_at?: string;
}

const emptyItem: TeamFormData = {
    title: '',
    description: '',
    image_url: '',
    name: '',
    created_at: '',
    status: ''
}

const isActive = (u: any) =>
    u?.status?.toString() === "1"

const TeamsPage: React.FC = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>();
    const isDark = theme === 'dark';
    const [selectedPartner, setSelectedPartner] = useState<TeamFormData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [groupBy, setGroupBy] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [expandedChart, setExpandedChart] = useState<{
        title: string;
        type: 'line' | 'pie';
        data: any[];
        dataKeys?: any[]
    } | null>(null);
    const [showFormModal, setShowFormModal] = useState<"add" | "edit" | null>(null);
    const [formData, setFormData] = useState<TeamFormData>(emptyItem);
    const [showStatusConfirm, setShowStatusConfirm] = useState<TeamFormData | null>(null);

    const {isPending: isGettingPartners, data: partners, refetch: reGetPartners, isRefetching: isReGettingPartners} = UseGetTeams({format: "stats"})
    const {data: addResult, isPending: isAdding, mutate: addPartner} = UseAddTeam()
    const {data: updateResult, isPending: isUpdating, mutate: updatePartner} = UseUpdateTeam()
    const {data: deleteResult, isPending: isDeleting, mutate: deletePartner} = UseDeleteTeam()


    useEffect(() => {
        if (addResult) {
            if (addResult?.responseData?.error) {
                AppToast.error(theme === "dark", addResult?.responseData?.message || "Erreur lors de l'enregistrement")
            } else {
                reGetPartners()
                AppToast.success(theme === "dark", 'Membre ajouté avec succès')
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
                reGetPartners()
                AppToast.success(theme === "dark", 'Membre mis a jour avec succès')
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
                reGetPartners()
                AppToast.success(theme === "dark", 'Membre supprimé avec succès')
                setShowDeleteConfirm(null);
            }
        }
    }, [deleteResult]);

    const handleView = (partner: TeamFormData) => {
        setSelectedPartner(partner);
    };

    const handleFormChange = (field: keyof TeamFormData, value: string) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.name.trim()) {
            AppToast.error(isDark, 'Veuillez remplir tous les champs');
            return;
        }
        const body = {
            title: formData.title,
            name: formData.name,
            description: formData.description,
            image_url: formData.image_url,
            status: formData.status || "0",
        }

        if (showFormModal === "add") {
            addPartner(body)
            return
        }
        updatePartner({
            id: formData?.id,
            ...body
        })
    };

    const handleDelete = async (id: string) => {
        deletePartner({id});
    };

    const handleChangeStatus = async (partner: any) => {
        if (!partner?.id) {
            AppToast.error(isDark, "Une erreur s'est produite ! Reesaayez svp.");
            return;
        }
        updatePartner({
            id: partner?.id,
            status: isActive(partner) ? "0" : "1",
        })
    };


    const filteredPartners = partners?.responseData?.data?.items?.filter((partner: any) => {
        const matchesSearch = partner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            partner?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !statusFilter || partner?.status?.toString() === `${statusFilter}`;

        return matchesSearch && matchesStatus;
    });

    const groupedPartners = () => {
        if (!groupBy) return {'': filteredPartners};

        return filteredPartners.reduce((acc, partner) => {
            let key = '';

            if (groupBy === 'status') {
                key = partner?.status?.toString() === '1' ? 'Approuvés' :
                    partner?.status?.toString() === '0' ? 'En attente' : 'Rejetés';
            } else if (groupBy === 'month') {
                key = format(parseISO(partner.created_at), 'MMMM yyyy', {locale: fr});
            }

            if (!acc[key]) acc[key] = [];
            acc[key].push(partner);
            return acc;
        }, {} as Record<string, TeamFormData[]>);
    };

    const generateChartData = () => {
        const now = new Date();
        const monthlyData = [];

        for (let i = 5; i >= 0; i--) {
            const currentMonth = subMonths(now, i);
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);

            const monthlyPartners = partners?.responseData?.data?.items?.filter(partner => {
                const createdAt = parseISO(partner.created_at);
                return createdAt >= monthStart && createdAt <= monthEnd;
            });

            monthlyData.push({
                name: format(currentMonth, 'MMM', {locale: fr}),
                total: monthlyPartners?.length,
                approuvés: monthlyPartners?.filter(p => p.status === '1').length
            });
        }

        return monthlyData;
    };

    const getStatusDistribution = () => [
        {name: 'Approuvés', value: partners?.responseData?.data?.totals?.active},
        {name: 'En attente', value: partners?.responseData?.data?.totals?.inactive},
    ];

    const activeFiltersCount = [statusFilter, groupBy].filter(Boolean).length;

    const clearFilters = () => {
        setStatusFilter('');
        setGroupBy('');
    };


    if (isGettingPartners) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div
                    className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    const grouped = groupedPartners();

    return (
        <div>
            <AdminPageHeader
                Icon={<Users
                    className={`w-7 h-7 ${
                        isDark ? 'text-sky-400' : 'text-sky-600'
                    }`}
                />}
                title="Equipe Dirigeante"
                isRefreshing={isReGettingPartners}
                onRefresh={() => reGetPartners()}
                onAdd={HasPermission(appPermissions.team, appOps.create) ? () => {
                    setFormData(emptyItem);
                    setShowFormModal("add");
                } : undefined}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatsCard
                    title="Total partenaires"
                    value={partners?.responseData?.data?.items?.length || "0"}
                    icon={Building2}
                    className="bg-gradient-to-br from-sky-600 to-sky-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="Approuvés"
                    value={partners?.responseData?.data?.totals?.active || "0"}
                    icon={CheckCircle}
                    className="bg-gradient-to-br from-emerald-600 to-emerald-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="En attente"
                    value={partners?.responseData?.data?.totals?.inactive || "0"}
                    icon={Clock}
                    className="bg-gradient-to-br from-amber-600 to-amber-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
            </div>

            <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={[
                    {
                        label: 'Filtrer par statut',
                        value: statusFilter,
                        options: [
                            {label: 'Approuvés', value: '1'},
                            {label: 'En attente', value: '0'},
                        ],
                        onChange: setStatusFilter
                    },
                ]}
                groupBy={{
                    label: 'Regrouper par',
                    value: groupBy,
                    options: [
                        {label: 'Statut', value: 'status'},
                        {label: 'Mois', value: 'month'}
                    ],
                    onChange: setGroupBy
                }}
                activeFiltersCount={activeFiltersCount}
                onClearFilters={clearFilters}
                theme={theme}
            />

            <div className="space-y-6">
                <div className="w-full">
                    {Object.entries(grouped).map(([groupName, groupPartners]) => (
                        <div
                            key={groupName}
                            className={`rounded-lg shadow overflow-hidden border ${
                                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}
                        >
                            {groupName && (
                                <div
                                    className={`px-6 py-3 border-b ${
                                        isDark
                                            ? 'bg-gray-700 border-gray-600'
                                            : 'bg-gray-100 border-gray-200'
                                    }`}
                                >
                                    <h3
                                        className={`text-lg font-semibold ${
                                            isDark ? 'text-white' : 'text-gray-900'
                                        }`}
                                    >
                                        {groupName}
                                    </h3>
                                </div>
                            )}

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
                                        Fonction
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
                                        Date création
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
                                {groupPartners?.map((partner: any) => (
                                    <tr
                                        key={partner.id}
                                        className={isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {partner.image_url ? (
                                                    <img
                                                        src={partner.image_url}
                                                        alt={partner.name}
                                                        className="h-10 w-10 mr-3 object-contain rounded-md bg-white"
                                                    />
                                                ) : (
                                                    <div
                                                        className={`h-10 w-10 mr-3 flex items-center justify-center rounded-md border ${
                                                            isDark
                                                                ? 'bg-gray-800 border-gray-700'
                                                                : 'bg-white border-gray-200'
                                                        }`}
                                                    >
                                                        <Building2
                                                            className={`h-5 w-5 ${
                                                                isDark ? 'text-primary-400' : 'text-primary-600'
                                                            }`}
                                                        />
                                                    </div>
                                                )}
                                                <div
                                                    className={`text-sm font-medium ${
                                                        isDark ? 'text-white' : 'text-gray-900'
                                                    }`}
                                                >
                                                    {partner.name}
                                                </div>
                                            </div>
                                        </td>

                                        <td
                                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                                                isDark ? 'text-gray-300' : 'text-gray-600'
                                            }`}
                                        >
                                            {partner.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span
                                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                                                        isActive(partner)
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                    title="Double-cliquez pour changer l'état actif/inactif"
                                                    onDoubleClick={() =>
                                                        setShowStatusConfirm(partner)
                                                    }
                                                >
                            {isActive(partner) ? 'Actif' : 'Inactif'}
                          </span>
                                            </div>
                                        </td>
                                        <td
                                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                                                isDark ? 'text-gray-300' : 'text-gray-600'
                                            }`}
                                        >
                                            {format(parseISO(partner.created_at), 'dd/MM/yyyy', {locale: fr})}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {HasPermission(appPermissions.partners, appOps.update) ? <button
                                                    onClick={() => setShowStatusConfirm(partner)}
                                                    className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                                        isActive(partner)
                                                            ? 'bg-red-600'
                                                            : isDark
                                                                ? 'bg-gray-600'
                                                                : 'bg-gray-300'
                                                    }`}
                                                    title={isActive(partner) ? 'Désactiver' : 'Activer'}
                                                >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                    isActive(partner) ? 'translate-x-4' : 'translate-x-1'
                                }`}
                            />
                                                </button> : null}

                                                {/* Voir */}
                                                <button
                                                    onClick={() => handleView(partner)}
                                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${
                                                        isDark
                                                            ? 'border-green-700 bg-green-900/20 text-green-400 hover:bg-green-900/30'
                                                            : 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                                                    }`}
                                                    title="Voir détails"
                                                >
                                                    <Eye className="w-4 h-4"/>
                                                </button>

                                                {/* Modifier */}
                                                {HasPermission(appPermissions.team, appOps.update) ? <button
                                                    onClick={() => {
                                                        setFormData(partner);
                                                        setShowFormModal("edit");
                                                    }}
                                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${
                                                        isDark
                                                            ? 'border-yellow-700 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30'
                                                            : 'border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                                                    }`}
                                                    title="Modifier"
                                                >
                                                    <Edit className="w-4 h-4"/>
                                                </button> : null}

                                                {/* Supprimer */}
                                                {HasPermission(appPermissions.team, appOps.delete) ? <button
                                                    onClick={() => setShowDeleteConfirm(partner.id)}
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
                    ))}
                </div>

                <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-primary-400"/>
                        <h2
                            className={`text-lg font-semibold ${
                                isDark ? 'text-white' : 'text-gray-900'
                            }`}
                        >
                            Analyse des Membres
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ChartPanel
                            title="Évolution Mensuelle"
                            type="line"
                            data={generateChartData()}
                            dataKeys={[
                                {key: 'total', name: 'Total', color: '#EF4444'},
                                {key: 'approuvés', name: 'Approuvés', color: '#10B981'}
                            ]}
                            onExpand={() => setExpandedChart({
                                title: 'Évolution Mensuelle des Partenaires',
                                type: 'line',
                                data: generateChartData(),
                                dataKeys: [
                                    {key: 'total', name: 'Total', color: '#EF4444'},
                                    {key: 'approuvés', name: 'Approuvés', color: '#10B981'}
                                ]
                            })}
                            theme={theme}
                        />

                        <ChartPanel
                            title="Répartition par Statut"
                            type="pie"
                            data={getStatusDistribution()}
                            onExpand={() => setExpandedChart({
                                title: 'Répartition par Statut',
                                type: 'pie',
                                data: getStatusDistribution()
                            })}
                            theme={theme}
                        />
                    </div>
                </div>
            </div>

            {selectedPartner && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className={`rounded-lg p-6 max-w-2xl w-full mx-4 border ${
                            isDark
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-white border-gray-200 shadow-lg'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2
                                className={`text-xl font-bold ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                }`}
                            >
                                Détails du Membre
                            </h2>
                            <button
                                onClick={() => setSelectedPartner(null)}
                                className={
                                    isDark
                                        ? 'text-gray-400 hover:text-white'
                                        : 'text-gray-500 hover:text-gray-900'
                                }
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>

                        {selectedPartner.image_url && (
                            <div className="mb-6">
                                <img
                                    src={selectedPartner.image_url}
                                    alt={selectedPartner.name}
                                    className="w-32 h-32 object-contain rounded-lg p-2 bg-white"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Fonction
                                </label>
                                <p className="text-white">{selectedPartner.title}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Statut
                                </label>
                                <p className="text-white">
                                    {isActive(selectedPartner) ? 'Approuvé' : 'En attente'}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Description
                                </label>
                                <p className="text-white">{selectedPartner.description || '-'}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setSelectedPartner(null)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isDark
                                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                            >
                                Fermer
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
                        className={`rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border ${
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
                                {showFormModal === "edit" ? 'Modifier le membre' : 'Ajouter un membre'}
                            </h2>
                            <button
                                onClick={() => setShowFormModal(null)}
                                className={
                                    isDark
                                        ? 'text-gray-400 hover:text-white'
                                        : 'text-gray-500 hover:text-gray-900'
                                }
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label
                                        className={`block text-sm font-medium mb-2 ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}
                                    >
                                        Nom <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => handleFormChange('name', e.target.value)}
                                        className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                                            isDark
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                                        }`}
                                        placeholder="Ex: Rod Bas"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label
                                        className={`block text-sm font-medium mb-2 ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}
                                    >
                                        Fonction <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => handleFormChange('title', e.target.value)}
                                        className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                                            isDark
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                                        }`}
                                        placeholder="Ex: Responsable RH"
                                    />
                                </div>


                                <div>
                                    <label
                                        className={`block text-sm font-medium mb-2 ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}
                                    >
                                        Statut
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => handleFormChange('status', e.target.value)}
                                        className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                                            isDark
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                                        }`}
                                    >
                                        <option value="0">En attente</option>
                                        <option value="1">Approuvé</option>
                                    </select>
                                </div>


                                <div className="col-span-2">
                                    <label
                                        className={`block text-sm font-medium mb-2 ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}
                                    >
                                        URL de la photo
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.image_url}
                                        onChange={(e) => handleFormChange('image_url', e.target.value)}
                                        className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                                            isDark
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                                        }`}
                                        placeholder="https://exemple.com/logo.png"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label
                                        className={`block text-sm font-medium mb-2 ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}
                                    >
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleFormChange('description', e.target.value)}
                                        rows={4}
                                        className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                                            isDark
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                                        }`}
                                        placeholder="Description du partenaire..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(null)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isDark
                                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
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
                                {isActive(showStatusConfirm) ? "Desactiver ce partenaire" : "Approuver ce partenaire"}
                            </h3>
                        </div>
                        <p
                            className={`mb-6 ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}
                        >
                            Voulez-vous vraiment changer le statut ce membre :
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
                            Êtes-vous sûr de vouloir supprimer ce membre ? Cette action est irréversible.
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
                                disabled={isDeleting}
                                onClick={() => handleDelete(showDeleteConfirm)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                                {isDeleting ? "Chargement ..." : "Supprimer"}
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

export default TeamsPage;
