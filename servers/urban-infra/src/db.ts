import { Database } from "bun:sqlite";
import { readFileSync, existsSync } from "fs";
import type {
  WaterSupply,
  Drainage,
  ElectricityGrid,
  Telecom,
  WaterSupplySeed,
  DrainageSeed,
  ElectricityGridSeed,
  TelecomSeed,
  InfrastructureData,
} from "./models";

const DATA_PATH = process.env.DATA_PATH || "/data/infrastructure.json";

export const db = new Database("infrastructure.db");

export function initDb() {
  // Water Supply table
  db.run(`
    CREATE TABLE IF NOT EXISTS water_supply (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id TEXT UNIQUE NOT NULL,
      entity_type TEXT DEFAULT 'WaterSupply',
      name TEXT NOT NULL,
      description TEXT,
      location_lon REAL NOT NULL,
      location_lat REAL NOT NULL,
      date_observed TEXT,
      water_pressure REAL DEFAULT 0,
      flow_rate REAL DEFAULT 0,
      chlorine_level REAL DEFAULT 0,
      turbidity REAL DEFAULT 0,
      ph REAL DEFAULT 7,
      status TEXT,
      capacity REAL DEFAULT 0,
      current_load REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Drainage table
  db.run(`
    CREATE TABLE IF NOT EXISTS drainage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id TEXT UNIQUE NOT NULL,
      entity_type TEXT DEFAULT 'Drainage',
      name TEXT NOT NULL,
      description TEXT,
      location_lon REAL NOT NULL,
      location_lat REAL NOT NULL,
      date_observed TEXT,
      water_level REAL DEFAULT 0,
      flow_rate REAL DEFAULT 0,
      status TEXT,
      capacity REAL DEFAULT 0,
      current_load REAL DEFAULT 0,
      pump_status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Electricity Grid table
  db.run(`
    CREATE TABLE IF NOT EXISTS electricity_grid (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id TEXT UNIQUE NOT NULL,
      entity_type TEXT DEFAULT 'ElectricityGrid',
      name TEXT NOT NULL,
      description TEXT,
      location_lon REAL NOT NULL,
      location_lat REAL NOT NULL,
      date_observed TEXT,
      voltage REAL DEFAULT 0,
      current REAL DEFAULT 0,
      active_power REAL DEFAULT 0,
      reactive_power REAL DEFAULT 0,
      power_factor REAL DEFAULT 0,
      frequency REAL DEFAULT 50,
      status TEXT,
      load_percentage REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Telecom table
  db.run(`
    CREATE TABLE IF NOT EXISTS telecom (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id TEXT UNIQUE NOT NULL,
      entity_type TEXT DEFAULT 'Telecom',
      name TEXT NOT NULL,
      description TEXT,
      location_lon REAL NOT NULL,
      location_lat REAL NOT NULL,
      date_observed TEXT,
      technology TEXT,
      signal_strength REAL DEFAULT 0,
      bandwidth REAL DEFAULT 0,
      active_connections INTEGER DEFAULT 0,
      max_connections INTEGER DEFAULT 0,
      status TEXT,
      uptime REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function seedData() {
  if (!existsSync(DATA_PATH)) {
    console.log(`Seed data file not found: ${DATA_PATH}`);
    return;
  }

  const data = JSON.parse(readFileSync(DATA_PATH, "utf-8")) as InfrastructureData;

  // Seed each type from structured data
  for (const item of data.waterSupply || []) {
    seedWaterSupply(item);
  }
  for (const item of data.drainage || []) {
    seedDrainage(item);
  }
  for (const item of data.electricityGrid || []) {
    seedElectricityGrid(item);
  }
  for (const item of data.telecom || []) {
    seedTelecom(item);
  }
}

function seedWaterSupply(item: WaterSupplySeed) {
  const entityId = `urn:ngsi-ld:WaterSupply:${item.stationId}`;
  const count = db.query("SELECT COUNT(*) as count FROM water_supply WHERE entity_id = ?").get(entityId) as { count: number };
  if (count.count > 0) return;

  db.run(
    `INSERT INTO water_supply (entity_id, entity_type, name, description, location_lon, location_lat, date_observed, water_pressure, flow_rate, chlorine_level, turbidity, ph, status, capacity, current_load)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entityId,
    "WaterSupply",
    item.name,
    item.description || null,
    item.longitude,
    item.latitude,
    item.dateObserved,
    item.waterPressure,
    item.flowRate,
    item.chlorineLevel,
    item.turbidity,
    item.ph,
    item.status,
    item.capacity,
    item.currentLoad
  );
  console.log(`Seeded water supply: ${item.name}`);
}

function seedDrainage(item: DrainageSeed) {
  const entityId = `urn:ngsi-ld:Drainage:${item.stationId}`;
  const count = db.query("SELECT COUNT(*) as count FROM drainage WHERE entity_id = ?").get(entityId) as { count: number };
  if (count.count > 0) return;

  db.run(
    `INSERT INTO drainage (entity_id, entity_type, name, description, location_lon, location_lat, date_observed, water_level, flow_rate, status, capacity, current_load, pump_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entityId,
    "Drainage",
    item.name,
    item.description || null,
    item.longitude,
    item.latitude,
    item.dateObserved,
    item.waterLevel,
    item.flowRate,
    item.status,
    item.capacity,
    item.currentLoad,
    item.pumpStatus
  );
  console.log(`Seeded drainage: ${item.name}`);
}

function seedElectricityGrid(item: ElectricityGridSeed) {
  const entityId = `urn:ngsi-ld:ElectricityGrid:${item.stationId}`;
  const count = db.query("SELECT COUNT(*) as count FROM electricity_grid WHERE entity_id = ?").get(entityId) as { count: number };
  if (count.count > 0) return;

  db.run(
    `INSERT INTO electricity_grid (entity_id, entity_type, name, description, location_lon, location_lat, date_observed, voltage, current, active_power, reactive_power, power_factor, frequency, status, load_percentage)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entityId,
    "ElectricityGrid",
    item.name,
    item.description || null,
    item.longitude,
    item.latitude,
    item.dateObserved,
    item.voltage,
    item.current,
    item.activePower,
    item.reactivePower,
    item.powerFactor,
    item.frequency,
    item.status,
    item.loadPercentage
  );
  console.log(`Seeded electricity grid: ${item.name}`);
}

function seedTelecom(item: TelecomSeed) {
  const entityId = `urn:ngsi-ld:Telecom:${item.stationId}`;
  const count = db.query("SELECT COUNT(*) as count FROM telecom WHERE entity_id = ?").get(entityId) as { count: number };
  if (count.count > 0) return;

  db.run(
    `INSERT INTO telecom (entity_id, entity_type, name, description, location_lon, location_lat, date_observed, technology, signal_strength, bandwidth, active_connections, max_connections, status, uptime)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entityId,
    "Telecom",
    item.name,
    item.description || null,
    item.longitude,
    item.latitude,
    item.dateObserved,
    item.technology,
    item.signalStrength,
    item.bandwidth,
    item.activeConnections,
    item.maxConnections,
    item.status,
    item.uptime
  );
  console.log(`Seeded telecom: ${item.name}`);
}

// CRUD functions for each table
export const waterSupplyDb = {
  getAll: (skip = 0, limit = 100): WaterSupply[] =>
    db.query("SELECT * FROM water_supply LIMIT ? OFFSET ?").all(limit, skip) as WaterSupply[],
  getById: (id: number): WaterSupply | null =>
    db.query("SELECT * FROM water_supply WHERE id = ?").get(id) as WaterSupply | null,
  create: (data: any): WaterSupply => {
    const result = db.run(
      `INSERT INTO water_supply (entity_id, entity_type, name, description, location_lon, location_lat, date_observed, water_pressure, flow_rate, chlorine_level, turbidity, ph, status, capacity, current_load)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.entity_id, data.entity_type || "WaterSupply", data.name, data.description, data.location_lon, data.location_lat,
      data.date_observed, data.water_pressure, data.flow_rate, data.chlorine_level, data.turbidity, data.ph, data.status, data.capacity, data.current_load
    );
    return waterSupplyDb.getById(Number(result.lastInsertRowid))!;
  },
  update: (id: number, data: any): WaterSupply | null => {
    const existing = waterSupplyDb.getById(id);
    if (!existing) return null;
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) { fields.push(`${key} = ?`); values.push(value); }
    }
    if (fields.length === 0) return existing;
    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    db.run(`UPDATE water_supply SET ${fields.join(", ")} WHERE id = ?`, ...values);
    return waterSupplyDb.getById(id);
  },
  delete: (id: number): boolean => {
    const existing = waterSupplyDb.getById(id);
    if (!existing) return false;
    db.run("DELETE FROM water_supply WHERE id = ?", id);
    return true;
  },
};

export const drainageDb = {
  getAll: (skip = 0, limit = 100): Drainage[] =>
    db.query("SELECT * FROM drainage LIMIT ? OFFSET ?").all(limit, skip) as Drainage[],
  getById: (id: number): Drainage | null =>
    db.query("SELECT * FROM drainage WHERE id = ?").get(id) as Drainage | null,
  create: (data: any): Drainage => {
    const result = db.run(
      `INSERT INTO drainage (entity_id, entity_type, name, description, location_lon, location_lat, date_observed, water_level, flow_rate, status, capacity, current_load, pump_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.entity_id, data.entity_type || "Drainage", data.name, data.description, data.location_lon, data.location_lat,
      data.date_observed, data.water_level, data.flow_rate, data.status, data.capacity, data.current_load, data.pump_status
    );
    return drainageDb.getById(Number(result.lastInsertRowid))!;
  },
  update: (id: number, data: any): Drainage | null => {
    const existing = drainageDb.getById(id);
    if (!existing) return null;
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) { fields.push(`${key} = ?`); values.push(value); }
    }
    if (fields.length === 0) return existing;
    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    db.run(`UPDATE drainage SET ${fields.join(", ")} WHERE id = ?`, ...values);
    return drainageDb.getById(id);
  },
  delete: (id: number): boolean => {
    const existing = drainageDb.getById(id);
    if (!existing) return false;
    db.run("DELETE FROM drainage WHERE id = ?", id);
    return true;
  },
};

export const electricityGridDb = {
  getAll: (skip = 0, limit = 100): ElectricityGrid[] =>
    db.query("SELECT * FROM electricity_grid LIMIT ? OFFSET ?").all(limit, skip) as ElectricityGrid[],
  getById: (id: number): ElectricityGrid | null =>
    db.query("SELECT * FROM electricity_grid WHERE id = ?").get(id) as ElectricityGrid | null,
  create: (data: any): ElectricityGrid => {
    const result = db.run(
      `INSERT INTO electricity_grid (entity_id, entity_type, name, description, location_lon, location_lat, date_observed, voltage, current, active_power, reactive_power, power_factor, frequency, status, load_percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.entity_id, data.entity_type || "ElectricityGrid", data.name, data.description, data.location_lon, data.location_lat,
      data.date_observed, data.voltage, data.current, data.active_power, data.reactive_power, data.power_factor, data.frequency, data.status, data.load_percentage
    );
    return electricityGridDb.getById(Number(result.lastInsertRowid))!;
  },
  update: (id: number, data: any): ElectricityGrid | null => {
    const existing = electricityGridDb.getById(id);
    if (!existing) return null;
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) { fields.push(`${key} = ?`); values.push(value); }
    }
    if (fields.length === 0) return existing;
    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    db.run(`UPDATE electricity_grid SET ${fields.join(", ")} WHERE id = ?`, ...values);
    return electricityGridDb.getById(id);
  },
  delete: (id: number): boolean => {
    const existing = electricityGridDb.getById(id);
    if (!existing) return false;
    db.run("DELETE FROM electricity_grid WHERE id = ?", id);
    return true;
  },
};

export const telecomDb = {
  getAll: (skip = 0, limit = 100): Telecom[] =>
    db.query("SELECT * FROM telecom LIMIT ? OFFSET ?").all(limit, skip) as Telecom[],
  getById: (id: number): Telecom | null =>
    db.query("SELECT * FROM telecom WHERE id = ?").get(id) as Telecom | null,
  create: (data: any): Telecom => {
    const result = db.run(
      `INSERT INTO telecom (entity_id, entity_type, name, description, location_lon, location_lat, date_observed, technology, signal_strength, bandwidth, active_connections, max_connections, status, uptime)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.entity_id, data.entity_type || "Telecom", data.name, data.description, data.location_lon, data.location_lat,
      data.date_observed, data.technology, data.signal_strength, data.bandwidth, data.active_connections, data.max_connections, data.status, data.uptime
    );
    return telecomDb.getById(Number(result.lastInsertRowid))!;
  },
  update: (id: number, data: any): Telecom | null => {
    const existing = telecomDb.getById(id);
    if (!existing) return null;
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) { fields.push(`${key} = ?`); values.push(value); }
    }
    if (fields.length === 0) return existing;
    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    db.run(`UPDATE telecom SET ${fields.join(", ")} WHERE id = ?`, ...values);
    return telecomDb.getById(id);
  },
  delete: (id: number): boolean => {
    const existing = telecomDb.getById(id);
    if (!existing) return false;
    db.run("DELETE FROM telecom WHERE id = ?", id);
    return true;
  },
};
