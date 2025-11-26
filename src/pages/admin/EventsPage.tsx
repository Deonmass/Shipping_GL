import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Edit, Trash2, Plus, X, AlertCircle, Search, RefreshCw, Power, Calendar, CalendarX, CalendarRange, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EventCountdown } from '../../components/admin/EventCountdown';
import { StatsCard } from '../../components/admin/StatsCard';
import { ChartPanel } from '../../components/admin/ChartPanel';
import { useAuth } from '../../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  location: string;
  image_url?: string;
  is_visible: boolean;
  created_at: string;
}

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url: string;
}

const EventsPage: React.FC = () => {
  const { theme } = useOutletContext<{ theme: 'dark' | 'light' }>();
  const isDark = theme === 'dark';
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_date: '',
    location: '',
    image_url: ''
  });
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'none' | 'month' | 'visibility'>('none');
  const { user } = useAuth();

  const now = new Date();
  const oneMonthLater = new Date(now.getTime());
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  const stats = {
    total: events.length,
    passed: events.filter(e => new Date(e.event_date) < now).length,
    upcomingInMonth: events.filter(e => {
      const d = new Date(e.event_date);
      return d >= now && d < oneMonthLater;
    }).length,
    upcomingAfterMonth: events.filter(e => new Date(e.event_date) >= oneMonthLater).length,
    visible: events.filter(e => e.is_visible).length,
    hidden: events.filter(e => !e.is_visible).length
  };

  const months = Array.from({ length: 6 }, (_, idx) => 5 - idx).map((i) => {
    const monthDate = subMonths(now, i);
    return {
      monthDate,
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate),
    };
  });

  const monthlyData = months.map(({ monthDate, start, end }) => {
    const count = events.filter(e => {
      const d = new Date(e.event_date);
      return d >= start && d <= end;
    }).length;
    return { name: format(monthDate, 'MMM', { locale: fr }), total: count };
  });

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Pour l'instant, tous les comptes ayant accès à l'admin voient tous les événements.
      // On pourrait plus tard filtrer par créateur quand le schéma le permettra.
      const { data, error } = await supabase
        .from('news_events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    const eventDate = new Date(event.event_date);
    const localDate = new Date(eventDate.getTime() - eventDate.getTimezoneOffset() * 60000);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: localDate.toISOString().slice(0, 16),
      location: event.location,
      image_url: event.image_url || ''
    });
    setShowFormModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.location.trim() || !formData.event_date) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        event_date: new Date(formData.event_date).toISOString(),
        location: formData.location,
        image_url: formData.image_url || null
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('news_events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast.success('Événement modifié avec succès');
      } else {
        const { error } = await supabase
          .from('news_events')
          .insert([eventData]);

        if (error) throw error;
        toast.success('Événement ajouté avec succès');
      }

      setShowFormModal(false);
      setEditingEvent(null);
      setFormData({ title: '', description: '', event_date: '', location: '', image_url: '' });
      fetchEvents();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('news_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Événement supprimé avec succès');
      fetchEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
    setShowDeleteConfirm(null);
  };

  const filteredEvents = events.filter(event => {
    const hay = `${event.title} ${event.location}`.toLowerCase();
    const matchesSearch = hay.includes(searchTerm.toLowerCase());
    const d = new Date(event.event_date);
    const inFrom = dateFrom ? d >= new Date(dateFrom) : true;
    const inTo = dateTo ? d <= new Date(new Date(dateTo).getTime() + 86399999) : true; // include end day
    return matchesSearch && inFrom && inTo;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const handleToggleVisibility = async (event: Event) => {
    try {
      const { error } = await supabase
        .from('news_events')
        .update({ is_visible: !event.is_visible })
        .eq('id', event.id);

      if (error) throw error;

      toast.success(event.is_visible ? 'Événement masqué' : 'Événement visible');
      fetchEvents();
    } catch (error: any) {
      console.error('Error toggling visibility:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  return (
    <div>
      <div className="mb-6 mt-[60px] flex items-center justify-between">
        <h1
          className={`text-2xl font-bold flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          <Calendar
            className={`w-6 h-6 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}
          />
          Gestion d'evenement
        </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchEvents}
            className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium border transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
          <button
            onClick={() => setShowFormModal(true)}
            className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium shadow-sm ${
              isDark
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter un événement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatsCard
          title="Total events"
          value={stats.total}
          icon={Calendar}
          className="bg-gradient-to-br from-blue-600 to-blue-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Déjà passé"
          value={stats.passed}
          icon={CalendarX}
          className="bg-gradient-to-br from-red-600 to-red-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="À venir (< 1 mois)"
          value={stats.upcomingInMonth}
          icon={Clock}
          className="bg-gradient-to-br from-orange-600 to-orange-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="À venir (> 1 mois)"
          value={stats.upcomingAfterMonth}
          icon={CalendarRange}
          className="bg-gradient-to-br from-indigo-600 to-indigo-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Visible"
          value={stats.visible}
          icon={Eye}
          className="bg-gradient-to-br from-green-600 to-green-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
        <StatsCard
          title="Non visible"
          value={stats.hidden}
          icon={EyeOff}
          className="bg-gradient-to-br from-purple-600 to-purple-700"
          iconClassName="text-white"
          titleClassName="text-white"
        />
      </div>

      {/* Filtres */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="w-full">
          <label
            className={`block text-xs mb-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Recherche
          </label>
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-400' : 'text-gray-400'
              }`}
            />
            <input
              type="search"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-primary-500 focus:border-primary-500 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 shadow-sm'
              }`}
            />
          </div>
        </div>
        <div>
          <label
            className={`block text-xs mb-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Date de début
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-primary-500 focus:border-primary-500 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900 shadow-sm'
            }`}
          />
        </div>
        <div>
          <label
            className={`block text-xs mb-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Date de fin
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-primary-500 focus:border-primary-500 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900 shadow-sm'
            }`}
          />
        </div>
        <div>
          <label
            className={`block text-xs mb-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Regrouper par
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-primary-500 focus:border-primary-500 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900 shadow-sm'
            }`}
          >
            <option value="none">Aucun</option>
            <option value="month">Mois</option>
            <option value="visibility">Visibilité</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
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
                Titre
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Lieu
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Date de l'événement
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Compte à rebours
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
            {filteredEvents.map((event) => (
              <tr
                key={event.id}
                className={`${
                  isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                } ${!event.is_visible ? (isDark ? 'bg-red-900/10' : 'bg-red-50') : ''}`}
              >
                <td className="px-6 py-4">
                  <div
                    className={`text-sm font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {event.title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {event.location}
                  </div>
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {format(new Date(event.event_date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <EventCountdown eventDate={event.event_date} compact={true} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => handleToggleVisibility(event)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      event.is_visible ? 'bg-primary-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        event.is_visible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition border ${
                        isDark
                          ? 'border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/60'
                          : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                      title="Voir détails"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(event)}
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition border ${
                        isDark
                          ? 'border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:border-green-500/60'
                          : 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      title="Modifier"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(event.id)}
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition border ${
                        isDark
                          ? 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/60'
                          : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-lg max-w-2xl w-full border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200 shadow-lg'
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark
                  ? 'border-gray-700'
                  : 'border-gray-200 bg-slate-50'
              }`}
            >
              <h2
                className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Détails de l'Événement
              </h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className={
                  isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <h3
                className={`text-2xl font-bold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {selectedEvent.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Lieu
                  </label>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {selectedEvent.location}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Date
                  </label>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {format(new Date(selectedEvent.event_date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
              {selectedEvent.description && (
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Description
                  </label>
                  <div
                    className={`p-4 rounded-lg ${
                      isDark
                        ? 'text-white bg-gray-700'
                        : 'text-gray-800 bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {selectedEvent.description}
                  </div>
                </div>
              )}
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
              Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.
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

      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-lg max-w-2xl w-full border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200 shadow-lg'
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark
                  ? 'border-gray-700'
                  : 'border-gray-200 bg-slate-50'
              }`}
            >
              <h2
                className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {editingEvent ? "Modifier l'événement" : 'Ajouter un événement'}
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
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Titre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                    }`}
                    placeholder="Titre de l'événement"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Date et heure <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.event_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                      className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Lieu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                      }`}
                      placeholder="Lieu de l'événement"
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    URL de l'image
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                    }`}
                    placeholder="https://exemple.com/image.jpg"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className={`w-full rounded-lg px-4 py-2 border focus:ring-primary-500 focus:border-primary-500 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900 shadow-sm'
                    }`}
                    placeholder="Description de l'événement..."
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
                  {editingEvent ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Graphique en bas */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          <h2
            className={`text-xl font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Événements par mois (6 derniers)
          </h2>
        </div>
        <div className="grid grid-cols-1">
          <ChartPanel
            title="Évolution Mensuelle"
            type="line"
            data={monthlyData}
            dataKeys={[{ key: 'total', name: 'Total', color: '#3B82F6' }]}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
