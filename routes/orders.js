import express from "express";
import { body, validationResult } from "express-validator";
import { getAllRows, getRow, runQuery } from "../config/database.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";

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

// POST /api/orders - Create new order
router.post(
  "/",
  [
    body("customer_name").notEmpty().withMessage("Nama pelanggan harus diisi"),
    body("customer_phone").notEmpty().withMessage("Nomor telepon harus diisi"),
    body("customer_email")
      .optional()
      .isEmail()
      .withMessage("Format email tidak valid"),
    body("order_type")
      .isIn(["standard", "custom"])
      .withMessage("Tipe order tidak valid"),
    body("product_id").optional().isInt({ min: 1 }),
    body("custom_description").optional().isString(),
    body("quantity").optional().isInt({ min: 1 }),
    body("customer_address").optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        order_type,
        product_id,
        custom_description,
        quantity = 1,
        notes,
      } = req.body;

      // Validate order type requirements
      if (order_type === "standard" && !product_id) {
        return res.status(400).json({
          error: "Product ID harus diisi untuk pesanan standard",
        });
      }

      if (order_type === "custom" && !custom_description) {
        return res.status(400).json({
          error: "Deskripsi custom harus diisi untuk pesanan custom",
        });
      }

      let total_price = 0;

      // Calculate price for standard orders
      if (order_type === "standard" && product_id) {
        const product = await getRow(
          "SELECT price FROM products WHERE id = ? AND is_active = 1",
          [product_id],
        );

        if (!product) {
          return res.status(404).json({
            error: "Produk tidak ditemukan",
          });
        }

        total_price = product.price * quantity;
      }

      // Create order
      const result = await runQuery(
        `
      INSERT INTO orders 
      (customer_name, customer_phone, customer_email, customer_address, 
       order_type, product_id, custom_description, quantity, total_price, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          customer_name,
          customer_phone,
          customer_email,
          customer_address,
          order_type,
          product_id || null,
          custom_description,
          quantity,
          total_price,
          notes,
        ],
      );

      // Get the created order details
      const newOrder = await getRow("SELECT * FROM orders WHERE id = ?", [
        result.id,
      ]);

      res.status(201).json({
        success: true,
        message: "Pesanan berhasil dibuat",
        data: {
          order_id: result.id,
          order_number: `BW${String(result.id).padStart(6, "0")}`,
          ...newOrder,
        },
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({
        error: "Gagal membuat pesanan",
        message: error.message,
      });
    }
  },
);

// GET /api/orders/:id - Get order details
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const order = await getRow(
      `
      SELECT 
        o.*,
        p.name as product_name,
        p.price as product_price,
        p.image_url as product_image
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `,
      [id],
    );

    if (!order) {
      return res.status(404).json({
        error: "Pesanan tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: {
        ...order,
        order_number: `BW${String(order.id).padStart(6, "0")}`,
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      error: "Gagal mengambil data pesanan",
      message: error.message,
    });
  }
});

// POST /api/orders/quote - Get price quote for custom order
router.post(
  "/quote",
  [
    body("order_type").notEmpty().withMessage("Tipe order harus diisi"),
    body("product_id").optional().isInt({ min: 1 }),
    body("custom_description").optional().isString(),
    body("quantity").optional().isInt({ min: 1 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        order_type,
        product_id,
        custom_description,
        quantity = 1,
      } = req.body;

      if (order_type === "standard" && product_id) {
        const product = await getRow(
          "SELECT name, price, original_price FROM products WHERE id = ? AND is_active = 1",
          [product_id],
        );

        if (!product) {
          return res.status(404).json({
            error: "Produk tidak ditemukan",
          });
        }

        const total_price = product.price * quantity;
        const savings = product.original_price
          ? (product.original_price - product.price) * quantity
          : 0;

        res.json({
          success: true,
          data: {
            product_name: product.name,
            unit_price: product.price,
            quantity,
            total_price,
            savings,
            currency: "IDR",
          },
        });
      } else if (order_type === "custom") {
        // For custom orders, provide estimated pricing
        const base_price = 150000; // Base price for custom orders
        const estimated_price = base_price * quantity;

        res.json({
          success: true,
          data: {
            order_type: "custom",
            description: custom_description,
            quantity,
            estimated_price,
            note: "Harga final akan dikonfirmasi setelah konsultasi design",
            currency: "IDR",
          },
        });
      } else {
        res.status(400).json({
          error: "Data tidak lengkap untuk kalkulasi harga",
        });
      }
    } catch (error) {
      console.error("Error calculating quote:", error);
      res.status(500).json({
        error: "Gagal menghitung harga",
        message: error.message,
      });
    }
  },
);

// GET /api/orders - Get all orders (admin only - implement auth later)
router.get("/", async (req, res) => {
  try {
    const { status, order_type, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        o.*,
        p.name as product_name,
        p.image_url as product_image
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += " AND o.status = ?";
      params.push(status);
    }

    if (order_type) {
      query += " AND o.order_type = ?";
      params.push(order_type);
    }

    query += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const orders = await getAllRows(query, params);

    const formattedOrders = orders.map((order) => ({
      ...order,
      order_number: `BW${String(order.id).padStart(6, "0")}`,
    }));

    res.json({
      success: true,
      data: formattedOrders,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      error: "Gagal mengambil data pesanan",
      message: error.message,
    });
  }
});

// PUT /api/orders/:id/status - Update order status (admin only)
router.put(
  "/:id/status",
  [
    body("status")
      .isIn(["pending", "confirmed", "processing", "completed", "cancelled"])
      .withMessage("Status tidak valid"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const result = await runQuery(
        "UPDATE orders SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, notes || null, id],
      );

      if (result.changes === 0) {
        return res.status(404).json({
          error: "Pesanan tidak ditemukan",
        });
      }

      res.json({
        success: true,
        message: "Status pesanan berhasil diupdate",
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({
        error: "Gagal mengupdate status pesanan",
        message: error.message,
      });
    }
  },
);

// ADMIN ROUTES

// GET /api/orders/admin/all - Get all orders for admin
router.get("/admin/all", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, order_type } = req.query;

    let query = `
      SELECT 
        o.*,
        p.name as product_name,
        p.image_url as product_image
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
    `;
    const params = [];

    // Add filters
    const conditions = [];
    if (status) {
      conditions.push("o.status = ?");
      params.push(status);
    }
    if (order_type) {
      conditions.push("o.order_type = ?");
      params.push(order_type);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const orders = await getAllRows(query, params);

    // Format orders with order number
    const formattedOrders = orders.map((order) => ({
      ...order,
      order_number: `BW${String(order.id).padStart(6, "0")}`,
    }));

    res.json({
      success: true,
      data: formattedOrders,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: formattedOrders.length,
      },
    });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    res.status(500).json({
      error: "Gagal mengambil pesanan",
      message: error.message,
    });
  }
});

// GET /api/orders/admin/:id - Get order details for admin
router.get("/admin/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await getRow(
      `
      SELECT 
        o.*,
        p.name as product_name,
        p.price as product_price,
        p.image_url as product_image
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `,
      [id],
    );

    if (!order) {
      return res.status(404).json({
        error: "Pesanan tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: {
        ...order,
        order_number: `BW${String(order.id).padStart(6, "0")}`,
      },
    });
  } catch (error) {
    console.error("Error fetching admin order:", error);
    res.status(500).json({
      error: "Gagal mengambil data pesanan",
      message: error.message,
    });
  }
});

// PUT /api/orders/:id/status - Update order status (admin only)
router.put(
  "/:id/status",
  verifyToken,
  requireAdmin,
  [
    body("status")
      .isIn(["pending", "confirmed", "processing", "completed", "cancelled"])
      .withMessage("Status tidak valid"),
    body("notes").optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      // Check if order exists
      const existingOrder = await getRow(
        "SELECT id, status FROM orders WHERE id = ?",
        [id],
      );
      if (!existingOrder) {
        return res.status(404).json({
          error: "Pesanan tidak ditemukan",
        });
      }

      // Update order status
      await runQuery(
        "UPDATE orders SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, notes, id],
      );

      res.json({
        success: true,
        message: `Status pesanan berhasil diubah menjadi ${status}`,
        data: { status, notes },
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({
        error: "Gagal mengupdate status pesanan",
        message: error.message,
      });
    }
  },
);

// PUT /api/orders/:id - Update order details (admin only)
router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  [
    body("customer_name").optional().notEmpty(),
    body("customer_phone").optional().notEmpty(),
    body("customer_email").optional().isEmail(),
    body("customer_address").optional().isString(),
    body("quantity").optional().isInt({ min: 1 }),
    body("total_price").optional().isInt({ min: 0 }),
    body("notes").optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if order exists
      const existingOrder = await getRow(
        "SELECT id FROM orders WHERE id = ?",
        [id],
      );
      if (!existingOrder) {
        return res.status(404).json({
          error: "Pesanan tidak ditemukan",
        });
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

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);

      await runQuery(
        `UPDATE orders SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues,
      );

      res.json({
        success: true,
        message: "Pesanan berhasil diupdate",
      });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({
        error: "Gagal mengupdate pesanan",
        message: error.message,
      });
    }
  },
);

