# LegoCity Weather Server

Weather data server with auto-update functionality that pushes realistic data to the NGSI-LD Context Broker.

## 🌤️ Features

- **Realistic data generation** using linear interpolation with random walk
- **Auto-update mode** to simulate real weather sensors
- **Configurable interval** (5s to 5min, default 30s)
- **AQI calculation** using US EPA formula from PM2.5

## Tech Stack

- **Runtime**: Bun 1.0+
- **Framework**: ElysiaJS
- **API Docs**: Swagger UI (built-in)

## Quick Start

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Or run in production
bun run start
```

Then open http://localhost:8005/swagger to access the interactive API docs.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8005` |
| `BROKER_URL` | NGSI-LD Context Broker URL | `http://localhost:1026` |

## Data Types

### WeatherObserved
| Attribute | Unit | Typical Range (HCMC) |
|-----------|------|---------------------|
| temperature | °C | 24 - 38 |
| humidity | % | 50 - 95 |
| windSpeed | km/h | 0 - 30 |
| windDirection | ° | 0 - 360 |
| atmosphericPressure | hPa | 1005 - 1020 |
| precipitation | mm | 0 - 50 |

### AirQualityObserved
| Attribute | Unit | Typical Range |
|-----------|------|---------------|
| pm25 | µg/m³ | 10 - 150 |
| pm10 | µg/m³ | 20 - 200 |
| no2 | ppb | 5 - 100 |
| so2 | ppb | 2 - 50 |
| co | ppm | 0.1 - 5 |
| o3 | ppb | 20 - 120 |
| aqi | - | 0 - 500 (calculated) |

## API Endpoints

### Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check and status |
| GET | `/swagger` | Interactive Swagger UI |

### Auto-Update Control
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auto-update/start` | Start auto-update (with optional interval) |
| POST | `/auto-update/stop` | Stop auto-update |
| GET | `/auto-update/status` | Get auto-update status |
| POST | `/auto-update/trigger` | Trigger one manual update |

### Weather Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/weather` | Get all weather stations |
| GET | `/weather/:id` | Get station by ID |
| PATCH | `/weather/:id` | Update station data |

### Air Quality Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/air-quality` | Get all AQ stations |
| GET | `/air-quality/:id` | Get station by ID |
| PATCH | `/air-quality/:id` | Update station data |

## How Auto-Update Works

1. **Start auto-update**: `POST /auto-update/start` with optional `intervalMs`
2. Each interval, the server:
   - Generates new values using linear interpolation
   - Each value changes by a small random amount (±change limit)
   - Values stay within realistic limits
   - AQI is recalculated from PM2.5
3. Updated data is pushed to the broker
4. **Stop**: `POST /auto-update/stop`

## Example Usage

```bash
# Start auto-update with 30s interval
curl -X POST http://localhost:8005/auto-update/start \
  -H "Content-Type: application/json" \
  -d '{"intervalMs": 30000}'

# Check status
curl http://localhost:8005/auto-update/status

# Get current weather data
curl http://localhost:8005/weather

# Stop auto-update
curl -X POST http://localhost:8005/auto-update/stop
```

## Docker

```bash
# Build image
docker build -t legocity-weather-server .

# Run container
docker run -p 8005:8005 -e BROKER_URL=http://orion-ld:1026 legocity-weather-server
```
