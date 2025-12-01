# Sample update server

Trang này mô tả **sample update server** nên được bao gồm với LegoCity.  
Sample là một dịch vụ nhỏ, độc lập cho thấy cách:

- đọc cấu hình (URL broker, token, khóa API bên ngoài),
- lấy dữ liệu từ một nguồn bên ngoài,
- chuyển đổi nó thành các NGSI-LD entity,
- ghi entity vào context broker.

Nó dành cho:

- người dùng mới muốn xác minh broker và luồng dữ liệu của họ,
- các nhà phát triển cần một điểm khởi đầu để xây dựng các update server thực.

---

## Mục đích và phạm vi

Sample update server không phải là một thành phần production. Mục tiêu của nó là:

- **Trình diễn**  
  Hiển thị một đường dẫn end-to-end từ một nguồn dữ liệu bên ngoài đến các entity trong broker.

- **Template**  
  Cung cấp một cấu trúc tối thiểu có thể được sao chép và mở rộng cho các tích hợp thực.

- **Xác minh**  
  Cho phép các nhà vận hành nhanh chóng xác nhận rằng:
  - broker có thể truy cập được,
  - xác thực được cấu hình chính xác,
  - các entity trở nên hiển thị trong dashboard.

Sample server nên là:

- đủ nhỏ để đọc trong một lần ngồi,
- tập trung vào một domain (thường là môi trường),
- an toàn để chạy trong môi trường development.

---

## Ví dụ domain và loại entity

Để giữ cho sample cụ thể, nó được khuyến nghị tập trung vào một domain đơn giản như **quan sát thời tiết**.

Lựa chọn điển hình:

- **Domain:** Môi trường
- **Loại entity:** `WeatherObserved`
- **Nguồn dữ liệu:** API thời tiết công khai hoặc dữ liệu kiểm tra tĩnh

Hành vi mong đợi:

- lấy thời tiết hiện tại cho một hoặc một vài vị trí,
- ánh xạ response thành một hoặc nhiều entity `WeatherObserved`,
- ghi các entity vào broker,
- tùy chọn lặp lại điều này trên một bộ đếm thời gian (ví dụ: mỗi 5–10 phút).

Mô hình entity nên tuân theo các quy ước giống như được mô tả trong phần **Entity**:

- ID ổn định cho mỗi vị trí,
- thuộc tính `location` (Point),
- timestamp `observedAt`,
- các thuộc tính cốt lõi như `temperature` và `relativeHumidity`.

---

## Vị trí repository

Repository LegoCity nên chứa sample update server trong một thư mục được đặt tên rõ ràng, ví dụ:

- `services/sample-update-server/`
- hoặc `examples/update-server-weather/`

Thư mục nên bao gồm:

- code ứng dụng,
- một README tối thiểu specific cho server,
- các ví dụ cấu hình (ví dụ: `.env.example`),
- bất kỳ script hoặc Dockerfile nào được sử dụng để chạy nó.

Trang tài liệu này mô tả hành vi dự định; repository chứa các chi tiết triển khai thực tế.

---

## Cấu hình

Sample update server phải có thể cấu hình được chỉ thông qua các biến môi trường hoặc file cấu hình, không bằng cách chỉnh sửa source code.

Các biến cấu hình điển hình:

- kết nối broker:

  - `BROKER_URL`  
    URL cơ sở của NGSI-LD context broker.

  - `BROKER_WRITE_KEY` hoặc `BROKER_WRITE_TOKEN`  
    Thông tin xác thực được sử dụng để xác thực các hoạt động ghi.

- nguồn dữ liệu bên ngoài:

  - `WEATHER_API_URL`  
    URL cơ sở của API dữ liệu thời tiết (hoặc endpoint).

  - `WEATHER_API_KEY` (tùy chọn)  
    Khóa API hoặc token, nếu được yêu cầu bởi dịch vụ bên ngoài.

- hành vi ứng dụng:
  - `UPDATE_INTERVAL_SECONDS`  
    Tần suất server lấy dữ liệu và cập nhật entity.
  - `LOCATIONS`  
    Danh sách các vị trí hoặc định danh trạm để được giám sát (định dạng được quyết định bởi triển khai).

