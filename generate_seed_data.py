"""
Smart City HCMC - NGSI-LD Seed Data Generator
Generates ~150 entities for Ho Chi Minh City with real geographical data
"""

import sqlite3
import json
import random
import uuid
from datetime import datetime, timedelta
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import time

# HCMC Metropolitan Area - Full Coverage (106.356-107.027 lon, 10.372-11.160 lat)
ZONES = {
    'district_1': {'name': 'District 1 (Central)', 'lat': (10.762, 10.792), 'lon': (106.690, 106.712), 'weight': 0.12, 'landmarks': [(10.777, 106.701), (10.770, 106.695), (10.780, 106.705)]},
    'district_3': {'name': 'District 3', 'lat': (10.765, 10.795), 'lon': (106.660, 106.690), 'weight': 0.10, 'landmarks': [(10.780, 106.675), (10.770, 106.680), (10.785, 106.670)]},
    'district_7': {'name': 'District 7 (Phu My Hung)', 'lat': (10.720, 10.750), 'lon': (106.700, 106.740), 'weight': 0.15, 'landmarks': [(10.735, 106.720), (10.728, 106.715), (10.742, 106.725)]},
    'thu_duc': {'name': 'Thu Duc City', 'lat': (10.820, 10.900), 'lon': (106.730, 106.820), 'weight': 0.20, 'landmarks': [(10.850, 106.770), (10.865, 106.785), (10.835, 106.750)]},
    'binh_thanh': {'name': 'Binh Thanh District', 'lat': (10.795, 10.825), 'lon': (106.690, 106.720), 'weight': 0.12, 'landmarks': [(10.810, 106.705), (10.805, 106.698), (10.818, 106.712)]},
    'tan_binh': {'name': 'Tan Binh District (Airport)', 'lat': (10.790, 10.825), 'lon': (106.640, 106.675), 'weight': 0.11, 'landmarks': [(10.810, 106.658), (10.800, 106.650), (10.818, 106.665)]},
    'go_vap': {'name': 'Go Vap District', 'lat': (10.820, 10.860), 'lon': (106.650, 106.690), 'weight': 0.10, 'landmarks': [(10.840, 106.670), (10.835, 106.665), (10.848, 106.680)]},
    'can_gio': {'name': 'Can Gio District', 'lat': (10.372, 10.450), 'lon': (106.850, 106.950), 'weight': 0.05, 'landmarks': [(10.410, 106.900), (10.395, 106.880), (10.425, 106.920)]},
    'cu_chi': {'name': 'Cu Chi District', 'lat': (10.950, 11.050), 'lon': (106.450, 106.550), 'weight': 0.05, 'landmarks': [(11.000, 106.500), (10.980, 106.480), (11.020, 106.520)]}
}

# Major HCMC Roads - Hardcoded Fallback
MAJOR_ROADS_FALLBACK = [
    {'name': 'Võ Văn Kiệt Boulevard', 'coords': [(106.640, 10.760), (106.650, 10.760), (106.680, 10.760), (106.710, 10.760)], 'type': 'primary'},
    {'name': 'Xa Lộ Hà Nội (Hanoi Highway)', 'coords': [(106.700, 10.780), (106.730, 10.805), (106.760, 10.830), (106.780, 10.850)], 'type': 'trunk'},
    {'name': 'Nguyễn Văn Linh', 'coords': [(106.680, 10.720), (106.695, 10.730), (106.710, 10.740), (106.730, 10.750)], 'type': 'primary'},
    {'name': 'Quốc Lộ 1A (QL1A)', 'coords': [(106.640, 10.780), (106.650, 10.800), (106.660, 10.820), (106.680, 10.850)], 'type': 'trunk'},
    {'name': 'East-West Highway', 'coords': [(106.690, 10.775), (106.720, 10.775), (106.750, 10.775), (106.780, 10.775)], 'type': 'motorway'},
    {'name': 'Phạm Văn Đồng', 'coords': [(106.650, 10.800), (106.670, 10.815), (106.690, 10.830), (106.710, 10.845)], 'type': 'primary'},
    {'name': 'Đường Võ Nguyên Giáp', 'coords': [(106.730, 10.780), (106.750, 10.795), (106.770, 10.810), (106.790, 10.825)], 'type': 'primary'},
    {'name': 'Cách Mạng Tháng 8', 'coords': [(106.665, 10.770), (106.670, 10.780), (106.675, 10.790), (106.680, 10.800)], 'type': 'primary'},
    {'name': 'Đinh Tiên Hoàng', 'coords': [(106.695, 10.770), (106.700, 10.775), (106.705, 10.780), (106.710, 10.785)], 'type': 'secondary'},
    {'name': 'Trần Hưng Đạo', 'coords': [(106.680, 10.755), (106.690, 10.760), (106.700, 10.765), (106.710, 10.770)], 'type': 'primary'}
]

