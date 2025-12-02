# Understanding the SematX Ecosystem

This page provides a detailed explanation of how the different components of SematX work together to create a complete smart city platform.

## Architecture Overview

The SematX platform follows a layered architecture that separates concerns and provides flexibility:

```
┌─────────────────────────────────────────────────────┐
│                   Users & Devices                    │
│              (Web, Mobile, IoT Devices)              │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ HTTPS/JWT
                      │
┌─────────────────────▼───────────────────────────────┐
│              Orion Nginx Gateway                     │
│         (Authentication & API Gateway)               │
└─────────────────────┬───────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
┌─────────▼──────────┐  ┌────────▼─────────┐
│  Lego Dashboard    │  │   Orion-LD       │
│  (PayloadCMS)      │  │ Context Broker   │
│  - UI/Dashboard    │  │  - Entity Store  │
│  - User Mgmt       │  │  - NGSI-LD API   │
│  - API Keys        │  │  - Subscriptions │
└─────────┬──────────┘  └────────┬─────────┘
          │                      │
          │        ┌─────────────┘
          │        │
┌─────────▼────────▼─────────┐
│    MongoDB Database         │
│  - Dashboard Data           │
│  - Entity Data (Orion)      │
└─────────────────────────────┘
```

## Component Deep Dive

### Orion-LD Context Broker

**Purpose**: The central data repository and NGSI-LD API server.

**Key Responsibilities**:

- Store and manage entity data following NGSI-LD standard
- Provide query API for retrieving entity information
- Handle entity subscriptions for real-time notifications
- Maintain entity relationships and properties
- Support temporal queries for historical data

**Technology Stack**:

- Written in C++ for high performance
- Uses MongoDB for data persistence
- Implements NGSI-LD v1.6.1 specification
- Supports GeoJSON for geospatial queries

**API Endpoints**:

- `POST /ngsi-ld/v1/entities` - Create entities
- `GET /ngsi-ld/v1/entities` - Query entities
- `PATCH /ngsi-ld/v1/entities/{entityId}/attrs` - Update entity attributes
- `DELETE /ngsi-ld/v1/entities/{entityId}` - Delete entities
- `POST /ngsi-ld/v1/subscriptions` - Create subscriptions

**Example Entity**:

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

**Purpose**: Secure, high-performance API gateway and authentication layer.

**Key Responsibilities**:

- Authenticate requests using JWT tokens
- Route API calls to appropriate backend services
- Enforce rate limiting to prevent abuse
- Handle CORS for web applications
- Provide SSL/TLS termination
- Log and monitor API usage

**Technology Stack**:

- Nginx for high-performance request handling
- Lua scripts for custom authentication logic
- JWT validation using public keys
- Redis for rate limiting and caching

**Security Features**:

1. **JWT Authentication**: Every API request must include a valid JWT token in the `Authorization` header:

   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **API Key Validation**: Tokens are issued by the Lego Dashboard and contain:

   - User ID
   - Permissions/scopes
   - Expiration time
   - Rate limit tier

3. **Rate Limiting**: Prevents API abuse with configurable limits:

   - Default: 100 requests per minute per API key
   - Custom tiers available for different use cases

4. **CORS Configuration**: Allows web applications to access the API:
   ```nginx
   add_header 'Access-Control-Allow-Origin' '*';
   add_header 'Access-Control-Allow-Methods' 'GET, POST, PATCH, DELETE, OPTIONS';
   add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, NGSILD-Tenant';
   ```

**Routing Logic**:

```nginx
# Dashboard API routes
location /api/ {
    proxy_pass http://dashboard:3000;
}

# NGSI-LD API routes (requires JWT)
location /ngsi-ld/ {
    access_by_lua_file /etc/nginx/lua/jwt_verify.lua;
    proxy_pass http://orion:1026;
}

# Health check endpoint (no auth required)
location /health {
    return 200 "OK";
}
```

### Lego Dashboard

**Purpose**: User-friendly web interface for managing and visualizing IoT data.

**Key Responsibilities**:

- Provide visual dashboard builder with drag-and-drop widgets
- Manage users, teams, and access control
- Generate and manage API keys
- Create and manage entity templates
- Configure data subscriptions and webhooks
- Display real-time data visualization

**Technology Stack**:

- Built on PayloadCMS (Node.js/React)
- MongoDB for dashboard configuration storage
- Next.js for server-side rendering
- React for interactive UI components
- TypeScript for type safety

**Core Features**:

1. **Dashboard Builder**:

   - Drag-and-drop card creation
   - Multiple card types: maps, charts, tables, metrics
   - Real-time data updates via subscriptions
   - Responsive layouts for mobile and desktop

2. **Entity Management**:

   - Browse and search entities
   - Create entities with form builder
   - Update entity attributes in real-time
   - Delete and bulk operations
   - Import/export entities as JSON

3. **API Key Management**:

   - Generate JWT tokens for API access
   - Set permissions and rate limits per key
   - Revoke keys instantly
   - Monitor API usage per key

4. **Access Control**:

   - Role-based access control (RBAC)
   - Organization and team management
   - Fine-grained permissions per entity type
   - Audit logs for security compliance

5. **Subscriptions**:
   - Create NGSI-LD subscriptions
   - Configure webhook endpoints
   - Filter entities by type and properties
   - Monitor subscription status

## Data Flow Examples

### Example 1: IoT Device Sends Data

1. **Device** generates sensor reading (temperature: 28.5°C)
2. **Device** sends HTTP POST to `/ngsi-ld/v1/entities/{id}/attrs` with JWT token
3. **Nginx Gateway** validates JWT and checks rate limits
4. **Nginx Gateway** forwards request to **Orion-LD**
5. **Orion-LD** updates entity in MongoDB
6. **Orion-LD** triggers active subscriptions
7. **Orion-LD** sends notifications to **Lego Dashboard** webhooks
8. **Lego Dashboard** updates real-time charts on user dashboards

### Example 2: User Creates Dashboard Card

1. **User** logs into **Lego Dashboard** web UI
2. **User** navigates to dashboard builder
3. **User** drags a "Temperature Chart" card onto canvas
4. **User** configures card to show entity `urn:ngsi-ld:Sensor:001`
5. **Dashboard** saves card configuration to MongoDB
6. **Dashboard** creates NGSI-LD subscription in **Orion-LD**
7. **Orion-LD** notifies **Dashboard** when entity updates
8. **Dashboard** pushes update to user's browser via WebSocket

### Example 3: Third-Party App Queries Data

1. **Developer** obtains API key from **Lego Dashboard**
2. **App** makes GET request to `/ngsi-ld/v1/entities?type=Sensor`
3. **Nginx Gateway** validates JWT token
4. **Nginx Gateway** checks rate limits (99/100 used)
5. **Nginx Gateway** forwards query to **Orion-LD**
6. **Orion-LD** queries MongoDB for matching entities
7. **Orion-LD** returns JSON response
8. **Nginx Gateway** forwards response to **App**
9. **App** displays sensor data to end user

## Next Steps

- [Start a Local Server](../getting-started/start-server/index.md)
- [Deploy to Production](../deployment/index.md)
- [Learn Core Concepts](../core-concepts/overview.md)
