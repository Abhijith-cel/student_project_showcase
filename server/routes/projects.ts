import { Router, RequestHandler, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { Project, Category, User, Inquiry } from "../models";
import {
  authenticateJWT,
  requireRole,
  AuthenticatedRequest,
} from "../middleware/auth";
import {
  sendSubmissionNoticeToAdmins,
  sendProjectStatusNotification,
  sendInquiryNotification,
  sendProjectUpdateNotification,
} from "../services/email";

const router = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "projectvault_secret_token_key_123";

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
  fileFilter: (_req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, webp, gif) are allowed."));
  },
});

// Helper: Parse array fields (handles JSON arrays or comma-separated values)
const parseArray = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try {
    const parsed = JSON.parse(field);
    if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim());
  } catch (e) {
    // Treat as comma separated
  }
  return String(field)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

// ==========================================
// CATEGORIES CRUD ROUTING
// ==========================================

// GET /api/categories - Get all categories
const getCategories: RequestHandler = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

// POST /api/categories - Add a new category (Admin only)
const createCategory: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      res.status(400).json({ message: "Category name is required" });
      return;
    }

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) {
      res.status(400).json({ message: "Category already exists" });
      return;
    }

    const newCategory = new Category({ name: name.trim() });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: "Failed to create category" });
  }
};

// DELETE /api/categories/:id - Delete a category (Admin only)
const deleteCategory: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete category" });
  }
};

router.get("/categories", getCategories);
router.post(
  "/categories",
  authenticateJWT,
  requireRole(["admin"]),
  createCategory,
);
router.delete(
  "/categories/:id",
  authenticateJWT,
  requireRole(["admin"]),
  deleteCategory,
);

// ==========================================
// PROJECTS CRUD ROUTING
// ==========================================

// GET /api/projects - Get projects with search, filter, and featured queries (RBAC filtered)
const getProjects: RequestHandler = async (req, res) => {
  try {
    const { search, category, featured, status } = req.query;

    // Optional Auth Parsing inside route to avoid blocking anonymous users
    let userId: string | undefined;
    let userRole: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.id;
        userRole = decoded.role;
      } catch (e) {
        // ignore invalid token for optional checks
      }
    }

    const query: any = {};

    if (category) {
      query.category = String(category);
    }

    if (featured === "true") {
      query.featured = true;
    }

    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { technologies: { $in: [searchRegex] } },
      ];
    }

    // Role-based status filtering
    if (userRole === "admin") {
      // Admins can see all projects or filter by requested status
      if (status) {
        query.status = String(status);
      }
    } else if (userRole === "student" && userId) {
      // Students can see all approved projects + their own submissions (pending/rejected/approved)
      if (status) {
        query.status = String(status);
        if (status !== "approved") {
          query.ownerId = userId;
        }
      } else {
        query.$or = [{ status: "approved" }, { ownerId: userId }];
      }
    } else {
      // Visitors / Anonymous users can ONLY see approved projects
      query.status = "approved";
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

// GET /api/projects/:id - Get a single project details (RBAC filtered)
const getProjectById: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    // Optional Auth Parsing
    let userId: string | undefined;
    let userRole: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.id;
        userRole = decoded.role;
      } catch (e) {
        // ignore
      }
    }

    // If project is not approved, only Admin or the Student owner can view it
    if (project.status !== "approved") {
      const isOwner =
        userId && project.ownerId && project.ownerId.toString() === userId;
      const isAdmin = userRole === "admin";

      if (!isAdmin && !isOwner) {
        res
          .status(403)
          .json({
            message: "Access denied. This project is not approved yet.",
          });
        return;
      }
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch project details" });
  }
};

