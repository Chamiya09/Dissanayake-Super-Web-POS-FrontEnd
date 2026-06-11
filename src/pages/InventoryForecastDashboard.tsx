import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, LineChart as LineChartIcon, Loader2, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useModelHealth } from "@/hooks/useModelHealth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InventoryRow = {
  productId: string;
  productName: string;
  predictedDemand: number;
};

type MonthlyPoint = {
  month: string;
  actual: number;
  predicted: number;
};

type CategoryForecastPoint = {
  name: string;
  value: number;
  fill: string;
};

type DepletionRiskPoint = {
  name: string;
  stock: number;
  demand: number;
  status: "safe" | "risk";
};

type DateRangeKey = "3m" | "6m" | "12m";

const products: InventoryRow[] = [
  { productId: "P-1001", productName: "Basmati Rice 5kg", predictedDemand: 164 },
  { productId: "P-1024", productName: "Fresh Milk 1L", predictedDemand: 132 },
  { productId: "P-1030", productName: "Brown Bread", predictedDemand: 49 },
  { productId: "P-1052", productName: "Eggs Large 12pk", predictedDemand: 135 },
  { productId: "P-1068", productName: "Sugar 1kg", predictedDemand: 178 },
  { productId: "P-1104", productName: "Cooking Oil 2L", predictedDemand: 92 },
  { productId: "P-1121", productName: "Instant Noodles", predictedDemand: 276 },
  { productId: "P-1146", productName: "Tea Pack 200g", predictedDemand: 95 },
];

const productHistoryMap: Record<string, MonthlyPoint[]> = {
  "P-1001": [
    { month: "May", actual: 146, predicted: 148 },
    { month: "Jun", actual: 152, predicted: 150 },
    { month: "Jul", actual: 157, predicted: 156 },
    { month: "Aug", actual: 160, predicted: 162 },
    { month: "Sep", actual: 154, predicted: 155 },
    { month: "Oct", actual: 161, predicted: 160 },
    { month: "Nov", actual: 167, predicted: 168 },
    { month: "Dec", actual: 173, predicted: 171 },
    { month: "Jan", actual: 162, predicted: 163 },
    { month: "Feb", actual: 158, predicted: 159 },
    { month: "Mar", actual: 166, predicted: 165 },
    { month: "Apr", actual: 170, predicted: 168 },
  ],
  "P-1024": [
    { month: "May", actual: 102, predicted: 103 },
    { month: "Jun", actual: 110, predicted: 109 },
    { month: "Jul", actual: 114, predicted: 113 },
    { month: "Aug", actual: 120, predicted: 118 },
    { month: "Sep", actual: 116, predicted: 115 },
    { month: "Oct", actual: 122, predicted: 121 },
    { month: "Nov", actual: 127, predicted: 126 },
    { month: "Dec", actual: 131, predicted: 130 },
    { month: "Jan", actual: 124, predicted: 123 },
    { month: "Feb", actual: 121, predicted: 122 },
    { month: "Mar", actual: 128, predicted: 127 },
    { month: "Apr", actual: 133, predicted: 132 },
  ],
  "P-1030": [
    { month: "May", actual: 45, predicted: 44 },
    { month: "Jun", actual: 47, predicted: 46 },
    { month: "Jul", actual: 49, predicted: 48 },
    { month: "Aug", actual: 51, predicted: 50 },
    { month: "Sep", actual: 48, predicted: 49 },
    { month: "Oct", actual: 52, predicted: 51 },
    { month: "Nov", actual: 53, predicted: 54 },
    { month: "Dec", actual: 55, predicted: 56 },
    { month: "Jan", actual: 50, predicted: 51 },
    { month: "Feb", actual: 49, predicted: 50 },
    { month: "Mar", actual: 52, predicted: 53 },
    { month: "Apr", actual: 54, predicted: 55 },
  ],
};

const categoryForecastData: CategoryForecastPoint[] = [
  { name: "Grocery", value: 34, fill: "#0f766e" },
  { name: "Beverages", value: 24, fill: "#14b8a6" },
  { name: "Bakery", value: 18, fill: "#5eead4" },
  { name: "Sweets", value: 14, fill: "#99f6e4" },
  { name: "Household", value: 10, fill: "#ccfbf1" },
];

const depletionRiskData: DepletionRiskPoint[] = [
  { name: "Brown Bread", stock: 22, demand: 31, status: "risk" },
  { name: "Fresh Milk 1L", stock: 48, demand: 62, status: "risk" },
  { name: "Eggs Large 12pk", stock: 76, demand: 58, status: "safe" },
  { name: "Basmati Rice 5kg", stock: 41, demand: 52, status: "risk" },
  { name: "Cooking Oil 2L", stock: 64, demand: 39, status: "safe" },
];

const tooltipStyle = {
  borderRadius: 12,
  fontSize: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
};

