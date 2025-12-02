# Step 3: Create Your First Entity

Now that your service is configured, let's create your first NGSI-LD entity. Entities are the core data structures in SematX.

⏱️ **Time**: 10-15 minutes  
🎯 **Goal**: Create and query your first NGSI-LD entity

## What is an Entity?

An **entity** represents a real-world object in your application:

- **Physical Objects**: Sensors, devices, vehicles, buildings
- **Conceptual Objects**: Alerts, events, observations
- **Locations**: Cities, rooms, parking spaces
- **Organizations**: Departments, teams, companies

## NGSI-LD Entity Structure

Every entity has three required components:

```json
{
  "id": "urn:ngsi-ld:EntityType:uniqueId",
  "type": "EntityType",
  "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"]
}
```

### 1. Entity ID (`id`)

A unique identifier following the URN format:

```
urn:ngsi-ld:EntityType:uniqueIdentifier
```

**Examples**:

```
urn:ngsi-ld:Sensor:temperature-001
urn:ngsi-ld:Building:main-campus
urn:ngsi-ld:Vehicle:bus-42
urn:ngsi-ld:AirQualityObserved:station-downtown-2025-12-02
```

**Rules**:

- Must be unique across your service
- Should be descriptive
- Use hyphens to separate words
- Include entity type for clarity

### 2. Entity Type (`type`)

The category or class of the entity:

```
Sensor
Building
Vehicle
AirQualityObserved
TemperatureObservation
```

**Rules**:

- Use PascalCase (capitalize each word)
- Be specific (prefer `TemperatureSensor` over `Sensor`)
- Follow standard data models when possible (FIWARE, SmartDataModels)

### 3. Context (`@context`)

Defines the semantic meaning of your data:

```json
"@context": [
  "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
]
```

For this tutorial, we'll use the standard NGSI-LD context.

## Entity Attributes

Entities can have three types of attributes:

### Properties

Simple data values:

```json
"temperature": {
  "type": "Property",
  "value": 23.5,
  "unitCode": "CEL"
}
```

### GeoProperties

Geographic locations:

```json
"location": {
  "type": "GeoProperty",
  "value": {
    "type": "Point",
    "coordinates": [105.7800, 10.0300]
  }
}
```

### Relationships

Links to other entities:

```json
"refBuilding": {
  "type": "Relationship",
  "object": "urn:ngsi-ld:Building:001"
}
```

## Create a Temperature Sensor Entity

Let's create a real-world example: a temperature sensor.

### Entity Design

**What we're modeling**:

- A temperature sensor in Room 101
- Located at specific coordinates
- Measures temperature in Celsius
- Last reading: 23.5°C

### Complete Entity JSON

```json
{
  "id": "urn:ngsi-ld:TemperatureSensor:room-101",
  "type": "TemperatureSensor",
  "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
  "name": {
    "type": "Property",
    "value": "Temperature Sensor - Room 101"
  },
  "temperature": {
    "type": "Property",
    "value": 23.5,
    "unitCode": "CEL",
    "observedAt": "2025-12-02T10:00:00Z"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [105.78, 10.03]
    }
  },
  "status": {
    "type": "Property",
    "value": "active"
  },
  "batteryLevel": {
    "type": "Property",
    "value": 85,
    "unitCode": "P1"
  }
}
```

### Create Entity via API

#### Using curl

```bash
curl -X POST "https://your-sematx-server.com/ngsi-ld/v1/entities" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project" \
  -H "Content-Type: application/ld+json" \
  -d '{
    "id": "urn:ngsi-ld:TemperatureSensor:room-101",
    "type": "TemperatureSensor",
    "@context": [
      "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
    ],
    "name": {
      "type": "Property",
      "value": "Temperature Sensor - Room 101"
    },
    "temperature": {
      "type": "Property",
      "value": 23.5,
      "unitCode": "CEL",
      "observedAt": "2025-12-02T10:00:00Z"
    },
    "location": {
      "type": "GeoProperty",
      "value": {
        "type": "Point",
        "coordinates": [105.7800, 10.0300]
      }
    },
    "status": {
      "type": "Property",
      "value": "active"
    },
    "batteryLevel": {
      "type": "Property",
      "value": 85,
      "unitCode": "P1"
    }
  }'
```

