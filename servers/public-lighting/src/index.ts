/**
 * LegoCity - Smart City Platform
 * @version 1.0
 * @author CTU·SematX
 * @copyright (c) 2025 CTU·SematX. All rights reserved
 * @license MIT License
 * @see https://github.com/CTU-SematX/LegoCity The LegoCity GitHub project
 */

import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import {
  initDb,
  seedData,
  getAllStreetlights,
  getStreetlightById,
  createStreetlight,
  updateStreetlight,
  deleteStreetlight,
} from "./db";
import { toNgsiLd } from "./ngsi";

const PORT = process.env.PORT || 8003;
const BROKER_URL = process.env.BROKER_URL || "http://localhost:1026";

// Initialize database and seed data
initDb();
seedData();

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Public Lighting Server",
          description: "API quản lý dữ liệu đèn đường thông minh (NGSI-LD Streetlight)",
          version: "1.0.0",
        },
      },
    })
  )
  // Health check
  .get("/", () => ({
    status: "ok",
    service: "public-lighting",
    timestamp: new Date().toISOString(),
  }))
  // List all streetlights
  .get(
    "/streetlights",
    ({ query }) => {
      const skip = Number(query.skip) || 0;
      const limit = Number(query.limit) || 100;
      return getAllStreetlights(skip, limit);
    },
    {
      query: t.Object({
        skip: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )
  // Get streetlight by ID
  .get(
    "/streetlights/:id",
    ({ params, set }) => {
      const record = getStreetlightById(Number(params.id));
      if (!record) {
        set.status = 404;
        return { error: "Record not found" };
      }
      return record;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  // Create streetlight
  .post(
    "/streetlights",
    ({ body, set }) => {
      try {
        const record = createStreetlight(body);
        set.status = 201;
        return record;
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
    },
    {
      body: t.Object({
        entity_id: t.String(),
        entity_type: t.Optional(t.String()),
        name: t.String(),
        description: t.Optional(t.String()),
        location_lon: t.Number(),
        location_lat: t.Number(),
        status: t.String(),
        power_state: t.String(),
        date_last_switching_on: t.Optional(t.String()),
        date_last_switching_off: t.Optional(t.String()),
        illuminance_level: t.Number(),
        power_consumption: t.Number(),
        lantern_height: t.Number(),
        lamp_type: t.String(),
        controlling_method: t.String(),
        ref_streetlight_group: t.Optional(t.String()),
      }),
    }
  )
  // Update streetlight
  .put(
    "/streetlights/:id",
    ({ params, body, set }) => {
      const record = updateStreetlight(Number(params.id), body);
      if (!record) {
        set.status = 404;
        return { error: "Record not found" };
      }
      return record;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        location_lon: t.Optional(t.Number()),
        location_lat: t.Optional(t.Number()),
        status: t.Optional(t.String()),
        power_state: t.Optional(t.String()),
        date_last_switching_on: t.Optional(t.String()),
        date_last_switching_off: t.Optional(t.String()),
        illuminance_level: t.Optional(t.Number()),
        power_consumption: t.Optional(t.Number()),
        lantern_height: t.Optional(t.Number()),
        lamp_type: t.Optional(t.String()),
        controlling_method: t.Optional(t.String()),
        ref_streetlight_group: t.Optional(t.String()),
      }),
    }
  )
  // Delete streetlight
  .delete(
    "/streetlights/:id",
    ({ params, set }) => {
      const deleted = deleteStreetlight(Number(params.id));
      if (!deleted) {
        set.status = 404;
        return { error: "Record not found" };
      }
      return { message: "Record deleted successfully" };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  // Push to broker
  .post(
    "/streetlights/:id/push",
    async ({ params, set }) => {
      const record = getStreetlightById(Number(params.id));
      if (!record) {
        set.status = 404;
        return { error: "Record not found" };
      }

      const ngsiData = toNgsiLd(record);

      try {
        let response = await fetch(`${BROKER_URL}/ngsi-ld/v1/entities`, {
          method: "POST",
          headers: { "Content-Type": "application/ld+json" },
          body: JSON.stringify(ngsiData),
        });

        if (response.status === 409) {
          // Entity exists, try to update
          const { id, type, "@context": context, ...attrs } = ngsiData;
          response = await fetch(`${BROKER_URL}/ngsi-ld/v1/entities/${record.entity_id}/attrs`, {
            method: "PATCH",
            headers: { "Content-Type": "application/ld+json" },
            body: JSON.stringify({ ...attrs, "@context": context }),
          });
        }

        return { message: "Pushed successfully", entity_id: record.entity_id };
      } catch (error: any) {
        set.status = 500;
        return { error: `Failed to push to broker: ${error.message}` };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  // Push all to broker
  .post("/streetlights/push-all", async () => {
    const records = getAllStreetlights(0, 10000);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const record of records) {
      const ngsiData = toNgsiLd(record);

      try {
        let response = await fetch(`${BROKER_URL}/ngsi-ld/v1/entities`, {
          method: "POST",
          headers: { "Content-Type": "application/ld+json" },
          body: JSON.stringify(ngsiData),
        });

        if (response.status === 409) {
          const { id, type, "@context": context, ...attrs } = ngsiData;
          response = await fetch(`${BROKER_URL}/ngsi-ld/v1/entities/${record.entity_id}/attrs`, {
            method: "PATCH",
            headers: { "Content-Type": "application/ld+json" },
            body: JSON.stringify({ ...attrs, "@context": context }),
          });
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${record.entity_id}: ${error.message}`);
      }
    }

    return results;
  })
  // Get as NGSI-LD
  .get(
    "/streetlights/:id/ngsi-ld",
    ({ params, set }) => {
      const record = getStreetlightById(Number(params.id));
      if (!record) {
        set.status = 404;
        return { error: "Record not found" };
      }
      return toNgsiLd(record);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .listen(PORT);

console.log(`🦊 Public Lighting server is running at http://localhost:${PORT}`);
