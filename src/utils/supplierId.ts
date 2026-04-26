import type { Supplier } from "@/data/suppliers";

export function formatSupplierId(id: number | string | null | undefined): string {
  const value = Number(id);
  if (!Number.isFinite(value) || value <= 0) return "SI0000";
  return `SI${String(Math.trunc(value)).padStart(4, "0")}`;
}

export function getSupplierDisplayId(supplier: Pick<Supplier, "id" | "supplierCode">): string {
  const code = supplier.supplierCode?.trim();
  return code && /^SI\d{4,}$/i.test(code) ? code.toUpperCase() : formatSupplierId(supplier.id);
}
