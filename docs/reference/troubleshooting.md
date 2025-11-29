# Troubleshooting Guide

Common issues and their solutions when working with LegoCity.

## Quick Diagnostics

Run these checks first:

```bash
# Check all services
pnpm run check:all

# Or check individually:
node --version        # Should be 18+
pnpm --version        # Should be 8+
mongosh --eval "db.version()"  # MongoDB running?
curl http://localhost:3000/api/health  # App running?
```

## Installation Issues

### Node.js Version Mismatch

**Problem**: `error:0308010C:digital envelope routines::unsupported`

**Cause**: Node.js version incompatibility

**Solution**:

```bash
# Check required version
cat .nvmrc

# Install correct version
nvm install 18
nvm use 18

# Verify
node --version
```

### pnpm Not Found

**Problem**: `pnpm: command not found`

**Solution**:

```bash
# Install pnpm globally
npm install -g pnpm

# Or use Corepack (Node.js 16+)
corepack enable
corepack prepare pnpm@latest --activate
```

### MongoDB Connection Failed

**Problem**: `MongoServerError: connect ECONNREFUSED 127.0.0.1:27017`

**Cause**: MongoDB not running or wrong connection string

**Solutions**:

=== "Windows"
```powershell # Start MongoDB service
net start MongoDB

    # Check status
    sc query MongoDB

    # Or start manually
    mongod --dbpath C:\data\db
    ```

=== "macOS"
```bash # Start with Homebrew
brew services start mongodb-community

    # Or manually
    mongod --config /usr/local/etc/mongod.conf
    ```

=== "Linux"
```bash # Start service
sudo systemctl start mongod

    # Enable on boot
    sudo systemctl enable mongod

    # Check status
    sudo systemctl status mongod
    ```

=== "Docker"
```bash # Start MongoDB container
docker run -d -p 27017:27017 --name mongodb mongo:6

    # Or with Docker Compose
    docker compose up -d mongodb
    ```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:

=== "Windows"
```powershell # Find process using port
netstat -ano | findstr :3000

    # Kill process (replace PID)
    taskkill /PID [PID] /F

    # Or use npx
    npx kill-port 3000
    ```

=== "macOS/Linux"
```bash # Find and kill process
lsof -ti:3000 | xargs kill -9

    # Or use npx
    npx kill-port 3000
    ```

**Alternative**: Use different port

```bash
PORT=3001 pnpm dev
```

## Development Issues

### Hot Reload Not Working

**Problem**: Changes not reflecting in browser

**Solutions**:

1. **Clear Next.js cache**:

   ```bash
   rm -rf .next
   pnpm dev
   ```

2. **Check file watcher limits** (Linux):

   ```bash
   # Increase limit
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. **Restart dev server**:
   ```bash
   # Kill server (Ctrl+C)
   pnpm dev
   ```

### TypeScript Errors After Update

**Problem**: Type errors after updating dependencies

**Solution**:

```bash
# Regenerate Payload types
pnpm payload generate:types

# Clear TypeScript cache
rm -rf node_modules/.cache

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

### Build Fails

**Problem**: `Build failed with errors`

**Common causes and solutions**:

1. **Type errors**:

   ```bash
   pnpm type-check
   # Fix reported errors
   ```

2. **Lint errors**:

   ```bash
   pnpm lint:fix
   ```

3. **Out of memory**:

   ```bash
   # Increase Node memory
   NODE_OPTIONS="--max-old-space-size=4096" pnpm build
   ```

4. **Module not found**:
   ```bash
   # Reinstall dependencies
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

## Runtime Issues

### White Screen / Blank Page

**Problem**: Page loads but shows nothing

**Debugging steps**:

1. **Check browser console** for JavaScript errors

2. **Check Network tab** for failed requests

3. **Verify environment variables**:

   ```bash
   # Required variables set?
   echo $DATABASE_URI
   echo $PAYLOAD_SECRET
   echo $NEXT_PUBLIC_SERVER_URL
   ```

4. **Check server logs**:
   ```bash
   pnpm dev
   # Look for errors in terminal
   ```

### Map Not Rendering

**Problem**: Map area is blank or shows error

**Solutions**:

1. **Verify Mapbox token**:

   ```bash
   # Check token is set
   echo $NEXT_PUBLIC_MAPBOX_TOKEN

   # Test token
   curl "https://api.mapbox.com/v4/mapbox.mapbox-streets-v8.json?access_token=$NEXT_PUBLIC_MAPBOX_TOKEN"
   ```

2. **Check console for errors**:

   - Open browser DevTools → Console
   - Look for Mapbox errors

3. **Verify token scope**:
   - Token must have `styles:read` and `fonts:read` scopes
   - Create new token at [mapbox.com](https://account.mapbox.com/access-tokens/)

### Admin Panel 404

**Problem**: `/admin` route not found

**Solutions**:

1. **Rebuild application**:

   ```bash
   rm -rf .next
   pnpm build
   pnpm start
   ```

2. **Check Payload config**:

   ```typescript
   // payload.config.ts
   admin: {
     autoLogin: false,  // Should be false in production
   }
   ```

3. **Verify admin routes exist**:
   ```bash
   ls src/app/\(payload\)/admin
   ```

### API Route Returns 500

**Problem**: API endpoint throws server error

**Debugging**:

1. **Check server logs** for error details

2. **Test with curl**:

   ```bash
   curl -v http://localhost:3000/api/your-endpoint
   ```

3. **Add logging**:
   ```typescript
   export async function GET(req: Request) {
     try {
       console.log("Request:", req.url);
       // ... your code
     } catch (error) {
       console.error("Error:", error);
       return Response.json({ error: error.message }, { status: 500 });
     }
   }
   ```

## Database Issues

### Database Connection Slow

**Problem**: Slow queries or timeouts

**Solutions**:

1. **Add indexes**:

   ```javascript
   // In MongoDB shell
   db.pages.createIndex({ slug: 1 });
   db.posts.createIndex({ publishedAt: -1 });
   ```

2. **Monitor slow queries**:

   ```javascript
   db.setProfilingLevel(2);
   db.system.profile.find().sort({ ts: -1 }).limit(10);
   ```

3. **Check database stats**:
   ```bash
   mongosh legocity --eval "db.stats()"
   ```

### Collection Not Found

**Problem**: `Collection 'pages' not found`

**Solutions**:

1. **Check collection name** matches config:

   ```typescript
   // collections/Pages.ts
   slug: "pages"; // Must match
   ```

2. **Verify database**:

   ```bash
   mongosh legocity --eval "show collections"
   ```

3. **Seed database**:
   ```bash
   pnpm seed
   ```

### Database Migration Failed

**Problem**: Schema changes not applied

**Solution**:

```bash
# Backup first!
mongodump --db legocity --out ./backup

