import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import OwnerDashboard from "./OwnerDashboard";
import ManagerDashboard from "./ManagerDashboard";
import StaffDashboard from "./StaffDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();

  if (role === "OWNER") return <OwnerDashboard />;
  if (role === "MANAGER") return <ManagerDashboard />;
  if (role === "STAFF") return <StaffDashboard />;

  return <Navigate to="/" replace />;
}
