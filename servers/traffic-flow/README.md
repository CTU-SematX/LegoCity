# Traffic Flow Server (FastAPI + Python)

Server quản lý dữ liệu lưu lượng giao thông dựa trên mô hình NGSI-LD TrafficFlowObserved.

## Tech Stack

- **Runtime**: Python 3.11+
- **Framework**: FastAPI
- **ORM**: SQLModel
- **Database**: SQLite

## Cài đặt

```bash
# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc: venv\Scripts\activate  # Windows

# Cài đặt dependencies
pip install -r requirements.txt
```

## Chạy server

```bash
# Development
uvicorn main:app --reload --port 8001

# Production
uvicorn main:app --host 0.0.0.0 --port 8001
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Health check |
| GET | `/docs` | Swagger UI |
| GET | `/traffic-flows` | Lấy danh sách TrafficFlowObserved |
| GET | `/traffic-flows/{id}` | Lấy chi tiết 1 record |
| POST | `/traffic-flows` | Tạo mới record |
| PUT | `/traffic-flows/{id}` | Cập nhật record |
| DELETE | `/traffic-flows/{id}` | Xóa record |
| POST | `/traffic-flows/{id}/push` | Đẩy 1 record lên Broker |
| POST | `/traffic-flows/push-all` | Đẩy tất cả records lên Broker |

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|---------|
| `BROKER_URL` | URL của Context Broker | `http://localhost:1026` |
| `DATA_PATH` | Đường dẫn đến file data seed | `../opendata/traffic.json` |
| `DATABASE_URL` | SQLite database URL | `sqlite:///./traffic.db` |

## Cấu trúc thư mục

```
traffic-flow/
├── main.py           # Entry point, FastAPI app
├── models.py         # SQLModel definitions
├── database.py       # Database setup
├── schemas.py        # Pydantic schemas
├── ngsi.py          # NGSI-LD helper functions
├── requirements.txt  # Python dependencies
├── Dockerfile        # Docker build
└── README.md
```
