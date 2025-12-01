# Tổng quan triển khai

Trang này mô tả cách triển khai và vận hành một cài đặt LegoCity.

Nó tập trung vào:

- các thành phần chính cần được triển khai,
- các mẫu triển khai phổ biến (VM đơn, nền tảng đám mây, nền tảng như dịch vụ),
- các tác vụ vận hành như cập nhật, giám sát và sao lưu.

Các trang riêng biệt cung cấp hướng dẫn cụ thể cho các nền tảng cụ thể:

- AWS
- Thiết lập dựa trên Cloudflare
- Máy ảo và Docker
- Coolify

---

## Các thành phần cần triển khai

Một triển khai LegoCity thường bao gồm các thành phần sau:

- **Context broker**  
  Broker NGSI-LD lưu trữ các thực thể (FIWARE Orion-LD hoặc tương đương).

- **Các máy chủ cập nhật**  
  Một hoặc nhiều dịch vụ lấy dữ liệu bên ngoài, chuyển đổi nó và ghi các thực thể vào broker.

- **Lớp Proxy / API**  
  Một dịch vụ backend nhỏ:

  - đọc từ broker,
  - cung cấp các điểm cuối đơn giản, thân thiện với giao diện người dùng,
  - áp dụng kiểm soát truy cập, bộ nhớ đệm và giới hạn tỷ lệ.

- **Bảng điều khiển (frontend)**  
  Giao diện Next.js + Mapbox được xây dựng từ mã nguồn LegoCity.

- **PayloadCMS**  
  Giao diện quản trị để cấu hình các chế độ xem bản đồ, lớp, khối và nội dung.

- **Các dịch vụ hỗ trợ** (tùy chọn, tùy thuộc vào triển khai):
  - cơ sở dữ liệu cho PayloadCMS,
  - ngăn xếp ghi nhật ký / giám sát,
  - các reverse proxy hoặc bộ cân bằng tải.

Kiến trúc triển khai quyết định:

- mỗi thành phần chạy ở đâu,
- các thành phần giao tiếp như thế nào,
- cấu hình và bí mật được quản lý như thế nào.

---

## Các chế độ triển khai

Có nhiều cách để triển khai LegoCity. Các chế độ phổ biến nhất là:

- **Máy ảo đơn sử dụng Docker hoặc trình quản lý tiến trình**  
  Đơn giản để thiết lập, phù hợp cho phát triển và các dự án thí điểm nhỏ.

- **Nhà cung cấp đám mây (ví dụ AWS)**  
  Các thành phần được chia thành các dịch vụ được quản lý (container, cơ sở dữ liệu, lưu trữ).

- **Lưu trữ tĩnh + API không cần máy chủ (Cloudflare, v.v.)**  
  Frontend được lưu trữ trên nền tảng biên, API và proxy dưới dạng các hàm không cần máy chủ.

- **Các nền tảng ứng dụng (Coolify, v.v.)**  
  Một nền tảng quản lý container, định tuyến và TLS cho bạn.

Mỗi chế độ có những đánh đổi khác nhau về:

- dễ dàng thiết lập,
- chi phí,
- khả năng mở rộng,
- độ phức tạp vận hành.

Các phần sau mô tả một cách tiếp cận chung có thể được điều chỉnh cho mỗi nền tảng.

---

## Các môi trường

Các triển khai LegoCity nên sử dụng ít nhất hai môi trường:

- **Phát triển / Staging**  
  Được sử dụng cho:

  - kiểm tra các chế độ xem, lớp và khối mới,
  - thử nghiệm với các máy chủ cập nhật,
  - xác thực các mô hình thực thể.

- **Sản xuất**  
  Được sử dụng cho:
  - các bảng điều khiển trực tiếp,
  - người dùng công khai hoặc nội bộ,
  - các nguồn cấp dữ liệu ổn định.

Mỗi môi trường nên có:

- broker context riêng (hoặc các không gian tên broker được phân tách rõ ràng),
- phiên bản PayloadCMS riêng,
- cấu hình riêng (khóa API, URL cơ sở dữ liệu, v.v.),
- một quy trình rõ ràng để thăng cấp các thay đổi từ phát triển sang sản xuất.

---

## Cấu hình và bí mật

Bất kể nền tảng triển khai nào, cấu hình nên được đặt bên ngoài.

Các mục cấu hình điển hình:

