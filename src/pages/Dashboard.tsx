import { LayoutDashboard } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-muted-foreground">
      <LayoutDashboard className="h-16 w-16 opacity-20" />
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-sm">Analytics & reports coming soon.</p>
    </div>
  );
};

export default Dashboard;
