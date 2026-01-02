import React, {useState, useEffect, useRef} from 'react';
import {motion} from 'framer-motion';
import {useLocation} from 'react-router-dom';
import {
    Users, Eye, UserCheck, Calendar, Plus, Edit, Trash2,
    AlertTriangle, Shield, X, Crown, Star, User as UserIcon, RefreshCw, KeyRound,
    CheckCircle2, Circle, ToggleLeft, ToggleRight, XCircle
} from 'lucide-react';
import {supabase} from '../../lib/supabase';
import {format, parseISO, subMonths, startOfMonth, endOfMonth} from 'date-fns';
import {fr} from 'date-fns/locale';
import Swal from 'sweetalert2';
import {StatsCard} from '../../components/admin/StatsCard';
import {FilterBar} from '../../components/admin/FilterBar';
import {ChartPanel} from '../../components/admin/ChartPanel';
import {ChartModal} from '../../components/admin/ChartModal';
import {setUserRole, type UserRole} from '../../lib/admin/userRoles';
import {UseGetUsers, UseGetUsersStats} from "../../services";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";

interface CustomRole {
    id: string;
    name: string;
    slug: string;
    description: string;
    is_system: boolean;
    created_at: string;
    created_by?: string;
}

interface User {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
    user_metadata: {
        name?: string;
    };
    profile?: {
        full_name?: string;
        email?: string;
        phone_number?: string;
        company?: string;
        avatar_url?: string;
        is_active?: boolean;
    } | null;
    roles?: string[];
    isAdmin?: boolean;
    isPartner?: boolean;
    customRoles?: string[];
    mainRoleName?: string | null;
}

interface UserStats {
    total: number;
    admins: number;
    users: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    customRoles: number;
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
    const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<UserStats>({
        total: 0,
        admins: 0,
        users: 0,
        active: 0,
        inactive: 0,
        newThisMonth: 0,
        customRoles: 0
    });
    const [displayStats, setDisplayStats] = useState<UserStats>({
        total: 0,
        admins: 0,
        users: 0,
        active: 0,
        inactive: 0,
        newThisMonth: 0,
        customRoles: 0,
    });

    const currentView = location.pathname.includes('/visitors') ? 'visitors' :
        location.pathname.includes('/admins') ? 'admins' : 'all';

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [groupBy, setGroupBy] = useState('');

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [expandedChart, setExpandedChart] = useState<{
        title: string;
        type: 'line' | 'pie';
        data: any[];
        dataKeys?: any[]
    } | null>(null);
    const [showStatusConfirm, setShowStatusConfirm] = useState<User | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState<User | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [canResetPasswords, setCanResetPasswords] = useState<boolean>(false);
    const [userPermissions, setUserPermissions] = useState<{
        can_add: boolean;
        can_edit: boolean;
        can_delete: boolean;
        can_view: boolean;
        can_reset_password: boolean;
        can_toggle_status: boolean;
    }>({
        can_add: false,
        can_edit: false,
        can_delete: false,
        can_view: true,
        can_reset_password: false,
        can_toggle_status: false,
    });
    const [isResetRunning, setIsResetRunning] = useState(false);
    const [resetProgress, setResetProgress] = useState(0);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
        company: '',
        role: 'user' as UserRole
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [roleFormData, setRoleFormData] = useState({
        role: 'user' as UserRole
    });

    const [showViewModal, setShowViewModal] = useState<User | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState<User | null>(null);

    const tableContainerRef = useRef<HTMLDivElement>(null);


    const {isPending: isGettingUsers, data: users, refetch: reGetUsers} = UseGetUsers()


    const ensureProfile = (u: User) => ({
        full_name: u.profile?.full_name ?? (u.user_metadata?.name ?? ''),
        email: u.profile?.email ?? u.email,
        phone_number: u.profile?.phone_number ?? '',
        company: u.profile?.company ?? '',
        avatar_url: u.profile?.avatar_url ?? '',
        is_active: u.profile?.is_active ?? !!u.email_confirmed_at,
    });

    useEffect(() => {
        (async () => {
            await fetchCurrentUserPermissions();
            await fetchUsers();
            await loadCustomRoles();
        })();
    }, []);

