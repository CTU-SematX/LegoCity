# Công cụ và Công nghệ SematX

Trang này cung cấp tổng quan về các công nghệ và công cụ chính hỗ trợ nền tảng SematX.

## Công nghệ Cốt lõi

### Tiêu chuẩn NGSI-LD

**NGSI-LD là gì?**

NGSI-LD (Next Generation Service Interface - Linked Data) là một mô hình thông tin và đặc tả API được phát triển bởi ETSI (European Telecommunications Standards Institute) để quản lý thông tin ngữ cảnh trong các ứng dụng IoT và thành phố thông minh.

**Tính năng Chính**:

- Biểu diễn entity được chuẩn hóa
- Mô hình dữ liệu dựa trên Property
- Quản lý Relationship giữa các entities
- Hỗ trợ truy vấn không gian địa lý
- Xử lý dữ liệu temporal
- Cơ chế subscription cho thông báo thời gian thực

**Tại sao NGSI-LD?**

- **Khả năng tương tác**: Định dạng dữ liệu chuẩn trên các hệ thống
- **Semantic Web**: Được xây dựng trên JSON-LD cho linked data
- **Bền vững trong tương lai**: Được hỗ trợ bởi FIWARE và các nền tảng IoT chính
- **Linh hoạt**: Hỗ trợ bất kỳ loại entity và property nào

**Ví dụ Entity trong NGSI-LD**:

```json
{
  "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
  "id": "urn:ngsi-ld:Building:001",
  "type": "Building",
  "address": {
    "type": "Property",
    "value": {
      "streetAddress": "123 Đường Chính",
      "addressLocality": "Cần Thơ",
      "addressCountry": "Việt Nam"
    }
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [105.78, 10.03]
    }
  },
  "hasFloor": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Floor:001"
  }
}
```

### FIWARE Orion-LD

**FIWARE là gì?**

FIWARE là một nền tảng mã nguồn mở cung cấp một framework được quản lý của các thành phần và tiêu chuẩn để xây dựng các giải pháp thông minh. Orion-LD là thành phần context broker thế hệ tiếp theo của FIWARE.

**Tính năng Orion-LD**:

- Tuân thủ đầy đủ NGSI-LD v1.6.1
- Triển khai C++ hiệu suất cao
- Backend MongoDB để lưu trữ
- Temporal API cho truy vấn lịch sử
- Hỗ trợ distributed tracing
- Khả năng mở rộng theo chiều ngang

**Đặc điểm Hiệu suất**:

- Xử lý 1000+ requests/giây trên mỗi instance
- Độ trễ dưới 10ms cho truy vấn đơn giản
- Hỗ trợ hàng triệu entities
- Subscriptions thời gian thực với độ trễ thông báo <100ms

**Tùy chọn Cấu hình**:

```bash
# Các tham số khởi động Orion-LD chính
-dbhost mongodb:27017          # Kết nối MongoDB
-logLevel DEBUG                # Mức độ chi tiết logging
-forwarding                    # Bật federation
-experimental                  # Bật tính năng thử nghiệm
-corsOrigin __ALL              # Cấu hình CORS
```

**Khi nào sử dụng Orion-LD**:

- Cần context broker tuân thủ tiêu chuẩn
- Xây dựng hệ thống IoT đa nhà cung cấp
- Yêu cầu truy vấn không gian địa lý
- Cần subscriptions dữ liệu thời gian thực
- Muốn giải pháp mã nguồn mở

### PayloadCMS

**PayloadCMS là gì?**

Payload là một headless CMS và application framework được xây dựng với Node.js, React và TypeScript. Trong SematX, chúng tôi sử dụng Payload làm nền tảng cho Lego Dashboard.

**Tại sao PayloadCMS?**

- **Type-safe**: Hỗ trợ TypeScript đầy đủ
- **Linh hoạt**: Collections và fields có thể tùy chỉnh
- **Hiện đại**: Admin UI dựa trên React
- **API-first**: REST và GraphQL APIs được tự động tạo
- **Có thể mở rộng**: Kiến trúc plugin cho chức năng tùy chỉnh
- **Mã nguồn mở**: Cộng đồng và phát triển tích cực

