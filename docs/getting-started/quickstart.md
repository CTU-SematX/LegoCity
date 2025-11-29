# Quick Start Guide

Get LegoCity running in 5 minutes.

## 1. Prerequisites Check

Verify you have the required tools:

```powershell
# Check Node.js version (need 18+)
node --version

# Check pnpm (install if needed)
pnpm --version

# If pnpm not installed:
npm install -g pnpm

# Check MongoDB is running
mongosh --eval "db.version()"
```

## 2. Clone & Install

```bash
# Clone repository
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity/dashboard

# Install dependencies
pnpm install
```

## 3. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Minimal configuration:

```env
# Database
DATABASE_URI=mongodb://127.0.0.1/legocity

# Security
PAYLOAD_SECRET=your-secret-key-min-32-chars

# Server
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

!!! tip "Generate Secret"
`bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    `

## 4. Start Development Server

```bash
pnpm dev
```

You should see:

```
✓ Ready in 3.2s
○ Local:   http://localhost:3000
```

## 5. Access Dashboard

Open your browser:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)

### First Login

On first access, you'll be prompted to create an admin account:

1. Email: `admin@example.com`
2. Password: Choose a secure password
3. Click "Create First User"

## 6. Load Sample Data (Optional)

```bash
# Seed database with sample city data
pnpm seed
```

This creates:

- ✅ Sample sensors and zones
- ✅ Example dashboard pages
- ✅ Demo map views and layers

## What's Next?

### Explore the Dashboard

1. **Navigate to Admin Panel** - [http://localhost:3000/admin](http://localhost:3000/admin)
2. **View Collections**:
   - Pages - Dashboard layouts
   - Media - Images and assets
   - Posts - Content articles
   - Categories - Content organization

### Configure Your City

1. **[Connect Data Sources](../configuration/data-sources.md)** - Link NGSI-LD brokers
2. **Set Up Map Views** - Configure Mapbox layers (see User Guide)
3. **Create Dashboard Pages** - Build custom layouts with blocks

### Start Development

1. **[Development Setup](../installation/development.md)** - Complete dev environment
2. **[Create Custom Blocks](../development/blocks.md)** - Build UI components
3. **[Write Plugins](../development/plugins.md)** - Extend functionality

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 pnpm dev
```

### MongoDB Connection Failed

```bash
# Start MongoDB (Windows)
net start MongoDB

# Or start manually
mongod --dbpath C:\data\db
```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm dev
```

## Need Help?

- 📖 [Full Installation Guide](../installation/local.md)
- 🐛 [Common Issues](../reference/troubleshooting.md)
- 💬 [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)

---

**Up and running?** Continue to the [User Guide](../user-guide/index.md) to learn how to use LegoCity.
