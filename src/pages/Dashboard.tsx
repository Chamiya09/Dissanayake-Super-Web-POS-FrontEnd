import { Bell, Moon, Search, DollarSign, TrendingUp, Users, RefreshCw } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, Tooltip, Legend, AreaChart, Area,
} from "recharts";

const topProducts = [
  { name: "Milk",    sales: 345 },
  { name: "Eggs",    sales: 270 },
  { name: "Rice",    sales: 248 },
  { name: "Chicken", sales: 215 },
  { name: "Bread",   sales: 190 },
  { name: "Water",   sales: 183 },
];

const forecastData = [
  { month: "Sep", actual: 30000, forecast: 28000 },
  { month: "Oct", actual: 32000, forecast: 31000 },
  { month: "Nov", actual: 35000, forecast: 33500 },
  { month: "Dec", actual: 43000, forecast: 40000 },
  { month: "Jan", actual: 37000, forecast: 35000 },
  { month: "Feb", actual: 36000, forecast: 34000 },
];

const monthlyRevenue = [
  { month: "Aug", revenue: 24000 },
  { month: "Sep", revenue: 30000 },
  { month: "Oct", revenue: 28000 },
  { month: "Nov", revenue: 35000 },
  { month: "Dec", revenue: 43000 },
  { month: "Jan", revenue: 37000 },
  { month: "Feb", revenue: 36000 },
];

const stats = [
  { label: "Total Revenue",       value: "$4,383.4",   change: "+12.5%", icon: DollarSign, green: true  },
  { label: "Net Profit",          value: "$-14,296.6", change: "+8.2%",  icon: TrendingUp, green: true  },
  { label: "Active Customers",    value: "1,847",      change: "+4.3%",  icon: Users,      green: true  },
  { label: "Pending AI Reorders", value: "6",          change: "+3",     icon: RefreshCw,  green: false },
];

const Dashboard = () => (
  <div className="flex h-screen flex-col bg-background">

    {/* ── Header ── */}
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white px-4 shadow-sm">
      <SidebarTrigger className="text-muted-foreground" />
      {/* Search */}
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 max-w-xs">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground outline-none"
          placeholder="Search..."
        />
        <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">⌘K</span>
      </div>
      <div className="flex flex-1" />
      {/* Actions */}
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

    {/* ── Scrollable body ── */}
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back, Sarah. Here’s what’s happening today.</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-[13px] text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="mt-3 text-[28px] font-bold tracking-tight text-foreground">{s.value}</p>
            <div className="mt-2">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                s.green ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground"
              }`}>
                {s.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Bar — Top Selling Products */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-foreground">Top Selling Products</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#EFF6FF" }} contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #E5E7EB" }} />
              <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line — Forecast vs Actual */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-foreground">Forecast vs Actual Sales</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={forecastData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #E5E7EB" }} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={(val) => (
                  <span style={{ color: val === "actual" ? "#3B82F6" : "#F59E0B" }}>{val}</span>
                )}
              />
              <Line type="monotone" dataKey="actual"   stroke="#3B82F6" strokeWidth={2} dot={{ r: 4, fill: "#3B82F6" }} />
              <Line type="monotone" dataKey="forecast" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 4, fill: "#F59E0B" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Monthly Revenue area chart ── */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-[15px] font-semibold text-foreground">Monthly Revenue</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyRevenue} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #E5E7EB" }} />
            <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#revGrad)" dot={{ r: 4, fill: "#3B82F6" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  </div>
);

export default Dashboard;