**Tính năng Chính Được Sử dụng trong SematX**:

- Mô hình hóa dữ liệu dựa trên Collection
- Role-based access control (RBAC)
- Các thành phần React tùy chỉnh cho dashboard cards
- Hooks cho business logic
- Upload files cho assets
- Xác thực và quản lý người dùng

**Ví dụ Collection Definition**:

```typescript
export const Cards: CollectionConfig = {
  slug: "cards",
  admin: {
    useAsTitle: "name",
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "type",
      type: "select",
      options: ["map", "chart", "table", "metric"],
      required: true,
    },
    {
      name: "entityType",
      type: "text",
      required: true,
    },
    {
      name: "configuration",
      type: "json",
    },
  ],
};
```

### MongoDB

**Vai trò trong SematX**:

MongoDB đóng vai trò là lớp lưu trữ cho cả Orion-LD và Lego Dashboard, lưu trữ:

- Dữ liệu entity (Orion-LD)
- Cấu hình dashboard
- Tài khoản người dùng và permissions
- API keys và access tokens
- Định nghĩa subscription

**Tại sao MongoDB?**

- **Schema-less**: Cấu trúc document linh hoạt cho NGSI-LD entities
- **Hiệu suất**: Thao tác đọc/ghi nhanh
- **Khả năng mở rộng**: Replica sets và sharding
- **Không gian địa lý**: Hỗ trợ native cho truy vấn GeoJSON
- **Aggregation**: Pipeline phân tích dữ liệu mạnh mẽ

**Mẫu Triển khai**:

1. **Development**: Single MongoDB instance
2. **Production**: Replica set (3+ nodes) cho high availability
3. **Large Scale**: Sharded cluster cho horizontal scaling

**Chiến lược Backup**:

```bash
# Backup thường xuyên sử dụng mongodump
mongodump --uri="mongodb://localhost:27017/orion" --out=/backup/

# Point-in-time recovery với replica sets
# Sử dụng oplog cho continuous backup
```

### Nginx

**Vai trò trong SematX**:

Nginx đóng vai trò là API gateway và reverse proxy, xử lý:

- SSL/TLS termination
- Request routing
- Xác thực JWT
- Rate limiting
- Load balancing
- Phục vụ static files

**Modules Chính Được Sử dụng**:

- `ngx_http_auth_jwt_module` - Xác thực JWT
- `ngx_http_limit_req_module` - Rate limiting
- `ngx_http_headers_module` - CORS headers
- `ngx_http_upstream_module` - Load balancing

**Ví dụ Cấu hình**:

```nginx
http {
  # Rate limiting zone
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

  upstream dashboard {
    server dashboard:3000;
  }

  upstream orion {
    server orion:1026;
  }

  server {
    listen 443 ssl;
    server_name api.sematx.io;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Dashboard routes
    location /api/ {
      proxy_pass http://dashboard;
    }

    # Orion-LD routes (với JWT)
    location /ngsi-ld/ {
      limit_req zone=api_limit burst=20 nodelay;
      auth_jwt "SematX API";
      auth_jwt_key_file /etc/nginx/jwt_key.json;
      proxy_pass http://orion;
    }
  }
}
```

## Công cụ Phát triển

### Docker và Docker Compose

**Tại sao Docker?**

- Môi trường nhất quán trên dev/staging/prod
- Quản lý dependencies dễ dàng
- Triển khai đơn giản hóa
- Cô lập và bảo mật

**SematX Docker Setup**:

```yaml
version: "3.8"
services:
  mongodb:
    image: mongo:6.0
    volumes:
      - mongo-data:/data/db

  orion:
    image: fiware/orion-ld:1.5.1
    depends_on:
      - mongodb
    command: -dbhost mongodb

  dashboard:
    build: ./dashboard
    depends_on:
      - mongodb
    environment:
      - DATABASE_URI=mongodb://mongodb:27017/payload
      - PAYLOAD_SECRET=${PAYLOAD_SECRET}

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - orion
      - dashboard
```

