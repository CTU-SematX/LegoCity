#!/usr/bin/env python3
"""
Convert GeoJSON files back to CSV format.
This script reads manually edited GeoJSON files and exports them to CSV,
preserving all properties and geometries.
"""

import json
import os
import csv
from pathlib import Path


def geojson_to_csv(geojson_file, csv_file):
    """
    Convert a GeoJSON FeatureCollection to CSV format.
    
    Args:
        geojson_file: Path to input GeoJSON file
        csv_file: Path to output CSV file
    """
    # Read GeoJSON file
    with open(geojson_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if data.get('type') != 'FeatureCollection':
        print(f"⚠️  Skipping {geojson_file}: Not a FeatureCollection")
        return 0
    
    features = data.get('features', [])
    if not features:
        print(f"⚠️  Skipping {geojson_file}: No features found")
        return 0
    
    # Collect all unique field names from properties
    all_fields = set()
    all_fields.add('id')
    all_fields.add('type')
    
    for feature in features:
        props = feature.get('properties', {})
        all_fields.update(props.keys())
    
    # Add geometry fields
    all_fields.add('geometry_type')
    all_fields.add('geometry')
    
    # Sort fields for consistent output (id and type first)
    fieldnames = ['id', 'type']
    other_fields = sorted([f for f in all_fields if f not in ['id', 'type', 'geometry_type', 'geometry']])
    fieldnames.extend(other_fields)
    fieldnames.extend(['geometry_type', 'geometry'])
    
    # Write CSV file
    with open(csv_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for feature in features:
            row = {}
            props = feature.get('properties', {})
            geometry = feature.get('geometry', {})
            
            # Copy all properties
            for field in fieldnames:
                if field in props:
                    row[field] = props[field]
                elif field == 'geometry_type':
                    row[field] = geometry.get('type', '')
                elif field == 'geometry':
                    # Format geometry as string
                    geom_type = geometry.get('type', '')
                    coords = geometry.get('coordinates', [])
                    
                    if geom_type == 'Point':
                        # Format: "lat,lon"
                        if len(coords) == 2:
                            row[field] = f"{coords[1]},{coords[0]}"
                    elif geom_type == 'LineString':
                        # Format: "[[lon,lat],[lon,lat],...]"
                        row[field] = json.dumps(coords)
                    elif geom_type == 'Polygon':
                        # Format: "[[[lon,lat],[lon,lat],...]]"
                        row[field] = json.dumps(coords)
                    else:
                        row[field] = json.dumps(coords)
                else:
                    row[field] = ''
            
            writer.writerow(row)
    
    return len(features)


def main():
    """Convert all GeoJSON files in geojson_exports/ to CSV in csv_exports/"""
    geojson_dir = Path('geojson_exports')
    csv_dir = Path('csv_exports')
    
    # Create csv_exports directory if it doesn't exist
    csv_dir.mkdir(exist_ok=True)
    
    # Find all GeoJSON files
    geojson_files = list(geojson_dir.glob('*.geojson'))
    
    if not geojson_files:
        print("❌ No GeoJSON files found in geojson_exports/")
        return
    
    print(f"🔄 Converting {len(geojson_files)} GeoJSON files to CSV...\n")
    
    total_features = 0
    converted_count = 0
    
    for geojson_file in sorted(geojson_files):
        csv_file = csv_dir / f"{geojson_file.stem}.csv"
        
        try:
            count = geojson_to_csv(geojson_file, csv_file)
            if count > 0:
                print(f"✓ Converted {geojson_file.name}: {count} features → {csv_file.name}")
                total_features += count
                converted_count += 1
        except Exception as e:
            print(f"❌ Error converting {geojson_file.name}: {e}")
    
    print(f"\n{'='*60}")
    print(f"✓ Converted {converted_count} files, {total_features} total features")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
