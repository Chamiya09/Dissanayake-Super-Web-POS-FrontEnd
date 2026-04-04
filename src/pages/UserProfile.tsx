import { useState, useEffect } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useToast } from "@/context/GlobalToastContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axiosInstance";
import SuccessPopup from "@/components/ui/SuccessPopup";
import {
  User, AtSign, Mail, ShieldCheck, KeyRound,
  Eye, EyeOff, Save, Pencil, X, Clock, Calendar, Hash,
} from "lucide-react";

/* ── Role config ─────────────────────────────────────────────────────── */
const ROLE_CFG: Record<string, { badge: string; dot: string; grad: string }> = {
  Owner:   { badge: "bg-red-50 text-red-700 border-red-200",            dot: "bg-red-500",     grad: "from-red-400 to-red-600"       },
  Manager: { badge: "bg-blue-50 text-blue-700 border-blue-200",         dot: "bg-blue-500",    grad: "from-blue-400 to-indigo-600"   },
  Staff:   { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", grad: "from-emerald-400 to-teal-600"  },
};

/* ── Helpers ─────────────────────────────────────────────────────────── */
function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${fmtDate(iso)}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function jwtIat(token?: string): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.iat ? new Date(payload.iat * 1000).toISOString() : null;
  } catch { return null; }
}

function empId(id?: number | null): string {
  return id ? `EMP-${String(id).padStart(4, "0")}` : "—";
}

function getStrength(pw: string): number {
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STR_LABEL = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const STR_BAR   = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];
const STR_TEXT  = ["text-red-600", "text-orange-600", "text-amber-600", "text-lime-600", "text-emerald-600"];

/* ── Sub-components ──────────────────────────────────────────────────── */
function AvatarCircle({ name, role }: { name?: string; role?: string }) {
  const initials = (name ?? "U").split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const grad = ROLE_CFG[role ?? ""]?.grad ?? "from-slate-400 to-slate-600";
  return (
    <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${grad} text-3xl font-extrabold text-white shadow-xl ring-4 ring-white shrink-0`}>
      {initials}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const s = getStrength(password);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < s ? STR_BAR[s] : "bg-slate-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${STR_TEXT[s]}`}>{STR_LABEL[s]}</p>
    </div>
  );
}

