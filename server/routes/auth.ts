import { Router, RequestHandler, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { User } from "../models";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";
import { sendVerificationEmail } from "../services/email";

const router = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "projectvault_secret_token_key_123";

// Rate limiters for security
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per window
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registrations per hour
  message: {
    message:
      "Too many accounts created from this IP. Please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password strength validator helper
const isPasswordStrong = (password: string): boolean => {
  if (password.length < 8) return false;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);
  return hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas;
};

// POST /api/auth/register - Register Student or Visitor
const handleRegister: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { name, email, password, role, studentId, department } = req.body;

    if (!name || !email || !password || !role) {
      res
        .status(400)
        .json({ message: "Name, email, password, and role are required." });
      return;
    }

    // Restrict role to student or visitor only
    if (role !== "student" && role !== "visitor") {
      res.status(400).json({ message: "Invalid user role registration." });
      return;
    }

    const emailTrimmed = email.toLowerCase().trim();

    // Email regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      res
        .status(400)
        .json({ message: "Please provide a valid email address." });
      return;
    }

    // Password strength check
    if (!isPasswordStrong(password)) {
      res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.",
      });
      return;
    }

    // Role specific validation
    if (role === "student" && (!studentId || !department)) {
      res
        .status(400)
        .json({
          message:
            "Student ID and department are required for student accounts.",
        });
      return;
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: emailTrimmed });
    if (userExists) {
      res
        .status(400)
        .json({
          message: "An account with this email address already exists.",
        });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      name,
      email: emailTrimmed,
      password: hashedPassword,
      role,
      studentId: role === "student" ? studentId.trim() : undefined,
      department: role === "student" ? department.trim() : undefined,
      isVerified: false,
      verificationToken,
    });

    await newUser.save();

    // Send verification email
    await sendVerificationEmail(newUser.email, newUser.name, verificationToken);

    res.status(201).json({
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "An error occurred during registration." });
  }
};

// GET /api/auth/verify-email - Verify Email Token
const handleVerifyEmail: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token) {
      res.status(400).json({ message: "Verification token is required." });
      return;
    }

    const user = await User.findOne({ verificationToken: String(token) });
    if (!user) {
      res
        .status(400)
        .json({ message: "Invalid or expired verification token." });
      return;
    }

    user.isVerified = true;
    user.verificationToken = ""; // Clear token
    await user.save();

    res
      .status(200)
      .json({ message: "Account verified successfully! You can now log in." });
  } catch (error) {
    console.error("Email verification error:", error);
    res
      .status(500)
      .json({ message: "An error occurred during email verification." });
  }
};

// POST /api/auth/resend-verification - Resend verification code
const handleResendVerification: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required." });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(404).json({ message: "Account not found." });
      return;
    }

    if (user.isVerified) {
      res
        .status(400)
        .json({ message: "This account has already been verified." });
      return;
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    // Send email
    await sendVerificationEmail(user.email, user.name, verificationToken);

    res
      .status(200)
      .json({ message: "Verification email resent successfully." });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Failed to resend verification email." });
  }
};

// POST /api/auth/login - Unified User Login
const handleLogin: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { email, username, password } = req.body;

    const identifier = email || username;

    if (!identifier || !password) {
      res
        .status(400)
        .json({ message: "Email or username and password are required." });
      return;
    }

    // Search user by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { username: identifier.trim() },
      ],
    });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials." });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials." });
      return;
    }

    // Verify status (isVerified must be true for non-admins)
    if (user.role !== "admin" && !user.isVerified) {
      res.status(403).json({
        message:
          "Your account email is not verified. Please verify your email before logging in.",
        unverified: true,
        email: user.email,
      });
      return;
    }

    // Generate JWT token (expires in 24 hours)
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        username: user.username || "",
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(200).json({
      token,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      username: user.username,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "An error occurred during login." });
  }
};

// GET /api/auth/verify - Verify JWT token status
const handleVerify: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(401).json({ message: "User session not found." });
      return;
    }

    res.status(200).json({
      valid: true,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      username: user.username,
      isVerified: user.isVerified,
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid session." });
  }
};

// PUT /api/auth/update-credentials - Change Name/Username/Password
const handleUpdateCredentials: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { currentPassword, newName, newUsername, newPassword } = req.body;

    if (!currentPassword) {
      res
        .status(400)
        .json({ message: "Current password is required to verify identity." });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "User account not found." });
      return;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Incorrect current password." });
      return;
    }

    // Update name
    if (newName && newName.trim() !== "") {
      user.name = newName.trim();
    }

    // Update username if provided (mostly for admin updates)
    if (newUsername && newUsername.trim() !== "") {
      const trimmedUsername = newUsername.trim();
      if (trimmedUsername !== user.username) {
        const exists = await User.findOne({
          username: trimmedUsername,
          _id: { $ne: user._id },
        });
        if (exists) {
          res.status(400).json({ message: "Username already taken." });
          return;
        }
        user.username = trimmedUsername;
      }
    }

    // Update password if provided
    if (newPassword && newPassword.trim() !== "") {
      if (!isPasswordStrong(newPassword)) {
        res.status(400).json({
          message:
            "New password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.",
        });
        return;
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    res.status(200).json({
      message: "Credentials updated successfully.",
      name: user.name,
      username: user.username,
    });
  } catch (error) {
    console.error("Update credentials error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating credentials." });
  }
};

router.post("/register", registerLimiter, handleRegister);
router.get("/verify-email", handleVerifyEmail);
router.post("/resend-verification", handleResendVerification);
router.post("/login", loginLimiter, handleLogin);
router.get("/verify", authenticateJWT, handleVerify);
router.put("/update-credentials", authenticateJWT, handleUpdateCredentials);

export default router;
