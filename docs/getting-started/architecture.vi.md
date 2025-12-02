# Tổng quan Kiến trúc

Hiểu kiến trúc của LegoCity giúp bạn đưa ra quyết định sáng suốt về customization và deployment.

## Kiến trúc Hệ thống

![Kiến trúc Hệ thống LegoCity](../assets/diagram_VI.png)

_Kiến trúc 3 lớp: Nguồn Dữ liệu → Smart City Context Broker → Dashboard & Quản lý_

## Thiết kế Ba Lớp

### 1. Context & Data Layer

**Mục đích**: Nguồn sự thật duy nhất cho thông tin thành phố

**Components**:

- **NGSI-LD Context Broker** (Orion-LD)
- **Smart Data Models** - Schemas chuẩn hóa
- **Real-time Updates** - Subscriptions và notifications

**Key Concepts**:

```json
{
  "id": "urn:ngsi-ld:Sensor:001",
  "type": "AirQualitySensor",
  "location": {
    "type": "Point",
    "coordinates": [105.7851, 10.0303]
  },
  "pm25": {
    "type": "Property",
    "value": 35.2,
    "observedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Responsibilities**:

- Store city entities (sensors, zones, services)
- Manage relationships giữa các entities
- Handle temporal queries
- Provide standardized API (NGSI-LD)

### 2. UI & Content Layer

**Mục đích**: Configure và render dashboard interfaces

**Components**:

- **Next.js 15** - React framework với App Router
- **PayloadCMS 3.x** - Headless CMS
- **MongoDB** - Content database
- **Mapbox GL JS** - Interactive maps

**Key Features**:

**a) Block-Based UI**

```typescript
// Pages composed from blocks
interface Page {
  title: string;
  blocks: Array<ArchiveBlock | MediaBlock | CallToActionBlock | ContentBlock>;
}
```

**b) Dynamic Configuration**

- Pages, map views, layers stored trong PayloadCMS
- No hard-coded dashboards
- Runtime configuration changes

**c) Responsive Design**

- Mobile-first approach
- Tailwind CSS styling
- Accessible components

### 3. Integration Layer

**Mục đích**: Connect external services và enhance functionality

**Components**:

- **API Proxies** - Secure external API access
- **Authentication** - JWT-based auth
- **AI Assistants** - Optional content helpers
- **Search** - Full-text search integration

**Security Patterns**:

```typescript
// API keys stored server-side
// Frontend proxies requests
fetch("/api/proxy/geocode", {
  body: JSON.stringify({ address }),
  headers: { "Content-Type": "application/json" },
});
```

## Data Flow

### Đẩy Dữ liệu từ Nguồn IoT

```mermaid
sequenceDiagram
    participant Source as Source Server<br/>(IoT/Sensor/Camera)
    participant Gateway as Security Gateway<br/>(Nginx)
    participant Broker as Orion-LD<br/>(Context Broker)
    participant MongoDB
    participant OtherNodes as Các Broker Node khác

    Source->>Gateway: HTTP POST<br/>(NGSI-LD Payload)<br/>Push Data + Auth Header
    Gateway->>Gateway: Xác thực Auth Header
    Gateway->>Broker: Chuyển tiếp dữ liệu entity
    Broker->>MongoDB: Lưu/Cập nhật entity
    MongoDB-->>Broker: Xác nhận
    Broker->>OtherNodes: Sao chép state (tùy chọn)
    Broker-->>Gateway: 201 Created / 204 Updated
    Gateway-->>Source: Phản hồi thành công
```

### Reading City Data

```mermaid
sequenceDiagram
    participant User as Người dùng
    participant AppServer as Application Server<br/>(NextJS + PayloadCMS)
    participant Gateway as Security Gateway<br/>(Nginx)
    participant Broker as Orion-LD<br/>(Context Broker)
    participant MongoDB

    User->>AppServer: Tải trang dashboard
    AppServer->>AppServer: Lấy config từ PayloadCMS
    AppServer->>Gateway: HTTP GET/SUB<br/>(NGSI-LD Query)<br/>+ Auth Header
    Gateway->>Gateway: Xác thực JWT
    Gateway->>Broker: Chuyển tiếp query
    Broker->>MongoDB: Lấy dữ liệu entity
    MongoDB-->>Broker: Trả về entities
    Broker-->>Gateway: NGSI-LD Response
    Gateway-->>AppServer: Trả về dữ liệu sensor
    AppServer->>AppServer: NextJS render với dữ liệu
    AppServer-->>User: Hiển thị dashboard
```

### Updating Content

```mermaid
sequenceDiagram
    participant Admin as Quản trị viên
    participant AppServer as Application Server<br/>(PayloadCMS)
    participant DashDB as Dashboard Database<br/>(MongoDB/Postgres/SQLite)
    participant NextJS

    Admin->>AppServer: Chỉnh sửa page/block qua Admin UI
    AppServer->>DashDB: CRUD Data<br/>(Lưu thay đổi)
    DashDB-->>AppServer: Xác nhận lưu
    AppServer->>NextJS: Kích hoạt revalidation
    NextJS->>NextJS: Rebuild pages (ISR)
    NextJS-->>Admin: Trang đã cập nhật
