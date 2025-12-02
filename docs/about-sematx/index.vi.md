# Giới thiệu về SematX

SematX là một nền tảng **Smart City** mã nguồn mở được thiết kế để giúp đơn giản hóa việc thu thập, quản lý và trực quan hóa dữ liệu IoT từ các cảm biến, thiết bị và dịch vụ đa dạng.

## SematX là gì?

SematX cung cấp một giải pháp toàn diện cho các trường hợp sử dụng thành phố thông minh, kết hợp ba thành phần chính:

1. **NGSI-LD Context Broker** (Orion-LD) - Lưu trữ và truy vấn dữ liệu theo tiêu chuẩn
2. **Orion Nginx Gateway** - Xác thực API, giới hạn tốc độ và định tuyến
3. **Lego Dashboard** - Tạo dashboard thời gian thực và quản lý dữ liệu

Bằng cách sử dụng các tiêu chuẩn mở như **NGSI-LD** và **FIWARE**, SematX đảm bảo tính tương thích với các hệ sinh thái thành phố thông minh và dữ liệu IoT hiện có trên toàn cầu.

## Tại sao lại là SematX?

### Tuân thủ tiêu chuẩn

SematX được xây dựng dựa trên **NGSI-LD v1.6.1** - một thông số kỹ thuật ETSI để trao đổi dữ liệu ngữ cảnh. Điều này đảm bảo:

- Tương thác với các nền tảng tuân thủ FIWARE khác
- Mô hình hóa dữ liệu theo mô hình Smart Data Models
- Tích hợp liền mạch với các dịch vụ thành phố thông minh hiện có

### Mã nguồn mở và mở rộng được

- Hoàn toàn miễn phí để sử dụng và chỉnh sửa
- Code base TypeScript/React hiện đại
- Kiến trúc plugin để tùy chỉnh
- Cộng đồng tích cực và hỗ trợ tài liệu

### Sẵn sàng sản xuất

- Xác thực JWT và kiểm soát truy cập dựa trên vai trò
- Giới hạn tốc độ và bảo vệ DDoS
- Giám sát hiệu suất và ghi logs
- Hỗ trợ đa tenant cho khách hàng nhiều tổ chức

### Trải nghiệm nhà phát triển

- Thiết lập local Docker một lệnh
- RESTful API với tài liệu OpenAPI
- Ví dụ code bằng nhiều ngôn ngữ (JavaScript, Python, curl)
- TypeScript types cho an toàn kiểu dữ liệu

## Tầm nhìn

**Nhiệm vụ của chúng tôi**: Dân chủ hóa các công nghệ thành phố thông minh bằng cách cung cấp các công cụ mã nguồn mở, dựa trên tiêu chuẩn mà bất kỳ ai cũng có thể triển khai và tùy chỉnh.

**Tầm nhìn của chúng tôi**: Một thế giới nơi mọi thành phố, dù lớn hay nhỏ, đều có thể tận dụng sức mạnh của dữ liệu IoT để cải thiện cuộc sống của cư dân mà không bị khóa bởi các nhà cung cấp độc quyền.

## Các trường hợp sử dụng

SematX có thể được sử dụng cho nhiều kịch bản thành phố thông minh:

### 1. Giám sát môi trường

- Theo dõi chất lượng không khí (PM2.5, PM10, CO₂, NO₂)
- Giám sát mức độ tiếng ồn
- Cảm biến thời tiết (nhiệt độ, độ ẩm, áp suất)
- Phát hiện chất lượng nước

**Ví dụ**: Một thành phố triển khai 50 trạm giám sát chất lượng không khí trên các khu vực khác nhau, hiển thị dữ liệu thời gian thực trên dashboard công khai và kích hoạt cảnh báo khi vượt ngưỡng.

### 2. Quản lý giao thông

- Đếm và phát hiện xe
- Giám sát tình trạng đỗ xe
- Quản lý tín hiệu giao thông
- Theo dõi phương tiện giao thông công cộng

**Ví dụ**: Giám sát phạm vi giao thông thông qua các cảm biến thông minh để tối ưu hóa thời gian tín hiệu đèn và giảm tắc nghẽn trong giờ cao điểm.

### 3. Quản lý năng lượng

