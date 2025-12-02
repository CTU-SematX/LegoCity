# Bước 5: Tạo Dashboard Card

Bây giờ dữ liệu đang chảy vào SematX, hãy tạo các card dashboard trực quan để hiển thị đẹp mắt.

⏱️ **Thời gian**: 15-20 phút  
🎯 **Mục tiêu**: Xây dựng card tương tác để trực quan hóa dữ liệu entity

## Dashboard Card Là Gì?

**Dashboard card** là các thành phần trực quan hiển thị dữ liệu entity NGSI-LD ở nhiều định dạng khác nhau:

- **📊 Chart**: Biểu đồ đường, cột, tròn cho xu hướng
- **🗺️ Map**: Trực quan hóa địa lý của dữ liệu GeoProperty
- **📈 Metric**: Hiển thị giá trị đơn với ngưỡng
- **📋 Table**: Dữ liệu dạng bảng với sắp xếp và lọc
- **🎛️ Gauge**: Thanh tiến trình, đồng hồ tốc độ cho dải giá trị
- **📝 List**: Danh sách entity với định dạng tùy chỉnh

## Truy Cập Dashboard

1. Đăng nhập vào dashboard SematX:

   ```
   https://your-sematx-server.com/admin
   ```

2. Vào **Cards** trong thanh bên trái

3. Nhấn nút **Create New**

## Tạo Metric Card

Hãy tạo một metric card đơn giản để hiển thị nhiệt độ hiện tại.

### Bước 1: Thông Tin Cơ Bản

Điền thông tin card:

**Name**: `Room 101 Temperature`  
**Description** (tùy chọn): `Current temperature reading from Room 101 sensor`  
**Type**: Chọn **Metric**

### Bước 2: Nguồn Dữ Liệu

Cấu hình entity nào để hiển thị:

**Entity Type**: `TemperatureSensor`  
**Entity ID**: `urn:ngsi-ld:TemperatureSensor:room-101`  
**Attribute**: `temperature`

### Bước 3: Cấu Hình Hiển Thị

Cấu hình cách metric được hiển thị:

```json
{
  "label": "Current Temperature",
  "unit": "°C",
  "decimals": 1,
  "color": "#FF6B6B",
  "icon": "thermometer",
  "threshold": {
    "normal": { "min": 18, "max": 26, "color": "#51CF66" },
    "warning": { "min": 26, "max": 30, "color": "#FFA500" },
    "critical": { "min": 30, "max": 50, "color": "#FF0000" }
  }
}
```

### Bước 4: Layout

**Width**: Full (12 cột)  
**Height**: Medium (200px)  
**Order**: 1

### Bước 5: Lưu

Nhấn **Create** để lưu card.

## Xem Dashboard

1. Nhấn **Dashboard** trong navigation trên cùng
2. Bạn sẽ thấy card nhiệt độ hiển thị giá trị hiện tại
3. Màu sắc sẽ thay đổi dựa trên cấu hình ngưỡng

Ví dụ hiển thị:

```
┌──────────────────────────────────┐
│  Current Temperature             │
│                                  │
│         24.5°C                   │
│     ━━━━━━━━━━━━━━━━━━━         │
│                                  │
│  🌡️ Normal Range                │
└──────────────────────────────────┘
```

## Tạo Chart Card

Bây giờ hãy tạo biểu đồ đường để hiển thị xu hướng nhiệt độ theo thời gian.

### Bước 1: Thông Tin Cơ Bản

**Name**: `Temperature Trend`  
**Type**: Chọn **Chart**  
**Chart Type**: Line Chart

### Bước 2: Nguồn Dữ Liệu

**Entity Type**: `TemperatureSensor`  
**Entity ID**: `urn:ngsi-ld:TemperatureSensor:room-101`  
**Attributes**: `temperature`

### Bước 3: Cấu Hình Chart

