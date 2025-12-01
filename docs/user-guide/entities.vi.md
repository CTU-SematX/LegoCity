# Entity

Trang này mô tả cách LegoCity biểu diễn thông tin thành phố dưới dạng **NGSI-LD entity**, cách sử dụng **Smart Data Model** và các quy ước nào áp dụng cho định danh, thuộc tính và domain.

Trang này dành cho những người:

- thiết kế mô hình dữ liệu cho triển khai LegoCity,
- triển khai các update server tạo và cập nhật entity,
- xây dựng các endpoint proxy hoặc lớp UI truy vấn entity.

---

## 1. Vai trò của entity trong LegoCity

Trong LegoCity, hầu hết mọi thứ xuất hiện trên bản đồ hoặc trong dashboard đều được hỗ trợ bởi một hoặc nhiều entity.

Ví dụ:

- một cảm biến đo nhiệt độ và độ ẩm  
  → một entity `WeatherObserved` cho mỗi điểm quan sát;
- một khu vực dễ bị lũ lụt  
  → một entity `FloodZone` với hình học đa giác;
- một bệnh viện công  
  → một entity `HealthFacility` với các thuộc tính dịch vụ và vị trí điểm;
- một nhà đỗ xe  
  → một entity `ParkingFacility` với sức chứa, tỷ lệ lấp đầy và trạng thái.

Các quy tắc là:

- nếu một khái niệm cần xuất hiện trong UI hoặc được truy vấn, nó nên có một **loại entity** tương ứng,
- các update server tạo và cập nhật entity theo logic domain-specific,
- broker lưu trữ các entity này và cung cấp một view nhất quán của thành phố.

---

### 1.1 Cấu trúc của một Entity (Ví dụ)

- Trước khi đi vào chi tiết, đây là những gì một entity cụ thể trông như thế nào trong LegoCity (được biểu diễn trong JSON-LD).
- Chú ý `type`, `id`, và cách các thuộc tính được cấu trúc với `value` và `unitCode`.

```json
{
  "id": "urn:ngsi-ld:WeatherObserved:ctu:station:STATION_001",
  "type": "WeatherObserved",
  "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
  "temperature": {
    "type": "Property",
    "value": 30.5,
    "unitCode": "CEL"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [105.78, 10.04]
    }
  },
  "observedAt": {
    "type": "Property",
    "value": "2023-11-29T10:00:00Z"
  }
}
```

## 2. Loại entity và domain

Một triển khai LegoCity nên duy trì một danh sách rõ ràng các **loại entity** đang sử dụng, được nhóm theo **domain**.

### 2.1 Ví dụ cấu trúc domain

Các domain chính xác phụ thuộc vào dự án, nhưng một phân chia điển hình là:

- **Môi trường**

  - `WeatherObserved` – quan sát điểm về thời tiết tại các vị trí cụ thể.
  - `AirQualityObserved` – đo lường chất lượng không khí từ các cảm biến cố định hoặc di động.

- **Nước và lũ lụt**

  - `FloodZone` – đa giác đại diện cho các khu vực có nguy cơ hoặc hiện đang bị lũ lụt.
  - `WaterLevel` – mức nước hiện tại tại các trạm cụ thể.

- **Di chuyển và vận tải**

  - `ParkingFacility` – cấu trúc đỗ xe ngoài đường (nhà xe, bãi đỗ).
  - `ParkingSpot` – không gian đỗ xe riêng lẻ (tùy chọn, nếu cần).
  - `PublicTransportStop` – điểm dừng xe buýt hoặc vận chuyển với vị trí và tuyến được phục vụ.

- **Dịch vụ công**

  - `HealthFacility` – bệnh viện, phòng khám và các dịch vụ liên quan.
  - `EducationalFacility` – trường học và trường đại học.
  - `PublicService` – dịch vụ công hành chính hoặc mục đích chung.

- **Cơ sở hạ tầng và tài sản**
  - `ChargingStation` – điểm sạc EV.
  - `Camera` – camera giám sát.

