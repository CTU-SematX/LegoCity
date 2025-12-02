# Bước 4: Đẩy Dữ Liệu

Bây giờ bạn đã tạo entity, hãy học cách đẩy dữ liệu thời gian thực từ ứng dụng đến SematX. Đây là lúc ứng dụng của bạn trở nên sống động!

⏱️ **Thời gian**: 15-20 phút  
🎯 **Mục tiêu**: Gửi cập nhật dữ liệu liên tục từ ứng dụng

## Update vs Create

Có hai cách để gửi dữ liệu đến SematX:

### Update Entity Attributes (PATCH)

**Dùng khi**: Entity đã tồn tại, chỉ cập nhật giá trị

```http
PATCH /ngsi-ld/v1/entities/{entityId}/attrs
```

**Ưu điểm**:

- Nhanh hơn (không cần entity đầy đủ)
- Chỉ cập nhật thuộc tính được chỉ định
- Giữ nguyên các thuộc tính khác
- Idempotent (an toàn để retry)

### Upsert Entity (POST)

**Dùng khi**: Entity có thể tồn tại hoặc không

```http
POST /ngsi-ld/v1/entityOperations/upsert
```

**Ưu điểm**:

- Tạo entity nếu thiếu
- Cập nhật nếu tồn tại
- Tốt cho batch operation
- Xử lý lỗi đơn giản hơn

## Đẩy Dữ Liệu Đơn Giản

### Cập Nhật Số Đo Nhiệt Độ

Hãy cập nhật cảm biến nhiệt độ với số đo mới:

```bash
curl -X PATCH "https://your-sematx-server.com/ngsi-ld/v1/entities/urn:ngsi-ld:TemperatureSensor:room-101/attrs" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project" \
  -H "Content-Type: application/ld+json" \
  -d '{
    "temperature": {
      "type": "Property",
      "value": 24.8,
      "unitCode": "CEL",
      "observedAt": "2025-12-02T10:15:00Z"
    }
  }'
```

**Phản hồi**: `204 No Content` (thành công)

### Triển Khai JavaScript

```javascript
import { client } from "./sematx-client.js";

async function updateTemperature(entityId, temperature) {
  const attributes = {
    temperature: {
      type: "Property",
      value: temperature,
      unitCode: "CEL",
      observedAt: new Date().toISOString(),
    },
  };

  try {
    await client.updateEntity(entityId, attributes);
    console.log(`✅ Updated ${entityId}: ${temperature}°C`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update: ${error.message}`);
    return false;
  }
}

// Ví dụ sử dụng
await updateTemperature("urn:ngsi-ld:TemperatureSensor:room-101", 24.8);
```

### Triển Khai Python

```python
from sematx_client import client
from datetime import datetime

def update_temperature(entity_id: str, temperature: float) -> bool:
    attributes = {
        'temperature': {
            'type': 'Property',
            'value': temperature,
            'unitCode': 'CEL',
            'observedAt': datetime.utcnow().isoformat() + 'Z'
        }
    }

    try:
        client.update_entity(entity_id, attributes)
        print(f'✅ Updated {entity_id}: {temperature}°C')
        return True
    except Exception as error:
        print(f'❌ Failed to update: {error}')
        return False

# Ví dụ sử dụng
update_temperature('urn:ngsi-ld:TemperatureSensor:room-101', 24.8)
```

## Streaming Dữ Liệu Liên Tục

### Polling Dữ Liệu Sensor

Đọc từ sensor và đẩy đến SematX liên tục:

#### JavaScript

```javascript
import { client } from "./sematx-client.js";

class SensorDataPusher {
  constructor(entityId, intervalMs = 60000) {
    this.entityId = entityId;
    this.intervalMs = intervalMs;
    this.isRunning = false;
    this.intervalId = null;
  }

  // Mô phỏng đọc từ sensor thực tế
  async readSensor() {
    // Thay thế bằng logic đọc sensor thực tế
    return {
      temperature: 20 + Math.random() * 10, // 20-30°C
      humidity: 40 + Math.random() * 30, // 40-70%
      pressure: 1000 + Math.random() * 30, // 1000-1030 hPa
    };
  }

