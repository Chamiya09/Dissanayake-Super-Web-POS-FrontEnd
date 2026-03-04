import { useState } from "react";
import { Search, Plus, Package } from "lucide-react";

const InventoryPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Inventory Management
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Track and manage your product stock levels
        </p>
      </div>

      {/* Search & Action Bar */}
      <div className="flex items-center justify-between gap-4 mb-8">
        {/* Search Input */}
        <div className="relative w-1/2">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, SKU or category..."
            className="
              w-full bg-white dark:bg-slate-900
              rounded-xl border border-slate-100 dark:border-slate-800
              shadow-sm
              pl-10 pr-4 py-3
              text-sm text-slate-700 dark:text-slate-200
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              outline-none
              focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-50/10
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
            bg-slate-900 dark:bg-slate-50
            text-white dark:text-slate-900
            px-6 py-3
            rounded-xl font-medium text-sm
            shadow-sm
            hover:bg-slate-700 dark:hover:bg-slate-200
            active:scale-95
            transition-all duration-200
            whitespace-nowrap
          "
        >
          <Plus size={17} strokeWidth={2.5} />
          Add Product
        </button>
      </div>

      {/* Placeholder Content Area */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400 dark:text-slate-600">
          <Package size={48} strokeWidth={1.2} />
          <p className="text-sm font-medium">No inventory items to display</p>
          <p className="text-xs text-slate-400 dark:text-slate-600">
            Add a product to get started
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
