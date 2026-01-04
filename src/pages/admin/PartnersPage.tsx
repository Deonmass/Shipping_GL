import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Eye, Edit, Trash2, Plus, X, AlertCircle, Search,
  Building2, CheckCircle, Clock, TrendingUp, ToggleLeft, ToggleRight, BarChart3,
  Download, Upload, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StatsCard } from '../../components/admin/StatsCard';
import { FilterBar } from '../../components/admin/FilterBar';
import { ContextMenu, ContextMenuItem } from '../../components/admin/ContextMenu';
import { ChartPanel } from '../../components/admin/ChartPanel';
import { ChartModal } from '../../components/admin/ChartModal';
import { useAuth } from '../../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {UseGetPartners} from "../../services";

interface Partner {
  id?: string;
  title: string;
  description?: string;
  logo_url?: string;
  category_id?: string;
  category_name?: string;
  website?: string;
  phone?: string;
  email?: string;
  status: string;
  created_at?: string;
}

interface PartnerCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface PartnerFormData {
  company_name: string;
  description: string;
  logo_url: string;
  category_id: string;
  website: string;
  phone: string;
  email: string;
  status: string;
}

interface PartnerStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  newThisMonth: number;
}

interface PartnerImportRow {
  id: number;
  values: {
    title: string;
    category_name: string;
    email: string;
    phone: string;
    website: string;
    status: string;
    is_active: string; // "TRUE" / "FALSE" ou vide
    description: string;
    logo_url: string;
  };
  errors: string[];
}

const isActive = (u: any) =>
    u?.status?.toString() === "1"

