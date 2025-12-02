# Step 6: Set Up Subscriptions

Subscriptions allow your application to receive real-time notifications when entities change. Instead of constantly polling for updates, SematX will push changes to you!

⏱️ **Time**: 15-20 minutes  
🎯 **Goal**: Set up webhooks to receive real-time entity notifications

## What are Subscriptions?

**NGSI-LD Subscriptions** are a powerful feature that:

- Monitor entity changes automatically
- Send HTTP POST notifications to your endpoint
- Filter by entity type, attributes, or conditions
- Support multiple notification formats
- Enable event-driven architectures

### Use Cases

- **Alert Systems**: Notify when sensor exceeds threshold
- **Data Pipelines**: Trigger processing when data arrives
- **Integrations**: Sync with external systems
- **Dashboards**: Real-time updates without polling
- **Logging**: Audit trail of all changes

## How Subscriptions Work

```
1. Create Subscription
   └─> Define what to watch (entity type, attributes)
   └─> Specify webhook URL
   └─> Set conditions (optional)

2. Entity Changes
   └─> User/Device updates entity
   └─> Orion-LD detects change

3. Notification Sent
   └─> HTTP POST to your webhook
   └─> Contains entity data
   └─> Includes change information

4. Your Application
   └─> Receives notification
   └─> Processes data
   └─> Takes action
```

## Prerequisites

### Set Up Webhook Endpoint

You need a publicly accessible HTTPS endpoint to receive notifications.

#### Option 1: Use webhook.site (Testing)