- URL và thông tin đăng nhập của broker,
- URL và thông tin đăng nhập cơ sở dữ liệu PayloadCMS,
- cấu hình proxy (nguồn gốc được phép, giới hạn tỷ lệ),
- các điểm cuối và khóa API bên ngoài (cho các máy chủ cập nhật),
- định danh môi trường (ví dụ `NODE_ENV`, `APP_ENV`).

Thực hành tốt nhất:

- lưu trữ cấu hình trong các biến môi trường hoặc tệp cấu hình không được cam kết vào kiểm soát phiên bản,
- lưu trữ bí mật (token, mật khẩu) trong trình quản lý bí mật hoặc kho lưu trữ được mã hóa,
- tránh mã hóa cứng bất kỳ thông tin đăng nhập nào trong mã nguồn.

Trong sản xuất:

- các thay đổi đối với cấu hình nên được áp dụng thông qua một quy trình được kiểm soát,
- tất cả các thay đổi cấu hình nên có thể truy vết (ai đã thay đổi cái gì và khi nào).

---

## Cơ bản về mạng và bảo mật

Ở cấp độ cao, cấu trúc mạng nên đảm bảo rằng:

- context broker không được tiếp xúc trực tiếp với internet công cộng,
- các máy chủ cập nhật và proxy có quyền truy cập vào broker,
- bảng điều khiển có thể tiếp cận được bởi người dùng dự định,
- quản trị PayloadCMS bị hạn chế đối với người dùng và mạng được ủy quyền.

Các mẫu điển hình:

- đặt broker, các máy chủ cập nhật, PayloadCMS và proxy trong mạng riêng hoặc VPC,
- chỉ tiếp xúc:
  - URL bảng điều khiển,
  - URL API proxy,
  - URL quản trị PayloadCMS (tùy chọn bị hạn chế bởi IP hoặc VPN),
- kết thúc TLS tại reverse proxy, bộ cân bằng tải hoặc cổng nền tảng.

Mỗi trang cụ thể theo nền tảng sẽ mô tả cách đạt được điều này bằng các công cụ của nó (ví dụ: nhóm bảo mật AWS và bộ cân bằng tải, quy tắc định tuyến Cloudflare, tên miền và TLS của Coolify).

---

## Triển khai dựa trên VM đơn / Docker (khái niệm)

Mẫu triển khai đơn giản nhất là:

- một máy ảo,
- tất cả các dịch vụ chạy dưới dạng container Docker,
- một reverse proxy như Nginx hoặc Traefik định tuyến các yêu cầu.

Các container điển hình là:

- `broker` – context broker,
- `payload` – PayloadCMS và cơ sở dữ liệu của nó,
- `proxy` – lớp API giữa giao diện người dùng và broker,
- `dashboard` – frontend Next.js (được hiển thị trên máy chủ hoặc bản dựng tĩnh được phục vụ bởi máy chủ web),
- `update-*` – một hoặc nhiều máy chủ cập nhật.

Ưu điểm:

- hạ tầng tối thiểu,
- dễ hiểu và gỡ lỗi,
- phù hợp cho demo, hội thảo và thí điểm.

Hạn chế:

- khả năng mở rộng bị giới hạn bởi dung lượng của máy đơn,
- không có khả dụng cao tự động,
- cửa sổ bảo trì có thể ảnh hưởng đến tất cả các thành phần.

Chi tiết để thiết lập mẫu này được cung cấp trong tài liệu "Máy ảo & Docker".

---

## Triển khai đám mây (AWS, v.v.)

Khi triển khai cho nhà cung cấp đám mây như AWS, cách tiếp cận phổ biến là:

- chạy các dịch vụ trong container (ví dụ: ECS hoặc Kubernetes),
- sử dụng cơ sở dữ liệu được quản lý cho PayloadCMS và lưu trữ khác,
- sử dụng bộ cân bằng tải và DNS để định tuyến lưu lượng.

Kiến trúc AWS điển hình:

- Các dịch vụ ECS hoặc EKS cho:
  - broker,
  - proxy,
  - các máy chủ cập nhật,
  - PayloadCMS và bảng điều khiển (nếu không hoàn toàn tĩnh),
- RDS hoặc dịch vụ cơ sở dữ liệu được quản lý cho dữ liệu PayloadCMS,
- Application Load Balancer để định tuyến HTTP,
- Route 53 cho DNS,
- CloudWatch cho nhật ký và chỉ số.

