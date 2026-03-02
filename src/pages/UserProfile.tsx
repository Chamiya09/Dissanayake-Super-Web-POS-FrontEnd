import { useState } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axiosInstance";
import SuccessPopup from "@/components/ui/SuccessPopup";
import {
  User, AtSign, Mail, ShieldCheck, KeyRound,
  Eye, EyeOff, Save,
  TrendingUp, Clock, Users, Store, BarChart2, UserCheck, Briefcase,
} from "lucide-react";

/* ── Role badge / dot / gradient maps ─────────────────────────────────── */
const ROLE_BADGE: Record<string, string> = {
  Owner:   "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  Manager: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  Staff:   "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
};
const ROLE_DOT: Record<string, string> = {
  Owner: "bg-red-500", Manager: "bg-blue-500", Staff: "bg-green-500",
};
const ROLE_GRAD: Record<string, string> = {
  Owner: "from-red-400 to-red-600", Manager: "from-blue-400 to-blue-600", Staff: "from-green-400 to-green-600",
};
const COVER_GRAD: Record<string, string> = {
  Owner: "from-red-500 to-rose-700", Manager: "from-blue-500 to-indigo-700", Staff: "from-green-500 to-teal-700",
};

/* ── Static email lookup ──────────────────────────────────────────────── */
const USER_EMAIL: Record<string, string> = {
  admin:    "nuwan@dissanayake.lk",
  manager1: "kamala@dissanayake.lk",
  staff1:   "sachini@dissanayake.lk",
};

/* ── Role-specific stat data (mocked) ─────────────────────────────────── */
const ROLE_DATA: Record<string, Record<string, string | number>> = {
  Staff:   { totalSales: "LKR 24,850.00", transactions: 17, shiftHours: "6h 32m", avgPerTxn: "LKR 1,461.76" },
  Manager: { staffManaged: 4, activeToday: 3, teamSalesTotal: "LKR 128,400.00", openIssues: 2 },
  Owner:   { storeName: "Dissanayaka Super", totalUsers: 6, totalProducts: 124, monthRevenue: "LKR 1,284,750.00" },
};

/* ── Stat Tile ────────────────────────────────────────────────────────── */
function StatTile({ icon: Icon, label, value, bg, text }: {
  icon: React.ElementType; label: string; value: string | number; bg: string; text: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`h-4 w-4 ${text}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground leading-tight">{label}</p>
        <p className="text-lg font-bold text-foreground tabular-nums leading-snug">{value}</p>
      </div>
    </div>
  );
}

/* ── Role Section ─────────────────────────────────────────────────────── */
function RoleSection({ role }: { role: string | undefined }) {
  if (!role) return null;
  const data = ROLE_DATA[role];
  if (!data) return null;

  const sections: Record<string, {
    title: string; sub: string;
    icon: React.ElementType; iconBg: string; iconText: string;
    tiles: { icon: React.ElementType; label: string; value: string | number; bg: string; text: string }[];
  }> = {
    Staff: {
      title: "Performance Summary", sub: "Your activity stats for today's shift.",
      icon: BarChart2, iconBg: "bg-emerald-500/10", iconText: "text-emerald-600 dark:text-emerald-400",
      tiles: [
        { icon: TrendingUp, label: "Total Sales Today",    value: data.totalSales,    bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
        { icon: BarChart2,  label: "Transactions Handled", value: data.transactions,  bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400"  },
        { icon: Clock,      label: "Shift Hours",          value: data.shiftHours,    bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400"    },
        { icon: UserCheck,  label: "Avg. per Transaction", value: data.avgPerTxn,     bg: "bg-sky-500/10",     text: "text-sky-600 dark:text-sky-400"        },
      ],
    },
    Manager: {
      title: "Team Overview", sub: "Staff under your supervision today.",
      icon: Users, iconBg: "bg-blue-500/10", iconText: "text-blue-600 dark:text-blue-400",
      tiles: [
        { icon: Users,      label: "Staff Managed",    value: data.staffManaged,   bg: "bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400"    },
        { icon: UserCheck,  label: "Active Today",     value: data.activeToday,    bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
        { icon: TrendingUp, label: "Team Sales Total", value: data.teamSalesTotal, bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400" },
        { icon: BarChart2,  label: "Open Issues",      value: data.openIssues,     bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400"  },
      ],
    },
    Owner: {
      title: "Business Overview", sub: "High-level overview of your POS system.",
      icon: Briefcase, iconBg: "bg-red-500/10", iconText: "text-red-600 dark:text-red-400",
      tiles: [
        { icon: Store,      label: "Store Name",         value: data.storeName,     bg: "bg-red-500/10",     text: "text-red-600 dark:text-red-400"     },
        { icon: Users,      label: "Registered Users",   value: data.totalUsers,    bg: "bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400"   },
        { icon: BarChart2,  label: "Total Products",     value: data.totalProducts, bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400" },
        { icon: TrendingUp, label: "This Month Revenue", value: data.monthRevenue,  bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
      ],
    },
  };

  const s = sections[role];
  if (!s) return null;
  const TitleIcon = s.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg}`}>
          <TitleIcon className={`h-5 w-5 ${s.iconText}`} />
        </div>
        <div>
          <p className="text-base font-bold text-foreground">{s.title}</p>
          <p className="text-xs text-muted-foreground">{s.sub}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {s.tiles.map((t) => <StatTile key={t.label} {...t} />)}
      </div>
    </div>
  );
}

