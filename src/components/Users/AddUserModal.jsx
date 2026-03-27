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
  Owner:   "bg-red-50 text-red-600 border-red-200",
  Manager: "bg-blue-50 text-blue-600 border-blue-200",
  Staff:   "bg-emerald-50 text-emerald-600 border-emerald-200",
};
const ROLE_DOT = { Owner: "bg-red-500", Manager: "bg-blue-500", Staff: "bg-emerald-500" };

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
      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
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
      <Label htmlFor={id} className="text-[13px] font-medium text-slate-900 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </Label>
      {children}
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateForm(form);
    if (Object.keys(validation).length > 0) { setErrors(validation); return; }
    setSaving(true);
    try {
      await onAdd({
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email:    form.email.trim(),
        role:     form.role,
        password: form.password,
      });
      onClose();
    } catch(err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
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
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="add-user-title"
                className="text-[16px] font-bold text-slate-900 leading-tight"
              >
                Add New User
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Fill in the details to create a new account.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Form body ── */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">

            {/* Permission notice */}
            <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-[12px] text-blue-700 leading-relaxed font-medium">
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
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                User Details
              </span>
              <div className="h-px flex-1 bg-slate-100" />
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
                    "h-10 text-[13px] bg-white border-slate-200 focus-visible:ring-slate-300",
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
                    "h-10 text-[13px] font-mono bg-white border-slate-200 focus-visible:ring-slate-300",
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
                    "h-10 text-[13px] bg-white border-slate-200 focus-visible:ring-slate-300",
                    errors.email && "border-red-400 focus-visible:ring-red-400",
                  )}
                />
              </FormRow>

              <FormRow id="role" label="Role" icon={ShieldCheck} error={errors.role}>
                {isRoleLocked ? (
                  <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 gap-2">
                    <RolePill role={allowedRoles[0]} />
                  </div>
                ) : (
                  <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                    <SelectTrigger
                      id="role"
                      className={cn(
                        "h-10 text-[13px] bg-white border-slate-200 focus:ring-slate-300",
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
                    "h-10 text-[13px] pr-10 bg-white border-slate-200 focus-visible:ring-slate-300",
                    errors.password && "border-red-400 focus-visible:ring-red-400",
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormRow>

          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="h-10 px-5 text-[13px] border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-10 px-5 text-[13px] gap-2 shadow-sm bg-teal-600 text-white hover:bg-teal-700 focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 transition-all"
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
