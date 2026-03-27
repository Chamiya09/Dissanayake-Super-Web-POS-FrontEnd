import { Package, AlertTriangle, PackageX, Wallet } from "lucide-react";
import { useInventory } from "@/context/InventoryContext";
import { formatCurrency } from "@/utils/formatCurrency";
import { cn } from "@/lib/utils";

interface CardConfig {
  label:     string;
  valueKey:  keyof import("@/context/InventoryContext").InventoryAnalytics;
  sub:       string;
  icon:      React.ElementType;
  iconBg:    string;
  iconColor: string;
  format?:   (v: number) => string;
}

const CARDS: CardConfig[] = [
  {
    label:     "Tracked Items",
    valueKey:  "totalTrackedItems",
    sub:       "Products with inventory records",
    icon:      Package,
    iconBg:    "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    label:     "Low Stock Alerts",
    valueKey:  "lowStockAlerts",
    sub:       "Items below reorder level",
    icon:      AlertTriangle,
    iconBg:    "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    label:     "Out of Stock",
    valueKey:  "outOfStock",
    sub:       "Items with zero quantity",
    icon:      PackageX,
    iconBg:    "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    label:     "Inventory Value",
    valueKey:  "totalInventoryValue",
    sub:       "Total value at selling price",
    icon:      Wallet,
    iconBg:    "bg-emerald-50",
    iconColor: "text-emerald-600",
    format:    formatCurrency,
  },
];

interface Props {
  /** Extra wrapper class for the grid container */
  className?: string;
}

export function InventoryAnalyticsCards({ className }: Props) {
  const { analytics, analyticsLoading } = useInventory();

  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {CARDS.map((card) => {
        const raw   = analytics?.[card.valueKey] ?? 0;
        const value = analyticsLoading
          ? "—"
          : card.format
          ? card.format(raw)
          : String(raw);

        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  card.iconBg,
                  card.iconColor
                )}
              >
                <card.icon className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{card.label}</span>
                <span className="mt-1 text-2xl font-bold text-slate-900 leading-none">{value}</span>
              </div>
            </div>
            {card.sub && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-sm text-slate-500">{card.sub}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
