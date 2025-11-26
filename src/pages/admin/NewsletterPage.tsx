import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Trash2, X, AlertCircle, Search, RefreshCw, Download, UserCheck, UserX, Calendar, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StatsCard } from '../../components/admin/StatsCard';
import { ChartPanel } from '../../components/admin/ChartPanel';
import { ChartModal } from '../../components/admin/ChartModal';
import * as XLSX from 'xlsx';
import { useOutletContext } from 'react-router-dom';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscribed_at: string;
  unsubscribed_at?: string;
}

interface SubscriberStats {
  total: number;
  active: number;
  unsubscribed: number;
  thisMonth: number;
}

const NewsletterPage: React.FC = () => {
  const { theme } = useOutletContext<{ theme: 'dark' | 'light' }>();
  const isDark = theme === 'dark';
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [stats, setStats] = useState<SubscriberStats>({
    total: 0,
    active: 0,
    unsubscribed: 0,
    thisMonth: 0
  });
  const [displayStats, setDisplayStats] = useState<SubscriberStats>({
    total: 0,
    active: 0,
    unsubscribed: 0,
    thisMonth: 0,
  });
  const [expandedChart, setExpandedChart] = useState<{
    title: string;
    type: 'line' | 'bar' | 'pie';
    data: any[];
    dataKeys?: { key: string; name: string; color: string }[];
  } | null>(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Animation douce des compteurs pendant le chargement
  useEffect(() => {
    if (!loading) {
      setDisplayStats(stats);
      return;
    }

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    const jitter = (value: number, maxDelta: number, min: number, max: number) => {
      const delta = (Math.random() * 2 - 1) * maxDelta;
      return clamp(Math.round(value + delta), min, max);
    };

    const interval = setInterval(() => {
      setDisplayStats(prev => ({
        total: jitter(prev.total || 0, 20, 0, 999999),
        active: jitter(prev.active || 0, 10, 0, 999999),
        unsubscribed: jitter(prev.unsubscribed || 0, 5, 0, 999999),
        thisMonth: jitter(prev.thisMonth || 0, 5, 0, 99999),
      }));
    }, 900);

    return () => clearInterval(interval);
  }, [loading, stats]);

  const effectiveStats = loading ? displayStats : stats;

  const calculateStats = (subscriberList: Subscriber[]) => {
    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);

    const active = subscriberList.filter(s => s.status === 'active').length;
    const unsubscribed = subscriberList.filter(s => s.status === 'unsubscribed').length;
    const thisMonth = subscriberList.filter(s => {
      const subscribedAt = new Date(s.subscribed_at);
      return subscribedAt >= oneMonthAgo;
    }).length;

    setStats({
      total: subscriberList.length,
      active,
      unsubscribed,
      thisMonth
    });
  };

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;

      setSubscribers(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      console.error('Error fetching subscribers:', error);
      toast.error('Erreur lors du chargement des abonnés');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Abonné supprimé avec succès');
      fetchSubscribers();
    } catch (error: any) {
      console.error('Error deleting subscriber:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
    setShowDeleteConfirm(null);
  };

  const handleToggleStatus = async (subscriber: Subscriber) => {
    try {
      const newStatus = subscriber.status === 'active' ? 'unsubscribed' : 'active';
      const updateData: any = { status: newStatus };

      if (newStatus === 'unsubscribed') {
        updateData.unsubscribed_at = new Date().toISOString();
      } else {
        updateData.unsubscribed_at = null;
      }

      const { error } = await supabase
        .from('newsletter_subscribers')
        .update(updateData)
        .eq('id', subscriber.id);

      if (error) throw error;

      toast.success(newStatus === 'active' ? 'Abonné réactivé' : 'Abonné désabonné');
      fetchSubscribers();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  const handleExportToExcel = () => {
    const exportData = subscribers.map(sub => ({
      'Email': sub.email,
      'Statut': sub.status === 'active' ? 'Actif' : 'Désabonné',
      'Date d\'inscription': format(new Date(sub.subscribed_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
      'Date de désabonnement': sub.unsubscribed_at
        ? format(new Date(sub.unsubscribed_at), 'dd/MM/yyyy HH:mm', { locale: fr })
        : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Abonnés Newsletter');

    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    XLSX.writeFile(wb, `newsletter_subscribers_${timestamp}.xlsx`);

    toast.success('Export Excel réussi');
  };

  const filteredSubscribers = subscribers.filter(subscriber =>
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
      const inscriptions = subscribers.filter(s => {
        const dt = new Date(s.subscribed_at);
        return dt >= monthStart && dt <= monthEnd;
      }).length;
      const desabonnements = subscribers.filter(s => {
        if (!s.unsubscribed_at) return false;
        const dt = new Date(s.unsubscribed_at);
        return dt >= monthStart && dt <= monthEnd;
      }).length;
      data.push({ name: d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }), inscriptions, desabonnements });
    }
    return data;
  }, [subscribers]);

  const statusDistribution = React.useMemo(() => {
    const active = subscribers.filter(s => s.status === 'active').length;
    const unsub = subscribers.length - active;
    return [
      { name: 'Actifs', value: active },
      { name: 'Désabonnés', value: unsub }
    ];
  }, [subscribers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 mt-[60px] flex items-center justify-between">
        <h1
          className={`text-2xl font-bold flex items-center gap-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          <Mail
            className={`w-7 h-7 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}
          />
          Gestion Newsletter
        </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportToExcel}
            className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium shadow-sm ${
              isDark
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter Excel
          </button>
          <button
            onClick={fetchSubscribers}
            className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium border transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total abonnés"
          value={effectiveStats.total}
          icon={Mail}
          className="bg-gradient-to-br from-sky-600 to-sky-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Actifs"
          value={effectiveStats.active}
          icon={UserCheck}
          trend={{ value: Math.round((effectiveStats.active / Math.max(effectiveStats.total, 1)) * 100), label: '%' }}
          className="bg-gradient-to-br from-emerald-600 to-emerald-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Désabonnés"
          value={effectiveStats.unsubscribed}
          icon={UserX}
          className="bg-gradient-to-br from-rose-600 to-rose-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Ce mois"
          value={effectiveStats.thisMonth}
          icon={Calendar}
          className="bg-gradient-to-br from-indigo-600 to-indigo-700"
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
            {filteredSubscribers.map((subscriber) => (
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
                      subscriber.status === 'active'
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {subscriber.status === 'active' ? 'Actif' : 'Désabonné'}
                  </button>
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {format(new Date(subscriber.subscribed_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {subscriber.unsubscribed_at
                    ? format(new Date(subscriber.unsubscribed_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(subscriber.id)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${
                        isDark
                          ? 'border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30'
                          : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
          <BarChart3 className="w-5 h-5 text-primary-400" />
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
              { key: 'inscriptions', name: 'Inscriptions', color: '#22C55E' },
              { key: 'desabonnements', name: 'Désabonnements', color: '#EF4444' }
            ]}
            onExpand={() =>
              setExpandedChart({
                title: 'Tendances mensuelles',
                type: 'line',
                data: monthlySubs,
                dataKeys: [
                  { key: 'inscriptions', name: 'Inscriptions', color: '#22C55E' },
                  { key: 'desabonnements', name: 'Désabonnements', color: '#EF4444' }
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-lg p-6 max-w-md w-full mx-4 border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200 shadow-lg'
            }`}
          >
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
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
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Supprimer
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
