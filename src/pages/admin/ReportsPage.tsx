import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Search, Filter, Calendar, BarChart3, Eye, Trash2 } from 'lucide-react';
import { StatsCard } from '../../components/admin/StatsCard';
import { ChartPanel } from '../../components/admin/ChartPanel';
import { ChartModal } from '../../components/admin/ChartModal';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

interface Report {
  id: string;
  title: string;
  type: string;
  period: string;
  date: string;
  status: string;
  size: string;
  // metadata to regenerate export on the fly
  source_key?: string;
  start_date?: string | null;
  end_date?: string | null;
  user_id?: string | null;
}

const ReportsPage: React.FC = () => {
  const { theme } = useOutletContext<{ theme: 'dark' | 'light' }>() || { theme: 'dark'};
  const isDark = theme === 'dark';
  // DB-only persistence (no storage bucket)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [expandedChart, setExpandedChart] = useState<{
    title: string;
    type: 'line' | 'bar' | 'pie';
    data: any[];
    dataKeys?: { key: string; name: string; color: string }[];
  } | null>(null);
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      title: "Rapport d'Activité Mensuel",
      type: 'Activité',
      period: 'Mars 2024',
      date: '2024-03-31',
      status: 'Disponible',
      size: '2.5 MB'
    },
    {
      id: '2',
      title: 'Rapport Financier Q1',
      type: 'Finance',
      period: 'Q1 2024',
      date: '2024-03-31',
      status: 'En cours',
      size: '-'
    },
    {
      id: '3',
      title: 'Analyse des Partenariats',
      type: 'Partenariat',
      period: 'Q1 2024',
      date: '2024-03-30',
      status: 'Disponible',
      size: '1.8 MB'
    }
  ]);
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [reportData, setReportData] = useState<Record<string, any[]>>({});
  const [viewReport, setViewReport] = useState<Report | null>(null);

  // Generate Report modal state
  const [showGenerate, setShowGenerate] = useState(false);
  const [genStep, setGenStep] = useState<1 | 2 | 3>(1);
  const sources = [
    { key: 'news_posts', label: 'Actualités', dateField: 'created_at', userField: null as null | string },
    { key: 'partners', label: 'Partenaires', dateField: 'created_at', userField: null as null | string },
    { key: 'comments', label: 'Commentaires', dateField: 'created_at', userField: 'user_id' },
    { key: 'likes', label: 'Likes', dateField: 'created_at', userField: 'user_id' },
    { key: 'newsletter_subscribers', label: 'Abonnés newsletter', dateField: 'subscribed_at', userField: null as null | string },
  ] as const;
  const [selectedSource, setSelectedSource] = useState<typeof sources[number]['key']>('news_posts');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handleDownload = async (report: Report) => {
    // Generate CSV on the fly using metadata
    const rows = await ensureReportData(report);
    if (!rows || rows.length === 0) return;
    const headers = Array.from(new Set(rows.flatMap((r: any) => Object.keys(r))));
    const csv = [headers.join(',')].concat(
      rows.map((r: any) => headers.map(h => JSON.stringify(r[h] ?? '').replace(/^"|"$/g, '"')).join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  const deleteReport = async (id: string) => {
    try {
      await supabase.from('reports').delete().eq('id', id);
      toast.success('Rapport supprimé');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erreur lors de la suppression du rapport');
    } finally {
      setReports(prev => prev.filter(r => r.id !== id));
      const url = downloadUrls[id];
      if (url) URL.revokeObjectURL(url);
      setDownloadUrls(prev => { const { [id]: _, ...rest } = prev; return rest; });
      setReportData(prev => { const { [id]: _, ...rest } = prev; return rest; });
    }
  };

  const downloadExcel = async (report: Report) => handleDownload(report);

  const downloadPdf = async (report: Report) => {
    const rows = await ensureReportData(report);
    const title = `${report.title} (${report.period})`;
    const win = window.open('', '_blank');
    if (!win) return;
    const tableHtml = rows && rows.length
      ? `<table style="width:100%;border-collapse:collapse;font-family:system-ui,Segoe UI,Arial;color:#111"><thead>${Object.keys(rows[0]).slice(0,8).map(h=>`<th style='border:1px solid #ddd;padding:8px;background:#eee;text-align:left'>${h}</th>`).join('')}</thead><tbody>${rows.slice(0,200).map(r=>`<tr>${Object.keys(rows[0]).slice(0,8).map(h=>`<td style='border:1px solid #ddd;padding:8px'>${String(r[h]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`
      : '<p style="color:#444">Aperçu non disponible pour ce rapport.</p>';
    win.document.write(`<!doctype html><html><head><meta charset='utf-8'><title>${title}</title></head><body style='padding:24px;background:#fff;color:#111'><h1 style='margin-bottom:12px'>${title}</h1>${tableHtml}<script>window.onload=()=>window.print();</script></body></html>`);
    win.document.close();
  };

  const fetchPreview = async () => {
    try {
      setLoadingPreview(true);
      const src = sources.find(s => s.key === selectedSource)!;
      let query = supabase.from(selectedSource).select('*');
      if (startDate) query = query.gte(src.dateField, new Date(startDate).toISOString());
      if (endDate) query = query.lte(src.dateField, new Date(endDate).toISOString());
      if (src.userField && selectedUserId.trim()) query = query.eq(src.userField, selectedUserId.trim());
      const { data, error } = await query.limit(1000);
      if (error) throw error;
      setPreviewRows(data || []);
      setGenStep(3);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const saveReport = async () => {
    // Persist only metadata in DB; no file upload
    const rows = previewRows;
    if (!rows || rows.length === 0) return;

    const src = sources.find(s => s.key === selectedSource)!;
    const now = new Date();
    const id = `${now.getTime()}`;
    const period = startDate && endDate ? `${startDate} → ${endDate}` : (startDate || endDate || 'Période non spécifiée');
    const sizeApprox = (() => {
      const headers = Array.from(new Set(rows.flatMap((r: any) => Object.keys(r))));
      const csv = [headers.join(',')].concat(
        rows.map((r: any) => headers.map(h => JSON.stringify(r[h] ?? '').replace(/^"|"$/g, '"')).join(','))
      ).join('\n');
      return `${(new Blob([csv]).size / (1024 * 1024)).toFixed(1)} MB`;
    })();

    const newReport: Report = {
      id,
      title: `${src.label} - Export ${now.toLocaleDateString('fr-FR')}`,
      type: src.label,
      period,
      date: now.toISOString().slice(0,10),
      status: 'Disponible',
      size: sizeApprox,
      source_key: src.key,
      start_date: startDate || null,
      end_date: endDate || null,
      user_id: selectedUserId || null,
    };

    try {
      const { error: insErr } = await supabase.from('reports').insert([newReport as any]);
      if (insErr) throw insErr;
      toast.success('Rapport enregistré');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Impossible d'enregistrer le rapport en base");
    }

    // Keep in-memory preview for immediate view and download-on-the-fly
    setReports(prev => [newReport, ...prev]);
    setReportData(prev => ({ ...prev, [id]: rows }));

    setShowGenerate(false);
    setGenStep(1);
    setPreviewRows([]);
    setStartDate('');
    setEndDate('');
    setSelectedUserId('');
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = selectedPeriod === 'all' || report.period.includes(selectedPeriod) || report.date.includes(selectedPeriod);
    const matchesType = selectedType === 'all' || report.type.toLowerCase() === selectedType.toLowerCase();
    const matchesStatus = selectedStatus === 'all' || report.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesPeriod && matchesType && matchesStatus;
  });

  // Stats summary
  const total = reports.length;
  const available = reports.filter(r => r.status === 'Disponible').length;
  const pending = reports.filter(r => r.status !== 'Disponible').length;
  const thisQuarter = reports.filter(r => r.period.includes('Q1') || r.period.includes('Mars')).length;

  // Chart data
  const monthlyReports = React.useMemo(() => {
    const data: { name: string; rapports: number }[] = [];
    // Use last 6 periods from mock dates
    const months = ['Nov 2023','Dec 2023','Jan 2024','Feb 2024','Mar 2024','Apr 2024'];
    months.forEach(m => {
      const count = reports.filter(r => r.period.includes(m.split(' ')[0]) || r.date.includes('2024-03')).length;
      data.push({ name: m, rapports: count });
    });
    return data;
  }, [reports]);

  const statusDistribution = React.useMemo(() => ([
    { name: 'Disponible', value: available },
    { name: 'Autres', value: total - available }
  ]), [available, total]);

  const typeDistribution = React.useMemo(() => {
    const types = Array.from(new Set(reports.map(r => r.type)));
    return types.map(t => ({ name: t, value: reports.filter(r => r.type === t).length }));
  }, [reports]);

  const ensureReportData = async (report: Report): Promise<any[]> => {
    if (reportData[report.id]) return reportData[report.id];
    if (!report.source_key) return [];
    const src = sources.find(s => s.key === report.source_key);
    if (!src) return [];
    let query = supabase.from(report.source_key).select('*');
    if (report.start_date) query = query.gte(src.dateField, new Date(report.start_date).toISOString());
    if (report.end_date) query = query.lte(src.dateField, new Date(report.end_date).toISOString());
    if (src.userField && report.user_id) query = query.eq(src.userField, report.user_id);
    const { data, error } = await query.limit(5000);
    if (!error && data) setReportData(prev => ({ ...prev, [report.id]: data }));
    return data || [];
  };

  return (
    <div>
      <div className="mb-6 mt-[60px] flex items-center justify-between">
        <h1
          className={`text-2xl font-bold flex items-center gap-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          <FileText
            className={`w-7 h-7 ${
              isDark ? 'text-sky-400' : 'text-sky-600'
            }`}
          />
          Générateur de rapports
        </h1>
        <button
          onClick={() => setShowGenerate(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium shadow-sm"
        >
          <Calendar className="w-5 h-5 mr-2" />
          Générer un rapport
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard title="Total rapports" value={total} icon={FileText} className="bg-gradient-to-br from-sky-600 to-sky-700" iconClassName="text-white" titleClassName="text-white" />
        <StatsCard title="Disponibles" value={available} icon={Download} className="bg-gradient-to-br from-emerald-600 to-emerald-700" iconClassName="text-white" titleClassName="text-white" />
        <StatsCard title="En préparation" value={pending} icon={Filter} className="bg-gradient-to-br from-amber-600 to-amber-700" iconClassName="text-white" titleClassName="text-white" />
        <StatsCard title="Ce trimestre" value={thisQuarter} icon={Calendar} className="bg-gradient-to-br from-indigo-600 to-indigo-700" iconClassName="text-white" titleClassName="text-white" />
      </div>
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-gray-400' : 'text-gray-400'
            }`}
          />
          <input
            type="text"
            placeholder="Rechercher un rapport..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg border focus:ring-primary-500 focus:border-primary-500 ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900 shadow-sm'
            }`}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className={`text-sm rounded-lg px-3 py-1.5 border focus:ring-primary-500 focus:border-primary-500 ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">Toutes les périodes</option>
            <option value="2024">2024</option>
            <option value="Q1">Q1 2024</option>
            <option value="Mars">Mars 2024</option>
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={`text-sm rounded-lg px-3 py-1.5 border focus:ring-primary-500 focus:border-primary-500 ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">Tous les types</option>
            <option value="Activité">Activité</option>
            <option value="Finance">Finance</option>
            <option value="Partenariat">Partenariat</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`text-sm rounded-lg px-3 py-1.5 border focus:ring-primary-500 focus:border-primary-500 ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">Tous les statuts</option>
            <option value="Disponible">Disponible</option>
            <option value="En cours">En cours</option>
          </select>
        </div>
      </div>
      <div
        className={`rounded-lg overflow-hidden border ${
          isDark ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <table className="w-full">
          <thead className={isDark ? 'bg-gray-800' : 'bg-gray-100'}>
            <tr>
              <th
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Titre
              </th>
              <th
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Type
              </th>
              <th
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Période
              </th>
              <th
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Date
              </th>
              <th
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Statut
              </th>
              <th
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Taille
              </th>
              <th
                className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-gray-800' : 'divide-y divide-gray-100'}>
            {filteredReports.map((report) => (
              <tr
                key={report.id}
                className={isDark ? 'hover:bg-gray-800/60 transition' : 'hover:bg-gray-50 transition'}
              >
                <td
                  className={`px-4 py-3 text-sm ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500 mr-2" />
                    <div
                      className={`text-sm font-medium ${
                        isDark ? 'text-gray-200' : 'text-gray-900'
                      }`}
                    >
                      {report.title}
                    </div>
                  </div>
                </td>
                <td
                  className={`px-4 py-3 text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {report.type}
                </td>
                <td
                  className={`px-4 py-3 text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {report.period}
                </td>
                <td
                  className={`px-4 py-3 text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {new Date(report.date).toLocaleDateString('fr-FR')}
                </td>
                <td
                  className={`px-4 py-3 text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      report.status === 'Disponible'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {report.status}
                  </span>
                </td>
                <td
                  className={`px-4 py-3 text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {report.size}
                </td>
                <td
                  className={`px-4 py-3 text-right text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={async () => {
                        setViewReport(report);
                        await ensureReportData(report);
                      }}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-medium transition ${
                        isDark
                          ? 'border-green-700 bg-green-900/20 text-green-400 hover:bg-green-900/30'
                          : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                      title="Visualiser"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {report.status === 'Disponible' && (
                      <>
                        <button
                          onClick={() => downloadExcel(report)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-medium transition ${
                            isDark
                              ? 'border-blue-700 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30'
                              : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                          title="Télécharger Excel"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadPdf(report)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-medium transition ${
                            isDark
                              ? 'border-rose-700 bg-rose-900/20 text-rose-400 hover:bg-rose-900/30'
                              : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                          title="Télécharger PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setReportToDelete(report)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-medium transition ${
                        isDark
                          ? 'border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30'
                          : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
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
            Analyse des rapports
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ChartPanel
            title="Rapports par période"
            type="line"
            data={monthlyReports}
            dataKeys={[{ key: 'rapports', name: 'Rapports', color: '#60A5FA' }]}
            onExpand={() =>
              setExpandedChart({
                title: 'Rapports par période',
                type: 'line',
                data: monthlyReports,
                dataKeys: [{ key: 'rapports', name: 'Rapports', color: '#60A5FA' }]
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
          <ChartPanel
            title="Répartition par type"
            type="pie"
            data={typeDistribution}
            onExpand={() =>
              setExpandedChart({
                title: 'Répartition par type',
                type: 'pie',
                data: typeDistribution
              })
            }
            theme={theme}
          />
        </div>
      </div>

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

      {/* Delete confirmation modal */}
      {reportToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-lg w-full max-w-md border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <h2
                className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Confirmer la suppression
              </h2>
              <button
                onClick={() => setReportToDelete(null)}
                className={
                  isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                Voulez-vous vraiment supprimer le rapport «
                <span className="font-semibold">{reportToDelete.title}</span> » ?
              </p>
              <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-500 text-sm'}>
                Cette action est irréversible.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReportToDelete(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteReport(reportToDelete.id);
                    setReportToDelete(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white shadow-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* View Report Modal (data generated on the fly) */}
      {viewReport && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-lg w-full max-w-5xl border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200 shadow-lg'
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div>
                <h2
                  className={`text-xl font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  <FileText className="w-5 h-5 text-primary-400" />
                  {viewReport.title}
                </h2>
                <div
                  className={`text-sm mt-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  <span className="mr-3">Type: {viewReport.type}</span>
                  <span className="mr-3">Période: {viewReport.period}</span>
                  <span className="mr-3">Date: {viewReport.date}</span>
                  <span>Taille: {viewReport.size}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {downloadUrls[viewReport.id] && (
                  <button
                    onClick={() => downloadExcel(viewReport)}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-blue-700 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 transition"
                  >
                    <Download className="w-4 h-4 mr-2" /> Excel
                  </button>
                )}
                {reportData[viewReport.id] && (
                  <button
                    onClick={() => downloadPdf(viewReport)}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-rose-700 bg-rose-900/20 text-rose-400 hover:bg-rose-900/30 transition"
                  >
                    <FileText className="w-4 h-4 mr-2" /> PDF
                  </button>
                )}
                <button
                  onClick={() => setViewReport(null)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  Fermer
                </button>
              </div>
            </div>
            <div className="p-6">
              {reportData[viewReport.id] ? (
                <div
                  className={`overflow-auto max-h-[60vh] border rounded-lg ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}
                >
                  <table className="min-w-full text-sm">
                    <thead className={`sticky top-0 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <tr>
                        {reportData[viewReport.id][0] && Object.keys(reportData[viewReport.id][0]).slice(0,12).map((k) => (
                          <th
                            key={k}
                            className={`px-3 py-2 text-left ${
                              isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                          >
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
                      {reportData[viewReport.id].slice(0,300).map((row, idx) => (
                        <tr
                          key={idx}
                          className={isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
                        >
                          {Object.keys(reportData[viewReport.id][0] || {}).slice(0,12).map((k) => (
                            <td
                              key={k}
                              className={`px-3 py-2 ${
                                isDark ? 'text-gray-200' : 'text-gray-800'
                              }`}
                            >
                              {String(row[k])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  Aperçu non disponible pour ce rapport.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-lg w-full max-w-3xl border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200 shadow-lg'
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <h2
                className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Générer un rapport
              </h2>
              <button
                onClick={() => setShowGenerate(false)}
                className={
                  isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              {genStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label
                      className={`block text-sm mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Source
                    </label>
                    <select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value as any)}
                      className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {sources.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  {sources.find(s => s.key === selectedSource)?.userField && (
                    <div>
                      <label
                        className={`block text-sm mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        Filtrer par utilisateur (ID)
                      </label>
                      <input
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        placeholder="Ex: uuid utilisateur"
                        className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setGenStep(2)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
              {genStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        Date de début
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        Date de fin
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setGenStep(1)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      Retour
                    </button>
                    <button
                      onClick={fetchPreview}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                      disabled={loadingPreview}
                    >
                      {loadingPreview ? 'Chargement...' : 'Prévisualiser'}
                    </button>
                  </div>
                </div>
              )}
              {genStep === 3 && (
                <div className="space-y-4">
                  <div
                    className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    {previewRows.length} lignes trouvées
                  </div>
                  <div
                    className={`overflow-auto max-h-64 border rounded-lg ${
                      isDark ? 'border-gray-700' : 'border-gray-200'
                    }`}
                  >
                    <table className="min-w-full text-sm">
                      <thead className={`sticky top-0 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <tr>
                          {previewRows[0] && Object.keys(previewRows[0]).slice(0,8).map((k) => (
                            <th
                              key={k}
                              className={`px-3 py-2 text-left ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}
                            >
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
                        {previewRows.slice(0,10).map((row, idx) => (
                          <tr
                            key={idx}
                            className={isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
                          >
                            {Object.keys(previewRows[0] || {}).slice(0,8).map((k) => (
                              <td
                                key={k}
                                className={`px-3 py-2 ${
                                  isDark ? 'text-gray-200' : 'text-gray-800'
                                }`}
                              >
                                {String(row[k])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setGenStep(2)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      Retour
                    </button>
                    <button
                      onClick={saveReport}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
                    >
                      Enregistrer et ajouter à la liste
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;