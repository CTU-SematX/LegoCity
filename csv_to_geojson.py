"""
Convert CSV files to GeoJSON format
Creates separate GeoJSON files for each entity type with proper geometry
"""

import csv
import json
import os
import re

CSV_DIR = "csv_exports"
GEOJSON_DIR = "geojson_exports"


def parse_coordinates(coord_str):
    """Parse coordinate string to [lon, lat] format"""
    if not coord_str or coord_str == '':
        return None
    
    try:
        # Format: "lat,lon"
        parts = coord_str.split(',')
        if len(parts) == 2:
            lat = float(parts[0].strip())
            lon = float(parts[1].strip())
            return [lon, lat]  # GeoJSON format: [longitude, latitude]
    except:
        pass
    
    return None


def parse_linestring(location_str):
    """Parse LineString description and return placeholder coordinates"""
    # For LineString, we need to get from original data
    # This is a simplified version - actual coordinates should come from DB
    return None


def convert_csv_to_geojson(csv_file, entity_type):
    """Convert a CSV file to GeoJSON format"""
    features = []
    
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            # Parse location
            location_str = row.get('location', '')
            
            # Determine geometry type
            geometry = None
            if location_str.startswith('LineString'):
                # For TrafficFlowObserved - skip for now, need DB access
                continue
            else:
                coords = parse_coordinates(location_str)
                if coords:
                    geometry = {
                        "type": "Point",
                        "coordinates": coords
                    }
            
            if not geometry:
                continue
            
            # Build properties (all fields except id, type, location)
            properties = {
                "id": row.get('id', ''),
                "type": entity_type
            }
            
            for key, value in row.items():
                if key not in ['id', 'type', 'location']:
                    # Try to convert numeric values
                    try:
                        if '.' in value:
                            properties[key] = float(value)
                        else:
                            properties[key] = int(value)
                    except:
                        properties[key] = value
            
            # Create feature
            feature = {
                "type": "Feature",
                "geometry": geometry,
                "properties": properties
            }
            
            features.append(feature)
    
    # Create GeoJSON structure
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    return geojson


def convert_with_db_access(entity_type):
    """Convert entities directly from database to preserve LineString geometry"""
    import sqlite3
    
    conn = sqlite3.connect("legocity.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT data FROM entities WHERE type = ?", (entity_type,))
    rows = cursor.fetchall()
    
    features = []
    
    for row in rows:
        entity_data = json.loads(row[0])
        
        # Extract geometry
        geometry = None
        location = entity_data.get('location')
        
        if location and 'value' in location:
            geo_value = location['value']
            if isinstance(geo_value, dict):
                if geo_value.get('type') == 'Point':
                    geometry = {
                        "type": "Point",
                        "coordinates": geo_value.get('coordinates', [])
                    }
                elif geo_value.get('type') == 'LineString':
                    geometry = {
                        "type": "LineString",
                        "coordinates": geo_value.get('coordinates', [])
                    }
                elif geo_value.get('type') == 'Polygon':
                    geometry = {
                        "type": "Polygon",
                        "coordinates": geo_value.get('coordinates', [])
                    }
        
        if not geometry:
            continue
        
        # Build properties
        properties = {
            "id": entity_data.get('id', ''),
            "type": entity_data.get('type', '')
        }
        
        for key, value in entity_data.items():
            if key not in ['@context', 'id', 'type', 'location']:
                # Extract value from NGSI-LD Property structure
                if isinstance(value, dict) and 'value' in value:
                    properties[key] = value['value']
                else:
                    properties[key] = value
        
        feature = {
            "type": "Feature",
            "geometry": geometry,
            "properties": properties
        }
        
        features.append(feature)
    
    conn.close()
    
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    return geojson


def main():
    """Main conversion function"""
    print("\n" + "="*60)
    print("🗺️  CONVERTING CSV TO GEOJSON")
    print("="*60 + "\n")
    
    # Create output directory
    if not os.path.exists(GEOJSON_DIR):
        os.makedirs(GEOJSON_DIR)
        print(f"✓ Created directory: {GEOJSON_DIR}\n")
    
    # Get all CSV files
    csv_files = [f for f in os.listdir(CSV_DIR) if f.endswith('.csv')]
    
    if not csv_files:
        print("❌ No CSV files found in csv_exports/")
        return
    
    print(f"Found {len(csv_files)} CSV files:\n")
    
    converted = 0
    
    for csv_file in sorted(csv_files):
        entity_type = csv_file.replace('.csv', '')
        csv_path = os.path.join(CSV_DIR, csv_file)
        geojson_path = os.path.join(GEOJSON_DIR, f"{entity_type}.geojson")
        
        # Use DB access for better geometry handling
        geojson_data = convert_with_db_access(entity_type)
        
        # Write GeoJSON file
        with open(geojson_path, 'w', encoding='utf-8') as f:
            json.dump(geojson_data, f, ensure_ascii=False, indent=2)
        
        feature_count = len(geojson_data['features'])
        print(f"✓ Converted {entity_type}: {feature_count} features → {geojson_path}")
        converted += 1
    
    # Summary
    print("\n" + "="*60)
    print("📊 CONVERSION SUMMARY")
    print("="*60)
    print(f"Output Directory: {GEOJSON_DIR}")
    print(f"Files Created: {converted}")
    for csv_file in sorted(csv_files):
        entity_type = csv_file.replace('.csv', '')
        print(f"  • {entity_type}.geojson")
    print("="*60 + "\n")
    print("✅ Conversion complete!\n")
    print("💡 You can now visualize these GeoJSON files in:")
    print("   - QGIS")
    print("   - ArcGIS")
    print("   - Leaflet/Mapbox")
    print("   - geojson.io\n")


if __name__ == "__main__":
    main()
