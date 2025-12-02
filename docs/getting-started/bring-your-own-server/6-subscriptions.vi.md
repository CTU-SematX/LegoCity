# Bước 6: Thiết Lập Subscription

Subscription cho phép ứng dụng nhận thông báo thời gian thực khi entity thay đổi. Thay vì liên tục polling, SematX sẽ đẩy thay đổi đến bạn!

⏱️ **Thời gian**: 15-20 phút  
🎯 **Mục tiêu**: Thiết lập webhook để nhận thông báo entity thời gian thực

## Subscription Là Gì?

**NGSI-LD Subscription** là tính năng mạnh mẽ cho phép:

- Theo dõi thay đổi entity tự động
- Gửi thông báo HTTP POST đến endpoint của bạn
- Lọc theo loại entity, thuộc tính, hoặc điều kiện
- Hỗ trợ nhiều định dạng thông báo
- Bật kiến trúc hướng sự kiện

### Trường Hợp Sử Dụng

- **Hệ Thống Cảnh Báo**: Thông báo khi sensor vượt ngưỡng
- **Data Pipeline**: Kích hoạt xử lý khi dữ liệu đến
- **Tích Hợp**: Đồng bộ với hệ thống bên ngoài
- **Dashboard**: Cập nhật thời gian thực không cần polling
- **Logging**: Audit trail của tất cả thay đổi

## Subscription Hoạt Động Như Thế Nào

```
1. Tạo Subscription
   └─> Định nghĩa những gì cần theo dõi (loại entity, thuộc tính)
   └─> Chỉ định webhook URL
   └─> Đặt điều kiện (tùy chọn)

2. Entity Thay Đổi
   └─> User/Device cập nhật entity
   └─> Orion-LD phát hiện thay đổi

3. Gửi Thông Báo
   └─> HTTP POST đến webhook của bạn
   └─> Chứa dữ liệu entity
   └─> Bao gồm thông tin thay đổi

4. Ứng Dụng Của Bạn
   └─> Nhận thông báo
   └─> Xử lý dữ liệu
   └─> Thực hiện hành động
```

## Yêu Cầu Trước

### Thiết Lập Webhook Endpoint

Bạn cần endpoint HTTPS công khai để nhận thông báo.

#### Lựa Chọn 1: Dùng webhook.site (Testing)

