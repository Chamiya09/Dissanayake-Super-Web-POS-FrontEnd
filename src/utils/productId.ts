import type { Product } from "@/data/product-management";

export function formatProductId(id: number | string | null | undefined): string {
  const value = Number(id);
  if (!Number.isFinite(value) || value <= 0) return "PI0000";
  return `PI${String(Math.trunc(value)).padStart(4, "0")}`;
}

export function getProductDisplayId(product: Pick<Product, "id" | "sku">): string {
  const sku = product.sku?.trim();
  return sku && /^PI\d{4,}$/i.test(sku) ? sku.toUpperCase() : formatProductId(product.id);
}
