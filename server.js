import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import database functions
import { testConnection, initializeDatabase } from "./config/database.js";

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
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: "Terlalu banyak permintaan, coba lagi nanti.",
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:3000",
      "http://192.168.190.65:8080",
      "http://127.0.0.1:8080",
      "http://127.0.0.1:3000",
      "http://localhost:5173", // Vite default port
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files (product images, etc.) with CORS headers
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

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
app.get("/api/health", async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: "OK",
      message: "Bucket Wisuda API is running",
      database: dbStatus ? "Connected" : "Disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
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

// Initialize database and start server
async function startServer() {
  try {
    console.log("🔄 Testing database connection...");
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error(
        "❌ Cannot connect to MySQL database. Please check your configuration."
      );
      console.log(
        "💡 Make sure MySQL is running and your .env file is configured correctly."
      );
      process.exit(1);
    }

    console.log("🔄 Initializing database tables...");
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
      console.log(`📱 API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🎓 Bucket Wisuda & Dekorasi Backend Ready!`);
      console.log(`🗄️  Database: MySQL (balon_tegal)`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
