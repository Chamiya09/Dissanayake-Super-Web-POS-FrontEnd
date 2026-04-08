/* Product type and mock data used by ProductManagement */

export interface Product {
  id:             number;   // backend Long — maps to numeric JSON id
  productName:    string;
  sku?:           string | null;   // Product ID (manual SKU, e.g. PI00001)
  barcode?:       string | null;   // Physical barcode string from scanner
  category:       string;
  buyingPrice:    number;
  sellingPrice:   number;
  unit?:          string;   // kg, g, L, ml, pieces, bottles, packets, box
  stockQuantity?: number;   // live stock level (added when inventory module ships)
  reorderLevel?:  number;   // threshold below which status becomes Low Stock
}
