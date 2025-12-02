# Bước 1: Tạo Tài Khoản

Bước đầu tiên để sử dụng SematX là tạo tài khoản trên instance SematX của tổ chức bạn.

⏱️ **Thời gian**: 5 phút  
🎯 **Mục tiêu**: Truy cập dashboard SematX và tạo API credentials

## Trước Khi Bắt Đầu

### Lấy URL của SematX Server

Bạn cần URL của SematX server của tổ chức. Thường có dạng:

- `https://sematx.example.com`
- `https://dashboard.your-company.com`
- `https://smart-city.example.org`

**Chưa có server?** Bạn có thể:

- Hỏi quản trị viên hệ thống để lấy URL
- [Triển khai instance riêng](../../deployment/index.md)
- [Khởi động local server](../start-server/index.vi.md) để phát triển

### Kiểm Tra Yêu Cầu Truy Cập

Một số instance SematX yêu cầu:

- **Lời mời**: Quản trị viên phải tạo tài khoản cho bạn
- **Hạn chế domain**: Email phải khớp với domain tổ chức
- **VPN**: Có thể cần VPN cho mạng riêng

Liên hệ quản trị viên nếu không chắc về yêu cầu truy cập.

## Tạo Tài Khoản

### Truy Cập Dashboard

1. Mở trình duyệt web
2. Vào URL instance SematX của bạn
3. Thêm `/admin` để truy cập dashboard:
   ```
   https://your-sematx-server.com/admin
   ```

### Đăng Ký (Self-Registration)

Nếu tính năng tự đăng ký được bật, bạn sẽ thấy form **Create First User** hoặc **Sign Up**:

1. **Email**: Nhập địa chỉ email

   ```
   user@example.com
   ```

2. **Password**: Tạo mật khẩu mạnh

   - Tối thiểu 8 ký tự
   - Kết hợp chữ hoa, chữ thường, số, ký tự đặc biệt
   - Ví dụ: `Sm@rtC1ty2025!`

3. **Confirm Password**: Nhập lại mật khẩu

4. **Name** (tùy chọn): Tên đầy đủ của bạn

   ```
   John Doe
   ```

5. Nhấn **Create Account** hoặc **Sign Up**

### Tài Khoản Do Quản Trị Viên Tạo

Nếu tài khoản được tạo bởi quản trị viên:

1. Kiểm tra email để nhận lời mời
2. Nhấn vào link kích hoạt
3. Đặt mật khẩu của bạn
4. Đăng nhập với thông tin đăng nhập

## Đăng Nhập

Sau khi tạo tài khoản, đăng nhập vào dashboard:

1. Truy cập trang đăng nhập:

   ```
   https://your-sematx-server.com/admin/login
   ```

2. Nhập thông tin đăng nhập:

   - **Email**: Email đã đăng ký
   - **Password**: Mật khẩu tài khoản

3. Nhấn **Log In**

Bây giờ bạn sẽ thấy giao diện dashboard SematX!

### Các Phần Chính

- **Dashboard**: Xem trực quan hóa dữ liệu của bạn
- **Maps**: Trực quan hóa dữ liệu địa lý
- **Entities**: Duyệt và quản lý các entity NGSI-LD
- **API Keys**: Tạo token để truy cập API
- **Cards**: Tạo và cấu hình các card dashboard
- **Subscriptions**: Thiết lập thông báo thời gian thực
- **Users**: Quản lý thành viên nhóm (chỉ admin)
- **Settings**: Cấu hình tùy chọn của bạn

## Tạo API Key Đầu Tiên

Để tương tác với SematX API từ ứng dụng của bạn, bạn cần một API key (JWT token).

### Truy Cập API Keys

1. Nhấn **API Keys** trong thanh bên trái
2. Nhấn nút **Create New**

### Cấu Hình API Key

Điền thông tin API key:

