import { useState, useCallback } from "react";
import { POSHeader } from "@/components/POS/POSHeader";
import { ProductGrid } from "@/components/POS/ProductGrid";
import { CartPanel } from "@/components/POS/CartPanel";
import type { Product, CartItem } from "@/data/products";

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

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

  return (
    <div className="flex h-screen flex-col">
      <POSHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Product Discovery */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <ProductGrid onAddToCart={addToCart} />
        </div>
        {/* Right — Cart */}
        <div className="hidden w-[380px] shrink-0 border-l p-4 md:flex">
          <CartPanel
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
