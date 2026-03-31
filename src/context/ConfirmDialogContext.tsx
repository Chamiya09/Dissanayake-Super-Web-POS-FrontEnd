import { createContext, useCallback, useContext, useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "destructive";
};

type PendingConfirm = Required<Pick<ConfirmOptions, "title" | "message" | "confirmText" | "cancelText" | "tone">> & {
  resolve: (value: boolean) => void;
};

type ConfirmDialogContextValue = {
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

const DEFAULT_OPTIONS: Required<Omit<ConfirmOptions, never>> = {
  title: "Are you sure?",
  message: "Please confirm to continue.",
  confirmText: "Confirm",
  cancelText: "Cancel",
  tone: "default",
};

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const merged = { ...DEFAULT_OPTIONS, ...(options ?? {}) };
      setPending({ ...merged, resolve });
    });
  }, []);

  const closeWith = useCallback((value: boolean) => {
    setPending((prev) => {
      if (prev) {
        prev.resolve(value);
      }
      return null;
    });
  }, []);

  const contextValue = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && closeWith(false)}>
        <AlertDialogContent className="rounded-2xl border-slate-200 bg-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              {pending?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6 text-slate-600">
              {pending?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => closeWith(false)}
            >
              {pending?.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              className={
                pending?.tone === "destructive"
                  ? "rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                  : "rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              }
              onClick={() => closeWith(true)}
            >
              {pending?.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }
  return context;
}
