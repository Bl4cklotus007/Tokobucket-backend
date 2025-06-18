import express from "express";
import { body, validationResult } from "express-validator";
import { getAllRows, getRow, runQuery } from "../config/database.js";

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

// GET /api/admin/dashboard - Get dashboard statistics
router.get("/dashboard", async (req, res) => {
  try {
    // Get order statistics
    const orderStats = await getRow(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END) as total_revenue
      FROM orders
    `);

    // Get product statistics
    const productStats = await getRow(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN is_featured = 1 THEN 1 END) as featured_products,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_products
      FROM products
    `);

    // Get testimonial statistics
    const testimonialStats = await getRow(`
      SELECT 
        COUNT(*) as total_testimonials,
        COUNT(CASE WHEN is_approved = 1 THEN 1 END) as approved_testimonials,
        AVG(rating) as average_rating
      FROM testimonials
    `);

    // Get contact message statistics
    const contactStats = await getRow(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread_messages
      FROM contact_messages
    `);

    // Get recent orders
    const recentOrders = await getAllRows(`
      SELECT 
        o.id,
        o.customer_name,
        o.order_type,
        o.status,
        o.total_price,
        o.created_at,
        p.name as product_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    // Get monthly revenue trend (last 6 months)
    const monthlyRevenue = await getAllRows(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as order_count,
        SUM(total_price) as revenue
      FROM orders 
      WHERE status = 'completed' 
        AND created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `);

    res.json({
      success: true,
      data: {
        orders: orderStats,
        products: productStats,
        testimonials: testimonialStats,
        contact: contactStats,
        recent_orders: recentOrders.map((order) => ({
          ...order,
          order_number: `BW${String(order.id).padStart(6, "0")}`,
        })),
        monthly_revenue: monthlyRevenue,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      error: "Gagal mengambil data dashboard",
      message: error.message,
    });
  }
});

// GET /api/admin/orders/pending - Get pending orders
router.get("/orders/pending", async (req, res) => {
  try {
    const pendingOrders = await getAllRows(`
      SELECT 
        o.*,
        p.name as product_name,
        p.image_url as product_image
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.status = 'pending'
      ORDER BY o.created_at ASC
    `);

    const formattedOrders = pendingOrders.map((order) => ({
      ...order,
      order_number: `BW${String(order.id).padStart(6, "0")}`,
    }));

    res.json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    res.status(500).json({
      error: "Gagal mengambil pesanan pending",
      message: error.message,
    });
  }
});

// GET /api/admin/testimonials/pending - Get pending testimonials
router.get("/testimonials/pending", async (req, res) => {
  try {
    const pendingTestimonials = await getAllRows(
      "SELECT * FROM testimonials WHERE is_approved = 0 ORDER BY created_at ASC",
    );

    res.json({
      success: true,
      data: pendingTestimonials,
    });
  } catch (error) {
    console.error("Error fetching pending testimonials:", error);
    res.status(500).json({
      error: "Gagal mengambil testimoni pending",
      message: error.message,
    });
  }
});

// PUT /api/admin/testimonials/:id/approve - Approve testimonial
router.put("/:id/approve", async (req, res) => {
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

// DELETE /api/admin/testimonials/:id - Delete testimonial
router.delete("/testimonials/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await runQuery("DELETE FROM testimonials WHERE id = ?", [
      id,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Testimoni tidak ditemukan",
      });
    }

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

// GET /api/admin/reports/sales - Get sales report
router.get("/reports/sales", async (req, res) => {
  try {
    const { period = "monthly", year = new Date().getFullYear() } = req.query;

    let dateFormat, groupBy;
    if (period === "daily") {
      dateFormat = "%Y-%m-%d";
      groupBy = "date(created_at)";
    } else if (period === "weekly") {
      dateFormat = "%Y-W%W";
      groupBy = "strftime('%Y-W%W', created_at)";
    } else {
      dateFormat = "%Y-%m";
      groupBy = "strftime('%Y-%m', created_at)";
    }

    const salesData = await getAllRows(`
      SELECT 
        strftime('${dateFormat}', created_at) as period,
        COUNT(*) as order_count,
        SUM(total_price) as revenue,
        COUNT(CASE WHEN order_type = 'standard' THEN 1 END) as standard_orders,
        COUNT(CASE WHEN order_type = 'custom' THEN 1 END) as custom_orders
      FROM orders 
      WHERE status = 'completed' 
        AND strftime('%Y', created_at) = '${year}'
      GROUP BY ${groupBy}
      ORDER BY period
    `);

    // Get top products
    const topProducts = await getAllRows(`
      SELECT 
        p.name,
        p.category,
        COUNT(o.id) as order_count,
        SUM(o.total_price) as revenue
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.status = 'completed'
        AND strftime('%Y', o.created_at) = '${year}'
      GROUP BY p.id
      ORDER BY order_count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        period: period,
        year: year,
        sales_data: salesData,
        top_products: topProducts,
        summary: {
          total_orders: salesData.reduce(
            (sum, item) => sum + item.order_count,
            0,
          ),
          total_revenue: salesData.reduce(
            (sum, item) => sum + (item.revenue || 0),
            0,
          ),
          standard_orders: salesData.reduce(
            (sum, item) => sum + item.standard_orders,
            0,
          ),
          custom_orders: salesData.reduce(
            (sum, item) => sum + item.custom_orders,
            0,
          ),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res.status(500).json({
      error: "Gagal mengambil laporan penjualan",
      message: error.message,
    });
  }
});

export default router;
