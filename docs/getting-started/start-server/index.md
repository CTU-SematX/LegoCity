# Start a Local Server

This tutorial will guide you through running SematX on your local machine using Docker. This is the fastest way to get started and explore the platform.

⏱️ **Estimated Time**: 10-15 minutes  
💻 **Requirements**: Docker Desktop  
🎯 **Goal**: Run SematX locally and create your first entity

## What You'll Build

By the end of this tutorial, you'll have:

- A fully functional SematX instance running locally
- Access to the Lego Dashboard web interface
- Your first NGSI-LD entity created
- A dashboard card visualizing your data

## Prerequisites

### Install Docker Desktop

Docker Desktop includes Docker Engine and Docker Compose, which you'll need to run SematX.

**Download Docker Desktop**:

- **Windows**: [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- **Mac**: [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
- **Linux**: [Install Docker Engine](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/)

**Verify Installation**:

Open a terminal and run:

```bash
docker --version
docker compose version
```

You should see output like:

```
Docker version 24.0.0
Docker Compose version v2.20.0
```

### Install Git

You'll need Git to clone the SematX repository.

**Download Git**: [https://git-scm.com/downloads](https://git-scm.com/downloads)

**Verify Installation**:

```bash
git --version
```

## Step 1: Clone the Repository

Open a terminal and clone the SematX repository:

```bash
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity
```

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your preferred text editor:

```bash
# For VS Code
code .env

# For nano
nano .env

# For vim
vim .env
```

**Minimum Required Configuration**:

```env
# Database
DATABASE_URI=mongodb://mongodb:27017/payload
MONGODB_URL=mongodb://mongodb:27017

# Payload CMS
PAYLOAD_SECRET=your-secret-key-here-change-this
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Orion-LD
ORION_URL=http://orion:1026

# Optional: AI Features
OPENROUTER_API_KEY=your-api-key-if-using-ai
```

**Important**: Change `PAYLOAD_SECRET` to a random string. You can generate one with:

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 255 }))
```

## Step 3: Start the Services

Start all SematX services using Docker Compose:

```bash
docker compose up -d
```

This command will:

1. Pull the required Docker images (first time only)
2. Create and start containers for:
   - MongoDB (database)
   - Orion-LD (context broker)
   - Nginx (API gateway)
   - Dashboard (PayloadCMS)

**Expected Output**:

```
[+] Running 5/5
 ✔ Network legocity_default      Created
 ✔ Container legocity-mongodb-1  Started
 ✔ Container legocity-orion-1    Started
 ✔ Container legocity-dashboard-1 Started
 ✔ Container legocity-nginx-1    Started
```

**Check Service Status**:

```bash
docker compose ps
```

All services should show "Up" status:

```
NAME                    STATUS
legocity-mongodb-1      Up
legocity-orion-1        Up
legocity-dashboard-1    Up
legocity-nginx-1        Up
```

## Step 4: Access the Dashboard

Open your browser and navigate to:

```
http://localhost:3000/admin
```

### Create Your Admin Account

On first visit, you'll see the account creation screen:

1. **Email**: Enter your email address
2. **Password**: Create a secure password (min 8 characters)
3. **Confirm Password**: Re-enter your password
4. **Name** (optional): Your full name

Click **Create First User** to create your admin account.

### Log In

After creating your account, log in with your credentials:

```
http://localhost:3000/admin/login
```

## Step 5: Create Your First Entity

Now that you're logged in, let's create your first NGSI-LD entity using the API.

### Generate an API Key

1. In the dashboard, click **API Keys** in the left sidebar
2. Click **Create New**
3. Fill in the details:
   - **Name**: "My First API Key"
   - **Expires**: Select an expiration date (or leave blank for no expiration)
   - **Permissions**: Select "Full Access" for now
4. Click **Create**
5. **Copy the API key** - you won't be able to see it again!

### Create an Entity via API

Open a new terminal and use curl to create an entity:

```bash
curl -X POST http://localhost:1026/ngsi-ld/v1/entities \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/ld+json" \
  -d '{
    "id": "urn:ngsi-ld:TemperatureSensor:001",
    "type": "TemperatureSensor",
    "@context": [
      "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
    ],
    "temperature": {
      "type": "Property",
      "value": 23.5,
      "unitCode": "CEL"
    },
    "location": {
      "type": "GeoProperty",
      "value": {
        "type": "Point",
        "coordinates": [105.7800, 10.0300]
      }
    },
    "name": {
      "type": "Property",
      "value": "Temperature Sensor - Room 101"
    }
  }'
