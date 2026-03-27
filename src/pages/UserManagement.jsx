import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  Shield,
  UserCog,
  RefreshCw,
  Mail,
  SlidersHorizontal,
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

/* ── Role-based permission config ── */
const CAN_ADD_USERS = ["Owner", "Manager"];

/* Which roles can each logged-in role edit or delete */
const MANAGEABLE_ROLES = {
  Owner: ["Manager", "Staff"],
  Manager: ["Staff"],
  Staff: [],
};

/* ── Role badge colours ── */
function RoleBadge({ role }) {
  const isOwner = role === "Owner";
  const isManager = role === "Manager";
  // Staff fallback
  
  const label = role;
  const dot = isOwner ? "bg-red-500" : isManager ? "bg-blue-500" : "bg-green-500";
  const colour = isOwner
    ? "bg-red-50 text-red-600 border-red-200"
    : isManager
    ? "bg-blue-50 text-blue-600 border-blue-200"
    : "bg-emerald-50 text-emerald-600 border-emerald-200";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        colour
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
      {label}
    </span>
  );
}

/* ── Avatar initials helper ── */
function UserAvatar({ name }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 text-[12px] font-bold select-none tracking-wide">
      {initials}
    </div>
  );
}

function SummaryCard({ icon: Icon, iconBg, iconColor, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}

export default function UserManagement() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const currentUserRole = user?.role ?? "Staff";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canAddUsers = CAN_ADD_USERS.includes(currentUserRole);

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

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAdd = async (formData) => {
    try {
      const { data: created } = await api.post("/api/users", {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        password: formData.password,
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
        username: updated.username,
        email: updated.email,
        role: updated.role,
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

  const ownerCount = users.filter((u) => u.role === "Owner").length;
  const managerCount = users.filter((u) => u.role === "Manager").length;
  const staffCount = users.filter((u) => u.role === "Staff").length;

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-none space-y-8">

          {/* ── Page header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 text-teal-600 shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    System Users
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    {loading
                      ? "Loading users..."
                      : `Manage system access, roles, and staff accounts · ${users.length} active user${users.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
                disabled={loading}
                title="Refresh List"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-teal-600 hover:border-teal-100 hover:bg-teal-50 transition-all disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              {canAddUsers ? (
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-xl text-[13px] font-semibold bg-teal-600 text-white hover:bg-teal-700 focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow-sm shrink-0"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add User</span>
                  <span className="sm:hidden">Add</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-700 shadow-sm shrink-0">
                  <ShieldAlert className="h-4 w-4" />
                  No permission to add
                </div>
              )}
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-4 sm:px-6 lg:px-8">
            <SummaryCard
              icon={Users}
              iconBg="bg-teal-50"
              iconColor="text-teal-600"
              label="TOTAL USERS"
              value={users.length}
            />
            <SummaryCard
              icon={UserCog}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              label="ACTIVE MANAGERS"
              value={managerCount}
            />
            <SummaryCard
              icon={Shield}
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
              label="TOTAL STAFF"
              value={staffCount}
            />
          </div>

          {/* ── Main content (Filters and Table) ── */}
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="w-full rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-6 py-4 border-b border-slate-100 bg-white">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-xl placeholder:text-slate-400 focus-visible:ring-slate-300"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-10 w-44 text-sm bg-white border-slate-200 rounded-xl focus:ring-slate-300">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Owner">Owners</SelectItem>
                      <SelectItem value="Manager">Managers</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(search !== "" || roleFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-3 text-xs font-medium text-slate-400 hover:text-slate-700 rounded-xl shrink-0"
                    onClick={() => { setSearch(""); setRoleFilter("all"); }}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Table */}
              <div className="hidden md:block overflow-x-auto bg-white">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-sm text-slate-500">Loading users...</span>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <UserCircle2 className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-900">No users found</p>
                    <p className="text-sm text-slate-500">
                      Try adjusting your search criteria or add a new user.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                          User
                        </th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                          Contact
                        </th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                          Role
                        </th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((u) => (
                        <tr 
                          key={u.id} 
                          className="group transition-colors duration-150 hover:bg-slate-50/60"
                        >
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                              <UserAvatar name={u.fullName} />
                              <div>
                                <p className="font-semibold text-slate-900 leading-tight">
                                  {u.fullName}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">@{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              {u.email}
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <RoleBadge role={u.role} />
                          </td>
                          <td className="px-6 py-6 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                              {canManage(u) ? (
                                <>
                                  <button
                                    className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                                    onClick={() => setEditTarget(u)}
                                    title={`Edit ${u.fullName}`}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    onClick={() => setDeleteTarget(u)}
                                    title={`Delete ${u.fullName}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-300 cursor-not-allowed"
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
