# Khóa API và kiểm soát truy cập

Trang này mô tả cách kiểm soát quyền ghi vào context broker trong triển khai LegoCity và cách chia sẻ khóa API hoặc token với các máy chủ cập nhật (update servers) và client đọc (read clients).

Nó dành cho những người:

- cấu hình bảo mật trên broker và proxy,
- vận hành các máy chủ cập nhật,
- cần hiểu cách quản lý thông tin xác thực (credentials) giữa các môi trường.

---

## Các mô hình truy cập

Trong LegoCity, có ba lớp truy cập chính vào broker và các API liên quan:

- **Quyền ghi vào broker (Write access to the broker)**
  Được cấp chỉ cho các máy chủ cập nhật và công cụ quản trị. Được sử dụng để tạo và cập nhật các thực thể NGSI-LD.

- **Quyền đọc nội bộ vào broker (Internal read access to the broker)**
  Được sử dụng bởi proxy và các dịch vụ nội bộ để truy vấn thực thể. Có thể có quyền rộng hơn nhưng không được lộ ra trình duyệt.

- **Quyền đọc công khai qua proxy (Public read access via the proxy)**
  Được sử dụng bởi dashboard và bất kỳ client bên ngoài nào. Bị giới hạn ở các endpoint cụ thể, thường đi kèm với giới hạn tần suất (rate limits).

LegoCity khuyến nghị:

- giới hạn quyền ghi cho một nhóm nhỏ các dịch vụ được kiểm soát,
- cung cấp quyền đọc cho UI thông qua một lớp proxy, không trực tiếp vào broker.

---

## Các biến cấu hình

Một triển khai nên chuẩn hóa cách truyền các endpoint broker và thông tin xác thực vào dịch vụ.

Các biến điển hình:

- `BROKER_URL`
  URL cơ sở của context broker NGSI-LD, ví dụ:
  `https://broker.example.com/ngsi-ld/v1`

- `BROKER_WRITE_KEY` hoặc `BROKER_WRITE_TOKEN`
  Thông tin xác thực (token, khóa API, v.v.) cho quyền ghi.

- `BROKER_READ_KEY` (tùy chọn)
  Thông tin xác thực cho quyền đọc, nếu broker bắt buộc xác thực đọc.

Các biến này được:

- định nghĩa theo môi trường (phát triển, staging, sản xuất),
- thiết lập như biến môi trường hoặc lưu trong trình quản lý bí mật (secret manager),
- không bao giờ được commit vào kho mã nguồn (source repository).

Ví dụ `.env` cho phát triển cục bộ:

    BROKER_URL=https://dev-broker.example.com/ngsi-ld/v1
    BROKER_WRITE_KEY=dev-broker-write-key
    BROKER_READ_KEY=dev-broker-read-key

Các file `.env` nên bị bỏ qua bởi version control.

---

## Cơ chế xác thực

Cơ chế xác thực thực tế phụ thuộc vào broker và hạ tầng được chọn. Các tùy chọn phổ biến:

- **Khóa API tĩnh hoặc token (Static API keys or tokens)**
  Khóa được gửi trong header như `Authorization` hoặc `X-API-Key`. Đơn giản để cấu hình.

- **Mutual TLS (mTLS)**
  Chứng chỉ client được dùng để xác thực dịch vụ. Bảo mật mạnh hơn, quản lý phức tạp hơn.

- **OAuth2 / OpenID Connect**
  Token được cấp bởi nhà cung cấp định danh (identity provider). Hữu ích khi broker là một phần của nền tảng lớn hơn có nhận diện danh tính.

LegoCity mong đợi rằng:

- các máy chủ cập nhật sử dụng các phương thức không tương tác (không đăng nhập thủ công),
- thông tin xác thực có thể cấu hình được, không bị hard-coded,
- cơ chế được chọn và các header bắt buộc phải được tài liệu hóa cho việc triển khai.

---

## Các mẫu khóa ghi (Write keys patterns)

Có nhiều cách để gán khóa ghi cho các máy chủ cập nhật. Triển khai phải chọn một cách và tài liệu hóa nó.

### Một khóa ghi dùng chung (Single shared write key)

Tất cả các máy chủ cập nhật sử dụng cùng một khóa hoặc token để ghi vào broker.

**Đặc điểm**

- một khóa ghi cho mỗi broker hoặc mỗi môi trường.

