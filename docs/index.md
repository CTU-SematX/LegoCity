# LegoCity Documentation

Welcome to **LegoCity** - A Smart City Builder for modern urban dashboards.

## What is LegoCity?

LegoCity is a reusable, configurable platform for building smart city dashboards and applications on top of **FIWARE/NGSI-LD** standards and modern web technologies.

**Key Features**:

- 🏙️ **FIWARE/NGSI-LD Integration** - Standards-based context management
- 🗺️ **Interactive Maps** - Powered by Mapbox GL JS
- 📊 **Flexible Dashboards** - Built with PayloadCMS blocks
- 🔌 **Extensible Architecture** - Plugin system for customization
- 🤖 **AI-Powered** - Optional AI assistance for content creation
- 🌍 **Multi-Tenant Ready** - Reusable across different cities

---

## Quick Navigation

### 🚀 New to LegoCity?

Get started quickly with our beginner-friendly guides:

<div class="grid cards" markdown>

- **:material-rocket-launch: Getting Started**

  ***

  Learn the basics and get LegoCity running in minutes

  [:octicons-arrow-right-24: Start Here](getting-started/index.md)

- **:material-download: Installation**

  ***

  Choose your installation method: local, Docker, or development

  [:octicons-arrow-right-24: Install LegoCity](installation/index.md)

- **:material-school: User Guide**

  ***

  Learn how to use LegoCity's features and capabilities

  [:octicons-arrow-right-24: Read Guide](user-guide/index.md)

- **:material-cog: Configuration**

  ***

  Configure data sources, maps, APIs, and AI integration

  [:octicons-arrow-right-24: Configure](configuration/index.md)

</div>

### 🛠️ For Developers

Building custom features or contributing to LegoCity?

<div class="grid cards" markdown>

- **:material-code-braces: Development Guide**

  ***

  Create blocks, plugins, and customize LegoCity

  [:octicons-arrow-right-24: Start Developing](development/index.md)

- **:material-robot: AI Integration**

  ***

  Set up AI assistants with OpenAI, Anthropic, or OpenRouter

  [:octicons-arrow-right-24: Configure AI](ai/overview.md)

- **:material-cloud-upload: Deployment**

  ***

  Deploy to AWS, VMs, Docker, or Cloudflare

  [:octicons-arrow-right-24: Deploy](deployment/index.md)

- **:material-book-open-variant: Reference**

  ***

  Troubleshooting, API docs, and technical references

  [:octicons-arrow-right-24: Browse Reference](reference/troubleshooting.md)

</div>

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/CTU-SematX/LegoCity.git
cd LegoCity/dashboard

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
pnpm dev
```

**Access at**: [http://localhost:3000](http://localhost:3000)

👉 See the [Quick Start Guide](getting-started/quickstart.md) for detailed instructions.

---

## Architecture Overview

LegoCity uses a three-layer architecture:

1. **Context & Data Layer** - FIWARE/NGSI-LD brokers with standardized city data
2. **Content & UI Layer** - PayloadCMS + Next.js for configurable dashboards
3. **Integration Layer** - API proxies, AI helpers, external services

👉 See the [Architecture Guide](getting-started/architecture.md) for detailed diagrams and explanations.

---

## Community & Support

### Getting Help

- 📖 **Documentation**: You're reading it!
- 💬 **Discussions**: [GitHub Discussions](https://github.com/CTU-SematX/LegoCity/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/CTU-SematX/LegoCity/issues)
- 📧 **Contact**: CTU-SematX Team

### Contributing

We welcome contributions! See:

- [Development Guide](development/index.md) - How to contribute
- [CONTRIBUTING.md](https://github.com/CTU-SematX/LegoCity/blob/main/CONTRIBUTING.md) - Guidelines
- [CODE_OF_CONDUCT.md](https://github.com/CTU-SematX/LegoCity/blob/main/CODE_OF_CONDUCT.md) - Community standards

### Resources

- **Repository**: [github.com/CTU-SematX/LegoCity](https://github.com/CTU-SematX/LegoCity)
- **Demo**: [Coming soon]
- **License**: Check repository for license details

---

## What's Next?

Choose your path:

=== "I'm New"

    **Start Here**:

    1. Read [Getting Started](getting-started/index.md)
    2. Follow [Quick Start](getting-started/quickstart.md)
    3. Explore [User Guide](user-guide/index.md)

=== "I Want to Use It"

    **Set Up Your City**:

    1. [Install LegoCity](installation/index.md)
    2. [Configure Data Sources](configuration/data-sources.md)
    3. [Create Dashboard Pages](user-guide/index.md)

=== "I Want to Build"

    **Start Developing**:

    1. [Development Environment](installation/development.md)
    2. [Development Guide](development/index.md)
    3. [Create Custom Blocks](development/blocks.md)

=== "I Want to Deploy"

    **Deploy to Production**:

    1. [Deployment Overview](deployment/index.md)
    2. Choose deployment method
    3. [Operations Guide](deployment/operations.md)

---

**Ready to begin?** Head to the [Getting Started Guide](getting-started/index.md) →
