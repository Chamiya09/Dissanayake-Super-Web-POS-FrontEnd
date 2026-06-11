import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  UserPlus,
  User,
  AtSign,
  Mail,
  Hash,
  Lock,
  ShieldCheck,
  Info,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  MapPin,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/GlobalToastContext";

const ROLE_OPTIONS = ["MANAGER", "STAFF"] as const;

const ROLE_PILL_STYLES = {
  Owner: "bg-red-50 text-red-600 border-red-200",
  Manager: "bg-blue-50 text-blue-600 border-blue-200",
  Staff: "bg-emerald-50 text-emerald-600 border-emerald-200",
  MANAGER: "bg-blue-50 text-blue-600 border-blue-200",
  STAFF: "bg-emerald-50 text-emerald-600 border-emerald-200",
};
const ROLE_DOT = {
  Owner: "bg-red-500",
  Manager: "bg-blue-500",
  Staff: "bg-emerald-500",
  MANAGER: "bg-blue-500",
  STAFF: "bg-emerald-500",
};

type FormState = {
  fullName: string;
  memberId: string;
  username: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: "MANAGER" | "STAFF";
  password: string;
  isSenior: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type AddUserModalProps = {
  onClose: () => void;
  onAdd: (payload: FormState) => Promise<void>;
  currentUserRole: string;
};

const EMPTY_FORM: FormState = {
  fullName: "",
  memberId: "",
  username: "",
  email: "",
  phoneNumber: "",
  address: "",
  role: "MANAGER",
  password: "",
  isSenior: false,
};

const MEMBER_ID_HELPER = {
  MANAGER: "Use format MGR### (example: MGR001)",
  STAFF: "Use format STF### (example: STF001)",
};

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.fullName.trim()) errors.fullName = "Full name is required.";
  if (!form.memberId.trim()) {
    errors.memberId = "Member ID is required.";
  } else if (form.role === "MANAGER" && !/^MGR\d{3,}$/i.test(form.memberId.trim())) {
    errors.memberId = "Manager ID must follow MGR###.";
  } else if (form.role === "STAFF" && !/^STF\d{3,}$/i.test(form.memberId.trim())) {
    errors.memberId = "Staff ID must follow STF###.";
  }
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.password.trim()) {
    errors.password = "Password is required.";
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  return errors;
}

function RolePill({ role }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", ROLE_PILL_STYLES[role])}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", ROLE_DOT[role])} />
      {role}
    </span>
  );
}

function FormRow({ id, label, icon: Icon, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-900">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </Label>
      {children}
      {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}
    </div>
  );
}

