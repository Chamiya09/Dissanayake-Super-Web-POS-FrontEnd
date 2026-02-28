import type { Product } from "@/data/product-management";

const BASE_URL = "http://localhost:8080/api/products";

/** Shape sent on create / update — id and createdAt are NOT sent to backend */
export type ProductPayload = Omit<Product, "id">;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail || body?.message) message = body.detail ?? body.message;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const productApi = {
  /** GET /api/products — fetch all products */
  getAll(): Promise<Product[]> {
    return fetch(BASE_URL).then((r) => handleResponse<Product[]>(r));
  },

  /** POST /api/products — create a new product */
  create(payload: ProductPayload): Promise<Product> {
    return fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => handleResponse<Product>(r));
  },

  /** PUT /api/products/{id} — update an existing product */
  update(id: number, payload: ProductPayload): Promise<Product> {
    return fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => handleResponse<Product>(r));
  },

  /** DELETE /api/products/{id} — delete a product */
  remove(id: number): Promise<void> {
    return fetch(`${BASE_URL}/${id}`, { method: "DELETE" }).then((r) =>
      handleResponse<void>(r)
    );
  },
};
