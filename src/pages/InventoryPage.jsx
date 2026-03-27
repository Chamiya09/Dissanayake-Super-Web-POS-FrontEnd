import { useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Mouse,
  Keyboard,
  Cable,
  Monitor,
  Headphones,
} from "lucide-react";

const MOCK_INVENTORY = [
  {
    id: 1,
    name: "Wireless Mouse",
    category: "Peripherals",
    price: 29.99,
    stock: 142,
    status: "In Stock",
    icon: Mouse,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    id: 2,
    name: "Mechanical Keyboard",
    category: "Peripherals",
    price: 89.99,
    stock: 38,
    status: "In Stock",
    icon: Keyboard,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    id: 3,
    name: "USB-C Hub 7-in-1",
    category: "Accessories",
    price: 49.99,
    stock: 7,
    status: "Low Stock",
    icon: Cable,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    id: 4,
    name: '27" IPS Monitor',
    category: "Displays",
    price: 319.99,
    stock: 0,
    status: "Out of Stock",
    icon: Monitor,
    iconColor: "text-slate-500",
    iconBg: "bg-muted",
  },
  {
    id: 5,
    name: "Noise Cancelling Headset",
    category: "Audio",
    price: 129.99,
    stock: 55,
    status: "In Stock",
    icon: Headphones,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
];

const STATUS_STYLES = {
  "In Stock":
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800",
  "Low Stock":
    "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800",
  "Out of Stock":
    "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-800",
};

const InventoryPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInventory = MOCK_INVENTORY.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Inventory Management
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Track and manage your product stock levels
        </p>
      </div>

      {/* Search & Action Bar */}
      <div className="flex items-center justify-between gap-4 mb-8">
        {/* Search Input */}
        <div className="relative w-1/2">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, SKU or category..."
            className="
              w-full rounded-xl border border-border bg-card text-card-foreground shadow-sm
              pl-10 pr-4 py-3
              text-sm text-foreground
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              outline-none
              focus:ring-2 focus:ring-ring/20
              focus:border-slate-300 dark:focus:border-slate-600
              transition-all duration-200
            "
          />
        </div>

        {/* Add Product Button */}
        <button
          type="button"
          className="
            ml-auto flex items-center gap-2
            bg-primary text-primary-foreground
            text-primary-foreground
            px-6 py-3
            rounded-xl font-medium text-sm
            shadow-sm
            hover:bg-primary/90
            active:scale-95
            transition-all duration-200
            whitespace-nowrap
          "
        >
          <Plus size={17} strokeWidth={2.5} />
          Add Product
        </button>
      </div>

      {/* Inventory Table */}
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden mt-8">
        <table className="w-full text-sm">
          {/* Table Head */}
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border">
              {["Product Name", "Category", "Price", "Stock Level", "Status", "Actions"].map(
                (col) => (
                  <th
                    key={col}
                    className="py-5 px-6 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400 dark:text-slate-600 text-sm">
                  No products match your search.
                </td>
              </tr>
            ) : (
              filteredInventory.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`
                    border-b border-border
                    last:border-0
                    hover:bg-slate-50/70 dark:hover:bg-slate-800/40
                    transition-colors duration-150
                    ${idx % 2 === 0 ? "" : "bg-slate-50/30 dark:bg-slate-800/20"}
                  `}
                >
                  {/* Product Name */}
                  <td className="py-6 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl ${item.iconBg}`}>
                        <item.icon size={16} className={item.iconColor} strokeWidth={1.8} />
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-6 px-6 text-muted-foreground">
                    {item.category}
                  </td>

                  {/* Price */}
                  <td className="py-6 px-6 font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrency(item.price)}
                  </td>

                  {/* Stock Level */}
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-1.5">
                      {item.stock <= 10 && (
                        <AlertTriangle
                          size={13}
                          strokeWidth={2.2}
                          className={item.stock === 0 ? "text-red-500 dark:text-red-400" : "text-amber-500 dark:text-amber-400"}
                        />
                      )}
                      <span
                        className={`font-semibold ${
                          item.stock === 0
                            ? "text-red-600 dark:text-red-400"
                            : item.stock <= 10
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.stock}
                      </span>
                      <span className="text-muted-foreground text-xs">units</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-6 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-colors duration-150"
                        title="Edit product"
                      >
                        <Pencil size={15} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors duration-150"
                        title="Delete product"
                      >
                        <Trash2 size={15} strokeWidth={1.8} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer row — item count */}
        <div className="px-6 py-4 border-t border-border bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredInventory.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {MOCK_INVENTORY.length}
            </span>{" "}
            products
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
