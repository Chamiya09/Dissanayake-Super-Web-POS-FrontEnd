/**
 * SkeletonTable.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal loading-state component for the Solid White Professional Theme.
 *
 * Exports:
 *   SkeletonTable   – pulsing table rows (drops inside any card/table wrapper)
 *   SkeletonCard    – pulsing metric / analytics card
 *   SkeletonRow     – single row, useful for custom layouts
 *
 * Props (SkeletonTable):
 *   rows     {number}   Number of skeleton rows to render.        Default: 5
 *   columns  {Array}    Array of column descriptors.              Default: preset
 *
 * Column descriptor shape:
 *   { width: "w-40", align?: "right", flexible?: true }
 *
 *   width      – Tailwind width class for the bar (e.g. "w-40", "w-16")
 *   align      – "right" → pushes this bar to the end of the row via ml-auto
 *   flexible   – true  → uses flex-1 instead of a fixed width
 *
 * Design tokens (Solid White Professional):
 *   Bars   : bg-slate-100, rounded-md, h-4
 *   Rows   : divide-y divide-slate-100, px-6 py-4
 *   Motion : animate-pulse (Tailwind default)
 *
 * Fade-in helper (use around your real content):
 *   <div className={`transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}>
 *     ...real content...
 *   </div>
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Default column preset ─────────────────────────────────────────────────────
const DEFAULT_COLUMNS = [
  { width: "w-8" },                       // row index / ID badge
  { width: "w-44", flexible: true },      // primary name / description
  { width: "w-20" },                      // secondary label (SKU, date…)
  { width: "w-20" },                      // tertiary value
  { width: "w-16" },                      // status badge
  { width: "w-24", align: "right" },      // action buttons
];

// ── SkeletonRow ───────────────────────────────────────────────────────────────
export function SkeletonRow({ columns = DEFAULT_COLUMNS }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      {columns.map((col, i) => (
        <div
          key={i}
          className={[
            "h-4 shrink-0 rounded-md bg-slate-100",
            col.flexible ? "flex-1" : col.width,
            col.align === "right" ? "ml-auto" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      ))}
    </div>
  );
}

// ── SkeletonTable ─────────────────────────────────────────────────────────────
export function SkeletonTable({ rows = 5, columns = DEFAULT_COLUMNS }) {
  return (
    <div className="divide-y divide-slate-100 animate-pulse" aria-busy="true" aria-label="Loading data">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </div>
  );
}

// ── SkeletonCard ──────────────────────────────────────────────────────────────
/**
 * Mimics a metric card (icon top-left, big value, sub-label).
 * Drop it directly where a MetricCard/AnalyticsCard would normally render.
 *
 * Props:
 *   slim  {boolean}  Use a more compact height. Default: false
 */
export function SkeletonCard({ slim = false }) {
  return (
    <div
      className="animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      aria-busy="true"
      aria-label="Loading card"
    >
      <div className={`flex flex-col gap-3 p-5 ${slim ? "pb-4" : ""}`}>
        {/* Icon badge + tag line */}
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 rounded-xl bg-slate-100 shrink-0" />
          <div className="h-4 w-16 rounded-full bg-slate-100 mt-1" />
        </div>

        {/* Big metric value */}
        <div className={`h-7 rounded-md bg-slate-100 ${slim ? "w-24" : "w-32"}`} />

        {/* Sub-label */}
        <div className="h-3 w-40 rounded-md bg-slate-100" />
      </div>

      {/* Bottom accent strip */}
      {!slim && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5">
          <div className="h-3 w-28 rounded-md bg-slate-100" />
        </div>
      )}
    </div>
  );
}

export default SkeletonTable;