```json
{
  "timeRange": "24h",
  "refreshInterval": 60,
  "xAxis": {
    "label": "Time",
    "type": "time"
  },
  "yAxis": {
    "label": "Temperature (°C)",
    "min": 15,
    "max": 35
  },
  "series": [
    {
      "name": "Temperature",
      "attribute": "temperature",
      "color": "#FF6B6B",
      "lineWidth": 2,
      "showPoints": true
    }
  ],
  "legend": {
    "show": true,
    "position": "bottom"
  },
  "tooltip": {
    "enabled": true,
    "format": "{value}°C at {time}"
  }
}
```

### Bước 4: Layout

**Width**: Full (12 cột)  
**Height**: Large (400px)  
**Order**: 2

### Kết Quả

```
┌──────────────────────────────────────────────┐
│  Temperature Trend (Last 24 Hours)          │
│                                              │
│  35°C ┤                                      │
│       │              ╱╲                      │
│  30°C ┤            ╱    ╲   ╱╲              │
│       │          ╱        ╲╱  ╲             │
│  25°C ┤      ╱╲╱                ╲           │
│       │    ╱                      ╲         │
│  20°C ┤  ╱                          ╲       │
│       │╱                              ╲     │
│  15°C ┴────┬────┬────┬────┬────┬────┴──   │
│         00:00  06:00  12:00  18:00  24:00   │
│                                              │
│  ━━ Temperature                             │
└──────────────────────────────────────────────┘
```

## Tạo Map Card

Nếu entity có dữ liệu vị trí, tạo bản đồ để trực quan hóa.

### Bước 1: Thông Tin Cơ Bản

**Name**: `Sensor Locations`  
**Type**: Chọn **Map**

### Bước 2: Nguồn Dữ Liệu

**Entity Type**: `TemperatureSensor`  
**GeoProperty**: `location`  
**Filter** (tùy chọn): `status=="active"`

### Bước 3: Cấu Hình Map

```json
{
  "center": {
    "lat": 10.03,
    "lng": 105.78
  },
  "zoom": 15,
  "style": "streets",
  "markers": {
    "icon": "temperature",
    "color": "dynamic",
    "colorAttribute": "temperature",
    "colorScale": [
      { "value": 20, "color": "#0000FF" },
      { "value": 25, "color": "#00FF00" },
      { "value": 30, "color": "#FF0000" }
    ],
    "popup": {
      "template": "<b>{name}</b><br/>Temperature: {temperature}°C<br/>Battery: {batteryLevel}%"
    }
  },
  "clustering": {
    "enabled": true,
    "maxZoom": 16
  }
}
```

### Kết Quả

```
┌──────────────────────────────────────────────┐
│  🗺️  Sensor Locations                       │
│  ┌─────────────────────────────────────┐    │
│  │        🟢 (5 sensors)                │    │
│  │                                      │    │
│  │              🔴                      │    │
│  │         🟡                           │    │
│  │                   🟢                 │    │
│  │                                      │    │
│  │    🟡                                │    │
│  └─────────────────────────────────────┘    │
│  🔴 > 30°C  🟡 25-30°C  🟢 < 25°C           │
└──────────────────────────────────────────────┘
```

## Tạo Table Card

Hiển thị nhiều sensor trong bảng có thể sắp xếp.

### Bước 1: Thông Tin Cơ Bản

**Name**: `All Sensors Status`  
**Type**: Chọn **Table**

### Bước 2: Nguồn Dữ Liệu

**Entity Type**: `TemperatureSensor`  
**Limit**: 100  
**Sort By**: `name`

### Bước 3: Cấu Hình Table

```json
{
  "columns": [
    {
      "field": "name",
      "header": "Sensor Name",
      "width": "40%",
      "sortable": true
    },
    {
      "field": "temperature",
      "header": "Temperature",
      "width": "20%",
      "sortable": true,
      "format": "{value}°C",
      "align": "right"
    },
    {
      "field": "batteryLevel",
      "header": "Battery",
      "width": "20%",
      "sortable": true,
      "format": "{value}%",
      "align": "right",
      "colorize": {
        "< 20": "#FF0000",
        "< 50": "#FFA500",
        ">= 50": "#51CF66"
      }
    },
    {
      "field": "status",
      "header": "Status",
      "width": "20%",
      "badge": {
        "active": { "text": "Active", "color": "green" },
        "inactive": { "text": "Inactive", "color": "red" },
        "maintenance": { "text": "Maintenance", "color": "orange" }
      }
    }
  ],
  "pagination": {
    "enabled": true,
    "pageSize": 20
  },
  "search": {
    "enabled": true,
    "placeholder": "Search sensors..."
  },
  "actions": [
    {
      "label": "View Details",
      "icon": "eye",
      "link": "/entities/{id}"
    }
  ]
}
```

