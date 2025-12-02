# Bước 3: Tạo Entity Đầu Tiên

Bây giờ service đã được cấu hình, hãy tạo entity NGSI-LD đầu tiên. Entity là cấu trúc dữ liệu cốt lõi trong SematX.

⏱️ **Thời gian**: 10-15 phút  
🎯 **Mục tiêu**: Tạo và truy vấn entity NGSI-LD đầu tiên

## Entity Là Gì?

Một **entity** đại diện cho một đối tượng thực tế trong ứng dụng của bạn:

- **Đối Tượng Vật Lý**: Sensor, thiết bị, phương tiện, tòa nhà
- **Đối Tượng Khái Niệm**: Cảnh báo, sự kiện, quan sát
- **Địa Điểm**: Thành phố, phòng, bãi đỗ xe
- **Tổ Chức**: Phòng ban, team, công ty

## Cấu Trúc Entity NGSI-LD

Mỗi entity có ba thành phần bắt buộc:

```json
{
  "id": "urn:ngsi-ld:EntityType:uniqueId",
  "type": "EntityType",
  "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"]
}
```

### 1. Entity ID (`id`)

Mã định danh duy nhất theo định dạng URN:

```
urn:ngsi-ld:EntityType:uniqueIdentifier
```

**Ví dụ**:

```
urn:ngsi-ld:Sensor:temperature-001
urn:ngsi-ld:Building:main-campus
urn:ngsi-ld:Vehicle:bus-42
urn:ngsi-ld:AirQualityObserved:station-downtown-2025-12-02
```

**Quy tắc**:

- Phải duy nhất trong service
- Nên mô tả rõ ràng
- Dùng dấu gạch ngang để phân tách từ
- Bao gồm loại entity để rõ ràng

### 2. Entity Type (`type`)

Danh mục hoặc lớp của entity:

```
Sensor
Building
Vehicle
AirQualityObserved
TemperatureObservation
```

**Quy tắc**:

- Dùng PascalCase (viết hoa mỗi từ)
- Cụ thể (ưu tiên `TemperatureSensor` hơn `Sensor`)
- Tuân theo data model chuẩn khi có thể (FIWARE, SmartDataModels)

### 3. Context (`@context`)

Định nghĩa ý nghĩa ngữ nghĩa của dữ liệu:

```json
"@context": [
  "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
]
```

Trong tutorial này, chúng ta sẽ dùng context NGSI-LD chuẩn.

## Các Thuộc Tính Entity

Entity có thể có ba loại thuộc tính:

### Properties

Giá trị dữ liệu đơn giản:

```json
"temperature": {
  "type": "Property",
  "value": 23.5,
  "unitCode": "CEL"
}
```

### GeoProperties

Vị trí địa lý:

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

Liên kết đến entity khác:

```json
"refBuilding": {
  "type": "Relationship",
  "object": "urn:ngsi-ld:Building:001"
}
```

## Tạo Entity Temperature Sensor

Hãy tạo một ví dụ thực tế: cảm biến nhiệt độ.

### Thiết Kế Entity

**Những gì chúng ta đang mô hình hóa**:

- Một cảm biến nhiệt độ trong Phòng 101
- Đặt tại tọa độ cụ thể
- Đo nhiệt độ bằng độ C
- Số đo cuối: 23.5°C

### Entity JSON Hoàn Chỉnh

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

### Tạo Entity qua API

#### Dùng curl

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

**Phản hồi mong đợi**:

```
HTTP/1.1 201 Created
Location: /ngsi-ld/v1/entities/urn:ngsi-ld:TemperatureSensor:room-101
```

#### Dùng JavaScript

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

#### Dùng Python

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

## Truy Vấn Entity

### Lấy Entity Theo ID

```bash
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/entities/urn:ngsi-ld:TemperatureSensor:room-101" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project" \
  -H "Accept: application/ld+json"
```

### Truy Vấn Entity Theo Type

```bash
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/entities?type=TemperatureSensor" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project" \
  -H "Accept: application/ld+json"
```

### Truy Vấn Với Bộ Lọc

Lọc entity theo giá trị thuộc tính:

```bash
# Sensor có nhiệt độ > 25
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/entities?type=TemperatureSensor&q=temperature>25" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project"
```

### Truy Vấn Theo Vị Trí

Tìm entity gần một điểm:

```bash
# Sensor trong bán kính 1km từ tọa độ
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/entities?type=TemperatureSensor&geometry=Point&coordinates=[105.7800,10.0300]&georel=near;maxDistance==1000" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project"
```

