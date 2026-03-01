export default function ViewSaleModal({ isOpen, onClose, saleData }) {
  if (!isOpen || !saleData) return null;

  /* ── formatters ── */
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(amount);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const isCard = saleData.paymentMethod === "Card";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Sale Receipt</h2>
              <p className="text-xs text-gray-400">Read-only summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Receipt Body ── */}
        <div className="px-6 py-5">

          {/* Store branding strip */}
          <div className="mb-5 rounded-xl bg-indigo-600 px-5 py-4 text-center text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
              Dissanayake Super
            </p>
            <p className="mt-0.5 text-lg font-bold">Web POS</p>
            <p className="mt-1 text-xs text-indigo-300">Official Sale Receipt</p>
          </div>

          {/* Divider with scissors */}
          <div className="relative mb-5 flex items-center">
            <div className="flex-1 border-t border-dashed border-gray-200" />
            <span className="mx-2 text-gray-300">✂</span>
            <div className="flex-1 border-t border-dashed border-gray-200" />
          </div>

          {/* Detail rows */}
          <dl className="space-y-3">
            <Row label="Sale ID">
              <span className="font-mono font-bold text-indigo-600">{saleData.id}</span>
            </Row>

            <Row label="Customer">
              <span className="font-semibold text-gray-800">{saleData.customerName}</span>
            </Row>

            <Row label="Date">
              <span className="text-gray-700">{formatDate(saleData.date)}</span>
            </Row>

            <Row label="Payment">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  isCard
                    ? "bg-blue-100 text-blue-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isCard ? (
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path
                      fillRule="evenodd"
                      d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5 0a1 1 0 000 2h6a1 1 0 100-2H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path
                      fillRule="evenodd"
                      d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {saleData.paymentMethod}
              </span>
            </Row>
          </dl>

          {/* Total amount highlight */}
          <div className="mt-5 rounded-xl bg-gray-50 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Total Paid
              </span>
              <span className="text-2xl font-extrabold text-gray-900">
                {formatCurrency(saleData.totalAmount)}
              </span>
            </div>
          </div>

          {/* Bottom dashed divider */}
          <div className="relative mt-5 flex items-center">
            <div className="flex-1 border-t border-dashed border-gray-200" />
            <span className="mx-2 text-gray-300">✂</span>
            <div className="flex-1 border-t border-dashed border-gray-200" />
          </div>

          {/* Thank-you note */}
          <p className="mt-4 text-center text-xs text-gray-400">
            Thank you for your purchase! · Keep this receipt for your records.
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── helper sub-component ── */
function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-gray-400">{label}</dt>
      <dd className="text-right text-sm">{children}</dd>
    </div>
  );
}
