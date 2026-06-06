import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FolderGit2,
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Register() {
  const navigate = useNavigate();

  // Registration Role Mode
  const [role, setRole] = useState<"student" | "visitor">("student");

  // Form values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (role === "student" && (!studentId.trim() || !department.trim())) {
      setError("Student ID and Department are required for students.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        studentId: role === "student" ? studentId.trim() : undefined,
        department: role === "student" ? department.trim() : undefined,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-foreground flex flex-col justify-between relative overflow-hidden">
      {/* Background grids and glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141416_1px,transparent_1px),linear-gradient(to_bottom,#141416_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35" />
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

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
      <main className="relative z-10 flex-grow flex items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full bg-card/20 border border-border/40 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {/* Success State */}
          {success ? (
            <div className="text-center space-y-6 py-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Verify Your Email
                </h2>
                <p className="text-sm text-muted-foreground px-4">
                  We have sent a verification link to{" "}
                  <strong className="text-foreground">{email}</strong>. Please
                  check your inbox (and spam folder) to activate your account
                  before logging in.
                </p>
              </div>
              <div className="pt-4 border-t border-border/20">
                <Button
                  asChild
                  className="w-full bg-primary hover:bg-primary/95 text-white"
                >
                  <Link to="/admin/login">Return to Login</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Logo & Header */}
              <div className="text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.15)]">
                  <FolderGit2 className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  Create Your Account
                </h2>
                <p className="text-sm text-muted-foreground">
                  Join ProjectVault to submit your innovations or follow
                  collegiate creations.
                </p>
              </div>

              {/* Role Switcher Tabs */}
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-border/40">
                <button
                  type="button"
                  onClick={() => {
                    setRole("student");
                    setError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                    role === "student"
                      ? "bg-primary text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  Student Owner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole("visitor");
                    setError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                    role === "visitor"
                      ? "bg-primary text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className="h-4 w-4" />
                  Visitor / Inquirer
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3.5 flex items-start gap-2.5 text-sm text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-black/40 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      placeholder="jane.doe@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-border bg-black/40 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Student specific fields */}
                {role === "student" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Student ID */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Student ID *
                      </label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          placeholder="CS-2026-89"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          className="w-full rounded-lg border border-border bg-black/40 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                    </div>

                    {/* Department */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Department *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          placeholder="Computer Science"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full rounded-lg border border-border bg-black/40 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Password and Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
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

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-border bg-black/40 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground leading-normal">
                  Password must be at least 8 characters and contain uppercase,
                  lowercase, numbers, and special characters.
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
                      Creating account...
                    </>
                  ) : (
                    "Register & Verify Email"
                  )}
                </Button>
              </form>

              {/* Login redirection */}
              <div className="text-center text-xs text-muted-foreground border-t border-border/30 pt-4">
                Already have an account?{" "}
                <Link
                  to="/admin/login"
                  className="text-primary hover:underline font-semibold"
                >
                  Sign In
                </Link>
              </div>
            </>
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
