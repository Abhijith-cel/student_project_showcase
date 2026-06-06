import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  FolderGit2,
  LayoutDashboard,
  ExternalLink,
  Sparkles,
  X,
  PlusCircle,
  Hash,
  AlertCircle,
  Search,
  CheckCircle,
  Settings,
  Check,
  Ban,
  Clock,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Project, Category, ProjectInput } from "@shared/api";
import {
  getAuthHeaders,
  isLoggedIn,
  getUserRole,
  getAuthUser,
  logout,
} from "@/lib/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auth User
  const [userRole, setUserRole] = useState(getUserRole());
  const [authUser, setAuthUser] = useState(getAuthUser());

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Rejection Notes Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingProjectId, setRejectingProjectId] = useState<string | null>(
    null,
  );
  const [rejectNotes, setRejectNotes] = useState("");

  // Category Manage section
  const [isManageCatOpen, setIsManageCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Account Settings section
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Search
  const [adminSearch, setAdminSearch] = useState("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [teamMembers, setTeamMembers] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [liveLink, setLiveLink] = useState("");
  const [featured, setFeatured] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/admin/login");
      return;
    }
    const role = getUserRole();
    if (role === "visitor") {
      navigate("/");
    }
  }, [navigate]);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const projRes = await fetch("/api/projects", {
        headers: getAuthHeaders(),
      });
      const catRes = await fetch("/api/categories");

      if (projRes.ok && catRes.ok) {
        const projData = await projRes.json();
        const catData = await catRes.json();
        setProjects(projData);
        setCategories(catData);

        // Check if redirecting from single project details to edit
        const state = location.state as { editProjectId?: string };
        if (state?.editProjectId) {
          const editProj = projData.find(
            (p: Project) => p._id === state.editProjectId,
          );
          if (editProj) {
            handleOpenEditModal(editProj);
          }
          // Clear history state
          window.history.replaceState({}, document.title);
        }
      } else {
        throw new Error("Failed to load dashboard data");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Clear notifications
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Modal actions
  const handleOpenAddModal = () => {
    setEditingProject(null);
    setTitle("");
    setCategory(categories[0]?.name || "");
    setDescription("");
    setTechnologies("");
    setTeamMembers("");
    setGithubLink("");
    setLiveLink("");
    setFeatured(false);
    setSelectedFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project);
    setTitle(project.title);
    setCategory(project.category);
    setDescription(project.description);
    setTechnologies(project.technologies.join(", "));
    setTeamMembers(project.teamMembers.join(", "));
    setGithubLink(project.githubLink);
    setLiveLink(project.liveLink || "");
    setFeatured(project.featured || false);
    setSelectedFile(null);
    setImagePreview(project.image || null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit project form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !description || !githubLink) {
      setError("Please fill out all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("technologies", technologies);
    formData.append("teamMembers", teamMembers);
    formData.append("githubLink", githubLink);
    formData.append("liveLink", liveLink);
    formData.append("featured", String(featured));

    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    try {
      let res;
      if (editingProject) {
        res = await fetch(`/api/projects/${editingProject._id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: formData,
        });
      } else {
        res = await fetch("/api/projects", {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save project.");
      }

      setSuccess(
        editingProject
          ? "Project updated successfully!"
          : userRole === "student"
            ? "Project submitted successfully for approval!"
            : "New project added successfully!",
      );
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while saving the project.");
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string, title: string) => {
    if (
      window.confirm(`Are you sure you want to delete project: "${title}"?`)
    ) {
      try {
        const res = await fetch(`/api/projects/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to delete project");
        }

        setSuccess("Project deleted successfully.");
        fetchData();
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to delete project");
      }
    }
  };

  // Approve Project
  const handleApproveProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}/approve`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Approval failed.");
      }

      setSuccess("Project approved successfully!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to approve project");
    }
  };

  // Open reject modal
  const handleOpenRejectModal = (id: string) => {
    setRejectingProjectId(id);
    setRejectNotes("");
    setIsRejectModalOpen(true);
  };

  // Submit project rejection
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingProjectId) return;

    try {
      const res = await fetch(`/api/projects/${rejectingProjectId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ notes: rejectNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Rejection failed.");
      }

      setSuccess("Project reviewed & rejection notification dispatched.");
      setIsRejectModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to reject project");
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name: newCatName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to add category");
      }

      setSuccess(`Category "${newCatName}" added.`);
      setNewCatName("");
      const catRes = await fetch("/api/categories");
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
        if (!category && catData.length > 0) {
          setCategory(catData[0].name);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add category");
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Delete category: "${name}"?`)) {
      try {
        const res = await fetch(`/api/categories/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to delete category");
        }

        setSuccess(`Category "${name}" deleted.`);
        const catRes = await fetch("/api/categories");
        if (catRes.ok) {
          setCategories(await catRes.json());
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to delete category");
      }
    }
  };

  // Update credentials
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      const res = await fetch("/api/auth/update-credentials", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          currentPassword,
          newName: newName.trim() || undefined,
          newUsername:
            userRole === "admin" && newUsername.trim()
              ? newUsername.trim()
              : undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update credentials");
      }

      setSuccess("Account settings updated successfully!");

      // Update local storage user info
      const currentAuthUser = getAuthUser();
      if (currentAuthUser) {
        currentAuthUser.name = data.name || currentAuthUser.name;
        if (userRole === "admin" && data.username) {
          currentAuthUser.username = data.username;
        }
        localStorage.setItem("authUser", JSON.stringify(currentAuthUser));
        window.dispatchEvent(new Event("auth-change"));
      }

      // Reset states
      setCurrentPassword("");
      setNewName("");
      setNewUsername("");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsSettingsOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update credentials");
    }
  };

  // Filter projects by search and role
  const getFilteredDashboardProjects = () => {
    const term = adminSearch.toLowerCase();

    // First, filter by role
    let roleFiltered = projects;
    if (userRole === "student" && authUser) {
      roleFiltered = projects.filter((p) => p.ownerId === authUser.id);
    }

    // Then, filter by search query
    return roleFiltered.filter((p) => {
      return (
        p.title.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.technologies.some((t) => t.toLowerCase().includes(term))
      );
    });
  };

  const filteredProjects = getFilteredDashboardProjects();
  const isAdmin = userRole === "admin";
  const isStudent = userRole === "student";

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/20 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              <LayoutDashboard className="h-7 w-7 text-primary" />
              {isAdmin ? "Admin Controls Dashboard" : "Student Owner Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin
                ? "Moderate submissions, manage categories, and audit student projects."
                : "Submit new collegiate projects, check review status, and edit details."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              onClick={() => setIsSettingsOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1.5 border-border/50 hover:bg-secondary/40"
            >
              <Settings className="h-4 w-4 text-violet-400" />
              Account Settings
            </Button>

            {isAdmin && (
              <Button
                onClick={() => setIsManageCatOpen(true)}
                variant="outline"
                size="sm"
                className="gap-1.5 border-border/50 hover:bg-secondary/40"
              >
                <Hash className="h-4 w-4 text-violet-400" />
                Manage Categories
              </Button>
            )}

            <Button
              onClick={handleOpenAddModal}
              size="sm"
              className="gap-1.5 bg-primary hover:bg-primary/95 text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.25)]"
            >
              <Plus className="h-4 w-4" />
              {isStudent ? "Submit Project" : "Add Project"}
            </Button>
          </div>
        </div>

        {/* Global Notifications */}
        {success && (
          <div className="mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3 text-sm text-emerald-400 transition-all duration-300">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3 text-sm text-destructive transition-all duration-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-card/30 border border-border/40 rounded-xl p-5 backdrop-blur-md">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isStudent ? "Your Submissions" : "Total Submissions"}
            </p>
            <p className="text-3xl font-extrabold text-foreground mt-2">
              {filteredProjects.length}
            </p>
          </div>
          <div className="bg-card/30 border border-border/40 rounded-xl p-5 backdrop-blur-md">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isStudent ? "Approved Projects" : "Featured Listings"}
            </p>
            <p className="text-3xl font-extrabold text-primary mt-2">
              {isStudent
                ? filteredProjects.filter((p) => p.status === "approved").length
                : filteredProjects.filter((p) => p.featured).length}
            </p>
          </div>
          <div className="bg-card/30 border border-border/40 rounded-xl p-5 backdrop-blur-md">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isStudent ? "Pending Review" : "Pending Approvals"}
            </p>
            <p className="text-3xl font-extrabold text-yellow-400 mt-2">
              {filteredProjects.filter((p) => p.status === "pending").length}
            </p>
          </div>
        </div>

        {/* Projects Control Bar & List Table */}
        <div className="bg-card/20 border border-border/40 rounded-2xl overflow-hidden backdrop-blur-md">
          {/* List Search Bar */}
          <div className="p-4 border-b border-border/30 bg-black/10 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={
                  isStudent
                    ? "Search your submissions..."
                    : "Search project database..."
                }
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-black/30 pl-9 pr-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Filtered: {filteredProjects.length} /{" "}
              {isStudent
                ? projects.filter((p) => p.ownerId === authUser?.id).length
                : projects.length}
            </span>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">
                Fetching records...
              </p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground text-sm">
              No project records found. Try adding a new listing!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    <th className="px-6 py-4">Project Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Team Size</th>
                    <th className="px-6 py-4">Approval Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredProjects.map((proj) => (
                    <tr
                      key={proj._id}
                      className="hover:bg-secondary/10 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex flex-col">
                          <span>{proj.title}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-xs md:max-w-md font-mono mt-0.5">
                            {proj.technologies.slice(0, 3).join(", ")}
                            {proj.technologies.length > 3 ? "..." : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {proj.category}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {proj.teamMembers.length} Members
                      </td>
                      <td className="px-6 py-4">
                        {proj.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                            <Check className="h-3 w-3" />
                            Approved
                          </span>
                        ) : proj.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-yellow-500/10 border border-yellow-500/25 px-2 py-0.5 text-xs font-semibold text-yellow-400">
                            <Clock className="h-3 w-3" />
                            Pending Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/25 px-2 py-0.5 text-xs font-semibold text-red-400">
                            <Ban className="h-3 w-3" />
                            Rejected
                          </span>
                        )}
                        {proj.featured && isAdmin && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-violet-500/10 border border-violet-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-violet-400">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1 sm:space-x-2">
                        {/* Approval / Rejection buttons for Admin */}
                        {isAdmin && proj.status === "pending" && (
                          <>
                            <Button
                              onClick={() => handleApproveProject(proj._id)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                              title="Approve Submission"
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleOpenRejectModal(proj._id)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                              title="Reject / Needs Work"
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        <Button
                          onClick={() => handleOpenEditModal(proj)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() =>
                            handleDeleteProject(proj._id, proj.title)
                          }
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================
          ADD/EDIT PROJECT MODAL
          ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/20 pb-4">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
                <FolderGit2 className="h-5 w-5 text-primary" />
                {editingProject
                  ? "Edit Showcase Project"
                  : isStudent
                    ? "Submit Project for Approval"
                    : "Add Showcase Project"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. StudySphere - Collaborative Study Portal"
                    className="w-full rounded-lg border border-border bg-black/30 px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Featured Checkbox (Admin Only) */}
                {isAdmin && (
                  <div className="flex items-center gap-2 border border-border bg-black/10 rounded-lg px-4 py-2 mt-4.5">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-border bg-black/40 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor="featured"
                      className="text-sm text-foreground font-semibold flex items-center gap-1 cursor-pointer select-none"
                    >
                      <Sparkles className="h-4 w-4 text-yellow-400" />
                      Feature this project on landing page
                    </label>
                  </div>
                )}

                {/* Description */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Detailed Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a detailed overview of the student project, what it solves, its key modules and structural architecture..."
                    className="w-full rounded-lg border border-border bg-black/30 px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none resize-y"
                  />
                </div>

                {/* Tech Stack */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Technologies (comma separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={technologies}
                    onChange={(e) => setTechnologies(e.target.value)}
                    placeholder="React, TypeScript, Express, MongoDB"
                    className="w-full rounded-lg border border-border bg-black/30 px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Team Members */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Team Members (comma separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={teamMembers}
                    onChange={(e) => setTeamMembers(e.target.value)}
                    placeholder="Aravind Kumar, Pooja Sharma"
                    className="w-full rounded-lg border border-border bg-black/30 px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {/* GitHub link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    GitHub Link *
                  </label>
                  <input
                    type="url"
                    required
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full rounded-lg border border-border bg-black/30 px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Live deployment link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Live Demo Link (optional)
                  </label>
                  <input
                    type="url"
                    value={liveLink}
                    onChange={(e) => setLiveLink(e.target.value)}
                    placeholder="https://project.example.com"
                    className="w-full rounded-lg border border-border bg-black/30 px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Image Upload Input */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Project Screenshot{" "}
                    {editingProject ? "(optional replace)" : ""}
                  </label>

                  <div className="flex flex-col sm:flex-row gap-4 items-center border border-dashed border-border/70 rounded-xl p-4 bg-black/10">
                    <div className="h-20 w-32 shrink-0 bg-zinc-950 border border-border rounded-lg overflow-hidden flex items-center justify-center">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-grow text-center sm:text-left space-y-1 w-full">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto"
                      >
                        Choose Screenshot File
                      </Button>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedFile
                          ? `Selected: ${selectedFile.name}`
                          : "Support PNG, JPEG, WEBP. Max 5MB."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/95 text-white"
                >
                  {editingProject
                    ? "Update Listing"
                    : isStudent
                      ? "Submit for Approval"
                      : "Publish Project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          ADMIN REJECT WITH NOTES MODAL
          ======================================================== */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-card border border-border/50 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/20 pb-4">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
                <Ban className="h-5 w-5 text-red-500" />
                Reject Submission notes
              </h2>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Reviewer Notes / Feedback (sent to student)
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Please update your github repository links or add more team members."
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRejectModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MANAGE CATEGORIES DRAWER/MODAL
          ======================================================== */}
      {isManageCatOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-card border border-border/50 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/20 pb-4">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
                <Hash className="h-5 w-5 text-primary" />
                Manage Portal Categories
              </h2>
              <button
                onClick={() => setIsManageCatOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="New Category Name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-grow rounded-lg border border-border bg-black/30 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-primary hover:bg-primary/95 text-white"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add
              </Button>
            </form>

            <div className="max-h-[30vh] overflow-y-auto space-y-2 pr-1 border border-border/20 rounded-lg p-2 bg-black/10">
              {categories.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-6">
                  No categories created yet.
                </div>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center justify-between bg-zinc-900 border border-border/30 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm text-foreground font-medium">
                      {cat.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(cat._id, cat.name)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsManageCatOpen(false)}
              >
                Close Manager
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ACCOUNT SETTINGS MODAL
          ======================================================== */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-card border border-border/50 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/20 pb-4">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
                <Settings className="h-5 w-5 text-primary" />
                Account Settings
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Verify identity with current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Display Name (optional)
                </label>
                <input
                  type="text"
                  placeholder={authUser?.name || "Enter new display name"}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* New Username (Admin Only) */}
              {isAdmin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    New Username (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank to keep current"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  New Password (optional)
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/95 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border/20 bg-card/20 mt-20 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} ProjectVault Portal. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
