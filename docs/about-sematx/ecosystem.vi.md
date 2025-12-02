# Hiểu về Hệ sinh thái SematX

Trang này cung cấp giải thích chi tiết về cách các thành phần khác nhau của SematX hoạt động cùng nhau để tạo ra một nền tảng thành phố thông minh hoàn chỉnh.

## Tổng quan Kiến trúc

Nền tảng SematX tuân theo kiến trúc phân lớp giúp tách biệt các mối quan tâm và cung cấp tính linh hoạt:

```
┌─────────────────────────────────────────────────────┐
│            Người dùng & Thiết bị                     │
│          (Web, Mobile, Thiết bị IoT)                 │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ HTTPS/JWT
                      │
┌─────────────────────▼───────────────────────────────┐
│              Orion Nginx Gateway                     │
│         (Xác thực & API Gateway)                     │
└─────────────────────┬───────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
┌─────────▼──────────┐  ┌────────▼─────────┐
│  Lego Dashboard    │  │   Orion-LD       │
│  (PayloadCMS)      │  │ Context Broker   │
│  - UI/Dashboard    │  │  - Lưu trữ Entity│
│  - Quản lý User    │  │  - NGSI-LD API   │
│  - API Keys        │  │  - Subscriptions │
└─────────┬──────────┘  └────────┬─────────┘
          │                      │
          │        ┌─────────────┘
          │        │
┌─────────▼────────▼─────────┐
│    Cơ sở dữ liệu MongoDB    │
│  - Dữ liệu Dashboard        │
│  - Dữ liệu Entity (Orion)   │
└─────────────────────────────┘
```

## Phân tích Chi tiết Thành phần

### Orion-LD Context Broker

**Mục đích**: Kho dữ liệu trung tâm và máy chủ NGSI-LD API.

**Trách nhiệm chính**:

- Lưu trữ và quản lý dữ liệu entity theo tiêu chuẩn NGSI-LD
- Cung cấp query API để truy xuất thông tin entity
- Xử lý subscriptions entity cho thông báo thời gian thực
- Duy trì mối quan hệ và thuộc tính của entity
- Hỗ trợ truy vấn temporal cho dữ liệu lịch sử

**Ngăn xếp Công nghệ**:

- Được viết bằng C++ để có hiệu suất cao
- Sử dụng MongoDB để lưu trữ dữ liệu
- Triển khai đặc tả NGSI-LD v1.6.1
- Hỗ trợ GeoJSON cho truy vấn không gian địa lý

**API Endpoints**:

- `POST /ngsi-ld/v1/entities` - Tạo entities
- `GET /ngsi-ld/v1/entities` - Truy vấn entities
- `PATCH /ngsi-ld/v1/entities/{entityId}/attrs` - Cập nhật thuộc tính entity
- `DELETE /ngsi-ld/v1/entities/{entityId}` - Xóa entities
- `POST /ngsi-ld/v1/subscriptions` - Tạo subscriptions

**Ví dụ Entity**:

```json
{
  "id": "urn:ngsi-ld:AirQualityObserved:001",
  "type": "AirQualityObserved",
  "dateObserved": {
    "type": "Property",
    "value": {
      "@type": "DateTime",
      "@value": "2025-12-02T10:30:00Z"
    }
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [105.78, 10.03]
    }
  },
  "PM25": {
    "type": "Property",
    "value": 35,
    "unitCode": "GQ"
  },
  "temperature": {
    "type": "Property",
    "value": 28.5,
    "unitCode": "CEL"
  }
}
```

### Orion Nginx Gateway

**Mục đích**: Lớp API gateway và xác thực an toàn, hiệu suất cao.

**Trách nhiệm chính**:

- Xác thực các yêu cầu sử dụng JWT tokens
- Định tuyến API calls đến các dịch vụ backend phù hợp
- Thực thi giới hạn tốc độ để ngăn chặn lạm dụng
- Xử lý CORS cho ứng dụng web
- Cung cấp SSL/TLS termination
- Ghi log và giám sát việc sử dụng API

**Ngăn xếp Công nghệ**:

- Nginx để xử lý yêu cầu hiệu suất cao
- Lua scripts cho logic xác thực tùy chỉnh
- Xác thực JWT sử dụng public keys
- Redis cho rate limiting và caching

**Tính năng Bảo mật**:

1. **Xác thực JWT**: Mọi yêu cầu API phải bao gồm JWT token hợp lệ trong header `Authorization`:

   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Xác thực API Key**: Tokens được phát hành bởi Lego Dashboard và chứa:

   - User ID
   - Permissions/scopes
   - Thời gian hết hạn
   - Mức giới hạn tốc độ

3. **Giới hạn Tốc độ**: Ngăn chặn lạm dụng API với các giới hạn có thể cấu hình:

   - Mặc định: 100 requests mỗi phút cho mỗi API key
   - Các tiers tùy chỉnh có sẵn cho các trường hợp sử dụng khác nhau

4. **Cấu hình CORS**: Cho phép các ứng dụng web truy cập API:
   ```nginx
   add_header 'Access-Control-Allow-Origin' '*';
   add_header 'Access-Control-Allow-Methods' 'GET, POST, PATCH, DELETE, OPTIONS';
   add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, NGSILD-Tenant';
   ```

