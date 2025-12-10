# Open Data

This folder contains open datasets for seeding the LegoCity Smart City platform.

## 📂 Folder Structure

```
opendata/
├── README.md          # This file
└── seed-data/         # Initial data to load into Context Broker
    ├── Dockerfile     # Python loader container
    ├── load_data.py   # CSV → NGSI-LD loader script
    └── *.csv          # Data files (see below)
```

## 📊 Seed Data Files

CSV files in `seed-data/` are automatically loaded into the Context Broker on startup.

| File | Entity Type | Records | Description |
|------|-------------|---------|-------------|
| `TrafficFlowObserved.csv` | TrafficFlowObserved | 10 | Traffic measurement stations |
| `FloodSensor.csv` | FloodSensor | 10 | Water level sensors |
| `FloodZone.csv` | FloodZone | 5 | Flood-prone areas |
| `EmergencyIncident.csv` | EmergencyIncident | 5 | Emergency events |
| `EmergencyVehicle.csv` | EmergencyVehicle | 8 | Emergency response vehicles |
| `MedicalFacility.csv` | MedicalFacility | 6 | Hospitals and clinics |
| `WeatherObserved.csv` | WeatherObserved | 10 | Weather stations |
| `AirQualityObserved.csv` | AirQualityObserved | 10 | Air quality monitors |

## 🔄 Data Loading Process

1. **Docker Compose starts** the `data-loader` service
2. **Loader waits** for Context Broker to be healthy
3. **Parses CSV files** and converts to NGSI-LD format
4. **Upserts entities** to the broker (creates or updates)
5. **Container exits** after loading completes

```bash
# View loader logs
docker compose logs data-loader
```

## 📝 CSV Format

Each CSV file must have these columns:

| Column | Required | Description |
|--------|----------|-------------|
| `id` | ✅ | Unique entity ID (URN format) |
| `type` | ✅ | Entity type (e.g., `FloodSensor`) |
| `name` | ✅ | Human-readable name |
| `location` | ✅ | GeoJSON Point: `{"type":"Point","coordinates":[lon,lat]}` |
| `...` | | Additional attributes per entity type |

### Example Row

```csv
id,type,name,location,waterLevel,batteryLevel
urn:ngsi-ld:FloodSensor:HCMC:FS001,FloodSensor,District 1 Sensor,"{""type"":""Point"",""coordinates"":[106.7009,10.7769]}",0.25,95
```

## 🌍 Data Sources

The seed data simulates sensors and entities in **Ho Chi Minh City, Vietnam**:

| Domain | Entity Types |
|--------|--------------|
| **Transportation** | TrafficFlowObserved |
| **Flood Management** | FloodSensor, FloodZone |
| **Emergency Response** | EmergencyIncident, EmergencyVehicle |
| **Healthcare** | MedicalFacility |
| **Weather** | WeatherObserved |
| **Air Quality** | AirQualityObserved |

## 🔧 Adding New Data

1. Create a new CSV file in `seed-data/`
2. Follow the CSV format above
3. Restart the stack: `docker compose up -d --force-recreate data-loader`

## 📜 License

Data is provided under [CC-BY-4.0](../LICENSES/CC-BY-4.0.txt) license.

