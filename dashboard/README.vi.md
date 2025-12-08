# Lego-Dashboard

<p align="center">
  <em>Nền tảng dashboard low-code hiện đại cho ứng dụng thành phố thông minh NGSI-LD</em>
</p>

<p align="center">
  <a href="https://ctu-sematx.github.io/Lego-Doc/"><img src="https://img.shields.io/badge/docs-Lego--Doc-blue?logo=materialformkdocs&logoColor=fff" alt="Tài liệu"></a>
  <a href="https://scorecard.dev/viewer/?uri=github.com/CTU-SematX/Lego-Dashboard"><img src="https://api.scorecard.dev/projects/github.com/CTU-SematX/Lego-Dashboard/badge" alt="OpenSSF Scorecard"></a>
  <a href="https://github.com/CTU-SematX/Lego-Dashboard/releases"><img src="https://img.shields.io/github/v/release/CTU-SematX/Lego-Dashboard?label=Phiên bản" alt="Phiên bản"></a>
  <a href="https://github.com/CTU-SematX/Lego-Dashboard/graphs/commit-activity"><img src="https://img.shields.io/github/commit-activity/m/CTU-SematX/Lego-Dashboard" alt="Hoạt động Commit"></a>
  <a href="https://github.com/CTU-SematX/Lego-Dashboard/graphs/contributors"><img src="https://img.shields.io/github/contributors/CTU-SematX/Lego-Dashboard" alt="Người đóng góp"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="Giấy phép"></a>
</p>

<p align="center">
  <a href="README.md">🇬🇧 English</a>
</p>

---

Lego-Dashboard là **giải pháp thay thế hiện đại cho WireCloud** (FIWARE), được xây dựng như một nền tảng low-code trên **PayloadCMS** và **Next.js 16**. Nó cung cấp giải pháp dashboard linh hoạt, có thể tùy chỉnh cho các ứng dụng thành phố thông minh tích hợp với **NGSI-LD Context Broker**.

<!-- TODO: Thêm screenshots/demo GIF tại đây
![Xem trước Dashboard](docs/images/dashboard-preview.png)
-->

## ✨ Tính năng chính

