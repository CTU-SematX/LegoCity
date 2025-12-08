# Heritage Sites Data (Di Sản)

## Description
This folder contains geospatial data about cultural and historical heritage sites in Vietnam, represented in GeoJSON format.

## Dataset
- **File**: `heritage.geojson`
- **Type**: FeatureCollection
- **Coordinate System**: WGS84 (EPSG:4326)

## Data Fields

Each feature in this dataset contains the following properties:

| Field | Type | Description |
|-------|------|-------------|
| `OBJECTID` | Number | Unique object identifier |
| `ten` | String | Name of the heritage site (in Vietnamese) |
| `phan_loai` | String | Classification/category of the heritage site |
| `ten_tinh` | String | Province name where the site is located |
| `xa` | String | Commune/ward name |
| `huyen` | String | District name |
| `mo_ta` | String | Description of the heritage site |
| `Shape_Leng` | Number | Length of the geometry shape (if applicable) |
| `Shape_Area` | Number | Area of the geometry shape (if applicable) |

## License
This dataset is part of the SmartCity project and is licensed under **CC-BY-SA-4.0** (Creative Commons Attribution-ShareAlike 4.0 International).

See [LICENSES/CC-BY-SA-4.0.txt](../../LICENSES/CC-BY-SA-4.0.txt) for details.

## Usage
This data can be used for:
- Cultural heritage preservation
- Tourism planning and promotion
- Historical research and documentation
- Heritage site management
- Educational purposes

## Source
Data is collected and maintained as part of the SmartCity project initiative, focusing on the preservation and promotion of Vietnam's cultural heritage.

## Contact
For questions or issues regarding this dataset, please refer to the main project [README](../../README.md).
