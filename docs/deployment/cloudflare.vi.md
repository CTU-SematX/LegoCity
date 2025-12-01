# Triển khai trên Cloudflare

Trang này mô tả cách triển khai bảng điều khiển LegoCity (hoặc một phần của nó) trên Cloudflare, sử dụng:

- **Cloudflare Pages** cho bảng điều khiển Next.js tĩnh,
- **Cloudflare Workers** cho lớp proxy API mỏng (tùy chọn).

Trong thiết lập này:

- Bảng điều khiển được phục vụ từ mạng lưới biên của Cloudflare,
- Phần phụ trợ (broker, PayloadCMS, máy chủ cập nhật) vẫn ở trên hạ tầng của bạn (VM / AWS / Coolify / v.v.),
- Một Worker (tùy chọn) có thể nằm giữa dashboard và backend, định tuyến các yêu cầu API.

---

## Khi nào sử dụng triển khai Cloudflare

Sử dụng Cloudflare khi:

- Bạn muốn phục vụ bảng điều khiển toàn cầu với độ trễ thấp,
- Bạn muốn tận dụng bộ nhớ đệm biên và bảo vệ DDoS của Cloudflare,
- Bạn đã có phần phụ trợ được triển khai ở nơi khác và chỉ cần giao diện công khai cho bảng điều khiển,
- Bạn ưa thích cách tiếp cận không cần server/biên mà không cần quản lý việc lưu trữ container cho bảng điều khiển.

Giới hạn:

- Cloudflare không lưu trữ logic phần phụ trợ (broker, PayloadCMS),
- Cơ sở dữ liệu và lưu trữ bền vững phải được xử lý ở backend của bạn,
- Các route API trong Next.js có thể cần được tái cấu trúc thành Workers nếu bạn triển khai hoàn toàn tĩnh.

---

## Kiến trúc tổng quan

```
Người dùng
  |
Cloudflare Pages (giao diện dashboard)
  |
Cloudflare Workers (proxy API tùy chọn)
  |
Hạ tầng backend của bạn (VM / AWS / v.v.)
  ├── Broker (NGSI-LD)
  ├── PayloadCMS
  └── Máy chủ cập nhật
```

Triển khai Cloudflare tách **frontend** khỏi **backend**:

- **Frontend**: Dashboard trên Cloudflare Pages,
- **Backend**: Tất cả logic, cơ sở dữ liệu, brokers, máy chủ cập nhật trên hạ tầng của bạn,
- **Workers**: Lớp mỏng tùy chọn để ủy quyền các yêu cầu API hoặc thêm logic biên (xác thực, bộ nhớ đệm, giới hạn tốc độ).

---

## Các thành phần trong triển khai Cloudflare

1. **Cloudflare Pages**: Lưu trữ bản build dashboard tĩnh

   - Next.js được xuất dưới dạng HTML/CSS/JS tĩnh,
   - Hoặc được triển khai dưới dạng Pages với kết xuất phía máy chủ trên Workers (nếu sử dụng Next.js với Pages Functions).

2. **Cloudflare Workers** (tùy chọn): Proxy API mỏng

   - Chuyển tiếp các yêu cầu từ dashboard tới API backend (các route `/api/*`),
   - Có thể thêm headers (khóa xác thực),
   - Có thể lưu đệm một số phản hồi tại biên.

3. **Hạ tầng backend**: Không thay đổi
   - Broker, PayloadCMS, cơ sở dữ liệu, máy chủ cập nhật vẫn ở trên VM, AWS, Coolify, v.v.
   - Được truy cập từ Workers hoặc trực tiếp từ dashboard qua các API công khai.

---

## Các bước triển khai

### 1. Triển khai backend (broker, PayloadCMS, máy chủ cập nhật)

Backend phải đã được triển khai trên hạ tầng ổn định:

- Có thể là thiết lập VM + Docker,
- Có thể là AWS ECS + RDS,
- Có thể là Coolify,
- Hoặc bất kỳ nền tảng nào khác.

Đảm bảo:

- Broker có thể truy cập qua điểm cuối riêng tư hoặc truy cập được kiểm soát,
- Quản trị PayloadCMS được bảo mật (truy cập hạn chế),
- Lớp proxy / API được phơi bày qua URL công khai (ví dụ: `https://api.city.example`),
- Máy chủ cập nhật đang chạy và ghi dữ liệu vào broker.

