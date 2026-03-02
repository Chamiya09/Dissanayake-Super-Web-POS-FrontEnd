import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME } from "@/context/AuthContext";
import { useDarkMode } from "@/components/Layout/AppHeader";
import { Sun, Moon } from "lucide-react";

const LS_REMEMBER = "pos_remembered_username";

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [dark, setDark] = useDarkMode();

  const [username,   setUsername]   = useState(() => localStorage.getItem(LS_REMEMBER) ?? "");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(LS_REMEMBER));
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    if (rememberMe) { localStorage.setItem(LS_REMEMBER, username); }
    else            { localStorage.removeItem(LS_REMEMBER); }
    navigate(ROLE_HOME[result.user.role] ?? "/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">

      {/* Dark-mode toggle — top-right */}
      <button
        onClick={() => setDark((d) => !d)}
        aria-label="Toggle dark mode"
        className="fixed top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground transition-colors"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* ── Card ── */}
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-sm px-8 py-10 space-y-8">

        {/* Logo + Brand */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/Logo.jpg"
            alt="Dissanayaka Super Logo"
            className="h-16 w-16 rounded-2xl object-cover shadow-sm border border-border"
          />
          <div className="text-center">
            <h1 className="text-[22px] font-extrabold tracking-wide text-foreground uppercase">
              Dissanayaka Super
            </h1>
            <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mt-0.5">
              Point of Sale Platform
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Heading */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground">Sign in to your staff account to continue.</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-sm font-semibold text-foreground"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-card"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-foreground"
              >
                Password
              </label>
              <button
                type="button"
                tabIndex={-1}
                className="text-xs font-medium text-primary hover:underline focus:outline-none"
                onClick={() => {}}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-card"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
            <span className="text-sm text-muted-foreground">Remember me on this device</span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground pt-1">
          Contact your administrator if you cannot log in.
        </p>
      </div>

      {/* Page footer */}
      <p className="mt-6 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Dissanayaka Super. All rights reserved.
      </p>
    </div>
  );
}
