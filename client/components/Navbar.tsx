import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FolderGit2,
  LayoutDashboard,
  LogOut,
  LogIn,
  Menu,
  X,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLoggedIn, logout, getUserRole, getUserName } from "@/lib/auth";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogged, setIsLogged] = useState(isLoggedIn());
  const [userRole, setUserRole] = useState(getUserRole());
  const [userName, setUserName] = useState(getUserName());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLogged(isLoggedIn());
      setUserRole(getUserRole());
      setUserName(getUserName());
    };

    window.addEventListener("auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  // Badge mapping for roles
  const getRoleBadgeLabel = () => {
    if (userRole === "admin") return "Admin";
    if (userRole === "student") return "Student";
    if (userRole === "visitor") return "Visitor";
    return "";
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl text-foreground group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                <FolderGit2 className="h-5 w-5" />
              </div>
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent transition-all">
                ProjectVault
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/")
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              Explore Projects
            </Link>

            {isLogged ? (
              <div className="flex items-center gap-4">
                {userRole !== "visitor" && (
                  <Link
                    to="/admin/dashboard"
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                      isActive("/admin/dashboard")
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                )}
                <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
                  {getRoleBadgeLabel()}:{" "}
                  <strong className="text-foreground">{userName}</strong>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <Link to="/register">
                    <UserPlus className="h-4 w-4" />
                    Register
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <Link to="/admin/login">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-lg px-4 py-4 space-y-3">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block py-2 text-base font-medium rounded-md px-3 transition-colors ${
              isActive("/")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            Explore Projects
          </Link>

          {isLogged ? (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="px-3 py-1.5 text-xs text-muted-foreground">
                Logged in as ({getRoleBadgeLabel()}):{" "}
                <strong className="text-foreground">{userName}</strong>
              </div>
              {userRole !== "visitor" && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 py-2 text-base font-medium rounded-md px-3 transition-colors ${
                    isActive("/admin/dashboard")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 py-2 text-base font-medium rounded-md px-3 text-destructive hover:bg-destructive/10 transition-colors text-left"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-border/40 space-y-2">
              <Button
                asChild
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <Link
                  to="/admin/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="w-full flex items-center justify-center gap-2 border border-border/40"
              >
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <UserPlus className="h-4 w-4" />
                  Register Account
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
