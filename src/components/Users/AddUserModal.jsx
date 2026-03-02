import { useState, useEffect, useRef } from "react";
import {
  X, UserPlus, User, AtSign, Mail,
  Lock, ShieldCheck, Info, Eye, EyeOff, Loader2,
} from "lucide-react";
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

const ALLOWED_ROLES = {
  Owner:   ["Manager"],
  Manager: ["Staff"],
};

const ROLE_PILL_STYLES = {
  Owner:   "bg-red-100   text-red-700   border-red-200   dark:bg-red-900/20   dark:text-red-400   dark:border-red-800",
  Manager: "bg-blue-100  text-blue-700  border-blue-200  dark:bg-blue-900/20  dark:text-blue-400  dark:border-blue-800",
  Staff:   "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
};
const ROLE_DOT = { Owner: "bg-red-500", Manager: "bg-blue-500", Staff: "bg-green-500" };

const EMPTY_FORM = { fullName: "", username: "", email: "", role: "", password: "" };

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

function RolePill({ role }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
      ROLE_PILL_STYLES[role]
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", ROLE_DOT[role])} />
      {role}
    </span>
  );
}

function FormRow({ id, label, icon: Icon, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>
      {children}
      {error && <p className="text-[11px] text-red-500 dark:text-red-400 font-medium">{error}</p>}
    </div>
  );
}

export default function AddUserModal({ onClose, onAdd, currentUserRole }) {
  const allowedRoles = ALLOWED_ROLES[currentUserRole] ?? [];
  const isRoleLocked = allowedRoles.length === 1;

  const [form,   setForm]   = useState({
    ...EMPTY_FORM,
    role: isRoleLocked ? allowedRoles[0] : "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 80);
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateForm(form);
    if (Object.keys(validation).length > 0) { setErrors(validation); return; }
    setSaving(true);
    setTimeout(() => {
      onAdd({
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email:    form.email.trim(),
        role:     form.role,
        password: form.password,
      });
      setSaving(false);
      onClose();
    }, 400);
  };

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="add-user-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="h-[18px] w-[18px]" />
            </div>
            <div>
              <h2
                id="add-user-title"
                className="text-[16px] font-bold text-foreground leading-tight"
              >
                Add New User
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Fill in the details to create a new account.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Form body ── */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">

            {/* Permission notice */}
            <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-3 dark:border-blue-800 dark:bg-blue-900/20">
              <Info className="mt-px h-3.5 w-3.5 shrink-0 text-blue-500" />
              <p className="text-[12px] text-blue-700 dark:text-blue-400 leading-relaxed">
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

            {/* Section divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                User Details
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Full Name + Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormRow id="fullName" label="Full Name" icon={User} error={errors.fullName}>
                <Input
                  id="fullName"
                  ref={firstInputRef}
                  placeholder="e.g. Kamal Perera"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className={cn(
                    "h-10 text-[13px]",
                    errors.fullName && "border-red-400 focus-visible:ring-red-400",
                  )}
                />
              </FormRow>

              <FormRow id="username" label="Username" icon={AtSign} error={errors.username}>
                <Input
                  id="username"
                  placeholder="e.g. kamal_p"
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  className={cn(
                    "h-10 text-[13px] font-mono",
                    errors.username && "border-red-400 focus-visible:ring-red-400",
                  )}
                />
              </FormRow>
            </div>

            {/* Email + Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormRow id="email" label="Email Address" icon={Mail} error={errors.email}>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. kamal@example.lk"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={cn(
                    "h-10 text-[13px]",
                    errors.email && "border-red-400 focus-visible:ring-red-400",
                  )}
                />
              </FormRow>

              <FormRow id="role" label="Role" icon={ShieldCheck} error={errors.role}>
                {isRoleLocked ? (
                  <div className="flex h-10 items-center rounded-md border border-border bg-muted/50 px-3 gap-2">
                    <RolePill role={allowedRoles[0]} />
                  </div>
                ) : (
                  <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                    <SelectTrigger
                      id="role"
                      className={cn(
                        "h-10 text-[13px]",
                        errors.role && "border-red-400 focus:ring-red-400",
                      )}
                    >
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedRoles.map((r) => (
                        <SelectItem key={r} value={r} className="text-[13px]">
                          <div className="flex items-center gap-2">
                            <RolePill role={r} />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormRow>
            </div>

            {/* Password — full width with show/hide toggle */}
            <FormRow id="password" label="Password" icon={Lock} error={errors.password}>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={cn(
                    "h-10 text-[13px] pr-10",
                    errors.password && "border-red-400 focus-visible:ring-red-400",
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormRow>

          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="h-9 px-5 text-[13px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-9 px-5 text-[13px] gap-2 shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  Add User
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
