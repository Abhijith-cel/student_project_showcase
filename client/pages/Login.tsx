import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FolderGit2,
  KeyRound,
  Mail,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { login, isLoggedIn, getUserRole } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unverified email states
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      const role = getUserRole();
      if (role === "visitor") {
        navigate("/");
      } else {
        navigate("/admin/dashboard");
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setUnverifiedEmail(null);
    setResendSuccess(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier,
          username: identifier,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.unverified) {
          setUnverifiedEmail(data.email);
        }
        throw new Error(data.message || "Failed to log in.");
      }

      // Store credentials
      login(data.token, {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        username: data.username,
        isVerified: data.isVerified,
      });

      // Redirect depending on role
      if (data.role === "visitor") {
        navigate("/");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    setError(null);
    setResendSuccess(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to resend verification email.");
      }

      setResendSuccess(
        "Verification email has been resent. Please check your inbox!",
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to resend verification link.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-foreground flex flex-col justify-between relative overflow-hidden">
      {/* Background grids and glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141416_1px,transparent_1px),linear-gradient(to_bottom,#141416_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35" />
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Back Link */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
          Back to showcase
        </Link>
      </header>

      {/* Card Content */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card/20 border border-border/40 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.15)]">
              <FolderGit2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Sign In to Portal
            </h2>
            <p className="text-sm text-muted-foreground">
              Access your Student Dashboard, Admin Controls, or Visitor
              features.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3.5 flex flex-col gap-2 text-sm text-destructive">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>

              {/* Resend button if account is unverified */}
              {unverifiedEmail && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="mt-1 text-xs font-semibold text-primary hover:underline self-start pl-7"
                >
                  {resendLoading
                    ? "Resending link..."
                    : "Resend Verification Email"}
                </button>
              )}
            </div>
          )}

          {/* Resend Success Message */}
          {resendSuccess && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex items-start gap-2.5 text-sm text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{resendSuccess}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="name@university.edu or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-lg border border-border bg-black/40 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-black/40 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold transition-all duration-300 mt-2 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                  Verifying credentials...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Redirect to Register & Hints */}
          <div className="space-y-3 pt-4 border-t border-border/30 text-center">
            <div className="text-xs text-muted-foreground">
              New to ProjectVault?{" "}
              <Link
                to="/register"
                className="text-primary hover:underline font-semibold"
              >
                Create an account
              </Link>
            </div>

            <div className="text-[10px] text-muted-foreground">
              Default admin:{" "}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">
                admin / admin123
              </code>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} ProjectVault Portal. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
