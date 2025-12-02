# Lego Dashboard Internals

The Lego Dashboard is the visual interface and control center for SematX. Built on PayloadCMS, it provides entity management, dashboard building, and API key generation.

## Overview

The Lego Dashboard serves multiple purposes:

- **Admin UI**: Web interface for managing entities and settings
- **Dashboard Builder**: Drag-and-drop card creation
- **API Server**: RESTful API for programmatic access
- **User Management**: Authentication and access control
- **Entity Browser**: Visual NGSI-LD entity explorer

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Lego Dashboard                         │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Next.js Application                    │    │
│  │  • Server-Side Rendering (SSR)                 │    │
│  │  • API Routes (/api/*)                         │    │
│  │  • Static Asset Serving                        │    │
│  └────────────────────┬───────────────────────────┘    │
│                       │                                 │
│  ┌────────────────────▼───────────────────────────┐    │
│  │         PayloadCMS Core                        │    │
│  │  • Collection Management                       │    │
│  │  • Admin Panel Rendering                       │    │
│  │  • Hooks & Lifecycle Events                    │    │
│  │  • Plugin System                               │    │
│  └────────────────────┬───────────────────────────┘    │
│                       │                                 │
│  ┌────────────────────┴───────────────────────────┐    │
│  │  React Admin UI                                │    │
│  │  ┌─────────────┐  ┌─────────────┐            │    │
│  │  │  Entity     │  │  Dashboard  │            │    │
│  │  │  Manager    │  │  Builder    │            │    │
│  │  └─────────────┘  └─────────────┘            │    │
│  │  ┌─────────────┐  ┌─────────────┐            │    │
│  │  │  API Key    │  │  User       │            │    │
│  │  │  Manager    │  │  Manager    │            │    │
│  │  └─────────────┘  └─────────────┘            │    │
│  └────────────────────┬───────────────────────────┘    │
│                       │                                 │
│  ┌────────────────────▼───────────────────────────┐    │
│  │  Custom Components & Blocks                    │    │
│  │  • Card Renderer                               │    │
│  │  • NGSI-LD Entity Forms                        │    │
│  │  • Real-time Data Display                      │    │
│  └────────────────────┬───────────────────────────┘    │
│                       │                                 │
│  ┌────────────────────▼───────────────────────────┐    │
│  │  MongoDB Adapter                               │    │
│  │  • CRUD Operations                             │    │
│  │  • Query Building                              │    │
│  │  • Relationships                               │    │
│  └────────────────────┬───────────────────────────┘    │
└────────────────────────┼───────────────────────────────┘
                         │
                         ▼
                  ┌────────────┐
                  │  MongoDB   │
                  └────────────┘
```

## PayloadCMS Collections

Collections are the data structures in PayloadCMS. SematX defines several key collections:

### 1. Users Collection

Manages authentication and user accounts:

```typescript
// src/collections/Users/index.ts
import { CollectionConfig } from "payload/types";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: false,
    maxLoginAttempts: 5,
    lockTime: 600000, // 10 minutes
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "role", "createdAt"],
  },
  access: {
    read: () => true,
    create: () => true,
    update: ({ req: { user } }) => {
      // Users can update their own profile
      if (user) {
        return {
          id: {
            equals: user.id,
          },
        };
      }
      return false;
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete users
      return user?.role === "admin";
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
    },
    {
      name: "role",
      type: "select",
      defaultValue: "user",
      options: [
        { label: "Admin", value: "admin" },
        { label: "User", value: "user" },
        { label: "Viewer", value: "viewer" },
      ],
      required: true,
    },
    {
      name: "tenant",
      type: "text",
      admin: {
        description: "NGSI-LD tenant for multi-tenancy",
      },
    },
  ],
};
```

### 2. API Keys Collection

Manages JWT tokens for API access:

```typescript
// src/collections/APIKeys.ts
import { CollectionConfig } from "payload/types";
import jwt from "jsonwebtoken";

export const APIKeys: CollectionConfig = {
  slug: "api-keys",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "user", "expiresAt", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === "admin") return true;
      // Users can only see their own API keys
      return {
        user: {
          equals: user?.id,
        },
      };
    },
    create: () => true,
    delete: ({ req: { user } }) => {
      if (user?.role === "admin") return true;
      return {
        user: {
          equals: user?.id,
        },
      };
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      hasMany: false,
    },
    {
      name: "token",
      type: "text",
      admin: {
        readOnly: true,
        description: "JWT token - shown only once on creation",
      },
    },
    {
      name: "permissions",
      type: "select",
      hasMany: true,
      options: [
        { label: "Read Entities", value: "read:entities" },
        { label: "Write Entities", value: "write:entities" },
        { label: "Delete Entities", value: "delete:entities" },
        { label: "Manage Subscriptions", value: "manage:subscriptions" },
      ],
      defaultValue: ["read:entities"],
    },
    {
      name: "rateLimit",
      type: "number",
      defaultValue: 100,
      admin: {
        description: "Requests per minute",
      },
    },
    {
      name: "expiresAt",
      type: "date",
      admin: {
        description: "Leave empty for no expiration",
      },
    },
    {
      name: "lastUsedAt",
      type: "date",
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ operation, data, req }) => {
        // Generate JWT token on creation
        if (operation === "create") {
          const payload = {
            userId: data.user,
            email: req.user?.email,
            permissions: data.permissions || ["read:entities"],
            tenant: req.user?.tenant || "default",
            rateLimit: data.rateLimit || 100,
            iat: Math.floor(Date.now() / 1000),
          };

          if (data.expiresAt) {
            payload.exp = Math.floor(new Date(data.expiresAt).getTime() / 1000);
          }

          const token = jwt.sign(payload, process.env.JWT_SECRET || "secret");
          data.token = token;
        }
        return data;
      },
    ],
  },
};
```

### 3. Cards Collection

Dashboard card configurations:

```typescript
// src/collections/Cards.ts
import { CollectionConfig } from "payload/types";

export const Cards: CollectionConfig = {
  slug: "cards",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "entityType", "createdAt"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Metric", value: "metric" },
        { label: "Chart", value: "chart" },
        { label: "Map", value: "map" },
        { label: "Table", value: "table" },
        { label: "Gauge", value: "gauge" },
      ],
    },
    {
      name: "entityType",
      type: "text",
      required: true,
      admin: {
        description: "NGSI-LD entity type (e.g., TemperatureSensor)",
      },
    },
    {
      name: "entityId",
      type: "text",
      admin: {
        description: "Specific entity ID (optional)",
      },
    },
    {
      name: "attribute",
      type: "text",
      admin: {
        description: "Entity attribute to display",
      },
    },
    {
      name: "configuration",
      type: "json",
      admin: {
        description: "Card-specific configuration (colors, thresholds, etc.)",
      },
    },
    {
      name: "layout",
      type: "group",
      fields: [
        {
          name: "width",
          type: "number",
          defaultValue: 12,
          min: 1,
          max: 12,
          admin: {
            description: "Grid columns (1-12)",
          },
        },
        {
          name: "height",
          type: "number",
          defaultValue: 200,
          admin: {
            description: "Height in pixels",
          },
        },
        {
          name: "order",
          type: "number",
          defaultValue: 0,
        },
      ],
    },
    {
      name: "refreshInterval",
      type: "number",
      defaultValue: 60,
      admin: {
        description: "Auto-refresh interval in seconds",
      },
    },
  ],
};
```

### 4. Data Sources Collection

External data source configurations:

```typescript
// src/collections/DataSources.ts
import { CollectionConfig } from "payload/types";

export const DataSources: CollectionConfig = {
  slug: "data-sources",
  admin: {
    useAsTitle: "name",
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
      required: true,
      options: [
        { label: "Orion-LD", value: "orion-ld" },
        { label: "HTTP API", value: "http" },
        { label: "MQTT", value: "mqtt" },
        { label: "WebSocket", value: "websocket" },
      ],
    },
    {
      name: "url",
      type: "text",
      required: true,
    },
    {
      name: "authentication",
      type: "group",
      fields: [
        {
          name: "type",
          type: "select",
          options: [
            { label: "None", value: "none" },
            { label: "Basic Auth", value: "basic" },
            { label: "Bearer Token", value: "bearer" },
            { label: "API Key", value: "api-key" },
          ],
          defaultValue: "none",
        },
        {
          name: "credentials",
          type: "json",
          admin: {
            description: "Authentication credentials",
          },
        },
      ],
    },
    {
      name: "tenant",
      type: "text",
      admin: {
        description: "NGSI-LD tenant name",
      },
    },
  ],
};
```

## NGSI-LD Entity Management

### Entity Browser Component

Custom React component for browsing entities:

```typescript
// src/components/EntityBrowser/index.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "payload/components/utilities";

interface Entity {
  id: string;
  type: string;
  [key: string]: any;
}

export const EntityBrowser: React.FC = () => {
  const { user } = useAuth();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("");

  useEffect(() => {
    fetchEntities();
  }, [entityType]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const query = entityType ? `?type=${entityType}` : "";
      const response = await fetch(`/api/entities${query}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEntities(data);
      }
    } catch (error) {
      console.error("Failed to fetch entities:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntity = async (entityId: string) => {
    if (!confirm("Are you sure you want to delete this entity?")) return;

    try {
      const response = await fetch(
        `/api/entities/${encodeURIComponent(entityId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (response.ok) {
        fetchEntities(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to delete entity:", error);
    }
  };

  return (
    <div className="entity-browser">
      <div className="filters">
        <input
          type="text"
          placeholder="Filter by entity type..."
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        />
        <button onClick={fetchEntities}>Refresh</button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="entity-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Attributes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity) => (
              <tr key={entity.id}>
                <td>{entity.id}</td>
                <td>{entity.type}</td>
                <td>
                  {
                    Object.keys(entity).filter(
                      (k) => !["id", "type", "@context"].includes(k)
                    ).length
                  }
                </td>
                <td>
                  <button
                    onClick={() =>
                      window.open(`/admin/entities/${entity.id}`, "_blank")
                    }
                  >
                    View
                  </button>
                  <button onClick={() => deleteEntity(entity.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

### Entity API Endpoints

Custom API routes for entity operations:

```typescript
// src/app/api/entities/route.ts
import { NextRequest, NextResponse } from "next/server";

const ORION_URL = process.env.ORION_URL || "http://orion:1026";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const limit = searchParams.get("limit") || "100";

  const url = new URL(`${ORION_URL}/ngsi-ld/v1/entities`);
  if (type) url.searchParams.set("type", type);
  url.searchParams.set("limit", limit);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/ld+json",
        Authorization: request.headers.get("Authorization") || "",
        "NGSILD-Tenant": request.headers.get("NGSILD-Tenant") || "default",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch entities" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const entity = await request.json();

    const response = await fetch(`${ORION_URL}/ngsi-ld/v1/entities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/ld+json",
        Authorization: request.headers.get("Authorization") || "",
        "NGSILD-Tenant": request.headers.get("NGSILD-Tenant") || "default",
      },
      body: JSON.stringify(entity),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Access Control System

### Role-Based Access Control (RBAC)

PayloadCMS access control configuration:

```typescript
// Access control for entities
const entityAccess = {
  read: ({ req: { user } }) => {
    // Admins can read everything
    if (user?.role === "admin") return true;

    // Users can only read entities in their tenant
    return {
      tenant: {
        equals: user?.tenant || "default",
      },
    };
  },

  create: ({ req: { user } }) => {
    // Only authenticated users can create
    return !!user;
  },

  update: ({ req: { user }, id }) => {
    // Admins can update everything
    if (user?.role === "admin") return true;

    // Users can only update entities they own
    return {
      createdBy: {
        equals: user?.id,
      },
      tenant: {
        equals: user?.tenant || "default",
      },
    };
  },

  delete: ({ req: { user } }) => {
    // Only admins can delete
    return user?.role === "admin";
  },
};
```

### Field-Level Access

```typescript
{
  name: 'sensitiveData',
  type: 'text',
  access: {
    read: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
  },
}
```

## Card Rendering Engine

### Card Renderer Component

```typescript
// src/components/CardRenderer/index.tsx
import React from "react";
import { MetricCard } from "./MetricCard";
import { ChartCard } from "./ChartCard";
import { MapCard } from "./MapCard";
import { TableCard } from "./TableCard";

interface CardConfig {
  id: string;
  type: string;
  name: string;
  entityType: string;
  entityId?: string;
  attribute?: string;
  configuration: any;
  layout: {
    width: number;
    height: number;
    order: number;
  };
  refreshInterval: number;
}

export const CardRenderer: React.FC<{ config: CardConfig }> = ({ config }) => {
  const renderCard = () => {
    switch (config.type) {
      case "metric":
        return <MetricCard config={config} />;
      case "chart":
        return <ChartCard config={config} />;
      case "map":
        return <MapCard config={config} />;
      case "table":
        return <TableCard config={config} />;
      default:
        return <div>Unknown card type: {config.type}</div>;
    }
  };

  return (
    <div
      className="card-container"
      style={{
        gridColumn: `span ${config.layout.width}`,
        height: `${config.layout.height}px`,
        order: config.layout.order,
      }}
    >
      {renderCard()}
    </div>
  );
};
```

### Metric Card Implementation

```typescript
// src/components/CardRenderer/MetricCard.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "payload/components/utilities";

export const MetricCard: React.FC<{ config: any }> = ({ config }) => {
  const { user } = useAuth();
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchValue();
    const interval = setInterval(fetchValue, config.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [config]);

  const fetchValue = async () => {
    try {
      const response = await fetch(
        `/api/entities/${encodeURIComponent(config.entityId)}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (response.ok) {
        const entity = await response.json();
        const attrValue = entity[config.attribute]?.value;
        setValue(attrValue);
      }
    } catch (error) {
      console.error("Failed to fetch value:", error);
    } finally {
      setLoading(false);
    }
  };

  const getColor = () => {
    if (value === null) return config.configuration.color || "#888";

    const threshold = config.configuration.threshold;
    if (!threshold) return config.configuration.color || "#51CF66";

    if (threshold.critical && value >= threshold.critical.min) {
      return threshold.critical.color || "#FF0000";
    }
    if (threshold.warning && value >= threshold.warning.min) {
      return threshold.warning.color || "#FFA500";
    }
    return threshold.normal?.color || "#51CF66";
  };

  return (
    <div className="metric-card" style={{ borderColor: getColor() }}>
      <div className="metric-label">
        {config.configuration.label || config.name}
      </div>
      <div className="metric-value" style={{ color: getColor() }}>
        {loading ? (
          "..."
        ) : value !== null ? (
          <>
            {value.toFixed(config.configuration.decimals || 1)}
            {config.configuration.unit && (
              <span className="metric-unit">{config.configuration.unit}</span>
            )}
          </>
        ) : (
          "No data"
        )}
      </div>
    </div>
  );
};
```

## Real-Time Subscriptions

### WebSocket Integration

```typescript
// src/services/websocket.ts
import { Server } from "socket.io";
import { Server as HttpServer } from "http";

export function initializeWebSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Subscribe to entity updates
    socket.on(
      "subscribe",
      (data: { entityType?: string; entityId?: string }) => {
        const room = data.entityId || `type:${data.entityType}`;
        socket.join(room);
        console.log(`Client ${socket.id} subscribed to ${room}`);
      }
    );

    // Unsubscribe
    socket.on(
      "unsubscribe",
      (data: { entityType?: string; entityId?: string }) => {
        const room = data.entityId || `type:${data.entityType}`;
        socket.leave(room);
        console.log(`Client ${socket.id} unsubscribed from ${room}`);
      }
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

// Broadcast entity updates
export function broadcastEntityUpdate(io: Server, entity: any) {
  // Broadcast to entity ID room
  io.to(entity.id).emit("entity:update", entity);

  // Broadcast to entity type room
  io.to(`type:${entity.type}`).emit("entity:update", entity);
}
```

### NGSI-LD Subscription Handler

```typescript
// src/app/api/webhooks/ngsi-ld/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getIO } from "@/services/websocket";

export async function POST(request: NextRequest) {
  try {
    const notification = await request.json();

    console.log("Received NGSI-LD notification:", notification.id);

    // Broadcast to connected WebSocket clients
    const io = getIO();
    notification.data.forEach((entity: any) => {
      io.to(entity.id).emit("entity:update", entity);
      io.to(`type:${entity.type}`).emit("entity:update", entity);
    });

    // Always respond quickly
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing notification:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
```

## Performance Optimization

### Database Indexing

```typescript
// src/server.ts
import payload from "payload";

await payload.init({
  // ... other config
  onInit: async () => {
    // Create indexes for better query performance
    const db = payload.db;

    // Index on API keys
    await db.collection("api-keys").createIndex({ user: 1, expiresAt: 1 });

    // Index on cards
    await db.collection("cards").createIndex({ entityType: 1, entityId: 1 });

    // Index on data sources
    await db.collection("data-sources").createIndex({ type: 1, tenant: 1 });

    console.log("Database indexes created");
  },
});
```

### Caching Strategy

```typescript
// src/services/cache.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export async function getCachedEntity(entityId: string): Promise<any | null> {
  const cached = await redis.get(`entity:${entityId}`);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedEntity(
  entityId: string,
  entity: any,
  ttl: number = 60
) {
  await redis.setex(`entity:${entityId}`, ttl, JSON.stringify(entity));
}

export async function invalidateEntityCache(entityId: string) {
  await redis.del(`entity:${entityId}`);
}
```

## Monitoring and Debugging

### Custom Logging

```typescript
// src/utils/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({
      filename: "logs/dashboard.log",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Usage
logger.info("Entity created", { entityId: "urn:ngsi-ld:Sensor:001" });
logger.error("Failed to fetch entities", { error: error.message });
```

### Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import payload from "payload";

export async function GET() {
  try {
    // Check database connection
    await payload.db.connect();

    // Check Orion-LD connection
    const orionResponse = await fetch(`${process.env.ORION_URL}/version`);
    const orionHealthy = orionResponse.ok;

    const health = {
      status: orionHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: "up",
        orion: orionHealthy ? "up" : "down",
      },
    };

    return NextResponse.json(health, {
      status: orionHealthy ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error.message,
      },
      { status: 503 }
    );
  }
}
```

## Best Practices

### Security

✅ **Do**:

- Validate all user inputs
- Use parameterized queries
- Implement rate limiting per user
- Sanitize entity data before display
- Keep dependencies updated
- Use environment variables for secrets

❌ **Don't**:

- Trust client-side data
- Store passwords in plain text
- Expose internal error details
- Allow unlimited file uploads
- Use eval() or similar functions

### Performance

✅ **Do**:

- Use database indexes
- Implement caching for frequently accessed data
- Paginate large result sets
- Use WebSockets for real-time updates
- Optimize bundle size (code splitting)
- Monitor query performance

❌ **Don't**:

- Fetch all entities at once
- Make N+1 queries
- Block the event loop
- Keep unused connections open
- Cache sensitive data

## Next Steps

- [**Deployment Guide →**](../deployment/index.md) - Deploy to production
- [**Development →**](../development/index.md) - Extend and customize
- [**Troubleshooting →**](../reference/troubleshooting.md) - Common issues and solutions

## Further Reading

- [PayloadCMS Documentation](https://payloadcms.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/administration/production-notes/)
