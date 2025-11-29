# AI Use Cases for LegoCity

This guide covers practical use cases where AI can assist in building and managing smart city dashboards, with appropriate limitations and best practices.

!!! warning "AI is Optional and Supportive"
AI features are **helpers**, not core functionality:

    - ✅ Find use cases where AI **saves time** without compromising quality
    - ✅ Keep humans **in control** of critical decisions
    - ❌ Don't rely on AI for **security**, **data integrity**, or **system logic**

---

## Recommended Use Cases

### 1. Content Generation for Pages & Posts

**Use Case**: Generate blog posts, announcements, or documentation about city services and data.

=== "When to Use" - ✅ Drafting public announcements - ✅ Creating tutorial content - ✅ Writing FAQ responses - ✅ Generating example scenarios

=== "Implementation"
```typescript
// In PayloadCMS admin
// Enable AI on Posts collection

    export const Posts: CollectionConfig = {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true
        },
        {
          name: 'content',
          type: 'richText',
          admin: {
            ai: {
              enabled: true,
              prompts: {
                generate: 'Write an engaging blog post about smart city initiatives'
              }
            }
          }
        }
      ]
    }
    ```

=== "Example Workflow" 1. Editor creates new post: "New Bike Sharing Program" 2. Clicks "Generate with AI" 3. AI produces draft based on title 4. Editor reviews, edits, and publishes

    **AI Output**:
    > "We're excited to announce the launch of our new bike-sharing program!
    > Starting next month, residents can access 500 bikes across 50 stations
    > throughout the city..."

=== "Best Practices" - ✅ Review AI content for accuracy - ✅ Add city-specific details manually - ✅ Verify dates, numbers, and facts - ✅ Maintain consistent tone and voice

---

### 2. Layer Description Automation

**Use Case**: Generate user-friendly descriptions for map layers based on technical metadata.

=== "When to Use" - ✅ Creating layer descriptions quickly - ✅ Maintaining consistent documentation - ✅ Explaining technical data to citizens - ✅ Multi-language descriptions

=== "Implementation"
```typescript
    // Custom AI helper for layers
    async function generateLayerDescription(layer: Layer) {
      const prompt = `Generate a user-friendly description for this smart city map layer:

      Layer Name: ${layer.name}
      Entity Type: ${layer.entityType}
      Attributes: ${layer.attributes.join(', ')}
      Data Source: ${layer.source}

      Write a 2-3 sentence description that:
      - Explains what citizens can learn from this data
      - Uses simple, non-technical language
      - Mentions update frequency if relevant

      Keep it under 100 words.`

      return await ai.generateText(prompt)
    }
    ```

=== "Example Output"
**Input**: - Layer: "Air Quality Monitoring" - Entity Type: `AirQualityObserved` - Attributes: `pm25`, `pm10`, `no2`, `co`

    **AI Generated**:
    > "View real-time air quality measurements from sensors across the city.
    > This layer shows PM2.5, PM10, nitrogen dioxide, and carbon monoxide levels,
    > updated every hour. Use this data to check air quality in your neighborhood
    > and plan outdoor activities accordingly."

=== "Best Practices" - ✅ Provide clear, structured prompts - ✅ Include technical context (entity type, attributes) - ✅ Review for technical accuracy - ✅ Ensure consistency across layers

---

### 3. Configuration Suggestions

**Use Case**: Suggest optimal configuration based on data patterns and common practices.

=== "When to Use" - ✅ Recommending color schemes for layers - ✅ Suggesting zoom levels for map views - ✅ Proposing filter configurations - ✅ Auto-generating legend labels

=== "Implementation"
```typescript
    // Suggest color scheme for pollution data
    async function suggestColorScheme(layerConfig: LayerConfig) {
      const prompt = `Suggest an appropriate color scheme for this map layer:

      Data Type: ${layerConfig.dataType}
      Value Range: ${layerConfig.min} to ${layerConfig.max}
      Purpose: ${layerConfig.purpose}

      Provide 5 colors in hex format from lowest to highest value.
      Consider accessibility and common conventions (e.g., green=good, red=bad).`

      const colors = await ai.generateText(prompt)
      return parseColors(colors)
    }
    ```

=== "Example Scenarios"
**Air Quality Index**: - AI suggests: `['#00E400', '#FFFF00', '#FF7E00', '#FF0000', '#8F3F97']` - Rationale: Standard AQI color scheme

    **Temperature**:
    - AI suggests: `['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000']`
    - Rationale: Cold (blue) to hot (red) gradient

=== "Limitations" - ⚠️ Verify color accessibility (WCAG compliance) - ⚠️ Check color blindness compatibility - ⚠️ Ensure cultural appropriateness - ⚠️ Test with actual data

---

### 4. Documentation Assistant

