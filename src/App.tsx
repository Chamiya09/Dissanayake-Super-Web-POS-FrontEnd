import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { AppHeader } from "@/components/Layout/AppHeader";
import { RefreshLoadingTheme } from "@/components/ui/RefreshLoadingTheme";
import { AuthProvider } from "./context/AuthContext";
import { InventoryProvider } from "./context/InventoryContext";
import { ReorderProvider }   from "./context/ReorderContext";
import { ToastProvider } from "./context/GlobalToastContext";
import { ConfirmDialogProvider } from "./context/ConfirmDialogContext";
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
import InventoryStock from "./pages/InventoryStock";
import ReorderManagement from "./pages/ReorderManagement";
import LowStockAlerts   from "./pages/LowStockAlerts";
import MailBox from "./pages/MailBox";
import DataExport from "./pages/DataExport";

const queryClient = new QueryClient();

/** Sidebar + main layout — used for all authenticated pages */
const AppLayout = () => {
  return (
    <InventoryProvider>
      <ReorderProvider>
        <SidebarProvider>
          <div className="relative flex min-h-screen w-full">
            <AppSidebar />
            <main className="flex-1 overflow-hidden">
              <Outlet />
            </main>
          </div>
        </SidebarProvider>
      </ReorderProvider>
    </InventoryProvider>
  );
};

const GlobalRefreshThemeGate = () => {
  const [showRefreshTheme, setShowRefreshTheme] = useState(false);

  useEffect(() => {
    const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const isReload = navigationEntry?.type === "reload";

    if (!isReload) return;

    setShowRefreshTheme(true);
    const timerId = window.setTimeout(() => {
      setShowRefreshTheme(false);
    }, 900);

    return () => window.clearTimeout(timerId);
  }, []);

  return showRefreshTheme ? <RefreshLoadingTheme /> : null;
};

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
    <ToastProvider>
      <ConfirmDialogProvider>
        <TooltipProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <GlobalRefreshThemeGate />
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
                  <Route path="/inventory"  element={<InventoryStock />} />
                  <Route path="/sales"      element={<SalesManagement />} />
                  <Route path="/ai-reorder" element={<PlaceholderPage title="AI Reorder" />} />
                  <Route path="/low-stock"  element={<LowStockAlerts />} />
                  <Route path="/reorder"    element={<ReorderManagement />} />
                  <Route path="/suppliers"  element={<Suppliers />} />
                  <Route path="/mailbox"    element={<MailBox />} />
                  <Route path="/data-export" element={<DataExport />} />
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
      </ConfirmDialogProvider>
    </ToastProvider>
  </QueryClientProvider>
);

export default App;
