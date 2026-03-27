import { useState, useEffect } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROLE_PILL_STYLES = {
  Owner:   "bg-red-100   text-red-700   border border-red-200",
  Manager: "bg-blue-100  text-blue-700  border border-blue-200",
  Staff:   "bg-green-100 text-green-700 border border-green-200",
};
const ROLE_DOT = { Owner: "bg-red-500", Manager: "bg-blue-500", Staff: "bg-green-500" };

function RolePill({ role }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", ROLE_PILL_STYLES[role])}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", ROLE_DOT[role])} />
      {role}
    </span>
  );
}

function UserAvatar({ name }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 text-sm font-bold text-white shadow-md shrink-0">
      {initials}
    </div>
  );
}

export default function DeleteUserModal({ user, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) setDeleting(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const handler = (e) => { if (e.key === "Escape" && !deleting) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [user, deleting, onClose]);

  if (!user) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch(e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" aria-labelledby="delete-user-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!deleting ? onClose : undefined} aria-hidden="true" />
      <div className={cn("relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl", "animate-in fade-in-0 zoom-in-95 duration-200")}>

        {/* Close button */}
        <button
          onClick={onClose}
          disabled={deleting}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Body */}
        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">

          {/* Warning icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 dark:text-red-400 ring-8 ring-red-500/5">
            <AlertTriangle className="h-8 w-8" />
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h2 id="delete-user-title" className="text-[18px] font-bold text-foreground">Delete User?</h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{user.fullName}</span>?
              This action cannot be undone.
            </p>
          </div>

          {/* User detail card */}
          <div className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-center gap-3 text-left">
            <UserAvatar name={user.fullName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{user.fullName}</p>
              <p className="truncate text-xs text-muted-foreground font-mono">@{user.username}</p>
              <div className="mt-1">
                <RolePill role={user.role} />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={deleting} className="h-9 px-5 text-[13px]">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={deleting}
            className={cn("h-9 px-5 text-[13px] gap-2 shadow-sm", "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white")}
          >
            {deleting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Deleting</>
            ) : (
              <><Trash2 className="h-3.5 w-3.5" />Delete User</>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
