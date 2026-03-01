import { useState } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useAuth } from "@/context/AuthContext";
import SuccessPopup from "@/components/ui/SuccessPopup";
import { cn } from "@/lib/utils";
import {
  User,
  AtSign,
  Mail,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Lock,
  TrendingUp,
  Clock,
  Users,
  Store,
  BarChart2,
  UserCheck,
  Briefcase,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   Role badge colours (consistent with UserManagement)
   ───────────────────────────────────────────────────────────────────────── */
const ROLE_STYLES = {
  Owner:   "bg-red-100   text-red-700   border border-red-200   dark:bg-red-900/20   dark:text-red-400   dark:border-red-800",
  Manager: "bg-blue-100  text-blue-700  border border-blue-200  dark:bg-blue-900/20  dark:text-blue-400  dark:border-blue-800",
  Staff:   "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
};
const ROLE_DOT = { Owner: "bg-red-500", Manager: "bg-blue-500", Staff: "bg-green-500" };

/* ─────────────────────────────────────────────────────────────────────────
   Simulated email map (not yet stored in auth context)
   ───────────────────────────────────────────────────────────────────────── */
const USER_EMAIL = {
  admin:    "nuwan@dissanayake.lk",
  manager1: "kamala@dissanayake.lk",
  staff1:   "sachini@dissanayake.lk",
};

/* ─────────────────────────────────────────────────────────────────────────
   Simulated API call
   PUT /api/users/update-password
   ───────────────────────────────────────────────────────────────────────── */
async function apiUpdatePassword(username, currentPassword, newPassword) {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 800));

  /* In production, replace with:
     const res = await fetch("/api/users/update-password", {
       method: "PUT",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ username, currentPassword, newPassword }),
     });
     if (!res.ok) throw new Error(await res.text());
  */

  // Simulated success — any non-empty current password is accepted
  if (!currentPassword.trim()) {
    throw new Error("Current password is incorrect.");
  }
  return { success: true };
}

/* ─────────────────────────────────────────────────────────────────────────
   Mock role-specific data (replace with real API calls later)
   ───────────────────────────────────────────────────────────────────────── */
