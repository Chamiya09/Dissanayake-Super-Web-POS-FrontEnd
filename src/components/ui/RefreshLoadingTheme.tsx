type RefreshLoadingThemeProps = {
  title?: string;
  subtitle?: string;
};

export function RefreshLoadingTheme({
  title = "Refreshing workspace",
  subtitle = "Fetching your latest data...",
}: RefreshLoadingThemeProps) {
  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-white/92 backdrop-blur-sm">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-slate-900 animate-spin" />
      </div>

      <div className="mt-5 text-center">
        <p className="text-base font-semibold text-slate-700">{title}</p>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}
