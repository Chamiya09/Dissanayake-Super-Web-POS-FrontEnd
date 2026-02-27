/* ─────────────────────────────────────────────────────────────────────────
   Loyalty Programme  –  Disanayaka Super
   ─────────────────────────────────────────────────────────────────────────
   Rules:
     • Earn  : 1 point per $1 spent (rounded down)
     • Redeem: 100 points = $1 discount  (capped at 20 % of order total)
     • Tiers : Bronze 0-499 | Silver 500-1999 | Gold 2000-4999 | Platinum 5000+
   ───────────────────────────────────────────────────────────────────────── */

export type LoyaltyTier = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface LoyaltyCustomer {
  id: string;          // "DSS-001234"
  name: string;
  phone: string;       // stored as digits only, e.g. "0712345678"
  points: number;
  tier: LoyaltyTier;
  totalSpent: number;
  joinDate: string;    // ISO date string
}

export const POINTS_PER_DOLLAR = 1;          // earn
export const POINTS_TO_DOLLAR  = 100;        // redeem: 100 pts = $1
export const MAX_REDEEM_PCT    = 0.20;       // max 20 % of order total

export const TIER_CONFIG: Record<LoyaltyTier, { min: number; label: string; icon: string; next: number }> = {
  Bronze:   { min: 0,    label: "Bronze",   icon: "🥉", next: 500  },
  Silver:   { min: 500,  label: "Silver",   icon: "🥈", next: 2000 },
  Gold:     { min: 2000, label: "Gold",     icon: "🥇", next: 5000 },
  Platinum: { min: 5000, label: "Platinum", icon: "💎", next: Infinity },
};

/* ── Sample customer data ── */
export const loyaltyCustomers: LoyaltyCustomer[] = [
  {
    id: "DSS-001234",
    name: "Nimal Perera",
    phone: "0712345678",
    points: 1240,
    tier: "Silver",
    totalSpent: 892.40,
    joinDate: "2024-03-15",
  },
  {
    id: "DSS-002891",
    name: "Kamali Fernando",
    phone: "0778892341",
    points: 3820,
    tier: "Gold",
    totalSpent: 2104.60,
    joinDate: "2023-11-02",
  },
  {
    id: "DSS-003047",
    name: "Roshan Silva",
    phone: "0761234567",
    points: 280,
    tier: "Bronze",
    totalSpent: 198.20,
    joinDate: "2025-01-10",
  },
  {
    id: "DSS-004512",
    name: "Priya Jayawardena",
    phone: "0703456789",
    points: 5680,
    tier: "Platinum",
    totalSpent: 4923.75,
    joinDate: "2023-06-20",
  },
  {
    id: "DSS-005123",
    name: "Ashan Bandara",
    phone: "0719876543",
    points: 890,
    tier: "Silver",
    totalSpent: 654.30,
    joinDate: "2024-07-08",
  },
  {
    id: "DSS-006789",
    name: "Sanduni Rathnayake",
    phone: "0756789012",
    points: 2340,
    tier: "Gold",
    totalSpent: 1867.90,
    joinDate: "2024-01-22",
  },
];

/* ── Helpers ── */

/** Normalise a raw query string for matching (digits for phone, alphanum for ID) */
function normalise(v: string) {
  return v.trim().toLowerCase().replace(/[\s\-()]/g, "");
}

/** Lookup by phone number or loyalty ID. Returns null when no match. */
export function findCustomer(query: string): LoyaltyCustomer | null {
  const q = normalise(query);
  if (!q) return null;
  return (
    loyaltyCustomers.find(
      (c) =>
        normalise(c.id) === q ||
        c.phone.replace(/\D/g, "") === q.replace(/\D/g, "")
    ) ?? null
  );
}

/**
 * Compute how many dollars a customer can redeem on an order.
 * @param customer  – loyalty customer
 * @param orderTotal – total BEFORE any loyalty discount
 */
export function computeRedeemable(customer: LoyaltyCustomer, orderTotal: number): number {
  const maxByPoints  = Math.floor(customer.points / POINTS_TO_DOLLAR);
  const maxByPercent = Math.floor(orderTotal * MAX_REDEEM_PCT * 100) / 100;
  return parseFloat(Math.min(maxByPoints, maxByPercent).toFixed(2));
}

/**
 * Compute how many points will be earned on an order.
 * Earned on the FINAL paid amount (after loyalty discount).
 */
export function computePointsEarned(finalTotal: number): number {
  return Math.floor(finalTotal * POINTS_PER_DOLLAR);
}
