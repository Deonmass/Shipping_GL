import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {
    Eye,
    EyeOff,
    Edit,
    Trash2,
    Plus,
    X,
    AlertCircle,
    Search,
    RefreshCw,
    Power,
    Calendar,
    CalendarX,
    CalendarRange,
    Clock,
    TrendingUp, FileText, ToggleRight, ToggleLeft
} from 'lucide-react';
import {supabase} from '../../lib/supabase';
import toast from 'react-hot-toast';
import {format, subMonths, startOfMonth, endOfMonth} from 'date-fns';
import {fr} from 'date-fns/locale';
import {EventCountdown} from '../../components/admin/EventCountdown';
import {StatsCard} from '../../components/admin/StatsCard';
import {ChartPanel} from '../../components/admin/ChartPanel';
import {useOutletContext} from 'react-router-dom';
import {UseAddEvent, UseDeleteEvent, UseGetEvents, UseUpdateEvent} from "../../services";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import AppToast from "../../utils/AppToast.ts";

interface Event {
    id?: string;
    title: string;
    description?: string;
    event_date: string;
    location: string;
    image_url?: string;
    is_visible?: boolean;
    status?: string;
    created_at?: string;
}


const emptyItem: Event = {
    title: "",
    description: "",
    event_date: "",
    location: "",
    image_url: "",
}

const isActive = (u: any) =>
    u?.status?.toString() === "1"


