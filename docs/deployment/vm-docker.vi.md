# Máy ảo và Docker

Trang này mô tả cách triển khai LegoCity trên một hoặc nhiều máy ảo sử dụng Docker và Docker Compose.

Nó tập trung vào **mẫu sẵn dùng** cho:

- các triển khai nhỏ đến trung bình,
- demo và thí điểm,
- các nhóm không có nền tảng DevOps chuyên dụng.

Nó cũng bao gồm các tác vụ bảo trì cơ bản: cập nhật dịch vụ, xem nhật ký và sao lưu dữ liệu.

---

## Khi nào sử dụng cách tiếp cận này

Triển khai VM + Docker là lựa chọn tốt khi:

- Bạn có quyền truy cập một hoặc vài máy ảo (ví dụ trên máy chủ trường đại học hoặc thành phố),
- Bạn muốn chạy tất cả thành phần trên cùng máy chủ hoặc một số ít máy chủ,
- Bạn ưa thích thiết lập đơn giản hơn là giải pháp đám mây được quản lý hoàn toàn.

Nó có thể không lý tưởng khi:

- Bạn yêu cầu độ sẵn sàng cao trên nhiều trung tâm dữ liệu,
- Bạn mong đợi lưu lượng rất cao hoặc SLA nghiêm ngặt,
- Tổ chức của bạn bắt buộc các nền tảng đám mây gốc cụ thể (Kubernetes, ECS, v.v.).

---

## Các thành phần trong thiết lập này

Trong triển khai VM + Docker điển hình, bạn chạy các thành phần sau dưới dạng container:

- context broker (NGSI-LD broker),
- PayloadCMS,
- cơ sở dữ liệu cho PayloadCMS (ví dụ PostgreSQL hoặc MongoDB),
- lớp proxy / API (backend giữa giao diện người dùng và broker),
- dashboard (giao diện Next.js / Mapbox),
- một hoặc nhiều máy chủ cập nhật.

Một thiết lập máy ảo đơn điển hình sẽ có:

- một máy chủ Docker,
- một reverse proxy (tùy chọn nhưng khuyến nghị),
- nhiều container cho các dịch vụ trên.

---

## Kiến trúc tổng quan trên máy ảo đơn

Trên máy ảo đơn, kiến trúc logic là:

- mạng bên ngoài:

  - người dùng truy cập:
    - URL dashboard,
    - URL API (proxy),
    - URL quản trị PayloadCMS (truy cập được kiểm soát).

- mạng nội bộ (mạng Docker):
  - context broker,
  - cơ sở dữ liệu,
  - PayloadCMS,
  - proxy,
  - các máy chủ cập nhật.

Truy cập mạng:

- Chỉ reverse proxy hoặc một tập hợp container giới hạn mở cổng ra máy chủ,
- Hầu hết các dịch vụ giao tiếp trên mạng Docker nội bộ,
- Broker và cơ sở dữ liệu không được phơi bày trực tiếp ra internet.

---

## Điều kiện tiên quyết

Trên máy ảo:

- Một bản phân phối Linux được hỗ trợ (ví dụ Ubuntu LTS),
- Docker Engine đã cài đặt,
- Docker Compose (v2 hoặc tích hợp trong Docker),
- Quyền truy cập vào VM với người dùng có quyền chạy Docker (thường qua SSH),
- Tên miền hoặc tên miền phụ cho:
  - dashboard (tùy chọn nhưng khuyến nghị),
  - API/proxy,
  - quản trị PayloadCMS.

Tùy chọn nhưng khuyến nghị:

- Reverse proxy như Nginx hoặc Traefik để kết thúc TLS và định tuyến các yêu cầu HTTP đến đến các container đúng.

---

## Bố cục thư mục

Bố cục thư mục đơn giản trên VM có thể là:

```
/opt/legocity/
  docker-compose.yml
  .env
  reverse-proxy/
    docker-compose.yml (if using separate compose)
    config/...
  data/
    broker/
    db/
  logs/
    ...
```

Các bố cục thay thế có thể chấp nhận miễn là:

- Các volume cho dữ liệu bền vững (cơ sở dữ liệu, lưu trữ broker) được tách biệt rõ ràng,
- Cấu hình (tệp .env, tệp compose) được kiểm tra vào kiểm soát phiên bản (không có bí mật).

---

## Cấu hình môi trường

Tất cả bí mật và cấu hình đặc thù môi trường nên được lấy từ tệp `.env` hoặc tương đương, không được mã hóa cứng trong `docker-compose.yml`.

