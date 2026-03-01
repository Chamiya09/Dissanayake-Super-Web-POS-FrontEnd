import { useState } from "react";

const initialSales = [
  {
    id: "SL-0001",
    customerName: "Amara Perera",
    date: "2026-02-25",
    paymentMethod: "Cash",
    totalAmount: 4850.0,
  },
  {
    id: "SL-0002",
    customerName: "Nimal Fernando",
    date: "2026-02-26",
    paymentMethod: "Card",
    totalAmount: 12300.5,
  },
  {
    id: "SL-0003",
    customerName: "Dilani Silva",
    date: "2026-02-27",
    paymentMethod: "Cash",
    totalAmount: 7625.75,
  },
  {
    id: "SL-0004",
    customerName: "Kasun Jayawardena",
    date: "2026-02-28",
    paymentMethod: "Card",
    totalAmount: 21480.0,
  },
];

const PAYMENT_METHODS = ["Cash", "Card"];

const emptyForm = {
  customerName: "",
  date: "",
  paymentMethod: "Cash",
  totalAmount: "",
};

export default function SalesManagement() {
  const [sales, setSales] = useState(initialSales);
  const [showModal, setShowModal] = useState(false);
  const [viewSale, setViewSale] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  /* ── helpers ── */
  const generateId = () => {
    const max = sales.reduce((acc, s) => {
      const num = parseInt(s.id.split("-")[1], 10);
      return num > acc ? num : acc;
    }, 0);
    return `SL-${String(max + 1).padStart(4, "0")}`;
  };

  const filtered = sales.filter(
    (s) =>
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ── form handlers ── */
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleRecordSale = () => {
    if (!form.customerName.trim()) return setFormError("Customer name is required.");
    if (!form.date) return setFormError("Date is required.");
    if (!form.totalAmount || isNaN(form.totalAmount) || Number(form.totalAmount) <= 0)
      return setFormError("Enter a valid total amount.");

    const newSale = {
      id: generateId(),
      customerName: form.customerName.trim(),
      date: form.date,
      paymentMethod: form.paymentMethod,
      totalAmount: parseFloat(Number(form.totalAmount).toFixed(2)),
    };

    setSales([newSale, ...sales]);
    setForm(emptyForm);
    setFormError("");
    setShowModal(false);
  };

  const handleDelete = (id) => {
    setSales(sales.filter((s) => s.id !== id));
    setDeleteTarget(null);
  };

  /* ── formatters ── */
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(amount);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  /* ── summary stats ── */
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const cashSales = sales.filter((s) => s.paymentMethod === "Cash").length;
  const cardSales = sales.filter((s) => s.paymentMethod === "Card").length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage all sales transactions
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Total Revenue
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Cash Transactions
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{cashSales}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Card Transactions
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{cardSales}</p>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Search by Sale ID or Customer…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:max-w-xs"
        />
        <button
          onClick={() => {
            setForm(emptyForm);
            setFormError("");
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Record New Sale
        </button>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {["Sale ID", "Customer Name", "Date", "Payment Method", "Total Amount", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-gray-400"
                  >
                    No sales records found.
                  </td>
                </tr>
              ) : (
                filtered.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-indigo-50/40 transition-colors"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono font-semibold text-indigo-600">
                      {sale.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-800">
                      {sale.customerName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(sale.date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          sale.paymentMethod === "Cash"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {sale.paymentMethod === "Cash" ? (
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                            <path
                              fillRule="evenodd"
                              d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                            <path
                              fillRule="evenodd"
                              d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5 0a1 1 0 000 2h6a1 1 0 100-2H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewSale(sale)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View
                        </button>
                        <button
                          onClick={() => setDeleteTarget(sale)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* table footer */}
        <div className="border-t border-gray-100 px-6 py-3">
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {sales.length} record{sales.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Record New Sale Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* modal header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Record New Sale</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
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

            {/* modal body */}
            <div className="space-y-4 px-6 py-5">
              {/* Customer Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleFormChange}
                  placeholder="e.g. Amara Perera"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Date */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <div className="flex gap-3">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method}
                      className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${
                        form.paymentMethod === method
                          ? method === "Cash"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={form.paymentMethod === method}
                        onChange={handleFormChange}
                        className="sr-only"
                      />
                      {method}
                    </label>
                  ))}
                </div>
              </div>

              {/* Total Amount */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Total Amount (LKR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="totalAmount"
                  value={form.totalAmount}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* error */}
              {formError && (
                <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {formError}
                </p>
              )}
            </div>

            {/* modal footer */}
            <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordSale}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Record Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Sale Modal ── */}
      {viewSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            {/* header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Sale Details</h2>
              <button
                onClick={() => setViewSale(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
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

            {/* content */}
            <div className="space-y-4 px-6 py-5">
              {[
                { label: "Sale ID", value: viewSale.id },
                { label: "Customer Name", value: viewSale.customerName },
                { label: "Date", value: formatDate(viewSale.date) },
                { label: "Payment Method", value: viewSale.paymentMethod },
                { label: "Total Amount", value: formatCurrency(viewSale.totalAmount) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                >
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setViewSale(null)}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="px-6 py-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Sale Record?</h3>
              <p className="mt-2 text-sm text-gray-500">
                You are about to permanently delete sale{" "}
                <span className="font-semibold text-gray-800">{deleteTarget.id}</span> for{" "}
                <span className="font-semibold text-gray-800">{deleteTarget.customerName}</span>.
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 active:scale-95 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