1. **Name**: Đặt tên mô tả cho API key

   ```
   My Application - Production
   ```

   **Mẹo**: Sử dụng tên có ý nghĩa để dễ nhận biết sau này:

   - `IoT Sensors - Building A`
   - `Mobile App - iOS`
   - `Data Pipeline - Staging`

2. **Description** (tùy chọn): Thêm ghi chú về cách sử dụng

   ```
   API key for production IoT sensor data collection
   ```

3. **Expires**: Đặt ngày hết hạn

   - **Khuyến nghị**: 90 ngày cho production
   - **Ngắn hạn**: 7-30 ngày cho testing
   - **Không hết hạn**: Chỉ cho development (không khuyến nghị cho production)

4. **Permissions**: Chọn mức truy cập

   - **Read Only**: Chỉ có thể truy vấn dữ liệu
   - **Read/Write**: Có thể tạo và cập nhật entity
   - **Full Access**: Có thể quản lý tất cả tài nguyên

   **Cho tutorial này**: Chọn **Read/Write** hoặc **Full Access**

5. **Rate Limit** (nếu có): Đặt giới hạn request

   - Mặc định: 100 request mỗi phút
   - Lưu lượng cao: 1000 request mỗi phút
   - Lưu lượng thấp: 10 request mỗi phút

6. Nhấn **Create**

### Lưu API Key

**Quan trọng**: Bạn chỉ thấy API key một lần duy nhất!

1. **Copy toàn bộ token**:

   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTg3ZjJhMTIzNDU2Nzg5IiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicGVybWlzc2lvbnMiOlsicmVhZDplbnRpdGllcyIsIndyaXRlOmVudGl0aWVzIl0sImlhdCI6MTcwNDE1MzYwMCwiZXhwIjoxNzEyMDE1NjAwfQ.xGZHY8PK2yWQJ3uT6E9hxK4rN7mV8lB0nQ5sA1wF2cD
   ```

2. **Lưu trữ an toàn**:

   - **Cho development**: Lưu trong file `.env` (không commit lên git!)
   - **Cho production**: Lưu trong secrets manager (AWS Secrets Manager, Azure Key Vault, v.v.)
   - **Không bao giờ**: Chia sẻ qua email, Slack, hoặc kênh công khai

3. **Nhấn Done**

## Kiểm Tra Kết Nối

Hãy xác minh bạn có thể kết nối với SematX API bằng API key mới.

### Sử Dụng curl

Mở terminal và chạy:

```bash
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/entities?limit=1" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Accept: application/ld+json"
```

**Thay thế**:

- `your-sematx-server.com` với URL server thực tế
- `YOUR_API_KEY_HERE` với API key của bạn

**Kết quả mong đợi**:

```json
[]
```

Hoặc nếu đã có entity:

```json
[
  {
    "id": "urn:ngsi-ld:Sensor:001",
    "type": "Sensor",
    ...
  }
]
```

### Sử Dụng JavaScript

```javascript
const SEMATX_URL = "https://your-sematx-server.com";
const API_KEY = "YOUR_API_KEY_HERE";

async function testConnection() {
  const response = await fetch(`${SEMATX_URL}/ngsi-ld/v1/entities?limit=1`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/ld+json",
    },
  });

  if (response.ok) {
    const data = await response.json();
    console.log("✅ Connected successfully!");
    console.log("Entities:", data);
  } else {
    console.error("❌ Connection failed:", response.status);
  }
}

testConnection();
```

### Sử Dụng Python

```python
import requests

SEMATX_URL = 'https://your-sematx-server.com'
API_KEY = 'YOUR_API_KEY_HERE'

def test_connection():
    response = requests.get(
        f'{SEMATX_URL}/ngsi-ld/v1/entities',
        params={'limit': 1},
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Accept': 'application/ld+json'
        }
    )

    if response.ok:
        print('✅ Connected successfully!')
        print('Entities:', response.json())
    else:
        print(f'❌ Connection failed: {response.status_code}')
        print(response.text)

