import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import api from "@/lib/axiosInstance";
import { useToast } from "@/context/GlobalToastContext";
import { ShoppingBag, CheckCircle, ScanLine, AlertTriangle } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AppHeader } from "@/components/Layout/AppHeader";
import { ProductGrid, type ProductGridHandle } from "@/components/POS/ProductGrid";
import { CartPanel } from "@/components/POS/CartPanel";
import { PiPrefixSearchInput } from "@/components/ui/PiPrefixSearchInput";
import type { Product, CartItem } from "@/data/products";
import { formatCurrency } from "@/utils/formatCurrency";
import { useInventory } from "@/context/InventoryContext";

/* ── Management-side product shape (written by ProductManagement page) ── */
interface MgmtProduct {
  id: number;
  productName: string;
  sku: string | null;
  barcode: string | null;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  status?: "ACTIVE" | "DISCONTINUED";
  stockQuantity?: number;
  unit?: string;
}

interface SalePayloadItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface SalePayload {
  paymentMethod: "Cash" | "Card";
  totalAmount: number;
  status: "Completed";
  items: SalePayloadItem[];
}

type CheckoutPaymentMethod = "CASH" | "CARD";

function normalizeSalePaymentMethod(method: string): SalePayload["paymentMethod"] {
  return method === "CARD" ? "Card" : "Cash";
}

function extractApiErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: { data?: unknown } }).response?.data
  ) {
    const data = (error as { response?: { data?: unknown } }).response?.data;
    if (typeof data === "string" && data.trim()) {
      return data.trim();
    }
    if (typeof data === "object" && data !== null) {
      const message = (data as { message?: unknown }).message;
      const backendError = (data as { error?: unknown }).error;
      if (typeof message === "string" && message.trim()) {
        return message.trim();
      }
      if (typeof backendError === "string" && backendError.trim()) {
        return backendError.trim();
      }
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message.trim()
  ) {
    return (error as { message: string }).message.trim();
  }

  return "Failed to record sale. Please try again.";
}

/** Convert ProductManagement shape → POS Product shape */
function mapToPOS(p: MgmtProduct): Product {
  return {
    id:       String(p.id),
    name:     p.productName,
    price:    p.sellingPrice,
    category: p.category,
    unit:     p.unit ?? "pcs",
    barcode:  p.barcode ?? "",
    stock:    50,   // default — management page doesn't track stock yet
    status:   p.status,
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
    el.style.left = `${startX - 12}px`;
    el.style.top = `${startY - 12}px`;
    el.style.opacity = "1";
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
    />
  );
}