const ROLE_DATA = {
  Staff: {
    totalSales:   "LKR 24,850.00",
    transactions: 17,
    shiftHours:   "6h 32m",
    avgPerTxn:    "LKR 1,461.76",
  },
  Manager: {
    staffManaged:  4,
    activeToday:   3,
    teamSalesTotal:"LKR 128,400.00",
    openIssues:    2,
  },
  Owner: {
    storeName:     "Dissanayaka Super",
    totalUsers:    6,
    totalProducts: 124,
    monthRevenue:  "LKR 1,284,750.00",
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   Stat tile — used inside every role section card
   ───────────────────────────────────────────────────────────────────────── */
function StatTile({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", accent)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] font-medium text-muted-foreground leading-tight">{label}</p>
      <p className="text-lg font-bold tabular-nums text-foreground leading-none">{value}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Role-specific insight card — renders the right section per role
   ───────────────────────────────────────────────────────────────────────── */
function RoleSection({ role }) {
  const data = ROLE_DATA[role];
  if (!data) return null;

  // ── Staff: Performance Summary ──
  if (role === "Staff") {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border px-8 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10">
            <BarChart2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-foreground">Performance Summary</p>
            <p className="text-xs text-muted-foreground">Your activity stats for today's shift.</p>
          </div>
          <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
            Live
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 p-8 sm:grid-cols-4">
          <StatTile icon={TrendingUp} label="Total Sales Today"    value={data.totalSales}   accent="bg-green-500/10  text-green-600"  />
          <StatTile icon={BarChart2}  label="Transactions Handled" value={data.transactions}  accent="bg-violet-500/10 text-violet-600" />
          <StatTile icon={Clock}      label="Shift Hours"          value={data.shiftHours}    accent="bg-amber-500/10  text-amber-600"  />
          <StatTile icon={UserCheck}  label="Avg. per Transaction" value={data.avgPerTxn}     accent="bg-sky-500/10    text-sky-600"    />
        </div>
      </div>
    );
  }

  // ── Manager: Team Overview ──
  if (role === "Manager") {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border px-8 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-foreground">Team Overview</p>
            <p className="text-xs text-muted-foreground">Staff under your supervision today.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-8 sm:grid-cols-4">
          <StatTile icon={Users}      label="Staff Managed"        value={data.staffManaged}    accent="bg-blue-500/10   text-blue-600"   />
          <StatTile icon={UserCheck}  label="Active Today"         value={data.activeToday}     accent="bg-green-500/10  text-green-600"  />
          <StatTile icon={TrendingUp} label="Team Sales Total"     value={data.teamSalesTotal}  accent="bg-violet-500/10 text-violet-600" />
          <StatTile icon={BarChart2}  label="Open Issues"          value={data.openIssues}      accent="bg-amber-500/10  text-amber-600"  />
        </div>
      </div>
    );
  }

  // ── Owner: Business Ownership ──
  if (role === "Owner") {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border px-8 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
            <Briefcase className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-foreground">Business Ownership</p>
            <p className="text-xs text-muted-foreground">High-level overview of your POS system.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-8 sm:grid-cols-4">
          <StatTile icon={Store}      label="Store Name"           value={data.storeName}       accent="bg-red-500/10     text-red-600"     />
          <StatTile icon={Users}      label="Registered Users"     value={data.totalUsers}      accent="bg-blue-500/10    text-blue-600"    />
          <StatTile icon={BarChart2}  label="Total Products"       value={data.totalProducts}   accent="bg-violet-500/10  text-violet-600"  />
          <StatTile icon={TrendingUp} label="This Month Revenue"   value={data.monthRevenue}    accent="bg-emerald-500/10 text-emerald-600" />
        </div>
      </div>
    );
  }

  return null;
}

/* ─────────────────────────────────────────────────────────────────────────
   Small helpers
   ───────────────────────────────────────────────────────────────────────── */
function ReadOnlyField({ icon: Icon, label, value, extra }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </label>
      <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-foreground select-none">
        {extra ?? value}
        {extra ? null : null}
      </div>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, show, onToggle, error, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-foreground">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-background pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground",
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
    </div>
  );
}