> Ví dụ:
> Một dashboard lũ lụt có thể sử dụng entity `FloodZone` và `WaterLevel`, trong khi một dashboard di chuyển sử dụng `ParkingFacility` và `PublicTransportStop`.
> Cả hai dashboard đều đọc từ cùng một broker nhưng tập trung vào các loại entity khác nhau.

### 2.2 Danh mục entity

Đối với mỗi loại entity trong triển khai, tài liệu nên duy trì một mục danh mục.

---

## 3. Smart Data Model

Khi có thể, LegoCity nên dựa các định nghĩa entity trên **FIWARE Smart Data Model**.

### 3.1 Tại sao sử dụng Smart Data Model

Sử dụng Smart Data Model cung cấp:

- tên thuộc tính nhất quán trên các triển khai,
- một điểm khởi đầu rõ ràng cho các domain mới,
- dễ dàng tái sử dụng các ví dụ và công cụ cộng đồng,
- ít mơ hồ hơn khi nhiều nhóm làm việc trên cùng một domain.

### 3.2 Chiến lược áp dụng

Đối với mỗi loại entity, quyết định một trong những điều sau:

- **Áp dụng trực tiếp**
  Sử dụng Smart Data Model như đã định nghĩa.
  Ví dụ: sử dụng `WeatherObserved` chính xác như được định nghĩa trong tài liệu Smart Data Model.

- **Áp dụng với mở rộng**
  Sử dụng Smart Data Model làm cơ sở, nhưng thêm các thuộc tính specific cho dự án.
  Ví dụ:

  - `WeatherObserved` với một thuộc tính bổ sung `localAlertCode` chỉ được sử dụng trong thành phố này.

- **Mô hình tùy chỉnh**
  Định nghĩa một loại entity specific cho dự án khi không có Smart Data Model phù hợp nào tồn tại.
  Ví dụ:
  - `FloodZone` được định nghĩa xung quanh một bản đồ rủi ro lũ lụt tùy chỉnh có các thuộc tính `riskLevel`, `sourceDataset`, `validUntil`.

Đối với mỗi loại, danh mục entity nên nêu rõ chiến lược nào đã được chọn.

### 3.3 JSON-LD Context (`@context`)

Trong NGSI-LD, mọi entity phải bao gồm (hoặc liên kết đến) một `@context`. Điều này cho hệ thống biết cách diễn giải tên thuộc tính (ví dụ: `temperature` tham chiếu đến một định nghĩa cụ thể trong từ điển Smart Data Model).

Trong LegoCity:

- Update server phải nối thêm URL `@context` chính xác khi gửi dữ liệu.
- Proxy và dashboard thường làm việc với dữ liệu được mở rộng hoặc một context mặc định.

---

## 4. Định danh (`id`)

Định danh entity phải là:

- duy nhất trong broker (hoặc ít nhất trong domain liên quan),
- ổn định trong suốt vòng đời của entity,
- đủ dự đoán để hỗ trợ liên kết giữa các hệ thống.

### 4.1 Các mẫu định danh

Một triển khai LegoCity nên chọn một mẫu và ghi lại nó.

Ví dụ mẫu:

- Đối với tài sản tĩnh (cơ sở đỗ xe, bệnh viện):
  `urn:ngsi-ld:ParkingFacility:ctu:parking:CTU_PARK_A`
  `urn:ngsi-ld:HealthFacility:ctu:hospital:CTU_HOSP_01`

- Đối với entity quan sát trong đó một entity đại diện cho **một chuỗi thời gian tại một vị trí**:
  `urn:ngsi-ld:WeatherObserved:ctu:station:STATION_001`
  (thuộc tính được cập nhật theo thời gian, không có timestamp trong ID)

- Đối với entity quan sát trong đó mỗi entity đại diện cho **một điểm duy nhất trong thời gian**:
  `urn:ngsi-ld:WeatherObserved:ctu:station:STATION_001:2025-11-29T10:00:00Z`

Sự lựa chọn giữa hai mẫu cuối cùng ảnh hưởng đến:

- liệu bạn chỉ giữ trạng thái mới nhất trong broker, hay
- liệu bạn muốn nhiều entity theo thời gian cho các truy vấn temporal.

### 4.2 Vòng đời ID

