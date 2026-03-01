import {
  ShoppingBag, Minus, Plus, Trash2, Loader2,
  Gift, User, Star, Phone, Search, X, AlertCircle, Check, ChevronDown,
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
  onRemoveItem: (productId: string) => void;
  highlightId?: string | null;
  /** Called with the final charged amount after a successful checkout */
  onCheckout?: (totalAmount: number, paymentMethod: string) => void;
}

/*  Tier badge  */
function TierBadge({ tier }: { tier: LoyaltyCustomer["tier"] }) {
  const cfg = TIER_CONFIG[tier];
  const color: Record<string, string> = {
    Bronze:   "bg-amber-100  text-amber-700  border-amber-200  dark:bg-amber-900/30  dark:text-amber-500  dark:border-amber-800",
    Silver:   "bg-slate-100  text-slate-500  border-slate-200  dark:bg-slate-800/60  dark:text-slate-400  dark:border-slate-700",
    Gold:     "bg-yellow-50  text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    Platinum: "bg-sky-50     text-sky-500    border-sky-200    dark:bg-sky-900/30    dark:text-sky-400    dark:border-sky-800",
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
  onRemoveItem,
  highlight,
  focused,
  emoji,
}: {
  item: CartItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  highlight: boolean;
  focused: boolean;
  emoji: string;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);

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
          <span className="w-7 border-x border-border/50 text-center text-[12px] font-bold tabular-nums text-foreground">
            {item.quantity}
          </span>
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
export function CartPanel({ items, onUpdateQuantity, onRemoveItem, highlightId, onCheckout }: CartPanelProps) {
  const [processing, setProcessing] = useState(false);
  const [cartFocusedIdx, setCartFocusedIdx] = useState(-1);
  const cartRowRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* Loyalty state */
  const [loyaltyOpen, setLoyaltyOpen]       = useState(false);
  const [loyaltyInput, setLoyaltyInput]     = useState("");
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<LoyaltyCustomer | null>(null);
  const [loyaltyNotFound, setLoyaltyNotFound] = useState(false);
  const [redeemPoints, setRedeemPoints]     = useState(false);

  /* Stable refs to avoid stale closures */
  const cartFocusedIdxRef = useRef(cartFocusedIdx);
  const cartItemsRef = useRef(items);
  useEffect(() => { cartFocusedIdxRef.current = cartFocusedIdx; }, [cartFocusedIdx]);
  useEffect(() => { cartItemsRef.current = items; });

  /* Reset focus + loyalty when cart empties */
  useEffect(() => {
    if (items.length === 0) {
      setCartFocusedIdx(-1);
      setLoyaltyCustomer(null);
      setLoyaltyOpen(false);
      setLoyaltyInput("");
      setLoyaltyNotFound(false);
      setRedeemPoints(false);
    }
  }, [items.length]);

  /* Scroll focused row into view */
  useEffect(() => {
    if (cartFocusedIdx >= 0) {
      cartRowRefs.current[cartFocusedIdx]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [cartFocusedIdx]);

  /*  Totals  */
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  /*  Loyalty computations  */
  const redeemableDollars = loyaltyCustomer ? computeRedeemable(loyaltyCustomer, total) : 0;
  const loyaltyDiscount   = redeemPoints && loyaltyCustomer ? redeemableDollars : 0;
  const finalTotal        = parseFloat(Math.max(0, total - loyaltyDiscount).toFixed(2));
  const pointsEarned      = loyaltyCustomer ? computePointsEarned(finalTotal) : 0;

  /*  Payment handler  */
  const handlePayment = useCallback(() => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      /* Notify parent so it can persist the sale and clear the cart */
      onCheckout?.(finalTotal, "Cash");
      /* Reset loyalty after successful payment */
      setLoyaltyCustomer(null);
      setLoyaltyOpen(false);
      setLoyaltyInput("");
      setRedeemPoints(false);
    }, 2000);
  }, [finalTotal, onCheckout]);

  /* Search helper */
  const doSearch = useCallback(() => {
    const found = findCustomer(loyaltyInput);
    if (found) { setLoyaltyCustomer(found); setLoyaltyNotFound(false); }
    else setLoyaltyNotFound(true);
  }, [loyaltyInput]);

  /* [Space] -> trigger charge when not typing */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        items.length > 0 &&
        !processing
      ) {
        e.preventDefault();
        handlePayment();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items.length, processing, handlePayment]);

  /* Cart keyboard navigation: Alt+Up/Down move, -/+ qty, Delete remove */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;
      if (isInInput) return;

      const cur    = cartFocusedIdxRef.current;
      const cItems = cartItemsRef.current;

      if (e.altKey && e.key === "ArrowDown") {
        e.preventDefault();
        setCartFocusedIdx(cur < 0 ? 0 : Math.min(cur + 1, cItems.length - 1));
      } else if (e.altKey && e.key === "ArrowUp") {
        e.preventDefault();
        setCartFocusedIdx(cur <= 0 ? 0 : cur - 1);
      } else if (!e.altKey && (e.key === "-" || e.key === "_") && cur >= 0 && cItems[cur]) {
        e.preventDefault();
        onUpdateQuantity(cItems[cur].product.id, -1);
      } else if (!e.altKey && (e.key === "+" || e.key === "=") && cur >= 0 && cItems[cur]) {
        e.preventDefault();
        onUpdateQuantity(cItems[cur].product.id, 1);
      } else if (e.key === "Delete" && cur >= 0 && cItems[cur]) {
        e.preventDefault();
        onRemoveItem(cItems[cur].product.id);
        setCartFocusedIdx(Math.min(cur, cItems.length - 2));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onUpdateQuantity, onRemoveItem]);

  const categoryEmoji: Record<string, string> = {
    Fruits: "", Dairy: "", Beverages: "",
    Bakery: "", Snacks: "", Meat: "", Vegetables: "",
  };

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingBag className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold leading-none text-foreground">Active Basket</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {items.length === 0 ? "No items yet" : `${items.length} item${items.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        {items.length > 0 && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-[11px] font-bold text-primary-foreground shadow-md shadow-primary/30">
                {items.length}
              </span>
              <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-secondary px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground/60 select-none">
                Esc&nbsp;clear
              </kbd>
            </div>
            <p className="hidden sm:flex items-center gap-1 text-[9px] text-muted-foreground/45 select-none">
              <kbd className="rounded border border-border bg-secondary px-1 py-px font-mono text-[8px]">Alt+&#8593;&#8595;</kbd>
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
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
                onRemoveItem={onRemoveItem}
                highlight={highlightId === item.product.id}
                focused={cartFocusedIdx === idx}
                emoji={categoryEmoji[item.product.category] ?? ""}
              />
            </div>
          ))
        )}
      </div>

      {/* Checkout footer */}
      <div className="border-t border-border p-3 space-y-2.5 bg-card">

        {/*  Loyalty section  */}
        {items.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden">

            {/* State 1: CTA collapsed */}
            {!loyaltyOpen && !loyaltyCustomer && (
              <button
                onClick={() => setLoyaltyOpen(true)}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left hover:bg-primary/5 transition-colors group"
              >
                <Gift className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary transition-colors" />
                <span className="flex-1 text-[12px] text-muted-foreground">Add loyalty member</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
              </button>
            )}

            {/* State 2: Input open */}
            {loyaltyOpen && !loyaltyCustomer && (
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                    <input
                      autoFocus
                      value={loyaltyInput}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLoyaltyInput(v);
                        setLoyaltyNotFound(false);
                        if (v.trim().length >= 10) {
                          const found = findCustomer(v);
                          if (found) setLoyaltyCustomer(found);
                          else if (v.trim().length >= 12) setLoyaltyNotFound(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); doSearch(); }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          setLoyaltyOpen(false);
                          setLoyaltyInput("");
                          setLoyaltyNotFound(false);
                        }
                      }}
                      placeholder="Phone or Loyalty ID (DSS-XXXXXX)"
                      className="w-full rounded-lg border border-border bg-background pl-8 pr-2 py-[7px] text-[12.5px] focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-[34px] px-2.5 shrink-0"
                    onClick={doSearch}
                  >
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                  <button
                    onClick={() => { setLoyaltyOpen(false); setLoyaltyInput(""); setLoyaltyNotFound(false); }}
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {loyaltyNotFound && (
                  <p className="flex items-center gap-1.5 text-[11.5px] text-destructive">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    No member found. Try a different number or ID.
                  </p>
                )}
                <p className="text-[10.5px] text-muted-foreground/50 px-0.5">
                  e.g. 0712345678&nbsp;&nbsp;or&nbsp;&nbsp;DSS-001234
                </p>
              </div>
            )}

            {/* State 3: Customer found */}
            {loyaltyCustomer && (
              <div className="p-3 space-y-2.5">

                {/* Customer info row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold leading-tight text-foreground truncate">{loyaltyCustomer.name}</p>
                      <p className="text-[10.5px] text-muted-foreground mt-0.5">
                        {loyaltyCustomer.id}&nbsp;&middot;&nbsp;{loyaltyCustomer.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <TierBadge tier={loyaltyCustomer.tier} />
                    <button
                      onClick={() => {
                        setLoyaltyCustomer(null);
                        setLoyaltyInput("");
                        setRedeemPoints(false);
                        setLoyaltyOpen(false);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Points balance + earn preview */}
                <div className="flex items-center justify-between rounded-lg bg-secondary/30 border border-border px-3 py-2 text-[11.5px]">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400/30" />
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{loyaltyCustomer.points.toLocaleString()}</span>&nbsp;pts balance
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>+{pointsEarned}</span>
                    <span className="font-normal text-muted-foreground">pts earned</span>
                  </div>
                </div>

                {/* Redeem toggle */}
                {redeemableDollars > 0 ? (
                  <button
                    onClick={() => setRedeemPoints((p) => !p)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[12px] text-left transition-all",
                      redeemPoints
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "border-border bg-card text-muted-foreground hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-900/10"
                    )}
                  >
                    <Star className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-colors",
                      redeemPoints ? "text-amber-500 fill-amber-400/30" : "text-muted-foreground/40"
                    )} />
                    <div className="flex-1 leading-tight">
                      <span>Redeem&nbsp;</span>
                      <span className="font-semibold">{(redeemableDollars * 100).toLocaleString()}&nbsp;pts</span>
                      <span className="mx-1 opacity-60">&rarr;</span>
                      <span className="font-bold text-current">-{formatCurrency(redeemableDollars)}</span>
                      <span className="ml-1.5 text-[10.5px] opacity-50">max&nbsp;20%</span>
                    </div>
                    <div className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0",
                      redeemPoints ? "border-amber-400 bg-amber-400" : "border-border bg-background"
                    )}>
                      {redeemPoints && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                  </button>
                ) : (
                  <p className="text-[11px] text-muted-foreground/60 px-0.5 flex items-center gap-1.5">
                    <Star className="h-3 w-3 text-muted-foreground/30" />
                    Not enough points to redeem (need 100 pts = $1).
                  </p>
                )}

              </div>
            )}
          </div>
        )}

        {/*  Totals breakdown  */}
        <div className="rounded-xl border border-border bg-secondary/30 divide-y divide-border overflow-hidden text-[12.5px]">
          <div className="flex justify-between items-center px-3 py-2 text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums font-semibold text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center px-3 py-2 text-muted-foreground">
            <span>Tax (15%)</span>
            <span className="tabular-nums font-semibold text-foreground">{formatCurrency(tax)}</span>
          </div>
          {loyaltyDiscount > 0 && (
            <div className="flex justify-between items-center px-3 py-2 bg-amber-50/60 dark:bg-amber-900/10">
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Star className="h-3 w-3 fill-amber-400/30" />
                Loyalty Discount
              </span>
              <span className="tabular-nums font-bold text-amber-600 dark:text-amber-400">
                -{formatCurrency(loyaltyDiscount)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center px-3 py-2.5 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900/30">
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
          onClick={handlePayment}
          disabled={items.length === 0 || processing}
          className="relative w-full h-14 rounded-xl bg-emerald-600 text-white font-bold text-[15px] tracking-wide hover:bg-emerald-700 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {processing ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" />Processing&hellip;</>
          ) : (
            <>
              <span>Charge</span>
              <span className="ml-2 tabular-nums text-[18px] font-extrabold">${finalTotal.toFixed(2)}</span>
              {loyaltyDiscount > 0 && (
                <span className="ml-2 rounded-full bg-amber-400/25 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                  &#9733; -${loyaltyDiscount.toFixed(2)} off
                </span>
              )}
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded border border-white/30 bg-white/15 px-1.5 py-0.5 text-[10px] font-mono text-white/80 select-none">
                Space
              </kbd>
            </>
          )}
        </Button>

      </div>
    </div>
  );
}