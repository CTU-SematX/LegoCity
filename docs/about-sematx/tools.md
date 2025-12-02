# SematX Tools and Technologies

This page provides an overview of the key technologies and tools that power the SematX platform.

## Core Technologies

### NGSI-LD Standard

**What is NGSI-LD?**

NGSI-LD (Next Generation Service Interface - Linked Data) is an information model and API specification developed by ETSI (European Telecommunications Standards Institute) for managing context information in IoT and smart city applications.

**Key Features**:

- Standardized entity representation
- Property-based data model
- Relationship management between entities
- Geospatial query support
- Temporal data handling
- Subscription mechanism for real-time notifications

**Why NGSI-LD?**

- **Interoperability**: Standard data format across systems
- **Semantic Web**: Built on JSON-LD for linked data
- **Future-proof**: Supported by FIWARE and major IoT platforms
- **Flexible**: Supports any entity type and property

**Example Entity in NGSI-LD**:

```json
{
  "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
  "id": "urn:ngsi-ld:Building:001",
  "type": "Building",
  "address": {
    "type": "Property",
    "value": {
      "streetAddress": "123 Main Street",
      "addressLocality": "Can Tho",
      "addressCountry": "Vietnam"
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

**What is FIWARE?**

FIWARE is an open-source platform providing a curated framework of components and standards for building smart solutions. Orion-LD is the next-generation context broker component of FIWARE.

**Orion-LD Features**:

- Full NGSI-LD v1.6.1 compliance
- High-performance C++ implementation
- MongoDB backend for persistence
- Temporal API for historical queries
- Distributed tracing support
- Horizontal scalability

**Performance Characteristics**:

- Handles 1000+ requests/second per instance
- Sub-10ms latency for simple queries
- Supports millions of entities
- Real-time subscriptions with <100ms notification delay

**Configuration Options**:

```bash
# Key Orion-LD startup parameters
-dbhost mongodb:27017          # MongoDB connection
-logLevel DEBUG                # Logging verbosity
-forwarding                    # Enable federation
-experimental                  # Enable experimental features
-corsOrigin __ALL              # CORS configuration
```

**When to use Orion-LD**:

- Need standards-compliant context broker
- Building multi-vendor IoT systems
- Require geospatial queries
- Need real-time data subscriptions
- Want open-source solution

### PayloadCMS

**What is PayloadCMS?**

Payload is a headless CMS and application framework built with Node.js, React, and TypeScript. In SematX, we use Payload as the foundation for the Lego Dashboard.

**Why PayloadCMS?**

- **Type-safe**: Full TypeScript support
- **Flexible**: Customizable collections and fields
- **Modern**: React-based admin UI
- **API-first**: Auto-generated REST and GraphQL APIs
- **Extensible**: Plugin architecture for custom functionality
- **Open Source**: Active community and development

**Key Features Used in SematX**:

- Collection-based data modeling
- Role-based access control (RBAC)
- Custom React components for dashboard cards
- Hooks for business logic
- File uploads for assets
- Authentication and user management

**Example Collection Definition**:

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

**Role in SematX**:

MongoDB serves as the persistence layer for both Orion-LD and the Lego Dashboard, storing:

- Entity data (Orion-LD)
- Dashboard configurations
- User accounts and permissions
- API keys and access tokens
- Subscription definitions

**Why MongoDB?**

- **Schema-less**: Flexible document structure for NGSI-LD entities
- **Performance**: Fast read/write operations
- **Scalability**: Replica sets and sharding
- **Geospatial**: Native support for GeoJSON queries
- **Aggregation**: Powerful data analysis pipeline

**Deployment Patterns**:

1. **Development**: Single MongoDB instance
2. **Production**: Replica set (3+ nodes) for high availability
3. **Large Scale**: Sharded cluster for horizontal scaling

**Backup Strategy**:

```bash
# Regular backup using mongodump
mongodump --uri="mongodb://localhost:27017/orion" --out=/backup/

