import { createContext, useContext, useState } from "react";

// ─── Seed data (shown until real data arrives from the backend) ───────────────
const INITIAL_REORDERS = [
  {
    id:           "PO-2025-001",
    productName:  "Araliya Samba Rice 5kg",
    supplierName: "Araliya Rice Mills",
    quantity:     50,
    orderDate:    "2025-02-18",
    status:       "Received",
  },
  {
    id:           "PO-2025-002",
    productName:  "Sunflower Cooking Oil 1L",
    supplierName: "Edible Oils Lanka Pvt Ltd",
    quantity:     120,
    orderDate:    "2025-02-27",
    status:       "Confirmed",
  },
  {
    id:           "PO-2025-003",
    productName:  "Anchor Full Cream Milk Powder 400g",
    supplierName: "Anchor Dairy Distributors",
    quantity:     75,
    orderDate:    "2025-03-04",
    status:       "Pending",
  },
];

// ─── Context shape ────────────────────────────────────────────────────────────
const ReorderContext = createContext({
  reorders:    INITIAL_REORDERS,
  setReorders: () => {},
  addReorder:  () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ReorderProvider({ children }) {
  const [reorders, setReorders] = useState(INITIAL_REORDERS);

  /** Prepend a new order to the top of the list (Pending by default). */
  function addReorder(order) {
    setReorders((prev) => [order, ...prev]);
  }

  return (
    <ReorderContext.Provider value={{ reorders, setReorders, addReorder }}>
      {children}
    </ReorderContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useReorder() {
  return useContext(ReorderContext);
}