For testing, use [webhook.site](https://webhook.site):

1. Go to https://webhook.site
2. You'll get a unique URL like:
   ```
   https://webhook.site/12345678-1234-1234-1234-123456789abc
   ```
3. Use this URL for your subscription
4. View received notifications in real-time

#### Option 2: ngrok (Local Development)

Expose your local server to the internet:

```bash
# Install ngrok
# Download from https://ngrok.com/download

# Start your local server
node server.js  # Port 3000

# In another terminal, expose it
ngrok http 3000

# Use the HTTPS URL provided:
# https://abc123.ngrok.io/webhook
```

#### Option 3: Production Webhook

Deploy a webhook endpoint on your server:

```javascript
// webhook-server.js
const express = require("express");
const app = express();

app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("Received notification:", JSON.stringify(req.body, null, 2));

  // Process the notification
  const notification = req.body;
  notification.data.forEach((entity) => {
    console.log(`Entity ${entity.id} changed`);
    // Your logic here
  });

  // Always respond quickly (within 5 seconds)
  res.status(200).send("OK");
});

app.listen(3000, () => {
  console.log("Webhook server listening on port 3000");
});
```

## Create a Simple Subscription

Let's create a subscription to monitor temperature sensors.

### Subscription Structure

```json
{
  "type": "Subscription",
  "description": "Notify on temperature sensor changes",
  "entities": [
    {
      "type": "TemperatureSensor"
    }
  ],
  "watchedAttributes": ["temperature"],
  "notification": {
    "endpoint": {
      "uri": "https://your-webhook-url.com/webhook",
      "accept": "application/json"
    }
  }
}
```

### Create via API

```bash
curl -X POST "https://your-sematx-server.com/ngsi-ld/v1/subscriptions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project" \
  -H "Content-Type: application/ld+json" \
  -d '{
    "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "type": "Subscription",
    "description": "Temperature sensor monitoring",
    "entities": [
      {
        "type": "TemperatureSensor"
      }
    ],
    "watchedAttributes": ["temperature"],
    "notification": {
      "endpoint": {
        "uri": "https://webhook.site/your-unique-id",
        "accept": "application/json"
      }
    }
  }'
```

**Response**:

```
HTTP/1.1 201 Created
Location: /ngsi-ld/v1/subscriptions/urn:ngsi-ld:Subscription:12345
```

### Save Subscription ID

Extract the subscription ID from the `Location` header:

```
urn:ngsi-ld:Subscription:12345
```

## Test Your Subscription

### Trigger a Notification

Update an entity to trigger the subscription:

```bash
curl -X PATCH "https://your-sematx-server.com/ngsi-ld/v1/entities/urn:ngsi-ld:TemperatureSensor:room-101/attrs" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project" \
  -H "Content-Type: application/ld+json" \
  -d '{
    "temperature": {
      "type": "Property",
      "value": 27.5,
      "unitCode": "CEL"
    }
  }'
```

### Check Webhook

Your webhook should receive a notification like:

```json
{
  "id": "urn:ngsi-ld:Notification:123456",
  "type": "Notification",
  "subscriptionId": "urn:ngsi-ld:Subscription:12345",
  "notifiedAt": "2025-12-02T10:30:00.000Z",
  "data": [
    {
      "id": "urn:ngsi-ld:TemperatureSensor:room-101",
      "type": "TemperatureSensor",
      "temperature": {
        "type": "Property",
        "value": 27.5,
        "unitCode": "CEL",
        "observedAt": "2025-12-02T10:30:00Z"
      }
    }
  ]
}
```

## Advanced Subscriptions

### Condition-Based Notifications

Only notify when temperature exceeds 30°C:

```json
{
  "type": "Subscription",
  "description": "High temperature alert",
  "entities": [{ "type": "TemperatureSensor" }],
  "watchedAttributes": ["temperature"],
  "q": "temperature>30",
  "notification": {
    "endpoint": {
      "uri": "https://your-webhook.com/high-temp-alert",
      "accept": "application/json"
    },
    "attributes": ["temperature", "location", "name"]
  }
}
```

### Multiple Entity Types

Monitor different entity types:

```json
{
  "type": "Subscription",
  "description": "Environmental monitoring",
  "entities": [
    { "type": "TemperatureSensor" },
    { "type": "HumiditySensor" },
    { "type": "AirQualityObserved" }
  ],
  "notification": {
    "endpoint": {
      "uri": "https://your-webhook.com/environmental",
      "accept": "application/json"
    }
  }
}
```

### Specific Entity

Monitor a single entity:

```json
{
  "type": "Subscription",
  "description": "Room 101 monitoring",
  "entities": [
    {
      "id": "urn:ngsi-ld:TemperatureSensor:room-101"
    }
  ],
  "notification": {
    "endpoint": {
      "uri": "https://your-webhook.com/room-101",
      "accept": "application/json"
    }
  }
}
```

### Geographic Subscription

Notify for entities in a specific area:

```json
{
  "type": "Subscription",
  "description": "Downtown area sensors",
  "entities": [{ "type": "TemperatureSensor" }],
  "geoQ": {
    "georel": "within",
    "geometry": "Polygon",
    "coordinates": [
      [
        [105.77, 10.02],
        [105.79, 10.02],
        [105.79, 10.04],
        [105.77, 10.04],
        [105.77, 10.02]
      ]
    ]
  },
  "notification": {
    "endpoint": {
      "uri": "https://your-webhook.com/downtown",
      "accept": "application/json"
    }
  }
}
```

### Throttling

Limit notification frequency:

```json
{
  "type": "Subscription",
  "throttling": 60,
  "entities": [{ "type": "TemperatureSensor" }],
  "notification": {
    "endpoint": {
      "uri": "https://your-webhook.com/throttled",
      "accept": "application/json"
    }
  }
}
```

This limits notifications to once per 60 seconds, even if entities change more frequently.

## Process Notifications

### JavaScript/Node.js Webhook

```javascript
const express = require("express");
const app = express();

app.use(express.json());

// Notification handler
app.post("/webhook", async (req, res) => {
  try {
    const notification = req.body;

    console.log(`Received notification: ${notification.id}`);
    console.log(`Subscription: ${notification.subscriptionId}`);
    console.log(`Time: ${notification.notifiedAt}`);

    // Process each entity in the notification
    for (const entity of notification.data) {
      await processEntity(entity);
    }

    // IMPORTANT: Respond quickly (< 5 seconds)
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing notification:", error);
    res.status(500).send("Error");
  }
});

async function processEntity(entity) {
  console.log(`Processing entity: ${entity.id}`);

  // Example: Temperature alert
  if (entity.type === "TemperatureSensor") {
    const temp = entity.temperature?.value;

    if (temp > 30) {
      await sendAlert({
        level: "warning",
        message: `High temperature: ${temp}°C`,
        entityId: entity.id,
      });
    }
  }

  // Store in database
  await saveToDatabase(entity);

  // Trigger other actions
  await updateDashboard(entity);
}

async function sendAlert(alert) {
  // Send email, SMS, push notification, etc.
  console.log("ALERT:", alert.message);
}

async function saveToDatabase(entity) {
  // Save to your database
  console.log("Saving entity to database");
}

async function updateDashboard(entity) {
  // Update real-time dashboard
  console.log("Updating dashboard");
}

app.listen(3000, () => {
  console.log("Webhook server running on port 3000");
});
```

### Python Webhook (Flask)

```python
from flask import Flask, request, jsonify
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        notification = request.json

        logging.info(f"Received notification: {notification['id']}")
        logging.info(f"Subscription: {notification['subscriptionId']}")
        logging.info(f"Time: {notification['notifiedAt']}")

        # Process each entity
        for entity in notification['data']:
            process_entity(entity)

        # IMPORTANT: Respond quickly (< 5 seconds)
        return jsonify({'status': 'ok'}), 200

    except Exception as error:
        logging.error(f"Error processing notification: {error}")
        return jsonify({'status': 'error'}), 500

def process_entity(entity):
    logging.info(f"Processing entity: {entity['id']}")

    # Example: Temperature alert
    if entity['type'] == 'TemperatureSensor':
        temp = entity.get('temperature', {}).get('value')

        if temp and temp > 30:
            send_alert({
                'level': 'warning',
                'message': f"High temperature: {temp}°C",
                'entity_id': entity['id']
            })

    # Store in database
    save_to_database(entity)

    # Trigger other actions
    update_dashboard(entity)

def send_alert(alert):
    # Send email, SMS, push notification, etc.
    logging.warning(f"ALERT: {alert['message']}")

def save_to_database(entity):
    # Save to your database
    logging.info("Saving entity to database")

def update_dashboard(entity):
    # Update real-time dashboard
    logging.info("Updating dashboard")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
```

## Manage Subscriptions

### List All Subscriptions

```bash
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/subscriptions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project"
```

### Get Subscription Details

```bash
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/subscriptions/urn:ngsi-ld:Subscription:12345" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project"
```

### Update Subscription

```bash
curl -X PATCH "https://your-sematx-server.com/ngsi-ld/v1/subscriptions/urn:ngsi-ld:Subscription:12345" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project" \
  -H "Content-Type: application/ld+json" \
  -d '{
    "throttling": 120,
    "description": "Updated subscription with 2-minute throttling"
  }'
```

### Delete Subscription

```bash
curl -X DELETE "https://your-sematx-server.com/ngsi-ld/v1/subscriptions/urn:ngsi-ld:Subscription:12345" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project"
```

## Best Practices

### Webhook Design

✅ **Do**:

- Respond within 5 seconds
- Return 200 OK even if processing fails
- Process notifications asynchronously
- Implement idempotency (handle duplicates)
- Log all notifications
- Monitor webhook health

❌ **Don't**:

- Do heavy processing in webhook handler
- Return errors for transient issues
- Assume notifications arrive in order
- Ignore notification IDs
- Block the response

### Security

**Verify Notifications**:

```javascript
// Add custom header verification
app.post("/webhook", (req, res) => {
  const secret = req.headers["x-subscription-secret"];

  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).send("Unauthorized");
  }

  // Process notification
});
```

**Use HTTPS**: Always use HTTPS for webhook endpoints

**Implement Authentication**: Add Bearer token or API key

### Error Handling

**Retry Logic**: SematX will retry failed notifications:

- 1st retry: After 5 seconds
- 2nd retry: After 30 seconds
- 3rd retry: After 2 minutes
- Then gives up

**Handle Failures Gracefully**:

```javascript
app.post("/webhook", async (req, res) => {
  // Respond immediately
  res.status(200).send("OK");

  // Process asynchronously
  processNotification(req.body).catch((error) => {
    console.error("Processing failed:", error);
    // Store for manual retry
    saveFailedNotification(req.body);
  });
});
```

### Performance

**Use Throttling**: Prevent notification flooding

**Filter Aggressively**: Only subscribe to what you need

**Batch Processing**: Process multiple notifications together

**Scale Webhooks**: Use load balancers for high volume

## Troubleshooting

### Not Receiving Notifications

**Problem**: Webhook never receives notifications

**Solutions**:

1. **Check webhook URL**: Must be publicly accessible
2. **Check HTTPS**: Must use HTTPS (or HTTP for localhost)
3. **Test webhook**: Use curl to POST manually
4. **Check firewall**: May block incoming requests
5. **Check subscription**: Verify it's active
6. **Trigger changes**: Update an entity to test

### Duplicate Notifications

**Problem**: Receiving same notification multiple times

**Solutions**:

1. **Implement idempotency**: Check notification ID
2. **Expected behavior**: Retries can cause duplicates
3. **Store processed IDs**: Track what you've processed

### Missing Notifications

**Problem**: Some notifications not received

**Solutions**:

1. **Check throttling**: May be limiting notifications
2. **Check webhook response**: Must return 200 OK
3. **Check timeout**: Respond within 5 seconds
4. **Check conditions**: May not match entity changes

## What You Learned

✅ How NGSI-LD subscriptions work  
✅ How to create subscriptions via API  
✅ How to build webhook endpoints  
✅ Advanced subscription patterns  
✅ How to process notifications  
✅ Error handling and retry logic  
✅ Best practices for production webhooks

## Congratulations! 🎉

You've completed the "Bring Your Own Server" tutorial!

You now know how to:

- ✅ Create a SematX account and generate API keys
- ✅ Configure services for your application
- ✅ Create and manage NGSI-LD entities
- ✅ Push real-time data from your application
- ✅ Build beautiful dashboard cards
- ✅ Set up subscriptions for event-driven architecture

## Next Steps

### Learn More

- [**Core Concepts**](../../core-concepts/overview.md) - Deep dive into SematX architecture
- [**Troubleshooting**](../../reference/troubleshooting.md) - Common issues and solutions
- [**Deployment Guide**](../../deployment/index.md) - Deploy SematX to production

### Build Something

- [**Development Guide**](../../development/index.md) - Extend and customize LegoCity
- [**Custom Blocks**](../../development/blocks.md) - Extend the dashboard
- [**Plugins**](../../development/plugins.md) - Add custom features

### Get Help

- **GitHub Discussions**: [Ask questions](https://github.com/CTU-SematX/LegoCity/discussions)
- **GitHub Issues**: [Report bugs](https://github.com/CTU-SematX/LegoCity/issues)
- **Documentation**: [Browse docs](../../index.md)

Happy building with SematX! 🚀

---

**Need to go back?** Return to [Step 5: Create Dashboard Cards](5-create-card.md)
