import { createContext, useContext, useState } from "react";

// Seed data removed — history is loaded from GET /api/v1/reorder/history
const INITIAL_REORDERS = [];

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
