# AI Provider Configuration

LegoCity supports multiple AI providers through the Payload AI plugin. This guide covers officially supported providers and custom provider setup.

!!! info "Official Support"
**Officially Supported Providers:**

    - ✅ **OpenAI** (GPT-4, GPT-3.5-turbo)
    - ✅ **Anthropic** (Claude 3.5, Claude 3)
    - ✅ **ElevenLabs** (Voice synthesis)

    **Custom Providers:**

    - 🔌 **OpenRouter** - Access to 100+ models (Gemini, Claude, GPT-4o, etc.)
    - 🔧 **Custom Providers** - Build your own integration

---

## OpenAI Configuration

### Setup

1. **Get API Key** from [platform.openai.com](https://platform.openai.com/api-keys)

2. **Configure Environment**:

```env title=".env"
# Enable AI Features
ENABLE_AI=true
AI_PROVIDER=openai

# OpenAI Credentials
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_ORGANIZATION=org-...  # Optional
```

3. **Configure Payload Plugin**:

```typescript title="src/payload.config.ts"
import { payloadAI } from "@payloadcms/plugin-ai";

export default buildConfig({
  plugins: [
    payloadAI({
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      enabled: process.env.ENABLE_AI === "true",
      collections: {
        pages: {
          fields: ["content", "description"],
        },
        posts: {
          fields: ["content", "excerpt"],
        },
      },
    }),
  ],
});
```

### Recommended Models

| Model             | Best For                            | Cost | Speed     |
| ----------------- | ----------------------------------- | ---- | --------- |
| **gpt-4o**        | High-quality content, complex tasks | $$$  | Fast      |
| **gpt-4o-mini**   | General use, cost-effective         | $    | Very Fast |
| **gpt-4-turbo**   | Advanced reasoning                  | $$$  | Medium    |
| **gpt-3.5-turbo** | Simple tasks, drafts                | $    | Very Fast |

!!! tip "Recommendation"
Start with **gpt-4o-mini** for most use cases - excellent quality at low cost.

---

## Anthropic (Claude) Configuration

### Setup

1. **Get API Key** from [console.anthropic.com](https://console.anthropic.com/)

2. **Configure Environment**:

```env title=".env"
# Enable AI Features
ENABLE_AI=true
AI_PROVIDER=anthropic

# Anthropic Credentials
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

3. **Configure Payload Plugin**:

```typescript title="src/payload.config.ts"
import { payloadAI } from "@payloadcms/plugin-ai";

export default buildConfig({
  plugins: [
    payloadAI({
      provider: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL,
      enabled: process.env.ENABLE_AI === "true",
      collections: {
        pages: {
          fields: ["content", "description"],
        },
      },
    }),
  ],
});
```

### Recommended Models

| Model                          | Best For             | Context Window | Cost |
| ------------------------------ | -------------------- | -------------- | ---- |
| **claude-3-5-sonnet-20241022** | Best quality, coding | 200K           | $$   |
| **claude-3-5-haiku-20241022**  | Fast, cost-effective | 200K           | $    |
| **claude-3-opus**              | Most capable         | 200K           | $$$  |

!!! tip "Recommendation"
**Claude 3.5 Sonnet** offers excellent quality with large context windows - great for long-form content.

---

## ElevenLabs (Voice Synthesis)

### Setup

1. **Get API Key** from [elevenlabs.io](https://elevenlabs.io/)

2. **Configure Environment**:

```env title=".env"
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Default voice
```

3. **Use Case**: Generate audio descriptions for accessibility

```typescript
// Example: Generate audio for page descriptions
const audioUrl = await generateAudio({
  text: page.description,
  voiceId: process.env.ELEVENLABS_VOICE_ID,
});
```

---

## OpenRouter (Custom Models)

OpenRouter provides access to 100+ AI models through a unified API.

!!! success "Why OpenRouter?" - ✅ Access to **Gemini 2.0 Flash**, Claude, GPT-4o, and many more - ✅ **No rate limits** from individual providers - ✅ **Cost-effective** - competitive pricing - ✅ **Automatic fallbacks** - if one model fails, try another - ✅ **Easy switching** - change models without code changes

### Setup

See detailed guide: [OpenRouter Custom Provider](openrouter.md)

**Quick Setup**:

```env title=".env"
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

---

## Provider Comparison

### Feature Matrix

| Feature            | OpenAI     | Anthropic  | OpenRouter                    |
| ------------------ | ---------- | ---------- | ----------------------------- |
| **Quality**        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ (depends on model) |
| **Speed**          | Fast       | Fast       | Fast                          |
| **Cost**           | $$         | $$         | $ (varies by model)           |
| **Context Window** | 128K       | 200K       | Varies (up to 2M)             |
| **Ease of Setup**  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐                      |
| **Model Variety**  | Limited    | Limited    | 100+ models                   |
| **Rate Limits**    | Yes        | Yes        | Provider-dependent            |

### Cost Comparison (per 1M tokens)

| Provider                        | Input | Output | Best For             |
| ------------------------------- | ----- | ------ | -------------------- |
| **OpenAI gpt-4o-mini**          | $0.15 | $0.60  | General use          |
| **Anthropic Claude 3.5 Haiku**  | $0.80 | $4.00  | Fast tasks           |
| **OpenRouter Gemini 2.0 Flash** | Free  | Free   | Development, testing |

---

## Environment-Specific Configuration

### Development

```env title=".env.development"
ENABLE_AI=true
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

**Why**: Free tier, fast iteration

### Staging

```env title=".env.staging"
ENABLE_AI=true
AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

**Why**: Test production setup with cost-effective model

### Production

```env title=".env.production"
ENABLE_AI=true
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

**Why**: Best quality for end users

---

## Advanced Configuration

### Multiple Providers (Fallback)

```typescript title="src/payload.config.ts"
export default buildConfig({
  plugins: [
    payloadAI({
      providers: [
        {
          name: "primary",
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY,
          model: "gpt-4o-mini",
        },
        {
          name: "fallback",
          provider: "openrouter",
          apiKey: process.env.OPENROUTER_API_KEY,
          model: "google/gemini-2.0-flash-exp:free",
        },
      ],
      fallbackStrategy: "sequential", // Try primary first, fallback if fails
    }),
  ],
});
```

### Rate Limiting

```typescript
payloadAI({
  provider: "openai",
  rateLimit: {
    requests: 100,
    period: "1h",
  },
});
```

### Custom Prompts

```typescript
payloadAI({
  prompts: {
    generateDescription: `Generate a concise, user-friendly description for this smart city data layer. 
Focus on what citizens can learn from this data.
Keep it under 100 words.`,
  },
});
```

---

## Troubleshooting

### API Key Issues

```bash
# Test OpenAI connection
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test Anthropic connection
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

### Common Errors

| Error                   | Cause               | Solution                        |
| ----------------------- | ------------------- | ------------------------------- |
| `401 Unauthorized`      | Invalid API key     | Check key, regenerate if needed |
| `429 Too Many Requests` | Rate limit exceeded | Add delays, upgrade tier        |
| `500 Server Error`      | Provider outage     | Use fallback provider           |
| `AI features disabled`  | `ENABLE_AI=false`   | Set to `true` in .env           |

---

## Best Practices

### 1. Security

- 🔐 Store API keys in environment variables, never in code
- 🔒 Use different keys for dev/staging/prod
- 🔄 Rotate keys regularly
- 🚫 Never commit `.env` files

### 2. Cost Management

- 💰 Start with free/cheap models (Gemini 2.0 Flash, gpt-4o-mini)
- 📊 Monitor usage via provider dashboards
- 🎯 Limit AI features to specific collections/fields
- ⚠️ Set rate limits and budgets

### 3. Performance

- ⚡ Use faster models for real-time features
- 🔄 Cache AI responses when possible
- 📦 Batch requests where appropriate
- ⏱️ Set reasonable timeouts

---

## Next Steps

- [OpenRouter Setup Guide](openrouter.md) - Use custom models
- [AI Use Cases](use-cases.md) - Practical examples
- [AI Overview](overview.md) - Understanding AI in LegoCity
