# OpenRouter Custom Provider

OpenRouter provides access to 100+ AI models through a single API, making it easy to use custom models like Gemini 2.0 Flash, Claude, GPT-4o, and more without managing multiple provider integrations.

!!! success "Why OpenRouter?" - 🆓 **Free models available** (Gemini 2.0 Flash, etc.) - 🔌 **100+ models** - Access to latest models from all providers - 💰 **Cost-effective** - Competitive pricing, pay-as-you-go - 🚀 **No rate limits** from individual providers - 🔄 **Automatic fallbacks** - Built-in retry logic - 🎯 **Single API** - One integration for all models

---

## Quick Start

### 1. Get OpenRouter API Key

1. Visit [openrouter.ai](https://openrouter.ai/)
2. Sign up or log in
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create a new API key

### 2. Configure Environment

```env title=".env"
# Enable AI Features
ENABLE_AI=true
AI_PROVIDER=openrouter

# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_SITE_URL=https://legocity.example.com  # Optional
OPENROUTER_APP_NAME=LegoCity                      # Optional
```

### 3. Configure Custom Provider

```typescript title="src/payload.config.ts"
import { buildConfig } from "payload/config";

export default buildConfig({
  plugins: [
    // Custom OpenRouter provider
    {
      name: "ai-openrouter",
      provider: async ({ apiKey, model }) => {
        return {
          generateText: async ({ prompt, max_tokens = 500 }) => {
            const response = await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                  "HTTP-Referer": process.env.OPENROUTER_SITE_URL,
                  "X-Title": process.env.OPENROUTER_APP_NAME,
                },
                body: JSON.stringify({
                  model: model,
                  messages: [{ role: "user", content: prompt }],
                  max_tokens,
                }),
              }
            );

            const data = await response.json();
            return data.choices[0].message.content;
          },
        };
      },
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL,
      enabled: process.env.ENABLE_AI === "true",
    },
  ],
});
```

---

## Recommended Models

### Free Models (Perfect for Development)

| Model                                     | Provider | Speed  | Quality  | Context   |
| ----------------------------------------- | -------- | ------ | -------- | --------- |
| **google/gemini-2.0-flash-exp:free**      | Google   | ⚡⚡⚡ | ⭐⭐⭐⭐ | 1M tokens |
| **google/gemini-flash-1.5:free**          | Google   | ⚡⚡⚡ | ⭐⭐⭐⭐ | 1M tokens |
| **meta-llama/llama-3.2-3b-instruct:free** | Meta     | ⚡⚡   | ⭐⭐⭐   | 128K      |
| **qwen/qwen-2-7b-instruct:free**          | Alibaba  | ⚡⚡   | ⭐⭐⭐   | 32K       |

!!! tip "Best Free Model"
**google/gemini-2.0-flash-exp:free** - Excellent quality, very fast, 1M token context window

### Premium Models (Production Use)

| Model                                    | Cost (per 1M tokens) | Best For             |
| ---------------------------------------- | -------------------- | -------------------- |
| **google/gemini-2.0-flash-thinking-exp** | $0.10 / $0.40        | Advanced reasoning   |
| **anthropic/claude-3.5-sonnet**          | $3.00 / $15.00       | High-quality content |
| **openai/gpt-4o-mini**                   | $0.15 / $0.60        | General use          |
| **openai/gpt-4o**                        | $2.50 / $10.00       | Complex tasks        |
| **meta-llama/llama-3.3-70b-instruct**    | $0.59 / $0.79        | Cost-effective       |

### Specialized Models

| Model                                           | Purpose              | Context   |
| ----------------------------------------------- | -------------------- | --------- |
| **google/gemini-flash-1.5-8b**                  | Ultra-fast responses | 1M tokens |
| **anthropic/claude-3-haiku**                    | Quick drafts         | 200K      |
| **perplexity/llama-3.1-sonar-huge-128k-online** | Web search + AI      | 128K      |

---

## Model Selection Guide

### By Use Case

=== "Content Generation"
**Recommended**: `google/gemini-2.0-flash-exp:free`

    - Blog posts, descriptions
    - User-facing content
    - Documentation

    ```typescript
    model: 'google/gemini-2.0-flash-exp:free'
    ```

=== "Code Generation"
**Recommended**: `anthropic/claude-3.5-sonnet`

    - Configuration files
    - API examples
    - Technical docs

    ```typescript
    model: 'anthropic/claude-3.5-sonnet'
    ```

=== "Quick Drafts"
**Recommended**: `google/gemini-flash-1.5-8b`

    - Short descriptions
    - Labels, titles
    - Quick summaries

    ```typescript
    model: 'google/gemini-flash-1.5-8b'
    ```

=== "Complex Reasoning"
**Recommended**: `google/gemini-2.0-flash-thinking-exp`

    - Data analysis
    - Decision support
    - Multi-step tasks

    ```typescript
    model: 'google/gemini-2.0-flash-thinking-exp'
    ```

### By Budget

=== "Free Tier"
```typescript
// Best free option
model: 'google/gemini-2.0-flash-exp:free'

    // Alternatives
    // model: 'google/gemini-flash-1.5:free'
    // model: 'meta-llama/llama-3.2-3b-instruct:free'
    ```

=== "Low Cost ($)"
```typescript
// Best value
model: 'openai/gpt-4o-mini' // $0.15/$0.60 per 1M

    // Alternative
    // model: 'google/gemini-flash-1.5'  // $0.075/$0.30 per 1M
    ```

=== "High Quality ($$)"
```typescript
// Best quality
model: 'anthropic/claude-3.5-sonnet' // $3/$15 per 1M

    // Alternative
    // model: 'openai/gpt-4o'  // $2.50/$10 per 1M
    ```

---

## Advanced Configuration

### Model Switching

Switch models based on task:

```typescript title="src/lib/ai-helper.ts"
const AI_MODELS = {
  content: "google/gemini-2.0-flash-exp:free",
  code: "anthropic/claude-3.5-sonnet",
  quick: "google/gemini-flash-1.5-8b",
  reasoning: "google/gemini-2.0-flash-thinking-exp",
};

export async function generateWithAI(
  prompt: string,
  task: keyof typeof AI_MODELS
) {
  const model = AI_MODELS[task];

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
      }),
    }
  );

  return response.json();
}
```

### Fallback Chain

```typescript
const FALLBACK_MODELS = [
  "google/gemini-2.0-flash-exp:free", // Try free first
  "openai/gpt-4o-mini", // Fallback to paid
  "anthropic/claude-3.5-haiku", // Last resort
];

async function generateWithFallback(prompt: string) {
  for (const model of FALLBACK_MODELS) {
    try {
      return await generateWithAI(prompt, model);
    } catch (error) {
      console.warn(`Model ${model} failed, trying next...`);
    }
  }
  throw new Error("All AI models failed");
}
```

### Custom Parameters

```typescript
await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-2.0-flash-exp:free",
    messages: [{ role: "user", content: prompt }],

    // Custom parameters
    temperature: 0.7, // Creativity (0-2)
    max_tokens: 1000, // Response length
    top_p: 0.9, // Nucleus sampling
    frequency_penalty: 0.5, // Reduce repetition
    presence_penalty: 0.5, // Encourage diversity

    // OpenRouter-specific
    transforms: ["middle-out"], // Reduce latency
    route: "fallback", // Auto-fallback on error
  }),
});
```

---

## Cost Management

### Monitor Usage

OpenRouter provides usage tracking:

1. Visit [openrouter.ai/activity](https://openrouter.ai/activity)
2. View costs per model
3. Set budget alerts

### Cost-Saving Strategies

=== "Use Free Models for Dev"
`env title=".env.development"
    OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
    `

=== "Limit Token Usage"
`typescript
    max_tokens: 300  // Keep responses concise
    `

=== "Cache Responses"
```typescript
// Cache AI responses for identical prompts
const cache = new Map()

    async function cachedGenerate(prompt: string) {
      if (cache.has(prompt)) return cache.get(prompt)

      const result = await generateWithAI(prompt)
      cache.set(prompt, result)
      return result
    }
    ```

=== "Batch Processing"
`` typescript
    // Generate multiple items in one request
    const prompt = `Generate descriptions for these layers:
    1. Weather observations
    2. Flood zones
    3. Parking facilities`
     ``

---

## Model Features Comparison

### Context Window

| Model                 | Context   | Use Case                      |
| --------------------- | --------- | ----------------------------- |
| **gemini-2.0-flash**  | 1M tokens | Long documents, full codebase |
| **claude-3.5-sonnet** | 200K      | Long articles                 |
| **gpt-4o**            | 128K      | Standard content              |
| **llama-3.3-70b**     | 128K      | General use                   |

### Special Capabilities

| Model                         | Special Features            |
| ----------------------------- | --------------------------- |
| **gemini-2.0-flash-thinking** | Chain-of-thought reasoning  |
| **claude-3.5-sonnet**         | Excellent at code, analysis |
| **perplexity-sonar-online**   | Web search integration      |
| **gpt-4o**                    | Vision (image analysis)     |

---

## Troubleshooting

### Common Issues

=== "401 Unauthorized"
**Problem**: Invalid API key

    **Solution**:
    ```bash
    # Verify key format
    echo $OPENROUTER_API_KEY  # Should start with sk-or-v1-

    # Test key
    curl https://openrouter.ai/api/v1/models \
      -H "Authorization: Bearer $OPENROUTER_API_KEY"
    ```

=== "402 Payment Required"
**Problem**: Insufficient credits

    **Solution**:
    - Use free models: `google/gemini-2.0-flash-exp:free`
    - Add credits: [openrouter.ai/credits](https://openrouter.ai/credits)

=== "429 Rate Limited"
**Problem**: Too many requests

    **Solution**:
    ```typescript
    // Add delays between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
    ```

=== "Model Not Found"
**Problem**: Invalid model name

    **Solution**:
    ```bash
    # List available models
    curl https://openrouter.ai/api/v1/models \
      -H "Authorization: Bearer $OPENROUTER_API_KEY"
    ```

---

## Best Practices

### 1. Development Setup

```env title=".env.development"
# Use free models for development
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_SITE_URL=http://localhost:3000
```

### 2. Production Setup

```env title=".env.production"
# Use reliable paid models for production
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_SITE_URL=https://legocity.example.com
```

### 3. Error Handling

```typescript
async function safeGenerate(prompt: string) {
  try {
    return await generateWithAI(prompt);
  } catch (error) {
    console.error("AI generation failed:", error);
    // Fallback to manual content
    return null;
  }
}
```

### 4. Rate Limiting

```typescript
import pLimit from "p-limit";

// Limit concurrent AI requests
const limit = pLimit(3);

const promises = prompts.map((prompt) => limit(() => generateWithAI(prompt)));

await Promise.all(promises);
```

---

## Example Integration

### Full Implementation

```typescript title="src/lib/openrouter.ts"
export class OpenRouterClient {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY!;
    this.model =
      process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
  }

  async generateText(prompt: string, options = {}) {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "",
          "X-Title": "LegoCity",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
          temperature: 0.7,
          ...options,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateDescription(layerName: string, entityType: string) {
    const prompt = `Generate a concise, user-friendly description for a smart city map layer:
    
Layer: ${layerName}
Entity Type: ${entityType}

Focus on what citizens can learn from this data. Keep it under 100 words.`;

    return this.generateText(prompt);
  }
}

// Usage
const ai = new OpenRouterClient();
const description = await ai.generateDescription(
  "Weather Stations",
  "WeatherObserved"
);
```

---

## Resources

- **OpenRouter Docs**: [openrouter.ai/docs](https://openrouter.ai/docs)
- **Model List**: [openrouter.ai/models](https://openrouter.ai/models)
- **Pricing**: [openrouter.ai/docs#pricing](https://openrouter.ai/docs#pricing)
- **API Reference**: [openrouter.ai/docs/api-reference](https://openrouter.ai/docs/api-reference)

---

## Next Steps

- [AI Provider Configuration](providers.md) - Compare all providers
- [AI Use Cases](use-cases.md) - Practical examples
- [AI Overview](overview.md) - Understanding AI in LegoCity
