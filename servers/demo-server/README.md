# LegoCity Demo Data Server

Interactive demo server showing how data servers work with NGSI-LD Context Broker.

## 🎓 Purpose

This server is designed for **learning and demonstration** purposes. It shows how data servers can:
- Query entities from the Context Broker
- Update entity attributes via simple API calls
- Use Swagger UI for interactive API exploration

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

Then open http://localhost:8004/swagger to access the interactive API docs.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8004` |
| `BROKER_URL` | NGSI-LD Context Broker URL | `http://localhost:1026` |

## API Endpoints

### Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check and server info |
| GET | `/entity-types` | List available entity types |
| GET | `/swagger` | Interactive Swagger UI |

### Query Entities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/entities` | List all entities (with optional `?type=` filter) |
| GET | `/entities/:id` | Get single entity by ID |

### Update Entities
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/traffic/:id` | Update TrafficFlowObserved |
| PATCH | `/flood-sensor/:id` | Update FloodSensor |
| PATCH | `/flood-zone/:id` | Update FloodZone |
| PATCH | `/incident/:id` | Update EmergencyIncident |
| PATCH | `/vehicle/:id` | Update EmergencyVehicle |
| PATCH | `/facility/:id` | Update MedicalFacility |

## Entity Types & Editable Attributes

| Entity Type | Editable Attributes |
|-------------|---------------------|
| TrafficFlowObserved | averageVehicleSpeed, vehicleCount, congestionIndex |
| FloodSensor | waterLevel, batteryLevel |
| FloodZone | waterDepth, floodSeverity, isActive, affectedPopulation |
| EmergencyIncident | status, severity |
| EmergencyVehicle | status, speed, heading |
| MedicalFacility | availableBeds |

## How to Use

1. **Start the full stack** using `docker compose up` from the project root
2. **Open Swagger UI** at http://localhost:8004/swagger
3. **Browse entities** using the GET endpoints
4. **Copy an entity ID** from the response
5. **Update attributes** using the PATCH endpoints with the entity ID
6. **Verify changes** by fetching the entity again

## Docker

```bash
# Build image
docker build -t legocity-demo-server .

# Run container
docker run -p 8004:8004 -e BROKER_URL=http://orion-ld:1026 legocity-demo-server
```
