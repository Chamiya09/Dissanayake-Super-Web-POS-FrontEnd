import axios from "axios";
import type { Product } from "@/data/product-management";

/** Backend runs on port 8081; frontend dev server is on 8080 */
const BASE_URL = "http://localhost:8081/api/products";

/** Shape sent on create / update — id and createdAt are NOT sent to backend */
export type ProductPayload = Omit<Product, "id">;

export const productApi = {
  /** GET /api/products — fetch all products */
  getAll: (): Promise<Product[]> =>
    axios.get<Product[]>(BASE_URL).then((r) => r.data),

  /** POST /api/products — create a new product */
  create: (payload: ProductPayload): Promise<Product> =>
    axios.post<Product>(BASE_URL, payload).then((r) => r.data),

  /** PUT /api/products/{id} — update an existing product */
  update: (id: number, payload: ProductPayload): Promise<Product> =>
    axios.put<Product>(`${BASE_URL}/${id}`, payload).then((r) => r.data),

  /** DELETE /api/products/{id} — delete a product */
  remove: (id: number): Promise<void> =>
    axios.delete(`${BASE_URL}/${id}`).then(() => undefined),
};
