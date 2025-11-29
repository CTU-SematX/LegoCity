# Development Environment Setup

Complete guide for setting up a development environment to contribute to LegoCity.

## Overview

This guide is for developers who want to:

- 🛠️ Build new features
- 🐛 Fix bugs and issues
- 🧪 Write and run tests
- 📦 Create custom blocks and plugins
- 🔍 Debug and profile code

## Prerequisites

### Required Tools

Install these before proceeding:

=== "Node.js & pnpm"

    ```bash
    # Check Node.js version (need 18.x or 20.x)
    node --version

    # Install pnpm globally
    npm install -g pnpm

    # Verify pnpm
    pnpm --version
    ```

=== "Git"

    ```bash
    # Check Git installation
    git --version

    # Configure Git
    git config --global user.name "Your Name"
    git config --global user.email "your.email@example.com"
    ```

=== "MongoDB"

    **Option 1: Local Installation**
    ```bash
    # Windows (via Chocolatey)
    choco install mongodb

    # macOS (via Homebrew)
    brew install mongodb-community

    # Linux (Ubuntu/Debian)
    sudo apt install mongodb
    ```

    **Option 2: Docker**
    ```bash
    docker run -d -p 27017:27017 --name mongodb mongo:6
    ```

=== "VS Code (Recommended)"

    Install Visual Studio Code with extensions:

    - ESLint
    - Prettier
    - TypeScript and JavaScript Language Features
    - Tailwind CSS IntelliSense
    - MongoDB for VS Code

### Optional Tools

Enhance your development experience:

- **Docker Desktop** - For containerized services
- **Postman** or **Insomnia** - API testing
- **MongoDB Compass** - Database GUI
- **Redux DevTools** - State debugging

## Initial Setup

### 1. Fork & Clone Repository

```bash
# Fork on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/LegoCity.git
cd LegoCity

# Add upstream remote
git remote add upstream https://github.com/CTU-SematX/LegoCity.git

# Verify remotes
git remote -v
```

### 2. Install Dependencies

```bash
cd dashboard
pnpm install
```

This installs:

- Next.js framework
- PayloadCMS and plugins
- React and UI libraries
- Development tools

### 3. Set Up Environment

```bash
# Copy example env file
cp .env.example .env
```

Edit `.env` with development settings:

```env
# Database
DATABASE_URI=mongodb://127.0.0.1/legocity-dev

# Security (generate with: openssl rand -hex 32)
PAYLOAD_SECRET=dev-secret-min-32-characters-long-replace-in-production

# Server
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Mapbox (get token from mapbox.com)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token

# NGSI-LD Context Broker (if running locally)
NGSI_LD_BROKER_URL=http://localhost:1026

# Development
NODE_ENV=development
```

### 4. Start Development Server

```bash
# Start with hot reload
pnpm dev

# Or with turbopack (faster)
pnpm dev --turbo
```

Access at:

- Frontend: http://localhost:3000
- Admin: http://localhost:3000/admin
- API: http://localhost:3000/api

### 5. Create Admin Account

On first visit to `/admin`, you'll create the first user:

```
Email: dev@example.com
Password: [choose strong password]
```

## Development Workflow

### Branch Strategy

```bash
# Always start from latest main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or bug fix branch
git checkout -b fix/issue-123
```

### Making Changes

1. **Edit Code** - Make your changes in `dashboard/src/`
2. **Hot Reload** - Changes appear automatically
3. **Check Console** - Watch for errors
4. **Test Changes** - Verify functionality works

### Code Style

LegoCity uses ESLint and Prettier:

```bash
# Check linting
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Format code
pnpm format
```

### Type Checking

```bash
# Check TypeScript types
pnpm type-check

# Build to verify no errors
pnpm build
```

## Project Structure

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
├── payload.config.ts     # CMS configuration
└── next.config.js        # Next.js config
```

## Development Tasks

### Adding a New Block

1. Create block directory:

   ```bash
   mkdir -p src/blocks/MyBlock
   ```

2. Create config:

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

3. Create component:

   ```tsx
   // src/blocks/MyBlock/Component.tsx
   export const MyBlockComponent = ({ title }) => <div>{title}</div>;
   ```

4. Register in `RenderBlocks.tsx`

See [Creating Blocks Guide](../development/blocks.md) for details.

### Creating a Collection

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

Register in `payload.config.ts`:

```typescript
collections: [
  // ... existing
  MyCollection,
],
```

### Writing Tests

```bash
# Run all tests
pnpm test

# Run specific test
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

Create `.vscode/launch.json`:

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
- **Console** - View logs and errors

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

## Working with MongoDB

### MongoDB Compass

Connect to: `mongodb://127.0.0.1:27017/legocity-dev`

View and edit:

- Collections (Pages, Posts, Media, etc.)
- Documents
- Indexes

### Command Line

```bash
# Connect to database
mongosh legocity-dev

# List collections
show collections

# Find documents
db.pages.find().pretty()

# Clear collection
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
# Build for development
pnpm build

# Start production server
pnpm start
```

### Production Build

```bash
# Build optimized for production
NODE_ENV=production pnpm build

# Analyze bundle size
pnpm build --analyze
```

### Quality Checks

```bash
# Run all checks before committing
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

# Commit with descriptive message
git commit -m "feat: add new block component"

# Follow conventional commits:
# feat: new feature
# fix: bug fix
# docs: documentation
# style: formatting
# refactor: code restructuring
# test: adding tests
# chore: maintenance
```

### Push & Create PR

```bash
# Push to your fork
git push origin feature/your-feature

# Create Pull Request on GitHub
# Fill out PR template
# Wait for review
```

### Keep Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Update main branch
git checkout main
git merge upstream/main
git push origin main

# Rebase feature branch
git checkout feature/your-feature
git rebase main
```

## Common Issues

### Port 3000 Already in Use

```bash
# Kill process
npx kill-port 3000

# Or use different port
PORT=3001 pnpm dev
```

### Build Errors

```bash
# Clear cache
rm -rf .next node_modules
pnpm install
pnpm dev
```

### MongoDB Connection Issues

```bash
# Check MongoDB is running
mongosh --eval "db.version()"

# Restart MongoDB
# Windows: net restart MongoDB
# Linux: sudo systemctl restart mongod
```

### Type Errors

```bash
# Regenerate Payload types
pnpm payload generate:types

# Check tsconfig.json paths
```

## Best Practices

### Code Quality

✅ Write TypeScript, avoid `any`  
✅ Follow ESLint rules  
✅ Write tests for new features  
✅ Document complex logic

### Performance

✅ Use React Server Components when possible  
✅ Optimize images with `next/image`  
✅ Lazy load heavy components  
✅ Monitor bundle size

### Security

✅ Never commit secrets  
✅ Validate user inputs  
✅ Use environment variables  
✅ Keep dependencies updated

### Git

✅ Write clear commit messages  
✅ Keep PRs focused and small  
✅ Rebase before pushing  
✅ Review your own PR first

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

**Environment ready?** Start building with the [Development Guide](../development/index.md).