## Hiểu về Unit Code

NGSI-LD dùng mã đơn vị chuẩn từ [UN/CEFACT](https://www.unece.org/cefact/codesfortrade/codes_index.html):

| Đơn vị            | Mã    | Ví dụ                |
| ----------------- | ----- | -------------------- |
| Celsius           | `CEL` | Nhiệt độ             |
| Fahrenheit        | `FAH` | Nhiệt độ             |
| Percent           | `P1`  | Pin, độ ẩm           |
| Meters            | `MTR` | Khoảng cách          |
| Kilometers        | `KMT` | Khoảng cách          |
| Kilograms         | `KGM` | Khối lượng           |
| Liters            | `LTR` | Thể tích             |
| Watts             | `WTT` | Công suất            |
| Lux               | `LUX` | Cường độ ánh sáng    |
| Pascal            | `PAL` | Áp suất              |
| Parts per million | `59`  | Chất lượng không khí |

## Các Mẫu Entity Phổ Biến

### Observation Entity

Cho số đo cảm biến:

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

Cho thiết bị IoT:

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

Cho công trình:

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

## Thực Hành Tốt Nhất

### Thiết Kế Entity ID

✅ **ID Tốt**:

```
urn:ngsi-ld:Sensor:temperature-room-101
urn:ngsi-ld:Vehicle:bus-line-3-unit-42
urn:ngsi-ld:AirQualityObserved:station-downtown-2025-12-02T10:00:00Z
```

❌ **ID Không Tốt**:

```
123
temp_sensor
sensor1
urn:ngsi-ld:Entity:001  (quá chung chung)
```

### Đặt Tên Thuộc Tính

✅ **Tên Tốt**:

- `temperature` (chữ thường, mô tả rõ)
- `batteryLevel` (camelCase)
- `PM25` (viết tắt chuẩn)

❌ **Tên Không Tốt**:

- `temp` (viết tắt)
- `Temperature` (nên là chữ thường)
- `battery_level` (dùng camelCase, không phải snake_case)

### Dùng Standard Data Model

Khi có thể, dùng [FIWARE Smart Data Models](https://smartdatamodels.org/):

- **Chất Lượng Không Khí**: `AirQualityObserved`
- **Thời Tiết**: `WeatherObserved`
- **Bãi Đỗ Xe**: `ParkingSpot`, `ParkingLot`
- **Giao Thông**: `TrafficFlowObserved`
- **Rác Thải**: `WasteContainer`

## Xử Lý Sự Cố

### 409 Conflict - Entity Already Exists

**Vấn đề**: Entity với cùng ID đã tồn tại

**Giải pháp**:

1. Dùng ID khác
2. Xóa entity hiện có trước
3. Cập nhật entity hiện có thay vì tạo mới

### 400 Bad Request - Invalid Entity

**Vấn đề**: Định dạng entity không hợp lệ

**Giải pháp**:

1. Kiểm tra cú pháp JSON (dùng JSON validator)
2. Xác minh các trường bắt buộc (`id`, `type`, `@context`)
3. Kiểm tra cấu trúc thuộc tính (`type`, `value`)
4. Xác thực định dạng tọa độ `[longitude, latitude]`

### 422 Unprocessable Entity

**Vấn đề**: JSON hợp lệ nhưng định dạng NGSI-LD không hợp lệ

**Giải pháp**:

1. Kiểm tra viết hoa entity type
2. Xác minh định dạng URN cho entity ID
3. Đảm bảo property có `type` và `value`
4. Kiểm tra định dạng GeoJSON cho vị trí

## Những Gì Bạn Đã Học

✅ Cấu trúc và thành phần entity NGSI-LD  
✅ Cách thiết kế entity ID và type  
✅ Thuộc tính Property, GeoProperty, và Relationship  
✅ Cách tạo entity qua API  
✅ Cách truy vấn entity với bộ lọc  
✅ Mã đơn vị chuẩn và data model  
✅ Các mẫu entity phổ biến và thực hành tốt nhất

## Bước Tiếp Theo

Bây giờ bạn có thể tạo entity, hãy học cách đẩy dữ liệu từ ứng dụng:

[**Bước 4: Đẩy Dữ Liệu →**](4-push-data.vi.md)

---

**Cần quay lại?** Về [Bước 2: Tạo Service](2-create-service.vi.md)
