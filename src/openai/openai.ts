import { Configuration, OpenAIApi } from "openai";

import { models, type ModelTypes } from "@/constants";

const configuration: Configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai: OpenAIApi = new OpenAIApi(configuration);

export interface Gtp3CompletionOptions {
  prompt: string;
  stop?: string[];
  temperature?: number;
  user?: string;
  model?: ModelTypes;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  echo?: boolean;
  n?: number;
}

interface OtherOptions {
  mock?: boolean;
}

const defaultOtherOptions = {
  mock: false,
};

async function gtp3Completion(
  openaiOptions: Gtp3CompletionOptions,
  otherOptions: OtherOptions = {}
): Promise<string | null> {
  const defaultOpenaiOptions = {
    model: models.babbage,
    max_tokens: 400,
    temperature: 1,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ["\n"],
    echo: false,
    n: 1,
    user: "dev",
  };

  const options = { ...defaultOpenaiOptions, ...openaiOptions };
  const { mock } = { ...defaultOtherOptions, ...otherOptions };

  if (mock) {
    return "This is a mock response.";
  }

  try {
    const completion = await openai.createCompletion(options);

    return completion?.data?.choices[0]?.text?.trim() || null;
  } catch (err) {
    console.error(err);
  }
  return null;
}

interface Gpt3EmbeddingOptions {
  input: string;
  model?: ModelTypes;
  user?: string;
}

async function gpt3Embedding(
  openaiOptions: Gpt3EmbeddingOptions,
  otherOptions: OtherOptions = {}
): Promise<number[] | null> {
  const defaultOpenaiOptions = {
    model: models.adaEmbedding,
    user: "dev",
  };

  const options = { ...defaultOpenaiOptions, ...openaiOptions };
  const { mock } = { ...defaultOtherOptions, ...otherOptions };

  if (mock) {
    return [1, 2, 3, 4, 5];
  }
  try {
    const embedding = await openai.createEmbedding(options);

    return embedding?.data?.data[0]?.embedding || null;
  } catch (err) {
    console.error(err);
  }
  return null;
}

export { gtp3Completion, gpt3Embedding };
