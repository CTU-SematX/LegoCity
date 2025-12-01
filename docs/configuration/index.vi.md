# Hướng dẫn Cấu hình

Cấu hình LegoCity để làm việc với data sources, maps và services của thành phố bạn.

## Tổng quan Cấu hình

Cấu hình trong LegoCity xảy ra ở ba nơi:

1. **Environment Variables** (`.env`) - Thông tin bí mật, URLs, khóa API
2. **PayloadCMS Admin** - Content, pages, blocks, collections
3. **Code Configuration** - Tùy chỉnh nâng cao, plugins

## Danh sách Kiểm tra Cấu hình Nhanh

Sau khi cài đặt, cấu hình những điều cần thiết này:

- [ ] **[Data Sources](data-sources.md)** - Kết nối NGSI-LD brokers
- [ ] **Cài đặt Bản đồ** - Cấu hình Mapbox và map views (xem bên dưới)
- [ ] **[Khóa API](api-keys.md)** - Thiết lập khóa dịch vụ bên ngoài
- [ ] **Người dùng Quản trị** - Tạo admin accounts và roles trong PayloadCMS
- [ ] **Tích hợp AI** (Tùy chọn) - Cấu hình AI helpers (xem phần Tích hợp AI)

## Cấu hình môi trường

### Core Settings (`.env`)

```env
# ================================
# Database
# ================================
DATABASE_URI=mongodb://127.0.0.1/legocity

# ================================
# Security
# ================================
PAYLOAD_SECRET=your-secret-key-minimum-32-characters-long

# ================================
# Server
# ================================
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
PORT=3000

# ================================
# NGSI-LD Context Broker
# ================================
NGSI_LD_BROKER_URL=http://localhost:1026
NGSI_LD_TENANT=your-tenant-name

# ================================
# Mapbox
# ================================
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_access_token

# ================================
# Dịch vụ tùy chọn
# ================================
# Lưu đệm Redis
REDIS_URL=redis://localhost:6379

# Các API bên ngoài (lưu trữ phía server)
WEATHER_API_KEY=your-weather-api-key
GEOCODING_API_KEY=your-geocoding-api-key
```

### Thực hành bảo mật tốt nhất

!!! warning "Never Commit Secrets" - Add `.env` to `.gitignore` - Use different secrets per environment - Rotate keys regularly

**Generate secure secrets**:

```bash
# Generate PAYLOAD_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 32
```

**Environment-specific files**:

```
.env                    # Local development (gitignored)
.env.example            # Template (committed)
.env.production         # Production (secure storage)
.env.test               # Testing
```

## Cấu hình PayloadCMS

### Access Admin Panel

1. Navigate to `http://localhost:3000/admin`
2. Log in with admin credentials
3. Explore collections:

### Tổng quan về Collections

| Bộ sưu tập     | Mục đích               | Ví dụ                     |
| -------------- | ---------------------- | ------------------------- |
| **Pages**      | Bố cục bảng điều khiển | Home, Map View, Analytics |
| **Posts**      | Bài viết, tin tức      | Announcements, guides     |
| **Media**      | Images, files          | Icons, photos, documents  |
| **Categories** | Content organization   | News, Events, Reports     |
| **Users**      | Admin accounts         | Admins, Editors, Viewers  |

### Global Settings

**Navigation** → **Globals** → Cấu hình:

- **Header** - Logo, navigation menu, theme
- **Footer** - Links, contact info, social media
- **Site Settings** - Title, description, metadata

## Quy trình cấu hình

### Thiết lập Ban đầu

1. **Tạo Tài khoản Quản trị**

   - User đầu tiên tự động trở thành admin
   - Thêm người dùng bổ sung trong Users collection

2. **Cấu hình Cơ bản Trang web**

   - Đặt tên trang web và mô tả
   - Tải lên logo và favicon
   - Cấu hình header và footer

3. **Kết nối Nguồn Dữ liệu**

   - Thêm NGSI-LD broker URL
   - Kiểm tra kết nối
   - Cấu hình các loại entity

4. **Thiết lập Bản đồ**

   - Thêm Mapbox token
   - Tạo các map views
   - Cấu hình các lớp

5. **Tạo Trang Đầu tiên**
   - Sử dụng blocks để xây dựng bố cục
   - Thêm map views và content
   - Xuất bản trang

### Thêm một Thành phố

Cho các triển khai đa thuê bao:

1. **Tạo Thuê bao**

   ```env
   NGSI_LD_TENANT=city-name
   ```

