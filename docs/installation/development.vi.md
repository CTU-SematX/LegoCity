# Thiết lập Development Environment

Hướng dẫn hoàn chỉnh cho việc thiết lập một development environment để contribute vào LegoCity.

## Tổng quan

Hướng dẫn này dành cho developers muốn:

- 🛠️ Xây dựng features mới
- 🐛 Sửa bugs và issues
- 🧪 Viết và chạy tests
- 📦 Tạo custom blocks và plugins
- 🔍 Debug và profile code

## Điều kiện Tiên quyết

### Công cụ Bắt buộc

Cài đặt những công cụ này trước khi tiếp tục:

=== "Node.js & pnpm"

    ```bash
    # Kiểm tra phiên bản Node.js (cần 18.x hoặc 20.x)
    node --version

    # Cài đặt pnpm globally
    npm install -g pnpm

    # Xác minh pnpm
    pnpm --version
    ```

=== "Git"

    ```bash
    # Kiểm tra cài đặt Git
    git --version

    # Cấu hình Git
    git config --global user.name "Your Name"
    git config --global user.email "your.email@example.com"
    ```

=== "MongoDB"

    **Option 1: Cài đặt Local**
    ```bash
    # Windows (qua Chocolatey)
    choco install mongodb

    # macOS (qua Homebrew)
    brew install mongodb-community

    # Linux (Ubuntu/Debian)
    sudo apt install mongodb
    ```

    **Option 2: Docker**
    ```bash
    docker run -d -p 27017:27017 --name mongodb mongo:6
    ```

=== "VS Code (Được khuyến nghị)"

    Cài đặt Visual Studio Code với extensions:

    - ESLint
    - Prettier
    - TypeScript and JavaScript Language Features
    - Tailwind CSS IntelliSense
    - MongoDB for VS Code

### Công cụ Tùy chọn

Nâng cao trải nghiệm development của bạn:

- **Docker Desktop** - Cho containerized services
- **Postman** hoặc **Insomnia** - API testing
- **MongoDB Compass** - Database GUI
- **Redux DevTools** - State debugging

## Thiết lập Ban đầu

### 1. Fork & Clone Repository

```bash
# Fork trên GitHub trước, sau đó:
git clone https://github.com/YOUR_USERNAME/LegoCity.git
cd LegoCity

# Thêm upstream remote
git remote add upstream https://github.com/CTU-SematX/LegoCity.git

# Xác minh remotes
git remote -v
```

### 2. Cài đặt Dependencies

```bash
cd dashboard
pnpm install
```

Điều này cài đặt:

- Next.js framework
- PayloadCMS và plugins
- React và UI libraries
- Development tools

### 3. Thiết lập Environment

```bash
# Copy example env file
cp .env.example .env
```

Chỉnh sửa `.env` với development settings:

```env
# Database
DATABASE_URI=mongodb://127.0.0.1/legocity-dev

# Security (tạo với: openssl rand -hex 32)
PAYLOAD_SECRET=dev-secret-min-32-characters-long-replace-in-production

# Server
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Mapbox (lấy token từ mapbox.com)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token

# NGSI-LD Context Broker (nếu chạy locally)
NGSI_LD_BROKER_URL=http://localhost:1026

# Development
NODE_ENV=development
```

### 4. Khởi động Development Server

```bash
# Khởi động với hot reload
pnpm dev

# Hoặc với turbopack (nhanh hơn)
pnpm dev --turbo
```

Truy cập tại:

- Frontend: http://localhost:3000
- Admin: http://localhost:3000/admin
- API: http://localhost:3000/api

### 5. Tạo Admin Account

Khi lần đầu truy cập `/admin`, bạn sẽ tạo user đầu tiên:

```
Email: dev@example.com
Password: [chọn password mạnh]
```

## Development Workflow

### Branch Strategy

```bash
# Luôn bắt đầu từ main mới nhất
git checkout main
git pull upstream main

# Tạo feature branch
git checkout -b feature/your-feature-name

# Hoặc bug fix branch
git checkout -b fix/issue-123
```

### Thực hiện Thay đổi

1. **Edit Code** - Thực hiện thay đổi trong `dashboard/src/`
2. **Hot Reload** - Thay đổi xuất hiện tự động
3. **Check Console** - Theo dõi errors
4. **Test Changes** - Xác minh functionality hoạt động

### Code Style

LegoCity sử dụng ESLint và Prettier:

```bash
# Kiểm tra linting
pnpm lint

# Tự động sửa issues
pnpm lint:fix

# Format code
pnpm format
```

### Type Checking

```bash
# Kiểm tra TypeScript types
pnpm type-check

# Build để xác minh không có errors
pnpm build
```

## Cấu trúc Project

```
dashboard/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (frontend)/   # Public pages
│   │   └── (payload)/    # Admin routes
│   ├── blocks/           # PayloadCMS blocks
│   ├── collections/      # Content types
│   ├── components/       # React components
│   ├── fields/           # Custom fields
│   ├── hooks/            # React hooks
│   ├── plugins/          # PayloadCMS plugins
│   ├── providers/        # Context providers
│   └── utilities/        # Helper functions
├── public/               # Static assets
├── payload.config.ts     # Cấu hình CMS
└── next.config.js        # Cấu hình Next.js
```

## Development Tasks

### Thêm một Block Mới

1. Tạo block directory:

   ```bash
   mkdir -p src/blocks/MyBlock
   ```