# Waterway Corridors for Flood Sensor Placement
WATERWAY_CORRIDORS = [
    {'name': 'Saigon River', 'lat': (10.720, 10.820), 'lon': (106.680, 106.740)},
    {'name': 'Dong Nai River', 'lat': (10.750, 10.950), 'lon': (106.780, 106.880)},
    {'name': 'Ben Nghe Canal', 'lat': (10.760, 10.775), 'lon': (106.690, 106.710)},
    {'name': 'Tau Hu Canal', 'lat': (10.760, 10.780), 'lon': (106.650, 106.680)},
    {'name': 'Nha Be River', 'lat': (10.650, 10.730), 'lon': (106.720, 106.780)}
]

# NGSI-LD Context
NGSI_LD_CONTEXT = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"

# Database configuration
DB_NAME = "legocity.db"

# Known Flood-Prone Areas in HCMC (Real locations that frequently flood)
FLOOD_PRONE_AREAS = [
    # Central HCMC - Urban flooding
    {'name': 'Nguyễn Hữu Cảnh', 'center': (10.792, 106.715), 'severity': 'high', 'area_type': 'urban_road'},
    {'name': 'Thảo Điền', 'center': (10.805, 106.740), 'severity': 'high', 'area_type': 'residential'},
    {'name': 'Bình Thạnh - Xô Viết Nghệ Tĩnh', 'center': (10.800, 106.705), 'severity': 'medium', 'area_type': 'urban_road'},
    {'name': 'Quận 8 - Bến Phú Định', 'center': (10.740, 106.660), 'severity': 'high', 'area_type': 'canal_side'},
    {'name': 'Hàng Xanh Intersection', 'center': (10.803, 106.710), 'severity': 'medium', 'area_type': 'intersection'},
    # Thu Duc / District 2
    {'name': 'An Phú - Xa Lộ Hà Nội', 'center': (10.798, 106.745), 'severity': 'medium', 'area_type': 'highway'},
    {'name': 'Linh Đông - Phạm Văn Đồng', 'center': (10.852, 106.725), 'severity': 'high', 'area_type': 'urban_road'},
    {'name': 'Thủ Đức - Võ Văn Ngân', 'center': (10.850, 106.755), 'severity': 'medium', 'area_type': 'urban_road'},
    # District 7 / Nhà Bè
    {'name': 'Phú Mỹ Hưng - Nguyễn Văn Linh', 'center': (10.728, 106.715), 'severity': 'low', 'area_type': 'urban_road'},
    {'name': 'Nhà Bè - Lê Văn Lương', 'center': (10.695, 106.730), 'severity': 'high', 'area_type': 'lowland'},
    # Tân Bình / Tân Phú
    {'name': 'Tân Bình - Cộng Hòa', 'center': (10.800, 106.650), 'severity': 'medium', 'area_type': 'urban_road'},
    {'name': 'Tân Phú - Âu Cơ', 'center': (10.785, 106.635), 'severity': 'medium', 'area_type': 'canal_side'},
    # Gò Vấp / Bình Tân
    {'name': 'Gò Vấp - Nguyễn Oanh', 'center': (10.845, 106.670), 'severity': 'medium', 'area_type': 'urban_road'},
    {'name': 'Bình Tân - Tên Lửa', 'center': (10.752, 106.595), 'severity': 'high', 'area_type': 'residential'},
    # District 6 / District 11
    {'name': 'Quận 6 - Hậu Giang', 'center': (10.753, 106.635), 'severity': 'high', 'area_type': 'canal_side'},
    {'name': 'Quận 11 - Lạc Long Quân', 'center': (10.770, 106.640), 'severity': 'medium', 'area_type': 'canal_side'},
    # Outlying areas
    {'name': 'Bình Chánh - Quốc Lộ 1A', 'center': (10.705, 106.580), 'severity': 'high', 'area_type': 'lowland'},
    {'name': 'Hóc Môn - Phan Văn Hớn', 'center': (10.885, 106.605), 'severity': 'medium', 'area_type': 'agricultural'},
    {'name': 'Củ Chi - Tỉnh Lộ 8', 'center': (10.970, 106.495), 'severity': 'low', 'area_type': 'agricultural'},
    {'name': 'Cần Giờ - Ven Biển', 'center': (10.415, 106.895), 'severity': 'high', 'area_type': 'coastal'},
]

