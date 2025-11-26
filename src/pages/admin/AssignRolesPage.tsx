import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Shield, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Swal from 'sweetalert2';

interface User {
  id: string;
  email: string;
  full_name: string;
  roles?: string[];
  isAdmin?: boolean;
  isPartner?: boolean;
  customRoles?: string[];
}

interface Role {
  id: string;
  name?: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  is_system: boolean | null;
}

const AssignRolesPage: React.FC = () => {
  const { theme } = useOutletContext<{ theme: 'dark' | 'light' }>();
  const isDark = theme === 'dark';
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserRoleId, setSelectedUserRoleId] = useState<string | null>(null);
  const [privilegedIds, setPrivilegedIds] = useState<Set<string>>(new Set());
  const [userMenuItems, setUserMenuItems] = useState<string[]>([]);
  const [menuLoading, setMenuLoading] = useState<boolean>(false);
  const [menuSaving, setMenuSaving] = useState<boolean>(false);
  const [menuDirty, setMenuDirty] = useState<boolean>(false);

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'users', label: 'Utilisateurs' },
    { key: 'users_assign_roles', label: 'Attribuer rôle' },
    { key: 'users_permissions', label: 'Permissions des rôles' },
    { key: 'partners', label: 'Partenaires' },
    { key: 'posts', label: 'Posts' },
    { key: 'comments', label: 'Commentaires' },
    { key: 'likes', label: 'Likes' },
    { key: 'events', label: 'Événements' },
    { key: 'categories', label: 'Catégories' },
    { key: 'newsletter', label: 'Newsletter' },
    { key: 'services', label: 'Services' },
    { key: 'quote_requests', label: 'Demandes de devis' },
    { key: 'notifications_quote', label: 'Notifications - Demandes de devis' },
    { key: 'notifications_like', label: 'Notifications - Likes' },
    { key: 'notifications_comment', label: 'Notifications - Commentaires' },
    { key: 'notifications_post', label: 'Notifications - Posts' },
    { key: 'notifications_partner', label: 'Notifications - Partenaires' },
    { key: 'notifications_update', label: 'Notifications - Mises à jour du site' },
    { key: 'reports', label: 'Rapports' },
    { key: 'settings', label: 'Paramètres' },
    { key: 'updates', label: 'Mises à jour' },
  ];

  const selectedUser = selectedUserId
    ? users.find((u) => u.id === selectedUserId) || null
    : null;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.debug('[AssignRolesPage] Début loadData');
      await Promise.all([loadUsers(), loadRoles(), loadPrivilegedIds()]);
      console.debug('[AssignRolesPage] Fin loadData (succès)');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .order('full_name', { ascending: true });

      if (error) throw error;

      const mappedUsers: User[] = (data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name || u.email,
      }));

      setUsers(mappedUsers);
    } catch (err: any) {
      console.error('Erreur chargement users:', err);
      Swal.fire({ icon: 'error', title: 'Erreur', text: err?.message || 'Erreur lors du chargement des utilisateurs' });
      setUsers([]);
    }
  };

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, description, created_by, created_at, updated_at, is_system')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRoles(data ?? []);
    } catch (err: any) {
      console.error('Erreur chargement rôles:', err);
      Swal.fire({ icon: 'error', title: 'Erreur', text: err?.message || 'Erreur lors du chargement des rôles' });
      setRoles([]);
    }
  };

  const loadPrivilegedIds = async () => {
    try {
      // Récupérer tous les liens user_roles
      const { data: links, error: linksError } = await supabase
        .from('user_roles')
        .select('user_id, role_id');

      if (linksError) throw linksError;

      const roleIds = (links || []).map((l: any) => l.role_id);
      if (roleIds.length === 0) {
        setPrivilegedIds(new Set());
        return;
      }

      // Récupérer les rôles admin
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id, is_admin')
        .in('id', roleIds)
        .eq('is_admin', true);

      if (rolesError) throw rolesError;

      const adminRoleIds = new Set<string>((rolesData || []).map((r: any) => r.id));
      const ids = new Set<string>((links || [])
        .filter((l: any) => adminRoleIds.has(l.role_id))
        .map((l: any) => l.user_id));

      setPrivilegedIds(ids);
    } catch (e) {
      console.error('Erreur chargement rôles privilégiés:', e);
      setPrivilegedIds(new Set());
    }
  };

  // Charger le rôle actuel de l'utilisateur sélectionné (via user_roles.role_id)
  useEffect(() => {
    const loadSelectedUserRole = async () => {
      if (!selectedUserId) { setSelectedUserRoleId(null); return; }
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', selectedUserId)
          .limit(1);
        if (error) throw error;
        const roleId = (data as { role_id: string }[] | null)?.[0]?.role_id ?? null;
        setSelectedUserRoleId(roleId);
      } catch (e: any) {
        console.error('Erreur chargement rôle utilisateur:', e);
        setSelectedUserRoleId(null);
      }
    };
    loadSelectedUserRole();
  }, [selectedUserId, roles]);

  useEffect(() => {
    const loadUserMenuAccess = async () => {
      if (!selectedUserId) {
        setUserMenuItems([]);
        setMenuDirty(false);
        return;
      }
      try {
        setMenuLoading(true);
        const { data, error } = await supabase
          .from('user_menu_access')
          .select('menu_items')
          .eq('user_id', selectedUserId)
          .maybeSingle();
        if (error) throw error;

        const items = (data?.menu_items as string[] | null) || [];
        setUserMenuItems(items);
        setMenuDirty(false);
      } catch (e: any) {
        console.error('Erreur chargement accès menus utilisateur:', e);
        setUserMenuItems([]);
      } finally {
        setMenuLoading(false);
      }
    };

    loadUserMenuAccess();
  }, [selectedUserId]);

  const toggleMenuForSelectedUser = async (menuKey: string, checked: boolean) => {
    if (!selectedUserId) return;
    try {
      const nextItems = checked
        ? Array.from(new Set([...userMenuItems, menuKey]))
        : userMenuItems.filter((k) => k !== menuKey);

      setUserMenuItems(nextItems);
      setMenuDirty(true);
    } catch (e: any) {
      console.error('Erreur mise à jour accès menus utilisateur:', e);
      Swal.fire({ icon: 'error', title: 'Erreur', text: e?.message || "Erreur lors de la mise à jour des menus de l'utilisateur" });
    }
  };

  const handleSaveMenusForSelectedUser = async () => {
    if (!selectedUserId || !menuDirty) return;
    try {
      setMenuSaving(true);
      const { error } = await supabase
        .from('user_menu_access')
        .upsert(
          {
            user_id: selectedUserId,
            menu_items: userMenuItems,
          },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
      setMenuDirty(false);
      Swal.fire({ icon: 'success', title: 'Succès', text: 'Menus mis à jour pour cet utilisateur' });
    } catch (e: any) {
      console.error('Erreur sauvegarde menus utilisateur:', e);
      Swal.fire({ icon: 'error', title: 'Erreur', text: e?.message || "Erreur lors de l'enregistrement des menus de l'utilisateur" });
    } finally {
      setMenuSaving(false);
    }
  };

  // Attribution / modification du rôle pour l'utilisateur sélectionné via user_roles.role_id
  const assignRoleToSelectedUser = async (roleId: string) => {
    if (!selectedUserId) return;
    try {
      // Vérifier s'il existe déjà une ligne user_roles pour cet utilisateur
      const { data: existing, error: readErr } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedUserId)
        .limit(1);
      if (readErr) throw readErr;

      if (existing && existing.length > 0) {
        const { error: updErr } = await supabase
          .from('user_roles')
          .update({ role_id: roleId })
          .eq('user_id', selectedUserId);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from('user_roles')
          .insert([{ user_id: selectedUserId, role_id: roleId }]);
        if (insErr) throw insErr;
      }
      setSelectedUserRoleId(roleId);
      Swal.fire({ icon: 'success', title: 'Succès', text: 'Rôle attribué' });
    } catch (e: any) {
      console.error('Erreur attribution rôle:', e);
      Swal.fire({ icon: 'error', title: 'Erreur', text: e?.message || 'Erreur lors de l\'attribution du rôle' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={isDark ? 'text-white' : 'text-gray-900'}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Titre & icône */}
      <div className="flex items-center justify-between mt-20">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary-500" />
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Assignation des rôles</h1>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Sélectionnez un utilisateur pour voir les rôles disponibles</p>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${selectedUserId ? 'lg:grid-cols-3' : ''} gap-6`}>
        {/* Colonne Utilisateurs */}
        <div
          className={`rounded-lg p-6 border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-primary-500" />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Utilisateurs
            </h2>
          </div>
          {users.length === 0 ? (
            <p className={isDark ? 'text-gray-300' : 'text-gray-500'}>Aucun utilisateur trouvé.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => {
                const isSelected = selectedUserId === u.id;
                const isPrivileged = privilegedIds.has(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full text-left p-4 rounded-lg flex items-center justify-between transition-colors ${
                      isSelected
                        ? isDark
                          ? 'bg-green-900/40 border border-green-500'
                          : 'bg-green-50 border border-green-500'
                        : isDark
                          ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                          : 'bg-gray-100 hover:bg-gray-50 border border-gray-200'
                    } ${
                      !isSelected && isPrivileged
                        ? isDark
                          ? 'bg-yellow-900/30 border-yellow-500'
                          : 'bg-yellow-50 border-yellow-400'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isPrivileged ? (
                        <Shield className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <Users className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-500'}`} />
                      )}
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {u.full_name || u.email}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{u.email}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne Rôles (table: roles) visible seulement si un utilisateur est sélectionné */}
        {selectedUserId && (
          <>
            <div
              className={`rounded-lg p-6 border flex flex-col gap-4 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-1">
                <Shield className="w-6 h-6 text-primary-500" />
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Rôles</h2>
                  {selectedUser && (
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Pour : <span className="font-medium">{selectedUser.full_name || selectedUser.email}</span>
                    </p>
                  )}
                </div>
              </div>
              {roles.length === 0 ? (
                <p className={isDark ? 'text-gray-300' : 'text-gray-500'}>Aucun rôle trouvé.</p>
              ) : (
                <div className="space-y-2">
                  {roles.map((r) => (
                    <div
                      key={r.id}
                      className={`p-4 rounded-lg flex items-center justify-between ${
                        isDark ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {selectedUserRoleId === r.id && (
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 border border-yellow-400"
                            title="Rôle actuellement attribué à cet utilisateur"
                          >
                            <Star className="w-4 h-4 text-yellow-300" />
                          </span>
                        )}
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{r.name || 'Rôle'}</p>
                      </div>
                      {selectedUserRoleId !== r.id && (
                        <button
                          type="button"
                          onClick={() => assignRoleToSelectedUser(r.id)}
                          className="p-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center"
                          title="Attribuer ce rôle à l'utilisateur sélectionné"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className={`rounded-lg p-6 border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-1">
                <Shield className="w-6 h-6 text-primary-500" />
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Menus visibles</h2>
                  {selectedUser && (
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Pour : <span className="font-medium">{selectedUser.full_name || selectedUser.email}</span>
                    </p>
                  )}
                </div>
              </div>

              {menuLoading ? (
                <p className={isDark ? 'text-gray-300' : 'text-gray-500'}>Chargement des menus...</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {menuItems.map((item) => (
                      <label
                        key={item.key}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${
                          isDark
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</span>
                        <input
                          type="checkbox"
                          className={`w-5 h-5 cursor-pointer rounded-sm border-2 text-emerald-500 accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-1 ${
                            isDark ? 'border-emerald-400 bg-gray-800' : 'border-emerald-500 bg-white'
                          }`}
                          checked={userMenuItems.includes(item.key)}
                          onChange={(e) => toggleMenuForSelectedUser(item.key, e.target.checked)}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveMenusForSelectedUser}
                      disabled={!menuDirty || menuSaving}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                        !menuDirty || menuSaving
                          ? isDark
                            ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      {menuSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssignRolesPage;
 
