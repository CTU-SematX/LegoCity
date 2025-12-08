# Traffic Infrastructure Data (Giao Thông)

## Description
This folder contains geospatial data about traffic infrastructure in Vietnam, represented in GeoJSON format.

## Dataset
- **File**: `giaothong.geojson`
- **Type**: FeatureCollection
- **Coordinate System**: WGS84 (EPSG:4326)

## Data Fields

Each feature in this dataset contains the following properties:

| Field | Type | Description |
|-------|------|-------------|
| `OBJECTID` | Number | Unique object identifier |
| `FID_Trungh` | Number | FID from trunk dataset |
| `duong_cao_` | String | Highway/expressway name |
| `FID_Quoclo` | Number | FID from national road dataset |
| `duong_qu_1` | String | National road name |
| `Shape_Leng` | Number | Length of the geometry shape |

## License
This dataset is part of the SmartCity project and is licensed under **CC-BY-4.0** (Creative Commons Attribution 4.0 International).

See the main [LICENSE](../../LICENSE) file and [LICENSES/CC-BY-4.0.txt](../../LICENSES/CC-BY-4.0.txt) for details.

## Usage
This data can be used for:
- Traffic planning and analysis
- Transportation infrastructure mapping
- Urban development planning
- GIS applications

## Source
Data is collected and maintained as part of the SmartCity project initiative.

## Contact
For questions or issues regarding this dataset, please refer to the main project [README](../../README.md).