Ví dụ `.env` cho development:

    BROKER_URL=https://dev-broker.example.com/ngsi-ld/v1
    BROKER_WRITE_KEY=dev-broker-write-key
    WEATHER_API_URL=https://api.example.com/weather
    WEATHER_API_KEY=dev-weather-api-key
    UPDATE_INTERVAL_SECONDS=300
    LOCATIONS=CTU_CAMPUS,CTU_CITY_CENTER

Các tên và định dạng thực tế có thể khác nhau, nhưng chúng phải được ghi lại rõ ràng trong README của sample server.

---

## Quy trình công việc cấp cao

Sample update server tuân theo một vòng lặp đơn giản:

1. **Tải cấu hình**

   - đọc cài đặt broker,
   - đọc cài đặt API bên ngoài,
   - đọc danh sách các vị trí hoặc trạm,
   - đọc khoảng thời gian cập nhật.

2. **Lấy dữ liệu bên ngoài**

   - cho mỗi vị trí trong `LOCATIONS`, gọi API thời tiết,
   - xử lý các lỗi cơ bản (vấn đề mạng, response không hợp lệ),
   - log các lỗi mà không crash ngay lập tức.

3. **Chuyển đổi thành entity**

   - cho mỗi vị trí và response tương ứng:
     - chọn một ID entity (ví dụ: `urn:ngsi-ld:WeatherObserved:ctu:station:CTU_CAMPUS`),
     - xây dựng một entity với:
       - `type = "WeatherObserved"`,
       - `location` như một thuộc tính không gian địa lý (Point),
       - thời gian `observedAt`,
       - các thuộc tính cốt lõi (ví dụ: `temperature`, `relativeHumidity`, `pressure`),
     - tuân theo các quy ước entity của dự án.

4. **Ghi entity vào broker**

   - gửi các request tạo hoặc cập nhật đến endpoint entity của broker,
   - xử lý các lỗi HTTP và log chúng,
   - xác nhận thành công với logging cơ bản (ví dụ: "đã cập nhật 2 entity").

5. **Đợi và lặp lại**
   - ngủ trong `UPDATE_INTERVAL_SECONDS`,
   - lặp lại vòng lặp trong khi tiến trình đang chạy.

Trong môi trường development, một lần lặp duy nhất (không có vòng lặp) có thể đủ để xác nhận cấu hình.

---

## Chạy sample server

Các lệnh chính xác phụ thuộc vào stack được sử dụng (ví dụ: Go, Node.js hoặc ngôn ngữ khác), nhưng quy trình chung là:

1. **Chuẩn bị môi trường**

   - đảm bảo rằng một context broker đang chạy và có thể truy cập được tại URL bạn dự định sử dụng,
   - đảm bảo rằng một khóa ghi hoặc token được cấu hình và hợp lệ.

2. **Clone repository**

   - clone repository LegoCity,
   - chuyển vào thư mục sample server:

     - ví dụ: `cd services/sample-update-server`  
       hoặc `cd examples/update-server-weather`.

3. **Tạo cấu hình**

   - sao chép file cấu hình ví dụ, ví dụ:

     - sao chép `.env.example` sang `.env`,

   - điền vào:
     - `BROKER_URL`,
     - `BROKER_WRITE_KEY` hoặc token,
     - `WEATHER_API_URL`,
     - `WEATHER_API_KEY` nếu cần,
     - `LOCATIONS` và `UPDATE_INTERVAL_SECONDS`.

4. **Cài đặt dependencies**

   - cài đặt dependencies theo triển khai (ví dụ: `npm install`, hoặc build một binary Go).

5. **Chạy server**

   - khởi động ứng dụng (ví dụ: `npm run start` hoặc `./sample-update-server`),
   - kiểm tra log để đảm bảo rằng:
     - cấu hình đã được tải,
     - các request đến API bên ngoài thành công,
     - các entity đã được ghi vào broker.