  async pushData() {
    try {
      const reading = await this.readSensor();

      const attributes = {
        temperature: {
          type: "Property",
          value: reading.temperature,
          unitCode: "CEL",
          observedAt: new Date().toISOString(),
        },
        humidity: {
          type: "Property",
          value: reading.humidity,
          unitCode: "P1",
          observedAt: new Date().toISOString(),
        },
        pressure: {
          type: "Property",
          value: reading.pressure,
          unitCode: "PAL",
          observedAt: new Date().toISOString(),
        },
      };

      await client.updateEntity(this.entityId, attributes);

      console.log(`[${new Date().toISOString()}] Pushed data:`, {
        temp: reading.temperature.toFixed(1),
        humidity: reading.humidity.toFixed(1),
        pressure: reading.pressure.toFixed(0),
      });

      return true;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error:`, error.message);
      return false;
    }
  }

  start() {
    if (this.isRunning) {
      console.log("⚠️ Data pusher already running");
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting data pusher (interval: ${this.intervalMs}ms)`);

    // Đẩy ngay lập tức
    this.pushData();

    // Sau đó đẩy theo khoảng thời gian
    this.intervalId = setInterval(() => {
      this.pushData();
    }, this.intervalMs);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    clearInterval(this.intervalId);
    this.isRunning = false;
    console.log("🛑 Data pusher stopped");
  }
}

// Sử dụng
const pusher = new SensorDataPusher(
  "urn:ngsi-ld:TemperatureSensor:room-101",
  60000 // Đẩy mỗi 60 giây
);

pusher.start();

// Dừng sau 5 phút (cho demo)
setTimeout(() => pusher.stop(), 5 * 60 * 1000);

// Tắt graceful
process.on("SIGINT", () => {
  console.log("\\n🛑 Shutting down...");
  pusher.stop();
  process.exit(0);
});
```

#### Python

```python
import time
import signal
import random
from datetime import datetime
from sematx_client import client

class SensorDataPusher:
    def __init__(self, entity_id: str, interval_seconds: int = 60):
        self.entity_id = entity_id
        self.interval_seconds = interval_seconds
        self.is_running = False

    def read_sensor(self) -> dict:
        """Mô phỏng đọc từ sensor thực tế"""
        # Thay thế bằng logic đọc sensor thực tế
        return {
            'temperature': 20 + random.random() * 10,  # 20-30°C
            'humidity': 40 + random.random() * 30,     # 40-70%
            'pressure': 1000 + random.random() * 30    # 1000-1030 hPa
        }

    def push_data(self) -> bool:
        """Đọc sensor và đẩy đến SematX"""
        try:
            reading = self.read_sensor()

            attributes = {
                'temperature': {
                    'type': 'Property',
                    'value': reading['temperature'],
                    'unitCode': 'CEL',
                    'observedAt': datetime.utcnow().isoformat() + 'Z'
                },
                'humidity': {
                    'type': 'Property',
                    'value': reading['humidity'],
                    'unitCode': 'P1',
                    'observedAt': datetime.utcnow().isoformat() + 'Z'
                },
                'pressure': {
                    'type': 'Property',
                    'value': reading['pressure'],
                    'unitCode': 'PAL',
                    'observedAt': datetime.utcnow().isoformat() + 'Z'
                }
            }

            client.update_entity(self.entity_id, attributes)

            timestamp = datetime.utcnow().isoformat()
            print(f'[{timestamp}] Pushed data:', {
                'temp': f"{reading['temperature']:.1f}",
                'humidity': f"{reading['humidity']:.1f}",
                'pressure': f"{reading['pressure']:.0f}"
            })

            return True
        except Exception as error:
            timestamp = datetime.utcnow().isoformat()
            print(f'[{timestamp}] Error: {error}')
            return False

    def start(self):
        """Bắt đầu đẩy dữ liệu theo khoảng thời gian"""
        if self.is_running:
            print('⚠️ Data pusher already running')
            return

        self.is_running = True
        print(f'🚀 Starting data pusher (interval: {self.interval_seconds}s)')

        # Thiết lập signal handler để tắt graceful
        signal.signal(signal.SIGINT, lambda s, f: self.stop())

        # Đẩy ngay lập tức
        self.push_data()

        # Sau đó đẩy theo khoảng thời gian
        try:
            while self.is_running:
                time.sleep(self.interval_seconds)
                if self.is_running:
                    self.push_data()
        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        """Dừng đẩy dữ liệu"""
        if not self.is_running:
            return

        self.is_running = False
        print('\\n🛑 Data pusher stopped')

