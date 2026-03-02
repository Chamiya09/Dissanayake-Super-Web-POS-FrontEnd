import { useState, useEffect, useRef } from "react";
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

const ALLOWED_ROLES = {
  Owner:   ["Manager"],
  Manager: ["Staff"],
};

const ROLE_PILL_STYLES = {
  Owner:   "bg-red-100   text-red-700   border-red-200",
  Manager: "bg-blue-100  text-blue-700  border-blue-200",
  Staff:   "bg-green-100 text-green-700 border-green-200",
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

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    role: allowedRoles.length === 1 ? allowedRoles[0] : "",
  });
  const [errors, setErrors] = useState({});
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
    onAdd({
      id:       Date.now(),
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email:    form.email.trim(),
      role:     form.role,
    });
    onClose();
  };

  const isRoleLocked = allowedRoles.length === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" aria-labelledby="add-user-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className={cn("relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl", "animate-in fade-in-0 zoom-in-95 duration-200")}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 id="add-user-title" className="text-[16px] font-bold text-foreground leading-tight">Add New User</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Fill in the details to create an account.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Permission notice */}
        <div className="mx-6 mt-5 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-3 dark:border-blue-800 dark:bg-blue-900/20">
          <Info className="mt-px h-3.5 w-3.5 shrink-0 text-blue-500" />
          <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
            Signed in as <RolePill role={currentUserRole} />. You can only create{" "}
            {allowedRoles.map((r, i) => (
              <span key={r}><RolePill role={r} />{i < allowedRoles.length - 1 ? " or " : ""}</span>
            ))}{" "}accounts.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">

            {/* Row 1: Full Name + Username */}
            <div className="grid grid-cols-2 gap-6">
              <FormRow id="fullName" label="Full Name" icon={User} error={errors.fullName}>
                <Input id="fullName" ref={firstInputRef} placeholder="e.g. Kamal Perera" value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className={cn("h-10 text-sm", errors.fullName && "border-red-400 focus-visible:ring-red-300")} />
              </FormRow>

              <FormRow id="username" label="Username" icon={User} error={errors.username}>
                <Input id="username" placeholder="e.g. kamal_p" value={form.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  className={cn("h-10 text-sm", errors.username && "border-red-400 focus-visible:ring-red-300")} />
              </FormRow>
            </div>

            {/* Row 2: Email + Role */}
            <div className="grid grid-cols-2 gap-6">
              <FormRow id="email" label="Email" icon={Mail} error={errors.email}>
                <Input id="email" type="email" placeholder="e.g. kamal@example.lk" value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={cn("h-10 text-sm", errors.email && "border-red-400 focus-visible:ring-red-300")} />
              </FormRow>

              <FormRow id="role" label="Role" icon={ShieldCheck} error={errors.role}>
                {isRoleLocked ? (
                  <div className="flex h-10 items-center rounded-md border border-border bg-muted/50 px-3 gap-2">
                    <RolePill role={allowedRoles[0]} />
                  </div>
                ) : (
                  <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                    <SelectTrigger className={cn("h-10 text-sm", errors.role && "border-red-400 focus:ring-red-300")}>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedRoles.map((r) => (
                        <SelectItem key={r} value={r} className="text-sm">
                          <div className="flex items-center gap-2"><RolePill role={r} /></div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormRow>
            </div>

            {/* Row 3: Password — full width */}
            <FormRow id="password" label="Password" icon={Lock} error={errors.password}>
              <Input id="password" type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className={cn("h-10 text-sm", errors.password && "border-red-400 focus-visible:ring-red-300")} />
            </FormRow>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 px-5 text-[13px]">Cancel</Button>
            <Button type="submit" className="h-9 px-5 text-[13px] gap-2 shadow-sm">
              <UserPlus className="h-3.5 w-3.5" />
              Add User
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
