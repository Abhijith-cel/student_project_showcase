import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import { User, Project, Category } from "./models";

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log("Seeding database...");

    // 1. Seed Admin User
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const defaultAdmin = new User({
        name: "Portal Administrator",
        email: "admin@projectvault.edu",
        username: "admin",
        password: hashedPassword,
        role: "admin",
        isVerified: true,
      });
      await defaultAdmin.save();
      console.log(
        "Default admin created: admin / admin123 (email: admin@projectvault.edu)",
      );
    } else {
      console.log("Admin user already exists. Skipping.");
    }

    // 2. Seed Student User
    const studentCount = await User.countDocuments({ role: "student" });
    let defaultStudentId: mongoose.Types.ObjectId | null = null;

    if (studentCount === 0) {
      const hashedPassword = await bcrypt.hash("student123", 10);
      const defaultStudent = new User({
        name: "Aravind Kumar",
        email: "student@projectvault.edu",
        password: hashedPassword,
        role: "student",
        studentId: "CS-2026-44",
        department: "Computer Science",
        isVerified: true,
      });
      await defaultStudent.save();
      defaultStudentId = defaultStudent._id as mongoose.Types.ObjectId;
      console.log(
        "Default student created: student@projectvault.edu / student123",
      );
    } else {
      const student = await User.findOne({ role: "student" });
      if (student) {
        defaultStudentId = student._id as mongoose.Types.ObjectId;
      }
      console.log("Student user already exists. Skipping.");
    }

    // 3. Seed Categories
    const categoriesList = [
      "Web Development",
      "Mobile Applications",
      "Artificial Intelligence",
      "IoT & Robotics",
      "Cloud & Cybersecurity",
    ];

    const existingCategories = await Category.find();
    if (existingCategories.length === 0) {
      for (const catName of categoriesList) {
        const cat = new Category({ name: catName });
        await cat.save();
      }
      console.log("Categories seeded successfully.");
    } else {
      console.log("Categories already exist. Skipping.");
    }

    // 4. Seed Sample Projects
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      const sampleProjects = [
        {
          title: "StudySphere - Collaborative Study Portal",
          category: "Web Development",
          description:
            "StudySphere is a real-time collaborative workspace for students. Features include virtual study rooms, live whiteboard sharing, collaborative document editing, and integrated flashcards. It helps students join study groups, set exam targets, and track daily preparation tasks in a clean dashboard interface.",
          technologies: [
            "React",
            "TypeScript",
            "Node.js",
            "Express",
            "Socket.io",
            "MongoDB",
          ],
          teamMembers: ["Aravind Kumar", "Pooja Sharma"],
          githubLink: "https://github.com/example/studysphere",
          liveLink: "https://studysphere-demo.example.com",
          image: "",
          featured: true,
          status: "approved",
          ownerId: defaultStudentId,
        },
        {
          title: "HealthSync - Patient Vitals Tracker",
          category: "Mobile Applications",
          description:
            "A cross-platform React Native mobile application that connects with wearable IoT sensors to monitor patients' heart rate, oxygen levels, and sleep patterns. Features automatic emergency notifications, medical report history, and a chatbot for doctor appointment scheduling.",
          technologies: [
            "React Native",
            "Expo",
            "Express",
            "MongoDB",
            "TailwindCSS",
          ],
          teamMembers: ["Rohan Das", "Sneha Patel"],
          githubLink: "https://github.com/example/healthsync",
          liveLink: "",
          image: "",
          featured: true,
          status: "approved",
          ownerId: defaultStudentId,
        },
        {
          title: "DeepInsight - Crop Disease Classifier",
          category: "Artificial Intelligence",
          description:
            "An AI-powered web dashboard that uses deep learning convolutional neural networks (CNNs) to classify crop leaf diseases. Farmers can upload photos of crop leaves, receive instant diagnostics, and read automated treatment recommendations powered by Gemini LLM APIs.",
          technologies: [
            "Python",
            "TensorFlow",
            "FastAPI",
            "React",
            "TailwindCSS",
          ],
          teamMembers: ["Karan Mehta", "Ananya Sen"],
          githubLink: "https://github.com/example/deepinsight",
          liveLink: "https://deepinsight.example.com",
          image: "",
          featured: true,
          status: "approved",
          ownerId: defaultStudentId,
        },
        {
          title: "AeroShield - Smart Drone Security System",
          category: "IoT & Robotics",
          description:
            "An automated drone surveillance platform using ESP32 cameras, OpenCV object detection, and MQTT protocol. Drones detect intruders in restricted college campuses, stream HD video feeds, and log alert timestamps to a centralized backend database.",
          technologies: ["ESP32", "C++", "Python", "OpenCV", "MQTT", "Node.js"],
          teamMembers: ["Vikram Rao", "Meera Nair"],
          githubLink: "https://github.com/example/aeroshield",
          liveLink: "",
          image: "",
          featured: false,
          status: "approved",
          ownerId: defaultStudentId,
        },
      ];

      for (const proj of sampleProjects) {
        const newProj = new Project(proj);
        await newProj.save();
      }
      console.log("Sample projects seeded successfully.");
    } else {
      console.log("Projects already exist. Skipping.");
    }

    console.log("Database seeding completed.");
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    mongoose.connection?.close();
    process.exit(1);
  }
};

seedData();
