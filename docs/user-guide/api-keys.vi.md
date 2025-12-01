# Khóa API và kiểm soát truy cập

Trang này mô tả cách kiểm soát quyền truy cập ghi vào context broker trong triển khai LegoCity và cách chia sẻ khóa API hoặc token với các update server và read client.

Trang này dành cho những người:

- cấu hình bảo mật trên broker và proxy,
- vận hành các update server,
- cần hiểu cách quản lý thông tin xác thực qua các môi trường.

---

## Các mẫu truy cập

Trong LegoCity, có ba lớp truy cập chính vào broker và các API liên quan:

- **Truy cập ghi vào broker**  
  Chỉ được cấp cho các update server và công cụ quản trị. Dùng để tạo và cập nhật các NGSI-LD entity.

- **Truy cập đọc nội bộ vào broker**  
  Được sử dụng bởi proxy và các dịch vụ nội bộ để truy vấn entity. Có thể có quyền rộng hơn nhưng không được expose ra trình duyệt.

- **Truy cập đọc công khai qua proxy**  
  Được sử dụng bởi dashboard và bất kỳ client ngoài nào. Bị giới hạn ở các endpoint cụ thể, thường có rate limit.

LegoCity khuyến nghị:

- giới hạn quyền truy cập ghi cho một tập nhỏ các dịch vụ được kiểm soát,
- expose quyền truy cập đọc cho UI thông qua một lớp proxy, không trực tiếp đến broker.

---

## Các biến cấu hình

Một triển khai nên chuẩn hóa cách truyền các endpoint của broker và thông tin xác thực vào các dịch vụ.

Các biến điển hình:

- `BROKER_URL`  
  URL cơ sở của NGSI-LD context broker, ví dụ:  
  `https://broker.example.com/ngsi-ld/v1`

- `BROKER_WRITE_KEY` hoặc `BROKER_WRITE_TOKEN`  
  Thông tin xác thực (token, API key, v.v.) cho quyền truy cập ghi.

- `BROKER_READ_KEY` (tùy chọn)  
  Thông tin xác thực cho quyền truy cập đọc, nếu broker thực thi xác thực đọc.

Các biến này là:

- được định nghĩa cho mỗi môi trường (development, staging, production),
- được đặt làm biến môi trường hoặc lưu trữ trong một secret manager,
- không bao giờ được commit vào source repository.

Ví dụ `.env` cho development local:

    BROKER_URL=https://dev-broker.example.com/ngsi-ld/v1
    BROKER_WRITE_KEY=dev-broker-write-key
    BROKER_READ_KEY=dev-broker-read-key

Các file `.env` nên được bỏ qua bởi version control.

---

## Cơ chế xác thực

Cơ chế xác thực thực tế phụ thuộc vào broker và cơ sở hạ tầng được chọn. Các tùy chọn phổ biến:

- **Khóa API hoặc token tĩnh**  
  Khóa được gửi trong header như `Authorization` hoặc `X-API-Key`. Đơn giản để cấu hình.

- **Mutual TLS (mTLS)**  
  Client certificate được sử dụng để xác thực các dịch vụ. Bảo mật mạnh hơn, quản lý phức tạp hơn.

- **OAuth2 / OpenID Connect**  
  Token được cấp bởi một identity provider. Hữu ích khi broker là một phần của nền tảng nhận diện lớn hơn.

LegoCity mong đợi rằng:

- các update server sử dụng các phương pháp không tương tác (không đăng nhập thủ công),
- thông tin xác thực có thể cấu hình được, không hard-code,
- cơ chế được chọn và các header yêu cầu được ghi lại cho triển khai.

---

## Các mẫu cho khóa ghi

Có nhiều cách để gán khóa ghi cho các update server. Triển khai phải chọn một cách và ghi lại nó.

### Khóa ghi được chia sẻ đơn

Tất cả các update server sử dụng cùng một khóa hoặc token để ghi vào broker.

**Đặc điểm**

- một khóa ghi cho mỗi broker hoặc mỗi môi trường.

