import { Pencil, Trash2, Clock, Mail, Phone, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Supplier } from "@/data/suppliers";

/* ── Lead-time badge colour helper ── */
function LeadTimeBadge({ days }: { days: number }) {
  const colour =
    days <= 1
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"
      : days <= 3
      ? "bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800"
      : "bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        colour
      )}
    >
      <Clock className="h-3 w-3" />
      {days} {days === 1 ? "day" : "days"}
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
}

export function SupplierTable({ suppliers, onEdit, onDelete }: SupplierTableProps) {

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
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
              <th className="px-5 py-3.5 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {suppliers.map((supplier, idx) => (
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

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
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
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <CompanyAvatar name={supplier.companyName} />
                <div>
                  <p className="font-semibold text-foreground leading-tight">{supplier.companyName}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{supplier.id}</p>
                </div>
              </div>
              <LeadTimeBadge days={supplier.leadTime} />
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

            <div className="flex gap-2 pt-1">
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
      {suppliers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Building2 className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No suppliers found</p>
          <p className="text-xs mt-1">Add your first supplier to get started.</p>
        </div>
      )}
    </div>
  );
}