    // Pendant le chargement de la liste d'utilisateurs, animer légèrement les compteurs de résumé
    useEffect(() => {
        if (!loading) {
            // Une fois le chargement terminé, on fige les valeurs sur les vraies stats
            setDisplayStats(stats);
            return;
        }

        const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
        const jitter = (value: number, maxDelta: number, min: number, max: number) => {
            const delta = (Math.random() * 2 - 1) * maxDelta; // [-maxDelta, +maxDelta]
            return clamp(Math.round(value + delta), min, max);
        };

        const interval = setInterval(() => {
            setDisplayStats(prev => ({
                ...prev,
                total: jitter(prev.total || 0, 15, 0, 99999),
                admins: jitter(prev.admins || 0, 3, 0, 9999),
                users: jitter(prev.users || 0, 10, 0, 99999),
                active: jitter(prev.active || 0, 10, 0, 99999),
                inactive: jitter(prev.inactive || 0, 5, 0, 99999),
                newThisMonth: jitter(prev.newThisMonth || 0, 5, 0, 9999),
                customRoles: jitter(prev.customRoles || 0, 3, 0, 9999),
            }));
        }, 900);

        return () => clearInterval(interval);
    }, [loading, stats]);

    const effectiveStats = loading ? displayStats : stats;

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

    const fetchCurrentUserPermissions = async () => {
        try {
            const {data: auth} = await supabase.auth.getUser();
            const currentUserId = auth?.user?.id;
            if (!currentUserId) return;

            const {data: sysRolesRes, error: sysRolesError} = await supabase
                .from('user_roles')
                .select('roles:roles(name)')
                .eq('user_id', currentUserId);

            if (sysRolesError) {
                console.warn('Permission check failed (user_roles):', sysRolesError);
                setCanResetPasswords(false);
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
            if (allRoles.length === 0) {
                setCanResetPasswords(false);
                return;
            }

            const {data: perms} = await supabase
                .from('role_permissions')
                .select('*')
                .in('role', allRoles)
                .eq('resource', 'users');

            const aggregated = (perms || []).reduce((acc: any, p: any) => {
                if (p.can_add) acc.can_add = true;
                if (p.can_edit) acc.can_edit = true;
                if (p.can_delete) acc.can_delete = true;
                if (p.can_view) acc.can_view = true;
                if (p.can_reset_password) acc.can_reset_password = true;
                if (p.can_toggle_status) acc.can_toggle_status = true;
                return acc;
            }, {
                can_add: false,
                can_edit: false,
                can_delete: false,
                can_view: false,
                can_reset_password: false,
                can_toggle_status: false,
            });

            // Considérer "admin" au sens fonctionnel : rôle ayant des permissions fortes (ajouter / supprimer / reset mdp)

            setUserPermissions(aggregated);

            const allowedReset = aggregated.can_reset_password === true;
            setCanResetPasswords(allowedReset);
        } catch (e) {
            console.warn('Permission check failed', e);
            // En cas d'erreur de permissions, on laisse quand même la liste se charger
            setCanResetPasswords(false);
        }
    };


    const loadCustomRoles = async () => {
        try {
            const {data, error} = await supabase
                .from('roles')
                .select('*')
                .order('is_system', {ascending: false})
                .order('name');

            if (error) {
                console.warn('Avertissement chargement roles personnalisés:', error);
                setCustomRoles([]);
                return;
            }

            setCustomRoles(data ?? []);
        } catch (err: any) {
            console.error('Erreur chargement roles personnalisés:', err);
            setCustomRoles([]);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);

            const {data, error} = await supabase
                .from('users')
                .select('id, email, full_name, phone_number, company, avatar_url, created_at, status')
                .order('full_name', {ascending: true})
                .order('email', {ascending: true});

            if (error) {
                console.error('[UsersPage] Error fetching users from public.users:', error);
                throw new Error(error.message || 'Erreur lors du chargement des utilisateurs');
            }

            const fetchedUsers: User[] = (data || []).map((u: any) => ({
                id: u.id,
                email: u.email,
                created_at: u.created_at,
                last_sign_in_at: null,
                email_confirmed_at: u.created_at,
                user_metadata: {
                    name: u.full_name || ''
                },
                profile: {
                    full_name: u.full_name || '',
                    email: u.email,
                    phone_number: u.phone_number || '',
                    company: u.company || '',
                    avatar_url: u.avatar_url || '',
                    is_active: (u.status ?? 'active') === 'active',
                },
            }));

            if (fetchedUsers.length === 0) {
                // setUsers([]);
                calculateStats([]);
                return;
            }

            // Charger tous les rôles (via user_roles.role_id -> roles.name, is_system, is_admin) en une seule fois pour éviter N requêtes
            const {data: allUserRoles, error: allUserRolesError} = await supabase
                .from('user_roles')
                .select('user_id, roles:roles(name, is_system, is_admin)');

            if (allUserRolesError) {
                console.warn('[UsersPage] Erreur lors de la récupération globale des rôles système:', allUserRolesError);
            }

            const rolesByUser: Record<string, {
                slug: string;
                name: string;
                is_system: boolean | null;
                is_admin: boolean | null
            }[]> = {};
            (allUserRoles || []).forEach((row: any) => {
                const role = row.roles;
                if (!role || !role.name) return;

                const slug = role.name
                    .toString()
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');

                if (!rolesByUser[row.user_id]) rolesByUser[row.user_id] = [];
                rolesByUser[row.user_id].push({
                    slug,
                    name: role.name,
                    is_system: role.is_system ?? false,
                    is_admin: role.is_admin ?? false,
                });
            });

            const usersWithRoles: User[] = fetchedUsers.map(user => {
                try {
                    const userRoles = rolesByUser[user.id] || [];

                    // Tout rôle marqué is_admin = true est considéré comme rôle administrateur
                    const adminRole = userRoles.find(r => r.is_admin);
                    const partnerRole = userRoles.find(r => r.slug === 'partner');

                    const isAdmin = !!adminRole;
                    const isPartner = !!partnerRole;

                    const customRoleNames = userRoles
                        .filter(r => !r.is_system)
                        .map(r => r.name);

                    const allRoles = userRoles.map(r => r.slug);

                    const mainRoleName =
                        adminRole?.name ||
                        partnerRole?.name ||
                        (customRoleNames[0] ?? null);

                    return {
                        ...user,
                        roles: allRoles,
                        isAdmin,
                        isPartner,
                        customRoles: customRoleNames,
                        mainRoleName,
                    };
                } catch (err) {
                    console.error(`[UsersPage] Erreur pour l'utilisateur ${user.id}:`, err);
                    return {
                        ...user,
                        roles: [],
                        isAdmin: false,
                        isPartner: false,
                        customRoles: []
                    };
                }
            });

            // setUsers(usersWithRoles);
            calculateStats(usersWithRoles);
        } catch (error: any) {
            console.error('[UsersPage] Error fetching users:', error);
            // setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (userList: User[]) => {
        const now = new Date();
        const oneMonthAgo = subMonths(now, 1);

        const stats: UserStats = {
            total: userList.length,
            // Tout rôle admin (roles.is_admin = true) est marqué isAdmin dans fetchUsers, donc admins = isAdmin
            admins: userList.filter(u => u.isAdmin).length,
            // Utilisateur simple : pas admin, pas partner, pas de customRoles
            users: userList.filter(u => !u.isAdmin && !u.isPartner && (!u.customRoles || u.customRoles.length === 0)).length,
            active: userList.filter(u => isActive(u)).length,
            inactive: userList.filter(u => !isActive(u)).length,
            newThisMonth: userList.filter((u: User) => {
                const createdAt = parseISO(u.created_at);
                return createdAt >= oneMonthAgo;
            }).length,
            customRoles: userList.filter(u => u.customRoles && u.customRoles.length > 0 && !u.isAdmin && !u.isPartner).length
        };

        setStats(stats);
    };

    const toggleSelectAll = (checked: boolean, visibleUsers: User[]) => {
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
        if (!canResetPasswords) return;
        const targets = users?.responseData?.data?.filter((u: any) => selectedIds.has(u.id));
        await handleConfirmReset(targets);
    };

    const bulkDelete = async () => {
        if (!userPermissions.can_delete) return;
        for (const id of Array.from(selectedIds)) {
            await handleDeleteUser(id);
        }
        setSelectedIds(new Set());
    };

    const handleConfirmReset = async (targets: User[]) => {
        if (!targets || targets.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Aucun utilisateur sélectionné pour la réinitialisation.'
            });
            return;
        }