### 2. Chuẩn bị dashboard cho Cloudflare Pages

Đối với dashboard Next.js, có hai cách tiếp cận:

#### Tùy chọn A: Xuất tĩnh (đơn giản nhất)

Xây dựng Next.js như một trang web tĩnh:

```json
// next.config.js
module.exports = {
  output: 'export',
  // ... other configuration
}
```

Xây dựng:

```bash
npm run build
```

Lệnh này sẽ tạo thư mục `out/` với các tệp HTML/JS/CSS tĩnh.

Giới hạn:

- Không có các route API phía máy chủ,
- Tất cả việc lấy dữ liệu phải từ phía máy khách hoặc qua các API bên ngoài.

#### Tùy chọn B: Triển khai với Pages Functions (SSR)

Nếu dashboard cần kết xuất phía máy chủ hoặc các route API, bạn có thể triển khai Next.js dưới dạng Pages với Functions:

- Cloudflare Pages hỗ trợ triển khai Next.js với adapter cho Pages Functions,
- Điều này cho phép kết xuất phía máy chủ và các route API được thực thi tại biên.

Tham khảo [tài liệu Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-nextjs-site/) cho triển khai Next.js với Pages Functions.

### 3. Tạo dự án Cloudflare Pages

Trong bảng điều khiển Cloudflare:

- Đi tới **Pages**,
- Tạo dự án mới,
- Kết nối với kho lưu trữ Git (GitHub, GitLab) hoặc tải lên trực tiếp.

Cài đặt xây dựng cho xuất tĩnh:

- Lệnh xây dựng: `npm run build` (hoặc bất kỳ script xây dựng nào của bạn),
- Thư mục đầu ra: `out` (cho xuất tĩnh),
- Biến môi trường: Đặt bất kỳ biến `NEXT_PUBLIC_*` nào cần thiết (ví dụ: URL cơ sở API).

Triển khai:

- Cloudflare sẽ xây dựng và triển khai tự động,
- Sau khi được triển khai, dashboard có sẵn tại `https://<tên-dự-án>.pages.dev`.

Tên miền tùy chỉnh:

- Thêm tên miền tùy chỉnh trong cài đặt Pages,
- Trỏ bản ghi DNS tới Cloudflare (thường là CNAME tới `<tên-dự-án>.pages.dev`).

### 4. Cấu hình các yêu cầu API từ dashboard

Nếu dashboard cần gọi các API backend:

- Đặt biến môi trường `NEXT_PUBLIC_API_BASE_URL` tới URL backend (ví dụ: `https://api.city.example`),
- Dashboard sẽ thực hiện các yêu cầu trực tiếp tới URL đó.

Nếu backend không thể truy cập công khai:

- Thiết lập Worker proxy (xem bên dưới).

### 5. Triển khai Cloudflare Worker (proxy API tùy chọn)

Nếu bạn muốn Worker nằm giữa dashboard và backend:

**Mục đích**:

- Ẩn các URL backend khỏi máy khách,
- Thêm các header xác thực,
- Lưu đệm các phản hồi tại biên,
- Giới hạn tốc độ hoặc logic biên khác.

**Ví dụ Worker**:

```javascript
// worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Định tuyến các yêu cầu API tới backend
    if (url.pathname.startsWith("/api/")) {
      const backendUrl = `https://your-backend.example${url.pathname}${url.search}`;

      // Chuyển tiếp yêu cầu tới backend
      const response = await fetch(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      return response;
    }

    // Đối với tất cả các yêu cầu khác, phục vụ từ Pages
    return env.ASSETS.fetch(request);
  },
};
```

Triển khai Worker:

```bash
npm install -g wrangler
wrangler login
wrangler publish
```

Định tuyến Worker:

- Trong bảng điều khiển Cloudflare, cấu hình route cho tên miền của bạn (ví dụ: `city.example/*` → Worker),
- Điều này đảm bảo Worker xử lý các yêu cầu trước khi tới Pages.

### 6. Xác minh triển khai

- Mở URL dashboard (`https://city.example` hoặc `https://<tên-dự-án>.pages.dev`),
- Kiểm tra bản đồ có tải không,
- Xác minh các lớp dữ liệu lấy thực thể từ broker (qua API backend hoặc Worker),
- Kiểm tra quản trị PayloadCMS có thể truy cập (nếu được định tuyến qua cùng tên miền).

---

## Cân nhắc bảo mật

Trong triển khai Cloudflare:

- **Dashboard**: Công khai, bất kỳ ai cũng có thể truy cập (trừ khi bạn thêm lớp xác thực),
- **API Backend**: Nên được bảo vệ:

  - Hạn chế truy cập tới các IP đã biết (ví dụ: IP của Cloudflare Workers nếu sử dụng Workers),
  - Yêu cầu token xác thực trong các yêu cầu API,
  - Sử dụng các quy tắc tường lửa trên hạ tầng backend.

- **Broker**: Không được phơi bày trực tiếp; chỉ có thể truy cập qua proxy backend.

- **Quản trị PayloadCMS**: Hạn chế truy cập:
  - Chạy trên subdomain riêng biệt với truy cập hạn chế,
  - Sử dụng Cloudflare Access hoặc VPN cho giao diện quản trị.

Thiết lập được khuyến nghị:

- Các route công khai: `/`, `/map`, các trang công khai,
- Các route được bảo vệ: `/admin`, `/api` (nếu chỉ dành cho quản trị),
- Các route nội bộ: Các điểm cuối broker không được phơi bày công khai.

---

## Giám sát và nhật ký

Đối với các thành phần được lưu trữ trên Cloudflare:

- **Pages**: Cloudflare cung cấp nhật ký triển khai và phân tích,
- **Workers**: Sử dụng Wrangler để xem nhật ký:

  ```bash
  wrangler tail
  ```

Đối với các thành phần backend:

- Tiếp tục sử dụng cách ghi nhật ký hiện có (CloudWatch, nhật ký VM, v.v.).

Kết hợp:

- Phân tích Cloudflare cho lưu lượng frontend,
- Giám sát backend cho tình trạng API và broker.

---

## Cập nhật dashboard

Để triển khai phiên bản mới:

1. Đẩy các thay đổi tới kho lưu trữ Git (nếu được kết nối với Pages),
2. Cloudflare sẽ tự động xây dựng và triển khai,
3. Hoặc kích hoạt triển khai thủ công trong bảng điều khiển Pages.

Đối với cập nhật Worker:

```bash
wrangler publish
```

Đối với cập nhật backend:

- Làm theo quy trình triển khai hiện có (VM, AWS, Coolify).

---

## Mối quan hệ với các mẫu triển khai khác

Triển khai Cloudflare hoạt động cùng với các mẫu khác:

- Bạn có thể lưu trữ **backend** trên:
  - VM + Docker (như trong tài liệu VM/Docker),
  - AWS ECS/RDS (như trong tài liệu AWS),
  - Coolify, v.v.

Sau đó Cloudflare trở thành:

- Giao diện công khai cho dashboard,
- Và tùy chọn là giao diện công khai cho các yêu cầu API (qua Workers).

Sự tách biệt này cho phép:

- Thay đổi nền tảng backend (ví dụ: từ VM sang AWS) với các thay đổi tối thiểu trong dashboard,
- Giữ brokers và PayloadCMS phía sau các điểm cuối được kiểm soát.

---

## Tóm tắt

- Cloudflare được sử dụng để lưu trữ dashboard LegoCity (qua Pages) và lớp proxy API mỏng (qua Workers).
- Broker, PayloadCMS và máy chủ cập nhật vẫn ở trong hạ tầng backend của bạn (VM / AWS / khác).
- Dashboard gọi `/api/...` trên tên miền của bạn; Workers chuyển tiếp những yêu cầu này tới API backend của bạn, từ đó giao tiếp với broker.
- Bảo mật được xử lý bởi:
  - Giữ broker và DB ngoài internet công khai,
  - Hạn chế các điểm cuối backend và bảo vệ chúng bằng token hoặc quy tắc tường lửa,
  - Chỉ phơi bày Workers + Pages ra công khai.
- Triển khai được chia thành ba bước: triển khai backend, triển khai Worker, và triển khai dashboard.
- Giám sát sử dụng nhật ký Cloudflare cho các thành phần biên và công cụ thông thường của bạn cho các thành phần backend.
