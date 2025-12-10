/**
 * LegoCity - Weather Data Server
 * Auto-updating weather data server with realistic linear data generation
 *
 * @version 1.0.0
 * @author CTU·SematX
 * @copyright (c) 2025 CTU·SematX. All rights reserved
 * @license MIT License
 * @see https://github.com/CTU-SematX/LegoCity
 */

import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";

const PORT = process.env.PORT || 8005;
const BROKER_URL = process.env.BROKER_URL || "http://localhost:1026";

// ============================================================================
// Data Configuration - Realistic limits for Ho Chi Minh City
// ============================================================================

interface WeatherLimits {
  temperature: { min: number; max: number; change: number };
  humidity: { min: number; max: number; change: number };
  windSpeed: { min: number; max: number; change: number };
  windDirection: { min: number; max: number; change: number };
  atmosphericPressure: { min: number; max: number; change: number };
  precipitation: { min: number; max: number; change: number };
}

interface AirQualityLimits {
  pm25: { min: number; max: number; change: number };
  pm10: { min: number; max: number; change: number };
  no2: { min: number; max: number; change: number };
  so2: { min: number; max: number; change: number };
  co: { min: number; max: number; change: number };
  o3: { min: number; max: number; change: number };
}

// HCMC typical weather ranges
const WEATHER_LIMITS: WeatherLimits = {
  temperature: { min: 24, max: 38, change: 0.5 },      // °C
  humidity: { min: 50, max: 95, change: 2 },           // %
  windSpeed: { min: 0, max: 30, change: 2 },           // km/h
  windDirection: { min: 0, max: 360, change: 15 },     // degrees
  atmosphericPressure: { min: 1005, max: 1020, change: 1 }, // hPa
  precipitation: { min: 0, max: 50, change: 5 },       // mm
};

// Air quality index ranges
const AQ_LIMITS: AirQualityLimits = {
  pm25: { min: 10, max: 150, change: 5 },    // µg/m³
  pm10: { min: 20, max: 200, change: 8 },    // µg/m³
  no2: { min: 5, max: 100, change: 3 },      // ppb
  so2: { min: 2, max: 50, change: 2 },       // ppb
  co: { min: 0.1, max: 5, change: 0.2 },     // ppm
  o3: { min: 20, max: 120, change: 5 },      // ppb
};

// ============================================================================
// In-Memory Data Store
// ============================================================================

interface WeatherData {
  id: string;
  name: string;
  location: { lat: number; lon: number };
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  atmosphericPressure: number;
  precipitation: number;
  observedAt: string;
}

interface AirQualityData {
  id: string;
  name: string;
  location: { lat: number; lon: number };
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  aqi: number;
  aqiCategory: string;
  observedAt: string;
}

// Initial data - will be loaded from broker or seeded
let weatherStations: WeatherData[] = [
  { id: "urn:ngsi-ld:WeatherObserved:HCMC:station-01", name: "District 1 Station", location: { lat: 10.7769, lon: 106.7009 }, temperature: 32.5, humidity: 75, windSpeed: 12, windDirection: 180, atmosphericPressure: 1013, precipitation: 0, observedAt: new Date().toISOString() },
  { id: "urn:ngsi-ld:WeatherObserved:HCMC:station-02", name: "Tan Binh Station", location: { lat: 10.8231, lon: 106.6297 }, temperature: 31.8, humidity: 78, windSpeed: 10, windDirection: 195, atmosphericPressure: 1012, precipitation: 0, observedAt: new Date().toISOString() },
  { id: "urn:ngsi-ld:WeatherObserved:HCMC:station-03", name: "District 5 Station", location: { lat: 10.7503, lon: 106.6625 }, temperature: 33.1, humidity: 72, windSpeed: 8, windDirection: 170, atmosphericPressure: 1014, precipitation: 0, observedAt: new Date().toISOString() },
  { id: "urn:ngsi-ld:WeatherObserved:HCMC:station-04", name: "Thu Duc Station", location: { lat: 10.8488, lon: 106.7719 }, temperature: 30.2, humidity: 82, windSpeed: 15, windDirection: 210, atmosphericPressure: 1011, precipitation: 0.5, observedAt: new Date().toISOString() },
  { id: "urn:ngsi-ld:WeatherObserved:HCMC:station-05", name: "Binh Thanh Station", location: { lat: 10.7295, lon: 106.7217 }, temperature: 32.0, humidity: 76, windSpeed: 11, windDirection: 185, atmosphericPressure: 1013, precipitation: 0, observedAt: new Date().toISOString() },
];

