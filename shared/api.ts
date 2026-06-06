/**
 * Shared API interfaces for ProjectVault
 */

export interface Project {
  _id: string;
  title: string;
  category: string;
  description: string;
  technologies: string[];
  teamMembers: string[];
  githubLink: string;
  liveLink?: string;
  image: string; // Uploaded file path or public image url
  featured?: boolean;
  ownerId?: string; // Reference to User
  status: "pending" | "approved" | "rejected";
  subscribers?: string[]; // Array of User IDs
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectInput {
  title: string;
  category: string;
  description: string;
  technologies: string[];
  teamMembers: string[];
  githubLink: string;
  liveLink?: string;
  image?: string;
  featured?: boolean;
  ownerId?: string;
  status?: "pending" | "approved" | "rejected";
}

export interface Category {
  _id: string;
  name: string;
}

export interface User {
  _id: string;
  username?: string;
  email: string;
  role: "admin" | "student" | "visitor";
  name: string;
  studentId?: string;
  department?: string;
  isVerified: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  id: string;
  username?: string;
  email: string;
  role: "admin" | "student" | "visitor";
  name: string;
  isVerified: boolean;
}
