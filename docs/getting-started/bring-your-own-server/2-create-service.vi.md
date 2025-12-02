# Bước 2: Tạo Service

Trong SematX, một **service** đại diện cho nhóm logic các entity từ ứng dụng của bạn. Điều này giúp tổ chức dữ liệu và quản lý kiểm soát truy cập.

⏱️ **Thời gian**: 5-10 phút  
🎯 **Mục tiêu**: Thiết lập cấu hình service cho ứng dụng của bạn

## Service Là Gì?

Service trong SematX là một namespace cho các entity của bạn. Nghĩ về nó như:

- **Dự án IoT**: "Smart Building Sensors"
- **Phòng ban**: "Environmental Monitoring Team"
- **Ứng dụng**: "Mobile App Backend"
- **Địa điểm**: "Downtown Campus"

Service giúp bạn:

- Tổ chức entity theo project hoặc ứng dụng
- Áp dụng chính sách kiểm soát truy cập
- Lọc dữ liệu trong truy vấn
- Quản lý vòng đời entity

## Hiểu về NGSI-LD Multi-Tenancy

SematX sử dụng header **NGSI-LD-Tenant** cho multi-tenancy:

```http
GET /ngsi-ld/v1/entities
Authorization: Bearer <api-key>
NGSILD-Tenant: my-service
```

Tất cả entity được tạo với tenant header cụ thể sẽ được tách biệt vào tenant đó.

## Tạo Service

### Lựa Chọn 1: Implicit Service (Khuyến nghị cho người mới)

Cách đơn giản nhất là **không dùng tenant header**. Tất cả entity sẽ được tạo trong tenant mặc định.

**Ưu điểm**:

- Không cần cấu hình
- Đơn giản để bắt đầu
- Tốt cho triển khai ứng dụng đơn

**Nhược điểm**:

- Tất cả entity dùng chung namespace
- Khó tổ chức dữ liệu multi-project

### Lựa Chọn 2: Explicit Service

Để tổ chức tốt hơn, tạo service có tên cho ứng dụng của bạn.

**Chọn Tên Service**:

```
my-iot-project
smart-building-a
environmental-sensors
mobile-app-backend
```

**Quy tắc**:

- Chỉ chữ thường, số, dấu gạch ngang
- Không có khoảng trắng hoặc ký tự đặc biệt
- Tối đa 64 ký tự
- Mô tả và độc nhất

**Lưu tên service**:

```bash
# Trong file .env
SEMATX_SERVICE=my-iot-project
```

## Cấu Hình Ứng Dụng

### Biến Môi Trường

Thiết lập cấu hình ứng dụng:

```bash
# .env file
SEMATX_URL=https://your-sematx-server.com
SEMATX_API_KEY=eyJhbGciOiJIUzI1NiIsInR...
SEMATX_SERVICE=my-iot-project
```

### Cấu Hình JavaScript/TypeScript

```javascript
// config.js
export const sematxConfig = {
  url: process.env.SEMATX_URL || "https://your-sematx-server.com",
  apiKey: process.env.SEMATX_API_KEY,
  service: process.env.SEMATX_SERVICE || "default",
  headers: {
    Authorization: `Bearer ${process.env.SEMATX_API_KEY}`,
    "Content-Type": "application/ld+json",
    Accept: "application/ld+json",
    "NGSILD-Tenant": process.env.SEMATX_SERVICE || "default",
  },
};
```

### Cấu Hình Python

```python
# config.py
import os
from dataclasses import dataclass

@dataclass
class SematXConfig:
    url: str = os.getenv('SEMATX_URL', 'https://your-sematx-server.com')
    api_key: str = os.getenv('SEMATX_API_KEY')
    service: str = os.getenv('SEMATX_SERVICE', 'default')

    @property
    def headers(self):
        return {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/ld+json',
            'Accept': 'application/ld+json',
            'NGSILD-Tenant': self.service
        }

config = SematXConfig()
```

## Tạo Helper Function

Tạo function có thể tái sử dụng để thực hiện API request:

### JavaScript/TypeScript

