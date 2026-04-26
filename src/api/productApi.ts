import api from "@/lib/axiosInstance";
import type { Product } from "@/data/product-management";
import { formatProductId } from "@/utils/productId";

const BASE_URL = "/api/products";

/** Shape sent on create / update — id and createdAt are NOT sent to backend */
export type ProductPayload = Omit<Product, "id">;

export type ProductImportError = {
  rowNumber: number;
  sku: string | null;
  message: string;
};

export type ProductBulkImportResponse = {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  importedProducts: Product[];
  errors: ProductImportError[];
};

export type ProductPageResponse = {
  content: Product[];
  totalElements: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

function normalizeProduct(product: Product): Product {
  const sku = product.sku?.trim();
  return {
    ...product,
    sku: sku && /^PI\d{4,}$/i.test(sku) ? sku.toUpperCase() : formatProductId(product.id),
  };
}

function normalizeProductPage(page: ProductPageResponse): ProductPageResponse {
  return {
    ...page,
    content: page.content.map(normalizeProduct),
  };
}

export const productApi = {
  /** GET /api/products — fetch all products */
  getAll(): Promise<Product[]> {
    return api.get<Product[]>(BASE_URL).then((r) => r.data.map(normalizeProduct));
  },

  /** GET /api/products/page?page=x&limit=y&search=z — server-side pagination */
  getPage(params: { page: number; limit: number; search?: string }): Promise<ProductPageResponse> {
    return api
      .get<ProductPageResponse>(`${BASE_URL}/page`, { params })
      .then((r) => normalizeProductPage(r.data));
  },

  /** POST /api/products — create a new product */
  create(payload: ProductPayload): Promise<Product> {
    return api.post<Product>(BASE_URL, payload).then((r) => normalizeProduct(r.data));
  },

  /** POST /api/products/bulk-import — create multiple products at once */
  bulkImport(payload: ProductPayload[]): Promise<ProductBulkImportResponse> {
    return api
      .post<ProductBulkImportResponse>(`${BASE_URL}/bulk-import`, payload)
      .then((r) => ({
        ...r.data,
        importedProducts: r.data.importedProducts.map(normalizeProduct),
      }));
  },

  /** PUT /api/products/{id} — update an existing product */
  update(id: number, payload: ProductPayload): Promise<Product> {
    return api.put<Product>(`${BASE_URL}/${id}`, payload).then((r) => normalizeProduct(r.data));
  },

  /** DELETE /api/products/{id} — delete a product */
  remove(id: number): Promise<void> {
    return api.delete(`${BASE_URL}/${id}`).then(() => undefined);
  },
};
