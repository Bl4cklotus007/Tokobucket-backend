import {
  initializeDatabase,
  testConnection,
  runQuery,
  getAllRows,
} from "../config/database.js";
import pool from "../config/database.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample data for products
const sampleProducts = [
  {
    name: "Bucket Wisuda Premium",
    description:
      "Bucket bunga mawar premium dengan dekorasi eksklusif untuk momen wisuda yang berkesan",
    price: 150000,
    original_price: 200000,
    category: "bucket",
    image_url: "/uploads/bucket-premium.jpg",
    features: ["Bunga Segar", "Custom Design", "Gratis Kartu"],
    is_featured: true,
    rating: 5.0,
    reviews_count: 45,
  },
  {
    name: "Paket Dekorasi Balon",
    description:
      "Paket lengkap dekorasi balon untuk acara spesial dengan berbagai pilihan warna",
    price: 299000,
    original_price: 350000,
    category: "dekorasi balon",
    image_url: "/uploads/balloon-decoration.jpg",
    features: ["Setup Gratis", "Pilihan Warna", "Tahan 8 Jam"],
    is_featured: true,
    rating: 4.9,
    reviews_count: 32,
  },
  {
    name: "Bucket Mini Love",
    description:
      "Bucket mini cantik dengan sentuhan romantis, cocok untuk hadiah spesial",
    price: 99000,
    original_price: 120000,
    category: "bucket",
    image_url: "/uploads/mini-bucket.jpg",
    features: ["Ukuran Compact", "Bunga Pilihan", "Harga Terjangkau"],
    is_featured: true,
    rating: 4.8,
    reviews_count: 67,
  },
  {
    name: "Bucket Graduation Deluxe",
    description: "Bucket wisuda mewah dengan bunga import dan dekorasi premium",
    price: 250000,
    original_price: 300000,
    category: "bucket",
    image_url: "/uploads/bucket-deluxe.jpg",
    features: ["Bunga Import", "Premium Wrapping", "Custom Card"],
    is_featured: false,
    rating: 5.0,
    reviews_count: 23,
  },
  {
    name: "Dekorasi Pernikahan Minimalis",
    description:
      "Paket dekorasi pernikahan dengan konsep minimalis dan elegant",
    price: 1500000,
    original_price: 1800000,
    category: "dekorasi pernikahan",
    image_url: "/uploads/wedding-minimal.jpg",
    features: ["Setup Lengkap", "Konsep Minimalis", "Tim Decorator"],
    is_featured: false,
    rating: 4.9,
    reviews_count: 15,
  },
  {
    name: "Bucket Wisuda Classic",
    description:
      "Bucket wisuda klasik dengan bunga pilihan dan harga terjangkau",
    price: 85000,
    original_price: 100000,
    category: "bucket",
    image_url: "/uploads/bucket-classic.jpg",
    features: ["Bunga Segar", "Design Klasik", "Harga Ekonomis"],
    is_featured: false,
    rating: 4.7,
    reviews_count: 89,
  },
];

// Sample testimonials
const sampleTestimonials = [
  {
    customer_name: "Sarah Putri",
    customer_role: "Mahasiswa Universitas Gadjah Mada",
    customer_location: "Yogyakarta",
    rating: 5,
    testimonial_text:
      "Bucket wisuda dari Bucket Wisuda & Dekorasi benar-benar luar biasa! Bunga-bunganya segar dan arrangementriya sangat cantik. Orang tua saya sangat terkesan dengan hasilnya. Terima kasih sudah membuat momen wisuda saya jadi lebih berkesan!",
    is_approved: true,
    is_featured: true,
  },
  {
    customer_name: "Rizki Pratama",
    customer_role: "Fresh Graduate Teknik",
    customer_location: "Jakarta",
    rating: 5,
    testimonial_text:
      "Pelayanannya sangat memuaskan! Tim nya responsif banget dan bisa customize sesuai keinginan. Bucket wisudanya juga awet, sampai sekarang masih cantik di kamar. Recommended banget untuk teman-teman yang mau wisuda!",
    is_approved: true,
    is_featured: true,
  },
  {
    customer_name: "Anita Sari",
    customer_role: "Ibu dari Wisudawan",
    customer_location: "Bandung",
    rating: 5,
    testimonial_text:
      "Sebagai orang tua, saya sangat senang bisa memberikan yang terbaik untuk anak saya di hari wisudanya. Bucket dari sini kualitasnya premium dan harganya reasonable. Anak saya juga senang banget!",
    is_approved: true,
    is_featured: true,
  },
  {
    customer_name: "Dimas Arya",
    customer_role: "Mahasiswa Pasca Sarjana",
    customer_location: "Surabaya",
    rating: 5,
    testimonial_text:
      "Bucket wisuda untuk S2 saya pesan di sini dan hasilnya melebihi ekspektasi. Kombinasi warna dan bunga nya pas banget dengan toga saya. Prosesnya juga cepat, pesan hari ini besok sudah jadi!",
    is_approved: true,
    is_featured: true,
  },
  {
    customer_name: "Maya Dewi",
    customer_role: "Wisudawan Kedokteran",
    customer_location: "Semarang",
    rating: 5,
    testimonial_text:
      "Untuk momen spesial seperti wisuda kedokteran, saya cari yang terbaik. Alhamdulillah ketemu Bucket Wisuda & Dekorasi ini. Bucket nya elegant dan sophisticated, cocok banget untuk profesi dokter. Highly recommended!",
    is_approved: true,
    is_featured: true,
  },
];