```

## Technology Stack

### Frontend

- **Next.js 15** - React framework với App Router và Server Components
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Mapbox GL JS** - WebGL-powered maps

### Backend

- **PayloadCMS 3.x** - Headless CMS với admin UI
- **MongoDB 6.x** - Document database
- **Node.js 18+** - JavaScript runtime

### Infrastructure

- **FIWARE Orion-LD** - NGSI-LD context broker
- **MongoDB** - Context và content storage
- **Reverse Proxy** - Nginx hoặc similar

### Optional Services

- **OpenRouter** - AI model gateway
- **Mapbox** - Map tiles và geocoding
- **Redis** - Caching layer

## Scalability Considerations

### Horizontal Scaling

**Next.js Application**:

- Stateless application servers
- Load balancer distribution
- Edge caching (CDN)

**MongoDB**:

- Replica sets cho high availability
- Sharding cho large datasets

**NGSI-LD Broker**:

- Multiple broker instances
- Federation cho multi-region

### Vertical Scaling

**Memory**:

- Next.js: 2-4 GB per instance
- MongoDB: Based on dataset size
- Broker: Based on entity count

**CPU**:

- Map rendering is CPU-intensive
- Consider GPU acceleration cho complex visualizations

### Caching Strategy

```typescript
// Next.js caching
export const revalidate = 60; // ISR every 60s

// API response caching
cache.set('entities:sensors', data, { ttl: 300 });

// CDN caching
Cache-Control: public, s-maxage=3600
```

## Security Architecture

### Authentication & Authorization

```mermaid
flowchart TB
    subgraph Layer1["LAYER 1: NGUỒN DỮ LIỆU"]
        IoT[Thiết bị IoT/Cảm biến]
    end

    subgraph Layer2["LAYER 2: BROKER NODE"]
        Gateway[Security Gateway<br/>Nginx + Xác thực]
        Broker[Orion-LD Context Broker]
        Gateway --> Broker
    end

    subgraph Layer3["LAYER 3: DASHBOARD"]
        User[Người dùng/Admin]
        Auth[PayloadCMS Auth<br/>Tạo JWT]
        MW[Next.js Middleware<br/>Xác minh JWT]
        Routes[Protected Routes]
        Admin[Trang Admin]

        User --> Auth
        Auth -->|JWT Token| MW
        MW -->|Xác minh & Định tuyến| Routes
        MW -->|Kiểm tra Role| Admin
    end

    IoT -->|POST + Auth Header| Gateway
    Layer3 -->|API Calls + JWT| Gateway
```

### API Security

**Server-Side Proxies**:

```typescript
// /app/api/proxy/route.ts
export async function POST(req: Request) {
  // Validate request
  const { apiKey } = getServerConfig();

  // Forward to external API
  return fetch(externalAPI, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}
```

**Rate Limiting**:

- Per-IP limits
- Per-user quotas
- Token bucket algorithm

### Data Protection

- **Encryption at Rest**: MongoDB encryption
- **Encryption in Transit**: HTTPS/TLS
- **Secrets Management**: Environment variables, not in code
- **Input Validation**: Zod schemas, payload validators

## Deployment Architecture

### Development

```
Developer Machine
├── Next.js (localhost:3000)
├── MongoDB (localhost:27017)
└── Orion-LD (localhost:1026)
```

### Production (Single Server)

```
Virtual Machine
├── Nginx (Reverse Proxy)
├── Next.js (PM2)
├── MongoDB (Service)
└── Orion-LD (Docker)
```

### Production (Distributed)

```
Cloud Infrastructure
├── CDN (Cloudflare)
├── Load Balancer
├── Next.js Cluster (3+ instances)
├── MongoDB Replica Set
└── NGSI-LD Federation
```

## Extension Points

### 1. Custom Blocks

Add new UI components:

```typescript
// src/blocks/CustomBlock/config.ts
export const CustomBlock: Block = {
  slug: "custom-block",
  fields: [
    /* ... */
  ],
  // Block configuration
};
```

### 2. PayloadCMS Plugins

Extend CMS functionality:

```typescript
// src/plugins/customPlugin.ts
export const customPlugin = (): Plugin => ({
  name: "custom-plugin",
  // Plugin logic
});
```

### 3. API Routes

Add custom endpoints:

```typescript
// app/api/custom/route.ts
export async function GET(req: Request) {
  // Custom logic
}
```

### 4. Data Adapters

Connect new data sources:

```typescript
// lib/adapters/CustomAdapter.ts
export class CustomAdapter implements DataAdapter {
  async fetchEntities() {
    // Fetch from external source
  }
}
```

## Best Practices

### Configuration Management

✅ Store config trong PayloadCMS, not code  
✅ Use environment variables cho secrets  
✅ Version control schema definitions

### Performance

✅ Enable Next.js caching (ISR, SWR)  
✅ Optimize images (next/image)  
✅ Lazy load map layers  
✅ Use database indexes

### Security

✅ Never expose API keys tới frontend  
✅ Validate all user inputs  
✅ Implement rate limiting  
✅ Use HTTPS trong production

### Monitoring

✅ Log errors tới external service  
✅ Track performance metrics  
✅ Monitor broker health  
✅ Set up alerts

---

**Next**: [Installation Guide](../installation/local.md) để thiết lập development environment của bạn.
