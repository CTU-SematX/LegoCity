# Data Sources (Servers)

Thư mục này chứa các server mẫu đóng vai trò là **Data Sources** trong kiến trúc Smart City. Các server này mô phỏng các hệ thống dữ liệu có sẵn trước khi triển khai hệ thống Smart City.

## 📋 Tổng quan

| Server | Domain | Tech Stack | Port | Entity Types |
|--------|--------|------------|------|--------------|
| `traffic-flow` | Giao thông | FastAPI + Python | 8001 | TrafficFlowObserved |
| `environment-monitor` | Môi trường | Gin + Go | 8002 | AirQualityObserved |
| `public-lighting` | Dịch vụ công cộng | Elysia + Bun | 8003 | Streetlight |
| `urban-infra` | Hạ tầng kỹ thuật | Elysia + Bun | 8004 | WaterSupply, Drainage, ElectricityGrid, Telecom |

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Data Sources                     │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│ Traffic     │ Environment │ Lighting    │ Infrastructure    │
│ (FastAPI)   │ (Gin)       │ (Elysia)    │ (Elysia)          │
│ :8001       │ :8002       │ :8003       │ :8004             │
└──────┬──────┴──────┬──────┴──────┬──────┴─────────┬─────────┘
       │             │             │                │
       │     HTTP POST (NGSI-LD Payload)           │
       │             │             │                │
       └─────────────┴──────┬──────┴────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   Context Broker        │
              │   (Orion-LD)            │
              │   :1026                 │
              └─────────────────────────┘
```

## 🚀 Khởi chạy

### Sử dụng Docker Compose (Khuyến nghị)

```bash
# Khởi chạy tất cả servers
docker compose up -d

# Xem logs
docker compose logs -f

# Dừng servers
docker compose down
```

### Chạy từng server riêng lẻ

#### Traffic Flow Server (Python)
```bash
cd traffic-flow
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

#### Environment Monitor Server (Go)
```bash
cd environment-monitor
go mod download
go run .
```

#### Public Lighting Server (Bun)
```bash
cd public-lighting
bun install
bun run dev
```

#### Urban Infrastructure Server (Bun)
```bash
cd urban-infra
bun install
bun run dev
```

## 📡 API Endpoints

Mỗi server đều có các endpoint cơ bản:

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Health check |
| GET | `/swagger` hoặc `/docs` | Swagger UI (OpenAPI) |
| GET | `/{resource}` | Lấy danh sách records |
| GET | `/{resource}/:id` | Lấy chi tiết 1 record |
| POST | `/{resource}` | Tạo mới record |
| PUT | `/{resource}/:id` | Cập nhật record |
| DELETE | `/{resource}/:id` | Xóa record |
| POST | `/{resource}/:id/push` | Đẩy 1 record lên Broker |
| POST | `/{resource}/push-all` | Đẩy tất cả records lên Broker |
| GET | `/{resource}/:id/ngsi-ld` | Lấy record dạng NGSI-LD |

### Ví dụ

```bash
# Lấy danh sách traffic flow
curl http://localhost:8001/traffic-flows

# Đẩy 1 record lên broker
curl -X POST http://localhost:8001/traffic-flows/1/push

# Đẩy tất cả records lên broker
curl -X POST http://localhost:8001/traffic-flows/push-all
```

## 🔧 Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `BROKER_URL` | URL của Context Broker | `http://localhost:1026` |
| `DATA_PATH` | Đường dẫn đến file data seed | Tùy server |
| `PORT` | Port của server | Tùy server |

## 📂 Cấu trúc thư mục

```
servers/
├── docker-compose.yml      # Docker Compose orchestration
├── .env.example            # Environment variables template
├── README.md               # This file
│
├── traffic-flow/           # FastAPI + Python
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── ngsi.py
│   ├── config.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── environment-monitor/    # Gin + Go
│   ├── main.go
│   ├── models/
│   ├── handlers/
│   ├── database/
│   ├── ngsi/
│   ├── go.mod
│   ├── Dockerfile
│   └── README.md
│
├── public-lighting/        # Elysia + Bun
│   ├── src/
│   │   ├── index.ts
│   │   ├── db.ts
│   │   ├── models.ts
│   │   └── ngsi.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── README.md
│
└── urban-infra/            # Elysia + Bun
    ├── src/
    │   ├── index.ts
    │   ├── db.ts
    │   ├── models.ts
    │   └── ngsi.ts
    ├── package.json
    ├── tsconfig.json
    ├── Dockerfile
    └── README.md
```

## 🧪 Testing với OpenAPI

Mỗi server đều hỗ trợ Swagger UI để test API:

- Traffic Flow: http://localhost:8001/docs
- Environment Monitor: http://localhost:8002/swagger/index.html
- Public Lighting: http://localhost:8003/swagger
- Urban Infrastructure: http://localhost:8004/swagger

## 🔗 Kết nối với Broker

Để kết nối với Context Broker, đảm bảo:

1. Broker đang chạy (xem `/broker/README.md`)
2. Network `broker_legocity-network` đã được tạo
3. Biến `BROKER_URL` được cấu hình đúng

```bash
# Kiểm tra network
docker network ls | grep legocity

# Nếu chưa có, chạy broker trước
cd ../broker
docker compose up -d
```

## 📝 Seed Data

Mỗi server tự động load dữ liệu từ thư mục `/opendata` khi khởi động:

- `traffic-flow` ← `/opendata/traffic.json`
- `environment-monitor` ← `/opendata/environment.json`
- `public-lighting` ← `/opendata/lighting.json`
- `urban-infra` ← `/opendata/infrastructure.json`

Dữ liệu chỉ được seed một lần (nếu database trống).