Cho testing, dùng [webhook.site](https://webhook.site):

1. Vào https://webhook.site
2. Bạn sẽ nhận URL duy nhất như:
   ```
   https://webhook.site/12345678-1234-1234-1234-123456789abc
   ```
3. Dùng URL này cho subscription
4. Xem thông báo nhận được thời gian thực

#### Lựa Chọn 2: ngrok (Local Development)

Expose local server ra internet:

```bash
# Cài đặt ngrok
# Download từ https://ngrok.com/download

# Khởi động local server
node server.js  # Port 3000

# Trong terminal khác, expose nó
ngrok http 3000

# Dùng HTTPS URL được cung cấp:
# https://abc123.ngrok.io/webhook
```

#### Lựa Chọn 3: Production Webhook

Triển khai webhook endpoint trên server:

```javascript
// webhook-server.js
const express = require("express");
const app = express();

app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("Received notification:", JSON.stringify(req.body, null, 2));

  // Xử lý thông báo
  const notification = req.body;
  notification.data.forEach((entity) => {
    console.log(`Entity ${entity.id} changed`);
    // Logic của bạn ở đây
  });

  // Luôn phản hồi nhanh (trong 5 giây)
  res.status(200).send("OK");
});

app.listen(3000, () => {
  console.log("Webhook server listening on port 3000");
});
```

## Tạo Subscription Đơn Giản

Hãy tạo subscription để theo dõi cảm biến nhiệt độ.

### Cấu Trúc Subscription

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

### Tạo qua API

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

**Phản hồi**:

```
HTTP/1.1 201 Created
Location: /ngsi-ld/v1/subscriptions/urn:ngsi-ld:Subscription:12345
```

### Lưu Subscription ID

Trích xuất subscription ID từ header `Location`:

```
urn:ngsi-ld:Subscription:12345
```

## Kiểm Tra Subscription

### Kích Hoạt Thông Báo

Cập nhật entity để kích hoạt subscription:

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

### Kiểm Tra Webhook

Webhook sẽ nhận thông báo như:

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

## Subscription Nâng Cao

### Thông Báo Dựa Trên Điều Kiện

Chỉ thông báo khi nhiệt độ vượt 30°C:

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

### Nhiều Loại Entity

Theo dõi các loại entity khác nhau:

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

### Entity Cụ Thể

Theo dõi một entity duy nhất:

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

### Subscription Địa Lý

Thông báo cho entity trong khu vực cụ thể:

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

Giới hạn tần suất thông báo:

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

Điều này giới hạn thông báo một lần mỗi 60 giây, ngay cả khi entity thay đổi thường xuyên hơn.

## Xử Lý Thông Báo

### JavaScript/Node.js Webhook

```javascript
const express = require("express");
const app = express();

app.use(express.json());

// Handler thông báo
app.post("/webhook", async (req, res) => {
  try {
    const notification = req.body;

    console.log(`Received notification: ${notification.id}`);
    console.log(`Subscription: ${notification.subscriptionId}`);
    console.log(`Time: ${notification.notifiedAt}`);

    // Xử lý mỗi entity trong thông báo
    for (const entity of notification.data) {
      await processEntity(entity);
    }

    // QUAN TRỌNG: Phản hồi nhanh (< 5 giây)
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing notification:", error);
    res.status(500).send("Error");
  }
});

async function processEntity(entity) {
  console.log(`Processing entity: ${entity.id}`);

  // Ví dụ: Cảnh báo nhiệt độ
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

  // Lưu vào database
  await saveToDatabase(entity);

  // Kích hoạt hành động khác
  await updateDashboard(entity);
}

async function sendAlert(alert) {
  // Gửi email, SMS, push notification, v.v.
  console.log("ALERT:", alert.message);
}

async function saveToDatabase(entity) {
  // Lưu vào database
  console.log("Saving entity to database");
}

async function updateDashboard(entity) {
  // Cập nhật dashboard thời gian thực
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

        # Xử lý mỗi entity
        for entity in notification['data']:
            process_entity(entity)

        # QUAN TRỌNG: Phản hồi nhanh (< 5 giây)
        return jsonify({'status': 'ok'}), 200

    except Exception as error:
        logging.error(f"Error processing notification: {error}")
        return jsonify({'status': 'error'}), 500

def process_entity(entity):
    logging.info(f"Processing entity: {entity['id']}")

    # Ví dụ: Cảnh báo nhiệt độ
    if entity['type'] == 'TemperatureSensor':
        temp = entity.get('temperature', {}).get('value')

        if temp and temp > 30:
            send_alert({
                'level': 'warning',
                'message': f"High temperature: {temp}°C",
                'entity_id': entity['id']
            })

    # Lưu vào database
    save_to_database(entity)

    # Kích hoạt hành động khác
    update_dashboard(entity)

def send_alert(alert):
    # Gửi email, SMS, push notification, v.v.
    logging.warning(f"ALERT: {alert['message']}")

def save_to_database(entity):
    # Lưu vào database
    logging.info("Saving entity to database")

def update_dashboard(entity):
    # Cập nhật dashboard thời gian thực
    logging.info("Updating dashboard")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
```

## Quản Lý Subscription

### Liệt Kê Tất Cả Subscription

```bash
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/subscriptions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project"
```

### Lấy Chi Tiết Subscription

```bash
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/subscriptions/urn:ngsi-ld:Subscription:12345" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project"
```

### Cập Nhật Subscription

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

### Xóa Subscription

```bash
curl -X DELETE "https://your-sematx-server.com/ngsi-ld/v1/subscriptions/urn:ngsi-ld:Subscription:12345" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project"
```

## Thực Hành Tốt Nhất

### Thiết Kế Webhook

✅ **Nên**:

- Phản hồi trong 5 giây
- Trả về 200 OK ngay cả khi xử lý thất bại
- Xử lý thông báo bất đồng bộ
- Triển khai idempotency (xử lý trùng lặp)
- Log tất cả thông báo
- Giám sát health webhook

❌ **Không nên**:

- Xử lý nặng trong webhook handler
- Trả về lỗi cho vấn đề tạm thời
- Giả định thông báo đến theo thứ tự
- Bỏ qua notification ID
- Block phản hồi

### Bảo Mật

**Xác Minh Thông Báo**:

```javascript
// Thêm xác minh custom header
app.post("/webhook", (req, res) => {
  const secret = req.headers["x-subscription-secret"];

  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).send("Unauthorized");
  }

  // Xử lý thông báo
});
```

**Dùng HTTPS**: Luôn dùng HTTPS cho webhook endpoint

**Triển Khai Authentication**: Thêm Bearer token hoặc API key

### Xử Lý Lỗi

**Retry Logic**: SematX sẽ retry thông báo thất bại:

- Retry 1: Sau 5 giây
- Retry 2: Sau 30 giây
- Retry 3: Sau 2 phút
- Sau đó từ bỏ

**Xử Lý Thất Bại Graceful**:

```javascript
app.post("/webhook", async (req, res) => {
  // Phản hồi ngay lập tức
  res.status(200).send("OK");

  // Xử lý bất đồng bộ
  processNotification(req.body).catch((error) => {
    console.error("Processing failed:", error);
    // Lưu để retry thủ công
    saveFailedNotification(req.body);
  });
});
```

### Hiệu Suất

**Dùng Throttling**: Ngăn thông báo tràn

**Lọc Tích Cực**: Chỉ subscribe những gì cần

**Batch Processing**: Xử lý nhiều thông báo cùng lúc

**Scale Webhook**: Dùng load balancer cho lưu lượng cao

## Xử Lý Sự Cố

### Not Receiving Notifications

**Vấn đề**: Webhook không bao giờ nhận thông báo

**Giải pháp**:

1. **Kiểm tra webhook URL**: Phải accessible công khai
2. **Kiểm tra HTTPS**: Phải dùng HTTPS (hoặc HTTP cho localhost)
3. **Test webhook**: Dùng curl để POST thủ công
4. **Kiểm tra firewall**: Có thể chặn request đến
5. **Kiểm tra subscription**: Xác minh nó active
6. **Kích hoạt thay đổi**: Cập nhật entity để test

### Duplicate Notifications

**Vấn đề**: Nhận cùng thông báo nhiều lần

**Giải pháp**:

1. **Triển khai idempotency**: Kiểm tra notification ID
2. **Hành vi mong đợi**: Retry có thể gây trùng lặp
3. **Lưu processed ID**: Theo dõi những gì đã xử lý

### Missing Notifications

**Vấn đề**: Một số thông báo không nhận được

**Giải pháp**:

1. **Kiểm tra throttling**: Có thể giới hạn thông báo
2. **Kiểm tra phản hồi webhook**: Phải trả về 200 OK
3. **Kiểm tra timeout**: Phản hồi trong 5 giây
4. **Kiểm tra điều kiện**: Có thể không khớp thay đổi entity

## Những Gì Bạn Đã Học

✅ NGSI-LD subscription hoạt động như thế nào  
✅ Cách tạo subscription qua API  
✅ Cách xây dựng webhook endpoint  
✅ Mẫu subscription nâng cao  
✅ Cách xử lý thông báo  
✅ Xử lý lỗi và retry logic  
✅ Thực hành tốt nhất cho production webhook

## Chúc Mừng! 🎉

Bạn đã hoàn thành tutorial "Bring Your Own Server"!

Bây giờ bạn biết cách:

- ✅ Tạo tài khoản SematX và tạo API key
- ✅ Cấu hình service cho ứng dụng
- ✅ Tạo và quản lý entity NGSI-LD
- ✅ Đẩy dữ liệu thời gian thực từ ứng dụng
- ✅ Xây dựng dashboard card đẹp
- ✅ Thiết lập subscription cho kiến trúc hướng sự kiện

## Bước Tiếp Theo

### Học Thêm

- [**Core Concepts**](../../core-concepts/overview.md) - Đi sâu vào kiến trúc SematX
- [**Troubleshooting**](../../reference/troubleshooting.vi.md) - Các vấn đề thường gặp và giải pháp
- [**Deployment Guide**](../../deployment/index.vi.md) - Deploy SematX lên production

### Xây Dựng Gì Đó

- [**Development Guide**](../../development/index.vi.md) - Mở rộng và tùy chỉnh LegoCity
- [**Custom Blocks**](../../development/blocks.vi.md) - Mở rộng dashboard
- [**Plugins**](../../development/plugins.vi.md) - Thêm tính năng tùy chỉnh

### Nhận Trợ Giúp

- **GitHub Discussions**: [Đặt câu hỏi](https://github.com/CTU-SematX/LegoCity/discussions)
- **GitHub Issues**: [Báo cáo lỗi](https://github.com/CTU-SematX/LegoCity/issues)
- **Documentation**: [Duyệt docs](../../index.md)

Chúc vui vẻ khi xây dựng với SematX! 🚀

---

**Cần quay lại?** Về [Bước 5: Tạo Dashboard Card](5-create-card.vi.md)