const Index = () => {
  const { showToast } = useToast();
  const [keyboardScope, setKeyboardScope] = useState<"grid" | "cart">("grid");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [activeBucketIndex, setActiveBucketIndex] = useState(-1);
  const [flyDots, setFlyDots] = useState<{ id: number; x: number; y: number }[]>([]);
  const cartIconRef = useRef<HTMLDivElement>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [lastSale, setLastSale] = useState<{ transactionId: string; total: number; paymentMethod: string } | null>(null);
  const [checkoutHotkeyNonce, setCheckoutHotkeyNonce] = useState(0);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [cartFocusNonce, setCartFocusNonce] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const activeBucketIndexRef = useRef(-1);
  const cartRef = useRef<CartItem[]>([]);
  const productGridRef = useRef<ProductGridHandle>(null);

  /* ── Live inventory data from shared context ── */
  const { inventoryItems, refreshInventory } = useInventory();

  /* ── Fetch raw product list from backend API ── */
  const [rawProducts, setRawProducts] = useState<MgmtProduct[]>([]);

  useEffect(() => {
    api
      .get<MgmtProduct[]>("/api/products")
      .then(({ data }) => setRawProducts(data))
      .catch((err) => console.error("Failed to load products:", err));
  }, []);

  useEffect(() => {
    if (!errorMsg) return;
    const timer = window.setTimeout(() => {
      setErrorMsg(null);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [errorMsg]);

  /* ── Merge inventory stock into POS product list ──
   *  Re-runs whenever rawProducts or inventoryItems change,
   *  so stock levels stay live without a page refresh.
   */
  const posProducts = useMemo<Product[]>(
    () =>
      rawProducts.map((p) => {
        const inv = inventoryItems.find((i) => i.productId === p.id);
        const stock = inv ? inv.stockQuantity : 0;
        return {
          id:       String(p.id),
          name:     p.productName,
          price:    p.sellingPrice,
          category: p.category,
          unit:     p.unit ?? "pcs",
          barcode:  p.barcode ?? "",
          stock,
          status:   p.status,
        };
      }).filter((product) => product.status !== "DISCONTINUED"),
    [rawProducts, inventoryItems]
  );

  const addToCart = useCallback((product: Product, e?: React.MouseEvent) => {
    if (product.status === "DISCONTINUED") {
      showToast("Ordering is disabled for discontinued products", "warning");
      return;
    }

    const availableStock = Number(product.stock ?? 0);
    if (!Number.isFinite(availableStock) || availableStock <= 0) {
      showToast(`"${product.name}" is not available in inventory`, "warning", "Out of Stock");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > availableStock) {
          showToast(
            `Only ${availableStock} ${product.unit ?? "unit"} available for "${product.name}"`,
            "warning",
            "Insufficient Stock",
          );
          return prev;
        }

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
  }, [showToast]);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i;
          const stock = Number(i.product.stock ?? 0);
          const nextQuantity = i.quantity + delta;
          return { ...i, quantity: stock > 0 ? Math.min(nextQuantity, stock) : 0 };
        })
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, value: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i;
          const stock = Number(i.product.stock ?? 0);
          return { ...i, quantity: stock > 0 ? Math.min(value, stock) : 0 };
        })
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const roundMoney = useCallback((value: number) => Number(value.toFixed(2)), []);
  const roundQuantity = useCallback((value: number) => Number(value.toFixed(3)), []);

  const handleCheckout = useCallback(async (totalAmount: number, paymentMethod: CheckoutPaymentMethod) => {
    const payloadItems: SalePayloadItem[] = [];

    for (const cartItem of cart) {
      const productId = Number(cartItem.product.id);
      const productName = String(cartItem.product.name ?? "").trim();
      const quantity = roundQuantity(Number(cartItem.quantity));
      const unitPrice = roundMoney(Number(cartItem.product.price));
      const lineTotal = roundMoney(quantity * unitPrice);

      if (!Number.isFinite(productId) || productId <= 0) {
        setErrorMsg(`Invalid product ID for "${productName || "Unknown Product"}".`);
        return;
      }

      if (!productName) {
        setErrorMsg("A cart item is missing its product name.");
        return;
      }

      if (!Number.isFinite(quantity) || quantity < 0.001) {
        setErrorMsg(`Invalid quantity for "${productName}".`);
        return;
      }

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        setErrorMsg(`Invalid unit price for "${productName}".`);
        return;
      }

      if (!Number.isFinite(lineTotal) || lineTotal < 0) {
        setErrorMsg(`Invalid line total for "${productName}".`);
        return;
      }

      if (typeof cartItem.product.stock === "number" && quantity > cartItem.product.stock) {
        setErrorMsg(
          `Insufficient stock for "${productName}". Available: ${cartItem.product.stock}, requested: ${quantity}.`,
        );
        return;
      }

      payloadItems.push({
        productId,
        productName,
        quantity,
        unitPrice,
        lineTotal,
      });
    }

    if (payloadItems.length === 0) {
      setErrorMsg("Sale must include at least one item.");
      return;
    }

    const normalizedPaymentMethod = normalizeSalePaymentMethod(paymentMethod);

    const payload: SalePayload = {
      paymentMethod: normalizedPaymentMethod,
      totalAmount: roundMoney(payloadItems.reduce((sum, item) => sum + item.lineTotal, 0)),
      status: "Completed",
      items: payloadItems,
    };

    try {
      console.info("[POS] submitting sale payload", payload);
      const { data } = await api.post("/api/sales", payload);
      console.info("[POS] sale recorded successfully", data);
      const transactionId = data?.transactionId ?? data?.receiptNo ?? "TRX-UNKNOWN";
      setCart([]);
      setCartOpen(false);
      setLastSale({ transactionId, total: totalAmount, paymentMethod: normalizedPaymentMethod });
      setShowSuccessPopup(true);
      setErrorMsg(null);
      refreshInventory();   // re-fetch inventory so stock levels update across all pages
      showToast(`Sale ${transactionId} recorded successfully!`, "success", "Success");
    } catch (err) {
      const error = err as {
        message?: string;
        response?: {
          status?: number;
          statusText?: string;
          data?: unknown;
          headers?: unknown;
        };
        config?: {
          url?: string;
          method?: string;
          data?: unknown;
        };
      };

      console.error("[POS] checkout failed", {
        payload,
        message: error?.message,
        request: {
          method: error?.config?.method,
          url: error?.config?.url,
          data: error?.config?.data,
        },
        response: {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          headers: error?.response?.headers,
        },
        rawError: err,
      });
      setErrorMsg(extractApiErrorMessage(err));
    }
  }, [cart, refreshInventory, roundMoney, roundQuantity, showToast]);

  /* ── SKU / Barcode quick-add ── */
  const [skuInputValue, setSkuInputValue] = useState("");
  const skuInputRef = useRef<HTMLInputElement>(null);
  const normalizedProductSearch = skuInputValue.trim().toLowerCase();
  const filteredPosProducts = useMemo(
    () =>
      posProducts.filter((product) => {
        if (!normalizedProductSearch) return true;
        return (
          String(product.name ?? "").toLowerCase().includes(normalizedProductSearch) ||
          String(product.id ?? "").toLowerCase().includes(normalizedProductSearch) ||
          String(product.barcode ?? "").toLowerCase().includes(normalizedProductSearch)
        );
      }),
    [normalizedProductSearch, posProducts],
  );

  const addProductByBarcode = useCallback(
    (rawBarcode: string) => {
      const scannedBarcode = String(rawBarcode).trim();
      if (!scannedBarcode) return;

      const product = posProducts.find(
        (item) => String(item.barcode ?? "").trim() === scannedBarcode,
      );

      if (!product) {
        showToast(`No product found for barcode "${scannedBarcode}"`, "error", "Invalid Barcode");
        return;
      }

      if (Number(product.stock ?? 0) <= 0) {
        showToast(`"${product.name}" is not available in inventory`, "warning", "Out of Stock");
        return;
      }

      addToCart(product);
    },
    [addToCart, posProducts, showToast],
  );

  const handleScannedBarcode = useCallback(
    (barcode: string) => {
      const scannedBarcode = String(barcode).trim();
      if (!scannedBarcode) return;
      console.info("[POS] handleScannedBarcode:", scannedBarcode);
      setSkuInputValue(scannedBarcode);
      if (posProducts.some((item) => String(item.barcode ?? "").trim() === scannedBarcode)) {
        productGridRef.current?.focusGrid(0);
      }
    },
    [posProducts],
  );

  const focusProductGrid = useCallback(() => {
    setKeyboardScope("grid");
    productGridRef.current?.focusGrid();
  }, []);

  const handleSkuSearch = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault();
        focusProductGrid();
        return;
      }

      if (e.key !== "Enter") return;
      if (filteredPosProducts.length === 1) {
        e.preventDefault();
        productGridRef.current?.focusGrid(0);
      }
    },
    [filteredPosProducts.length, focusProductGrid],
  );

  const isTextEntryElement = useCallback((element: HTMLElement | null) => {
    if (!element) return false;
    return element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName);
  }, []);

  const focusProductSearch = useCallback(() => {
    setKeyboardScope("grid");
    const input = skuInputRef.current;
    if (!input) return;
    input.focus();
    const cursorPosition = input.value.length;
    input.setSelectionRange(cursorPosition, cursorPosition);
  }, []);

  const focusProductCategories = useCallback(() => {
    setKeyboardScope("grid");
    productGridRef.current?.focusCategories();
  }, []);

  const triggerCheckoutHotkey = useCallback(() => {
    const subtotal = cartRef.current.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    if (subtotal <= 0) {
      return false;
    }

    setKeyboardScope("cart");
    if (window.matchMedia("(max-width: 767px)").matches) {
      setCartOpen(true);
    }
    setCheckoutHotkeyNonce((n) => n + 1);
    return true;
  }, []);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    activeBucketIndexRef.current = activeBucketIndex;
  }, [activeBucketIndex]);

  useEffect(() => {
    if (cart.length === 0) {
      setActiveBucketIndex(-1);
      return;
    }
    setActiveBucketIndex((idx) => (idx < 0 ? 0 : Math.min(idx, cart.length - 1)));
  }, [cart.length]);

  const totalItems = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  // Unified global keyboard manager: scope control, cart navigation, and barcode scanning.
  useEffect(() => {
    let scannerBuffer = "";
    let lastKeystrokeTime = 0;
    let quantityBuffer = "";
    let quantityBufferProductId: string | null = null;
    let quantityBufferTimer: number | null = null;
    const interKeyThresholdMs = 50;
    const minBarcodeLength = 5;

    const restartQuantityBufferTimer = () => {
      if (quantityBufferTimer !== null) {
        window.clearTimeout(quantityBufferTimer);
      }
      quantityBufferTimer = window.setTimeout(() => {
        quantityBuffer = "";
        quantityBufferProductId = null;
        quantityBufferTimer = null;
      }, 1200);
    };

    const handler = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const eventTarget = e.target instanceof HTMLElement ? e.target : null;
      const isInputFocused = isTextEntryElement(activeEl);
      const isTypingTarget =
        eventTarget?.tagName === "INPUT" ||
        eventTarget?.tagName === "TEXTAREA" ||
        eventTarget?.isContentEditable === true;
      const isInteractiveTarget = eventTarget?.closest("button, a, [role='button']") !== null;

      if (isCheckoutModalOpen) {
        return;
      }

      const currentIndex = activeBucketIndexRef.current;
      const activeItem = currentIndex >= 0 ? cartRef.current[currentIndex] : undefined;

      // Global search focus shortcut (Ctrl/Cmd+K).
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        focusProductSearch();
        skuInputRef.current?.select();
        return;
      }

      if (e.key === "F3") {
        e.preventDefault();
        focusProductSearch();
        return;
      }

      if (!isInputFocused && e.key === "/") {
        e.preventDefault();
        focusProductSearch();
        return;
      }

      if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        focusProductCategories();
        return;
      }

      // Conflict-free cart navigation.
      if (!isInputFocused && e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        setKeyboardScope("cart");
        if (cartRef.current.length > 0) {
          setActiveBucketIndex(0);
          setCartFocusNonce((n) => n + 1);
        }
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        focusProductSearch();
        skuInputRef.current?.select();
        return;
      }

      if (e.altKey && e.key === "1") {
        e.preventDefault();
        focusProductSearch();
        return;
      }

      if (e.altKey && e.key === "2") {
        e.preventDefault();
        setKeyboardScope("cart");
        if (cartRef.current.length > 0 && activeBucketIndexRef.current < 0) {
          setActiveBucketIndex(0);
        }
        return;
      }

      // Checkout shortcuts.
      if (e.key === "F12" || (e.ctrlKey && e.key === "Enter")) {
        if (cartRef.current.length > 0) {
          e.preventDefault();
          triggerCheckoutHotkey();
        }
        return;
      }

      const hasPendingBarcode = scannerBuffer.trim().length >= minBarcodeLength;
      const isGlobalCheckoutShortcut = e.code === "Space" || e.key === " " || e.key === "Enter";
      const isProductGridEnter = keyboardScope === "grid" && e.key === "Enter";

      if (
        isGlobalCheckoutShortcut &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !isTypingTarget &&
        !isInteractiveTarget &&
        !isProductGridEnter &&
        !(e.key === "Enter" && hasPendingBarcode)
      ) {
        if (triggerCheckoutHotkey()) {
          e.preventDefault();
        }
        return;
      }

      // Cart item actions (only when cart scope is active and not typing into inputs).
      if (!isInputFocused && keyboardScope === "cart") {
        const digitKey = /^[0-9]$/.test(e.key) ? e.key : null;
        const digitCode = /^Numpad[0-9]$/.test(e.code) ? e.code.replace("Numpad", "") : null;
        const isDecimalKey = e.key === "." || e.code === "NumpadDecimal";
        const isBackspaceKey = e.key === "Backspace";

        if ((digitKey !== null || digitCode !== null || isDecimalKey || isBackspaceKey) && activeItem) {
          e.preventDefault();

          if (quantityBufferProductId !== activeItem.product.id) {
            quantityBuffer = "";
            quantityBufferProductId = activeItem.product.id;
          }

          if (isBackspaceKey) {
            quantityBuffer = quantityBuffer.slice(0, -1);
          } else if (isDecimalKey) {
            if (!quantityBuffer.includes(".")) {
              quantityBuffer = quantityBuffer.length === 0 ? "0." : `${quantityBuffer}.`;
            }
          } else {
            quantityBuffer += (digitKey ?? digitCode) as string;
          }

          // Avoid validating while user is mid-entry like "1.".
          if (quantityBuffer.length > 0 && !quantityBuffer.endsWith(".")) {
            const parsedQty = parseFloat(quantityBuffer);
            if (!Number.isNaN(parsedQty) && parsedQty > 0) {
              setQuantity(activeItem.product.id, parsedQty);
            }
          }

          restartQuantityBufferTimer();
          return;
        }

        if (e.key === "Delete" && activeItem) {
          e.preventDefault();
          const currentLength = cartRef.current.length;
          removeItem(activeItem.product.id);
          setActiveBucketIndex((prev) => {
            const next = currentLength <= 1 ? -1 : Math.min(prev, currentLength - 2);
            activeBucketIndexRef.current = next;
            return next;
          });
          return;
        }

        if ((e.key === "+" || e.key === "=") && activeItem) {
          e.preventDefault();
          updateQuantity(activeItem.product.id, 1);
          return;
        }

        if ((e.key === "-" || e.key === "_") && activeItem) {
          e.preventDefault();
          updateQuantity(activeItem.product.id, -1);
          return;
        }
      }

      // [Esc] blurs active input/textarea first, then falls back to overlay/cart behavior.
      if (e.key === "Escape") {
        if (activeEl && ["INPUT", "TEXTAREA"].includes(activeEl.tagName)) {
          e.preventDefault();
          activeEl.blur();
          return;
        }

        if (showSuccessPopup) {
          e.preventDefault();
          setShowSuccessPopup(false);
          return;
        }

        if (cartOpen) {
          e.preventDefault();
          setCartOpen(false);
          return;
        }

        if (!isInputFocused && cart.length > 0) {
          e.preventDefault();
          setCart([]);
        }
      }

      // Route B: scanner input (ignore modifier combinations entirely).
      if (e.defaultPrevented) {
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      if (e.isComposing) return;

      if (e.key === "Enter") {
        const scannedBarcode = String(scannerBuffer).trim();
        if (scannedBarcode.length >= minBarcodeLength) {
          e.preventDefault();
          handleScannedBarcode(scannedBarcode);
          setSkuInputValue("");
        }
        scannerBuffer = "";
        lastKeystrokeTime = 0;
        return;
      }

      if (e.key.length !== 1) {
        return;
      }

      const now = performance.now();
      if (lastKeystrokeTime > 0 && now - lastKeystrokeTime > interKeyThresholdMs) {
        scannerBuffer = "";
      }

      scannerBuffer += e.key;
      lastKeystrokeTime = now;

      // If no input is focused, always treat rapid key sequences as scanner input.
      // This prevents barcode keystrokes from being misinterpreted as cart quantity edits.
      if (!isInputFocused) {
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (quantityBufferTimer !== null) {
        window.clearTimeout(quantityBufferTimer);
      }
    };
  }, [cart.length, cartOpen, focusProductCategories, focusProductSearch, handleScannedBarcode, isCheckoutModalOpen, isTextEntryElement, keyboardScope, removeItem, setQuantity, showSuccessPopup, triggerCheckoutHotkey, updateQuantity]);
  const total = useMemo(
    () => cart.reduce((s, i) => s + i.product.price * i.quantity, 0),
    [cart]
  );

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {errorMsg && (
        <div className="fixed left-1/2 top-6 z-[10000] flex -translate-x-1/2 items-center gap-3 rounded-xl border-l-4 border-red-500 bg-red-100 px-4 py-3 text-red-700 shadow-lg">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <AppHeader />

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto bg-background p-3 sm:p-4 lg:p-6 pb-24 md:pb-5">

          {/* ── SKU / Barcode Search Bar ── */}
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <ScanLine className="h-5 w-5 shrink-0 text-muted-foreground" />
            <PiPrefixSearchInput
              value={skuInputValue}
              onChange={setSkuInputValue}
              onKeyDown={handleSkuSearch}
              onFocus={() => setKeyboardScope("grid")}
              inputRef={skuInputRef}
              placeholder="Search by name, ID, or scan barcode..."
              prefixLabel={null}
              disablePrefixNormalization
              onClear={() => {
                setSkuInputValue("");
                skuInputRef.current?.focus();
              }}
              className="h-10 flex-1 shadow-none"
            />
          </div>

          <div onPointerDown={() => setKeyboardScope("grid")}>
            <ProductGrid
              ref={productGridRef}
              onAddToCart={addToCart}
              products={posProducts}
              keyboardActive={keyboardScope === "grid" && !isCheckoutModalOpen}
              searchQuery={skuInputValue}
            />
          </div>
        </div>

        {/* Cart Panel — desktop sidebar; ref used for flying dot target */}
        <div
          ref={cartIconRef}
          onPointerDown={() => setKeyboardScope("cart")}
          className="relative z-10 hidden h-full w-[360px] shrink-0 items-stretch border-l border-border bg-card p-4 md:flex lg:w-[410px] xl:w-[460px]"
        >
          <CartPanel
            items={cart}
            onUpdateQuantity={updateQuantity}
            onSetQuantity={setQuantity}
            onRemoveItem={removeItem}
            highlightId={highlightId}
            activeBucketIndex={activeBucketIndex}
            onActiveBucketIndexChange={setActiveBucketIndex}
            focusFirstItemNonce={cartFocusNonce}
            checkoutHotkeyNonce={checkoutHotkeyNonce}
            onCheckoutModalOpenChange={setIsCheckoutModalOpen}
            onCheckout={handleCheckout}
            keyboardActive={keyboardScope === "cart"}
          />
        </div>
      </div>

      {/* Mobile — sticky cart bar at bottom */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 px-3 pb-3 pt-2 bg-background/90 backdrop-blur-md border-t border-border">
        <button
          onClick={() => {
            setKeyboardScope("cart");
            setCartOpen(true);
          }}
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
            <span className="text-[15px] font-bold tabular-nums">{formatCurrency(total)}</span>
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
            onSetQuantity={setQuantity}
            onRemoveItem={removeItem}
            highlightId={highlightId}
            activeBucketIndex={activeBucketIndex}
            onActiveBucketIndexChange={setActiveBucketIndex}
            focusFirstItemNonce={cartFocusNonce}
            checkoutHotkeyNonce={checkoutHotkeyNonce}
            onCheckoutModalOpenChange={setIsCheckoutModalOpen}
            onCheckout={handleCheckout}
            keyboardActive={keyboardScope === "cart"}
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
            <h2 className="text-[22px] font-bold text-foreground">Sale Completed Successfully!</h2>
            <p className="mt-1 text-sm text-muted-foreground">Transaction recorded successfully.</p>

            <div className="mt-5 rounded-xl border border-border bg-muted/40 px-5 py-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono font-bold text-primary">{lastSale?.transactionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-bold text-foreground tabular-nums">{formatCurrency(lastSale?.total ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-semibold text-foreground">{lastSale?.paymentMethod}</span>
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