**Logic Định tuyến**:

```nginx
# Dashboard API routes
location /api/ {
    proxy_pass http://dashboard:3000;
}

# NGSI-LD API routes (yêu cầu JWT)
location /ngsi-ld/ {
    access_by_lua_file /etc/nginx/lua/jwt_verify.lua;
    proxy_pass http://orion:1026;
}

# Health check endpoint (không cần auth)
location /health {
    return 200 "OK";
}
```

### Lego Dashboard

**Mục đích**: Giao diện web thân thiện với người dùng để quản lý và trực quan hóa dữ liệu IoT.

**Trách nhiệm chính**:

- Cung cấp trình tạo dashboard trực quan với widgets kéo-thả
- Quản lý người dùng, teams và kiểm soát truy cập
- Tạo và quản lý API keys
- Tạo và quản lý mẫu entity
- Cấu hình subscriptions dữ liệu và webhooks
- Hiển thị trực quan hóa dữ liệu thời gian thực

**Ngăn xếp Công nghệ**:

- Được xây dựng trên PayloadCMS (Node.js/React)
- MongoDB để lưu trữ cấu hình dashboard
- Next.js cho server-side rendering
- React cho các thành phần UI tương tác
- TypeScript cho type safety

**Tính năng Cốt lõi**:

1. **Trình tạo Dashboard**:

   - Tạo card kéo-thả
   - Nhiều loại card: bản đồ, biểu đồ, bảng, metrics
   - Cập nhật dữ liệu thời gian thực qua subscriptions
   - Layouts responsive cho mobile và desktop

2. **Quản lý Entity**:

   - Duyệt và tìm kiếm entities
   - Tạo entities với form builder
   - Cập nhật thuộc tính entity theo thời gian thực
   - Xóa và các thao tác hàng loạt
   - Import/export entities dưới dạng JSON

3. **Quản lý API Key**:

   - Tạo JWT tokens cho truy cập API
   - Đặt permissions và rate limits cho mỗi key
   - Thu hồi keys ngay lập tức
   - Giám sát việc sử dụng API cho mỗi key

4. **Kiểm soát Truy cập**:

   - Role-based access control (RBAC)
   - Quản lý organization và team
   - Permissions chi tiết cho mỗi loại entity
   - Audit logs cho tuân thủ bảo mật

5. **Subscriptions**:
   - Tạo NGSI-LD subscriptions
   - Cấu hình webhook endpoints
   - Lọc entities theo type và properties
   - Giám sát trạng thái subscription

## Ví dụ Data Flow

### Ví dụ 1: Thiết bị IoT Gửi Dữ liệu

1. **Thiết bị** tạo sensor reading (nhiệt độ: 28.5°C)
2. **Thiết bị** gửi HTTP POST đến `/ngsi-ld/v1/entities/{id}/attrs` với JWT token
3. **Nginx Gateway** xác thực JWT và kiểm tra rate limits
4. **Nginx Gateway** chuyển tiếp request đến **Orion-LD**
5. **Orion-LD** cập nhật entity trong MongoDB
6. **Orion-LD** kích hoạt active subscriptions
7. **Orion-LD** gửi notifications đến **Lego Dashboard** webhooks
8. **Lego Dashboard** cập nhật biểu đồ thời gian thực trên dashboards người dùng

### Ví dụ 2: Người dùng Tạo Dashboard Card

1. **Người dùng** đăng nhập vào **Lego Dashboard** web UI
2. **Người dùng** điều hướng đến dashboard builder
3. **Người dùng** kéo card "Temperature Chart" vào canvas
4. **Người dùng** cấu hình card để hiển thị entity `urn:ngsi-ld:Sensor:001`
5. **Dashboard** lưu cấu hình card vào MongoDB
6. **Dashboard** tạo NGSI-LD subscription trong **Orion-LD**
7. **Orion-LD** thông báo cho **Dashboard** khi entity cập nhật
8. **Dashboard** đẩy cập nhật đến trình duyệt người dùng qua WebSocket

### Ví dụ 3: Ứng dụng Bên thứ ba Truy vấn Dữ liệu

1. **Developer** lấy API key từ **Lego Dashboard**
2. **App** thực hiện GET request đến `/ngsi-ld/v1/entities?type=Sensor`
3. **Nginx Gateway** xác thực JWT token
4. **Nginx Gateway** kiểm tra rate limits (99/100 đã sử dụng)
5. **Nginx Gateway** chuyển tiếp truy vấn đến **Orion-LD**
6. **Orion-LD** truy vấn MongoDB cho các entities khớp
7. **Orion-LD** trả về JSON response
8. **Nginx Gateway** chuyển tiếp response đến **App**
9. **App** hiển thị dữ liệu sensor cho người dùng cuối

## Các Bước Tiếp theo

- [Khởi động Local Server](../getting-started/start-server/index.vi.md)
- [Triển khai Production](../deployment/index.md)
- [Học Core Concepts](../core-concepts/overview.md)
