# Tài liệu LegoCity

Chào mừng bạn đến với **LegoCity** — nền tảng Smart City Builder cho các dashboard đô thị hiện đại, dựa trên bản đồ.

---

## LegoCity là gì?

**LegoCity** là một nền tảng có thể tái sử dụng và cấu hình được để xây dựng các dashboard và ứng dụng thành phố thông minh trên nền tảng tiêu chuẩn **FIWARE / NGSI-LD** và các công nghệ web hiện đại.

**Tính năng chính**

- 🏙️ **Tích hợp FIWARE / NGSI-LD** – quản lý context và entity dựa trên tiêu chuẩn
- 🗺️ **Bản đồ tương tác** – Mapbox GL JS với các lớp và style có thể cấu hình
- 📊 **Dashboard có thể cấu hình** – layouts và blocks được quản lý qua PayloadCMS
- 🔌 **Kiến trúc mở rộng được** – plugins, proxy services và tích hợp tùy chỉnh
- 🤖 **AI helpers tùy chọn** – hỗ trợ nội dung trong Payload admin (OpenAI / Anthropic / OpenRouter)
- 🌍 **Sẵn sàng multi-tenant** – có thể tái sử dụng cho các thành phố và kịch bản khác nhau

---

## Điều hướng nhanh

### 🚀 Mới với LegoCity?

Bắt đầu tại đây nếu bạn lần đầu tiếp xúc với LegoCity.

<div class="grid cards" markdown>

- **🚀 Bắt đầu**

  ***

  Hiểu các khái niệm cốt lõi và chạy LegoCity lần đầu tiên.

  <a class="md-button" href="getting-started/index.md">Bắt đầu tại đây</a>

- **⬇️ Cài đặt**

  ***

  Chọn phương thức cài đặt: local, Docker, hoặc môi trường phát triển.

  <a class="md-button" href="installation/index.md">Cài đặt LegoCity</a>

- **🎓 Hướng dẫn sử dụng**

  ***

  Học cách sử dụng maps, layers, dashboards và entities như một người dùng cuối.

  <a class="md-button" href="user-guide/index.md">Đọc hướng dẫn sử dụng</a>

- **⚙️ Cấu hình**

  ***

  Cấu hình data sources, Mapbox, brokers, APIs và tích hợp AI tùy chọn.

  <a class="md-button" href="configuration/index.md">Cấu hình LegoCity</a>

</div>

### 🛠️ Dành cho developers

Sử dụng các phần này nếu bạn muốn mở rộng hoặc đóng góp cho LegoCity.

<div class="grid cards" markdown>

- **💻 Hướng dẫn phát triển**

  ***

  Thiết lập môi trường dev, tạo blocks và mở rộng nền tảng.

  <a class="md-button" href="development/index.md">Bắt đầu phát triển</a>

- **🤖 Tích hợp AI**

  ***

  Cấu hình Payload AI plugin và các mô hình dựa trên OpenRouter.

  <a class="md-button" href="ai/overview.md">Cấu hình AI</a>

- **☁️ Triển khai**

  ***

  Triển khai LegoCity sử dụng Docker, AWS, VMs, Cloudflare, hoặc Coolify.

  <a class="md-button" href="deployment/index.md">Các tùy chọn triển khai</a>

- **📚 Tài liệu tham khảo**

  ***

  Khắc phục sự cố, chi tiết API và tài liệu kỹ thuật tham khảo.

  <a class="md-button" href="reference/troubleshooting.md">Xem tài liệu tham khảo</a>

</div>

---

## Khởi động nhanh

```bash
# Clone repository
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity/dashboard

# Cài đặt dependencies
pnpm install

# Cấu hình môi trường
cp .env.example .env
# Chỉnh sửa .env với các cài đặt của bạn

# Khởi động development server
pnpm dev
```

**Truy cập tại**: [http://localhost:3000](http://localhost:3000)

👉 Xem [Hướng dẫn Khởi động Nhanh](getting-started/quickstart.md) để biết hướng dẫn chi tiết.

---

## Tổng quan Kiến trúc

LegoCity sử dụng kiến trúc ba lớp:

1. **Lớp Context & Data** - FIWARE/NGSI-LD brokers với dữ liệu thành phố được chuẩn hóa
2. **Lớp Content & UI** - PayloadCMS + Next.js cho dashboards có thể cấu hình
3. **Lớp Integration** - API proxies, AI helpers, các dịch vụ bên ngoài

👉 Xem [Hướng dẫn Kiến trúc](getting-started/architecture.md) để biết sơ đồ và giải thích chi tiết.

---

## Cộng đồng & Hỗ trợ

### Nhận trợ giúp

- 📖 **Tài liệu**: Bạn đang đọc nó!
- 💬 **Thảo luận**: [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/CTU-SematX/LegoCity/issues)
- 📧 **Liên hệ**: CTU-SematX Team

### Đóng góp

Chúng tôi hoan nghênh các đóng góp! Xem:

- [Hướng dẫn Phát triển](development/index.md) - Cách đóng góp
- [CONTRIBUTING.md](https://github.com/CTU-SematX/LegoCity/blob/main/CONTRIBUTING.md) - Hướng dẫn
- [CODE_OF_CONDUCT.md](https://github.com/CTU-SematX/LegoCity/blob/main/CODE_OF_CONDUCT.md) - Tiêu chuẩn cộng đồng

### Tài nguyên

- **Repository**: [github.com/CTU-SematX/LegoCity](https://github.com/CTU-SematX/LegoCity)
- **Demo**: [Sắp ra mắt]
- **License**: Kiểm tra repository để biết chi tiết license

---

## Tiếp theo là gì?

Chọn con đường của bạn:

=== "Tôi là người mới"

    **Bắt đầu tại đây**:

    1. Đọc [Bắt đầu](getting-started/index.md)
    2. Làm theo [Khởi động Nhanh](getting-started/quickstart.md)
    3. Khám phá [Hướng dẫn Sử dụng](user-guide/index.md)

=== "Tôi muốn sử dụng nó"

    **Thiết lập Thành phố của bạn**:

    1. [Cài đặt LegoCity](installation/index.md)
    2. [Cấu hình Data Sources](configuration/data-sources.md)
    3. [Tạo Dashboard Pages](user-guide/index.md)

=== "Tôi muốn xây dựng"

    **Bắt đầu Phát triển**:

    1. [Môi trường Phát triển](installation/development.md)
    2. [Hướng dẫn Phát triển](development/index.md)
    3. [Tạo Custom Blocks](development/blocks.md)

=== "Tôi muốn triển khai"

    **Triển khai lên Production**:

    1. [Tổng quan Triển khai](deployment/index.md)
    2. Chọn phương thức triển khai
    3. [Hướng dẫn Vận hành](deployment/operations.md)

---

**Sẵn sàng bắt đầu?** Đi đến [Hướng dẫn Bắt đầu](getting-started/index.md) →
