# National Conservation Areas (Khu Bảo Tồn Quốc Gia)

## Description
This folder contains geospatial data about national conservation areas, protected zones, and natural reserves in Vietnam, represented in GeoJSON format.

## Dataset
- **File**: `khu-bao-ton-quoc-gia.geojson`
- **Type**: FeatureCollection
- **Coordinate System**: WGS84 (EPSG:4326)

## Data Fields

Each feature in this dataset contains the following properties:

| Field | Type | Description |
|-------|------|-------------|
| `OBJECTID` | Number | Unique object identifier |
| `ten_KBT` | String | Name of the conservation area (Vietnamese) |
| `ten_tinh` | String | Province name where the area is located |
| `loai_hinh` | String | Type/category of conservation area |
| `nam_thanh_` | Number | Year established |
| `dien_tich` | Number | Total area (in hectares) |
| `DT_long` | Number | Core zone area |
| `DT_dem` | Number | Buffer zone area |
| `xa` | String | Commune/ward name |
| `huyen` | String | District name |
| `Shape_Leng` | Number | Length of the geometry shape |
| `Shape_Area` | Number | Area of the geometry shape |

## Conservation Area Types
- National Parks (Vườn quốc gia)
- Nature Reserves (Khu bảo tồn thiên nhiên)
- Species & Habitat Conservation Areas (Khu bảo tồn loài & sinh cảnh)
- Protected Landscapes (Khu bảo vệ cảnh quan)

## License
This dataset is part of the SmartCity project and is licensed under **CC-BY-SA-4.0** (Creative Commons Attribution-ShareAlike 4.0 International).

See [LICENSES/CC-BY-SA-4.0.txt](../../LICENSES/CC-BY-SA-4.0.txt) for details.

## Usage
This data can be used for:
- Environmental conservation planning
- Biodiversity research
- Ecological monitoring
- Protected area management
- Land use planning
- Environmental impact assessments

## Source
Data is collected and maintained as part of the SmartCity project initiative, supporting environmental protection and sustainable development.

## Contact
For questions or issues regarding this dataset, please refer to the main project [README](../../README.md).
