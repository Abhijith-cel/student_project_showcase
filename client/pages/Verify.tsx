import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  FolderGit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for resending verification code if failed
  const [emailToResend, setEmailToResend] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError(
          "Verification token is missing. Please check your verification email link.",
        );
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to verify account.");
        }

        setSuccess(true);
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Invalid or expired verification token.");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailToResend.trim()) return;

    setResendLoading(true);
    setResendSuccess(null);
    setResendError(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToResend.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to resend verification email.");
      }

      setResendSuccess("Verification email has been resent successfully!");
      setEmailToResend("");
    } catch (err: any) {
      console.error(err);
      setResendError(err.message || "Failed to resend verification link.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-foreground flex flex-col justify-between relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141416_1px,transparent_1px),linear-gradient(to_bottom,#141416_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35" />
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to portal
        </Link>
      </header>

      {/* Main card */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card/25 border border-border/40 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-6 text-center">
          {/* Logo */}
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
            <FolderGit2 className="h-6 w-6" />
          </div>

          {verifying ? (
            /* Loading State */
            <div className="space-y-4 py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
              <h2 className="text-xl font-semibold">Verifying your email...</h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we connect with the security portal.
              </p>
            </div>
          ) : success ? (
            /* Success State */
            <div className="space-y-6 py-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Verification Complete!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your email has been verified. You can now access your account
                  and explore ProjectVault.
                </p>
              </div>
              <Button
                asChild
                className="w-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(124,58,237,0.25)]"
              >
                <Link to="/admin/login">
                  Sign In to Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            /* Error State */
            <div className="space-y-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.15)]">
                <XCircle className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Verification Failed
                </h2>
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>

              {/* Resend verification block */}
              <div className="border-t border-border/30 pt-6 text-left space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Need a new verification link?
                </h3>
                <p className="text-xs text-muted-foreground">
                  Enter your email address below, and we'll dispatch a fresh
                  verification link.
                </p>

                {resendSuccess && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                    <span>{resendSuccess}</span>
                  </div>
                )}

                {resendError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{resendError}</span>
                  </div>
                )}

                <form onSubmit={handleResend} className="flex gap-2">
                  <div className="relative flex-grow">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      placeholder="email@university.edu"
                      value={emailToResend}
                      onChange={(e) => setEmailToResend(e.target.value)}
                      className="w-full rounded-lg border border-border bg-black/40 pl-8 pr-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={resendLoading}
                    size="sm"
                    className="bg-primary hover:bg-primary/95 text-white text-xs px-4"
                  >
                    {resendLoading ? "Sending..." : "Resend"}
                  </Button>
                </form>
              </div>

              <div className="border-t border-border/30 pt-4 flex justify-center">
                <Link
                  to="/admin/login"
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Return to login page
                </Link>
              </div>
            </div>
          )}
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