2. Tạo config:

   ```typescript
   // src/blocks/MyBlock/config.ts
   import { Block } from "payload/types";

   export const MyBlock: Block = {
     slug: "myBlock",
     fields: [
       {
         name: "title",
         type: "text",
         required: true,
       },
     ],
   };
   ```

3. Tạo component:

   ```tsx
   // src/blocks/MyBlock/Component.tsx
   export const MyBlockComponent = ({ title }) => <div>{title}</div>;
   ```

4. Đăng ký trong `RenderBlocks.tsx`

Xem [Creating Blocks Guide](../development/blocks.md) cho chi tiết.

### Tạo một Collection

```typescript
// src/collections/MyCollection.ts
import { CollectionConfig } from "payload/types";

export const MyCollection: CollectionConfig = {
  slug: "my-collection",
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
  ],
};
```

Đăng ký trong `payload.config.ts`:

```typescript
collections: [
  // ... existing
  MyCollection,
],
```

### Viết Tests

```bash
# Chạy tất cả tests
pnpm test

# Chạy specific test
pnpm test blocks

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

Example test:

```typescript
// src/blocks/MyBlock/MyBlock.test.ts
import { render } from "@testing-library/react";
import { MyBlockComponent } from "./Component";

describe("MyBlock", () => {
  it("renders title", () => {
    const { getByText } = render(<MyBlockComponent title="Test" />);
    expect(getByText("Test")).toBeInTheDocument();
  });
});
```

## Debugging

### VS Code Debug Configuration

Tạo `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Browser DevTools

- **React DevTools** - Inspect component tree
- **Network Tab** - Debug API calls
- **Console** - Xem logs và errors

### Logging

```typescript
// Development logging
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", data);
}

// PayloadCMS logging
payload.logger.info("Info message");
payload.logger.error("Error message");
```

## Làm việc với MongoDB

### MongoDB Compass

Kết nối tới: `mongodb://127.0.0.1:27017/legocity-dev`

Xem và chỉnh sửa:

- Collections (Pages, Posts, Media, v.v.)
- Documents
- Indexes

### Command Line

```bash
# Kết nối tới database
mongosh legocity-dev

# Liệt kê collections
show collections

# Tìm documents
db.pages.find().pretty()

# Xóa collection
db.pages.deleteMany({})
```

### Seed Data

```bash
# Load sample data
pnpm seed

# Custom seed script
pnpm seed:custom
```

## Building & Testing

### Development Build

```bash
# Build cho development
pnpm build

# Khởi động production server
pnpm start
```

### Production Build

```bash
# Build tối ưu cho production
NODE_ENV=production pnpm build

# Phân tích bundle size
pnpm build --analyze
```

### Quality Checks

```bash
# Chạy tất cả checks trước khi commit
pnpm lint        # ESLint
pnpm type-check  # TypeScript
pnpm test        # Jest tests
pnpm build       # Production build
```

## Git Workflow

### Commit Changes

```bash
# Stage changes
git add .

# Commit với descriptive message
git commit -m "feat: add new block component"

# Tuân theo conventional commits:
# feat: feature mới
# fix: sửa bug
# docs: tài liệu
# style: formatting
# refactor: cấu trúc lại code
# test: thêm tests
# chore: maintenance
```

### Push & Tạo PR

```bash
# Push lên fork của bạn
git push origin feature/your-feature

# Tạo Pull Request trên GitHub
# Điền PR template
# Đợi review
```

### Giữ Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Cập nhật main branch
git checkout main
git merge upstream/main
git push origin main

# Rebase feature branch
git checkout feature/your-feature
git rebase main
```

## Common Issues

### Port 3000 Đã được Sử dụng

```bash
# Kill process
npx kill-port 3000

# Hoặc sử dụng port khác
PORT=3001 pnpm dev
```

### Build Errors

```bash
# Xóa cache
rm -rf .next node_modules
pnpm install
pnpm dev
```

### MongoDB Connection Issues

```bash
# Kiểm tra MongoDB đang chạy
mongosh --eval "db.version()"

# Khởi động lại MongoDB
# Windows: net restart MongoDB
# Linux: sudo systemctl restart mongod
```

### Type Errors

```bash
# Tạo lại Payload types
pnpm payload generate:types

# Kiểm tra tsconfig.json paths
```

## Best Practices

### Code Quality

✅ Viết TypeScript, tránh `any`  
✅ Tuân theo ESLint rules  
✅ Viết tests cho features mới  
✅ Document logic phức tạp

### Performance

✅ Sử dụng React Server Components khi có thể  
✅ Tối ưu images với `next/image`  
✅ Lazy load heavy components  
✅ Monitor bundle size

### Security

✅ Không bao giờ commit secrets  
✅ Validate user inputs  
✅ Sử dụng environment variables  
✅ Giữ dependencies updated

### Git

✅ Viết commit messages rõ ràng  
✅ Giữ PRs focused và nhỏ  
✅ Rebase trước khi push  
✅ Review PR của chính bạn trước

## Resources

- 📖 [Next.js Documentation](https://nextjs.org/docs)
- 📖 [PayloadCMS Documentation](https://payloadcms.com/docs)
- 📖 [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- 📖 [React Documentation](https://react.dev/)

## Getting Help

- 💬 [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)
- 🐛 [Report Issues](https://github.com/CTU-SematX/LegoCity/issues)
- 📧 Email: CTU-SematX Team

---

**Environment sẵn sàng?** Bắt đầu xây dựng với [Development Guide](../development/index.md).