```

**Replace `YOUR_API_KEY_HERE`** with the API key you copied earlier.

**Expected Response**:

```
HTTP/1.1 201 Created
Location: /ngsi-ld/v1/entities/urn:ngsi-ld:TemperatureSensor:001
```

### Verify the Entity

Query the entity to verify it was created:

```bash
curl -X GET http://localhost:1026/ngsi-ld/v1/entities/urn:ngsi-ld:TemperatureSensor:001 \
  -H "Authorization: Bearer YOUR_API_KEY_HERE"
```

**Expected Response**:

```json
{
  "id": "urn:ngsi-ld:TemperatureSensor:001",
  "type": "TemperatureSensor",
  "temperature": {
    "type": "Property",
    "value": 23.5,
    "unitCode": "CEL"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [105.78, 10.03]
    }
  },
  "name": {
    "type": "Property",
    "value": "Temperature Sensor - Room 101"
  }
}
```

## Step 6: Create a Dashboard Card

Now let's visualize this data in the dashboard.

### Navigate to Cards

1. In the dashboard, click **Cards** in the left sidebar
2. Click **Create New**

### Configure the Card

Fill in the card details:

1. **Name**: "Room 101 Temperature"
2. **Type**: Select "Metric" (for displaying a single value)
3. **Entity Type**: "TemperatureSensor"
4. **Entity ID**: "urn:ngsi-ld:TemperatureSensor:001"
5. **Property**: "temperature"
6. **Configuration** (JSON):

   ```json
   {
     "unit": "°C",
     "label": "Current Temperature",
     "color": "#FF6B6B",
     "threshold": {
       "warning": 30,
       "critical": 35
     }
   }
   ```

7. Click **Create**

### View Your Dashboard

1. Click **Dashboard** in the top navigation
2. You should see your temperature card displaying "23.5°C"

## Step 7: Update Entity Data

Let's simulate a temperature change:

```bash
curl -X PATCH http://localhost:1026/ngsi-ld/v1/entities/urn:ngsi-ld:TemperatureSensor:001/attrs \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/ld+json" \
  -d '{
    "temperature": {
      "type": "Property",
      "value": 28.3,
      "unitCode": "CEL"
    }
  }'
```

Refresh your dashboard - the card should now show "28.3°C"!

## Common Commands

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f dashboard
docker compose logs -f orion
```

### Stop Services

```bash
# Stop all services (keeps data)
docker compose stop

# Stop and remove containers (keeps data)
docker compose down

# Stop and remove everything including data
docker compose down -v
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart dashboard
```

### Access MongoDB

```bash
# Open MongoDB shell
docker compose exec mongodb mongosh

# List databases
show dbs

# Use Orion database
use orion

# List collections
show collections

# Query entities
db.entities.find().pretty()
```

## Troubleshooting

### Port Already in Use

If you see an error like "port is already allocated":

```bash
# Find which process is using port 3000
# On Linux/Mac
lsof -i :3000

# On Windows
netstat -ano | findstr :3000

# Change the port in docker-compose.yml
# Or stop the conflicting service
```

### Services Won't Start

```bash
# Check service logs
docker compose logs

# Remove and recreate containers
docker compose down
docker compose up -d

# Rebuild images if needed
docker compose build --no-cache
docker compose up -d
```

### Can't Access Dashboard

1. **Check services are running**: `docker compose ps`
2. **Check logs**: `docker compose logs dashboard`
3. **Verify port mapping**: Dashboard should be on `localhost:3000`
4. **Try different browser**: Clear cache or use incognito mode

### API Returns 401 Unauthorized

1. **Check API key**: Make sure you copied it correctly
2. **Check expiration**: API key might have expired
3. **Create new key**: Generate a fresh API key from dashboard

## Next Steps

Congratulations! You now have SematX running locally. Here's what to explore next:

### Learn Core Concepts

- [Understanding Orion Nginx](../../core-concepts/orion-nginx.md)
- [Lego Dashboard Internals](../../core-concepts/lego-dashboard.md)

### Build Something

- [Create More Entities](../../user-guide/entities.md)
- [Set Up Subscriptions](../../user-guide/data-and-brokers.md)
- [Build Custom Dashboards](../../user-guide/index.md)

### Deploy to Production

- [Bring Your Own Server](../bring-your-own-server/index.md)
- [Deployment Guide](../../deployment/index.md)

## What You Learned

✅ How to install Docker and Docker Compose  
✅ How to start SematX services locally  
✅ How to access the Lego Dashboard  
✅ How to create NGSI-LD entities via API  
✅ How to build dashboard cards for visualization  
✅ How to update entity data in real-time  
✅ Basic Docker Compose commands for managing services

## Clean Up

When you're done experimenting, you can stop and remove all services:

```bash
# Stop services but keep data
docker compose down

# Remove everything including data volumes
docker compose down -v

# Remove downloaded images (optional)
docker rmi $(docker images -q fiware/orion-ld)
docker rmi $(docker images -q mongo)
```

Happy building with SematX! 🚀
