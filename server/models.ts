import mongoose, { Schema } from "mongoose";

// User Schema (Unified Admin, Student, Visitor)
const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    username: { type: String, trim: true }, // Optional, mostly for admin
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "student", "visitor"],
      default: "visitor",
    },

    // Student specific fields
    studentId: { type: String, trim: true },
    department: { type: String, trim: true },

    // Verification & Security
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: "" },
    resetPasswordToken: { type: String, default: "" },
    resetPasswordExpires: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// Project Schema
const ProjectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    technologies: { type: [String], required: true },
    teamMembers: { type: [String], required: true },
    githubLink: { type: String, required: true, trim: true },
    liveLink: { type: String, trim: true, default: "" },
    image: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    subscribers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
    collection: "projects",
  },
);

// Category Schema
const CategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  {
    timestamps: true,
    collection: "categories",
  },
);

// Inquiry Schema
const InquirySchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    visitorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "inquiries",
  },
);

export const User = mongoose.model("User", UserSchema);
export const Project = mongoose.model("Project", ProjectSchema);
export const Category = mongoose.model("Category", CategorySchema);
export const Inquiry = mongoose.model("Inquiry", InquirySchema);
export const Admin = User; // For backward compatibility or safe references during transition
