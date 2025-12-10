/**
 * LegoCity - Smart City Demo Server
 * Interactive demo showing how data servers work with NGSI-LD Context Broker
 *
 * @version 2.0
 * @author CTU·SematX
 * @copyright (c) 2025 CTU·SematX. All rights reserved
 * @license MIT License
 * @see https://github.com/CTU-SematX/LegoCity
 */

import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";

const PORT = process.env.PORT || 8004;
const BROKER_URL = process.env.BROKER_URL || "http://localhost:1026";

// Entity types available in the system
const ENTITY_TYPES = [
  "TrafficFlowObserved",
  "FloodSensor",
  "FloodZone",
  "EmergencyIncident",
  "EmergencyVehicle",
  "MedicalFacility",
] as const;

type EntityType = (typeof ENTITY_TYPES)[number];

// Editable attributes per entity type
const EDITABLE_ATTRS: Record<EntityType, string[]> = {
  TrafficFlowObserved: ["averageVehicleSpeed", "vehicleCount", "congestionIndex"],
  FloodSensor: ["waterLevel", "batteryLevel"],
  FloodZone: ["waterDepth", "floodSeverity", "isActive", "affectedPopulation"],
  EmergencyIncident: ["status", "severity"],
  EmergencyVehicle: ["status", "speed", "heading"],
  MedicalFacility: ["availableBeds"],
};

/**
 * Fetch entities from broker
 */
async function fetchEntities(type?: string, limit = 100): Promise<any[]> {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  params.set("limit", limit.toString());

  const url = `${BROKER_URL}/ngsi-ld/v1/entities?${params}`;
  const resp = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!resp.ok) {
    throw new Error(`Broker error: ${resp.status}`);
  }

  return resp.json();
}

/**
 * Fetch single entity by ID
 */
async function fetchEntity(entityId: string): Promise<any> {
  const url = `${BROKER_URL}/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}`;
  const resp = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`Broker error: ${resp.status}`);

  return resp.json();
}

/**
 * Update entity attributes on broker
 */
async function updateEntityAttrs(
  entityId: string,
  attrs: Record<string, any>
): Promise<boolean> {
  // Convert simple values to NGSI-LD Property format
  const ngsiAttrs: Record<string, any> = {
    "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
  };

  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null && value !== "") {
      ngsiAttrs[key] = { type: "Property", value };
    }
  }

  const url = `${BROKER_URL}/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}/attrs`;
  const resp = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/ld+json" },
    body: JSON.stringify(ngsiAttrs),
  });

  return resp.ok || resp.status === 204;
}

/**
 * Extract simple value from NGSI-LD attribute
 */
function extractValue(attr: any): any {
  if (attr === null || attr === undefined) return null;
  if (typeof attr === "object" && "value" in attr) return attr.value;
  return attr;
}

/**
 * Simplify entity for display
 */
function simplifyEntity(entity: any): any {
  const result: any = {
    id: entity.id,
    type: entity.type,
  };

  for (const [key, value] of Object.entries(entity)) {
    if (key === "id" || key === "type" || key === "@context") continue;
    result[key] = extractValue(value);
  }

  return result;
}

