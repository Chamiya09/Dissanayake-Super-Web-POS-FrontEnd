import { ShoppingBag, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/data/products";
import { useState } from "react";

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
}

export function CartPanel({ items, onUpdateQuantity, onRemoveItem }: CartPanelProps) {
  const [processing, setProcessing] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const handlePayment = () => {
    setProcessing(true);
    setTimeout(() => setProcessing(false), 2000);
  };

  const categoryEmoji: Record<string, string> = {
    Fruits: "🍎", Dairy: "🧀", Beverages: "🥤",
    Bakery: "🥐", Snacks: "🥜", Meat: "🥩", Vegetables: "🥦",
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-white shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
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
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-[11px] font-bold text-primary-foreground shadow-md shadow-primary/30">
            {items.length}
          </span>
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
          items.map((item) => (
            <div
              key={item.product.id}
              className="group flex items-center gap-2.5 rounded-lg border border-border bg-secondary/40 p-2.5 transition-colors duration-150 hover:bg-blue-50 hover:border-blue-200"
            >
              {/* Emoji badge */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[18px] shadow-sm border border-border">
                {categoryEmoji[item.product.category] ?? "🛒"}
              </div>

              {/* Name + price */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-[12.5px] font-semibold leading-tight text-foreground">{item.product.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                  ${item.product.price.toFixed(2)} ea.
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
                <span className="w-7 border-x border-border/50 text-center text-[12px] font-bold tabular-nums text-foreground">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                  className="flex h-7 w-7 items-center justify-center text-primary transition-colors hover:bg-primary/10"
                >
                  <Plus className="h-3 w-3 stroke-[2.5]" />
                </button>
              </div>

              {/* Line total */}
              <p className="w-14 text-right text-[12.5px] font-bold tabular-nums text-foreground">
                ${(item.product.price * item.quantity).toFixed(2)}
              </p>

              {/* Remove */}
              <button
                onClick={() => onRemoveItem(item.product.id)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Checkout footer */}
      <div className="border-t border-border p-4 space-y-3 bg-white">
        {/* Totals */}
        <div className="rounded-xl border border-border bg-secondary/30 divide-y divide-border overflow-hidden text-[12.5px]">
          <div className="flex justify-between items-center px-3 py-2 text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums font-semibold text-foreground">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center px-3 py-2 text-muted-foreground">
            <span>Tax (15%)</span>
            <span className="tabular-nums font-semibold text-foreground">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center px-3 py-2.5 bg-blue-50 border-t border-blue-100">
            <span className="text-[13px] font-bold text-foreground">Total</span>
            <span className="tabular-nums text-[15px] font-extrabold text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay button */}
        <Button
          onClick={handlePayment}
          disabled={items.length === 0 || processing}
          className="w-full h-11 rounded-lg bg-primary text-white font-semibold text-[13px] tracking-wide hover:bg-accent transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {processing ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing…</>
          ) : (
            <>Charge&nbsp;<span className="tabular-nums">${total.toFixed(2)}</span></>
          )}
        </Button>
      </div>
    </div>
  );
}
