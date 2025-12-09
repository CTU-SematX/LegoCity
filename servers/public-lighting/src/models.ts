/**
 * LegoCity - Smart City Platform
 * @version 1.0
 * @author CTU·SematX
 * @copyright (c) 2025 CTU·SematX. All rights reserved
 * @license MIT License
 * @see https://github.com/CTU-SematX/LegoCity The LegoCity GitHub project
 */

export interface Streetlight {
  id: number;
  entity_id: string;
  entity_type: string;
  name: string;
  description: string | null;
  location_lon: number;
  location_lat: number;
  status: string;
  power_state: string;
  date_last_switching_on: string | null;
  date_last_switching_off: string | null;
  illuminance_level: number;
  power_consumption: number;
  lantern_height: number;
  lamp_type: string;
  controlling_method: string;
  ref_streetlight_group: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreetlightCreate {
  entity_id: string;
  entity_type?: string;
  name: string;
  description?: string;
  location_lon: number;
  location_lat: number;
  status: string;
  power_state: string;
  date_last_switching_on?: string;
  date_last_switching_off?: string;
  illuminance_level: number;
  power_consumption: number;
  lantern_height: number;
  lamp_type: string;
  controlling_method: string;
  ref_streetlight_group?: string;
}

export interface StreetlightUpdate {
  name?: string;
  description?: string;
  location_lon?: number;
  location_lat?: number;
  status?: string;
  power_state?: string;
  date_last_switching_on?: string;
  date_last_switching_off?: string;
  illuminance_level?: number;
  power_consumption?: number;
  lantern_height?: number;
  lamp_type?: string;
  controlling_method?: string;
  ref_streetlight_group?: string;
}

export interface SeedData {
  lampId: string;
  name: string;
  description?: string;
  longitude: number;
  latitude: number;
  status: string;
  powerState: string;
  dateLastSwitchingOn?: string;
  dateLastSwitchingOff?: string;
  illuminanceLevel: number;
  powerConsumption: number;
  lanternHeight: number;
  lampType: string;
  controllingMethod: string;
  streetlightGroup?: string;
}
