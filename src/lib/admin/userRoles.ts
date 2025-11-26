import { supabase } from '../supabase';
import toast from 'react-hot-toast';

export type UserRole = 'admin' | 'user' | 'partner' | string;

const getRoleIdByName = async (name: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('role')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  if (error) {
    console.error('getRoleIdByName error', error);
    return null;
  }
  return data?.id ?? null;
};

export const addRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    const roleId = await getRoleIdByName(role);
    if (!roleId) throw new Error(`Rôle introuvable: ${role}`);

    const { data: existing } = await supabase
      .from('user_role')
      .select('id')
      .eq('user_id', userId)
      .eq('role_id', roleId)
      .maybeSingle();

    if (existing) {
      toast(`L'utilisateur a déjà le rôle ${role}`);
      return false;
    }

    const { error } = await supabase
      .from('user_role')
      .insert([{ user_id: userId, role_id: roleId }]);

    if (error) throw error;

    toast.success(`Rôle ${role} ajouté avec succès`);
    return true;
  } catch (error: any) {
    console.error('Error adding role:', error);
    toast.error(error.message || 'Erreur lors de l\'ajout du rôle');
    return false;
  }
};

export const addAdminRole = async (userId: string): Promise<boolean> => {
  return addRole(userId, 'admin');
};

export const removeRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    if (role === 'admin') {
      const adminRoleId = await getRoleIdByName('admin');
      if (!adminRoleId) throw new Error('Rôle admin introuvable');
      const { count } = await supabase
        .from('user_role')
        .select('id', { count: 'exact', head: true })
        .eq('role_id', adminRoleId);
      if (count !== null && count <= 1) {
        toast.error('Impossible de retirer le dernier administrateur');
        return false;
      }
    }

    const roleId = await getRoleIdByName(role);
    if (!roleId) throw new Error(`Rôle introuvable: ${role}`);

    const { error } = await supabase
      .from('user_role')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) throw error;

    toast.success(`Rôle ${role} retiré avec succès`);
    return true;
  } catch (error: any) {
    console.error('Error removing role:', error);
    toast.error(error.message || 'Erreur lors du retrait du rôle');
    return false;
  }
};

export const removeAdminRole = async (userId: string): Promise<boolean> => {
  return removeRole(userId, 'admin');
};

export const setUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    // Manage only system base roles here (admin, user, partner)
    const baseRoles: UserRole[] = ['admin', 'user', 'partner'];

    if (!baseRoles.includes(role)) {
      // For custom roles, just ensure it's added, do not remove others
      return addRole(userId, role);
    }

    // Ensure target role exists
    const roleId = await getRoleIdByName(role);
    if (!roleId) throw new Error(`Rôle introuvable: ${role}`);

    // Add it if not present
    await addRole(userId, role);

    // Remove other base roles (but keep admin safeguard)
    for (const r of baseRoles) {
      if (r === role) continue;
      if (r === 'admin') {
        // ensure not last admin
        const adminRoleId = await getRoleIdByName('admin');
        if (adminRoleId) {
          const { count } = await supabase
            .from('user_role')
            .select('id', { count: 'exact', head: true })
            .eq('role_id', adminRoleId);
          if (count !== null && count <= 1) {
            continue;
          }
        }
      }
      // Remove base role r for this user if present
      const rId = await getRoleIdByName(r);
      if (rId) {
        await supabase.from('user_role').delete().eq('user_id', userId).eq('role_id', rId);
      }
    }

    return true;
  } catch (error: any) {
    console.error('Error setting user role:', error);
    return false;
  }
};

export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const adminRoleId = await getRoleIdByName('admin');
    if (!adminRoleId) return false;
    const { data } = await supabase
      .from('user_role')
      .select('id')
      .eq('user_id', userId)
      .eq('role_id', adminRoleId)
      .maybeSingle();
    return !!data;
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
};

export const getUserRoles = async (userId: string): Promise<string[]> => {
  try {
    const { data: links, error: e1 } = await supabase
      .from('user_role')
      .select('role_id')
      .eq('user_id', userId);
    if (e1) throw e1;
    const roleIds = links?.map(l => l.role_id) || [];
    if (roleIds.length === 0) return [];
    const { data: roles, error: e2 } = await supabase
      .from('role')
      .select('id, name')
      .in('id', roleIds);
    if (e2) throw e2;
    return roles?.map(r => r.name) || [];
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
};

export const addCustomRole = async (userId: string, roleName: string): Promise<boolean> => {
  // Alias of addRole with name lookup
  return addRole(userId, roleName);
};

export const removeCustomRole = async (userId: string, roleName: string): Promise<boolean> => {
  return removeRole(userId, roleName);
};

export const getCustomUserRoles = async (userId: string): Promise<string[]> => {
  try {
    // Return non-system roles names for the user
    const { data: links, error: e1 } = await supabase
      .from('user_role')
      .select('role_id')
      .eq('user_id', userId);
    if (e1) throw e1;
    const roleIds = links?.map(l => l.role_id) || [];
    if (roleIds.length === 0) return [];
    const { data: roles, error: e2 } = await supabase
      .from('role')
      .select('id, name, is_system')
      .in('id', roleIds);
    if (e2) throw e2;
    return roles?.filter(r => !r.is_system).map(r => r.name) || [];
  } catch (error) {
    console.error('Error getting custom user roles:', error);
    return [];
  }
};
