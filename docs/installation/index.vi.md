# Tổng quan Cài đặt

LegoCity có thể được cài đặt trong các môi trường khác nhau tùy thuộc vào nhu cầu của bạn.

## Các lộ trình Cài đặt

### Dành cho Người dùng & Vận hành

Nếu bạn muốn **triển khai và sử dụng** LegoCity:

1. **[Khởi động Nhanh](../getting-started/quickstart.md)** - Chạy trong 5 phút
2. **[Cài đặt Local](local.md)** - Thiết lập phát triển local đầy đủ
3. **[Triển khai Production](../deployment/index.md)** - Triển khai lên servers

### Dành cho Developers & Contributors

Nếu bạn muốn **phát triển và đóng góp** cho LegoCity:

1. **[Môi trường Phát triển](development.md)** - Thiết lập dev đầy đủ
2. **[Cài đặt Local](local.md)** - Thiết lập môi trường local
3. **[Hướng dẫn Phát triển](../development/index.md)** - Bắt đầu xây dựng

## Chọn Thiết lập của bạn

### Phát triển Local (Được khuyến nghị cho Phát triển)

**Tốt nhất cho**: Developers, contributors, testing changes

**Bạn nhận được gì**:

- ✅ Kiểm soát hoàn toàn codebase
- ✅ Hot reload trong quá trình phát triển
- ✅ Debug dễ dàng
- ✅ Chạy tests locally

**Yêu cầu**:

- Node.js 18+
- pnpm package manager
- MongoDB 6+
- Git

**Thời gian thiết lập**: ~15 phút

👉 [Hướng dẫn Cài đặt Local](local.md)

---

### Docker Compose (Thiết lập nhanh nhất)

**Tốt nhất cho**: Testing nhanh, demonstrations, môi trường cô lập

**Bạn nhận được gì**:

- ✅ Thiết lập một lệnh
- ✅ Tất cả services được containerized
- ✅ Dọn dẹp dễ dàng
- ✅ Môi trường có thể tái tạo

**Yêu cầu**:

- Docker Desktop hoặc Docker Engine
- Docker Compose

**Thời gian thiết lập**: ~5 phút

👉 [Hướng dẫn Thiết lập Docker](docker.md)

---

### Production Server (Cho Triển khai)

**Tốt nhất cho**: Staging, production, triển khai công khai

**Bạn nhận được gì**:

- ✅ Builds được tối ưu hóa
- ✅ Kiến trúc có khả năng mở rộng
- ✅ Cấu hình sẵn sàng production
- ✅ Hỗ trợ SSL/HTTPS

**Yêu cầu**:

- Linux server (Ubuntu/Debian được khuyến nghị)
- Node.js, MongoDB, Nginx
- Tên miền (tùy chọn)

**Thời gian thiết lập**: ~30 phút

👉 [Hướng dẫn Triển khai Production](../deployment/vm-docker.md)

---

## Yêu cầu Hệ thống

### Yêu cầu Tối thiểu

| Component   | Yêu cầu                       |
| ----------- | ----------------------------- |
| **CPU**     | 2 cores                       |
| **RAM**     | 4 GB                          |
| **Storage** | 10 GB dung lượng trống        |
| **OS**      | Windows 10+, macOS 11+, Linux |

### Yêu cầu Được khuyến nghị

| Component   | Yêu cầu                  |
| ----------- | ------------------------ |
| **CPU**     | 4+ cores                 |
| **RAM**     | 8+ GB                    |
| **Storage** | 20+ GB SSD               |
| **Network** | Kết nối internet ổn định |

### Phụ thuộc Phần mềm

#### Bắt buộc

- **Node.js**: 18.x hoặc 20.x (phiên bản LTS)
- **pnpm**: 8.x hoặc mới hơn
- **MongoDB**: 6.x hoặc mới hơn
- **Git**: 2.x hoặc mới hơn

#### Tùy chọn

- **Docker**: 24.x hoặc mới hơn (cho thiết lập containerized)
- **Nginx**: 1.18+ (cho production proxy)
- **Redis**: 7.x (cho caching)

