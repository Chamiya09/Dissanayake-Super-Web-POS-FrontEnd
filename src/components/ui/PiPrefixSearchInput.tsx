import type { FocusEventHandler, KeyboardEventHandler, ReactNode, RefObject } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PiPrefixSearchInputProps = {
  value: string;
  onChange: (nextValue: string) => void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
  autoFocus?: boolean;
  inputRef?: RefObject<HTMLInputElement>;
  className?: string;
  inputClassName?: string;
  showClear?: boolean;
  onClear?: () => void;
  prefixLabel?: string | null;
  disablePrefixNormalization?: boolean;
  readOnly?: boolean;
  modeToggleIcon?: ReactNode;
  modeToggleLabel?: string;
  onModeToggle?: () => void;
};

export function PiPrefixSearchInput({
  value,
  onChange,
  onKeyDown,
  onFocus,
  placeholder = "00001",
  autoFocus = false,
  inputRef,
  className,
  inputClassName,
  showClear = true,
  onClear,
  prefixLabel = "PI",
  disablePrefixNormalization = false,
  readOnly = false,
  modeToggleIcon,
  modeToggleLabel = "Toggle search mode",
  onModeToggle,
}: PiPrefixSearchInputProps) {
  const hasClearButton = showClear && value;
  const inputLeftPadding = modeToggleIcon || prefixLabel ? "pl-2" : "pl-3";
  const inputRightPadding = hasClearButton ? "pr-12" : "pr-3";

  return (
    <div
      className={cn(
        "relative flex h-11 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        "focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/20 transition-all duration-200",
        readOnly && "bg-muted/50",
        className,
      )}
    >
      {modeToggleIcon ? (
        <button
          type="button"
          onClick={onModeToggle}
          aria-label={modeToggleLabel}
          title={modeToggleLabel}
          className="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
        >
          {modeToggleIcon}
        </button>
      ) : (
        <Search className="ml-3 h-4 w-4 shrink-0 text-slate-400" />
      )}

      {prefixLabel ? (
        <span className="ml-2 inline-flex h-7 items-center rounded-md border border-slate-200 bg-slate-50 px-2 text-[12px] font-semibold text-slate-700">
          {prefixLabel}
        </span>
      ) : null}

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          const trimmed = raw.trim();
          const normalized = disablePrefixNormalization
            ? raw
            : trimmed.toUpperCase().startsWith("PI")
              ? trimmed.slice(2)
              : trimmed;
          onChange(normalized);
        }}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        autoFocus={autoFocus}
        readOnly={readOnly}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "h-full w-full bg-transparent text-[13px] font-medium text-slate-900 placeholder:text-slate-400 outline-none",
          inputLeftPadding,
          inputRightPadding,
          readOnly && "cursor-default caret-transparent",
          inputClassName,
        )}
      />

      {hasClearButton ? (
        <button
          type="button"
          onClick={() => onClear?.()}
          aria-label="Clear search"
          className={cn(
            "absolute rounded p-1 text-slate-400 transition-colors hover:text-slate-700",
            "right-3",
          )}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
