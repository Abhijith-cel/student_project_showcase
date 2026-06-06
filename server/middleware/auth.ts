import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "projectvault_secret_token_key_123";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userUsername?: string;
  userEmail?: string;
  userRole?: "admin" | "student" | "visitor";

  // Backward compatibility fields
  adminId?: string;
  adminUsername?: string;
}

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: Access token missing" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username?: string;
      email: string;
      role: "admin" | "student" | "visitor";
    };
    req.userId = decoded.id;
    req.userUsername = decoded.username;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;

    // Set backward compatibility fields
    req.adminId = decoded.id;
    req.adminUsername = decoded.username || "";

    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

export const requireRole = (
  allowedRoles: ("admin" | "student" | "visitor")[],
) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      res
        .status(403)
        .json({ message: "Forbidden: Access denied for this user role." });
      return;
    }
    next();
  };
};
