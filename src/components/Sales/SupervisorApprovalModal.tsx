import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SupervisorApprovalModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const [approverId, setApproverId] = useState("");
  const [approverPassword, setApproverPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const idRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setApproverId("");
    setApproverPassword("");
    setShowPassword(false);
    setTimeout(() => idRef.current?.focus(), 80);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({
      approverId: approverId.trim(),
      approverPassword,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supervisor-approval-title"
    >
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => !isSubmitting && onClose()} />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between bg-teal-600 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h2 id="supervisor-approval-title" className="text-lg font-bold text-white">
                Supervisor Authorization
              </h2>
              <p className="text-sm text-teal-100">
                Staff members require authorization to process returns.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-teal-100 transition-colors hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="approverId" className="text-sm font-semibold text-slate-700">
                Senior Staff / Manager ID
              </Label>
              <Input
                id="approverId"
                ref={idRef}
                type="text"
                value={approverId}
                onChange={(event) => setApproverId(event.target.value.toUpperCase())}
                placeholder="e.g. MGR001"
                disabled={isSubmitting}
                autoComplete="username"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 text-sm focus-visible:ring-teal-500 focus-visible:border-teal-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approverPassword" className="text-sm font-semibold text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="approverPassword"
                  type={showPassword ? "text" : "password"}
                  value={approverPassword}
                  onChange={(event) => setApproverPassword(event.target.value)}
                  placeholder="Enter password"
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 pr-12 text-sm focus-visible:ring-teal-500 focus-visible:border-teal-500"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 bg-slate-50/80 px-6 py-5 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="rounded-xl font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl gap-2 bg-teal-600 px-6 py-2.5 font-medium text-white shadow-sm hover:bg-teal-700 focus:ring-4 focus:ring-teal-600/20 transition-all">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Authorize & Return
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
