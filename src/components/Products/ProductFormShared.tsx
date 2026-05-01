import { Label } from "@/components/ui/label";

export const CATEGORIES = [
  "Auto Care",
  "Baby Products",
  "Bakery",
  "Beverages",
  "Cooking Essentials",
  "Dairy",
  "Desserts & Ingredients",
  "Food Cupboard",
  "Frozen Food",
  "Fruits",
  "Health & Beauty",
  "Household",
  "Meats",
  "Party Shop",
  "Pet Products",
  "Rice",
  "Seafood",
  "Seeds & Spices",
  "Snacks & Confectionery",
  "Stationery",
  "Tea & Coffee",
  "Vegetables",
] as const;

export const UNITS = [
  "g", "kg", "Pack", "Unit",
] as const;

export type FormFields = {
  sku:          string;
  productName:  string;
  barcode:      string;
  category:     string;
  buyingPrice:  string;
  sellingPrice: string;
  unit:         string;
};

export const EMPTY_FORM: FormFields = {
  sku:          "",
  productName:  "",
  barcode:      "",
  category:     "",
  buyingPrice:  "",
  sellingPrice: "",
  unit:         "",
};

export function validateForm(form: FormFields): Partial<FormFields> {
  const err: Partial<FormFields> = {};
  if (!form.productName.trim())  err.productName  = "Product name is required.";
  if (!form.category)            err.category     = "Please select a category.";
  if (!form.unit)                err.unit         = "Pricing unit is required.";
  if (!form.buyingPrice.trim()) {
    err.buyingPrice = "Buying price is required.";
  } else if (isNaN(Number(form.buyingPrice)) || Number(form.buyingPrice) < 0) {
    err.buyingPrice = "Enter a valid price (>= 0).";
  }
  if (!form.sellingPrice.trim()) {
    err.sellingPrice = "Selling price is required.";
  } else if (isNaN(Number(form.sellingPrice)) || Number(form.sellingPrice) < 0) {
    err.sellingPrice = "Enter a valid price (>= 0).";
  }
  return err;
}

export function FormRow({
  id,
  label,
  icon: Icon,
  error,
  children,
}: {
  id:       string;
  label:    string;
  icon:     React.ElementType;
  error?:   string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-[13px] font-medium text-slate-700 flex items-center gap-1.5"
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-[11px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