Lợi ích:

- dễ dàng mở rộng ngang hơn,
- cơ sở dữ liệu và lưu trữ được quản lý,
- tích hợp với các tính năng nhận dạng và bảo mật của AWS.

Chi phí:

- độ phức tạp vận hành cao hơn,
- nhiều phần di chuyển hơn để giám sát và cấu hình.

Trang cụ thể về AWS sẽ phác thảo các ánh xạ được đề xuất từ các thành phần LegoCity sang các dịch vụ AWS và cung cấp hướng dẫn từng bước cho triển khai tối thiểu.

---

## Triển khai biên và không cần máy chủ (Cloudflare, v.v.)

Trong một số kịch bản, hữu ích khi:

- lưu trữ bảng điều khiển dưới dạng tài nguyên tĩnh trên nền tảng biên,
- chạy proxy và một số API dưới dạng các hàm không cần máy chủ,
- giữ broker và PayloadCMS trong môi trường truyền thống hơn.

Ví dụ, sử dụng Cloudflare:

- bảng điều khiển tĩnh được xây dựng và triển khai lên Cloudflare Pages,
- proxy được triển khai dưới dạng Cloudflare Workers gọi broker,
- PayloadCMS và broker chạy ở nơi khác (ví dụ: VM hoặc nhà cung cấp đám mây khác),
- DNS và TLS được xử lý bởi Cloudflare.

Lợi ích:

- phân phối toàn cầu nhanh của bảng điều khiển,
- mở rộng và quản lý đơn giản hóa cho frontend và proxy,
- phù hợp tốt cho các cổng thông tin công khai.

Cân nhắc:

- broker và PayloadCMS vẫn cần lưu trữ đáng tin cậy ở nơi khác,
- kết nối giữa Cloudflare Workers và broker phải được bảo mật và giám sát.

Trang cụ thể về Cloudflare sẽ mô tả sự phân chia trách nhiệm và luồng triển khai cơ bản.

---

## Các nền tảng ứng dụng (Coolify và tương tự)

Các nền tảng như Coolify nhằm mục đích:

- chạy các ứng dụng được container hóa trên máy chủ hoặc cụm,
- quản lý triển khai, tên miền và chứng chỉ TLS,
- cung cấp giao diện người dùng để cấu hình và duy trì các dịch vụ.

Trong mô hình này:

- mỗi thành phần LegoCity là một dịch vụ trong nền tảng,
- cấu hình nền tảng định nghĩa:
  - hình ảnh container hoặc phương thức xây dựng,
  - biến môi trường,
  - các cổng và tên miền được tiếp xúc.

Thiết lập điển hình:

- một phiên bản Coolify chạy trên VM hoặc máy chủ,
- các dịch vụ cho:
  - broker,
  - PayloadCMS,
  - proxy,
  - bảng điều khiển,
  - các máy chủ cập nhật.

Cách tiếp cận này:

- giảm lượng công việc hạ tầng cấp thấp,
- vẫn cho phép kiểm soát và nhật ký cho từng dịch vụ,
- phù hợp cho các nhóm không có chức năng DevOps chuyên dụng.

Trang cụ thể về Coolify sẽ mô tả các định nghĩa dịch vụ cụ thể và các bước triển khai.

---

## Bảo trì và vận hành

Triển khai chỉ là một phần của vòng đời. Một cài đặt LegoCity cũng phải được bảo trì.

**Các hoạt động vận hành chính:**

- **Giám sát và cảnh báo**

  - giám sát:
    - khả dụng của broker,
    - tỷ lệ thành công/thất bại của máy chủ cập nhật,
    - sức khỏe của PayloadCMS và proxy,
    - sử dụng tài nguyên (CPU, bộ nhớ, đĩa).
  - định nghĩa cảnh báo cho:
    - broker ngừng hoạt động,
    - thất bại cập nhật lặp lại,
    - tăng hoặc giảm số lượng thực thể bất ngờ.

- **Sao lưu**

  - các cơ sở dữ liệu được sử dụng bởi PayloadCMS phải được sao lưu thường xuyên,
  - nếu broker lưu giữ các thực thể, lưu trữ của nó nên được sao lưu hoặc nhân bản,
  - cấu hình và tài liệu nên được kiểm soát phiên bản.

