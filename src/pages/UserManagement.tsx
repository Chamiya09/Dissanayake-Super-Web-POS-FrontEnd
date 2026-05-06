import { useState, useEffect, useCallback, useMemo } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Users,
  Search,
  UserCircle2,
  ShieldAlert,
  Edit3,
  Trash2,
  Lock,
  UserPlus,
  Shield,
  UserCog,
  RefreshCw,
  Mail,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/context/GlobalToastContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axiosInstance";
import AddUserModal from "@/components/Users/AddUserModal";
import EditUserModal from "@/components/Users/EditUserModal";
import DeleteUserModal from "@/components/Users/DeleteUserModal";
import { RefreshLoadingTheme } from "@/components/ui/RefreshLoadingTheme";

const CAN_ADD_USERS = ["Owner", "Manager"];

const MANAGEABLE_ROLES = {
  Owner: ["Manager", "Staff"],
  Manager: ["Staff"],
  Staff: [],
};

function RoleBadge({ role, isSenior = false }) {
  const isOwner = role === "Owner";
  const isManager = role === "Manager";
  const isSeniorStaff = role === "Staff" && isSenior;

  const dot = isOwner ? "bg-red-500" : isManager ? "bg-blue-500" : isSeniorStaff ? "bg-violet-500" : "bg-green-500";
  const colour = isOwner
    ? "bg-red-50 text-red-600 border-red-200"
    : isManager
    ? "bg-blue-50 text-blue-600 border-blue-200"
    : isSeniorStaff
    ? "bg-violet-50 text-violet-700 border-violet-200"
    : "bg-emerald-50 text-emerald-600 border-emerald-200";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap", colour)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
      {isSeniorStaff ? "Senior Staff" : role}
    </span>
  );
}

function UserAvatar({ name, isSenior = false }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold tracking-wide select-none",
          isSenior
            ? "border border-violet-200 bg-violet-50 text-violet-700 shadow-sm"
            : "bg-slate-100 text-slate-600",
        )}
      >
        {initials}
      </div>
      {isSenior ? (
        <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-600 shadow-sm">
          <Sparkles className="h-2.5 w-2.5" />
        </span>
      ) : null}
    </div>
  );
}

function SummaryCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconBg, iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="whitespace-nowrap text-sm font-medium text-slate-500">{label}</span>
          <span className="mt-1 text-2xl font-bold leading-none text-slate-900">{value}</span>
        </div>
      </div>
      {sub && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <span className="text-sm text-slate-500">{sub}</span>
        </div>
      )}
    </div>
  );
}