2. **Cấu hình Nguồn Dữ liệu**

   - Trỏ đến NGSI-LD broker của thành phố
   - Ánh xạ các loại entity đến views

3. **Tùy chỉnh Thương hiệu**

   - Tải lên logo thành phố
   - Đặt màu sắc thành phố (Tailwind config)
   - Tạo các trang tùy chỉnh

4. **Tải Dữ liệu Thành phố**
   - Nạp dữ liệu khởi tạo với các entity thành phố
   - Tạo map views cho các khu vực thành phố
   - Thêm nội dung mẫu

## Cấu hình nâng cao

### Payload Config (`payload.config.ts`)

```typescript
import { buildConfig } from "payload/config";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

export default buildConfig({
  // Admin panel
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: "- LegoCity Admin",
      favicon: "/favicon.ico",
    },
  },

  // Collections
  collections: [Pages, Posts, Media, Categories, Users],

  // Database
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),

  // Editor
  editor: lexicalEditor({}),

  // Plugins
  plugins: [
    formBuilderPlugin(),
    nestedDocsPlugin(),
    redirectsPlugin(),
    seoPlugin(),
    searchPlugin(),
  ],
});
```

### Next.js Config (`next.config.js`)

```javascript
const withPayload = require("@payloadcms/next/withPayload");

module.exports = withPayload({
  // Next.js config
  reactStrictMode: true,

  // Image optimization
  images: {
    domains: ["api.mapbox.com", "your-cdn.com"],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },
});
```

## Cấu hình theo tính năng

### Data Integration

**Kết nối Context Broker**:

- [Data Sources Configuration](data-sources.md)

### Maps & Visualization

**Cấu hình Maps** - Xem PayloadCMS admin cho map configuration

### Security & Access

**Thiết lập Security**:

- [API Keys Management](api-keys.md)

### AI Features

**Enable AI Helpers** (Tùy chọn):

- Xem [AI Integration section](../ai/overview.md) cho AI provider configuration

## Xác thực cấu hình

### Health Check

Tạo health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    broker: await checkBroker(),
    mapbox: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  };

  return Response.json(checks);
}
```

Truy cập tại: `http://localhost:3000/api/health`

### Xác minh cấu hình

```bash
# Kiểm tra environment variables
pnpm run check:env

# Test database connection
pnpm run check:db

# Test NGSI-LD broker
curl http://localhost:1026/version

# Test Mapbox token
curl "https://api.mapbox.com/v4/mapbox.mapbox-streets-v8.json?access_token=$NEXT_PUBLIC_MAPBOX_TOKEN"
```

## Backup & Restore

### Sao lưu cấu hình

```bash
# Export PayloadCMS data
mongodump --db legocity --out ./backup

# Backup environment
cp .env .env.backup

# Backup media files
cp -r public/media ./backup/media
```

### Khôi phục cấu hình

```bash
# Restore database
mongorestore --db legocity ./backup/legocity

# Restore environment
cp .env.backup .env

# Restore media
cp -r ./backup/media public/media
```

## Xử lý sự cố

### Cấu hình không được áp dụng

**Clear cache**:

```bash
rm -rf .next
pnpm dev
```

**Kiểm tra environment**:

```bash
# Print config (safe variables only)
pnpm run config:show
```

### Connection Failures

**Test broker connection**:

```bash
curl http://localhost:1026/version
```

**Test database**:

```bash
mongosh $DATABASE_URI --eval "db.version()"
```

### Cấu hình không hợp lệ

**Validate schema**:

```bash
pnpm run validate:config
```

**Kiểm tra logs**:

```bash
# Development mode shows detailed errors
pnpm dev
```

## Tham khảo cấu hình

- [PayloadCMS Config API](https://payloadcms.com/docs/configuration)
- [Next.js Configuration](https://nextjs.org/docs/api-reference/next.config.js)

## Các bước tiếp theo

Sau configuration:

1. **[Hướng dẫn sử dụng](../user-guide/index.md)** - Học cách sử dụng LegoCity
2. **[Hướng dẫn phát triển](../development/index.md)** - Tùy chỉnh và mở rộng
3. **[Hướng dẫn triển khai](../deployment/index.md)** - Triển khai lên môi trường sản xuất

---

**Cần specific configuration?** Chọn topic của bạn:

- [Data Sources](data-sources.md) - Kết nối brokers
- [API Keys](api-keys.md) - External services
