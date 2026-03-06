import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Users, Search, UserCircle2, ShieldAlert, Edit3, Trash2, Lock, UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axiosInstance";
import AddUserModal from "@/components/Users/AddUserModal";
import EditUserModal from "@/components/Users/EditUserModal";
import DeleteUserModal from "@/components/Users/DeleteUserModal";
import SuccessPopup from "@/components/ui/SuccessPopup";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Role-based permission config
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const CAN_ADD_USERS = ["Owner", "Manager"]; // Staff cannot add users

/* Which roles can each logged-in role edit or delete */
const MANAGEABLE_ROLES = {
  Owner:   ["Manager", "Staff"],
  Manager: ["Staff"],
  Staff:   [],
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Role badge colours
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Avatar initials helper
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Empty State
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-3">
      <UserCircle2 className="h-12 w-12 opacity-25" />
      <p className="text-base font-medium text-foreground">No users found</p>
      <p className="text-sm">Try adjusting your search or add a new user.</p>
      <Button size="sm" className="mt-2 gap-2" onClick={onAdd}>
        <UserPlus className="h-4 w-4" /> Add User
      </Button>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   UserManagement page
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function UserManagement() {
  const { user } = useAuth();
  const currentUserRole = user?.role ?? "Staff";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [popup, setPopup] = useState({ show: false, type: "success", message: "" });

  const canAddUsers = CAN_ADD_USERS.includes(currentUserRole);

  /* â”€â”€ Permission helpers â”€â”€ */
  const canManage = (targetUser) =>
    targetUser.username !== "admin" &&
    (MANAGEABLE_ROLES[currentUserRole] ?? []).includes(targetUser.role);

  const showPopup = (type, message) =>
    setPopup({ show: true, type, message });

  /* â”€â”€ Fetch users from API â”€â”€ */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/users");
      setUsers(data);
    } catch (err) {
      showPopup("error", err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* â”€â”€ Filtering â”€â”€ */
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  /* â”€â”€ CRUD handlers â”€â”€ */
  const handleAdd = async (formData) => {
    try {
      const { data: created } = await api.post("/api/users", {
        fullName: formData.fullName,
        username: formData.username,
        email:    formData.email,
        role:     formData.role,
        password: formData.password,
      });
      setUsers((prev) => [created, ...prev]);
      showPopup("success", `${created.fullName} has been added successfully!`);
    } catch (err) {
      showPopup("error", err.response?.data?.message || "Failed to add user.");
    }
  };

  const handleEdit = async (updated) => {
    try {
      const { data: saved } = await api.put(`/api/users/${updated.id}`, {
        fullName: updated.fullName,
        username: updated.username,
        email:    updated.email,
        role:     updated.role,
      });
      setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
      showPopup("success", `${saved.fullName} has been updated successfully!`);
    } catch (err) {
      showPopup("error", err.response?.data?.message || "Failed to update user.");
    }
    setEditTarget(null);
  };

  const handleDelete = async (targetUser) => {
    try {
      await api.delete(`/api/users/${targetUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      showPopup("success", `${targetUser.fullName} has been removed.`);
    } catch (err) {
      showPopup("error", err.response?.data?.message || "Failed to delete user.");
    }
    setDeleteTarget(null);
  };

  const ROLE_FILTERS = ["All", "Owner", "Manager", "Staff"];

  /* â”€â”€ Derived stats â”€â”€ */
  const ownerCount   = users.filter((u) => u.role === "Owner").length;
  const managerCount = users.filter((u) => u.role === "Manager").length;
  const staffCount   = users.filter((u) => u.role === "Staff").length;

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">

        {/* â”€â”€ Page header â”€â”€ */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                User Management
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {users.length} user{users.length !== 1 ? "s" : ""} registered
              </p>
            </div>
          </div>

          {canAddUsers ? (
            <Button
              onClick={() => setIsAddOpen(true)}
              className="gap-2 shadow-sm shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add New User</span>
              <span className="sm:hidden">Add</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[11px] font-semibold text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400 shrink-0">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">No permission to add</span>
            </div>
          )}
        </div>

        {/* â”€â”€ Stats strip â”€â”€ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Users",   value: users.length  },
            { label: "Owners",        value: ownerCount    },
            { label: "Managers",      value: managerCount  },
            { label: "Staff Members", value: staffCount    },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
            >
              <p className="text-[22px] font-bold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* â”€â”€ Search + filter strip â”€â”€ */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search usersâ€¦"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56 pl-8 text-sm"
            />
          </div>

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
        </div>

        {/* â”€â”€ Table â”€â”€ */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading usersâ€¦</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={() => setIsAddOpen(true)} />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-10">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                    Username
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Role
                  </th>
                  <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filtered.map((u, idx) => (
                  <tr key={u.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-6 py-4 text-xs text-muted-foreground">{idx + 1}</td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar fullName={u.fullName} index={users.indexOf(u)} />
                        <span className="font-medium text-foreground">{u.fullName}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                      @{u.username}
                    </td>

                    <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
                      {u.email}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <RoleBadge role={u.role} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {canManage(u) ? (
                          <>
                            <button
                              onClick={() => setEditTarget(u)}
                              title={`Edit ${u.fullName}`}
                              className="rounded-lg p-1.5 text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u)}
                              title={`Delete ${u.fullName}`}
                              className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <span
                            title={
                              u.username === "admin"
                                ? "Admin account is protected"
                                : "Insufficient permissions"
                            }
                            className="inline-flex items-center rounded-lg p-1.5 text-muted-foreground/40 cursor-not-allowed"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table footer */}
            <div className="border-t border-border bg-muted/30 px-6 py-3">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">{users.length}</span>{" "}
                users
              </p>
            </div>
          </div>
        )}

      </div>{/* end scrollable area */}

      {/* â”€â”€ Modals â”€â”€ */}
      {isAddOpen && (
        <AddUserModal
          onClose={() => setIsAddOpen(false)}
          onAdd={handleAdd}
          currentUserRole={currentUserRole}
        />
      )}

      {editTarget && (
        <EditUserModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
          currentUserRole={currentUserRole}
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}

      <SuccessPopup
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup((p) => ({ ...p, show: false }))}
      />
    </div>
  );
}
