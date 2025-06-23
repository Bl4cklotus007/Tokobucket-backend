import express from "express";
import { body, query, validationResult } from "express-validator";
import { getAllRows, getRow, runQuery } from "../config/database.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";
import { uploadSingle } from "../middleware/upload.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to delete image file
const deleteImageFile = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    // Handle different image URL formats
    if (imageUrl.startsWith("http")) {
      // Skip external URLs
      console.log("Skipping external image URL:", imageUrl);
      return;
    }

    // Handle local file paths
    const cleanImageUrl = imageUrl.replace(/^\//, "");
    const imagePath = path.join(__dirname, "..", cleanImageUrl);

    // Check if file exists before deleting
    if (fs.existsSync(imagePath)) {
      await fs.promises.unlink(imagePath);
      console.log("✅ Image file deleted successfully:", imagePath);
      return true;
    } else {
      console.log("⚠️  Image file not found:", imagePath);
      return false;
    }
  } catch (fileError) {
    console.error("❌ Error deleting image file:", fileError.message);
    return false;
  }
};

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({
      error: "Data tidak valid",
      message: "Terdapat kesalahan validasi pada data yang dikirim",
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

// Kategori yang valid
const PRODUCT_CATEGORIES = [
  { value: "bucket", label: "Bucket" },
  { value: "dekorasi balon", label: "Dekorasi Balon" },
  { value: "dekorasi pernikahan", label: "Dekorasi Pernikahan" },
];

// Endpoint untuk daftar kategori
router.get("/categories", (req, res) => {
  res.json({ success: true, data: PRODUCT_CATEGORIES });
});

// GET /api/products - Get all products with optional filtering
router.get(
  "/",
  [
    query("category")
      .optional()
      .isIn(["bucket", "dekorasi balon", "dekorasi pernikahan"]),
    query("featured").optional().isBoolean(),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("offset").optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { category, featured, limit = 50, offset = 0 } = req.query;

      let query = "SELECT * FROM products WHERE is_active = 1";
      const params = [];

      if (category) {
        query += " AND category = ?";
        params.push(category);
      }

      if (featured === "true") {
        query += " AND is_featured = 1";
      }

      query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));

      const products = await getAllRows(query, params);

      // Parse features JSON for each product
      const formattedProducts = products.map((product) => ({
        ...product,
        features: product.features ? JSON.parse(product.features) : [],
      }));

      res.json({
        success: true,
        data: formattedProducts,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: formattedProducts.length,
        },
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({
        error: "Gagal mengambil data produk",
        message: error.message,
      });
    }
  }
);

// GET /api/products/:id - Get single product
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await getRow(
      "SELECT * FROM products WHERE id = ? AND is_active = 1",
      [id]
    );

    if (!product) {
      return res.status(404).json({
        error: "Produk tidak ditemukan",
        message: "Produk dengan ID tersebut tidak ada atau tidak aktif",
      });
    }

    // Parse features JSON
    const formattedProduct = {
      ...product,
      features: product.features ? JSON.parse(product.features) : [],
    };

    res.json({
      success: true,
      data: formattedProduct,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      error: "Gagal mengambil data produk",
      message: error.message,
    });
  }
});