Ví dụ `.env` (minh họa, không đầy đủ):

```env
# General
APP_ENV=production

# Broker
BROKER_IMAGE=orion-ld:latest
BROKER_PORT=1026

# PayloadCMS
PAYLOAD_IMAGE=legocity-payload:latest
PAYLOAD_PORT=3000
PAYLOAD_DB_URL=postgres://payload_user:payload_pass@db:5432/payload_db

# Postgres (for PayloadCMS)
POSTGRES_IMAGE=postgres:16
POSTGRES_DB=payload_db
POSTGRES_USER=payload_user
POSTGRES_PASSWORD=payload_pass

# Proxy/API
PROXY_IMAGE=legocity-proxy:latest
PROXY_PORT=4000

# Dashboard
DASHBOARD_IMAGE=legocity-dashboard:latest
DASHBOARD_PORT=3001

# Các máy chủ cập nhật (ví dụ)
UPDATE_ENV_IMAGE=legocity-update-env:latest

# Xác thực broker (ví dụ)
BROKER_WRITE_KEY_ENV=change-me-env
BROKER_WRITE_KEY_WATER=change-me-water
BROKER_WRITE_KEY_MOBILITY=change-me-mobility

# Các API bên ngoài (ví dụ)
WEATHER_API_KEY=change-me-weather
```

Trong môi trường sản xuất, các bí mật thực tế nên được:

- Đặt qua tự động hóa triển khai hoặc quản lý cấu hình,
- Lưu trữ ở vị trí an toàn (không commit vào kho công khai).

---

## Cấu trúc Docker Compose

Một tệp `docker-compose.yml` tối thiểu cho triển khai máy ảo đơn có thể bao gồm các dịch vụ cho:

- broker,
- cơ sở dữ liệu,
- PayloadCMS,
- proxy,
- dashboard,
- một máy chủ cập nhật mẫu.

Về mặt khái niệm:

```yaml
version: "3.9"

services:
  broker:
    image: ${BROKER_IMAGE}
    container_name: legocity-broker
    ports:
      - "${BROKER_PORT}:1026"
    environment:
      # broker-specific configuration here
    volumes:
      - ./data/broker:/data
    networks:
      - internal

  db:
    image: ${POSTGRES_IMAGE}
    container_name: legocity-db
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./data/db:/var/lib/postgresql/data
    networks:
      - internal

  payload:
    image: ${PAYLOAD_IMAGE}
    container_name: legocity-payload
    environment:
      PAYLOAD_DB_URL: ${PAYLOAD_DB_URL}
      APP_ENV: ${APP_ENV}
      # more PayloadCMS variables as needed
    ports:
      - "${PAYLOAD_PORT}:3000"
    depends_on:
      - db
    networks:
      - internal

  proxy:
    image: ${PROXY_IMAGE}
    container_name: legocity-proxy
    environment:
      BROKER_URL: http://broker:1026/ngsi-ld/v1
      APP_ENV: ${APP_ENV}
      # any API keys or config needed
    ports:
      - "${PROXY_PORT}:4000"
    depends_on:
      - broker
    networks:
      - internal

  dashboard:
    image: ${DASHBOARD_IMAGE}
    container_name: legocity-dashboard
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://proxy:4000
      APP_ENV: ${APP_ENV}
    ports:
      - "${DASHBOARD_PORT}:3001"
    depends_on:
      - proxy
    networks:
      - internal

  update-env:
    image: ${UPDATE_ENV_IMAGE}
    container_name: legocity-update-env
    restart: unless-stopped
    environment:
      BROKER_URL: http://broker:1026/ngsi-ld/v1
      BROKER_WRITE_KEY: ${BROKER_WRITE_KEY_ENV}
      WEATHER_API_KEY: ${WEATHER_API_KEY}
      APP_ENV: ${APP_ENV}
    depends_on:
      - broker
    networks:
      - internal

networks:
  internal:
    driver: bridge
```

Ghi chú:

- Ví dụ giả định:

  - broker đơn giản trên cổng 1026,
  - PayloadCMS lắng nghe trên cổng 3000 bên trong,
  - proxy trên cổng 4000,
  - dashboard trên cổng 3001.

- Trong môi trường sản xuất, bạn thường sẽ đặt reverse proxy ở phía trước để:
  - kết thúc HTTPS,
  - ánh xạ các route công khai tới các cổng nội bộ này.

---

## Reverse proxy (tùy chọn nhưng khuyến nghị)

Trên cùng VM, bạn có thể chạy reverse proxy như Nginx hoặc Traefik:

- Lắng nghe trên các cổng 80/443,
- Định tuyến lưu lượng dựa trên tên máy chủ hoặc đường dẫn.

Ví dụ:

- `https://city.example/dashboard` → dashboard container (port 3001),
- `https://city.example/api` → proxy container (port 4000),
- `https://admin.city.example` → PayloadCMS (port 3000, restricted access).

Reverse proxy có thể:

- Quản lý chứng chỉ TLS (ví dụ qua Let's Encrypt),
- Thực thi một số kiểm soát truy cập,
- Cung cấp ghi nhật ký cơ bản.

Trong các thiết lập dựa trên Docker, bản thân reverse proxy thường là một container khác trên cùng mạng.

---

## Triển khai từng bước trên máy ảo đơn

Một quy trình triển khai ban đầu điển hình:

1. **Chuẩn bị VM**

   - Cung cấp VM (ví dụ Ubuntu LTS),
   - Cài đặt cập nhật bảo mật,
   - Cài đặt Docker và Docker Compose,
   - Cấu hình quy tắc tường lửa để chỉ cho phép HTTP/HTTPS và SSH.

2. **Tạo thư mục LegoCity**

   - Tạo thư mục, ví dụ `/opt/legocity`,
   - Đặt `docker-compose.yml` và `.env` ở đó,
   - Tạo các thư mục con cho dữ liệu bền vững:

     ```bash
     mkdir -p /opt/legocity/data/broker
     mkdir -p /opt/legocity/data/db
     ```

3. **Cấu hình biến môi trường**

   - Chỉnh sửa `.env`:
     - Đặt thông tin xác thực cơ sở dữ liệu,
     - Đặt hình ảnh và cổng broker,
     - Đặt URL cơ sở dữ liệu PayloadCMS,
     - Đặt khóa ghi và bất kỳ khóa API bên ngoài nào,
     - Đặt tên máy chủ nếu ứng dụng cần.

4. **Kéo các hình ảnh**

   - Chạy:

     ```bash
     docker compose pull
     ```

   - Lệnh này sẽ tải các hình ảnh được tham chiếu bởi `docker-compose.yml`.

5. **Khởi động các dịch vụ**

   - Chạy:

     ```bash
     docker compose up -d
     ```

   - Chờ các container khởi động. Kiểm tra trạng thái:

     ```bash
     docker compose ps
     ```

6. **Xác minh các thành phần**

   - **broker**:
     - Kiểm tra nhật ký container,
     - Tùy chọn gọi điểm cuối sức khỏe (nếu có) từ VM.
   - **cơ sở dữ liệu**:
     - Kiểm tra container DB đang chạy.
   - **PayloadCMS**:
     - Truy cập cổng đã cấu hình (hoặc route reverse proxy) từ trình duyệt,
     - Hoàn thành bất kỳ thiết lập ban đầu nào (người dùng quản trị).
   - **proxy**:
     - Gọi điểm cuối API đơn giản để xác nhận nó có thể tiếp cận broker.
   - **dashboard**:
     - Mở URL dashboard và xác nhận nó tải,
     - Chấp nhận rằng bản đồ và dữ liệu có thể trống cho đến khi các máy chủ cập nhật chạy.
   - **các máy chủ cập nhật**:
     - Kiểm tra nhật ký để đảm bảo chúng đang lấy dữ liệu bên ngoài và ghi các thực thể.

7. **Thiết lập reverse proxy** (nếu chưa có)

   - Cấu hình tên máy chủ và các route,
   - Lấy chứng chỉ TLS,
   - Đảm bảo chỉ các cổng reverse proxy được phơi bày ra bên ngoài.

---

## Nhật ký và khắc phục sự cố

Đối với triển khai đang chạy:

- Liệt kê các container:

  ```bash
  docker compose ps
  ```

- Xem nhật ký cho dịch vụ cụ thể:

  ```bash
  docker compose logs -f broker
  docker compose logs -f payload
  docker compose logs -f proxy
  docker compose logs -f dashboard
  docker compose logs -f update-env
  ```

Các bước khắc phục sự cố điển hình:

- Nếu dashboard hiển thị bản đồ trống:

  - Kiểm tra các máy chủ cập nhật đang chạy và ghi các thực thể,
  - Kiểm tra proxy có thể truy vấn broker.

- Nếu PayloadCMS không thể truy cập:

  - Xác nhận container đang chạy,
  - Kiểm tra cấu hình reverse proxy và ánh xạ cổng.

- Nếu broker không phản hồi:
  - Kiểm tra nhật ký container của nó,
  - Kiểm tra việc sử dụng đĩa cho volume lưu trữ của nó.

---

## Cập nhật dịch vụ

Để triển khai phiên bản mới của bất kỳ thành phần nào (ví dụ: dashboard hoặc proxy):

1. **Xây dựng và xuất bản hình ảnh container mới**

   - Cập nhật thẻ hình ảnh trong `.env` hoặc `docker-compose.yml`,
   - Hoặc đảm bảo `latest` trỏ tới phiên bản mới.

2. **Kéo hình ảnh mới trên VM**

   ```bash
   docker compose pull
   ```

3. **Khởi động lại các dịch vụ**

   ```bash
   docker compose up -d
   ```

4. **Xác minh hành vi**

   - Kiểm tra nhật ký có lỗi,
   - Xác thực dashboard và các API trong trình duyệt.

Để cập nhật an toàn hơn:

- Cập nhật các dịch vụ không quan trọng trước (ví dụ: dashboard),
- Cập nhật các dịch vụ quan trọng (broker, cơ sở dữ liệu) với cửa sổ bảo trì đã lên kế hoạch,
- Giữ hồ sơ về phiên bản nào đang chạy trong mỗi môi trường.

---

## Sao lưu và tính bền vững của dữ liệu

Ở mức tối thiểu, bạn nên sao lưu:

- Cơ sở dữ liệu PayloadCMS (PostgreSQL hoặc MongoDB),
- Bất kỳ volume bền vững nào của broker (nếu broker lưu trữ trạng thái trên đĩa),
- Các tệp cấu hình (`docker-compose.yml`, `.env`, tài liệu).

Các chiến lược sao lưu điển hình:

- Đối với cơ sở dữ liệu:

  - Sử dụng công cụ cấp cơ sở dữ liệu (ví dụ `pg_dump` cho PostgreSQL),
  - Lên lịch sao lưu qua công việc cron hoặc công cụ bên ngoài,
  - Lưu trữ bản sao lưu trên bộ nhớ riêng biệt hoặc vị trí từ xa.

- Đối với dữ liệu broker:
  - Nếu sử dụng các volume bền vững, định kỳ chụp ảnh hoặc sao chép thư mục lưu trữ,
  - Tùy thuộc vào cấu hình broker, cân nhắc xuất dữ liệu thực thể qua API.

Các bản sao lưu nên được:

- Kiểm tra định kỳ (khôi phục trong môi trường riêng biệt),
- Ghi chép (cái gì được sao lưu, bao lâu một lần, lưu trữ ở đâu).

---

## Mở rộng và các phần mở rộng đa VM

Máy ảo đơn đủ cho các triển khai nhỏ. Khi nhu cầu tăng, bạn có thể:

- Chuyển một số dịch vụ sang các VM riêng biệt:

  - Chạy cơ sở dữ liệu trên máy chủ chuyên dụng,
  - Chạy broker và các máy chủ cập nhật trên máy khác,
  - Giữ PayloadCMS và dashboard trên máy thứ ba.

- Hoặc sử dụng nhiều máy chủ Docker với điều phối bổ sung.

Ngay cả trong các kịch bản đa VM, bạn vẫn có thể sử dụng Docker Compose nếu:

- Bạn giữ các nhóm dịch vụ kết nối chặt chẽ trên mỗi máy chủ,
- Bạn sử dụng DNS hoặc địa chỉ IP giữa các máy chủ.

Đối với các triển khai quy mô lớn hơn hoặc có tính sẵn sàng cao, hãy cân nhắc:

- Chuyển sang nền tảng container được quản lý (xem trang triển khai AWS),
- Hoặc sử dụng hệ thống điều phối như Kubernetes.

---

## Tóm tắt

- Triển khai VM + Docker là cách đơn giản nhất để chạy LegoCity trong môi trường thực tế.
- Tất cả các thành phần cốt lõi (broker, PayloadCMS, cơ sở dữ liệu, proxy, dashboard, các máy chủ cập nhật) chạy như các container trên máy chủ đơn hoặc một số ít máy chủ.
- Cấu hình và bí mật được xử lý qua biến môi trường và tệp `.env`, không được mã hóa cứng trong tệp compose.
- Các tác vụ bảo trì bao gồm kiểm tra nhật ký container, cập nhật hình ảnh qua `docker compose pull` và `docker compose up -d`, và sao lưu cơ sở dữ liệu và lưu trữ broker.
- Mẫu này phù hợp cho các thí điểm, demo và các triển khai nhỏ, và có thể được mở rộng sang các thiết lập đa VM khi yêu cầu tăng lên.