const PartnersPage: React.FC = () => {
  const { theme } = useOutletContext<{ theme: 'dark' | 'light' }>();
  const isDark = theme === 'dark';
  const [categories, setCategories] = useState<PartnerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showActivateConfirm, setShowActivateConfirm] = useState<{ partner: Partner; action: 'activate' | 'deactivate' } | null>(null);
  const [expandedChart, setExpandedChart] = useState<{ title: string; type: 'line' | 'pie'; data: any[]; dataKeys?: any[] } | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [stats, setStats] = useState<PartnerStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    newThisMonth: 0
  });
  const [displayStats, setDisplayStats] = useState<PartnerStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    newThisMonth: 0,
  });
  const [formData, setFormData] = useState<PartnerFormData>({
    company_name: '',
    description: '',
    logo_url: '',
    category_id: '',
    website: '',
    phone: '',
    email: '',
    status: 'pending'
  });
  const [showStatusConfirm, setShowStatusConfirm] = useState<{ partner: Partner; targetStatus: 'approved' } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<PartnerImportRow[]>([]);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importInserting, setImportInserting] = useState(false);


  const {isPending: isGettingPartners, data: partners, refetch: reGetPartners} = UseGetPartners()


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
        approved: jitter(prev.approved || 0, 8, 0, 99999),
        pending: jitter(prev.pending || 0, 5, 0, 99999),
        rejected: jitter(prev.rejected || 0, 3, 0, 99999),
        newThisMonth: jitter(prev.newThisMonth || 0, 5, 0, 99999),
      }));
    }, 900);

    return () => clearInterval(interval);
  }, [loading, stats]);

  const effectiveStats = loading ? displayStats : stats;


  const calculateStats = (partnerList: Partner[]) => {
    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);

    const stats: PartnerStats = {
      total: partnerList.length,
      approved: partnerList.filter(p => p.status === 'approved').length,
      pending: partnerList.filter(p => p.status === 'pending').length,
      rejected: partnerList.filter(p => p.status === 'rejected').length,
      newThisMonth: partnerList.filter(p => {
        const createdAt = parseISO(p.created_at);
        return createdAt >= oneMonthAgo;
      }).length
    };

    setStats(stats);
  };

  const handleView = (partner: Partner) => {
    setSelectedPartner(partner);
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      title: partner.title,
      description: partner.description || '',
      logo_url: partner.logo_url || '',
      category_id: partner.category_id || '',
      website: partner.website || '',
      phone: partner.phone || '',
      email: partner.email || '',
      status: partner.status
    });
    setShowFormModal(true);
  };

  const handleAdd = () => {
    setEditingPartner(null);
    setFormData({
      company_name: '',
      description: '',
      logo_url: '',
      category_id: '',
      website: '',
      phone: '',
      email: '',
      status: 'pending'
    });
    setShowFormModal(true);
  };

  const handleFormChange = (field: keyof PartnerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_name.trim()) {
      toast.error('Le nom de l\'entreprise est requis');
      return;
    }

    try {
      if (editingPartner) {
        const { error } = await supabase
          .from('partners')
          .update({
            company_name: formData.company_name,
            description: formData.description,
            logo_url: formData.logo_url,
            category_id: formData.category_id || null,
            website: formData.website,
            phone: formData.phone,
            email: formData.email,
            status: formData.status
          })
          .eq('id', editingPartner.id);

        if (error) throw error;
        toast.success('Partenaire modifié avec succès');
      } else {
        const { error } = await supabase
          .from('partners')
          .insert([{
            company_name: formData.company_name,
            description: formData.description,
            logo_url: formData.logo_url,
            category_id: formData.category_id || null,
            website: formData.website,
            phone: formData.phone,
            email: formData.email,
            status: formData.status
          }]);

        if (error) throw error;
        toast.success('Partenaire ajouté avec succès');
      }

      setShowFormModal(false);
      setEditingPartner(null);
      fetchPartners();
    } catch (error: any) {
      console.error('Error saving partner:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Partenaire supprimé avec succès');
      fetchPartners();
    } catch (error: any) {
      console.error('Error deleting partner:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
    setShowDeleteConfirm(null);
  };

  const handleToggleActive = async (partner: Partner, activate: boolean) => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({ is_active: activate })
        .eq('id', partner.id);

      if (error) throw error;

      toast.success(activate ? 'Partenaire activé avec succès' : 'Partenaire désactivé avec succès');
      fetchPartners();
    } catch (error: any) {
      console.error('Error toggling partner active status:', error);
      toast.error(error.message || 'Erreur lors du changement de statut');
    }
    setShowActivateConfirm(null);
  };

  const handleChangeStatus = async (partner: Partner, newStatus: 'approved') => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({ status: newStatus })
        .eq('id', partner.id);

      if (error) throw error;

      toast.success('Statut du partenaire mis à jour');
      fetchPartners();
    } catch (error: any) {
      console.error('Error changing partner status:', error);
      toast.error(error.message || 'Erreur lors du changement de statut');
    }
    setShowStatusConfirm(null);
  };


  const filteredPartners = partners?.responseData?.data?.items.filter((partner: any) => {
    const matchesSearch = partner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner?.category_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      partner?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner?.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || partner.status === statusFilter;
    const matchesCategory = !categoryFilter || partner.category_id === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const groupedPartners = () => {
    if (!groupBy) return { '': filteredPartners };

    return filteredPartners.reduce((acc, partner) => {
      let key = '';

      if (groupBy === 'status') {
        key = partner?.status?.toString() === '1' ? 'Approuvés' :
              partner?.status?.toString() === '0' ? 'En attente' : 'Rejetés';
      } else if (groupBy === 'category') {
        key = partner?.category_name || 'Sans catégorie';
      } else if (groupBy === 'month') {
        key = format(parseISO(partner.created_at), 'MMMM yyyy', { locale: fr });
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(partner);
      return acc;
    }, {} as Record<string, Partner[]>);
  };

  const generateChartData = () => {
    const now = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const currentMonth = subMonths(now, i);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const monthlyPartners = partners.filter(partner => {
        const createdAt = parseISO(partner.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });

      monthlyData.push({
        name: format(currentMonth, 'MMM', { locale: fr }),
        total: monthlyPartners.length,
        approuvés: monthlyPartners.filter(p => p.status === 'approved').length
      });
    }

    return monthlyData;
  };

  const getStatusDistribution = () => [
    { name: 'Approuvés', value: stats.approved },
    { name: 'En attente', value: stats.pending },
    { name: 'Rejetés', value: stats.rejected }
  ];

  const getCategoryDistribution = () => {
    const distribution: Record<string, number> = {};
    partners.forEach(partner => {
      const categoryName = partner?.category_name || 'Sans catégorie';
      distribution[categoryName] = (distribution[categoryName] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  const activeFiltersCount = [statusFilter, categoryFilter, groupBy].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter('');
    setCategoryFilter('');
    setGroupBy('');
  };

  const handleDownloadTemplate = () => {
    try {
      const headers = [
        'title',
        'category_name',
        'email',
        'phone',
        'website',
        'status',
        'is_active',
        'description',
        'logo_url'
      ];

      const exampleRow = [
        'Exemple SA',
        'Transport Routier',
        'contact@exemple.com',
        '+243 000 000 000',
        'https://www.exemple.com',
        'pending',
        'TRUE',
        'Partenaire logistique de référence.',
        'https://www.exemple.com/logo.png'
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'modele_partenaire');

      XLSX.writeFile(wb, 'modele_import_partenaires.xlsx');
      toast.success('Modèle Excel téléchargé');
    } catch (e) {
      console.error('Error generating Excel template:', e);
      toast.error('Impossible de générer le modèle Excel');
    }
  };

  const validateImportRow = (values: PartnerImportRow['values']): string[] => {
    const errors: string[] = [];

    if (!values.title || !values.title.trim()) {
      errors.push('Le nom de l\'entreprise est requis');
    }

    if (values.status && !['pending', 'approved', 'rejected'].includes(values.status.trim())) {
      errors.push('Statut invalide (utiliser pending / approved / rejected)');
    }

    if (values.is_active && !['TRUE', 'FALSE'].includes(values.is_active.trim().toUpperCase())) {
      errors.push('is_active doit être TRUE ou FALSE');
    }

    if (values.category_name) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === values.category_name.trim().toLowerCase()
      );
      if (!match) {
        errors.push(`Catégorie inconnue: "${values.category_name}"`);
      }
    }

    return errors;
  };

  const parseImportFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (rows.length < 2) {
        toast.error('Le fichier est vide ou ne contient pas de données');
        return;
      }

      const headerRow = rows[0].map((h) => String(h || '').trim());
      const requiredHeader = 'company_name';
      if (!headerRow.includes(requiredHeader)) {
        toast.error('La colonne "company_name" est requise dans le modèle');
        return;
      }

      const idx = (name: string) => headerRow.indexOf(name);

      const newRows: PartnerImportRow[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const values: PartnerImportRow['values'] = {
          company_name: String(row[idx('company_name')] ?? '').trim(),
          category_name: idx('category_name') >= 0 ? String(row[idx('category_name')] ?? '').trim() : '',
          email: idx('email') >= 0 ? String(row[idx('email')] ?? '').trim() : '',
          phone: idx('phone') >= 0 ? String(row[idx('phone')] ?? '').trim() : '',
          website: idx('website') >= 0 ? String(row[idx('website')] ?? '').trim() : '',
          status: idx('status') >= 0 ? String(row[idx('status')] ?? '').trim() : 'pending',
          is_active: idx('is_active') >= 0 ? String(row[idx('is_active')] ?? '').trim().toUpperCase() : 'TRUE',
          description: idx('description') >= 0 ? String(row[idx('description')] ?? '').trim() : '',
          logo_url: idx('logo_url') >= 0 ? String(row[idx('logo_url')] ?? '').trim() : ''
        };

        // Ignorer les lignes complètement vides
        const isEmptyRow = Object.values(values).every((v) => !v || !String(v).trim());
        if (isEmptyRow) continue;

        const errors = validateImportRow(values);
        newRows.push({
          id: i,
          values,
          errors
        });
      }

      if (!newRows.length) {
        toast.error('Aucune ligne valide trouvée dans le fichier');
        return;
      }

      setImportRows(newRows);
      setImportProgress(0);
      setImportInserting(false);
      toast.success(`${newRows.length} ligne(s) chargée(s) depuis le fichier`);
    } catch (e) {
      console.error('Error parsing import file:', e);
      toast.error('Erreur lors de la lecture du fichier Excel');
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    await parseImportFile(file);
  };

  const handleImportCellChange = (rowId: number, field: keyof PartnerImportRow['values'], value: string) => {
    setImportRows((prev) => {
      return prev.map((row) => {
        if (row.id !== rowId) return row;
        const newValues = { ...row.values, [field]: value };
        const errors = validateImportRow(newValues);
        return { ...row, values: newValues, errors };
      });
    });
  };

  const handleStartImport = async () => {
    if (!importRows.length) {
      toast.error('Aucune ligne à importer');
      return;
    }

    setImportInserting(true);
    setImportProgress(0);

    const total = importRows.length;
    let successCount = 0;
    let errorCount = 0;
    const remaining: PartnerImportRow[] = [];

    for (let index = 0; index < importRows.length; index++) {
      const row = importRows[index];

      if (row.errors.length) {
        // On ne tente pas l'insertion de lignes invalides
        remaining.push(row);
        errorCount++;
        setImportProgress(Math.round(((index + 1) / total) * 100));
        continue;
      }

      const { values } = row;

      try {
        const category = values.category_name
          ? categories.find(
              (c) => c.name.toLowerCase() === values.category_name.trim().toLowerCase()
            )
          : null;

        const isActiveBool = values.is_active.trim().toUpperCase() !== 'FALSE';

        const { error } = await supabase
          .from('partners')
          .insert([
            {
              company_name: values.company_name,
              description: values.description,
              logo_url: values.logo_url,
              category_id: category ? category.id : null,
              website: values.website,
              phone: values.phone,
              email: values.email,
              status: values.status || 'pending',
              is_active: isActiveBool
            }
          ]);

        if (error) {
          console.error('Error inserting partner from import:', error);
          remaining.push({
            ...row,
            errors: [...row.errors, error.message || 'Erreur lors de l\'insertion']
          });
          errorCount++;
        } else {
          successCount++;
        }
      } catch (e: any) {
        console.error('Unexpected error inserting partner from import:', e);
        remaining.push({
          ...row,
          errors: [...row.errors, e?.message || 'Erreur inattendue lors de l\'insertion']
        });
        errorCount++;
      }

      setImportProgress(Math.round(((index + 1) / total) * 100));
    }

    setImportRows(remaining);
    setImportInserting(false);

    if (successCount > 0) {
      toast.success(`${successCount} ligne(s) insérée(s) avec succès`);
      fetchPartners();
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} ligne(s) en erreur. Corrigez-les et relancez l'import.`);
    }
  };

  if (isGettingPartners) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const grouped = groupedPartners();

  return (
    <div>

      <div className="flex items-center justify-between mb-6 mt-[60px]">
        <h1
          className={`text-2xl font-bold flex items-center gap-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          <Building2
            className={`w-7 h-7 ${
              isDark ? 'text-sky-400' : 'text-sky-600'
            }`}
          />
          Gestion des partenaires
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPartners}
            className={`px-3 py-2 rounded-lg flex items-center text-xs font-medium border shadow-sm ${
              isDark
                ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-slate-50'
            }`}
            title="Rafraîchir la liste des partenaires"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Rafraîchir
          </button>
          <button
            onClick={handleDownloadTemplate}
            className={`px-3 py-2 rounded-lg flex items-center text-xs font-medium border shadow-sm ${
              isDark
                ? 'border-sky-500 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 hover:border-sky-300'
                : 'border-sky-500 bg-sky-500/5 text-sky-700 hover:bg-sky-500/15 hover:border-sky-500'
            }`}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Modèle Excel
          </button>
          <button
            onClick={() => {
              setShowImportModal(true);
              setImportRows([]);
              setImportFileName(null);
              setImportProgress(0);
              setImportInserting(false);
            }}
            className={`px-3 py-2 rounded-lg flex items-center text-xs font-medium border shadow-sm ${
              isDark
                ? 'border-primary-500 bg-primary-900/30 text-primary-200 hover:bg-primary-900/50'
                : 'border-primary-500 bg-primary-50 text-primary-700 hover:bg-primary-100'
            }`}
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Importer Excel
          </button>
          <button
            onClick={handleAdd}
            className={`px-4 py-2 rounded-xl flex items-center text-sm font-medium border transition-colors shadow-sm ${
              isDark
                ? 'border-emerald-400 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-300'
                : 'border-emerald-500 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/15 hover:border-emerald-500'
            }`}
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter un partenaire
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total partenaires"
          value={effectiveStats.total}
          icon={Building2}
          trend={{ value: effectiveStats.newThisMonth, label: ' ce mois' }}
          className="bg-gradient-to-br from-sky-600 to-sky-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Approuvés"
          value={effectiveStats.approved}
          icon={CheckCircle}
          trend={{ value: Math.round((effectiveStats.approved / Math.max(effectiveStats.total, 1)) * 100) || 0, label: '%' }}
          className="bg-gradient-to-br from-emerald-600 to-emerald-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="En attente"
          value={effectiveStats.pending}
          icon={Clock}
          className="bg-gradient-to-br from-amber-600 to-amber-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Nouveaux ce mois"
          value={effectiveStats.newThisMonth}
          icon={TrendingUp}
          className="bg-gradient-to-br from-indigo-600 to-indigo-700"
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
              { label: 'Approuvés', value: 'approved' },
              { label: 'En attente', value: 'pending' },
              { label: 'Rejetés', value: 'rejected' }
            ],
            onChange: setStatusFilter
          },
          {
            label: 'Filtrer par catégorie',
            value: categoryFilter,
            options: categories.map(cat => ({
              label: cat.name,
              value: cat.id
            })),
            onChange: setCategoryFilter
          }
        ]}
        groupBy={{
          label: 'Regrouper par',
          value: groupBy,
          options: [
            { label: 'Statut', value: 'status' },
            { label: 'Catégorie', value: 'category' },
            { label: 'Mois', value: 'month' }
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
                      Partenaire
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      Catégorie
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      Contact
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
                  {groupPartners.map((partner) => (
                    <tr
                      key={partner.id}
                      className={isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {partner.logo_url ? (
                            <img
                              src={partner.logo_url}
                              alt={partner.company_name}
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
                            {partner.company_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {partner.partner_categories?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {partner.email && <div className="truncate max-w-[150px]">{partner.email}</div>}
                          {partner.phone && (
                            <div
                              className={`text-xs ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}
                            >
                              {partner.phone}
                            </div>
                          )}
                          {!partner.email && !partner.phone && '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                              partner.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : partner.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                            title={
                              partner.status === 'pending'
                                ? 'Double-cliquez pour approuver ce partenaire'
                                : undefined
                            }
                            onDoubleClick={() => {
                              if (partner.status === 'pending') {
                                setShowStatusConfirm({ partner, targetStatus: 'approved' });
                              }
                            }}
                          >
                            {partner.status === 'approved'
                              ? 'Approuvé'
                              : partner.status === 'pending'
                              ? 'En attente'
                              : 'Rejeté'}
                          </span>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                              partner.is_active
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                            title="Double-cliquez pour changer l'état actif/inactif"
                            onDoubleClick={() =>
                              setShowActivateConfirm({
                                partner,
                                action: partner.is_active ? 'deactivate' : 'activate'
                              })
                            }
                          >
                            {partner.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        {format(parseISO(partner.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle en premier */}
                          <button
                            onClick={() => setShowActivateConfirm({ partner, action: partner.is_active ? 'deactivate' : 'activate' })}
                            className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                              partner.is_active
                                ? 'bg-red-600'
                                : isDark
                                  ? 'bg-gray-600'
                                  : 'bg-gray-300'
                            }`}
                            title={partner.is_active ? 'Désactiver' : 'Activer'}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                partner.is_active ? 'translate-x-4' : 'translate-x-1'
                              }`}
                            />
                          </button>

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
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Modifier */}
                          <button
                            onClick={() => handleEdit(partner)}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition border ${
                              isDark
                                ? 'border-yellow-700 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30'
                                : 'border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                            }`}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Supprimer */}
                          <button
                            onClick={() => setShowDeleteConfirm(partner.id)}
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
          ))}
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            <h2
              className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              Analyse des partenaires
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ChartPanel
            title="Évolution Mensuelle"
            type="line"
            data={generateChartData()}
            dataKeys={[
              { key: 'total', name: 'Total', color: '#EF4444' },
              { key: 'approuvés', name: 'Approuvés', color: '#10B981' }
            ]}
            onExpand={() => setExpandedChart({
              title: 'Évolution Mensuelle des Partenaires',
              type: 'line',
              data: generateChartData(),
              dataKeys: [
                { key: 'total', name: 'Total', color: '#EF4444' },
                { key: 'approuvés', name: 'Approuvés', color: '#10B981' }
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

          <ChartPanel
            title="Répartition par Catégorie"
            type="pie"
            data={getCategoryDistribution()}
            onExpand={() => setExpandedChart({
              title: 'Répartition par Catégorie',
              type: 'pie',
              data: getCategoryDistribution()
            })}
            theme={theme}
          />
          </div>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto border ${
              isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200 shadow-lg'
            }`}
          >
            <div
              className={`px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10 ${
                isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-slate-50'
              }`}
            >
              <div>
                <h2
                  className={`text-lg font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Importer des partenaires depuis Excel
                </h2>
                <p
                  className={`text-xs mt-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Sélectionnez le modèle Excel téléchargé, corrigez les éventuelles erreurs puis lancez l&apos;import. En cas d&apos;échec, seules les lignes non insérées resteront affichées.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className={
                  isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium cursor-pointer border ${
                      isDark
                        ? 'border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700'
                        : 'border-gray-300 bg-white text-gray-800 hover:bg-slate-50'
                    }`}
                  >
                    <Upload className="w-4 h-4 mr-1.5" />
                    Choisir un fichier Excel
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleImportFileChange}
                      className="hidden"
                    />
                  </label>
                  {importFileName && (
                    <span
                      className={`text-xs ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Fichier sélectionné : <span className="font-medium">{importFileName}</span>
                    </span>
                  )}
                </div>

                {importInserting && (
                  <span
                    className={`text-xs flex items-center gap-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    <span className="inline-flex h-3 w-3 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                    Import en cours...
                  </span>
                )}
              </div>

              {importRows.length > 0 && (
                <>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <p
                        className={`text-xs ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        {importRows.length} ligne(s) chargée(s). Les lignes avec erreurs sont surlignées en rouge.
                      </p>
                      {importProgress > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-40 h-2 bg-gray-700/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 transition-all"
                              style={{ width: `${importProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{importProgress}%</span>
                        </div>
                      )}
                    </div>

                    <div className="overflow-x-auto border rounded-lg max-h-[45vh]">
                      <table className="min-w-full text-xs">
                        <thead className={isDark ? 'bg-gray-800' : 'bg-gray-100'}>
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">#</th>
                            <th className="px-3 py-2 text-left font-semibold">company_name *</th>
                            <th className="px-3 py-2 text-left font-semibold">category_name</th>
                            <th className="px-3 py-2 text-left font-semibold">email</th>
                            <th className="px-3 py-2 text-left font-semibold">phone</th>
                            <th className="px-3 py-2 text-left font-semibold">website</th>
                            <th className="px-3 py-2 text-left font-semibold">status</th>
                            <th className="px-3 py-2 text-left font-semibold">is_active</th>
                            <th className="px-3 py-2 text-left font-semibold">description</th>
                            <th className="px-3 py-2 text-left font-semibold">logo_url</th>
                            <th className="px-3 py-2 text-left font-semibold">Erreurs</th>
                          </tr>
                        </thead>
                        <tbody className={isDark ? 'divide-y divide-gray-800' : 'divide-y divide-gray-100'}>
                          {importRows.map((row, idx) => (
                            <tr
                              key={row.id}
                              className={row.errors.length ? (isDark ? 'bg-red-900/20' : 'bg-red-50') : ''}
                            >
                              <td className="px-3 py-1 align-top text-gray-400">{idx + 1}</td>
                              {(['company_name', 'category_name', 'email', 'phone', 'website', 'status', 'is_active', 'description', 'logo_url'] as (keyof PartnerImportRow['values'])[]).map((field) => (
                                <td key={field} className="px-3 py-1 align-top min-w-[120px]">
                                  <input
                                    type="text"
                                    value={row.values[field] ?? ''}
                                    onChange={(e) => handleImportCellChange(row.id, field, e.target.value)}
                                    className={`w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                                      isDark
                                        ? 'bg-gray-900 border-gray-700 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                  />
                                </td>
                              ))}
                              <td className="px-3 py-1 align-top min-w-[180px]">
                                {row.errors.length ? (
                                  <ul className="text-[11px] text-red-400 list-disc pl-4 space-y-0.5">
                                    {row.errors.map((err, i) => (
                                      <li key={i}>{err}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-[11px] text-emerald-400">OK</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium ${
                        isDark
                          ? 'bg-gray-800 text-gray-100 hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Fermer
                    </button>
                    <button
                      type="button"
                      onClick={handleStartImport}
                      disabled={importInserting}
                      className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                        importInserting
                          ? 'bg-primary-500/70 text-white cursor-not-allowed'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      {importInserting && (
                        <span className="inline-flex h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      )}
                      Lancer l&apos;import
                    </button>
                  </div>
                </>
              )}

              {importRows.length === 0 && (
                <p
                  className={`text-xs mt-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Aucun contenu chargé pour le moment. Sélectionnez un fichier Excel généré à partir du modèle pour commencer.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
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
                Détails du Partenaire
              </h2>
              <button
                onClick={() => setSelectedPartner(null)}
                className={
                  isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {selectedPartner.logo_url && (
              <div className="mb-6">
                <img
                  src={selectedPartner.logo_url}
                  alt={selectedPartner.company_name}
                  className="w-32 h-32 object-contain rounded-lg p-2 bg-white"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nom de l'entreprise
                </label>
                <p className="text-white">{selectedPartner.company_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Catégorie
                </label>
                <p className="text-white">{selectedPartner.partner_categories?.name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Email
                </label>
                <p className="text-white">{selectedPartner.email || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Téléphone
                </label>
                <p className="text-white">{selectedPartner.phone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Site web
                </label>
                <p className="text-white">{selectedPartner.website || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Statut
                </label>
                <p className="text-white">
                  {selectedPartner.status === 'approved' ? 'Approuvé' : selectedPartner.status === 'pending' ? 'En attente' : 'Rejeté'}
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
                onClick={() => handleEdit(selectedPartner)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center text-sm font-medium"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </button>
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
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
                {editingPartner ? 'Modifier le partenaire' : 'Ajouter un partenaire'}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className={
                  isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }
              >
                <X className="w-6 h-6" />
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
                    Nom de l'entreprise <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => handleFormChange('company_name', e.target.value)}
                    className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                    }`}
                    placeholder="Nom de l'entreprise"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Catégorie
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleFormChange('category_id', e.target.value)}
                    className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                    }`}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
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
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvé</option>
                    <option value="rejected">Rejeté</option>
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                    }`}
                    placeholder="contact@entreprise.com"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                    }`}
                    placeholder="+243 XXX XXX XXX"
                  />
                </div>

                <div className="col-span-2">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Site web
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleFormChange('website', e.target.value)}
                    className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                    }`}
                    placeholder="https://www.exemple.com"
                  />
                </div>

                <div className="col-span-2">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    URL du logo
                  </label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => handleFormChange('logo_url', e.target.value)}
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
                  onClick={() => setShowFormModal(false)}
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
                  {editingPartner ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showStatusConfirm && (
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
              <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
              <h3
                className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Approuver ce partenaire
              </h3>
            </div>
            <p
              className={`mb-6 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Voulez-vous vraiment passer le statut du partenaire
              {showStatusConfirm.partner && (
                <span className="font-semibold"> {showStatusConfirm.partner.company_name} </span>
              )}
              de "En attente" à "Approuvé" ?
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
                onClick={() => showStatusConfirm && handleChangeStatus(showStatusConfirm.partner, showStatusConfirm.targetStatus)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Approuver
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showActivateConfirm && (
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
              {showActivateConfirm.action === 'activate' ? (
                <ToggleRight className="w-6 h-6 text-green-500 mr-2" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-yellow-500 mr-2" />
              )}
              <h3
                className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {showActivateConfirm.action === 'activate' ? 'Activer' : 'Désactiver'} le partenaire
              </h3>
            </div>
            <p
              className={`mb-6 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              {showActivateConfirm.action === 'activate'
                ? 'Êtes-vous sûr de vouloir activer ce partenaire ? Il sera visible sur le site client.'
                : 'Êtes-vous sûr de vouloir désactiver ce partenaire ? Il sera masqué du site client mais les données seront conservées.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowActivateConfirm(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={() => handleToggleActive(showActivateConfirm.partner, showActivateConfirm.action === 'activate')}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                  showActivateConfirm.action === 'activate'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                Confirmer
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
              Êtes-vous sûr de vouloir supprimer ce partenaire ? Cette action est irréversible.
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

export default PartnersPage;
