import {
  initializeDatabase,
  runQuery,
  getAllRows,
} from "../config/database.js";
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
    category: "wisuda",
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
    category: "balon",
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
    category: "wisuda",
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
    category: "wisuda",
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
    category: "pernikahan",
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
    category: "wisuda",
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

async function initData() {
  try {
    console.log("🔄 Initializing database...");

    // Create data directory
    const dataDir = path.join(__dirname, "../data");
    await fs.mkdir(dataDir, { recursive: true });

    // Create uploads directory
    const uploadsDir = path.join(__dirname, "../uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Initialize database tables
    await initializeDatabase();

    // Check if data already exists
    const existingProducts = await getAllRows(
      "SELECT COUNT(*) as count FROM products",
    );
    if (existingProducts[0].count > 0) {
      console.log(
        "⚠️  Database already contains data. Skipping sample data insertion.",
      );
      return;
    }

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
          product.is_featured ? 1 : 0,
          product.rating,
          product.reviews_count,
        ],
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
          testimonial.is_approved ? 1 : 0,
          testimonial.is_featured ? 1 : 0,
        ],
      );
    }

    console.log("✅ Database initialization completed successfully!");
    console.log(
      `📊 Inserted ${sampleProducts.length} products and ${sampleTestimonials.length} testimonials`,
    );
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
}

// Run initialization
initData();