**Expected Response**:

```
HTTP/1.1 201 Created
Location: /ngsi-ld/v1/entities/urn:ngsi-ld:TemperatureSensor:room-101
```

#### Using JavaScript

```javascript
import { client } from "./sematx-client.js";

async function createSensor() {
  const entity = {
    id: "urn:ngsi-ld:TemperatureSensor:room-101",
    type: "TemperatureSensor",
    "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
    name: {
      type: "Property",
      value: "Temperature Sensor - Room 101",
    },
    temperature: {
      type: "Property",
      value: 23.5,
      unitCode: "CEL",
      observedAt: new Date().toISOString(),
    },
    location: {
      type: "GeoProperty",
      value: {
        type: "Point",
        coordinates: [105.78, 10.03],
      },
    },
    status: {
      type: "Property",
      value: "active",
    },
    batteryLevel: {
      type: "Property",
      value: 85,
      unitCode: "P1",
    },
  };

  try {
    await client.createEntity(entity);
    console.log("✅ Entity created successfully!");
  } catch (error) {
    console.error("❌ Failed to create entity:", error.message);
  }
}

createSensor();
```

#### Using Python

```python
from sematx_client import client
from datetime import datetime

def create_sensor():
    entity = {
        'id': 'urn:ngsi-ld:TemperatureSensor:room-101',
        'type': 'TemperatureSensor',
        '@context': [
            'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld'
        ],
        'name': {
            'type': 'Property',
            'value': 'Temperature Sensor - Room 101'
        },
        'temperature': {
            'type': 'Property',
            'value': 23.5,
            'unitCode': 'CEL',
            'observedAt': datetime.utcnow().isoformat() + 'Z'
        },
        'location': {
            'type': 'GeoProperty',
            'value': {
                'type': 'Point',
                'coordinates': [105.7800, 10.0300]
            }
        },
        'status': {
            'type': 'Property',
            'value': 'active'
        },
        'batteryLevel': {
            'type': 'Property',
            'value': 85,
            'unitCode': 'P1'
        }
    }

    try:
        client.create_entity(entity)
        print('✅ Entity created successfully!')
    except Exception as error:
        print(f'❌ Failed to create entity: {error}')

create_sensor()
```

## Query Your Entity

### Get Entity by ID

```bash
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/entities/urn:ngsi-ld:TemperatureSensor:room-101" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project" \
  -H "Accept: application/ld+json"
```

### Query Entities by Type

```bash
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/entities?type=TemperatureSensor" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project" \
  -H "Accept: application/ld+json"
```

### Query with Filters

Filter entities by property values:

```bash
# Sensors with temperature > 25
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/entities?type=TemperatureSensor&q=temperature>25" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project"
```

### Query by Location

Find entities near a point:

```bash
# Sensors within 1km of coordinates
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/entities?type=TemperatureSensor&geometry=Point&coordinates=[105.7800,10.0300]&georel=near;maxDistance==1000" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project"
```

## Understanding Unit Codes