export default function UserManagement() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const currentUserRole = user?.role ?? "Staff";
  const isManagerView = currentUserRole === "Manager";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canAddUsers = CAN_ADD_USERS.includes(currentUserRole);

  const visibleUsers = useMemo(
    () => (isManagerView ? users.filter((u) => u.role !== "Owner") : users),
    [isManagerView, users]
  );

  const canManage = (targetUser) =>
    targetUser.username !== "admin" &&
    (MANAGEABLE_ROLES[currentUserRole] ?? []).includes(targetUser.role);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/users");
      setUsers(data);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = visibleUsers.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(q) ||
      (u.memberId || "").toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAdd = async (formData) => {
    try {
      const { data: created } = await api.post("/api/users", {
        fullName: formData.fullName,
        memberId: formData.memberId,
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        role: formData.role,
        password: formData.password,
        isSenior: formData.role === "STAFF" && Boolean(formData.isSenior),
      });
      setUsers((prev) => [created, ...prev]);
      showToast(`${created.fullName} has been added successfully!`, "success");
      setIsAddOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add user.", "error");
    }
  };

  const handleEdit = async (updated) => {
    try {
      const { data: saved } = await api.put(`/api/users/${updated.id}`, {
        fullName: updated.fullName,
        memberId: updated.memberId,
        username: updated.username,
        email: updated.email,
        phoneNumber: updated.phoneNumber,
        address: updated.address,
        role: updated.role,
        isSenior: updated.role === "Staff" && Boolean(updated.isSenior),
      });
      setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
      showToast(`${saved.fullName} has been updated successfully!`, "success");
      setEditTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update user.", "error");
    }
  };

  const handleDelete = async (targetUser) => {
    try {
      await api.delete(`/api/users/${targetUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      showToast(`${targetUser.fullName} has been removed.`, "success");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete user.", "error");
    }
  };

  const managerCount = visibleUsers.filter((u) => u.role === "Manager").length;
  const staffCount = visibleUsers.filter((u) => u.role === "Staff").length;

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-none space-y-8">
          <div className="flex flex-col justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-600">
                <Users size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Users</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? "Loading users..."
                    : isManagerView
                    ? `Manage staff accounts for your team · ${visibleUsers.length} visible user${visibleUsers.length !== 1 ? "s" : ""}`
                    : `Manage system access, roles, and staff accounts · ${visibleUsers.length} active user${visibleUsers.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
                disabled={loading}
                title="Refresh List"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-teal-100 hover:bg-teal-50 hover:text-teal-600 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              {canAddUsers ? (
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-teal-600 px-5 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-teal-700 focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 active:scale-95"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">{isManagerView ? "Add Staff" : "Add User"}</span>
                  <span className="sm:hidden">Add</span>
                </button>
              ) : (
                <div className="flex shrink-0 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-700 shadow-sm">
                  <ShieldAlert className="h-4 w-4" />
                  No permission to add
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 sm:px-6 lg:px-8">
            <SummaryCard
              icon={Users}
              iconBg="bg-teal-50"
              iconColor="text-teal-600"
              label={isManagerView ? "Visible Users" : "Total Users"}
              value={visibleUsers.length}
              sub={isManagerView ? "Accounts available in manager view" : "Active user accounts in the system"}
            />
            <SummaryCard
              icon={UserCog}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              label="Active Managers"
              value={managerCount}
              sub="Users assigned to Manager role"
            />
            <SummaryCard
              icon={Shield}
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
              label="Total Staff"
              value={staffCount}
              sub="Users assigned to Staff role"
            />
          </div>

          <div className="px-4 sm:px-6 lg:px-8">
            <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex flex-col items-stretch gap-3 border-b border-slate-100 bg-white px-6 py-4 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder={isManagerView ? "Search staff or managers..." : "Search users..."}
                    className="h-10 rounded-xl border-slate-200 bg-white pl-10 text-sm placeholder:text-slate-400 focus-visible:ring-slate-300"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-10 w-44 rounded-xl border-slate-200 bg-white text-sm focus:ring-slate-300">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {!isManagerView && <SelectItem value="Owner">Owners</SelectItem>}
                      <SelectItem value="Manager">Managers</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(search !== "" || roleFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 shrink-0 rounded-xl px-3 text-xs font-medium text-slate-400 hover:text-slate-700"
                    onClick={() => {
                      setSearch("");
                      setRoleFilter("all");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>

              <div className="hidden overflow-x-auto bg-white md:block">
                {loading ? (
                  <RefreshLoadingTheme title="Loading Users" subtitle="Fetching user accounts and roles..." />
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <UserCircle2 className="mb-3 h-12 w-12 text-slate-300" />
                    <p className="text-sm font-medium text-slate-900">No users found</p>
                    <p className="text-sm text-slate-500">Try adjusting your search criteria or add a new user.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="bg-transparent px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">User</th>
                        <th className="bg-transparent px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">Contact</th>
                        <th className="bg-transparent px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">Role</th>
                        <th className="bg-transparent px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((u) => (
                        <tr key={u.id} className="group transition-colors duration-150 hover:bg-slate-50/60">
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                              <UserAvatar name={u.fullName} isSenior={u.role === "Staff" && Boolean(u.isSenior)} />
                              <div>
                                <p className="font-semibold leading-tight text-slate-900">{u.fullName}</p>
                                <p className="mt-0.5 font-mono text-xs text-slate-400">{u.memberId || `@${u.username}`}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              {u.email}
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <RoleBadge role={u.role} isSenior={u.isSenior} />
                          </td>
                          <td className="px-6 py-6 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                              {canManage(u) ? (
                                <>
                                  <button
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-teal-50 hover:text-teal-600"
                                    onClick={() => setEditTarget(u)}
                                    title={`Edit ${u.fullName}`}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                    onClick={() => setDeleteTarget(u)}
                                    title={`Delete ${u.fullName}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg text-slate-300"
                                  disabled
                                  title={u.username === "admin" ? "Admin account is protected" : "Insufficient permissions"}
                                >
                                  <Lock className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="divide-y divide-slate-100 bg-white md:hidden">
                {loading ? (
                  <RefreshLoadingTheme title="Loading Users" subtitle="Fetching user accounts and roles..." />
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <UserCircle2 className="mb-2 h-10 w-10 text-slate-300" />
                    <p className="text-sm font-medium text-slate-900">No users found</p>
                    <p className="mt-1 text-xs text-slate-500">Try changing your filters.</p>
                  </div>
                ) : (
                  filtered.map((u) => (
                    <div key={u.id} className="space-y-4 p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.fullName} isSenior={u.role === "Staff" && Boolean(u.isSenior)} />
                          <div>
                            <p className="font-semibold leading-tight text-slate-900">{u.fullName}</p>
                            <p className="mt-0.5 font-mono text-xs text-slate-400">{u.memberId || `@${u.username}`}</p>
                          </div>
                        </div>
                        <RoleBadge role={u.role} isSenior={u.isSenior} />
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{u.email}</span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        {canManage(u) ? (
                          <>
                            <button
                              className="h-10 flex-1 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
                              onClick={() => setEditTarget(u)}
                            >
                              Edit
                            </button>
                            <button
                              className="h-10 flex-1 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
                              onClick={() => setDeleteTarget(u)}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            className="h-10 w-full cursor-not-allowed rounded-xl border border-slate-200 text-sm font-medium text-slate-400"
                            disabled
                            title={u.username === "admin" ? "Admin account is protected" : "Insufficient permissions"}
                          >
                            Protected Account
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

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
    </div>
  );
}
