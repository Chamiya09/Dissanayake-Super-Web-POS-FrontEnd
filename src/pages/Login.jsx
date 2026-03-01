import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, ShoppingCart, AlertCircle, User, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

/* Role → redirect destination */
const ROLE_REDIRECT = {
  Owner:   "/dashboard",
  Manager: "/dashboard",
  Staff:   "/",
};

/* Demo credential helper cards */
const DEMO_ACCOUNTS = [
  { username: "admin",    role: "Owner",   colour: "border-red-200   bg-red-50   text-red-700   dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"   },
  { username: "manager1", role: "Manager", colour: "border-blue-200  bg-blue-50  text-blue-700  dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400"  },
  { username: "staff1",   role: "Staff",   colour: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [username,  setUsername]  = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);

  /* Fill username from a demo card click */
  const fillDemo = (u) => {
    setUsername(u);
    setPassword("demo");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    /* Tiny artificial delay so the spinner is visible */
    await new Promise((r) => setTimeout(r, 600));

    const result = login(username, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    navigate(ROLE_REDIRECT[result.user.role] ?? "/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4 py-10">

      {/* ── Card ── */}
      <div className="w-full max-w-sm space-y-7">

        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <ShoppingCart className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Dissanayaka Super
            </h1>
            <p className="text-sm text-muted-foreground">Point of Sale — Staff Portal</p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-card shadow-xl shadow-black/5 px-7 py-8 space-y-5">

          <div className="space-y-1">
            <h2 className="text-[17px] font-bold text-foreground">Sign in to your account</h2>
            <p className="text-xs text-muted-foreground">Enter your credentials to continue.</p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 dark:border-red-800 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <p className="text-xs font-medium text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="block text-xs font-semibold text-foreground">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  className={cn(
                    "h-10 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground",
                    "outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20",
                    error && "border-red-400 focus:border-red-400 focus:ring-red-200"
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className={cn(
                    "h-10 w-full rounded-lg border border-border bg-background pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground",
                    "outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20",
                    error && "border-red-400 focus:border-red-400 focus:ring-red-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm",
                "transition-all hover:bg-primary/90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/40",
                "disabled:cursor-not-allowed disabled:opacity-60"
              )}
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="space-y-2">
          <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Demo accounts (click to fill)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map(({ username: u, role, colour }) => (
              <button
                key={u}
                onClick={() => fillDemo(u)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-center transition-all hover:opacity-80 active:scale-95",
                  colour
                )}
              >
                <span className="text-[11px] font-bold leading-none">{role}</span>
                <span className="text-[10px] font-mono opacity-75">@{u}</span>
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] text-muted-foreground">
            Any password works for demo accounts.
          </p>
        </div>

      </div>
    </div>
  );
}
