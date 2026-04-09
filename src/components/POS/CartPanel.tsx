import {
  ShoppingBag, Minus, Plus, Trash2, Loader2,
  User, Star, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/data/products";
import type { LoyaltyCustomer } from "@/data/loyalty";
import { findCustomer, computeRedeemable, computePointsEarned, TIER_CONFIG } from "@/data/loyalty";
import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatCurrency";

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onSetQuantity: (productId: string, value: number) => void;
  onRemoveItem: (productId: string) => void;
  highlightId?: string | null;
  activeBucketIndex?: number;
  checkoutHotkeyNonce?: number;
  onCheckoutModalOpenChange?: (isOpen: boolean) => void;
  /** Called with the final charged amount after a successful checkout */
  onCheckout?: (totalAmount: number, paymentMethod: string) => Promise<void>;
  /** Enables cart keyboard shortcuts only when cart area is active. */
  keyboardActive?: boolean;
}

/*  Tier badge  */
function TierBadge({ tier }: { tier: LoyaltyCustomer["tier"] }) {
  const cfg = TIER_CONFIG[tier];
  const color: Record<string, string> = {
    Bronze:   "bg-amber-100  text-amber-700  border-amber-200",
    Silver:   "bg-slate-100  text-slate-500  border-slate-200",
    Gold:     "bg-yellow-50  text-yellow-600 border-yellow-200",
    Platinum: "bg-sky-50     text-sky-500    border-sky-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", color[tier])}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

