#!/usr/bin/env python3
"""
Import CSV data into SQLite database in NGSI-LD format.
This script reads CSV files and updates the legocity.db database,
reconstructing the NGSI-LD JSON structure.
"""

import sqlite3
import csv
import json
from pathlib import Path
from datetime import datetime


def csv_to_ngsi_ld(row):
    """
    Convert a CSV row back to NGSI-LD format.
    
    Args:
        row: Dictionary representing a CSV row
    
    Returns:
        Dictionary in NGSI-LD format
    """
    entity = {
        "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
        "id": row.get('id', ''),
        "type": row.get('type', '')
    }
    
    # Get geometry info
    geom_type = row.get('geometry_type', '')
    geom_str = row.get('geometry', '')
    
    # Process geometry
    if geom_type == 'Point' and geom_str:
        # Parse "lat,lon" format
        if ',' in geom_str:
            parts = geom_str.split(',')
            if len(parts) == 2:
                try:
                    lat = float(parts[0])
                    lon = float(parts[1])
                    entity['location'] = {
                        "type": "GeoProperty",
                        "value": {
                            "type": "Point",
                            "coordinates": [lon, lat]
                        }
                    }
                except ValueError:
                    pass
    elif geom_type == 'LineString' and geom_str:
        # Parse JSON array format
        try:
            coords = json.loads(geom_str)
            entity['location'] = {
                "type": "GeoProperty",
                "value": {
                    "type": "LineString",
                    "coordinates": coords
                }
            }
        except json.JSONDecodeError:
            pass
    elif geom_type == 'Polygon' and geom_str:
        # Parse JSON array format for Polygon
        try:
            coords = json.loads(geom_str)
            entity['location'] = {
                "type": "GeoProperty",
                "value": {
                    "type": "Polygon",
                    "coordinates": coords
                }
            }
        except json.JSONDecodeError:
            pass
    
    # Process all other properties
    skip_fields = {'id', 'type', 'geometry_type', 'geometry'}
    
    for key, value in row.items():
        if key in skip_fields or not value:
            continue
        
        # Special handling for observedAt (keep as DateTime in Property)
        if key == 'observedAt':
            entity['observedAt'] = {
                "type": "Property",
                "value": {
                    "@type": "DateTime",
                    "@value": value
                }
            }
            continue
        
        # Determine value type and convert
        ngsi_value = value
        
        # Try to convert to appropriate type
        if value.lower() in ('true', 'false'):
            ngsi_value = value.lower() == 'true'
        else:
            try:
                # Try integer first
                if '.' not in value:
                    ngsi_value = int(value)
                else:
                    ngsi_value = float(value)
            except ValueError:
                # Keep as string
                ngsi_value = value
        
        # Wrap in Property structure
        entity[key] = {
            "type": "Property",
            "value": ngsi_value
        }
    
    return entity


def import_csv_to_sqlite(csv_file, db_path='legocity.db'):
    """
    Import a CSV file into SQLite database.
    
    Args:
        csv_file: Path to CSV file
        db_path: Path to SQLite database
    
    Returns:
        Number of rows imported
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Read CSV file
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    if not rows:
        return 0
    
    # Get entity type from first row
    entity_type = rows[0].get('type', '')
    
    # Delete existing entities of this type
    cursor.execute("DELETE FROM entities WHERE type = ?", (entity_type,))
    
    # Insert new entities
    inserted = 0
    for row in rows:
        entity_id = row.get('id', '')
        if not entity_id:
            continue
        
        # Convert to NGSI-LD format
        ngsi_entity = csv_to_ngsi_ld(row)
        
        # Insert into database
        cursor.execute(
            "INSERT OR REPLACE INTO entities (id, type, data) VALUES (?, ?, ?)",
            (entity_id, entity_type, json.dumps(ngsi_entity, ensure_ascii=False))
        )
        inserted += 1
    
    conn.commit()
    conn.close()
    
    return inserted


def main():
    """Import all CSV files from csv_exports/ into legocity.db"""
    csv_dir = Path('csv_exports')
    db_path = 'legocity.db'
    
    # Check if database exists
    if not Path(db_path).exists():
        print(f"❌ Database '{db_path}' not found")
        return
    
    # Find all CSV files
    csv_files = list(csv_dir.glob('*.csv'))
    
    if not csv_files:
        print(f"❌ No CSV files found in {csv_dir}/")
        return
    
    print(f"🔄 Importing {len(csv_files)} CSV files into {db_path}...\n")
    
    total_entities = 0
    imported_count = 0
    
    for csv_file in sorted(csv_files):
        try:
            count = import_csv_to_sqlite(csv_file, db_path)
            if count > 0:
                print(f"✓ Imported {csv_file.name}: {count} entities")
                total_entities += count
                imported_count += 1
        except Exception as e:
            print(f"❌ Error importing {csv_file.name}: {e}")
    
    print(f"\n{'='*60}")
    print(f"✓ Imported {imported_count} files, {total_entities} total entities")
    print(f"{'='*60}")
    
    # Verify database contents
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT type, COUNT(*) FROM entities GROUP BY type ORDER BY type")
    results = cursor.fetchall()
    conn.close()
    
    if results:
        print(f"\n📊 Database Summary:")
        for entity_type, count in results:
            print(f"   {entity_type}: {count} entities")


if __name__ == '__main__':
    main()
