# Quick Start Guide

Get Lego City running in just a few minutes! This guide assumes you have already completed the [installation](installation.md).

## 5-Minute Quick Start

### Step 1: Start the Backend (2 minutes)

```bash
# Navigate to backend directory
cd backend

# Ensure .env is configured
cat .env
# Should show:
# OPENWEATHER_API_KEY=your_key
# OPENAIR_API_KEY=your_key

# Start the server
go run main.go
```

✅ **Success**: You should see `Listening and serving HTTP on :8080`

### Step 2: Test the Backend API (1 minute)

Open a new terminal and test the API:

```bash
# Health check
curl http://localhost:8080/health

# Get weather for London
curl "http://localhost:8080/api/weather/city?q=London"

# Get air quality data
curl "http://localhost:8080/api/air/countries?country=56"
```

✅ **Success**: You should receive JSON responses with data

### Step 3: Start the Dashboard (2 minutes)

```bash
# Navigate to dashboard directory (from repository root)
cd dashboard

# Ensure .env is configured
cat .env
# Should have DATABASE_URI and secrets set

# Start the development server
pnpm dev
```

✅ **Success**: Dashboard runs at `http://localhost:3000`

### Step 4: Access the Admin Panel

1. Open your browser to `http://localhost:3000/admin`
2. Create your first admin user:
   - Email: your-email@example.com
   - Password: (choose a strong password)
3. Click "Create Account"

✅ **Success**: You're logged into the admin panel!

## First Tasks

### Create Your First Page

1. In the admin panel, click **"Pages"** in the sidebar
2. Click **"Create New"**
3. Fill in the details:
   - Title: "Welcome to My Smart City"
   - Choose a layout with the layout builder
4. Add content blocks:
   - Click "+ Add Block"
   - Choose "Hero" or "Content"
   - Fill in your content
5. Click **"Save Draft"** then **"Publish"**

View your page at `http://localhost:3000/welcome-to-my-smart-city`

### Create a Blog Post

1. Click **"Posts"** in the sidebar
2. Click **"Create New"**
3. Add:
   - Title: "My First Post"
   - Categories: Create a new category
   - Content: Use the rich text editor
4. **Publish** when ready

### Upload Media

1. Click **"Media"** in the sidebar
2. Click **"Create New"** or drag & drop images
3. Images are automatically optimized

### Customize Navigation

1. Click **"Globals"** → **"Header"**
2. Add navigation links
3. Save changes
4. View updates on the frontend

## Using the API

### Get Weather Data

```bash
# Current weather for a city
curl "http://localhost:8080/api/weather/city?q=Tokyo"

# Weather for multiple cities
curl "http://localhost:8080/api/weather/city?q=Paris"
curl "http://localhost:8080/api/weather/city?q=New%20York"
```

### Get Air Quality Data

```bash
# List all locations
curl "http://localhost:8080/api/air/locations"

# Get data for specific country (ID 56 = Vietnam)
curl "http://localhost:8080/api/air/countries?country=56"
```

### Integrate with Your Frontend

```javascript
// Fetch weather data
async function getWeather(city) {
  const response = await fetch(
    `http://localhost:8080/api/weather/city?q=${encodeURIComponent(city)}`
  );
  return await response.json();
}

// Fetch air quality data
async function getAirQuality(countryId) {
  const response = await fetch(
    `http://localhost:8080/api/air/countries?country=${countryId}`
  );
  return await response.json();
}

// Usage
const londonWeather = await getWeather('London');
console.log(londonWeather);
```

## Development Workflow

### Make Changes to Backend

1. Edit files in `backend/`
2. Restart the server: `Ctrl+C` then `go run main.go`
3. Test your changes with `curl`

**Hot Reload** (optional):
```bash
# Install air for hot reload
go install github.com/cosmtrek/air@latest

# Run with hot reload
air
```

### Make Changes to Dashboard

1. Edit files in `dashboard/src/`
2. Changes auto-reload in browser (Hot Module Replacement)
3. Check browser console for errors

### Run Tests

```bash
# Backend tests
cd backend
go test ./...

