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
    iconBg: "bg-violet-50",
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
    iconBg: "bg-blue-50",
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
    iconBg: "bg-amber-50",
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
    iconBg: "bg-slate-100",
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
    iconBg: "bg-emerald-50",
  },
];

const STATUS_STYLES = {
  "In Stock": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Low Stock": "bg-amber-50 text-amber-700 border border-amber-200",
  "Out of Stock": "bg-red-50 text-red-700 border border-red-200",
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
    <div className="w-full min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Inventory Management
        </h1>
        <p className="mt-1.5 text-[13px] text-slate-500">
          Track and manage your product stock levels
        </p>
      </div>

      {/* Search & Action Bar */}
      <div className="flex items-center justify-between gap-4 mb-8">
        {/* Search Input */}
        <div className="relative w-1/2">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, SKU or category..."
            className="
              w-full rounded-xl border border-slate-200 bg-white shadow-sm
              pl-10 pr-4 py-2.5 h-10
              text-[13px] text-slate-900
              placeholder:text-slate-400
              outline-none
              focus:ring-2 focus:ring-teal-600/20
              focus:border-teal-600 focus:outline-none
              transition-all duration-200
            "
          />
        </div>

        {/* Add Product Button */}
        <button
          type="button"
          className="
            ml-auto flex items-center justify-center gap-2
            bg-teal-600 text-white
            px-5 py-2.5 h-10
            rounded-xl font-semibold text-[13px] shadow-sm
            hover:bg-teal-700 focus:ring-2 focus:ring-teal-600 focus:ring-offset-2
            active:scale-95
            transition-all duration-200
            whitespace-nowrap
          "
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-8">
        <table className="w-full text-sm">
          {/* Table Head */}
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {["Product Name", "Category", "Price", "Stock Level", "Status", "Actions"].map(
                (col) => (
                  <th
                    key={col}
                    className="py-4 px-6 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-50">
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400 text-[13px]">
                  No products match your search.
                </td>
              </tr>
            ) : (
              filteredInventory.map((item, idx) => (
                <tr
                  key={item.id}
                  className="group transition-colors duration-150 hover:bg-slate-50/60"
                >
                  {/* Product Name */}
                  <td className="py-5 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl ${item.iconBg}`}>
                        <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                      </span>
                      <span className="font-semibold text-slate-900">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-5 px-6 text-slate-500 text-[13px]">
                    {item.category}
                  </td>

                  {/* Price */}
                  <td className="py-5 px-6 font-medium text-slate-900 text-[13px]">
                    {formatCurrency(item.price)}
                  </td>

                  {/* Stock Level */}
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-1.5">
                      {item.stock <= 10 && (
                        <AlertTriangle
                          className={`h-3.5 w-3.5 ${item.stock === 0 ? "text-red-500" : "text-amber-500"}`}
                        />
                      )}
                      <span
                        className={`font-semibold text-[13px] ${
                          item.stock === 0
                            ? "text-red-600"
                            : item.stock <= 10
                            ? "text-amber-600"
                            : "text-slate-900"
                        }`}
                      >
                        {item.stock}
                      </span>
                      <span className="text-slate-400 text-[12px]">units</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-5 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150"
                        title="Edit product"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                        title="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer row — item count */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[12px] text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {filteredInventory.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">
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
