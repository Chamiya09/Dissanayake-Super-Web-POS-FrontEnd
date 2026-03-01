import { useState } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Users, Plus, Search, UserCircle2, ShieldAlert } from "lucide-react";
import AddUserModal from "@/components/Users/AddUserModal";

/* ─────────────────────────────────────────────────────────────────────────
   Role-based permission config
   ───────────────────────────────────────────────────────────────────────── */
const CAN_ADD_USERS = ["Owner", "Manager"]; // Staff cannot add users

const ROLE_SWITCHER_STYLES = {
  Owner:   "border-red-300   bg-red-50   text-red-700   dark:border-red-800  dark:bg-red-900/20  dark:text-red-400",
  Manager: "border-blue-300  bg-blue-50  text-blue-700  dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  Staff:   "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400",
};
const ROLE_DOT_SWITCHER = { Owner: "bg-red-500", Manager: "bg-blue-500", Staff: "bg-green-500" };
const SIMULATE_ROLES = ["Owner", "Manager", "Staff"];

/* ─────────────────────────────────────────────────────────────────────────
   Mock Data
   ───────────────────────────────────────────────────────────────────────── */
const INITIAL_USERS = [
  { id: 1, fullName: "Nuwan Dissanayake", username: "nuwan_d",   role: "Owner",   email: "nuwan@dissanayake.lk"   },
  { id: 2, fullName: "Kamala Perera",     username: "kamala_p",  role: "Manager", email: "kamala@dissanayake.lk"  },
  { id: 3, fullName: "Sachini Fernando",  username: "sachini_f", role: "Staff",   email: "sachini@dissanayake.lk" },
  { id: 4, fullName: "Thilina Bandara",   username: "thilina_b", role: "Staff",   email: "thilina@dissanayake.lk" },
  { id: 5, fullName: "Manjula Silva",     username: "manjula_s", role: "Manager", email: "manjula@dissanayake.lk" },
  { id: 6, fullName: "Ruvini Jayawardena",username: "ruvini_j",  role: "Staff",   email: "ruvini@dissanayake.lk"  },
];

/* ─────────────────────────────────────────────────────────────────────────
   Role badge colours
   ───────────────────────────────────────────────────────────────────────── */
const ROLE_STYLES = {
  Owner:   "bg-red-100   text-red-700   border-red-200   dark:bg-red-900/20   dark:text-red-400   dark:border-red-800",
  Manager: "bg-blue-100  text-blue-700  border-blue-200  dark:bg-blue-900/20  dark:text-blue-400  dark:border-blue-800",
  Staff:   "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
};

const ROLE_DOT = {
  Owner:   "bg-red-500",
  Manager: "bg-blue-500",
  Staff:   "bg-green-500",
};

function RoleBadge({ role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        ROLE_STYLES[role]
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", ROLE_DOT[role])} />
      {role}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Avatar initials helper
   ───────────────────────────────────────────────────────────────────────── */
const AVATAR_COLOURS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-teal-100 text-teal-700",
  "bg-pink-100 text-pink-700",
  "bg-orange-100 text-orange-700",
];

function Avatar({ fullName, index }) {
  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const colour = AVATAR_COLOURS[index % AVATAR_COLOURS.length];
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
        colour
      )}
    >
      {initials}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Empty State
   ───────────────────────────────────────────────────────────────────────── */
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-3">
      <UserCircle2 className="h-12 w-12 opacity-25" />
      <p className="text-base font-medium text-foreground">No users found</p>
      <p className="text-sm">Try adjusting your search or add a new user.</p>
      <Button size="sm" className="mt-2 gap-2" onClick={onAdd}>
        <Plus className="h-4 w-4" /> Add User
      </Button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   UserManagement page
   ───────────────────────────────────────────────────────────────────────── */
export default function UserManagement() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isAddOpen, setIsAddOpen] = useState(false);

  /* ── Simulated logged-in role (toggle for demo) ── */
  const [currentUserRole, setCurrentUserRole] = useState("Owner");
  const canAddUsers = CAN_ADD_USERS.includes(currentUserRole);

  /* ── Filtering ── */
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAdd = (newUser) =>
    setUsers((prev) => [newUser, ...prev]);

  const ROLE_FILTERS = ["All", "Owner", "Manager", "Staff"];

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ── Role simulator banner ── */}
        <div className="border-b border-border bg-muted/30 px-6 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Simulating role:
            </span>
            {SIMULATE_ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setCurrentUserRole(r)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                  currentUserRole === r
                    ? ROLE_SWITCHER_STYLES[r] + " ring-2 ring-offset-1 ring-current"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  currentUserRole === r ? ROLE_DOT_SWITCHER[r] : "bg-muted-foreground"
                )} />
                {r}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-muted-foreground">
              {currentUserRole === "Owner" && "Can create → Manager accounts"}
              {currentUserRole === "Manager" && "Can create → Staff accounts"}
              {currentUserRole === "Staff" && "Cannot create accounts"}
            </span>
          </div>
        </div>

        {/* ── Page header ── */}}
        <div className="border-b border-border bg-background px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">User Management</h1>
                <p className="text-xs text-muted-foreground">
                  {users.length} user{users.length !== 1 ? "s" : ""} registered
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-56 pl-8 text-sm"
                />
              </div>

              {/* Role filter pills */}
              <div className="flex gap-1">
                {ROLE_FILTERS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors",
                      roleFilter === r
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Add User — hidden for Staff */}
              {canAddUsers ? (
                <Button size="sm" className="gap-2" onClick={() => setIsAddOpen(true)}>
                  <Plus className="h-4 w-4" /> Add User
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-[11px] font-semibold text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  No permission to add users
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {filtered.length === 0 ? (
            <EmptyState onAdd={() => setIsAddOpen(true)} />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                {/* Head */}
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-8">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Role
                    </th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody className="divide-y divide-border bg-background">
                  {filtered.map((user, idx) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      {/* Row number */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {idx + 1}
                      </td>

                      {/* Full Name + Avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar fullName={user.fullName} index={users.indexOf(user)} />
                          <span className="font-medium text-foreground">{user.fullName}</span>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        @{user.username}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.email}
                      </td>

                      {/* Role badge */}
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Table footer */}
              <div className="border-t border-border bg-muted/30 px-4 py-2.5">
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
                  <span className="font-semibold text-foreground">{users.length}</span> users
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {isAddOpen && (
        <AddUserModal
          onClose={() => setIsAddOpen(false)}
          onAdd={handleAdd}
          currentUserRole={currentUserRole}
        />
      )}
    </div>
  );
}
