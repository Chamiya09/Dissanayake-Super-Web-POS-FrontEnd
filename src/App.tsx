import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Layout/AppSidebar";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { Bell, Moon, Search } from "lucide-react";

const queryClient = new QueryClient();

/** Reusable header shared by placeholder pages */
const PageHeader = () => (
  <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white px-4 shadow-sm">
    <SidebarTrigger className="text-muted-foreground" />
    <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 max-w-xs">
      <Search className="h-4 w-4 text-muted-foreground" />
      <input
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        placeholder="Search..."
      />
      <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">⌘K</span>
    </div>
    <div className="flex flex-1" />
    <div className="flex items-center gap-3">
      <button className="relative p-1.5">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">6</span>
      </button>
      <button className="p-1.5"><Moon className="h-5 w-5 text-muted-foreground" /></button>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">S</div>
        <span className="text-[13px] font-semibold text-foreground">Sarah Chen</span>
        <span className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">Owner</span>
      </div>
    </div>
  </header>
);

/** Generic placeholder for stub pages */
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex h-screen flex-col bg-background">
    <PageHeader />
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
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <main className="flex-1 overflow-hidden">
              <Routes>
                <Route path="/"           element={<Index />} />
                <Route path="/dashboard"  element={<Dashboard />} />
                <Route path="/products"   element={<PlaceholderPage title="Products" />} />
                <Route path="/inventory"  element={<PlaceholderPage title="Inventory" />} />
                <Route path="/sales"      element={<PlaceholderPage title="Sales & Returns" />} />
                <Route path="/ai-reorder" element={<PlaceholderPage title="AI Reorder" />} />
                <Route path="/suppliers"  element={<PlaceholderPage title="Suppliers" />} />
                <Route path="/expenses"   element={<PlaceholderPage title="Expenses" />} />
                <Route path="/users"      element={<PlaceholderPage title="Users" />} />
                <Route path="*"           element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
