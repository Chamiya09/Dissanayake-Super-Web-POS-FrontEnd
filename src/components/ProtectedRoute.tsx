import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME } from "@/context/AuthContext";

/**
 * Two-layer guard:
 *  1. If not authenticated  → redirect to /login
 *  2. If allowedRoles given and user's role is not in the list
 *     → redirect to that role's home page (defined in ROLE_HOME)
 *
 * Usage:
 *   <Route element={<ProtectedRoute />}>                        // auth only
 *   <Route element={<ProtectedRoute allowedRoles={["Owner","Manager"]} />}>  // auth + role
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? "/"} replace />;
  }

  return <Outlet />;
}
