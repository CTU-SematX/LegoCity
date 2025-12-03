import { Database } from "bun:sqlite";
import { readFileSync, existsSync } from "fs";
import type { Streetlight, SeedData } from "./models";

const DATA_PATH = process.env.DATA_PATH || "/data/lighting.json";

export const db = new Database("lighting.db");

export function initDb() {
  db.run(`
    CREATE TABLE IF NOT EXISTS streetlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id TEXT UNIQUE NOT NULL,
      entity_type TEXT DEFAULT 'Streetlight',
      name TEXT NOT NULL,
      description TEXT,
      location_lon REAL NOT NULL,
      location_lat REAL NOT NULL,
      status TEXT NOT NULL,
      power_state TEXT NOT NULL,
      date_last_switching_on TEXT,
      date_last_switching_off TEXT,
      illuminance_level REAL DEFAULT 0,
      power_consumption REAL DEFAULT 0,
      lantern_height REAL DEFAULT 0,
      lamp_type TEXT,
      controlling_method TEXT,
      ref_streetlight_group TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function seedData() {
  // Check if data already exists
  const count = db.query("SELECT COUNT(*) as count FROM streetlights").get() as { count: number };
  if (count.count > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  if (!existsSync(DATA_PATH)) {
    console.log(`Seed data file not found: ${DATA_PATH}`);
    return;
  }

  const data: SeedData[] = JSON.parse(readFileSync(DATA_PATH, "utf-8"));

  const insert = db.prepare(`
    INSERT INTO streetlights (
      entity_id, entity_type, name, description, location_lon, location_lat,
      status, power_state, date_last_switching_on, date_last_switching_off,
      illuminance_level, power_consumption, lantern_height, lamp_type,
      controlling_method, ref_streetlight_group
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of data) {
    insert.run(
      `urn:ngsi-ld:Streetlight:${item.lampId}`,
      "Streetlight",
      item.name,
      item.description || null,
      item.longitude,
      item.latitude,
      item.status,
      item.powerState,
      item.dateLastSwitchingOn || null,
      item.dateLastSwitchingOff || null,
      item.illuminanceLevel,
      item.powerConsumption,
      item.lanternHeight,
      item.lampType,
      item.controllingMethod,
      item.streetlightGroup ? `urn:ngsi-ld:StreetlightGroup:${item.streetlightGroup}` : null
    );
  }

  console.log(`Seeded ${data.length} streetlight records`);
}

export function getAllStreetlights(skip = 0, limit = 100): Streetlight[] {
  return db.query("SELECT * FROM streetlights LIMIT ? OFFSET ?").all(limit, skip) as Streetlight[];
}

export function getStreetlightById(id: number): Streetlight | null {
  return db.query("SELECT * FROM streetlights WHERE id = ?").get(id) as Streetlight | null;
}

export function createStreetlight(data: any): Streetlight {
  const result = db.run(`
    INSERT INTO streetlights (
      entity_id, entity_type, name, description, location_lon, location_lat,
      status, power_state, date_last_switching_on, date_last_switching_off,
      illuminance_level, power_consumption, lantern_height, lamp_type,
      controlling_method, ref_streetlight_group
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    data.entity_id,
    data.entity_type || "Streetlight",
    data.name,
    data.description || null,
    data.location_lon,
    data.location_lat,
    data.status,
    data.power_state,
    data.date_last_switching_on || null,
    data.date_last_switching_off || null,
    data.illuminance_level || 0,
    data.power_consumption || 0,
    data.lantern_height || 0,
    data.lamp_type || null,
    data.controlling_method || null,
    data.ref_streetlight_group || null
  );

  return getStreetlightById(Number(result.lastInsertRowid))!;
}

export function updateStreetlight(id: number, data: any): Streetlight | null {
  const existing = getStreetlightById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return existing;

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  db.run(`UPDATE streetlights SET ${fields.join(", ")} WHERE id = ?`, ...values);

  return getStreetlightById(id);
}

export function deleteStreetlight(id: number): boolean {
  const existing = getStreetlightById(id);
  if (!existing) return false;

  db.run("DELETE FROM streetlights WHERE id = ?", id);
  return true;
}
