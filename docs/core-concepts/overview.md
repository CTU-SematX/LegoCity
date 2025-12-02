# Core Concepts

This section provides deep technical insights into how SematX works internally. Understanding these concepts will help you make better architectural decisions and troubleshoot issues effectively.

## What You'll Learn

This section covers the technical internals of SematX's core components:

### [Orion Nginx Gateway](orion-nginx.md)

Deep dive into the API gateway layer:

- JWT authentication and token validation
- Request routing and proxying
- Rate limiting implementation
- CORS and security headers
- SSL/TLS configuration
- Performance optimization
- Monitoring and logging

### [Lego Dashboard Internals](lego-dashboard.md)

Understanding the dashboard architecture:

- PayloadCMS collection structure
- NGSI-LD entity management
- Access control system
- Card rendering engine
- Real-time subscriptions
- API key generation
- Data source configuration

## When to Read This

**Read Core Concepts if you:**

- Need to customize or extend SematX
- Want to deploy to production
- Need to troubleshoot issues
- Want to contribute to development
- Need to integrate with existing systems
- Want to understand security model

**Skip Core Concepts if you:**

- Just want to use SematX quickly
- Don't need technical details
- Only building simple applications

## Architecture Recap

Before diving into specifics, let's review the high-level architecture:

```
┌─────────────────────────────────────────────────────┐
│                   Client Layer                       │
│  (Web Apps, Mobile Apps, IoT Devices, APIs)         │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ HTTPS + JWT
                       │
┌──────────────────────▼──────────────────────────────┐
│              Orion Nginx Gateway                     │
│  ┌────────────────────────────────────────────┐    │
│  │  • JWT Validation                          │    │
│  │  • Rate Limiting                           │    │
│  │  • Request Routing                         │    │
│  │  • SSL Termination                         │    │
│  └────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
┌─────────▼──────────┐    ┌────────▼─────────────┐
│  Lego Dashboard    │    │   Orion-LD Context   │
│  (PayloadCMS)      │    │   Broker (FIWARE)    │
│                    │    │                      │
│  • Web UI          │    │  • Entity Storage    │
│  • API Management  │    │  • NGSI-LD API       │
│  • User Auth       │    │  • Subscriptions     │
│  • Dashboard Cards │    │  • Queries           │
└─────────┬──────────┘    └────────┬─────────────┘
          │                        │
          │                        │
          └────────────┬───────────┘
                       │
          ┌────────────▼────────────┐
          │    MongoDB Database      │
          │                          │
          │  • Dashboard Config      │
          │  • User Data             │
          │  • Entity Data           │
          │  • Subscriptions         │
          └──────────────────────────┘
```

## Key Technical Decisions

### Why Nginx as API Gateway?

**Advantages**:

- High performance (C implementation)
- Battle-tested in production
- Low memory footprint
- Flexible configuration
- Extensive module ecosystem
- Active community

**Alternatives considered**:

- Kong (too heavy for our use case)
- Traefik (less mature Lua support)
- Custom Node.js proxy (performance concerns)

### Why PayloadCMS for Dashboard?

**Advantages**:

- TypeScript-based (type safety)
- Flexible collection system
- Built-in admin UI
- Extensible with hooks and plugins
- Modern React stack
- Active development

**Alternatives considered**:

- Strapi (JavaScript-only, less type-safe)
- Directus (different architecture)
- Custom dashboard (development time)

### Why MongoDB?

**Advantages**:

- Flexible schema (JSON-like documents)
- NGSI-LD compatibility (Orion-LD requirement)
- Geospatial query support
- Good performance at scale
- Horizontal scaling support

**Alternatives considered**:

- PostgreSQL + PostGIS (Orion-LD doesn't support it yet)
- TimescaleDB (NGSI-LD compatibility issues)

## Design Principles

### 1. Standards Compliance

SematX strictly follows **NGSI-LD v1.6.1** specification:

- All entity operations are NGSI-LD compliant
- Standard context handling
- Proper URN format for entity IDs
- GeoJSON for geographic data

### 2. Security First

Multiple layers of security:

- **Transport**: HTTPS/TLS encryption
- **Authentication**: JWT tokens for all API calls
- **Authorization**: Role-based access control
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Prevent injection attacks

### 3. Performance Optimization

Designed for high throughput:

- **Nginx**: Event-driven architecture
- **Connection Pooling**: Reuse database connections
- **Caching**: Redis for frequently accessed data (optional)
- **Indexing**: MongoDB indexes on common queries
- **Compression**: Gzip for API responses

### 4. Developer Experience

Easy to use and extend:

- **Clear APIs**: RESTful, well-documented
- **Code Examples**: Multiple languages
- **Type Safety**: TypeScript throughout
- **Error Messages**: Descriptive and actionable
- **Extensibility**: Plugin architecture

## Data Flow Deep Dive

### Write Operation (Create/Update Entity)

```
1. Client sends PATCH request
   └─> POST /ngsi-ld/v1/entities/{id}/attrs
   └─> Authorization: Bearer <jwt>
   └─> Body: {"temperature": {"type": "Property", "value": 25.5}}

2. Nginx receives request
   └─> Validate JWT signature
   └─> Check rate limits
   └─> Extract tenant from JWT or header
   └─> Route to Orion-LD

3. Orion-LD processes request
   └─> Validate NGSI-LD format
   └─> Check entity exists
   └─> Update MongoDB document
   └─> Trigger active subscriptions

4. Subscriptions fire
   └─> Find matching subscriptions
   └─> Build notification payload
   └─> HTTP POST to webhook URLs
   └─> Lego Dashboard receives notification

5. Dashboard updates
   └─> WebSocket to connected clients
   └─> Real-time card updates
   └─> Cache invalidation

6. Response to client
   └─> 204 No Content (success)
   └─> Error code if failed
```

### Read Operation (Query Entities)

```
1. Client sends GET request
   └─> GET /ngsi-ld/v1/entities?type=Sensor
   └─> Authorization: Bearer <jwt>

2. Nginx receives request
   └─> Validate JWT
   └─> Check rate limits
   └─> Route to Orion-LD

3. Orion-LD queries MongoDB
   └─> Parse query parameters
   └─> Build MongoDB query
   └─> Apply tenant filter
   └─> Execute query with indexes

4. MongoDB returns results
   └─> Cursor-based pagination
   └─> Convert to NGSI-LD format

5. Response to client
   └─> JSON array of entities
   └─> Pagination headers (Link header)
   └─> 200 OK status
```

## Performance Characteristics

### Latency Benchmarks

Based on typical deployments:

| Operation                 | Avg Latency | P95 Latency | P99 Latency |
| ------------------------- | ----------- | ----------- | ----------- |
| Create Entity             | 15ms        | 30ms        | 50ms        |
| Update Attributes         | 10ms        | 20ms        | 35ms        |
| Get Entity by ID          | 5ms         | 10ms        | 20ms        |
| Query 100 Entities        | 25ms        | 50ms        | 100ms       |
| Subscription Notification | 50ms        | 100ms       | 200ms       |

**Factors affecting latency**:

- Network round-trip time
- MongoDB performance
- Number of active subscriptions
- Entity complexity
- Query filters

### Throughput

Typical single-server deployment:

- **Writes**: 500-1000 req/sec
- **Reads**: 2000-5000 req/sec
- **Subscriptions**: 100-200 notifications/sec

**Scaling options**:

- Vertical: More CPU/RAM
- Horizontal: Multiple Nginx + Orion-LD instances
- Database: MongoDB replica set or sharding

## Error Handling

### HTTP Status Codes

SematX uses standard HTTP status codes:

| Code | Meaning               | Example                         |
| ---- | --------------------- | ------------------------------- |
| 200  | OK                    | Successful GET request          |
| 201  | Created               | Entity created                  |
| 204  | No Content            | Successful update/delete        |
| 400  | Bad Request           | Invalid JSON or NGSI-LD format  |
| 401  | Unauthorized          | Missing or invalid JWT          |
| 403  | Forbidden             | JWT valid but lacks permissions |
| 404  | Not Found             | Entity doesn't exist            |
| 409  | Conflict              | Entity ID already exists        |
| 422  | Unprocessable Entity  | Valid JSON but semantic errors  |
| 429  | Too Many Requests     | Rate limit exceeded             |
| 500  | Internal Server Error | Server-side error               |
| 503  | Service Unavailable   | MongoDB or service down         |

### Error Response Format

```json
{
  "type": "https://uri.etsi.org/ngsi-ld/errors/BadRequestData",
  "title": "Invalid entity attribute",
  "detail": "Attribute 'temperature' is missing required 'type' field",
  "status": 400
}
```

## Monitoring and Observability

### Key Metrics to Monitor

**Infrastructure**:

- CPU usage (< 70% normal)
- Memory usage (< 80% normal)
- Disk I/O (< 70% capacity)
- Network bandwidth

**Application**:

- Request rate (req/sec)
- Response time (avg, p95, p99)
- Error rate (< 1% normal)
- Queue depth (subscriptions)

**Database**:

- Query execution time
- Connection pool usage
- Index hit rate
- Disk usage growth

### Logging

SematX components log to:

- **Nginx**: Access logs + error logs
- **Orion-LD**: Application logs
- **Dashboard**: Application logs + audit logs
- **MongoDB**: Database logs

**Log levels**:

- DEBUG: Detailed debugging information
- INFO: Normal operations
- WARN: Warning conditions
- ERROR: Error conditions
- FATAL: Fatal errors causing shutdown

## Next Steps

Ready to dive deeper? Choose a component:

- [**Orion Nginx Gateway →**](orion-nginx.md) - Learn about API gateway internals
- [**Lego Dashboard →**](lego-dashboard.md) - Understand dashboard architecture

Or return to:

- [Getting Started](../getting-started/index.md) - Basic tutorials
- [Deployment](../deployment/index.md) - Production deployment guides
