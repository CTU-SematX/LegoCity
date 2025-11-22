# Lego City Dashboard

A modern web dashboard for the Lego City smart city platform, built with PayloadCMS and Next.js.

## Overview

The dashboard provides a powerful content management system and visualization interface for your smart city data. It features:

- **PayloadCMS**: Enterprise-grade headless CMS
- **Next.js 14+**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Modern, responsive styling
- **Layout Builder**: Create custom page layouts
- **Live Preview**: Real-time content preview
- **SEO Optimized**: Built-in SEO plugin
- **Dark Mode**: Automatic dark mode support

## Quick Start

### Prerequisites

- Node.js 18 or higher
- pnpm package manager
- MongoDB or PostgreSQL database

### Installation

1. Install pnpm (if not already installed):
   ```bash
   npm install -g pnpm
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` file:
   ```env
   DATABASE_URI=mongodb://127.0.0.1/legocity
   PAYLOAD_SECRET=your-secret-here
   NEXT_PUBLIC_SERVER_URL=http://localhost:3000
   CRON_SECRET=your-cron-secret-here
   PREVIEW_SECRET=your-preview-secret-here
   ```

4. Install dependencies:
   ```bash
   pnpm install
   ```

5. Run in development mode:
   ```bash
   pnpm dev
   ```

6. Open your browser to `http://localhost:3000`

### First-Time Setup

After starting the development server:

1. Visit `http://localhost:3000/admin`
2. Create your first admin user
3. (Optional) Click "Seed Database" to populate with sample data

**Demo User** (if database is seeded):
- Email: `demo-author@payloadcms.com`
- Password: `password`

⚠️ **Warning**: Seeding is destructive and will replace all existing data!

## Development

### Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix linting issues
pnpm test             # Run all tests
pnpm test:int         # Run integration tests
pnpm test:e2e         # Run E2E tests
```

### Project Structure

```
dashboard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── collections/            # PayloadCMS collections
│   │   ├── Pages.ts           # Page collection
│   │   ├── Posts.ts           # Blog posts
│   │   ├── Users.ts           # User management
│   │   └── Media.ts           # Media library
│   ├── components/             # React components
│   ├── payload.config.ts       # Payload configuration
│   └── ...
├── public/                     # Static assets
├── .env.example               # Environment template
└── package.json
```

## Features

### Collections

The dashboard includes these pre-configured collections:

#### Users
- Authentication-enabled
- Access control for admin panel
- Can manage all content

#### Pages
- Layout builder enabled
- Draft preview support
- SEO optimization
- Version history

#### Posts
- Blog post management
- Layout builder blocks
- Category support
- Draft and publish workflow

#### Media
- Image upload and management
- Automatic image optimization
- Focal point selection
- Multiple size variants

#### Categories
- Nested taxonomy
- Group posts and content
- Hierarchical organization

### Globals

- **Header**: Navigation and branding configuration
- **Footer**: Footer links and content

### Layout Builder

Create custom layouts using these blocks:

- **Hero**: Eye-catching hero sections
- **Content**: Rich text content blocks
- **Media**: Image and video blocks
- **Call to Action**: CTA buttons and sections
- **Archive**: Dynamic content archives

### Access Control

- Public users can view published content
- Authenticated users can create and edit content
- Draft content is only visible to authenticated users

## Database Options

### MongoDB (Default)

```env
DATABASE_URI=mongodb://127.0.0.1/legocity
```

Start MongoDB:
```bash
# macOS
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

### PostgreSQL

```env
DATABASE_URI=postgresql://127.0.0.1:5432/legocity
```

When using PostgreSQL, you need to run migrations:

```bash
# Create migration
pnpm payload migrate:create

# Run migrations
pnpm payload migrate
```

⚠️ **Important**: Set `push: false` in production to avoid data loss!

## Production Deployment

### Build and Run

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

The application runs on port 3000 by default.

### Vercel Deployment

This template is optimized for Vercel:

1. Install Vercel database adapters:
   ```bash
   pnpm add @payloadcms/db-vercel-postgres
   pnpm add @payloadcms/storage-vercel-blob
   ```

2. Configure `payload.config.ts` with Vercel adapters

