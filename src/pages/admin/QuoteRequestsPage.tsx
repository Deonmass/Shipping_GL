import React, {useEffect, useMemo, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {StatsCard} from '../../components/admin/StatsCard';
import {FilterBar} from '../../components/admin/FilterBar';
import {FileText, Trash2, Mail, Eye, CheckCircle2} from 'lucide-react';
import {UseDeleteQuoteRequests, UseGetQuoteRequests, UseGetServices, UseUpdateQuoteRequests} from "../../services";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import Swal from "sweetalert2";
import AppToast from "../../utils/AppToast.ts";
import {getAuthData} from "../../utils";
import {format} from 'date-fns';


interface QuoteRequestRow {
    id: string;
    created_at: string;
    service_code: string;
    service_title: string | null;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    details: string | null;
    status?: string | null;
    assigned_to?: string | null;
    processed_at?: string | null;
}

interface QuoteStats {
    total: number;
    byService: Record<string, number>;
}

const isActive = (u: any) =>
    u?.status?.toString() === "1"

const isProcessed = (u: any) =>
    u?.status?.toString() === "2"


const AdminQuoteRequestsPage: React.FC = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>();
    const isDark = theme === 'dark';
    const {user: connectedUser} = getAuthData()

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedService, setSelectedService] = useState<string>('');
    const [stats, setStats] = useState<QuoteStats>({total: 0, byService: {}});
    const [displayStats, setDisplayStats] = useState<QuoteStats>({total: 0, byService: {}});
    const [selectedRequest, setSelectedRequest] = useState<QuoteRequestRow | null>(null);

    const {
        data: requests,
        isLoading: isGettingRequests,
        refetch: reGetRequests
    } = UseGetQuoteRequests({format: "stats"})
    const {data: services, isLoading: isGettingServices} = UseGetServices({noPermission: 1})
    const {data: deleteResult, isPending: isDeleting, mutate: deleteRequest} = UseDeleteQuoteRequests()
    const {data: updateResult, isPending: isUpdating, mutate: updateRequest} = UseUpdateQuoteRequests()


    useEffect(() => {
        const start = displayStats;
        const end = stats;
        const duration = 600;
        let frameId: number;
        const startTime = performance.now();

        const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const nextTotal = Math.round((start.total || 0) + (end.total - (start.total || 0)) * progress);
            const nextByService: Record<string, number> = {};
            const serviceKeys = Array.from(new Set([...Object.keys(start.byService), ...Object.keys(end.byService)]));
            for (const key of serviceKeys) {
                const from = start.byService[key] || 0;
                const to = end.byService[key] || 0;
                nextByService[key] = Math.round(from + (to - from) * progress);
            }
            setDisplayStats({total: nextTotal, byService: nextByService});
            if (progress < 1) {
                frameId = requestAnimationFrame(animate);
            }
        };

        frameId = requestAnimationFrame(animate);

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
        };
    }, [stats.total, JSON.stringify(stats.byService)]);

    useEffect(() => {
        if (updateResult) {
            if (updateResult?.responseData?.error) {
                AppToast.error(theme === "dark", updateResult?.responseData?.message || "Erreur lors de la mise a jour")
            } else {
                reGetRequests()
                AppToast.success(theme === "dark", 'Demande de devis traitée avec succès')
            }
        }
    }, [updateResult]);


    useEffect(() => {
        if (deleteResult) {
            if (deleteResult?.responseData?.error) {
                AppToast.error(theme === "dark", deleteResult?.responseData?.message || "Erreur lors de la suppression")
            } else {
                reGetRequests()
                AppToast.success(theme === "dark", 'Demande de devis supprimée avec succès')
            }
        }
    }, [deleteResult]);


    const handleToggleStatus = async (row: QuoteRequestRow) => {
        if (!row?.id) {
            AppToast.error(theme === "dark", 'Aucun ID fourni pour la mise a jour');
            return;
        }
        const result = await Swal.fire({
            title: 'Traitement de demande',
            text: `Traiter la demande de ${row.name} pour ${row.service_title || row.service_code} ?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, traiter',
            cancelButtonText: 'Annuler',
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#111827',
        });
        if (result.isConfirmed) {
            updateRequest({id: row.id, status: "2", processed_at: format(new Date(), 'yyyy/MM/dd HH:mm:ss'), processed_by: connectedUser?.id});
        }
    };

    const handleDelete = async (row: QuoteRequestRow) => {
        if (!row?.id) {
            AppToast.error(theme === "dark", 'Aucun ID fourni pour la suppression');
            return;
        }
        const result = await Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: `Supprimer la demande de ${row.name} pour ${row.service_title || row.service_code} ?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler',
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#111827',
        });
        if (result.isConfirmed) {
            deleteRequest({id: row.id});
        }

    };

    const filteredRequests = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return requests?.responseData?.data?.items?.filter((r) => {
            if (selectedService && r.service_code !== selectedService) return false;
            const matchesSearch =
                !q ||
                r.name.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q) ||
                (r.company || '').toLowerCase().includes(q) ||
                (r.service_name || '').toLowerCase().includes(q) ||
                (r.service_code || '').toLowerCase().includes(q);
            return matchesSearch;
        });
    }, [requests, searchTerm, selectedService]);


    return (
        <div>
            <AdminPageHeader
                Icon={<Mail className={`w-7 h-7 ${isDark ? 'text-red-400' : 'text-red-600'}`}/>}
                title="Demandes de Devis"
                onRefresh={() => reGetRequests()}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <StatsCard
                    title="Total demandes"
                    value={requests?.responseData?.data?.items?.length || "0"}
                    icon={FileText}
                    className="bg-gradient-to-br from-red-600 to-red-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />

                <StatsCard
                    title="Nouvelles Demandes"
                    value={requests?.responseData?.data?.totals?.active || "0"}
                    icon={Mail}
                    className="bg-gradient-to-br from-sky-600 to-sky-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />

                <StatsCard
                    title="Demandes Traitées"
                    value={requests?.responseData?.data?.totals?.processed || "0"}
                    icon={CheckCircle2}
                    className="bg-gradient-to-br from-sky-600 to-sky-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />

            </div>

            <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={[
                    {
                        label: 'Service',
                        value: selectedService,
                        options: services?.responseData?.data?.map((service: any) => ({
                            label: service?.code,
                            value: service?.code
                        })),
                        onChange: setSelectedService,
                    },
                ]}
                activeFiltersCount={selectedService ? 1 : 0}
                onClearFilters={() => setSelectedService('')}
                theme={theme}
            />

            <div
                className={`mt-6 rounded-lg shadow overflow-hidden border ${
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
                            Date
                        </th>
                        <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Service
                        </th>
                        <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Client
                        </th>
                        <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Coordonnées
                        </th>
                        <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
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
                    {isGettingRequests ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-sm">
                                <div className="flex items-center justify-center gap-2">
                                    <div
                                        className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"/>
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                      Chargement des demandes de devis...
                    </span>
                                </div>
                            </td>
                        </tr>
                    ) : !filteredRequests?.length ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-sm">
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                    Aucune demande trouvée.
                  </span>
                            </td>
                        </tr>
                    ) : (
                        filteredRequests?.map((row) => {
                            const created = row.created_at ? new Date(row.created_at) : null;
                            const createdLabel = created
                                ? created.toLocaleString('fr-FR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })
                                : '';
                            return (
                                <tr
                                    key={row.id}
                                    className={isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
                                >
                                    <td className="px-6 py-4 text-sm">
                                        <div className={isDark ? 'text-gray-100' : 'text-gray-900'}>{createdLabel}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className={isDark ? 'text-gray-100' : 'text-gray-900'}>
                                            {row.service_title}
                                        </div>
                                        <div className="mt-1">
                        <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                          {row.service_code}
                        </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className={isDark ? 'text-gray-100' : 'text-gray-900'}>{row.name}</div>
                                        {row.company && (
                                            <div className={isDark ? 'text-gray-400 text-xs' : 'text-gray-500 text-xs'}>
                                                {row.company}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className={isDark ? 'text-gray-100' : 'text-gray-900'}>{row.email}</div>
                                        {row.phone && (
                                            <div className={isDark ? 'text-gray-400 text-xs' : 'text-gray-500 text-xs'}>
                                                {row.phone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex flex-col gap-1">
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isProcessed(row) 
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : !isActive(row)
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {isProcessed(row)
                              ? 'Traitée'
                              : !isActive(row)
                                  ? 'En cours'
                                  : 'Nouvelle'}
                        </span>
                                            {row.processed_at && (
                                                <span
                                                    className={isDark ? 'text-gray-400 text-xs' : 'text-gray-500 text-xs'}>
                            Traité le{' '}
                                                    {new Date(row.processed_at).toLocaleString('fr-FR', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                          </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            {!isProcessed(row) && HasPermission(appPermissions.devis, appOps.update) ? <button
                                                onClick={() => handleToggleStatus(row)}
                                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-medium transition ${
                                                    row.status === 'done'
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                        : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                }`}
                                                title={row.status === 'done' ? 'Marquer comme nouvelle' : 'Marquer comme traitée'}
                                            >
                                                <CheckCircle2 className="w-4 h-4"/>
                                            </button> : null}
                                            <button
                                                onClick={() => setSelectedRequest(row)}
                                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-medium transition ${
                                                    isDark
                                                        ? 'border-gray-600 text-gray-100 hover:bg-gray-700'
                                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                                title="Voir le détail"
                                            >
                                                <Eye className="w-4 h-4"/>
                                            </button>
                                            {HasPermission(appPermissions.devis, appOps.delete) ? <button
                                                onClick={() => handleDelete(row)}
                                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${
                                                    isDark
                                                        ? 'border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30'
                                                        : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                                }`}
                                                title="Supprimer la demande"
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </button> : null}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>

            {selectedRequest && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                    onClick={() => setSelectedRequest(null)}
                >
                    <div
                        className={`${
                            isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                        } rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className={`flex items-center justify-between px-6 py-4 border-b ${
                                isDark ? 'border-gray-700' : 'border-gray-200'
                            }`}
                        >
                            <div>
                                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Détail de la demande de devis
                                </h2>
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {selectedRequest.service_title || selectedRequest.service_code}
                                    — {selectedRequest.name} ({selectedRequest.email})
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-4 text-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <div className="font-semibold mb-1">Client</div>
                                    <div>{selectedRequest.name}</div>
                                    {selectedRequest.company && (
                                        <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                            {selectedRequest.company}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-semibold mb-1">Coordonnées</div>
                                    <div>{selectedRequest.email}</div>
                                    {selectedRequest.phone && (
                                        <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                            {selectedRequest.phone}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="font-semibold mb-2">Message détaillé</div>
                                <div
                                    className={`border rounded-lg p-4 text-sm ${
                                        isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    {selectedRequest.details ? (
                                        <div
                                            className={isDark ? 'prose prose-invert max-w-none' : 'prose max-w-none'}
                                            dangerouslySetInnerHTML={{__html: selectedRequest.details}}
                                        />
                                    ) : (
                                        <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Aucun message
                                            fourni.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminQuoteRequestsPage;
