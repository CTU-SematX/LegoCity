# Tổng quan Kiến trúc

Hiểu kiến trúc của LegoCity giúp bạn đưa ra quyết định sáng suốt về customization và deployment.

## Kiến trúc Hệ thống
```mermaid
flowchart LR

  %% ----- LAYER 1: DATA SOURCES -----
  subgraph L1["LAYER 1: DATA SOURCES\n(Nguồn dữ liệu)"]
    A["Server nguồn A\n(IoT/Sensor/Legacy Sys)"]
    B["Server nguồn B\n(Camera AI/External API)"]
    C["Server nguồn N..."]
  end

  %% ----- LAYER 2: SMART CITY CONTEXT BROKER NODE -----
  subgraph L2["LAYER 2: SMART CITY CONTEXT BROKER NODE\n(Cụm Broker)"]
    SG["Security Gateway\n(Nginx Reverse Proxy + Authentication)"]
    CB["Orion-LD\n(Context Broker)"]
    MDB["MongoDB for\nOrion-LD State"]
    OTH["Other Broker Nodes..."]
  end

  %% ----- LAYER 3: DASHBOARD & MANAGEMENT -----
  subgraph L3["LAYER 3: DASHBOARD & MANAGEMENT\n(PayloadCMS + NextJS)"]
    AS["Application Server\n(NextJS + PayloadCMS Core)"]
    NX["NextJS"]
    PL["PayloadCMS"]
    DBD["Dashboard Database\n(Mongo/Postgres/SQLite)"]
  end

  %% ----- FLOWS: DATA SOURCES → BROKER -----
  A -->|"HTTP POST\n(NGSI-LD Payload)\nPush Data + Auth Header"| SG
  B -->|"HTTP POST\n(NGSI-LD Payload)\nPush Data + Auth Header"| SG
  C -->|"HTTP POST\n(NGSI-LD Payload)\nPush Data + Auth Header"| SG

  %% ----- BROKER INTERNALS -----
  SG --> CB
  CB --> MDB
  CB --> OTH

  %% ----- BROKER ↔ DASHBOARD -----
  AS -->|"HTTP GET/SUB\n(NGSI-LD Query)\nFetch Data + Auth Header"| SG

  %% ----- APP SERVER INTERNALS -----
  AS --> NX
  AS --> PL
  PL -->|"CRUD Data"| DBD

  %% ----- MANY-TO-MANY RELATION NOTE -----
  NOTE[/"Mối quan hệ N-N:\n- 1 Dashboard kết nối N Broker\n- 1 Broker phục vụ N Dashboard"/]
  CB --- NOTE
  DBD --- NOTE

```

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

### Reading City Data

```mermaid
sequenceDiagram
    participant User
    participant Next.js
    participant PayloadCMS
    participant NGSI-LD

    User->>Next.js: Load dashboard page
    Next.js->>PayloadCMS: Fetch page config
    PayloadCMS-->>Next.js: Return blocks & layers
    Next.js->>NGSI-LD: Query entities
    NGSI-LD-->>Next.js: Return sensor data
    Next.js-->>User: Render dashboard
```

### Updating Content

```mermaid
sequenceDiagram
    participant Admin
    participant PayloadCMS
    participant MongoDB
    participant Next.js

    Admin->>PayloadCMS: Edit page/block
    PayloadCMS->>MongoDB: Save changes
    PayloadCMS->>Next.js: Trigger revalidation
    Next.js-->>Admin: Updated page live
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
graph LR
    A[User] -->|Login| B[PayloadCMS Auth]
    B -->|JWT| C[Next.js Middleware]
    C -->|Verify| D[Protected Routes]
    C -->|Check Role| E[Admin Panel]
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
