# Khởi động Local Server

Hướng dẫn này sẽ hướng dẫn bạn chạy SematX trên máy local của bạn bằng Docker. Đây là cách nhanh nhất để bắt đầu và khám phá nền tảng.

⏱️ **Thời gian ước tính**: 10-15 phút  
💻 **Yêu cầu**: Docker Desktop  
🎯 **Mục tiêu**: Chạy SematX locally và tạo entity đầu tiên

## Những gì Bạn sẽ Xây dựng

Khi kết thúc hướng dẫn này, bạn sẽ có:

- Một instance SematX hoạt động đầy đủ chạy locally
- Truy cập vào giao diện web Lego Dashboard
- Entity NGSI-LD đầu tiên của bạn được tạo
- Một dashboard card trực quan hóa dữ liệu của bạn

## Điều kiện Tiên quyết

### Cài đặt Docker Desktop

Docker Desktop bao gồm Docker Engine và Docker Compose, bạn sẽ cần để chạy SematX.

**Tải Docker Desktop**:

- **Windows**: [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- **Mac**: [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
- **Linux**: [Install Docker Engine](https://docs.docker.com/engine/install/) và [Docker Compose](https://docs.docker.com/compose/install/)

**Xác minh Cài đặt**:

Mở terminal và chạy:

```bash
docker --version
docker compose version
```

Bạn sẽ thấy output như:

```
Docker version 24.0.0
Docker Compose version v2.20.0
```

### Cài đặt Git

Bạn sẽ cần Git để clone repository SematX.

**Tải Git**: [https://git-scm.com/downloads](https://git-scm.com/downloads)

**Xác minh Cài đặt**:

```bash
git --version
```

## Bước 1: Clone Repository

Mở terminal và clone repository SematX:

```bash
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity
```

## Bước 2: Cấu hình Environment Variables

Tạo file `.env` trong thư mục root:

```bash
# Copy file environment mẫu
cp .env.example .env
```

Chỉnh sửa file `.env` với text editor bạn ưa thích:

```bash
# For VS Code
code .env

# For nano
nano .env

# For vim
vim .env
```

**Cấu hình Tối thiểu Yêu cầu**:

```env
# Database
DATABASE_URI=mongodb://mongodb:27017/payload
MONGODB_URL=mongodb://mongodb:27017

# Payload CMS
PAYLOAD_SECRET=your-secret-key-here-change-this
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Orion-LD
ORION_URL=http://orion:1026

# Optional: AI Features
OPENROUTER_API_KEY=your-api-key-if-using-ai
```

**Quan trọng**: Thay đổi `PAYLOAD_SECRET` thành chuỗi ngẫu nhiên. Bạn có thể tạo một cái với:

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 255 }))
```

## Bước 3: Khởi động Services

Khởi động tất cả services SematX sử dụng Docker Compose:

```bash
docker compose up -d
```

Lệnh này sẽ:

1. Pull các Docker images yêu cầu (chỉ lần đầu tiên)
2. Tạo và khởi động containers cho:
   - MongoDB (database)
   - Orion-LD (context broker)
   - Nginx (API gateway)
   - Dashboard (PayloadCMS)

**Output mong đợi**:

```
[+] Running 5/5
 ✔ Network legocity_default      Created
 ✔ Container legocity-mongodb-1  Started
 ✔ Container legocity-orion-1    Started
 ✔ Container legocity-dashboard-1 Started
 ✔ Container legocity-nginx-1    Started
```

**Kiểm tra Trạng thái Service**:

```bash
docker compose ps
```

Tất cả services nên hiển thị trạng thái "Up":

```
NAME                    STATUS
legocity-mongodb-1      Up
legocity-orion-1        Up
legocity-dashboard-1    Up
legocity-nginx-1        Up
```

## Bước 4: Truy cập Dashboard

Mở trình duyệt và điều hướng đến:

```
http://localhost:3000/admin
```

### Tạo Tài khoản Admin

Lần truy cập đầu tiên, bạn sẽ thấy màn hình tạo tài khoản:

1. **Email**: Nhập địa chỉ email của bạn
2. **Password**: Tạo mật khẩu an toàn (tối thiểu 8 ký tự)
3. **Confirm Password**: Nhập lại mật khẩu
4. **Name** (tùy chọn): Họ tên đầy đủ của bạn

Nhấp **Create First User** để tạo tài khoản admin.

### Đăng nhập

Sau khi tạo tài khoản, đăng nhập với thông tin đăng nhập của bạn:

```
http://localhost:3000/admin/login
```

## Bước 5: Tạo Entity Đầu tiên

Bây giờ bạn đã đăng nhập, hãy tạo entity NGSI-LD đầu tiên sử dụng API.

### Tạo API Key

1. Trong dashboard, nhấp **API Keys** ở sidebar bên trái
2. Nhấp **Create New**
3. Điền thông tin chi tiết:
   - **Name**: "My First API Key"
   - **Expires**: Chọn ngày hết hạn (hoặc để trống nếu không hết hạn)
   - **Permissions**: Chọn "Full Access" hiện tại
4. Nhấp **Create**
5. **Copy API key** - bạn sẽ không thể xem lại nó!

### Tạo Entity qua API

Mở terminal mới và sử dụng curl để tạo entity:

```bash
curl -X POST http://localhost:1026/ngsi-ld/v1/entities \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/ld+json" \
  -d '{
    "id": "urn:ngsi-ld:TemperatureSensor:001",
    "type": "TemperatureSensor",
    "@context": [
      "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
    ],
    "temperature": {
      "type": "Property",
      "value": 23.5,
      "unitCode": "CEL"
    },
    "location": {
      "type": "GeoProperty",
      "value": {
        "type": "Point",
        "coordinates": [105.7800, 10.0300]
      }
    },
    "name": {
      "type": "Property",
      "value": "Temperature Sensor - Room 101"
    }
  }'