// DELETE /api/orders/:id - Delete order (admin only)
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if order exists
    const existingOrder = await getRow(
      "SELECT id FROM orders WHERE id = ?",
      [id],
    );
    if (!existingOrder) {
      return res.status(404).json({
        error: "Pesanan tidak ditemukan",
      });
    }

    await runQuery("DELETE FROM orders WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Pesanan berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      error: "Gagal menghapus pesanan",
      message: error.message,
    });
  }
});

// GET /api/orders/admin/stats - Get order statistics for admin
router.get("/admin/stats", verifyToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getRow(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'completed' THEN total_price END) as avg_order_value
      FROM orders
    `);

    const monthlyStats = await getAllRows(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as order_count,
        SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END) as revenue
      FROM orders 
      WHERE created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `);

    const categoryStats = await getAllRows(`
      SELECT 
        p.category,
        COUNT(o.id) as order_count,
        SUM(CASE WHEN o.status = 'completed' THEN o.total_price ELSE 0 END) as revenue
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.order_type = 'standard'
      GROUP BY p.category
    `);

    res.json({
      success: true,
      data: {
        ...stats,
        monthly_stats: monthlyStats,
        category_stats: categoryStats,
      },
    });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({
      error: "Gagal mengambil statistik pesanan",
      message: error.message,
    });
  }
});

export default router;
