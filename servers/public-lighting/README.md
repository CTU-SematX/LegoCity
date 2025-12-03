# Public Lighting Server (Elysia + Bun)

Server quản lý dữ liệu đèn đường thông minh dựa trên mô hình NGSI-LD Streetlight.

## Tech Stack

- **Runtime**: Bun 1.0+
- **Framework**: ElysiaJS
- **Database**: SQLite (via bun:sqlite)

## Cài đặt

```bash
# Cài đặt dependencies
bun install
```

## Chạy server

```bash
# Development
bun run dev

# Production
bun run start
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Health check |
| GET | `/swagger` | Swagger UI |
| GET | `/streetlights` | Lấy danh sách Streetlight |
| GET | `/streetlights/:id` | Lấy chi tiết 1 record |
| POST | `/streetlights` | Tạo mới record |
| PUT | `/streetlights/:id` | Cập nhật record |
| DELETE | `/streetlights/:id` | Xóa record |
| POST | `/streetlights/:id/push` | Đẩy 1 record lên Broker |
| POST | `/streetlights/push-all` | Đẩy tất cả records lên Broker |

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|---------|
| `BROKER_URL` | URL của Context Broker | `http://localhost:1026` |
| `DATA_PATH` | Đường dẫn đến file data seed | `/opendata/lighting.json` |
| `PORT` | Port của server | `8003` |

## Cấu trúc thư mục

```
public-lighting/
├── src/
│   ├── index.ts      # Entry point
│   ├── db.ts         # Database setup
│   ├── models.ts     # Type definitions
│   ├── ngsi.ts       # NGSI-LD converter
│   └── routes.ts     # API routes
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```