let airQualityStations: AirQualityData[] = [
  { id: "urn:ngsi-ld:AirQualityObserved:HCMC:aq-01", name: "District 1 AQ Station", location: { lat: 10.7769, lon: 106.7009 }, pm25: 45, pm10: 68, no2: 28, so2: 12, co: 0.8, o3: 42, aqi: 85, aqiCategory: "Moderate", observedAt: new Date().toISOString() },
  { id: "urn:ngsi-ld:AirQualityObserved:HCMC:aq-02", name: "Tan Binh AQ Station", location: { lat: 10.8231, lon: 106.6297 }, pm25: 52, pm10: 75, no2: 35, so2: 15, co: 1.1, o3: 38, aqi: 95, aqiCategory: "Moderate", observedAt: new Date().toISOString() },
  { id: "urn:ngsi-ld:AirQualityObserved:HCMC:aq-03", name: "District 5 AQ Station", location: { lat: 10.7503, lon: 106.6625 }, pm25: 38, pm10: 55, no2: 22, so2: 10, co: 0.6, o3: 48, aqi: 72, aqiCategory: "Moderate", observedAt: new Date().toISOString() },
  { id: "urn:ngsi-ld:AirQualityObserved:HCMC:aq-04", name: "Thu Duc AQ Station", location: { lat: 10.8488, lon: 106.7719 }, pm25: 28, pm10: 42, no2: 18, so2: 8, co: 0.4, o3: 55, aqi: 58, aqiCategory: "Good", observedAt: new Date().toISOString() },
  { id: "urn:ngsi-ld:AirQualityObserved:HCMC:aq-05", name: "Binh Thanh AQ Station", location: { lat: 10.7295, lon: 106.7217 }, pm25: 48, pm10: 70, no2: 30, so2: 14, co: 0.9, o3: 40, aqi: 88, aqiCategory: "Moderate", observedAt: new Date().toISOString() },
];

// ============================================================================
// Auto-Update State
// ============================================================================

interface AutoUpdateState {
  enabled: boolean;
  intervalMs: number;
  timer: ReturnType<typeof setInterval> | null;
  lastUpdate: string | null;
  updateCount: number;
}

const autoUpdateState: AutoUpdateState = {
  enabled: false,
  intervalMs: 30000, // 30 seconds default
  timer: null,
  lastUpdate: null,
  updateCount: 0,
};

// ============================================================================
// Linear Data Generation Functions
// ============================================================================

/**
 * Generate next value using linear interpolation with random walk
 * Ensures values stay within realistic limits
 */
function linearStep(
  current: number,
  limits: { min: number; max: number; change: number }
): number {
  // Random direction: -1, 0, or 1
  const direction = Math.random() < 0.3 ? 0 : Math.random() < 0.5 ? -1 : 1;
  
  // Random step size (0 to max change)
  const step = Math.random() * limits.change * direction;
  
  // Apply step
  let next = current + step;
  
  // Clamp to limits
  next = Math.max(limits.min, Math.min(limits.max, next));
  
  // Round to 1 decimal place
  return Math.round(next * 10) / 10;
}

/**
 * Calculate AQI from PM2.5 (simplified US EPA formula)
 */