/*  Swipeable row  */
function SwipeableItem({
  item,
  onUpdateQuantity,
  onSetQuantity,
  onRemoveItem,
  highlight,
  focused,
  emoji,
}: {
  item: CartItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, value: number) => void;
  onRemoveItem: (id: string) => void;
  highlight: boolean;
  focused: boolean;
  emoji: string;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [localQty, setLocalQty] = useState(() => item.quantity.toFixed(3));
  const inputFocusedRef = useRef(false);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);

  // Sync external quantity changes (from +/- buttons) into the input when not editing
  useEffect(() => {
    if (!inputFocusedRef.current) {
      setLocalQty(item.quantity.toFixed(3));
    }
  }, [item.quantity]);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    dragging.current = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current || startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) setOffsetX(Math.max(dx, -90));
  };
  const onTouchEnd = useCallback(() => {
    dragging.current = false;
    startX.current = null;
    if (offsetX < -60) onRemoveItem(item.product.id);
    else setOffsetX(0);
  }, [offsetX, item.product.id, onRemoveItem]);

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg transition-all duration-100",
      focused && "ring-2 ring-primary ring-offset-1"
    )}>
      {/* Red swipe-reveal background */}
      <div
        className="absolute inset-y-0 right-0 flex w-16 items-center justify-center rounded-lg bg-red-500"
        style={{ opacity: Math.min(Math.abs(offsetX) / 60, 1) }}
      >
        <Trash2 className="h-4 w-4 text-white" />
      </div>

      {/* Item row */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: offsetX === 0 ? "transform 0.2s ease" : "none",
        }}
        className={cn(
          "group flex items-center gap-2.5 rounded-lg border border-border bg-secondary/40 p-2.5 transition-colors duration-150 hover:bg-blue-50 hover:border-blue-200",
          highlight && "animate-highlight"
        )}
      >
        {/* Emoji badge */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[18px] shadow-sm border border-border">
          {emoji}
        </div>

        {/* Name + price */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-[12.5px] font-semibold leading-tight text-foreground">
            {item.product.name}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
            {formatCurrency(item.product.price)} ea.
          </p>
        </div>

        {/* Qty stepper */}
        <div className="flex items-center rounded-lg border border-border bg-white overflow-hidden shadow-sm">
          <button
            onClick={() => onUpdateQuantity(item.product.id, -1)}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Minus className="h-3 w-3 stroke-[2.5]" />
          </button>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={localQty}
            onFocus={() => { inputFocusedRef.current = true; }}
            onChange={(e) => setLocalQty(e.target.value)}
            onBlur={() => {
              inputFocusedRef.current = false;
              const v = parseFloat(localQty);
              if (!isNaN(v) && v > 0) {
                onSetQuantity(item.product.id, v);
                setLocalQty(v.toFixed(3));
              } else {
                setLocalQty(item.quantity.toFixed(3));
              }
            }}
            className="h-7 w-16 border-x border-border/50 text-center text-[11px] font-bold tabular-nums text-foreground bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            onClick={() => onUpdateQuantity(item.product.id, 1)}
            className="flex h-7 w-7 items-center justify-center text-primary transition-colors hover:bg-primary/10"
          >
            <Plus className="h-3 w-3 stroke-[2.5]" />
          </button>
        </div>

        {/* Line total */}
        <p className="w-14 text-right text-[12.5px] font-bold tabular-nums text-foreground">
          {formatCurrency(item.product.price * item.quantity)}
        </p>

        {/* Remove (hover, desktop) */}
        <button
          onClick={() => onRemoveItem(item.product.id)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/*  CartPanel  */
export function CartPanel({ items, onUpdateQuantity, onSetQuantity, onRemoveItem, highlightId, activeBucketIndex = -1, checkoutHotkeyNonce = 0, onCheckoutModalOpenChange, onCheckout, keyboardActive = true }: CartPanelProps) {
  const [processing, setProcessing] = useState(false);
  const cartRowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tenderedInputRef = useRef<HTMLInputElement>(null);
  const loyaltyInputRef = useRef<HTMLInputElement>(null);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState("");
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [loyaltyNumber, setLoyaltyNumber] = useState("");

  /* Loyalty state */
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<LoyaltyCustomer | null>(null);
  const [loyaltyNotFound, setLoyaltyNotFound] = useState(false);
  const [redeemPoints, setRedeemPoints]     = useState(false);

  /* Reset focus + loyalty when cart empties */
  useEffect(() => {
    if (items.length === 0) {
      setLoyaltyCustomer(null);
      setLoyaltyNumber("");
      setLoyaltyNotFound(false);
      setRedeemPoints(false);
      setTenderedAmount("");
      setCheckoutStep(1);
      setIsCheckoutModalOpen(false);
    }
  }, [items.length]);

  /* Scroll focused row into view */
  useEffect(() => {
    if (activeBucketIndex >= 0 && keyboardActive) {
      cartRowRefs.current[activeBucketIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeBucketIndex, keyboardActive]);

  /*  Totals  */
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const total = subtotal;

  /*  Loyalty computations  */
  const redeemableDollars = loyaltyCustomer ? computeRedeemable(loyaltyCustomer, total) : 0;
  const loyaltyDiscount   = redeemPoints && loyaltyCustomer ? redeemableDollars : 0;
  const finalTotal        = parseFloat(Math.max(0, total - loyaltyDiscount).toFixed(2));
  const pointsEarned      = loyaltyCustomer ? computePointsEarned(finalTotal) : 0;

  const completeCheckout = useCallback(async () => {
    setProcessing(true);
    try {
      await onCheckout?.(finalTotal, "Cash");
      setLoyaltyCustomer(null);
      setLoyaltyNumber("");
      setRedeemPoints(false);
      setTenderedAmount("");
      setCheckoutStep(1);
      setIsCheckoutModalOpen(false);
      window.print();
    } finally {
      setProcessing(false);
    }
  }, [finalTotal, onCheckout]);

  const openCheckoutModal = useCallback(() => {
    if (items.length === 0 || processing) return;
    setCheckoutStep(1);
    setTenderedAmount("");
    setIsCheckoutModalOpen(true);
  }, [items.length, processing]);

  useEffect(() => {
    if (!checkoutHotkeyNonce) return;
    if (!keyboardActive) return;
    if (items.length === 0) return;
    if (processing) return;
    openCheckoutModal();
  }, [checkoutHotkeyNonce, items.length, keyboardActive, openCheckoutModal, processing]);

  useEffect(() => {
    onCheckoutModalOpenChange?.(isCheckoutModalOpen);
  }, [isCheckoutModalOpen, onCheckoutModalOpenChange]);

  useEffect(() => {
    if (!isCheckoutModalOpen) return;
    const timer = window.setTimeout(() => {
      tenderedInputRef.current?.focus();
      tenderedInputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isCheckoutModalOpen]);

  /* Search helper */
  const doSearch = useCallback(() => {
    const found = findCustomer(loyaltyNumber);
    if (found) { setLoyaltyCustomer(found); setLoyaltyNotFound(false); }
    else setLoyaltyNotFound(true);
  }, [loyaltyNumber]);

  const tenderedValue = parseFloat(tenderedAmount);
  const safeTendered = Number.isNaN(tenderedValue) ? 0 : tenderedValue;
  const changeAmount = parseFloat((safeTendered - finalTotal).toFixed(2));
  const canAdvanceStep = safeTendered >= finalTotal;

  const handleCheckoutModalKeyDown = async (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
      e.preventDefault();
      const active = document.activeElement;
      if (active === loyaltyInputRef.current) {
        tenderedInputRef.current?.focus();
        tenderedInputRef.current?.select();
      } else {
        loyaltyInputRef.current?.focus();
        loyaltyInputRef.current?.select();
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsCheckoutModalOpen(false);
      setCheckoutStep(1);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (checkoutStep === 1) {
        if (canAdvanceStep) {
          setCheckoutStep(2);
        }
        return;
      }

      if (checkoutStep === 2 && canAdvanceStep && !processing) {
        await completeCheckout();
      }
    }
  };

  const categoryEmoji: Record<string, string> = {
    "Auto Care": "🚗",
    "Avurudu Kade": "🎉",
    "Baby Products": "👶",
    "Bakery": "🍞",
    "Beverages": "🧃",
    "Cooking Essentials": "🍳",
    "Dairy": "🥛",
    "Desserts & Ingredients": "🍰",
    "Food Cupboard": "🥫",
    "Frozen Food": "🧊",
    "Fruits": "🍎",
    "Health & Beauty": "🧴",
    "Household": "🏠",
    "Meats": "🥩",
    "Party Shop": "🎈",
    "Pet Products": "🐾",
    "Rice": "🌾",
    "Seafood": "🐟",
    "Seeds & Spices": "🌶️",
    "Snacks & Confectionery": "🍫",
    "Stationery": "📝",
    "Tea & Coffee": "☕",
    "Vegetables": "🥦",

    // Backward-compatible legacy categories
    "Rice & Grains": "🌾",
    "Dhal & Pulses": "🫘",
    "Flour & Baking": "🌾",
    "Cooking Oil": "🫙",
    "Spices & Condiments": "🌶️",
    "Dairy Products": "🥛",
    "Eggs & Meat": "🥩",
    "Instant Food": "🍜",
    "Snacks": "🍿",
    "Frozen Foods": "🧊",
    "Canned Foods": "🥫",
    "Personal Care": "🧴",
    "Cleaning Products": "🧹",
    "Household Items": "🏠",
  };

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold leading-none text-foreground">Active Basket</h2>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {items.length === 0 ? "No items yet" : `${items.length} item${items.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        {items.length > 0 && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2.5 text-[11.5px] font-bold text-primary-foreground shadow-md shadow-primary/30">
                {items.length}
              </span>
              <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-secondary px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground/60 select-none">
                Esc&nbsp;clear
              </kbd>
            </div>
            <p className="hidden sm:flex items-center gap-1 text-[9px] text-muted-foreground/45 select-none">
              <kbd className="rounded border border-border bg-secondary px-1 py-px font-mono text-[8px]">Shift+&#8593;&#8595;</kbd>
              <span>select</span>
              <span className="mx-0.5">&middot;</span>
              <kbd className="rounded border border-border bg-secondary px-1 py-px font-mono text-[8px]">+&nbsp;-</kbd>
              <span>qty</span>
              <span className="mx-0.5">&middot;</span>
              <kbd className="rounded border border-border bg-secondary px-1 py-px font-mono text-[8px]">Del</kbd>
              <span>remove</span>
            </p>
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/8 to-secondary shadow-inner">
              <ShoppingBag className="h-9 w-9 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-foreground/80">Basket is empty</p>
              <p className="mt-1 text-[11px] text-muted-foreground/60">Tap a product to add it</p>
            </div>
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={item.product.id} ref={(el) => { cartRowRefs.current[idx] = el; }}>
              <SwipeableItem
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onSetQuantity={onSetQuantity}
                onRemoveItem={onRemoveItem}
                highlight={highlightId === item.product.id}
                focused={keyboardActive && activeBucketIndex === idx}
                emoji={categoryEmoji[item.product.category] ?? "📦"}
              />
            </div>
          ))
        )}
      </div>

      {/* Checkout footer */}
      <div className="border-t border-border p-3 space-y-2.5 bg-card">
        {/*  Totals breakdown  */}
        <div className="rounded-xl border border-border bg-secondary/30 divide-y divide-border overflow-hidden text-[12.5px]">
          <div className="flex justify-between items-center px-3 py-2 text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums font-semibold text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          {loyaltyDiscount > 0 && (
            <div className="flex justify-between items-center px-3 py-2 bg-amber-50/60">
              <span className="flex items-center gap-1.5 text-amber-600">
                <Star className="h-3 w-3 fill-amber-400/30" />
                Loyalty Discount
              </span>
              <span className="tabular-nums font-bold text-amber-600">
                -{formatCurrency(loyaltyDiscount)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center px-3 py-2.5 bg-blue-50 border-t border-blue-100">
            <span className="text-[13px] font-bold text-foreground">Total</span>
            <div className="flex items-baseline gap-1.5">
              {loyaltyDiscount > 0 && (
                <span className="text-[11px] line-through text-muted-foreground tabular-nums">{formatCurrency(total)}</span>
              )}
              <span className="tabular-nums text-[15px] font-extrabold text-primary">{formatCurrency(finalTotal)}</span>
            </div>
          </div>
        </div>

        {/*  Charge button  */}
        <Button
          onClick={openCheckoutModal}
          disabled={items.length === 0 || processing}
          className="relative w-full h-14 rounded-xl bg-emerald-600 text-white font-bold text-[15px] tracking-wide hover:bg-emerald-700 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {processing ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" />Processing&hellip;</>
          ) : (
            <>
              <span>Checkout</span>
              <span className="ml-2 tabular-nums text-[18px] font-extrabold">{formatCurrency(finalTotal)}</span>
              {loyaltyDiscount > 0 && (
                <span className="ml-2 rounded-full bg-amber-400/25 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                  &#9733; -{formatCurrency(loyaltyDiscount)} off
                </span>
              )}
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded border border-white/30 bg-white/15 px-1.5 py-0.5 text-[10px] font-mono text-white/80 select-none">
                Enter x2
              </kbd>
            </>
          )}
        </Button>

      </div>

      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onKeyDown={handleCheckoutModalKeyDown}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Checkout</p>
                <h3 className="text-xl font-bold text-foreground">{formatCurrency(finalTotal)}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="rounded-md p-2 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Loyalty Number
                </label>
                <div className="flex gap-2">
                  <input
                    ref={loyaltyInputRef}
                    type="text"
                    value={loyaltyNumber}
                    onChange={(e) => {
                      setLoyaltyNumber(e.target.value);
                      setLoyaltyNotFound(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        doSearch();
                      }
                      void handleCheckoutModalKeyDown(e);
                    }}
                    placeholder="Phone or Loyalty ID"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Button type="button" variant="secondary" onClick={doSearch} className="h-10 px-3">Apply</Button>
                </div>
                {loyaltyNotFound && <p className="mt-1 text-xs text-destructive">No loyalty member found.</p>}
              </div>

              {loyaltyCustomer && (
                <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{loyaltyCustomer.name}</span>
                    </div>
                    <TierBadge tier={loyaltyCustomer.tier} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-muted-foreground">
                    <span>{loyaltyCustomer.points.toLocaleString()} pts</span>
                    <span>+{pointsEarned} pts</span>
                  </div>
                  {redeemableDollars > 0 && (
                    <button
                      type="button"
                      onClick={() => setRedeemPoints((p) => !p)}
                      className={cn(
                        "mt-2 w-full rounded-md border px-2 py-1.5 text-left text-xs font-medium",
                        redeemPoints ? "border-amber-400 bg-amber-50 text-amber-700" : "border-border bg-background text-muted-foreground"
                      )}
                    >
                      {redeemPoints ? "Remove" : "Apply"} loyalty discount ({formatCurrency(redeemableDollars)})
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tendered Amount
                </label>
                <input
                  ref={tenderedInputRef}
                  type="number"
                  step="any"
                  min="0"
                  value={tenderedAmount}
                  disabled={checkoutStep === 2}
                  onChange={(e) => setTenderedAmount(e.target.value)}
                  onKeyDown={(e) => void handleCheckoutModalKeyDown(e)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-lg font-semibold tabular-nums outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                />
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Change</span>
                  <span className={cn("font-bold tabular-nums", changeAmount >= 0 ? "text-emerald-600" : "text-red-600")}>{formatCurrency(changeAmount)}</span>
                </div>
              </div>

              <div className="pt-1 text-xs text-muted-foreground">
                {checkoutStep === 1 ? (
                  <span>Press Enter to confirm amount, then Enter again to complete checkout.</span>
                ) : (
                  <span className="font-semibold text-emerald-600">Ready to complete. Press Enter to finalize and print receipt.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}