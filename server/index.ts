import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { connectDB } from "./db";
import authRouter from "./routes/auth";
import projectRouter from "./routes/projects";

export function createServer() {
  // Connect to MongoDB
  connectDB();

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Fallback Static uploads folder for production
  const uploadDir = path.join(__dirname, "../public/uploads");
  app.use("/uploads", express.static(uploadDir));

  // Registered API Routes
  app.use("/api/auth", authRouter);
  app.use("/api", projectRouter);

  // Ping endpoint
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  return app;
}
