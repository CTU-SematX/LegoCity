from datetime import datetime
from typing import Any

NGSI_LD_CONTEXT = [
    "https://raw.githubusercontent.com/smart-data-models/dataModel.Transportation/master/context.jsonld",
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
]


def parse_datetime(value: str | None) -> datetime | None:
    """Parse ISO datetime string to datetime object."""
    if not value:
        return None
    try:
        # Handle ISO format with Z suffix
        if value.endswith('Z'):
            value = value[:-1] + '+00:00'
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def to_ngsi_ld(record: Any) -> dict:
    """Convert a TrafficFlow record to NGSI-LD format."""
    return {
        "id": record.entity_id,
        "type": record.entity_type,
        "name": {
            "type": "Property",
            "value": record.name
        },
        "description": {
            "type": "Property",
            "value": record.description or ""
        },
        "location": {
            "type": "GeoProperty",
            "value": {
                "type": "Point",
                "coordinates": [record.location_lon, record.location_lat]
            }
        },
        "dateObserved": {
            "type": "Property",
            "value": record.date_observed.isoformat() + "Z" if record.date_observed else None
        },
        "intensity": {
            "type": "Property",
            "value": record.intensity
        },
        "occupancy": {
            "type": "Property",
            "value": record.occupancy
        },
        "averageVehicleSpeed": {
            "type": "Property",
            "value": record.average_vehicle_speed
        },
        "averageVehicleLength": {
            "type": "Property",
            "value": record.average_vehicle_length
        },
        "congested": {
            "type": "Property",
            "value": record.congested
        },
        "laneId": {
            "type": "Property",
            "value": record.lane_id
        },
        "refRoadSegment": {
            "type": "Relationship",
            "object": record.ref_road_segment
        } if record.ref_road_segment else None,
        "@context": NGSI_LD_CONTEXT
    }


def from_seed_data(data: dict) -> dict:
    """Convert plain JSON seed data to model fields."""
    return {
        "entity_id": f"urn:ngsi-ld:TrafficFlowObserved:{data.get('stationId', '')}",
        "entity_type": "TrafficFlowObserved",
        "name": data.get("name", ""),
        "description": data.get("description"),
        "location_lon": data.get("longitude", 0),
        "location_lat": data.get("latitude", 0),
        "date_observed": parse_datetime(data.get("dateObserved")),
        "intensity": data.get("intensity", 0),
        "occupancy": data.get("occupancy", 0),
        "average_vehicle_speed": data.get("averageVehicleSpeed", 0),
        "average_vehicle_length": data.get("averageVehicleLength", 0),
        "congested": data.get("congested", False),
        "lane_id": data.get("laneId", 1),
        "ref_road_segment": f"urn:ngsi-ld:RoadSegment:{data.get('roadSegment', '')}" if data.get("roadSegment") else None
    }
