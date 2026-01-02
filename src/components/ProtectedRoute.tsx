import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {AdminContext} from "../contexts/AdminContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const {currentUser} = useContext(AdminContext);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to={requireAdmin ? "/admin-login" : "/login"} state={{ from: location }} replace />;
  }

  if (requireAdmin && (!currentUser.token)) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;