# Thiết lập Development Local

Hướng dẫn này giải thích cách thiết lập một môi trường development local cho LegoCity.

!!! info "Đối tượng Mục tiêu"
Hướng dẫn này dành cho contributors muốn:

    - Chạy dashboard và PayloadCMS locally
    - Thử nghiệm với blocks và views mới
    - Phát triển update servers và proxy behaviour

    Các hướng dẫn là generic và có thể được áp dụng cho việc bạn chạy everything với Docker, trên VM, hoặc trực tiếp trên laptop của bạn.

---

## Điều kiện Tiên quyết

### Công cụ Bắt buộc

=== "Git"
Clone repository và quản lý branches

    ```bash
    git --version
    ```

=== "Node.js"
Sử dụng một version tương thích với dashboard và PayloadCMS

    - Kiểm tra `.nvmrc` hoặc field `engines` trong `package.json`
    - Nếu không, sử dụng phiên bản LTS gần đây

    ```bash
    node --version
    ```

=== "Package Manager"
Sử dụng package manager được chỉ định bởi repository:

    - `pnpm-lock.yaml` có mặt → sử dụng **pnpm**
    - `yarn.lock` có mặt → sử dụng **yarn**
    - Nếu không → sử dụng **npm**

=== "Docker (Tùy chọn)"
Được khuyến nghị cho việc chạy supporting services

    - Context broker
    - Databases
    - Đơn giản hóa việc khớp deployment configuration

    ```bash
    docker --version
    docker compose version
    ```

### Mapbox Access Token

!!! warning "Bắt buộc cho Map Rendering"
Bạn sẽ cần một Mapbox access token để render maps trong dashboard.

    Lấy một cái tại [mapbox.com](https://www.mapbox.com/) và cung cấp nó qua:
    ```
    NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
    ```

---

## Cấu trúc Repository

```
LegoCity/
├── dashboard/          # Ứng dụng Next.js
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── package.json   # Dependencies
├── docs/              # Tài liệu MkDocs
│   ├── index.md      # Site này
│   └── mkdocs.yml    # Config
├── orion-ld/         # Cấu hình NGSI-LD broker
├── proto/            # Prototypes
└── README.md         # Tổng quan dự án
```

**Core pattern:** `dashboard` + `docs` + `broker` + `support`

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity
```

### 2. Tạo Feature Branch

```bash
git checkout -b feature/my-change
```

### 3. Cài đặt Dependencies

=== "Sử dụng pnpm"
`bash
    cd dashboard
    pnpm install
    `

=== "Sử dụng npm"
`bash
    cd dashboard
    npm install
    `

=== "Sử dụng yarn"
`bash
    cd dashboard
    yarn install
    `

---

## Cấu hình Environment

### Tạo Environment File

Tạo `.env` hoặc `.env.local` trong thư mục `dashboard/`:

```env title="dashboard/.env"
# Cấu hình API
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here

# PayloadCMS Database
DATABASE_URI=mongodb://localhost:27017/legocity

# PayloadCMS Secret (tối thiểu 32 ký tự)
PAYLOAD_SECRET=your-secret-key-here-min-32-chars

# NGSI-LD Broker
BROKER_URL=http://localhost:1026

# Tùy chọn: Domain-specific write keys
BROKER_WRITE_KEY_ENVIRONMENT=key_env
BROKER_WRITE_KEY_MOBILITY=key_mobility
```

!!! danger "Lưu ý Bảo mật"
Không bao giờ commit các file `.env` chứa secrets thực vào version control!

---

## Chạy Ứng dụng

### Option 1: Docker Compose (Được khuyến nghị)

Khởi động tất cả services cùng lúc:

```bash
# Từ repository root
docker compose up
```

Hoặc sử dụng Makefile:

```bash
make dev
```

Điều này khởi động:

- Context broker
- MongoDB database
- PayloadCMS
- Dashboard
- Proxy (nếu được cấu hình)
- Update servers (nếu được cấu hình)

**Access URLs:**

| Service          | URL                         |
| ---------------- | --------------------------- |
| Dashboard        | http://localhost:3000       |
| PayloadCMS Admin | http://localhost:3000/admin |
| Context Broker   | http://localhost:1026       |

### Option 2: Chế độ Thủ công

Chạy services riêng lẻ:

#### Khởi động Dashboard

=== "pnpm"
`bash
    cd dashboard
    pnpm dev
    `

=== "npm"
`bash
    cd dashboard
    npm run dev
    `

=== "yarn"
`bash
    cd dashboard
    yarn dev
    `

#### Khởi động PayloadCMS

Nếu tách biệt khỏi dashboard:

```bash
cd cms  # hoặc thư mục liên quan
npm run dev
```

!!! tip "Kết nối Database"
Đảm bảo MongoDB có thể truy cập được trước khi khởi động PayloadCMS

---

## Thiết lập Ban đầu

### 1. Tạo Admin Account

1. Điều hướng đến http://localhost:3000/admin
2. Điền vào registration form:
   - Email
   - Password (tối thiểu 8 ký tự)
3. Xác nhận tạo account

### 2. Seed Data (Tùy chọn)

Chạy seed scripts để populate sample data:

```bash
# Example command (kiểm tra package.json cho script thực tế)
npm run seed
```

Xem [Seed Database guide](../development/seed-data.md) cho chi tiết.

---

## Development Commands

Các lệnh phổ biến từ thư mục `dashboard/`:

| Command         | Description                         |
| --------------- | ----------------------------------- |
| `npm run dev`   | Khởi động dev server với hot reload |
| `npm run build` | Build production bundle             |
| `npm run start` | Khởi động production server         |
| `npm run lint`  | Lint codebase                       |
| `npm run test`  | Chạy tests                          |

!!! tip "Kiểm tra package.json"
Các lệnh thực tế có thể khác nhau. Luôn kiểm tra `package.json` cho các scripts có sẵn.

---

## Git Workflow

### Best Practices

1.  **Làm việc trên feature branches** (không phải `main`)
2.  **Giữ commits focused** và mạch lạc
3.  **Chạy tests trước PR** (nếu được cấu hình)
4.  **Cập nhật docs** khi thêm features
5.  **Tuân theo hướng dẫn CONTRIBUTING.md** (nếu tồn tại)

### Example Workflow

```bash
# Tạo feature branch
git checkout -b feature/new-block

# Thực hiện thay đổi
# ... edit files ...

# Stage và commit
git add .
git commit -m "feat: add weather block component"

# Push lên remote
git push origin feature/new-block

# Tạo Pull Request trên GitHub
```

---

## Troubleshooting

### Port Đã được Sử dụng

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Giải pháp:** Thay đổi port hoặc kill process:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Giải pháp:** Đảm bảo MongoDB đang chạy:

```bash
# Với Docker
docker compose up mongodb

# Hoặc kiểm tra service status
docker ps | grep mongo
```

### Missing Environment Variables

```
Error: NEXT_PUBLIC_MAPBOX_TOKEN is not defined
```

**Giải pháp:** Kiểm tra file `.env` tồn tại và chứa các variables bắt buộc.

---

## Tóm tắt

!!! success "Development Environment Sẵn sàng"
Bạn bây giờ nên có:

    -  Repository đã clone và dependencies đã cài đặt
    -  Environment variables đã cấu hình
    -  Services đang chạy (Docker hoặc manual)
    -  Admin account đã tạo
    -  Hiểu biết về development workflow

**Các Bước Tiếp theo:**

- [Tạo custom blocks](../development/blocks.md)
- [Viết PayloadCMS plugins](../development/plugins.md)
- [Thêm seed data](../development/seed-data.md)
