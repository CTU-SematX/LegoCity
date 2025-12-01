# LegoCity Documentation

Welcome to **LegoCity** — a Smart City Builder platform for modern, map-based urban dashboards.

---

## What is LegoCity?

**LegoCity** is a reusable and configurable platform for building smart city dashboards and applications on top of **FIWARE / NGSI-LD** standards and modern web technologies.

**Key features**

- 🏙️ **FIWARE / NGSI-LD integration** – standards-based context and entity management
- 🗺️ **Interactive maps** – Mapbox GL JS with configurable layers and styles
- 📊 **Configurable dashboards** – layouts and blocks managed via PayloadCMS
- 🔌 **Extensible architecture** – plugins, proxy services, and custom integrations
- 🤖 **Optional AI helpers** – content assistance in the Payload admin (OpenAI / Anthropic / OpenRouter)
- 🌍 **Multi-tenant ready** – reusable for different cities and scenarios

---

## Quick navigation

### 🚀 New to LegoCity?

Start here if you are seeing LegoCity for the first time.

<div class="grid cards" markdown>

- **🚀 Getting started**

  ***

  Understand the core concepts and run LegoCity for the first time.

  <a class="md-button" href="getting-started/index.md">Start here</a>

- **⬇️ Installation**

  ***

  Choose an installation method: local, Docker, or development environment.

  <a class="md-button" href="installation/index.md">Install LegoCity</a>

- **🎓 User guide**

  ***

  Learn how to use maps, layers, dashboards, and entities as an end-user.

  <a class="md-button" href="user-guide/index.md">Read user guide</a>

- **⚙️ Configuration**

  ***

  Configure data sources, Mapbox, brokers, APIs, and optional AI integration.

  <a class="md-button" href="configuration/index.md">Configure LegoCity</a>

</div>

### 🛠️ For developers

Use these sections if you want to extend or contribute to LegoCity.

<div class="grid cards" markdown>

- **💻 Development guide**

  ***

  Set up a dev environment, create blocks, and extend the platform.

  <a class="md-button" href="development/index.md">Start developing</a>

- **🤖 AI integration**

  ***

  Configure the Payload AI plugin and OpenRouter-based models.

  <a class="md-button" href="ai/overview.md">Configure AI</a>

- **☁️ Deployment**

  ***

  Deploy LegoCity using Docker, AWS, VMs, Cloudflare, or Coolify.

  <a class="md-button" href="deployment/index.md">Deployment options</a>

- **📚 Reference**

  ***

  Troubleshooting, API details, and technical reference material.

  <a class="md-button" href="reference/troubleshooting.md">Browse reference</a>

</div>

---

## Quick start

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
