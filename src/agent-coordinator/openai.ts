import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MODELS = {
  "gpt-3.5-turbo-1106": "gpt-3.5-turbo-1106",
};

export function swarm() {
  async function createAssistant(params: {
    model: string;
    tools?: any[];
    file_ids?: string[];
    name?: string;
    instructions?: string;
    metadata?: any;
  }) {
    try {
      const assistantResponse = await openai.beta.assistants.create(params);
      return assistantResponse;
    } catch (error) {
      console.error("Error creating assistant:", error);
      throw error;
    }
  }

  return {
    createAssistant,
  };
}