function PwField({ id, label, value, onChange, show, onToggle, error, placeholder }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; show: boolean; onToggle: () => void;
  error?: string; placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <input
          id={id} type={show ? "text" : "password"} autoComplete="new-password"
          placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border ${error ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:ring-indigo-100"} bg-white px-4 py-2.5 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:border-indigo-400`}
        />
        <button type="button" tabIndex={-1} onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function ReadField({ icon: Icon, label, children }: {
  icon: React.ElementType; label: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Icon className="h-3 w-3" />{label}
      </span>
      <div className="text-sm font-semibold text-slate-900 leading-snug">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   UserProfile Page
   ═══════════════════════════════════════════════════════════════════════ */
export default function UserProfile() {
  const { user } = useAuth();

  const [profileId,       setProfileId]       = useState<number | null>(null);
  const [profileEmail,    setProfileEmail]     = useState("");
  const [profileFullName, setProfileFullName]  = useState(user?.name ?? "");
  const [createdAt,       setCreatedAt]        = useState<string | null>(null);

  const [editMode,   setEditMode]   = useState(false);
  const [editName,   setEditName]   = useState("");
  const [editEmail,  setEditEmail]  = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const [current,   setCurrent]   = useState("");
  const [newPass,   setNewPass]   = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showCon,   setShowCon]   = useState(false);
  const [pwErrors,  setPwErrors]  = useState<Record<string, string>>({});
  const [pwLoading, setPwLoading] = useState(false);

  const [popup, setPopup] = useState({ show: false, type: "success" as const, message: "" });

  const lastLogin = jwtIat((user as any)?.token);

  useEffect(() => {
    if (!user) return;
    api.get("/api/users").then((r) => {
      const me = (r.data as any[]).find((u: any) => u.username === user.username);
      if (me) {
        setProfileId(me.id ?? null);
        setProfileEmail(me.email ?? "");
        setProfileFullName(me.fullName ?? user.name ?? "");
        if (me.createdAt) setCreatedAt(me.createdAt);
      }
    }).catch(() => {});
  }, [user?.username]);

  function openEdit() {
    setEditName(profileFullName);
    setEditEmail(profileEmail);
    setEditErrors({});
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setEditErrors({});
  }

  async function saveEdit() {
    const errs: Record<string, string> = {};
    if (!editName.trim())  errs.name  = "Full name is required.";
    if (!editEmail.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) errs.email = "Enter a valid email address.";
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    if (!profileId) { setEditErrors({ name: "User ID not found. Please refresh." }); return; }

    setEditSaving(true);
    try {
      const { data }: any = await api.put(`/api/users/${profileId}`, {
        fullName: editName.trim(),
        email:    editEmail.trim(),
        role:     user?.role,
      });
      setProfileFullName(data.fullName ?? editName.trim());
      setProfileEmail(data.email ?? editEmail.trim());
      setEditMode(false);
      showToast("Profile updated successfully!", "success");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to update profile.";
      setEditErrors({ name: msg });
    } finally {
      setEditSaving(false);
    }
  }

  function validatePw() {
    const e: Record<string, string> = {};
    if (!current.trim())               e.current = "Current password is required.";
    if (newPass.length < 6)            e.newPass  = "New password must be at least 6 characters.";
    if (newPass !== confirm)           e.confirm  = "Passwords do not match.";
    if (newPass === current && newPass) e.newPass  = "New password must differ from current.";
    return e;
  }

  async function handleChangePw(evt: React.FormEvent) {
    evt.preventDefault();
    const e = validatePw();
    if (Object.keys(e).length) { setPwErrors(e); return; }
    setPwErrors({}); setPwLoading(true);
    try {
      await api.put("/api/users/change-password", {
        username: user?.username, currentPassword: current, newPassword: newPass,
      });
      setCurrent(""); setNewPass(""); setConfirm("");
      showToast("Password updated successfully!", "success");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? "Current password is incorrect.";
      setPwErrors({ current: msg });
    } finally {
      setPwLoading(false);
    }
  }

  const roleCfg = ROLE_CFG[user?.role ?? ""] ?? {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot:   "bg-slate-400",
    grad:  "from-slate-400 to-slate-600",
  };

  const displayName = profileFullName || user?.name || "";

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-12 space-y-6">

          {/* Page heading */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 shrink-0">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">My Profile</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage your personal information and account security
              </p>
            </div>
          </div>

          {/* Profile card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">

              {/* LEFT: Avatar panel */}
              <div className="flex flex-col items-center gap-5 bg-slate-50 px-8 py-10">
                <AvatarCircle name={displayName} role={user?.role} />

                <div className="text-center space-y-2">
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{displayName}</h2>
                  <p className="text-sm font-mono text-slate-500">@{user?.username}</p>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${roleCfg.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${roleCfg.dot}`} />
                    {user?.role}
                  </span>
                </div>

                {/* Last Login */}
                <div className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-center">
                  <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    <Clock className="h-3 w-3" /> Last Login
                  </p>
                  <p className="text-[12px] font-semibold text-slate-700 leading-snug">
                    {fmtDateTime(lastLogin)}
                  </p>
                </div>
              </div>

              {/* RIGHT: Details panel */}
              <div className="lg:col-span-2 px-8 py-8 space-y-6">

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Profile Details</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {editMode ? "Update your information below, then save." : "Your personal information on file."}
                    </p>
                  </div>
                  {!editMode ? (
                    <button
                      onClick={openEdit}
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={cancelEdit}
                        disabled={editSaving}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={editSaving}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {editSaving ? (
                          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                        ) : <Save className="h-3.5 w-3.5" />}
                        {editSaving ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Fields grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <User className="h-3 w-3" /> Full Name
                    </span>
                    {editMode ? (
                      <div>
                        <input
                          type="text" value={editName}
                          onChange={(e) => { setEditName(e.target.value); setEditErrors((v) => ({ ...v, name: "" })); }}
                          className={`w-full rounded-lg border ${editErrors.name ? "border-red-400" : "border-slate-200"} bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400`}
                          placeholder="Full name"
                        />
                        {editErrors.name && <p className="mt-1 text-xs text-red-600">{editErrors.name}</p>}
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-slate-900">{displayName || "—"}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <Mail className="h-3 w-3" /> Email Address
                    </span>
                    {editMode ? (
                      <div>
                        <input
                          type="email" value={editEmail}
                          onChange={(e) => { setEditEmail(e.target.value); setEditErrors((v) => ({ ...v, email: "" })); }}
                          className={`w-full rounded-lg border ${editErrors.email ? "border-red-400" : "border-slate-200"} bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400`}
                          placeholder="you@example.com"
                        />
                        {editErrors.email && <p className="mt-1 text-xs text-red-600">{editErrors.email}</p>}
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-slate-900">{profileEmail || "—"}</p>
                    )}
                  </div>

                  {/* Username */}
                  <ReadField icon={AtSign} label="Username">
                    <span className="font-mono">@{user?.username}</span>
                  </ReadField>

                  {/* Role */}
                  <ReadField icon={ShieldCheck} label="Role">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${roleCfg.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${roleCfg.dot}`} />
                      {user?.role}
                    </span>
                  </ReadField>

                  {/* Employee ID */}
                  <ReadField icon={Hash} label="Employee ID">
                    <span className="font-mono text-slate-700">{empId(profileId)}</span>
                  </ReadField>

                  {/* Joined Date */}
                  <ReadField icon={Calendar} label="Joined Date">
                    {fmtDate(createdAt)}
                  </ReadField>

                </div>

                {!editMode && (
                  <p className="text-[11px] text-slate-400 italic">
                    Click "Edit Profile" to modify your name or email. Username and role can only be changed by an administrator.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Security — Change Password */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
            <div className="flex items-center gap-3 mb-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shrink-0">
                <KeyRound className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Security</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your password. Choose a strong password — minimum 6 characters.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePw} className="space-y-5">
              <PwField
                id="cur-pass" label="Current Password" placeholder="Enter your current password"
                value={current}
                onChange={(v) => { setCurrent(v); setPwErrors((e) => ({ ...e, current: "" })); }}
                show={showCur} onToggle={() => setShowCur((v) => !v)} error={pwErrors.current}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <PwField
                  id="new-pass" label="New Password" placeholder="Min. 6 characters"
                  value={newPass}
                  onChange={(v) => { setNewPass(v); setPwErrors((e) => ({ ...e, newPass: "" })); }}
                  show={showNew} onToggle={() => setShowNew((v) => !v)} error={pwErrors.newPass}
                />
                <PwField
                  id="con-pass" label="Confirm New Password" placeholder="Repeat new password"
                  value={confirm}
                  onChange={(v) => { setConfirm(v); setPwErrors((e) => ({ ...e, confirm: "" })); }}
                  show={showCon} onToggle={() => setShowCon((v) => !v)} error={pwErrors.confirm}
                />
              </div>

              {newPass.length > 0 && <PasswordStrength password={newPass} />}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pwLoading ? (
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
      </main>

      
    </div>
  );
}
