import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import testimonialsRouter from "./routes/testimonials.js";
import contactRouter from "./routes/contact.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";

// Import middleware
import { handleUploadError } from "./middleware/upload.js";

// Initialize environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Terlalu banyak permintaan, coba lagi nanti.",
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: "*", // Allow all origins in development
    credentials: true,
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files (product images, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/testimonials", testimonialsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);

// Upload error handler
app.use(handleUploadError);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Bucket Wisuda API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint tidak ditemukan",
    message: "Silakan periksa URL API yang Anda gunakan",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    error: "Terjadi kesalahan server",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📱 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🎓 Bucket Wisuda & Dekorasi Backend Ready!`);
});

export default app;
