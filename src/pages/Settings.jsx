import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useToast } from "@/context/GlobalToastContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axiosInstance";
import SuccessPopup from "@/components/ui/SuccessPopup";
import { cn } from "@/lib/utils";
import {
  Settings2,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Moon,
  Sun,
  Bell,
  BellOff,
  UserX,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Sliders,
  Shield,
  User,
  AtSign,
  Mail,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────────────────────── */
const API_BASE = "http://localhost:8080";

const LS_DARK  = "pos_dark_mode";
const LS_EMAIL = "pos_email_notifications";


const SETTINGS_ROLE_GRADIENT = {
  Owner:   "from-red-400   to-red-600",
  Manager: "from-blue-400  to-blue-600",
  Staff:   "from-emerald-400 to-emerald-600",
};
const SETTINGS_ROLE_BADGE = {
  Owner:   "bg-red-50 text-red-600 border border-red-200",
  Manager: "bg-blue-50 text-blue-600 border border-blue-200",
  Staff:   "bg-emerald-50 text-emerald-600 border border-emerald-200",
};
const SETTINGS_ROLE_DOT = { Owner: "bg-red-500", Manager: "bg-blue-500", Staff: "bg-emerald-500" };

/* ─────────────────────────────────────────────────────────────────────────
   Small reusable helpers
   ───────────────────────────────────────────────────────────────────────── */

/** Secure password input with lock prefix + show/hide toggle */
function PasswordField({ id, label, value, onChange, show, onToggle, error, placeholder, hint }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-semibold text-foreground">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm",
            "text-slate-900 placeholder:text-slate-400",
            "outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
            error && "border-red-400 focus:border-red-400 focus:ring-red-100"
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

/** Toggle switch with label + optional sub-description */
function Toggle({ id, label, description, checked, onChange, disabled = false, badge }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <label htmlFor={id} className="cursor-pointer text-[14px] font-semibold text-slate-900">
            {label}
          </label>
          {badge && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.5 text-[13px] text-slate-500 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full",
          "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100",
          checked ? "bg-blue-600" : "bg-slate-200",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-[2px]"
          )}
        />
      </button>
    </div>
  );
}

/** Password strength indicator */
function PasswordStrength({ password }) {
  if (!password) return null;

  const score = (() => {
    let s = 0;
    if (password.length >= 6)                     s++;
    if (password.length >= 10)                    s++;
    if (/[A-Z]/.test(password))                   s++;
    if (/[0-9]/.test(password))                   s++;
    if (/[^A-Za-z0-9]/.test(password))            s++;
    return s; // 0-5
  })();

  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong", "Very strong"];
  const colours = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-emerald-600",
  ];
  const textColours = [
    "text-red-500",
    "text-orange-500",
    "text-amber-600",
    "text-blue-600",
    "text-emerald-600",
    "text-emerald-700",
  ];

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1 h-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-full flex-1 rounded-full transition-all duration-300",
              i < score ? colours[score] : "bg-slate-100"
            )}
          />
        ))}
      </div>
      <p className={cn("text-[11px] font-medium", textColours[score])}>{labels[score]}</p>
    </div>
  );
}