function AvatarCircle({ name, role }) {
  const initials = (name ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const colours = {
    Owner:   "from-red-400   to-red-600",
    Manager: "from-blue-400  to-blue-600",
    Staff:   "from-green-400 to-green-600",
  };

  return (
    <div className={cn(
      "flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br text-2xl font-extrabold text-white shadow-lg",
      colours[role] ?? "from-zinc-400 to-zinc-600"
    )}>
      {initials}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   UserProfile page
   ───────────────────────────────────────────────────────────────────────── */
export default function UserProfile() {
  const { user } = useAuth();
  const email = USER_EMAIL[user?.username] ?? "—";

  /* Password form state */
  const [current,   setCurrent]   = useState("");
  const [newPass,   setNewPass]   = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showCon,   setShowCon]   = useState(false);
  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);

  /* Popup state */
  const [popup, setPopup] = useState({ show: false, type: "success", message: "" });
  const showPopup = (type, message) => setPopup({ show: true, type, message });

  /* Validate */
  function validate() {
    const e = {};
    if (!current.trim())          e.current = "Current password is required.";
    if (newPass.length < 6)       e.newPass = "New password must be at least 6 characters.";
    if (newPass !== confirm)       e.confirm = "Passwords do not match.";
    if (newPass === current)       e.newPass = "New password must differ from the current one.";
    return e;
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setErrors({});
    setLoading(true);
    try {
      await apiUpdatePassword(user.username, current, newPass);
      setCurrent(""); setNewPass(""); setConfirm("");
      showPopup("success", "Password updated successfully!");
    } catch (err) {
      setErrors({ current: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-10">

          {/* ── Page title ── */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">View your account details and manage your password.</p>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">

          {/* ── Left column · Profile Info ── */}
          <div className="lg:col-span-1">

          {/* ── Profile card ── */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

            {/* Banner */}
            <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

            {/* Avatar row — overlaps banner */}
            <div className="px-6 pb-6">
              <div className="-mt-10 mb-4 flex items-end gap-4">
                <AvatarCircle name={user?.name} role={user?.role} />
                <div className="pb-1">
                  <p className="text-lg font-bold text-foreground leading-tight">{user?.name}</p>
                  <span className={cn(
                    "mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    ROLE_STYLES[user?.role]
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", ROLE_DOT[user?.role])} />
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Read-only fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ReadOnlyField
                  icon={User}
                  label="Full Name"
                  value={user?.name}
                />
                <ReadOnlyField
                  icon={AtSign}
                  label="Username"
                  extra={
                    <span className="font-mono text-sm text-muted-foreground">@{user?.username}</span>
                  }
                />
                <ReadOnlyField
                  icon={Mail}
                  label="Email"
                  value={email}
                />
                <ReadOnlyField
                  icon={ShieldCheck}
                  label="Role"
                  extra={
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      ROLE_STYLES[user?.role]
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", ROLE_DOT[user?.role])} />
                      {user?.role}
                    </span>
                  }
                />
              </div>

              {/* Read-only notice */}
              <p className="mt-3 text-[11px] text-muted-foreground italic">
                Profile details can only be changed by an administrator.
              </p>
            </div>
          </div>

          </div>{/* end left column */}

          {/* ── Right columns · Stats + Password ── */}
          <div className="space-y-8 lg:col-span-2">

          {/* ── Role-specific section ── */}
          <RoleSection role={user?.role} />

          {/* ── Change Password card ── */}
          <div className="rounded-xl border border-border bg-card shadow-sm">

            {/* Card header */}
            <div className="flex items-center gap-3 border-b border-border px-8 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground">Change Password</p>
                <p className="text-xs text-muted-foreground">Choose a strong password (min. 6 characters).</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">

              <PasswordField
                id="cur-pass"
                label="Current Password"
                placeholder="Enter your current password"
                value={current}
                onChange={(v) => { setCurrent(v); setErrors((e) => ({ ...e, current: undefined })); }}
                show={showCur}
                onToggle={() => setShowCur((v) => !v)}
                error={errors.current}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PasswordField
                  id="new-pass"
                  label="New Password"
                  placeholder="Min. 6 characters"
                  value={newPass}
                  onChange={(v) => { setNewPass(v); setErrors((e) => ({ ...e, newPass: undefined })); }}
                  show={showNew}
                  onToggle={() => setShowNew((v) => !v)}
                  error={errors.newPass}
                />
                <PasswordField
                  id="con-pass"
                  label="Confirm New Password"
                  placeholder="Repeat new password"
                  value={confirm}
                  onChange={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: undefined })); }}
                  show={showCon}
                  onToggle={() => setShowCon((v) => !v)}
                  error={errors.confirm}
                />
              </div>

              {/* Password strength indicator */}
              {newPass.length > 0 && (
                <PasswordStrength password={newPass} />
              )}

              {/* Submit */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm",
                    "transition-all hover:bg-primary/90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/40",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Updating…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Update Password
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          </div>{/* end right columns */}
          </div>{/* end grid */}

        </div>
      </div>

      {/* Success / Error popup */}
      <SuccessPopup
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup((p) => ({ ...p, show: false }))}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Password strength meter
   ───────────────────────────────────────────────────────────────────────── */
function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))            score++;
  if (/[0-9]/.test(pw))            score++;
  if (/[^A-Za-z0-9]/.test(pw))     score++;
  return score; // 0-4
}

const STRENGTH_LABEL = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOUR = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
];
const STRENGTH_TEXT = [
  "text-red-600 dark:text-red-400",
  "text-orange-600 dark:text-orange-400",
  "text-amber-600 dark:text-amber-400",
  "text-lime-600 dark:text-lime-400",
  "text-emerald-600 dark:text-emerald-400",
];

function PasswordStrength({ password }) {
  const score = getStrength(password);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              i < score ? STRENGTH_COLOUR[score] : "bg-border"
            )}
          />
        ))}
      </div>
      <p className={cn("text-[11px] font-semibold", STRENGTH_TEXT[score])}>
        {STRENGTH_LABEL[score]}
        {score < 3 && (
          <span className="ml-1.5 font-normal text-muted-foreground">
            — try adding numbers, uppercase letters, or symbols
          </span>
        )}
      </p>
    </div>
  );
}
