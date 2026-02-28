/* Product type and mock data used by ProductManagement */

export interface Product {
  id:           string;
  productName:  string;
  sku:          string;   // barcode
  category:     string;
  buyingPrice:  number;
  sellingPrice: number;
}