// POST /api/projects - Create a new project (Student / Admin)
const createProject: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      title,
      category,
      description,
      technologies,
      teamMembers,
      githubLink,
      liveLink,
      featured,
    } = req.body;

    if (!title || !category || !description || !githubLink) {
      res.status(400).json({ message: "Missing required project fields" });
      return;
    }

    let imagePath = "";
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const isStudent = req.userRole === "student";
    const isAdmin = req.userRole === "admin";

    const newProject = new Project({
      title,
      category,
      description,
      technologies: parseArray(technologies),
      teamMembers: parseArray(teamMembers),
      githubLink,
      liveLink: liveLink || "",
      image: imagePath,
      // Students cannot set featured to true
      featured: isAdmin ? featured === "true" || featured === true : false,
      ownerId: req.userId,
      // Students start as pending, Admins are auto-approved
      status: isAdmin ? "approved" : "pending",
    });

    await newProject.save();

    // If student, notify admins by email
    if (isStudent) {
      try {
        const admins = await User.find({ role: "admin" });
        const adminEmails = admins.map((a) => a.email);
        const student = await User.findById(req.userId);
        if (adminEmails.length > 0 && student) {
          await sendSubmissionNoticeToAdmins(
            adminEmails,
            student.name,
            newProject.title,
          );
        }
      } catch (err) {
        console.error(
          "Failed to send admin submission notification email:",
          err,
        );
      }
    }

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Failed to create project:", error);
    res.status(500).json({ message: "Failed to create project" });
  }
};

// PUT /api/projects/:id - Update an existing project (Student Owner / Admin)
const updateProject: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      description,
      technologies,
      teamMembers,
      githubLink,
      liveLink,
      featured,
    } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const isOwner =
      req.userId &&
      project.ownerId &&
      project.ownerId.toString() === req.userId;
    const isAdmin = req.userRole === "admin";

    if (!isAdmin && !isOwner) {
      res
        .status(403)
        .json({ message: "Access denied: You do not own this project." });
      return;
    }

    let imagePath = project.image;
    if (req.file) {
      // Delete old image file
      if (project.image && project.image.startsWith("/uploads/")) {
        const oldPath = path.join(__dirname, "../../public", project.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      imagePath = `/uploads/${req.file.filename}`;
    }

    project.title = title || project.title;
    project.category = category || project.category;
    project.description = description || project.description;
    project.githubLink = githubLink || project.githubLink;
    project.liveLink = liveLink !== undefined ? liveLink : project.liveLink;
    project.image = imagePath;

    // Only admin can feature
    if (isAdmin) {
      project.featured =
        featured !== undefined
          ? featured === "true" || featured === true
          : project.featured;
    }

    if (technologies) {
      project.technologies = parseArray(technologies);
    }
    if (teamMembers) {
      project.teamMembers = parseArray(teamMembers);
    }

    const oldStatus = project.status;

    // If student edits, reset to pending (requires re-approval)
    if (!isAdmin) {
      project.status = "pending";
    }

    await project.save();

    // Trigger update notification to subscribers if the project was and remains approved
    if (
      oldStatus === "approved" &&
      project.status === "approved" &&
      project.subscribers &&
      project.subscribers.length > 0
    ) {
      try {
        const subscribers = await User.find({
          _id: { $in: project.subscribers },
        });
        for (const sub of subscribers) {
          await sendProjectUpdateNotification(
            sub.email,
            sub.name,
            project.title,
            project._id.toString(),
          );
        }
      } catch (err) {
        console.error("Failed to notify subscribers of project update:", err);
      }
    }

    res.status(200).json(project);
  } catch (error) {
    console.error("Failed to update project:", error);
    res.status(500).json({ message: "Failed to update project" });
  }
};

// DELETE /api/projects/:id - Delete a project (Student Owner / Admin)
const deleteProject: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const isOwner =
      req.userId &&
      project.ownerId &&
      project.ownerId.toString() === req.userId;
    const isAdmin = req.userRole === "admin";

    if (!isAdmin && !isOwner) {
      res
        .status(403)
        .json({ message: "Access denied: You do not own this project." });
      return;
    }

    // Delete image file from disk
    if (project.image && project.image.startsWith("/uploads/")) {
      const oldPath = path.join(__dirname, "../../public", project.image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await Project.findByIdAndDelete(id);
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete project" });
  }
};

// ==========================================
// ADMIN APPROVAL ENDPOINTS
// ==========================================

// POST /api/projects/:id/approve - Approve project (Admin only)
const approveProject: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    project.status = "approved";
    await project.save();

    // Notify owner student
    if (project.ownerId) {
      try {
        const student = await User.findById(project.ownerId);
        if (student) {
          await sendProjectStatusNotification(
            student.email,
            student.name,
            project.title,
            "approved",
          );
        }
      } catch (err) {
        console.error("Failed to notify student of project approval:", err);
      }
    }

    res
      .status(200)
      .json({ message: "Project approved successfully.", project });
  } catch (error) {
    res.status(500).json({ message: "Failed to approve project" });
  }
};

