import "module-alias/register";

import { models } from "@/constants";
import { gpt3Completion, type gpt3CompletionOptions } from "./openai";

function composePrompt(blocks: string[], separator = "\n\n"): string {
  return blocks.filter(Boolean).join(separator);
}

const getSummarizePromptParts = (input: string): string[] => [
  "Compress and summarize the information in the following text, trying to keep a small word count. Include all the different topics in the summary. Include any personal details:",
  input,
  "DETAILED SUMMARY:",
];

async function summarize(
  input: string,
  options: Partial<Omit<gpt3CompletionOptions, "prompt">> = {}
): Promise<string> {
  const prompt = composePrompt(getSummarizePromptParts(input), "\n\n");

  const defaultgpt3CompletionOptions = {
    stop: ["<<END>>"],
    model: models.curie,
    temperature: 0.2,
    max_tokens: 1200,
  };

  const summary = await gpt3Completion({
    ...defaultgpt3CompletionOptions,
    ...options,
    prompt,
  });

  return summary || "";
}

function estimateTokenLength(input: string): number {
  return Math.round(input.replace(/\s/g, "").length / 4);
}

export { summarize, composePrompt, estimateTokenLength };
