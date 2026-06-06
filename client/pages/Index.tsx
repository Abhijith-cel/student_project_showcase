import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Github,
  ExternalLink,
  Users,
  Code,
  Sparkles,
  FilterX,
  BookOpen,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Project, Category } from "@shared/api";
import { getAuthHeaders } from "@/lib/auth";

// Fallback gradients if no project image is uploaded
const FALLBACK_GRADIENTS = [
  "from-violet-600/30 to-indigo-900/40",
  "from-blue-600/30 to-cyan-900/40",
  "from-emerald-600/30 to-teal-900/40",
  "from-fuchsia-600/30 to-pink-900/40",
  "from-rose-600/30 to-orange-900/40",
];

export default function Index() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);

  // Fetch categories and projects
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        let url = "/api/projects";
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (selectedCategory !== "All")
          params.append("category", selectedCategory);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const res = await fetch(url, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data);

          // Also set featured projects if we are showing all
          if (searchQuery === "" && selectedCategory === "All") {
            setFeaturedProjects(data.filter((p: Project) => p.featured));
          }
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchProjects();
    }, 300); // Debounce search calls

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground selection:bg-primary/30">
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/20 py-20 lg:py-28">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        {/* Glow effect */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[500px] h-[250px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-sm font-medium text-violet-400 mb-6 backdrop-blur-md">
            <Sparkles className="h-4 w-4" />
            Discover Academic Innovation
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Collegiate Student <br />
            <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Project Showcase
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Explore ProjectVault, the centralized hub where outstanding
            engineering and academic creations come to life. Filter by category,
            view technical specs, and inspect source repositories.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Projects Carousel/Grid */}
        {featuredProjects.length > 0 &&
          searchQuery === "" &&
          selectedCategory === "All" && (
            <div className="mb-16">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <h2 className="text-2xl font-bold tracking-tight">
                  Featured Projects
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {featuredProjects.map((project, idx) => {
                  const gradient =
                    FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length];
                  return (
                    <div
                      key={project._id}
                      className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/40 backdrop-blur-md transition-all duration-300 hover:border-violet-500/40 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] flex flex-col md:flex-row h-full min-h-[220px]"
                    >
                      {/* Left: Image / Fallback Gradient */}
                      <div className="relative w-full md:w-2/5 aspect-[4/3] md:aspect-auto overflow-hidden bg-zinc-950 flex-shrink-0">
                        {project.image ? (
                          <img
                            src={project.image}
                            alt={project.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className={`h-full w-full bg-gradient-to-br ${gradient} flex items-center justify-center p-6 text-center`}
                          >
                            <BookOpen className="h-10 w-10 text-white/50 mb-2 block mx-auto" />
                          </div>
                        )}
                        <span className="absolute left-3 top-3 rounded-full bg-violet-600 px-3 py-0.5 text-xs font-semibold text-white tracking-wide shadow-md">
                          FEATURED
                        </span>
                      </div>

                      {/* Right: Info */}
                      <div className="p-6 flex flex-col justify-between flex-grow">
                        <div>
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                            {project.category}
                          </span>
                          <h3 className="mt-2 text-xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                            <Link to={`/projects/${project._id}`}>
                              {project.title}
                            </Link>
                          </h3>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                            {project.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span>{project.teamMembers.length} Members</span>
                          </div>
                          <Link
                            to={`/projects/${project._id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            View Details
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 pb-6 border-b border-border/20">
          {/* Categories Horizontal Tabs */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                selectedCategory === "All"
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }`}
            >
              All Projects
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.name
                    ? "bg-primary text-white"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-border bg-card/60 pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading showcase projects...
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-card/20 max-w-lg mx-auto">
            <FilterX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No Projects Found</h3>
            <p className="text-sm text-muted-foreground mt-2 px-6">
              We couldn't find any projects matching "{searchQuery}" under
              category "{selectedCategory}". Try adjusting your filters.
            </p>
          </div>
        ) : (
          /* Projects Grid */
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-muted-foreground">
                Showing {projects.length}{" "}
                {projects.length === 1 ? "project" : "projects"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => {
                const gradient =
                  FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
                return (
                  <div
                    key={project._id}
                    className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border/40 bg-card/40 backdrop-blur-md transition-all duration-300 hover:border-violet-500/30 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(124,58,237,0.1)] h-full"
                  >
                    {/* Project Thumbnail */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
                      {project.image ? (
                        <img
                          src={project.image}
                          alt={project.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className={`h-full w-full bg-gradient-to-br ${gradient} flex items-center justify-center p-6 text-center`}
                        >
                          <Code className="h-12 w-12 text-white/40 mb-2 block mx-auto" />
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3 py-0.5 text-xs font-semibold text-zinc-300">
                        {project.category}
                      </span>
                    </div>

                    {/* Project Body */}
                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                          <Link to={`/projects/${project._id}`}>
                            {project.title}
                          </Link>
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      </div>

                      {/* Tech stack tags */}
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-1.5">
                          {project.technologies.slice(0, 4).map((tech) => (
                            <span
                              key={tech}
                              className="rounded bg-secondary/80 border border-border/30 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 tracking-wide"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.technologies.length > 4 && (
                            <span className="rounded bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                              +{project.technologies.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Project Footer */}
                    <div className="px-5 py-4 border-t border-border/30 bg-black/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{project.teamMembers.length} Members</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {project.githubLink && (
                          <a
                            href={project.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Github className="h-4 w-4" />
                          </a>
                        )}
                        <Link
                          to={`/projects/${project._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Details
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