// GET /api/products/featured/list - Get featured products for homepage
router.get("/featured/list", async (req, res) => {
  try {
    const products = await getAllRows(
      "SELECT * FROM products WHERE is_featured = 1 AND is_active = 1 ORDER BY created_at DESC LIMIT 6"
    );

    const formattedProducts = products.map((product) => ({
      ...product,
      features: product.features ? JSON.parse(product.features) : [],
    }));

    res.json({
      success: true,
      data: formattedProducts,
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({
      error: "Gagal mengambil produk unggulan",
      message: error.message,
    });
  }
});

// GET /api/products/categories/stats - Get product count by category
router.get("/categories/stats", async (req, res) => {
  try {
    const stats = await getAllRows(`
      SELECT 
        category,
        COUNT(*) as count,
        AVG(rating) as avg_rating
      FROM products 
      WHERE is_active = 1 
      GROUP BY category
    `);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching category stats:", error);
    res.status(500).json({
      error: "Gagal mengambil statistik kategori",
      message: error.message,
    });
  }
});

// POST /api/products - Create new product (admin only)
router.post(
  "/",
  verifyToken,
  requireAdmin,
  uploadSingle,
  [
    body("name").notEmpty().withMessage("Nama produk harus diisi"),
    body("price")
      .isInt({ min: 1 })
      .withMessage("Harga harus berupa angka positif"),
    body("category")
      .isIn(["bucket", "dekorasi balon", "dekorasi pernikahan"])
      .withMessage("Kategori tidak valid"),
    body("description").optional().isString(),
    body("features").optional().isArray(),
    body("is_featured")
      .optional()
      .custom((value) => {
        console.log("Validating is_featured:", value, "Type:", typeof value);
        if (value === undefined || value === "") {
          console.log("is_featured is undefined or empty, returning true");
          return true;
        }
        // Handle both string and boolean values from FormData
        if (typeof value === "string") {
          const isValid = value === "true" || value === "false";
          console.log("is_featured is string, validation result:", isValid);
          return isValid;
        }
        const isValid = value === true || value === false;
        console.log("is_featured is boolean, validation result:", isValid);
        return isValid;
      })
      .withMessage("Status unggulan harus berupa boolean"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        original_price,
        category,
        features = [],
        is_featured = false,
      } = req.body;

      // Handle image upload
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;

      // Handle boolean values from FormData
      const isFeaturedBoolean = is_featured === "true" || is_featured === true;

      const result = await runQuery(
        `
      INSERT INTO products 
      (name, description, price, original_price, category, image_url, features, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          name,
          description || null,
          price,
          original_price || null,
          category,
          image_url,
          JSON.stringify(features),
          isFeaturedBoolean ? 1 : 0,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Produk berhasil ditambahkan",
        data: { id: result.id, image_url },
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({
        error: "Gagal menambahkan produk",
        message: error.message,
      });
    }
  }
);

// PUT /api/products/:id - Update product (admin only)
router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  uploadSingle,
  [
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Nama produk tidak boleh kosong"),
    body("price")
      .optional()
      .custom((value) => {
        if (value === undefined || value === "") return true;
        const num = parseInt(value);
        return !isNaN(num) && num > 0;
      })
      .withMessage("Harga harus berupa angka positif"),
    body("category")
      .optional()
      .isIn(["bucket", "dekorasi balon", "dekorasi pernikahan"])
      .withMessage(
        "Kategori tidak valid. Pilih: bucket, dekorasi balon, atau dekorasi pernikahan"
      ),
    body("original_price")
      .optional()
      .custom((value) => {
        if (value === undefined || value === "") return true;
        const num = parseInt(value);
        return !isNaN(num) && num >= 0;
      })
      .withMessage("Harga asli harus berupa angka positif"),
    body("is_featured")
      .optional()
      .custom((value) => {
        console.log("Validating is_featured:", value, "Type:", typeof value);
        if (value === undefined || value === "") {
          console.log("is_featured is undefined or empty, returning true");
          return true;
        }
        // Handle both string and boolean values from FormData
        if (typeof value === "string") {
          const isValid = value === "true" || value === "false";
          console.log("is_featured is string, validation result:", isValid);
          return isValid;
        }
        const isValid = value === true || value === false;
        console.log("is_featured is boolean, validation result:", isValid);
        return isValid;
      })
      .withMessage("Status unggulan harus berupa boolean"),
    body("features")
      .optional()
      .isArray()
      .withMessage("Fitur harus berupa array"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      console.log("Updating product ID:", id);
      console.log("Update data:", updates);
      console.log("Request body keys:", Object.keys(req.body));
      console.log("is_featured value:", updates.is_featured);
      console.log("is_featured type:", typeof updates.is_featured);

      // Check if product exists
      const existingProduct = await getRow(
        "SELECT id, image_url, category FROM products WHERE id = ?",
        [id]
      );
      if (!existingProduct) {
        return res.status(404).json({
          error: "Produk tidak ditemukan",
          message: `Produk dengan ID ${id} tidak ditemukan dalam database`,
        });
      }

      // Handle image upload
      if (req.file) {
        // Delete old image if it exists and is different from the new one
        if (
          existingProduct.image_url &&
          existingProduct.image_url !== `/uploads/${req.file.filename}`
        ) {
          await deleteImageFile(existingProduct.image_url);
        }

        updates.image_url = `/uploads/${req.file.filename}`;
      }

      // Handle boolean values from FormData
      if (updates.is_featured !== undefined) {
        updates.is_featured =
          updates.is_featured === "true" || updates.is_featured === true;
      }

      // Handle numeric values from FormData
      if (updates.price !== undefined) {
        updates.price = parseInt(updates.price);
      }
      if (
        updates.original_price !== undefined &&
        updates.original_price !== ""
      ) {
        updates.original_price = parseInt(updates.original_price);
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];

      Object.keys(updates).forEach((key) => {
        if (
          updates[key] !== undefined &&
          updates[key] !== null &&
          updates[key] !== ""
        ) {
          if (key === "features") {
            updateFields.push(`${key} = ?`);
            updateValues.push(JSON.stringify(updates[key]));
          } else if (key === "is_featured") {
            updateFields.push(`${key} = ?`);
            updateValues.push(updates[key] ? 1 : 0);
          } else {
            updateFields.push(`${key} = ?`);
            updateValues.push(updates[key]);
          }
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: "Tidak ada data yang diupdate",
          message: "Tidak ada field yang valid untuk diupdate",
        });
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);

      const updateQuery = `UPDATE products SET ${updateFields.join(
        ", "
      )} WHERE id = ?`;
      console.log("Update query:", updateQuery);
      console.log("Update values:", updateValues);

      await runQuery(updateQuery, updateValues);

      res.json({
        success: true,
        message: "Produk berhasil diupdate",
        data: {
          id: parseInt(id),
          updated_fields: Object.keys(updates),
          image_url: updates.image_url,
        },
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        error: "Gagal mengupdate produk",
        message: error.message,
        details: error.sqlMessage || error.message,
      });
    }
  }
);

// DELETE /api/products/:id - Delete product (admin only)
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await getRow(
      "SELECT id, image_url FROM products WHERE id = ?",
      [id]
    );
    if (!existingProduct) {
      return res.status(404).json({
        error: "Produk tidak ditemukan",
      });
    }

    // Check if there are any orders referencing this product
    const relatedOrders = await getAllRows(
      "SELECT id FROM orders WHERE product_id = ?",
      [id]
    );

    if (relatedOrders.length > 0) {
      return res.status(400).json({
        error: "Tidak dapat menghapus produk",
        message: `Produk ini masih memiliki ${relatedOrders.length} pesanan terkait. Hapus pesanan terlebih dahulu atau ubah referensi produk.`,
        related_orders_count: relatedOrders.length,
      });
    }

    // Delete image file from uploads directory first
    await deleteImageFile(existingProduct.image_url);

    // Hard delete - remove from database
    await runQuery("DELETE FROM products WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Produk berhasil dihapus secara permanen",
      deleted_image: existingProduct.image_url || null,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      error: "Gagal menghapus produk",
      message: error.message,
    });
  }
});

// GET /api/products/admin/all - Get all products for admin
router.get("/admin/all", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, category, status } = req.query;

    let query = "SELECT * FROM products";
    const params = [];

    // Add filters
    const conditions = [];
    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }
    if (status === "active") {
      conditions.push("is_active = 1");
    }
    // Note: Removed inactive filter since we now use hard delete

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const products = await getAllRows(query, params);

    // Parse features JSON for each product
    const formattedProducts = products.map((product) => ({
      ...product,
      features: product.features ? JSON.parse(product.features) : [],
    }));

    res.json({
      success: true,
      data: formattedProducts,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: formattedProducts.length,
      },
    });
  } catch (error) {
    console.error("Error fetching admin products:", error);
    res.status(500).json({
      error: "Gagal mengambil data produk",
      message: error.message,
    });
  }
});

// PUT /api/products/:id/toggle-featured - Toggle featured status (admin only)
router.put(
  "/:id/toggle-featured",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if product exists
      const existingProduct = await getRow(
        "SELECT id, is_featured FROM products WHERE id = ?",
        [id]
      );
      if (!existingProduct) {
        return res.status(404).json({
          error: "Produk tidak ditemukan",
        });
      }

      // Toggle featured status
      const newFeaturedStatus = existingProduct.is_featured ? 0 : 1;
      await runQuery(
        "UPDATE products SET is_featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newFeaturedStatus, id]
      );

      res.json({
        success: true,
        message: `Produk berhasil ${
          newFeaturedStatus ? "ditampilkan" : "disembunyikan"
        } dari unggulan`,
        data: { is_featured: newFeaturedStatus },
      });
    } catch (error) {
      console.error("Error toggling featured status:", error);
      res.status(500).json({
        error: "Gagal mengubah status unggulan",
        message: error.message,
      });
    }
  }
);

// PUT /api/products/:id/toggle-active - Toggle active status (admin only)
router.put(
  "/:id/toggle-active",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if product exists
      const existingProduct = await getRow(
        "SELECT id, is_active FROM products WHERE id = ?",
        [id]
      );
      if (!existingProduct) {
        return res.status(404).json({
          error: "Produk tidak ditemukan",
        });
      }

      // Toggle active status
      const newActiveStatus = existingProduct.is_active ? 0 : 1;
      await runQuery(
        "UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newActiveStatus, id]
      );

      res.json({
        success: true,
        message: `Produk berhasil ${
          newActiveStatus ? "diaktifkan" : "dinonaktifkan"
        }`,
        data: { is_active: newActiveStatus },
      });
    } catch (error) {
      console.error("Error toggling active status:", error);
      res.status(500).json({
        error: "Gagal mengubah status aktif",
        message: error.message,
      });
    }
  }
);

// POST /api/products/cleanup-images - Clean up orphaned images (admin only)
router.post("/cleanup-images", verifyToken, requireAdmin, async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, "..", "uploads");

    // Get all image files in uploads directory
    const files = await fs.promises.readdir(uploadsDir);
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    // Get all image URLs from database
    const products = await getAllRows(
      "SELECT image_url FROM products WHERE image_url IS NOT NULL"
    );
    const dbImageUrls = products.map((p) => p.image_url.replace(/^\//, ""));

    // Find orphaned images (files that exist but not in database)
    const orphanedImages = imageFiles.filter(
      (file) => !dbImageUrls.includes(file)
    );

    let deletedCount = 0;
    let errorCount = 0;

    // Delete orphaned images
    for (const imageFile of orphanedImages) {
      try {
        const imagePath = path.join(uploadsDir, imageFile);
        await fs.promises.unlink(imagePath);
        console.log("✅ Orphaned image deleted:", imageFile);
        deletedCount++;
      } catch (error) {
        console.error(
          "❌ Error deleting orphaned image:",
          imageFile,
          error.message
        );
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Cleanup completed. ${deletedCount} orphaned images deleted, ${errorCount} errors.`,
      data: {
        total_files: imageFiles.length,
        orphaned_files: orphanedImages.length,
        deleted_count: deletedCount,
        error_count: errorCount,
        orphaned_files_list: orphanedImages,
      },
    });
  } catch (error) {
    console.error("Error cleaning up images:", error);
    res.status(500).json({
      error: "Gagal membersihkan gambar",
      message: error.message,
    });
  }
});

export default router;
