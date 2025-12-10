🌐 [English](../README.md) | Tiếng Việt

![](./docs/assets/project_banner.png)

# LegoCity

[![Documentation](https://img.shields.io/badge/docs-Lego--Doc-blue?logo=materialformkdocs\&logoColor=fff)](https://ctu-sematx.github.io/Lego-Doc/)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/CTU-SematX/LegoCity/badge)](https://scorecard.dev/viewer/?uri=github.com/CTU-SematX/LegoCity)
[![Version](https://img.shields.io/github/v/release/CTU-SematX/LegoCity?label=Version)](https://github.com/CTU-SematX/LegoCity/releases)
[![Commit activity](https://img.shields.io/github/commit-activity/m/CTU-SematX/LegoCity.svg "Commit activity")](https://github.com/CTU-SematX/LegoCity/graphs/commit-activity)
[![GitHub contributors](https://img.shields.io/github/contributors/CTU-SematX/LegoCity.svg "Github contributors")](https://github.com/CTU-SematX/LegoCity/graphs/contributors)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Mô tả ngắn
**LegoCity** là một mẫu Smart City (Thành phố thông minh) nhẹ được xây dựng để phục vụ thử nghiệm nhanh và giảng dạy trong hệ sinh thái **CTU-SematX**. Dự án cung cấp các thành phần mẫu minh hoạ cách kết nối nguồn dữ liệu, API gateway và dashboard bằng NGSI-LD và các enabler trong FIWARE.

Tài liệu: https://ctu-sematx.github.io/Lego-Doc/ [![version](https://img.shields.io/github/v/release/CTU-SematX/Lego-Doc?label=Version)](https://github.com/CTU-SematX/Lego-Doc/releases)

Lego-Dashboard: https://github.com/CTU-SematX/Lego-Dashboard [![version](https://img.shields.io/github/v/release/CTU-SematX/Lego-Dashboard?label=Version)](https://github.com/CTU-SematX/Lego-Dashboard/releases)

Orion-Nginx: https://github.com/CTU-SematX/Orion-Nginx [![version](https://img.shields.io/github/v/release/CTU-SematX/Orion-Nginx?label=Version)](https://github.com/CTU-SematX/Orion-Nginx/releases)

## Mục lục

* [Cài đặt và yêu cầu](#cài-đặt-và-yêu-cầu)
* [Hướng dẫn khởi động nhanh](#hướng-dẫn-khởi-động-nhanh)
* [Cách sử dụng](#cách-sử-dụng)
* [Các vấn đề đã biết](#các-vấn-đề-đã-biết)
* [Hỗ trợ](#hỗ-trợ)
* [Đóng góp](#đóng-góp)
* [Phát triển](#phát-triển)
* [Giấy phép](#giấy-phép)
* [Người duy trì](#người-duy-trì)
* [Ghi công và tài liệu tham khảo](#ghi-công-và-tài-liệu-tham-khảo)


## Cài đặt và yêu cầu

Hướng dẫn chi tiết về cách cài đặt, cấu hình và chạy dự án.

**Yêu cầu trước khi cài**

* Docker & Docker Compose
* Node.js 20+ / Bun (dành cho dashboard)
* Git

**Clone repository**

```bash
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity
```

## Hướng dẫn khởi động nhanh

**Khởi động toàn bộ hệ thống (khuyến nghị)**

```bash
# Khởi động tất cả dịch vụ với docker compose thống nhất
docker compose up -d

# Xem logs
docker compose logs -f

# Dừng toàn bộ
docker compose down
```

**Hoặc khởi động từng thành phần riêng lẻ:**

```bash
# Chỉ khởi động broker
cd broker && docker compose up -d

# Chạy dashboard local
cd dashboard && pnpm install && pnpm dev
```


## Cách sử dụng

Repository chứa các Data Source server mẫu và một dashboard minh họa tích hợp NGSI-LD cùng các FIWARE enabler.

### Các server mẫu

| Server | Port | Framework | Mục đích |
| --------------------- | ---- | ---------------- | --------------------------------- |
| `demo-server` | 8004 | Elysia + Bun | Demo tương tác với Swagger UI |
| `weather-server` | 8005 | Elysia + Bun | Dữ liệu thời tiết/AQ tự động cập nhật |

Mỗi server bao gồm:

* REST API cho CRUD
* Tích hợp NGSI-LD với Context Broker
* Swagger UI cho tài liệu API tương tác
* Health check

### Open Data

Thư mục `opendata/` chứa dữ liệu seed cho Context Broker và các dataset địa lý thực tế.

#### Dữ liệu Seed (CSV)
Các file dữ liệu trong `opendata/seed-data/` được tự động nạp vào Context Broker khi khởi động:
- Lưu lượng giao thông, Cảm biến lũ lụt, Vùng ngập lụt
- Sự cố khẩn cấp, Xe cấp cứu
- Cơ sở y tế, Trạm thời tiết, Trạm quan trắc chất lượng không khí

Xem chi tiết tại [opendata/README.md](./opendata/README.md) và README của từng thư mục.


## Các vấn đề đã biết

- Orion-LD sử dụng MongoDB v5.x.x đã hết hạn hỗ trợ (end of life).

Nếu gặp vấn đề khác, vui lòng mở issue kèm bước tái hiện lỗi.


## Hỗ trợ

* Báo lỗi: [https://github.com/CTU-SematX/LegoCity/issues](https://github.com/CTU-SematX/LegoCity/issues)
* Báo cáo bảo mật: xem `SECURITY.md` hoặc dùng GitHub Security Advisories


## Đóng góp

Chào mừng mọi đóng góp. Xem `CONTRIBUTING.md` để biết guideline về style, commit và review.


## Phát triển

Tham khảo README của từng thành phần trong `broker/`, `servers/`, và `dashboard/` để biết hướng dẫn phát triển và chạy local.


## Giấy phép

Dự án này sử dụng nhiều giấy phép tùy thuộc vào nội dung:

- **Mã nguồn**: Giấy phép MIT — xem file [LICENSE](./LICENSE)
- **Open Data**: CC-BY-4.0 (Creative Commons Attribution 4.0 International) — xem [LICENSES/CC-BY-4.0.txt](./LICENSES/CC-BY-4.0.txt)
- **Tài liệu**: Nội dung có thể tuân theo các điều khoản khác

Vui lòng tham khảo các file và thư mục riêng lẻ để biết thông tin giấy phép cụ thể.


## Người duy trì

* **CTU-SematX Team** — [https://github.com/CTU-SematX](https://github.com/CTU-SematX)


## Ghi công và tài liệu tham khảo

* **FIWARE Foundation** — Orion Context Broker
* **Smart Data Models** — Mô hình dữ liệu NGSI-LD
* **PayloadCMS** — Framework dashboard mẫu
* **Nguồn Open Data** — Các cổng dữ liệu mở của chính phủ Việt Nam và nhiều nguồn công khai khác
* [IEEE Open Source Maintainers Manual](https://opensource.ieee.org/community/manual/)

### Ghi nhận nguồn dữ liệu

Khi sử dụng các dataset này, vui lòng ghi nhận nguồn phù hợp theo [giấy phép CC-BY-4.0](./LICENSES/CC-BY-4.0.txt).
