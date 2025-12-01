# Xử lý sự cố

Hướng dẫn này giúp chẩn đoán và giải quyết các vấn đề phổ biến trong LegoCity.

---

## Chẩn đoán nhanh

### Kiểm tra trạng thái hệ thống

```bash
# Kiểm tra các dịch vụ đang chạy
docker compose ps

# Kiểm tra logs
docker compose logs dashboard
docker compose logs orion-ld

# Kiểm tra kết nối database
mongosh legocity --eval "db.stats()"

# Kiểm tra health endpoint
curl http://localhost:3000/api/health
```

### Lỗi phổ biến và giải pháp nhanh

| Triệu chứng                    | Nguyên nhân có thể           | Giải pháp nhanh                    |
| ------------------------------ | ---------------------------- | ---------------------------------- |
| Dashboard không load           | Biến môi trường thiếu        | Kiểm tra `.env` và restart         |
| Map trống                      | Mapbox token không hợp lệ    | Verify token trong `.env`          |
| API trả về 500                 | Database connection thất bại | Kiểm tra MongoDB đang chạy         |
| Admin panel 404                | Build không hoàn thành       | Chạy `pnpm build` và restart       |
| "Cannot find module"           | Dependencies thiếu           | Chạy `pnpm install`                |
| Port đã được sử dụng           | Ứng dụng khác đang chạy      | Đổi port hoặc kill process cũ      |
| TypeScript errors sau khi pull | Types đã thay đổi            | Chạy `pnpm payload generate:types` |
| Orion không phản hồi           | Container chưa sẵn sàng      | Đợi ~10s sau `docker compose up`   |

---

## Vấn đề cài đặt

### Node.js Version Mismatch

**Vấn đề**: Lỗi khi chạy `pnpm install` hoặc `pnpm dev`

**Nguyên nhân**: Node.js version không đúng (cần >= 18.17.0)

**Giải pháp**:

```bash
# Kiểm tra version hiện tại
node --version

# Nếu < 18.17.0, cài đặt Node.js mới
# Sử dụng nvm (recommended):
nvm install 18
nvm use 18

# Hoặc tải từ nodejs.org
```

### pnpm Not Found

**Vấn đề**: `pnpm: command not found`

**Giải pháp**:

```bash
# Cài đặt pnpm globally
npm install -g pnpm

# Hoặc sử dụng Corepack (Node 16.13+)
corepack enable
corepack prepare pnpm@latest --activate
```

### Docker Build Fails

**Vấn đề**: `docker compose build` thất bại

**Các bước debug**:

1. **Kiểm tra disk space**:

   ```bash
   df -h
   ```

2. **Clean Docker cache**:

   ```bash
   docker system prune -a
   docker volume prune
   ```

3. **Build với output chi tiết**:

   ```bash
   docker compose build --no-cache --progress=plain
   ```

4. **Check Docker daemon**:
   ```bash
   docker info
   ```

### MongoDB Connection Error

**Vấn đề**: `MongoNetworkError: connect ECONNREFUSED`

**Giải pháp**:

1. **Kiểm tra MongoDB đang chạy**:

   ```bash
   # Với Docker
   docker compose ps mongodb

   # Local MongoDB
   sudo systemctl status mongod
   ```

2. **Kiểm tra DATABASE_URI**:

   ```env
   # Phải match với Docker service name
   DATABASE_URI=mongodb://mongodb:27017/legocity
   ```

3. **Khởi động lại MongoDB**:
   ```bash
   docker compose restart mongodb
   ```

---

## Vấn đề khi Development

### Build Failures

**Vấn đề**: `pnpm build` thất bại với lỗi TypeScript hoặc compilation

**Giải pháp**:

1. **Regenerate types**:

   ```bash
   pnpm payload generate:types
   ```

2. **Clear cache**:

   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```

3. **Out of memory**:

   ```bash
   # Tăng Node memory
   NODE_OPTIONS="--max-old-space-size=4096" pnpm build
   ```

4. **Module not found**:
   ```bash
   # Cài đặt lại dependencies
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

