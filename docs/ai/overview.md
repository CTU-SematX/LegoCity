# AI Helpers (Optional)

This page describes how LegoCity can use AI helpers in PayloadCMS, primarily via the Payload AI plugin, and what role they play in the overall system.

!!! info "AI Features are Optional"
AI features are considered **optional and supportive**:

    - ✅ The platform must work without any AI provider configured
    - ✅ AI is used to **assist** content editors and developers
    - ❌ AI does **not replace** human decision-making

---

## Scope of AI Features

### What AI Can Help With

AI helpers are useful for content-related tasks:

=== "Content Generation"
**Drafting Descriptions**

    - Human-friendly explanations for layers, views, blocks
    - Summaries and tooltips
    - Documentation snippets
    - Quick drafts of "what this view does"

=== "Naming & Labeling"
**Suggesting Names**

    - Layer names
    - Legend entries
    - KPI titles
    - Block labels
    - View headings

=== "Low-Risk Transformations"
**Content Enhancement**

    - Rephrasing text for clarity
    - Generating alt text
    - Accessibility hints
    - Multi-language translations
    - Short explanations for non-technical users

### What AI is NOT Responsible For

!!! danger "AI Limitations"
AI is **not** responsible for:

    - ❌ Defining entity models or NGSI-LD schema
    - ❌ Making security or access control decisions
    - ❌ Executing operational or deployment changes
    - ❌ Critical business logic
    - ❌ Data validation or integrity checks

---

## Payload AI Plugin

LegoCity uses the **Payload AI plugin** as the main integration point for AI features.

### Plugin Capabilities

The Payload AI plugin:

- ➕ Adds AI functionality into the PayloadCMS admin UI
- 🔌 Connects to various AI providers (OpenAI, Anthropic, etc.)
- ⚙️ Configures via environment variables and plugin options
- 🎛️ Provides UI controls for AI-assisted editing

### Integration Approach

From LegoCity's perspective:

!!! tip "Plugin Philosophy" - AI integration is **just another plugin** - Configured per environment (dev, staging, prod) - Used only where explicitly enabled - Should gracefully disable if no provider configured

**Behavior when disabled:**

- Admin UI hides AI features, or
- Shows them as disabled with clear messaging
- No functionality breaks or errors

---

## Example Use Cases in LegoCity

Practical examples of AI usage in smart city context:

### Use Case 1: Layer Descriptions

=== "Workflow" 1. Editor defines technical metadata for a layer: - Source: NGSI-LD broker - Entity type: `WeatherObserved` - Attributes: `temperature`, `humidity`, `precipitation`

    2. AI generates user-facing description:
       > "This layer displays real-time weather data from stations across the city. View current temperature, humidity levels, and rainfall measurements updated every 15 minutes."

=== "Benefits" - Saves time for content editors - Consistent tone and style - Non-technical language for end users - Editable output for refinement

### Use Case 2: View Summaries

=== "Workflow" 1. Editor creates a "Flood Monitoring" view with: - Weather layer (rainfall) - Flood risk zones - Water level sensors

    2. AI suggests introduction text:
       > **Flood Monitoring Dashboard**
       >
       > Monitor real-time flood risk across the city:
       > - Track rainfall intensity and accumulation
       > - View high-risk flood zones
       > - Monitor river water levels at key points

=== "Benefits" - Quick drafts for new views - Structured content format - Sample questions for help tooltips

### Use Case 3: Block Labels

=== "Workflow" 1. `LayerToggle` block configured with layers: - `flood-risk-high` - `flood-risk-medium` - `flood-risk-low`

    2. AI suggests concise label:
       > "Flood Risk Zones"

=== "Benefits" - Consistent naming conventions - User-friendly terminology - Saves repetitive naming tasks

### Use Case 4: Example Questions

=== "Workflow" 1. AI analyzes view configuration 2. Proposes sample questions users might ask: - "Where are the highest flood risk areas?" - "What's the current rainfall intensity?" - "Which areas should be evacuated?"

=== "Benefits" - Helps with help documentation - Improves user guidance - Identifies common use cases

### Editor Control Principles

!!! success "Human in the Loop"
In all cases:

    - ✅ AI output is **editable** and **reversible**
    - ✅ Editors retain **full control**
    - ✅ AI provides **suggestions**, not final decisions
    - ✅ Previous content is preserved

---

## Configuration and Environments

### Environment Setup

To use the AI plugin, each environment must have:

=== "Required Configuration" - API keys or credentials for chosen provider - Plugin configuration in Payload config - Environment variables for secrets - Optional: Provider-specific settings

