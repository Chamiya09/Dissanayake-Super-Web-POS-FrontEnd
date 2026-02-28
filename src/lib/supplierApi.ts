import axios from "axios";
import type { Supplier } from "@/data/suppliers";

const BASE = "http://localhost:8080/api/suppliers";

type SupplierPayload = Omit<Supplier, "id" | "createdAt">;

export const supplierApi = {
  /** GET /api/suppliers */
  getAll(): Promise<Supplier[]> {
    return axios.get<Supplier[]>(BASE).then((r) => r.data);
  },

  /** POST /api/suppliers */
  create(data: SupplierPayload): Promise<Supplier> {
    return axios.post<Supplier>(BASE, data).then((r) => r.data);
  },

  /** PUT /api/suppliers/:id */
  update(id: number, data: SupplierPayload): Promise<Supplier> {
    return axios.put<Supplier>(`${BASE}/${id}`, data).then((r) => r.data);
  },

  /** DELETE /api/suppliers/:id */
  remove(id: number): Promise<void> {
    return axios.delete(`${BASE}/${id}`).then(() => undefined);
  },
};
