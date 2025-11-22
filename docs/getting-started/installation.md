# Installation Guide

This guide provides detailed installation instructions for Lego City on different platforms.

## System Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 10 GB free space
- **OS**: Linux, macOS, or Windows 10+

### Recommended Requirements

- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 20 GB SSD
- **OS**: Linux (Ubuntu 20.04+) or macOS

## Platform-Specific Installation

### macOS

#### Install Prerequisites

1. **Install Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Go**:
   ```bash
   brew install go
   go version  # Verify installation
   ```

3. **Install Node.js**:
   ```bash
   brew install node@18
   node --version  # Should be v18 or higher
   ```

4. **Install pnpm**:
   ```bash
   npm install -g pnpm
   ```

5. **Install MongoDB**:
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```

   Or use PostgreSQL:
   ```bash
   brew install postgresql
   brew services start postgresql
   ```

### Linux (Ubuntu/Debian)

#### Install Prerequisites

1. **Update package list**:
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

2. **Install Go**:
   ```bash
   wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
   sudo rm -rf /usr/local/go
   sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
   echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
   source ~/.bashrc
   go version
   ```

3. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   node --version
   ```

4. **Install pnpm**:
   ```bash
   npm install -g pnpm
   ```

5. **Install MongoDB**:
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt update
   sudo apt install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

   Or use PostgreSQL:
   ```bash
   sudo apt install -y postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

### Windows

#### Install Prerequisites

1. **Install Git**:
   - Download from [git-scm.com](https://git-scm.com/download/win)
   - Run the installer with default settings

2. **Install Go**:
   - Download from [go.dev/dl](https://go.dev/dl/)
   - Run the MSI installer
   - Verify: Open PowerShell and run `go version`

3. **Install Node.js**:
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose the LTS version
   - Verify: `node --version`

4. **Install pnpm**:
   ```powershell
   npm install -g pnpm
   ```

5. **Install MongoDB**:
   - Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
   - Run the installer
   - Choose "Install as a Service"

   Or use Docker:
   ```powershell
   docker run -d -p 27017:27017 --name mongodb mongo
   ```

## Installing Lego City

### 1. Clone the Repository

```bash
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity
```

### 2. Backend Installation

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your favorite editor
# Windows: notepad .env
# macOS/Linux: nano .env or vim .env

# Add your API keys:
# OPENWEATHER_API_KEY=your_key_here
# OPENAIR_API_KEY=your_key_here

# Download dependencies
go mod download

# Run tests to verify
go test ./...

# Build the binary
go build -o ../bin/smartcity main.go
```

### 3. Dashboard Installation

```bash
cd ../dashboard

# Copy environment template
cp .env.example .env

# Edit .env and configure:
# DATABASE_URI=mongodb://127.0.0.1/legocity
# PAYLOAD_SECRET=$(openssl rand -base64 32)
# NEXT_PUBLIC_SERVER_URL=http://localhost:3000
# CRON_SECRET=$(openssl rand -base64 32)
# PREVIEW_SECRET=$(openssl rand -base64 32)

# Install dependencies
pnpm install

# Build for production (optional)
pnpm build
```

## Obtaining API Keys

### OpenWeather API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Click "Sign Up" or "Sign In"
3. Navigate to "API keys" section
4. Copy your default API key or generate a new one
5. Free tier includes:
   - 60 calls/minute
   - 1,000,000 calls/month
   - Current weather data
   - 5-day forecast

### OpenAir API Key

Different air quality services are available. Choose one:

1. **IQAir** (iqair.com)
   - Sign up for free account
   - Navigate to API section
   - Generate API key

2. **OpenAQ** (openaq.org)
   - Free and open-source
   - API key may not be required

3. **World Air Quality Index** (waqi.info)
   - Request API token
   - Free tier available

Update your backend `.env` file with the chosen API:

```env
OPENAIR_API_KEY=your_air_api_key_here
```

## Database Setup

### MongoDB Setup

#### Local MongoDB

```bash
# Start MongoDB
# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Windows:
# MongoDB runs as a service automatically

# Verify connection
mongosh
# Should connect successfully
```

#### MongoDB Atlas (Cloud)

1. Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get connection string
5. Update `.env`:
   ```env
   DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/legocity
   ```

### PostgreSQL Setup

#### Local PostgreSQL

```bash
# Create database
# macOS/Linux:
createdb legocity

# Or via psql:
psql -U postgres
CREATE DATABASE legocity;
\q

# Update .env:
# DATABASE_URI=postgresql://localhost:5432/legocity
```

#### PostgreSQL Cloud

Use services like:
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)
- [Render](https://render.com)

## Verification

### Verify Backend

```bash
cd backend
go run main.go
```

In another terminal:
```bash
curl http://localhost:8080/health
# Should return: {"status":"ok"}
```

### Verify Dashboard

```bash
cd dashboard
pnpm dev
```

Visit `http://localhost:3000/admin` in your browser.

## Docker Installation (Alternative)

If you prefer Docker:

```bash
# Clone repository
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity

# Copy and configure .env files
cp backend/.env.example backend/.env
cp dashboard/.env.example dashboard/.env
# Edit both .env files

# Start with docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

## Production Considerations

For production deployments:

1. **Use production database**: Not localhost
2. **Set strong secrets**: Use cryptographically random values
3. **Enable HTTPS**: Use reverse proxy (nginx, Caddy)
4. **Set environment**: `NODE_ENV=production`
5. **Configure monitoring**: Logs, metrics, alerts
6. **Set up backups**: Regular database backups
7. **Use process manager**: PM2, systemd, or Docker

## Troubleshooting

### Cannot connect to database

```bash
# Check if MongoDB is running
# macOS:
brew services list | grep mongodb

# Linux:
systemctl status mongod

# Start if not running:
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Port conflicts

```bash
# Backend (port 8080)
lsof -ti:8080 | xargs kill

# Dashboard (port 3000)
lsof -ti:3000 | xargs kill
```

### Go module issues

```bash
cd backend
go clean -modcache
go mod download
go mod verify
```

### Node module issues

```bash
cd dashboard
rm -rf node_modules pnpm-lock.yaml .next
pnpm install
```

## Next Steps

- ✅ Installation complete? → [Quick Start Guide](quickstart.md)
- 📚 Learn more → [Architecture Overview](../architecture/overview.md)
- 🔧 Start developing → [Development Guide](../DEVELOPMENT.md)

## Getting Help

- 📖 [Documentation](../index.md)
- 🐛 [Report Issues](https://github.com/CTU-SematX/LegoCity/issues)
- 💬 [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)
