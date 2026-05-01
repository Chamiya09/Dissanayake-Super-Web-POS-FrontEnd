import { useState } from "react";
import { Pencil, Trash2, Mail, Phone, User, Building2, PackageCheck, Package, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Supplier } from "@/data/suppliers";
import { getSupplierDisplayId } from "@/utils/supplierId";

/* ── Lead-time badge ── */
function LeadTimeBadge({ days }: { days: number }) {
  const fast   = days <= 2;
  const normal = days >= 3 && days <= 5;
  // slow = days > 5

  const label  = fast ? "Fast" : normal ? "Normal" : "Slow";
  const dot    = fast ? "bg-emerald-500" : normal ? "bg-amber-500" : "bg-red-500";
  const colour = fast
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
    : normal
    ? "bg-amber-500/10 text-amber-700 border-amber-200"
    : "bg-red-500/10 text-red-700 border-red-200";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        colour
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
      {label} ({days} {days === 1 ? "day" : "days"})
    </span>
  );
}

function SupplierActiveSwitch({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (active: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Switch
        checked={active}
        onCheckedChange={onChange}
        aria-label={active ? "Disable supplier" : "Enable supplier"}
        className="data-[state=checked]:bg-teal-600"
      />
      <span className={cn("text-xs font-semibold", active ? "text-teal-700" : "text-slate-400")}>
        {active ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

/* ── Avatar initials for the company ── */
function CompanyAvatar({ name }: { name: string }) {
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

interface SupplierTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onAssign: (supplier: Supplier) => void;
  onViewProducts: (supplier: Supplier) => void;
  onToggleActive: (supplier: Supplier, isActive: boolean) => void;
}

export function SupplierTable({ suppliers, onEdit, onDelete, onAssign, onViewProducts, onToggleActive }: SupplierTableProps) {
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  /* ── Client-side filtering ── */
  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    const supplierDisplayId = getSupplierDisplayId(s).toLowerCase();
    const matchesSearch =
      !q ||
      s.companyName.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      supplierDisplayId.includes(q) ||
      String(s.id).includes(q);

    const matchesStatus =
      filterStatus === "all"          ? true :
      filterStatus === "fast"         ? s.leadTime <= 2 :
      filterStatus === "normal"       ? s.leadTime >= 3 && s.leadTime <= 5 :
      filterStatus === "slow"         ? s.leadTime > 5 :
      filterStatus === "active"       ? s.isActive :
      filterStatus === "inactive"     ? !s.isActive :
      true;

    return matchesSearch && matchesStatus;
  });

  const hasActiveFilters = search !== "" || filterStatus !== "all";

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">

      {/* ── Search & Filter toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-6 py-4 border-b border-slate-100 bg-white">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search suppliers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-xl placeholder:text-slate-400 focus-visible:ring-slate-300"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-10 w-44 text-sm bg-white border-slate-200 rounded-xl focus:ring-slate-300">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="fast">Fast (1–2 days)</SelectItem>
              <SelectItem value="normal">Normal (3–5 days)</SelectItem>
              <SelectItem value="slow">Slow (&gt; 5 days)</SelectItem>
              <SelectItem value="active">Active Suppliers</SelectItem>
              <SelectItem value="inactive">Inactive Suppliers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear filters — only visible when active */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-3 text-xs font-medium text-slate-400 hover:text-slate-700 rounded-xl shrink-0"
            onClick={() => { setSearch(""); setFilterStatus("all"); }}
          >
            Clear
          </Button>
        )}
      </div>
      {/* ── Desktop table ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                Supplier
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                Contact Person
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                Email
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                Phone
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                Lead Time
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                Status
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((supplier) => (
              <tr
                key={supplier.id}
                className="group transition-colors duration-150 hover:bg-slate-50/60"
              >
                {/* Company */}
                <td className="px-6 py-6">
                  <div className="flex items-center gap-3">
                    <CompanyAvatar name={supplier.companyName} />
                    <div>
                      <p className="font-semibold text-slate-900 leading-tight">
                        {supplier.companyName}
                      </p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{getSupplierDisplayId(supplier)}</p>
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-6 py-6">
                  <div className="flex items-center gap-1.5 text-slate-700 text-sm">
                    <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {supplier.contactPerson}
                  </div>
                </td>

                {/* Email */}
                <td className="px-6 py-6">
                  <a
                    href={`mailto:${supplier.email}`}
                    className="flex items-center gap-1.5 text-slate-500 text-sm hover:text-indigo-600 hover:underline underline-offset-2 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {supplier.email}
                  </a>
                </td>

                {/* Phone */}
                <td className="px-6 py-6">
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {supplier.phone}
                  </div>
                </td>

                {/* Lead time */}
                <td className="px-6 py-6">
                  <LeadTimeBadge days={supplier.leadTime} />
                </td>

                <td className="px-6 py-6">
                  <SupplierActiveSwitch
                    active={supplier.isActive}
                    onChange={(active) => onToggleActive(supplier, active)}
                  />
                </td>

                {/* Actions */}
                <td className="px-6 py-6">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewProducts(supplier)}
                      className="h-8 gap-1.5 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-2"
                    >
                      <Package className="h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAssign(supplier)}
                      className="h-8 gap-1.5 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-2"
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      Assign
                    </Button>
                    <button
                      onClick={() => onEdit(supplier)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(supplier)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden divide-y divide-slate-100">
        {filtered.map((supplier) => (
          <div key={supplier.id} className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <CompanyAvatar name={supplier.companyName} />
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">{supplier.companyName}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{getSupplierDisplayId(supplier)}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <LeadTimeBadge days={supplier.leadTime} />
                <SupplierActiveSwitch
                  active={supplier.isActive}
                  onChange={(active) => onToggleActive(supplier, active)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="text-slate-700">{supplier.contactPerson}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <a href={`mailto:${supplier.email}`} className="text-slate-500 hover:text-indigo-600 hover:underline truncate transition-colors">
                  {supplier.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="text-slate-700">{supplier.phone}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewProducts(supplier)}
                className="flex-1 h-10 gap-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200"
              >
                <Package className="h-3.5 w-3.5" />
                View Products
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAssign(supplier)}
                className="flex-1 h-10 gap-1.5 text-xs text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-slate-200"
              >
                <PackageCheck className="h-3.5 w-3.5" />
                Assign
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(supplier)}
                className="flex-1 h-10 gap-1.5 text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(supplier)}
                className="flex-1 h-10 gap-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Building2 className="h-12 w-12 mb-4 opacity-20" />
          {hasActiveFilters ? (
            <>
              <p className="text-sm font-semibold text-slate-500">No suppliers match your search</p>
              <p className="text-xs mt-1.5 text-slate-400">Try adjusting your search term or clearing the filters.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-500">No suppliers found</p>
              <p className="text-xs mt-1.5 text-slate-400">Add your first supplier to get started.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
