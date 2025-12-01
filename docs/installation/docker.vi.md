# Hướng dẫn thiết lập Docker

Chạy LegoCity trong containers với Docker Compose - cách nhanh nhất để bắt đầu.

## Tổng quan

**Ưu điểm**:

- ✅ Thiết lập một lệnh
- ✅ Tất cả các dịch vụ được đóng gói trong container (Next.js, MongoDB, Orion-LD)
- ✅ Nhất quán giữa các môi trường
- ✅ Dễ dàng dọn dẹp

**Nhược điểm**:

- ⚠️ Ít linh hoạt cho phát triển
- ⚠️ Yêu cầu Docker Desktop (Windows/Mac) hoặc Docker Engine (Linux)

## Yêu cầu

### Cài đặt Docker

=== "Windows"

    Tải và cài đặt [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

    ```powershell
    # Kiểm tra cài đặt
    docker --version
    docker compose version
    ```

=== "macOS"

    Tải và cài đặt [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)

    ```bash
    # Kiểm tra cài đặt
    docker --version
    docker compose version
    ```

=== "Linux"

    ```bash
    # Cài Docker Engine
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh

    # Cài Docker Compose
    sudo apt install docker-compose-plugin

    # Thêm user vào docker group
    sudo usermod -aG docker $USER
    newgrp docker

    # Kiểm tra
    docker --version
    docker compose version
    ```

### Yêu cầu hệ thống

- **RAM**: Tối thiểu 4 GB, khuyến nghị 8 GB
- **Storage**: 10 GB dung lượng trống
- **CPU**: Tối thiểu 2 cores

## Khởi động nhanh

### 1. Clone Kho lưu trữ

```bash
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity
```

### 2. Cấu hình Environment

```bash
# Copy file environment mẫu
cp dashboard/.env.example dashboard/.env
```

Chỉnh sửa `dashboard/.env`:

```env
# Database (sử dụng tên dịch vụ Docker)
DATABASE_URI=mongodb://mongodb:27017/legocity

# Bảo mật
PAYLOAD_SECRET=your-secret-key-min-32-chars

# Server (expose ra host)
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token

# NGSI-LD Broker (sử dụng tên dịch vụ Docker)
NGSI_LD_BROKER_URL=http://orion:1026
```

### 3. Khởi động tất cả Dịch vụ

```bash
docker compose up -d
```

Lệnh này sẽ khởi động:

- **Bảng điều khiển** (Next.js + PayloadCMS) - Port 3000
- **MongoDB** - Port 27017
- **Orion-LD** (NGSI-LD Broker) - Port 1026

### 4. Kiểm tra Dịch vụ

```bash
# Xem trạng thái containers
docker compose ps

# Xem logs
docker compose logs -f dashboard
```

### 5. Truy cập Bảng điều khiển

Mở trình duyệt:

- **Bảng điều khiển**: http://localhost:3000
- **Bảng quản trị**: http://localhost:3000/admin
- **Orion-LD API**: http://localhost:1026

---

## Docker Compose File

File `docker-compose.yml` mặc định:

```yaml
version: "3.8"

services:
  dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URI=mongodb://mongodb:27017/legocity
      - PAYLOAD_SECRET=${PAYLOAD_SECRET}
      - NEXT_PUBLIC_MAPBOX_TOKEN=${NEXT_PUBLIC_MAPBOX_TOKEN}
    depends_on:
      - mongodb
    volumes:
      - ./dashboard:/app
      - /app/node_modules
    command: pnpm dev

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  orion:
    image: fiware/orion-ld:latest
    ports:
      - "1026:1026"
    depends_on:
      - mongodb
    command: -dbhost mongodb -logLevel DEBUG

volumes:
  mongodb_data:
```

---

## Quản lý Services

### Khởi động

```bash
# Khởi động tất cả
docker compose up -d

# Khởi động service cụ thể
docker compose up -d dashboard

# Xem logs real-time
docker compose logs -f
```

### Dừng

```bash
# Dừng tất cả
docker compose down

# Dừng và xóa volumes
docker compose down -v

# Giữ lại data
docker compose stop
```

### Khởi động lại

```bash
# Khởi động lại tất cả
docker compose restart

# Khởi động lại service cụ thể
docker compose restart dashboard
```

### Rebuild

```bash
# Rebuild tất cả images
docker compose build

# Rebuild và khởi động
docker compose up -d --build

# Rebuild service cụ thể
docker compose build dashboard
```

---

## Phát triển với Docker

### Hot Reload

File `docker-compose.yml` đã được cấu hình với volumes để enable hot reload:

```yaml
volumes:
  - ./dashboard:/app
  - /app/node_modules # Preserve node_modules in container
```

Changes trong `./dashboard` sẽ tự động reflect trong container.

### Chạy Commands trong Container

```bash
# Mở shell trong dashboard container
docker compose exec dashboard sh

# Chạy pnpm commands
docker compose exec dashboard pnpm install
docker compose exec dashboard pnpm add <package>

# Chạy tests
docker compose exec dashboard pnpm test
```

### Truy cập Database

```bash
# Mở MongoDB shell
docker compose exec mongodb mongosh

# Hoặc từ host (nếu có mongosh)
mongosh mongodb://localhost:27017/legocity
```

### Kiểm tra Orion-LD

```bash
# Health check
curl http://localhost:1026/version

# Lấy entities
curl http://localhost:1026/ngsi-ld/v1/entities
```

---

## Tùy chỉnh cấu hình

### Environment Variables

Tạo file `.env` trong root:

```env
# Dashboard
PAYLOAD_SECRET=your-secret-here
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Database
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password

# Orion-LD
ORION_LOG_LEVEL=INFO
```

### Custom Ports

Chỉnh `docker-compose.yml`:

```yaml
services:
  dashboard:
    ports:
      - "3001:3000" # Host:Container

  mongodb:
    ports:
      - "27018:27017"
```

### Persistent Storage

Volumes được tự động tạo và quản lý:

```bash
# Liệt kê volumes
docker volume ls

# Xem chi tiết volume
docker volume inspect legocity_mongodb_data

# Backup volume
docker run --rm -v legocity_mongodb_data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/mongodb-backup.tar.gz /data
```

---

## Thiết lập sản xuất

### Optimized Dockerfile

Tạo `dashboard/Dockerfile.prod`:

```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### Production Compose

Tạo `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile.prod
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    restart: always
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}

  orion:
    image: fiware/orion-ld:latest
    restart: always
    depends_on:
      - mongodb
    command: -dbhost mongodb -logLevel INFO

