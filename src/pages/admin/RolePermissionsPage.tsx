import React, {useState, useEffect} from 'react';
import {useOutletContext} from 'react-router-dom';
import {motion} from 'framer-motion';
import {Shield, Save, RefreshCw, Plus, Trash2, AlertTriangle, X, Pencil, Pin, MoreVertical} from 'lucide-react';
import {supabase} from '../../lib/supabase';
import Swal from 'sweetalert2';
import {UseAddRole, UseDeleteRole, UseGetRoles} from "../../services";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {permissionsOperations} from "../../constants";
import {UseGetAppPermissions} from "../../services/queries/UsersQueries.ts";

interface Permission {
    id: string;
    role: string;
    resource: string;
    can_add: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_view: boolean;
    can_reset_password?: boolean;
    can_toggle_status?: boolean;
}

interface CustomRole {
    id: string;
    name: string;
    slug: string;
    description: string;
    created_at: string;
    is_admin?: boolean;
}

const RolePermissionsPage: React.FC = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>();
    const {data: roles, isPending: isGettingRoles, refetch: reGetRoles} = UseGetRoles()
    const {data: addResult, mutate: addRole, isPending: isAddingRole} = UseAddRole()
    const {data: deleteResult, mutate: deleteRole, isPending: isDeletingRole} = UseDeleteRole()
    const {data: permissions, isPending: isGettingPermissions} = UseGetAppPermissions()

    // const [permissions, setPermissions] = useState<Permission[]>([]);
    const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
    const [saving, setSaving] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [showAddRoleModal, setShowAddRoleModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [newRole, setNewRole] = useState({title: '', description: ''});
    const [newRoleIsAdmin, setNewRoleIsAdmin] = useState<boolean>(true);
    const [showEditRoleModal, setShowEditRoleModal] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<{ name: string; description: string }>({name: '', description: ''});
    const [pinnedSlugs, setPinnedSlugs] = useState<Set<string>>(new Set());
    const [actionMenuRoleId, setActionMenuRoleId] = useState<string | null>(null);

    const resources = ['posts', 'comments', 'users', 'events', 'categories', 'likes', 'newsletter', 'services', 'menu_visibility'];
    const [allRoles, setAllRoles] = useState<string[]>([]);

    useEffect(() => {
        // fetchCustomRoles();
        // fetchPermissions();
    }, []);

    useEffect(() => {
        // sort with pinned first then by name
        const sorted = [...customRoles].sort((a, b) => {
            const ap = pinnedSlugs.has(a.slug) ? 0 : 1;
            const bp = pinnedSlugs.has(b.slug) ? 0 : 1;
            if (ap !== bp) return ap - bp;
            return a.name.localeCompare(b.name);
        });
        const slugs = sorted.map(r => r.slug);
        setAllRoles(slugs);
    }, [customRoles, pinnedSlugs]);

    useEffect(() => {
        if (addResult) {
            if (addResult?.responseData?.error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: addResult?.responseData?.message || "Erreur lors de l'enregistrement"
                });
            } else {
                reGetRoles()
                Swal.fire({
                    icon: 'success',
                    title: 'Succès',
                    text: 'Rôle créé avec succès',
                    background: isDark ? '#020617' : '#ffffff',
                    color: isDark ? '#e5e7eb' : '#111827',
                    confirmButtonColor: '#22c55e',
                });
                setNewRole({title: '', description: ''});
                setShowAddRoleModal(false);
            }
        }

    }, [addResult]);

    const fetchCustomRoles = async () => {
        try {
            const {data, error} = await supabase
                .from('roles')
                .select('id, name, description, created_at, is_admin')
                .order('created_at', {ascending: true});

            if (error) throw error;
            const mapped = (data || [])
                .filter((r: any) => r.is_admin)
                .map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    slug: (r.name || '')
                        .toString()
                        .trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, ''),
                    description: r.description || '',
                    created_at: r.created_at,
                    is_admin: r.is_admin,
                }));
            setCustomRoles(mapped);
        } catch (error: any) {
            console.error('Error fetching custom roles:', error);
            Swal.fire({icon: 'error', title: 'Erreur', text: 'Erreur lors du chargement des rôles personnalisés'});
        }
    };

    const fetchPermissions = async () => {
        try {
            const {data, error} = await supabase
                .from('role_permissions')
                .select('*')
                .order('role', {ascending: true});

            if (error) throw error;

            const normalized = (data || []).map((p: any) => ({
                ...p,
                can_reset_password: p.can_reset_password ?? false,
                can_toggle_status: p.can_toggle_status ?? false,
            }));

            setPermissions(normalized);
        } catch (error: any) {
            console.error('Error fetching permissions:', error);
            Swal.fire({icon: 'error', title: 'Erreur', text: 'Erreur lors du chargement des permissions'});
        } finally {
        }
    };

    const handlePermissionChange = (role: string, resource: string, field: keyof Permission, value: boolean) => {
        setPermissions(prevPermissions => {
            const existingIndex = prevPermissions.findIndex(
                p => p.role === role && p.resource === resource
            );

            if (existingIndex >= 0) {
                const updated = [...prevPermissions];
                updated[existingIndex] = {...updated[existingIndex], [field]: value};
                return updated;
            } else {
                return [
                    ...prevPermissions,
                    {
                        id: `temp-${role}-${resource}`,
                        role,
                        resource,
                        can_add: field === 'can_add' ? value : false,
                        can_edit: field === 'can_edit' ? value : false,
                        can_delete: field === 'can_delete' ? value : false,
                        can_view: field === 'can_view' ? value : true,
                        can_reset_password: field === 'can_reset_password' ? value : false,
                        can_toggle_status: field === 'can_toggle_status' ? value : false,
                    }
                ];
            }
        });
    };

    const getPermission = (role: string, resource: string, field: keyof Permission): boolean => {
        const perm = permissions.find(p => p.role === role && p.resource === resource);
        return perm ? (perm[field] as boolean) : false;
    };

    const handleAddRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRole.title.trim()) {
            Swal.fire({icon: 'error', title: 'Erreur', text: 'Le nom du rôle est requis'});
            return;
        }

        addRole({
            title: newRole.title,
            description: newRole.description,
        })
    };

    const handleDeleteRole = async (roleId: string) => {
        console.log(roleId)
        return
        try {
            const roleToDelete = customRoles.find(r => r.id === roleId);
            if (!roleToDelete) return;

            await supabase
                .from('role_permissions')
                .delete()
                .eq('role', roleToDelete.slug);

            const {error} = await supabase
                .from('roles')
                .delete()
                .eq('id', roleId);

            if (error) throw error;

            Swal.fire({icon: 'success', title: 'Succès', text: 'Rôle supprimé avec succès'});
            await fetchCustomRoles();
            await fetchPermissions();
            setSelectedRole(''); // reset, will be set from fetched roles
        } catch (error: any) {
            console.error('Error deleting role:', error);
            Swal.fire({icon: 'error', title: 'Erreur', text: error.message || 'Erreur lors de la suppression'});
        } finally {
            setShowDeleteConfirm(null);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const total = permissions.length || 1;
            let current = 0;

            // SweetAlert de progression (adapté au thème)
            Swal.fire({
                title: 'Enregistrement des permissions',
                html: `
          <div class="w-full ${isDark ? 'bg-green-900/40' : 'bg-emerald-100'} rounded-full h-2 mt-3 overflow-hidden">
            <div id="swal-progress-bar" class="bg-gradient-to-r from-green-400 via-emerald-300 to-green-500 h-2 rounded-full" style="width:0%"></div>
          </div>
          <div class="mt-3 text-lg font-semibold ${isDark ? 'text-green-400' : 'text-emerald-600'}"><span id="swal-progress-text">0%</span></div>
        `,
                background: isDark ? '#020617' : '#ffffff',
                color: isDark ? '#e5e7eb' : '#111827',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    // légère animation d'apparition
                    const popup = Swal.getPopup();
                    if (popup) {
                        popup.style.animation = 'swal-matrix-in 0.4s ease-out';
                    }
                },
                willClose: () => {
                    const popup = Swal.getPopup();
                    if (popup) {
                        popup.style.animation = 'swal-matrix-out 0.25s ease-in';
                    }
                },
            });

            for (const perm of permissions) {
                const isTemp = !perm.id || String(perm.id).startsWith('temp-');

                if (isTemp) {
                    const {error} = await supabase
                        .from('role_permissions')
                        .insert({
                            role: perm.role,
                            resource: perm.resource,
                            can_add: perm.can_add,
                            can_edit: perm.can_edit,
                            can_delete: perm.can_delete,
                            can_view: perm.can_view,
                            can_reset_password: perm.can_reset_password ?? false,
                            can_toggle_status: perm.can_toggle_status ?? false,
                        });
                    if (error) throw error;
                } else {
                    const {error} = await supabase
                        .from('role_permissions')
                        .update({
                            can_add: perm.can_add,
                            can_edit: perm.can_edit,
                            can_delete: perm.can_delete,
                            can_view: perm.can_view,
                            can_reset_password: perm.can_reset_password ?? false,
                            can_toggle_status: perm.can_toggle_status ?? false,
                        })
                        .eq('id', perm.id);
                    if (error) throw error;
                }

                // mise à jour de la progression
                current += 1;
                const percent = Math.round((current / total) * 100);
                const container = Swal.getHtmlContainer();
                if (container) {
                    const bar = container.querySelector('#swal-progress-bar') as HTMLDivElement | null;
                    const text = container.querySelector('#swal-progress-text') as HTMLSpanElement | null;
                    if (bar) bar.style.width = `${percent}%`;
                    if (text) text.textContent = `${percent}%`;
                }
            }

            Swal.close();

            await Swal.fire({
                icon: 'success',
                title: 'Succès',
                text: 'Permissions enregistrées avec succès',
                background: isDark ? '#020617' : '#ffffff',
                color: isDark ? '#e5e7eb' : '#111827',
                confirmButtonColor: '#22c55e',
            });
            fetchPermissions();
        } catch (error: any) {
            console.error('Error saving permissions:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: error.message || 'Erreur lors de l\'enregistrement',
                background: isDark ? '#020617' : '#ffffff',
                color: isDark ? '#e5e7eb' : '#111827',
                confirmButtonColor: '#dc2626',
            });
        } finally {
            setSaving(false);
        }
    };

    const getRoleName = (slug: string): string => {
        const customRole = customRoles.find(r => r.slug === slug);
        return customRole?.name || slug;
    };

    const getRoleDescription = (roleSlug: string): string => {
        const actionMap: { [key: string]: string } = {
            can_view: 'voir',
            can_add: 'ajouter',
            can_edit: 'modifier',
            can_delete: 'supprimer',
            can_reset_password: 'réinitialiser les mots de passe des utilisateurs',
            can_toggle_status: 'activer ou désactiver les comptes utilisateurs',
        };

        const resourcesWithActions: string[] = [];

        resources.forEach(resource => {
            const perms = permissions.find(p => p.role === roleSlug && p.resource === resource);
            if (!perms) return;

            const actions: string[] = [];
            Object.keys(actionMap).forEach(key => {
                if (perms[key as keyof Permission]) actions.push(actionMap[key]);
            });

            if (actions.length > 0) {
                resourcesWithActions.push(`${actions.join(' et ')} ${resource}`);
            }
        });

        if (resourcesWithActions.length === 0) return 'Ce rôle n’a aucune permission assignée.';

        // Formate avec virgule et "et" avant le dernier élément
        if (resourcesWithActions.length === 1) return `Ce rôle peut ${resourcesWithActions[0]}.`;
        const last = resourcesWithActions.pop();
        return `Ce rôle peut ${resourcesWithActions.join(', ')} et ${last}.`;
    };

    if (isGettingRoles || isGettingPermissions) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div
                    className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    const isDark = theme === 'dark';

    const formatResourceName = (resource: string) => {
        const resourceNames: { [key: string]: string } = {
            'menu_visibility': 'Visibilité des menus',
            'users_assign_roles': 'Attribuer des rôles',
            'users_permissions': 'Gérer les permissions',
            // Ajoutez d'autres mises en forme personnalisées si nécessaire
        };

        return resourceNames[resource] || resource.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <div className="p-6 space-y-6">
            <AdminPageHeader
                Icon={<Shield className="w-6 h-6 text-primary-500"/>}
                title="Gestion des Permissions"
                onRefresh={async () => {
                    await reGetRoles()
                }}
            />

            <div className="flex space-x-6">
                {/* Liste des rôles */}
                <div
                    className={`w-1/4 rounded-lg border p-4 flex flex-col ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                >
                    <h2 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Rôles</h2>
                    <div className="space-y-2">
                        {roles?.responseData?.data?.map((role: any) => {
                            //const r = customRoles.find(cr => cr.slug === roleSlug);
                            //if (!r) return null;
                            //const pinned = pinnedSlugs.has(roleSlug);
                            return (
                                <div
                                    key={role?.id}
                                    className={`rounded-lg border transition-colors ${
                                        selectedRole === role?.id
                                            ? isDark
                                                ? 'border-primary-500 bg-primary-600/20 hover:bg-primary-600/30'
                                                : 'border-primary-600 bg-primary-50 hover:bg-primary-100'
                                            : isDark
                                                ? 'border-gray-700 bg-gray-700 hover:bg-gray-600'
                                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <button
                                            onClick={() => setSelectedRole(role?.id)}
                                            className={`text-left font-medium truncate flex-1 ${
                                                isDark ? 'text-white' : 'text-gray-900'
                                            }`}
                                        >
                                            {role?.title}
                                        </button>
                                        <div className="relative flex items-center ml-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActionMenuRoleId(prev => (prev === role ? null : role))
                                                }
                                                className={`p-1 rounded hover:bg-gray-100 ${
                                                    isDark
                                                        ? 'text-gray-300 hover:text-white hover:bg-gray-600'
                                                        : 'text-gray-500 hover:text-gray-900'
                                                }`}
                                                title="Actions du rôle"
                                            >
                                                <MoreVertical className="w-4 h-4"/>
                                            </button>
                                            {actionMenuRoleId === role && (
                                                <div
                                                    className={`absolute right-0 top-7 w-40 rounded-lg shadow-lg z-10 border ${
                                                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${
                                                            isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700'
                                                        }`}
                                                        onClick={() => {
                                                            setPinnedSlugs(prev => {
                                                                const n = new Set(prev);
                                                                if (n.has(role)) n.delete(role); else n.add(role);
                                                                return n;
                                                            });
                                                            setActionMenuRoleId(null);
                                                        }}
                                                    >
                                                        <Pin className="w-4 h-4"/>
                                                        <span>{role ? 'Désépingler' : 'Épingler'}</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="w-full px-3 py-2 text-sm flex items-center gap-2 text-gray-700 hover:bg-gray-50"
                                                        onClick={() => {
                                                            setShowEditRoleModal(role.id);
                                                            setEditRole({
                                                                name: role.title,
                                                                description: role.description
                                                            });
                                                            setActionMenuRoleId(null);
                                                        }}
                                                    >
                                                        <Pencil className="w-4 h-4"/>
                                                        <span>Modifier</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-red-50 ${
                                                            isDark ? 'text-red-400 hover:bg-red-950/40' : 'text-red-600'
                                                        }`}
                                                        onClick={() => {
                                                            setShowDeleteConfirm(role.id);
                                                            setActionMenuRoleId(null);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4"/>
                                                        <span>Supprimer</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => setShowAddRoleModal(true)}
                        className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                    >
                        <Plus className="w-4 h-4 mr-2"/>
                        Ajouter un rôle
                    </button>
                </div>

                {/* Tableau des permissions */}
                <div
                    className={`flex-1 overflow-auto rounded-lg border p-4 flex flex-col ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr>
                                <th
                                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider sticky left-0 ${
                                        isDark
                                            ? 'text-gray-200 bg-gray-900/40'
                                            : 'text-gray-700 bg-gray-100'
                                    }`}
                                >
                                    Ressource
                                </th>
                                {permissionsOperations.map(
                                    (operation) => (
                                        <th
                                            key={operation.id}
                                            className={`px-4 py-3 text-center text-xs font-medium ${
                                                isDark ? 'text-gray-200' : 'text-gray-700'
                                            }`}
                                        >
                                            {operation.title}
                                        </th>
                                    ),
                                )}
                            </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                            {permissions?.responseData?.data.map((permission: any) => (
                                <tr
                                    key={permission.id}
                                    className={`${isDark ? 'hover:bg-gray-700/60' : 'hover:bg-gray-50'}`}
                                >
                                    <td
                                        className={`px-6 py-4 font-medium sticky left-0 ${
                                            isDark ? 'text-white bg-gray-800' : 'text-gray-900 bg-white'
                                        }`}
                                    >
                                        {permission.title}
                                    </td>
                                    {permissionsOperations.map((permField) => (
                                        <td key={permField.id} className="px-4 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                //checked={getPermission(selectedRole, resource, permField as keyof Permission)}
                                                // onChange={(e) =>
                                                //     handlePermissionChange(
                                                //         selectedRole,
                                                //         resource,
                                                //         permField as keyof Permission,
                                                //         e.target.checked,
                                                //     )
                                                // }
                                                onChange={console.log}
                                                className={`w-5 h-5 cursor-pointer rounded-sm border-2 text-emerald-500 accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-1 ${
                                                    isDark
                                                        ? 'border-emerald-400 bg-gray-800'
                                                        : 'border-emerald-500 bg-white'
                                                }`}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <div
                        className={`flex justify-end pt-4 mt-2 border-t ${
                            isDark ? 'border-gray-700' : 'border-gray-100'
                        }`}
                    >
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-5 py-2.5 bg-primary-600 rounded-lg text-white flex items-center gap-2 hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                        >
                            <Save className="w-4 h-4"/> {saving ? 'Enregistrement...' : 'Enregistrer les permissions'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Légende dynamique */}
            {selectedRole && (
                <div
                    className={`rounded-lg border p-4 mt-4 ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                >
                    <h3
                        className={`text-lg font-semibold mb-2 ${
                            isDark ? 'text-white' : 'text-gray-900'
                        }`}
                    >
                        Permissions du rôle "{getRoleName(selectedRole)}"
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {getRoleDescription(selectedRole)}
                    </p>
                </div>
            )}

            {/* Modale édition rôle */}
            {showEditRoleModal && (() => {
                const role = customRoles.find(r => r.id === showEditRoleModal);
                const oldSlug = role?.slug || '';
                const onSubmit = async (e: React.FormEvent) => {
                    e.preventDefault();
                    try {
                        if (!role) return;
                        const newName = editRole.name.trim();
                        if (!newName) {
                            Swal.fire({icon: 'error', title: 'Erreur', text: 'Le nom du rôle est requis'});
                            return;
                        }
                        const newSlug = newName; // slug = name comme demandé
                        // Update roles
                        const {error: updErr} = await supabase
                            .from('roles')
                            .update({name: newName, slug: newSlug, description: editRole.description})
                            .eq('id', role.id);
                        if (updErr) throw updErr;
                        // Propager vers role_permissions
                        if (oldSlug && oldSlug !== newSlug) {
                            const {error: rpErr} = await supabase
                                .from('role_permissions')
                                .update({role: newSlug})
                                .eq('role', oldSlug);
                            if (rpErr) throw rpErr;
                        }
                        Swal.fire({icon: 'success', title: 'Succès', text: 'Rôle modifié avec succès'});
                        setShowEditRoleModal(null);
                        await fetchCustomRoles();
                        await fetchPermissions();
                        setSelectedRole(newSlug);
                    } catch (e: any) {
                        console.error('Error editing role:', e);
                        Swal.fire({
                            icon: 'error',
                            title: 'Erreur',
                            text: e?.message || 'Erreur lors de la modification'
                        });
                    }
                };
                return (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <motion.div
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            className={`rounded-lg p-6 max-w-md w-full mx-4 border ${
                                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Modifier le rôle
                                </h2>
                                <button
                                    onClick={() => setShowEditRoleModal(null)}
                                    className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}
                                >
                                    <X className="w-6 h-6"/>
                                </button>
                            </div>
                            <form onSubmit={onSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className={`block text-sm font-medium mb-2 ${
                                                isDark ? 'text-gray-300' : 'text-gray-700'
                                            }`}
                                        >
                                            Nom du rôle <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={editRole.name}
                                            onChange={(e) => setEditRole({...editRole, name: e.target.value})}
                                            className={`w-full rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                                isDark
                                                    ? 'bg-gray-700 border-gray-600 text-white'
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
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
                                            rows={3}
                                            value={editRole.description}
                                            onChange={(e) => setEditRole({...editRole, description: e.target.value})}
                                            className={`w-full rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                                isDark
                                                    ? 'bg-gray-700 border-gray-600 text-white'
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditRoleModal(null)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                            isDark
                                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
                                    >
                                        Enregistrer
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                );
            })()}

            {/* Modale création rôle */}
            {showAddRoleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className={`rounded-lg p-6 max-w-md w-full mx-4 border ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Créer un nouveau rôle
                            </h2>
                            <button
                                onClick={() => setShowAddRoleModal(false)}
                                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                        <form onSubmit={handleAddRole}>
                            <div className="space-y-4">
                                <div>
                                    <label
                                        className={`block text-sm font-medium mb-2 ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}
                                    >
                                        Nom du rôle <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newRole.title}
                                        onChange={(e) => setNewRole({...newRole, title: e.target.value})}
                                        className={`w-full rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                            isDark
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                        placeholder="Ex: Modérateur"
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
                                        value={newRole.description}
                                        onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                                        rows={3}
                                        className={`w-full rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                            isDark
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                        placeholder="Décrivez les responsabilités de ce rôle..."
                                    />
                                </div>
                                {/*<div className="flex items-center justify-between pt-2">*/}
                                {/*  <span*/}
                                {/*    className={`text-sm ${*/}
                                {/*      isDark ? 'text-gray-300' : 'text-gray-700'*/}
                                {/*    }`}*/}
                                {/*  >*/}
                                {/*    Rôle administrateur*/}
                                {/*  </span>*/}
                                {/*  <label className="inline-flex items-center cursor-pointer">*/}
                                {/*    <span className="relative">*/}
                                {/*      <input*/}
                                {/*        type="checkbox"*/}
                                {/*        checked={newRoleIsAdmin}*/}
                                {/*        onChange={(e) => setNewRoleIsAdmin(e.target.checked)}*/}
                                {/*        className="sr-only peer"*/}
                                {/*      />*/}
                                {/*      <div*/}
                                {/*        className="w-10 h-5 rounded-full border transition-colors peer-checked:bg-emerald-500 peer-checked:border-emerald-500 border-gray-400 bg-gray-200"*/}
                                {/*      ></div>*/}
                                {/*      <div*/}
                                {/*        className="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transform transition-transform peer-checked:translate-x-5"*/}
                                {/*      ></div>*/}
                                {/*    </span>*/}
                                {/*  </label>*/}
                                {/*</div>*/}
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddRoleModal(false)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        isDark
                                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
                                >
                                    {isAddingRole ? "Chargement ..." : "Créer"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Modale suppression rôle */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className={`rounded-lg p-6 max-w-md w-full mx-4 border ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}
                    >
                        <div className="flex items-center mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-500 mr-2"/>
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Confirmer la suppression
                            </h3>
                        </div>
                        <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Êtes-vous sûr de vouloir supprimer ce rôle ? Toutes les permissions associées seront
                            également supprimées.
                            Cette action est irréversible.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    isDark
                                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleDeleteRole(showDeleteConfirm!)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                                Supprimer
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default RolePermissionsPage;
