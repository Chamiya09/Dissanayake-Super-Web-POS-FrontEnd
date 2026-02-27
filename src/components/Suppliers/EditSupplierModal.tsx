import { useEffect, useRef, useState } from "react";
import { X, Building2, User, Mail, Phone, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Supplier } from "@/data/suppliers";

interface EditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

interface FormFields {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  leadTime: string;
}

/* ── Reusable labeled input row ── */
function FormRow({
  id,
  label,
  icon: Icon,
  error,
  children,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-[11px] text-red-500 dark:text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
}

export function EditSupplierModal({ isOpen, onClose, supplier }: EditSupplierModalProps) {
  const [form, setForm] = useState<FormFields>({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    leadTime: "",
  });
  const [errors, setErrors] = useState<Partial<FormFields>>({});
  const [saving, setSaving] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  /* Pre-fill form whenever a supplier is passed in */
  useEffect(() => {
    if (isOpen && supplier) {
      setForm({
        companyName:   supplier.companyName,
        contactPerson: supplier.contactPerson,
        email:         supplier.email,
        phone:         supplier.phone,
        leadTime:      String(supplier.leadTime),
      });
      setErrors({});
      setSaving(false);
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [isOpen, supplier]);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const set = (field: keyof FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormFields> = {};
    if (!form.companyName.trim())   newErrors.companyName   = "Company name is required.";
    if (!form.contactPerson.trim()) newErrors.contactPerson = "Contact person is required.";
    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!form.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!form.leadTime.trim()) {
      newErrors.leadTime = "Lead time is required.";
    } else if (isNaN(Number(form.leadTime)) || Number(form.leadTime) < 1) {
      newErrors.leadTime = "Enter a valid number of days (≥ 1).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = () => {
    if (!validate()) return;
    setSaving(true);
    // Simulate async update — real API call will be added later
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 800);
  };

  if (!isOpen || !supplier) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="edit-supplier-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2
                id="edit-supplier-title"
                className="text-[16px] font-bold text-foreground leading-tight"
              >
                Edit Supplier
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Update the details for{" "}
                <span className="font-semibold text-foreground">{supplier.companyName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Supplier ID chip */}
        <div className="px-6 pt-4">
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground tracking-wide">
            {supplier.id}
          </span>
        </div>

        {/* Form body */}
        <div className="px-6 py-4 space-y-4">
          {/* Company Name */}
          <FormRow id="edit-companyName" label="Company Name" icon={Building2} error={errors.companyName}>
            <Input
              id="edit-companyName"
              ref={firstInputRef}
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder="e.g. Fresh Farms Ltd."
              className={cn(
                "h-10 text-[13px]",
                errors.companyName && "border-red-400 focus-visible:ring-red-400"
              )}
            />
          </FormRow>

          {/* Contact Person */}
          <FormRow id="edit-contactPerson" label="Contact Person" icon={User} error={errors.contactPerson}>
            <Input
              id="edit-contactPerson"
              value={form.contactPerson}
              onChange={(e) => set("contactPerson", e.target.value)}
              placeholder="e.g. Kamal Perera"
              className={cn(
                "h-10 text-[13px]",
                errors.contactPerson && "border-red-400 focus-visible:ring-red-400"
              )}
            />
          </FormRow>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormRow id="edit-email" label="Email Address" icon={Mail} error={errors.email}>
              <Input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="supplier@example.com"
                className={cn(
                  "h-10 text-[13px]",
                  errors.email && "border-red-400 focus-visible:ring-red-400"
                )}
              />
            </FormRow>

            <FormRow id="edit-phone" label="Phone Number" icon={Phone} error={errors.phone}>
              <Input
                id="edit-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="e.g. 0112 345 678"
                className={cn(
                  "h-10 text-[13px]",
                  errors.phone && "border-red-400 focus-visible:ring-red-400"
                )}
              />
            </FormRow>
          </div>

          {/* Lead Time */}
          <FormRow id="edit-leadTime" label="Lead Time (days)" icon={Clock} error={errors.leadTime}>
            <div className="relative">
              <Input
                id="edit-leadTime"
                type="number"
                min={1}
                value={form.leadTime}
                onChange={(e) => set("leadTime", e.target.value)}
                placeholder="e.g. 3"
                className={cn(
                  "h-10 text-[13px] pr-14",
                  errors.leadTime && "border-red-400 focus-visible:ring-red-400"
                )}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground font-medium">
                days
              </span>
            </div>
          </FormRow>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="h-9 px-5 text-[13px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={saving}
            className="h-9 px-5 text-[13px] gap-2 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating…
              </>
            ) : (
              "Update Supplier"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
