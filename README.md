# 🎓 Tokobucket Backend - MySQL Version

Backend API untuk Tokobucket (Bucket Wisuda & Dekorasi) menggunakan **MySQL** database.

## 🚀 Fitur

- ✅ **MySQL Database** - Database yang powerful dan scalable
- ✅ **RESTful API** - Endpoint yang terstruktur dan mudah digunakan
- ✅ **Authentication** - JWT-based authentication untuk admin
- ✅ **File Upload** - Upload gambar produk dan galeri dengan Multer
- ✅ **Product Management** - CRUD operations untuk produk dengan image upload
- ✅ **Admin Panel** - Dashboard admin untuk manajemen produk
- ✅ **Rate Limiting** - Proteksi dari spam dan abuse
- ✅ **Security** - Helmet, CORS, dan validasi input
- ✅ **Compression** - Optimasi performa dengan gzip
- ✅ **Penghapusan Gambar Otomatis** - Gambar produk otomatis dihapus saat produk dihapus atau diupdate
- ✅ **Cleanup Gambar Orphaned** - Membersihkan gambar yang tidak terpakai

## 📤 Product Management Features

### 🖼️ Upload Gambar Produk

- **Multer Integration** - File upload middleware
- **Image Validation** - Hanya file gambar yang diperbolehkan
- **Size Limit** - Maksimal 5MB per file
- **Unique Filename** - Generate nama file unik dengan timestamp
- **Error Handling** - Comprehensive error handling untuk upload

### ➕ Tambah Produk Baru

```bash
POST /api/products
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- image: [file] (optional)
- name: "Bucket Wisuda Premium"
- description: "Deskripsi produk"
- price: 150000
- category: "wisuda"
- features: ["Bunga Segar", "Custom Design"]
- is_featured: true
```

### ✏️ Update Produk

```bash
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- image: [file] (optional)
- name: "Nama Produk Updated"
- price: 160000
- features: ["Feature 1", "Feature 2"]
```

### 🗑️ Hapus Produk (Soft Delete)

```bash
DELETE /api/products/:id
Authorization: Bearer <token>
```

### 🔄 Toggle Status

```bash
# Toggle Featured Status
PUT /api/products/:id/toggle-featured

# Toggle Active Status
PUT /api/products/:id/toggle-active
```

### 📊 Admin Panel

```bash
# Get All Products (including inactive)
GET /api/products/admin/all?limit=50&offset=0&category=wisuda&status=active
```

## 📋 Prerequisites

Sebelum menjalankan project ini, pastikan Anda memiliki:

- **Node.js** (versi 18 atau lebih baru)
- **MySQL** (versi 8.0 atau lebih baru)
- **npm** atau **yarn**

## 🗄️ Database Setup

### 1. Install MySQL