=== "Example Configuration"

````typescript title="payload.config.ts"
import { payloadAI } from '@payloadcms/plugin-ai'

    export default buildConfig({
      plugins: [
        payloadAI({
          provider: 'openai',
          apiKey: process.env.OPENAI_API_KEY,
          enabled: process.env.ENABLE_AI === 'true',
          collections: {
            layers: {
              fields: ['description', 'tooltip']
            },
            views: {
              fields: ['summary', 'introduction']
            }
          }
        })
      ]
    })
    ```

=== "Environment Variables"
```env title=".env" # AI Provider Configuration
ENABLE_AI=true
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...

    # Optional: Provider-specific settings
    AI_MODEL=gpt-4
    AI_TEMPERATURE=0.7
    AI_MAX_TOKENS=500
    ```

### Configuration Principles

!!! warning "Security Best Practices" - 🔐 Store AI provider keys as **secrets** (env vars or secret manager) - 🌍 Allow **different providers or keys per environment** - 🔌 Allow AI to be **completely disabled** - 🚫 Never commit API keys to version control

### Environment Matrix

| Environment     | AI Enabled  | Provider          | Use Case                   |
| --------------- | ----------- | ----------------- | -------------------------- |
| **Development** | ✅ Yes      | OpenAI (test key) | Testing AI features        |
| **Staging**     | ✅ Yes      | OpenAI (prod key) | Pre-prod validation        |
| **Production**  | ⚠️ Optional | OpenAI (prod key) | Content editing assistance |
| **CI/CD**       | ❌ No       | None              | Automated testing          |

### Platform Independence

!!! success "No Dependencies"
The platform logic must **not depend** on AI features:

    - Core functionality works without AI
    - Seeds, migrations, and workflows are AI-independent
    - AI features are purely additive enhancements

---

## UX Guidelines

When adding AI helpers to the admin UI:

### 1. Explicit AI Actions

!!! tip "User Intent Required" - Add clear buttons: "Generate description", "Suggest labels" - **Never** auto-run AI without user action - Provide keyboard shortcuts for power users - Show loading states during AI operations

**Example:**

```tsx
<Button
  onClick={handleGenerateDescription}
  icon={<SparklesIcon />}
  loading={isGenerating}
>
  ✨ Generate Description with AI
</Button>
````

### 2. Clear Suggestion Display

!!! tip "Transparent AI Output" - Show AI output as **suggested content**, not final truth - Allow editors to **accept**, **edit**, or **discard** - Preserve original content if replaced - Show comparison view when useful

**Example UI:**

```
┌─────────────────────────────────────┐
│ AI Suggestion:                      │
│                                     │
│ "This layer displays real-time..." │
│                                     │
│ [✓ Accept] [✎ Edit] [✗ Discard]   │
└─────────────────────────────────────┘

Original content: "Weather layer"
```

### 3. Focused Actions

!!! tip "Small, Single-Purpose Tasks" - Keep actions **small and focused** (one field or section) - Avoid complex, multi-step AI chains - Allow partial acceptance of suggestions - Enable undo/redo

### 4. Graceful Error Handling

!!! warning "Handle Failures Well"
Timeouts, provider issues, or invalid configuration should:

    - Show **clear error messages**
    - Suggest **actionable fixes**
    - **Never break** the entire admin UI
    - Fall back to manual editing

**Error Message Example:**

```
❌ AI generation failed

The AI provider is currently unavailable. You can:
• Try again in a few moments
• Edit the field manually
• Contact support if the issue persists

[Retry] [Edit Manually]
```

---

## Safety and Limitations

### Data Privacy

!!! danger "Sensitive Data Protection"
**Avoid sending to external AI providers:**

    - Personal identifiable information (PII)
    - Authentication credentials
    - Internal system details
    - Full configuration dumps
    - Application logs

**What to send:**

- ✅ Field labels and descriptions
- ✅ Public-facing content
- ✅ Generic entity type names
- ✅ Non-sensitive metadata

### Content Validation

!!! warning "AI Output Review"
**Treat AI outputs as untrusted until human approval:**

    - Review for technical accuracy
    - Check for hallucinated facts
    - Verify entity mappings
    - Validate against domain knowledge
    - Ensure brand/tone consistency

### Context Limits

**Send only necessary context:**

```typescript
// ✅ Good: Minimal context
{
  field: "description",
  entityType: "WeatherObserved",
  attributes: ["temperature", "humidity"]
}

// ❌ Bad: Excessive context
{
  field: "description",
  fullConfig: {...}, // Entire payload config
  logs: [...],       // System logs
  secrets: {...}     // Environment variables
}
```

