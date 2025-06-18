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

// POST /api/contact - Submit contact message
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Nama harus diisi"),
    body("message")
      .notEmpty()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Pesan harus antara 10-2000 karakter"),
    body("email").optional().isEmail().withMessage("Format email tidak valid"),
    body("phone").optional().isString(),
    body("subject").optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;

      const result = await runQuery(
        `
      INSERT INTO contact_messages 
      (name, email, phone, subject, message)
      VALUES (?, ?, ?, ?, ?)
    `,
        [name, email, phone, subject, message],
      );

      res.status(201).json({
        success: true,
        message: "Pesan berhasil dikirim. Terima kasih atas kepercayaan Anda!",
        data: { id: result.id },
      });
    } catch (error) {
      console.error("Error creating contact message:", error);
      res.status(500).json({
        error: "Gagal mengirim pesan",
        message: error.message,
      });
    }
  },
);

// GET /api/contact - Get all contact messages (admin only)
router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { is_read, limit = 50, offset = 0 } = req.query;

    let query = "SELECT * FROM contact_messages WHERE 1=1";
    const params = [];

    if (is_read !== undefined) {
      query += " AND is_read = ?";
      params.push(is_read === "true" ? 1 : 0);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const messages = await getAllRows(query, params);

    res.json({
      success: true,
      data: messages,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: messages.length,
      },
    });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({
      error: "Gagal mengambil pesan kontak",
      message: error.message,
    });
  }
});

// GET /api/contact/:id - Get single contact message (admin only)
router.get("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await getRow(
      "SELECT * FROM contact_messages WHERE id = ?",
      [id],
    );

    if (!message) {
      return res.status(404).json({
        error: "Pesan tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error fetching contact message:", error);
    res.status(500).json({
      error: "Gagal mengambil pesan kontak",
      message: error.message,
    });
  }
});

// PUT /api/contact/:id/read - Mark message as read (admin only)
router.put("/:id/read", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await runQuery(
      "UPDATE contact_messages SET is_read = 1 WHERE id = ?",
      [id],
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Pesan tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Pesan ditandai sudah dibaca",
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({
      error: "Gagal mengupdate status pesan",
      message: error.message,
    });
  }
});

// PUT /api/contact/:id - Update contact message (admin only)
router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  [
    body("name").optional().notEmpty(),
    body("email").optional().isEmail(),
    body("phone").optional().isString(),
    body("subject").optional().isString(),
    body("message").optional().isLength({ min: 10, max: 2000 }),
    body("is_read").optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if message exists
      const existingMessage = await getRow(
        "SELECT id FROM contact_messages WHERE id = ?",
        [id],
      );
      if (!existingMessage) {
        return res.status(404).json({
          error: "Pesan tidak ditemukan",
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

      updateValues.push(id);

      await runQuery(
        `UPDATE contact_messages SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues,
      );

      res.json({
        success: true,
        message: "Pesan berhasil diupdate",
      });
    } catch (error) {
      console.error("Error updating contact message:", error);
      res.status(500).json({
        error: "Gagal mengupdate pesan",
        message: error.message,
      });
    }
  },
);

// DELETE /api/contact/:id - Delete contact message (admin only)
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if message exists
    const existingMessage = await getRow(
      "SELECT id FROM contact_messages WHERE id = ?",
      [id],
    );
    if (!existingMessage) {
      return res.status(404).json({
        error: "Pesan tidak ditemukan",
      });
    }

    await runQuery("DELETE FROM contact_messages WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Pesan berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting contact message:", error);
    res.status(500).json({
      error: "Gagal menghapus pesan",
      message: error.message,
    });
  }
});

// GET /api/contact/admin/stats - Get contact message statistics (admin only)
router.get("/admin/stats", verifyToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getRow(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread_messages,
        COUNT(CASE WHEN is_read = 1 THEN 1 END) as read_messages,
        COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as messages_this_week,
        COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as messages_this_month
      FROM contact_messages
    `);

    const monthlyStats = await getAllRows(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as message_count
      FROM contact_messages 
      WHERE created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `);

    res.json({
      success: true,
      data: {
        ...stats,
        monthly_stats: monthlyStats,
      },
    });
  } catch (error) {
    console.error("Error fetching contact stats:", error);
    res.status(500).json({
      error: "Gagal mengambil statistik pesan kontak",
      message: error.message,
    });
  }
});

// POST /api/contact/whatsapp - Generate WhatsApp link
router.post(
  "/whatsapp",
  [
    body("name").notEmpty().withMessage("Nama harus diisi"),
    body("product_name").optional().isString(),
    body("order_type").optional().isIn(["standard", "custom"]),
    body("message").optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, product_name, order_type, message } = req.body;

      let whatsappMessage = `Halo! Saya ${name}.\n\n`;

      if (order_type === "standard" && product_name) {
        whatsappMessage += `Saya tertarik dengan produk: ${product_name}\n\n`;
      } else if (order_type === "custom") {
        whatsappMessage += `Saya ingin memesan bucket wisuda custom.\n\n`;
      }

      if (message) {
        whatsappMessage += `Pesan tambahan: ${message}\n\n`;
      }

      whatsappMessage += `Mohon informasi lebih lanjut. Terima kasih!`;

      const encodedMessage = encodeURIComponent(whatsappMessage);
      const whatsappNumber = process.env.WHATSAPP_NUMBER || "6281234567890";
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

      res.json({
        success: true,
        data: {
          whatsapp_url: whatsappUrl,
          message: whatsappMessage,
        },
      });
    } catch (error) {
      console.error("Error generating WhatsApp link:", error);
      res.status(500).json({
        error: "Gagal membuat link WhatsApp",
        message: error.message,
      });
    }
  },
);

export default router;
