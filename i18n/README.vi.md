🌐 [English](../README.md) | Tiếng Việt

![](./docs/assets/project_banner.png)

# LegoCity

[![Documentation](https://img.shields.io/badge/docs-Lego--Doc-blue?logo=materialformkdocs\&logoColor=fff)](https://ctu-sematx.github.io/Lego-Doc/)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/CTU-SematX/LegoCity/badge)](https://scorecard.dev/viewer/?uri=github.com/CTU-SematX/LegoCity)
[![Version](https://img.shields.io/github/v/release/CTU-SematX/LegoCity?label=Version)](https://github.com/CTU-SematX/LegoCity/releases)
[![Commit activity](https://img.shields.io/github/commit-activity/m/CTU-SematX/LegoCity.svg "Commit activity")](https://github.com/CTU-SematX/LegoCity/graphs/commit-activity)
[![GitHub contributors](https://img.shields.io/github/contributors/CTU-SematX/LegoCity.svg "Github contributors")](https://github.com/CTU-SematX/LegoCity/graphs/contributors)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

Mô tả ngắn
**LegoCity** là một mẫu Smart City (Thành phố thông minh) nhẹ được xây dựng để phục vụ thử nghiệm nhanh và giảng dạy trong hệ sinh thái **CTU-SematX**. Dự án cung cấp các thành phần mẫu minh hoạ cách kết nối nguồn dữ liệu, API gateway và dashboard bằng NGSI-LD và các enabler trong FIWARE.

Tài liệu: [https://ctu-sematx.github.io/Lego-Doc/](https://ctu-sematx.github.io/Lego-Doc/)


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

**Khởi động broker (Orion + MongoDB)**

```bash
cd broker
docker compose up -d
```

**Khởi động các server dữ liệu mẫu**

```bash
cd servers
docker compose up -d --build
```

**Chạy dashboard (phát triển local)**

```bash
cd dashboard
pnpm install
pnpm dev
```


## Cách sử dụng

Repository chứa các Data Source server mẫu và một dashboard minh họa tích hợp NGSI-LD cùng các FIWARE enabler.

### Các server mẫu

| Server                | Port | Framework        | Lĩnh vực                          |
| --------------------- | ---- | ---------------- | --------------------------------- |
| `traffic-flow`        | 8001 | FastAPI + Python | Lưu lượng giao thông              |
| `environment-monitor` | 8002 | Gin + Go         | Chất lượng không khí / môi trường |
| `public-lighting`     | 8003 | Elysia + Bun     | Chiếu sáng công cộng              |
| `urban-infra`         | 8004 | Elysia + Bun     | Hạ tầng đô thị                    |

Mỗi server bao gồm:

* REST API cho CRUD
* Endpoint chuyển đổi NGSI-LD
* Health check

### Open Data

Thư mục `opendata/` chứa các dataset JSON mẫu dùng để seed dữ liệu cho các server:

* `traffic.json`
* `environment.json`
* `lighting.json`
* `infrastructure.json`


## Các vấn đề đã biết

* Docker build một số image có thể lỗi trên các bản phân phối dùng musl (Alpine). Hãy dùng image Debian-based cho Go (`golang:1.21-bookworm`) khi build local hoặc trong CI.

Nếu gặp vấn đề khác, vui lòng mở issue kèm bước tái hiện lỗi.


## Hỗ trợ

* Báo lỗi: [https://github.com/CTU-SematX/LegoCity/issues](https://github.com/CTU-SematX/LegoCity/issues)
* Báo cáo bảo mật: xem `SECURITY.md` hoặc dùng GitHub Security Advisories


## Đóng góp

Chào mừng mọi đóng góp. Xem `CONTRIBUTING.md` để biết guideline về style, commit và review.


## Phát triển

Tham khảo README của từng thành phần trong `broker/`, `servers/`, và `dashboard/` để biết hướng dẫn phát triển và chạy local.


## Giấy phép

Dự án phát hành theo giấy phép Apache 2.0 — xem file `LICENSE` để biết chi tiết.


## Người duy trì

* **CTU-SematX Team** — [https://github.com/CTU-SematX](https://github.com/CTU-SematX)


## Ghi công và tài liệu tham khảo

* FIWARE Foundation — Orion Context Broker
* Smart Data Models — NGSI-LD models
* PayloadCMS — dashboard mẫu
* [IEEE Open Source Maintainers Manual](https://opensource.ieee.org/community/manual/)
