import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Github,
  ExternalLink,
  Users,
  Calendar,
  Code,
  AlertCircle,
  Edit,
  BookOpen,
  Star,
  MailCheck,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Project } from "@shared/api";
import {
  isLoggedIn,
  getUserRole,
  getAuthUser,
  getAuthHeaders,
} from "@/lib/auth";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // States
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth states
  const [isLogged, setIsLogged] = useState(isLoggedIn());
  const [userRole, setUserRole] = useState(getUserRole());
  const [authUser, setAuthUser] = useState(getAuthUser());

  // Visitor interaction states
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Inquiry form states
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquirySubject, setInquirySubject] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      setIsLogged(isLoggedIn());
      setUserRole(getUserRole());
      setAuthUser(getAuthUser());
    };
    window.addEventListener("auth-change", checkAuth);
    return () => window.removeEventListener("auth-change", checkAuth);
  }, []);

  const fetchProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access Denied: This project is pending review.");
        }
        throw new Error("Project not found");
      }
      const data: Project = await res.json();
      setProject(data);

      // Determine if logged in visitor is subscribed
      if (authUser && data.subscribers) {
        setIsSubscribed(data.subscribers.includes(authUser.id));
      }
    } catch (err: any) {
      console.error("Error fetching project:", err);
      setError(err.message || "Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProject();
  }, [id, authUser?.id]);

  // Subscribe / Unsubscribe toggle
  const handleToggleSubscribe = async () => {
    if (!isLogged || userRole !== "visitor" || subscribing) return;

    setSubscribing(true);
    const endpoint = `/api/projects/${id}/${isSubscribed ? "unsubscribe" : "subscribe"}`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Subscription update failed.");
      }

      setIsSubscribed(!isSubscribed);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred with project subscription.");
    } finally {
      setSubscribing(false);
    }
  };

  // Send inquiry handler
  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquirySubject.trim() || !inquiryMessage.trim()) return;

    setInquirySending(true);
    setInquirySuccess(null);
    setInquiryError(null);

    try {
      const res = await fetch(`/api/projects/${id}/inquire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          subject: inquirySubject.trim(),
          message: inquiryMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send inquiry.");
      }

      setInquirySuccess(
        "Your inquiry was sent successfully to the project team!",
      );
      setInquirySubject("");
      setInquiryMessage("");
      setTimeout(() => {
        setIsInquiryModalOpen(false);
        setInquirySuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setInquiryError(
        err.message || "An error occurred while sending your inquiry.",
      );
    } finally {
      setInquirySending(false);
    }
  };

  // Helper flags
  const isOwner = authUser && project && project.ownerId === authUser.id;
  const isAdmin = userRole === "admin";
  const canEdit = isAdmin || isOwner;
  const isVisitor = userRole === "visitor";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-foreground flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading project details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#09090b] text-foreground flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center border border-destructive/20 rounded-2xl bg-destructive/5 p-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">
              Failed to Load Project
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {error || "The project you are looking for does not exist."}
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Showcase
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Back navigation & Edit options */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
            Back to projects
          </button>

          {canEdit && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 border-primary/20 hover:border-primary/50 text-primary"
            >
              <Link
                to="/admin/dashboard"
                state={{ editProjectId: project._id }}
              >
                <Edit className="h-4 w-4" />
                Edit Project
              </Link>
            </Button>
          )}
        </div>

        {/* Project Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
              {project.category}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {project.title}
            </h1>
          </div>

          {/* Status Badge (if student owner or admin viewing pending/rejected project) */}
          {project.status !== "approved" && (
            <div className="self-start sm:self-center">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase border ${
                  project.status === "pending"
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/25"
                    : "bg-red-500/10 text-red-400 border-red-500/25"
                }`}
              >
                {project.status} Submision
              </span>
            </div>
          )}
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Image and Description */}
          <div className="lg:col-span-2 space-y-8">
            {/* Screenshot Container */}
            <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-zinc-950/40 backdrop-blur-md aspect-[16/10] shadow-2xl">
              {project.image ? (
                <img
                  src={project.image}
                  alt={project.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-violet-600/20 to-indigo-900/30 flex flex-col items-center justify-center p-8 text-center border border-white/5">
                  <BookOpen className="h-20 w-20 text-white/20 mb-4" />
                  <p className="text-muted-foreground text-sm font-medium">
                    No screenshot available for this project
                  </p>
                </div>
              )}
            </div>

            {/* Project Description */}
            <div className="bg-card/30 border border-border/40 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4 text-foreground">
                Project Description
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          </div>

          {/* Right Column: Metadata Sidebar */}
          <div className="space-y-6">
            {/* Visitor Actions Card */}
            {isLogged && isVisitor && (
              <div className="bg-card/40 border border-border/40 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Visitor Actions
                </h3>

                {/* Subscription Action */}
                <Button
                  onClick={handleToggleSubscribe}
                  disabled={subscribing}
                  variant={isSubscribed ? "secondary" : "outline"}
                  className="w-full flex justify-center items-center gap-2 text-sm"
                >
                  <Star
                    className={`h-4.5 w-4.5 ${isSubscribed ? "fill-yellow-400 text-yellow-400" : ""}`}
                  />
                  {isSubscribed
                    ? "Subscribed to Updates"
                    : "Subscribe to Updates"}
                </Button>

                {/* Inquiry Action */}
                <Button
                  onClick={() => setIsInquiryModalOpen(true)}
                  className="w-full flex justify-center items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm"
                >
                  <MailCheck className="h-4.5 w-4.5" />
                  Send Team Inquiry
                </Button>
              </div>
            )}

            {/* Quick Links Card */}
            <div className="bg-card/40 border border-border/40 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Project Resources
              </h3>

              {project.githubLink && (
                <Button
                  asChild
                  className="w-full flex justify-center items-center gap-2"
                  variant="outline"
                >
                  <a
                    href={project.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4" />
                    Source Code (GitHub)
                  </a>
                </Button>
              )}

              {project.liveLink ? (
                <Button
                  asChild
                  className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary/95 text-white"
                >
                  <a
                    href={project.liveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Launch Live Demo
                  </a>
                </Button>
              ) : (
                <div className="text-xs text-center text-muted-foreground bg-zinc-900/50 py-3 rounded-lg border border-border/30">
                  No live deployment available
                </div>
              )}
            </div>

            {/* Team Members Card */}
            <div className="bg-card/40 border border-border/40 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Members
              </h3>
              <div className="space-y-3">
                {project.teamMembers.map((member, i) => (
                  <div key={member} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-violet-600/20 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                      {member
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {member}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Stack Card */}
            <div className="bg-card/40 border border-border/40 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded bg-secondary/80 border border-border/40 px-3 py-1 text-xs font-semibold text-foreground tracking-wide"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Timestamps Card */}
            {project.createdAt && (
              <div className="bg-card/20 border border-border/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-muted-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Published on:{" "}
                  {new Date(project.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          VISITOR INQUIRY MODAL
          ======================================================== */}
      {isInquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-card border border-border/50 rounded-2xl p-6 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/20 pb-4">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
                <MailCheck className="h-5 w-5 text-primary" />
                Send Inquiry to Project Team
              </h2>
              <button
                onClick={() => setIsInquiryModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            {inquirySuccess ? (
              <div className="text-center space-y-4 py-8">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Inquiry Dispatched
                </h3>
                <p className="text-xs text-muted-foreground px-4">
                  {inquirySuccess}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                {inquiryError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{inquiryError}</span>
                  </div>
                )}

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Question about your Socket.io setup"
                    value={inquirySubject}
                    onChange={(e) => setInquirySubject(e.target.value)}
                    className="w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Message Details *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe your inquiry, request, or feedback for the student owners..."
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    className="w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none resize-y"
                  />
                </div>

                {/* Note */}
                <div className="text-[10px] text-muted-foreground bg-zinc-950 p-2.5 rounded border border-border/40">
                  Submitting this inquiry will immediately notify the student
                  owner(s) via email. Your registered email address (
                  <strong className="text-foreground">{authUser?.email}</strong>
                  ) will be shared so they can reply directly.
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsInquiryModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={inquirySending}
                    size="sm"
                    className="bg-primary hover:bg-primary/95 text-white"
                  >
                    {inquirySending ? "Sending..." : "Submit Inquiry"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border/20 bg-card/20 mt-20 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} ProjectVault Showcase Portal.
            Centralizing collegiate innovations.
          </p>
        </div>
      </footer>
    </div>
  );
}
