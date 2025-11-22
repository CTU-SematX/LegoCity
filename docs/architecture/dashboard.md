# Dashboard Architecture

This document details the architecture and design of the Lego City dashboard, built with Next.js and PayloadCMS.

## Overview

The dashboard is a modern web application that combines a headless CMS (PayloadCMS) with a Next.js frontend, providing content management and visualization capabilities for smart city data.

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **CMS**: PayloadCMS 3.x
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: MongoDB or PostgreSQL
- **Package Manager**: pnpm

## Project Structure

```
dashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (frontend)/        # Public pages
│   │   ├── (payload)/         # Admin panel
│   │   └── api/               # API routes
│   ├── collections/           # PayloadCMS collections
│   │   ├── Pages.ts          # Page collection
│   │   ├── Posts.ts          # Blog posts
│   │   ├── Media.ts          # Media library
│   │   ├── Users.ts          # User management
│   │   └── Categories.ts     # Content categories
│   ├── blocks/                # Layout builder blocks
│   │   ├── Hero.ts           # Hero block
│   │   ├── Content.ts        # Content block
│   │   ├── Media.ts          # Media block
│   │   └── CallToAction.ts   # CTA block
│   ├── components/            # React components
│   │   ├── blocks/           # Block renderers
│   │   ├── ui/               # UI components (shadcn)
│   │   └── common/           # Shared components
│   ├── globals/               # PayloadCMS globals
│   │   ├── Header.ts         # Header config
│   │   └── Footer.ts         # Footer config
│   ├── payload.config.ts      # Payload configuration
│   └── server.ts              # Server setup
├── public/                     # Static assets
├── .env.example               # Environment template
└── package.json               # Dependencies
```

## Core Concepts

### 1. Next.js App Router

Using the modern App Router for:

```
app/
├── (frontend)/              # Public site
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   ├── [slug]/             # Dynamic pages
│   └── posts/              # Blog
└── (payload)/              # Admin panel
    └── admin/              # PayloadCMS admin
```

**Benefits:**
- Server Components by default
- Nested layouts
- Streaming and Suspense
- Better performance

### 2. PayloadCMS Collections

Collections are content types:

```typescript
// Example: Pages collection
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [Hero, Content, Media, CallToAction],
    },
  ],
}
```

### 3. Layout Builder

Flexible page layouts with blocks:

```typescript
// Block definition
const Hero: Block = {
  slug: 'hero',
  fields: [
    { name: 'title', type: 'text' },
    { name: 'subtitle', type: 'text' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'ctaText', type: 'text' },
    { name: 'ctaLink', type: 'text' },
  ],
}
```

Rendering blocks:

```tsx
// Component
export const HeroBlock: React.FC<{ block: HeroBlockProps }> = ({ block }) => {
  return (
    <section className="hero">
      <h1>{block.title}</h1>
      <p>{block.subtitle}</p>
      <Image src={block.image.url} alt={block.title} />
      <Button href={block.ctaLink}>{block.ctaText}</Button>
    </section>
  )
}
```

## Data Flow

### Content Creation Flow

```
Admin User
    │
    ▼
Admin Panel (/admin)
    │
    ▼
PayloadCMS API
    │
    ▼
Database (MongoDB/PostgreSQL)
    │
    ▼
Content Saved
    │
    ▼
Revalidation Triggered
    │
    ▼
Next.js Regenerates Page
```

### Page Rendering Flow

```
User Request
    │
    ▼
Next.js Router
    │
    ▼
Fetch from Payload API
    │
    ▼
Server-Side Rendering
    │
    ▼
Stream HTML to Client
    │
    ▼
Client Hydration
```

## Authentication & Authorization

### User Authentication

```typescript
// PayloadCMS handles authentication
const Users: CollectionConfig = {
  slug: 'users',
  auth: true,  // Enable authentication
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: ({ req }) => req.user?.id,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'role', type: 'select', options: ['admin', 'editor', 'viewer'] },
  ],
}
```

### Access Control

```typescript
// Role-based access control
const isAdmin = ({ req: { user } }) => {
  return user?.role === 'admin'
}

const isEditor = ({ req: { user } }) => {
  return user?.role === 'admin' || user?.role === 'editor'
}

// Apply to collections
access: {
  read: () => true,  // Public
  create: isEditor,
  update: isEditor,
  delete: isAdmin,
}
```

## Content Collections

### Pages Collection

```typescript
{
  slug: 'pages',
  fields: [
    'title',
    'slug',
    'layout (blocks)',
    'meta (SEO)',
    '_status (draft/published)',
  ]
}
```

### Posts Collection

```typescript
{
  slug: 'posts',
  fields: [
    'title',
    'slug',
    'content (rich text)',
    'categories (relationship)',
    'publishedDate',
    'author (relationship)',
    '_status (draft/published)',
  ]
}
```

### Media Collection

```typescript
{
  slug: 'media',
  upload: true,
  fields: [
    'alt',
    'caption',
    'focalPoint',
    // Auto-generated: url, filename, mimeType, filesize, width, height
  ]
}
```

## Styling System

### TailwindCSS

Utility-first CSS framework:

```tsx
<div className="container mx-auto px-4 py-8">
  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
    Welcome
  </h1>
</div>
```

