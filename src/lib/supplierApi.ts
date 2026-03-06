import api from "@/lib/axiosInstance";
import type { Supplier } from "@/data/suppliers";

const BASE = "/api/suppliers";

type SupplierPayload = Omit<Supplier, "id" | "createdAt">;

export const supplierApi = {
  /** GET /api/suppliers */
  getAll(): Promise<Supplier[]> {
    return api.get<Supplier[]>(BASE).then((r) => r.data);
  },

  /** POST /api/suppliers */
  create(data: SupplierPayload): Promise<Supplier> {
    return api.post<Supplier>(BASE, data).then((r) => r.data);
  },

  /** PUT /api/suppliers/:id */
  update(id: number, data: SupplierPayload): Promise<Supplier> {
    return api.put<Supplier>(`${BASE}/${id}`, data).then((r) => r.data);
  },

  /** DELETE /api/suppliers/:id */
  remove(id: number): Promise<void> {
    return api.delete(`${BASE}/${id}`).then(() => undefined);
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