export default function AddUserModal({ onClose, onAdd, currentUserRole }: AddUserModalProps) {
  const { showToast } = useToast();
  const isManagerView = currentUserRole === "Manager";
  const allowedRoles = useMemo(
    () => (isManagerView ? ["STAFF"] : [...ROLE_OPTIONS]),
    [isManagerView]
  );

  const [form, setForm] = useState<FormState>({
    ...EMPTY_FORM,
    role: isManagerView ? "STAFF" : "MANAGER",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 80);
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (isManagerView) {
      setForm((prev) => (prev.role === "STAFF" ? prev : { ...prev, role: "STAFF", isSenior: false }));
    }
  }, [isManagerView]);

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "role" && value !== "STAFF") {
        next.isSenior = false;
      }
      return next;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      const firstError = Object.values(validation)[0];
      if (firstError) showToast(firstError, "error");
      return;
    }

    setSaving(true);
    try {
      await onAdd({
        fullName: form.fullName.trim(),
        memberId: form.memberId.trim().toUpperCase(),
        username: form.username.trim() || form.memberId.trim().toUpperCase(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim(),
        role: form.role,
        password: form.password,
        isSenior: form.role === "STAFF" && form.isSenior,
      });
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Failed to add user. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" aria-labelledby="add-user-title">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_38%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-100 bg-white text-teal-600 shadow-sm">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="add-user-title" className="text-[20px] font-bold leading-tight text-slate-900">
                    {isManagerView ? "Add Staff Member" : "Add New User"}
                  </h2>
                  {isManagerView && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
                      <Sparkles className="h-3 w-3" />
                      Manager View
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] text-slate-500">
                  {isManagerView
                    ? "Create staff accounts quickly for your team with the fields you actually need."
                    : "Fill in the user details and choose the correct role for system access."}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="text-[12px] font-medium leading-relaxed text-slate-600">
              Signed in as <RolePill role={currentUserRole} />.
              {" "}
              {isManagerView
                ? "You can only create Staff accounts from this page."
                : <>You can create {allowedRoles.map((r, i) => (
                    <span key={r}>
                      <RolePill role={r} />
                      {i < allowedRoles.length - 1 ? " or " : ""}
                    </span>
                  ))} accounts.</>}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 px-6 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormRow id="fullName" label="Full Name" icon={User} error={errors.fullName}>
                <Input
                  id="fullName"
                  ref={firstInputRef}
                  placeholder="e.g. Kamal Perera"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className={cn("h-11 rounded-xl border-slate-200 bg-white text-[13px] focus-visible:ring-slate-300", errors.fullName && "border-red-400 focus-visible:ring-red-400")}
                />
              </FormRow>

              <FormRow id="memberId" label={form.role === "MANAGER" ? "Manager ID" : "Staff ID"} icon={Hash} error={errors.memberId}>
                <Input
                  id="memberId"
                  placeholder={form.role === "MANAGER" ? "e.g. MGR001" : "e.g. STF001"}
                  value={form.memberId}
                  onChange={(e) => handleChange("memberId", e.target.value.toUpperCase())}
                  className={cn("h-11 rounded-xl border-slate-200 bg-white font-mono text-[13px] focus-visible:ring-slate-300", errors.memberId && "border-red-400 focus-visible:ring-red-400")}
                />
                <p className="text-[11px] text-slate-500">{MEMBER_ID_HELPER[form.role]}</p>
              </FormRow>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormRow id="email" label="Email Address" icon={Mail} error={errors.email}>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. kamal@example.lk"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={cn("h-11 rounded-xl border-slate-200 bg-white text-[13px] focus-visible:ring-slate-300", errors.email && "border-red-400 focus-visible:ring-red-400")}
                />
              </FormRow>

              {isManagerView ? (
                <FormRow id="role-lock" label="Role" icon={ShieldCheck}>
                  <div className="flex h-11 items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5">
                    <RolePill role="STAFF" />
                    <span className="text-[12px] font-medium text-emerald-700">Managers can only add staff members</span>
                  </div>
                </FormRow>
              ) : (
                <FormRow id="role" label="Role" icon={ShieldCheck} error={errors.role}>
                  <Select value={form.role} onValueChange={(v) => handleChange("role", v as FormState["role"])}>
                    <SelectTrigger id="role" className="h-11 rounded-xl border-slate-200 bg-white text-[13px] focus:ring-teal-300">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedRoles.map((r) => (
                        <SelectItem key={r} value={r} className="text-[13px] font-medium">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>
              )}
            </div>

            <FormRow id="username" label="Username (Optional)" icon={AtSign} error={errors.username}>
              <Input
                id="username"
                placeholder="Leave blank to use member ID automatically"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                className={cn("h-11 rounded-xl border-slate-200 bg-white font-mono text-[13px] focus-visible:ring-slate-300", errors.username && "border-red-400 focus-visible:ring-red-400")}
              />
            </FormRow>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormRow id="phoneNumber" label="Phone Number" icon={Phone} error={errors.phoneNumber}>
                <Input
                  id="phoneNumber"
                  placeholder="e.g. +94 77 123 4567"
                  value={form.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  className={cn("h-11 rounded-xl border-slate-200 bg-white text-[13px] focus-visible:ring-slate-300", errors.phoneNumber && "border-red-400 focus-visible:ring-red-400")}
                />
              </FormRow>

              <FormRow id="address" label="Address" icon={MapPin} error={errors.address}>
                <Input
                  id="address"
                  placeholder="e.g. Kandy"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className={cn("h-11 rounded-xl border-slate-200 bg-white text-[13px] focus-visible:ring-slate-300", errors.address && "border-red-400 focus-visible:ring-red-400")}
                />
              </FormRow>
            </div>

            {form.role === "STAFF" && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      <BadgeCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <Label htmlFor="isSenior" className="text-[13px] font-semibold text-emerald-950">
                        Senior Cashier Privileges
                      </Label>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-emerald-700">
                        Enable this only when the staff member should approve supervised return operations.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="isSenior"
                    checked={form.isSenior}
                    onCheckedChange={(checked) => handleChange("isSenior", checked)}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
              </div>
            )}

            <FormRow id="password" label="Password" icon={Lock} error={errors.password}>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={cn("h-11 rounded-xl border-slate-200 bg-white pr-10 text-[13px] focus-visible:ring-slate-300", errors.password && "border-red-400 focus-visible:ring-red-400")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormRow>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {isManagerView ? "Create Staff Account" : "Save User"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
