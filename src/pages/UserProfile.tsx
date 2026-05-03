import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useToast } from "@/context/GlobalToastContext";
import { LS_KEY, useAuth } from "@/context/AuthContext";
import api from "@/lib/axiosInstance";
import {
  User,
  AtSign,
  Mail,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Pencil,
  X,
  Clock3,
  CalendarDays,
  Hash,
  Phone,
  MapPin,
  Sparkles,
  Shield,
  BriefcaseBusiness,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_THEME: Record<
  string,
  {
    badge: string;
    dot: string;
    avatar: string;
    hero: string;
    iconWrap: string;
    panelTint: string;
    title: string;
    subtitle: string;
    highlightLabel: string;
    highlightValue: string;
  }
> = {
  Owner: {
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
    avatar: "from-rose-500 via-red-500 to-orange-500",
    hero: "from-red-50 via-white to-orange-50",
    iconWrap: "bg-red-100 text-red-700",
    panelTint: "border-red-100 bg-red-50/60",
    title: "Owner Profile",
    subtitle: "Oversee the full platform, business controls, and strategic account settings.",
    highlightLabel: "Access Level",
    highlightValue: "Full System Control",
  },
  Manager: {
    badge: "border-cyan-200 bg-cyan-50 text-cyan-700",
    dot: "bg-cyan-500",
    avatar: "from-cyan-500 via-sky-500 to-indigo-500",
    hero: "from-cyan-50 via-white to-sky-50",
    iconWrap: "bg-cyan-100 text-cyan-700",
    panelTint: "border-cyan-100 bg-cyan-50/60",
    title: "Manager Profile",
    subtitle: "Manage day-to-day operations, team workflows, and store performance with confidence.",
    highlightLabel: "Focus Area",
    highlightValue: "Operations & Team",
  },
  Staff: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    avatar: "from-emerald-500 via-teal-500 to-cyan-500",
    hero: "from-emerald-50 via-white to-teal-50",
    iconWrap: "bg-emerald-100 text-emerald-700",
    panelTint: "border-emerald-100 bg-emerald-50/70",
    title: "Staff Profile",
    subtitle: "Keep your account details current so daily checkout and store work stays friction-free.",
    highlightLabel: "Primary Role",
    highlightValue: "Frontline Operations",
  },
};

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
  } catch {
    return null;
  }
}

function empId(id?: number | null): string {
  return id ? `EMP-${String(id).padStart(4, "0")}` : "—";
}

function getStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_LABEL = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_BAR = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];
const STRENGTH_TEXT = ["text-red-600", "text-orange-600", "text-amber-600", "text-lime-600", "text-emerald-600"];

function AvatarCircle({ name, role }: { name?: string; role?: string }) {
  const initials = (name ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const theme = ROLE_THEME[role ?? ""] ?? ROLE_THEME.Staff;

  return (
    <div className="relative">
      <div className={cn("absolute inset-0 rounded-[28px] blur-xl opacity-35", theme.panelTint)} />
      <div className={cn("relative flex h-28 w-28 items-center justify-center rounded-[28px] bg-gradient-to-br text-3xl font-black text-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.45)] ring-4 ring-white", theme.avatar)}>
        {initials}
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={cn("flex h-full flex-col rounded-2xl border px-4 py-3", tone)}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function ReadField({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col justify-between space-y-2 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <div className="text-sm font-semibold leading-snug text-slate-900">{children}</div>
    </div>
  );
}

function EditableField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  textarea = false,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  error?: string;
  textarea?: boolean;
}) {
  const baseClass = cn(
    "w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition",
    error
      ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
      : "border-slate-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-100",
  );

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </label>
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = getStrength(password);

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn("h-2 flex-1 rounded-full transition-all duration-300", index < score ? STRENGTH_BAR[score] : "bg-slate-200")}
          />
        ))}
      </div>
      <p className={cn("text-xs font-semibold", STRENGTH_TEXT[score])}>{STRENGTH_LABEL[score]}</p>
    </div>
  );
}