6. **Xác minh trong broker và dashboard**

   - truy vấn broker hoặc sử dụng UI quản lý của nó để xác nhận rằng:
     - các entity `WeatherObserved` tồn tại,
     - các thuộc tính và vị trí có giá trị hợp lý.
   - nếu dashboard LegoCity đang chạy:
     - mở view bản đồ tương ứng,
     - xác nhận rằng các dấu hiệu thời tiết xuất hiện ở các vị trí mong đợi.

---

## Hành vi và log mong đợi

Sample server nên tạo ra các log rõ ràng, tối thiểu. Ví dụ về các thông báo log (về mặt khái niệm):

- khi khởi động:

  - "Đã tải cấu hình: 2 vị trí, khoảng thời gian cập nhật 300 giây."

- trên cập nhật thành công:

  - "Đã lấy dữ liệu thời tiết cho CTU_CAMPUS (nhiệt độ 30.1 °C)."
  - "Đã cập nhật entity urn:ngsi-ld:WeatherObserved:ctu:station:CTU_CAMPUS."
  - "Chu kỳ cập nhật hoàn thành: 2 entity đã được cập nhật."

- trên lỗi:
  - "Không lấy được dữ liệu thời tiết cho CTU_CITY_CENTER: HTTP 500 từ API."
  - "Không ghi được entity urn:... vào broker: HTTP 401 (unauthorized)."

Mục đích là giúp các nhà vận hành dễ dàng thấy:

- liệu dữ liệu bên ngoài có sẵn không,
- liệu xác thực với broker có hoạt động không,
- liệu hợp đồng dữ liệu (cấu trúc entity) có được tôn trọng không.

---

## Mở rộng sample server

Khi sample server hoạt động trong development, các nhóm có thể:

- **sao chép dự án** và điều chỉnh nó cho các domain khác (ví dụ: lũ lụt hoặc đỗ xe),
- hoặc **mở rộng cùng một server** để xử lý các loại entity bổ sung.

Các phương pháp được khuyến nghị khi mở rộng:

- giữ cấu hình domain-specific:

  - các biến môi trường mới cho các nguồn mới,
  - cấu hình có cấu trúc cho nhiều domain nếu sử dụng một tiến trình duy nhất.

- giữ logic chuyển đổi riêng biệt cho mỗi loại entity:

  - một hàm hoặc module cho mỗi loại (`WeatherObserved`, `FloodZone`, v.v.),
  - tránh trộn các chuyển đổi không liên quan vào một khối lớn.

- giữ logging và xử lý lỗi nhất quán:
  - các thông báo log tương tự trên các server,
  - mã lỗi và mô tả rõ ràng.

---

## Mối quan hệ với tài liệu khác

Trang này tập trung vào hành vi khái niệm và cấu hình của sample update server.

Các tài liệu liên quan:

- **Dữ liệu và broker**  
  Giải thích luồng dữ liệu tổng thể và vai trò của các broker và update server.

- **Entity**  
  Mô tả các loại entity, domain và hợp đồng dữ liệu mà sample phải tuân theo.

- **Khóa API và kiểm soát truy cập**  
  Giải thích cách cấu hình và quản lý token ghi và URL broker.

Sample update server nên triển khai các mẫu được mô tả trong các tài liệu này, để nó phục vụ như một ví dụ thực tế cho các tích hợp tương lai.

---

## Tóm tắt

- Sample update server là một dịch vụ nhỏ, độc lập trình diễn cách lấy dữ liệu bên ngoài, chuyển đổi nó thành các NGSI-LD entity và ghi các entity đó vào broker.
- Nó được thiết kế để dễ dàng chạy trong development để xác minh cấu hình và luồng dữ liệu.
- Cấu hình được xử lý thông qua các biến môi trường, bao gồm chi tiết kết nối broker, cài đặt API bên ngoài, vị trí và khoảng thời gian cập nhật.
- Sample tập trung vào một loại entity (thường là `WeatherObserved` trong domain Môi trường) nhưng có thể được mở rộng hoặc sao chép cho các domain khác.
- Log nên làm rõ liệu dữ liệu bên ngoài, quyền truy cập broker và tạo entity có hoạt động như mong đợi không.
- Triển khai phải phù hợp với các hợp đồng dữ liệu và các mẫu bảo mật được định nghĩa trong phần còn lại của tài liệu LegoCity.
