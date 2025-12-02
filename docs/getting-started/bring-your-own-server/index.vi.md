# Kết nối Server Riêng của Bạn

Hướng dẫn này hướng dẫn bạn kết nối ứng dụng của bạn với một instance SematX hiện có. Bạn sẽ học cách xác thực, tạo entities, đẩy dữ liệu và xây dựng visualizations trên remote SematX server.

⏱️ **Thời gian ước tính**: 30-45 phút  
💻 **Yêu cầu**: SematX instance URL, thông tin đăng nhập API  
🎯 **Mục tiêu**: Tích hợp app của bạn với production SematX server

## Những gì Bạn sẽ Học

Khi kết thúc hướng dẫn này, bạn sẽ có thể:

- Tạo tài khoản SematX và lấy thông tin đăng nhập API
- Thiết lập cấu hình service cho ứng dụng của bạn
- Tạo và quản lý NGSI-LD entities
- Đẩy dữ liệu thời gian thực từ ứng dụng của bạn
- Xây dựng dashboard cards để trực quan hóa dữ liệu của bạn
- Cấu hình subscriptions cho thông báo thời gian thực

## Tổng quan Hướng dẫn

Hướng dẫn này được chia thành 6 bước:

1. **[Tạo Tài khoản](1-create-account.vi.md)** - Đăng ký và lấy thông tin đăng nhập
2. **[Tạo Service](2-create-service.vi.md)** - Thiết lập service cho ứng dụng của bạn
3. **[Tạo Entity Đầu tiên](3-create-entity.vi.md)** - Định nghĩa cấu trúc dữ liệu
4. **[Đẩy Dữ liệu](4-push-data.vi.md)** - Gửi dữ liệu từ ứng dụng của bạn
5. **[Tạo Dashboard Cards](5-create-card.vi.md)** - Trực quan hóa dữ liệu của bạn
6. **[Thiết lập Subscriptions](6-subscriptions.vi.md)** - Nhận thông báo thời gian thực

## Điều kiện Tiên quyết

### Yêu cầu

- **SematX Instance URL**: URL cơ sở của SematX server
  - Ví dụ: `https://sematx.example.com`
- **Thông tin Đăng nhập**: Email và password cho tài khoản SematX
  - Nếu bạn chưa có tài khoản, bạn sẽ cần lời mời từ quản trị viên

### Khuyến nghị