- Download dan install MySQL dari [mysql.com](https://dev.mysql.com/downloads/)
- Atau gunakan XAMPP/WAMP yang sudah include MySQL

### 2. Buat Database

```bash
# Login ke MySQL
mysql -u root -p

# Buat database
CREATE DATABASE balon_tegal;
USE balon_tegal;

# Atau import file SQL yang sudah disediakan
mysql -u root -p < balon_tegal.sql
```

### 3. Konfigurasi Environment

Buat file `.env` di root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=balon_tegal
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

## 🛠️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/Bl4cklotus007/Tokobucket-backend.git
cd Tokobucket-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
# Import database schema dan sample data
mysql -u root -p < balon_tegal.sql

# Atau jalankan script inisialisasi
npm run init-db
```

### 4. Start Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Products

- `GET /api/products` - Get all active products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/featured/list` - Get featured products
- `GET /api/products/categories/stats` - Get category statistics
- `GET /api/products/admin/all` - Get all products (Admin only)
- `POST /api/products` - Create new product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Soft delete product (Admin only)
- `PUT /api/products/:id/toggle-featured` - Toggle featured status (Admin only)
- `PUT /api/products/:id/toggle-active` - Toggle active status (Admin only)
- `POST /api/products/cleanup-images` - Clean up orphaned images (Admin only)

### Orders

- `GET /api/orders` - Get all orders (Admin only)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status (Admin only)

### Testimonials

- `GET /api/testimonials` - Get all approved testimonials
- `GET /api/testimonials/featured` - Get featured testimonials
- `POST /api/testimonials` - Create new testimonial
- `PUT /api/testimonials/:id` - Update testimonial (Admin only)
- `DELETE /api/testimonials/:id` - Delete testimonial (Admin only)

### Contact

- `GET /api/contact` - Get all contact messages (Admin only)
- `POST /api/contact` - Send contact message

### Admin Authentication

- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Admin registration (Superadmin only)
- `GET /api/auth/me` - Get admin profile

## 🔐 Admin Login

Setelah setup database, Anda bisa login dengan:

```
Username: admin
Password: password
```

## 📁 Project Structure

```
Tokobucket-backend/
├── config/
│   └── database.js          # MySQL connection & queries
├── middleware/
│   ├── auth.js              # JWT authentication
│   └── upload.js            # File upload handling (Multer)
├── routes/
│   ├── admin.js             # Admin routes
│   ├── auth.js              # Authentication routes
│   ├── contact.js           # Contact form routes
│   ├── orders.js            # Order management routes
│   ├── products.js          # Product management routes
│   └── testimonials.js      # Testimonial routes
├── scripts/
│   └── initDatabase.js      # Database initialization
├── uploads/                 # Uploaded files directory
├── balon_tegal.sql          # Database schema
├── PRODUCT_MANAGEMENT.md    # Product management documentation
├── package.json
├── server.js                # Main server file
└── README.md
```

## 🗄️ Database Schema

### Tables

- **products** - Product catalog dengan image_url dan features JSON
- **orders** - Customer orders
- **testimonials** - Customer reviews
- **contact_messages** - Contact form submissions
- **admin_users** - Admin accounts
- **galleries** - Image gallery

### Product Categories

- `wisuda` - Bucket wisuda dan hadiah
- `balon` - Dekorasi balon
- `pernikahan` - Dekorasi pernikahan

### Product Features

- **image_url** - Path ke gambar produk
- **features** - JSON array untuk fitur produk
- **is_featured** - Status unggulan
- **is_active** - Status aktif/nonaktif
- **rating** - Rating produk
- **reviews_count** - Jumlah review

## 🚀 Testing Product Management

### Test Upload & Add Product

```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Add new product with image
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <token>" \
  -F "image=@product-image.jpg" \
  -F "name=Bucket Test" \
  -F "price=150000" \
  -F "category=wisuda"
```

### Test Update Product

```bash
curl -X PUT http://localhost:5000/api/products/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","price":160000}'
```

### Test Toggle Featured

```bash
curl -X PUT http://localhost:5000/api/products/1/toggle-featured \
  -H "Authorization: Bearer <token>"
```

## 🚀 Deployment

### Production Setup

1. Set `NODE_ENV=production` di `.env`
2. Gunakan strong JWT secret
3. Setup MySQL dengan user dedicated
4. Configure reverse proxy (nginx/apache)
5. Setup SSL certificate
6. Configure file upload directory permissions

## 📚 Documentation

- [Product Management Guide](./PRODUCT_MANAGEMENT.md) - Detailed guide for product management features
- [API Documentation](./API_DOCS.md) - Complete API reference
- [Database Schema](./DATABASE_SCHEMA.md) - Database structure documentation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini atau hubungi:

- Email: admin@balon-tegal.com
- Website: [balon-tegal.com](https://balon-tegal.com)

## 📄 Penghapusan Gambar Otomatis

Sistem ini memiliki fitur penghapusan gambar otomatis yang canggih:

### 1. Saat Produk Dihapus

- Gambar produk otomatis dihapus dari folder `uploads/`
- Mendukung berbagai format gambar (jpg, jpeg, png, gif, webp)
- Error handling yang robust - produk tetap dihapus meski gambar gagal dihapus
- Logging detail untuk tracking

### 2. Saat Produk Diupdate

- Gambar lama otomatis dihapus saat upload gambar baru
- Mencegah akumulasi file gambar yang tidak terpakai
- Validasi file existence sebelum penghapusan

### 3. Cleanup Gambar Orphaned

- Endpoint `/api/products/cleanup-images` untuk membersihkan gambar yang tidak terpakai
- Mencari file gambar yang ada di folder tapi tidak direferensikan di database
- Menghapus file orphaned secara aman
- Laporan detail hasil cleanup

### 4. Helper Function

- `deleteImageFile()` - fungsi helper untuk penghapusan gambar yang konsisten
- Mendukung URL eksternal dan lokal
- Error handling yang komprehensif
- Logging untuk debugging

## 📄 Kategori Produk

Sistem menggunakan 3 kategori utama yang konsisten:

1. **bucket** - Bucket Wisuda
2. **balon** - Dekorasi Balon
3. **pernikahan** - Dekorasi Pernikahan

## 📄 Monitoring

Sistem menyediakan logging detail untuk:

- Penghapusan gambar (berhasil/gagal)
- Upload gambar
- Operasi CRUD produk
- Error handling
- Cleanup operations