# Dashboard tests
cd dashboard
pnpm test
```

## Common Workflows

### Add a New API Endpoint (Backend)

1. Create handler in `backend/handlers/`
2. Add route in `backend/server/server.go`
3. Test with `curl`
4. Update documentation

### Create a Custom Layout Block (Dashboard)

1. Create block schema in `dashboard/src/blocks/`
2. Create React component for rendering
3. Register block in collection config
4. Use in layout builder

### Deploy Changes

```bash
# Build backend
cd backend
go build -o ../bin/smartcity main.go

# Build dashboard
cd dashboard
pnpm build
pnpm start
```

## Sample Project Ideas

### 1. City Weather Dashboard

- Create pages for different cities
- Display current weather and forecast
- Add air quality indicators
- Create alerts for poor air quality

### 2. Environmental Monitoring

- Track air quality trends
- Create data visualization pages
- Set up scheduled reports
- Build public awareness campaigns

### 3. Smart City Portal

- Integrate weather and air data
- Add city services information
- Create citizen engagement features
- Build multimedia content pages

## Development Tips

### Backend Tips

✅ **Use environment variables** for all configuration
✅ **Handle errors gracefully** in all handlers
✅ **Add logging** for debugging
✅ **Cache API responses** to avoid rate limits
✅ **Write tests** for new features

### Dashboard Tips

✅ **Use TypeScript** for type safety
✅ **Keep components small** and focused
✅ **Leverage PayloadCMS hooks** for custom logic
✅ **Optimize images** with Next.js Image component
✅ **Test responsive design** on different devices

## Debugging

### Backend Issues

```bash
# Check logs
go run main.go

# Run with verbose logging
GIN_MODE=debug go run main.go

# Test specific endpoint
curl -v http://localhost:8080/api/weather/city?q=London
```

### Dashboard Issues

```bash
# Check browser console for errors
# Open DevTools (F12)

# Check server logs
# Terminal running `pnpm dev`

# Clear cache
rm -rf .next
pnpm dev
```

## Performance Optimization

### Backend

- Implement Redis caching for API responses
- Use connection pooling for database
- Add rate limiting for API endpoints
- Enable gzip compression

### Dashboard

- Optimize images (WebP format)
- Use lazy loading for images
- Implement code splitting
- Enable Next.js production optimizations

## Next Steps

### Learn More

- 📖 [Architecture Overview](../architecture/overview.md) - Understand the system
- 🔧 [Development Guide](../DEVELOPMENT.md) - Deep dive into development
- 🎨 [Payload Documentation](https://payloadcms.com/docs) - Learn PayloadCMS
- 🌐 [FIWARE Documentation](https://www.fiware.org/developers/) - Explore FIWARE

### Contribute

- 🐛 [Report Bugs](https://github.com/CTU-SematX/LegoCity/issues/new?template=bug_report.yml)
- 💡 [Suggest Features](https://github.com/CTU-SematX/LegoCity/issues/new?template=feature_suggestion.yml)
- 📝 [Improve Docs](https://github.com/CTU-SematX/LegoCity/edit/main/docs/)
- 🔧 [Submit PRs](../CONTRIBUTING.md)

### Deploy to Production

- ☁️ Deploy backend to a VPS or cloud service
- 🌐 Deploy dashboard to Vercel or self-host
- 🔒 Set up HTTPS with Let's Encrypt
- 📊 Configure monitoring and logging
- 🔄 Set up CI/CD pipelines

## Getting Help

Having trouble? We're here to help!

- 📖 Check the [documentation](../index.md)
- 🔍 Search [existing issues](https://github.com/CTU-SematX/LegoCity/issues)
- 💬 Ask in [discussions](https://github.com/CTU-SematX/LegoCity/discussions)
- 📧 Contact [maintainers](../../README.md#maintainers)

## Useful Commands Reference

### Backend Commands

```bash
go run main.go           # Run development server
go test ./...            # Run tests
go build -o bin/app      # Build binary
golangci-lint run        # Lint code
go mod tidy              # Clean dependencies
```

### Dashboard Commands

```bash
pnpm dev                 # Development server
pnpm build               # Production build
pnpm start               # Start production server
pnpm lint                # Lint code
pnpm test                # Run tests
pnpm payload             # Payload CLI
```

### Git Commands

```bash
git status               # Check status
git add .                # Stage changes
git commit -s -S -m ""   # Signed commit
git push                 # Push changes
```

---

**You're all set!** Start building your smart city platform! 🏙️

For detailed guides, see the [full documentation](../index.md).
