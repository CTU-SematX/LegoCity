"""
Export NGSI-LD entities from SQLite to CSV files
Creates separate CSV files for each entity type
"""

import sqlite3
import json
import csv
import os

DB_NAME = "legocity.db"
OUTPUT_DIR = "csv_exports"


def extract_value(obj):
    """Extract value from NGSI-LD Property or GeoProperty structure"""
    if isinstance(obj, dict):
        if 'value' in obj:
            value = obj['value']
            # Handle GeoProperty (Point)
            if isinstance(value, dict) and value.get('type') == 'Point':
                coords = value.get('coordinates', [])
                return f"{coords[1]},{coords[0]}" if len(coords) == 2 else str(coords)
            # Handle GeoProperty (LineString)
            elif isinstance(value, dict) and value.get('type') == 'LineString':
                coords = value.get('coordinates', [])
                return f"LineString with {len(coords)} points"
            # Handle GeoProperty (Polygon)
            elif isinstance(value, dict) and value.get('type') == 'Polygon':
                coords = value.get('coordinates', [[]])
                num_vertices = len(coords[0]) if coords else 0
                return f"Polygon with {num_vertices} vertices"
            return value
        return obj
    return obj


def export_entity_type_to_csv(entity_type, entities):
    """Export entities of a specific type to CSV"""
    if not entities:
        return
    
    # Collect all unique field names
    fields = set(['id', 'type'])
    for entity in entities:
        entity_data = json.loads(entity[2])  # data column
        for key in entity_data.keys():
            if key not in ['@context', 'id', 'type']:
                fields.add(key)
    
    fields = sorted(fields)
    
    # Create CSV file
    filename = os.path.join(OUTPUT_DIR, f"{entity_type}.csv")
    
    with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fields)
        writer.writeheader()
        
        for entity in entities:
            entity_data = json.loads(entity[2])
            row = {'id': entity_data['id'], 'type': entity_data['type']}
            
            for field in fields:
                if field in ['id', 'type']:
                    continue
                if field in entity_data:
                    row[field] = extract_value(entity_data[field])
                else:
                    row[field] = ''
            
            writer.writerow(row)
    
    print(f"✓ Exported {len(entities)} {entity_type} entities to {filename}")


def main():
    """Main export function"""
    print("\n" + "="*60)
    print("📤 EXPORTING NGSI-LD DATA TO CSV")
    print("="*60 + "\n")
    
    # Create output directory
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"✓ Created directory: {OUTPUT_DIR}\n")
    
    # Connect to database
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Get all entity types
    cursor.execute("SELECT DISTINCT type FROM entities ORDER BY type")
    entity_types = [row[0] for row in cursor.fetchall()]
    
    print(f"Found {len(entity_types)} entity types:\n")
    
    # Export each type to separate CSV
    for entity_type in entity_types:
        cursor.execute("SELECT id, type, data FROM entities WHERE type = ?", (entity_type,))
        entities = cursor.fetchall()
        export_entity_type_to_csv(entity_type, entities)
    
    conn.close()
    
    # Summary
    print("\n" + "="*60)
    print("📊 EXPORT SUMMARY")
    print("="*60)
    print(f"Output Directory: {OUTPUT_DIR}")
    print(f"Files Created: {len(entity_types)}")
    for entity_type in entity_types:
        print(f"  • {entity_type}.csv")
    print("="*60 + "\n")
    print("✅ Export complete!\n")


if __name__ == "__main__":
    main()
