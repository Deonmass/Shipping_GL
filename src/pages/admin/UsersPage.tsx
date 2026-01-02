import React, {useState, useEffect, useRef} from 'react';
import {motion} from 'framer-motion';
import {useLocation} from 'react-router-dom';
import {
    Users, Eye, UserCheck, Edit, Trash2,
    AlertTriangle, X, User as UserIcon, KeyRound,
    CheckCircle2, Circle, ToggleLeft, ToggleRight, XCircle
} from 'lucide-react';
import {supabase} from '../../lib/supabase';
import {format, parseISO, subMonths, startOfMonth, endOfMonth} from 'date-fns';
import {fr} from 'date-fns/locale';
import {StatsCard} from '../../components/admin/StatsCard';
import {FilterBar} from '../../components/admin/FilterBar';
import {ChartPanel} from '../../components/admin/ChartPanel';
import {ChartModal} from '../../components/admin/ChartModal';
import {
    UseAddUser, UseDeleteUser,
    UseGetRoles,
    UseGetUsersStats,
    UseToggleUserStatus,
    UseUpdateUser
} from "../../services";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import AppToast from "../../utils/AppToast.ts";
import {HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {appOps} from "../../constants";
const emptyUser = {
    email: '',
    password: '',
    name: '',
    phone: '',
    role_id: '',
    role_title: '',
}

const isActive = (u: any) =>
    u?.status?.toString() === "1"

const getPasswordValidation = (password: string, confirm: string) => {
    const lengthOk = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const match = password.length > 0 && password === confirm;

    const allOk = lengthOk && hasUpper && hasLower && hasDigit && hasSpecial && match;

    return {lengthOk, hasUpper, hasLower, hasDigit, hasSpecial, match, allOk};
};

const UsersPage: React.FC = () => {
    const location = useLocation();
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        if (typeof window === 'undefined') return 'dark';
        const saved = window.localStorage.getItem('admin_theme');
        return saved === 'light' ? 'light' : 'dark';
    });

    const currentView = location.pathname.includes('/visitors') ? 'visitors' :
        location.pathname.includes('/admins') ? 'admins' : 'all';

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [groupBy, setGroupBy] = useState('');

    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [expandedChart, setExpandedChart] = useState<{
        title: string;
        type: 'line' | 'pie';
        data: any[];
        dataKeys?: any[]
    } | null>(null);
    const [showStatusConfirm, setShowStatusConfirm] = useState<any | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isResetRunning, setIsResetRunning] = useState(false);
    const [resetProgress, setResetProgress] = useState(0);
    const [formData, setFormData] = useState<any>(emptyUser);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [showViewModal, setShowViewModal] = useState<any>(null);
    const [showResetConfirm, setShowResetConfirm] = useState<any>(null);

    const tableContainerRef = useRef<HTMLDivElement>(null);

    const {isPending: isGettingUsers, data: users, refetch: reGetUsers} = UseGetUsersStats()
    const {data: roles} = UseGetRoles({noPermission: 1})
    const {isPending: isAddingUser, data: addUserResult, mutate: addUser} = UseAddUser()
    const {isPending: isUpdatingUser, data: updateUserResult, mutate: updateUser} = UseUpdateUser()
    const {isPending: isDeletingUser, data: deleteUserResult, mutate: deleteUser} = UseDeleteUser()
    const {
        isPending: isTogglingStatusUser,
        data: toggleStatusUserResult,
        mutate: toggleStatusUser
    } = UseToggleUserStatus()

    useEffect(() => {
        const handleThemeChange = () => {
            const saved = window.localStorage.getItem('admin_theme');
            setTheme(saved === 'light' ? 'light' : 'dark');
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('admin_theme_change', handleThemeChange);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('admin_theme_change', handleThemeChange);
            }
        };
    }, []);

    const toggleSelectAll = (checked: boolean, visibleUsers: any[]) => {
        setSelectedIds(prev => {
            const next = new Set<string>(prev);
            if (checked) {
                visibleUsers.forEach(u => next.add(u.id));
            } else {
                visibleUsers.forEach(u => next.delete(u.id));
            }
            return next;
        });
    };

    const toggleSelect = (userId: string, checked: boolean) => {
        setSelectedIds(prev => {
            const next = new Set<string>(prev);
            if (checked) next.add(userId); else next.delete(userId);
            return next;
        });
    };

    const bulkResetPasswords = async () => {
        const targets = users?.responseData?.data?.items?.filter((u: any) => selectedIds.has(u.id));
        await handleConfirmReset(targets);
    };

    const bulkDelete = async () => {
        for (const id of Array.from(selectedIds)) {
            await handleDeleteUser(id);
        }
        setSelectedIds(new Set());
    };

    const handleConfirmReset = async (targets: any[]) => {
        if (!targets || targets.length === 0) {
            AppToast.error(theme === "dark", 'Aucun utilisateur sélectionné pour la réinitialisation.',)
            return;
        }

        try {
            const total = targets.length;
            setIsResetRunning(true);
            setResetProgress(0);

            let completed = 0;
            for (const u of targets) {
                const {error} = await supabase.auth.resetPasswordForEmail(u.email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });

                if (error) {
                    throw new Error(error.message || 'Échec de l\'envoi de l\'email de réinitialisation');
                }

                completed += 1;
                const pct = Math.round((completed / total) * 100);
                console.log('[MatrixReset] Progress', pct + '%');
                setResetProgress(pct);
            }

            setIsResetRunning(false);
            AppToast.success(theme === "dark", `Email de réinitialisation envoyé à ${targets.length} utilisateur${targets.length > 1 ? 's' : ''}`,)
            setSelectedIds(new Set());
        } catch (err: any) {
            console.error('Reset error:', err);
            setIsResetRunning(false);
            AppToast.error(theme === "dark", err?.message || 'Erreur lors de la réinitialisation du mot de passe')
        }
    };

    useEffect(() => {
        if (addUserResult) {
            if (addUserResult?.responseData?.error) {
                AppToast.error(theme === "dark", addUserResult?.responseData?.message || "Erreur lors de l'enregistrement")
            } else {
                reGetUsers()
                AppToast.success(theme === "dark", 'Utilisateur ajouté avec succès')
                setShowAddModal(false);
                setFormData(emptyUser);
                setConfirmPassword('');
            }
        }
    }, [addUserResult]);

    useEffect(() => {
        if (updateUserResult) {
            if (updateUserResult?.responseData?.error) {
                AppToast.error(theme === "dark", updateUserResult?.responseData?.message || "Erreur lors de la modification")
            } else {
                reGetUsers()
                AppToast.success(theme === "dark", 'Utilisateur modifié avec succès')
                setShowEditModal(false);
                setSelectedUser(null);
            }
        }
    }, [updateUserResult]);

    useEffect(() => {
        if (deleteUserResult) {
            if (deleteUserResult?.responseData?.error) {
                AppToast.error(theme === "dark", deleteUserResult?.responseData?.message || "Erreur lors de la suppression")
            } else {
                reGetUsers()
                AppToast.success(theme === "dark", 'Utilisateur supprimé avec succès')
                setShowDeleteConfirm(null);
            }
        }
    }, [deleteUserResult]);

    useEffect(() => {
        if (toggleStatusUserResult) {
            if (toggleStatusUserResult?.responseData?.error) {
                AppToast.error(theme === "dark", toggleStatusUserResult?.responseData?.message || "Erreur lors de la mise à jour")
            } else {
                reGetUsers()
                AppToast.success(theme === "dark", 'Utilisateur mis à jour avec succès')
                setShowStatusConfirm(null);
            }
        }
    }, [toggleStatusUserResult]);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password || !formData.name || !formData.role_id) {
            AppToast.error(theme === "dark", 'Veuillez remplir tous les champs requis')
            return;
        }
        const pwdValidation = getPasswordValidation(formData.password, confirmPassword);

        if (!pwdValidation.lengthOk || !pwdValidation.hasUpper || !pwdValidation.hasLower || !pwdValidation.hasDigit || !pwdValidation.hasSpecial) {
            AppToast.error(theme === "dark", 'Le mot de passe doit contenir au moins 8 caractères, avec des lettres majuscules, minuscules, des chiffres et un caractère spécial.',)
            return;
        }

        if (!pwdValidation.match) {
            AppToast.error(theme === "dark", 'La confirmation du mot de passe ne correspond pas')
            return;
        }
        addUser({
            name: formData.name,
            email: formData.email,
            username: formData.email,
            role_id: formData.role_id,
            phone: formData.phone,
            password: formData.password,
            confirm_password: confirmPassword,
            should_change_password: "1"
        })
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        if (!formData.email || !formData.name || !formData.role_id) {
            AppToast.error(theme === "dark", 'Veuillez remplir tous les champs requis')
            return;
        }
        updateUser({
            id: selectedUser?.id,
            name: formData?.name,
            email: formData?.email,
            username: formData?.email,
            phone: formData?.phone,
            role_id: formData?.role_id,
        })
    };


    const handleDeleteUser = async (userId: string) => {
        deleteUser({id: userId})
    };

    const handleUpdateUserStatus = async (user: User) => {
        toggleStatusUser({id: user.id})
    };

    // handleResetPassword remplacé par la réinitialisation directe via handleConfirmReset et la fonction Edge admin-users.

    const getActionItems = (user: any) => [
        {
            visible: HasPermission(appPermissions.users, appOps.delete),
            label: isActive(user) ? 'Désactiver compte' : 'Activer compte',
            icon: isActive(user) ? ToggleRight : ToggleLeft,
            onClick: () => {
                setShowStatusConfirm(user);
            },
            color: (isActive(user) ? 'text-emerald-400' : 'text-red-400'),
            bgColor: '',
            borderColor: (isActive(user) ? 'border-emerald-500/60' : 'border-red-500/60'),
        },
        {
            visible: HasPermission(appPermissions.users, appOps.read),
            label: 'Voir détails',
            icon: Eye,
            onClick: () => {
                setShowViewModal(user);
            },
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20',
            borderColor: 'border-blue-500/30'
        },
        {
            visible: HasPermission(appPermissions.users, appOps.update),
            label: 'Modifier',
            icon: Edit,
            onClick: () => {
                setSelectedUser(user);
                setFormData(user);
                setShowEditModal(true);
            },
            color: 'text-green-400',
            bgColor: 'bg-green-500/20',
            borderColor: 'border-green-500/30'
        },
        {
            visible: HasPermission(appPermissions.users, appOps.update),
            label: 'Réinitialiser mot de passe',
            icon: KeyRound,
            onClick: () => {
                setShowResetConfirm(user);
            },
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/20',
            borderColor: 'border-amber-500/30'
        },
        {
            visible: HasPermission(appPermissions.users, appOps.delete),
            label: 'Supprimer',
            icon: Trash2,
            onClick: () => {
                setShowDeleteConfirm(user.id);
            },
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            borderColor: 'border-red-500/30'
        }
    ];

    const filteredUsers = users?.responseData?.data?.items?.filter((user: any) => {
        const matchesSearch = user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user?.phone?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !statusFilter ||
            (statusFilter === 'active' && isActive(user)) ||
            (statusFilter === 'pending' && !isActive(user));

        const matchesRole = !roleFilter || (roleFilter?.toString() === user?.role_id?.toString())

        const matchesView = currentView === 'all' ||
            (currentView === 'visitors' && !user.isAdmin) ||
            (currentView === 'admins' && user.isAdmin);

        return matchesSearch && matchesStatus && matchesRole && matchesView;
    });

    const groupedUsers = () => {
        if (!groupBy) return {'': filteredUsers};

        return filteredUsers.reduce((acc, user) => {
            let key = '';
            if (groupBy === 'status') {
                key = isActive(user) ? 'Actifs' : 'Inactifs';
            } else if (groupBy === 'role') {
                key = user?.role_title
            } else if (groupBy === 'month') {
                key = format(parseISO(user.created_at), 'MMMM yyyy', {locale: fr});
            }

            if (!acc[key]) acc[key] = [];
            acc[key].push(user);
            return acc;
        }, {} as Record<string, any[]>);
    };

    const generateChartData = () => {
        const now = new Date();
        const monthlyData = [];

        for (let i = 5; i >= 0; i--) {
            const currentMonth = subMonths(now, i);
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);

            const monthlyUsers = users?.responseData?.data?.items?.filter((user: any) => {
                const createdAt = parseISO(user.created_at);
                return createdAt >= monthStart && createdAt <= monthEnd;
            });

            monthlyData.push({
                name: format(currentMonth, 'MMM', {locale: fr}),
                total: monthlyUsers?.length,
                actifs: monthlyUsers?.filter(u => u.email_confirmed_at).length
            });
        }

        return monthlyData;
    };

    const getRoleDistribution = () => {
        const counts: Record<string, number> = {};

        users?.responseData?.data?.items?.forEach((u: any) => {
            const roleName = u.role_title && u.role_title.trim().length > 0
                ? u.role_title
                : 'Sans rôle';
            counts[roleName] = (counts[roleName] || 0) + 1;
        });

        return Object.entries(counts).map(([name, value]) => ({name, value}));
    };

    const getStatusDistribution = () => {
        const active = users?.responseData?.data?.items?.filter(u => isActive(u)).length;
        const inactive = users?.responseData?.data?.items?.length - active;

        return [
            {name: 'Actifs', value: active},
            {name: 'Inactifs', value: inactive}
        ];
    };

    const activeFiltersCount = [statusFilter, roleFilter, groupBy].filter(Boolean).length;

    const clearFilters = () => {
        setStatusFilter('');
        setRoleFilter('');
        setGroupBy('');
    };

    const grouped = groupedUsers();

    return (
        <div>
            {isResetRunning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                    <div className={
                        theme === 'dark'
                            ? 'relative w-full max-w-md rounded-xl border border-emerald-400/40 bg-gradient-to-br from-slate-900 via-black to-slate-950 px-6 py-6 shadow-2xl'
                            : 'relative w-full max-w-md rounded-xl border border-emerald-400/40 bg-white px-6 py-6 shadow-2xl'
                    }>
                        <div
                            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.35),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.2),_transparent_55%)] opacity-70"/>
                        <h2 className={theme === 'dark' ? 'mb-3 text-center text-2xl font-bold text-white tracking-wide' : 'mb-3 text-center text-2xl font-bold text-gray-900 tracking-wide'}>
                            Veuillez patienter
                        </h2>
                        <p className={theme === 'dark' ? 'mb-5 text-center text-sm font-mono text-emerald-300' : 'mb-5 text-center text-sm font-mono text-emerald-700'}>
                            Réinitialisation des mots de passe en cours...
                        </p>
                        <div
                            className="mb-2 h-2 w-full overflow-hidden rounded-full border border-emerald-400/40 bg-slate-900/80 shadow-[0_0_18px_rgba(34,197,94,0.6)]">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-200 shadow-[0_0_18px_rgba(34,197,94,0.9)] transition-all duration-300 ease-out"
                                style={{width: `${resetProgress}%`}}
                            />
                        </div>
                        <div
                            className={theme === 'dark' ? 'flex items-center justify-between text-[11px] font-mono text-gray-300' : 'flex items-center justify-between text-[11px] font-mono text-gray-700'}>
                            <span
                                className={theme === 'dark' ? 'uppercase tracking-wide text-emerald-300/80' : 'uppercase tracking-wide text-emerald-700/80'}>Mode sécurisé Matrix</span>
                            <span>{resetProgress}%</span>
                        </div>
                    </div>
                </div>
            )}


            <div className={`sticky top-[0px] z-20 ${
                theme === 'dark' ? 'bg-[#111827]' : 'bg-white'
            }`}>
                <AdminPageHeader
                    Icon={<Users className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}/>}
                    title="Gestion des Utilisateurs"
                    onRefresh={() => reGetUsers()}
                    onAdd={() => {
                        setFormData(emptyUser);
                        setShowAddModal(true);
                    }}
                />


                {/* 🔹 MODALE : Ajouter un utilisateur */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            className={
                                theme === 'dark'
                                    ? 'bg-gray-800 rounded-lg p-6 w-full max-w-lg border border-gray-700'
                                    : 'bg-white rounded-lg p-6 w-full max-w-lg border border-gray-200'
                            }
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className={theme === 'dark' ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-gray-900'}>Ajouter
                                    un utilisateur</h2>
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                    }}
                                    className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                                    aria-label="Fermer"
                                >
                                    <X className="w-6 h-6"/>
                                </button>
                            </div>

                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div>
                                    <label
                                        className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        value={formData?.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className={
                                            theme === 'dark'
                                                ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <label
                                        className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData?.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className={
                                            theme === 'dark'
                                                ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                        }
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                            Mot de passe
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData?.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                className={
                                                    theme === 'dark'
                                                        ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 pr-10 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                        : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 pr-10 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                }
                                                minLength={8}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((v) => !v)}
                                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                                                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                            >
                                                <Eye className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                            Confirmer le mot de passe
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className={
                                                    theme === 'dark'
                                                        ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 pr-10 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                        : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 pr-10 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                }
                                                minLength={8}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword((v) => !v)}
                                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                                                aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                            >
                                                <Eye className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {(() => {
                                    const v = getPasswordValidation(formData.password, confirmPassword);
                                    const baseItemClass = 'text-xs flex items-center gap-2';
                                    const hasInput = formData.password.length > 0 || confirmPassword.length > 0;

                                    if (!hasInput) return null;

                                    const items = [
                                        {ok: v.lengthOk, label: 'Au moins 8 caractères'},
                                        {ok: v.hasUpper, label: 'Au moins une lettre majuscule'},
                                        {ok: v.hasLower, label: 'Au moins une lettre minuscule'},
                                        {ok: v.hasDigit, label: 'Au moins un chiffre'},
                                        {ok: v.hasSpecial, label: 'Au moins un caractère spécial'},
                                        {
                                            ok: v.match,
                                            label: 'Le mot de passe et la confirmation doivent être identiques',
                                        },
                                    ];

                                    return (
                                        <div
                                            className={
                                                theme === 'dark'
                                                    ? 'mt-2 rounded-md bg-gray-900/60 border border-gray-700 px-3 py-2'
                                                    : 'mt-2 rounded-md bg-gray-100 border border-gray-200 px-3 py-2'
                                            }
                                        >
                                            <p
                                                className={
                                                    theme === 'dark'
                                                        ? 'text-xs text-gray-300 mb-1 font-semibold'
                                                        : 'text-xs text-gray-700 mb-1 font-semibold'
                                                }
                                            >
                                                Critères du mot de passe :
                                            </p>
                                            <ul className="space-y-0.5">
                                                {items.map(({ok, label}) => (
                                                    <li
                                                        key={label}
                                                        className={`${baseItemClass} ${ok ? 'text-green-400' : 'text-gray-400'}`}
                                                    >
                                                        {ok ? (
                                                            <CheckCircle2 className="w-3.5 h-3.5"/>
                                                        ) : (
                                                            <Circle className="w-3.5 h-3.5"/>
                                                        )}
                                                        <span>{label}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })()}

                                <div>
                                    <label
                                        className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                        Téléphone
                                    </label>
                                    <input
                                        type="text"
                                        value={formData?.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className={
                                            theme === 'dark'
                                                ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                        }
                                    />
                                </div>

                                <div>
                                    <label
                                        className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                        Rôle
                                    </label>
                                    <select
                                        value={formData?.role_id}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            role_id: e.target.value
                                        })}
                                        className={
                                            theme === 'dark'
                                                ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                        }
                                    >
                                        <option value=""></option>
                                        {roles?.responseData?.data?.map((r: any) => (
                                            <option key={r.id} value={r.id}>
                                                {r.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddModal(false);
                                        }}
                                        className={
                                            theme === 'dark'
                                                ? 'px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg'
                                                : 'px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg'
                                        }
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                                    >
                                        {isAddingUser ? "Chargement..." : "Enregistrer"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <StatsCard
                        title="Total user"
                        value={users?.responseData?.data?.items?.length}
                        icon={Users}
                        className="bg-gradient-to-br from-blue-600 to-blue-700"
                        iconClassName="text-white"
                        titleClassName="text-white"
                    />
                    <StatsCard
                        title="Actifs"
                        value={users?.responseData?.data?.totals?.active}
                        icon={UserCheck}
                        className="bg-gradient-to-br from-emerald-600 to-emerald-700"
                        iconClassName="text-white"
                        titleClassName="text-white"
                    />
                    <StatsCard
                        title="Inactifs"
                        value={users?.responseData?.data?.totals?.blocked}
                        icon={AlertTriangle}
                        className="bg-gradient-to-br from-red-600 to-red-700"
                        iconClassName="text-white"
                        titleClassName="text-white"
                    />
                </div>
            </div>

            {/* Bloc scrollable: tout ce qui suit est dans un seul bloc et le scroll commence ici */}
            <div>
                {/* Barre d'actions groupées */}
                {selectedIds.size > 0 && (
                    <div className={`${
                        theme === 'dark'
                            ? 'bg-gray-900 border-gray-700'
                            : 'bg-white border-gray-200 shadow-sm'
                    } rounded-lg p-3 mb-4 flex items-center justify-between`}>
                        <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                            {selectedIds.size} sélectionné(s)
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={bulkResetPasswords}
                                className={`px-3 py-2 rounded-lg border ${
                                    theme === 'dark'
                                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                        : 'bg-amber-50 border-amber-300 text-amber-700'
                                }`}
                            >
                                Réinitialiser mots de passe
                            </button>
                            <button
                                onClick={bulkDelete}
                                className={`px-3 py-2 rounded-lg border ${
                                    theme === 'dark'
                                        ? 'bg-red-500/20 border-red-500/30 text-red-400'
                                        : 'bg-red-50 border-red-300 text-red-700'
                                }`}
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                )}

                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filters={[
                        {
                            label: 'Filtrer par statut',
                            value: statusFilter,
                            options: [
                                {label: 'Actifs', value: 'active'},
                                {label: 'Inactifs', value: 'pending'}
                            ],
                            onChange: setStatusFilter
                        },
                        {
                            label: 'Filtrer par rôle',
                            value: roleFilter,
                            options: roles?.responseData?.data ? roles?.responseData?.data?.map((item: any) => {
                                return {label: item?.title, value: item?.id}
                            }) : [],
                            onChange: setRoleFilter
                        }
                    ]}
                    groupBy={{
                        label: 'Regrouper par',
                        value: groupBy,
                        options: [
                            {label: 'Statut', value: 'status'},
                            {label: 'Rôle', value: 'role'},
                            {label: 'Mois', value: 'month'}
                        ],
                        onChange: setGroupBy
                    }}
                    activeFiltersCount={activeFiltersCount}
                    onClearFilters={clearFilters}
                    theme={theme}
                />

                <div className="space-y-6" ref={tableContainerRef}>
                    {isGettingUsers || isTogglingStatusUser ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                                <div
                                    className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"/>
                                <span className={theme === 'dark' ? 'text-sm text-gray-300' : 'text-sm text-gray-600'}>
                  Chargement des utilisateurs...
                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            {Object.entries(grouped).map(([groupName, groupUsers]) => (
                                <div
                                    key={groupName}
                                    className={`${
                                        theme === 'dark'
                                            ? 'bg-gray-800'
                                            : 'bg-white border border-gray-200 shadow-sm'
                                    } rounded-lg overflow-hidden mb-4`}
                                >
                                    {groupName && (
                                        <div
                                            className={`px-6 py-3 border-b ${
                                                theme === 'dark'
                                                    ? 'bg-gray-700 border-gray-600'
                                                    : 'bg-gray-50 border-gray-200'
                                            }`}
                                        >
                                            <h3
                                                className={`text-lg font-semibold ${
                                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                }`}
                                            >
                                                {groupName}
                                            </h3>
                                        </div>
                                    )}

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[800px]">
                                            <thead
                                                className={
                                                    theme === 'dark'
                                                        ? 'bg-gradient-to-r from-gray-800 to-gray-700'
                                                        : 'bg-gradient-to-r from-slate-100 to-slate-200'
                                                }
                                            >
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-10">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-400 text-primary-600 focus:ring-primary-500"
                                                        checked={groupUsers?.length > 0 && groupUsers?.every((u) => selectedIds.has(u.id))}
                                                        onChange={(e) => toggleSelectAll(e.target.checked, groupUsers)}
                                                    />
                                                </th>
                                                <th
                                                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                                                    }`}
                                                >
                                                    Utilisateur
                                                </th>
                                                <th
                                                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                                                    }`}
                                                >
                                                    Rôle
                                                </th>
                                                <th
                                                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                                                    }`}
                                                >
                                                    Statut
                                                </th>
                                                <th
                                                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                                                    }`}
                                                >
                                                    Créé le
                                                </th>
                                                <th
                                                    className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                                                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                                                    }`}
                                                >
                                                    Actions
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody
                                                className={theme === 'dark' ? 'bg-gray-900 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}>
                                            {groupUsers?.map((user: any) => (
                                                <tr
                                                    key={user.id}
                                                    className={
                                                        theme === 'dark'
                                                            ? 'transition-colors hover:bg-gray-800/80'
                                                            : 'transition-colors hover:bg-slate-50 hover:shadow-sm'
                                                    }
                                                >
                                                    <td className="px-4 py-3 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-400 text-primary-600 focus:ring-primary-500"
                                                            checked={selectedIds.has(user.id)}
                                                            onChange={(e) => toggleSelect(user.id, e.target.checked)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold shadow-sm ${
                                                                    !isActive(user)
                                                                        ? 'bg-red-500/10 text-red-500 border border-red-500/60'
                                                                        : user.isAdmin
                                                                            ? 'bg-purple-600 text-white'
                                                                            : user.isPartner
                                                                                ? 'bg-amber-500 text-white'
                                                                                : theme === 'dark'
                                                                                    ? 'bg-gray-700 text-gray-100'
                                                                                    : 'bg-slate-200 text-slate-800'
                                                                }`}
                                                                title={
                                                                    !isActive(user)
                                                                        ? 'Compte désactivé'
                                                                        : user.isAdmin
                                                                            ? 'Administrateur'
                                                                            : user.isPartner
                                                                                ? 'Partenaire'
                                                                                : 'Utilisateur'
                                                                }
                                                            >
                                                                {!isActive(user) ? (
                                                                    <XCircle className="h-4 w-4 text-red-500"/>
                                                                ) : (
                                                                    <UserIcon className="h-4 w-4"/>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div
                                                                    className={`text-sm font-medium ${
                                                                        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                                                                    }`}
                                                                >
                                                                    {user?.name}
                                                                </div>
                                                                <div
                                                                    className={`text-xs ${
                                                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                                    }`}
                                                                >
                                                                    {user?.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td
                                                        className={`px-4 py-3 text-sm ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                                        }`}
                                                    >
                                                         <span
                                                             className="inline-flex items-center rounded-md border border-sky-500/60 px-2.5 py-1 text-xs font-medium text-white bg-sky-500">
                                    {user?.role_title}
                                  </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                              <span
                                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium border ${
                                      isActive(user)
                                          ? 'border-emerald-500/60 bg-emerald-500/5 text-emerald-600'
                                          : 'border-red-500/60 bg-red-500/5 text-red-600'
                                  }`}
                              >
                                {isActive(user) ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500"/>
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500"/>
                                )}
                                  <span>{isActive(user) ? 'Actif' : 'Inactif'}</span>
                              </span>
                                                    </td>
                                                    <td
                                                        className={`px-4 py-3 text-sm ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                                        }`}
                                                    >
                                                        {format(parseISO(user.created_at), 'dd/MM/yyyy')}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right">
                                                        <div
                                                            className="inline-flex w-full flex-wrap items-center justify-end gap-2">

                                                            {/* Autres actions ensuite */}
                                                            {getActionItems(user)
                                                                .map((action) => {
                                                                    if (action.label === 'Désactiver compte' || action.label === 'Activer compte') {
                                                                        return action?.visible ? (
                                                                            <button
                                                                                key={action.label}
                                                                                type="button"
                                                                                onClick={action.onClick}
                                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                                                                    isActive(user)
                                                                                        ? 'bg-red-600'
                                                                                        : theme === 'dark'
                                                                                            ? 'bg-gray-600'
                                                                                            : 'bg-gray-300'
                                                                                }`}
                                                                                title={action.label}
                                                                            >
                                      <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                              isActive(user) ? 'translate-x-6' : 'translate-x-1'
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 🔹 MODALE : Voir détails utilisateur */}
                {showViewModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            className={theme === 'dark' ? 'bg-gray-800 rounded-lg p-6 w-full max-w-lg border border-gray-700' : 'bg-white rounded-lg p-6 w-full max-w-lg border border-gray-200'}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-primary-400"/>
                                    </div>
                                    <div>
                                        <h2 className={theme === 'dark' ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-gray-900'}>
                                            {showViewModal?.name}
                                        </h2>
                                        <p className={theme === 'dark' ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>{showViewModal?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedUser(showViewModal);
                                            setFormData(showViewModal);
                                            setShowEditModal(true);
                                            setShowViewModal(null);
                                        }}
                                        className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg"
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => setShowViewModal(null)}
                                        className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                                        aria-label="Fermer"
                                    >
                                        <X className="w-6 h-6"/>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div
                                    className={theme === 'dark' ? 'bg-gray-700/50 rounded-lg p-3' : 'bg-gray-50 rounded-lg p-3'}>
                                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Statut</div>
                                    <div>
                                         <span
                                             className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium border ${
                                                 isActive(showViewModal)
                                                     ? 'border-emerald-500/60 bg-emerald-500/5 text-emerald-600'
                                                     : 'border-red-500/60 bg-red-500/5 text-red-600'
                                             }`}
                                         >
                                {isActive(showViewModal) ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500"/>
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500"/>
                                )}
                                             <span>{isActive(showViewModal) ? 'Actif' : 'Inactif'}</span>
                              </span>
                                    </div>
                                </div>
                                <div
                                    className={theme === 'dark' ? 'bg-gray-700/50 rounded-lg p-3' : 'bg-gray-50 rounded-lg p-3'}>
                                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Date de
                                        création
                                    </div>
                                    <div
                                        className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
                                        {showViewModal.created_at ? format(parseISO(showViewModal.created_at), 'dd/MM/yyyy HH:mm', {locale: fr}) : '—'}
                                    </div>
                                </div>
                                <div
                                    className={theme === 'dark' ? 'bg-gray-700/50 rounded-lg p-3' : 'bg-gray-50 rounded-lg p-3'}>
                                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Dernière
                                        connexion
                                    </div>
                                    <div
                                        className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
                                        {showViewModal?.updated_at ? format(parseISO(showViewModal?.updated_at), 'dd/MM/yyyy HH:mm', {locale: fr}) : 'Jamais'}
                                    </div>
                                </div>
                                <div
                                    className={theme === 'dark' ? 'bg-gray-700/50 rounded-lg p-3' : 'bg-gray-50 rounded-lg p-3'}>
                                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Rôle</div>
                                    <div
                                        className={theme === 'dark' ? 'text-white font-medium break-words' : 'text-gray-900 font-medium break-words'}>
                                        {showViewModal.role_title}
                                    </div>
                                </div>

                                <div
                                    className={theme === 'dark' ? 'md:col-span-2 bg-gray-700/50 rounded-lg p-3' : 'md:col-span-2 bg-gray-50 rounded-lg p-3'}>
                                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Nom
                                        Utilisateur
                                    </div>
                                    <div
                                        className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>{showViewModal?.username || '—'}</div>
                                    <div
                                        className={theme === 'dark' ? 'text-gray-400 mt-2' : 'text-gray-500 mt-2'}>Téléphone
                                    </div>
                                    <div
                                        className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>{showViewModal?.phone || '—'}</div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={() => setShowViewModal(null)}
                                    className={theme === 'dark' ? 'px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600' : 'px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200'}
                                >
                                    Fermer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showEditModal && selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            className={theme === 'dark' ? 'bg-gray-800 rounded-lg p-6 w-full max-w-lg border border-gray-700' : 'bg-white rounded-lg p-6 w-full max-w-lg border border-gray-200'}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className={theme === 'dark' ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-gray-900'}>Modifier
                                    l'utilisateur</h2>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedUser(null);
                                    }}
                                    className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                                    aria-label="Fermer"
                                >
                                    <X className="w-6 h-6"/>
                                </button>
                            </div>

                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div>
                                    <label
                                        className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        value={formData?.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className={
                                            theme === 'dark'
                                                ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <label
                                        className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData?.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className={
                                            theme === 'dark'
                                                ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                        }
                                    />
                                </div>
                                <div>
                                    <label
                                        className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                        Téléphone
                                    </label>
                                    <input
                                        type="text"
                                        value={formData?.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className={
                                            theme === 'dark'
                                                ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                        }
                                    />
                                </div>
                                <div>
                                    <label
                                        className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                        Rôle
                                    </label>
                                    <select
                                        value={formData?.role_id}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            role_id: e.target.value
                                        })}
                                        className={
                                            theme === 'dark'
                                                ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                        }
                                    >
                                        {roles?.responseData?.data?.map((r: any) => (
                                            <option key={r.id} value={r.id}>
                                                {r.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setSelectedUser(null);
                                        }}
                                        className={theme === 'dark' ? 'px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg' : 'px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg'}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                                    >
                                        {isUpdatingUser ? "Chargement..." : "Enregistrer"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* 🔹 MODALE : Confirmation activation/désactivation - CENTRÉ */}
                {showStatusConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            className={theme === 'dark' ? 'bg-gray-800 rounded-lg p-6 w-full max-w-md' : 'bg-white rounded-lg p-6 w-full max-w-md border border-gray-200'}
                        >
                            <div className="flex items-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-orange-500 mr-3"/>
                                <h2 className={theme === 'dark' ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-gray-900'}>
                                    {isActive(showStatusConfirm) ? 'Désactiver le compte' : 'Activer le compte'}
                                </h2>
                            </div>
                            <p className={theme === 'dark' ? 'text-gray-300 mb-6' : 'text-gray-700 mb-6'}>
                                {isActive(showStatusConfirm)
                                    ? `Êtes-vous sûr de vouloir désactiver le compte de ${showStatusConfirm?.name || showStatusConfirm?.email} ? L'utilisateur ne pourra plus se connecter.`
                                    : `Êtes-vous sûr de vouloir activer le compte de ${showStatusConfirm?.name || showStatusConfirm?.email} ? L'utilisateur pourra à nouveau se connecter.`
                                }
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowStatusConfirm(null)}
                                    className={theme === 'dark' ? 'px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600' : 'px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200'}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => handleUpdateUserStatus(showStatusConfirm)}
                                    className={`px-4 py-2 rounded-lg text-white ${
                                        showStatusConfirm.email_confirmed_at
                                            ? 'bg-orange-600 hover:bg-orange-700'
                                            : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    {isActive(showStatusConfirm) ? 'Désactiver' : 'Activer'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showResetConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            className={theme === 'dark' ? 'bg-gray-800 rounded-lg p-6 w-full max-w-md' : 'bg-white rounded-lg p-6 w-full max-w-md border border-gray-200'}
                        >
                            <div className="flex items-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-amber-400 mr-3"/>
                                <h2 className={theme === 'dark' ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-gray-900'}>Confirmer
                                    la réinitialisation</h2>
                            </div>
                            <p className={theme === 'dark' ? 'text-gray-300 mb-6' : 'text-gray-700 mb-6'}>
                                Voulez-vous envoyer un email de réinitialisation du mot de passe à{' '}
                                <span className="font-semibold text-white">{showResetConfirm.email}</span> ?
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowResetConfirm(null)}
                                    className={theme === 'dark' ? 'px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600' : 'px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200'}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => {
                                        handleConfirmReset([showResetConfirm]);
                                        setShowResetConfirm(null);
                                    }}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                                >
                                    Envoyer l'email
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* 🔹 MODALE : Confirmation suppression - CENTRÉ */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            className={theme === 'dark' ? 'bg-gray-800 rounded-lg p-6 w-full max-w-md' : 'bg-white rounded-lg p-6 w-full max-w-md border border-gray-200'}
                        >
                            <div className="flex items-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-500 mr-3"/>
                                <h2 className={theme === 'dark' ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-gray-900'}>Supprimer
                                    l'utilisateur</h2>
                            </div>
                            <p className={theme === 'dark' ? 'text-gray-300 mb-6' : 'text-gray-700 mb-6'}>
                                Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className={theme === 'dark' ? 'px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600' : 'px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200'}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(showDeleteConfirm)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    {isDeletingUser ? "Chargement..." : "Supprimer"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Section graphiques */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <ChartPanel
                    title="Évolution des utilisateurs"
                    type="line"
                    data={generateChartData()}
                    dataKeys={[
                        {key: 'total', name: 'Total', color: '#3B82F6'},
                        {key: 'actifs', name: 'Actifs', color: '#10B981'},
                    ]}
                    onExpand={() =>
                        setExpandedChart({
                            title: 'Évolution des utilisateurs (6 derniers mois)',
                            type: 'line',
                            data: generateChartData(),
                            dataKeys: [
                                {key: 'total', name: 'Total', color: '#3B82F6'},
                                {key: 'actifs', name: 'Actifs', color: '#10B981'},
                            ],
                        })
                    }
                    theme={theme}
                />
                <ChartPanel
                    title="Répartition par rôle"
                    type="pie"
                    data={getRoleDistribution()}
                    onExpand={() =>
                        setExpandedChart({
                            title: 'Répartition des utilisateurs par rôle',
                            type: 'pie',
                            data: getRoleDistribution(),
                        })
                    }
                    theme={theme}
                />
                <ChartPanel
                    title="Statut des comptes"
                    type="pie"
                    data={getStatusDistribution()}
                    onExpand={() =>
                        setExpandedChart({
                            title: 'Répartition des comptes actifs / inactifs',
                            type: 'pie',
                            data: getStatusDistribution(),
                        })
                    }
                    theme={theme}
                />
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

        </div>
    );
};

export default UsersPage;