function calculateAQI(pm25: number): { aqi: number; category: string } {
  let aqi: number;
  let category: string;
  
  if (pm25 <= 12) {
    aqi = Math.round((50 / 12) * pm25);
    category = "Good";
  } else if (pm25 <= 35.4) {
    aqi = Math.round(50 + ((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1));
    category = "Moderate";
  } else if (pm25 <= 55.4) {
    aqi = Math.round(100 + ((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5));
    category = "Unhealthy for Sensitive";
  } else if (pm25 <= 150.4) {
    aqi = Math.round(150 + ((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5));
    category = "Unhealthy";
  } else {
    aqi = Math.round(200 + ((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5));
    category = "Very Unhealthy";
  }
  
  return { aqi: Math.min(500, Math.max(0, aqi)), category };
}

/**
 * Update all weather stations with new values
 */
function updateWeatherData(): void {
  const now = new Date().toISOString();
  
  weatherStations = weatherStations.map((station) => ({
    ...station,
    temperature: linearStep(station.temperature, WEATHER_LIMITS.temperature),
    humidity: linearStep(station.humidity, WEATHER_LIMITS.humidity),
    windSpeed: linearStep(station.windSpeed, WEATHER_LIMITS.windSpeed),
    windDirection: linearStep(station.windDirection, WEATHER_LIMITS.windDirection),
    atmosphericPressure: linearStep(station.atmosphericPressure, WEATHER_LIMITS.atmosphericPressure),
    precipitation: linearStep(station.precipitation, WEATHER_LIMITS.precipitation),
    observedAt: now,
  }));
}

/**
 * Update all air quality stations with new values
 */
function updateAirQualityData(): void {
  const now = new Date().toISOString();
  
  airQualityStations = airQualityStations.map((station) => {
    const newPm25 = linearStep(station.pm25, AQ_LIMITS.pm25);
    const { aqi, category } = calculateAQI(newPm25);
    
    return {
      ...station,
      pm25: newPm25,
      pm10: linearStep(station.pm10, AQ_LIMITS.pm10),
      no2: linearStep(station.no2, AQ_LIMITS.no2),
      so2: linearStep(station.so2, AQ_LIMITS.so2),
      co: linearStep(station.co, AQ_LIMITS.co),
      o3: linearStep(station.o3, AQ_LIMITS.o3),
      aqi,
      aqiCategory: category,
      observedAt: now,
    };
  });
}

// ============================================================================
// Broker Communication
// ============================================================================

/**
 * Convert weather data to NGSI-LD format
 */
function weatherToNgsiLd(data: WeatherData): object {
  return {
    "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    id: data.id,
    type: "WeatherObserved",
    name: { type: "Property", value: data.name },
    location: {
      type: "GeoProperty",
      value: {
        type: "Point",
        coordinates: [data.location.lon, data.location.lat],
      },
    },
    temperature: { type: "Property", value: data.temperature, unitCode: "CEL" },
    humidity: { type: "Property", value: data.humidity, unitCode: "P1" },
    windSpeed: { type: "Property", value: data.windSpeed, unitCode: "KMH" },
    windDirection: { type: "Property", value: data.windDirection, unitCode: "DD" },
    atmosphericPressure: { type: "Property", value: data.atmosphericPressure, unitCode: "HPA" },
    precipitation: { type: "Property", value: data.precipitation, unitCode: "MMT" },
    observedAt: { type: "Property", value: { "@type": "DateTime", "@value": data.observedAt } },
  };
}

/**
 * Convert air quality data to NGSI-LD format
 */
function airQualityToNgsiLd(data: AirQualityData): object {
  return {
    "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    id: data.id,
    type: "AirQualityObserved",
    name: { type: "Property", value: data.name },
    location: {
      type: "GeoProperty",
      value: {
        type: "Point",
        coordinates: [data.location.lon, data.location.lat],
      },
    },
    pm25: { type: "Property", value: data.pm25, unitCode: "GQ" },
    pm10: { type: "Property", value: data.pm10, unitCode: "GQ" },
    no2: { type: "Property", value: data.no2, unitCode: "GQ" },
    so2: { type: "Property", value: data.so2, unitCode: "GQ" },
    co: { type: "Property", value: data.co, unitCode: "GQ" },
    o3: { type: "Property", value: data.o3, unitCode: "GQ" },
    aqi: { type: "Property", value: data.aqi },
    aqiCategory: { type: "Property", value: data.aqiCategory },
    observedAt: { type: "Property", value: { "@type": "DateTime", "@value": data.observedAt } },
  };
}

/**
 * Push entity to broker (upsert)
 */
async function pushToBroker(ngsiData: object): Promise<boolean> {
  const entityId = (ngsiData as { id: string }).id;
  
  try {
    // Try CREATE first
    let response = await fetch(`${BROKER_URL}/ngsi-ld/v1/entities`, {
      method: "POST",
      headers: { "Content-Type": "application/ld+json" },
      body: JSON.stringify(ngsiData),
    });

    if (response.status === 409) {
      // Already exists, try UPDATE
      const { id, type, "@context": context, ...attrs } = ngsiData as any;
      response = await fetch(`${BROKER_URL}/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}/attrs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({ ...attrs, "@context": context }),
      });
    }

    return response.ok || response.status === 204;
  } catch (e) {
    console.error(`Failed to push ${entityId}:`, e);
    return false;
  }
}

/**
 * Push all data to broker
 */
async function pushAllToBroker(): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Push weather data
  for (const station of weatherStations) {
    if (await pushToBroker(weatherToNgsiLd(station))) {
      success++;
    } else {
      failed++;
    }
  }

  // Push air quality data
  for (const station of airQualityStations) {
    if (await pushToBroker(airQualityToNgsiLd(station))) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

// ============================================================================
// Auto-Update Controller
// ============================================================================

/**
 * Perform one update cycle
 */
async function performUpdate(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Performing auto-update...`);
  
  // Generate new data
  updateWeatherData();
  updateAirQualityData();
  
  // Push to broker
  const result = await pushAllToBroker();
  
  autoUpdateState.lastUpdate = new Date().toISOString();
  autoUpdateState.updateCount++;
  
  console.log(`  Updated ${result.success} entities, ${result.failed} failed`);
}

/**
 * Start auto-update timer
 */
function startAutoUpdate(): void {
  if (autoUpdateState.timer) {
    clearInterval(autoUpdateState.timer);
  }
  
  autoUpdateState.enabled = true;
  autoUpdateState.timer = setInterval(performUpdate, autoUpdateState.intervalMs);
  
  // Perform immediate update
  performUpdate();
  
  console.log(`Auto-update started with interval: ${autoUpdateState.intervalMs}ms`);
}

/**
 * Stop auto-update timer
 */
function stopAutoUpdate(): void {
  if (autoUpdateState.timer) {
    clearInterval(autoUpdateState.timer);
    autoUpdateState.timer = null;
  }
  
  autoUpdateState.enabled = false;
  console.log("Auto-update stopped");
}

// ============================================================================
// Elysia App
// ============================================================================

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "LegoCity Weather Server",
          description: `
## 🌤️ Weather Data Server with Auto-Update

This server provides realistic weather and air quality data that auto-updates at configurable intervals.

### Features:
- **Realistic data generation** using linear interpolation
- **Auto-update mode** to simulate real sensors
- **Configurable interval** (default 30 seconds)
- **Direct broker integration** for NGSI-LD updates

### Data Types:
- **WeatherObserved**: Temperature, humidity, wind, pressure, precipitation
- **AirQualityObserved**: PM2.5, PM10, NO2, SO2, CO, O3, AQI

### How it works:
1. Each value changes by a small random amount each update
2. Values stay within realistic limits for Ho Chi Minh City
3. AQI is calculated from PM2.5 using US EPA formula
`,
          version: "1.0.0",
          contact: {
            name: "CTU·SematX",
            url: "https://github.com/CTU-SematX/LegoCity",
          },
        },
        tags: [
          { name: "Info", description: "Server status and configuration" },
          { name: "Auto-Update", description: "Control automatic data updates" },
          { name: "Weather", description: "Weather observation data" },
          { name: "AirQuality", description: "Air quality observation data" },
        ],
      },
    })
  )

  // ========== Info Endpoints ==========
  .get(
    "/",
    () => ({
      status: "ok",
      service: "legocity-weather-server",
      version: "1.0.0",
      broker: BROKER_URL,
      autoUpdate: {
        enabled: autoUpdateState.enabled,
        intervalMs: autoUpdateState.intervalMs,
        lastUpdate: autoUpdateState.lastUpdate,
        updateCount: autoUpdateState.updateCount,
      },
      stations: {
        weather: weatherStations.length,
        airQuality: airQualityStations.length,
      },
      timestamp: new Date().toISOString(),
      docs: "/swagger",
    }),
    {
      detail: {
        tags: ["Info"],
        summary: "Health check and server status",
      },
    }
  )

  // ========== Auto-Update Control ==========
  .post(
    "/auto-update/start",
    ({ body }) => {
      if (body.intervalMs) {
        autoUpdateState.intervalMs = body.intervalMs;
      }
      startAutoUpdate();
      return {
        success: true,
        message: "Auto-update started",
        intervalMs: autoUpdateState.intervalMs,
      };
    },
    {
      body: t.Object({
        intervalMs: t.Optional(
          t.Number({
            description: "Update interval in milliseconds (min 5000, max 300000)",
            minimum: 5000,
            maximum: 300000,
            default: 30000,
          })
        ),
      }),
      detail: {
        tags: ["Auto-Update"],
        summary: "Start auto-update mode",
        description: "Start automatic data updates at the specified interval. Default is 30 seconds.",
      },
    }
  )

  .post(
    "/auto-update/stop",
    () => {
      stopAutoUpdate();
      return {
        success: true,
        message: "Auto-update stopped",
      };
    },
    {
      detail: {
        tags: ["Auto-Update"],
        summary: "Stop auto-update mode",
        description: "Stop automatic data updates.",
      },
    }
  )

  .get(
    "/auto-update/status",
    () => ({
      enabled: autoUpdateState.enabled,
      intervalMs: autoUpdateState.intervalMs,
      lastUpdate: autoUpdateState.lastUpdate,
      updateCount: autoUpdateState.updateCount,
    }),
    {
      detail: {
        tags: ["Auto-Update"],
        summary: "Get auto-update status",
        description: "Check current auto-update configuration and statistics.",
      },
    }
  )

  .post(
    "/auto-update/trigger",
    async () => {
      updateWeatherData();
      updateAirQualityData();
      const result = await pushAllToBroker();
      autoUpdateState.lastUpdate = new Date().toISOString();
      autoUpdateState.updateCount++;
      return {
        success: true,
        message: "Manual update triggered",
        result,
        timestamp: autoUpdateState.lastUpdate,
      };
    },
    {
      detail: {
        tags: ["Auto-Update"],
        summary: "Trigger manual update",
        description: "Manually trigger one update cycle regardless of auto-update status.",
      },
    }
  )

  // ========== Weather Endpoints ==========
  .get(
    "/weather",
    () => ({
      count: weatherStations.length,
      data: weatherStations,
    }),
    {
      detail: {
        tags: ["Weather"],
        summary: "Get all weather stations",
        description: "Returns current data from all weather observation stations.",
      },
    }
  )

  .get(
    "/weather/:id",
    ({ params, set }) => {
      const station = weatherStations.find((s) => s.id === params.id || s.id.endsWith(params.id));
      if (!station) {
        set.status = 404;
        return { error: "Weather station not found" };
      }
      return station;
    },
    {
      params: t.Object({
        id: t.String({ description: "Station ID (full URN or short ID like station-01)" }),
      }),
      detail: {
        tags: ["Weather"],
        summary: "Get weather station by ID",
      },
    }
  )

  .patch(
    "/weather/:id",
    ({ params, body, set }) => {
      const index = weatherStations.findIndex((s) => s.id === params.id || s.id.endsWith(params.id));
      if (index === -1) {
        set.status = 404;
        return { error: "Weather station not found" };
      }
      
      weatherStations[index] = {
        ...weatherStations[index],
        ...body,
        observedAt: new Date().toISOString(),
      };
      
      return { success: true, data: weatherStations[index] };
    },
    {
      params: t.Object({
        id: t.String({ description: "Station ID" }),
      }),
      body: t.Object({
        temperature: t.Optional(t.Number({ description: "Temperature (°C)", minimum: 0, maximum: 50 })),
        humidity: t.Optional(t.Number({ description: "Humidity (%)", minimum: 0, maximum: 100 })),
        windSpeed: t.Optional(t.Number({ description: "Wind speed (km/h)", minimum: 0, maximum: 200 })),
        windDirection: t.Optional(t.Number({ description: "Wind direction (°)", minimum: 0, maximum: 360 })),
        atmosphericPressure: t.Optional(t.Number({ description: "Pressure (hPa)", minimum: 900, maximum: 1100 })),
        precipitation: t.Optional(t.Number({ description: "Precipitation (mm)", minimum: 0 })),
      }),
      detail: {
        tags: ["Weather"],
        summary: "Update weather station data",
        description: "Manually update weather data for a specific station.",
      },
    }
  )

  // ========== Air Quality Endpoints ==========
  .get(
    "/air-quality",
    () => ({
      count: airQualityStations.length,
      data: airQualityStations,
    }),
    {
      detail: {
        tags: ["AirQuality"],
        summary: "Get all air quality stations",
        description: "Returns current data from all air quality monitoring stations.",
      },
    }
  )

  .get(
    "/air-quality/:id",
    ({ params, set }) => {
      const station = airQualityStations.find((s) => s.id === params.id || s.id.endsWith(params.id));
      if (!station) {
        set.status = 404;
        return { error: "Air quality station not found" };
      }
      return station;
    },
    {
      params: t.Object({
        id: t.String({ description: "Station ID (full URN or short ID like aq-01)" }),
      }),
      detail: {
        tags: ["AirQuality"],
        summary: "Get air quality station by ID",
      },
    }
  )

  .patch(
    "/air-quality/:id",
    ({ params, body, set }) => {
      const index = airQualityStations.findIndex((s) => s.id === params.id || s.id.endsWith(params.id));
      if (index === -1) {
        set.status = 404;
        return { error: "Air quality station not found" };
      }
      
      // Recalculate AQI if PM2.5 changed
      const newPm25 = body.pm25 ?? airQualityStations[index].pm25;
      const { aqi, category } = calculateAQI(newPm25);
      
      airQualityStations[index] = {
        ...airQualityStations[index],
        ...body,
        aqi,
        aqiCategory: category,
        observedAt: new Date().toISOString(),
      };
      
      return { success: true, data: airQualityStations[index] };
    },
    {
      params: t.Object({
        id: t.String({ description: "Station ID" }),
      }),
      body: t.Object({
        pm25: t.Optional(t.Number({ description: "PM2.5 (µg/m³)", minimum: 0 })),
        pm10: t.Optional(t.Number({ description: "PM10 (µg/m³)", minimum: 0 })),
        no2: t.Optional(t.Number({ description: "NO2 (ppb)", minimum: 0 })),
        so2: t.Optional(t.Number({ description: "SO2 (ppb)", minimum: 0 })),
        co: t.Optional(t.Number({ description: "CO (ppm)", minimum: 0 })),
        o3: t.Optional(t.Number({ description: "O3 (ppb)", minimum: 0 })),
      }),
      detail: {
        tags: ["AirQuality"],
        summary: "Update air quality station data",
        description: "Manually update air quality data for a specific station. AQI is recalculated automatically.",
      },
    }
  )

  .listen(PORT);

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           LegoCity Weather Server                             ║
╠═══════════════════════════════════════════════════════════════╣
║  Status:    Running                                           ║
║  Port:      ${String(PORT).padEnd(48)}║
║  Broker:    ${BROKER_URL.padEnd(48)}║
║  Swagger:   http://localhost:${PORT}/swagger                        ║
║                                                               ║
║  Auto-update: OFF (use /auto-update/start to enable)          ║
╚═══════════════════════════════════════════════════════════════╝
`);

export type App = typeof app;
