import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "@/lib/axiosInstance";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InventoryAnalytics {
  totalTrackedItems: number;
  lowStockAlerts:    number;
  outOfStock:        number;
  totalInventoryValue: number;
}

export interface InventoryItem {
  inventoryId:   number;
  productId:     number;
  productName:   string;
  sku:           string;
  category:      string;
  sellingPrice:  number;
  stockQuantity: number;
  reorderLevel:  number;
  unit:          string | null;
  stockStatus:   string;   // "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"
  lastUpdated:   string;
}

interface InventoryContextValue {
  analytics:        InventoryAnalytics | null;
  inventoryItems:   InventoryItem[];
  analyticsLoading: boolean;
  refreshInventory: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const InventoryContext = createContext<InventoryContextValue>({
  analytics:        null,
  inventoryItems:   [],
  analyticsLoading: false,
  refreshInventory: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [analytics,        setAnalytics]        = useState<InventoryAnalytics | null>(null);
  const [inventoryItems,   setInventoryItems]   = useState<InventoryItem[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchData = useCallback(() => {
    setAnalyticsLoading(true);
    Promise.allSettled([
      api.get<InventoryAnalytics>("/api/inventory/analytics"),
      api.get<InventoryItem[]>("/api/inventory/status"),
    ])
      .then(([analyticsRes, statusRes]) => {
        if (analyticsRes.status === "fulfilled")
          setAnalytics(analyticsRes.value.data);

        if (statusRes.status === "fulfilled")
          setInventoryItems(
            statusRes.value.data.map((item) => ({
              ...item,
              sellingPrice:  Number(item.sellingPrice  ?? 0),
              stockQuantity: Number(item.stockQuantity ?? 0),
              reorderLevel:  Number(item.reorderLevel  ?? 10),
            }))
          );
      })
      .finally(() => setAnalyticsLoading(false));
  }, []);

  // Fetch once on mount (after auth token is typically available)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <InventoryContext.Provider
      value={{ analytics, inventoryItems, analyticsLoading, refreshInventory: fetchData }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useInventory = () => useContext(InventoryContext);
