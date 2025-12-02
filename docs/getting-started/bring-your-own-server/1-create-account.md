# Step 1: Create Your Account

The first step in using SematX is creating an account on your organization's SematX instance.

⏱️ **Time**: 5 minutes  
🎯 **Goal**: Get access to the SematX dashboard and generate API credentials

## Before You Begin

### Get Your SematX Server URL

You'll need the URL of your organization's SematX server. This typically looks like:

- `https://sematx.example.com`
- `https://dashboard.your-company.com`
- `https://smart-city.example.org`

**Don't have a server?** You can:

- Ask your system administrator for the URL
- [Deploy your own instance](../../deployment/index.md)
- [Start a local server](../start-server/index.md) for development

### Check Access Requirements

Some SematX instances require:

- **Invitation**: Administrator must create your account
- **Domain restriction**: Email must match organization domain
- **VPN**: May require VPN access for private networks

Contact your administrator if you're unsure about access requirements.

## Create Your Account

### Navigate to the Dashboard

1. Open your web browser
2. Go to your SematX instance URL
3. Add `/admin` to access the dashboard:
   ```
   https://your-sematx-server.com/admin
   ```

### Sign Up (Self-Registration)

If self-registration is enabled, you'll see a **Create First User** or **Sign Up** form:

1. **Email**: Enter your email address

   ```
   user@example.com
   ```

2. **Password**: Create a strong password

   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Example: `Sm@rtC1ty2025!`

3. **Confirm Password**: Re-enter your password

4. **Name** (optional): Your full name

   ```
   John Doe
   ```

5. Click **Create Account** or **Sign Up**

### Administrator-Created Account

If your account was created by an administrator:

1. Check your email for invitation
2. Click the activation link
3. Set your password
4. Log in with your credentials

## Log In

After creating your account, log in to the dashboard:

1. Navigate to the login page:

   ```
   https://your-sematx-server.com/admin/login
   ```

2. Enter your credentials:

   - **Email**: Your registered email
   - **Password**: Your account password

3. Click **Log In**

You should now see the SematX dashboard!

### Key Sections

- **Dashboard**: View your data visualizations
- **Maps**: Geospatial data visualization
- **Entities**: Browse and manage NGSI-LD entities
- **API Keys**: Generate tokens for API access
- **Cards**: Create and configure dashboard cards
- **Subscriptions**: Set up real-time notifications
- **Users**: Manage team members (admin only)
- **Settings**: Configure your preferences

## Generate Your First API Key

To interact with the SematX API from your application, you'll need an API key (JWT token).

### Navigate to API Keys

1. Click **API Keys** in the left sidebar
2. Click **Create New** button

### Configure API Key

Fill in the API key details:

1. **Name**: Give your API key a descriptive name

   ```
   My Application - Production
   ```

   **Tip**: Use meaningful names to identify keys later:

   - `IoT Sensors - Building A`
   - `Mobile App - iOS`
   - `Data Pipeline - Staging`

2. **Description** (optional): Add notes about usage

   ```
   API key for production IoT sensor data collection
   ```

3. **Expires**: Set an expiration date

   - **Recommended**: 90 days for production
   - **Short-term**: 7-30 days for testing
   - **No expiration**: Only for development (not recommended for production)

4. **Permissions**: Select access level

   - **Read Only**: Can only query data
   - **Read/Write**: Can create and update entities
   - **Full Access**: Can manage all resources

   **For this tutorial**: Select **Read/Write** or **Full Access**

5. **Rate Limit** (if available): Set request limits

   - Default: 100 requests per minute
   - High volume: 1000 requests per minute
   - Low volume: 10 requests per minute

6. Click **Create**

### Save Your API Key

**Important**: You'll only see the API key once!

1. **Copy the entire token**:

   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTg3ZjJhMTIzNDU2Nzg5IiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicGVybWlzc2lvbnMiOlsicmVhZDplbnRpdGllcyIsIndyaXRlOmVudGl0aWVzIl0sImlhdCI6MTcwNDE1MzYwMCwiZXhwIjoxNzEyMDE1NjAwfQ.xGZHY8PK2yWQJ3uT6E9hxK4rN7mV8lB0nQ5sA1wF2cD
   ```

2. **Store it securely**:

   - **For development**: Save in `.env` file (never commit to git!)
   - **For production**: Store in secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
   - **Never**: Share via email, Slack, or public channels

3. **Click Done**

## Test Your Connection

Let's verify you can connect to the SematX API using your new API key.

### Using curl

Open a terminal and run:

```bash
curl -X GET "https://your-sematx-server.com/ngsi-ld/v1/entities?limit=1" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Accept: application/ld+json"
```

**Replace**:

- `your-sematx-server.com` with your actual server URL
- `YOUR_API_KEY_HERE` with your API key

**Expected Response**:

```json
[]
```

Or if entities exist:

```json
[
  {
    "id": "urn:ngsi-ld:Sensor:001",
    "type": "Sensor",
    ...
  }
]
```

### Using JavaScript

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

### Using Python

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

## Troubleshooting

### 401 Unauthorized

**Problem**: API returns 401 status code

**Solutions**:

1. **Check API key**: Ensure you copied it completely
2. **Check expiration**: Key may have expired
3. **Check format**: Header should be `Authorization: Bearer <token>`
4. **Regenerate**: Create a new API key if needed

### 403 Forbidden

**Problem**: API returns 403 status code

**Solutions**:

1. **Check permissions**: API key may lack required permissions
2. **Check account**: Your account may be disabled
3. **Contact admin**: May need elevated permissions

### Network Error / Timeout

**Problem**: Cannot reach server

**Solutions**:

1. **Check URL**: Verify server address is correct
2. **Check network**: Ensure you're connected to internet
3. **Check VPN**: May need VPN for private networks
4. **Check firewall**: Firewall may block connection
5. **Check DNS**: Try IP address instead of domain name

### SSL/TLS Error

**Problem**: Certificate verification failed

**Solutions**:

1. **Self-signed cert**: Your admin may use self-signed certificates
2. **Development only**: Disable SSL verification (not for production!)
   ```bash
   curl -k https://your-sematx-server.com/...
   ```
3. **Production**: Install proper SSL certificate

### Cannot Access Dashboard

**Problem**: Dashboard page doesn't load

**Solutions**:

1. **Check URL**: Should include `/admin` path
2. **Check browser**: Try different browser or incognito mode
3. **Clear cache**: Clear browser cache and cookies
4. **Check server**: Server may be down - contact admin

## Security Best Practices

### API Key Management

✅ **Do**:

- Use environment variables for API keys
- Rotate keys regularly (every 90 days)
- Use different keys for different environments
- Revoke keys when no longer needed
- Set expiration dates on all keys
- Use least-privilege permissions

❌ **Don't**:

- Commit API keys to version control
- Share keys via email or chat
- Use production keys in development
- Give full access when read-only is sufficient
- Create keys without expiration dates
- Reuse keys across multiple projects

### Password Security

✅ **Do**:

- Use strong, unique passwords
- Enable 2FA if available
- Use a password manager
- Change password if compromised

❌ **Don't**:

- Reuse passwords across services
- Share your account credentials
- Use simple or common passwords
- Write passwords in plain text

## What You Learned

✅ How to access the SematX dashboard  
✅ How to create a user account  
✅ How to generate API keys  
✅ How to test API connectivity  
✅ Security best practices for API keys

## Next Step

Now that you have your account and API key, let's create a service for your application:

[**Step 2: Create a Service →**](2-create-service.md)

---

**Need to go back?** Return to the [tutorial overview](index.md)