# Sử dụng
if __name__ == '__main__':
    pusher = SensorDataPusher(
        'urn:ngsi-ld:TemperatureSensor:room-101',
        interval_seconds=60  # Đẩy mỗi 60 giây
    )

    pusher.start()
```

## Cập Nhật Hàng Loạt

Cho nhiều entity, dùng batch operation:

### Cập Nhật Nhiều Entity

```javascript
async function batchUpdate(updates) {
  const payload = {
    actionType: "update",
    entities: updates,
  };

  const response = await fetch(
    `${sematxConfig.url}/ngsi-ld/v1/entityOperations/upsert`,
    {
      method: "POST",
      headers: sematxConfig.headers,
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(`Batch update failed: ${response.status}`);
  }

  const result = await response.json();
  console.log(`✅ Updated ${result.success?.length || 0} entities`);

  if (result.errors?.length > 0) {
    console.error(`❌ Failed ${result.errors.length} entities`);
  }
}

// Ví dụ: Cập nhật nhiều sensor
const updates = [
  {
    id: "urn:ngsi-ld:TemperatureSensor:room-101",
    type: "TemperatureSensor",
    temperature: { type: "Property", value: 24.5, unitCode: "CEL" },
  },
  {
    id: "urn:ngsi-ld:TemperatureSensor:room-102",
    type: "TemperatureSensor",
    temperature: { type: "Property", value: 23.8, unitCode: "CEL" },
  },
  {
    id: "urn:ngsi-ld:TemperatureSensor:room-103",
    type: "TemperatureSensor",
    temperature: { type: "Property", value: 25.2, unitCode: "CEL" },
  },
];

await batchUpdate(updates);
```

## Xử Lý Lỗi

### Retry với Exponential Backoff

```javascript
class DataPusher {
  async pushWithRetry(entityId, attributes, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await client.updateEntity(entityId, attributes);
        return true;
      } catch (error) {
        if (attempt === maxRetries - 1) {
          console.error(`❌ Failed after ${maxRetries} attempts`);
          throw error;
        }

        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(
          `⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}
```

### Queue Failed Updates

```javascript
class DataPusher {
  constructor(entityId) {
    this.entityId = entityId;
    this.failedQueue = [];
  }

  async pushData(attributes) {
    try {
      await client.updateEntity(this.entityId, attributes);

      // Nếu thành công và queue có item, thử flush queue
      if (this.failedQueue.length > 0) {
        await this.flushQueue();
      }

      return true;
    } catch (error) {
      console.error("❌ Push failed, queueing for retry:", error.message);
      this.failedQueue.push({ attributes, timestamp: Date.now() });
      return false;
    }
  }

  async flushQueue() {
    console.log(`🔄 Flushing ${this.failedQueue.length} queued updates...`);

    const queue = [...this.failedQueue];
    this.failedQueue = [];

    for (const item of queue) {
      try {
        await client.updateEntity(this.entityId, item.attributes);
        console.log("✅ Queued update successful");
      } catch (error) {
        console.error("❌ Queued update still failing");
        this.failedQueue.push(item);
      }
    }
  }
}
```

## Xác Thực Dữ Liệu

### Xác Thực Trước Khi Đẩy

```javascript
function validateReading(reading) {
  const errors = [];

  // Kiểm tra dải nhiệt độ
  if (reading.temperature < -50 || reading.temperature > 100) {
    errors.push(`Invalid temperature: ${reading.temperature}`);
  }

  // Kiểm tra dải độ ẩm
  if (reading.humidity < 0 || reading.humidity > 100) {
    errors.push(`Invalid humidity: ${reading.humidity}`);
  }

  // Kiểm tra dải áp suất
  if (reading.pressure < 900 || reading.pressure > 1100) {
    errors.push(`Invalid pressure: ${reading.pressure}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

async function pushValidatedData(entityId, reading) {
  const validation = validateReading(reading);

  if (!validation.isValid) {
    console.error("❌ Invalid reading:", validation.errors);
    return false;
  }

  return await client.updateEntity(entityId, {
    temperature: {
      type: "Property",
      value: reading.temperature,
      unitCode: "CEL",
      observedAt: new Date().toISOString(),
    },
    humidity: {
      type: "Property",
      value: reading.humidity,
      unitCode: "P1",
      observedAt: new Date().toISOString(),
    },
    pressure: {
      type: "Property",
      value: reading.pressure,
      unitCode: "PAL",
      observedAt: new Date().toISOString(),
    },
  });
}
```

## Thực Hành Tốt Nhất

### Tần Suất Cập Nhật

**Hướng dẫn**:

- **Dữ liệu thay đổi nhanh**: Mỗi 1-5 giây (vị trí xe, giám sát thời gian thực)
- **Cập nhật bình thường**: Mỗi 30-60 giây (số đo cảm biến)
- **Dữ liệu thay đổi chậm**: Mỗi 5-15 phút (thời tiết, chất lượng không khí)
- **Cập nhật hiếm**: Chỉ khi thay đổi (trạng thái thiết bị, cấu hình)

**Cân nhắc**:

- Rate limit trên API key
- Băng thông mạng
- Tuổi thọ pin (cho thiết bị dùng pin)
- Chi phí lưu trữ

### Quản Lý Timestamp

Luôn bao gồm timestamp `observedAt`:

```javascript
{
  temperature: {
    type: 'Property',
    value: 24.5,
    unitCode: 'CEL',
    observedAt: new Date().toISOString()  // ✅ Bao gồm timestamp
  }
}
```

Điều này cho phép:

- Truy vấn theo thời gian (dữ liệu lịch sử)
- Xử lý dữ liệu không theo thứ tự
- Phân tích chất lượng dữ liệu
- Trực quan hóa chuỗi thời gian

### Quản Lý Kết Nối

```javascript
// ✅ Tốt: Dùng lại kết nối
const client = new SematXClient(config);

// ❌ Không tốt: Tạo kết nối mới mỗi lần
function updateData() {
  const client = new SematXClient(config); // Đừng làm thế này!
  client.updateEntity(...)
}
```

### Giám Sát Hiệu Suất

```javascript
class DataPusher {
  constructor() {
    this.stats = {
      totalPushes: 0,
      successCount: 0,
      errorCount: 0,
      avgLatency: 0,
    };
  }

  async pushData(entityId, attributes) {
    const startTime = Date.now();

    try {
      await client.updateEntity(entityId, attributes);

      const latency = Date.now() - startTime;
      this.stats.totalPushes++;
      this.stats.successCount++;
      this.stats.avgLatency =
        (this.stats.avgLatency * (this.stats.totalPushes - 1) + latency) /
        this.stats.totalPushes;

      return true;
    } catch (error) {
      this.stats.totalPushes++;
      this.stats.errorCount++;
      return false;
    }
  }

  printStats() {
    console.log("📊 Statistics:");
    console.log(`  Total pushes: ${this.stats.totalPushes}`);
    console.log(
      `  Success rate: ${(
        (this.stats.successCount / this.stats.totalPushes) *
        100
      ).toFixed(1)}%`
    );
    console.log(`  Avg latency: ${this.stats.avgLatency.toFixed(0)}ms`);
  }
}
```

## Xử Lý Sự Cố

### 404 Not Found

**Vấn đề**: Entity không tồn tại

**Giải pháp**: Tạo entity trước, hoặc dùng upsert operation

### 429 Too Many Requests

**Vấn đề**: Vượt quá rate limit

**Giải pháp**:

1. Giảm tần suất cập nhật
2. Triển khai exponential backoff
3. Yêu cầu rate limit cao hơn
4. Dùng batch operation

### Network Error

**Vấn đề**: Timeout hoặc vấn đề mạng

**Giải pháp**:

1. Triển khai retry logic
2. Queue failed update
3. Dùng circuit breaker pattern
4. Giám sát kết nối mạng

## Những Gì Bạn Đã Học

✅ Cách cập nhật thuộc tính entity  
✅ Mẫu streaming dữ liệu liên tục  
✅ Batch update operation  
✅ Xử lý lỗi và retry logic  
✅ Kỹ thuật xác thực dữ liệu  
✅ Giám sát hiệu suất  
✅ Thực hành tốt nhất cho đẩy dữ liệu

## Bước Tiếp Theo

Bây giờ dữ liệu đang chảy, hãy tạo dashboard card để trực quan hóa:

[**Bước 5: Tạo Dashboard Card →**](5-create-card.vi.md)

---

**Cần quay lại?** Về [Bước 3: Tạo Entity Đầu Tiên](3-create-entity.vi.md)
