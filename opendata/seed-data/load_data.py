#!/usr/bin/env python3
"""
LegoCity Data Loader
Parses CSV files from generatedData and upserts them as NGSI-LD entities to Context Broker.

@version 1.0
@author CTU·SematX
@copyright (c) 2025 CTU·SematX. All rights reserved
@license MIT License
"""

import csv
import json
import os
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

BROKER_URL = os.environ.get("BROKER_URL", "http://localhost:1026")
DATA_DIR = os.environ.get("DATA_DIR", "/data")
NGSI_LD_CONTEXT = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"

# Retry configuration
MAX_RETRIES = 30
RETRY_DELAY = 2


def wait_for_broker():
    """Wait for broker to be ready."""
    print(f"Waiting for broker at {BROKER_URL}...")
    for i in range(MAX_RETRIES):
        try:
            req = Request(f"{BROKER_URL}/version")
            with urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    print("Broker is ready!")
                    return True
        except (HTTPError, URLError, Exception) as e:
            print(f"Attempt {i+1}/{MAX_RETRIES}: Broker not ready ({e})")
            time.sleep(RETRY_DELAY)
    print("Failed to connect to broker after max retries")
    return False


def parse_location(location_str: str, entity_type: str) -> dict | None:
    """Parse location string to GeoJSON format."""
    if not location_str:
        return None
    
    # Handle "lat,lon" format (Point)
    if location_str.count(",") == 1 and "Polygon" not in location_str and "LineString" not in location_str:
        try:
            parts = location_str.replace('"', '').split(",")
            lat, lon = float(parts[0].strip()), float(parts[1].strip())
            return {
                "type": "GeoProperty",
                "value": {
                    "type": "Point",
                    "coordinates": [lon, lat]  # GeoJSON is [lon, lat]
                }
            }
        except (ValueError, IndexError):
            pass
    
    # Handle placeholder strings like "LineString with N points" or "Polygon with N vertices"
    if "LineString with" in location_str or "Polygon with" in location_str:
        # Generate dummy coordinates for demo purposes
        if "LineString" in location_str:
            return {
                "type": "GeoProperty",
                "value": {
                    "type": "LineString",
                    "coordinates": [[106.7, 10.8], [106.71, 10.81], [106.72, 10.82]]
                }
            }
        else:
            return {
                "type": "GeoProperty",
                "value": {
                    "type": "Polygon",
                    "coordinates": [[[106.7, 10.8], [106.71, 10.8], [106.71, 10.81], [106.7, 10.81], [106.7, 10.8]]]
                }
            }
    
    return None


def parse_observed_at(value: str) -> str | None:
    """Parse observedAt to ISO8601 string."""
    if not value:
        return None
    # Handle dict-like string from CSV
    if value.startswith("{"):
        try:
            # Parse Python dict literal
            import ast
            d = ast.literal_eval(value)
            return d.get("@value", value)
        except Exception:
            pass
    return value


def csv_row_to_ngsi_ld(row: dict, entity_type: str) -> dict | None:
    """Convert a CSV row to NGSI-LD entity format."""
    entity_id = row.get("id", "")
    if not entity_id:
        return None
    
    entity = {
        "@context": NGSI_LD_CONTEXT,
        "id": entity_id,
        "type": entity_type
    }
    
    # Process each field
    for key, value in row.items():
        if key in ("id", "type") or not value:
            continue
        
        # Handle location specially
        if key == "location":
            loc = parse_location(value, entity_type)
            if loc:
                entity["location"] = loc
            continue
        
        # Handle observedAt specially
        if key == "observedAt":
            obs = parse_observed_at(value)
            if obs:
                entity["observedAt"] = {
                    "type": "Property",
                    "value": {
                        "@type": "DateTime",
                        "@value": obs
                    }
                }
            continue
        
        # Handle boolean
        if value.lower() in ("true", "false"):
            entity[key] = {
                "type": "Property",
                "value": value.lower() == "true"
            }
            continue
        
        # Handle numeric
        try:
            if "." in value:
                entity[key] = {"type": "Property", "value": float(value)}
            else:
                entity[key] = {"type": "Property", "value": int(value)}
            continue
        except ValueError:
            pass
        
        # Default to string property
        entity[key] = {"type": "Property", "value": value}
    
    return entity


def upsert_entity(entity: dict) -> bool:
    """Upsert entity to broker (create or update)."""
    entity_id = entity["id"]
    headers = {
        "Content-Type": "application/ld+json",
        "Accept": "application/ld+json"
    }
    
    data = json.dumps(entity).encode("utf-8")
    
    # Try CREATE first
    try:
        req = Request(
            f"{BROKER_URL}/ngsi-ld/v1/entities",
            data=data,
            headers=headers,
            method="POST"
        )
        with urlopen(req, timeout=10) as resp:
            if resp.status in (200, 201):
                return True
    except HTTPError as e:
        if e.code == 409:  # Already exists, try UPDATE
            try:
                # Remove id, type, @context for PATCH
                attrs = {k: v for k, v in entity.items() if k not in ("id", "type", "@context")}
                attrs["@context"] = NGSI_LD_CONTEXT
                patch_data = json.dumps(attrs).encode("utf-8")
                
                req = Request(
                    f"{BROKER_URL}/ngsi-ld/v1/entities/{entity_id}/attrs",
                    data=patch_data,
                    headers=headers,
                    method="PATCH"
                )
                with urlopen(req, timeout=10) as resp:
                    return resp.status in (200, 204)
            except HTTPError as patch_e:
                print(f"  PATCH error for {entity_id}: {patch_e.code}")
                return False
        else:
            print(f"  POST error for {entity_id}: {e.code} - {e.read().decode()}")
            return False
    except URLError as e:
        print(f"  Network error for {entity_id}: {e}")
        return False
    
    return True


def load_csv_file(filepath: Path) -> int:
    """Load a CSV file and upsert all entities to broker."""
    print(f"\nProcessing {filepath.name}...")
    
    # Determine entity type from filename (remove .csv)
    entity_type = filepath.stem
    
    success_count = 0
    error_count = 0
    
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            entity = csv_row_to_ngsi_ld(row, entity_type)
            if entity:
                if upsert_entity(entity):
                    success_count += 1
                else:
                    error_count += 1
    
    print(f"  {entity_type}: {success_count} succeeded, {error_count} failed")
    return success_count


def main():
    """Main entry point."""
    print("=" * 60)
    print("LegoCity Data Loader")
    print("=" * 60)
    print(f"Broker URL: {BROKER_URL}")
    print(f"Data Directory: {DATA_DIR}")
    
    if not wait_for_broker():
        sys.exit(1)
    
    data_path = Path(DATA_DIR)
    csv_files = list(data_path.glob("*.csv"))
    
    if not csv_files:
        print(f"No CSV files found in {DATA_DIR}")
        sys.exit(1)
    
    print(f"\nFound {len(csv_files)} CSV files:")
    for f in csv_files:
        print(f"  - {f.name}")
    
    total_success = 0
    for csv_file in csv_files:
        total_success += load_csv_file(csv_file)
    
    print("\n" + "=" * 60)
    print(f"Data loading complete! Total entities: {total_success}")
    print("=" * 60)


if __name__ == "__main__":
    main()