        console.log('handleConfirmReset triggered for users:', targets.map(u => u.email));

        try {
            const total = targets.length;
            setIsResetRunning(true);
            setResetProgress(0);

            let completed = 0;
            for (const u of targets) {
                console.log('[MatrixReset] Processing user', u.email);
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
            Swal.fire({
                icon: 'success',
                title: 'Emails envoyés',
                text: `Email de réinitialisation envoyé à ${targets.length} utilisateur${targets.length > 1 ? 's' : ''}`,
                background: '#020617',
                color: '#e5e7eb',
            });
            setSelectedIds(new Set());
        } catch (err: any) {
            console.error('Reset error:', err);
            setIsResetRunning(false);
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: err?.message || 'Erreur lors de la réinitialisation du mot de passe',
                background: '#020617',
                color: '#e5e7eb',
            });
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email || !formData.password || !formData.name) {
            Swal.fire({icon: 'error', title: 'Erreur', text: 'Veuillez remplir tous les champs requis'});
            return;
        }

        const pwdValidation = getPasswordValidation(formData.password, confirmPassword);

        if (!pwdValidation.lengthOk || !pwdValidation.hasUpper || !pwdValidation.hasLower || !pwdValidation.hasDigit || !pwdValidation.hasSpecial) {
            Swal.fire({
                icon: 'error',
                title: 'Mot de passe invalide',
                text: 'Le mot de passe doit contenir au moins 8 caractères, avec des lettres majuscules, minuscules, des chiffres et un caractère spécial.',
            });
            return;
        }

        if (!pwdValidation.match) {
            Swal.fire({icon: 'error', title: 'Erreur', text: 'La confirmation du mot de passe ne correspond pas'});
            return;
        }

        try {
            const {data: authData, error: authError} = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: undefined,
                    data: {
                        full_name: formData.name
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                await new Promise(resolve => setTimeout(resolve, 500));

                const {error: profileError} = await supabase
                    .from('users')
                    .update({
                        full_name: formData.name,
                        phone_number: formData.phone || null,
                        company: formData.company || null
                    })
                    .eq('id', authData.user.id);

                if (profileError) {
                    console.error('Profile update error:', profileError);
                }

                await setUserRole(authData.user.id, formData.role);
            }

            Swal.fire({icon: 'success', title: 'Succès', text: 'Utilisateur ajouté avec succès'});
            setShowAddModal(false);
            setFormData({email: '', password: '', name: '', phone: '', company: '', role: 'user' as UserRole});
            setConfirmPassword('');
            await fetchUsers();
        } catch (error: any) {
            console.error('Error adding user:', error);

            let message = 'Erreur lors de l\'ajout de l\'utilisateur';

            if (typeof error?.message === 'string') {
                if (error.message.includes('Database error saving new user')) {
                    message = 'Erreur de base de données lors de la création du nouvel utilisateur. Vérifiez que le mot de passe respecte les critères de sécurité et que cet email n\'est pas déjà utilisé.';
                } else if (error.message.toLowerCase().includes('password')) {
                    message = 'Le mot de passe ne respecte pas la politique de sécurité. Vérifiez les critères et réessayez.';
                } else if (error.message.toLowerCase().includes('duplicate key value') || error.message.toLowerCase().includes('already exists')) {
                    message = 'Un compte avec cet email existe déjà.';
                }
            }

            Swal.fire({icon: 'error', title: 'Erreur', text: message});
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUser) return;

        if (!formData.name) {
            Swal.fire({icon: 'error', title: 'Erreur', text: 'Le nom est requis'});
            return;
        }

        try {
            const {error} = await supabase
                .from('users')
                .update({
                    full_name: formData.name,
                    phone_number: formData.phone || null,
                    company: formData.company || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedUser.id);

            if (error) {
                console.error('Update error:', error);
                throw new Error('Erreur lors de la mise à jour du profil');
            }

            await setUserRole(selectedUser.id, formData.role);

            Swal.fire({icon: 'success', title: 'Succès', text: 'Utilisateur modifié avec succès'});
            setShowEditModal(false);
            setSelectedUser(null);
            await fetchUsers();
        } catch (error: any) {
            console.error('Error updating user:', error);
            Swal.fire({icon: 'error', title: 'Erreur', text: error.message || 'Erreur lors de la modification'});
        }
    };

    const handleRoleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!showRoleModal) return;

        try {
            await setUserRole(showRoleModal.id, roleFormData.role);

            Swal.fire({icon: 'success', title: 'Succès', text: 'Rôle utilisateur mis à jour avec succès'});
            setShowRoleModal(null);
            setRoleFormData({role: 'user' as UserRole});
            await fetchUsers();
        } catch (error: any) {
            console.error('Error updating user role:', error);
            Swal.fire({icon: 'error', title: 'Erreur', text: error.message || 'Erreur lors de la mise à jour du rôle'});
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            const {data: {session}} = await supabase.auth.getSession();
            if (!session?.access_token) {
                Swal.fire({icon: 'error', title: 'Erreur', text: 'Session expirée'});
                throw new Error('Not authenticated');
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?userId=${userId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Échec de la suppression');
            }

            Swal.fire({icon: 'success', title: 'Succès', text: 'Utilisateur supprimé avec succès'});
            await fetchUsers();
        } catch (error: any) {
            console.error('Error deleting user:', error);
            Swal.fire({icon: 'error', title: 'Erreur', text: error.message || 'Erreur lors de la suppression'});
        } finally {
            setShowDeleteConfirm(null);
        }
    };

    const handleUpdateUserStatus = async (user: User) => {
        if (!userPermissions.can_toggle_status) return;
        const prevIsActive = isActive(user);
        try {
            const newIsActive = !prevIsActive;
            const newStatus = newIsActive ? 'active' : 'inactive';

            // Optimistic UI update
            // setUsers(prev => prev.map(u => (
            //     u.id === user.id ? {...u, profile: {...ensureProfile(u), is_active: newIsActive}} : u
            // )));

            const {error} = await supabase
                .from('users')
                .update({status: newStatus})
                .eq('id', user.id);

            if (error) {
                throw new Error(error.message || 'Échec de la mise à jour du statut');
            }

            Swal.fire({
                icon: 'success',
                title: 'Succès',
                text: `Compte ${newIsActive ? 'activé' : 'désactivé'} avec succès`,
            });
            // Optionnel: rafraîchir pour cohérence serveur
            await fetchUsers();
        } catch (error: any) {
            console.error('Error updating user status:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: error.message || 'Erreur lors de la mise à jour du statut'
            });
            // Revert optimistic UI
            // setUsers(prev => prev.map(u => (
            //     u.id === user.id ? {...u, profile: {...ensureProfile(u), is_active: prevIsActive}} : u
            // )));
        } finally {
            setShowStatusConfirm(null);
        }
    };

    // handleResetPassword remplacé par la réinitialisation directe via handleConfirmReset et la fonction Edge admin-users.

    const getActionItems = (user: User) => [
        {
            label: isActive(user) ? 'Désactiver compte' : 'Activer compte',
            icon: isActive(user) ? ToggleRight : ToggleLeft,
            onClick: () => {
                if (!userPermissions.can_toggle_status) return;
                setShowStatusConfirm(user);
            },
            color: userPermissions.can_toggle_status
                ? (isActive(user) ? 'text-emerald-400' : 'text-red-400')
                : 'text-gray-400',
            bgColor: '',
            borderColor: userPermissions.can_toggle_status
                ? (isActive(user) ? 'border-emerald-500/60' : 'border-red-500/60')
                : 'border-gray-600',
        },
        {
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
            label: 'Modifier',
            icon: Edit,
            onClick: () => {
                //if (!userPermissions.can_edit) return;
                setSelectedUser(user);
                const userRole = getUserMainRole(user);
                setFormData({
                    email: user.email,
                    password: '',
                    name: user.profile?.full_name || user.user_metadata?.name || '',
                    phone: user.profile?.phone_number || '',
                    company: user.profile?.company || '',
                    role: userRole as UserRole
                });
                setShowEditModal(true);
            },
            color: userPermissions.can_edit ? 'text-green-400' : 'text-gray-400',
            bgColor: userPermissions.can_edit ? 'bg-green-500/20' : 'bg-gray-700',
            borderColor: userPermissions.can_edit ? 'border-green-500/30' : 'border-gray-600'
        },
        {
            label: 'Réinitialiser mot de passe',
            icon: KeyRound,
            onClick: () => {
                if (canResetPasswords) setShowResetConfirm(user);
            },
            color: canResetPasswords ? 'text-amber-400' : 'text-gray-400',
            bgColor: canResetPasswords ? 'bg-amber-500/20' : 'bg-gray-700',
            borderColor: canResetPasswords ? 'border-amber-500/30' : 'border-gray-600'
        },
        {
            label: 'Supprimer',
            icon: Trash2,
            onClick: () => {
                setShowDeleteConfirm(user.id);
            },
            color: userPermissions.can_delete ? 'text-red-400' : 'text-gray-400',
            bgColor: userPermissions.can_delete ? 'bg-red-500/20' : 'bg-gray-700',
            borderColor: userPermissions.can_delete ? 'border-red-500/30' : 'border-gray-600'
        }
    ];

    const getUserMainRole = (user: User): string => {
        if (user.isAdmin) return 'admin';
        if (user.isPartner) return 'partner';
        if (user.customRoles && user.customRoles.length > 0) return user.customRoles[0];
        return 'user';
    };

    const filteredUsers = users?.responseData?.data?.filter((user: any) => {
        const profileName = user.profile?.full_name || user.user_metadata?.name || '';
        const email = user.email || '';
        const company = user.profile?.company || '';

        const matchesSearch = profileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !statusFilter ||
            (statusFilter === 'active' && user.email_confirmed_at) ||
            (statusFilter === 'pending' && !user.email_confirmed_at);

        const matchesRole = !roleFilter ||
            (roleFilter === 'admin' && user.isAdmin) ||
            (roleFilter === 'partner' && user.isPartner) ||
            (roleFilter === 'user' && !user.isAdmin && !user.isPartner && (!user.customRoles || user.customRoles.length === 0)) ||
            (roleFilter === 'custom' && user.customRoles && user.customRoles.length > 0);

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
                key = isActive(user) ? 'Actifs' : 'Bloqué';
            } else if (groupBy === 'role') {
                key = user?.role_title
            } else if (groupBy === 'month') {
                key = format(parseISO(user.created_at), 'MMMM yyyy', {locale: fr});
            }

            if (!acc[key]) acc[key] = [];
            acc[key].push(user);
            return acc;
        }, {} as Record<string, User[]>);
    };

    const generateChartData = () => {
        const now = new Date();
        const monthlyData = [];

        for (let i = 5; i >= 0; i--) {
            const currentMonth = subMonths(now, i);
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);

            const monthlyUsers = users?.responseData?.data?.filter((user: any) => {
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

        users?.responseData?.data?.forEach((u: any) => {
            const roleName = u.role_title && u.role_title.trim().length > 0
                ? u.role_title
                : 'Sans rôle';
            counts[roleName] = (counts[roleName] || 0) + 1;
        });

        return Object.entries(counts).map(([name, value]) => ({name, value}));
    };

    const getStatusDistribution = () => {
        const active = users?.responseData?.data?.filter(u => isActive(u)).length;
        const inactive = users?.responseData?.data?.length - active;

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
                    onRefresh={reGetUsers}
                    onAdd={() => {
                        setFormData({
                            email: '',
                            password: '',
                            name: '',
                            phone: '',
                            company: '',
                            role: 'user' as UserRole
                        });
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
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
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
                                            Téléphone
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.phone}
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
                                            Mot de passe
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
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
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                                            className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>Téléphone</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className={theme === 'dark' ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600' : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                            Société
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.company}
                                            onChange={(e) => setFormData({...formData, company: e.target.value})}
                                            className={
                                                theme === 'dark'
                                                    ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                    : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                            }
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label
                                        className={theme === 'dark' ? 'block text-sm text-gray-300 mb-1' : 'block text-sm text-gray-700 mb-1'}>
                                        Rôle
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                                        className={
                                            theme === 'dark'
                                                ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                        }
                                    >
                                        {customRoles.length > 0 ? (
                                            <>
                                                {customRoles
                                                    .filter((r) => r.is_system)
                                                    .map((r) => (
                                                        <option key={r.id} value={r.name}>
                                                            {r.name}
                                                        </option>
                                                    ))}
                                                {customRoles
                                                    .filter((r) => !r.is_system)
                                                    .map((r) => (
                                                        <option key={r.id} value={r.name}>
                                                            {r.name}
                                                        </option>
                                                    ))}
                                            </>
                                        ) : (
                                            <>
                                                <option value="user">Utilisateur (par défaut)</option>
                                                <option value="partner">Partenaire</option>
                                                <option value="admin">Administrateur</option>
                                            </>
                                        )}
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
                                        Enregistrer
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                    <StatsCard
                        title="Total user"
                        value={effectiveStats.total}
                        icon={Users}
                        className="bg-gradient-to-br from-blue-600 to-blue-700"
                        iconClassName="text-white"
                        titleClassName="text-white"
                    />
                    <StatsCard
                        title="Admin"
                        value={effectiveStats.admins}
                        icon={Shield}
                        className="bg-gradient-to-br from-purple-600 to-purple-700"
                        iconClassName="text-white"
                        titleClassName="text-white"
                    />
                    <StatsCard
                        title="Utilisateurs"
                        value={effectiveStats.users}
                        icon={UserIcon}
                        className="bg-gradient-to-br from-green-600 to-green-700"
                        iconClassName="text-white"
                        titleClassName="text-white"
                    />
                    <StatsCard
                        title="Actifs"
                        value={effectiveStats.active}
                        icon={UserCheck}
                        className="bg-gradient-to-br from-emerald-600 to-emerald-700"
                        iconClassName="text-white"
                        titleClassName="text-white"
                    />
                    <StatsCard
                        title="Inactifs"
                        value={effectiveStats.inactive}
                        icon={AlertTriangle}
                        className="bg-gradient-to-br from-red-600 to-red-700"
                        iconClassName="text-white"
                        titleClassName="text-white"
                    />
                    <StatsCard
                        title="Nouveaux"
                        value={effectiveStats.newThisMonth}
                        icon={Calendar}
                        className="bg-gradient-to-br from-orange-600 to-orange-700 text-white"
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
                                disabled={!canResetPasswords}
                                className={`px-3 py-2 rounded-lg border ${
                                    canResetPasswords
                                        ? theme === 'dark'
                                            ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                            : 'bg-amber-50 border-amber-300 text-amber-700'
                                        : theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Réinitialiser mots de passe
                            </button>
                            <button
                                onClick={bulkDelete}
                                disabled={!userPermissions.can_delete}
                                className={`px-3 py-2 rounded-lg border ${
                                    userPermissions.can_delete
                                        ? theme === 'dark'
                                            ? 'bg-red-500/20 border-red-500/30 text-red-400'
                                            : 'bg-red-50 border-red-300 text-red-700'
                                        : theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
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
                            options: [
                                {label: 'Administrateurs', value: 'admin'},
                                {label: 'Partenaires', value: 'partner'},
                                {label: 'Rôles personnalisés', value: 'custom'},
                                {label: 'Utilisateurs', value: 'user'}
                            ],
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
                    {isGettingUsers ? (
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
                                                                        return (
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
                                                                                } ${
                                                                                    userPermissions.can_toggle_status ? '' : 'opacity-40 cursor-not-allowed'
                                                                                }`}
                                                                                title={action.label}
                                                                            >
                                      <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                              isActive(user) ? 'translate-x-6' : 'translate-x-1'
                                          }`}
                                      />
                                                                            </button>
                                                                        )
                                                                    } else {
                                                                        return (<button
                                                                            key={action.label}
                                                                            type="button"
                                                                            onClick={action.onClick}
                                                                            className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-xs font-medium ${
                                                                                action.bgColor
                                                                            } ${action.borderColor} ${action.color} hover:shadow-md hover:-translate-y-0.5 transition transform duration-150`}
                                                                            title={action.label}
                                                                        >
                                                                            <action.icon className="h-4 w-4"/>
                                                                        </button>)
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
                                            {showViewModal.profile?.full_name || showViewModal.user_metadata?.name || showViewModal.email}
                                        </h2>
                                        <p className={theme === 'dark' ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>{showViewModal.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const currentRole = getUserMainRole(showViewModal);
                                            setSelectedUser(showViewModal);
                                            setFormData({
                                                email: showViewModal.email,
                                                password: '',
                                                name: showViewModal.profile?.full_name || showViewModal.user_metadata?.name || '',
                                                phone: showViewModal.profile?.phone_number || '',
                                                company: showViewModal.profile?.company || '',
                                                role: currentRole as UserRole
                                            });
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
                                    <div
                                        className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
                                        {showViewModal.email_confirmed_at ? 'Actif' : 'Inactif'}
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
                                        {showViewModal.last_sign_in_at ? format(parseISO(showViewModal.last_sign_in_at), 'dd/MM/yyyy HH:mm', {locale: fr}) : 'Jamais'}
                                    </div>
                                </div>
                                <div
                                    className={theme === 'dark' ? 'bg-gray-700/50 rounded-lg p-3' : 'bg-gray-50 rounded-lg p-3'}>
                                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Rôles</div>
                                    <div
                                        className={theme === 'dark' ? 'text-white font-medium break-words' : 'text-gray-900 font-medium break-words'}>
                                        {showViewModal.roles && showViewModal.roles.length > 0 ? showViewModal.roles.join(', ') : '—'}
                                    </div>
                                </div>
                                {showViewModal.profile && (
                                    <div
                                        className={theme === 'dark' ? 'md:col-span-2 bg-gray-700/50 rounded-lg p-3' : 'md:col-span-2 bg-gray-50 rounded-lg p-3'}>
                                        <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Société
                                        </div>
                                        <div
                                            className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>{showViewModal.profile.company || '—'}</div>
                                        <div
                                            className={theme === 'dark' ? 'text-gray-400 mt-2' : 'text-gray-500 mt-2'}>Téléphone
                                        </div>
                                        <div
                                            className={theme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'}>{showViewModal.profile.phone_number || '—'}</div>
                                    </div>
                                )}
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
                                        value={formData.name}
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
                                        Téléphone
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
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
                                        Société
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => setFormData({...formData, company: e.target.value})}
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
                                        value={formData.role}
                                        onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                                        className={
                                            theme === 'dark'
                                                ? 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                                : 'w-full bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600'
                                        }
                                    >
                                        <option value="user">Utilisateur</option>
                                        <option value="partner">Partenaire</option>
                                        <option value="admin">Administrateur</option>
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
                                        Enregistrer
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
                                    {showStatusConfirm.email_confirmed_at ? 'Désactiver le compte' : 'Activer le compte'}
                                </h2>
                            </div>
                            <p className={theme === 'dark' ? 'text-gray-300 mb-6' : 'text-gray-700 mb-6'}>
                                {showStatusConfirm.email_confirmed_at
                                    ? `Êtes-vous sûr de vouloir désactiver le compte de ${showStatusConfirm.profile?.full_name || showStatusConfirm.email} ? L'utilisateur ne pourra plus se connecter.`
                                    : `Êtes-vous sûr de vouloir activer le compte de ${showStatusConfirm.profile?.full_name || showStatusConfirm.email} ? L'utilisateur pourra à nouveau se connecter.`
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
                                    {showStatusConfirm.email_confirmed_at ? 'Désactiver' : 'Activer'}
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

                {/* 🔹 MODALE : Attribution de rôle - CENTRÉ */}
                {showRoleModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            className={theme === 'dark' ? 'bg-gray-800 rounded-lg p-6 w-full max-w-md' : 'bg-white rounded-lg p-6 w-full max-w-md border border-gray-200'}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className={theme === 'dark' ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-gray-900'}>Attribuer
                                    un rôle</h2>
                                <button
                                    onClick={() => setShowRoleModal(null)}
                                    className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                                >
                                    <X className="w-6 h-6"/>
                                </button>
                            </div>
                            <form onSubmit={handleRoleUpdate}>
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className={theme === 'dark' ? 'block text-sm font-medium text-gray-300 mb-2' : 'block text-sm font-medium text-gray-700 mb-2'}>
                                            Utilisateur
                                        </label>
                                        <p className={theme === 'dark' ? 'text-white bg-gray-700 rounded-lg px-4 py-2' : 'text-gray-900 bg-gray-100 rounded-lg px-4 py-2'}>
                                            {showRoleModal.profile?.full_name || showRoleModal.user_metadata?.name || showRoleModal.email}
                                        </p>
                                    </div>

                                    {/* Le retrait du rôle admin se fait désormais via la gestion des rôles, pas depuis cette modale. */}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Rôles personnalisés <span className="text-red-500">*</span>
                                        </label>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {customRoles.length > 0 ? (
                                                customRoles.map((customRole) => (
                                                    <label key={customRole.id}
                                                           className={theme === 'dark' ? 'flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer' : 'flex items-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer'}>
                                                        <input
                                                            type="radio"
                                                            name="role"
                                                            value={customRole.name}
                                                            checked={roleFormData.role === customRole.name}
                                                            onChange={(e) => setRoleFormData({role: e.target.value as UserRole})}
                                                            className="mr-3"
                                                        />
                                                        <div
                                                            className={theme === 'dark' ? 'flex items-center text-white' : 'flex items-center text-gray-900'}>
                                                            <Crown className="w-4 h-4 mr-2 text-purple-400"/>
                                                            <div>
                                                                <div className="font-medium">{customRole.name}</div>
                                                                {customRole.description && (
                                                                    <div
                                                                        className={theme === 'dark' ? 'text-xs text-gray-400' : 'text-xs text-gray-500'}>{customRole.description}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))
                                            ) : (
                                                <div
                                                    className={theme === 'dark' ? 'text-center py-4 text-gray-400' : 'text-center py-4 text-gray-500'}>
                                                    <Crown className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                                                    <p>Aucun rôle personnalisé disponible</p>
                                                    <p className="text-sm">Créez d'abord des rôles personnalisés</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowRoleModal(null)}
                                        className={theme === 'dark' ? 'px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600' : 'px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200'}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                        disabled={customRoles.length === 0}
                                    >
                                        Attribuer le rôle
                                    </button>
                                </div>
                            </form>
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
                                    Supprimer
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