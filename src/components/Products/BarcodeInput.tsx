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
  const [barcode, setBarcode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const next = mode === "update" && initialBarcode ? initialBarcode.trim() : "";
    setBarcode(next);
  }, [mode, initialBarcode]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleBarcodeChange = (value: string) => {
    setBarcode(value);
    onBarcodeChange?.(value);
  };

  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <ScanLine className="h-3.5 w-3.5" />
        </div>
        <span className="text-[13px] font-semibold text-slate-800">Barcode</span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {mode === "update" ? "Update or clear barcode" : "Scan or type barcode"}
        </span>
      </div>

      <div className="relative">
        <ScanLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          id={inputId}
          value={barcode}
          onChange={(e) => handleBarcodeChange(e.target.value)}
          placeholder="Focus and scan barcode"
          autoComplete="off"
          disabled={disabled}
          className="h-11 text-[13px] font-mono pl-9 pr-9"
          onKeyDown={(e) => {
            // Scanner usually sends Enter after the code; keep form from accidental submit.
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
        />
        {!!barcode && (
          <button
            type="button"
            aria-label="Clear barcode"
            onClick={() => {
              handleBarcodeChange("");
              inputRef.current?.focus();
            }}
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

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