### 🔗 Tích hợp NGSI-LD
- **Kết nối Context Broker** — Kết nối với bất kỳ broker tương thích NGSI-LD nào (Orion-LD, Scorpio, Stellio)
- **Hỗ trợ Multi-tenancy** — Headers Fiware-Service và ServicePath để cô lập tenant
- **Smart Data Models** — Import từ kho [FIWARE Smart Data Models](https://smartdatamodels.org/)
- **Quản lý Entity** — Tạo, đồng bộ và quản lý NGSI-LD entities với tự động đồng bộ broker

### 🧩 Các Block Dashboard
- **Block Nội dung** — Rich text, media, banner, code snippets với syntax highlighting
- **Archive & Collections** — Hiển thị và lọc collections
- **Forms** — Xây dựng form kéo thả
- **Call-to-Action** — Các section CTA tùy chỉnh

### 📝 Quản lý Nội dung (PayloadCMS)
- **Admin Panel** — Admin đầy đủ tính năng tại `/admin` với live preview
- **Tối ưu SEO** — Plugin SEO tích hợp với quản lý meta
- **Thư viện Media** — Tối ưu hình ảnh với Sharp
- **Đa ngôn ngữ** — Hỗ trợ tiếng Anh và tiếng Việt

### 🤖 Nội dung AI
- **Tích hợp OpenRouter** — Tạo nội dung với LLaMA, GPT-4o, Claude, Gemini
- **Trợ lý viết AI** — Tích hợp trong admin panel
- **MCP Server** - tích hợp MCP server plugin trực tiếp trong dashboard.

> 📖 Để xem tài liệu chi tiết, truy cập [Lego-Doc](https://ctu-sematx.github.io/Lego-Doc/)

## 🛠️ Công nghệ sử dụng

| Danh mục | Công nghệ |
|----------|-----------|
| **Framework** | Next.js 16, React 19, TypeScript 5.7 |
| **CMS** | PayloadCMS 3.66 |
| **Cơ sở dữ liệu** | MongoDB (cũng hỗ trợ PostgreSQL, SQLite) |
| **Styling** | Tailwind CSS 3.4, Radix UI |
| **NGSI-LD** | Thư viện client tự xây dựng với hỗ trợ API đầy đủ |
| **Testing** | Vitest (unit/integration), Playwright (E2E) |
| **Package Manager** | pnpm 9+ |

## 📦 Cài đặt

### Yêu cầu

- **Node.js** 18.20.2+ hoặc 20.9.0+
- **pnpm** 9+ hoặc 10+
- **MongoDB** database (hoặc PostgreSQL/SQLite)
- **Docker** (tùy chọn, cho triển khai container)

### Bắt đầu nhanh

```bash
# Clone repository
git clone https://github.com/CTU-SematX/Lego-Dashboard.git
cd Lego-Dashboard

# Cài đặt dependencies
pnpm install

# Thiết lập biến môi trường
cp test.env .env
```

Cấu hình file `.env`:

```env
# Bắt buộc
PAYLOAD_SECRET=your-secret-key-here
DATABASE_URI=mongodb://localhost:27017/lego-dashboard

# Tùy chọn
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
PREVIEW_SECRET=your-preview-secret
```

```bash
# Chạy development server
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) — Frontend  
Mở [http://localhost:3000/admin](http://localhost:3000/admin) — Admin Panel

### 🐳 Triển khai Docker

```bash
docker-compose up -d
```

Điều này khởi động:
- **Next.js app** trên port `3000`
- **MongoDB** trên port `27017`

## 🚀 Sử dụng

### Kết nối với NGSI-LD Context Broker

1. Điều hướng đến **Admin Panel** → **Data Connections** → **NGSI Sources**
2. Thêm URL context broker của bạn (ví dụ: `http://orion-ld:1026`)
3. Cấu hình multi-tenancy headers nếu cần
4. Sử dụng **Health Check** để xác minh kết nối

### Quản lý NGSI Entities

1. Vào **NGSI Data Models** để import Smart Data Models
2. Tạo hoặc khám phá entities từ context broker
3. Entities tự động đồng bộ với broker

### Xây dựng trang Dashboard

1. Tạo **Page** mới trong admin panel
2. Thêm các blocks: Content, Media, Archive, Forms, v.v.
3. Sử dụng **Live Preview** để xem thay đổi theo thời gian thực

## 🗺️ Lộ trình phát triển

- [x] **v0.3.0-alpha** — Hoàn thiện flow NGSI-LD trên dashboard
- [ ] **v0.4.0-alpha** — UI render từ NGSI entities *(hiện tại)*
- [ ] **v0.5.0-alpha** — Quyền người dùng & roles (quản lý data, quản lý web design)
- [ ] **v0.6.0-beta** — cải thiện quản lý nguồn broker (Kết nối proxy với authorization, API keys)
- [ ] **v0.7.0-beta** — Tích hợp trang bản đồ (sử dụng mapbox)
- [ ] **v0.8.0-beta** — Các widget bổ sung (VR, charts, gauges)
- [ ] **v0.9.0-rc** — Xử lý lỗi, cải thiện hiệu suất & bảo mật
- [ ] **v1.0.0** — Phiên bản ổn định

## 🐛 Vấn đề đã biết

Xem trang [Issues](https://github.com/CTU-SematX/Lego-Dashboard/issues) để biết các vấn đề đã biết và yêu cầu tính năng.

## 💬 Hỗ trợ

Nếu bạn có câu hỏi, thắc mắc hoặc báo lỗi, vui lòng tạo issue trong [Issue Tracker](https://github.com/CTU-SematX/Lego-Dashboard/issues) của repository.

## 🤝 Đóng góp

Chúng tôi hoan nghênh các đóng góp cho Lego-Dashboard! Các lĩnh vực chúng tôi đang tập trung:

- 🔌 Hỗ trợ NGSI-LD data model và widgets
- 📊 Các visualization dashboard (charts, maps, gauges)
- 🏙️ Các use case và template thành phố thông minh
- 📖 Cải thiện tài liệu

Hướng dẫn chung về _cách_ đóng góp có thể tìm thấy trong [CONTRIBUTING](CONTRIBUTING.md).

## 👨‍💻 Phát triển

```bash
# Development server
pnpm dev

# Linting
pnpm lint

# Chạy tất cả tests
pnpm test

# Chạy integration tests
pnpm test:int

# Chạy E2E tests
pnpm test:e2e

# Production build
pnpm build
```

### Cấu trúc Project

```
src/
├── app/                    # Next.js app router
│   ├── (frontend)/         # Các trang public
│   └── (payload)/          # Admin panel & API
├── blocks/                 # Các component block dashboard
├── collections/            # PayloadCMS collections
│   ├── NgsiDataModels/     # Smart Data Models
│   ├── NgsiDomains/        # Danh mục domain
│   ├── NgsiEntities/       # NGSI-LD entities
│   └── NgsiSources/        # Kết nối context broker
├── components/             # React components
└── lib/
    └── ngsi-ld/            # Thư viện NGSI-LD client
```

Để biết thêm chi tiết, xem phần development trong [CONTRIBUTING](CONTRIBUTING.md).

## 📄 Giấy phép

Dự án này được cấp phép theo **Apache License 2.0** — xem file [LICENSE](LICENSE) để biết chi tiết.

## 👥 Maintainers

**CTU-SematX Team**

## 🙏 Credits và Tham khảo

- [PayloadCMS](https://payloadcms.com/) — Headless CMS cung cấp sức mạnh cho dashboard này
- [Next.js](https://nextjs.org/) — React framework cho production
- [FIWARE](https://www.fiware.org/) — Nền tảng thành phố thông minh và đặc tả NGSI-LD
- [Smart Data Models](https://smartdatamodels.org/) — Kho NGSI-LD data model
- [WireCloud](https://wirecloud.readthedocs.io/) — Giải pháp dashboard gốc mà dự án này cung cấp giải pháp thay thế

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/CTU-SematX">CTU-SematX</a>
</p>