**Ưu điểm**

- đơn giản để hiểu,
- chi phí quản trị thấp.

**Nhược điểm**

- nếu một máy chủ bị xâm nhập, cùng một khóa có thể bị lạm dụng từ bất cứ đâu,
- thu hồi khóa yêu cầu cập nhật tất cả máy chủ cùng lúc.

Phù hợp cho các triển khai nhỏ hoặc nguyên mẫu (prototypes).

### Khóa riêng cho từng máy chủ cập nhật (Separate keys per update server)

Mỗi máy chủ cập nhật có khóa ghi hoặc token riêng.

**Đặc điểm**

- thông tin xác thực khác nhau cho mỗi máy chủ domain (`env-weather-server`, `water-flood-server`, `mobility-parking-server`, v.v.).

**Ưu điểm**

- việc xâm nhập một máy chủ không làm lộ quyền ghi của các máy chủ khác,
- quyền truy cập có thể bị thu hồi cho một máy chủ duy nhất mà không ảnh hưởng đến phần còn lại,
- có thể gán các phạm vi (scopes) khác nhau cho mỗi khóa.

**Nhược điểm**

- nhiều thông tin xác thực hơn để quản lý,
- cần nhiều tài liệu hơn để theo dõi quyền sở hữu.

Được khuyến nghị cho các triển khai nghiêm túc.

### Các mẫu lai (Hybrid patterns)

Một số triển khai có thể sử dụng một khóa cho mỗi domain:

- một khóa cho các máy chủ liên quan đến môi trường (environment),
- một khóa cho nước và ngập lụt,
- một khóa cho di chuyển (mobility).

Điểm quan trọng là mẫu phải ổn định, được tài liệu hóa và phản ánh trong giám sát và phản ứng sự cố.

---

## Lưu trữ và phân phối

Bất kể mẫu nào, khóa phải được lưu trữ và phân phối an toàn.

### Lưu trữ chấp nhận được

- biến môi trường được tiêm vào (injected) tại thời điểm triển khai,
- trình quản lý bí mật (secret managers) được cung cấp bởi nền tảng đám mây,
- kho cấu hình an toàn, tách biệt khỏi image ứng dụng.

### Lưu trữ không chấp nhận được

- khóa bị hard-coded trong mã nguồn,
- khóa được commit vào kho git,
- khóa được chia sẻ không chính thức qua các kênh không mã hóa.

### Cấu hình ví dụ

Cho ba máy chủ cập nhật:

- `env-weather-server`

  - `BROKER_URL`
  - `BROKER_WRITE_KEY_ENV`

- `water-flood-server`

  - `BROKER_URL`
  - `BROKER_WRITE_KEY_WATER`

- `mobility-parking-server`
  - `BROKER_URL`
  - `BROKER_WRITE_KEY_MOBILITY`

Mỗi dịch vụ đọc cấu hình của nó từ môi trường hoặc trình quản lý bí mật khi khởi động.

---

## Xoay vòng khóa (Key rotation)

Xoay vòng khóa thay thế các khóa hiện có bằng khóa mới mà không làm gián đoạn dịch vụ lâu dài.

Quy trình xoay vòng đơn giản:

1. **Tạo khóa mới (Generate new keys)**
   Tạo khóa hoặc token mới tại broker hoặc gateway. Lưu chúng vào trình quản lý bí mật hoặc hệ thống cấu hình.

2. **Cập nhật dịch vụ (Update services)**
   Cập nhật biến môi trường hoặc config cho mỗi máy chủ cập nhật để sử dụng khóa mới. Khởi động lại hoặc tải lại các máy chủ.

3. **Xác minh hoạt động (Verify operation)**
   Kiểm tra rằng các máy chủ cập nhật tiếp tục ghi thực thể thành công. Giám sát log và metrics cho lỗi ghi.

4. **Thu hồi khóa cũ (Revoke old keys)**
   Khi tất cả dịch vụ được xác nhận đang sử dụng khóa mới, xóa hoặc vô hiệu hóa các khóa cũ.

Tài liệu nên nêu rõ:

- nơi khóa được định nghĩa,
- ai được phép xoay vòng chúng,
- các tín hiệu giám sát nào chỉ ra việc xoay vòng thất bại.

---

## Quyền đọc và proxy

Quyền ghi và quyền đọc phải được xử lý khác nhau.

### Quyền đọc nội bộ (Internal read access)

