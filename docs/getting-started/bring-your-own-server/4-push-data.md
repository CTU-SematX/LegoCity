# Step 4: Push Data

Now that you have entities created, let's learn how to push real-time data from your application to SematX. This is where your application comes alive!

⏱️ **Time**: 15-20 minutes  
🎯 **Goal**: Send continuous data updates from your application

## Update vs Create

There are two ways to send data to SematX:

### Update Entity Attributes (PATCH)

**Use when**: Entity already exists, just updating values

```http
PATCH /ngsi-ld/v1/entities/{entityId}/attrs
```

**Advantages**:

- Faster (no full entity needed)
- Updates only specified attributes
- Preserves other attributes
- Idempotent (safe to retry)

### Upsert Entity (POST)

**Use when**: Entity may or may not exist

```http
POST /ngsi-ld/v1/entityOperations/upsert
```

**Advantages**:

- Creates entity if missing
- Updates if exists
- Good for batch operations
- Simplified error handling

## Simple Data Push

### Update Temperature Reading

Let's update our temperature sensor with a new reading:

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

**Response**: `204 No Content` (success)

### JavaScript Implementation

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

// Example usage
await updateTemperature("urn:ngsi-ld:TemperatureSensor:room-101", 24.8);
```

### Python Implementation

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

# Example usage
update_temperature('urn:ngsi-ld:TemperatureSensor:room-101', 24.8)
```

## Continuous Data Streaming

### Polling Sensor Data

Read from a sensor and push to SematX continuously:

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

  // Simulate reading from actual sensor
  async readSensor() {
    // Replace with actual sensor reading logic
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

    // Push immediately
    this.pushData();

    // Then push at regular intervals
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

// Usage
const pusher = new SensorDataPusher(
  "urn:ngsi-ld:TemperatureSensor:room-101",
  60000 // Push every 60 seconds
);

pusher.start();

// Stop after 5 minutes (for demo)
setTimeout(() => pusher.stop(), 5 * 60 * 1000);

// Graceful shutdown
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
        """Simulate reading from actual sensor"""
        # Replace with actual sensor reading logic
        return {
            'temperature': 20 + random.random() * 10,  # 20-30°C
            'humidity': 40 + random.random() * 30,     # 40-70%
            'pressure': 1000 + random.random() * 30    # 1000-1030 hPa
        }

    def push_data(self) -> bool:
        """Read sensor and push to SematX"""
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
        """Start pushing data at regular intervals"""
        if self.is_running:
            print('⚠️ Data pusher already running')
            return

        self.is_running = True
        print(f'🚀 Starting data pusher (interval: {self.interval_seconds}s)')

        # Set up signal handler for graceful shutdown
        signal.signal(signal.SIGINT, lambda s, f: self.stop())

        # Push immediately
        self.push_data()

        # Then push at regular intervals
        try:
            while self.is_running:
                time.sleep(self.interval_seconds)
                if self.is_running:
                    self.push_data()
        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        """Stop pushing data"""
        if not self.is_running:
            return

        self.is_running = False
        print('\\n🛑 Data pusher stopped')

# Usage
if __name__ == '__main__':
    pusher = SensorDataPusher(
        'urn:ngsi-ld:TemperatureSensor:room-101',
        interval_seconds=60  # Push every 60 seconds
    )

    pusher.start()
```

## Batch Updates

For multiple entities, use batch operations:

### Update Multiple Entities

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

// Example: Update multiple sensors
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

## Error Handling

### Retry with Exponential Backoff

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

      // If successful and queue has items, try to flush queue
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

## Data Validation

### Validate Before Pushing

```javascript
function validateReading(reading) {
  const errors = [];

  // Check temperature range
  if (reading.temperature < -50 || reading.temperature > 100) {
    errors.push(`Invalid temperature: ${reading.temperature}`);
  }

  // Check humidity range
  if (reading.humidity < 0 || reading.humidity > 100) {
    errors.push(`Invalid humidity: ${reading.humidity}`);
  }

  // Check pressure range
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

## Best Practices

### Update Frequency

**Guidelines**:

- **Fast-changing data**: Every 1-5 seconds (vehicle location, real-time monitoring)
- **Normal updates**: Every 30-60 seconds (sensor readings)
- **Slow-changing data**: Every 5-15 minutes (weather, air quality)
- **Rare updates**: On change only (device status, configuration)

**Consider**:

- Rate limits on your API key
- Network bandwidth
- Battery life (for battery-powered devices)
- Storage costs

### Timestamp Management

Always include `observedAt` timestamp:

```javascript
{
  temperature: {
    type: 'Property',
    value: 24.5,
    unitCode: 'CEL',
    observedAt: new Date().toISOString()  // ✅ Include timestamp
  }
}
```

This allows:

- Temporal queries (historical data)
- Out-of-order data handling
- Data quality analysis
- Time-series visualization

### Connection Management

```javascript
// ✅ Good: Reuse connections
const client = new SematXClient(config);

// ❌ Bad: Create new connection each time
function updateData() {
  const client = new SematXClient(config); // Don't do this!
  client.updateEntity(...)
}
```

### Monitor Performance

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

## Troubleshooting

### 404 Not Found

**Problem**: Entity doesn't exist

**Solution**: Create entity first, or use upsert operation

### 429 Too Many Requests

**Problem**: Exceeded rate limit

**Solution**:

1. Reduce update frequency
2. Implement exponential backoff
3. Request higher rate limit
4. Use batch operations

### Network Errors

**Problem**: Connection timeout or network issues

**Solution**:

1. Implement retry logic
2. Queue failed updates
3. Use circuit breaker pattern
4. Monitor network connectivity

## What You Learned

✅ How to update entity attributes  
✅ Continuous data streaming patterns  
✅ Batch update operations  
✅ Error handling and retry logic  
✅ Data validation techniques  
✅ Performance monitoring  
✅ Best practices for data pushing

## Next Step

Now that data is flowing, let's create dashboard cards to visualize it:

[**Step 5: Create Dashboard Cards →**](5-create-card.md)

---

**Need to go back?** Return to [Step 3: Create Your First Entity](3-create-entity.md)
