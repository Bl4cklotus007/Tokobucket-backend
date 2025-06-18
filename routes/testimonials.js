import express from "express";
import { body, validationResult } from "express-validator";
import { getAllRows, getRow, runQuery } from "../config/database.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";
import { uploadSingle } from "../middleware/upload.js";

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

// GET /api/testimonials - Get all approved testimonials
router.get("/", async (req, res) => {
  try {
    const { featured, limit = 50, offset = 0 } = req.query;

    let query = "SELECT * FROM testimonials WHERE is_approved = 1";
    const params = [];

    if (featured === "true") {
      query += " AND is_featured = 1";
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const testimonials = await getAllRows(query, params);

    res.json({
      success: true,
      data: testimonials,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({
      error: "Gagal mengambil testimoni",
      message: error.message,
    });
  }
});

// GET /api/testimonials/featured - Get featured testimonials for homepage
router.get("/featured", async (req, res) => {
  try {
    const testimonials = await getAllRows(
      "SELECT * FROM testimonials WHERE is_approved = 1 AND is_featured = 1 ORDER BY created_at DESC LIMIT 5",
    );

    res.json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    console.error("Error fetching featured testimonials:", error);
    res.status(500).json({
      error: "Gagal mengambil testimoni unggulan",
      message: error.message,
    });
  }
});

// POST /api/testimonials - Submit new testimonial
router.post(
  "/",
  uploadSingle,
  [
    body("customer_name").notEmpty().withMessage("Nama harus diisi"),
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating harus antara 1-5"),
    body("testimonial_text")
      .notEmpty()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Testimoni harus antara 10-1000 karakter"),
    body("customer_role").optional().isString(),
    body("customer_location").optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        customer_name,
        customer_role,
        customer_location,
        rating,
        testimonial_text,
      } = req.body;

      // Handle image upload
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;

      const result = await runQuery(
        `
      INSERT INTO testimonials 
      (customer_name, customer_role, customer_location, rating, testimonial_text, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
        [
          customer_name,
          customer_role,
          customer_location,
          rating,
          testimonial_text,
          image_url,
        ],
      );

      res.status(201).json({
        success: true,
        message:
          "Testimoni berhasil dikirim. Akan ditampilkan setelah diverifikasi.",
        data: { id: result.id, image_url },
      });
    } catch (error) {
      console.error("Error creating testimonial:", error);
      res.status(500).json({
        error: "Gagal mengirim testimoni",
        message: error.message,
      });
    }
  },
);

// GET /api/testimonials/stats - Get testimonial statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await getRow(`
      SELECT 
        COUNT(*) as total_testimonials,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
        COUNT(CASE WHEN is_approved = 1 THEN 1 END) as approved_count
      FROM testimonials
    `);

    const ratingDistribution = await getAllRows(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM testimonials
      WHERE is_approved = 1
      GROUP BY rating
      ORDER BY rating DESC
    `);

    res.json({
      success: true,
      data: {
        ...stats,
        rating_distribution: ratingDistribution,
        satisfaction_rate:
          stats.total_testimonials > 0
            ? (
                (stats.five_star_count / stats.total_testimonials) *
                100
              ).toFixed(1)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching testimonial stats:", error);
    res.status(500).json({
      error: "Gagal mengambil statistik testimoni",
      message: error.message,
    });
  }
});

// ADMIN ROUTES

// GET /api/testimonials/admin/all - Get all testimonials for admin
router.get("/admin/all", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    let query = "SELECT * FROM testimonials";
    const params = [];

    // Add status filter
    if (status === "approved") {
      query += " WHERE is_approved = 1";
    } else if (status === "pending") {
      query += " WHERE is_approved = 0";
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const testimonials = await getAllRows(query, params);

    res.json({
      success: true,
      data: testimonials,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: testimonials.length,
      },
    });
  } catch (error) {
    console.error("Error fetching admin testimonials:", error);
    res.status(500).json({
      error: "Gagal mengambil testimoni",
      message: error.message,
    });
  }
});

// POST /api/testimonials/admin - Create testimonial as admin
router.post(
  "/admin",
  verifyToken,
  requireAdmin,
  uploadSingle,
  [
    body("customer_name").notEmpty().withMessage("Nama harus diisi"),
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating harus antara 1-5"),
    body("testimonial_text")
      .notEmpty()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Testimoni harus antara 10-1000 karakter"),
    body("customer_role").optional().isString(),
    body("customer_location").optional().isString(),
    body("is_approved").optional().isBoolean(),
    body("is_featured").optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        customer_name,
        customer_role,
        customer_location,
        rating,
        testimonial_text,
        is_approved = true,
        is_featured = false,
      } = req.body;

      // Handle image upload
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;

      const result = await runQuery(
        `
      INSERT INTO testimonials 
      (customer_name, customer_role, customer_location, rating, testimonial_text, image_url, is_approved, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          customer_name,
          customer_role,
          customer_location,
          rating,
          testimonial_text,
          image_url,
          is_approved ? 1 : 0,
          is_featured ? 1 : 0,
        ],
      );

      res.status(201).json({
        success: true,
        message: "Testimoni berhasil ditambahkan",
        data: { id: result.id, image_url },
      });
    } catch (error) {
      console.error("Error creating admin testimonial:", error);
      res.status(500).json({
        error: "Gagal menambahkan testimoni",
        message: error.message,
      });
    }
  },
);

// PUT /api/testimonials/:id - Update testimonial (admin only)
router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  uploadSingle,
  [
    body("customer_name").optional().notEmpty(),
    body("rating").optional().isInt({ min: 1, max: 5 }),
    body("testimonial_text").optional().isLength({ min: 10, max: 1000 }),
    body("customer_role").optional().isString(),
    body("customer_location").optional().isString(),
    body("is_approved").optional().isBoolean(),
    body("is_featured").optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if testimonial exists
      const existingTestimonial = await getRow(
        "SELECT id, image_url FROM testimonials WHERE id = ?",
        [id],
      );
      if (!existingTestimonial) {
        return res.status(404).json({
          error: "Testimoni tidak ditemukan",
        });
      }

      // Handle image upload
      if (req.file) {
        updates.image_url = `/uploads/${req.file.filename}`;
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];

      Object.keys(updates).forEach((key) => {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key]);
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: "Tidak ada data yang diupdate",
        });
      }

      updateValues.push(id);

      await runQuery(
        `UPDATE testimonials SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues,
      );

      res.json({
        success: true,
        message: "Testimoni berhasil diupdate",
        data: { image_url: updates.image_url },
      });
    } catch (error) {
      console.error("Error updating testimonial:", error);
      res.status(500).json({
        error: "Gagal mengupdate testimoni",
        message: error.message,
      });
    }
  },
);

