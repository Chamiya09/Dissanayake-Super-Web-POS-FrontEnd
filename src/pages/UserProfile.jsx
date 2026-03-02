import { useState } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useAuth } from "@/context/AuthContext";
import SuccessPopup from "@/components/ui/SuccessPopup";
import {
  User, AtSign, Mail, ShieldCheck, KeyRound,
  Eye, EyeOff, Save,
  TrendingUp, Clock, Users, Store, BarChart2, UserCheck, Briefcase,
  CalendarDays, Building2,
} from "lucide-react";

/*  Role colours  */
const ROLE_BADGE = {
  Owner:   "bg-red-100   text-red-700   border border-red-200",
  Manager: "bg-blue-100  text-blue-700  border border-blue-200",
  Staff:   "bg-green-100 text-green-700 border border-green-200",
};
const ROLE_DOT  = { Owner: "bg-red-500",   Manager: "bg-blue-500",  Staff: "bg-green-500"  };
const ROLE_GRAD = { Owner: "from-red-400 to-red-600", Manager: "from-blue-400 to-blue-600", Staff: "from-green-400 to-green-600" };
const COVER_GRAD = {
  Owner:   "from-red-500   to-rose-700",
  Manager: "from-blue-500  to-indigo-700",
  Staff:   "from-green-500 to-teal-700",
};

/*  Email lookup  */
const USER_EMAIL = {
  admin:    "nuwan@dissanayake.lk",
  manager1: "kamala@dissanayake.lk",
  staff1:   "sachini@dissanayake.lk",
};

/*  Simulated password API  */
async function apiUpdatePassword(username, currentPassword, newPassword) {
  await new Promise((r) => setTimeout(r, 800));
  if (!currentPassword.trim()) throw new Error("Current password is incorrect.");
  return { success: true };
}

/*  Role stats data  */
const ROLE_DATA = {
  Staff:   { totalSales: "LKR 24,850.00", transactions: 17, shiftHours: "6h 32m", avgPerTxn: "LKR 1,461.76" },
  Manager: { staffManaged: 4, activeToday: 3, teamSalesTotal: "LKR 128,400.00", openIssues: 2 },
  Owner:   { storeName: "Dissanayaka Super", totalUsers: 6, totalProducts: 124, monthRevenue: "LKR 1,284,750.00" },
};

/*  Stat tile  */
function StatTile({ icon: Icon, label, value, bg, text }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`h-4 w-4 ${text}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
        <p className="text-lg font-bold text-gray-900 tabular-nums leading-snug">{value}</p>
      </div>
    </div>
  );
}

/*  Role section  */
function RoleSection({ role }) {
  const data = ROLE_DATA[role];
  if (!data) return null;

  const sections = {
    Staff: {
      title: "Performance Summary", sub: "Your activity stats for today's shift.",
      icon: BarChart2, iconBg: "bg-green-100", iconText: "text-green-600",
      tiles: [
        { icon: TrendingUp, label: "Total Sales Today",    value: data.totalSales,    bg: "bg-green-100",  text: "text-green-600"  },
        { icon: BarChart2,  label: "Transactions Handled", value: data.transactions,  bg: "bg-violet-100", text: "text-violet-600" },
        { icon: Clock,      label: "Shift Hours",          value: data.shiftHours,    bg: "bg-amber-100",  text: "text-amber-600"  },
        { icon: UserCheck,  label: "Avg. per Transaction", value: data.avgPerTxn,     bg: "bg-sky-100",    text: "text-sky-600"    },
      ],
    },
    Manager: {
      title: "Team Overview", sub: "Staff under your supervision today.",
      icon: Users, iconBg: "bg-blue-100", iconText: "text-blue-600",
      tiles: [
        { icon: Users,      label: "Staff Managed",    value: data.staffManaged,   bg: "bg-blue-100",   text: "text-blue-600"   },
        { icon: UserCheck,  label: "Active Today",     value: data.activeToday,    bg: "bg-green-100",  text: "text-green-600"  },
        { icon: TrendingUp, label: "Team Sales Total", value: data.teamSalesTotal, bg: "bg-violet-100", text: "text-violet-600" },
        { icon: BarChart2,  label: "Open Issues",      value: data.openIssues,     bg: "bg-amber-100",  text: "text-amber-600"  },
      ],
    },
    Owner: {
      title: "Business Overview", sub: "High-level overview of your POS system.",
      icon: Briefcase, iconBg: "bg-red-100", iconText: "text-red-600",
      tiles: [
        { icon: Store,      label: "Store Name",         value: data.storeName,     bg: "bg-red-100",     text: "text-red-600"     },
        { icon: Users,      label: "Registered Users",   value: data.totalUsers,    bg: "bg-blue-100",    text: "text-blue-600"    },
        { icon: BarChart2,  label: "Total Products",     value: data.totalProducts, bg: "bg-violet-100",  text: "text-violet-600"  },
        { icon: TrendingUp, label: "This Month Revenue", value: data.monthRevenue,  bg: "bg-emerald-100", text: "text-emerald-600" },
      ],
    },
  };

  const s = sections[role];
  const TitleIcon = s.icon;

  return (
    <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg}`}>
          <TitleIcon className={`h-5 w-5 ${s.iconText}`} />
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">{s.title}</p>
          <p className="text-xs text-gray-500">{s.sub}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {s.tiles.map((t) => <StatTile key={t.label} {...t} />)}
      </div>
    </div>
  );
}

