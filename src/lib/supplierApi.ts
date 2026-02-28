import type { Supplier } from "@/data/suppliers";

const BASE = "http://localhost:8080/api/suppliers";

type SupplierPayload = Omit<Supplier, "id" | "createdAt">;

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
  // 204 No Content has no body
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const supplierApi = {
  /** GET /api/suppliers */
  getAll(): Promise<Supplier[]> {
    return fetch(BASE).then((r) => handleResponse<Supplier[]>(r));
  },

  /** POST /api/suppliers */
  create(data: SupplierPayload): Promise<Supplier> {
    return fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Supplier>(r));
  },

  /** PUT /api/suppliers/:id */
  update(id: number, data: SupplierPayload): Promise<Supplier> {
    return fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Supplier>(r));
  },

  /** DELETE /api/suppliers/:id */
  remove(id: number): Promise<void> {
    return fetch(`${BASE}/${id}`, { method: "DELETE" }).then((r) =>
      handleResponse<void>(r)
    );
  },
};