// Sample admin user
const sampleAdmin = {
  username: "admin",
  email: "admin@balon-tegal.com",
  password_hash: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password: password
  role: "superadmin",
};

async function initData() {
  try {
    console.log("🔄 Testing database connection...");

    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error(
        "❌ Cannot connect to MySQL database. Please check your configuration."
      );
      process.exit(1);
    }

    console.log("🔄 Initializing database...");

    // Create uploads directory
    const uploadsDir = path.join(__dirname, "../uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Drop existing tables first
    console.log("🧹 Cleaning existing tables...");
    const connection = await pool.getConnection();

    try {
      await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
      await connection.execute("DROP TABLE IF EXISTS orders");
      await connection.execute("DROP TABLE IF EXISTS products");
      await connection.execute("DROP TABLE IF EXISTS testimonials");
      await connection.execute("DROP TABLE IF EXISTS contact_messages");
      await connection.execute("DROP TABLE IF EXISTS admin_users");
      await connection.execute("DROP TABLE IF EXISTS galleries");
      await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
      console.log("✅ Existing tables dropped");
    } catch (error) {
      console.log("ℹ️  No existing tables to drop");
    } finally {
      connection.release();
    }

    // Initialize database tables
    await initializeDatabase();

    console.log("📦 Inserting sample products...");

    // Insert sample products
    for (const product of sampleProducts) {
      await runQuery(
        `
        INSERT INTO products 
        (name, description, price, original_price, category, image_url, features, is_featured, rating, reviews_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          product.name,
          product.description,
          product.price,
          product.original_price,
          product.category,
          product.image_url,
          JSON.stringify(product.features),
          product.is_featured,
          product.rating,
          product.reviews_count,
        ]
      );
    }

    console.log("💬 Inserting sample testimonials...");

    // Insert sample testimonials
    for (const testimonial of sampleTestimonials) {
      await runQuery(
        `
        INSERT INTO testimonials 
        (customer_name, customer_role, customer_location, rating, testimonial_text, is_approved, is_featured)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          testimonial.customer_name,
          testimonial.customer_role,
          testimonial.customer_location,
          testimonial.rating,
          testimonial.testimonial_text,
          testimonial.is_approved,
          testimonial.is_featured,
        ]
      );
    }

    console.log("👤 Inserting sample admin user...");

    // Insert sample admin user
    await runQuery(
      `
      INSERT INTO admin_users 
      (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `,
      [
        sampleAdmin.username,
        sampleAdmin.email,
        sampleAdmin.password_hash,
        sampleAdmin.role,
      ]
    );

    console.log("✅ Database initialization completed successfully!");
    console.log("📋 Sample data inserted:");
    console.log(`   - ${sampleProducts.length} products`);
    console.log(`   - ${sampleTestimonials.length} testimonials`);
    console.log(`   - 1 admin user (username: ${sampleAdmin.username})`);
    console.log("\n🔑 Admin login credentials:");
    console.log(`   Email: ${sampleAdmin.email}`);
    console.log(`   Password: password`);
    console.log("\n🚀 You can now start the server with: npm run dev");
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    process.exit(1);
  }
}

// Fungsi untuk menghapus semua produk
export async function deleteAllProducts() {
  try {
    const connection = await pool.getConnection();
    await connection.execute("DELETE FROM products");
    connection.release();
    console.log("✅ Semua produk berhasil dihapus!");
  } catch (error) {
    console.error("❌ Gagal menghapus produk:", error.message);
  }
}

// Jika dijalankan langsung: node scripts/initDatabase.js delete-products
if (process.argv[2] === "delete-products") {
  deleteAllProducts().then(() => process.exit(0));
}

// Run the initialization
initData();