/*  Password field  */
function PwField({ id, label, value, onChange, show, onToggle, error, placeholder }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <input
          id={id} type={show ? "text" : "password"} autoComplete="new-password"
          placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-3 pr-12 rounded-lg border ${error ? "border-red-400 focus:ring-red-300" : "border-gray-300"} focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900 placeholder:text-gray-400 transition-shadow bg-white`}
        />
        <button type="button" tabIndex={-1} onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

/*  Password strength  */
function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STR_LABEL = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const STR_BAR   = ["bg-red-500","bg-orange-500","bg-amber-500","bg-lime-500","bg-emerald-500"];
const STR_TEXT  = ["text-red-600","text-orange-600","text-amber-600","text-lime-600","text-emerald-600"];

function PasswordStrength({ password }) {
  const s = getStrength(password);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < s ? STR_BAR[s] : "bg-gray-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${STR_TEXT[s]}`}>{STR_LABEL[s]}</p>
    </div>
  );
}

/*  Avatar circle  */
function AvatarCircle({ name, role, size = "h-28 w-28 text-4xl" }) {
  const initials = (name ?? "U").split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const grad = ROLE_GRAD[role] ?? "from-zinc-400 to-zinc-600";
  return (
    <div className={`flex ${size} items-center justify-center rounded-full bg-gradient-to-br ${grad} font-extrabold text-white shadow-xl ring-4 ring-white`}>
      {initials}
    </div>
  );
}

/*  Info cell (label above value)  */
function InfoCell({ icon: Icon, label, children }) {
  return (
    <div className="flex flex-col space-y-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="text-sm font-semibold text-gray-900 leading-snug">{children}</span>
    </div>
  );
}

/* 
   UserProfile page
    */
export default function UserProfile() {
  const { user } = useAuth();
  const email    = USER_EMAIL[user?.username] ?? "";

  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [popup,   setPopup]   = useState({ show: false, type: "success", message: "" });

  function validate() {
    const e = {};
    if (!current.trim())                e.current = "Current password is required.";
    if (newPass.length < 6)             e.newPass = "New password must be at least 6 characters.";
    if (newPass !== confirm)            e.confirm = "Passwords do not match.";
    if (newPass === current && newPass) e.newPass = "New password must differ from current.";
    return e;
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setLoading(true);
    try {
      await apiUpdatePassword(user.username, current, newPass);
      setCurrent(""); setNewPass(""); setConfirm("");
      setPopup({ show: true, type: "success", message: "Password updated successfully!" });
    } catch (err) {
      setErrors({ current: err.message });
    } finally {
      setLoading(false);
    }
  }

  const coverGrad = COVER_GRAD[user?.role] ?? "from-blue-500 to-indigo-700";

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <AppHeader />

      <div className="flex-1 overflow-y-auto py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-12 space-y-6">

          {/*  Profile Hero Card  */}
          <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">

            {/* Cover photo */}
            <div className={`relative h-48 bg-gradient-to-r ${coverGrad}`}>
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle at 25% 60%, white 1px, transparent 1px), radial-gradient(circle at 75% 30%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            </div>

            {/* Avatar + identity  overlaps cover */}
            <div className="px-8 pb-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14">

                {/* Avatar (overlaps cover) */}
                <AvatarCircle name={user?.name} role={user?.role} />

                {/* Role pill  sits at same level on desktop */}
                <div className="flex items-center gap-3 pb-1">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold border ${ROLE_BADGE[user?.role]}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${ROLE_DOT[user?.role]}`} />
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Name + subtitle */}
              <div className="mt-4">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{user?.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">@{user?.username}  {email}</p>
              </div>

              {/*  Info grid  label ABOVE value  */}
              <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 gap-10 sm:grid-cols-4">
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
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${ROLE_BADGE[user?.role]}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${ROLE_DOT[user?.role]}`} />
                    {user?.role}
                  </span>
                </InfoCell>
              </div>

              {/* Admin note */}
              <p className="mt-6 text-xs text-gray-400 italic">
                Profile details can only be updated by an administrator.
              </p>
            </div>
          </div>

          {/*  Role stats  */}
          <RoleSection role={user?.role} />

          {/*  Change Password  */}
          <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <KeyRound className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Change Password</p>
                <p className="text-xs text-gray-500">Choose a strong password  minimum 6 characters.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <PwField id="cur-pass" label="Current Password" placeholder="Enter your current password"
                value={current} onChange={(v) => { setCurrent(v); setErrors((e) => ({ ...e, current: undefined })); }}
                show={showCur} onToggle={() => setShowCur((v) => !v)} error={errors.current} />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <PwField id="new-pass" label="New Password" placeholder="Min. 6 characters"
                  value={newPass} onChange={(v) => { setNewPass(v); setErrors((e) => ({ ...e, newPass: undefined })); }}
                  show={showNew} onToggle={() => setShowNew((v) => !v)} error={errors.newPass} />
                <PwField id="con-pass" label="Confirm New Password" placeholder="Repeat new password"
                  value={confirm} onChange={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: undefined })); }}
                  show={showCon} onToggle={() => setShowCon((v) => !v)} error={errors.confirm} />
              </div>

              {newPass.length > 0 && <PasswordStrength password={newPass} />}

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading}
                  className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Updating
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
