/**
 * LegoCity - Smart City Platform
 * @version 1.0
 * @author CTU·SematX
 * @copyright (c) 2025 CTU·SematX. All rights reserved
 * @license MIT License
 * @see https://github.com/CTU-SematX/LegoCity The LegoCity GitHub project
 */

import type { Streetlight } from "./models";

export const NGSI_LD_CONTEXT = [
  "https://raw.githubusercontent.com/smart-data-models/dataModel.Streetlighting/master/context.jsonld",
  "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
];

export function toNgsiLd(record: Streetlight) {
  return {
    id: record.entity_id,
    type: record.entity_type,
    name: {
      type: "Property",
      value: record.name,
    },
    description: {
      type: "Property",
      value: record.description || "",
    },
    location: {
      type: "GeoProperty",
      value: {
        type: "Point",
        coordinates: [record.location_lon, record.location_lat],
      },
    },
    status: {
      type: "Property",
      value: record.status,
    },
    powerState: {
      type: "Property",
      value: record.power_state,
    },
    dateLastSwitchingOn: record.date_last_switching_on
      ? {
          type: "Property",
          value: record.date_last_switching_on,
        }
      : undefined,
    dateLastSwitchingOff: record.date_last_switching_off
      ? {
          type: "Property",
          value: record.date_last_switching_off,
        }
      : undefined,
    illuminanceLevel: {
      type: "Property",
      value: record.illuminance_level,
    },
    powerConsumption: {
      type: "Property",
      value: record.power_consumption,
    },
    lanternHeight: {
      type: "Property",
      value: record.lantern_height,
    },
    lampType: {
      type: "Property",
      value: record.lamp_type,
    },
    controllingMethod: {
      type: "Property",
      value: record.controlling_method,
    },
    refStreetlightGroup: record.ref_streetlight_group
      ? {
          type: "Relationship",
          object: record.ref_streetlight_group,
        }
      : undefined,
    "@context": NGSI_LD_CONTEXT,
  };
}
