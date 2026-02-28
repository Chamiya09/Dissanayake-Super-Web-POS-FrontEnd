import { useState, useCallback } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { ProductTable } from "@/components/Products/ProductTable";
import { AddProductModal } from "@/components/Products/AddProductModal";
import { EditProductModal } from "@/components/Products/EditProductModal";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/product-management";
export type { Product };

/* ── Mock seed data ── */
const INITIAL_PRODUCTS: Product[] = [
  { id: "PRD-001", productName: "Organic Bananas",   sku: "4011", category: "Fruits",     buyingPrice: 0.80, sellingPrice: 1.29 },
  { id: "PRD-002", productName: "Whole Milk",        sku: "7001", category: "Dairy",      buyingPrice: 2.50, sellingPrice: 3.79 },
  { id: "PRD-003", productName: "Orange Juice",      sku: "8010", category: "Beverages",  buyingPrice: 2.80, sellingPrice: 4.29 },
  { id: "PRD-004", productName: "Sourdough Bread",   sku: "9001", category: "Bakery",     buyingPrice: 3.50, sellingPrice: 5.99 },
  { id: "PRD-005", productName: "Chicken Breast",    sku: "5001", category: "Meat",       buyingPrice: 6.50, sellingPrice: 9.99 },
];

/* ── Simple ID generator ── */
let nextId = INITIAL_PRODUCTS.length + 1;
const generateId = () => {
  const id = `PRD-${String(nextId).padStart(3, "0")}`;
  nextId++;
  return id;
};





/* ─────────────────────────────────────────────────────────────────────────
   ProductManagement  —  main page
   ───────────────────────────────────────────────────────────────────────── */
export default function ProductManagement() {
  /* ── Master list (single source of truth, no backend) ── */
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  /* ── Modal state ── */
  const [isAddOpen,  setIsAddOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);

  const isEditOpen = editTarget !== null;

  /* ── CRUD handlers ── */
  const handleAdd = useCallback((data: Omit<Product, "id">) => {
    setProducts((prev) => [...prev, { id: generateId(), ...data }]);
  }, []);

  const handleEdit = useCallback((updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const handleDelete = useCallback((product: Product) => {
    if (window.confirm(`Delete "${product.productName}"? This cannot be undone.`)) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    }
  }, []);

  /* ── Derived stats ── */
  const avgMargin =
    products.length === 0
      ? 0
      : products.reduce((sum, p) =>
          sum + (p.buyingPrice > 0 ? ((p.sellingPrice - p.buyingPrice) / p.buyingPrice) * 100 : 0),
          0
        ) / products.length;

  const categories = [...new Set(products.map((p) => p.category))].length;

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                Product Management
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {products.length} product{products.length !== 1 ? "s" : ""} registered
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="gap-2 shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add New Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Products",   value: products.length },
            { label: "Categories",       value: categories },
            { label: "Avg. Margin",      value: `${avgMargin.toFixed(1)}%` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
            >
              <p className="text-[22px] font-bold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <ProductTable
          products={products}
          onEdit={(p) => setEditTarget(p)}
          onDelete={handleDelete}
        />
      </div>

      {/* ── Modals ── */}
      <AddProductModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAdd}
      />
      <EditProductModal
        isOpen={isEditOpen}
        onClose={() => setEditTarget(null)}
        product={editTarget}
        onSave={handleEdit}
      />
    </div>
  );
}