/* ── Password Field ───────────────────────────────────────────────────── */
function PwField({ id, label, value, onChange, show, onToggle, error, placeholder }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; show: boolean; onToggle: () => void;
  error?: string; placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border ${error ? "border-destructive focus:ring-destructive/40" : "border-input"} bg-background px-4 py-2.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-card`}
        />
        <button type="button" tabIndex={-1} onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}

/* ── Password Strength ────────────────────────────────────────────────── */
function getStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STR_LABEL = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const STR_BAR   = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];
const STR_TEXT  = ["text-red-600 dark:text-red-400", "text-orange-600 dark:text-orange-400", "text-amber-600 dark:text-amber-400", "text-lime-600 dark:text-lime-400", "text-emerald-600 dark:text-emerald-400"];

function PasswordStrength({ password }: { password: string }) {
  const s = getStrength(password);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < s ? STR_BAR[s] : "bg-muted"}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${STR_TEXT[s]}`}>{STR_LABEL[s]}</p>
    </div>
  );
}

/* ── Avatar Circle ────────────────────────────────────────────────────── */
function AvatarCircle({ name, role, size = "h-28 w-28 text-4xl" }: {
  name?: string; role?: string; size?: string;
}) {
  const initials = (name ?? "U").split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const grad = ROLE_GRAD[role ?? ""] ?? "from-zinc-400 to-zinc-600";
  return (
    <div className={`flex ${size} items-center justify-center rounded-full bg-gradient-to-br ${grad} font-extrabold text-white shadow-xl ring-4 ring-card`}>
      {initials}
    </div>
  );
}