```javascript
// sematx-client.js
import { sematxConfig } from "./config.js";

class SematXClient {
  constructor(config) {
    this.baseUrl = config.url;
    this.headers = config.headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    return response.json();
  }

  // Entity operations
  async getEntities(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/ngsi-ld/v1/entities?${query}`);
  }

  async getEntity(id) {
    return this.request(`/ngsi-ld/v1/entities/${encodeURIComponent(id)}`);
  }

  async createEntity(entity) {
    return this.request("/ngsi-ld/v1/entities", {
      method: "POST",
      body: JSON.stringify(entity),
    });
  }

  async updateEntity(id, attributes) {
    return this.request(
      `/ngsi-ld/v1/entities/${encodeURIComponent(id)}/attrs`,
      {
        method: "PATCH",
        body: JSON.stringify(attributes),
      }
    );
  }

  async deleteEntity(id) {
    return this.request(`/ngsi-ld/v1/entities/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }
}

export const client = new SematXClient(sematxConfig);
```

### Python

```python
# sematx_client.py
import requests
from typing import Dict, List, Optional
from urllib.parse import urlencode
from config import config

class SematXClient:
    def __init__(self, config):
        self.base_url = config.url
        self.headers = config.headers

    def request(self, endpoint: str, method: str = 'GET', json: Optional[Dict] = None):
        url = f'{self.base_url}{endpoint}'
        response = requests.request(
            method=method,
            url=url,
            headers=self.headers,
            json=json
        )
        response.raise_for_status()
        return response.json() if response.content else None

    # Entity operations
    def get_entities(self, params: Dict = None) -> List[Dict]:
        query = f'?{urlencode(params)}' if params else ''
        return self.request(f'/ngsi-ld/v1/entities{query}')

    def get_entity(self, entity_id: str) -> Dict:
        return self.request(f'/ngsi-ld/v1/entities/{entity_id}')

    def create_entity(self, entity: Dict) -> None:
        return self.request('/ngsi-ld/v1/entities', method='POST', json=entity)

    def update_entity(self, entity_id: str, attributes: Dict) -> None:
        return self.request(
            f'/ngsi-ld/v1/entities/{entity_id}/attrs',
            method='PATCH',
            json=attributes
        )

    def delete_entity(self, entity_id: str) -> None:
        return self.request(f'/ngsi-ld/v1/entities/{entity_id}', method='DELETE')

client = SematXClient(config)
```

## Kiểm Tra Cấu Hình Service

Hãy xác minh cấu hình service hoạt động:

### Test 1: Truy vấn Service Rỗng

```bash
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/entities" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project" \
  -H "Accept: application/ld+json"
```

**Kết quả mong đợi**: Mảng rỗng `[]` (chưa có entity)

### Test 2: Dùng Helper Function

#### JavaScript

```javascript
import { client } from "./sematx-client.js";

async function testService() {
  try {
    const entities = await client.getEntities({ limit: 10 });
    console.log("✅ Service configured successfully!");
    console.log(`Found ${entities.length} entities`);
  } catch (error) {
    console.error("❌ Service configuration failed:", error.message);
  }
}

testService();
```

#### Python

```python
from sematx_client import client

def test_service():
    try:
        entities = client.get_entities({'limit': 10})
        print('✅ Service configured successfully!')
        print(f'Found {len(entities)} entities')
    except Exception as error:
        print(f'❌ Service configuration failed: {error}')

test_service()
```

## Các Mẫu Tổ Chức Service

### Mẫu 1: Single Service (Đơn Giản)

```
Service: my-app
  ├── Sensor:001
  ├── Sensor:002
  ├── Building:001
  └── Vehicle:001
```

**Dùng khi**:

- Ứng dụng đơn
- Số lượng entity nhỏ
- Không cần multi-tenancy

### Mẫu 2: Service Theo Môi Trường

```
Service: my-app-dev
  └── Test entities

Service: my-app-staging
  └── Staging entities

Service: my-app-prod
  └── Production entities
```

**Dùng khi**:

- Cần môi trường tách biệt
- Testing trước production
- Kiểm soát truy cập khác nhau mỗi môi trường

### Mẫu 3: Service Theo Địa Điểm

```
Service: building-a
  └── Building A entities

Service: building-b
  └── Building B entities

Service: downtown-campus
  └── Campus entities
```

**Dùng khi**:

- Phân tách theo địa lý
- Kiểm soát truy cập theo vị trí
- Triển khai theo khu vực

### Mẫu 4: Service Theo Team/Phòng Ban

```
Service: facilities-team
  └── Facilities entities

Service: security-team
  └── Security entities

Service: iot-team
  └── IoT sensors
```

**Dùng khi**:

- Nhiều team dùng chung hạ tầng
- Kiểm soát truy cập theo phòng ban
- Ranh giới tổ chức

## Thực Hành Tốt Nhất

### Quy Ước Đặt Tên

✅ **Tên Tốt**:

```
smart-building-sensors
environmental-monitoring
mobile-app-backend
iot-dev-environment
```

❌ **Tên Không Tốt**:

```
test
myService
Service1
abc123
```

### Vòng Đời Service

1. **Create**: Thiết lập service khi project bắt đầu
2. **Use**: Tất cả entity dùng cùng tên service nhất quán
3. **Monitor**: Theo dõi số lượng entity và API usage
4. **Archive**: Export dữ liệu trước khi xóa service
5. **Delete**: Xóa service khi project kết thúc

### Cân Nhắc Bảo Mật

- **Access Control**: Service có thể có chính sách truy cập khác nhau
- **API Keys**: Tạo key riêng cho mỗi service
- **Isolation**: Service được tách biệt về logic
- **Audit**: Tên service xuất hiện trong log để theo dõi

## Xử Lý Sự Cố

### Entities Not Found

**Vấn đề**: Không thấy entity đã tạo trước đó

**Giải pháp**: Kiểm tra bạn đang dùng cùng `NGSILD-Tenant` header:

```bash
# Liệt kê tất cả tenant (chỉ admin)
curl -X GET "https://your-sematx-server.com/admin/tenants" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Invalid Service Name

**Vấn đề**: API từ chối tên service

**Giải pháp**: Chỉ dùng chữ thường, số, và dấu gạch ngang:

```
Hợp lệ:   my-service-123
Không hợp lệ: My Service!, my_service, MyService
```

### Permission Denied

**Vấn đề**: 403 Forbidden khi truy cập service

**Giải pháp**: API key có thể không có quyền truy cập service này. Liên hệ admin hoặc dùng key đúng.

## Những Gì Bạn Đã Học

✅ Service là gì và tại sao chúng hữu ích  
✅ Cách chọn tên service  
✅ Cách cấu hình service trong ứng dụng  
✅ Cách tạo helper function cho API call  
✅ Các mẫu tổ chức service  
✅ Thực hành bảo mật tốt nhất cho service

## Bước Tiếp Theo

Bây giờ service đã được cấu hình, hãy tạo entity đầu tiên:

[**Bước 3: Tạo Entity Đầu Tiên →**](3-create-entity.vi.md)

---

**Cần quay lại?** Về [Bước 1: Tạo Tài Khoản](1-create-account.vi.md)
