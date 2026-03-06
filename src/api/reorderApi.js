/**
 * reorderApi.js
 *
 * All HTTP calls for the Reorder module, talking to the Spring Boot backend.
 *
 * Endpoints (via Vite proxy → http://localhost:8080):
 *   GET  /api/v1/reorder/low-stock  → getLowStockItems()
 *   POST /api/v1/reorder/create     → createOrder(dto)
 *   GET  /api/v1/reorder/history    → getHistory(suppliers?)
 */
import api from "@/lib/axiosInstance";

const BASE = "/api/v1/reorder";

// ── Mappers ───────────────────────────────────────────────────────────────────

/**
 * Converts a backend Status enum string (PENDING / CONFIRMED / CANCELLED /
 * RECEIVED) to the title-case string the frontend uses (Pending, Confirmed …).
 */
function capitalizeStatus(status = "") {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/**
 * Maps a `ReorderResponseDTO` from the backend to the flat order shape
 * expected by the frontend history table.
 *
 * @param {Object} dto      - ReorderResponseDTO
 * @param {Array}  suppliers - Optional suppliers list for name resolution
 * @returns {Object} frontend order shape
 */
export function mapHistoryItem(dto, suppliers = []) {
  const supplier    = suppliers.find((s) => s.email === dto.supplierEmail);
  const productName = dto.items?.map((i) => i.productName).join(", ") || "—";
  const quantity    = dto.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const orderDate   = dto.createdAt
    ? (typeof dto.createdAt === "string"
        ? dto.createdAt.split("T")[0]
        : new Date(dto.createdAt).toISOString().split("T")[0])
    : new Date().toISOString().split("T")[0];

  return {
    id:            dto.orderRef,   // display string for the table "Order ID" column
    dbId:          dto.id,         // numeric PK for future PATCH/DELETE calls
    orderRef:      dto.orderRef,
    productName,
    supplierName:  supplier?.companyName ?? dto.supplierEmail,
    supplierEmail: dto.supplierEmail,
    quantity,
    totalAmount:   dto.totalAmount,
    orderDate,
    status:        capitalizeStatus(dto.status),
    items:         dto.items ?? [],
  };
}

/**
 * Maps a `LowStockItemDTO` from the backend to the frontend alert shape
 * (mirrors the shape of InventoryContext items so the same table renders).
 *
 * Backend fields : productId, productName, sku, category, currentStock,
 *                  reorderLevel, unit, sellingPrice, supplierName, supplierEmail
 * Frontend fields: inventoryId, productId, productName, sku, category,
 *                  stockQuantity, reorderLevel, unit, stockStatus, sellingPrice,
 *                  supplierName, supplierEmail
 */
export function mapLowStockItem(dto) {
  return {
    inventoryId:   dto.productId,
    productId:     dto.productId,
    productName:   dto.productName,
    sku:           dto.sku,
    category:      dto.category,
    stockQuantity: dto.currentStock,
    reorderLevel:  dto.reorderLevel,
    unit:          dto.unit,
    stockStatus:   dto.currentStock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
    sellingPrice:  dto.sellingPrice ?? 0,
    supplierName:  dto.supplierName  ?? null,
    supplierEmail: dto.supplierEmail ?? null,
  };
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Fetches products at or below their reorder level from the dedicated
 * backend endpoint and maps them to the frontend alert shape.
 *
 * @returns {Promise<Array>}
 */
export async function getLowStockItems() {
  const { data } = await api.get(`${BASE}/low-stock`);
  return (data ?? []).map(mapLowStockItem);
}

/**
 * Creates a new purchase order.
 *
 * @param {Object} payload
 * @param {string} payload.orderRef      - Unique PO reference (e.g. PO-1715…)
 * @param {string} payload.supplierEmail - Supplier's email address
 * @param {Array}  payload.items         - [{ productName, quantity, unitPrice }]
 * @returns {Promise<Object>} ReorderResponseDTO (raw, not yet mapped)
 */
export async function createOrder({ orderRef, supplierEmail, items }) {
  const { data } = await api.post(`${BASE}/create`, {
    orderRef,
    supplierEmail,
    items,
  });
  return data;
}

/**
 * Updates an existing purchase order's supplierEmail and/or items.
 *
 * @param {number} dbId             - Numeric database PK of the order
 * @param {Object} payload
 * @param {string} payload.supplierEmail - Updated supplier email (null = no change)
 * @param {Array}  payload.items         - Replacement item list (null = no change)
 * @returns {Promise<Object>} ReorderResponseDTO (raw, not yet mapped)
 */
export async function updateOrder(dbId, { supplierEmail, items }) {
  const { data } = await api.put(`${BASE}/${dbId}`, { supplierEmail, items });
  return data;
}

/**
 * Fetches all purchase orders sorted newest-first.
 *
 * @param {Array} suppliers - Optional suppliers list for name look-up
 * @returns {Promise<Array>} Mapped frontend order objects
 */
export async function getHistory(suppliers = []) {
  const { data } = await api.get(`${BASE}/history`);
  return (data ?? []).map((dto) => mapHistoryItem(dto, suppliers));
}

/**
 * Transitions the status of an existing order.
 * Valid statuses: "CANCELLED" | "CONFIRMED" | "RECEIVED"
 *
 * @param {number} dbId   - Numeric database PK of the order
 * @param {string} status - New status (uppercase)
 * @returns {Promise<Object>} Updated ReorderResponseDTO (raw, not yet mapped)
 */
export async function updateOrderStatus(dbId, status) {
  const { data } = await api.patch(`${BASE}/${dbId}/status`, { status });
  return data;
}
