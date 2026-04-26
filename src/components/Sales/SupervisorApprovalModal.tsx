import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck, X } from "lucide-react";

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

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 id="supervisor-approval-title" className="text-base font-bold text-slate-900">
                Supervisor Override
              </h2>
              <p className="text-xs text-slate-500">
                Approval is required to process this return.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="approverId" className="text-[13px] font-semibold text-slate-900">
                Manager ID
              </Label>
              <Input
                id="approverId"
                ref={idRef}
                type="text"
                value={approverId}
                onChange={(event) => setApproverId(event.target.value.toUpperCase())}
                placeholder="MGR001"
                disabled={isSubmitting}
                autoComplete="username"
                className="h-11 rounded-xl border-slate-200 text-sm focus-visible:ring-indigo-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="approverPassword" className="text-[13px] font-semibold text-slate-900">
                Approver's Password
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
                  className="h-11 rounded-xl border-slate-200 pr-11 text-sm focus-visible:ring-indigo-300"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Approve Return
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