- **Cập nhật**

  - thiết lập quy trình cho:
    - xây dựng và kiểm tra các phiên bản mới của bảng điều khiển, proxy, các máy chủ cập nhật và PayloadCMS,
    - triển khai các cập nhật lên môi trường phát triển trước,
    - triển khai lên sản xuất với gián đoạn tối thiểu.
  - duy trì nhật ký thay đổi cho các thay đổi lớn trong:
    - các mô hình thực thể,
    - API,
    - cấu trúc cấu hình.

- **Bảo mật**
  - xoay vòng các khóa API và token định kỳ,
  - áp dụng các cập nhật bảo mật cho các nền tảng bên dưới (VM, thời gian chạy container, hình ảnh hệ điều hành),
  - xem xét quyền truy cập vào PayloadCMS và các điểm cuối quản trị.

Mỗi trang cụ thể theo nền tảng nên liên kết các nhiệm vụ này với các công cụ của nền tảng (ví dụ: cảnh báo CloudWatch trên AWS, kiểm tra sức khỏe Coolify, phân tích Cloudflare).

---

## Lựa chọn chiến lược triển khai

Khi chọn chiến lược triển khai, các nhóm nên xem xét:

- tải dự kiến và số lượng người dùng,
- số tên miền và máy chủ cập nhật trong phạm vi,
- chuyên môn vận hành có sẵn,
- rằng buộc từ tổ chức lưu trữ (đám mây ưu tiên, công cụ hiện có).

**Hướng dẫn sơ bộ:**

- **VM đơn + Docker**  
  Tốt cho:

  - nguyên mẫu ban đầu,
  - bản demo nội bộ,
  - các triển khai nhỏ được quản lý bởi một nhóm duy nhất.

- **Nhà cung cấp đám mây (AWS)**  
  Phù hợp khi:

  - cần khả dụng cao hoặc khả năng mở rộng,
  - có hạ tầng đám mây hiện có,
  - cần tích hợp với các dịch vụ đám mây khác.

- **Thiết lập dựa trên Cloudflare**  
  Hữu ích khi:

  - bảng điều khiển là công khai và được hưởng lợi từ việc phân phối biên,
  - proxy có thể được triển khai dưới dạng các hàm nhẹ,
  - các backend hiện có (broker, PayloadCMS) được lưu trữ ở nơi khác.

- **Coolify hoặc nền tảng tương tự**  
  Thích hợp khi:
  - nhóm ưa thích triển khai và quản lý dựa trên giao diện,
  - triển khai nhỏ đến trung bình,
  - tập trung vào việc nhanh chóng có được nền tảng hoạt động thay vì quản lý hạ tầng thô.

---

## Mối quan hệ với tài liệu khác

Tổng quan triển khai này cố ý ở cấp độ cao. Nó được bổ sung bởi:

- **Triển khai AWS** – ánh xạ các thành phần LegoCity sang các dịch vụ AWS và các mẫu sẵn sàng sử dụng,
- **Triển khai Cloudflare** – thiết kế giao diện tĩnh + proxy không cần máy chủ,
- **Máy ảo và Docker** – triển khai VM đơn và nhiều VM sử dụng container,
- **Triển khai Coolify** – định nghĩa các dịch vụ LegoCity bên trong Coolify và quản lý chúng theo thời gian.

Các trang này cung cấp hướng dẫn cụ thể về nền tảng cụ thể hơn và nên được tham khảo khi triển khai một triển khai cụ thể.

---

## Tóm tắt

- Một triển khai LegoCity bao gồm context broker, các máy chủ cập nhật, proxy, bảng điều khiển, PayloadCMS và các dịch vụ hỗ trợ.
- Có nhiều chế độ triển khai: VM đơn, nhà cung cấp đám mây, kết hợp biên/không cần máy chủ và các nền tảng ứng dụng.
- Mỗi môi trường (phát triển, sản xuất) cần broker, cấu hình và thông tin đăng nhập được tách biệt rõ ràng.
- Bảo mật, quản lý cấu hình, giám sát, sao lưu và quy trình cập nhật là các phần cốt lõi của thiết kế triển khai, không phải là suy nghĩ sau.
- Các trang cụ thể về nền tảng tinh chỉnh tổng quan này thành các bước sẵn sàng sử dụng cho AWS, Cloudflare, máy ảo và Coolify.
