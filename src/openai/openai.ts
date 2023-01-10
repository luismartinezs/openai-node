import { Configuration, OpenAIApi } from "openai";

import { MODELS } from "@/constants";

const configuration: Configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai: OpenAIApi = new OpenAIApi(configuration);

interface Gtp3CompletionOptions {
  prompt: string;
  stop?: string[];
  temperature?: number;
  user?: string;
  model?: string;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  echo?: boolean;
  n?: number;
}

const defaultOpenaiOptions = {
  model: MODELS.babbage,
  max_tokens: 400,
  temperature: 1,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  stop: ["\n"],
  echo: false,
  n: 1,
  user: 'dev'
}

async function gtp3Completion(openaiOptions: Gtp3CompletionOptions): Promise<string | null> {
  const options = { ...defaultOpenaiOptions, ...openaiOptions };

  try {
    const completion = await openai.createCompletion(options);

    return completion?.data?.choices[0]?.text?.trim() || null
  } catch (err) {
    console.error(err);
  }
  return null
}

export {
  gtp3Completion
}