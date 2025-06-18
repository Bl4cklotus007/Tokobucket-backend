# Bucket Wisuda & Dekorasi - Backend API

Backend API untuk website Toko Bucket Wisuda & Dekorasi. Dibangun dengan Node.js, Express, dan SQLite.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm atau yarn

### Installation

1. **Install dependencies**

```bash
cd backend
npm install
```

2. **Setup environment variables**

```bash
cp .env.example .env
# Edit .env file sesuai konfigurasi Anda
```

3. **Initialize database**

```bash
npm run init-db
```

4. **Start development server**

```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000`

## 📁 Struktur Folder

```
backend/
├── config/
│   └── database.js          # Konfigurasi database SQLite
├── routes/
│   ├── products.js          # API endpoints untuk produk
│   ├── orders.js            # API endpoints untuk pesanan
│   ├── testimonials.js      # API endpoints untuk testimoni
│   ├── contact.js           # API endpoints untuk kontak
│   └── admin.js             # API endpoints untuk admin
├── scripts/
│   └── initDatabase.js      # Script inisialisasi database
├── data/
│   └── bucket_wisuda.db     # Database SQLite (auto-generated)
├── uploads/                 # Folder untuk upload gambar
├── server.js                # Main server file
└── package.json
```

## 🔌 API Endpoints

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/featured/list` - Get featured products
- `POST /api/products` - Create new product (admin)

### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/quote` - Get price quote
- `PUT /api/orders/:id/status` - Update order status (admin)

### Testimonials

- `GET /api/testimonials` - Get all approved testimonials
- `GET /api/testimonials/featured` - Get featured testimonials
- `POST /api/testimonials` - Submit new testimonial

### Contact

- `POST /api/contact` - Submit contact message
- `POST /api/contact/whatsapp` - Generate WhatsApp link

### Admin

- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/orders/pending` - Get pending orders
- `GET /api/admin/reports/sales` - Get sales report

## 💾 Database Schema

### Products

```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT NOT NULL)
- description (TEXT)
- price (INTEGER NOT NULL)
- original_price (INTEGER)
- category (TEXT NOT NULL) -- 'wisuda', 'balon', 'pernikahan'
- image_url (TEXT)
- features (TEXT) -- JSON string
- rating (REAL DEFAULT 5.0)
- reviews_count (INTEGER DEFAULT 0)
- is_featured (BOOLEAN DEFAULT 0)
- is_active (BOOLEAN DEFAULT 1)
- created_at, updated_at
```

### Orders

```sql
- id (INTEGER PRIMARY KEY)
- customer_name, customer_phone, customer_email, customer_address
- order_type (TEXT) -- 'standard' or 'custom'
- product_id (INTEGER, FK to products)
- custom_description (TEXT)
- quantity (INTEGER DEFAULT 1)
- total_price (INTEGER)
- status (TEXT) -- 'pending', 'confirmed', 'processing', 'completed', 'cancelled'
- notes (TEXT)
- created_at, updated_at
```

### Testimonials

```sql
- id (INTEGER PRIMARY KEY)
- customer_name, customer_role, customer_location
- rating (INTEGER 1-5)
- testimonial_text (TEXT NOT NULL)
- image_url (TEXT)
- is_approved, is_featured (BOOLEAN)
- created_at
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 menit per IP
- **CORS**: Konfigurasi untuk frontend domain
- **Helmet**: Security headers
- **Input Validation**: Menggunakan express-validator
- **SQL Injection Protection**: Parameterized queries

## 📝 Sample Data

Database akan diisi dengan sample data:

- 6 produk bucket wisuda dan dekorasi
- 5 testimoni pelanggan
- Berbagai kategori produk (wisuda, balon, pernikahan)

## 🔧 Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server dengan nodemon
- `npm run init-db` - Initialize database dengan sample data

### Environment Variables

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
WHATSAPP_NUMBER=6281234567890
```

## 🚀 Production Deployment

1. **Set environment**

```bash
NODE_ENV=production
```

2. **Setup production database**

```bash
npm run init-db
```

3. **Start server**

```bash
npm start
```

## 🐛 Troubleshooting

### Database Issues

```bash
# Hapus database dan buat ulang
rm data/bucket_wisuda.db
npm run init-db
```

### Permission Issues

```bash
# Pastikan folder data dan uploads writable
chmod 755 data/
chmod 755 uploads/
```

## 📞 API Testing

### Health Check

```bash
curl http://localhost:5000/api/health
```

### Get Products

```bash
curl http://localhost:5000/api/products
```

### Create Order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "customer_phone": "081234567890",
    "order_type": "custom",
    "custom_description": "Bucket wisuda warna biru dan putih"
  }'
```

Untuk pertanyaan atau bantuan lebih lanjut, silakan hubungi tim development.
