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
    iconBg:    "bg-violet-500/10 dark:bg-violet-400/20",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    label:     "Low Stock Alerts",
    valueKey:  "lowStockAlerts",
    sub:       "Items below reorder level",
    icon:      AlertTriangle,
    iconBg:    "bg-amber-500/10 dark:bg-amber-400/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    label:     "Out of Stock",
    valueKey:  "outOfStock",
    sub:       "Items with zero quantity",
    icon:      PackageX,
    iconBg:    "bg-red-500/10 dark:bg-red-400/20",
    iconColor: "text-red-600 dark:text-red-400",
  },
  {
    label:     "Inventory Value",
    valueKey:  "totalInventoryValue",
    sub:       "Total value at selling price",
    icon:      Wallet,
    iconBg:    "bg-emerald-500/10 dark:bg-emerald-400/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
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
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
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
            className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-colors duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-2 text-[28px] font-bold tracking-tight text-foreground leading-none">
                  {value}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{card.sub}</p>
              </div>
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-200",
                  card.iconBg
                )}
              >
                <card.icon className={cn("h-5 w-5", card.iconColor)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
