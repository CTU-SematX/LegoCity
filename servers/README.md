# LegoCity Data Servers

Demo servers showcasing how to work with the NGSI-LD Context Broker.

## 📋 Server Overview

| Server | Purpose | Port | Features |
|--------|---------|------|----------|
| `demo-server` | Interactive learning demo | 8004 | Swagger UI, query & update entities |
| `weather-server` | Auto-updating weather data | 8005 | Linear data generation, auto-update mode |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Seed Data Loader (on startup)             │
│                    Parses CSV → NGSI-LD                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   Context Broker        │
              │   (Orion-LD)            │
              │   :1026                 │
              └───────────┬─────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Demo Server    │ │ Weather Server  │ │   Dashboard     │
│  :8004          │ │ :8005           │ │   :3000         │
│                 │ │                 │ │                 │
│  • Query data   │ │ • Auto-update   │ │ • Visualize     │
│  • Update data  │ │ • Weather/AQ    │ │ • Manage        │
│  • Swagger UI   │ │ • Linear gen    │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 🚀 Quick Start

### Using Docker Compose (Recommended)

From the **project root** directory:

```bash
# Start the entire stack
docker compose up -d

# View logs
docker compose logs -f demo-server weather-server

# Stop everything
docker compose down
```

### Running Locally

```bash
# Demo Server
cd demo-server && bun install && bun run dev

# Weather Server (separate terminal)
cd weather-server && bun install && bun run dev
```

## 📦 Tech Stack

- **Runtime**: Bun 1.0+
- **Framework**: ElysiaJS
- **Docs**: Swagger UI (built-in)

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8004/8005 |
| `BROKER_URL` | NGSI-LD Context Broker URL | `http://localhost:1026` |

## 📁 Folder Structure

```
servers/
├── README.md              # This file
├── .env.example           # Environment template
├── demo-server/           # Interactive demo server
│   ├── src/index.ts       # Main server code
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
└── weather-server/        # Weather auto-update server
    ├── src/index.ts       # Main server code
    ├── package.json
    ├── Dockerfile
    └── README.md
```

## 📖 Server Details

### Demo Server (`:8004`)

Interactive demo for learning NGSI-LD operations:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/swagger` | Interactive API docs |
| GET | `/entities` | List all entities |
| GET | `/entities/:id` | Get single entity |
| PATCH | `/traffic/:id` | Update traffic data |
| PATCH | `/flood-sensor/:id` | Update flood sensor |
| PATCH | `/flood-zone/:id` | Update flood zone |
| PATCH | `/incident/:id` | Update incident |
| PATCH | `/vehicle/:id` | Update vehicle |
| PATCH | `/medical/:id` | Update medical facility |

### Weather Server (`:8005`)

Auto-updating weather/air quality data:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/swagger` | Interactive API docs |
| POST | `/auto-update/start` | Start auto-update |
| POST | `/auto-update/stop` | Stop auto-update |
| GET | `/auto-update/status` | Get status |
| POST | `/auto-update/trigger` | Manual trigger |
| GET | `/weather` | Get weather stations |
| GET | `/air-quality` | Get AQ stations |

## 📜 License

MIT License - see [LICENSE](../LICENSE) for details.
