import { useState, useCallback, useMemo } from "react";
import { ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { POSHeader } from "@/components/POS/POSHeader";
import { ProductGrid } from "@/components/POS/ProductGrid";
import { CartPanel } from "@/components/POS/CartPanel";
import type { Product, CartItem } from "@/data/products";

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
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

  const totalItems = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);
  const total = useMemo(() => {
    const sub = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
    return sub * 1.15;
  }, [cart]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <POSHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Product Grid — takes all space on mobile, shrinks on desktop */}
        <div className="flex-1 overflow-y-auto bg-background p-3 sm:p-4 lg:p-6 pb-24 md:pb-5">
          <ProductGrid onAddToCart={addToCart} />
        </div>

        {/* Cart Panel — fixed right sidebar on md+ only */}
        <div className="hidden md:flex w-[320px] lg:w-[360px] xl:w-[400px] shrink-0 border-l border-border bg-white p-4">
          <CartPanel
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
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
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;
