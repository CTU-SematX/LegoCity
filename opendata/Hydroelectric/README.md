# Hydroelectric Power Plants Data (Thủy Điện)

## Description
This folder contains geospatial data about hydroelectric power plants (dams and power stations) in Vietnam, represented in GeoJSON format.

## Dataset
- **File**: `thuydien.geojson`
- **Type**: FeatureCollection (MultiPoint)
- **Coordinate System**: WGS84 (EPSG:4326)

## Data Fields

Each feature in this dataset contains the following properties:

| Field | Type | Description |
|-------|------|-------------|
| `Name` | String | Name of the hydroelectric plant |
| `Status` | String | Operational status (Đang vận hành, Đang xây dựng, Đình chỉ) |
| `Quy_Mo` | String | Scale classification (Lớn, Vừa, Nhỏ) |
| `CSuat_MW` | Number | Installed capacity in Megawatts (MW) |
| `SL_nam_TrK` | Number | Annual electricity production (million kWh) |
| `Loai` | String | Type (Có hồ chứa, Không biết) |
| `Dung_Tich` | Number | Reservoir capacity (million m³) |
| `Luu_Vuc` | String | River basin/watershed name |
| `Xa_Phuong` | String | Commune/ward location |
| `Huyen` | String | District location |
| `Tinh` | String | Province location |
| `Vung` | String | Region (Đông Bắc, Tây Bắc, Bắc Trung Bộ, Nam Trung Bộ) |
| `Chu_DT` | String | Investment owner/company |
| `Loai_hinh` | String | Ownership type (Nhà nước, Cổ phần, TNHH, Liên doanh) |
| `Von_ti_VND` | Number | Investment capital (billion VND) |
| `Khoi_Cong` | String | Construction start year |
| `Van_hanh` | String | Operation start year |
| `Khu_BT_AH` | String | Protected area affected (if any) |
| `Dan_TDC_ho` | Number | Number of relocated households |
| `Lat` | String | Latitude (DMS format) |
| `Long` | String | Longitude (DMS format) |
| `Nguon` | String | Data source |
| `Link` | String | Reference URL |
| `map_id` | String | Map identifier |

## Plant Status Categories
- **Đang vận hành**: Currently operational
- **Đang xây dựng**: Under construction
- **Đình chỉ**: Suspended/discontinued
- **Không biết**: Unknown

## Scale Classifications
- **Lớn** (Large): Typically > 100 MW capacity
- **Vừa** (Medium): Typically 30-100 MW capacity
- **Nhỏ** (Small): Typically < 30 MW capacity

## Regions Covered
- **Đông Bắc** (Northeast): Cao Bằng, Hà Giang, Lào Cai, etc.
- **Tây Bắc** (Northwest): Lai Châu, Hòa Bình, etc.
- **Bắc Trung Bộ** (North Central): Nghệ An, etc.
- **Nam Trung Bộ** (South Central): Quảng Nam, etc.

## License
This dataset is part of the SmartCity project and is licensed under **CC-BY-SA-4.0** (Creative Commons Attribution-ShareAlike 4.0 International).

See [LICENSES/CC-BY-SA-4.0.txt](../../LICENSES/CC-BY-SA-4.0.txt) for details.

## Usage
This data can be used for:
- Energy infrastructure mapping and analysis
- Power generation capacity planning
- Environmental impact assessment
- Hydroelectric resource management
- Grid planning and optimization
- Renewable energy research

## Data Notes
- Capacity values (`CSuat_MW`) are in Megawatts (MW)
- Annual production (`SL_nam_TrK`) is in million kilowatt-hours (million kWh)
- Investment capital (`Von_ti_VND`) is in billion Vietnamese Dong
- Reservoir capacity (`Dung_Tich`) is in million cubic meters (million m³)
- Some fields may be null for certain plants where data is not available

## Source
Data is compiled from various sources including:
- Vietnamese Electricity (EVN)
- Ministry of Industry and Trade
- Provincial energy companies
- Project documentation

Data is collected and maintained as part of the SmartCity project initiative.

## Contact
For questions or issues regarding this dataset, please refer to the main project [README](../../README.md).