export default function InventoryForecastDashboard() {
  const [dateRange, setDateRange] = useState<DateRangeKey>("12m");
  const modelHealthQuery = useModelHealth();
  const modelHealth = modelHealthQuery.data;

  const kpiCards = [
    {
      label: "R² Score",
      value: modelHealth ? `${(modelHealth.monthly_R2 * 100).toFixed(1)}%` : "--",
      hint: "Monthly explained variance",
    },
    {
      label: "MAPE",
      value: modelHealth ? `${modelHealth.monthly_MAPE.toFixed(2)}%` : "--",
      hint: "Monthly absolute percentage error",
    },
    {
      label: "Weekly R²",
      value: modelHealth ? `${(modelHealth.weekly_R2 * 100).toFixed(1)}%` : "--",
      hint: "Weekly explained variance",
    },
    {
      label: "Model Status",
      value: modelHealth?.status ?? "--",
      hint: "Live backend health summary",
    },
  ];

  const allMonthlySeries = useMemo(() => {
    const productSeries = Object.values(productHistoryMap);
    const baseMonths = productSeries[0] ?? [];

    return baseMonths.map((basePoint, index) => {
      const totals = productSeries.reduce(
        (acc, series) => {
          acc.actual += series[index]?.actual ?? 0;
          acc.predicted += series[index]?.predicted ?? 0;
          return acc;
        },
        { actual: 0, predicted: 0 },
      );

      return {
        month: basePoint.month,
        actual: totals.actual,
        predicted: totals.predicted,
      };
    });
  }, []);

  const monthlySeries = useMemo(() => {
    if (dateRange === "3m") return allMonthlySeries.slice(-3);
    if (dateRange === "6m") return allMonthlySeries.slice(-6);
    return allMonthlySeries;
  }, [allMonthlySeries, dateRange]);

  const topDemandProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => b.predictedDemand - a.predictedDemand)
      .slice(0, 5)
      .map((row) => ({ name: row.productName, demand: row.predictedDemand }));
  }, []);

  const categoryTotal = useMemo(
    () => categoryForecastData.reduce((sum, item) => sum + item.value, 0),
    [],
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
        <div className="animate-in fade-in duration-300 space-y-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Model Performance & Analytics</h1>
              <p className="text-sm text-muted-foreground">Forecast quality, product demand concentration, and sales trend alignment.</p>
              {modelHealthQuery.isLoading && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading model health metrics...
                </p>
              )}
            </div>
          </div>

          {modelHealthQuery.isError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" />
                AI Engine Offline. Please start the backend server.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((kpi) => (
              <Card key={kpi.label} className="border-border/70 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="border-border/70 shadow-sm xl:col-span-2">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <LineChartIcon className="h-4 w-4 text-primary" />
                      Actual vs. Predicted Sales
                    </CardTitle>
                    <CardDescription>
                      Aggregated sales trend filtered by date range.
                    </CardDescription>
                  </div>
                  <div className="w-full sm:w-[220px]">
                    <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangeKey)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3m">Last 3 Months</SelectItem>
                        <SelectItem value="6m">Last 6 Months</SelectItem>
                        <SelectItem value="12m">Last 12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[340px] pb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlySeries} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="actual" stroke="#0d9488" strokeWidth={3} dot={{ r: 3 }} name="Actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 3 }} name="Predicted" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Top 5 Products with Highest Expected Demand</CardTitle>
                <CardDescription>
                  Prioritize replenishment for these products first.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[340px] pb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topDemandProducts} margin={{ top: 12, right: 12, left: 12, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                      height={60}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="demand" fill="#14b8a6" name="Expected Demand" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Predicted Sales by Category</CardTitle>
                <CardDescription>
                  Forecasted category mix for the upcoming cycle based on current model output.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [`${value}%`, "Share"]}
                      />
                      <Pie
                        data={categoryForecastData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={78}
                        outerRadius={118}
                        paddingAngle={3}
                        stroke="rgba(255,255,255,0.9)"
                        strokeWidth={2}
                      >
                        {categoryForecastData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Total Forecast Mix</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{categoryTotal}%</p>
                    <p className="mt-1 text-xs text-slate-500">Category share across the projected demand basket.</p>
                  </div>

                  {categoryForecastData.map((category) => (
                    <div key={category.name} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.fill }} />
                        <span className="text-sm font-medium text-foreground">{category.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{category.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Inventory Depletion Risk</CardTitle>
                <CardDescription>
                  Products most likely to run short when next-week demand is compared with stock on hand.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={depletionRiskData}
                      layout="vertical"
                      margin={{ top: 12, right: 18, left: 18, bottom: 8 }}
                      barCategoryGap={18}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="stock" name="Current Stock" fill="#14b8a6" radius={[0, 8, 8, 0]} />
                      <Bar dataKey="demand" name="Predicted 7-Day Demand" radius={[0, 8, 8, 0]}>
                        {depletionRiskData.map((entry) => (
                          <Cell key={entry.name} fill={entry.status === "risk" ? "#f97316" : "#22c55e"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {depletionRiskData.map((item) => {
                    const variance = item.demand - item.stock;
                    const risky = variance > 0;

                    return (
                      <div
                        key={item.name}
                        className={`rounded-xl border px-4 py-3 ${
                          risky
                            ? "border-orange-200 bg-orange-50/80"
                            : "border-emerald-200 bg-emerald-50/80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Stock {item.stock} vs demand {item.demand}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              risky
                                ? "bg-orange-100 text-orange-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {risky ? `Risk +${variance}` : `Safe +${Math.abs(variance)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
