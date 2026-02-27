export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  unit: string;
  barcode: string;
  discount?: number;
  isPromo?: boolean;
  isNew?: boolean;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export const categories = [
  "All",
  "Fruits",
  "Dairy",
  "Beverages",
  "Bakery",
  "Snacks",
  "Meat",
  "Vegetables",
] as const;

export const products: Product[] = [
  { id: "1",  name: "Organic Bananas",    price: 1.29, category: "Fruits",     unit: "bunch",  barcode: "4011", discount: 15, isPromo: true,  stock: 42 },
  { id: "2",  name: "Fuji Apples",        price: 3.49, category: "Fruits",     unit: "kg",     barcode: "4131",                               stock: 18 },
  { id: "3",  name: "Fresh Strawberries", price: 4.99, category: "Fruits",     unit: "pack",   barcode: "4150",               isNew: true,    stock: 2  },
  { id: "4",  name: "Whole Milk",         price: 3.79, category: "Dairy",      unit: "gal",    barcode: "7001", discount: 10,                 stock: 9  },
  { id: "5",  name: "Greek Yogurt",       price: 5.49, category: "Dairy",      unit: "tub",    barcode: "7042",               isPromo: true,  stock: 0  },
  { id: "6",  name: "Cheddar Cheese",     price: 6.29, category: "Dairy",      unit: "block",  barcode: "7088",                               stock: 14 },
  { id: "7",  name: "Orange Juice",       price: 4.29, category: "Beverages",  unit: "bottle", barcode: "8010", discount: 20, isPromo: true,  stock: 31 },
  { id: "8",  name: "Sparkling Water",    price: 1.99, category: "Beverages",  unit: "can",    barcode: "8055",               isNew: true,    stock: 55 },
  { id: "9",  name: "Sourdough Bread",    price: 5.99, category: "Bakery",     unit: "loaf",   barcode: "9001",                               stock: 7  },
  { id: "10", name: "Croissants",         price: 3.99, category: "Bakery",     unit: "pack",   barcode: "9020", discount: 5,                  stock: 1  },
  { id: "11", name: "Trail Mix",          price: 7.49, category: "Snacks",     unit: "bag",    barcode: "6010",               isNew: true,    stock: 23 },
  { id: "12", name: "Chicken Breast",     price: 9.99, category: "Meat",       unit: "kg",     barcode: "5001", discount: 12, isPromo: true,  stock: 6  },
];
