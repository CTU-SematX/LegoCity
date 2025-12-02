# Step 2: Create a Service

In SematX, a **service** represents a logical grouping of entities from your application. This helps organize your data and manage access control.

⏱️ **Time**: 5-10 minutes  
🎯 **Goal**: Set up a service configuration for your application

## What is a Service?

A service in SematX is a namespace for your entities. Think of it as:

- **IoT Project**: "Smart Building Sensors"
- **Department**: "Environmental Monitoring Team"
- **Application**: "Mobile App Backend"
- **Location**: "Downtown Campus"

Services help you:

- Organize entities by project or application
- Apply access control policies
- Filter data in queries
- Manage entity lifecycles

## Understanding NGSI-LD Multi-Tenancy

SematX uses the **NGSI-LD-Tenant** header for multi-tenancy:

```http
GET /ngsi-ld/v1/entities
Authorization: Bearer <api-key>
NGSILD-Tenant: my-service
```

All entities created with a specific tenant header are isolated to that tenant.

## Create Your Service

### Option 1: Implicit Service (Recommended for Beginners)

The simplest approach is to **not use a tenant header** at all. All your entities will be created in the default tenant.

**Pros**:

- No configuration needed
- Simple to get started
- Good for single-application deployments

**Cons**:

- All entities share the same namespace
- Harder to organize multi-project data

### Option 2: Explicit Service

For better organization, create a named service for your application.

**Choose a Service Name**:

```
my-iot-project
smart-building-a
environmental-sensors
mobile-app-backend
```

**Rules**:

- Lowercase letters, numbers, hyphens only
- No spaces or special characters
- Max 64 characters
- Descriptive and unique

**Store your service name**:

```bash
# In your .env file
SEMATX_SERVICE=my-iot-project
```

## Configure Your Application

### Environment Variables

Set up your application configuration:

```bash
# .env file
SEMATX_URL=https://your-sematx-server.com
SEMATX_API_KEY=eyJhbGciOiJIUzI1NiIsInR...
SEMATX_SERVICE=my-iot-project
```

### JavaScript/TypeScript Configuration

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

### Python Configuration

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

## Create a Helper Function

Create a reusable function for making API requests:

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

## Test Your Service Configuration

Let's verify your service configuration works:

### Test 1: Query Empty Service

```bash
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/entities" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "NGSILD-Tenant: my-iot-project" \
  -H "Accept: application/ld+json"
```

**Expected**: Empty array `[]` (no entities yet)

### Test 2: Use Helper Function

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

## Service Organization Patterns

### Pattern 1: Single Service (Simple)

```
Service: my-app
  ├── Sensor:001
  ├── Sensor:002
  ├── Building:001
  └── Vehicle:001
```

**Use when**:

- Single application
- Small number of entities
- No multi-tenancy needed

### Pattern 2: Service Per Environment

```
Service: my-app-dev
  └── Test entities

Service: my-app-staging
  └── Staging entities

Service: my-app-prod
  └── Production entities
```

**Use when**:

- Need isolated environments
- Testing before production
- Different access control per environment

### Pattern 3: Service Per Location

```
Service: building-a
  └── Building A entities

Service: building-b
  └── Building B entities

Service: downtown-campus
  └── Campus entities
```

**Use when**:

- Geographic separation
- Location-based access control
- Regional deployments

### Pattern 4: Service Per Team/Department

```
Service: facilities-team
  └── Facilities entities

Service: security-team
  └── Security entities

Service: iot-team
  └── IoT sensors
```

**Use when**:

- Multiple teams sharing infrastructure
- Department-level access control
- Organizational boundaries

## Best Practices

### Naming Conventions

✅ **Good Names**:

```
smart-building-sensors
environmental-monitoring
mobile-app-backend
iot-dev-environment
```

❌ **Bad Names**:

```
test
myService
Service1
abc123
```

### Service Lifecycle

1. **Create**: Set up service when project starts
2. **Use**: All entities use same service name consistently
3. **Monitor**: Track entity count and API usage
4. **Archive**: Export data before deleting service
5. **Delete**: Remove service when project ends

### Security Considerations

- **Access Control**: Services can have different access policies
- **API Keys**: Create separate keys per service
- **Isolation**: Services are logically isolated
- **Audit**: Service name appears in logs for tracking

## Troubleshooting

### Entities Not Found

**Problem**: Can't see entities you created earlier

**Solution**: Check that you're using the same `NGSILD-Tenant` header:

```bash
# List all tenants (admin only)
curl -X GET "https://your-sematx-server.com/admin/tenants" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Invalid Service Name

**Problem**: API rejects service name

**Solution**: Use only lowercase letters, numbers, and hyphens:

```
Valid:   my-service-123
Invalid: My Service!, my_service, MyService
```

### Permission Denied

**Problem**: 403 Forbidden when accessing service

**Solution**: Your API key may not have access to this service. Contact admin or use correct key.

## What You Learned

✅ What services are and why they're useful  
✅ How to choose a service name  
✅ How to configure service in your application  
✅ How to create helper functions for API calls  
✅ Service organization patterns  
✅ Security best practices for services

## Next Step

Now that your service is configured, let's create your first entity:

[**Step 3: Create Your First Entity →**](3-create-entity.md)

---

**Need to go back?** Return to [Step 1: Create Your Account](1-create-account.md)
