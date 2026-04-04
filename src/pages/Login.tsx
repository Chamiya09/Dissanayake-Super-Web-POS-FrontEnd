import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, Store } from "lucide-react";
import { useAuth, ROLE_HOME } from "@/context/AuthContext";
import { useToast } from "@/context/GlobalToastContext";

const SPLASH_SESSION_KEY = "pos_login_splash_seen";

function getInitialSplashState() {
  try {
    return sessionStorage.getItem(SPLASH_SESSION_KEY) !== "1";
  } catch {
    return true;
  }
}

export default function Login() {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showSplash, setShowSplash] = useState(getInitialSplashState);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showSplash) return;
    const timer = window.setTimeout(() => {
      setShowSplash(false);
      try {
        sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
      } catch {
        // ignore storage failures and continue
      }
    }, 1700);

    return () => window.clearTimeout(timer);
  }, [showSplash]);

  useEffect(() => {
    if (!user) return;
    navigate(ROLE_HOME[user.role] ?? "/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast("Please enter both username and password.", "error", "Error");
      return;
    }
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.success) {
      showToast(result.error ?? "Invalid Credentials", "error", "Login Failed");
      return;
    }
    showToast("Login Successful!", "success", "Welcome");
    
    // Add a slight delay before redirecting so the user can easily read the toast
    // before the page paints the new Dashboard UI.
    setTimeout(() => {
      navigate(ROLE_HOME[result.user.role] ?? "/", { replace: true });
    }, 1200);
  };

  if (showSplash) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900">
        <div className="absolute -left-16 top-1/4 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="absolute -right-20 bottom-8 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl" />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center text-white">
          <div className="mb-5 rounded-2xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-md">
            <img
              src="/Logo.jpg"
              alt="Dissanayake Super Logo"
              className="h-20 w-20 rounded-xl object-cover"
            />
          </div>

          <h1 className="text-3xl font-black tracking-tight">Dissanayake Super Web POS</h1>
          <p className="mt-2 text-sm text-teal-100/90">Preparing secure workspace...</p>

          <div className="mt-8 h-1.5 w-52 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-24 animate-pulse rounded-full bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(20,184,166,0.22),transparent_30%),radial-gradient(circle_at_88%_78%,rgba(13,148,136,0.18),transparent_34%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-2xl lg:grid-cols-[1.1fr,1fr]">
          <section className="hidden bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="flex items-center gap-3">
              <img src="/Logo.jpg" alt="Dissanayake Super Logo" className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/30" />
              <div>
                <p className="text-lg font-extrabold leading-tight">Dissanayake Super</p>
                <p className="text-xs text-teal-100">Point of Sale Platform</p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-black leading-tight">Faster Checkout, Smarter Inventory.</h2>
              <p className="mt-3 max-w-sm text-sm text-teal-100/90">
                Access your live dashboard, stock controls, supplier workflows, and reorder tracking from one secure POS login.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                <Store className="mb-1.5 h-4 w-4" />
                Multi-role Access
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                <ShieldCheck className="mb-1.5 h-4 w-4" />
                Secure Session
              </div>
            </div>
          </section>

          <section className="p-7 sm:p-10">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <img src="/Logo.jpg" alt="Dissanayake Super Logo" className="h-12 w-12 rounded-xl object-cover ring-1 ring-teal-100" />
              <div>
                <h1 className="text-lg font-extrabold text-slate-900">Dissanayake Super</h1>
                <p className="text-xs text-slate-500">Web POS Login</p>
              </div>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">Use your staff account to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPass ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Dissanayake Super
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
