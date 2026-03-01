import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import axios from "axios";
import { ShoppingBag, CheckCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AppHeader } from "@/components/Layout/AppHeader";
import { ProductGrid } from "@/components/POS/ProductGrid";
import { CartPanel } from "@/components/POS/CartPanel";
import type { Product, CartItem } from "@/data/products";
import { formatCurrency } from "@/utils/formatCurrency";

/* ── Management-side product shape (written by ProductManagement page) ── */
interface MgmtProduct {
  id: number;
  productName: string;
  sku: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  unit?: string;
}

/** Convert ProductManagement shape → POS Product shape */
function mapToPOS(p: MgmtProduct): Product {
  return {
    id:       String(p.id),
    name:     p.productName,
    price:    p.sellingPrice,
    category: p.category,
    unit:     p.unit ?? "pcs",
    barcode:  p.sku,
    stock:    50,   // default — management page doesn't track stock yet
  };
}

/* ── Flying dot that animates from click position to cart icon ── */
function FlyingDot({
  startX,
  startY,
  targetX,
  targetY,
  onDone,
}: {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Force initial paint, then apply transition to target
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.55s cubic-bezier(0.2, 0.8, 0.4, 1), opacity 0.55s ease";
        el.style.transform = `translate(${targetX - startX}px, ${targetY - startY}px) scale(0.15)`;
        el.style.opacity = "0";
      });
    });
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
  }, [startX, startY, targetX, targetY, onDone]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-[9999] h-6 w-6 rounded-full bg-primary shadow-lg ring-2 ring-white"
      style={{ left: startX - 12, top: startY - 12, opacity: 1 }}
    />
  );
}

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [flyDots, setFlyDots] = useState<{ id: number; x: number; y: number }[]>([]);
  const cartIconRef = useRef<HTMLDivElement>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [lastSale, setLastSale] = useState<{ receiptNo: string; total: number } | null>(null);

  /* ── Fetch products from backend API ── */
  const [posProducts, setPosProducts] = useState<Product[]>([]);

  useEffect(() => {
    axios
      .get<MgmtProduct[]>("http://localhost:8080/api/products")
      .then(({ data }) => setPosProducts(data.map(mapToPOS)))
      .catch((err) => console.error("Failed to load products:", err));
  }, []);

  const addToCart = useCallback((product: Product, e?: React.MouseEvent) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    // Highlight the row briefly
    setHighlightId(product.id);
    setTimeout(() => setHighlightId(null), 700);

    // Launch a flying dot if we have a click position
    if (e) {
      const dot = { id: Date.now(), x: e.clientX, y: e.clientY };
      setFlyDots((prev) => [...prev, dot]);
    }
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const handleCheckout = useCallback(async (totalAmount: number, paymentMethod: string) => {
    const receiptNo = `RCP-${Date.now()}`;
    const payload = {
      receiptNo,
      paymentMethod,
      totalAmount,
      status: "Completed",
      items: cart.map((i) => ({
        productName: i.product.name,
        quantity:    i.quantity,
        unitPrice:   i.product.price,
        lineTotal:   i.quantity * i.product.price,
      })),
    };

    try {
      await axios.post("http://localhost:8080/api/sales", payload);
      setCart([]);
      setCartOpen(false);
      setLastSale({ receiptNo, total: totalAmount });
      setShowSuccessPopup(true);
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Failed to record sale. Please try again.");
    }
  }, [cart]);

  const totalItems = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  // [Esc] → clear basket when not focused inside an input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        cart.length > 0
      ) {
        setCart([]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart.length]);
  const total = useMemo(() => {
    const sub = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
    return sub * 1.15;
  }, [cart]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto bg-background p-3 sm:p-4 lg:p-6 pb-24 md:pb-5">
          <ProductGrid onAddToCart={addToCart} products={posProducts} />
        </div>

        {/* Cart Panel — desktop sidebar; ref used for flying dot target */}
        <div
          ref={cartIconRef}
          className="hidden md:flex h-full w-[320px] lg:w-[360px] xl:w-[400px] shrink-0 border-l border-border bg-card p-4 items-stretch"
        >
          <CartPanel
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            highlightId={highlightId}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Mobile — sticky cart bar at bottom */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 px-3 pb-3 pt-2 bg-background/90 backdrop-blur-md border-t border-border">
        <button
          onClick={() => setCartOpen(true)}
          className="flex w-full items-center justify-between rounded-xl bg-primary px-4 py-3 text-white shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[14px] font-semibold">
              {totalItems === 0 ? "Cart is empty" : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            </span>
          </div>
          {totalItems > 0 && (
            <span className="text-[15px] font-bold tabular-nums">${total.toFixed(2)}</span>
          )}
        </button>
      </div>

      {/* Mobile — slide-up cart sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="h-[88vh] p-0 rounded-t-2xl overflow-hidden md:hidden">
          <SheetTitle className="sr-only">Shopping Cart</SheetTitle>
          <CartPanel
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            highlightId={highlightId}
            onCheckout={handleCheckout}
          />
        </SheetContent>
      </Sheet>

      {/* Flying dots — one per click */}
      {flyDots.map((dot) => {
        const rect = cartIconRef.current?.getBoundingClientRect();
        const tx = rect ? rect.left + rect.width / 2 : window.innerWidth - 160;
        const ty = rect ? rect.top + 40 : 80;
        return (
          <FlyingDot
            key={dot.id}
            startX={dot.x}
            startY={dot.y}
            targetX={tx}
            targetY={ty}
            onDone={() => setFlyDots((prev) => prev.filter((d) => d.id !== dot.id))}
          />
        );
      })}

      {/* ── Sale Success Popup ── */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-2xl text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
            </div>
            <h2 className="text-[22px] font-bold text-foreground">Sale Completed!</h2>
            <p className="mt-1 text-sm text-muted-foreground">Transaction recorded successfully.</p>

            <div className="mt-5 rounded-xl border border-border bg-muted/40 px-5 py-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Receipt No.</span>
                <span className="font-mono font-bold text-primary">{lastSale?.receiptNo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-foreground tabular-nums">{formatCurrency(lastSale?.total ?? 0)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessPopup(false)}
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-[14px] font-bold text-white hover:bg-emerald-700 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-emerald-500/25"
            >
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