---

## Vấn đề Runtime

### Màn hình trắng / Trang trống

**Vấn đề**: Trang load nhưng không hiển thị gì

**Các bước debug**:

1. **Kiểm tra browser console** để tìm lỗi JavaScript

2. **Kiểm tra Network tab** để tìm request thất bại

3. **Verify environment variables**:

   ```bash
   # Các biến bắt buộc đã set?
   echo $DATABASE_URI
   echo $PAYLOAD_SECRET
   echo $NEXT_PUBLIC_SERVER_URL
   ```

4. **Kiểm tra server logs**:
   ```bash
   pnpm dev
   # Tìm lỗi trong terminal
   ```

### Map không hiển thị

**Vấn đề**: Khu vực map trống hoặc hiển thị lỗi

**Giải pháp**:

1. **Verify Mapbox token**:

   ```bash
   # Kiểm tra token đã set
   echo $NEXT_PUBLIC_MAPBOX_TOKEN

   # Test token
   curl "https://api.mapbox.com/v4/mapbox.mapbox-streets-v8.json?access_token=$NEXT_PUBLIC_MAPBOX_TOKEN"
   ```

2. **Kiểm tra console để tìm lỗi**:

   - Mở browser DevTools → Console
   - Tìm lỗi liên quan đến Mapbox