volumes:
  mongodb_data:
```

Chạy production:

```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## Xử lý sự cố

### Container không khởi động

```bash
# Xem logs chi tiết
docker compose logs dashboard

# Kiểm tra configuration
docker compose config

# Xem container status
docker compose ps -a
```

### Port conflicts

```bash
# Tìm process đang dùng port
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000

# Thay đổi port trong docker-compose.yml
```

### Memory issues

```bash
# Tăng memory limit cho Docker Desktop
# Settings → Resources → Memory

# Hoặc trong docker-compose.yml:
services:
  dashboard:
    deploy:
      resources:
        limits:
          memory: 2G
```

### Network issues

```bash
# Tạo lại network
docker compose down
docker network prune
docker compose up -d

# Debug network
docker network inspect legocity_default
```

---

## Cleanup

### Xóa tất cả

```bash
# Dừng và xóa containers, networks
docker compose down

# Xóa thêm volumes (XÓA DỮ LIỆU!)
docker compose down -v

# Xóa images
docker compose down --rmi all
```

### Xóa selective

```bash
# Chỉ xóa containers
docker compose rm

# Xóa unused images
docker image prune

# Xóa unused volumes
docker volume prune
```

---

## Các bước tiếp theo

- 📚 [Phát triển cục bộ](local.md) - Phát triển không dùng Docker
- ⚙️ [Hướng dẫn cấu hình](../configuration/index.md)
- 🚀 [Production Deployment](../deployment/index.md)
- 🔧 [Khắc phục sự cố](../reference/troubleshooting.md)

## Cần trợ giúp?

- 💬 [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)
- 🐛 [Report Issues](https://github.com/CTU-SematX/LegoCity/issues)
