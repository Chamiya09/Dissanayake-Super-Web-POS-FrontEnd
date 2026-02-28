/* Product type and mock data used by ProductManagement */

export interface Product {
  id:           number;   // backend Long — maps to numeric JSON id
  productName:  string;
  sku:          string;   // barcode
  category:     string;
  buyingPrice:  number;
  sellingPrice: number;
}
