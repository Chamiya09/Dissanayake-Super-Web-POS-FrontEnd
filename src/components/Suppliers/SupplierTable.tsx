import { useState } from "react";
import { Pencil, Trash2, Mail, Phone, User, Building2, PackageCheck, Sparkles, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Supplier } from "@/data/suppliers";

/* ── Lead-time badge ── */
function LeadTimeBadge({ days }: { days: number }) {
  const fast   = days <= 2;
  const normal = days >= 3 && days <= 5;
  // slow = days > 5

  const label  = fast ? "Fast" : normal ? "Normal" : "Slow";
  const dot    = fast ? "bg-emerald-500" : normal ? "bg-amber-500" : "bg-red-500";
  const colour = fast
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"
    : normal
    ? "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800"
    : "bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800";

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

/* ── Auto-Reorder status badge ── */
function AutoReorderBadge({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 whitespace-nowrap">
      <Sparkles className="h-3 w-3" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
      Inactive
    </span>
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
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-[13px] font-bold select-none">
      {initials}
    </div>
  );
}

interface SupplierTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onAssign: (supplier: Supplier) => void;
}

export function SupplierTable({ suppliers, onEdit, onDelete, onAssign }: SupplierTableProps) {
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  /* ── Client-side filtering ── */
  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      s.companyName.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      String(s.id).includes(q);

    const matchesStatus =
      filterStatus === "all"          ? true :
      filterStatus === "fast"         ? s.leadTime <= 2 :
      filterStatus === "normal"       ? s.leadTime >= 3 && s.leadTime <= 5 :
      filterStatus === "slow"         ? s.leadTime > 5 :
      filterStatus === "auto-reorder" ? s.isAutoReorderEnabled :
      true;

    return matchesSearch && matchesStatus;
  });

  const hasActiveFilters = search !== "" || filterStatus !== "all";

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

      {/* ── Search & Filter toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search suppliers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-background"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-44 text-sm bg-background">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="fast">Fast (1–2 days)</SelectItem>
              <SelectItem value="normal">Normal (3–5 days)</SelectItem>
              <SelectItem value="slow">Slow (&gt; 5 days)</SelectItem>
              <SelectItem value="auto-reorder">AI Auto-Reorder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear filters — only visible when active */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-[12px] text-muted-foreground hover:text-foreground shrink-0"
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
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Supplier
              </th>
              <th className="px-5 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Contact Person
              </th>
              <th className="px-5 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </th>
              <th className="px-5 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Phone
              </th>
              <th className="px-5 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Lead Time
              </th>
              <th className="px-5 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Auto-Reorder
              </th>
              <th className="px-5 py-3.5 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((supplier, idx) => (
              <tr
                key={supplier.id}
                className={cn(
                  "group transition-colors hover:bg-muted/30",
                  idx % 2 === 0 ? "bg-card" : "bg-muted/10"
                )}
              >
                {/* Company */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <CompanyAvatar name={supplier.companyName} />
                    <div>
                      <p className="font-semibold text-foreground leading-tight">
                        {supplier.companyName}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{supplier.id}</p>
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-foreground">
                    <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {supplier.contactPerson}
                  </div>
                </td>

                {/* Email */}
                <td className="px-5 py-4">
                  <a
                    href={`mailto:${supplier.email}`}
                    className="flex items-center gap-1.5 text-primary hover:underline underline-offset-2"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {supplier.email}
                  </a>
                </td>

                {/* Phone */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {supplier.phone}
                  </div>
                </td>

                {/* Lead time */}
                <td className="px-5 py-4">
                  <LeadTimeBadge days={supplier.leadTime} />
                </td>

                {/* Auto-Reorder */}
                <td className="px-5 py-4">
                  <AutoReorderBadge enabled={supplier.isAutoReorderEnabled} />
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAssign(supplier)}
                      className="h-8 gap-1.5 text-[12px] hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-300 dark:hover:text-emerald-400"
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      Assign
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(supplier)}
                      className="h-8 gap-1.5 text-[12px] hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(supplier)}
                      className="h-8 gap-1.5 text-[12px] hover:bg-red-500/10 hover:text-red-600 hover:border-red-300 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden divide-y divide-border">
        {filtered.map((supplier) => (
          <div key={supplier.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <CompanyAvatar name={supplier.companyName} />
                <div>
                  <p className="font-semibold text-foreground leading-tight">{supplier.companyName}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{supplier.id}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <LeadTimeBadge days={supplier.leadTime} />
                <AutoReorderBadge enabled={supplier.isAutoReorderEnabled} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5 text-[13px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="text-foreground">{supplier.contactPerson}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <a href={`mailto:${supplier.email}`} className="text-primary hover:underline truncate">
                  {supplier.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="text-foreground">{supplier.phone}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssign(supplier)}
                className="flex-1 h-9 gap-1.5 text-[13px] hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-300 dark:hover:text-emerald-400"
              >
                <PackageCheck className="h-3.5 w-3.5" />
                Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(supplier)}
                className="flex-1 h-9 gap-1.5 text-[13px] hover:bg-primary/10 hover:text-primary hover:border-primary/40"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(supplier)}
                className="flex-1 h-9 gap-1.5 text-[13px] hover:bg-red-500/10 hover:text-red-600 hover:border-red-300 dark:hover:text-red-400"
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
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Building2 className="h-10 w-10 mb-3 opacity-30" />
          {hasActiveFilters ? (
            <>
              <p className="text-sm font-medium">No suppliers match your search</p>
              <p className="text-xs mt-1">Try adjusting your search term or clearing the filters.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">No suppliers found</p>
              <p className="text-xs mt-1">Add your first supplier to get started.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