// POST /api/projects/:id/reject - Reject project (Admin only)
const rejectProject: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    project.status = "rejected";
    await project.save();

    // Notify owner student
    if (project.ownerId) {
      try {
        const student = await User.findById(project.ownerId);
        if (student) {
          await sendProjectStatusNotification(
            student.email,
            student.name,
            project.title,
            "rejected",
            notes,
          );
        }
      } catch (err) {
        console.error("Failed to notify student of project rejection:", err);
      }
    }

    res
      .status(200)
      .json({ message: "Project rejected successfully.", project });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject project" });
  }
};

// ==========================================
// VISITOR ENGAGEMENT ENDPOINTS
// ==========================================

// POST /api/projects/:id/subscribe - Subscribe to project updates (Visitor only)
const subscribeProject: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const userIdObj = req.userId as any;
    if (project.subscribers.includes(userIdObj)) {
      res.status(400).json({ message: "Already subscribed to this project." });
      return;
    }

    project.subscribers.push(userIdObj);
    await project.save();

    res
      .status(200)
      .json({
        message: "Subscribed to project updates successfully.",
        project,
      });
  } catch (error) {
    res.status(500).json({ message: "Failed to subscribe to updates." });
  }
};

// POST /api/projects/:id/unsubscribe - Unsubscribe from project updates (Visitor only)
const unsubscribeProject: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const userIdStr = String(req.userId);
    project.subscribers = project.subscribers.filter(
      (s) => String(s) !== userIdStr,
    );
    await project.save();

    res
      .status(200)
      .json({
        message: "Unsubscribed from project updates successfully.",
        project,
      });
  } catch (error) {
    res.status(500).json({ message: "Failed to unsubscribe from updates." });
  }
};

// POST /api/projects/:id/inquire - Send an inquiry message to the project owner (Visitor only)
const inquireProject: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
      res.status(400).json({ message: "Subject and message are required." });
      return;
    }

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const visitor = await User.findById(req.userId);
    if (!visitor) {
      res.status(404).json({ message: "Visitor account not found." });
      return;
    }

    // Save inquiry to DB
    const newInquiry = new Inquiry({
      projectId: project._id,
      visitorId: req.userId,
      subject,
      message,
    });
    await newInquiry.save();

    // Send email alert to student owner
    if (project.ownerId) {
      const student = await User.findById(project.ownerId);
      if (student) {
        await sendInquiryNotification(
          student.email,
          student.name,
          project.title,
          visitor.name,
          visitor.email,
          subject,
          message,
        );
      }
    }

    res
      .status(201)
      .json({ message: "Inquiry sent successfully to the project owner." });
  } catch (error) {
    console.error("Failed to send inquiry:", error);
    res.status(500).json({ message: "Failed to send inquiry." });
  }
};

// Registered routes
router.get("/projects", getProjects);
router.get("/projects/:id", getProjectById);
router.post(
  "/projects",
  authenticateJWT,
  requireRole(["admin", "student"]),
  upload.single("image"),
  createProject,
);
router.put(
  "/projects/:id",
  authenticateJWT,
  requireRole(["admin", "student"]),
  upload.single("image"),
  updateProject,
);
router.delete(
  "/projects/:id",
  authenticateJWT,
  requireRole(["admin", "student"]),
  deleteProject,
);

// Admin approval routes
router.post(
  "/projects/:id/approve",
  authenticateJWT,
  requireRole(["admin"]),
  approveProject,
);
router.post(
  "/projects/:id/reject",
  authenticateJWT,
  requireRole(["admin"]),
  rejectProject,
);

// Visitor interaction routes
router.post(
  "/projects/:id/subscribe",
  authenticateJWT,
  requireRole(["visitor"]),
  subscribeProject,
);
router.post(
  "/projects/:id/unsubscribe",
  authenticateJWT,
  requireRole(["visitor"]),
  unsubscribeProject,
);
router.post(
  "/projects/:id/inquire",
  authenticateJWT,
  requireRole(["visitor"]),
  inquireProject,
);

export default router;
