# Bắt đầu với LegoCity

Chào mừng bạn đến với LegoCity! Hướng dẫn này sẽ giúp bạn bắt đầu nhanh chóng.

## LegoCity là gì?

LegoCity là một Smart City Builder cung cấp một nền tảng có thể tái sử dụng để xây dựng các dashboard và applications thành phố trên **FIWARE / NGSI-LD** và các công nghệ web hiện đại.

### Tính năng Chính

- 🏙️ **Smart City Ready** - Xây dựng trên các chuẩn FIWARE/NGSI-LD
- 🗺️ **Interactive Maps** - Được hỗ trợ bởi Mapbox GL JS
- 📊 **Flexible Dashboard** - Configure với PayloadCMS
- 🔌 **Extensible** - Kiến trúc plugin cho các tính năng tùy chỉnh
- 🤖 **AI-Powered** - Hỗ trợ AI tùy chọn cho việc tạo content
- 🌍 **Multi-tenant** - Có thể tái sử dụng trên các thành phố khác nhau

### Core Components

![LegoCity Architecture](../assets/diagram_EN.png)

_Kiến trúc 3 lớp của LegoCity: Data Sources, Smart City Context Broker, và Dashboard Management_

## Quick Start

### Prerequisites

Trước khi bắt đầu, đảm bảo bạn có:

- **Node.js** 18.x hoặc mới hơn
- **pnpm** 8.x hoặc mới hơn (package manager)
- **MongoDB** 6.x hoặc mới hơn
- **Git** cho version control

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/CTU-SematX/LegoCity.git
   cd LegoCity/dashboard
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` và set:

   ```env
   DATABASE_URI=mongodb://127.0.0.1/legocity
   PAYLOAD_SECRET=your-secret-key-here
   NEXT_PUBLIC_SERVER_URL=http://localhost:3000
   ```

4. **Start development server**

   ```bash
   pnpm dev
   ```

5. **Access the dashboard**
   - Dashboard: [http://localhost:3000](http://localhost:3000)
   - Admin Panel: [http://localhost:3000/admin](http://localhost:3000/admin)

## Next Steps

Sau khi hoàn thành quick start:

1. **[Complete Installation Guide](../installation/local.md)** - Hướng dẫn setup chi tiết
2. **[User Guide](../user-guide/index.md)** - Học cách sử dụng LegoCity
3. **[Configuration](../configuration/index.md)** - Configure data sources và APIs
4. **[Development Guide](../development/index.md)** - Bắt đầu xây dựng các tính năng tùy chỉnh

## Architecture Overview

LegoCity được xây dựng trên ba lớp chính:

### 1. Context & Data Layer (FIWARE)

- NGSI-LD context brokers
- Smart Data Models
- Real-time sensor data

### 2. UI Layer (Next.js + PayloadCMS)

- Interactive map views (Mapbox)
- Dynamic dashboard configuration
- Content management

### 3. Integration Layer

- API proxies và security
- AI assistants (optional)
- External services

## Community & Support

- 📖 **Documentation**: [https://ctu-sematx.github.io/LegoCity](https://ctu-sematx.github.io/LegoCity)
- 🐛 **Issues**: [GitHub Issues](https://github.com/CTU-SematX/LegoCity/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)
- 📧 **Contact**: [CTU-SematX Team](https://github.com/CTU-SematX)

## Design Principles

### Context-Centric Design

Thông tin thành phố được model như các NGSI-LD entities trong context brokers - nguồn sự thật duy nhất.

### Configuration-Driven UI

Dashboards được xây dựng từ các configurable blocks trong PayloadCMS, không phải hard-coded.

### Reusability

Cùng một codebase hoạt động trên nhiều thành phố bằng cách thay đổi configuration, không phải code.

### AI as Optional

LegoCity hoạt động hoàn toàn không cần AI. AI integration là một tính năng phụ cho việc authoring content.

---

**Sẵn sàng tìm hiểu sâu hơn?** Tiếp tục đến [Installation Guide](../installation/local.md) cho hướng dẫn setup chi tiết.