test_connection()
```

## Xử Lý Sự Cố

### 401 Unauthorized

**Vấn đề**: API trả về mã lỗi 401

**Giải pháp**:

1. **Kiểm tra API key**: Đảm bảo bạn đã copy đầy đủ
2. **Kiểm tra hết hạn**: Key có thể đã hết hạn
3. **Kiểm tra định dạng**: Header phải là `Authorization: Bearer <token>`
4. **Tạo lại**: Tạo API key mới nếu cần

### 403 Forbidden

**Vấn đề**: API trả về mã lỗi 403

**Giải pháp**:

1. **Kiểm tra quyền**: API key có thể thiếu quyền cần thiết
2. **Kiểm tra tài khoản**: Tài khoản của bạn có thể bị vô hiệu hóa
3. **Liên hệ admin**: Có thể cần quyền cao hơn

### Network Error / Timeout

**Vấn đề**: Không thể kết nối server

**Giải pháp**:

1. **Kiểm tra URL**: Xác minh địa chỉ server đúng
2. **Kiểm tra mạng**: Đảm bảo bạn đã kết nối internet
3. **Kiểm tra VPN**: Có thể cần VPN cho mạng riêng
4. **Kiểm tra firewall**: Firewall có thể chặn kết nối
5. **Kiểm tra DNS**: Thử địa chỉ IP thay vì tên miền

### SSL/TLS Error

**Vấn đề**: Xác minh certificate thất bại

**Giải pháp**:

1. **Self-signed cert**: Admin có thể dùng certificate tự ký
2. **Chỉ development**: Vô hiệu hóa xác minh SSL (không dùng cho production!)
   ```bash
   curl -k https://your-sematx-server.com/...
   ```
3. **Production**: Cài đặt SSL certificate đúng cách

### Cannot Access Dashboard

**Vấn đề**: Trang dashboard không load

**Giải pháp**:

1. **Kiểm tra URL**: Phải bao gồm đường dẫn `/admin`
2. **Kiểm tra trình duyệt**: Thử trình duyệt khác hoặc chế độ ẩn danh
3. **Xóa cache**: Xóa cache và cookie trình duyệt
4. **Kiểm tra server**: Server có thể bị down - liên hệ admin

## Thực Hành Bảo Mật Tốt Nhất

### Quản Lý API Key

✅ **Nên**:

- Dùng biến môi trường cho API key
- Xoay vòng key định kỳ (mỗi 90 ngày)
- Dùng key khác nhau cho môi trường khác nhau
- Thu hồi key khi không còn cần
- Đặt ngày hết hạn cho tất cả key
- Dùng quyền tối thiểu cần thiết

❌ **Không nên**:

- Commit API key vào version control
- Chia sẻ key qua email hoặc chat
- Dùng key production trong development
- Cho quyền full access khi chỉ cần read-only
- Tạo key không có ngày hết hạn
- Dùng lại key cho nhiều project

### Bảo Mật Mật Khẩu

✅ **Nên**:

- Dùng mật khẩu mạnh, độc nhất
- Bật 2FA nếu có
- Dùng password manager
- Đổi mật khẩu nếu bị lộ

❌ **Không nên**:

- Dùng lại mật khẩu cho nhiều dịch vụ
- Chia sẻ thông tin đăng nhập tài khoản
- Dùng mật khẩu đơn giản hoặc phổ biến
- Viết mật khẩu dạng plain text

## Những Gì Bạn Đã Học

✅ Cách truy cập dashboard SematX  
✅ Cách tạo tài khoản người dùng  
✅ Cách tạo API key  
✅ Cách kiểm tra kết nối API  
✅ Thực hành bảo mật tốt nhất cho API key

## Bước Tiếp Theo

Bây giờ bạn đã có tài khoản và API key, hãy tạo service cho ứng dụng của bạn:

[**Bước 2: Tạo Service →**](2-create-service.vi.md)

---

**Cần quay lại?** Về [tổng quan tutorial](index.vi.md)