### TypeScript

**Lợi ích**:

- Type safety ngăn chặn lỗi runtime
- Hỗ trợ IDE và autocomplete tốt hơn
- Code tự tài liệu hóa
- Refactoring dễ dàng hơn
- Các tính năng JavaScript hiện đại

**Được sử dụng trong SematX cho**:

- Dashboard frontend (React components)
- Dashboard backend (PayloadCMS configuration)
- Định nghĩa API types
- Utility functions

### React và Next.js

**React**: Thư viện UI dựa trên component

- Dashboard widgets có thể tái sử dụng
- Cập nhật dữ liệu thời gian thực
- Forms tương tác

**Next.js**: React framework với server-side rendering

- Page loads nhanh
- Tối ưu hóa SEO
- API routes cho backend logic
- Static site generation

### Git và GitHub

**Version Control**:

- Tất cả code SematX được version-controlled với Git
- GitHub cho collaboration và CI/CD
- Chiến lược branching cho features và releases

**Cấu trúc Repository**:

```
LegoCity/
├── dashboard/              # Lego Dashboard (PayloadCMS)
├── orion-ld/              # Cấu hình Orion-LD
├── nginx/                 # Cấu hình Nginx gateway
├── docs/                  # Documentation (MkDocs)
└── docker-compose.yml     # Full stack orchestration
```

## Công cụ Testing

### Postman/Insomnia

**API Testing**:

- Test NGSI-LD endpoints
- Xác thực JWT authentication
- Kiểm tra subscription notifications
- Debug các vấn đề API

**Sample NGSI-LD Request**:

```bash
# Create Entity
POST /ngsi-ld/v1/entities
Authorization: Bearer <jwt_token>
Content-Type: application/ld+json

{
  "id": "urn:ngsi-ld:Sensor:001",
  "type": "Sensor",
  "temperature": {
    "type": "Property",
    "value": 25.5
  }
}
```

### Playwright

**End-to-End Testing**:

- Automated UI testing cho dashboard
- Xác thực user flow
- Cross-browser testing
- Visual regression testing

### Vitest

**Unit Testing**:

- Test React components
- Xác thực business logic
- Mock API responses
- Thực thi test nhanh

## Công cụ Monitoring

### Prometheus

**Thu thập Metrics**:

- Tỷ lệ API request
- Thời gian response
- Tỷ lệ lỗi
- Sử dụng tài nguyên

### Grafana

**Visualization**:

- Dashboards thời gian thực
- Biểu đồ metrics tùy chỉnh
- Alerting rules
- Log aggregation

### MongoDB Compass

**Quản lý Database**:

- Visual query builder
- Phân tích index
- Thông tin chi tiết về hiệu suất
- Import/export dữ liệu

## IDE Được Khuyến nghị

### Visual Studio Code

**Extensions**:

- ESLint - Code linting
- Prettier - Code formatting
- Docker - Container management
- MongoDB - Database viewer
- REST Client - API testing
- GitLens - Git visualization

## Tài nguyên Học tập

### Tài liệu Chính thức

- [Đặc tả NGSI-LD](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.06.01_60/gs_CIM009v010601p.pdf)
- [Tài liệu FIWARE](https://fiware.github.io/tutorials.NGSI-LD/)
- [PayloadCMS Docs](https://payloadcms.com/docs)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)

### Tutorials

- [NGSI-LD Step-by-Step](https://fiware.github.io/tutorials.NGSI-LD/)
- [PayloadCMS Examples](https://github.com/payloadcms/payload/tree/main/examples)
- [Docker Compose Samples](https://github.com/docker/awesome-compose)

### Cộng đồng

- [FIWARE Community](https://www.fiware.org/community/)
- [PayloadCMS Discord](https://discord.com/invite/payload)
- [SematX GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)

## Các Bước Tiếp theo

- [Hiểu về Hệ sinh thái](ecosystem.vi.md)
- [Bắt đầu Xây dựng](../getting-started/start-server/index.vi.md)
- [Khám phá Core Concepts](../core-concepts/overview.md)