NGSI-LD uses standard unit codes from [UN/CEFACT](https://www.unece.org/cefact/codesfortrade/codes_index.html):

| Unit              | Code  | Example           |
| ----------------- | ----- | ----------------- |
| Celsius           | `CEL` | Temperature       |
| Fahrenheit        | `FAH` | Temperature       |
| Percent           | `P1`  | Battery, humidity |
| Meters            | `MTR` | Distance          |
| Kilometers        | `KMT` | Distance          |
| Kilograms         | `KGM` | Weight            |
| Liters            | `LTR` | Volume            |
| Watts             | `WTT` | Power             |
| Lux               | `LUX` | Light intensity   |
| Pascal            | `PAL` | Pressure          |
| Parts per million | `59`  | Air quality       |

## Common Entity Patterns

### Observation Entity

For sensor readings:

```json
{
  "id": "urn:ngsi-ld:AirQualityObserved:station-01-20251202",
  "type": "AirQualityObserved",
  "dateObserved": {
    "type": "Property",
    "value": { "@type": "DateTime", "@value": "2025-12-02T10:00:00Z" }
  },
  "PM25": {
    "type": "Property",
    "value": 35,
    "unitCode": "GQ"
  },
  "location": {
    "type": "GeoProperty",
    "value": { "type": "Point", "coordinates": [105.78, 10.03] }
  }
}
```

### Device Entity

For IoT devices:

```json
{
  "id": "urn:ngsi-ld:Device:sensor-001",
  "type": "Device",
  "name": { "type": "Property", "value": "Environmental Sensor" },
  "serialNumber": { "type": "Property", "value": "SN12345678" },
  "hardwareVersion": { "type": "Property", "value": "v2.1" },
  "firmwareVersion": { "type": "Property", "value": "v1.5.2" },
  "batteryLevel": { "type": "Property", "value": 85, "unitCode": "P1" },
  "rssi": { "type": "Property", "value": -75, "unitCode": "DBM" }
}
```

### Building Entity

For structures:

```json
{
  "id": "urn:ngsi-ld:Building:campus-main",
  "type": "Building",
  "name": { "type": "Property", "value": "Main Campus Building" },
  "address": {
    "type": "Property",
    "value": {
      "streetAddress": "123 University Ave",
      "addressLocality": "Can Tho",
      "postalCode": "900000",
      "addressCountry": "VN"
    }
  },
  "location": {
    "type": "GeoProperty",
    "value": { "type": "Point", "coordinates": [105.78, 10.03] }
  },
  "category": { "type": "Property", "value": ["educational"] },
  "floorsAboveGround": { "type": "Property", "value": 5 }
}
```

## Best Practices

### Entity ID Design

✅ **Good IDs**:

```
urn:ngsi-ld:Sensor:temperature-room-101
urn:ngsi-ld:Vehicle:bus-line-3-unit-42
urn:ngsi-ld:AirQualityObserved:station-downtown-2025-12-02T10:00:00Z
```

❌ **Bad IDs**:

```
123
temp_sensor
sensor1
urn:ngsi-ld:Entity:001  (too generic)
```

### Attribute Naming

✅ **Good Names**:

- `temperature` (lowercase, descriptive)
- `batteryLevel` (camelCase)
- `PM25` (standard abbreviation)

❌ **Bad Names**:

- `temp` (abbreviation)
- `Temperature` (should be lowercase)
- `battery_level` (use camelCase, not snake_case)

### Use Standard Data Models

Whenever possible, use [FIWARE Smart Data Models](https://smartdatamodels.org/):

- **Air Quality**: `AirQualityObserved`
- **Weather**: `WeatherObserved`
- **Parking**: `ParkingSpot`, `ParkingLot`
- **Traffic**: `TrafficFlowObserved`
- **Waste**: `WasteContainer`

## Troubleshooting

### 409 Conflict - Entity Already Exists

**Problem**: Entity with same ID already exists

**Solutions**:

1. Use different ID
2. Delete existing entity first
3. Update existing entity instead of creating

### 400 Bad Request - Invalid Entity

**Problem**: Entity format is invalid

**Solutions**:

1. Check JSON syntax (use JSON validator)
2. Verify required fields (`id`, `type`, `@context`)
3. Check attribute structure (`type`, `value`)
4. Validate coordinates format `[longitude, latitude]`

### 422 Unprocessable Entity

**Problem**: Valid JSON but invalid NGSI-LD format

**Solutions**:

1. Check entity type capitalization
2. Verify URN format for entity ID
3. Ensure properties have `type` and `value`
4. Check GeoJSON format for locations

## What You Learned

✅ NGSI-LD entity structure and components  
✅ How to design entity IDs and types  
✅ Property, GeoProperty, and Relationship attributes  
✅ How to create entities via API  
✅ How to query entities with filters  
✅ Standard unit codes and data models  
✅ Common entity patterns and best practices

## Next Step

Now that you can create entities, let's learn how to push data from your application:

[**Step 4: Push Data →**](4-push-data.md)

---

**Need to go back?** Return to [Step 2: Create a Service](2-create-service.md)
