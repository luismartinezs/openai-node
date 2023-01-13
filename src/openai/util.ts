import 'module-alias/register';

import { MODELS } from "@/constants"
import { gtp3Completion } from "./openai"

function composePrompt(blocks: string[], separator: string): string {
  return blocks.join(separator)
}

async function summarize(input: string): Promise<string> {
  const prompt = composePrompt(['Write a detailed summary of the following:', input, 'DETAILED SUMMARY:'], '\n\n')

  const summary = await gtp3Completion({ prompt, stop: ['<<END>>'], model: MODELS.curie, temperature: 0.2, max_tokens: 1200 })

  return summary || ''
}

export {
  summarize
}