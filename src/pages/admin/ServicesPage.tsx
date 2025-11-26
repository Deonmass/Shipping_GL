import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { StatsCard } from '../../components/admin/StatsCard';
import { FilterBar } from '../../components/admin/FilterBar';
import {
  Wrench,
  FileText,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ServiceRow {
  id: number;
  service_name: string;
  service_code: string;
  service_description: string | null;
  email_reception?: string | null;
  created_at?: string;
}

interface ServiceStats {
  total: number;
  customs: number;
  transport: number;
  logistics: number;
}

interface ServiceFormData {
  service_name: string;
  service_code: string;
  service_description: string;
  email_reception: string;
}

interface ServicePermissions {
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_view: boolean;
}

const AdminServicesPage: React.FC = () => {
  const { theme } = useOutletContext<{ theme: 'dark' | 'light' }>();
  const isDark = theme === 'dark';

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<ServiceStats>({ total: 0, customs: 0, transport: 0, logistics: 0 });
  const [displayStats, setDisplayStats] = useState<ServiceStats>({ total: 0, customs: 0, transport: 0, logistics: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    service_name: '',
    service_code: '',
    service_description: '',
    email_reception: '',
  });
  const [userPermissions, setUserPermissions] = useState<ServicePermissions>({
    can_add: false,
    can_edit: false,
    can_delete: false,
    can_view: true,
  });

  useEffect(() => {
    const init = async () => {
      await fetchCurrentUserPermissions();
      await fetchServices();
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
      const next: ServiceStats = {
        total: Math.round(start.total + (end.total - start.total) * progress),
        customs: Math.round(start.customs + (end.customs - start.customs) * progress),
        transport: Math.round(start.transport + (end.transport - start.transport) * progress),
        logistics: Math.round(start.logistics + (end.logistics - start.logistics) * progress),
      };
      setDisplayStats(next);
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [stats.total, stats.customs, stats.transport, stats.logistics]);

  const fetchCurrentUserPermissions = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth?.user?.id;
      if (!currentUserId) return;

      const { data: sysRolesRes, error: sysRolesError } = await supabase
        .from('user_roles')
        .select('roles:roles(name)')
        .eq('user_id', currentUserId);

      if (sysRolesError) {
        console.warn('[ServicesAdmin] Permission check failed (user_roles):', sysRolesError);
        return;
      }

      const allRoles = (sysRolesRes?.map((r: any) => {
        const name = r.roles?.name as string | undefined;
        if (!name) return null;
        return name
          .toString()
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }).filter(Boolean) || []) as string[];
      if (allRoles.length === 0) return;

      const { data: perms } = await supabase
        .from('role_permissions')
        .select('*')
        .in('role', allRoles)
        .eq('resource', 'services');

      const aggregated = (perms || []).reduce((acc: any, p: any) => {
        if (p.can_add) acc.can_add = true;
        if (p.can_edit) acc.can_edit = true;
        if (p.can_delete) acc.can_delete = true;
        if (p.can_view) acc.can_view = true;
        return acc;
      }, {
        can_add: false,
        can_edit: false,
        can_delete: false,
        can_view: false,
      });

      setUserPermissions(aggregated);
    } catch (e) {
      console.warn('[ServicesAdmin] Permission check failed', e);
    }
  };

  const calculateStats = (rows: ServiceRow[]) => {
    const total = rows.length;
    const customsCodes = ['CCI', 'CCE', 'COI', 'SAP'];
    const transportCodes = ['AFR', 'OFR', 'DOM', 'MOV'];
    const logisticsCodes = ['WHS'];

    const customs = rows.filter(s => customsCodes.includes(s.service_code)).length;
    const transport = rows.filter(s => transportCodes.includes(s.service_code)).length;
    const logistics = rows.filter(s => logisticsCodes.includes(s.service_code)).length;

    setStats({ total, customs, transport, logistics });
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service')
        .select('id, service_name, service_code, service_description, email_reception')
        .order('id', { ascending: true });

      if (error) throw error;

      const rows = data || [];
      setServices(rows as ServiceRow[]);
      calculateStats(rows as ServiceRow[]);
    } catch (error: any) {
      console.error('[ServicesAdmin] Error fetching services:', error);
      toast.error("Erreur lors du chargement des services");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
  };

  const handleAddClick = () => {
    setEditingService(null);
    setFormData({ service_name: '', service_code: '', service_description: '', email_reception: '' });
    setShowFormModal(true);
  };

  const handleEditClick = (service: ServiceRow) => {
    setEditingService(service);
    setFormData({
      service_name: service.service_name,
      service_code: service.service_code,
      service_description: service.service_description || '',
      email_reception: service.email_reception || '',
    });
    setShowFormModal(true);
  };

  const handleFormChange = (field: keyof ServiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.service_name.trim() || !formData.service_code.trim()) {
      toast.error('Nom et code du service sont obligatoires');
      return;
    }

    try {
      if (editingService) {
        const { error } = await supabase
          .from('service')
          .update({
            service_name: formData.service_name.trim(),
            service_code: formData.service_code.trim().toUpperCase(),
            service_description: formData.service_description.trim() || null,
            email_reception: formData.email_reception.trim() || null,
          })
          .eq('id', editingService.id);

        if (error) throw error;
        toast.success('Service mis à jour avec succès');
      } else {
        const { error } = await supabase
          .from('service')
          .insert([{
            service_name: formData.service_name.trim(),
            service_code: formData.service_code.trim().toUpperCase(),
            service_description: formData.service_description.trim() || null,
            email_reception: formData.email_reception.trim() || null,
          }]);

        if (error) throw error;
        toast.success('Service ajouté avec succès');
      }

      setShowFormModal(false);
      await fetchServices();
    } catch (error: any) {
      console.error('[ServicesAdmin] Error saving service:', error);
      toast.error(error.message || "Erreur lors de l'enregistrement du service");
    }
  };

  const handleDelete = async (service: ServiceRow) => {
    if (!window.confirm(`Supprimer le service "${service.service_name}" ?`)) return;
    try {
      const { error } = await supabase
        .from('service')
        .delete()
        .eq('id', service.id);

      if (error) throw error;
      toast.success('Service supprimé avec succès');
      await fetchServices();
    } catch (error: any) {
      console.error('[ServicesAdmin] Error deleting service:', error);
      toast.error(error.message || 'Erreur lors de la suppression du service');
    }
  };

  const filteredServices = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return services.filter(s => {
      const matchesSearch =
        !q ||
        s.service_name.toLowerCase().includes(q) ||
        s.service_code.toLowerCase().includes(q) ||
        (s.service_description || '').toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [services, searchTerm]);

  const groupedServices = useMemo(() => {
    if (!groupBy) return { '': filteredServices } as Record<string, ServiceRow[]>;

    return filteredServices.reduce((acc, s) => {
      let key = '';
      if (groupBy === 'type') {
        const customsCodes = ['CCI', 'CCE', 'COI', 'SAP'];
        const transportCodes = ['AFR', 'OFR', 'DOM', 'MOV'];
        if (customsCodes.includes(s.service_code)) key = 'Services douane';
        else if (transportCodes.includes(s.service_code)) key = 'Transport & fret';
        else key = 'Logistique & entreposage';
      } else if (groupBy === 'code') {
        key = s.service_code;
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    }, {} as Record<string, ServiceRow[]>);
  }, [filteredServices, groupBy]);

  if (!userPermissions.can_view) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`px-6 py-4 rounded-lg border text-sm font-medium ${
          isDark
            ? 'bg-gray-900 border-gray-700 text-gray-200'
            : 'bg-white border-gray-200 text-gray-800 shadow-sm'
        }`}>
          Vous n'avez pas la permission de voir cette page.
        </div>
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
          <Wrench className={`w-7 h-7 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          Gestion des services
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
            <RefreshCw className="w-4 h-4 mr-2" />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
          {userPermissions.can_add && (
            <button
              onClick={handleAddClick}
              className="px-4 py-2 rounded-lg flex items-center text-sm font-medium shadow-sm bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un service
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total services"
          value={displayStats.total}
          icon={FileText}
          className="bg-gradient-to-br from-red-600 to-red-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Services douane"
          value={displayStats.customs}
          icon={Wrench}
          className="bg-gradient-to-br from-amber-500 to-amber-600"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Transport & fret"
          value={displayStats.transport}
          icon={Wrench}
          className="bg-gradient-to-br from-sky-600 to-sky-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Logistique / entrepôt"
          value={displayStats.logistics}
          icon={Wrench}
          className="bg-gradient-to-br from-emerald-600 to-emerald-700"
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
            { label: 'Type de service', value: 'type' },
            { label: 'Code', value: 'code' },
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
                  <th className={isDark ? 'px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-300' : 'px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600'}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
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
                        <div className={isDark ? 'text-sm font-medium text-white' : 'text-sm font-medium text-gray-900'}>
                          {service.service_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                          {service.service_code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className={isDark ? 'text-sm text-gray-300' : 'text-sm text-gray-600'}>
                          {service.service_description || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {userPermissions.can_edit && (
                            <button
                              onClick={() => handleEditClick(service)}
                              className={
                                isDark
                                  ? 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-yellow-700 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30'
                                  : 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                              }
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {userPermissions.can_delete && (
                            <button
                              onClick={() => handleDelete(service)}
                              className={
                                isDark
                                  ? 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30'
                                  : 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                              }
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          >
            <div className="p-6 border-b flex items-center justify-between sticky top-0 z-10 bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <h2 className={isDark ? 'text-xl font-bold text-white' : 'text-xl font-bold text-gray-900'}>
                {editingService ? 'Modifier le service' : 'Ajouter un service'}
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
                <label className={isDark ? 'block text-sm font-medium mb-1 text-gray-200' : 'block text-sm font-medium mb-1 text-gray-700'}>
                  Nom du service
                </label>
                <input
                  type="text"
                  value={formData.service_name}
                  onChange={(e) => handleFormChange('service_name', e.target.value)}
                  className={
                    isDark
                      ? 'w-full px-3 py-2 rounded-md border text-sm bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
                      : 'w-full px-3 py-2 rounded-md border text-sm bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500'
                  }
                  placeholder="Service Administratif Ponctuel"
                />
              </div>

              <div>
                <label className={isDark ? 'block text-sm font-medium mb-1 text-gray-200' : 'block text-sm font-medium mb-1 text-gray-700'}>
                  Code du service
                </label>
                <input
                  type="text"
                  value={formData.service_code}
                  onChange={(e) => handleFormChange('service_code', e.target.value.toUpperCase())}
                  className={
                    isDark
                      ? 'w-full px-3 py-2 rounded-md border text-sm bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
                      : 'w-full px-3 py-2 rounded-md border text-sm bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500'
                  }
                  placeholder="SAP, AFR, OFR..."
                />
              </div>

              <div>
                <label className={isDark ? 'block text-sm font-medium mb-1 text-gray-200' : 'block text-sm font-medium mb-1 text-gray-700'}>
                  Description
                </label>
                <textarea
                  value={formData.service_description}
                  onChange={(e) => handleFormChange('service_description', e.target.value)}
                  rows={4}
                  className={
                    isDark
                      ? 'w-full px-3 py-2 rounded-md border text-sm resize-none bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
                      : 'w-full px-3 py-2 rounded-md border text-sm resize-none bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500'
                  }
                  placeholder="Décrivez brièvement le service..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className={
                    isDark
                      ? 'px-4 py-2 rounded-lg text-sm font-medium border border-gray-600 text-gray-200 hover:bg-gray-800'
                      : 'px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white"
                >
                  {editingService ? 'Enregistrer' : 'Ajouter'}
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