### Kết Quả

```
┌───────────────────────────────────────────────────────┐
│  All Sensors Status                 🔍 Search...       │
├─────────────────┬────────────┬─────────┬─────────────┤
│ Sensor Name     │ Temperature│ Battery │ Status      │
├─────────────────┼────────────┼─────────┼─────────────┤
│ Room 101        │    24.5°C  │   85%   │ 🟢 Active   │
│ Room 102        │    23.8°C  │   42%   │ 🟢 Active   │
│ Room 103        │    25.2°C  │   15%   │ 🟠 Active   │
│ Lobby           │    22.1°C  │   78%   │ 🟢 Active   │
│ Parking         │    28.5°C  │    5%   │ 🔴 Active   │
└─────────────────┴────────────┴─────────┴─────────────┘
│ Showing 1-5 of 12                        < 1 2 3 >   │
└───────────────────────────────────────────────────────┘
```

## Tạo Multi-Series Chart

So sánh nhiều sensor trên một biểu đồ.

### Cấu Hình

```json
{
  "title": "Temperature Comparison",
  "timeRange": "24h",
  "yAxis": {
    "label": "Temperature (°C)",
    "min": 15,
    "max": 35
  },
  "series": [
    {
      "name": "Room 101",
      "entityId": "urn:ngsi-ld:TemperatureSensor:room-101",
      "attribute": "temperature",
      "color": "#FF6B6B"
    },
    {
      "name": "Room 102",
      "entityId": "urn:ngsi-ld:TemperatureSensor:room-102",
      "attribute": "temperature",
      "color": "#4ECDC4"
    },
    {
      "name": "Room 103",
      "entityId": "urn:ngsi-ld:TemperatureSensor:room-103",
      "attribute": "temperature",
      "color": "#95E1D3"
    }
  ],
  "legend": {
    "show": true,
    "position": "bottom"
  }
}
```

## Cập Nhật Thời Gian Thực

### Bật Auto-Refresh

Cấu hình card để cập nhật tự động:

```json
{
  "autoRefresh": {
    "enabled": true,
    "interval": 30,
    "showIndicator": true
  }
}
```

**Khoảng thời gian**:

- **10 giây**: Dữ liệu quan trọng thời gian thực
- **30 giây**: Giám sát tích cực
- **60 giây**: Cập nhật bình thường
- **5 phút**: Dữ liệu thay đổi chậm

### WebSocket Subscription

Cho cập nhật tức thời, bật WebSocket subscription:

```json
{
  "realtime": {
    "enabled": true,
    "transport": "websocket",
    "fallbackInterval": 60
  }
}
```

## Layout Card

### Hệ Thống Grid

Dashboard dùng grid 12 cột:

```
┌──────────────────────────────────────────┐
│ Card A (12 cols)                         │  Toàn bộ chiều rộng
├──────────────────────┬───────────────────┤
│ Card B (6 cols)      │ Card C (6 cols)   │  Mỗi card một nửa
├──────────────────────┴───────────────────┤
│ Card D (4 cols) │ E (4 cols) │ F (4)     │  Mỗi card một phần ba
└──────────────────────────────────────────┘
```

### Layout Responsive

Card thích ứng với kích thước màn hình:

- **Desktop**: Layout grid đầy đủ
- **Tablet**: 6-12 cột
- **Mobile**: Xếp chồng (tất cả 12 cột)

## Tổ Chức Dashboard

### Tạo Nhiều Dashboard

Tổ chức card thành các dashboard khác nhau:

- **Overview**: Metric và KPI cấp cao
- **Monitoring**: Biểu đồ và bảng chi tiết
- **Locations**: View dựa trên bản đồ
- **Alerts**: Card trạng thái và thông báo

### Chia Sẻ Dashboard

Chia sẻ dashboard với thành viên nhóm:

1. Nhấn nút **Share** trên dashboard
2. Đặt quyền: View only hoặc Edit
3. Tạo link chia sẻ
4. Đặt ngày hết hạn (tùy chọn)

## Thực Hành Tốt Nhất

### Hiệu Suất

✅ **Nên**:

- Giới hạn entity mỗi card (< 100 cho table)
- Dùng khoảng refresh hợp lý (≥ 30s)
- Bật pagination cho dataset lớn
- Cache dữ liệu truy cập thường xuyên

❌ **Không nên**:

- Load hàng nghìn entity trong một card
- Refresh mỗi giây (gây tải cao)
- Tạo quá nhiều real-time subscription
- Dùng truy vấn phức tạp trong card tần suất cao

### Trải Nghiệm Người Dùng

✅ **Nên**:

- Dùng bảng màu nhất quán
- Cung cấp nhãn và đơn vị rõ ràng
- Hiển thị trạng thái loading
- Xử lý lỗi graceful
- Dùng loại biểu đồ phù hợp cho dữ liệu

❌ **Không nên**:

- Dùng quá nhiều màu (< 5 mỗi biểu đồ)
- Dashboard quá đông (< 10 card)
- Dùng trực quan hóa gây hiểu lầm
- Bỏ qua responsive cho mobile

### Trực Quan Hóa Dữ Liệu

**Chọn loại card phù hợp**:

| Loại Dữ Liệu            | Loại Card Tốt Nhất |
| ----------------------- | ------------------ |
| Giá trị đơn             | Metric             |
| Xu hướng theo thời gian | Line chart         |
| So sánh                 | Bar chart          |
| Tỷ lệ                   | Pie chart          |
| Địa lý                  | Map                |
| Nhiều entity            | Table              |
| Dải giá trị             | Gauge              |

## Xử Lý Sự Cố

### Card Shows "No Data"

**Vấn đề**: Card hiển thị "No data available"

**Giải pháp**:

1. **Kiểm tra entity tồn tại**: Xác minh entity ID đúng
2. **Kiểm tra quyền**: Đảm bảo API key có quyền đọc
3. **Kiểm tra service**: Xác minh NGSILD-Tenant đúng
4. **Kiểm tra attribute**: Đảm bảo tên thuộc tính khớp entity

### Card Not Updating

**Vấn đề**: Card hiển thị dữ liệu cũ

**Giải pháp**:

1. **Kiểm tra refresh interval**: Có thể quá dài
2. **Kiểm tra entity update**: Xác minh dữ liệu đang được đẩy
3. **Xóa cache**: Refresh trình duyệt hoặc xóa cache
4. **Kiểm tra WebSocket**: Kết nối có thể bị ngắt

### Performance Issues

**Vấn đề**: Dashboard load chậm

**Giải pháp**:

1. **Giảm số entity**: Giới hạn truy vấn với pagination
2. **Tăng refresh interval**: Giảm tần suất cập nhật
3. **Tối ưu truy vấn**: Dùng filter để giảm dữ liệu
4. **Chia dashboard**: Tạo nhiều dashboard tập trung

## Những Gì Bạn Đã Học

✅ Cách tạo các loại dashboard card khác nhau  
✅ Cách cấu hình nguồn dữ liệu card  
✅ Cách tùy chỉnh giao diện card  
✅ Mẫu cập nhật thời gian thực  
✅ Chiến lược tổ chức dashboard  
✅ Kỹ thuật tối ưu hiệu suất  
✅ Thực hành tốt nhất cho trực quan hóa dữ liệu

## Bước Tiếp Theo

Bây giờ hãy thiết lập subscription để nhận thông báo thời gian thực:

[**Bước 6: Thiết Lập Subscription →**](6-subscriptions.vi.md)

---

**Cần quay lại?** Về [Bước 4: Đẩy Dữ Liệu](4-push-data.vi.md)