- Giám sát tiêu thụ điện năng
- Quản lý đèn đường thông minh
- Theo dõi sản xuất năng lượng tái tạo
- Tối ưu hóa lưới điện

**Ví dụ**: Hệ thống đèn đường thông minh điều chỉnh độ sáng dựa trên điều kiện ánh sáng môi trường và lưu lượng người đi bộ, tiết kiệm đến 60% chi phí năng lượng.

### 4. Quản lý chất thải

- Cảm biến mức độ đầy thùng rác
- Tối ưu hóa tuyến đường thu gom
- Theo dõi xe thu gom rác
- Dự đoán tần suất thu gom

**Ví dụ**: Các thùng rác thông minh báo cáo mức độ đầy, cho phép tuyến đường thu gom động chỉ ghé thăm các thùng cần được làm trống, giảm chi phí nhiên liệu 30%.

### 5. Quản lý tòa nhà thông minh

- HVAC và điều khiển nhiệt độ
- Hệ thống an ninh và kiểm soát ra vào
- Phát hiện điểm có người hiện diện và tối ưu hóa
- Cảnh báo bảo trì

**Ví dụ**: Hệ thống quản lý tòa nhà tự động điều chỉnh hệ thống sưởi, thông gió và điều hòa không khí dựa trên điểm có người hiện diện và điều kiện thời tiết, cải thiện sự thoải mái trong khi giảm chi phí năng lượng.

### Q1 2025 - Nền tảng cốt lõi

- ✅ Tích hợp NGSI-LD với Orion-LD
- ✅ Dashboard PayloadCMS với tạo card
- ✅ Hỗ trợ xác thực và đa tenant JWT
- ✅ Giám sát thời gian thực với WebSockets
- 🔄 Tài liệu và ví dụ toàn diện

### Q2 2025 - Trải nghiệm nhà phát triển

- 📋 Hướng dẫn tích hợp cho các ngôn ngữ phổ biến
- 📋 Mẫu plugin cho các loại cảm biến phổ biến
- 📋 Tích hợp CI/CD với GitHub Actions
- 📋 Nền tảng thử nghiệm online (SematX Cloud)
- 📋 Xuất dữ liệu và công cụ di chuyển

### Q3 2025 - Khả năng nâng cao

- 📋 Machine Learning cho dự đoán và phát hiện bất thường
- 📋 Công cụ trực quan hóa dữ liệu nâng cao
- 📋 Quản lý tích hợp thiết bị IoT
- 📋 Tích hợp bản đồ địa lý với Mapbox/Leaflet
- 📋 Khả năng truy vấn dữ liệu lịch sử

### Q4 2025 - Quy mô doanh nghiệp

- 📋 Clustering và cân bằng tải cho độ khả dụng cao
- 📋 Sharding cơ sở dữ liệu cho bộ dữ liệu lớn
- 📋 Nhật ký kiểm toán và báo cáo tuân thủ
- 📋 Cổng quản trị doanh nghiệp
- 📋 Hỗ trợ doanh nghiệp và các gói SLA

## Bắt đầu

Sẵn sàng khám phá SematX? Chọn đường dẫn của bạn:

- **[Khám phá hệ sinh thái →](ecosystem.vi.md)** - Hiểu về kiến trúc
- **[Xem xét công cụ →](tools.vi.md)** - Tìm hiểu về ngăn xếp công nghệ
- **[Bắt đầu →](../getting-started/index.vi.md)** - Triển khai môi trường đầu tiên của bạn

## Cộng đồng và hỗ trợ

- **GitHub**: [CTU-SematX/LegoCity](https://github.com/CTU-SematX/LegoCity)
- **Tài liệu**: [https://ctu-sematx.github.io/LegoCity](https://ctu-sematx.github.io/LegoCity)
- **Issues**: [Báo cáo lỗi hoặc đề xuất tính năng](https://github.com/CTU-SematX/LegoCity/issues)
- **Discussions**: [Tham gia thảo luận cộng đồng](https://github.com/CTU-SematX/LegoCity/discussions)

## Giấy phép

SematX được phát hành theo giấy phép **MIT License**, cho phép bạn tự do:

- ✅ Sử dụng thương mại
- ✅ Chỉnh sửa và phân phối lại
- ✅ Sử dụng cá nhân và riêng tư
- ✅ Cấp phép lại
