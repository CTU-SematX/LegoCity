# Sample Data (Open Datasets)

Thư mục này chứa các dataset mẫu dùng để seed dữ liệu cho các Data Source servers. Dữ liệu được lưu trữ ở **định dạng JSON thuần** (plain JSON) và mô phỏng các thiết bị/cảm biến Smart City tại TP. Cần Thơ.

> **Note**: Dữ liệu ở định dạng JSON bình thường, không phải NGSI-LD. Các servers sẽ tự động convert sang NGSI-LD khi cần thiết thông qua endpoint `/ngsi-ld`.

## 📂 Danh sách Datasets

| File | Domain | Entity Type | Số records | Mô tả |
|------|--------|-------------|------------|-------|
| `traffic.json` | Giao thông | TrafficFlowObserved | 10 | Dữ liệu lưu lượng giao thông từ các trạm đo |
| `environment.json` | Môi trường | AirQualityObserved | 8 | Dữ liệu chất lượng không khí (AQI, PM2.5, NO2,...) |
| `lighting.json` | Dịch vụ công cộng | Streetlight | 10 | Dữ liệu đèn đường thông minh |
| `infrastructure.json` | Hạ tầng kỹ thuật | WaterSupply, Drainage, ElectricityGrid, Telecom | 11 | Dữ liệu hạ tầng đô thị |

## 🗂️ Cấu trúc dữ liệu

### Traffic Flow (Lưu lượng giao thông)

```json
{
  "stationId": "cantho-station-01",
  "name": "Trạm đo lưu lượng Nguyễn Văn Linh",
  "description": "Trạm đo lưu lượng giao thông tại đường Nguyễn Văn Linh",
  "longitude": 105.7469,
  "latitude": 10.0452,
  "dateObserved": "2025-12-03T08:00:00Z",
  "intensity": 450,
  "occupancy": 0.35,
  "averageVehicleSpeed": 42.5,
  "averageVehicleLength": 4.2,
  "congested": false,
  "laneId": 1,
  "roadSegment": "cantho-nvl-001"
}
```

### Air Quality (Chất lượng không khí)

```json
{
  "stationId": "cantho-aqi-01",
  "name": "Trạm quan trắc Ninh Kiều",
  "description": "Trạm quan trắc chất lượng không khí tại Q. Ninh Kiều",
  "longitude": 105.7469,
  "latitude": 10.0452,
  "dateObserved": "2025-12-03T08:00:00Z",
  "temperature": 28.5,
  "relativeHumidity": 75.0,
  "co": 0.8,
  "no2": 35.0,
  "so2": 12.0,
  "pm10": 45.0,
  "pm25": 28.0,
  "o3": 55.0,
  "airQualityIndex": 85,
  "airQualityLevel": "moderate",
  "reliability": 0.95
}
```

### Streetlight (Đèn đường)

```json
{
  "lampId": "cantho-sl-001",
  "name": "Đèn đường NK-001",
  "description": "Đèn LED thông minh tại đường Nguyễn Văn Linh",
  "longitude": 105.7469,
  "latitude": 10.0452,
  "status": "ok",
  "powerState": "on",
  "dateLastSwitchingOn": "2025-12-03T06:00:00Z",
  "dateLastSwitchingOff": "2025-12-02T18:30:00Z",
  "illuminanceLevel": 0.85,
  "powerConsumption": 45.5,
  "lanternHeight": 8.0,
  "lampType": "LED",
  "controllingMethod": "automatic",
  "streetlightGroup": "cantho-nk"
}
```

### Infrastructure (Hạ tầng)

File `infrastructure.json` chứa một object với 4 mảng:

```json
{
  "waterSupply": [...],
  "drainage": [...],
  "electricityGrid": [...],
  "telecom": [...]
}
```

Ví dụ Water Supply:
```json
{
  "stationId": "cantho-ws-01",
  "name": "Trạm cấp nước Ninh Kiều",
  "longitude": 105.7469,
  "latitude": 10.0452,
  "waterPressure": 3.5,
  "flowRate": 125.5,
  "chlorineLevel": 0.5,
  "status": "operational"
}
```

## 📍 Vị trí địa lý

Dữ liệu mô phỏng các địa điểm thực tế tại TP. Cần Thơ:

- **Q. Ninh Kiều**: Trung tâm thành phố
- **Q. Cái Răng**: Chợ nổi Cái Răng
- **Q. Bình Thủy**: Khu vực công nghiệp
- **Q. Ô Môn**: Khu vực ngoại ô
- **Q. Thốt Nốt**: Vùng ven
- **H. Phong Điền**: Nông thôn
- **KCN Trà Nóc**: Khu công nghiệp

## 🔗 Tham khảo

- [Smart Data Models](https://smartdatamodels.org/) - Chuẩn dữ liệu NGSI-LD
- [FIWARE Data Models](https://github.com/FIWARE/data-models) - Mô hình dữ liệu FIWARE

## 📝 Sử dụng

Dữ liệu được tự động load vào các servers khi khởi động (xem `/servers/README.md`).

Để thêm dữ liệu mới:

1. Tạo file JSON với format phù hợp
2. Cập nhật biến môi trường `DATA_PATH` của server tương ứng
3. Xóa database cũ để re-seed (hoặc dùng API để thêm thủ công)