# Drop and recreate
mongosh legocity --eval "db.dropDatabase()"
pnpm seed

# Or restore backup
mongorestore --db legocity ./backup/legocity
```

## Docker Issues

### Container Exits Immediately

**Problem**: Docker container starts then stops

**Debug**:

```bash
# Check logs
docker compose logs dashboard

# Check for errors in build
docker compose build --no-cache dashboard

# Run interactively
docker compose run --rm dashboard sh
```

### Cannot Connect to Service

**Problem**: Frontend can't reach MongoDB/Orion

**Solutions**:

1. **Use service names**, not localhost:

   ```env
   # ❌ Wrong
   DATABASE_URI=mongodb://localhost:27017/legocity

   # ✅ Correct
   DATABASE_URI=mongodb://mongodb:27017/legocity
   ```

2. **Check network**:

   ```bash
   docker compose ps
   docker network ls
   ```

3. **Test connectivity**:
   ```bash
   docker compose exec dashboard ping mongodb
   ```

### Volume Permission Issues

**Problem**: Permission denied errors (Linux)

**Solution**:

```bash
# Fix ownership
sudo chown -R $USER:$USER ./dashboard

# Or run as current user
docker compose run --user "$(id -u):$(id -g)" dashboard pnpm dev
```

## Production Issues

### 502 Bad Gateway

**Problem**: Nginx shows 502 error

**Solutions**:

1. **Check app is running**:

   ```bash
   pm2 status
   # Or
   systemctl status legocity
   ```

2. **Check Nginx config**:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Check logs**:

   ```bash
   # App logs
   pm2 logs

   # Nginx logs
   sudo tail -f /var/log/nginx/error.log
   ```

### Memory Leak

**Problem**: Application memory usage grows over time

**Solutions**:

1. **Monitor memory**:

   ```bash
   # PM2 monitoring
   pm2 monit

   # Or use htop
   htop
   ```

2. **Set memory limit**:

   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [
       {
         name: "legocity",
         script: "node_modules/next/dist/bin/next",
         args: "start",
         max_memory_restart: "1G",
       },
     ],
   };
   ```

3. **Profile memory**:
   ```bash
   node --inspect node_modules/next/dist/bin/next start
   # Use Chrome DevTools to profile
   ```

### SSL Certificate Issues

**Problem**: HTTPS not working or certificate errors

**Solutions**:

1. **Check certificate validity**:

   ```bash
   sudo certbot certificates
   ```

2. **Renew certificate**:

   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

3. **Test SSL config**:
   ```bash
   curl -vI https://your-domain.com
   ```

## Performance Issues

### Slow Page Load

**Problem**: Pages take too long to load

**Solutions**:

1. **Enable caching**:

   ```typescript
   // app/page.tsx
   export const revalidate = 60; // ISR every 60s
   ```

2. **Optimize images**:

   ```tsx
   import Image from "next/image";

   <Image src="/image.jpg" width={800} height={600} alt="Description" />;
   ```

3. **Use dynamic imports**:

   ```typescript
   const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
     loading: () => <p>Loading...</p>,
   });
   ```

4. **Analyze bundle**:
   ```bash
   pnpm build --analyze
   ```

### High CPU Usage

**Problem**: CPU spikes during normal operation

**Check**:

1. **Profile application**:

   ```bash
   node --prof node_modules/next/dist/bin/next start
   node --prof-process isolate-*.log > profile.txt
   ```

2. **Check for infinite loops** in code

3. **Monitor processes**:
   ```bash
   top -p $(pgrep node)
   ```

## Getting More Help

### Collect Diagnostic Info

Before asking for help, collect:

```bash
# System info
node --version
pnpm --version
mongosh --version

# App info
cat package.json | grep version

# Environment
echo $NODE_ENV
env | grep -E '(DATABASE|PAYLOAD|NEXT_PUBLIC)'

# Logs
pnpm dev > debug.log 2>&1

# Health check
curl http://localhost:3000/api/health
```

### Where to Get Help

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/CTU-SematX/LegoCity/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)
- 📖 **Documentation**: [LegoCity Docs](https://ctu-sematx.github.io/LegoCity)
- 📧 **Email**: CTU-SematX Team

### Issue Template

When reporting issues:

```markdown
**Describe the issue**
Clear description of what's wrong

**Steps to reproduce**

1. Do this
2. Then this
3. See error

**Expected behavior**
What should happen

**Environment**

- OS: [e.g., Windows 11]
- Node: [e.g., 18.17.0]
- pnpm: [e.g., 8.6.0]
- Browser: [e.g., Chrome 115]

**Logs**
```

Paste relevant logs here

```

**Screenshots**
If applicable
```

---

**Still stuck?** Ask in [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions) - we're here to help!