3. Deploy with one-click: [Deploy to Vercel](https://github.com/payloadcms/payload/tree/templates/with-vercel-postgres)

### Self-Hosting

Deploy to any Node.js-compatible platform:

- VPS (Digital Ocean, Linode, AWS EC2)
- Platform-as-a-Service (Render, Railway, Fly.io)
- Container platforms (Docker, Kubernetes)

See [PayloadCMS deployment docs](https://payloadcms.com/docs/production/deployment) for details.

### Docker

```bash
# Build image
docker build -t legocity-dashboard .

# Run container
docker run -p 3000:3000 --env-file .env legocity-dashboard
```

Or use docker-compose:

```bash
docker-compose up
```

## Features Deep Dive

### Draft Preview

All pages and posts support draft previews:

1. Create content in draft mode
2. Click "Preview" to see how it looks
3. Publish when ready

The preview system uses secure tokens and works with statically generated sites.

### Live Preview

Edit content and see changes in real-time with SSR support.

### SEO Plugin

Built-in SEO management:

- Meta titles and descriptions
- Open Graph tags
- Twitter Card support
- Automatic sitemap generation

### Search Plugin

Full-text search across your content with SSR support.

### Redirects

Manage URL redirects from the admin panel:

- Proper HTTP status codes
- SEO-friendly redirects
- Migrate from old URLs

### Scheduled Publishing

Schedule content to publish or unpublish at specific times using the jobs queue.

⚠️ **Note**: Vercel's free tier may limit cron to daily execution.

### Caching Strategy

For Payload Cloud:
- Cloudflare caching is enabled
- Next.js caching is disabled

For self-hosting:
- Remove `no-store` from fetch requests in `./src/app/_api`
- Remove `export const dynamic = 'force-dynamic'` from page files
- See [Next.js Caching Docs](https://nextjs.org/docs/app/building-your-application/caching)

## Customization

### Styling

The dashboard uses TailwindCSS and shadcn/ui components:

- Customize theme in `tailwind.config.js`
- Modify components in `src/components/`
- Override Payload styles in `src/styles/`

### Collections

Add new collections or modify existing ones:

1. Create/edit files in `src/collections/`
2. Import in `payload.config.ts`
3. Restart dev server

### Layout Blocks

Create custom layout blocks:

1. Define block schema in `src/blocks/`
2. Create React component for rendering
3. Register in collection config

## Troubleshooting

### Common Issues

**Database connection failed**
```bash
# Check database is running
# MongoDB:
brew services list | grep mongodb
# or start it:
brew services start mongodb-community
```

**Module not found errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules .next
pnpm install
```

**Build errors after updates**
```bash
# Clear Next.js cache
rm -rf .next
pnpm build
```

**Port 3000 already in use**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill
# Or change port in package.json
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* pnpm dev

# Or use Next.js debug mode
NODE_OPTIONS='--inspect' pnpm dev
```

## Testing

### Integration Tests

```bash
pnpm test:int
```

### End-to-End Tests

```bash
# Run Playwright E2E tests
pnpm test:e2e

# Run in UI mode
pnpm exec playwright test --ui
```

## API Reference

PayloadCMS provides a REST API and GraphQL API:

- **REST API**: `http://localhost:3000/api`
- **GraphQL**: `http://localhost:3000/api/graphql`

See [Payload API docs](https://payloadcms.com/docs/rest-api/overview) for details.

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) and [DEVELOPMENT.md](../DEVELOPMENT.md) for guidelines.

## Resources

- [PayloadCMS Documentation](https://payloadcms.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

## License

This dashboard is part of the Lego City project and is licensed under the Apache License 2.0 - see the [LICENSE](../LICENSE) file for details.

---

# Original Payload Website Template Documentation

Below is the original documentation from the PayloadCMS website template:

---

# Payload Website Template

This is the official [Payload Website Template](https://github.com/payloadcms/payload/blob/main/templates/website). Use it to power websites, blogs, or portfolios from small to enterprise. This repo includes a fully-working backend, enterprise-grade admin panel, and a beautifully designed, production-ready website.

This template is right for you if you are working on:

- A personal or enterprise-grade website, blog, or portfolio
- A content publishing platform with a fully featured publication workflow
- Exploring the capabilities of Payload

Core features:

- [Pre-configured Payload Config](#how-it-works)
- [Authentication](#users-authentication)
- [Access Control](#access-control)
- [Layout Builder](#layout-builder)
- [Draft Preview](#draft-preview)
- [Live Preview](#live-preview)
- [On-demand Revalidation](#on-demand-revalidation)
- [SEO](#seo)
- [Search](#search)
- [Redirects](#redirects)
- [Jobs and Scheduled Publishing](#jobs-and-scheduled-publish)
- [Website](#website)

## Quick Start

To spin up this example locally, follow these steps:

### Clone

If you have not done so already, you need to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

Use the `create-payload-app` CLI to clone this template directly to your machine:

```bash
pnpx create-payload-app my-project -t website
```

### Development

1. First [clone the repo](#clone) if you have not done so already
1. `cd my-project && cp .env.example .env` to copy the example environment variables
1. `pnpm install && pnpm dev` to install dependencies and start the dev server
1. open `http://localhost:3000` to open the app in your browser

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user. Then check out [Production](#production) once you're ready to build and serve your app, and [Deployment](#deployment) when you're ready to go live.

## How it works

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled collections that have access to the admin panel and unpublished content. See [Access Control](#access-control) for more details.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Posts

  Posts are used to generate blog posts, news articles, or any other type of content that is published over time. All posts are layout builder enabled so you can generate unique layouts for each post using layout-building blocks, see [Layout Builder](#layout-builder) for more details. Posts are also draft-enabled so you can preview them before publishing them to your website, see [Draft Preview](#draft-preview) for more details.

- #### Pages

  All pages are layout builder enabled so you can generate unique layouts for each page using layout-building blocks, see [Layout Builder](#layout-builder) for more details. Pages are also draft-enabled so you can preview them before publishing them to your website, see [Draft Preview](#draft-preview) for more details.

- #### Media

  This is the uploads enabled collection used by pages, posts, and projects to contain media like images, videos, downloads, and other assets. It features pre-configured sizes, focal point and manual resizing to help you manage your pictures.

- #### Categories

  A taxonomy used to group posts together. Categories can be nested inside of one another, for example "News > Technology". See the official [Payload Nested Docs Plugin](https://payloadcms.com/docs/plugins/nested-docs) for more details.

### Globals

See the [Globals](https://payloadcms.com/docs/configuration/globals) docs for details on how to extend this functionality.

- `Header`

  The data required by the header on your front-end like nav links.

- `Footer`

  Same as above but for the footer of your site.

## Access control

Basic access control is setup to limit access to various content based based on publishing status.

- `users`: Users can access the admin panel and create or edit content.
- `posts`: Everyone can access published posts, but only users can create, update, or delete them.
- `pages`: Everyone can access published pages, but only users can create, update, or delete them.

For more details on how to extend this functionality, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview#access-control) docs.

## Layout Builder

Create unique page layouts for any type of content using a powerful layout builder. This template comes pre-configured with the following layout building blocks:

- Hero
- Content
- Media
- Call To Action
- Archive

Each block is fully designed and built into the front-end website that comes with this template. See [Website](#website) for more details.

## Lexical editor

A deep editorial experience that allows complete freedom to focus just on writing content without breaking out of the flow with support for Payload blocks, media, links and other features provided out of the box. See [Lexical](https://payloadcms.com/docs/rich-text/overview) docs.

## Draft Preview

All posts and pages are draft-enabled so you can preview them before publishing them to your website. To do this, these collections use [Versions](https://payloadcms.com/docs/configuration/collections#versions) with `drafts` set to `true`. This means that when you create a new post, project, or page, it will be saved as a draft and will not be visible on your website until you publish it. This also means that you can preview your draft before publishing it to your website. To do this, we automatically format a custom URL which redirects to your front-end to securely fetch the draft version of your content.

Since the front-end of this template is statically generated, this also means that pages, posts, and projects will need to be regenerated as changes are made to published documents. To do this, we use an `afterChange` hook to regenerate the front-end when a document has changed and its `_status` is `published`.

For more details on how to extend this functionality, see the official [Draft Preview Example](https://github.com/payloadcms/payload/tree/examples/draft-preview).

## Live preview

In addition to draft previews you can also enable live preview to view your end resulting page as you're editing content with full support for SSR rendering. See [Live preview docs](https://payloadcms.com/docs/live-preview/overview) for more details.

## On-demand Revalidation

We've added hooks to collections and globals so that all of your pages, posts, footer, or header changes will automatically be updated in the frontend via on-demand revalidation supported by Nextjs.

> Note: if an image has been changed, for example it's been cropped, you will need to republish the page it's used on in order to be able to revalidate the Nextjs image cache.

## SEO

This template comes pre-configured with the official [Payload SEO Plugin](https://payloadcms.com/docs/plugins/seo) for complete SEO control from the admin panel. All SEO data is fully integrated into the front-end website that comes with this template. See [Website](#website) for more details.

## Search

This template also pre-configured with the official [Payload Search Plugin](https://payloadcms.com/docs/plugins/search) to showcase how SSR search features can easily be implemented into Next.js with Payload. See [Website](#website) for more details.

## Redirects

If you are migrating an existing site or moving content to a new URL, you can use the `redirects` collection to create a proper redirect from old URLs to new ones. This will ensure that proper request status codes are returned to search engines and that your users are not left with a broken link. This template comes pre-configured with the official [Payload Redirects Plugin](https://payloadcms.com/docs/plugins/redirects) for complete redirect control from the admin panel. All redirects are fully integrated into the front-end website that comes with this template. See [Website](#website) for more details.

## Jobs and Scheduled Publish

We have configured [Scheduled Publish](https://payloadcms.com/docs/versions/drafts#scheduled-publish) which uses the [jobs queue](https://payloadcms.com/docs/jobs-queue/jobs) in order to publish or unpublish your content on a scheduled time. The tasks are run on a cron schedule and can also be run as a separate instance if needed.

> Note: When deployed on Vercel, depending on the plan tier, you may be limited to daily cron only.

## Website

This template includes a beautifully designed, production-ready front-end built with the [Next.js App Router](https://nextjs.org), served right alongside your Payload app in a instance. This makes it so that you can deploy both your backend and website where you need it.

Core features:

- [Next.js App Router](https://nextjs.org)
- [TypeScript](https://www.typescriptlang.org)
- [React Hook Form](https://react-hook-form.com)
- [Payload Admin Bar](https://github.com/payloadcms/payload/tree/main/packages/admin-bar)
- [TailwindCSS styling](https://tailwindcss.com/)
- [shadcn/ui components](https://ui.shadcn.com/)
- User Accounts and Authentication
- Fully featured blog
- Publication workflow
- Dark mode
- Pre-made layout building blocks
- SEO
- Search
- Redirects
- Live preview

### Cache

Although Next.js includes a robust set of caching strategies out of the box, Payload Cloud proxies and caches all files through Cloudflare using the [Official Cloud Plugin](https://www.npmjs.com/package/@payloadcms/payload-cloud). This means that Next.js caching is not needed and is disabled by default. If you are hosting your app outside of Payload Cloud, you can easily reenable the Next.js caching mechanisms by removing the `no-store` directive from all fetch requests in `./src/app/_api` and then removing all instances of `export const dynamic = 'force-dynamic'` from pages files, such as `./src/app/(pages)/[slug]/page.tsx`. For more details, see the official [Next.js Caching Docs](https://nextjs.org/docs/app/building-your-application/caching).

## Development

To spin up this example locally, follow the [Quick Start](#quick-start). Then [Seed](#seed) the database with a few pages, posts, and projects.

### Working with Postgres

Postgres and other SQL-based databases follow a strict schema for managing your data. In comparison to our MongoDB adapter, this means that there's a few extra steps to working with Postgres.

Note that often times when making big schema changes you can run the risk of losing data if you're not manually migrating it.

#### Local development

Ideally we recommend running a local copy of your database so that schema updates are as fast as possible. By default the Postgres adapter has `push: true` for development environments. This will let you add, modify and remove fields and collections without needing to run any data migrations.

If your database is pointed to production you will want to set `push: false` otherwise you will risk losing data or having your migrations out of sync.

#### Migrations

[Migrations](https://payloadcms.com/docs/database/migrations) are essentially SQL code versions that keeps track of your schema. When deploy with Postgres you will need to make sure you create and then run your migrations.

Locally create a migration

```bash
pnpm payload migrate:create
```

This creates the migration files you will need to push alongside with your new configuration.

On the server after building and before running `pnpm start` you will want to run your migrations

```bash
pnpm payload migrate
```

This command will check for any migrations that have not yet been run and try to run them and it will keep a record of migrations that have been run in the database.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

### Seed

To seed the database with a few pages, posts, and projects you can click the 'seed database' link from the admin panel.

The seed script will also create a demo user for demonstration purposes only:

- Demo Author
  - Email: `demo-author@payloadcms.com`
  - Password: `password`

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and start the Admin panel. To do so, follow these steps:

1. Invoke the `next build` script by running `pnpm build` or `npm run build` in your project root. This creates a `.next` directory with a production-ready admin bundle.
1. Finally run `pnpm start` or `npm run start` to run Node in production and serve Payload from the `.build` directory.
1. When you're ready to go live, see Deployment below for more details.

### Deploying to Vercel

This template can also be deployed to Vercel for free. You can get started by choosing the Vercel DB adapter during the setup of the template or by manually installing and configuring it:

```bash
pnpm add @payloadcms/db-vercel-postgres
```

```ts
// payload.config.ts
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'

export default buildConfig({
  // ...
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
  }),
  // ...
```

We also support Vercel's blob storage:

```bash
pnpm add @payloadcms/storage-vercel-blob
```

```ts
// payload.config.ts
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

export default buildConfig({
  // ...
  plugins: [
    vercelBlobStorage({
      collections: {
        [Media.slug]: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
  // ...
```

There is also a simplified [one click deploy](https://github.com/payloadcms/payload/tree/templates/with-vercel-postgres) to Vercel should you need it.

### Self-hosting

Before deploying your app, you need to:

1. Ensure your app builds and serves in production. See [Production](#production) for more details.
2. You can then deploy Payload as you would any other Node.js or Next.js application either directly on a VPS, DigitalOcean's Apps Platform, via Coolify or more. More guides coming soon.

You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