**Ưu điểm**

- đơn giản để suy luận,
- chi phí quản trị thấp.

**Nhược điểm**

- nếu một server bị xâm phạm, cùng một khóa có thể bị lạm dụng từ bất cứ đâu,
- thu hồi khóa yêu cầu cập nhật tất cả các server cùng lúc.

Phù hợp cho các triển khai nhỏ hoặc prototype.

### Khóa riêng cho mỗi update server

Mỗi update server có khóa ghi hoặc token riêng của nó.

**Đặc điểm**

- thông tin xác thực khác nhau cho mỗi domain server (`env-weather-server`, `water-flood-server`, `mobility-parking-server`, v.v.).

**Ưu điểm**

- xâm phạm một server không expose quyền truy cập ghi từ các server khác,
- quyền truy cập có thể bị thu hồi cho một server duy nhất mà không ảnh hưởng đến phần còn lại,
- có thể gán các scope khác nhau cho mỗi khóa.

**Nhược điểm**

- nhiều thông tin xác thực hơn để quản lý,
- cần nhiều tài liệu hơn để theo dõi quyền sở hữu.

Được khuyến nghị cho các triển khai nghiêm túc.

### Các mẫu hybrid

Một số triển khai có thể sử dụng một khóa cho mỗi domain:

- một khóa cho các server liên quan đến môi trường,
- một khóa cho nước và lũ lụt,
- một khóa cho di chuyển.

Điểm quan trọng là mẫu phải ổn định, được ghi lại, và được phản ánh trong giám sát và phản ứng sự cố.

---

## Lưu trữ và phân phối

Bất kể mẫu nào, các khóa phải được lưu trữ và phân phối một cách an toàn.

### Lưu trữ chấp nhận được

- biến môi trường được inject vào thời điểm triển khai,
- secret manager do các nền tảng đám mây cung cấp,
- các cửa hàng cấu hình an toàn, tách biệt khỏi application image.

### Lưu trữ không chấp nhận được

- khóa hard-code trong source code,
- khóa được commit vào git repository,
- khóa được chia sẻ một cách không chính thức qua các kênh không mã hóa.

### Ví dụ cấu hình

Cho ba update server:

- `env-weather-server`

  - `BROKER_URL`
  - `BROKER_WRITE_KEY_ENV`

- `water-flood-server`

  - `BROKER_URL`
  - `BROKER_WRITE_KEY_WATER`

- `mobility-parking-server`
  - `BROKER_URL`
  - `BROKER_WRITE_KEY_MOBILITY`

Mỗi dịch vụ đọc cấu hình của nó từ môi trường hoặc một secret manager khi khởi động.

---

## Xoay vòng khóa

Xoay vòng khóa thay thế các khóa hiện có bằng các khóa mới mà không gián đoạn dịch vụ lâu.

Một quy trình xoay vòng đơn giản:

1. **Tạo khóa mới**  
   Tạo khóa hoặc token mới tại broker hoặc gateway. Lưu chúng trong secret manager hoặc hệ thống cấu hình.

2. **Cập nhật các dịch vụ**  
   Cập nhật biến môi trường hoặc config cho mỗi update server để sử dụng khóa mới. Restart hoặc reload các server.

3. **Xác minh hoạt động**  
   Kiểm tra rằng các update server tiếp tục ghi entity thành công. Giám sát log và metric cho các lỗi ghi.

4. **Thu hồi các khóa cũ**  
   Khi tất cả các dịch vụ được xác nhận sử dụng khóa mới, xóa hoặc vô hiệu hóa các khóa cũ.

Tài liệu nên nêu rõ:

- nơi các khóa được định nghĩa,
- ai được phép xoay vòng chúng,
- tín hiệu giám sát nào cho biết một xoay vòng thất bại.

---

## Truy cập đọc và proxy

Truy cập ghi và truy cập đọc phải được xử lý khác nhau.

### Truy cập đọc nội bộ

Các dịch vụ nội bộ (proxy, analytics) có thể đọc trực tiếp từ broker. Tùy thuộc vào cấu hình, các hoạt động đọc có thể là:

- không hạn chế bên trong một mạng đáng tin cậy, hoặc
- được bảo vệ bởi một khóa hoặc token chỉ đọc.

Nếu một khóa chỉ đọc được sử dụng, nó nên là:

- khác biệt với các khóa ghi,
- không được expose ra trình duyệt.

### Truy cập đọc công khai qua proxy

Dashboard và các client công khai nên gọi **proxy**, không phải broker trực tiếp. Proxy:

- phát hành các truy vấn đọc tới broker,
- chuyển đổi các response thành các cấu trúc đơn giản hơn,
- thực thi caching, rate limit và kiểm soát truy cập.

Thông tin xác thực broker (đọc hoặc ghi) không bao giờ được nhúng trong frontend code. Trình duyệt chỉ thấy URL proxy và bất kỳ khóa cấp proxy hoặc cơ chế xác thực người dùng nào.

---

## Ví dụ kịch bản

Xem xét một triển khai với:

- một broker tại `https://broker.city.example/ngsi-ld/v1`,
- ba update server: `env-weather-server`, `water-flood-server`, `mobility-parking-server`,
- một proxy tại `https://api.city.example`.

### Broker

Token ghi được cấu hình tại broker hoặc gateway:

- `TOKEN_ENV` cho các entity môi trường,
- `TOKEN_WATER` cho các entity nước và lũ lụt,
- `TOKEN_MOBILITY` cho các entity di chuyển.

### Update server

- `env-weather-server`

  - `BROKER_URL=https://broker.city.example/ngsi-ld/v1`
  - `BROKER_WRITE_TOKEN=TOKEN_ENV`

- `water-flood-server`

  - `BROKER_URL=https://broker.city.example/ngsi-ld/v1`
  - `BROKER_WRITE_TOKEN=TOKEN_WATER`

- `mobility-parking-server`
  - `BROKER_URL=https://broker.city.example/ngsi-ld/v1`
  - `BROKER_WRITE_TOKEN=TOKEN_MOBILITY`

Mỗi server gửi token của nó trong header thích hợp khi ghi entity.

### Proxy

- chạy tại `https://api.city.example`,
- sử dụng thông tin xác thực nội bộ hoặc network trust để truy vấn broker,
- expose các endpoint như:
  - `/map/weather`
  - `/map/flood-zones`
  - `/map/parking-facilities`

Dashboard gọi các endpoint này và không bao giờ thấy token cấp broker.

---

## Xử lý sự cố

Nếu một khóa bị lộ hoặc nghi ngờ bị xâm phạm:

- xác định khóa nào bị lộ và dịch vụ nào sử dụng nó,
- thu hồi hoặc vô hiệu hóa khóa tại broker hoặc gateway,
- tạo và phân phối một khóa thay thế khi cần thiết,
- cập nhật cấu hình và restart các dịch vụ bị ảnh hưởng,
- xem lại log cho các nỗ lực ghi trái phép hoặc các mẫu đáng ngờ.

Tài liệu nên chỉ ra:

- nơi các khóa có thể bị thu hồi,
- log hoặc dashboard nào hiển thị quyền truy cập broker,
- cách xác minh rằng các entity không bị hỏng.

---

## Tóm tắt

- Các update server là các thành phần duy nhất có quyền truy cập ghi vào broker và sử dụng các khóa hoặc token được định nghĩa qua cấu hình, không trong code.
- Một triển khai phải chọn và ghi lại một mẫu rõ ràng cho các khóa ghi (được chia sẻ, theo server, hoặc hybrid).
- Các khóa phải được lưu trữ an toàn, xoay vòng thường xuyên, và thu hồi ngay lập tức nếu bị xâm phạm.
- Dashboard và các client công khai lấy dữ liệu thông qua proxy; thông tin xác thực broker không bao giờ được expose ra trình duyệt.
- Truy cập đọc nội bộ, truy cập đọc bên ngoài và truy cập ghi nên được cấu hình và giám sát riêng biệt.
