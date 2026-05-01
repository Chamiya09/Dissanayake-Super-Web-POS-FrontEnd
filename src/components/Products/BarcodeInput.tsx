import { useEffect, useRef, useState } from "react";
import Barcode from "react-barcode";
import { ScanLine, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface BarcodeInputProps {
  mode: "add" | "update";
  initialBarcode?: string | null;
  onBarcodeChange?: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  inputId?: string;
}

export function BarcodeInput({
  mode,
  initialBarcode,
  onBarcodeChange,
  autoFocus = false,
  disabled = false,
  inputId = "barcode",
}: BarcodeInputProps) {
  const SCANNER_INTER_KEY_MS = 50;
  const [barcode, setBarcode] = useState("");
  const [draftBarcode, setDraftBarcode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const buffer = useRef("");
  const lastKeyTime = useRef(Date.now());
  const isAddLocked = mode === "add" && barcode.trim().length > 0;

  useEffect(() => {
    const next = initialBarcode?.trim() || "";
    setBarcode((prev) => (prev === next ? prev : next));
    setDraftBarcode((prev) => (prev === next ? prev : next));
    // Initialization must reflect persisted barcode only, with empty fallback.
    // No generated/fallback barcode values are introduced here.
  }, [initialBarcode]);

  useEffect(() => {
    if (autoFocus && !isAddLocked && inputRef.current) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(timer);
    }
  }, [autoFocus, isAddLocked]);

  useEffect(() => {
    if (disabled || isAddLocked) return;

    const handleGlobalScannerKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Enter") {
        const scannedValue = buffer.current;
        if (scannedValue) {
          commitBarcode(scannedValue);
          buffer.current = "";
          lastKeyTime.current = Date.now();
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      if (typeof e.key !== "string" || e.key.length !== 1) return;

      const now = Date.now();
      const delta = now - lastKeyTime.current;

      if (delta > SCANNER_INTER_KEY_MS) {
        buffer.current = "";
      }

      buffer.current += e.key;
      lastKeyTime.current = now;
    };

    window.addEventListener("keydown", handleGlobalScannerKeys, true);

    return () => {
      window.removeEventListener("keydown", handleGlobalScannerKeys, true);
      buffer.current = "";
      lastKeyTime.current = Date.now();
    };
  }, [disabled, isAddLocked]);

  const commitBarcode = (value: string) => {
    const next = value.trim();
    setBarcode(next);
    setDraftBarcode(next);
    onBarcodeChange?.(next);
  };

  const handleBarcodeDraftChange = (value: string) => {
    setDraftBarcode(value);

    if (mode === "update") {
      // Update mode stays editable so existing barcodes can be corrected.
      setBarcode(value);
      onBarcodeChange?.(value);
    }
  };

  const clearBarcode = () => {
    setBarcode("");
    setDraftBarcode("");
    onBarcodeChange?.("");
    buffer.current = "";
    lastKeyTime.current = Date.now();

    if (mode === "add") {
      window.setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <ScanLine className="h-3.5 w-3.5" />
        </div>
        <span className="text-[13px] font-semibold text-slate-800">Barcode</span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {mode === "update"
            ? "Update or clear barcode"
            : isAddLocked
            ? "Barcode locked until removed"
            : "Scan or type barcode, then press Enter"}
        </span>
      </div>

      {isAddLocked ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
          <div className="min-w-0 flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ScanLine className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">Scanned barcode</p>
              <p className="truncate font-mono text-[13px] font-semibold text-slate-900">{barcode}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Remove barcode"
            onClick={clearBarcode}
            disabled={disabled}
            className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-medium text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      ) : (
        <div className="relative">
          <ScanLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            id={inputId}
            value={mode === "add" ? draftBarcode : barcode}
            onChange={(e) => handleBarcodeDraftChange(e.target.value)}
            placeholder="Focus and scan barcode"
            autoComplete="off"
            disabled={disabled}
            className="h-11 text-[13px] font-mono pl-9 pr-9"
            onKeyDown={(e) => {
              // Scanner usually sends Enter after the code; keep form from accidental submit.
              if (e.key === "Enter") {
                if (mode === "add" && draftBarcode.trim()) {
                  commitBarcode(draftBarcode);
                }
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          />
          {!!(mode === "add" ? draftBarcode : barcode) && (
            <button
              type="button"
              aria-label="Clear barcode"
              onClick={clearBarcode}
              disabled={disabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {barcode.trim() && (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-4">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Live Preview</p>
          <div className="flex justify-center overflow-x-auto">
            <Barcode
              value={barcode.trim()}
              height={48}
              width={1.5}
              fontSize={12}
              margin={0}
              displayValue
              background="transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
