import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useAuth } from "@/context/AuthContext";
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

/* ─────────────────────────────────────────────────────────────────────────
   Account summary data (mirrors AuthContext mock users)
   ───────────────────────────────────────────────────────────────────────── */
const SETTINGS_EMAIL = {
  admin:    "nuwan@dissanayake.lk",
  manager1: "kamala@dissanayake.lk",
  staff1:   "sachini@dissanayake.lk",
};
const SETTINGS_ROLE_GRADIENT = {
  Owner:   "from-red-400   to-red-600",
  Manager: "from-blue-400  to-blue-600",
  Staff:   "from-green-400 to-green-600",
};
const SETTINGS_ROLE_BADGE = {
  Owner:   "bg-red-100   text-red-700   border border-red-200   dark:bg-red-900/20   dark:text-red-400",
  Manager: "bg-blue-100  text-blue-700  border border-blue-200  dark:bg-blue-900/20  dark:text-blue-400",
  Staff:   "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400",
};
const SETTINGS_ROLE_DOT = { Owner: "bg-red-500", Manager: "bg-blue-500", Staff: "bg-green-500" };

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
            "h-10 w-full rounded-lg border border-border bg-background pl-9 pr-10 text-sm",
            "text-foreground placeholder:text-muted-foreground",
            "outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20",
            error && "border-red-400 focus:border-red-400 focus:ring-red-200"
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Toggle switch with label + optional sub-description */
function Toggle({ id, label, description, checked, onChange, disabled = false, badge }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <label htmlFor={id} className="cursor-pointer text-[14px] font-semibold text-foreground">
            {label}
          </label>
          {badge && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
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
          "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          checked ? "bg-primary" : "bg-input",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200",
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
    "bg-yellow-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-emerald-600",
  ];
  const textColours = [
    "text-red-500",
    "text-orange-500",
    "text-yellow-600",
    "text-blue-600",
    "text-emerald-600",
    "text-emerald-700",
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i < score ? colours[score] : "bg-border"
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
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl", iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Account summary card — left sidebar of the settings grid
   ───────────────────────────────────────────────────────────────────────── */
function AccountSummaryCard({ user }) {
  const initials = (user?.name ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const email = SETTINGS_EMAIL[user?.username] ?? "—";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Role-coloured banner */}
      <div className={cn(
        "h-16 bg-gradient-to-br opacity-30",
        SETTINGS_ROLE_GRADIENT[user?.role] ?? "from-zinc-400 to-zinc-600"
      )} />

      {/* Avatar + info body */}
      <div className="px-5 pb-5">
        {/* Avatar overlapping the banner */}
        <div className="-mt-7 mb-3">
          <div className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br",
            "text-xl font-extrabold text-white shadow-md ring-2 ring-background",
            SETTINGS_ROLE_GRADIENT[user?.role] ?? "from-zinc-400 to-zinc-600"
          )}>
            {initials}
          </div>
        </div>

        <p className="text-[15px] font-bold text-foreground leading-tight">{user?.name}</p>
        <span className={cn(
          "mt-1.5 mb-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
          SETTINGS_ROLE_BADGE[user?.role]
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", SETTINGS_ROLE_DOT[user?.role])} />
          {user?.role}
        </span>

        {/* Info rows */}
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <AtSign className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span className="font-mono truncate">{user?.username}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span className="truncate">{email}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs">
            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">Active account</span>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="border-t border-border bg-muted/30 px-5 py-3">
        <p className="text-[11px] text-muted-foreground italic">
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-border px-6 py-5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-foreground">Deactivate Account</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              This will immediately lock your account. You will be signed out and unable to log in until
              an administrator reactivates it.
            </p>
          </div>
        </div>

        {/* Warning box */}
        <div className="mx-6 mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 dark:bg-red-900/10 dark:border-red-800">
          <p className="text-[12px] font-medium text-red-700 dark:text-red-400">
            ⚠ This action cannot be undone by yourself. Contact your administrator to restore access.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 px-6 pb-6 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-9 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex h-9 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-white transition-colors",
              "bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-60"
            )}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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
    showPopup("success", val ? "Email notifications enabled." : "Email notifications disabled.");
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
        else showPopup("error", msg);
        return;
      }

      showPopup("success", "Password updated successfully!");
      setCurrent(""); setNewPass(""); setConfirm("");
    } catch {
      showPopup("error", "Could not reach the server. Please try again.");
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
        showPopup("error", body?.message ?? "Could not deactivate account.");
        return;
      }

      // Sign out and redirect
      logout();
      navigate("/login", { replace: true });
    } catch {
      showPopup("error", "Could not reach the server. Please try again.");
    } finally {
      setDeacLoading(false);
      setShowDeactivate(false);
    }
  }

  /* ─── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <AppHeader />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

          {/* Page heading */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Settings</h1>
              <p className="text-xs text-muted-foreground">
                Manage your security, preferences, and account.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

            {/* ── Left column · Account Summary ── */}
            <div className="md:col-span-1">
              <AccountSummaryCard user={user} />
            </div>

            {/* ── Right columns · Settings sections ── */}
            <div className="md:col-span-2 space-y-6">

          {/* ── Section 1 · Security ──────────────────────────────────────── */}
          <SectionCard
            icon={ShieldCheck}
            iconBg="bg-primary/10 text-primary"
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

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white transition-colors",
                    "bg-primary hover:bg-primary/90 active:bg-primary/80 disabled:opacity-60"
                  )}
                >
                  {pwLoading
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…</>
                    : <><KeyRound className="h-3.5 w-3.5" /> Update Password</>
                  }
                </button>
              </div>
            </form>
          </SectionCard>

          {/* ── Section 2 · Preferences ──────────────────────────────────── */}
          <SectionCard
            icon={Sliders}
            iconBg="bg-violet-500/10 text-violet-600"
            title="Preferences"
            subtitle="Personalise your experience."
          >
            <div className="divide-y divide-border">
              {/* Dark mode */}
              <div className="flex items-start justify-between gap-4 py-4 first:pt-0">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                    darkMode ? "bg-zinc-800 text-yellow-400" : "bg-amber-100 text-amber-600"
                  )}>
                    {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">
                      {darkMode ? "Dark theme is active." : "Light theme is active."}
                    </p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={darkMode}
                  onClick={() => toggleDark(!darkMode)}
                  className={cn(
                    "relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full",
                    "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    darkMode ? "bg-primary" : "bg-input"
                  )}
                >
                  <span className={cn(
                    "block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200",
                    darkMode ? "translate-x-[22px]" : "translate-x-[2px]"
                  )} />
                </button>
              </div>

              {/* Email notifications — Owner/Manager only */}
              {canSeeEmailNotif && (
                <div className="flex items-start justify-between gap-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                      emailNotifs ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground"
                    )}>
                      {emailNotifs ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-foreground">
                          Low-Stock Email Notifications
                        </p>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                          {user?.role}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Receive an email alert when any product falls below its reorder threshold.
                      </p>
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={emailNotifs}
                    onClick={() => toggleEmailNotifs(!emailNotifs)}
                    className={cn(
                      "relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full",
                      "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      emailNotifs ? "bg-primary" : "bg-input"
                    )}
                  >
                    <span className={cn(
                      "block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200",
                      emailNotifs ? "translate-x-[22px]" : "translate-x-[2px]"
                    )} />
                  </button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── Section 3 · Danger Zone ──────────────────────────────────── */}
          <SectionCard
            icon={Shield}
            iconBg="bg-red-500/10 text-red-600"
            title="Account Actions"
            subtitle="Irreversible operations. Proceed with caution."
          >
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[14px] font-bold text-red-800 dark:text-red-300">
                    Deactivate Account
                  </p>
                  <p className="mt-0.5 text-xs text-red-700 dark:text-red-400 leading-relaxed">
                    Lock your account immediately. Only an administrator can restore it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeactivate(true)}
                  className={cn(
                    "flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold",
                    "border border-red-300 bg-white text-red-700 shadow-sm",
                    "hover:bg-red-100 active:bg-red-200 transition-colors",
                    "dark:bg-red-900/20 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
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
      <SuccessPopup
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup((p) => ({ ...p, show: false }))}
      />
    </div>
  );
}
