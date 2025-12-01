# Tổng quan hướng dẫn sử dụng

Phần này giải thích cách làm việc với **lớp dữ liệu** trong LegoCity và cách nó kết nối với bảng điều khiển.

Dành cho những người:

- vận hành hoặc cấu hình **context brokers**,
- xây dựng hoặc duy trì **các server cập nhật** đẩy dữ liệu vào broker,
- cần hiểu cách dữ liệu hiển thị thành **các lớp bản đồ** và **khối** trong UI.

Phần Usage được tổ chức thành các trang sau.

---

## Dữ liệu & brokers

Mô tả luồng dữ liệu tổng thể và vai trò của:

- **context broker**, lưu trữ tất cả NGSI-LD entities, và
- **các server cập nhật**, lấy dữ liệu bên ngoài, chuyển đổi thành entities, và ghi vào broker.

Trang này tập trung vào:

- các thiết lập broker điển hình (đơn và nhiều brokers),
- cách trách nhiệm được chia giữa broker và các server cập nhật,
- tại sao bảng điều khiển đọc nhưng không ghi vào broker.

---

## Entities

Mô tả cách thông tin thành phố được biểu diễn dưới dạng **NGSI-LD entities** và cách **Smart Data Models** được sử dụng.

Trang này bao gồm:

- các loại entity phổ biến trong deployment LegoCity,
- cách Smart Data Models ảnh hưởng đến cấu trúc và đặt tên attribute,
- quy ước cho identifiers, types và geospatial attributes,
- hướng dẫn định nghĩa entity types mới khi yêu cầu thay đổi.

---

## Khóa API & quyền truy cập

Mô tả cách **quyền ghi** đến context broker được kiểm soát.

Trang này giải thích:

- cách các server cập nhật có được quyền ghi,
- các mẫu để chia sẻ hoặc tách các khóa ghi giữa các servers,
- nơi các khóa và tokens nên được lưu trữ,
- các kỳ vọng cơ bản cho xoay khóa và ứng phó sự cố.

Quyền đọc và vai trò của các proxy chỉ đọc cũng được giới thiệu ở mức cao.

---

## Server cập nhật mẫu

Mô tả **server cập nhật mẫu** đi kèm với LegoCity.

Trang này làm rõ:

- mục đích và phạm vi của mẫu,
- cách cấu hình (biến môi trường, API bên ngoài, quyền truy cập broker),
- quy trình làm việc điển hình để chạy nó từ đầu đến cuối,
- cách các team có thể mở rộng để xây dựng các server cập nhật riêng.

---

## Cách sử dụng phần này

Thứ tự đọc điển hình:

1. **Data & brokers** – để hiểu luồng dữ liệu tổng thể.
2. **Entities** – để học cách các khái niệm thành phố được mô hình hóa.
3. **API keys & access** – để xem write access được kiểm soát như thế nào.
4. **Sample update server** – để chạy ví dụ thực tế tối thiểu.

Sau khi đọc qua các trang này, bạn sẽ có cái nhìn rõ ràng về cách dữ liệu vào broker và cách nó được cấu trúc trước khi được dashboard sử dụng.
