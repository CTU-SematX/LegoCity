# Vận hành và bảo trì

Trang này mô tả cách **chạy LegoCity trong dài hạn**:

- cái gì cần giám sát,
- cái gì cần sao lưu,
- cách cập nhật các thành phần an toàn,
- cách xử lý sự cố và bảo mật.

Nó không phụ thuộc nền tảng: các ý tưởng tương tự áp dụng dù bạn triển khai trên VM, AWS, Coolify hoặc nền tảng khác. Các trang cụ thể theo nền tảng sẽ chỉ _cách_ triển khai các ý tưởng này với các công cụ cụ thể.

---

## Trách nhiệm vận hành

Triển khai LegoCity là hơn cả lần `triển khai` đầu tiên:

- **Khả dụng**  
  Bảng điều khiển, PayloadCMS và các điểm cuối API nên có thể truy cập và phản hồi.

- **Độ mới của dữ liệu**  
  Các máy chủ cập nhật phải tiếp tục thu thập dữ liệu và cập nhật các thực thể.

- **Tính nhất quán**  
  Các mô hình thực thể và API phải được đồng bộ trên các dịch vụ và tài liệu.

- **Bảo mật**  
  Quyền truy cập ghi vào broker, giao diện quản trị và các bí mật phải được bảo vệ và xoay vòng.

- **Khả năng khôi phục**  
  Phải có thể khôi phục hệ thống sau khi mất dữ liệu hoặc cấu hình sai.

Trang này giả định rằng:

- triển khai đã đang chạy,
- bạn có ít nhất một môi trường (phát triển) và lý tưởng là môi trường sản xuất riêng biệt.

---

## Cái gì cần giám sát

Giám sát nên bao phủ cả sức khỏe **hạ tầng** và **cấp ứng dụng**.

### Các thành phần cốt lõi

Tối thiểu, theo dõi những điều sau:

- **Context broker**

  - sức khỏe của tiến trình/container,
  - thời gian phản hồi và tỷ lệ lỗi trên các điểm cuối chính,
  - sử dụng lưu trữ và bất kỳ chỉ số nội bộ nào (nếu có).

- **Các máy chủ cập nhật**

  - thời gian chạy thành công cuối cùng,
  - số lượng thực thể được tạo/cập nhật mỗi lần chạy,
  - tỷ lệ lỗi khi gọi các API bên ngoài hoặc broker.

- **PayloadCMS**

  - tỷ lệ lỗi HTTP (4xx/5xx),
  - thời gian phản hồi cho giao diện quản trị,
  - lỗi kết nối cơ sở dữ liệu.

- **Proxy / API**

  - thời gian phản hồi và tỷ lệ lỗi cho các điểm cuối `/api/...`,
  - thời gian chờ tới broker,
  - khối lượng yêu cầu trên mỗi điểm cuối.

- **Bảng điều khiển**
  - khả dụng cơ bản (đã có thể tải chưa),
  - lỗi UI nghiêm trọng (nếu bạn thu thập báo cáo lỗi frontend).

### Tín hiệu và ngưỡng

Ví dụ về các cảnh báo hữu ích:

- broker ngừng hoạt động hoặc trả về 5xx trên các điểm cuối sức khỏe,
- các máy chủ cập nhật thất bại liên tiếp trong một khoảng (ví dụ 10–15 phút),
- quản trị payload trả về lỗi 500 thường xuyên,
- sự giảm đột ngột trong số lượng thực thể (có thể chỉ ra cập nhật xấu),
- tăng trưởng không giới hạn trong số lượng thực thể (có thể chỉ ra trùng lặp).

Ngưỡng chính xác phụ thuộc vào:

- tần suất cập nhật dữ liệu,
- lưu lượng dự kiến,
- khả năng chịu đựng cho độ trễ trong bảng điều khiển.

---

## Nhật ký và khả năng quan sát

Nhật ký là nguồn sự thật đầu tiên khi có vấn đề.

### Cái gì cần ghi nhật ký

Mỗi thành phần nên ghi nhật ký ít nhất:

- **khởi động**:

  - tóm tắt cấu hình (đã làm sạch, không có bí mật),
  - phiên bản hoặc mã băm commit.

- **hoạt động bình thường**:

  - các máy chủ cập nhật:
    - số lượng thực thể được xử lý mỗi chu kỳ,
    - các cuộc gọi API bên ngoài chính,
    - thất bại một phần (giới hạn thời gian, nhưng có thông tin).
  - proxy:
    - lỗi thượng nguồn khi gọi broker,
    - lỗi xác thực trên các yêu cầu đến.