**Use Case**: Generate technical documentation, API examples, and configuration guides.

=== "When to Use" - ✅ Documenting API endpoints - ✅ Creating configuration examples - ✅ Writing integration guides - ✅ Generating code snippets

=== "Implementation"
```typescript
    // Generate API documentation
    async function generateAPIDoc(endpoint: APIEndpoint) {
      const prompt = `Generate API documentation for this endpoint:

      Method: ${endpoint.method}
      Path: ${endpoint.path}
      Parameters: ${JSON.stringify(endpoint.params)}
      Response: ${JSON.stringify(endpoint.response)}

      Include:
      - Description
      - Request example (curl)
      - Response example
      - Common use cases`

      return await ai.generateText(prompt)
    }
    ```

=== "Example Output"
**Endpoint**: `GET /api/entities/weather`

    **AI Generated**:
    ```markdown
    ## Get Weather Entities

    Retrieve weather observation entities from the context broker.

    ### Request
    ```bash
    curl https://api.city.example/api/entities/weather?limit=10
    ```

    ### Response
    ```json
    {
      "entities": [
        {
          "id": "WeatherObserved:Station1",
          "temperature": 22.5,
          "humidity": 65
        }
      ]
    }
    ```

    ### Use Cases
    - Display current weather on dashboard
    - Analyze temperature trends
    - Monitor humidity levels
    ```

=== "Best Practices" - ✅ Provide complete endpoint specifications - ✅ Verify code examples work - ✅ Update docs when APIs change - ✅ Include error cases

---

### 5. Seed Data Generation

**Use Case**: Generate realistic test data for development and demos.

=== "When to Use" - ✅ Creating demo content - ✅ Populating development databases - ✅ Testing UI with varied data - ✅ Generating placeholder content

=== "Implementation"
```typescript
    // Generate sample weather data
    async function generateSeedData(entityType: string, count: number) {
      const prompt = `Generate ${count} realistic sample records for this entity type:

      Entity Type: ${entityType}
      Schema: ${getEntitySchema(entityType)}

      Return as JSON array with realistic values for a smart city context.
      Include varied data (different times, locations, values).`

      const data = await ai.generateText(prompt)
      return JSON.parse(data)
    }
    ```

=== "Example Output"
**Request**: 3 weather observations

    **AI Generated**:
    ```json
    [
      {
        "id": "WeatherObserved:Station1",
        "location": { "coordinates": [10.762622, 106.660172] },
        "temperature": 32.5,
        "humidity": 75,
        "observedAt": "2025-11-29T14:00:00Z"
      },
      {
        "id": "WeatherObserved:Station2",
        "location": { "coordinates": [10.762733, 106.660283] },
        "temperature": 31.8,
        "humidity": 72,
        "observedAt": "2025-11-29T14:00:00Z"
      },
      {
        "id": "WeatherObserved:Station3",
        "location": { "coordinates": [10.762844, 106.660394] },
        "temperature": 33.2,
        "humidity": 78,
        "observedAt": "2025-11-29T14:00:00Z"
      }
    ]
    ```

=== "Limitations" - ⚠️ Validate data schema compliance - ⚠️ Check for realistic value ranges - ⚠️ Verify geographic coordinates - ⚠️ Not suitable for production data

---

### 6. Intelligent Search Enhancement

**Use Case**: Improve search with natural language understanding and semantic matching.

=== "When to Use" - ✅ Natural language queries - ✅ Semantic search for content - ✅ Query expansion and suggestions - ✅ Fuzzy matching for typos

=== "Implementation"
```typescript
    // Enhance search with AI
    async function enhanceSearch(query: string) {
      // Generate search keywords
      const prompt = `Given this search query: "${query}"

      Generate:
      1. Normalized keywords
      2. Related terms
      3. Entity types that might match

      Return as JSON.`

      const enhanced = await ai.generateText(prompt)
      const { keywords, related, entityTypes } = JSON.parse(enhanced)

      // Search with enhanced terms
      return searchEntities({ keywords, related, entityTypes })
    }
    ```

=== "Example"
**User Query**: "Where are the air pollution sensors?"

    **AI Enhancement**:
    ```json
    {
      "keywords": ["air", "pollution", "sensors"],
      "related": ["air quality", "PM2.5", "PM10", "AQI", "monitoring stations"],
      "entityTypes": ["AirQualityObserved", "Device"]
    }
    ```

    **Result**: Better search results including related terms

=== "Best Practices" - ✅ Cache common queries - ✅ Fall back to regular search if AI fails - ✅ Monitor search quality metrics - ✅ Respect user privacy

---

### 7. Chatbot for Citizens

**Use Case**: Answer citizen questions about city services and data.

