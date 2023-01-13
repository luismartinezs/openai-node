import 'module-alias/register';

import { MODELS } from "@/constants"
import { gtp3Completion } from "./openai"

function composePrompt(blocks: string[], separator = '\n\n'): string {
  return blocks.filter(Boolean).join(separator)
}

async function summarize(input: string): Promise<string> {
  const prompt = composePrompt(['Write a detailed summary of the following:', input, 'DETAILED SUMMARY:'], '\n\n')

  const summary = await gtp3Completion({ prompt, stop: ['<<END>>'], model: MODELS.curie, temperature: 0.2, max_tokens: 1200 })

  return summary || ''
}

function estimateTokenLength(input: string): number {
  return Math.round((input.replace(/\s/g, '').length) / 4)
}

export {
  summarize,
  composePrompt,
  estimateTokenLength
}