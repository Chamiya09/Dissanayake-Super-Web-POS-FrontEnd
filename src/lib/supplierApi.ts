import api from "@/lib/axiosInstance";
import type { Supplier } from "@/data/suppliers";
import { formatSupplierId } from "@/utils/supplierId";

const BASE = "/api/suppliers";

type SupplierPayload = Omit<Supplier, "id" | "supplierCode" | "createdAt" | "isActive">;

function normalizeSupplier(supplier: Supplier): Supplier {
  const supplierCode = supplier.supplierCode?.trim();
  return {
    ...supplier,
    supplierCode:
      supplierCode && /^SI\d{4,}$/i.test(supplierCode)
        ? supplierCode.toUpperCase()
        : formatSupplierId(supplier.id),
  };
}

export const supplierApi = {
  /** GET /api/suppliers */
  getAll(): Promise<Supplier[]> {
    return api.get<Supplier[]>(BASE).then((r) => r.data.map(normalizeSupplier));
  },

  /** POST /api/suppliers */
  create(data: SupplierPayload): Promise<Supplier> {
    return api.post<Supplier>(BASE, data).then((r) => normalizeSupplier(r.data));
  },

  /** PUT /api/suppliers/:id */
  update(id: number, data: SupplierPayload): Promise<Supplier> {
    return api.put<Supplier>(`${BASE}/${id}`, data).then((r) => normalizeSupplier(r.data));
  },

  /** DELETE /api/suppliers/:id */
  remove(id: number): Promise<void> {
    return api.delete(`${BASE}/${id}`).then(() => undefined);
  },

  /** PATCH /api/suppliers/:id/status */
  updateStatus(id: number, isActive: boolean): Promise<Supplier> {
    return api.patch<Supplier>(`${BASE}/${id}/status`, { isActive }).then((r) => normalizeSupplier(r.data));
  },

  /** POST /api/suppliers/:id/products — assign a list of product IDs to a supplier */
  assignProducts(supplierId: number, productIds: number[]): Promise<void> {
    return api
      .post(`${BASE}/${supplierId}/products`, { productIds })
      .then(() => undefined);
  },

  /** GET /api/products/by-supplier/:supplierId — fetch products assigned to a supplier */
  getAssignedProducts(supplierId: number): Promise<import("@/components/Suppliers/AssignProductsModal").MgmtProduct[]> {
    return api
      .get(`/api/products/by-supplier/${supplierId}`)
      .then((r) => r.data);
  },

  /** PATCH /api/products/:productId/unassign — remove supplier from a product */
  unassignProduct(productId: number): Promise<void> {
    return api
      .patch(`/api/products/${productId}/unassign`)
      .then(() => undefined);
  },
};
