import api from "@/lib/axiosInstance";

const BASE_URL = "/api/inventory";

export type InventoryImportPayload = {
  sku: string;
  stockQuantity: number;
  reorderLevel: number;
  unit?: string;
};

export type InventoryImportError = {
  rowNumber: number;
  sku: string | null;
  message: string;
};

export type InventoryImportSuccess = {
  inventoryId: number;
  productId: number;
  productName: string;
  sku: string;
  stockQuantity: number;
  reorderLevel: number;
  unit: string | null;
};

export type InventoryBulkImportResponse = {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  importedItems: InventoryImportSuccess[];
  errors: InventoryImportError[];
};

export const inventoryApi = {
  /** POST /api/inventory/bulk-import — import stock + reorder levels in bulk */
  bulkImport(payload: InventoryImportPayload[]): Promise<InventoryBulkImportResponse> {
    return api
      .post<InventoryBulkImportResponse>(`${BASE_URL}/bulk-import`, payload)
      .then((r) => r.data);
  },
};
