import express from "express";
import { body, validationResult } from "express-validator";
import { getRow, runQuery } from "../config/database.js";
import { hashPassword, comparePassword, generateToken } from "../middleware/auth.js";

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Data tidak valid",
      details: errors.array(),
    });
  }
  next();
};

// POST /api/auth/login - Admin login
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username harus diisi"),
    body("password").notEmpty().withMessage("Password harus diisi"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { username, password } = req.body;

      // Find admin user
      const admin = await getRow(
        "SELECT * FROM admin_users WHERE username = ? AND is_active = 1",
        [username]
      );

      if (!admin) {
        return res.status(401).json({
          error: "Login gagal",
          message: "Username atau password salah",
        });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, admin.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: "Login gagal",
          message: "Username atau password salah",
        });
      }

      // Generate token
      const token = generateToken(admin);

      res.json({
        success: true,
        message: "Login berhasil",
        data: {
          token,
          user: {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
          },
        },
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({
        error: "Gagal melakukan login",
        message: error.message,
      });
    }
  }
);

// POST /api/auth/register - Register new admin (protected, only for first admin)
router.post(
  "/register",
  [
    body("username").isLength({ min: 3 }).withMessage("Username minimal 3 karakter"),
    body("email").isEmail().withMessage("Email tidak valid"),
    body("password").isLength({ min: 6 }).withMessage("Password minimal 6 karakter"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Check if any admin exists (only allow first admin registration)
      const existingAdmin = await getRow("SELECT COUNT(*) as count FROM admin_users");
      if (existingAdmin.count > 0) {
        return res.status(403).json({
          error: "Registrasi ditolak",
          message: "Admin sudah terdaftar. Silakan hubungi admin yang ada.",
        });
      }

      // Check if username or email already exists
      const existingUser = await getRow(
        "SELECT * FROM admin_users WHERE username = ? OR email = ?",
        [username, email]
      );

      if (existingUser) {
        return res.status(400).json({
          error: "Registrasi gagal",
          message: "Username atau email sudah digunakan",
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create admin user
      const result = await runQuery(
        "INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, "admin"]
      );

      const newAdmin = await getRow(
        "SELECT * FROM admin_users WHERE id = ?",
        [result.id]
      );

      // Generate token
      const token = generateToken(newAdmin);

      res.status(201).json({
        success: true,
        message: "Admin berhasil didaftarkan",
        data: {
          token,
          user: {
            id: newAdmin.id,
            username: newAdmin.username,
            email: newAdmin.email,
            role: newAdmin.role,
          },
        },
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({
        error: "Gagal mendaftarkan admin",
        message: error.message,
      });
    }
  }
);

// GET /api/auth/me - Get current admin info
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        error: "Token tidak ditemukan",
        message: "Silakan login terlebih dahulu",
      });
    }

    // Verify token and get user info
    const jwt = await import("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await getRow(
      "SELECT id, username, email, role FROM admin_users WHERE id = ? AND is_active = 1",
      [decoded.id]
    );

    if (!admin) {
      return res.status(401).json({
        error: "Token tidak valid",
        message: "Silakan login ulang",
      });
    }

    res.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error("Error getting admin info:", error);
    res.status(401).json({
      error: "Token tidak valid",
      message: "Silakan login ulang",
    });
  }
});

export default router; 