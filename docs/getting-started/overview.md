# Getting Started with Lego City

Welcome! This guide will help you get Lego City up and running on your system.

## What You'll Build

By the end of this guide, you'll have:

- ✅ A running backend API server providing weather and air quality data
- ✅ A beautiful web dashboard for managing content and visualizing data
- ✅ Understanding of the basic architecture and workflows

## Prerequisites

Before you begin, ensure you have:

### Required Software

- **Git**: For cloning the repository
  ```bash
  git --version  # Should be 2.0 or higher
  ```

- **Go**: Version 1.21 or higher (for backend)
  ```bash
  go version  # Should show go1.21 or higher
  ```

- **Node.js**: Version 18 or higher (for dashboard)
  ```bash
  node --version  # Should show v18.0.0 or higher
  ```

- **pnpm**: Package manager for dashboard
  ```bash
  npm install -g pnpm
  ```

- **Database**: MongoDB or PostgreSQL (for dashboard)
  - [MongoDB installation guide](https://docs.mongodb.com/manual/installation/)
  - [PostgreSQL installation guide](https://www.postgresql.org/download/)

### API Keys

You'll need free API keys from:

1. **OpenWeather API**: 
   - Sign up at [OpenWeatherMap](https://openweathermap.org/api)
   - Free tier includes 60 calls/minute

2. **OpenAir API**:
   - Register at your preferred air quality data provider
   - Ensure API access is enabled

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity
```

### Step 2: Set Up the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your API keys:
   ```env
   OPENWEATHER_API_KEY=your_openweather_key_here
   OPENAIR_API_KEY=your_openair_key_here
   ```

4. Install Go dependencies:
   ```bash
   go mod download
   ```

5. Verify the setup:
   ```bash
   go test ./...
   ```

### Step 3: Set Up the Dashboard

1. Navigate to the dashboard directory:
   ```bash
   cd ../dashboard
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your configuration:
   ```env
   DATABASE_URI=mongodb://127.0.0.1/legocity
   PAYLOAD_SECRET=generate-a-random-secret-here
   NEXT_PUBLIC_SERVER_URL=http://localhost:3000
   CRON_SECRET=another-random-secret
   PREVIEW_SECRET=yet-another-random-secret
   ```

   💡 **Tip**: Generate secure random secrets:
   ```bash
   openssl rand -base64 32
   ```

4. Install dependencies:
   ```bash
   pnpm install
   ```

## Running the Application

### Start the Backend

In the `backend` directory:

```bash
go run main.go
```

You should see:
```
[GIN-debug] Listening and serving HTTP on :8080
```

Test it:
```bash
curl http://localhost:8080/health
```

### Start the Dashboard

In a new terminal, navigate to `dashboard` directory:

```bash
pnpm dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

### Access the Dashboard

1. Open your browser to `http://localhost:3000/admin`
2. Create your first admin user
3. (Optional) Click "Seed Database" for sample data

## Verify Everything Works

### Test the Backend API

```bash
# Check health
curl http://localhost:8080/health

# Get weather for a city
curl "http://localhost:8080/api/weather/city?q=London"

# Get air quality data
curl "http://localhost:8080/api/air/countries?country=56"
```

### Test the Dashboard

1. Log in to the admin panel
2. Navigate to "Pages" and create a new page
3. Use the layout builder to add content blocks
4. Preview and publish your page

## Next Steps

Now that you have Lego City running, you can:

- 📖 Read the [Architecture Overview](../architecture/overview.md)
- 🔧 Follow the [Development Guide](../../DEVELOPMENT.md)
- 🎨 Customize the dashboard theme and layout
- 🔌 Integrate additional data sources
- 📝 Contribute to the project

## Common Issues

### Backend Issues

**Problem**: `go: cannot find main module`
```bash
# Solution: Ensure you're in the backend directory
cd backend
go mod download
```

**Problem**: API keys not working
```bash
# Solution: Verify .env file exists and has correct values
cat .env
# Restart the server after updating
```

### Dashboard Issues

**Problem**: Database connection failed
```bash
# Solution: Start MongoDB
brew services start mongodb-community
# or with Docker:
docker run -d -p 27017:27017 mongo
```

**Problem**: Module not found
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules .next
pnpm install
```

**Problem**: Port already in use
```bash
# Solution: Kill the process or use a different port
lsof -ti:3000 | xargs kill
```

## Getting Help

If you encounter issues:

1. Check this documentation
2. Search [GitHub Issues](https://github.com/CTU-SematX/LegoCity/issues)
3. Review the [Development Guide](../../DEVELOPMENT.md)
4. Ask in [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)

---

**Ready to dive deeper?** Continue to the [Quick Start Guide](quickstart.md) →
