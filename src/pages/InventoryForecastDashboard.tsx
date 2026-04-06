import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LineChart as LineChartIcon, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/Layout/AppHeader";
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

const kpiCards = [
  { label: "R² Score", value: "97.5%", hint: "Explained variance" },
  { label: "MAPE", value: "0.86%", hint: "Mean absolute percentage error" },
  { label: "MAE", value: "0.50 Units", hint: "Average absolute error" },
  { label: "RMSE", value: "5.08 Units", hint: "Root mean squared error" },
];

const tooltipStyle = {
  borderRadius: 12,
  fontSize: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
};

export default function InventoryForecastDashboard() {
  const [selectedProductId, setSelectedProductId] = useState("P-1001");

  const selectedProduct = useMemo(
    () => products.find((row) => row.productId === selectedProductId) ?? products[0],
    [selectedProductId],
  );

  const monthlySeries = useMemo(() => {
    return productHistoryMap[selectedProduct.productId] ?? productHistoryMap["P-1001"];
  }, [selectedProduct.productId]);

  const topDemandProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => b.predictedDemand - a.predictedDemand)
      .slice(0, 5)
      .map((row) => ({ name: row.productName, demand: row.predictedDemand }));
  }, []);

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
            </div>
          </div>

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

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <LineChartIcon className="h-4 w-4 text-primary" />
                      Actual vs. Predicted Sales
                    </CardTitle>
                    <CardDescription>
                      Last 12 months for selected product.
                    </CardDescription>
                  </div>
                  <div className="w-full sm:w-[220px]">
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((row) => (
                          <SelectItem key={row.productId} value={row.productId}>
                            {row.productName}
                          </SelectItem>
                        ))}
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
        </div>
      </section>
    </div>
  );
}
