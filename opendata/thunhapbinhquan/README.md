# Average Income Data (Thu Nhập Bình Quân)

## Description
This folder contains geospatial data about average income statistics by province in Vietnam, represented in GeoJSON format.

## Dataset
- **File**: `thunhapbinhquan.geojson`
- **Type**: FeatureCollection
- **Coordinate System**: WGS84 (EPSG:4326)

## Data Fields

Each feature in this dataset contains the following properties:

| Field | Type | Description |
|-------|------|-------------|
| `Code` | String | Province code |
| `Name_EN` | String | Province name in English |
| `Name_VI` | String | Province name in Vietnamese |
| `Income` | Number | Average total income (in thousands VND) |
| `Salary` | Number | Average salary income (in thousands VND) |
| `Wages_agri` | Number | Average agricultural wages (in thousands VND) |
| `Non_agri` | Number | Average non-agricultural wages (in thousands VND) |
| `Other_wage` | Number | Other wage income (in thousands VND) |

## Data Coverage
This dataset includes income statistics for all provinces and centrally-governed cities in Vietnam, including:
- Northern provinces (Đông Bắc, Tây Bắc)
- Central provinces (Bắc Trung Bộ, Nam Trung Bộ)
- Southern provinces (Đông Nam Bộ, Đồng bằng sông Cửu Long)

## License
This dataset is part of the SmartCity project and is licensed under **CC-BY-4.0** (Creative Commons Attribution 4.0 International).

See the main [LICENSE](../../LICENSE) file and [LICENSES/CC-BY-4.0.txt](../../LICENSES/CC-BY-4.0.txt) for details.

## Usage
This data can be used for:
- Economic analysis and research
- Socioeconomic development planning
- Income inequality studies
- Regional development comparisons
- Policy making and evaluation
- Statistical visualizations

## Data Notes
- All income values are in thousands of Vietnamese Dong (VND)
- Data represents average household income per capita
- Income is broken down by source (salary, agricultural wages, non-agricultural wages, other sources)

## Source
Data is collected and maintained as part of the SmartCity project initiative, compiled from official statistics.

## Contact
For questions or issues regarding this dataset, please refer to the main project [README](../../README.md).
