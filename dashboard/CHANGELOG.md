# Changelog

All notable changes to Lego-Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- MCP Server plugin integration (`@payloadcms/plugin-mcp`)
- NgsiBlocks components for NGSI-LD data rendering

### Changed
- Upgraded to Next.js 16.0.7
- Upgraded to React 19.2.1
- Upgraded PayloadCMS packages to 3.66.0

## [0.3.0-alpha] - 2024-XX-XX

### Added
- Complete NGSI-LD flow on dashboard
- NGSI Sources collection for context broker connections
- NGSI Entities collection with broker synchronization
- NGSI Data Models collection for Smart Data Models import
- NGSI Domains collection for domain categorization
- Health check endpoint for broker connections
- Multi-tenancy support with Fiware-Service headers

### Changed
- Enhanced `next.config.js` with improved image handling
- Updated admin panel with NGSI management interface

### Fixed
- Entity sync issues with Orion-LD broker

## [0.2.0-alpha] - 2024-XX-XX

### Added
- Initial PayloadCMS integration
- Dashboard blocks: Content, Media, Archive, Forms, CTA
- SEO plugin integration
- OpenRouter AI content generation
- Live preview functionality
- Internationalization (English, Vietnamese)

### Changed
- Migrated from WireCloud architecture to PayloadCMS

## [0.1.0-alpha] - 2024-XX-XX

### Added
- Initial project setup
- Next.js 15 foundation
- Basic page builder functionality
- MongoDB database support

---

## Migration Guide

### Upgrading from 0.2.x to 0.3.x

1. **Database Migration**: Run `pnpm payload migrate` after updating
2. **New Environment Variables**:
   - No new required variables
3. **Breaking Changes**:
   - None

### Upgrading from 0.3.x to 0.4.x (Upcoming)

1. **New Dependencies**:
   - `@payloadcms/plugin-mcp` - Optional MCP server support
2. **Breaking Changes**:
   - Next.js 16 requires Node.js 18.20.2+ or 20.9.0+
   - React 19 may require updates to custom components

---

## Downstream Projects

If you're maintaining a downstream project (like LegoCity), please:

1. Check this CHANGELOG before updating
2. Pay attention to **Breaking Changes** sections
3. Follow the **Migration Guide** for major updates
4. Test your customizations after syncing

For automated syncing, see the [sync-dashboard workflow](https://github.com/CTU-SematX/LegoCity/.github/workflows/sync-dashboard.yml).
