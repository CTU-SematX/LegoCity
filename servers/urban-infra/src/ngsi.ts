/**
 * LegoCity - Smart City Platform
 * @version 1.0
 * @author CTU·SematX
 * @copyright (c) 2025 CTU·SematX. All rights reserved
 * @license MIT License
 * @see https://github.com/CTU-SematX/LegoCity The LegoCity GitHub project
 */

import type { WaterSupply, Drainage, ElectricityGrid, Telecom } from "./models";

export const NGSI_LD_CONTEXT = [
  "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
];

export function waterSupplyToNgsiLd(record: WaterSupply) {
  return {
    id: record.entity_id,
    type: record.entity_type,
    name: { type: "Property", value: record.name },
    description: { type: "Property", value: record.description || "" },
    location: {
      type: "GeoProperty",
      value: { type: "Point", coordinates: [record.location_lon, record.location_lat] },
    },
    dateObserved: { type: "Property", value: record.date_observed },
    waterPressure: { type: "Property", value: record.water_pressure, unitCode: "BAR" },
    flowRate: { type: "Property", value: record.flow_rate, unitCode: "LTR" },
    chlorineLevel: { type: "Property", value: record.chlorine_level },
    turbidity: { type: "Property", value: record.turbidity },
    pH: { type: "Property", value: record.ph },
    status: { type: "Property", value: record.status },
    capacity: { type: "Property", value: record.capacity },
    currentLoad: { type: "Property", value: record.current_load },
    "@context": NGSI_LD_CONTEXT,
  };
}

export function drainageToNgsiLd(record: Drainage) {
  return {
    id: record.entity_id,
    type: record.entity_type,
    name: { type: "Property", value: record.name },
    description: { type: "Property", value: record.description || "" },
    location: {
      type: "GeoProperty",
      value: { type: "Point", coordinates: [record.location_lon, record.location_lat] },
    },
    dateObserved: { type: "Property", value: record.date_observed },
    waterLevel: { type: "Property", value: record.water_level, unitCode: "MTR" },
    flowRate: { type: "Property", value: record.flow_rate, unitCode: "LTR" },
    status: { type: "Property", value: record.status },
    capacity: { type: "Property", value: record.capacity },
    currentLoad: { type: "Property", value: record.current_load },
    pumpStatus: { type: "Property", value: record.pump_status },
    "@context": NGSI_LD_CONTEXT,
  };
}

export function electricityGridToNgsiLd(record: ElectricityGrid) {
  return {
    id: record.entity_id,
    type: record.entity_type,
    name: { type: "Property", value: record.name },
    description: { type: "Property", value: record.description || "" },
    location: {
      type: "GeoProperty",
      value: { type: "Point", coordinates: [record.location_lon, record.location_lat] },
    },
    dateObserved: { type: "Property", value: record.date_observed },
    voltage: { type: "Property", value: record.voltage, unitCode: "VLT" },
    current: { type: "Property", value: record.current, unitCode: "AMP" },
    activePower: { type: "Property", value: record.active_power, unitCode: "KWT" },
    reactivePower: { type: "Property", value: record.reactive_power, unitCode: "K5" },
    powerFactor: { type: "Property", value: record.power_factor },
    frequency: { type: "Property", value: record.frequency, unitCode: "HTZ" },
    status: { type: "Property", value: record.status },
    loadPercentage: { type: "Property", value: record.load_percentage },
    "@context": NGSI_LD_CONTEXT,
  };
}

export function telecomToNgsiLd(record: Telecom) {
  return {
    id: record.entity_id,
    type: record.entity_type,
    name: { type: "Property", value: record.name },
    description: { type: "Property", value: record.description || "" },
    location: {
      type: "GeoProperty",
      value: { type: "Point", coordinates: [record.location_lon, record.location_lat] },
    },
    dateObserved: { type: "Property", value: record.date_observed },
    technology: { type: "Property", value: record.technology },
    signalStrength: { type: "Property", value: record.signal_strength, unitCode: "DBM" },
    bandwidth: { type: "Property", value: record.bandwidth, unitCode: "MHZ" },
    activeConnections: { type: "Property", value: record.active_connections },
    maxConnections: { type: "Property", value: record.max_connections },
    status: { type: "Property", value: record.status },
    uptime: { type: "Property", value: record.uptime },
    "@context": NGSI_LD_CONTEXT,
  };
}
