import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getRow } from "../config/database.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Token tidak ditemukan",
      message: "Silakan login terlebih dahulu",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Token tidak valid",
      message: "Silakan login ulang",
    });
  }
};

// Middleware to check if user is admin
export const requireAdmin = async (req, res, next) => {
  try {
    const user = await getRow(
      "SELECT * FROM admin_users WHERE id = ? AND is_active = 1",
      [req.user.id]
    );

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        error: "Akses ditolak",
        message: "Anda tidak memiliki izin untuk mengakses resource ini",
      });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    return res.status(500).json({
      error: "Gagal memverifikasi admin",
      message: error.message,
    });
  }
};

// Hash password helper
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password helper
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}; 