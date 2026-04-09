import type { KeyboardEventHandler, RefObject } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PiPrefixSearchInputProps = {
  value: string;
  onChange: (nextValue: string) => void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  placeholder?: string;
  autoFocus?: boolean;
  inputRef?: RefObject<HTMLInputElement>;
  className?: string;
  showClear?: boolean;
  onClear?: () => void;
};

export function PiPrefixSearchInput({
  value,
  onChange,
  onKeyDown,
  placeholder = "00001",
  autoFocus = false,
  inputRef,
  className,
  showClear = true,
  onClear,
}: PiPrefixSearchInputProps) {
  return (
    <div
      className={cn(
        "relative flex h-11 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        "focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/20 transition-all duration-200",
        className
      )}
    >
      <Search className="ml-3 h-4 w-4 shrink-0 text-slate-400" />

      <span className="ml-2 inline-flex h-7 items-center rounded-md border border-slate-200 bg-slate-50 px-2 text-[12px] font-semibold text-slate-700">
        PI
      </span>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          const trimmed = raw.trim();
          const normalized = trimmed.toUpperCase().startsWith("PI") ? trimmed.slice(2) : trimmed;
          onChange(normalized);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        className="h-full w-full bg-transparent px-3 pr-10 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 outline-none"
      />

      {showClear && value && (
        <button
          type="button"
          onClick={() => onClear?.()}
          aria-label="Clear search"
          className="absolute right-3 rounded p-1 text-slate-400 transition-colors hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