### shadcn/ui Components

Pre-built, customizable components:

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export function MyComponent() {
  return (
    <Card>
      <CardHeader>Title</CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

### Dark Mode

Automatic dark mode support:

```tsx
// Configured in tailwind.config.js
darkMode: 'class'

// Usage
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-white">Content</p>
</div>
```

## Performance Optimization

### Server Components

Default to Server Components for better performance:

```tsx
// This is a Server Component (default)
export default async function Page() {
  const data = await fetchData()  // Fetch on server
  
  return <div>{data.title}</div>
}
```

### Client Components

Use only when needed:

```tsx
'use client'  // Mark as Client Component

import { useState } from 'react'

export function InteractiveComponent() {
  const [count, setCount] = useState(0)
  
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### Image Optimization

Next.js Image component:

```tsx
import Image from 'next/image'

<Image
  src={media.url}
  alt={media.alt}
  width={800}
  height={600}
  priority  // For above-the-fold images
  placeholder="blur"  // Loading placeholder
/>
```

### Code Splitting

Automatic with dynamic imports:

```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
})
```

## SEO Optimization

### PayloadCMS SEO Plugin

Built-in SEO management:

```typescript
import { seo } from '@payloadcms/plugin-seo'

export default buildConfig({
  plugins: [
    seo({
      collections: ['pages', 'posts'],
      generateTitle: ({ doc }) => `${doc.title} | Lego City`,
      generateDescription: ({ doc }) => doc.excerpt,
    }),
  ],
})
```

### Next.js Metadata

```tsx
// app/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const page = await fetchPage(params.slug)
  
  return {
    title: page.meta?.title || page.title,
    description: page.meta?.description,
    openGraph: {
      title: page.meta?.ogTitle || page.title,
      description: page.meta?.ogDescription,
      images: [page.meta?.ogImage?.url],
    },
  }
}
```

## Draft Preview & Live Preview

### Draft Preview

Preview unpublished content:

```typescript
// Enable drafts
versions: {
  drafts: true,
}

// Preview URL
preview: async (doc) => {
  return `${process.env.NEXT_PUBLIC_SERVER_URL}/${doc.slug}?draft=true`
}
```

### Live Preview

Real-time editing:

```typescript
// Enable live preview
admin: {
  livePreview: {
    url: ({ data, documentInfo }) => {
      return `${process.env.NEXT_PUBLIC_SERVER_URL}/${data.slug}`
    },
  },
}
```

## Database Integration

### MongoDB

```typescript
import { mongooseAdapter } from '@payloadcms/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
})
```

### PostgreSQL

```typescript
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
})
```

### Migrations (PostgreSQL)

```bash
# Create migration
pnpm payload migrate:create

# Run migrations
pnpm payload migrate

# Rollback
pnpm payload migrate:down
```

## API Routes

### PayloadCMS REST API

Auto-generated REST API:

```
GET    /api/pages              # List pages
GET    /api/pages/:id          # Get page
POST   /api/pages              # Create page
PATCH  /api/pages/:id          # Update page
DELETE /api/pages/:id          # Delete page
```

### GraphQL API

Auto-generated GraphQL API:

```graphql
query {
  Pages {
    docs {
      id
      title
      slug
      layout {
        ... on Hero {
          blockType
          title
          subtitle
        }
      }
    }
  }
}
```

### Custom API Routes

```typescript
// app/api/custom/route.ts
export async function GET(request: Request) {
  const data = await fetchCustomData()
  return Response.json(data)
}
```

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react'
import { HeroBlock } from './HeroBlock'

test('renders hero block', () => {
  render(<HeroBlock block={mockHeroData} />)
  expect(screen.getByText('Hero Title')).toBeInTheDocument()
})
```

### Integration Tests

```typescript
import { test, expect } from 'vitest'

test('can create page', async () => {
  const response = await fetch('/api/pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test Page' }),
  })
  
  expect(response.ok).toBe(true)
})
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test('admin can create page', async ({ page }) => {
  await page.goto('/admin')
  await page.click('text=Pages')
  await page.click('text=Create New')
  await page.fill('input[name="title"]', 'Test Page')
  await page.click('button:has-text("Save")')
  
  await expect(page.locator('text=Test Page')).toBeVisible()
})
```

## Deployment

### Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables

```env
# Required
DATABASE_URI=mongodb://...
PAYLOAD_SECRET=...
NEXT_PUBLIC_SERVER_URL=https://...

# Optional
CRON_SECRET=...
PREVIEW_SECRET=...
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

### Docker

```dockerfile
FROM node:18-alpine AS base
RUN npm i -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000
CMD ["pnpm", "start"]
```

## Best Practices

✅ **Use TypeScript** for type safety
✅ **Server Components by default** for better performance
✅ **Optimize images** with Next.js Image
✅ **Implement proper access control** on collections
✅ **Use environment variables** for configuration
✅ **Enable caching** where appropriate
✅ **Write tests** for critical functionality
✅ **Monitor performance** with Lighthouse

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [PayloadCMS Documentation](https://payloadcms.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

For more information, see:
- [Architecture Overview](overview.md)
- [Development Guide](../../DEVELOPMENT.md)
- [Dashboard README](../../dashboard/README.md)
