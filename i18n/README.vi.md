 

# LegoCity (Tiếng Việt)

LegoCity là một template nhẹ để triển khai các ví dụ Smart City, phục vụ cho mục đích giảng dạy và thử nghiệm trong hệ sinh thái CTU-SematX. Dự án trình diễn cách kết nối các nguồn dữ liệu, API gateway và dashboard sử dụng NGSI-LD và FIWARE.

Tài liệu: https://ctu-sematx.github.io/Lego-Doc/

Những điểm nổi bật

- Broker: NGINX gateway tích hợp với Orion Context Broker
- Dashboard: Ví dụ Dashboard bằng PayloadCMS + Next.js
- Các server mẫu mô phỏng nguồn dữ liệu Smart City phổ biến
- Tập dữ liệu mẫu (JSON) nằm trong `opendata/`

Cấu trúc repository

```
LegoCity/
├── broker/           # NGINX Gateway + Orion Context Broker + MongoDB
├── dashboard/        # PayloadCMS + Next.js Dashboard
├── servers/          # Sample Data Source Servers
│   ├── traffic-flow/        # FastAPI + Python (Port 8001)
│   ├── environment-monitor/ # Gin + Go (Port 8002)
│   ├── public-lighting/     # Elysia + Bun (Port 8003)
│   └── urban-infra/         # Elysia + Bun (Port 8004)
├── opendata/         # Sample datasets (JSON)
└── docs/             # Documentation assets
```

Hướng dẫn nhanh

Yêu cầu

- Docker & Docker Compose
- Node.js 20+ / Bun (để phát triển dashboard)
- Git

Clone repository

```bash
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity
```

Khởi động Broker (Orion + MongoDB)

```bash
cd broker
docker compose up -d
```

Khởi động các sample data servers

```bash
cd servers
docker compose up -d --build
```

Chạy dashboard (phát triển cục bộ)

```bash
cd dashboard
pnpm install
pnpm dev
```

Các server mẫu

| Server | Port | Framework | Domain |
|--------|------|-----------|--------|
| `traffic-flow` | 8001 | FastAPI + Python | Lưu lượng giao thông |
| `environment-monitor` | 8002 | Gin + Go | Chất lượng không khí / môi trường |
| `public-lighting` | 8003 | Elysia + Bun | Chiếu sáng công cộng |
| `urban-infra` | 8004 | Elysia + Bun | Hạ tầng đô thị |

Mỗi server cung cấp:

- REST API cho CRUD
- Endpoint chuyển đổi sang NGSI-LD
- Health check

Open data

Thư mục `opendata/` chứa tập dữ liệu JSON mẫu để seed cho các server:

- `traffic.json`
- `environment.json`
- `lighting.json`
- `infrastructure.json`

Đóng góp

Mọi đóng góp đều được hoan nghênh. Xem `CONTRIBUTING.md` để biết hướng dẫn.

Giấy phép

Dự án được cấp phép theo Apache-2.0 (xem `LICENSE`).

Người duy trì

- CTU-SematX Team — https://github.com/CTU-SematX

Credits

- FIWARE Foundation — Orion Context Broker
- Smart Data Models — NGSI-LD data models
- PayloadCMS — example dashboard
