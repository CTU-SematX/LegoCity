# Getting Started with SematX

Welcome to SematX! This guide will help you get started with the platform, whether you want to run it locally for development or deploy it to your own infrastructure.

## Choose Your Path

There are two main ways to get started with SematX:

### 1. Start a Local Server (Recommended for Beginners)

**Best for**: Learning, development, experimentation

Run SematX on your local machine using Docker Compose. This is the fastest way to get started and explore the platform.

- ⏱️ **Time**: 10-15 minutes
- 💻 **Requirements**: Docker Desktop
- 🎯 **Goal**: Explore SematX features locally

[**Start Local Server →**](start-server/index.md)

### 2. Bring Your Own Server

**Best for**: Production deployments, cloud infrastructure, team collaboration

Deploy SematX to your own server or cloud provider. This guide walks you through connecting your application to an existing SematX instance.

- ⏱️ **Time**: 30-45 minutes
- 💻 **Requirements**: SematX instance URL, API key
- 🎯 **Goal**: Integrate your app with SematX

[**Bring Your Own Server →**](bring-your-own-server/index.md)

## What You'll Learn

### Start Server Tutorial

In the local server tutorial, you'll learn how to:

1. Install Docker and Docker Compose
2. Clone the SematX repository
3. Start all services with a single command
4. Access the dashboard and create your first entity
5. Query data using the NGSI-LD API
6. Create visualizations and dashboards

### Bring Your Own Server Tutorial

In the bring your own server tutorial, you'll learn how to:

1. Create a SematX account and get API credentials
2. Set up a service for your application
3. Create your first NGSI-LD entity
4. Push data from your application to SematX
5. Create dashboard cards to visualize your data
6. Set up subscriptions for real-time notifications

## Prerequisites

Before you begin, make sure you have:

### For Local Development

- **Docker Desktop**: [Download](https://www.docker.com/products/docker-desktop/)
- **Git**: [Download](https://git-scm.com/downloads)
- **Code Editor**: We recommend [VS Code](https://code.visualstudio.com/)
- **Modern Browser**: Chrome, Firefox, or Edge

### For Production Deployment

- **SematX Instance**: Access to a running SematX server
- **API Key**: Obtained from the dashboard admin
- **Basic CLI Skills**: Comfortable with terminal/command line
- **HTTP Client**: curl, Postman, or your programming language's HTTP library

## Architecture Overview

Before diving in, it's helpful to understand how SematX components work together:

```
Your Application
       │
       │ HTTP/HTTPS + JWT
       │
       ▼
  Nginx Gateway ────────┐
  (Authentication)      │
       │                │
       ├────────────────┴─────────────┐
       │                              │
       ▼                              ▼
  Lego Dashboard              Orion-LD Context Broker
  (Web UI + API)              (NGSI-LD Data Store)
       │                              │
       └──────────┬───────────────────┘
                  │
                  ▼
              MongoDB
          (Data Persistence)
```

**Key Components**:

- **Nginx Gateway**: Handles authentication and routes requests
- **Lego Dashboard**: Visual interface for managing data and creating dashboards
- **Orion-LD**: Standards-based context broker for storing and querying entities
- **MongoDB**: Database for persistent storage

## Quick Concepts

### Entities

In SematX, everything is an **entity**. An entity represents a real-world object like a sensor, device, vehicle, or building.

```json
{
  "id": "urn:ngsi-ld:Sensor:001",
  "type": "Sensor",
  "temperature": {
    "type": "Property",
    "value": 25.5,
    "unitCode": "CEL"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [105.78, 10.03]
    }
  }
}
```

### NGSI-LD

SematX uses the **NGSI-LD** standard for representing data. This ensures:

- Interoperability with other FIWARE systems
- Standardized data models
- Rich query capabilities
- Built-in support for relationships and context

### API Keys

To access the SematX API, you need an **API key** (JWT token). This key:

- Authenticates your requests
- Controls what data you can access
- Enforces rate limits
- Can be revoked instantly

### Subscriptions

**Subscriptions** allow you to receive real-time notifications when entities change:

```json
{
  "type": "Subscription",
  "entities": [{ "type": "Sensor" }],
  "notification": {
    "endpoint": {
      "uri": "https://your-app.com/webhook",
      "accept": "application/json"
    }
  }
}
```

## Common Use Cases

### IoT Data Collection

Send sensor data from devices to SematX and visualize it in real-time dashboards.

### Smart City Applications

Build applications for traffic monitoring, environmental sensing, public safety, and more.

### Data Integration

Connect multiple data sources and provide a unified API for querying.

### Dashboard Creation

Create custom dashboards for monitoring and analysis without writing code.

## Need Help?

- **Documentation**: Browse the [full documentation](../index.md)
- **Community**: Join [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/CTU-SematX/LegoCity/issues)
- **Examples**: Check out [code examples](../development/index.md)

## Ready to Start?

Choose your path and let's get building:

<div style="display: flex; gap: 20px; margin-top: 20px;">
  <a href="start-server/index.md" style="flex: 1; padding: 20px; border: 2px solid #0066cc; border-radius: 8px; text-decoration: none;">
    <h3>🖥️ Start Local Server</h3>
    <p>Run SematX on your machine for development and testing</p>
  </a>
  
  <a href="bring-your-own-server/index.md" style="flex: 1; padding: 20px; border: 2px solid #0066cc; border-radius: 8px; text-decoration: none;">
    <h3>☁️ Bring Your Own Server</h3>
    <p>Connect your app to an existing SematX instance</p>
  </a>
</div>

---

## Legacy Quick Start Guide

The following section contains the original quick start guide for local development. For the new step-by-step tutorials, see the links above.

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or later
- **pnpm** 8.x or later (package manager)
- **MongoDB** 6.x or later
- **Git** for version control

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

   Edit `.env` and set:

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

After completing the quick start:

1. **[Complete Installation Guide](../installation/local.md)** - Detailed setup instructions
2. **[User Guide](../user-guide/index.md)** - Learn how to use LegoCity
3. **[Configuration](../configuration/index.md)** - Configure data sources and APIs
4. **[Development Guide](../development/index.md)** - Start building custom features

## Architecture Overview

LegoCity is built on three main layers:

### 1. Context & Data Layer (FIWARE)

- NGSI-LD context brokers
- Smart Data Models
- Real-time sensor data

### 2. UI Layer (Next.js + PayloadCMS)

- Interactive map views (Mapbox)
- Dynamic dashboard configuration
- Content management

### 3. Integration Layer

- API proxies and security
- AI assistants (optional)
- External services

## Community & Support

- 📖 **Documentation**: [https://ctu-sematx.github.io/LegoCity](https://ctu-sematx.github.io/LegoCity)
- 🐛 **Issues**: [GitHub Issues](https://github.com/CTU-SematX/LegoCity/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)
- 📧 **Contact**: [CTU-SematX Team](https://github.com/CTU-SematX)

## Design Principles

### Context-Centric Design

City information is modeled as NGSI-LD entities in context brokers - the single source of truth.

### Configuration-Driven UI

Dashboards are constructed from configurable blocks in PayloadCMS, not hard-coded.

### Reusability

The same codebase works across multiple cities by changing configuration, not code.

### AI as Optional

LegoCity works fully without AI. AI integration is a secondary feature for content authoring.

---

**Ready to dive deeper?** Continue to the [Installation Guide](../installation/local.md) for detailed setup instructions.