```

**Thay `YOUR_API_KEY_HERE`** bằng API key bạn đã copy trước đó.

**Response mong đợi**:

```
HTTP/1.1 201 Created
Location: /ngsi-ld/v1/entities/urn:ngsi-ld:TemperatureSensor:001
```

### Xác minh Entity

Truy vấn entity để xác minh nó đã được tạo:

```bash
curl -X GET http://localhost:1026/ngsi-ld/v1/entities/urn:ngsi-ld:TemperatureSensor:001 \
  -H "Authorization: Bearer YOUR_API_KEY_HERE"
```

**Response mong đợi**:

```json
{
  "id": "urn:ngsi-ld:TemperatureSensor:001",
  "type": "TemperatureSensor",
  "temperature": {
    "type": "Property",
    "value": 23.5,
    "unitCode": "CEL"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [105.78, 10.03]
    }
  },
  "name": {
    "type": "Property",
    "value": "Temperature Sensor - Room 101"
  }
}
```

## Bước 6: Tạo Dashboard Card

Bây giờ hãy trực quan hóa dữ liệu này trong dashboard.

### Điều hướng đến Cards

1. Trong dashboard, nhấp **Cards** ở sidebar bên trái
2. Nhấp **Create New**

### Cấu hình Card

Điền thông tin chi tiết card:

1. **Name**: "Room 101 Temperature"
2. **Type**: Chọn "Metric" (để hiển thị một giá trị duy nhất)
3. **Entity Type**: "TemperatureSensor"
4. **Entity ID**: "urn:ngsi-ld:TemperatureSensor:001"
5. **Property**: "temperature"
6. **Configuration** (JSON):

   ```json
   {
     "unit": "°C",
     "label": "Current Temperature",
     "color": "#FF6B6B",
     "threshold": {
       "warning": 30,
       "critical": 35
     }
   }
   ```

7. Nhấp **Create**

### Xem Dashboard

1. Nhấp **Dashboard** ở thanh navigation trên cùng
2. Bạn sẽ thấy temperature card hiển thị "23.5°C"

## Bước 7: Cập nhật Dữ liệu Entity

Hãy mô phỏng một thay đổi nhiệt độ:

```bash
curl -X PATCH http://localhost:1026/ngsi-ld/v1/entities/urn:ngsi-ld:TemperatureSensor:001/attrs \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/ld+json" \
  -d '{
    "temperature": {
      "type": "Property",
      "value": 28.3,
      "unitCode": "CEL"
    }
  }'
