import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Renders nested routes (<Outlet />) only when the user is authenticated.
 * Unauthenticated visitors are redirected to /login, preserving the
 * originally requested path so they can be sent back after login.
 */
export default function ProtectedRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
