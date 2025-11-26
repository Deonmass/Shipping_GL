import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !requireAdmin) {
        setCheckingAdmin(false);
        return;
      }

      try {
        // 1) Récupérer les role_id de l'utilisateur
        const { data: userRoles, error: userRolesError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id);

        if (userRolesError) {
          console.error('Error checking admin access (user_roles):', userRolesError);
          setHasAdminAccess(false);
          return;
        }

        const roleIds = (userRoles ?? []).map((r: any) => r.role_id);

        // 2) Vérifier s'il existe au moins un rôle admin pour ces role_id
        let hasAdminAccess = false;

        if (roleIds.length > 0) {
          const { data: rolesData, error: rolesError } = await supabase
            .from('roles')
            .select('id, is_admin')
            .in('id', roleIds);

          if (rolesError) {
            console.error('Error checking admin access (roles):', rolesError);
            hasAdminAccess = false;
          } else {
            hasAdminAccess = Array.isArray(rolesData)
              && rolesData.some((r: any) => r.is_admin === true);
          }
        }

        setHasAdminAccess(hasAdminAccess);

        if (!hasAdminAccess) {
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        setHasAdminAccess(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, requireAdmin]);

  if (loading || (requireAdmin && checkingAdmin)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={requireAdmin ? "/admin-login" : "/login"} state={{ from: location }} replace />;
  }

  if (requireAdmin && !hasAdminAccess) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