# Entity counts with randomization (Total: ~165-185 with FloodZone)
ENTITY_COUNTS = {
    'TrafficFlowObserved': (28, 32),  # Real roads from OSM
    'EmergencyIncident': (38, 45),
    'EmergencyVehicle': (23, 28),
    'MedicalFacility': (9, 12),
    'FloodSensor': (42, 48),
    'FloodZone': (18, 22)  # Polygon areas affected by flooding
}


def init_database():
    """Initialize SQLite database with entities table"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS entities (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            data TEXT NOT NULL
        )
    ''')
    
    # Clear existing data
    cursor.execute('DELETE FROM entities')
    conn.commit()
    conn.close()
    print(f"✓ Database '{DB_NAME}' initialized")


def random_point_in_zone(zone_key):
    """Generate random coordinates within specified HCMC zone (uniform distribution)"""
    zone = ZONES[zone_key]
    lat = random.uniform(zone['lat'][0], zone['lat'][1])
    lon = random.uniform(zone['lon'][0], zone['lon'][1])
    return [lon, lat]  # GeoJSON format: [longitude, latitude]


def gaussian_approximation(mean=0.0, std=1.0):
    """Approximate Gaussian distribution using Irwin-Hall (sum of 12 uniforms)"""
    # Sum of 12 uniform(-0.5, 0.5) approximates N(0,1)
    sample = sum([random.uniform(-0.5, 0.5) for _ in range(12)])
    return mean + sample * std


def clustered_point_in_zone(zone_key, cluster_std=0.003):
    """Generate point with Gaussian clustering around landmarks"""
    zone = ZONES[zone_key]
    
    # Choose random landmark in zone
    if 'landmarks' in zone and zone['landmarks']:
        landmark_lat, landmark_lon = random.choice(zone['landmarks'])
    else:
        # Fallback to zone center
        landmark_lat = (zone['lat'][0] + zone['lat'][1]) / 2
        landmark_lon = (zone['lon'][0] + zone['lon'][1]) / 2
    
    # Add Gaussian noise
    lat = gaussian_approximation(landmark_lat, cluster_std)
    lon = gaussian_approximation(landmark_lon, cluster_std)
    
    # Clamp to zone boundaries
    lat = max(zone['lat'][0], min(zone['lat'][1], lat))
    lon = max(zone['lon'][0], min(zone['lon'][1], lon))
    
    return [lon, lat]


def generate_waterway_sensor_location():
    """Generate flood sensor location along waterways"""
    corridor = random.choice(WATERWAY_CORRIDORS)
    
    # Random point along corridor
    lat = random.uniform(corridor['lat'][0], corridor['lat'][1])
    lon = random.uniform(corridor['lon'][0], corridor['lon'][1])
    
    # Add small perpendicular offset (sensors near water, not in it)
    offset = random.uniform(-0.002, 0.002)
    lon += offset
    
    return [lon, lat]


def random_timestamp(days_back=7):
    """Generate random ISO 8601 timestamp within last N days"""
    now = datetime.now()
    delta = timedelta(days=random.uniform(0, days_back), 
                     hours=random.uniform(0, 24),
                     minutes=random.uniform(0, 60))
    timestamp = now - delta
    return timestamp.strftime("%Y-%m-%dT%H:%M:%SZ")


def generate_ngsi_entity(entity_type, entity_id, attributes):
    """
    Generate strict NGSI-LD formatted entity
    All attributes wrapped as Property or GeoProperty objects
    """
    entity = {
        "@context": NGSI_LD_CONTEXT,
        "id": entity_id,
        "type": entity_type
    }
    
    for key, value in attributes.items():
        if key == "location":
            # GeoProperty for location
            entity[key] = {
                "type": "GeoProperty",
                "value": {
                    "type": "Point",
                    "coordinates": value
                }
            }
        elif key == "observedAt":
            # Keep observedAt at root level for temporal queries
            entity[key] = value
        else:
            # Regular Property
            entity[key] = {
                "type": "Property",
                "value": value
            }
    
    return entity


def fetch_real_roads_overpass():
    """
    Fetch real highway data from multiple HCMC districts using Overpass API
    Returns list of road geometries (ways) from all zones
    """
    print("⏳ Fetching real roads from OpenStreetMap (Multiple Districts)...")
    
    all_roads = []
    
    # Query each zone separately
    for zone_key, zone in ZONES.items():
        # Skip zones with low weights for roads
        if zone.get('weight', 0) < 0.08:
            continue
        
        # Calculate roads to fetch from this zone
        target_roads = max(2, int(30 * zone['weight']))
        
        # Overpass QL query for major roads only
        overpass_query = f"""
        [out:json][timeout:25];
        (
          way["highway"="motorway"]({zone['lat'][0]},{zone['lon'][0]},{zone['lat'][1]},{zone['lon'][1]});
          way["highway"="trunk"]({zone['lat'][0]},{zone['lon'][0]},{zone['lat'][1]},{zone['lon'][1]});
          way["highway"="primary"]({zone['lat'][0]},{zone['lon'][0]},{zone['lat'][1]},{zone['lon'][1]});
          way["highway"="secondary"]({zone['lat'][0]},{zone['lon'][0]},{zone['lat'][1]},{zone['lon'][1]});
        );
        out geom;
        """
        
        overpass_url = "https://overpass-api.de/api/interpreter"
        
        try:
            # Prepare request
            data = overpass_query.encode('utf-8')
            req = Request(overpass_url, data=data, method='POST')
            req.add_header('Content-Type', 'application/x-www-form-urlencoded')
            
            # Execute request with timeout
            with urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode('utf-8'))
            
            zone_roads = []
            if 'elements' in result:
                for element in result['elements']:
                    if element['type'] == 'way' and 'geometry' in element:
                        # Extract coordinates
                        coords = [[node['lon'], node['lat']] for node in element['geometry']]
                        if len(coords) >= 2:  # Valid LineString
                            road_name = element.get('tags', {}).get('name', '')
                            
                            # Filter out unwanted roads
                            if not road_name or road_name == 'Unnamed Road':
                                continue
                            if 'Hẻm' in road_name or 'hẻm' in road_name:
                                continue
                            
                            zone_roads.append({
                                'name': road_name,
                                'coordinates': coords,
                                'highway_type': element.get('tags', {}).get('highway', 'unknown'),
                                'zone': zone_key
                            })
            
            # Add roads from this zone
            all_roads.extend(zone_roads[:target_roads])
            print(f"  ✓ {zone['name']}: {len(zone_roads[:target_roads])} roads")
            
            # Rate limiting
            time.sleep(2)
        
        except (URLError, HTTPError) as e:
            print(f"  ⚠ {zone['name']}: API error ({e}), using fallback...")
            continue
        except Exception as e:
            print(f"  ⚠ {zone['name']}: Error ({e}), using fallback...")
            continue
    
    # Add major roads fallback if insufficient
    if len(all_roads) < 20:
        print(f"⚠ Only {len(all_roads)} roads from OSM, adding major roads fallback...")
        fallback_roads = generate_fallback_roads()
        all_roads.extend(fallback_roads[:max(0, 25 - len(all_roads))])
    
    print(f"✓ Total roads collected: {len(all_roads)}")
    return all_roads


def generate_fallback_roads():
    """Generate fallback roads using hardcoded major HCMC roads"""
    roads = []
    
    for road_def in MAJOR_ROADS_FALLBACK:
        # Convert simple coords to LineString coordinates
        coords = [[lon, lat] for lon, lat in road_def['coords']]
        
        roads.append({
            'name': road_def['name'],
            'coordinates': coords,
            'highway_type': road_def['type']
        })
    
    return roads


def generate_traffic_flow_observed(count_range=(28, 32)):
    """Generate TrafficFlowObserved entities from real OSM roads"""
    count = random.randint(count_range[0], count_range[1])
    entities = []
    roads = fetch_real_roads_overpass()
    
    # Use available roads, cycle if needed
    for i in range(count):
        road = roads[i % len(roads)] if roads else None
        if not road:
            continue
        
        entity_id = f"urn:ngsi-ld:TrafficFlowObserved:HCMC:{uuid.uuid4()}"
        
        attributes = {
            "location": road['coordinates'],  # Will be converted to LineString
            "roadName": road['name'],
            "congestionIndex": round(random.uniform(0.0, 1.0), 3),  # 0=free, 1=jammed
            "averageVehicleSpeed": random.randint(5, 60),  # km/h
            "vehicleCount": random.randint(10, 200),
            "observedAt": random_timestamp()
        }
        
        # Modify entity generation for LineString
        entity = {
            "@context": NGSI_LD_CONTEXT,
            "id": entity_id,
            "type": "TrafficFlowObserved",
            "location": {
                "type": "GeoProperty",
                "value": {
                    "type": "LineString",
                    "coordinates": road['coordinates']
                }
            },
            "roadName": {"type": "Property", "value": attributes["roadName"]},
            "congestionIndex": {"type": "Property", "value": attributes["congestionIndex"]},
            "averageVehicleSpeed": {"type": "Property", "value": attributes["averageVehicleSpeed"]},
            "vehicleCount": {"type": "Property", "value": attributes["vehicleCount"]},
            "observedAt": attributes["observedAt"]
        }
        
        entities.append(entity)
    
    print(f"✓ Generated {len(entities)} TrafficFlowObserved entities")
    return entities


def generate_emergency_incidents(count_range=(38, 45)):
    """Generate EmergencyIncident entities (clustered around landmarks)"""
    count = random.randint(count_range[0], count_range[1])
    entities = []
    incident_types = ["Fire", "TrafficAccident", "Flooding", "MedicalEmergency"]
    severities = ["Low", "Medium", "High", "Critical"]
    statuses = ["Active", "Dispatching", "Resolved"]
    
    # Weighted zone selection
    zone_weights = []
    for zone_key, zone in ZONES.items():
        weight = zone.get('weight', 0.1)
        zone_weights.extend([zone_key] * int(weight * 100))
    
    for i in range(count):
        zone = random.choice(zone_weights)
        entity_id = f"urn:ngsi-ld:EmergencyIncident:HCMC:{uuid.uuid4()}"
        
        attributes = {
            "incidentType": random.choice(incident_types),
            "severity": random.choice(severities),
            "status": random.choice(statuses),
            "location": clustered_point_in_zone(zone, cluster_std=0.003),
            "observedAt": random_timestamp()
        }
        
        entity = generate_ngsi_entity("EmergencyIncident", entity_id, attributes)
        entities.append(entity)
    
    print(f"✓ Generated {count} EmergencyIncident entities")
    return entities


def generate_emergency_vehicles(count_range=(23, 28)):
    """Generate EmergencyVehicle entities (distributed across zones)"""
    count = random.randint(count_range[0], count_range[1])
    entities = []
    vehicle_types = ["Ambulance", "FireTruck", "PoliceCar"]
    statuses = ["Available", "OnMission", "Maintenance"]
    
    zone_keys = list(ZONES.keys())
    
    for i in range(count):
        zone = random.choice(zone_keys)
        entity_id = f"urn:ngsi-ld:EmergencyVehicle:HCMC:{uuid.uuid4()}"
        
        attributes = {
            "vehicleType": random.choice(vehicle_types),
            "status": random.choice(statuses),
            "speed": random.randint(0, 80),
            "heading": random.randint(0, 360),
            "location": clustered_point_in_zone(zone, cluster_std=0.005),
            "observedAt": random_timestamp()
        }
        
        entity = generate_ngsi_entity("EmergencyVehicle", entity_id, attributes)
        entities.append(entity)
    
    print(f"✓ Generated {count} EmergencyVehicle entities")
    return entities


def generate_medical_facilities(count_range=(9, 12)):
    """Generate MedicalFacility entities (clustered in urban centers)"""
    count = random.randint(count_range[0], count_range[1])
    entities = []
    facility_names = [
        "HCMC General Hospital", "Cho Ray Hospital", "115 People's Hospital",
        "University Medical Center", "Phu Nhuan Hospital", "Binh Thanh Clinic",
        "District 1 Medical Center", "Tan Binh Hospital", "City Children's Hospital",
        "Heart Institute", "Thu Duc Hospital", "District 7 Medical Center"
    ]
    
    # Medical facilities mostly in urban zones
    urban_zones = ['district_1', 'district_3', 'district_7', 'binh_thanh', 'tan_binh']
    
    for i in range(count):
        zone = random.choice(urban_zones)
        entity_id = f"urn:ngsi-ld:MedicalFacility:HCMC:{uuid.uuid4()}"
        
        bed_capacity = random.randint(100, 2000)
        
        attributes = {
            "name": facility_names[i % len(facility_names)],
            "bedCapacity": bed_capacity,
            "availableBeds": random.randint(0, bed_capacity),
            "location": clustered_point_in_zone(zone, cluster_std=0.002),
            "observedAt": random_timestamp()
        }
        
        entity = generate_ngsi_entity("MedicalFacility", entity_id, attributes)
        entities.append(entity)
    
    print(f"✓ Generated {count} MedicalFacility entities")
    return entities


def generate_flood_sensors(count_range=(42, 48)):
    """Generate FloodSensor entities (70% along waterways, 30% in flood-prone zones)"""
    count = random.randint(count_range[0], count_range[1])
    entities = []
    
    waterway_count = int(count * 0.7)
    zone_count = count - waterway_count
    
    # Generate sensors along waterways
    for i in range(waterway_count):
        entity_id = f"urn:ngsi-ld:FloodSensor:HCMC:{uuid.uuid4()}"
        
        attributes = {
            "waterLevel": round(random.uniform(0.0, 2.5), 2),
            "batteryLevel": round(random.uniform(0.3, 1.0), 2),
            "location": generate_waterway_sensor_location(),
            "observedAt": random_timestamp()
        }
        
        entity = generate_ngsi_entity("FloodSensor", entity_id, attributes)
        entities.append(entity)
    
    # Generate sensors in flood-prone zones
    flood_zones = ['district_7', 'binh_thanh', 'thu_duc', 'can_gio']
    
    for i in range(zone_count):
        zone = random.choice(flood_zones)
        entity_id = f"urn:ngsi-ld:FloodSensor:HCMC:{uuid.uuid4()}"
        
        attributes = {
            "waterLevel": round(random.uniform(0.0, 2.5), 2),
            "batteryLevel": round(random.uniform(0.3, 1.0), 2),
            "location": clustered_point_in_zone(zone, cluster_std=0.004),
            "observedAt": random_timestamp()
        }
        
        entity = generate_ngsi_entity("FloodSensor", entity_id, attributes)
        entities.append(entity)
    
    print(f"✓ Generated {count} FloodSensor entities ({waterway_count} waterway, {zone_count} zone-based)")
    return entities


def generate_polygon_from_center(center_lat, center_lon, size_meters=150, irregularity=0.3):
    """
    Generate an irregular polygon around a center point.
    
    Args:
        center_lat: Center latitude
        center_lon: Center longitude
        size_meters: Approximate radius in meters (default 150m)
        irregularity: How irregular the polygon should be (0-1)
    
    Returns:
        List of [lon, lat] coordinates forming a closed polygon
    """
    # Convert meters to degrees (approximate at HCMC latitude ~10.8°N)
    # 1 degree lat ≈ 111,000 meters
    # 1 degree lon ≈ 111,000 * cos(10.8°) ≈ 109,000 meters
    lat_offset = size_meters / 111000
    lon_offset = size_meters / 109000
    
    # Generate 6-10 vertices
    num_vertices = random.randint(6, 10)
    angles = sorted([random.uniform(0, 2 * 3.14159) for _ in range(num_vertices)])
    
    vertices = []
    for angle in angles:
        # Add irregularity to radius
        r_factor = 1.0 + random.uniform(-irregularity, irregularity)
        
        # Calculate offset from center
        import math
        lat = center_lat + lat_offset * r_factor * math.sin(angle)
        lon = center_lon + lon_offset * r_factor * math.cos(angle)
        
        vertices.append([lon, lat])
    
    # Close the polygon (first point == last point)
    vertices.append(vertices[0])
    
    return vertices


def generate_flood_zones(count_range=(18, 22)):
    """
    Generate FloodZone entities as Polygon geometries.
    Uses real flood-prone locations in HCMC with varying severity levels.
    """
    count = random.randint(count_range[0], count_range[1])
    entities = []
    
    # Shuffle and select from known flood-prone areas
    selected_areas = random.sample(FLOOD_PRONE_AREAS, min(count, len(FLOOD_PRONE_AREAS)))
    
    # If we need more, generate additional ones with slight variations
    while len(selected_areas) < count:
        base_area = random.choice(FLOOD_PRONE_AREAS)
        # Create variation near the base area
        new_area = base_area.copy()
        new_area['center'] = (
            base_area['center'][0] + random.uniform(-0.005, 0.005),
            base_area['center'][1] + random.uniform(-0.005, 0.005)
        )
        new_area['name'] = f"{base_area['name']} (Extended)"
        selected_areas.append(new_area)
    
    severity_levels = {'low': 1, 'medium': 2, 'high': 3}
    area_type_sizes = {
        'urban_road': (200, 400),      # Urban road flooding areas
        'intersection': (150, 300),    # Intersections flooding
        'residential': (350, 600),     # Residential areas are larger
        'canal_side': (250, 500),      # Canal-side flooding
        'lowland': (450, 800),         # Large lowland areas
        'highway': (300, 600),         # Highway stretches
        'agricultural': (500, 800),    # Large agricultural areas
        'coastal': (500, 800)          # Coastal flooding
    }
    
    for area in selected_areas:
        entity_id = f"urn:ngsi-ld:FloodZone:HCMC:{uuid.uuid4()}"
        
        center_lat, center_lon = area['center']
        severity = area['severity']
        area_type = area['area_type']
        
        # Determine polygon size based on area type
        size_range = area_type_sizes.get(area_type, (100, 200))
        size_meters = random.randint(size_range[0], size_range[1])
        
        # Generate polygon coordinates
        polygon_coords = generate_polygon_from_center(center_lat, center_lon, size_meters)
        
        # Generate realistic flood metrics
        water_depth = round(random.uniform(0.1, 0.8) * severity_levels[severity], 2)
        affected_population = random.randint(50, 500) * severity_levels[severity]
        
        attributes = {
            "name": area['name'],
            "floodSeverity": severity,
            "areaType": area_type,
            "waterDepth": water_depth,
            "affectedPopulation": affected_population,
            "isActive": random.choice([True, True, True, False]),  # 75% active
            "location": {
                "type": "GeoProperty",
                "value": {
                    "type": "Polygon",
                    "coordinates": [polygon_coords]  # GeoJSON Polygon requires nested array
                }
            },
            "observedAt": random_timestamp()
        }
        
        # For FloodZone, we handle location separately (already formatted)
        entity = {
            "@context": NGSI_LD_CONTEXT,
            "id": entity_id,
            "type": "FloodZone"
        }
        
        # Add attributes with proper NGSI-LD wrapping
        for key, value in attributes.items():
            if key == 'location':
                entity['location'] = value
            elif key == 'observedAt':
                entity['observedAt'] = {
                    "type": "Property",
                    "value": {"@type": "DateTime", "@value": value}
                }
            else:
                entity[key] = {"type": "Property", "value": value}
        
        entities.append(entity)
    
    print(f"✓ Generated {len(entities)} FloodZone entities (Polygon geometries)")
    return entities


def batch_insert_entities(entities):
    """Batch insert all entities into SQLite database"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Prepare data for executemany
    records = []
    for entity in entities:
        entity_id = entity['id']
        entity_type = entity['type']
        entity_json = json.dumps(entity, ensure_ascii=False)
        records.append((entity_id, entity_type, entity_json))
    
    # Batch insert
    cursor.executemany(
        'INSERT INTO entities (id, type, data) VALUES (?, ?, ?)',
        records
    )
    
    conn.commit()
    conn.close()
    
    print(f"✓ Inserted {len(records)} entities into database")


