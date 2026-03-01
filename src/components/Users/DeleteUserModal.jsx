import { AlertTriangle, Trash2, X } from "lucide-react";
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

function Avatar({ name }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 text-sm font-bold text-white shadow-md">
      {initials}
    </div>
  );
}

export default function DeleteUserModal({ user, onClose, onConfirm }) {
  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-background shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 rounded-t-2xl border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <h2 className="text-[15px] font-semibold text-foreground">Delete User</h2>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-4 px-6 py-6">

          {/* User preview card */}
          <div className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <Avatar name={user.fullName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{user.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
              <div className="mt-1">
                <RolePill role={user.role} />
              </div>
            </div>
          </div>

          {/* Warning text */}
          <p className="text-center text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{user.fullName}</span>?
            <br />
            <span className="text-xs text-red-500 font-medium">This action cannot be undone.</span>
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 rounded-b-2xl border-t border-border bg-muted/20 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-red-500 hover:bg-red-600 text-white"
            onClick={onConfirm}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete User
          </Button>
        </div>

      </div>
    </div>
  );
}
