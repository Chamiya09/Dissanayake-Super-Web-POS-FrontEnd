import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Banknote, CreditCard, Wallet, ArrowRightLeft } from "lucide-react";
import { useToast } from "@/context/GlobalToastContext";

const PAYMENT_METHODS = {
  CASH: "CASH",
  CARD: "CARD",
};

const QUICK_CASH_VALUES = [500, 1000, 5000];

export default function CheckoutModal({
  isOpen,
  onClose,
  totalAmount,
  onCompleteSale,
}) {
  const { showToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [tenderedInput, setTenderedInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focusedQuickCashIndex, setFocusedQuickCashIndex] = useState(0);
  const modalRef = useRef(null);
  const tenderedRef = useRef(null);
  const quickCashButtonRefs = useRef([]);

  const total = useMemo(() => {
    const n = Number(totalAmount);
    return Number.isFinite(n) ? n : 0;
  }, [totalAmount]);

  const parsedTendered = useMemo(() => {
    const normalized = String(tenderedInput ?? "").replace(/[^0-9.]+/g, "");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN;
  }, [tenderedInput]);

  const balance = useMemo(() => {
    if (!Number.isFinite(parsedTendered)) return 0;
    return Math.max(0, Number((parsedTendered - total).toFixed(2)));
  }, [parsedTendered, total]);

  const quickCashOptions = useMemo(
    () => [
      { label: "Exact Amount", value: total, accent: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
      ...QUICK_CASH_VALUES.map((value) => ({
        label: `Rs. ${value.toLocaleString()}`,
        value,
        accent: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      })),
    ],
    [total],
  );

  const resetState = useCallback(() => {
    setPaymentMethod(PAYMENT_METHODS.CASH);
    setTenderedInput("");
    setSubmitting(false);
    setFocusedQuickCashIndex(0);
  }, []);

  const focusTendered = useCallback((select = true) => {
    const input = tenderedRef.current;
    if (!input) return;
    input.focus();
    if (select) {
      input.select();
    } else {
      const valueLength = input.value.length;
      input.setSelectionRange(valueLength, valueLength);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    resetState();
    modalRef.current?.focus();
    focusTendered();
  }, [focusTendered, isOpen, resetState]);

  useEffect(() => {
    if (!isOpen || paymentMethod !== PAYMENT_METHODS.CASH) return;
    focusTendered();
  }, [focusTendered, isOpen, paymentMethod]);

  const completeSale = useCallback(
    async (payload) => {
      if (submitting) return;
      setSubmitting(true);
      try {
        await Promise.resolve(onCompleteSale(payload));
        onClose();
      } finally {
        setSubmitting(false);
      }
    },
    [onClose, onCompleteSale, submitting],
  );

  const handleSubmit = useCallback(() => {
    if (submitting) return;

    if (paymentMethod === PAYMENT_METHODS.CARD) {
      void completeSale({ method: PAYMENT_METHODS.CARD });
      return;
    }

    if (!Number.isFinite(parsedTendered)) {
      showToast("Enter the cash amount given by the customer", "error");
      return;
    }

    if (parsedTendered < total) {
      showToast("Insufficient cash amount", "error");
      return;
    }

    void completeSale({
      method: PAYMENT_METHODS.CASH,
      tendered: Number(parsedTendered.toFixed(2)),
      balance,
    });
  }, [balance, completeSale, parsedTendered, paymentMethod, showToast, submitting, total]);

  const applyTenderedAmount = useCallback(
    (value) => {
      setTenderedInput(value.toFixed(2));
      focusTendered();
    },
    [focusTendered],
  );

  const focusQuickCashButton = useCallback((index) => {
    const normalizedIndex = Math.max(0, Math.min(index, quickCashOptions.length - 1));
    setFocusedQuickCashIndex(normalizedIndex);
    quickCashButtonRefs.current[normalizedIndex]?.focus();
  }, [quickCashOptions.length]);

  const handleModalKeyDown = useCallback((e) => {
    const activeEl = document.activeElement;
    const quickCashIndex = quickCashButtonRefs.current.findIndex((button) => button === activeEl);
    const quickCashFocused = paymentMethod === PAYMENT_METHODS.CASH && quickCashIndex !== -1;
    const isArrowKey = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key);

    if (isArrowKey) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation?.();

      if (quickCashFocused) {
        if (e.key === "ArrowRight") {
          focusQuickCashButton(quickCashIndex + 1);
          return;
        }

        if (e.key === "ArrowLeft") {
          focusQuickCashButton(quickCashIndex - 1);
          return;
        }

        if (e.key === "ArrowDown") {
          focusQuickCashButton(quickCashIndex + 2);
          return;
        }

        if (e.key === "ArrowUp") {
          focusQuickCashButton(quickCashIndex - 2);
          return;
        }
      }

      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (!submitting) onClose();
      return;
    }

    if (e.key === "F1") {
      e.preventDefault();
      e.stopPropagation();
      setPaymentMethod(PAYMENT_METHODS.CASH);
      return;
    }

    if (e.key === "F2") {
      e.preventDefault();
      e.stopPropagation();
      setPaymentMethod(PAYMENT_METHODS.CARD);
      return;
    }

    if (quickCashFocused) {
      const numericKey = /^[0-9]$/.test(e.key) ? e.key : null;
      const numpadDigit = /^Numpad[0-9]$/.test(e.code) ? e.code.replace("Numpad", "") : null;
      const decimalKey = e.key === "." || e.code === "NumpadDecimal" ? "." : null;

      if (numericKey !== null || numpadDigit !== null || decimalKey !== null) {
        e.preventDefault();
        e.stopPropagation();
        const nextValue = numericKey ?? numpadDigit ?? decimalKey;
        setTenderedInput(nextValue === "." ? "0." : nextValue);
        focusTendered(false);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        applyTenderedAmount(quickCashOptions[quickCashIndex].value);
        return;
      }
    }

    if (e.key === "Enter" || e.code === "Space") {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  }, [applyTenderedAmount, focusQuickCashButton, focusTendered, handleSubmit, onClose, paymentMethod, quickCashOptions, submitting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />

      <div
        ref={modalRef}
        tabIndex={-1}
        onKeyDown={handleModalKeyDown}
        className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl outline-none"
      >
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Checkout</h2>
              <p className="mt-1 text-sm text-slate-500">
                Fast cashier mode. <span className="font-medium">F1</span> Cash, <span className="font-medium">F2</span> Card, <span className="font-medium">Enter/Space</span> Complete
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-5 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total Bill</p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">Rs. {total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod(PAYMENT_METHODS.CASH)}
              className={[
                "flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all",
                paymentMethod === PAYMENT_METHODS.CASH
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">CASH</p>
                  <p className="text-xs opacity-80">F1 shortcut</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod(PAYMENT_METHODS.CARD)}
              className={[
                "flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all",
                paymentMethod === PAYMENT_METHODS.CARD
                  ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">CARD</p>
                  <p className="text-xs opacity-80">F2 shortcut</p>
                </div>
              </div>
            </button>
          </div>

          {paymentMethod === PAYMENT_METHODS.CASH ? (
            <div className="grid gap-5 lg:grid-cols-[1.25fr_0.95fr]">
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-semibold text-slate-700">Quick Cash</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {quickCashOptions.map((option, index) => (
                      <button
                        key={`${option.label}-${option.value}`}
                        type="button"
                        ref={(element) => {
                          quickCashButtonRefs.current[index] = element;
                        }}
                        onFocus={() => setFocusedQuickCashIndex(index)}
                        onClick={() => applyTenderedAmount(option.value)}
                        className={[
                          "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400",
                          option.accent,
                          focusedQuickCashIndex === index ? "border-emerald-500 ring-2 ring-emerald-400 ring-offset-1" : "",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Amount Tendered</label>
                  <input
                    ref={tenderedRef}
                    type="number"
                    min="0"
                    step="0.01"
                    value={tenderedInput}
                    onChange={(e) => setTenderedInput(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-4 text-2xl font-bold text-slate-900 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
                <div className="flex items-center gap-2 text-emerald-700">
                  <ArrowRightLeft className="h-4 w-4" />
                  <p className="text-sm font-semibold">Balance to Return</p>
                </div>
                <div className="py-6">
                  <p className="text-5xl font-extrabold tracking-tight text-emerald-600">
                    Rs. {balance.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Tendered</span>
                    <span className="font-semibold text-slate-900">
                      Rs. {Number.isFinite(parsedTendered) ? parsedTendered.toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-6 py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <p className="mt-4 text-lg font-bold text-slate-900">Process payment on Card Terminal</p>
              <p className="mt-1 text-sm text-slate-500">When payment is approved, press Enter or Space to complete the sale.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <p className="text-xs text-slate-500">
            {paymentMethod === PAYMENT_METHODS.CASH
              ? "Cash mode: Enter cash received or use quick buttons"
              : "Card mode: complete after terminal approval"}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Complete Sale"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
