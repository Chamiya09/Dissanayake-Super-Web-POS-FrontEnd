/**
 * Formats a number as Sri Lankan Rupees (LKR).
 * @param {number | null | undefined} amount
 * @returns {string} e.g. "LKR 1,250.00"
 */
export function formatCurrency(amount) {
  const value = amount == null ? 0 : Number(amount);
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(value);
}
