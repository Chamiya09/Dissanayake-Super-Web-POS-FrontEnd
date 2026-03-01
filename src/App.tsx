import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { AppHeader } from "@/components/Layout/AppHeader";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Suppliers from "./pages/Suppliers";
import ProductManagement from "./pages/ProductManagement";
import SalesManagement from "./pages/SalesManagement";
import UserManagement from "./pages/UserManagement";
import StaffDashboard from "./pages/StaffDashboard";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Sidebar + main layout — used for all authenticated pages */
const AppLayout = () => (
  <SidebarProvider>
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  </SidebarProvider>
);

/** Generic placeholder for stub pages */
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex h-screen flex-col bg-background">
    <AppHeader />
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
      <p className="text-xl font-bold text-foreground">{title}</p>
      <p className="text-sm">This section is coming soon.</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* ── Public ── */}
            <Route path="/login" element={<Login />} />

            {/* ── All-role routes (Staff + Admin) ── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/"                element={<Index />} />
                <Route path="/staff-dashboard" element={<StaffDashboard />} />
                <Route path="/profile"         element={<UserProfile />} />

                {/* ── Admin-only routes (Owner + Manager) ── */}
                <Route element={<ProtectedRoute allowedRoles={["Owner", "Manager"]} />}>
                  <Route path="/dashboard"  element={<Dashboard />} />
                  <Route path="/products"   element={<ProductManagement />} />
                  <Route path="/inventory"  element={<PlaceholderPage title="Inventory" />} />
                  <Route path="/sales"      element={<SalesManagement />} />
                  <Route path="/ai-reorder" element={<PlaceholderPage title="AI Reorder" />} />
                  <Route path="/suppliers"  element={<Suppliers />} />
                  <Route path="/expenses"   element={<PlaceholderPage title="Expenses" />} />
                  <Route path="/users"      element={<UserManagement />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
