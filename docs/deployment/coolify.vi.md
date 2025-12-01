# Triển khai Coolify

Trang này mô tả cách triển khai LegoCity sử dụng **Coolify** hoặc nền tảng ứng dụng tự lưu trữ tương tự.

Nó tập trung vào:

- ánh xạ các thành phần của LegoCity tới "dịch vụ" của Coolify,
- mẫu sẵn sàng sử dụng cho máy chủ đơn hoặc cụm nhỏ,
- cách cấu hình biến môi trường, tên miền và TLS,
- bảo trì cơ bản (cập nhật, sao lưu, giám sát) trong thiết lập này.

Coolify hoạt động như mặt phẳng kiểm soát cho các container, giúp việc triển khai dễ dàng hơn mà không cần quản lý các lệnh Docker thô và reverse proxy thủ công.

---

## Khi nào sử dụng Coolify

Triển khai dựa trên Coolify là lựa chọn tốt khi:

- bạn có một hoặc số lượng nhỏ các máy chủ,
- bạn muốn cách **hướng giao diện** để triển khai các ứng dụng Docker,
- bạn muốn xử lý tên miền, định tuyến và TLS tự động,
- bạn không muốn quản lý Kubernetes hoặc các dịch vụ AWS phức tạp.

Nó có thể kém phù hợp hơn khi:

- bạn cần độ sẵn sàng cao quy mô lớn, nhiều vùng,
- tổ chức bắt buộc sử dụng nền tảng đám mây và công cụ cụ thể.

---

## Các thành phần như dịch vụ Coolify

Trong Coolify, mỗi thành phần của LegoCity trở thành một hoặc nhiều dịch vụ:

- **Dịch vụ context broker**

  - chạy container NGSI-LD broker.

- **Dịch vụ PayloadCMS**

  - chạy container PayloadCMS (Node.js).

- **Dịch vụ cơ sở dữ liệu cho PayloadCMS**

  - container PostgreSQL hoặc MongoDB.

- **Dịch vụ Proxy / API**

  - backend giữa giao diện và broker.

- **Dịch vụ bảng điều khiển**

  - giao diện Next.js (có thể là SSR hoặc xây dựng tĩnh).

- **Các dịch vụ máy chủ cập nhật**
  - một dịch vụ cho mỗi máy chủ cập nhật (worker chạy lâu dài).

Tùy chọn, bạn có thể:

- thêm reverse proxy riêng biệt hoặc để Coolify quản lý định tuyến trực tiếp,
- thêm các dịch vụ hỗ trợ khác (chỉ số, giám sát, v.v.) nếu cần.

---

## Tiên quyết

Để sử dụng mẫu này, bạn cần:

- máy chủ (hoặc VM) đã cài đặt Coolify,
- tên miền với quyền kiểm soát DNS (ví dụ `city.example`),
- khả năng chỉ các bản ghi DNS tới máy chủ Coolify.

Về phía LegoCity:

- các hình ảnh container cho broker, PayloadCMS, proxy, bảng điều khiển và các máy chủ cập nhật,
- các URL kho lưu trữ (Git) nếu bạn để Coolify xây dựng hình ảnh từ nguồn.

---

## Kiến trúc cấp cao trên Coolify

Về mặt logic, triển khai trông như:

- **Máy chủ Coolify**

  - chạy tất cả các dịch vụ LegoCity như các container,
  - quản lý:
    - chu kỳ sống container,
    - định tuyến và tên miền,
    - chứng chỉ TLS.

- **Các dịch vụ LegoCity**
  - dịch vụ cơ sở dữ liệu (PayloadCMS DB),
  - dịch vụ context broker,
  - dịch vụ PayloadCMS,
  - dịch vụ proxy,
  - dịch vụ bảng điều khiển,
  - các máy chủ cập nhật.

Bố cục mạng:

- Coolify quản lý các mạng nội bộ giữa các container,
- lưu lượng bên ngoài đi qua:
  - reverse proxy và cấu hình tên miền của Coolify.

Broker và cơ sở dữ liệu không được thờ trực tiếp, trừ khi được cấu hình rõ ràng.

---

## Lập kế hoạch dịch vụ và tên miền

Trước khi tạo dịch vụ, hãy quyết định:

- bạn muốn tên miền hoặc tên miền phụ nào:

  - ví dụ `city.example` → bảng điều khiển,
  - `api.city.example` → proxy,
  - `admin.city.example` → PayloadCMS.