// ============================================================================
// App Setup
// ============================================================================

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "LegoCity Demo Data Server",
          description: `
## 🎓 Interactive Demo Server

This server demonstrates how data servers interact with the NGSI-LD Context Broker.

### How to use:
1. **Browse entities**: Use GET endpoints to fetch entities from the broker
2. **Update attributes**: Use PATCH endpoints to modify entity values
3. **See changes**: Refresh to see your updates reflected in the broker

### Available Entity Types:
- **TrafficFlowObserved** - Traffic flow monitoring data
- **FloodSensor** - Flood sensor readings
- **FloodZone** - Flood zone information
- **EmergencyIncident** - Emergency incident reports
- **EmergencyVehicle** - Emergency vehicle tracking
- **MedicalFacility** - Medical facility capacity

### Editable Attributes:
Each entity type has specific attributes that can be updated via this demo.
`,
          version: "2.0.0",
          contact: {
            name: "CTU·SematX",
            url: "https://github.com/CTU-SematX/LegoCity",
          },
        },
        tags: [
          { name: "Info", description: "Server information" },
          { name: "Entities", description: "Browse and query entities" },
          { name: "TrafficFlowObserved", description: "Update traffic data" },
          { name: "FloodSensor", description: "Update flood sensor data" },
          { name: "FloodZone", description: "Update flood zone data" },
          { name: "EmergencyIncident", description: "Update incident data" },
          { name: "EmergencyVehicle", description: "Update vehicle data" },
          { name: "MedicalFacility", description: "Update facility data" },
        ],
      },
    })
  )

  // ========== Info Endpoints ==========
  .get(
    "/",
    () => ({
      status: "ok",
      service: "legocity-demo-server",
      version: "2.0.0",
      broker: BROKER_URL,
      entityTypes: ENTITY_TYPES,
      timestamp: new Date().toISOString(),
      docs: "/swagger",
    }),
    {
      detail: {
        tags: ["Info"],
        summary: "Health check and server info",
      },
    }
  )

  .get(
    "/entity-types",
    () => ({
      types: ENTITY_TYPES,
      editableAttributes: EDITABLE_ATTRS,
    }),
    {
      detail: {
        tags: ["Info"],
        summary: "List available entity types and their editable attributes",
      },
    }
  )

  // ========== Generic Entity Endpoints ==========
  .get(
    "/entities",
    async ({ query, set }) => {
      try {
        const entities = await fetchEntities(query.type, query.limit);
        return {
          count: entities.length,
          entities: entities.map(simplifyEntity),
        };
      } catch (e: any) {
        set.status = 502;
        return { error: "Failed to fetch from broker", message: e.message };
      }
    },
    {
      query: t.Object({
        type: t.Optional(t.String({ description: "Filter by entity type" })),
        limit: t.Optional(t.Number({ default: 50, description: "Max results" })),
      }),
      detail: {
        tags: ["Entities"],
        summary: "List all entities from broker",
        description: "Fetch entities from the Context Broker. Optionally filter by type.",
      },
    }
  )

  .get(
    "/entities/:id",
    async ({ params, set }) => {
      try {
        const entity = await fetchEntity(params.id);
        if (!entity) {
          set.status = 404;
          return { error: "Entity not found" };
        }
        return simplifyEntity(entity);
      } catch (e: any) {
        set.status = 502;
        return { error: "Failed to fetch from broker", message: e.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: "Entity ID (URN format)" }),
      }),
      detail: {
        tags: ["Entities"],
        summary: "Get entity by ID",
        description: "Fetch a specific entity from the Context Broker by its ID.",
      },
    }
  )

  // ========== TrafficFlowObserved Update ==========
  .patch(
    "/traffic/:id",
    async ({ params, body, set }) => {
      try {
        const success = await updateEntityAttrs(params.id, body);
        if (!success) {
          set.status = 400;
          return { error: "Failed to update entity" };
        }
        return { success: true, updated: params.id, attributes: body };
      } catch (e: any) {
        set.status = 502;
        return { error: "Broker error", message: e.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: "TrafficFlowObserved entity ID" }),
      }),
      body: t.Object({
        averageVehicleSpeed: t.Optional(
          t.Number({ description: "Average vehicle speed (km/h)", minimum: 0, maximum: 200 })
        ),
        vehicleCount: t.Optional(
          t.Number({ description: "Number of vehicles", minimum: 0 })
        ),
        congestionIndex: t.Optional(
          t.Number({ description: "Congestion index (0-1)", minimum: 0, maximum: 1 })
        ),
      }),
      detail: {
        tags: ["TrafficFlowObserved"],
        summary: "Update traffic flow data",
        description: "Update attributes of a TrafficFlowObserved entity.",
      },
    }
  )

  // ========== FloodSensor Update ==========
  .patch(
    "/flood-sensor/:id",
    async ({ params, body, set }) => {
      try {
        const success = await updateEntityAttrs(params.id, body);
        if (!success) {
          set.status = 400;
          return { error: "Failed to update entity" };
        }
        return { success: true, updated: params.id, attributes: body };
      } catch (e: any) {
        set.status = 502;
        return { error: "Broker error", message: e.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: "FloodSensor entity ID" }),
      }),
      body: t.Object({
        waterLevel: t.Optional(
          t.Number({ description: "Water level (meters)", minimum: 0 })
        ),
        batteryLevel: t.Optional(
          t.Number({ description: "Battery level (0-1)", minimum: 0, maximum: 1 })
        ),
      }),
      detail: {
        tags: ["FloodSensor"],
        summary: "Update flood sensor data",
        description: "Update attributes of a FloodSensor entity.",
      },
    }
  )

  // ========== FloodZone Update ==========
  .patch(
    "/flood-zone/:id",
    async ({ params, body, set }) => {
      try {
        const success = await updateEntityAttrs(params.id, body);
        if (!success) {
          set.status = 400;
          return { error: "Failed to update entity" };
        }
        return { success: true, updated: params.id, attributes: body };
      } catch (e: any) {
        set.status = 502;
        return { error: "Broker error", message: e.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: "FloodZone entity ID" }),
      }),
      body: t.Object({
        waterDepth: t.Optional(
          t.Number({ description: "Water depth (meters)", minimum: 0 })
        ),
        floodSeverity: t.Optional(
          t.String({ description: "Severity level", enum: ["low", "medium", "high"] })
        ),
        isActive: t.Optional(t.Boolean({ description: "Is flood zone active" })),
        affectedPopulation: t.Optional(
          t.Number({ description: "Affected population count", minimum: 0 })
        ),
      }),
      detail: {
        tags: ["FloodZone"],
        summary: "Update flood zone data",
        description: "Update attributes of a FloodZone entity.",
      },
    }
  )

  // ========== EmergencyIncident Update ==========
  .patch(
    "/incident/:id",
    async ({ params, body, set }) => {
      try {
        const success = await updateEntityAttrs(params.id, body);
        if (!success) {
          set.status = 400;
          return { error: "Failed to update entity" };
        }
        return { success: true, updated: params.id, attributes: body };
      } catch (e: any) {
        set.status = 502;
        return { error: "Broker error", message: e.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: "EmergencyIncident entity ID" }),
      }),
      body: t.Object({
        status: t.Optional(
          t.String({
            description: "Incident status",
            enum: ["Reported", "Dispatching", "OnScene", "Resolved"],
          })
        ),
        severity: t.Optional(
          t.String({
            description: "Severity level",
            enum: ["Low", "Medium", "High", "Critical"],
          })
        ),
      }),
      detail: {
        tags: ["EmergencyIncident"],
        summary: "Update incident data",
        description: "Update attributes of an EmergencyIncident entity.",
      },
    }
  )

  // ========== EmergencyVehicle Update ==========
  .patch(
    "/vehicle/:id",
    async ({ params, body, set }) => {
      try {
        const success = await updateEntityAttrs(params.id, body);
        if (!success) {
          set.status = 400;
          return { error: "Failed to update entity" };
        }
        return { success: true, updated: params.id, attributes: body };
      } catch (e: any) {
        set.status = 502;
        return { error: "Broker error", message: e.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: "EmergencyVehicle entity ID" }),
      }),
      body: t.Object({
        status: t.Optional(
          t.String({
            description: "Vehicle status",
            enum: ["Available", "OnMission", "Maintenance"],
          })
        ),
        speed: t.Optional(
          t.Number({ description: "Current speed (km/h)", minimum: 0, maximum: 200 })
        ),
        heading: t.Optional(
          t.Number({ description: "Heading (degrees)", minimum: 0, maximum: 360 })
        ),
      }),
      detail: {
        tags: ["EmergencyVehicle"],
        summary: "Update vehicle data",
        description: "Update attributes of an EmergencyVehicle entity.",
      },
    }
  )

  // ========== MedicalFacility Update ==========
  .patch(
    "/facility/:id",
    async ({ params, body, set }) => {
      try {
        const success = await updateEntityAttrs(params.id, body);
        if (!success) {
          set.status = 400;
          return { error: "Failed to update entity" };
        }
        return { success: true, updated: params.id, attributes: body };
      } catch (e: any) {
        set.status = 502;
        return { error: "Broker error", message: e.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: "MedicalFacility entity ID" }),
      }),
      body: t.Object({
        availableBeds: t.Optional(
          t.Number({ description: "Number of available beds", minimum: 0 })
        ),
      }),
      detail: {
        tags: ["MedicalFacility"],
        summary: "Update facility data",
        description: "Update attributes of a MedicalFacility entity.",
      },
    }
  )

  .listen(PORT);

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           LegoCity Demo Data Server                           ║
╠═══════════════════════════════════════════════════════════════╣
║  Status:    Running                                           ║
║  Port:      ${String(PORT).padEnd(48)}║
║  Broker:    ${BROKER_URL.padEnd(48)}║
║  Swagger:   http://localhost:${PORT}/swagger                        ║
╚═══════════════════════════════════════════════════════════════╝
`);

export type App = typeof app;
