import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-white !text-slate-900 !border !border-slate-200 !shadow-lg !rounded-xl font-medium text-sm",
          title: "!text-slate-900 font-semibold text-sm",
          description: "!text-slate-500 text-xs",
          actionButton: "!bg-slate-900 !text-white hover:!bg-slate-700 !rounded-lg text-xs",
          cancelButton: "!bg-slate-100 !text-slate-600 hover:!bg-slate-200 !rounded-lg text-xs",
          success: "!text-slate-900",
          error: "!text-slate-900",
          warning: "!text-slate-900",
          info: "!text-slate-900",
          icon: "!w-4 !h-4",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
