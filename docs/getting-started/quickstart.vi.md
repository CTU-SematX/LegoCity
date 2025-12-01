# Hướng dẫn khởi động nhanh

Chạy LegoCity trong 5 phút.

## 1. Kiểm tra yêu cầu

Xác minh bạn có các công cụ cần thiết:

```powershell
# Kiểm tra phiên bản Node.js (cần 18+)
node --version

# Kiểm tra pnpm (cài nếu chưa có)
pnpm --version

# Nếu chưa cài pnpm:
npm install -g pnpm

# Kiểm tra MongoDB đang chạy
mongosh --eval "db.version()"
```

## 2. Clone & Cài đặt

```bash
# Clone kho lưu trữ
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity/dashboard

# Cài các gói phụ thuộc
pnpm install
```

## 3. Cấu hình môi trường

Tạo file `.env`:

```bash
cp .env.example .env
```

Cấu hình tối thiểu:

```env
# Database
DATABASE_URI=mongodb://127.0.0.1/legocity

# Bảo mật
PAYLOAD_SECRET=your-secret-key-min-32-chars

# Server
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

!!! tip "Tạo Secret Key"
`bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    `

## 4. Khởi động Server Phát triển

```bash
pnpm dev
```

Bạn sẽ thấy:

```
✓ Ready in 3.2s
○ Local:   http://localhost:3000
```

## 5. Truy cập Bảng điều khiển

Mở trình duyệt:

- **Giao diện người dùng**: [http://localhost:3000](http://localhost:3000)
- **Bảng quản trị**: [http://localhost:3000/admin](http://localhost:3000/admin)

### Đăng nhập lần đầu

Tạo tài khoản admin đầu tiên khi truy cập `/admin`:

- Email: admin@example.com
- Password: (chọn mật khẩu mạnh)

## 6. Khám phá Bảng điều khiển

### Các tính năng chính

- 📄 **Pages** - Tạo và quản lý trang
- 📝 **Posts** - Viết blog và bài viết
- 🖼️ **Media** - Tải lên và quản lý ảnh, video
- 👥 **Users** - Quản lý người dùng
- 🗺️ **Map View** - Xem dữ liệu trên bản đồ

### Tạo trang đầu tiên

1. Đi đến `/admin/collections/pages`
2. Click "Create New"
3. Điền tiêu đề và nội dung
4. Publish!

## Các bước tiếp theo

### Tùy chỉnh

- 🎨 [Tạo Custom Blocks](../development/blocks.md)
- 🔌 [Viết Plugins](../development/plugins.md)
- ⚙️ [Cấu hình nâng cao](../configuration/index.md)

### Tích hợp dữ liệu

- 📡 [Kết nối IoT Sensors](../user-guide/data-and-brokers.md)
- 🔗 [Làm việc với NGSI-LD](../user-guide/entities.md)
- 🗺️ [Cấu hình Map Services](../configuration/data-sources.md)

### Triển khai

- 🐳 [Sử dụng Docker](../installation/docker.md)
- ☁️ [Triển khai lên AWS](../deployment/aws.md)
- 🚀 [Thực hành tốt nhất cho môi trường sản xuất](../deployment/operations.md)

## Xử lý sự cố

### Port đã được sử dụng

```bash
# Thay đổi port trong .env
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

Sau đó chạy:

```bash
PORT=3001 pnpm dev
```

### MongoDB connection error

Kiểm tra MongoDB đang chạy:

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### Module không tìm thấy

Xóa và cài lại:

```bash
rm -rf node_modules
pnpm install
```

## Cần trợ giúp?

- 📚 [Hướng dẫn khắc phục sự cố](../reference/troubleshooting.md)
- 💬 [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)
- 🐛 [Report Issues](https://github.com/CTU-SematX/LegoCity/issues)

## Học thêm

- 🏗️ [Kiến trúc hệ thống](architecture.md)
- 📖 [Hướng dẫn đầy đủ](../user-guide/index.md)
- 👨‍💻 [Hướng dẫn phát triển](../development/index.md)