Các dịch vụ nội bộ (proxy, analytics) có thể đọc trực tiếp từ broker. Tùy thuộc vào cấu hình, hoạt động đọc có thể:

- không hạn chế bên trong mạng tin cậy, hoặc
- được bảo vệ bởi khóa hoặc token chỉ đọc (read-only key).

Jika một khóa chỉ đọc được sử dụng, nó nên:

- khác biệt với khóa ghi,
- không bị lộ ra trình duyệt.

### Quyền đọc công khai qua proxy (Public read access via proxy)

Dashboard và các client công khai nên gọi **proxy**, không trực tiếp gọi broker. Proxy:

- thực hiện truy vấn đọc tới broker,
- chuyển đổi phản hồi thành cấu trúc đơn giản hơn,
- thực thi caching, giới hạn tần suất (rate limits) và kiểm soát truy cập.

Thông tin xác thực broker (đọc hoặc ghi) không bao giờ được nhúng trong mã frontend. Trình duyệt chỉ thấy URL proxy và bất kỳ khóa cấp proxy hoặc cơ chế xác thực người dùng nào.

---

## Kịch bản ví dụ

Xem xét một triển khai với:

- một broker tại `https://broker.city.example/ngsi-ld/v1`,
- ba máy chủ cập nhật: `env-weather-server`, `water-flood-server`, `mobility-parking-server`,
- một proxy tại `https://api.city.example`.

### Broker

Token ghi được cấu hình tại broker hoặc gateway:

- `TOKEN_ENV` cho các thực thể môi trường,
- `TOKEN_WATER` cho các thực thể nước và ngập lụt,
- `TOKEN_MOBILITY` cho các thực thể di chuyển.

### Máy chủ cập nhật (Update servers)

- `env-weather-server`

  - `BROKER_URL=https://broker.city.example/ngsi-ld/v1`
  - `BROKER_WRITE_TOKEN=TOKEN_ENV`

- `water-flood-server`

  - `BROKER_URL=https://broker.city.example/ngsi-ld/v1`
  - `BROKER_WRITE_TOKEN=TOKEN_WATER`

- `mobility-parking-server`
  - `BROKER_URL=https://broker.city.example/ngsi-ld/v1`
  - `BROKER_WRITE_TOKEN=TOKEN_MOBILITY`

Mỗi máy chủ gửi token của nó trong header thích hợp khi ghi thực thể.

### Proxy

- chạy tại `https://api.city.example`,
- sử dụng thông tin xác thực nội bộ hoặc mạng tin cậy để truy vấn broker,
- phơi bày các endpoint như:
  - `/map/weather`
  - `/map/flood-zones`
  - `/map/parking-facilities`

Dashboard gọi các endpoint này và không bao giờ thấy token cấp broker.

---

## Xử lý sự cố (Incident handling)

Nếu một khóa bị lộ hoặc nghi ngờ bị xâm nhập:

- xác định khóa nào bị lộ và dịch vụ nào sử dụng nó,
- thu hồi hoặc vô hiệu hóa khóa tại broker hoặc gateway,
- tạo và phân phối khóa thay thế nếu cần thiết,
- cập nhật cấu hình và khởi động lại các dịch vụ bị ảnh hưởng,
- xem xét log để tìm các nỗ lực ghi trái phép hoặc các mẫu khả nghi.

Tài liệu nên chỉ ra:

- nơi khóa có thể bị thu hồi,
- log hoặc dashboard nào hiển thị quyền truy cập broker,
- cách xác minh rằng các thực thể chưa bị hỏng.

---

## Tóm tắt

- Các máy chủ cập nhật là thành phần duy nhất có quyền ghi vào broker và sử dụng khóa hoặc token được định nghĩa qua cấu hình, không phải trong mã.
- Một triển khai phải chọn và tài liệu hóa một mẫu rõ ràng cho các khóa ghi (dùng chung, mỗi máy chủ, hoặc lai).
- Khóa phải được lưu trữ an toàn, xoay vòng thường xuyên, và thu hồi ngay lập tức nếu bị xâm nhập.
- Dashboard và client công khai lấy dữ liệu thông qua proxy; thông tin xác thực broker không bao giờ được lộ ra trình duyệt.
- Quyền đọc nội bộ, quyền đọc bên ngoài, và quyền ghi nên được cấu hình và giám sát riêng biệt.