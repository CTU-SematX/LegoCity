/**
 * LegoCity - Smart City Platform
 * @version 1.0
 * @author CTU·SematX
 * @copyright (c) 2025 CTU·SematX. All rights reserved
 * @license MIT License
 * @see https://github.com/CTU-SematX/LegoCity The LegoCity GitHub project
 */

// Water Supply
export interface WaterSupply {
  id: number;
  entity_id: string;
  entity_type: string;
  name: string;
  description: string | null;
  location_lon: number;
  location_lat: number;
  date_observed: string;
  water_pressure: number;
  flow_rate: number;
  chlorine_level: number;
  turbidity: number;
  ph: number;
  status: string;
  capacity: number;
  current_load: number;
  created_at: string;
  updated_at: string;
}

// Drainage
export interface Drainage {
  id: number;
  entity_id: string;
  entity_type: string;
  name: string;
  description: string | null;
  location_lon: number;
  location_lat: number;
  date_observed: string;
  water_level: number;
  flow_rate: number;
  status: string;
  capacity: number;
  current_load: number;
  pump_status: string;
  created_at: string;
  updated_at: string;
}

// Electricity Grid
export interface ElectricityGrid {
  id: number;
  entity_id: string;
  entity_type: string;
  name: string;
  description: string | null;
  location_lon: number;
  location_lat: number;
  date_observed: string;
  voltage: number;
  current: number;
  active_power: number;
  reactive_power: number;
  power_factor: number;
  frequency: number;
  status: string;
  load_percentage: number;
  created_at: string;
  updated_at: string;
}

// Telecom
export interface Telecom {
  id: number;
  entity_id: string;
  entity_type: string;
  name: string;
  description: string | null;
  location_lon: number;
  location_lat: number;
  date_observed: string;
  technology: string;
  signal_strength: number;
  bandwidth: number;
  active_connections: number;
  max_connections: number;
  status: string;
  uptime: number;
  created_at: string;
  updated_at: string;
}

// Seed data types - plain JSON format
export interface WaterSupplySeed {
  stationId: string;
  name: string;
  description?: string;
  longitude: number;
  latitude: number;
  dateObserved: string;
  waterPressure: number;
  flowRate: number;
  chlorineLevel: number;
  turbidity: number;
  ph: number;
  status: string;
  capacity: number;
  currentLoad: number;
}

export interface DrainageSeed {
  stationId: string;
  name: string;
  description?: string;
  longitude: number;
  latitude: number;
  dateObserved: string;
  waterLevel: number;
  flowRate: number;
  status: string;
  capacity: number;
  currentLoad: number;
  pumpStatus: string;
}

export interface ElectricityGridSeed {
  stationId: string;
  name: string;
  description?: string;
  longitude: number;
  latitude: number;
  dateObserved: string;
  voltage: number;
  current: number;
  activePower: number;
  reactivePower: number;
  powerFactor: number;
  frequency: number;
  status: string;
  loadPercentage: number;
}

export interface TelecomSeed {
  stationId: string;
  name: string;
  description?: string;
  longitude: number;
  latitude: number;
  dateObserved: string;
  technology: string;
  signalStrength: number;
  bandwidth: number;
  activeConnections: number;
  maxConnections: number;
  status: string;
  uptime: number;
}

export interface InfrastructureData {
  waterSupply: WaterSupplySeed[];
  drainage: DrainageSeed[];
  electricityGrid: ElectricityGridSeed[];
  telecom: TelecomSeed[];
}
