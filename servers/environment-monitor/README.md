# Environment Monitor Server (Gin + Go)

Server quản lý dữ liệu chất lượng không khí dựa trên mô hình NGSI-LD AirQualityObserved.

## Tech Stack

- **Runtime**: Go 1.21+
- **Framework**: Gin
- **ORM**: GORM
- **Database**: SQLite

## Cài đặt

```bash
# Download dependencies
go mod download

# Build
go build -o server .
```

## Chạy server

```bash
# Development
go run .

# Production
./server
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Health check |
| GET | `/swagger/*` | Swagger UI |
| GET | `/air-quality` | Lấy danh sách AirQualityObserved |
| GET | `/air-quality/:id` | Lấy chi tiết 1 record |
| POST | `/air-quality` | Tạo mới record |
| PUT | `/air-quality/:id` | Cập nhật record |
| DELETE | `/air-quality/:id` | Xóa record |
| POST | `/air-quality/:id/push` | Đẩy 1 record lên Broker |
| POST | `/air-quality/push-all` | Đẩy tất cả records lên Broker |

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|---------|
| `BROKER_URL` | URL của Context Broker | `http://localhost:1026` |
| `DATA_PATH` | Đường dẫn đến file data seed | `/opendata/environment.json` |
| `PORT` | Port của server | `8002` |

## Cấu trúc thư mục

```
environment-monitor/
├── main.go           # Entry point
├── models/
│   └── air_quality.go
├── handlers/
│   └── air_quality.go
├── database/
│   └── database.go
├── ngsi/
│   └── converter.go
├── go.mod
├── go.sum
├── Dockerfile
└── README.md
```
