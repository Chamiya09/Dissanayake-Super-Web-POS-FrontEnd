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
};