## So sánh Phương pháp Cài đặt

| Tính năng           | Local Dev  | Docker Compose | Production |
| ------------------- | ---------- | -------------- | ---------- |
| Thời gian thiết lập | 15 phút    | 5 phút         | 30 phút    |
| Độ khó              | Trung bình | Dễ             | Khó        |
| Tùy chỉnh           | Cao        | Trung bình     | Cao        |
| Hiệu suất           | Tốt nhất   | Tốt            | Tốt nhất   |
| Khả năng mở rộng    | Thấp       | Thấp           | Cao        |
| Cho Phát triển      | ✅         | ⚠️             | ❌         |
| Cho Production      | ❌         | ⚠️             | ✅         |

## Checklist Trước khi Cài đặt

Trước khi bắt đầu cài đặt:

- [ ] Xác minh đáp ứng yêu cầu hệ thống
- [ ] Cài đặt phần mềm cần thiết (Node.js, pnpm, MongoDB)
- [ ] Có sẵn Mapbox access token (cho maps)
- [ ] Chuẩn bị tên miền (chỉ cho production)
- [ ] Xem lại [Tổng quan Kiến trúc](../getting-started/architecture.md)

## Vấn đề Cài đặt Thường gặp

### Không khớp Phiên bản Node.js

**Vấn đề**: Sử dụng phiên bản Node.js không được hỗ trợ

**Giải pháp**:

```bash
# Cài đặt nvm (Node Version Manager)
# Sau đó sử dụng phiên bản node của project
nvm install 18
nvm use 18
```

### Kết nối MongoDB Thất bại

**Vấn đề**: MongoDB không chạy hoặc connection string sai

**Giải pháp**:

```bash
# Windows
net start MongoDB

# Linux/macOS
sudo systemctl start mongod

# Hoặc sử dụng Docker
docker run -d -p 27017:27017 mongo:6
```

### Port Đã được Sử dụng

**Vấn đề**: Port 3000 đã bị chiếm

**Giải pháp**:

```bash
# Tìm và kill process
npx kill-port 3000

# Hoặc sử dụng port khác
PORT=3001 pnpm dev
```

### Không tìm thấy pnpm

**Vấn đề**: pnpm chưa được cài đặt globally

**Giải pháp**:

```bash
npm install -g pnpm
```

## Sau khi Cài đặt

Sau khi cài đặt thành công:

1. **Xác minh Thiết lập**

   - [ ] Dashboard tải tại http://localhost:3000
   - [ ] Admin panel có thể truy cập tại /admin
   - [ ] Có thể tạo tài khoản người dùng đầu tiên
   - [ ] Maps render đúng

2. **Cấu hình Ban đầu**

   - [ ] Thiết lập tài khoản admin
   - [ ] Cấu hình data sources ([Hướng dẫn Cấu hình](../configuration/index.md))
   - [ ] Tải dữ liệu mẫu (tùy chọn)

3. **Các bước Tiếp theo**
   - Đọc [Hướng dẫn Sử dụng](../user-guide/index.md) để học các tính năng
   - Khám phá [Hướng dẫn Phát triển](../development/index.md) để tùy chỉnh
   - Kiểm tra [Cấu hình](../configuration/index.md) cho thiết lập nâng cao

## Nhận Trợ giúp

Nếu bạn gặp vấn đề:

- 📖 [Hướng dẫn Khắc phục Sự cố](../reference/troubleshooting.md)
- 🐛 [GitHub Issues](https://github.com/CTU-SematX/LegoCity/issues)
- 💬 [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)
- 📧 Liên hệ: CTU-SematX Team

---

**Sẵn sàng cài đặt?** Chọn phương pháp cài đặt của bạn:

- [Thiết lập Phát triển Local](local.md) - Dành cho developers
- [Thiết lập Docker](docker.md) - Khởi động nhanh với containers
- [Triển khai Production](../deployment/vm-docker.md) - Cho staging/production
