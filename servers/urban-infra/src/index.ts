import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import {
  initDb,
  seedData,
  waterSupplyDb,
  drainageDb,
  electricityGridDb,
  telecomDb,
} from "./db";
import {
  waterSupplyToNgsiLd,
  drainageToNgsiLd,
  electricityGridToNgsiLd,
  telecomToNgsiLd,
} from "./ngsi";

const PORT = process.env.PORT || 8004;
const BROKER_URL = process.env.BROKER_URL || "http://localhost:1026";

// Initialize database and seed data
initDb();
seedData();

async function pushToBroker(ngsiData: any): Promise<boolean> {
  try {
    let response = await fetch(`${BROKER_URL}/ngsi-ld/v1/entities`, {
      method: "POST",
      headers: { "Content-Type": "application/ld+json" },
      body: JSON.stringify(ngsiData),
    });

    if (response.status === 409) {
      const { id, type, "@context": context, ...attrs } = ngsiData;
      response = await fetch(`${BROKER_URL}/ngsi-ld/v1/entities/${id}/attrs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({ ...attrs, "@context": context }),
      });
    }

    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Urban Infrastructure Server",
          description: "API quản lý dữ liệu hạ tầng kỹ thuật đô thị (NGSI-LD)",
          version: "1.0.0",
        },
        tags: [
          { name: "WaterSupply", description: "Cấp nước" },
          { name: "Drainage", description: "Thoát nước" },
          { name: "ElectricityGrid", description: "Điện lưới" },
          { name: "Telecom", description: "Viễn thông" },
        ],
      },
    })
  )
  // Health check
  .get("/", () => ({
    status: "ok",
    service: "urban-infra",
    timestamp: new Date().toISOString(),
  }))

  // ========== Water Supply ==========
  .get("/water-supply", ({ query }) => {
    const skip = Number(query.skip) || 0;
    const limit = Number(query.limit) || 100;
    return waterSupplyDb.getAll(skip, limit);
  }, { detail: { tags: ["WaterSupply"] } })

  .get("/water-supply/:id", ({ params, set }) => {
    const record = waterSupplyDb.getById(Number(params.id));
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    return record;
  }, { detail: { tags: ["WaterSupply"] } })

  .post("/water-supply", ({ body, set }) => {
    try {
      set.status = 201;
      return waterSupplyDb.create(body);
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }
  }, { detail: { tags: ["WaterSupply"] } })

  .put("/water-supply/:id", ({ params, body, set }) => {
    const record = waterSupplyDb.update(Number(params.id), body);
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    return record;
  }, { detail: { tags: ["WaterSupply"] } })

  .delete("/water-supply/:id", ({ params, set }) => {
    if (!waterSupplyDb.delete(Number(params.id))) { set.status = 404; return { error: "Record not found" }; }
    return { message: "Record deleted successfully" };
  }, { detail: { tags: ["WaterSupply"] } })

  .post("/water-supply/:id/push", async ({ params, set }) => {
    const record = waterSupplyDb.getById(Number(params.id));
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    const success = await pushToBroker(waterSupplyToNgsiLd(record));
    if (!success) { set.status = 500; return { error: "Failed to push to broker" }; }
    return { message: "Pushed successfully", entity_id: record.entity_id };
  }, { detail: { tags: ["WaterSupply"] } })

  .get("/water-supply/:id/ngsi-ld", ({ params, set }) => {
    const record = waterSupplyDb.getById(Number(params.id));
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    return waterSupplyToNgsiLd(record);
  }, { detail: { tags: ["WaterSupply"] } })

  // ========== Drainage ==========
  .get("/drainage", ({ query }) => {
    const skip = Number(query.skip) || 0;
    const limit = Number(query.limit) || 100;
    return drainageDb.getAll(skip, limit);
  }, { detail: { tags: ["Drainage"] } })

  .get("/drainage/:id", ({ params, set }) => {
    const record = drainageDb.getById(Number(params.id));
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    return record;
  }, { detail: { tags: ["Drainage"] } })

  .post("/drainage", ({ body, set }) => {
    try {
      set.status = 201;
      return drainageDb.create(body);
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }
  }, { detail: { tags: ["Drainage"] } })

  .put("/drainage/:id", ({ params, body, set }) => {
    const record = drainageDb.update(Number(params.id), body);
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    return record;
  }, { detail: { tags: ["Drainage"] } })

  .delete("/drainage/:id", ({ params, set }) => {
    if (!drainageDb.delete(Number(params.id))) { set.status = 404; return { error: "Record not found" }; }
    return { message: "Record deleted successfully" };
  }, { detail: { tags: ["Drainage"] } })

  .post("/drainage/:id/push", async ({ params, set }) => {
    const record = drainageDb.getById(Number(params.id));
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    const success = await pushToBroker(drainageToNgsiLd(record));
    if (!success) { set.status = 500; return { error: "Failed to push to broker" }; }
    return { message: "Pushed successfully", entity_id: record.entity_id };
  }, { detail: { tags: ["Drainage"] } })

  .get("/drainage/:id/ngsi-ld", ({ params, set }) => {
    const record = drainageDb.getById(Number(params.id));
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    return drainageToNgsiLd(record);
  }, { detail: { tags: ["Drainage"] } })

  // ========== Electricity Grid ==========
  .get("/electricity-grid", ({ query }) => {
    const skip = Number(query.skip) || 0;
    const limit = Number(query.limit) || 100;
    return electricityGridDb.getAll(skip, limit);
  }, { detail: { tags: ["ElectricityGrid"] } })

  .get("/electricity-grid/:id", ({ params, set }) => {
    const record = electricityGridDb.getById(Number(params.id));
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    return record;
  }, { detail: { tags: ["ElectricityGrid"] } })

  .post("/electricity-grid", ({ body, set }) => {
    try {
      set.status = 201;
      return electricityGridDb.create(body);
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }
  }, { detail: { tags: ["ElectricityGrid"] } })

  .put("/electricity-grid/:id", ({ params, body, set }) => {
    const record = electricityGridDb.update(Number(params.id), body);
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    return record;
  }, { detail: { tags: ["ElectricityGrid"] } })

  .delete("/electricity-grid/:id", ({ params, set }) => {
    if (!electricityGridDb.delete(Number(params.id))) { set.status = 404; return { error: "Record not found" }; }
    return { message: "Record deleted successfully" };
  }, { detail: { tags: ["ElectricityGrid"] } })

  .post("/electricity-grid/:id/push", async ({ params, set }) => {
    const record = electricityGridDb.getById(Number(params.id));
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    const success = await pushToBroker(electricityGridToNgsiLd(record));
    if (!success) { set.status = 500; return { error: "Failed to push to broker" }; }
    return { message: "Pushed successfully", entity_id: record.entity_id };
  }, { detail: { tags: ["ElectricityGrid"] } })

  .get("/electricity-grid/:id/ngsi-ld", ({ params, set }) => {
    const record = electricityGridDb.getById(Number(params.id));
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    return electricityGridToNgsiLd(record);
  }, { detail: { tags: ["ElectricityGrid"] } })

  // ========== Telecom ==========
  .get("/telecom", ({ query }) => {
    const skip = Number(query.skip) || 0;
    const limit = Number(query.limit) || 100;
    return telecomDb.getAll(skip, limit);
  }, { detail: { tags: ["Telecom"] } })

  .get("/telecom/:id", ({ params, set }) => {
    const record = telecomDb.getById(Number(params.id));
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    return record;
  }, { detail: { tags: ["Telecom"] } })

  .post("/telecom", ({ body, set }) => {
    try {
      set.status = 201;
      return telecomDb.create(body);
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }
  }, { detail: { tags: ["Telecom"] } })

  .put("/telecom/:id", ({ params, body, set }) => {
    const record = telecomDb.update(Number(params.id), body);
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    return record;
  }, { detail: { tags: ["Telecom"] } })

  .delete("/telecom/:id", ({ params, set }) => {
    if (!telecomDb.delete(Number(params.id))) { set.status = 404; return { error: "Record not found" }; }
    return { message: "Record deleted successfully" };
  }, { detail: { tags: ["Telecom"] } })

  .post("/telecom/:id/push", async ({ params, set }) => {
    const record = telecomDb.getById(Number(params.id));
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    const success = await pushToBroker(telecomToNgsiLd(record));
    if (!success) { set.status = 500; return { error: "Failed to push to broker" }; }
    return { message: "Pushed successfully", entity_id: record.entity_id };
  }, { detail: { tags: ["Telecom"] } })

  .get("/telecom/:id/ngsi-ld", ({ params, set }) => {
    const record = telecomDb.getById(Number(params.id));
    if (!record) { set.status = 404; return { error: "Record not found" }; }
    return telecomToNgsiLd(record);
  }, { detail: { tags: ["Telecom"] } })

  // ========== Push All ==========
  .post("/push-all", async () => {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    // Water Supply
    for (const record of waterSupplyDb.getAll(0, 10000)) {
      if (await pushToBroker(waterSupplyToNgsiLd(record))) results.success++;
      else { results.failed++; results.errors.push(record.entity_id); }
    }

    // Drainage
    for (const record of drainageDb.getAll(0, 10000)) {
      if (await pushToBroker(drainageToNgsiLd(record))) results.success++;
      else { results.failed++; results.errors.push(record.entity_id); }
    }

    // Electricity Grid
    for (const record of electricityGridDb.getAll(0, 10000)) {
      if (await pushToBroker(electricityGridToNgsiLd(record))) results.success++;
      else { results.failed++; results.errors.push(record.entity_id); }
    }

    // Telecom
    for (const record of telecomDb.getAll(0, 10000)) {
      if (await pushToBroker(telecomToNgsiLd(record))) results.success++;
      else { results.failed++; results.errors.push(record.entity_id); }
    }

    return results;
  })

  .listen(PORT);

console.log(`🏙️ Urban Infrastructure server is running at http://localhost:${PORT}`);
