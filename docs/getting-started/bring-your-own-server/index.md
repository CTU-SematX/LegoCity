# Bring Your Own Server

This tutorial guides you through connecting your application to an existing SematX instance. You'll learn how to authenticate, create entities, push data, and build visualizations on a remote SematX server.

⏱️ **Estimated Time**: 30-45 minutes  
💻 **Requirements**: SematX instance URL, API credentials  
🎯 **Goal**: Integrate your app with a production SematX server

## What You'll Learn

By the end of this tutorial, you'll be able to:

- Create a SematX account and obtain API credentials
- Set up a service configuration for your application
- Create and manage NGSI-LD entities
- Push real-time data from your application
- Build dashboard cards to visualize your data
- Configure subscriptions for real-time notifications

## Tutorial Overview

This tutorial is divided into 6 steps:

1. **[Create Your Account](1-create-account.md)** - Sign up and get access credentials
2. **[Create a Service](2-create-service.md)** - Set up a service for your application
3. **[Create Your First Entity](3-create-entity.md)** - Define data structures
4. **[Push Data](4-push-data.md)** - Send data from your application
5. **[Create Dashboard Cards](5-create-card.md)** - Visualize your data
6. **[Set Up Subscriptions](6-subscriptions.md)** - Receive real-time notifications

## Prerequisites

### Required

- **SematX Instance URL**: The base URL of your SematX server
  - Example: `https://sematx.example.com`
- **Access Credentials**: Email and password for your SematX account
  - If you don't have an account, you'll need an invitation from your administrator

### Recommended

- **HTTP Client**: For testing API calls
  - [curl](https://curl.se/) (command line)
  - [Postman](https://www.postman.com/) (GUI)
  - [HTTPie](https://httpie.io/) (command line, user-friendly)
- **Code Editor**: For writing integration code
  - [VS Code](https://code.visualstudio.com/)
- **Programming Language**: Any language with HTTP support
  - JavaScript/TypeScript (Node.js, browser)
  - Python
  - Java
  - Go
  - Rust
  - PHP

## Architecture

When using a remote SematX server, your application communicates with the platform via HTTPS:

![SematX Architecture](../../assets/architecture-diagram-en.png)

**Key Points**:

- All communication is over HTTPS (secure)
- JWT tokens authenticate your requests
- You can use any programming language
- The server handles data storage and processing

## Use Cases

### IoT Data Collection

Send sensor readings from devices to SematX:

- Environmental sensors (temperature, humidity, air quality)
- Industrial equipment monitoring
- Smart building systems
- Vehicle tracking

### Web Application Integration

Connect your web application to SematX data:

- Display real-time sensor data
- Create custom analytics dashboards
- Build location-based services
- Integrate with existing systems

### Mobile App Backend

Use SematX as your mobile app backend:

- Store user-generated data
- Sync data across devices
- Push notifications for events
- Location-based queries

### Data Pipeline Integration

Incorporate SematX into your data pipeline:

- Ingest data from multiple sources
- Transform and normalize data
- Trigger webhooks for downstream processing
- Export data for analytics

## Authentication Flow

Understanding how authentication works will help you integrate successfully:

```
1. User logs in to Dashboard
   ↓
2. Dashboard generates JWT token (API Key)
   ↓
3. User copies API Key
   ↓
4. Application includes API Key in requests
   ↓
5. Nginx validates JWT token
   ↓
6. Request forwarded to Orion-LD or Dashboard API
   ↓
7. Response returned to application
```

**JWT Token Structure**:

```
{
  "userId": "user_123",
  "email": "user@example.com",
  "permissions": ["read:entities", "write:entities"],
  "exp": 1735689600,
  "iat": 1704153600
}
```

## API Endpoints

You'll use these main API endpoints:

### NGSI-LD API (Orion-LD)

**Base URL**: `https://your-sematx-server.com/ngsi-ld/v1`

| Endpoint               | Method | Purpose                  |
| ---------------------- | ------ | ------------------------ |
| `/entities`            | POST   | Create entity            |
| `/entities`            | GET    | Query entities           |
| `/entities/{id}`       | GET    | Get entity by ID         |
| `/entities/{id}/attrs` | PATCH  | Update entity attributes |
| `/entities/{id}`       | DELETE | Delete entity            |
| `/subscriptions`       | POST   | Create subscription      |
| `/subscriptions`       | GET    | List subscriptions       |

### Dashboard API

**Base URL**: `https://your-sematx-server.com/api`

| Endpoint       | Method | Purpose               |
| -------------- | ------ | --------------------- |
| `/api-keys`    | POST   | Create API key        |
| `/api-keys`    | GET    | List API keys         |
| `/cards`       | POST   | Create dashboard card |
| `/cards`       | GET    | List cards            |
| `/users/login` | POST   | User login            |

## Rate Limits

Most SematX instances enforce rate limits:

- **Default**: 100 requests per minute per API key
- **Burst**: 20 requests per second for short bursts
- **Headers**: Rate limit info in response headers
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1704153660
  ```

**Tips for Rate Limiting**:

- Cache frequently accessed data
- Use subscriptions instead of polling
- Batch updates when possible
- Implement exponential backoff for retries

## Code Examples

We provide code examples in multiple languages throughout the tutorial:

- **JavaScript/TypeScript**: Node.js and browser examples
- **Python**: Using `requests` library
- **curl**: Command-line examples
- **Postman**: Collection files for import

## Getting Help

If you get stuck during this tutorial:

- **Check logs**: Most errors include helpful messages
- **Verify credentials**: Ensure API keys are valid and not expired
- **Test connectivity**: Use curl to verify server accessibility
- **Review docs**: Check the [Troubleshooting Guide](../../reference/troubleshooting.md) if you encounter issues
- **Ask for help**: Join [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)

## Ready to Start?

Let's begin by creating your account:

[**Step 1: Create Your Account →**](1-create-account.md)

---

## Alternative: Start Local First

If you don't have access to a SematX server yet, you can:

1. **[Start a local server](../start-server/index.md)** for development
2. Complete this tutorial using your local instance
3. Deploy to production when ready

The API is identical whether using local or remote servers!