# Point-in-time recovery with replica sets
# Use oplog for continuous backup
```

### Nginx

**Role in SematX**:

Nginx serves as the API gateway and reverse proxy, handling:

- SSL/TLS termination
- Request routing
- JWT authentication
- Rate limiting
- Load balancing
- Static file serving

**Key Modules Used**:

- `ngx_http_auth_jwt_module` - JWT validation
- `ngx_http_limit_req_module` - Rate limiting
- `ngx_http_headers_module` - CORS headers
- `ngx_http_upstream_module` - Load balancing

**Configuration Example**:

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

    # Orion-LD routes (with JWT)
    location /ngsi-ld/ {
      limit_req zone=api_limit burst=20 nodelay;
      auth_jwt "SematX API";
      auth_jwt_key_file /etc/nginx/jwt_key.json;
      proxy_pass http://orion;
    }
  }
}
```

## Development Tools

### Docker and Docker Compose

**Why Docker?**

- Consistent environments across dev/staging/prod
- Easy dependency management
- Simplified deployment
- Isolation and security

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

**Benefits**:

- Type safety prevents runtime errors
- Better IDE support and autocomplete
- Self-documenting code
- Easier refactoring
- Modern JavaScript features

**Used in SematX for**:

- Dashboard frontend (React components)
- Dashboard backend (PayloadCMS configuration)
- API type definitions
- Utility functions

### React and Next.js

**React**: Component-based UI library

- Reusable dashboard widgets
- Real-time data updates
- Interactive forms

**Next.js**: React framework with server-side rendering

- Fast page loads
- SEO optimization
- API routes for backend logic
- Static site generation

### Git and GitHub

**Version Control**:

- All SematX code is version-controlled with Git
- GitHub for collaboration and CI/CD
- Branching strategy for features and releases

**Repository Structure**:

```
LegoCity/
├── dashboard/              # Lego Dashboard (PayloadCMS)
├── orion-ld/              # Orion-LD configuration
├── nginx/                 # Nginx gateway config
├── docs/                  # Documentation (MkDocs)
└── docker-compose.yml     # Full stack orchestration
```

## Testing Tools

### Postman/Insomnia

**API Testing**:

- Test NGSI-LD endpoints
- Validate JWT authentication
- Check subscription notifications
- Debug API issues

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

- Automated UI testing for dashboard
- User flow validation
- Cross-browser testing
- Visual regression testing

### Vitest

**Unit Testing**:

- Test React components
- Validate business logic
- Mock API responses
- Fast test execution

## Monitoring Tools

### Prometheus

**Metrics Collection**:

- API request rates
- Response times
- Error rates
- Resource usage

### Grafana

**Visualization**:

- Real-time dashboards
- Custom metrics charts
- Alerting rules
- Log aggregation

### MongoDB Compass

**Database Management**:

- Visual query builder
- Index analysis
- Performance insights
- Data import/export

## Recommended IDE

### Visual Studio Code

**Extensions**:

- ESLint - Code linting
- Prettier - Code formatting
- Docker - Container management
- MongoDB - Database viewer
- REST Client - API testing
- GitLens - Git visualization

## Learning Resources

### Official Documentation

- [NGSI-LD Specification](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.06.01_60/gs_CIM009v010601p.pdf)
- [FIWARE Documentation](https://fiware.github.io/tutorials.NGSI-LD/)
- [PayloadCMS Docs](https://payloadcms.com/docs)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)

### Tutorials

- [NGSI-LD Step-by-Step](https://fiware.github.io/tutorials.NGSI-LD/)
- [PayloadCMS Examples](https://github.com/payloadcms/payload/tree/main/examples)
- [Docker Compose Samples](https://github.com/docker/awesome-compose)

### Community

- [FIWARE Community](https://www.fiware.org/community/)
- [PayloadCMS Discord](https://discord.com/invite/payload)
- [SematX GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)

## Next Steps

- [Understand the Ecosystem](ecosystem.md)
- [Start Building](../getting-started/start-server/index.md)
- [Explore Core Concepts](../core-concepts/overview.md)