=== "When to Use" - ✅ Common questions (FAQs) - ✅ Data interpretation help - ✅ Service information - ✅ Navigation assistance

=== "Implementation"
```typescript
    // Simple chatbot implementation
    async function answerQuestion(question: string, context: CityContext) {
      const prompt = `You are a helpful assistant for a smart city dashboard.

      City Context:
      - Available data: ${context.availableData.join(', ')}
      - Services: ${context.services.join(', ')}

      Citizen Question: ${question}

      Provide a helpful, concise answer (max 150 words).
      If you don't know, direct them to contact support.`

      return await ai.generateText(prompt)
    }
    ```

=== "Example Conversation"
**Q**: "How do I find parking near City Hall?"

    **AI**: "You can use the parking facilities layer on the map to find available
    parking near City Hall. Click on the parking icon to see real-time availability
    and pricing. There are 3 public parking lots within 500m of City Hall with a
    total of 250 spaces."

    **Q**: "What's the air quality today?"

    **AI**: "Based on the latest readings from our air quality sensors, the Air
    Quality Index (AQI) is 65, which is in the 'Moderate' range. This means air
    quality is acceptable for most people, though unusually sensitive individuals
    should consider limiting prolonged outdoor exertion."

=== "Safety Considerations" - ⚠️ Don't provide emergency response info - ⚠️ Don't make policy decisions - ⚠️ Always cite data sources - ⚠️ Include disclaimers for predictions - ⚠️ Provide human contact option

---

## Use Cases to AVOID

### ❌ Security and Access Control

**Don't use AI for**:

- Deciding user permissions
- Generating security policies
- Validating credentials
- Making authentication decisions

**Why**: Security requires deterministic, auditable logic, not probabilistic AI.

### ❌ Data Validation and Integrity

**Don't use AI for**:

- Validating entity schemas
- Checking data consistency
- Enforcing business rules
- Data transformation logic

**Why**: Data integrity requires precise, testable validation rules.

### ❌ Critical Operations

**Don't use AI for**:

- Deployment decisions
- System configuration
- Database migrations
- Backup/restore operations

**Why**: Operational tasks require deterministic, tested procedures.

### ❌ Real-time Alerts

**Don't use AI for**:

- Emergency notifications
- Threshold-based alerts
- Critical system warnings
- Safety announcements

**Why**: Alerts require reliable, immediate, rule-based triggers.

---

## Implementation Guidelines

### 1. Human Review Required

```typescript
// Always require human approval for AI-generated content
async function generateWithApproval(prompt: string) {
  const draft = await ai.generateText(prompt);

  return {
    draft,
    status: "pending_review",
    requiresApproval: true,
    reviewer: null,
    approvedAt: null,
  };
}
```

### 2. Fallback to Manual

```typescript
// Graceful fallback if AI unavailable
async function generateContent(prompt: string) {
  if (!process.env.ENABLE_AI) {
    return {
      content: "",
      mode: "manual",
      message: "AI features disabled. Please enter content manually.",
    };
  }

  try {
    const content = await ai.generateText(prompt);
    return { content, mode: "ai" };
  } catch (error) {
    return {
      content: "",
      mode: "manual",
      message: "AI generation failed. Please enter content manually.",
    };
  }
}
```

### 3. Audit Trail

```typescript
// Log all AI operations
async function generateWithAudit(prompt: string, userId: string) {
  const result = await ai.generateText(prompt);

  await logAIOperation({
    userId,
    prompt: prompt.substring(0, 100), // Truncate for privacy
    model: process.env.OPENROUTER_MODEL,
    timestamp: new Date(),
    approved: false,
  });

  return result;
}
```

### 4. Cost Monitoring

```typescript
// Track AI usage and costs
async function generateWithCostTracking(prompt: string) {
  const startTime = Date.now();
  const result = await ai.generateText(prompt);
  const duration = Date.now() - startTime;

  await trackAICost({
    model: process.env.OPENROUTER_MODEL,
    promptTokens: estimateTokens(prompt),
    completionTokens: estimateTokens(result),
    duration,
    cost: calculateCost(prompt, result),
  });

  return result;
}
```

---

## Best Practices Summary

### ✅ Do

- Use AI for drafts and suggestions
- Keep humans in control
- Review all AI outputs
- Provide manual alternatives
- Monitor costs and usage
- Log AI operations
- Test with real scenarios

### ❌ Don't

- Rely on AI for critical logic
- Auto-publish AI content
- Use AI for security decisions
- Generate production data
- Skip human review
- Ignore AI limitations
- Over-rely on AI

---

## Next Steps

- [AI Provider Configuration](providers.md) - Set up AI providers
- [OpenRouter Guide](openrouter.md) - Use custom models
- [AI Overview](overview.md) - Understanding AI in LegoCity
