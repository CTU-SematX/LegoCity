# Installation Overview

LegoCity can be installed in different environments depending on your needs.

## Installation Paths

### For Users & Operators

If you want to **deploy and use** LegoCity:

1. **[Quick Start](../getting-started/quickstart.md)** - Get running in 5 minutes
2. **[Local Installation](local.md)** - Full local development setup
3. **[Production Deployment](../deployment/index.md)** - Deploy to servers

### For Developers & Contributors

If you want to **develop and contribute** to LegoCity:

1. **[Development Environment](development.md)** - Complete dev setup
2. **[Local Installation](local.md)** - Set up local environment
3. **[Development Guide](../development/index.md)** - Start building

## Choose Your Setup

### Local Development (Recommended for Development)

**Best for**: Developers, contributors, testing changes

**What you get**:

- ✅ Full control over codebase
- ✅ Hot reload during development
- ✅ Easy debugging
- ✅ Run tests locally

**Requirements**:

- Node.js 18+
- pnpm package manager
- MongoDB 6+
- Git

**Time to setup**: ~15 minutes

👉 [Local Installation Guide](local.md)

---

### Docker Compose (Quickest Setup)

**Best for**: Quick testing, demonstrations, isolated environments

**What you get**:

- ✅ One-command setup
- ✅ All services containerized
- ✅ Easy cleanup
- ✅ Reproducible environment

**Requirements**:

- Docker Desktop or Docker Engine
- Docker Compose

**Time to setup**: ~5 minutes

👉 [Docker Setup Guide](docker.md)

---

### Production Server (For Deployment)

**Best for**: Staging, production, public deployments

**What you get**:

- ✅ Optimized builds
- ✅ Scalable architecture
- ✅ Production-ready config
- ✅ SSL/HTTPS support

**Requirements**:

- Linux server (Ubuntu/Debian recommended)
- Node.js, MongoDB, Nginx
- Domain name (optional)

**Time to setup**: ~30 minutes

👉 [Production Deployment Guide](../deployment/vm-docker.md)

---

## System Requirements

### Minimum Requirements

| Component   | Requirement                   |
| ----------- | ----------------------------- |
| **CPU**     | 2 cores                       |
| **RAM**     | 4 GB                          |
| **Storage** | 10 GB free space              |
| **OS**      | Windows 10+, macOS 11+, Linux |

### Recommended Requirements

| Component   | Requirement                |
| ----------- | -------------------------- |
| **CPU**     | 4+ cores                   |
| **RAM**     | 8+ GB                      |
| **Storage** | 20+ GB SSD                 |
| **Network** | Stable internet connection |

### Software Dependencies

#### Required

- **Node.js**: 18.x or 20.x (LTS versions)
- **pnpm**: 8.x or later
- **MongoDB**: 6.x or later
- **Git**: 2.x or later

#### Optional

- **Docker**: 24.x or later (for containerized setup)
- **Nginx**: 1.18+ (for production proxy)
- **Redis**: 7.x (for caching)

## Installation Methods Comparison

| Feature         | Local Dev | Docker Compose | Production |
| --------------- | --------- | -------------- | ---------- |
| Setup Time      | 15 min    | 5 min          | 30 min     |
| Difficulty      | Medium    | Easy           | Hard       |
| Customization   | High      | Medium         | High       |
| Performance     | Best      | Good           | Best       |
| Scalability     | Low       | Low            | High       |
| For Development | ✅        | ⚠️             | ❌         |
| For Production  | ❌        | ⚠️             | ✅         |

## Pre-Installation Checklist

Before starting installation:

- [ ] Verify system requirements met
- [ ] Install required software (Node.js, pnpm, MongoDB)
- [ ] Have Mapbox access token ready (for maps)
- [ ] Prepare domain name (for production only)
- [ ] Review [Architecture Overview](../getting-started/architecture.md)

## Common Installation Issues

### Node.js Version Mismatch

**Problem**: Using unsupported Node.js version

**Solution**:

```bash
# Install nvm (Node Version Manager)
# Then use project's node version
nvm install 18
nvm use 18
```

### MongoDB Connection Failed

**Problem**: MongoDB not running or wrong connection string

**Solution**:

```bash
# Windows
net start MongoDB

# Linux/macOS
sudo systemctl start mongod

# Or use Docker
docker run -d -p 27017:27017 mongo:6
```

### Port Already in Use

**Problem**: Port 3000 already occupied

**Solution**:

```bash
# Find and kill process
npx kill-port 3000

# Or use different port
PORT=3001 pnpm dev
```

### pnpm Not Found

**Problem**: pnpm not installed globally

**Solution**:

```bash
npm install -g pnpm
```

## Post-Installation

After successful installation:

1. **Verify Setup**

   - [ ] Dashboard loads at http://localhost:3000
   - [ ] Admin panel accessible at /admin
   - [ ] Can create first user account
   - [ ] Maps render correctly

2. **Initial Configuration**

   - [ ] Set up admin account
   - [ ] Configure data sources ([Configuration Guide](../configuration/index.md))
   - [ ] Load sample data (optional)

3. **Next Steps**
   - Read [User Guide](../user-guide/index.md) to learn features
   - Explore [Development Guide](../development/index.md) to customize
   - Check [Configuration](../configuration/index.md) for advanced setup

## Getting Help

If you encounter issues:

- 📖 [Troubleshooting Guide](../reference/troubleshooting.md)
- 🐛 [GitHub Issues](https://github.com/CTU-SematX/LegoCity/issues)
- 💬 [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)
- 📧 Contact: CTU-SematX Team

---

**Ready to install?** Choose your installation method:

- [Local Development Setup](local.md) - For developers
- [Docker Setup](docker.md) - Quick start with containers
- [Production Deployment](../deployment/vm-docker.md) - For staging/production
