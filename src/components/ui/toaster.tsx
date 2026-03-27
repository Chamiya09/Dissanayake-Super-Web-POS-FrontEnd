import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

const ICON_MAP = {
  default: {
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    Icon: Info,
  },
  destructive: {
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    Icon: XCircle,
  },
  success: {
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    Icon: CheckCircle2,
  },
  warning: {
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    Icon: AlertTriangle,
  },
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant = "default", ...props }) {
        const cfg = ICON_MAP[variant as keyof typeof ICON_MAP] || ICON_MAP.default;
        const { Icon, iconBg, iconColor } = cfg;

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-4">
              <div className={`shrink-0 flex items-center justify-center h-8 w-8 rounded-xl ${iconBg}`}>
                <Icon className={`h-[18px] w-[18px] ${iconColor}`} />
              </div>
              <div className="grid gap-1 pt-1.5">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
