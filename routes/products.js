import express from "express";
import { body, query, validationResult } from "express-validator";
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

// GET /api/products - Get all products with optional filtering
router.get(
  "/",
  [
    query("category").optional().isIn(["wisuda", "balon", "pernikahan"]),
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
  },
);

// GET /api/products/:id - Get single product
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await getRow(
      "SELECT * FROM products WHERE id = ? AND is_active = 1",
      [id],
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
      "SELECT * FROM products WHERE is_featured = 1 AND is_active = 1 ORDER BY created_at DESC LIMIT 6",
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
      .isIn(["wisuda", "balon", "pernikahan"])
      .withMessage("Kategori tidak valid"),
    body("description").optional().isString(),
    body("features").optional().isArray(),
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

      const result = await runQuery(
        `
      INSERT INTO products 
      (name, description, price, original_price, category, image_url, features, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          name,
          description,
          price,
          original_price,
          category,
          image_url,
          JSON.stringify(features),
          is_featured ? 1 : 0,
        ],
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
  },
);

// PUT /api/products/:id - Update product (admin only)
router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  uploadSingle,
  [
    body("name").optional().notEmpty(),
    body("price").optional().isInt({ min: 1 }),
    body("category").optional().isIn(["wisuda", "balon", "pernikahan"]),
    body("features").optional().isArray(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if product exists
      const existingProduct = await getRow(
        "SELECT id, image_url FROM products WHERE id = ?",
        [id],
      );
      if (!existingProduct) {
        return res.status(404).json({
          error: "Produk tidak ditemukan",
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
        if (key === "features") {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(updates[key]));
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(updates[key]);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: "Tidak ada data yang diupdate",
        });
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);

      await runQuery(
        `UPDATE products SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues,
      );

      res.json({
        success: true,
        message: "Produk berhasil diupdate",
        data: { image_url: updates.image_url },
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        error: "Gagal mengupdate produk",
        message: error.message,
      });
    }
  },
);

// DELETE /api/products/:id - Delete product (admin only)
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await getRow(
      "SELECT id, image_url FROM products WHERE id = ?",
      [id],
    );
    if (!existingProduct) {
      return res.status(404).json({
        error: "Produk tidak ditemukan",
      });
    }

    // Soft delete - set is_active to 0
    await runQuery(
      "UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Produk berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      error: "Gagal menghapus produk",
      message: error.message,
    });
  }
});

// GET /api/products/admin/all - Get all products for admin (including inactive)
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
    } else if (status === "inactive") {
      conditions.push("is_active = 0");
    }

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
router.put("/:id/toggle-featured", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await getRow(
      "SELECT id, is_featured FROM products WHERE id = ?",
      [id],
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
      [newFeaturedStatus, id],
    );

    res.json({
      success: true,
      message: `Produk berhasil ${newFeaturedStatus ? "ditampilkan" : "disembunyikan"} dari unggulan`,
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

// PUT /api/products/:id/toggle-active - Toggle active status (admin only)
router.put("/:id/toggle-active", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await getRow(
      "SELECT id, is_active FROM products WHERE id = ?",
      [id],
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
      [newActiveStatus, id],
    );

    res.json({
      success: true,
      message: `Produk berhasil ${newActiveStatus ? "diaktifkan" : "dinonaktifkan"}`,
      data: { is_active: newActiveStatus },
    });
  } catch (error) {
    console.error("Error toggling active status:", error);
    res.status(500).json({
      error: "Gagal mengubah status aktif",
      message: error.message,
    });
  }
});

export default router;
