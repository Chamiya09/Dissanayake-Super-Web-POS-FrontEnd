import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { ShoppingCart } from "lucide-react";

const greetingByHour = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const name = useMemo(() => {
    const raw = user?.name?.trim();
    if (!raw) return "Team Member";
    return raw.split(" ")[0];
  }, [user?.name]);

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <AppHeader />

      <main className="flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Staff Workspace</p>
              <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                {greetingByHour()}, {name}
              </h1>
              <p className="mt-3 text-base text-slate-500">
                Welcome back. Choose what you want to do next.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10">
              <button
                onClick={() => navigate("/")}
                className="group flex min-h-[180px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-indigo-200 hover:bg-slate-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Open POS Checkout</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Go directly to the checkout terminal to scan items and complete customer sales.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
