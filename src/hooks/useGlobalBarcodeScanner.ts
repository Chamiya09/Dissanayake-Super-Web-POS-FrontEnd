import { useEffect, useRef } from "react";

interface UseGlobalBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  interKeyThresholdMs?: number;
  minBarcodeLength?: number;
}

/**
 * Global barcode scanner listener based on keystroke timing.
 * Scanners send keys very quickly; human typing usually exceeds the threshold.
 */
export function useGlobalBarcodeScanner({
  onScan,
  enabled = true,
  interKeyThresholdMs = 50,
  minBarcodeLength = 5,
}: UseGlobalBarcodeScannerOptions): void {
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    let buffer = "";
    let lastKeystrokeTime = 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;

      // Ignore modifier combinations and standalone modifier keys.
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === "Shift" || event.key === "Control" || event.key === "Alt" || event.key === "Meta") return;

      if (event.key === "Enter") {
        const barcode = buffer.trim();

        if (barcode.length >= minBarcodeLength) {
          onScanRef.current(barcode);
          console.info("[BarcodeScanner] Scan captured:", barcode);
        }

        buffer = "";
        lastKeystrokeTime = 0;
        return;
      }

      // Keep only printable single-character keys.
      if (event.key.length !== 1) return;

      const now = performance.now();
      const diff = now - lastKeystrokeTime;

      // If typing slowed down, treat as human input and reset buffer.
      if (lastKeystrokeTime > 0 && diff > interKeyThresholdMs) {
        buffer = "";
      }

      buffer += event.key;
      lastKeystrokeTime = now;
    };

    // Capture phase improves reliability regardless of focused element.
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, interKeyThresholdMs, minBarcodeLength]);
}
