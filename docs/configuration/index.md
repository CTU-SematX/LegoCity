# Configuration Guide

Configure LegoCity to work with your city's data sources, maps, and services.

## Configuration Overview

LegoCity configuration happens in three places:

1. **Environment Variables** (`.env`) - Secrets, URLs, API keys
2. **PayloadCMS Admin** - Content, pages, blocks, collections
3. **Code Configuration** - Advanced customization, plugins

## Quick Configuration Checklist

After installation, configure these essentials:

- [ ] **[Data Sources](data-sources.md)** - Connect NGSI-LD brokers
- [ ] **Map Settings** - Configure Mapbox and map views (see below)
- [ ] **[API Keys](api-keys.md)** - Set up external service keys
- [ ] **Admin Users** - Create admin accounts and roles in PayloadCMS
- [ ] **AI Integration** (Optional) - Configure AI helpers (see AI Integration section)

## Environment Configuration

### Core Settings (`.env`)

```env
# ================================
# Database
# ================================
DATABASE_URI=mongodb://127.0.0.1/legocity

# ================================
# Security
# ================================
PAYLOAD_SECRET=your-secret-key-minimum-32-characters-long

# ================================
# Server
# ================================
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
PORT=3000

# ================================
# NGSI-LD Context Broker
# ================================
NGSI_LD_BROKER_URL=http://localhost:1026
NGSI_LD_TENANT=your-tenant-name

# ================================
# Mapbox
# ================================
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_access_token

# ================================
# Optional Services
# ================================
# Redis caching
REDIS_URL=redis://localhost:6379

# External APIs (stored server-side)
WEATHER_API_KEY=your-weather-api-key
GEOCODING_API_KEY=your-geocoding-api-key
```

### Security Best Practices

!!! warning "Never Commit Secrets" - Add `.env` to `.gitignore` - Use different secrets per environment - Rotate keys regularly

**Generate secure secrets**:

```bash
# Generate PAYLOAD_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 32
```

**Environment-specific files**:

```
.env                    # Local development (gitignored)
.env.example            # Template (committed)
.env.production         # Production (secure storage)
.env.test               # Testing
```

## PayloadCMS Configuration

### Access Admin Panel

1. Navigate to `http://localhost:3000/admin`
2. Log in with admin credentials
3. Explore collections:

### Collections Overview

| Collection     | Purpose              | Examples                  |
| -------------- | -------------------- | ------------------------- |
| **Pages**      | Dashboard layouts    | Home, Map View, Analytics |
| **Posts**      | Articles, news       | Announcements, guides     |
| **Media**      | Images, files        | Icons, photos, documents  |
| **Categories** | Content organization | News, Events, Reports     |
| **Users**      | Admin accounts       | Admins, Editors, Viewers  |

### Global Settings

**Navigation** → **Globals** → Configure:

- **Header** - Logo, navigation menu, theme
- **Footer** - Links, contact info, social media
- **Site Settings** - Title, description, metadata

## Configuration Workflows

### Initial Setup

1. **Create Admin Account**

   - First user automatically becomes admin
   - Add additional users in Users collection

2. **Configure Site Basics**

   - Set site name and description
   - Upload logo and favicon
   - Configure header and footer

3. **Connect Data Sources**

   - Add NGSI-LD broker URL
   - Test connection
   - Configure entity types

4. **Set Up Maps**

   - Add Mapbox token
   - Create map views
   - Configure layers

5. **Create First Page**
   - Use blocks to build layout
   - Add map views and content
   - Publish page

### Adding a City

For multi-tenant deployments:

1. **Create Tenant**

   ```env
   NGSI_LD_TENANT=city-name
   ```

2. **Configure Data Sources**

   - Point to city's NGSI-LD broker
   - Map entity types to views

3. **Customize Branding**

   - Upload city logo
   - Set city colors (Tailwind config)
   - Create custom pages

4. **Load City Data**
   - Seed database with city entities
   - Create map views for city zones
   - Add sample content

## Advanced Configuration

### Payload Config (`payload.config.ts`)

```typescript
import { buildConfig } from "payload/config";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

export default buildConfig({
  // Admin panel
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: "- LegoCity Admin",
      favicon: "/favicon.ico",
    },
  },

  // Collections
  collections: [Pages, Posts, Media, Categories, Users],

  // Database
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),

  // Editor
  editor: lexicalEditor({}),

  // Plugins
  plugins: [
    formBuilderPlugin(),
    nestedDocsPlugin(),
    redirectsPlugin(),
    seoPlugin(),
    searchPlugin(),
  ],
});
```

### Next.js Config (`next.config.js`)

```javascript
const withPayload = require("@payloadcms/next/withPayload");

module.exports = withPayload({
  // Next.js config
  reactStrictMode: true,

  // Image optimization
  images: {
    domains: ["api.mapbox.com", "your-cdn.com"],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },
});
```

## Configuration by Feature

### Data Integration

**Connect Context Broker**:

- [Data Sources Configuration](data-sources.md)

### Maps & Visualization

**Configure Maps** - See PayloadCMS admin for map configuration

### Security & Access

**Set Up Security**:

- [API Keys Management](api-keys.md)

### AI Features

**Enable AI Helpers** (Optional):

- See [AI Integration section](../ai/overview.md) for AI provider configuration

## Configuration Validation

### Health Check

Create a health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    broker: await checkBroker(),
    mapbox: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  };

  return Response.json(checks);
}
```

Access at: `http://localhost:3000/api/health`

### Verify Configuration

```bash
# Check environment variables
pnpm run check:env

# Test database connection
pnpm run check:db

# Test NGSI-LD broker
curl http://localhost:1026/version

# Test Mapbox token
curl "https://api.mapbox.com/v4/mapbox.mapbox-streets-v8.json?access_token=$NEXT_PUBLIC_MAPBOX_TOKEN"
```

## Backup & Restore

### Backup Configuration

```bash
# Export PayloadCMS data
mongodump --db legocity --out ./backup

# Backup environment
cp .env .env.backup

# Backup media files
cp -r public/media ./backup/media
```

### Restore Configuration

```bash
# Restore database
mongorestore --db legocity ./backup/legocity

# Restore environment
cp .env.backup .env

# Restore media
cp -r ./backup/media public/media
```

## Troubleshooting

### Configuration Not Applied

**Clear cache**:

```bash
rm -rf .next
pnpm dev
```

**Check environment**:

```bash
# Print config (safe variables only)
pnpm run config:show
```

### Connection Failures

**Test broker connection**:

```bash
curl http://localhost:1026/version
```

**Test database**:

```bash
mongosh $DATABASE_URI --eval "db.version()"
```

### Invalid Configuration

**Validate schema**:

```bash
pnpm run validate:config
```

**Check logs**:

```bash
# Development mode shows detailed errors
pnpm dev
```

## Configuration References

- [PayloadCMS Config API](https://payloadcms.com/docs/configuration)
- [Next.js Configuration](https://nextjs.org/docs/api-reference/next.config.js)

## Next Steps

After configuration:

1. **[User Guide](../user-guide/index.md)** - Learn to use LegoCity
2. **[Development Guide](../development/index.md)** - Customize and extend
3. **[Deployment Guide](../deployment/index.md)** - Deploy to production

---

**Need specific configuration?** Choose your topic:

- [Data Sources](data-sources.md) - Connect brokers
- [API Keys](api-keys.md) - External services