function PwField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  error,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-[13px] font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full rounded-2xl border bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition",
            error
              ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
              : "border-slate-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-100",
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export default function UserProfile() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [profileId, setProfileId] = useState<number | null>(null);
  const [profileMemberId, setProfileMemberId] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileFullName, setProfileFullName] = useState(user?.name ?? "");
  const [profilePhoneNumber, setProfilePhoneNumber] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwLoading, setPwLoading] = useState(false);

  const lastLogin = jwtIat((user as any)?.token);
  const theme = ROLE_THEME[user?.role ?? ""] ?? ROLE_THEME.Staff;
  const displayName = profileFullName || user?.name || "";

  const roleSummary = useMemo(() => {
    if (user?.role === "Owner") {
      return [
        { icon: Shield, label: "Security Scope", value: "Admin-level access", tone: "border-red-100 bg-red-50/70 text-red-700" },
        { icon: BriefcaseBusiness, label: "Responsibility", value: "Business oversight", tone: "border-orange-100 bg-orange-50/70 text-orange-700" },
      ];
    }
    if (user?.role === "Manager") {
      return [
        { icon: BriefcaseBusiness, label: "Responsibility", value: "Store coordination", tone: "border-cyan-100 bg-cyan-50/70 text-cyan-700" },
        { icon: CheckCircle2, label: "Team Access", value: "Operational control", tone: "border-sky-100 bg-sky-50/70 text-sky-700" },
      ];
    }
    return [
      { icon: CheckCircle2, label: "Work Mode", value: "Daily POS workflow", tone: "border-emerald-100 bg-emerald-50/70 text-emerald-700" },
      { icon: Shield, label: "Account Type", value: "Store staff access", tone: "border-teal-100 bg-teal-50/70 text-teal-700" },
    ];
  }, [user?.role]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/api/users/profile")
      .then((response) => {
        const me = response.data as any;
        setProfileId(me.id ?? null);
        setProfileMemberId(me.memberId ?? "");
        setProfileEmail(me.email ?? "");
        setProfileFullName(me.fullName ?? user.name ?? "");
        setProfilePhoneNumber(me.phoneNumber ?? "");
        setProfileAddress(me.address ?? "");
        if (me.createdAt) setCreatedAt(me.createdAt);
      })
      .catch(() => {});
  }, [user?.username]);

  function openEdit() {
    setEditName(profileFullName);
    setEditEmail(profileEmail);
    setEditPhoneNumber(profilePhoneNumber);
    setEditAddress(profileAddress);
    setEditErrors({});
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setEditErrors({});
  }

  async function saveEdit() {
    const errors: Record<string, string> = {};
    if (!editName.trim()) errors.name = "Full name is required.";
    if (Object.keys(errors).length) {
      setEditErrors(errors);
      return;
    }

    setEditSaving(true);
    try {
      const raw = localStorage.getItem(LS_KEY);
      const token = raw ? (JSON.parse(raw) as any)?.token : null;

      const { data }: any = await api.put(
        "/api/users/profile",
        {
          fullName: editName.trim(),
          phoneNumber: editPhoneNumber.trim(),
          address: editAddress.trim(),
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      setProfileFullName(data.fullName ?? editName.trim());
      setProfileEmail(data.email ?? profileEmail);
      setProfilePhoneNumber(data.phoneNumber ?? editPhoneNumber.trim());
      setProfileAddress(data.address ?? editAddress.trim());
      setEditMode(false);
      showToast("Profile updated successfully!", "success");
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Failed to update profile.";
      setEditErrors({ name: message });
    } finally {
      setEditSaving(false);
    }
  }

  function validatePw() {
    const errors: Record<string, string> = {};
    if (!current.trim()) errors.current = "Current password is required.";
    if (newPass.length < 6) errors.newPass = "New password must be at least 6 characters.";
    if (newPass !== confirm) errors.confirm = "Passwords do not match.";
    if (newPass === current && newPass) errors.newPass = "New password must differ from current.";
    return errors;
  }

  async function handleChangePw(event: React.FormEvent) {
    event.preventDefault();
    const errors = validatePw();
    if (Object.keys(errors).length) {
      setPwErrors(errors);
      return;
    }

    setPwErrors({});
    setPwLoading(true);
    try {
      await api.put("/api/users/change-password", {
        username: user?.username,
        currentPassword: current,
        newPassword: newPass,
      });
      setCurrent("");
      setNewPass("");
      setConfirm("");
      showToast("Password updated successfully!", "success");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.detail ??
        "Current password is incorrect.";
      setPwErrors({ current: message });
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <AppHeader />

      <main className="flex-1 overflow-y-auto py-8">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
          <section className={cn("overflow-hidden rounded-2xl border border-gray-100 bg-white p-0 shadow-sm", theme.hero)}>
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="px-6 py-7 sm:px-8">
                <div className="flex flex-col items-start gap-4 sm:flex-row">
                  <AvatarCircle name={displayName} role={user?.role} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]", theme.badge)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", theme.dot)} />
                        {theme.title}
                      </span>
                      {user?.role === "Staff" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                          <Sparkles className="h-3 w-3" />
                          {profileMemberId ? "Active Store Account" : "Account Ready"}
                        </span>
                      )}
                    </div>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{displayName || "My Profile"}</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{theme.subtitle}</p>

                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3.5 py-2 shadow-sm">
                        <AtSign className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold text-slate-800">@{user?.username}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3.5 py-2 shadow-sm">
                        <Hash className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold text-slate-800">{profileMemberId || empId(profileId)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {roleSummary.map((item) => (
                    <StatPill
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      tone={item.tone}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 bg-white/80 px-6 py-7 backdrop-blur-sm sm:px-8 lg:border-l lg:border-t-0">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Account Snapshot</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Profile at a glance</h2>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <ReadField icon={Clock3} label="Last Login">
                    {fmtDateTime(lastLogin)}
                  </ReadField>
                  <ReadField icon={CalendarDays} label="Joined Date">
                    {fmtDate(createdAt)}
                  </ReadField>
                  <ReadField icon={ShieldCheck} label="Role">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", theme.badge)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", theme.dot)} />
                      {user?.role}
                    </span>
                  </ReadField>
                  <ReadField icon={Sparkles} label={theme.highlightLabel}>
                    {theme.highlightValue}
                  </ReadField>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", theme.iconWrap)}>
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Profile Details</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {editMode ? "Update your personal details below and save when you are ready." : "Your personal information and staff account details."}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                {editMode ? (
                  <>
                    <EditableField
                      label="Full Name"
                      icon={User}
                      value={editName}
                      onChange={(value) => {
                        setEditName(value);
                        setEditErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      placeholder="Full name"
                      error={editErrors.name}
                    />
                    <ReadField icon={Mail} label="Email Address">
                      {profileEmail || "—"}
                    </ReadField>
                    <ReadField icon={AtSign} label="Username">
                      <span className="font-mono">@{user?.username}</span>
                    </ReadField>
                    <ReadField icon={ShieldCheck} label="Role">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", theme.badge)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", theme.dot)} />
                        {user?.role}
                      </span>
                    </ReadField>
                    <ReadField icon={Hash} label="Employee ID">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs font-semibold text-slate-700">
                        {profileMemberId || empId(profileId)}
                      </span>
                    </ReadField>
                    <EditableField
                      label="Phone Number"
                      icon={Phone}
                      value={editPhoneNumber}
                      onChange={setEditPhoneNumber}
                      placeholder="e.g. +94 77 123 4567"
                    />
                    <div className="md:col-span-2">
                      <EditableField
                        label="Address"
                        icon={MapPin}
                        value={editAddress}
                        onChange={setEditAddress}
                        placeholder="Enter address"
                        textarea
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <ReadField icon={User} label="Full Name">
                      {displayName || "—"}
                    </ReadField>
                    <ReadField icon={Mail} label="Email Address">
                      {profileEmail || "—"}
                    </ReadField>
                    <ReadField icon={AtSign} label="Username">
                      <span className="font-mono">@{user?.username}</span>
                    </ReadField>
                    <ReadField icon={ShieldCheck} label="Role">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", theme.badge)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", theme.dot)} />
                        {user?.role}
                      </span>
                    </ReadField>
                    <ReadField icon={Hash} label="Employee ID">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs font-semibold text-slate-700">
                        {profileMemberId || empId(profileId)}
                      </span>
                    </ReadField>
                    <ReadField icon={Phone} label="Phone Number">
                      {profilePhoneNumber || "—"}
                    </ReadField>
                    <div className="md:col-span-2">
                      <ReadField icon={MapPin} label="Address">
                        {profileAddress || "—"}
                      </ReadField>
                    </div>
                  </>
                )}
              </div>

              {!editMode && (
                <p className="mt-5 text-[12px] italic text-slate-500">
                  You can update your personal details here. Username, email, member ID, and role remain controlled by administration.
                </p>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                {!editMode ? (
                  <button
                    onClick={openEdit}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 active:scale-[0.98]"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={cancelEdit}
                      disabled={editSaving}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={editSaving}
                      className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {editSaving ? "Saving..." : "Save"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", theme.iconWrap)}>
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Security</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Keep your account protected with a strong password and regular updates.
                  </p>
                </div>
              </div>

              <div className={cn("mt-5 rounded-2xl border px-4 py-3", theme.panelTint)}>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Security Note</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Use a password with at least 6 characters. Adding uppercase letters, numbers, and symbols improves protection.
                </p>
              </div>

              <form onSubmit={handleChangePw} className="mt-6 space-y-5">
                <PwField
                  id="cur-pass"
                  label="Current Password"
                  placeholder="Enter your current password"
                  value={current}
                  onChange={(value) => {
                    setCurrent(value);
                    setPwErrors((prev) => ({ ...prev, current: "" }));
                  }}
                  show={showCur}
                  onToggle={() => setShowCur((prev) => !prev)}
                  error={pwErrors.current}
                />

                <div className="grid gap-4">
                  <PwField
                    id="new-pass"
                    label="New Password"
                    placeholder="Minimum 6 characters"
                    value={newPass}
                    onChange={(value) => {
                      setNewPass(value);
                      setPwErrors((prev) => ({ ...prev, newPass: "" }));
                    }}
                    show={showNew}
                    onToggle={() => setShowNew((prev) => !prev)}
                    error={pwErrors.newPass}
                  />
                  <PwField
                    id="con-pass"
                    label="Confirm New Password"
                    placeholder="Repeat new password"
                    value={confirm}
                    onChange={(value) => {
                      setConfirm(value);
                      setPwErrors((prev) => ({ ...prev, confirm: "" }));
                    }}
                    show={showCon}
                    onToggle={() => setShowCon((prev) => !prev)}
                    error={pwErrors.confirm}
                  />
                </div>

                {newPass.length > 0 && <PasswordStrength password={newPass} />}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {pwLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
