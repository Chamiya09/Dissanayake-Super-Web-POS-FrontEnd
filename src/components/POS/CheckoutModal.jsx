import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/context/GlobalToastContext";

const STEP = {
  METHOD: "METHOD",
  CARD_AWAIT: "CARD_AWAIT",
  CASH_INPUT: "CASH_INPUT",
  CASH_CONFIRM: "CASH_CONFIRM",
};

const METHODS = ["CASH", "CARD"];

export default function CheckoutModal({
  isOpen,
  onClose,
  totalAmount,
  onCompleteSale,
}) {
  const { showToast } = useToast();

  const [step, setStep] = useState(STEP.METHOD);
  const [methodIndex, setMethodIndex] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [tenderedInput, setTenderedInput] = useState("");
  const [balance, setBalance] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const tenderedRef = useRef(null);

  const total = useMemo(() => {
    const n = Number(totalAmount);
    return Number.isFinite(n) ? n : 0;
  }, [totalAmount]);

  const parsedTendered = useMemo(() => {
    const n = Number(tenderedInput);
    return Number.isFinite(n) ? n : NaN;
  }, [tenderedInput]);

  const resetState = useCallback(() => {
    setStep(STEP.METHOD);
    setMethodIndex(0);
    setPaymentMethod("CASH");
    setTenderedInput("");
    setBalance(null);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    resetState();
  }, [isOpen, resetState]);

  useEffect(() => {
    if (!isOpen || step !== STEP.CASH_INPUT) return;
    const timer = window.setTimeout(() => {
      if (tenderedRef.current) {
        tenderedRef.current.focus();
        tenderedRef.current.select();
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen, step]);

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
    [onClose, onCompleteSale, submitting]
  );

  const handleMethodConfirm = useCallback(() => {
    const selected = METHODS[methodIndex];
    setPaymentMethod(selected);

    if (selected === "CARD") {
      setStep(STEP.CARD_AWAIT);
      return;
    }

    setStep(STEP.CASH_INPUT);
  }, [methodIndex]);

  const handleCheckout = useCallback(() => {
    const toCleanNumber = (value) => Number(String(value ?? "").replace(/[^0-9.-]+/g, ""));

    const cleanBill = toCleanNumber(totalAmount);
    const cleanGiven = toCleanNumber(tenderedInput);

    console.log("Parsed Bill:", cleanBill, "Parsed Tendered:", cleanGiven);

    if (Number.isNaN(cleanGiven) || Number.isNaN(cleanBill)) {
      showToast("Invalid number format", "error");
      return;
    }

    if (cleanGiven < cleanBill) {
      showToast("Insufficient amount", "error");
      return;
    }

    const changeAmount = Number((cleanGiven - cleanBill).toFixed(2));
    setBalance(changeAmount);
    setStep(STEP.CASH_CONFIRM);
  }, [showToast, tenderedInput, totalAmount]);

  const handleEnter = useCallback(() => {
    if (submitting) return;

    if (step === STEP.METHOD) {
      handleMethodConfirm();
      return;
    }

    if (step === STEP.CARD_AWAIT) {
      void completeSale({ method: "CARD" });
      return;
    }

    if (step === STEP.CASH_INPUT) {
      handleCheckout();
      return;
    }

    if (step === STEP.CASH_CONFIRM) {
      if (!Number.isFinite(parsedTendered) || balance === null) {
        showToast("Insufficient amount", "error");
        return;
      }
      void completeSale({
        method: "CASH",
        tendered: parsedTendered,
        balance,
      });
    }
  }, [
    balance,
    completeSale,
    handleCheckout,
    handleMethodConfirm,
    parsedTendered,
    showToast,
    step,
    submitting,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      const isActivationKey = e.key === "Enter" || e.code === "Space";

      if (e.key === "Escape") {
        e.preventDefault();
        if (!submitting) onClose();
        return;
      }

      if (step === STEP.METHOD) {
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          setMethodIndex(0);
          setPaymentMethod("CASH");
          return;
        }

        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          setMethodIndex(1);
          setPaymentMethod("CARD");
          return;
        }
      }

      if (isActivationKey) {
        e.preventDefault();
        handleEnter();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [handleEnter, isOpen, onClose, step, submitting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">Checkout</h2>
          <p className="mt-1 text-sm text-slate-500">
            Total: <span className="font-semibold">Rs. {total.toFixed(2)}</span>
          </p>
        </div>

        {step === STEP.METHOD && (
          <div>
            <p className="mb-4 text-sm font-medium text-slate-700">Select Payment Method</p>

            <div className="grid grid-cols-2 gap-3">
              {METHODS.map((method, index) => {
                const active = methodIndex === index;
                return (
                  <button
                    key={method}
                    type="button"
                    onMouseEnter={() => {
                      setMethodIndex(index);
                      setPaymentMethod(method);
                    }}
                    onClick={() => {
                      setMethodIndex(index);
                      setPaymentMethod(method);
                    }}
                    className={[
                      "h-24 rounded-xl border-2 text-lg font-bold transition-all",
                      active
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                    ].join(" ")}
                  >
                    {method}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-slate-500">Use Arrow Keys to select, then Space or Enter to continue</p>
          </div>
        )}

        {step === STEP.CARD_AWAIT && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Awaiting Card Payment...</p>
              <p className="mt-1 text-base font-semibold text-slate-800">Swipe / Insert Card</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">Rs. {total.toFixed(2)}</p>
            </div>
            <p className="text-center text-xs text-slate-500">Press Space or Enter to complete sale</p>
          </div>
        )}

        {step === STEP.CASH_INPUT && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Total Bill</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">Rs. {total.toFixed(2)}</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Amount Tendered (Cash Given)</label>
              <input
                ref={tenderedRef}
                type="number"
                min="0"
                step="0.01"
                value={tenderedInput}
                onChange={(e) => setTenderedInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-lg font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="0.00"
              />
            </div>

            <p className="text-xs text-slate-500">Press Space or Enter to calculate balance</p>
          </div>
        )}

        {step === STEP.CASH_CONFIRM && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Total Bill</p>
              <p className="mt-1 text-xl font-bold text-slate-900">Rs. {total.toFixed(2)}</p>
              <p className="mt-3 text-sm text-slate-600">Amount Tendered</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">Rs. {Number(parsedTendered).toFixed(2)}</p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-sm text-emerald-700">Balance to Return</p>
              <p className="mt-1 text-3xl font-extrabold text-emerald-600">Rs. {(balance ?? 0).toFixed(2)}</p>
            </div>

            <p className="text-center text-xs text-slate-500">Press Space or Enter again to complete sale</p>
          </div>
        )}
      </div>
    </div>
  );
}
