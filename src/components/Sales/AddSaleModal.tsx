import { useState } from "react";

const PAYMENT_METHODS = ["Cash", "Card"];

const emptyForm = {
  customerName: "",
  paymentMethod: "Cash",
  totalAmount: "",
};

export default function AddSaleModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  /* ── validation ── */
  const validate = () => {
    const newErrors = {};
    if (!form.customerName.trim())
      newErrors.customerName = "Customer name is required.";
    if (!form.totalAmount || isNaN(form.totalAmount) || Number(form.totalAmount) <= 0)
      newErrors.totalAmount = "Enter a valid amount greater than 0.";
    return newErrors;
  };

  /* ── handlers ── */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSave = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const saleData = {
      customerName: form.customerName.trim(),
      paymentMethod: form.paymentMethod,
      totalAmount: parseFloat(Number(form.totalAmount).toFixed(2)),
    };

    console.log("New Sale Data:", saleData);
    onSave?.(saleData);

    setForm(emptyForm);
    setErrors({});
    onClose();
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setErrors({});
    onClose();
  };

  /* ── backdrop click ── */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Record New Sale</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the details below to add a sale.</p>
          </div>
          <button
            onClick={handleCancel}
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

        {/* ── Body ── */}
        <div className="space-y-5 px-6 py-5">

          {/* Customer Name */}
          <div>
            <label
              htmlFor="customerName"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              id="customerName"
              type="text"
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              placeholder="e.g. Amara Perera"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-colors placeholder-gray-400 focus:outline-none focus:ring-2 ${
                errors.customerName
                  ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                  : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"
              }`}
            />
            {errors.customerName && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.customerName}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label
              htmlFor="paymentMethod"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Payment Method
            </label>
            <div className="relative">
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {/* custom chevron */}
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* visual pill indicator */}
            <div className="mt-2 flex gap-2">
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    form.paymentMethod === method
                      ? method === "Cash"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div>
            <label
              htmlFor="totalAmount"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Total Amount (LKR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-gray-400">
                Rs.
              </span>
              <input
                id="totalAmount"
                type="number"
                name="totalAmount"
                value={form.totalAmount}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm transition-colors placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.totalAmount
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"
                }`}
              />
            </div>
            {errors.totalAmount && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.totalAmount}
              </p>
            )}
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={handleCancel}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Save
          </button>
        </div>

      </div>
    </div>
  );
}
