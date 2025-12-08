# Sample Data (Open Datasets)

This folder contains sample datasets used to seed data for the Data Source servers. Data is stored in **plain JSON format** and simulates Smart City devices/sensors in Can Tho City.

> **Note**: The data is regular JSON, not NGSI-LD. Servers will automatically convert it to NGSI-LD when needed through the `/ngsi-ld` endpoint.

## 📂 Dataset List

| File                  | Domain               | Entity Type                                     | Records | Description                                 |
| --------------------- | -------------------- | ----------------------------------------------- | ------- | ------------------------------------------- |
| `traffic.json`        | Transportation       | TrafficFlowObserved                             | 10      | Traffic flow data from measurement stations |
| `environment.json`    | Environment          | AirQualityObserved                              | 8       | Air quality data (AQI, PM2.5, NO2, etc.)    |
| `lighting.json`       | Public services      | Streetlight                                     | 10      | Smart streetlight data                      |
| `infrastructure.json` | Urban Infrastructure | WaterSupply, Drainage, ElectricityGrid, Telecom | 11      | Urban infrastructure data                   |

## 🗂️ Data Structure

### Traffic Flow

```json
{
  "stationId": "cantho-station-01",
  "name": "Nguyen Van Linh Traffic Station",
  "description": "Traffic flow measurement station on Nguyen Van Linh street",
  "longitude": 105.7469,
  "latitude": 10.0452,
  "dateObserved": "2025-12-03T08:00:00Z",
  "intensity": 450,
  "occupancy": 0.35,
  "averageVehicleSpeed": 42.5,
  "averageVehicleLength": 4.2,
  "congested": false,
  "laneId": 1,
  "roadSegment": "cantho-nvl-001"
}
```

### Air Quality

```json
{
  "stationId": "cantho-aqi-01",
  "name": "Ninh Kieu Monitoring Station",
  "description": "Air quality monitoring station in Ninh Kieu District",
  "longitude": 105.7469,
  "latitude": 10.0452,
  "dateObserved": "2025-12-03T08:00:00Z",
  "temperature": 28.5,
  "relativeHumidity": 75.0,
  "co": 0.8,
  "no2": 35.0,
  "so2": 12.0,
  "pm10": 45.0,
  "pm25": 28.0,
  "o3": 55.0,
  "airQualityIndex": 85,
  "airQualityLevel": "moderate",
  "reliability": 0.95
}
```

### Streetlight

```json
{
  "lampId": "cantho-sl-001",
  "name": "Streetlight NK-001",
  "description": "Smart LED streetlight on Nguyen Van Linh street",
  "longitude": 105.7469,
  "latitude": 10.0452,
  "status": "ok",
  "powerState": "on",
  "dateLastSwitchingOn": "2025-12-03T06:00:00Z",
  "dateLastSwitchingOff": "2025-12-02T18:30:00Z",
  "illuminanceLevel": 0.85,
  "powerConsumption": 45.5,
  "lanternHeight": 8.0,
  "lampType": "LED",
  "controllingMethod": "automatic",
  "streetlightGroup": "cantho-nk"
}
```

### Infrastructure

The file `infrastructure.json` contains one object with four arrays:

```json
{
  "waterSupply": [...],
  "drainage": [...],
  "electricityGrid": [...],
  "telecom": [...]
}
```

Example — Water Supply:

```json
{
  "stationId": "cantho-ws-01",
  "name": "Ninh Kieu Water Supply Station",
  "longitude": 105.7469,
  "latitude": 10.0452,
  "waterPressure": 3.5,
  "flowRate": 125.5,
  "chlorineLevel": 0.5,
  "status": "operational"
}
```

## 📍 Geographic Locations

The data simulates real locations in Can Tho City:

* **Ninh Kieu District**: City center
* **Cai Rang District**: Cai Rang floating market
* **Binh Thuy District**: Industrial zone
* **O Mon District**: Suburban area
* **Thot Not District**: Outer region
* **Phong Dien District**: Rural area
* **Tra Noc Industrial Park**: Industrial park

## 🔗 References

* Smart Data Models — NGSI-LD data standards
* FIWARE Data Models — FIWARE data model repository

## 📝 Usage

Data is automatically loaded into servers at startup (see `/servers/README.md`).

To add new data:

1. Create a JSON file with the correct format
2. Update the server’s `DATA_PATH` environment variable
3. Delete the old database to re-seed (or use the API to add manually)

