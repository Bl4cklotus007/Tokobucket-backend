# 🎓 Product Management API Documentation

## Overview

Sistem manajemen produk untuk Bucket Wisuda & Dekorasi dengan fitur upload gambar, CRUD operations, dan admin panel.

## 🔐 Authentication

Semua endpoint admin memerlukan authentication dengan JWT token.

### Login Admin

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

## 📤 Upload Gambar Produk

### Konfigurasi Multer

- **Storage**: Disk storage di folder `uploads/`
- **File Filter**: Hanya file gambar (image/\*)
- **Size Limit**: 5MB per file
- **Field Name**: `image`

### Middleware Upload

```javascript
import { uploadSingle, uploadMultiple } from "../middleware/upload.js";

// Single file upload
router.post("/products", uploadSingle, ...);

// Multiple files upload (max 10 files)
router.post("/products", uploadMultiple, ...);
```

### Error Handling

```javascript
import { handleUploadError } from "../middleware/upload.js";

app.use(handleUploadError);
```

## 🛍️ Product Management Endpoints

### 1. Tambah Produk Baru

```bash
POST /api/products
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- image: [file] (optional)
- name: "Bucket Wisuda Premium"
- description: "Deskripsi produk"
- price: 150000
- original_price: 180000
- category: "wisuda" | "balon" | "pernikahan"
- features: ["Bunga Segar", "Custom Design"]
- is_featured: true
```

**Response:**

```json
{
  "success": true,
  "message": "Produk berhasil ditambahkan",
  "data": {
    "id": 8,
    "image_url": "/uploads/image-1234567890.jpg"
  }
}
```

### 2. Update Produk

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

**Response:**

```json
{
  "success": true,
  "message": "Produk berhasil diupdate",
  "data": {
    "image_url": "/uploads/new-image.jpg"
  }
}
```

### 3. Soft Delete Produk

```bash
DELETE /api/products/:id
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Produk berhasil dihapus"
}
```

### 4. Toggle Featured Status

```bash
PUT /api/products/:id/toggle-featured
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Produk berhasil ditampilkan dari unggulan",
  "data": {
    "is_featured": 1
  }
}
```

### 5. Toggle Active Status

```bash
PUT /api/products/:id/toggle-active
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Produk berhasil diaktifkan",
  "data": {
    "is_active": 1
  }
}
```

### 6. Get All Products (Admin)

```bash
GET /api/products/admin/all?limit=50&offset=0&category=wisuda&status=active
Authorization: Bearer <token>
```

**Query Parameters:**

- `limit`: Jumlah produk per halaman (default: 50)
- `offset`: Offset untuk pagination (default: 0)
- `category`: Filter by category
- `status`: Filter by status ("active" | "inactive")

## 📁 File Structure

```
uploads/
├── bucket-premium.jpg
├── balloon-decoration.jpg
├── mini-bucket.jpg
└── ...

middleware/
├── upload.js          # Multer configuration
└── auth.js           # JWT authentication

routes/
└── products.js       # Product management routes
```

## 🔧 Database Schema

### Products Table

```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category ENUM('wisuda', 'balon', 'pernikahan') NOT NULL,
  image_url VARCHAR(500),
  features JSON,
  rating DECIMAL(3,2) DEFAULT 0.00,
  reviews_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🚀 Testing Examples

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

## ⚠️ Error Handling

### Upload Errors

- **File too large**: "Ukuran file maksimal 5MB"
- **Invalid file type**: "Hanya file gambar yang diperbolehkan"
- **Too many files**: "Maksimal 10 file per upload"

### Authentication Errors

- **No token**: "Token tidak ditemukan"
- **Invalid token**: "Token tidak valid"
- **Access denied**: "Anda tidak memiliki izin untuk mengakses resource ini"

### Validation Errors

- **Missing required fields**: "Nama produk harus diisi"
- **Invalid category**: "Kategori tidak valid"
- **Invalid price**: "Harga harus berupa angka positif"

## 🎯 Features Summary

✅ **Upload Gambar Produk**

- Single file upload dengan Multer
- File validation (image only, 5MB limit)
- Unique filename generation
- Error handling

✅ **Tambah Produk Baru**

- Form data dengan image upload
- Validation untuk required fields
- JSON features support
- Admin authentication

✅ **Update/Hapus Produk**

- Partial update support
- Soft delete (is_active flag)
- Toggle featured/active status
- Image update support

✅ **Admin Panel**

- Get all products (including inactive)
- Filtering by category and status
- Pagination support
- Admin-only access

## 🔒 Security Features

- JWT token authentication
- Admin role verification
- File type validation
- File size limits
- SQL injection prevention
- Input validation and sanitization

## 📝 Notes

1. **Image URLs**: Stored as relative paths (`/uploads/filename.jpg`)
2. **Features**: Stored as JSON string in database
3. **Soft Delete**: Products are marked inactive, not physically deleted
4. **File Storage**: Images stored in `uploads/` directory
5. **Admin Role**: Supports both "admin" and "superadmin" roles