- **HTTP Client**: Để test API calls
  - [curl](https://curl.se/) (command line)
  - [Postman](https://www.postman.com/) (GUI)
  - [HTTPie](https://httpie.io/) (command line, user-friendly)
- **Code Editor**: Để viết integration code
  - [VS Code](https://code.visualstudio.com/)
- **Ngôn ngữ Lập trình**: Bất kỳ ngôn ngữ nào có hỗ trợ HTTP
  - JavaScript/TypeScript (Node.js, browser)
  - Python
  - Java
  - Go
  - Rust
  - PHP

## Kiến trúc

Khi sử dụng remote SematX server, ứng dụng của bạn giao tiếp với nền tảng qua HTTPS:

![Kiến trúc SematX](../../assets/architecture-diagram-vi.jpg)

**Điểm chính**:

- Tất cả giao tiếp qua HTTPS (bảo mật)
- JWT tokens xác thực các requests của bạn
- Bạn có thể sử dụng bất kỳ ngôn ngữ lập trình nào
- Server xử lý lưu trữ và xử lý dữ liệu

## Các Trường hợp Sử dụng

### Thu thập Dữ liệu IoT

Gửi sensor readings từ thiết bị đến SematX:

- Environmental sensors (nhiệt độ, độ ẩm, chất lượng không khí)
- Giám sát thiết bị công nghiệp
- Hệ thống tòa nhà thông minh
- Theo dõi xe

### Tích hợp Ứng dụng Web

Kết nối ứng dụng web của bạn với dữ liệu SematX:

- Hiển thị dữ liệu sensor thời gian thực
- Tạo custom analytics dashboards
- Xây dựng dịch vụ dựa trên vị trí
- Tích hợp với hệ thống hiện có

### Backend cho Ứng dụng Mobile

Sử dụng SematX làm backend cho mobile app:

- Lưu trữ dữ liệu do người dùng tạo
- Đồng bộ dữ liệu trên các thiết bị
- Push notifications cho events
- Truy vấn dựa trên vị trí

### Tích hợp Data Pipeline

Kết hợp SematX vào data pipeline của bạn:

- Nhập dữ liệu từ nhiều nguồn
- Transform và normalize dữ liệu
- Kích hoạt webhooks cho xử lý downstream
- Export dữ liệu để phân tích

## Luồng Xác thực

Hiểu cách xác thực hoạt động sẽ giúp bạn tích hợp thành công:

```
1. User đăng nhập vào Dashboard
   ↓
2. Dashboard tạo JWT token (API Key)
   ↓
3. User copy API Key
   ↓
4. Ứng dụng bao gồm API Key trong requests
   ↓
5. Nginx xác thực JWT token
   ↓
6. Request được chuyển tiếp đến Orion-LD hoặc Dashboard API
   ↓
7. Response được trả về cho ứng dụng
```

**Cấu trúc JWT Token**:

```
{
  "userId": "user_123",
  "email": "user@example.com",
  "permissions": ["read:entities", "write:entities"],
  "exp": 1735689600,
  "iat": 1704153600
}
```

## API Endpoints

Bạn sẽ sử dụng các API endpoints chính này:

### NGSI-LD API (Orion-LD)

**Base URL**: `https://your-sematx-server.com/ngsi-ld/v1`

| Endpoint               | Method | Mục đích                   |
| ---------------------- | ------ | -------------------------- |
| `/entities`            | POST   | Tạo entity                 |
| `/entities`            | GET    | Truy vấn entities          |
| `/entities/{id}`       | GET    | Lấy entity theo ID         |
| `/entities/{id}/attrs` | PATCH  | Cập nhật thuộc tính entity |
| `/entities/{id}`       | DELETE | Xóa entity                 |
| `/subscriptions`       | POST   | Tạo subscription           |
| `/subscriptions`       | GET    | Liệt kê subscriptions      |

### Dashboard API

**Base URL**: `https://your-sematx-server.com/api`

| Endpoint       | Method | Mục đích           |
| -------------- | ------ | ------------------ |
| `/api-keys`    | POST   | Tạo API key        |
| `/api-keys`    | GET    | Liệt kê API keys   |
| `/cards`       | POST   | Tạo dashboard card |
| `/cards`       | GET    | Liệt kê cards      |
| `/users/login` | POST   | Đăng nhập user     |

## Rate Limits

Hầu hết các SematX instances thực thi rate limits:

- **Mặc định**: 100 requests mỗi phút cho mỗi API key
- **Burst**: 20 requests mỗi giây cho bursts ngắn
- **Headers**: Thông tin rate limit trong response headers
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1704153660
  ```

**Mẹo cho Rate Limiting**:

- Cache dữ liệu được truy cập thường xuyên
- Sử dụng subscriptions thay vì polling
- Batch updates khi có thể
- Triển khai exponential backoff cho retries

## Ví dụ Code

Chúng tôi cung cấp ví dụ code bằng nhiều ngôn ngữ trong suốt hướng dẫn:

- **JavaScript/TypeScript**: Ví dụ Node.js và browser
- **Python**: Sử dụng thư viện `requests`
- **curl**: Ví dụ command-line
- **Postman**: Collection files để import

## Nhận Trợ giúp

Nếu bạn gặp khó khăn trong hướng dẫn này:

- **Kiểm tra logs**: Hầu hết các lỗi bao gồm thông báo hữu ích
- **Xác minh credentials**: Đảm bảo API keys hợp lệ và chưa hết hạn
- **Test connectivity**: Sử dụng curl để xác minh khả năng truy cập server
- **Xem lại docs**: Tham khảo [Hướng dẫn Khắc phục Sự cố](../../reference/troubleshooting.vi.md) nếu gặp vấn đề
- **Yêu cầu trợ giúp**: Tham gia [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)

## Sẵn sàng Bắt đầu?

Hãy bắt đầu bằng cách tạo tài khoản của bạn:

[**Bước 1: Tạo Tài khoản →**](1-create-account.vi.md)

---

## Thay thế: Bắt đầu với Local trước

Nếu bạn chưa có quyền truy cập vào SematX server, bạn có thể:

1. **[Khởi động local server](../start-server/index.vi.md)** cho development
2. Hoàn thành hướng dẫn này sử dụng local instance
3. Triển khai production khi sẵn sàng

API giống hệt nhau cho dù sử dụng local hay remote servers!
