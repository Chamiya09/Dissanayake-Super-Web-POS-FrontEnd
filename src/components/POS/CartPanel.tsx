import {
  ShoppingBag, Minus, Plus, Trash2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/data/products";
import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatCurrency";
import CheckoutModal from "@/components/POS/CheckoutModal";

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
  onCheckout?: (totalAmount: number, paymentMethod: "CASH" | "CARD") => Promise<void>;
  /** Enables cart keyboard shortcuts only when cart area is active. */
  keyboardActive?: boolean;
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

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  /* Reset checkout state when cart empties */
  useEffect(() => {
    if (items.length === 0) {
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
  const finalTotal = total;

  const completeCheckout = useCallback(async (method: "CASH" | "CARD") => {
    setProcessing(true);
    try {
      await onCheckout?.(finalTotal, method);
      setIsCheckoutModalOpen(false);
    } finally {
      setProcessing(false);
    }
  }, [finalTotal, onCheckout]);

  const openCheckoutModal = useCallback(() => {
    if (items.length === 0 || processing) return;
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

  const categoryEmoji: Record<string, string> = {
    "Auto Care": "🚗",
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
          <div className="flex justify-between items-center px-3 py-2.5 bg-blue-50 border-t border-blue-100">
            <span className="text-[13px] font-bold text-foreground">Total</span>
            <div className="flex items-baseline gap-1.5">
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
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded border border-white/30 bg-white/15 px-1.5 py-0.5 text-[10px] font-mono text-white/80 select-none">
                Space / Enter
              </kbd>
            </>
          )}
        </Button>

      </div>

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        totalAmount={finalTotal}
        onCompleteSale={async (payload: { method: "CASH" | "CARD"; tendered?: number; balance?: number }) => {
          await completeCheckout(payload.method);
        }}
      />
    </div>
  );
}
