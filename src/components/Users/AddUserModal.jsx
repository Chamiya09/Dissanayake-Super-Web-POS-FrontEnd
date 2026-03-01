import { useState } from "react";
import { X, UserPlus, User, Mail, Lock, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
   Role-based permission map
   Owner   → may create Managers
   Manager → may create Staff
   ───────────────────────────────────────────────────────────────────────── */
const ALLOWED_ROLES = {
  Owner:   ["Manager"],
  Manager: ["Staff"],
};

const PERMISSION_LABELS = {
  Owner:   { badge: "bg-red-100 text-red-700 border-red-200",   dot: "bg-red-500"   },
  Manager: { badge: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500"  },
  Staff:   { badge: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
};

const EMPTY_FORM = {
  fullName: "",
  username: "",
  email: "",
  role: "",
  password: "",
};

function validateForm(form) {
  const errors = {};
  if (!form.fullName.trim())  errors.fullName  = "Full name is required.";
  if (!form.username.trim())  errors.username  = "Username is required.";
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.role)             errors.role      = "Please select a role.";
  if (!form.password.trim()) {
    errors.password = "Password is required.";
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  return errors;
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function RolePill({ role }) {
  const style = PERMISSION_LABELS[role];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", style?.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", style?.dot)} />
      {role}
    </span>
  );
}

export default function AddUserModal({ onClose, onAdd, currentUserRole }) {
  /* Derive which roles this user is allowed to assign */
  const allowedRoles = ALLOWED_ROLES[currentUserRole] ?? [];

  /* If only one role is allowed, pre-select it immediately */
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    role: allowedRoles.length === 1 ? allowedRoles[0] : "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    onAdd({
      id: Date.now(),
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      role: form.role,
    });
    onClose();
  };

  const isRoleLocked = allowedRoles.length === 1;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 rounded-t-2xl border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Add New User</h2>
            <p className="text-xs text-muted-foreground">Fill in the details below to create an account.</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Permission notice banner */}
        <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-3 dark:border-blue-800 dark:bg-blue-900/20">
          <Info className="mt-px h-3.5 w-3.5 shrink-0 text-blue-500" />
          <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
            Signed in as <RolePill role={currentUserRole} />. You can only create{" "}
            {allowedRoles.map((r, i) => (
              <span key={r}>
                <RolePill role={r} />
                {i < allowedRoles.length - 1 ? " or " : ""}
              </span>
            ))}{" "}
            accounts.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">

          {/* Full Name */}
          <div>
            <Label htmlFor="fullName" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
            </Label>
            <Input
              id="fullName"
              placeholder="e.g. Kamal Perera"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className={cn("h-9 text-sm", errors.fullName && "border-red-400 focus-visible:ring-red-300")}
            />
            <FieldError message={errors.fullName} />
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <User className="h-3.5 w-3.5 text-muted-foreground" /> Username
            </Label>
            <Input
              id="username"
              placeholder="e.g. kamal_p"
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              className={cn("h-9 text-sm", errors.username && "border-red-400 focus-visible:ring-red-300")}
            />
            <FieldError message={errors.username} />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. kamal@dissanayake.lk"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={cn("h-9 text-sm", errors.email && "border-red-400 focus-visible:ring-red-300")}
            />
            <FieldError message={errors.email} />
          </div>

          {/* Role — filtered dropdown or locked display */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" /> Role
              {isRoleLocked && (
                <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  auto-assigned
                </span>
              )}
            </Label>

            {isRoleLocked ? (
              /* Single allowed role — show as a read-only styled pill */
              <div className="flex h-9 items-center rounded-md border border-border bg-muted/50 px-3">
                <RolePill role={allowedRoles[0]} />
                <span className="ml-2 text-xs text-muted-foreground">Only assignable role for your access level</span>
              </div>
            ) : (
              /* Multiple allowed roles — filterable dropdown */
              <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                <SelectTrigger className={cn("h-9 text-sm", errors.role && "border-red-400 focus:ring-red-300")}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {allowedRoles.map((r) => (
                    <SelectItem key={r} value={r} className="text-sm">
                      <div className="flex items-center gap-2">
                        <RolePill role={r} />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <FieldError message={errors.role} />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className={cn("h-9 text-sm", errors.password && "border-red-400 focus-visible:ring-red-300")}
            />
            <FieldError message={errors.password} />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Add User
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