/** Section card wrapper with header */
function SectionCard({ icon: Icon, iconBg, title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 bg-slate-50/50">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-slate-900">{title}</p>
          {subtitle && <p className="text-[13px] text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Account summary card — left sidebar of the settings grid
   ───────────────────────────────────────────────────────────────────────── */
function AccountSummaryCard({ user, email }) {
  const initials = (user?.name ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Role-coloured banner */}
      <div className={cn(
        "h-16 bg-gradient-to-br opacity-80",
        SETTINGS_ROLE_GRADIENT[user?.role] ?? "from-slate-400 to-slate-600"
      )} />

      {/* Avatar + info body */}
      <div className="px-5 pb-5">
        {/* Avatar overlapping the banner */}
        <div className="-mt-8 mb-3">
          <div className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br",
            "text-xl font-extrabold text-white shadow-md ring-4 ring-white",
            SETTINGS_ROLE_GRADIENT[user?.role] ?? "from-slate-400 to-slate-600"
          )}>
            {initials}
          </div>
        </div>

        <p className="text-[16px] font-bold text-slate-900 leading-tight">{user?.name}</p>
        <span className={cn(
          "mt-2 mb-5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
          SETTINGS_ROLE_BADGE[user?.role]
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", SETTINGS_ROLE_DOT[user?.role])} />
          {user?.role}
        </span>

        {/* Info rows */}
        <div className="mt-2 space-y-3">
          <div className="flex items-center gap-3 text-[13px] text-slate-500">
            <AtSign className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="font-mono truncate">{user?.username}</span>
          </div>
          <div className="flex items-center gap-3 text-[13px] text-slate-500">
            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{email}</span>
          </div>
          <div className="flex items-center gap-3 text-[13px]">
            <User className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="font-medium text-emerald-600">Active account</span>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
        <p className="text-[12px] text-slate-500 italic">
          Account details are managed by your administrator.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Deactivate confirmation modal
   ───────────────────────────────────────────────────────────────────────── */
function DeactivateModal({ onConfirm, onCancel, loading }) {
  const overlayRef = useRef(null);

  // Close on backdrop click
  function handleOverlay(e) {
    if (e.target === overlayRef.current) onCancel();
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-50">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="pt-1">
            <h3 className="text-[16px] font-bold text-slate-900">Deactivate Account</h3>
            <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">
              This will immediately lock your account. You will be signed out and unable to log in until
              an administrator reactivates it.
            </p>
          </div>
        </div>

        {/* Warning box */}
        <div className="mx-6 mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-[12px] font-medium text-red-700">
            <AlertTriangle className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
            This action cannot be undone by yourself. Contact your administrator to restore access.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 px-6 pb-6 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-[13px] font-semibold text-white shadow-sm transition-all",
              "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:opacity-50"
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Yes, Deactivate My Account
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main Settings page
   ───────────────────────────────────────────────────────────────────────── */
export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  /* ── Profile email from API ──────────────────────────────────────────────── */
  const [profileEmail, setProfileEmail] = useState("—");

  useEffect(() => {
    if (!user?.username) return;
    api.get("/api/users").then(({ data }) => {
      const me = (data ?? []).find((u) => u.username === user.username);
      if (me?.email) setProfileEmail(me.email);
    }).catch(() => {});
  }, [user?.username]);
  /* ── Password form state ─────────────────────────────────────────────── */
  const [current,      setCurrent]      = useState("");
  const [newPass,      setNewPass]      = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showCur,      setShowCur]      = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showCon,      setShowCon]      = useState(false);
  const [pwErrors,     setPwErrors]     = useState({});
  const [pwLoading,    setPwLoading]    = useState(false);

  /* ── Preferences ─────────────────────────────────────────────────────── */
  const [darkMode,     setDarkMode]     = useState(
    () => localStorage.getItem(LS_DARK) === "true"
  );
  const [emailNotifs,  setEmailNotifs]  = useState(
    () => localStorage.getItem(LS_EMAIL) === "true"
  );

  /* ── Deactivate modal ────────────────────────────────────────────────── */
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deacLoading,    setDeacLoading]    = useState(false);

  /* ── Popup ───────────────────────────────────────────────────────────── */
  const [popup, setPopup] = useState({ show: false, type: "success", message: "" });
  const showPopup = (type, message) => setPopup({ show: true, type, message });

  const canSeeEmailNotif = ["Owner", "Manager"].includes(user?.role);

  /* ── Apply dark mode on mount ────────────────────────────────────────── */
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  /* ─── Handlers ─────────────────────────────────────────────────────────── */

  function toggleDark(val) {
    setDarkMode(val);
    localStorage.setItem(LS_DARK, String(val));
    if (val) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function toggleEmailNotifs(val) {
    setEmailNotifs(val);
    localStorage.setItem(LS_EMAIL, String(val));
    showToast(val ? "Email notifications enabled." : "Email notifications disabled.", "success");
  }

  /** Client-side password validation */
  function validatePassword() {
    const e = {};
    if (!current.trim())       e.current = "Current password is required.";
    if (newPass.length < 6)    e.newPass  = "New password must be at least 6 characters.";
    if (newPass === current && current.trim())
                               e.newPass  = "New password must differ from the current password.";
    if (newPass !== confirm)   e.confirm  = "Passwords do not match.";
    return e;
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    const errors = validatePassword();
    if (Object.keys(errors).length) { setPwErrors(errors); return; }

    setPwLoading(true);
    setPwErrors({});

    try {
      const res = await fetch(`${API_BASE}/api/users/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username:        user?.username,
          currentPassword: current,
          newPassword:     newPass,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.message ?? "Password update failed. Please try again.";
        if (res.status === 401) setPwErrors({ current: "Current password is incorrect." });
        else showToast(msg, "error");
        return;
      }

      showToast("Password updated successfully!", "success");
      setCurrent(""); setNewPass(""); setConfirm("");
    } catch {
      showToast("Could not reach the server. Please try again.", "error");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDeactivate() {
    setDeacLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/deactivate/${user?.username}`, {
        method: "PUT",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast(body?.message ?? "Could not deactivate account.", "error");
        return;
      }

      // Sign out and redirect
      logout();
      navigate("/login", { replace: true });
    } catch {
      showToast("Could not reach the server. Please try again.", "error");
    } finally {
      setDeacLoading(false);
      setShowDeactivate(false);
    }
  }

  /* ─── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <AppHeader />

      {/* Scrollable body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="mx-auto max-w-6xl px-6 py-10">

          {/* Page heading */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
              <Settings2 className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
              <p className="text-[13px] text-slate-500 mt-1">
                Manage your security, preferences, and account.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">

            {/* ── Left column · Account Summary ── */}
            <div className="lg:col-span-1">
              <AccountSummaryCard user={user} email={profileEmail} />
            </div>

            {/* ── Right columns · Settings sections ── */}
            <div className="lg:col-span-2 space-y-8">

          {/* ── Section 1 · Security ──────────────────────────────────────── */}
          <SectionCard
            icon={ShieldCheck}
            iconBg="bg-teal-50 text-teal-600"
            title="Security"
            subtitle="Change your account password."
          >
            <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
              <PasswordField
                id="cur-pass"
                label="Current Password"
                placeholder="Enter your current password"
                value={current}
                onChange={setCurrent}
                show={showCur}
                onToggle={() => setShowCur((v) => !v)}
                error={pwErrors.current}
              />
              <PasswordField
                id="new-pass"
                label="New Password"
                placeholder="At least 6 characters"
                value={newPass}
                onChange={setNewPass}
                show={showNew}
                onToggle={() => setShowNew((v) => !v)}
                error={pwErrors.newPass}
                hint="Use uppercase, numbers, and symbols for a stronger password."
              />
              {newPass && <PasswordStrength password={newPass} />}
              <PasswordField
                id="con-pass"
                label="Confirm New Password"
                placeholder="Re-enter the new password"
                value={confirm}
                onChange={setConfirm}
                show={showCon}
                onToggle={() => setShowCon((v) => !v)}
                error={pwErrors.confirm}
              />

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className={cn(
                    "flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-[13px] font-semibold text-white shadow-sm transition-all",
                    "bg-teal-600 hover:bg-teal-700 focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:opacity-50 w-full sm:w-auto"
                  )}
                >
                  {pwLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</>
                    : <><KeyRound className="h-4 w-4" /> Update Password</>
                  }
                </button>
              </div>
            </form>
          </SectionCard>

          {/* ── Section 2 · Preferences ──────────────────────────────────── */}
          <SectionCard
            icon={Sliders}
            iconBg="bg-violet-50 text-violet-600"
            title="Preferences"
            subtitle="Personalise your experience."
          >
            <div className="divide-y divide-slate-100">
              {/* Dark mode */}
              <div className="flex items-start justify-between gap-4 py-5 first:pt-0">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                    darkMode ? "bg-slate-800 text-yellow-400" : "bg-amber-50 text-amber-500"
                  )}>
                    {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">Dark Mode</p>
                    <p className="text-[13px] text-slate-500 mt-0.5 max-w-[250px]">
                      {darkMode ? "Dark theme is active." : "Light theme is active."}
                    </p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={darkMode}
                  onClick={() => toggleDark(!darkMode)}
                  className={cn(
                    "relative mt-1 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2",
                    darkMode ? "bg-teal-600" : "bg-slate-200"
                  )}
                >
                  <span className={cn(
                    "block h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transform transition-transform duration-200",
                    darkMode ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Email notifications — Owner/Manager only */}
              {canSeeEmailNotif && (
                <div className="flex items-start justify-between gap-4 py-5">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                      emailNotifs ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {emailNotifs ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-bold text-slate-900">
                          Low-Stock Email Notifications
                        </p>
                        <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          {user?.role}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-500 mt-0.5 max-w-[280px]">
                        Receive an email alert when any product falls below its reorder threshold.
                      </p>
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={emailNotifs}
                    onClick={() => toggleEmailNotifs(!emailNotifs)}
                    className={cn(
                      "relative mt-1 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2",
                      emailNotifs ? "bg-teal-600" : "bg-slate-200"
                    )}
                  >
                    <span className={cn(
                      "block h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transform transition-transform duration-200",
                      emailNotifs ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── Section 3 · Danger Zone ──────────────────────────────────── */}
          <SectionCard
            icon={Shield}
            iconBg="bg-red-50 text-red-600"
            title="Account Actions"
            subtitle="Irreversible operations. Proceed with caution."
          >
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[14px] font-bold text-red-800">
                    Deactivate Account
                  </p>
                  <p className="mt-1 text-[13px] text-red-700 leading-relaxed max-w-sm">
                    Lock your account immediately. Only an administrator can restore it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeactivate(true)}
                  className={cn(
                    "flex flex-shrink-0 h-10 items-center justify-center gap-2 rounded-xl px-5 text-[13px] font-semibold",
                    "border border-red-200 bg-white text-red-700 shadow-sm",
                    "hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 transition-all"
                  )}
                >
                  <UserX className="h-4 w-4" />
                  Deactivate Account
                </button>
              </div>
            </div>
          </SectionCard>

            </div>{/* end right columns */}
          </div>{/* end grid */}

        </div>
      </div>

      {/* Deactivation confirmation modal */}
      {showDeactivate && (
        <DeactivateModal
          loading={deacLoading}
          onConfirm={handleDeactivate}
          onCancel={() => setShowDeactivate(false)}
        />
      )}

      {/* Toast notifications */}
      
    </div>
  );
}