/* ── Info Cell ────────────────────────────────────────────────────────── */
function InfoCell({ icon: Icon, label, children }: {
  icon?: React.ElementType; label: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col space-y-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground leading-snug">{children}</span>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   UserProfile Page
   ═════════════════════════════════════════════════════════════════════════ */
export default function UserProfile() {
  const { user } = useAuth();
  const email    = USER_EMAIL[user?.username] ?? "";

  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [popup,   setPopup]   = useState({ show: false, type: "success" as const, message: "" });

  function validate() {
    const e: Record<string, string> = {};
    if (!current.trim())                e.current = "Current password is required.";
    if (newPass.length < 6)             e.newPass  = "New password must be at least 6 characters.";
    if (newPass !== confirm)            e.confirm  = "Passwords do not match.";
    if (newPass === current && newPass)  e.newPass  = "New password must differ from current.";
    return e;
  }

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setLoading(true);
    try {
      await api.put("/api/users/change-password", {
        username:        user?.username,
        currentPassword: current,
        newPassword:     newPass,
      });
      setCurrent(""); setNewPass(""); setConfirm("");
      setPopup({ show: true, type: "success", message: "Password updated successfully!" });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? "Current password is incorrect.";
      setErrors({ current: msg });
    } finally {
      setLoading(false);
    }
  }

  const coverGrad = COVER_GRAD[user?.role ?? ""] ?? "from-blue-500 to-indigo-700";

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-12 space-y-6">

          {/* ── Page header ── */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">My Profile</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                View your details and change your password
              </p>
            </div>
          </div>

          {/* ══════════ Profile Hero Card ══════════ */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

            {/* Cover gradient */}
            <div className={`relative h-48 bg-gradient-to-r ${coverGrad}`}>
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 25% 60%, white 1px, transparent 1px), radial-gradient(circle at 75% 30%, white 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
            </div>

            {/* Avatar + identity */}
            <div className="relative z-10 px-8 pb-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14">
                <AvatarCircle name={user?.name} role={user?.role} />
                <div className="flex items-center gap-3 pb-1">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold border ${ROLE_BADGE[user?.role ?? ""] ?? ""}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${ROLE_DOT[user?.role ?? ""] ?? ""}`} />
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Name + subtitle */}
              <div className="mt-4">
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{user?.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  @{user?.username} &nbsp;&middot;&nbsp; {email}
                </p>
              </div>

              {/* Info grid */}
              <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 gap-10 sm:grid-cols-4">
                <InfoCell icon={User} label="Full Name">
                  {user?.name ?? ""}
                </InfoCell>
                <InfoCell icon={AtSign} label="Username">
                  <span className="font-mono">@{user?.username}</span>
                </InfoCell>
                <InfoCell icon={Mail} label="Email">
                  {email}
                </InfoCell>
                <InfoCell icon={ShieldCheck} label="Role">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${ROLE_BADGE[user?.role ?? ""] ?? ""}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${ROLE_DOT[user?.role ?? ""] ?? ""}`} />
                    {user?.role}
                  </span>
                </InfoCell>
              </div>

              <p className="mt-6 text-xs text-muted-foreground italic">
                Profile details can only be updated by an administrator.
              </p>
            </div>
          </div>

          {/* ══════════ Role Stats ══════════ */}
          <RoleSection role={user?.role} />

          {/* ══════════ Change Password ══════════ */}
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Change Password</p>
                <p className="text-xs text-muted-foreground">Choose a strong password — minimum 6 characters.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <PwField
                id="cur-pass" label="Current Password" placeholder="Enter your current password"
                value={current}
                onChange={(v) => { setCurrent(v); setErrors((e) => ({ ...e, current: undefined as any })); }}
                show={showCur} onToggle={() => setShowCur((v) => !v)} error={errors.current}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <PwField
                  id="new-pass" label="New Password" placeholder="Min. 6 characters"
                  value={newPass}
                  onChange={(v) => { setNewPass(v); setErrors((e) => ({ ...e, newPass: undefined as any })); }}
                  show={showNew} onToggle={() => setShowNew((v) => !v)} error={errors.newPass}
                />
                <PwField
                  id="con-pass" label="Confirm New Password" placeholder="Repeat new password"
                  value={confirm}
                  onChange={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: undefined as any })); }}
                  show={showCon} onToggle={() => setShowCon((v) => !v)} error={errors.confirm}
                />
              </div>

              {newPass.length > 0 && <PasswordStrength password={newPass} />}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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

        </div>
      </div>

      <SuccessPopup
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup((p) => ({ ...p, show: false }))}
      />
    </div>
  );
}