- **lỗi**:
  - thời gian chờ mạng,
  - thất bại ghi broker,
  - lỗi cơ sở dữ liệu (PayloadCMS).

Nhật ký nên được cấu trúc đủ để:

- bạn có thể lọc theo thành phần, mức độ nghiêm trọng và thời gian,
- bạn có thể tương quan các sự kiện giữa các máy chủ cập nhật và broker/proxy.

### Nơi lưu trữ nhật ký

Phụ thuộc vào triển khai:

- VM / Docker:

  - nhật ký Docker (qua `docker logs`),
  - các tệp nhật ký trên đĩa,
  - tùy chọn chuyển đến hệ thống tập trung.

- AWS:

  - CloudWatch Logs cho mỗi dịch vụ ECS,
  - chỉ số và cảnh báo CloudWatch.

- Coolify:
  - nhật ký cho mỗi dịch vụ qua giao diện Coolify,
  - tích hợp tùy chọn với các hệ thống nhật ký bên ngoài.

Dù nền tảng nào, người vận hành nên:

- biết cách xem nhật ký cho mỗi thành phần,
- có danh sách ngắn các vị trí nhật ký và lệnh.

---

## Sao lưu

Sao lưu là thiết yếu cho **dữ liệu PayloadCMS** và bất kỳ **lưu trữ broker có trạng thái** nào.

### Cái gì cần sao lưu

Tối thiểu:

- **Cơ sở dữ liệu PayloadCMS**

  - tất cả các bộ sưu tập (lớp, khối, cấu hình giao diện, nội dung),
  - tài khoản người dùng và quyền.

- **Dữ liệu broker** (nếu bền trên đĩa và không thể tái tạo hoàn toàn):
  - kho lưu trữ thực thể hoặc cơ sở dữ liệu được broker sử dụng,
  - các tệp cấu hình (nếu chưa được kiểm soát phiên bản).

Quan trọng nhưng thường bị bỏ qua:

- **Cấu hình**:
  - các tệp cấu hình giống `.env` (không có bí mật) dưới kiểm soát phiên bản,
  - hạ tầng như mã hoặc các định nghĩa triển khai,
  - tên tham số và cấu trúc SSM/Secrets Manager (giá trị bí mật, nhưng cần khóa/đường dẫn).

### Bao lâu sao lưu

Khuyến nghị cơ bản:

- cơ sở dữ liệu sản xuất:

  - sao lưu tự động hàng ngày,
  - snapshot thủ công trước các bản phát hành lớn hoặc thay đổi lược đồ.

- cơ sở dữ liệu phát triển:

  - sao lưu định kỳ nếu cần, nhưng nghiêm ngặt thấp hơn.

- dữ liệu broker:
  - tần suất sao lưu phụ thuộc vào liệu các thực thể có thể xây dựng lại từ nguồn:
    - nếu các nguồn bên ngoài có thể tạo lại trạng thái → ít thường xuyên hơn hoặc tùy chọn,
    - nếu broker giữ dữ liệu duy nhất hoặc được quản lý thủ công → sao lưu phù hợp với DB.

### Kiểm tra khôi phục

Bản sao lưu chỉ hữu ích nếu có thể khôi phục.

- định kỳ khôi phục DB PayloadCMS vào môi trường thử nghiệm:

  - xác minh rằng:
    - quản trị có thể đăng nhập,
    - các trang và cấu hình bản đồ tải đúng,
    - không có hỏng hoặc thiếu bảng/bộ sưu tập.

- nếu dữ liệu broker được sao lưu:
  - khôi phục vào phục vụ broker thử nghiệm,
  - chạy các truy vấn cơ bản để đảm bảo các thực thể xuất hiện như mong đợi.

Ghi chép:

- các thủ tục chính xác để khôi phục:
  - từ nguồn sao lưu nào,
  - vào môi trường nào,
  - ai chịu trách nhiệm.

---

## Cập nhật các thành phần

LegoCity bao gồm nhiều thành phần có thể phát triển ở các tốc độ khác nhau.

### Nguyên tắc chung

Khi cập nhật:

- thay đổi **một lớp một lúc** khi có thể,
- giữ môi trường phát triển và sản xuất riêng biệt,
- đảm bảo tương thích ngược cho các hợp đồng dữ liệu bất cứ khi nào khả thi.

Thứ tự cập nhật điển hình:

1. **Các máy chủ cập nhật và proxy** (thay đổi tương thích ngược).
2. **Bảng điều khiển** (thay đổi giao diện sử dụng API hiện có).
3. **PayloadCMS** (nếu cần thay đổi lược đồ hoặc giao diện quản trị).
4. **Broker và mô hình dữ liệu cốt lõi** (chỉ khi cần thiết, với kế hoạch).

### Quy trình cập nhật

Đường đi an toàn cho bản phát hành mới:

1. **Môi trường phát triển**

   - triển khai hình ảnh mới cho phát triển,
   - áp dụng di chuyển (nếu có) cho DB/broker phát triển,
   - chạy kiểm tra khói:
     - các máy chủ cập nhật có thể khởi động và cập nhật thực thể,
     - proxy và bảng điều khiển có thể đọc thực thể đúng.

2. **Staging (nếu có)**

   - lặp lại với dữ liệu và người dùng thực tế hơn.

3. **Sản xuất**

   - chọn khoảng bảo trì nếu cập nhật gây gián đoạn,
   - sao lưu DB PayloadCMS và trạng thái broker trước,
   - triển khai phiên bản mới:
     - cập nhật container (thẻ hình ảnh),
     - áp dụng di chuyển,
     - giám sát nhật ký và bảng điều khiển chặt chẽ.

4. **Kiểm tra sau triển khai**

   - xác thực:
     - đăng nhập quản trị,
     - các bảng điều khiển chính,
     - độ mới dữ liệu (các máy chủ cập nhật chạy bình thường),
   - xác nhận chỉ số và tỷ lệ lỗi vẫn trong phạm vi dự kiến.

---

## Thay đổi lược đồ và hợp đồng dữ liệu

Các thay đổi đối với mô hình thực thể hoặc API là rủi ro cao.

### Lập kế hoạch thay đổi lược đồ

Cho bất kỳ thay đổi nào đối với cấu trúc thực thể (thuộc tính mới, trường đổi tên, thuộc tính bị xóa):

- cập nhật **tài liệu thực thể** trước:

  - tên loại,
  - thuộc tính,
  - mẫu ID,
  - các mối quan hệ.

- xác định tất cả người tiêu dùng:

  - các điểm cuối proxy,
  - chế độ xem và khối của bảng điều khiển,
  - bất kỳ tích hợp bên ngoài nào.

- quyết định chiến lược di chuyển:
  - hỗ trợ cấu trúc kép tạm thời (thuộc tính cũ và mới),
  - ngắt một bước (chỉ trong các kịch bản được kiểm soát).

### Áp dụng thay đổi lược đồ

Mẫu được đề xuất:

- thêm thuộc tính mới trước, trong khi giữ các thuộc tính cũ:

  - cập nhật các máy chủ cập nhật để ghi cả hai,
  - cập nhật proxy và bảng điều khiển để sử dụng thuộc tính mới,
  - giám sát cho bất kỳ thoái bộ nào.

- xóa hoặc không dùng thuộc tính cũ cuối cùng:
  - chỉ sau khi xác nhận cấu trúc mới được sử dụng đầy đủ,
  - truyền đạt thay đổi cho tất cả các nhóm.

Bất kỳ thay đổi phá vỡ nào nên được ghi chép rõ ràng trong **nhật ký thay đổi** hoặc ghi chú phát hành.

---

## Hoạt động bảo mật

Bảo mật không phải là thiết lập một lần; nó đòi hỏi bảo trì liên tục.

### Quản lý thông tin đăng nhập

Các lĩnh vực cần tập trung:

- **Khóa ghi của broker**:

  - giới hạn cho các máy chủ cập nhật,
  - xoay vòng theo lịch trình đều đặn hoặc khi thành viên nhóm thay đổi,
  - không bao giờ ghi nhật ký hoặc hiển thị dưới dạng văn bản thuần.

- **Tài khoản quản trị PayloadCMS**:

  - mật khẩu mạnh,
  - giới hạn cho các quản trị viên cần thiết,
  - xem xét định kỳ danh sách người dùng và vai trò.

- **Khóa API bên ngoài** (thời tiết, nhà cung cấp dữ liệu di chuyển, v.v.):
  - lưu trữ trong trình quản lý bí mật hoặc cấu hình triển khai,
  - xoay vòng theo khuyến nghị của nhà cung cấp.

Bất cứ khi nào khóa bị nghi ngờ bị lộ:

- thu hồi và thay thế nó,
- kiểm tra nhật ký cho hoạt động bất thường liên quan đến khóa đó.

### Giảm bề mặt

Giảm bề mặt tấn công bằng cách:

- chỉ thố:
  - proxy và bảng điều khiển cho người dùng chung,
  - giao diện quản trị PayloadCMS cho quản trị viên (sử dụng lọc IP, VPN hoặc kiểm soát truy cập),
- giữ broker và DB trên mạng nội bộ,
- đảm bảo các máy chủ cập nhật không thể truy cập công khai trừ khi thực sự cần thiết.

---

## Phản ứng sự cố

Sự cố sẽ xảy ra: broker ngừng hoạt động, thất bại API bên ngoài, triển khai tồi, v.v.

### Sổ tay cơ bản

Chuẩn bị danh sách kiểm tra ngắn, thực tế cho các sự cố thường gặp:

- **Bảng điều khiển không thể tiếp cận backend**:

  - kiểm tra container proxy hoặc trạng thái dịch vụ,
  - kiểm tra DNS và định tuyến reverse proxy,
  - kiểm tra tính hợp lệ chứng chỉ TLS.

- **Bảng điều khiển không hiển thị dữ liệu**:

  - kiểm tra nhật ký máy chủ cập nhật:
    - có cập nhật gần đây không?
  - kiểm tra các thực thể broker:
    - có mặt nhưng được lọc không đúng?
  - kiểm tra proxy:
    - nó có trả về thực thể cho các truy vấn cơ bản không?

- **PayloadCMS không thể truy cập**:

  - kiểm tra trạng thái dịch vụ Payload,
  - kiểm tra kết nối DB,
  - kiểm tra tên miền quản trị và TLS.

- **Lỗi broker**:
  - kiểm tra sử dụng tài nguyên (CPU, bộ nhớ, đĩa),
  - kiểm tra nhật ký lỗi ghi từ các máy chủ cập nhật,
  - kiểm tra liệu khối lượng thực thể hoặc mẫu yêu cầu có thay đổi.

### Giao tiếp

Cho các sự cố lớn hơn:

- quyết định ai:

  - phân loại và giảm thiểu,
  - truyền đạt trạng thái cho các bên liên quan,
  - ghi chép những gì đã xảy ra.

- ghi lại:
  - dòng thời gian của sự cố,
  - nguyên nhân gốc rễ (nếu được xác định),
  - các hành động đã thực hiện,
  - cải tiến tiếp theo.

---

## Nhiệm vụ vận hành thường xuyên

Cho triển khai ổn định, định nghĩa các nhiệm vụ đều đặn:

### Hàng ngày hoặc mỗi ca

- kiểm tra bảng điều khiển cho lỗi rõ ràng hoặc dữ liệu thiếu,
- xem qua nhật ký broker và máy chủ cập nhật cho bất kỳ lỗi lặp lại nào,
- xác nhận rằng ít nhất một chu kỳ cập nhật thành công gần đây.

### Hàng tuần

- xem xét cảnh báo và ngưỡng; điều chỉnh nếu có mệt mỏi cảnh báo,
- kiểm tra các cập nhật có sẵn trong các phụ thuộc quan trọng (nếu bạn theo dõi thủ công),
- chạy các truy vấn sức khỏe cơ bản đối với broker.

### Hàng tháng hoặc hàng quý

- kiểm tra khôi phục DB PayloadCMS (trong môi trường không sản xuất),
- xoay vòng các thông tin đăng nhập đã chọn (khóa API, token ghi) như thực hành,
- xem xét tài liệu thực thể và cập nhật nếu triển khai lệch,
- đánh giá sử dụng tài nguyên so với năng lực.

---

## Tóm tắt

- Vận hành và bảo trì cho LegoCity xoay quanh khả dụng, độ mới dữ liệu, tính nhất quán, bảo mật và khả năng khôi phục.
- Giám sát nên bao gồm broker, các máy chủ cập nhật, PayloadCMS, proxy và bảng điều khiển, với cảnh báo rõ ràng cho thất bại và hành vi bất thường.
- Sao lưu, đặc biệt của DB PayloadCMS và bất kỳ lưu trữ broker không thể dễ dàng tạo lại, phải định kỳ và được kiểm tra.
- Cập nhật nên chảy qua phát triển (và staging, nếu có) trước sản xuất, với sự chăm sóc đặc biệt khi thay đổi lược đồ thực thể và API.
- Các hoạt động bảo mật bao gồm quản lý khóa ghi của broker, quyền truy cập quản trị, khóa API bên ngoài và giới hạn bề mặt tiếp xúc.
- Các sổ tay xử lý sự cố rõ ràng và các nhiệm vụ vận hành thường xuyên giúp giữ triển khai dự đoán được và dễ bảo trì hơn theo thời gian.
