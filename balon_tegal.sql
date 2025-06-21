-- Tokobucket Backend Database Schema
-- Database: balon_tegal

CREATE DATABASE IF NOT EXISTS balon_tegal;
USE balon_tegal;

-- Tabel Produk
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    category ENUM('bucket', 'balon', 'pernikahan') NOT NULL,
    image_url VARCHAR(255),
    features JSON,
    rating DECIMAL(3,2) DEFAULT 5.00,
    reviews_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100),
    customer_address TEXT,
    order_type ENUM('standard', 'custom') NOT NULL,
    product_id INT,
    custom_description TEXT,
    quantity INT DEFAULT 1,
    total_price DECIMAL(10,2),
    status ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Tabel Testimoni
CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_role VARCHAR(100),
    customer_location VARCHAR(100),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    testimonial_text TEXT NOT NULL,
    image_url VARCHAR(255),
    is_approved BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'superadmin') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Galeri
CREATE TABLE IF NOT EXISTS galleries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100),
    image_url VARCHAR(255),
    tag VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample admin user
INSERT INTO admin_users (username, email, password_hash, role) 
VALUES ('admin', 'admin@balon-tegal.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin')
ON DUPLICATE KEY UPDATE id=id;

-- Insert sample products
INSERT INTO products (name, description, price, original_price, category, image_url, features, is_featured, rating, reviews_count) VALUES
('Bucket Wisuda Premium', 'Bucket bunga mawar premium dengan dekorasi eksklusif untuk momen wisuda yang berkesan', 150000.00, 200000.00, 'bucket', '/uploads/bucket-premium.jpg', '["Bunga Segar", "Custom Design", "Gratis Kartu"]', TRUE, 5.00, 45),
('Paket Dekorasi Balon', 'Paket lengkap dekorasi balon untuk acara spesial dengan berbagai pilihan warna', 299000.00, 350000.00, 'balon', '/uploads/balloon-decoration.jpg', '["Setup Gratis", "Pilihan Warna", "Tahan 8 Jam"]', TRUE, 4.90, 32),
('Bucket Mini Love', 'Bucket mini cantik dengan sentuhan romantis, cocok untuk hadiah spesial', 99000.00, 120000.00, 'bucket', '/uploads/mini-bucket.jpg', '["Ukuran Compact", "Bunga Pilihan", "Harga Terjangkau"]', TRUE, 4.80, 67),
('Bucket Graduation Deluxe', 'Bucket wisuda mewah dengan bunga import dan dekorasi premium', 250000.00, 300000.00, 'bucket', '/uploads/bucket-deluxe.jpg', '["Bunga Import", "Premium Wrapping", "Custom Card"]', FALSE, 5.00, 23),
('Dekorasi Pernikahan Minimalis', 'Paket dekorasi pernikahan dengan konsep minimalis dan elegant', 1500000.00, 1800000.00, 'pernikahan', '/uploads/wedding-minimal.jpg', '["Setup Lengkap", "Konsep Minimalis", "Tim Decorator"]', FALSE, 4.90, 15),
('Bucket Wisuda Classic', 'Bucket wisuda klasik dengan bunga pilihan dan harga terjangkau', 85000.00, 100000.00, 'bucket', '/uploads/bucket-classic.jpg', '["Bunga Segar", "Design Klasik", "Harga Ekonomis"]', FALSE, 4.70, 89)
ON DUPLICATE KEY UPDATE id=id;

-- Insert sample testimonials
INSERT INTO testimonials (customer_name, customer_role, customer_location, rating, testimonial_text, is_approved, is_featured) VALUES
('Sarah Putri', 'Mahasiswa Universitas Gadjah Mada', 'Yogyakarta', 5, 'Bucket wisuda dari Bucket Wisuda & Dekorasi benar-benar luar biasa! Bunga-bunganya segar dan arrangementriya sangat cantik. Orang tua saya sangat terkesan dengan hasilnya. Terima kasih sudah membuat momen wisuda saya jadi lebih berkesan!', TRUE, TRUE),
('Rizki Pratama', 'Fresh Graduate Teknik', 'Jakarta', 5, 'Pelayanannya sangat memuaskan! Tim nya responsif banget dan bisa customize sesuai keinginan. Bucket wisudanya juga awet, sampai sekarang masih cantik di kamar. Recommended banget untuk teman-teman yang mau wisuda!', TRUE, TRUE),
('Anita Sari', 'Ibu dari Wisudawan', 'Bandung', 5, 'Sebagai orang tua, saya sangat senang bisa memberikan yang terbaik untuk anak saya di hari wisudanya. Bucket dari sini kualitasnya premium dan harganya reasonable. Anak saya juga senang banget!', TRUE, TRUE),
('Dimas Arya', 'Mahasiswa Pasca Sarjana', 'Surabaya', 5, 'Bucket wisuda untuk S2 saya pesan di sini dan hasilnya melebihi ekspektasi. Kombinasi warna dan bunga nya pas banget dengan toga saya. Prosesnya juga cepat, pesan hari ini besok sudah jadi!', TRUE, TRUE),
('Maya Dewi', 'Wisudawan Kedokteran', 'Semarang', 5, 'Untuk momen spesial seperti wisuda kedokteran, saya cari yang terbaik. Alhamdulillah ketemu Bucket Wisuda & Dekorasi ini. Bucket nya elegant dan sophisticated, cocok banget untuk profesi dokter. Highly recommended!', TRUE, TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- Insert sample gallery items
INSERT INTO galleries (title, image_url, tag) VALUES
('Bucket Wisuda Premium', '/uploads/gallery/bucket-premium-1.jpg', 'bucket'),
('Dekorasi Balon Birthday', '/uploads/gallery/balloon-birthday-1.jpg', 'balon'),
('Dekorasi Pernikahan', '/uploads/gallery/wedding-decor-1.jpg', 'pernikahan'),
('Bucket Mini Love', '/uploads/gallery/mini-bucket-1.jpg', 'bucket'),
('Dekorasi Graduation', '/uploads/gallery/graduation-decor-1.jpg', 'pernikahan')
ON DUPLICATE KEY UPDATE id=id;

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_name);
CREATE INDEX idx_testimonials_approved ON testimonials(is_approved);
CREATE INDEX idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX idx_galleries_tag ON galleries(tag);

-- Show table structure
SHOW TABLES; 