### Transparency Requirements

!!! info "Clear Communication"
Documentation and UI should make clear:

    - AI output might be **imprecise or incomplete**
    - Editors are **responsible** for final content
    - AI is a **tool**, not a replacement for expertise
    - Human review is **always required**

---

## Development and Contribution Guidelines

### 1. Decoupled Architecture

!!! success "Separation of Concerns" - Keep AI features **independent** from core functionality - AI plugin should be **usable standalone** - Don't tie core flows to AI completion: - Seed data generation - Database migrations - Authentication/authorization - API responses

### 2. Transparent Prompts

!!! success "Document AI Behavior" - Store prompts in a **clearly documented place** - Make them **concise and domain-specific**: - Smart city concepts - NGSI-LD terminology - LegoCity architecture - Version control prompt changes - Review prompt updates in PRs

**Example Prompt Storage:**

```typescript title="src/ai/prompts/layer-description.ts"
export const LAYER_DESCRIPTION_PROMPT = `
Generate a user-friendly description for a smart city map layer.

Context:
- Entity Type: {entityType}
- Domain: {domain}
- Attributes: {attributes}

Requirements:
- 2-3 sentences maximum
- Non-technical language
- Explain what users can learn from this layer
- Mention update frequency if relevant

Output: A clear, concise description.
`;
```

### 3. Configurable Usage

!!! success "Flexible Control" - Allow admins to **enable/disable AI per collection** - Allow admins to **enable/disable AI per field** - Support **role-based restrictions**: - Only editors can use AI features - Viewers cannot trigger AI actions - Provide global AI toggle

**Example Configuration:**

```typescript
payloadAI({
  collections: {
    layers: {
      enabled: true,
      fields: ["description", "tooltip"],
      roles: ["editor", "admin"],
    },
    views: {
      enabled: true,
      fields: ["summary"],
      roles: ["admin"],
    },
  },
});
```

### 4. Privacy-Conscious Logging

!!! success "Minimal Logging" - Log AI interactions **for debugging only** - Avoid storing **full prompts and responses** - Never log **sensitive content** - Use log levels appropriately: - INFO: AI action triggered - DEBUG: Request/response metadata - ERROR: Failures and timeouts

**Example Log Structure:**

```typescript
logger.info("AI action", {
  action: "generate_description",
  collection: "layers",
  field: "description",
  provider: "openai",
  model: "gpt-4",
  duration_ms: 1250,
  success: true,
  // ❌ Don't log: prompt, response, user content
});
```

---

## Testing AI Features

### Unit Tests

Test AI integration without calling real providers:

```typescript title="ai-helpers.test.ts"
import { generateLayerDescription } from './ai-helpers'

jest.mock('@payloadcms/plugin-ai')

describe('AI Layer Description Generator', () => {
  it('generates description with valid input', async () => {
    const result = await generateLayerDescription({
      entityType: 'WeatherObserved',
      domain: 'environment'
    })

    expect(result).toContain('weather')
    expect(result.length).toBeLessThan(500)
  })

  it('handles provider failures gracefully', async () => {
    mockAIProvider.mockRejectedValue(new Error('API timeout'))

    await expect(
      generateLayerDescription({...})
    ).rejects.toThrow('AI generation failed')
  })
})
```

### Integration Tests

Test AI features with mock providers:

```typescript
describe("AI Integration", () => {
  it("disables AI UI when no provider configured", () => {
    process.env.ENABLE_AI = "false";

    const { queryByText } = render(<LayerEditor />);

    expect(queryByText("Generate with AI")).toBeNull();
  });
});
```

---

## Summary

!!! success "Key Takeaways"
**AI helpers in LegoCity are optional and supportive**

    **Purpose:**

    - Assist with descriptions, labels, and content tasks
    - Not responsible for core behavior or architecture
    - Purely additive enhancement to editing experience

    **Configuration:**

    - Uses environment variables and secret storage
    - Can differ per environment (dev, staging, prod)
    - Must allow AI features to be fully disabled
    - No core functionality depends on AI

    **UX Principles:**

    - AI actions are explicit and user-triggered
    - Output is reversible and editable
    - Clearly marked as suggestions, not truth
    - Graceful error handling

    **Development:**

    - Keep AI integrations decoupled from core platform
    - Document prompts and behaviors transparently
    - Apply safety and privacy principles
    - Log minimally and responsibly

**Related Pages:**

- [AI Providers](providers.md)
- [OpenRouter Integration](openrouter.md)
- [AI Use Cases](use-cases.md)
- [Creating New Blocks](../development/blocks.md)
