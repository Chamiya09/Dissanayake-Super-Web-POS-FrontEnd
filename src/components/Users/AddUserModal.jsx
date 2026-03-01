import { useState } from "react";
import { X, UserPlus, User, Mail, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ROLES = ["Owner", "Manager", "Staff"];

const EMPTY_FORM = {
  fullName: "",
  username: "",
  email: "",
  role: "",
  password: "",
};

function validateForm(form) {
  const errors = {};
  if (!form.fullName.trim())  errors.fullName  = "Full name is required.";
  if (!form.username.trim())  errors.username  = "Username is required.";
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.role)             errors.role      = "Please select a role.";
  if (!form.password.trim()) {
    errors.password = "Password is required.";
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  return errors;
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export default function AddUserModal({ onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    onAdd({
      id: Date.now(),
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      role: form.role,
    });
    onClose();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 rounded-t-2xl border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Add New User</h2>
            <p className="text-xs text-muted-foreground">Fill in the details below to create an account.</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">

          {/* Full Name */}
          <div>
            <Label htmlFor="fullName" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
            </Label>
            <Input
              id="fullName"
              placeholder="e.g. Kamal Perera"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className={cn("h-9 text-sm", errors.fullName && "border-red-400 focus-visible:ring-red-300")}
            />
            <FieldError message={errors.fullName} />
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <User className="h-3.5 w-3.5 text-muted-foreground" /> Username
            </Label>
            <Input
              id="username"
              placeholder="e.g. kamal_p"
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              className={cn("h-9 text-sm", errors.username && "border-red-400 focus-visible:ring-red-300")}
            />
            <FieldError message={errors.username} />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. kamal@dissanayake.lk"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={cn("h-9 text-sm", errors.email && "border-red-400 focus-visible:ring-red-300")}
            />
            <FieldError message={errors.email} />
          </div>

          {/* Role */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" /> Role
            </Label>
            <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
              <SelectTrigger className={cn("h-9 text-sm", errors.role && "border-red-400 focus:ring-red-300")}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="text-sm">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.role} />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className={cn("h-9 text-sm", errors.password && "border-red-400 focus-visible:ring-red-300")}
            />
            <FieldError message={errors.password} />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Add User
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
