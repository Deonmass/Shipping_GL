import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { StatsCard } from '../../components/admin/StatsCard';
import { FilterBar } from '../../components/admin/FilterBar';
import { FileText, Trash2, Mail, Eye, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuoteRequestRow {
  id: string;
  created_at: string;
  service_code: string;
  service_name: string | null;
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

const AdminQuoteRequestsPage: React.FC = () => {
  const { theme } = useOutletContext<{ theme: 'dark' | 'light' }>();
  const isDark = theme === 'dark';

  const [requests, setRequests] = useState<QuoteRequestRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [stats, setStats] = useState<QuoteStats>({ total: 0, byService: {} });
  const [displayStats, setDisplayStats] = useState<QuoteStats>({ total: 0, byService: {} });
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequestRow | null>(null);

  useEffect(() => {
    const init = async () => {
      await fetchRequests();
    };
    init();
  }, []);

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
      setDisplayStats({ total: nextTotal, byService: nextByService });
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [stats.total, JSON.stringify(stats.byService)]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quote_requests')
        .select(
          'id, created_at, service_code, service_name, name, email, phone, company, details, status, assigned_to, processed_at'
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data || []) as QuoteRequestRow[];
      setRequests(rows);

      const byService: Record<string, number> = {};
      for (const r of rows) {
        const key = r.service_code || 'AUTRE';
        byService[key] = (byService[key] || 0) + 1;
      }
      setStats({ total: rows.length, byService });
    } catch (e: any) {
      console.error('[QuoteRequestsAdmin] Error fetching quote requests:', e);
      toast.error("Erreur lors du chargement des demandes de devis");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (row: QuoteRequestRow) => {
    const nextStatus = row.status === 'done' ? 'new' : 'done';
    const nextProcessedAt = nextStatus === 'done' ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ status: nextStatus, processed_at: nextProcessedAt })
        .eq('id', row.id);

      if (error) throw error;

      toast.success(
        nextStatus === 'done' ? 'Demande marquée comme traitée' : 'Demande remise en "nouvelle"'
      );
      await fetchRequests();
    } catch (e: any) {
      console.error('[QuoteRequestsAdmin] Error updating quote request status:', e);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
  };

  const handleDelete = async (row: QuoteRequestRow) => {
    if (!window.confirm(`Supprimer la demande de ${row.name} pour ${row.service_name || row.service_code} ?`)) return;
    try {
      const { error } = await supabase
        .from('quote_requests')
        .delete()
        .eq('id', row.id);

      if (error) throw error;
      toast.success('Demande supprimée');
      await fetchRequests();
    } catch (e: any) {
      console.error('[QuoteRequestsAdmin] Error deleting quote request:', e);
      toast.error("Erreur lors de la suppression de la demande");
    }
  };

  const filteredRequests = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return requests.filter((r) => {
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

  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      if (r.service_code) set.add(r.service_code);
    });
    return Array.from(set).sort();
  }, [requests]);

  return (
    <div>
      <div className="mb-6 mt-[60px] flex items-center justify-between">
        <h1
          className={`text-2xl font-bold flex items-center gap-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          <Mail className={`w-7 h-7 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          Demandes de devis
        </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium border transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
          >
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total demandes"
          value={displayStats.total}
          icon={FileText}
          className="bg-gradient-to-br from-red-600 to-red-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        {Object.keys(displayStats.byService).slice(0, 3).map((code) => (
          <StatsCard
            key={code}
            title={`Service ${code}`}
            value={displayStats.byService[code]}
            icon={Mail}
            className="bg-gradient-to-br from-sky-600 to-sky-700"
            iconClassName="text-white"
            titleClassName="text-white"
          />
        ))}
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={[
          {
            label: 'Service',
            value: selectedService,
            options: [
              { label: 'Tous', value: '' },
              ...uniqueServices.map((code) => ({ label: code, value: code })),
            ],
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
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                      Chargement des demandes de devis...
                    </span>
                  </div>
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm">
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                    Aucune demande trouvée.
                  </span>
                </td>
              </tr>
            ) : (
              filteredRequests.map((row) => {
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
                        {row.service_name || row.service_code}
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
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
                            row.status === 'done'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {row.status === 'done'
                            ? 'Traitée'
                            : row.status === 'in_progress'
                            ? 'En cours'
                            : 'Nouvelle'}
                        </span>
                        {row.processed_at && (
                          <span className={isDark ? 'text-gray-400 text-xs' : 'text-gray-500 text-xs'}>
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
                        <button
                          onClick={() => handleToggleStatus(row)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-medium transition ${
                            row.status === 'done'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                          title={row.status === 'done' ? 'Marquer comme nouvelle' : 'Marquer comme traitée'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedRequest(row)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-medium transition ${
                            isDark
                              ? 'border-gray-600 text-gray-100 hover:bg-gray-700'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          title="Voir le détail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${
                            isDark
                              ? 'border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30'
                              : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                          title="Supprimer la demande"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                  {selectedRequest.service_name || selectedRequest.service_code} 
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
                      dangerouslySetInnerHTML={{ __html: selectedRequest.details }}
                    />
                  ) : (
                    <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Aucun message fourni.</div>
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