Tài liệu nên làm rõ cho mỗi loại:

- liệu ID có vĩnh viễn (không bao giờ được tái sử dụng) hay có thể được gán lại,
- cách xử lý việc xóa.

Ví dụ:

- Entity `ParkingFacility`: ID là vĩnh viễn. Nếu một cơ sở đóng cửa, một thuộc tính `status` thay đổi thành `closed` thay vì xóa entity.
- `WeatherObserved` (mô hình chỉ mới nhất): entity tồn tại, thuộc tính được cập nhật; các giá trị cũ không được xử lý riêng biệt.

---

## 5. Thuộc tính không gian địa lý

Vì LegoCity tập trung vào bản đồ, các thuộc tính không gian địa lý phải được xử lý nhất quán.

### 5.1 Các quy ước phổ biến

Một quy ước điển hình là:

- sử dụng `location` làm thuộc tính không gian địa lý chính,
- biểu diễn:
  - cảm biến và cơ sở như **Point**,
  - các vùng (lũ lụt, hành chính) như **Polygon**.

Ví dụ:

- `WeatherObserved.location` → Point tại tọa độ cảm biến.
- `ParkingFacility.location` → Point tại lối vào hoặc trung tâm.
- `FloodZone.location` → Polygon đại diện cho khu vực có nguy cơ.

Tất cả các tọa độ nên sử dụng cùng một hệ thống tham chiếu tọa độ, thường là WGS84 (`[longitude, latitude]`).

### 5.2 Kỳ vọng không gian địa lý cho mỗi loại

Đối với mỗi loại entity, danh mục entity nên chỉ định:

- liệu `location` có bắt buộc không,
- loại hình học nào hợp lệ.

Ví dụ:

- `WeatherObserved` – `location` bắt buộc, loại hình học: Point.
- `FloodZone` – `location` bắt buộc, loại hình học: Polygon.
- `PublicTransportStop` – `location` bắt buộc, loại hình học: Point.
- `PublicService` – `location` bắt buộc, loại hình học: Point; cũng có thể bao gồm một địa chỉ như một thuộc tính riêng biệt.

---

## 6. Thuộc tính thời gian

Thuộc tính thời gian cho biết khi nào dữ liệu được quan sát hoặc cập nhật lần cuối.

### 6.1 Timestamp quan sát vs hệ thống

Ví dụ:

- `WeatherObserved`:

  - `observedAt` – khi đo lường được thực hiện tại trạm,
  - `lastUpdate` – khi update server ghi entity này lần cuối (tùy chọn).

- `WaterLevel`:

  - `observedAt` – thời gian của bài đọc mức nước.

- `FloodZone`:
  - `validFrom` và `validTo` – khoảng thời gian mà bản đồ lũ lụt hợp lệ, hoặc
  - `lastAssessment` – khi vùng được đánh giá lần cuối.

Đối với entity tĩnh (ví dụ: `HealthFacility`):

- `createdAt` – khi entity được tạo trong hệ thống,
- `modifiedAt` – khi các thuộc tính chính được cập nhật lần cuối.

### 6.2 Sử dụng trong LegoCity

Tài liệu nên chỉ định, cho mỗi loại entity:

- thuộc tính thời gian nào mà UI sử dụng để quyết định liệu dữ liệu có "tươi" không,
- liệu các mục cũ hơn một ngưỡng nhất định có nên được làm nổi bật hoặc ẩn.

Ví dụ:

- Đối với `WeatherObserved`, nếu `observedAt` cũ hơn 3 giờ, UI có thể:
  - hiển thị một biểu tượng cảnh báo, hoặc
  - làm nhạt dấu hiệu trên bản đồ.

---

## 7. Thuộc tính cốt lõi và chất lượng

Ngoài ID, vị trí và thời gian, mỗi loại entity có các thuộc tính specific cho domain.

### 7.1 Thuộc tính cốt lõi

Mỗi loại entity nên có một tập nhỏ các **thuộc tính cốt lõi** mà:

- được yêu cầu để hiển thị có ý nghĩa,
- được mong đợi trong hoạt động bình thường,
- được sử dụng để tạo kiểu và lọc.

Ví dụ:

- `WeatherObserved` (Môi trường):

  - `temperature`, `relativeHumidity`, `pressure`, `observedAt`, `location`.

- `FloodZone` (Nước & lũ lụt):

  - `riskLevel` (ví dụ: thấp / trung bình / cao),
  - `status` (ví dụ: active / inactive),
  - `location` (Polygon).

- `ParkingFacility` (Di chuyển):
  - `totalCapacity`,
  - `currentOccupancy`,
  - `status` (mở / đóng),
  - `location`.

Danh mục entity nên liệt kê các thuộc tính cốt lõi này một cách rõ ràng.

### 7.2 Chất lượng dữ liệu và trạng thái

Một số domain yêu cầu các chỉ số chất lượng.

Ví dụ:

- `WeatherObserved`:

  - `qualityIndex` hoặc cờ `validity` cho các bài đọc cảm biến.

- `AirQualityObserved`:

  - `aqi` (chỉ số chất lượng không khí),
  - `source` (tên nhà cung cấp),
  - `confidence` (tùy chọn).

- `FloodZone`:
  - `sourceDataset`,
  - `confidenceLevel`.

Các thuộc tính này có thể được sử dụng để:

- lọc ra dữ liệu chất lượng thấp trong proxy hoặc UI,
- hiển thị cảnh báo hoặc chỉ số độ tin cậy cho người dùng.

---

## 8. Mối quan hệ giữa các entity

Các mối quan hệ NGSI-LD liên kết rõ ràng các entity.

### 8.1 Ví dụ về mối quan hệ

Các mẫu mối quan hệ phổ biến trong bối cảnh thành phố thông minh:

- `ParkingSpot` → `ParkingFacility`
  Mối quan hệ: `belongsToFacility` (chỗ thuộc về cơ sở).

- `PublicService` → `FloodZone`
  Mối quan hệ: `locatedWithin` (dịch vụ nằm trong vùng lũ lụt).

- `WeatherObserved` → `WeatherStation` (nếu các trạm được mô hình hóa như các entity riêng biệt).

Các mối quan hệ này cho phép:

- truy vấn tất cả các chỗ đỗ xe cho một cơ sở nhất định,
- tìm tất cả các dịch vụ công hiện đang trong vùng lũ lụt rủi ro cao,
- liên kết các quan sát với các trạm vật lý của chúng.

### 8.2 Hướng dẫn thiết kế

Khi quyết định xem có nên sử dụng một mối quan hệ hay chỉ sao chép thông tin:

- sử dụng mối quan hệ khi:

  - nhiều entity tham chiếu đến cùng một đối tượng (ví dụ: nhiều `ParkingSpot` đến một `ParkingFacility`),
  - bạn cần giữ các thuộc tính của đối tượng trung tâm ở một nơi (ví dụ: tên cơ sở, địa chỉ).

- sử dụng thuộc tính trùng lặp khi:
  - liên kết không bắt buộc,
  - hoặc khi sự đơn giản quan trọng hơn chuẩn hóa.

Đối với mỗi mối quan hệ được sử dụng, tài liệu nên chỉ định:

- loại nguồn,
- loại đích,
- tên thuộc tính cho mối quan hệ,
- cardinality (một-một, một-nhiều).

### 8.3 Chi tiết triển khai

Về mặt kỹ thuật, một mối quan hệ trong NGSI-LD khác với một thuộc tính thông thường. Nó phải sử dụng `"type": "Relationship"` và lưu trữ ID đích trong `"object"` (không phải `"value"`).

Ví dụ về một Chỗ đỗ xe được liên kết với một Cơ sở:

```json
"refParkingFacility": {
  "type": "Relationship",
  "object": "urn:ngsi-ld:ParkingFacility:ctu:parking:CTU_PARK_A"
}
```

---

## 9. Thiết kế các loại entity mới

Khi các yêu cầu mới xuất hiện, các loại entity bổ sung có thể cần thiết. Một quy trình nhất quán nên được tuân theo.

### 9.1 Quy trình từng bước

1. **Làm rõ trường hợp sử dụng**

   Ví dụ:
   "Chúng ta cần hiển thị đóng đường tạm thời do xây dựng."