- mỗi dịch vụ nên truy cập được ở đâu:
  - một số chỉ nội bộ (broker, DB, các máy chủ cập nhật),
  - một số bên ngoài (bảng điều khiển, proxy, quản trị PayloadCMS).

Ánh xạ điển hình:

- **Bảng điều khiển** → `city.example`
- **Proxy** → `api.city.example`
- **Quản trị PayloadCMS** → `admin.city.example`
- **Broker** → không có tên miền công khai (chỉ nội bộ)
- **Các máy chủ cập nhật** → không có tên miền công khai (chỉ nội bộ)

Coolify cho phép bạn gán tên miền cho mỗi dịch vụ và sẽ yêu cầu chứng chỉ TLS tự động.

---

## Định nghĩa các dịch vụ trong Coolify

### 1. Dịch vụ cơ sở dữ liệu (PayloadCMS DB)

- Thêm dịch vụ **Cơ sở dữ liệu** mới trong Coolify:

  - chọn PostgreSQL hoặc MongoDB, theo cấu hình PayloadCMS của bạn.

- Cấu hình:

  - tên cơ sở dữ liệu: `payload_db` (ví dụ),
  - người dùng: `payload_user`,
  - mật khẩu: mật khẩu ngẫu nhiên an toàn.

- Ghi chú:
  - máy chủ nội bộ,
  - cổng,
  - tên cơ sở dữ liệu,
  - người dùng và mật khẩu.

Coolify thường cung cấp chuỗi kết nối bạn có thể sử dụng trực tiếp trong biến môi trường.

### 2. Dịch vụ context broker

- Thêm dịch vụ **Ứng dụng** (container) mới:

  - chọn "Hình ảnh Docker" làm nguồn,
  - chỉ rõ hình ảnh broker (ví dụ `orion-ld` hoặc hình ảnh tùy chỉnh của bạn).

- Cấu hình:

  - cổng nội bộ: cổng broker sử dụng (ví dụ `1026`),
  - không có tên miền công khai nếu bạn muốn nó chỉ nội bộ,
  - kích hoạt mạng nội bộ để các dịch vụ khác có thể truy cập nó.

- Biến môi trường:
  - bất kỳ cấu hình broker nào cần thiết (tùy thuộc vào triển khai broker).

Coolify sẽ quản lý container; các dịch vụ LegoCity khác sẽ sử dụng tên máy chủ và cổng nội bộ của broker.

### 3. Dịch vụ PayloadCMS

- Thêm dịch vụ **Ứng dụng** khác:

  - nguồn: kho Git hoặc hình ảnh Docker cho PayloadCMS.

- Nếu sử dụng Git:

  - cấu hình xây dựng:
    - phiên bản Node.js,
    - lệnh xây dựng (`npm run build` hoặc tương tự),
    - lệnh khởi động (`npm run start`),
    - hoặc sử dụng Dockerfile.

- Đính kèm tên miền:

  - ví dụ `admin.city.example` cho giao diện quản trị PayloadCMS.

- Biến môi trường:
  - `PAYLOAD_DB_URL` hoặc tương đương:
    - sử dụng chuỗi kết nối được cung cấp bởi dịch vụ cơ sở dữ liệu,
  - `PAYLOAD_SECRET`, `NODE_ENV`, v.v.,
  - bất kỳ biến nào khác được yêu cầu bởi cấu hình PayloadCMS của bạn (ví dụ xác thực, lưu trữ).

Đảm bảo:

- dịch vụ trong cùng mạng nội bộ với dịch vụ DB,
- dịch vụ DB không được thờ ra bên ngoài.

### 4. Dịch vụ Proxy / API

- Thêm dịch vụ **Ứng dụng** cho backend proxy:

  - nguồn: kho Git hoặc hình ảnh Docker chứa proxy.

- Đính kèm tên miền:

  - ví dụ `api.city.example`.

- Biến môi trường:
  - `BROKER_URL` đặt tới URL nội bộ của dịch vụ broker,
  - cấu hình khác (ví dụ nguồn gốc được phép, khóa API),
  - `NODE_ENV` / `APP_ENV`.

Proxy là thành phần duy nhất cần quyền truy cập mạng tới broker (ngoài các máy chủ cập nhật).

### 5. Dịch vụ bảng điều khiển

Có hai cách chính để lưu trữ bảng điều khiển:

#### Tùy chọn A – Next.js SSR (Dịch vụ ứng dụng)

- Thêm dịch vụ **Ứng dụng**:

  - nguồn: kho bảng điều khiển hoặc hình ảnh,
  - lệnh xây dựng và khởi động như thường cho Next.js.

- Đính kèm tên miền:

  - ví dụ `city.example`.

- Biến môi trường:
  - `NEXT_PUBLIC_API_BASE_URL=https://api.city.example`,
  - `NEXT_PUBLIC_MAPBOX_TOKEN` và bất kỳ cấu hình công khai nào khác.

Tùy chọn này chạy Next.js như tiến trình Node.js đằng sau reverse proxy của Coolify.

#### Tùy chọn B – Xây dựng tũnh (Ứng dụng + chế độ tĩnh)

- Xây dựng bảng điều khiển thành các tệp tĩnh (ví dụ `next export`).
- Cấu hình dịch vụ trong Coolify để chỉ phục vụ các tệp tĩnh.
- Đơn giản hóa thời gian chạy nhưng hạn chế chức năng SSR.

Cấu hình chính xác phụ thuộc vào cách xây dựng bảng điều khiển của bạn; điệu quan trọng là:

- `NEXT_PUBLIC_API_BASE_URL` phải chỉ tới proxy,
- các tài sản tĩnh phải được phục vụ trên tên miền được chọn của bạn.

### 6. Các dịch vụ máy chủ cập nhật

- Cho mỗi máy chủ cập nhật, thêm dịch vụ **Ứng dụng**:

  - nguồn: kho Git hoặc hình ảnh Docker,
  - loại: worker nền / tiến trình chạy lâu dài.

- Biến môi trường:

  - `BROKER_URL` → URL broker nội bộ,
  - `BROKER_WRITE_KEY` → khóa ghi cho miền liên quan,
  - các khóa API bên ngoài (ví dụ `WEATHER_API_KEY`),
  - bất kỳ cấu hình lịch trình nào (nếu worker xử lý thời gian riêng).

- Mạng:
  - cùng mạng nội bộ với broker,
  - không có tên miền công khai (không cần lối vào HTTP).

Bạn có thể chạy các máy chủ cập nhật khác nhau cho môi trường, lũ lụt, đi lại, v.v.

---

## Tách biệt môi trường

Để giữ phát triển và sản xuất riêng biệt, bạn có thể:

- chạy **hai phục vụ Coolify** trên các máy chủ khác nhau, hoặc
- chạy:
  - các dịch vụ phát triển và sản xuất trên cùng Coolify nhưng:
    - với các tên miền khác nhau (ví dụ `dev.city.example` so với `city.example`),
    - với các phục vụ DB riêng biệt,
    - với các phục vụ broker khác nhau.

Được khuyến nghị cho sự rõ ràng:

- một phục vụ Coolify cho mỗi môi trường, hoặc
- ít nhất đặt tên và cô lập rõ ràng các dịch vụ và cơ sở dữ liệu.

---

## Cấu hình và bí mật trong Coolify

Coolify cho phép bạn:

- định nghĩa biến môi trường cho mỗi dịch vụ,
- đánh dấu một số như bí mật,
- ghi đè giá trị cho mỗi lần triển khai.

Thực hành tốt nhất:

- không đặt bí mật trong kho lưu trữ,
- định nghĩa mật khẩu DB, khóa ghi broker, khóa API bên ngoài như bí mật trong Coolify,
- giữ cấu hình không bí mật (như tên kiểu bản đồ) như biến thông thường.

Cho mỗi dịch vụ, ghi chép:

- biến nào phải được đặt,
- giá trị đến từ đâu (dịch vụ DB, broker, nhà cung cấp bên ngoài).

---

## Quy trình triển khai trong Coolify

Quy trình điển hình để triển khai thay đổi:

1. Đẩy mã mới tới kho lưu trữ Git.
2. Trong Coolify:
   - hoặc:
     - cấu hình triển khai tự động khi đẩy, hoặc
     - kích hoạt triển khai thủ công.
3. Coolify:
   - kéo mã mới nhất,
   - xây dựng hình ảnh ứng dụng hoặc gói,
   - khởi động lại dịch vụ với phiên bản mới.

Cho các dịch vụ dựa trên hình ảnh:

- cập nhật thẻ hình ảnh trong cấu hình dịch vụ Coolify,
- kích hoạt triển khai lại.

Thứ tự thay đổi:

- cập nhật backend/proxy trước,
- sau đó bảng điều khiển,
- thỉnh thoảng PayloadCMS hoặc broker nếu hợp đồng dữ liệu thay đổi.

---

## Giám sát và nhật ký

Coolify cung cấp quản lý cơ bản và truy cập vào nhật ký:

- bạn có thể xem nhật ký cho mỗi dịch vụ từ giao diện,
- bạn có thể thấy trạng thái container (đang chạy, thất bại, khởi động lại).

Được khuyến nghị:

- định kỳ kiểm tra nhật ký cho:
  - các máy chủ cập nhật (tiếp nhận dữ liệu),
  - proxy (lỗi API),
  - PayloadCMS (vấn đề DB),
  - broker (tài nguyên hoặc lỗi ngữ cảnh).

Nếu cần, bạn có thể:

- xuất nhật ký sang hệ thống bên ngoài (ELK, Loki, v.v.),
- thêm điểm cuối sức khỏe vào dịch vụ và sử dụng kiểm tra sức khỏe của Coolify.

---

## Sao lưu và bảo trì

Các thành phần có trạng thái trên máy chủ Coolify:

- Cơ sở dữ liệu PayloadCMS:

  - quan trọng để sao lưu thường xuyên,
  - sử dụng công cụ gốc của DB hoặc add-on sao lưu nếu Coolify hỗ trợ nó.

- Lưu trữ broker (nếu sử dụng volume bền):

  - nhớ nơi nó được lưu trữ trên máy chủ,
  - tạo snapshot hoặc sao lưu thư mục này.

- Cấu hình Coolify:
  - sao lưu cấu hình và metadata của Coolify,
  - giữ bản sao các định nghĩa triển khai và biến môi trường ở nơi an toàn (xuất văn bản hoặc IaC).

Nhiệm vụ bảo trì:

- áp dụng cập nhật hệ điều hành trên máy chủ (kernel, bảo mật),
- cập nhật động cơ Docker nếu liên quan,
- cập nhật bản thân Coolify (theo hướng dẫn nâng cấp của họ),
- xoay vòng thông tin đăng nhập (mật khẩu DB, khóa broker, khóa API bên ngoài).

Kiểm tra:

- khôi phục các bản sao lưu DB trong môi trường staging,
- khởi động lại dịch vụ sau khi khởi động lại máy chủ.

---

## Mở rộng và hạn chế

Coolify đơn giản hóa triển khai nhưng không loại bỏ tất cả giới hạn hạ tầng.

Chiến lược mở rộng:

- tăng CPU/bộ nhớ được gán cho các dịch vụ cụ thể,
- chuyển DB sang máy chủ riêng biệt, mạnh hơn,
- tách các dịch vụ nặng (ví dụ broker và PayloadCMS) qua nhiều máy chủ được quản lý bởi cùng phục vụ Coolify (nếu được hỗ trợ).

Hạn chế:

- mở rộng ngang qua nhiều trung tâm dữ liệu không tự động,
- bạn vẫn phụ thuộc vào sức khỏe và năng lực của (các) máy chủ cơ bản.

Cho các triển khai lớn hơn, bạn có thể sau này chuyển:

- broker và DB sang hạ tầng chuyên dụng (AWS/RDS, v.v.),
- giữ Coolify chủ yếu cho frontend và các dịch vụ nhỏ hơn.

---

## Tóm tắt

- Coolify cung cấp cách hướng giao diện để triển khai các thành phần của LegoCity như các container Docker trên máy chủ đơn hoặc tập hợp nhỏ các máy chủ.
- Mỗi thành phần chính (broker, PayloadCMS, DB, proxy, bảng điều khiển, các máy chủ cập nhật) được định nghĩa như dịch vụ riêng biệt với biến môi trường riêng và, khi cần, tên miền.
- Các tên miền như `city.example`, `api.city.example` và `admin.city.example` được ánh xạ qua reverse proxy của Coolify, cũng quản lý chứng chỉ TLS.
- Cấu hình và bí mật được xử lý qua biến môi trường cấp dịch vụ; các dịch vụ có trạng thái như DB và broker sử dụng volume bền và yêu cầu sao lưu định kỳ.
- Mẫu này phù hợp cho các nhóm muốn tránh quản lý Docker/NGINX cấp thấp nhưng không cần sự phức tạp của nền tảng đám mây đầy đủ hoặc Kubernetes.
