# Urban Infrastructure Server (Elysia + Bun)

Server quản lý dữ liệu hạ tầng kỹ thuật đô thị bao gồm: cấp nước, thoát nước, điện lưới, viễn thông.

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

### Water Supply
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/water-supply` | Lấy danh sách WaterSupply |
| GET | `/water-supply/:id` | Lấy chi tiết 1 record |
| POST | `/water-supply` | Tạo mới record |
| PUT | `/water-supply/:id` | Cập nhật record |
| DELETE | `/water-supply/:id` | Xóa record |
| POST | `/water-supply/:id/push` | Đẩy 1 record lên Broker |

### Drainage
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/drainage` | Lấy danh sách Drainage |
| GET | `/drainage/:id` | Lấy chi tiết 1 record |
| POST | `/drainage` | Tạo mới record |
| PUT | `/drainage/:id` | Cập nhật record |
| DELETE | `/drainage/:id` | Xóa record |
| POST | `/drainage/:id/push` | Đẩy 1 record lên Broker |

### Electricity Grid
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/electricity-grid` | Lấy danh sách ElectricityGrid |
| GET | `/electricity-grid/:id` | Lấy chi tiết 1 record |
| POST | `/electricity-grid` | Tạo mới record |
| PUT | `/electricity-grid/:id` | Cập nhật record |
| DELETE | `/electricity-grid/:id` | Xóa record |
| POST | `/electricity-grid/:id/push` | Đẩy 1 record lên Broker |

### Telecom
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/telecom` | Lấy danh sách Telecom |
| GET | `/telecom/:id` | Lấy chi tiết 1 record |
| POST | `/telecom` | Tạo mới record |
| PUT | `/telecom/:id` | Cập nhật record |
| DELETE | `/telecom/:id` | Xóa record |
| POST | `/telecom/:id/push` | Đẩy 1 record lên Broker |

### Common
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Health check |
| GET | `/swagger` | Swagger UI |
| POST | `/push-all` | Đẩy tất cả records lên Broker |

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `BROKER_URL` | URL của Context Broker | `http://localhost:1026` |
| `DATA_PATH` | Đường dẫn đến file data seed | `/data/infrastructure.json` |
| `PORT` | Port của server | `8004` |

## Cấu trúc thư mục

```
urban-infra/
├── src/
│   ├── index.ts      # Entry point
│   ├── db.ts         # Database setup
│   ├── models.ts     # Type definitions
│   └── ngsi.ts       # NGSI-LD converter
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```