// DELETE /api/testimonials/:id - Delete testimonial (admin only)
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if testimonial exists
    const existingTestimonial = await getRow(
      "SELECT id FROM testimonials WHERE id = ?",
      [id],
    );
    if (!existingTestimonial) {
      return res.status(404).json({
        error: "Testimoni tidak ditemukan",
      });
    }

    await runQuery("DELETE FROM testimonials WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Testimoni berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({
      error: "Gagal menghapus testimoni",
      message: error.message,
    });
  }
});

// PUT /api/testimonials/:id/approve - Approve testimonial (admin only)
router.put("/:id/approve", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_featured = false } = req.body;

    const result = await runQuery(
      "UPDATE testimonials SET is_approved = 1, is_featured = ? WHERE id = ?",
      [is_featured ? 1 : 0, id],
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Testimoni tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Testimoni berhasil disetujui",
    });
  } catch (error) {
    console.error("Error approving testimonial:", error);
    res.status(500).json({
      error: "Gagal menyetujui testimoni",
      message: error.message,
    });
  }
});

// PUT /api/testimonials/:id/toggle-featured - Toggle featured status (admin only)
router.put("/:id/toggle-featured", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if testimonial exists
    const existingTestimonial = await getRow(
      "SELECT id, is_featured FROM testimonials WHERE id = ?",
      [id],
    );
    if (!existingTestimonial) {
      return res.status(404).json({
        error: "Testimoni tidak ditemukan",
      });
    }

    // Toggle featured status
    const newFeaturedStatus = existingTestimonial.is_featured ? 0 : 1;
    await runQuery(
      "UPDATE testimonials SET is_featured = ? WHERE id = ?",
      [newFeaturedStatus, id],
    );

    res.json({
      success: true,
      message: `Testimoni berhasil ${newFeaturedStatus ? "ditampilkan" : "disembunyikan"} dari unggulan`,
      data: { is_featured: newFeaturedStatus },
    });
  } catch (error) {
    console.error("Error toggling featured status:", error);
    res.status(500).json({
      error: "Gagal mengubah status unggulan",
      message: error.message,
    });
  }
});

export default router;