const EventsPage: React.FC = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>();
    const isDark = theme === 'dark';
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [showFormModal, setShowFormModal] = useState<"add" | "edit" | null>(null);
    const [formData, setFormData] = useState<Event>(emptyItem);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [groupBy, setGroupBy] = useState<'none' | 'month' | 'visibility'>('none');

    const {data: events, isPending: isGettingEvents, refetch: reGetEvents} = UseGetEvents({format: "stats"})
    const {isPending: isAdding, mutate: addEvent, data: addResult} = UseAddEvent()
    const {isPending: isUpdating, mutate: updateEvent, data: updateResult} = UseUpdateEvent()
    const {isPending: isDeleting, mutate: deleteEvent, data: deleteResult} = UseDeleteEvent()

    const now = new Date();
    const oneMonthLater = new Date(now.getTime());
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    useEffect(() => {
        if (addResult) {
            if (addResult?.responseData?.error) {
                AppToast.error(theme === "dark", addResult?.responseData?.message || "Erreur lors de l'enregistrement")
            } else {
                reGetEvents()
                AppToast.success(theme === "dark", 'Événement ajouté avec succès')
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
                reGetEvents()
                AppToast.success(theme === "dark", 'Événement mis a jour avec succès')
                setShowFormModal(null);
                setFormData(emptyItem);
                //setShowStatusConfirm(null);
            }
        }
    }, [updateResult]);

    useEffect(() => {
        if (deleteResult) {
            if (deleteResult?.responseData?.error) {
                AppToast.error(theme === "dark", deleteResult?.responseData?.message || "Erreur lors de la suppression")
            } else {
                reGetEvents()
                AppToast.success(theme === "dark", 'Événement supprimé avec succès')
                setShowDeleteConfirm(null);
            }
        }
    }, [deleteResult]);


    const months = Array.from({length: 6}, (_, idx) => 5 - idx).map((i) => {
        const monthDate = subMonths(now, i);
        return {
            monthDate,
            start: startOfMonth(monthDate),
            end: endOfMonth(monthDate),
        };
    });

    const monthlyData = months.map(({monthDate, start, end}) => {
        const count = events?.responseData?.data?.items?.filter(e => {
            const d = new Date(e.event_date);
            return d >= start && d <= end;
        }).length;
        return {name: format(monthDate, 'MMM', {locale: fr}), total: count};
    });


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.location.trim() || !formData.event_date) {
            AppToast.error(isDark, 'Veuillez remplir tous les champs requis');
            return;
        }

        const body = {
            title: formData.title,
            description: formData.description,
            event_date: format(new Date(formData.event_date), 'yyyy/MM/dd HH:mm:ss'),
            location: formData.location,
            image_url: formData.image_url || null
        }

        if (showFormModal === 'add') {
            addEvent(body);
        } else {
            if (!formData?.id) {
                AppToast.error(isDark, "Une erreur s'est produite.");
                return;
            }
            updateEvent({id: formData?.id, ...body});
        }
    };

    const filteredEvents = events?.responseData?.data?.items?.filter(event => {
        const hay = `${event.title} ${event.location}`.toLowerCase();
        const matchesSearch = hay.includes(searchTerm.toLowerCase());
        const d = new Date(event.event_date);
        const inFrom = dateFrom ? d >= new Date(dateFrom) : true;
        const inTo = dateTo ? d <= new Date(new Date(dateTo).getTime() + 86399999) : true; // include end day
        return matchesSearch && inFrom && inTo;
    });

    if (isGettingEvents) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div
                    className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    const handleToggleVisibility = async (event: Event) => {
        if (!event?.id) {
            AppToast.error(isDark, "Une erreur s'est produite.");
            return;
        }
        updateEvent({id: event?.id, status: isActive(event) ? "0" : "1"});
    };

    const getActionItems = (item: any) => [
        {
            visible: HasPermission(appPermissions.events, appOps.delete),
            label: isActive(item) ? 'Désactiver' : 'Activer',
            icon: isActive(item) ? ToggleRight : ToggleLeft,
            onClick: () => {
                handleToggleVisibility(item);
            },
            color: (isActive(item) ? 'text-emerald-400' : 'text-red-400'),
            bgColor: '',
            borderColor: (isActive(item) ? 'border-emerald-500/60' : 'border-red-500/60'),
        },
        {
            visible: HasPermission(appPermissions.events, appOps.read),
            label: 'Voir détails',
            icon: Eye,
            onClick: () => {
                setSelectedEvent(item);
            },
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20',
            borderColor: 'border-blue-500/30'
        },
        {
            visible: HasPermission(appPermissions.events, appOps.update),
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
            visible: HasPermission(appPermissions.events, appOps.delete),
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
                Icon={<Calendar
                    className={`w-6 h-6 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}
                />}
                title=" Gestion d'Evenement"
                onRefresh={() => reGetEvents()}
                onAdd={HasPermission(appPermissions.events, appOps.create) ? () => {
                    setFormData(emptyItem);
                    setShowFormModal("add");
                } : undefined}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <StatsCard
                    title="Total events"
                    value={events?.responseData?.data?.items?.length || "0"}
                    icon={Calendar}
                    className="bg-gradient-to-br from-blue-600 to-blue-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="Déjà passé"
                    value={events?.responseData?.data?.totals?.passed || "0"}
                    icon={CalendarX}
                    className="bg-gradient-to-br from-red-600 to-red-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="À venir"
                    value={events?.responseData?.data?.totals?.upcoming || "0"}
                    icon={CalendarRange}
                    className="bg-gradient-to-br from-indigo-600 to-indigo-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="Visible"
                    value={events?.responseData?.data?.totals?.active || "0"}
                    icon={Eye}
                    className="bg-gradient-to-br from-green-600 to-green-700"
                    iconClassName="text-white"
                    titleClassName="text-white"
                />
                <StatsCard
                    title="Non visible"
                    value={events?.responseData?.data?.totals?.inactive || "0"}
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
                            className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
                    {filteredEvents?.map((event: any) => (
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
                                {format(new Date(event.event_date), 'dd/MM/yyyy HH:mm', {locale: fr})}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <EventCountdown eventDate={event.event_date} compact={true}/>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div
                                    className="inline-flex w-full flex-wrap items-center justify-end gap-2">

                                    {getActionItems(event)
                                        .map((action) => {
                                            if (action.label === 'Désactiver' || action.label === 'Activer') {
                                                return action?.visible ? (
                                                    <button
                                                        key={action.label}
                                                        type="button"
                                                        onClick={action.onClick}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                                            isActive(event)
                                                                ? 'bg-red-600'
                                                                : theme === 'dark'
                                                                    ? 'bg-gray-600'
                                                                    : 'bg-gray-300'
                                                        }`}
                                                        title={action.label}
                                                    >
                                      <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                              isActive(event) ? 'translate-x-6' : 'translate-x-1'
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
                    ))}
                    </tbody>
                </table>
            </div>

            {selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
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
                                <X className="w-6 h-6"/>
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
                                        {format(new Date(selectedEvent.event_date), 'dd/MM/yyyy HH:mm', {locale: fr})}
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
                                disabled={isDeleting}
                                onClick={() => deleteEvent({id: showDeleteConfirm})}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                                {isDeleting ? "Chargement ..." : "Supprimer"}
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
                                {showFormModal === "edit" ? "Modifier l'événement" : 'Ajouter un événement'}
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
                                        onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
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
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                event_date: e.target.value
                                            }))}
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
                                            onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
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
                                        onChange={(e) => setFormData(prev => ({...prev, image_url: e.target.value}))}
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
                                        onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
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
                                    disabled={isAdding || isUpdating }
                                    type="submit"
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                                >
                                    {isAdding || isUpdating ? 'Chargement ...' : 'Valider'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Graphique en bas */}
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary-500"/>
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
                        dataKeys={[{key: 'total', name: 'Total', color: '#3B82F6'}]}
                        theme={theme}
                    />
                </div>
            </div>
        </div>
    );
};

export default EventsPage;
