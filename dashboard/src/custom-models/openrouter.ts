import { openrouter } from '@openrouter/ai-sdk-provider'
import { GenerationModel } from '@ai-stack/payloadcms/types'
import { generateText, streamText } from 'ai'

const defaultSystemPrompt = `IMPORTANT INSTRUCTION:
Produce only the requested output text.
Do not add any explanations, comments, or engagement.
Do not use quotation marks in the response.
BEGIN OUTPUT:`

export const openrouterTextModel: GenerationModel = {
  id: `openrouter-text`,
  name: 'OpenRouter',
  fields: ['text', 'textarea'],
  handler: async (prompt: string, options: { locale: string; model: string; system: string }) => {
    const streamTextResult = await streamText({
      model: openrouter(options.model) as any,
      prompt,
      system: options.system || defaultSystemPrompt,
    })

    return streamTextResult.toTextStreamResponse()
  },
  generateText: async (prompt: string, system: string) => {
    const { text } = await generateText({
      model: openrouter('google/gemini-2.0-flash-001') as any,
      prompt,
      system: system,
    })

    return text
  },
  output: 'text',
  settings: {
    name: `openrouter-text-settings`,
    type: 'group',
    admin: {
      condition(data) {
        return data['model-id'] === `openrouter-text`
      },
    },
    fields: [
      {
        name: 'model',
        type: 'select',
        defaultValue: 'google/gemini-2.0-flash-001',
        label: 'Model',
        options: [
          // You can find more models here: https://openrouter.ai/models
          'meta-llama/llama-3.3-70b-instruct',
          'openai/gpt-4o-mini',
          'anthropic/claude-3.5-sonnet',
          'google/gemini-2.0-flash-001',
        ],
      },
    ],
    label: 'OpenRouter Settings',
  },
}