3. **Verify token scope**:
   - Token phải có quyền `styles:read` và `fonts:read`
   - Tạo token mới tại [mapbox.com](https://account.mapbox.com/access-tokens/)

### Admin Panel 404

**Vấn đề**: Route `/admin` không tìm thấy

**Giải pháp**:

1. **Rebuild application**:

   ```bash
   rm -rf .next
   pnpm build
   pnpm start
   ```

2. **Kiểm tra Payload config**:

   ```typescript
   // payload.config.ts
   admin: {
     autoLogin: false,  // Phải là false trong production
   }
   ```

3. **Verify admin routes tồn tại**:
   ```bash
   ls src/app/\(payload\)/admin
   ```

### API Route trả về 500

**Vấn đề**: API endpoint throw server error

**Debug**:

1. **Kiểm tra server logs** để tìm chi tiết lỗi

2. **Test với curl**:

   ```bash
   curl -v http://localhost:3000/api/your-endpoint
   ```

3. **Thêm logging**:
   ```typescript
   export async function GET(req: Request) {
     try {
       console.log("Request:", req.url);
       // ... code của bạn
     } catch (error) {
       console.error("Error:", error);
       return Response.json({ error: error.message }, { status: 500 });
     }
   }
   ```

---

## Vấn đề Database

### Database Connection chậm

**Vấn đề**: Queries chậm hoặc timeout

**Giải pháp**:

1. **Thêm indexes**:

   ```javascript
   // Trong MongoDB shell
   db.pages.createIndex({ slug: 1 });
   db.posts.createIndex({ publishedAt: -1 });
   ```

2. **Monitor slow queries**:

   ```javascript
   db.setProfilingLevel(2);
   db.system.profile.find().sort({ ts: -1 }).limit(10);
   ```

3. **Kiểm tra database stats**:
   ```bash
   mongosh legocity --eval "db.stats()"
   ```

### Collection Not Found

**Vấn đề**: `Collection 'pages' not found`

**Giải pháp**:

1. **Kiểm tra collection name** khớp với config:

   ```typescript
   // collections/Pages.ts
   slug: "pages"; // Phải khớp
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

**Vấn đề**: Schema changes không được áp dụng

**Giải pháp**:

```bash
# Backup trước!
mongodump --db legocity --out ./backup

# Drop và recreate
mongosh legocity --eval "db.dropDatabase()"
pnpm seed

# Hoặc restore backup
mongorestore --db legocity ./backup/legocity
```

---

## Vấn đề Docker

### Container thoát ngay lập tức

**Vấn đề**: Docker container khởi động rồi dừng

**Debug**:

```bash
# Kiểm tra logs
docker compose logs dashboard

# Kiểm tra lỗi trong build
docker compose build --no-cache dashboard

# Chạy interactive
docker compose run --rm dashboard sh
```

### Không thể kết nối tới Service

**Vấn đề**: Frontend không thể reach MongoDB/Orion

**Giải pháp**:

1. **Sử dụng service names**, không phải localhost:

   ```env
   # ❌ Sai
   DATABASE_URI=mongodb://localhost:27017/legocity

   # ✅ Đúng
   DATABASE_URI=mongodb://mongodb:27017/legocity
   ```

2. **Kiểm tra network**:

   ```bash
   docker compose ps
   docker network ls
   ```

3. **Test connectivity**:
   ```bash
   docker compose exec dashboard ping mongodb
   ```

### Volume Permission Issues

**Vấn đề**: Permission denied errors (Linux)

**Giải pháp**:

```bash
# Fix ownership
sudo chown -R $USER:$USER ./dashboard

# Hoặc chạy với current user
docker compose run --user "$(id -u):$(id -g)" dashboard pnpm dev
```

---

## Vấn đề Production

### 502 Bad Gateway

**Vấn đề**: Nginx hiển thị lỗi 502

**Giải pháp**:

1. **Kiểm tra app đang chạy**:

   ```bash
   pm2 status
   # Hoặc
   systemctl status legocity
   ```

2. **Kiểm tra Nginx config**:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Kiểm tra logs**:

   ```bash
   # App logs
   pm2 logs

   # Nginx logs
   sudo tail -f /var/log/nginx/error.log
   ```

### Memory Leak

**Vấn đề**: Memory usage của ứng dụng tăng liên tục

**Giải pháp**:

1. **Monitor memory**:

   ```bash
   # PM2 monitoring
   pm2 monit

   # Hoặc sử dụng htop
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
   # Sử dụng Chrome DevTools để profile
   ```

### SSL Certificate Issues

**Vấn đề**: HTTPS không hoạt động hoặc lỗi certificate

**Giải pháp**:

1. **Kiểm tra certificate validity**:

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

---

## Vấn đề Performance

### Trang load chậm

**Vấn đề**: Các trang mất quá nhiều thời gian để load

**Giải pháp**:

1. **Enable caching**:

   ```typescript
   // app/page.tsx
   export const revalidate = 60; // ISR mỗi 60s
   ```

2. **Optimize images**:

   ```tsx
   import Image from "next/image";

   <Image src="/image.jpg" width={800} height={600} alt="Description" />;
   ```

3. **Sử dụng dynamic imports**:

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

**Vấn đề**: CPU tăng cao trong hoạt động bình thường

**Kiểm tra**:

1. **Profile application**:

   ```bash
   node --prof node_modules/next/dist/bin/next start
   node --prof-process isolate-*.log > profile.txt
   ```

2. **Kiểm tra infinite loops** trong code

3. **Monitor processes**:
   ```bash
   top -p $(pgrep node)
   ```

---

## Nhận thêm trợ giúp

### Thu thập thông tin chẩn đoán

Trước khi yêu cầu trợ giúp, thu thập:

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

### Nơi nhận trợ giúp

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/CTU-SematX/LegoCity/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)
- 📖 **Documentation**: [LegoCity Docs](https://ctu-sematx.github.io/LegoCity)
- 📧 **Email**: CTU-SematX Team

### Issue Template

Khi báo cáo issues:

```markdown
**Mô tả vấn đề**
Mô tả rõ ràng điều gì sai

**Các bước tái hiện**

1. Làm việc này
2. Rồi làm việc này
3. Thấy lỗi

**Hành vi mong đợi**
Điều gì nên xảy ra

**Môi trường**

- OS: [ví dụ: Windows 11]
- Node: [ví dụ: 18.17.0]
- pnpm: [ví dụ: 8.6.0]
- Browser: [ví dụ: Chrome 115]

**Logs**
```

Paste logs liên quan ở đây

```

**Screenshots**
Nếu có
```

---

**Vẫn bị stuck?** Hỏi trong [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions) - chúng tôi ở đây để giúp đỡ!