```

Refresh dashboard của bạn - card bây giờ sẽ hiển thị "28.3°C"!

## Các Lệnh Thường dùng

### Xem Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f dashboard
docker compose logs -f orion
```

### Dừng Services

```bash
# Dừng tất cả services (giữ dữ liệu)
docker compose stop

# Dừng và xóa containers (giữ dữ liệu)
docker compose down

# Dừng và xóa mọi thứ bao gồm cả dữ liệu
docker compose down -v
```

### Khởi động lại Services

```bash
# Khởi động lại tất cả services
docker compose restart

# Khởi động lại service cụ thể
docker compose restart dashboard
```

### Truy cập MongoDB

```bash
# Mở MongoDB shell
docker compose exec mongodb mongosh

# Liệt kê databases
show dbs

# Sử dụng Orion database
use orion

# Liệt kê collections
show collections

# Truy vấn entities
db.entities.find().pretty()
```

## Xử lý Sự cố

### Port Đã Được Sử dụng

Nếu bạn thấy lỗi như "port is already allocated":

```bash
# Tìm process nào đang sử dụng port 3000
# On Linux/Mac
lsof -i :3000

# On Windows
netstat -ano | findstr :3000

# Thay đổi port trong docker-compose.yml
# Hoặc dừng service đang xung đột
```

### Services Không Khởi động

```bash
# Kiểm tra service logs
docker compose logs

# Xóa và tạo lại containers
docker compose down
docker compose up -d

# Rebuild images nếu cần
docker compose build --no-cache
docker compose up -d
```

### Không Truy cập được Dashboard

1. **Kiểm tra services đang chạy**: `docker compose ps`
2. **Kiểm tra logs**: `docker compose logs dashboard`
3. **Xác minh port mapping**: Dashboard nên ở `localhost:3000`
4. **Thử trình duyệt khác**: Xóa cache hoặc sử dụng chế độ ẩn danh

### API Trả về 401 Unauthorized

1. **Kiểm tra API key**: Đảm bảo bạn đã copy đúng
2. **Kiểm tra hết hạn**: API key có thể đã hết hạn
3. **Tạo key mới**: Tạo API key mới từ dashboard

## Các Bước Tiếp theo

Chúc mừng! Bây giờ bạn đã có SematX chạy locally. Đây là những gì để khám phá tiếp:

### Học Core Concepts

- [Hiểu về Orion Nginx](../../core-concepts/orion-nginx.md)
- [Lego Dashboard Internals](../../core-concepts/lego-dashboard.md)

### Xây dựng Cái gì đó

- [Tạo Thêm Entities](../../user-guide/entities.vi.md)
- [Thiết lập Subscriptions](../../user-guide/data-and-brokers.vi.md)
- [Xây dựng Custom Dashboards](../../user-guide/index.vi.md)

### Triển khai Production

- [Kết nối Server Riêng](../bring-your-own-server/index.vi.md)
- [Hướng dẫn Triển khai](../../deployment/index.md)

## Những gì Bạn đã Học

✅ Cách cài đặt Docker và Docker Compose  
✅ Cách khởi động SematX services locally  
✅ Cách truy cập Lego Dashboard  
✅ Cách tạo NGSI-LD entities qua API  
✅ Cách xây dựng dashboard cards để trực quan hóa  
✅ Cách cập nhật dữ liệu entity theo thời gian thực  
✅ Các lệnh Docker Compose cơ bản để quản lý services

## Dọn dẹp

Khi bạn hoàn thành việc thử nghiệm, bạn có thể dừng và xóa tất cả services:

```bash
# Dừng services nhưng giữ dữ liệu
docker compose down

# Xóa mọi thứ bao gồm cả data volumes
docker compose down -v

# Xóa downloaded images (tùy chọn)
docker rmi $(docker images -q fiware/orion-ld)
docker rmi $(docker images -q mongo)
```

Chúc bạn xây dựng vui vẻ với SematX! 🚀