2. **Kiểm tra các mô hình hiện có**

   - Xem liệu Smart Data Model đã có loại entity cho điều này chưa (ví dụ: các đoạn đường, sự kiện).
   - Nếu có, điều chỉnh hoặc mở rộng nó.

3. **Định nghĩa các thuộc tính cơ bản**

   - Chọn một tên loại, ví dụ: `RoadClosure`.
   - Quyết định liệu nó là tĩnh (một entity cho mỗi đoạn đường) hay dựa trên sự kiện (một entity cho mỗi sự kiện đóng cửa).
   - Quyết định thuộc tính nào là bắt buộc:
     - `location` (đường hoặc đa giác),
     - `reason`,
     - `startTime`, `endTime`,
     - `affectedTransportModes`.

4. **Chọn một mẫu ID**

   - Ví dụ: `urn:ngsi-ld:RoadClosure:ctu:RC_2025_0001`.

5. **Ghi lại loại**

   - Thêm nó vào danh mục entity với domain "Di chuyển",
   - Chỉ định update server nào sẽ quản lý nó,
   - Mô tả ngữ nghĩa thuộc tính một cách ngắn gọn.

6. **Triển khai và kiểm tra**

   - Update server tạo một số lượng nhỏ entity trong môi trường kiểm tra,
   - Nhóm dashboard kiểm tra rằng dữ liệu xuất hiện chính xác và các thuộc tính đủ.

### 9.2 Ví dụ định nghĩa entity (kiểu tóm tắt)

Đối với tài liệu, một bản tóm tắt ngắn gọn cho mỗi loại entity thường đủ:

> **Entity: ParkingFacility**
> Domain: Di chuyển
> Mô hình: FIWARE Smart Data Model (mở rộng với `localCode`)
> Mẫu ID: `urn:ngsi-ld:ParkingFacility:<city>:<facilityCode>`
> Hình học: `location` (Point)
> Thuộc tính cốt lõi:
>
> - `name`
> - `totalCapacity`
> - `currentOccupancy`
> - `status` (mở / đóng)
> - `localCode` (định danh nội bộ)

Mức độ chi tiết này thường đủ cho các nhà phát triển và người tích hợp.

---

## 10. Trách nhiệm tài liệu

Các định nghĩa entity là các hợp đồng được chia sẻ giữa:

- các nhóm tích hợp (update server),
- các nhóm backend (proxy và API),
- các nhóm frontend (dashboard và khối).

Để tránh sự phân kỳ:

- giữ danh mục entity dưới version control cùng với code,
- xử lý các thay đổi đối với các loại entity như các thay đổi đối với một hợp đồng công khai,
- yêu cầu rằng các loại mới hoặc đã sửa đổi được ghi lại trước khi chúng được sử dụng trong dữ liệu production.

Ngay cả khi một JSON schema đầy đủ không được duy trì, tài liệu nên luôn bao gồm:

- tên loại và domain,
- mẫu ID,
- thuộc tính không gian địa lý và thời gian,
- thuộc tính cốt lõi,
- bất kỳ mối quan hệ quan trọng nào.

---

## 11. Tóm tắt

- Entity là các đơn vị cơ bản của ngữ cảnh thành phố trong LegoCity; hầu hết mọi thứ hiển thị trong UI đều được hỗ trợ bởi các entity trong broker.
- Mỗi triển khai nên duy trì một danh mục entity liệt kê các loại, domain, nguồn và thuộc tính cốt lõi, với các ví dụ cụ thể nhỏ.
- Smart Data Model nên được sử dụng bất cứ khi nào có thể; khi cần các mô hình tùy chỉnh, chúng phải được mô tả rõ ràng.
- Các mẫu định danh, thuộc tính không gian địa lý, thuộc tính thời gian và mối quan hệ phải tuân theo các quy ước được chia sẻ để các truy vấn và hình ảnh hóa hoạt động dự đoán được.
- Khi các loại entity mới được giới thiệu, chúng nên tuân theo một quy trình thiết kế nhất quán, được ghi lại và được kiểm tra end-to-end trước khi áp dụng.