def print_statistics(entities):
    """Print summary statistics"""
    type_counts = {}
    for entity in entities:
        entity_type = entity['type']
        type_counts[entity_type] = type_counts.get(entity_type, 0) + 1
    
    print("\n" + "="*60)
    print("📊 SEED DATA GENERATION SUMMARY")
    print("="*60)
    print(f"Database: {DB_NAME}")
    print(f"Total Entities: {len(entities)}")
    print("\nBreakdown by Type:")
    for entity_type, count in sorted(type_counts.items()):
        print(f"  • {entity_type}: {count}")
    print("="*60 + "\n")


def main():
    """Main execution flow"""
    print("\n" + "="*60)
    print("🏙️  SMART CITY HCMC - NGSI-LD SEED DATA GENERATOR")
    print("="*60 + "\n")
    
    start_time = time.time()
    
    # Step 1: Initialize database
    init_database()
    
    # Step 2: Generate all entities
    all_entities = []
    
    all_entities.extend(generate_traffic_flow_observed(ENTITY_COUNTS['TrafficFlowObserved']))
    all_entities.extend(generate_emergency_incidents(ENTITY_COUNTS['EmergencyIncident']))
    all_entities.extend(generate_emergency_vehicles(ENTITY_COUNTS['EmergencyVehicle']))
    all_entities.extend(generate_medical_facilities(ENTITY_COUNTS['MedicalFacility']))
    all_entities.extend(generate_flood_sensors(ENTITY_COUNTS['FloodSensor']))
    all_entities.extend(generate_flood_zones(ENTITY_COUNTS['FloodZone']))
    
    # Step 3: Batch insert into database
    print("\n⏳ Inserting entities into database...")
    batch_insert_entities(all_entities)
    
    # Step 4: Print statistics
    elapsed = time.time() - start_time
    print_statistics(all_entities)
    print(f"⏱️  Execution time: {elapsed:.2f} seconds")
    print("✅ Seed data generation complete!\n")


if __name__ == "__main__":
    main()
