import { Configuration, OpenAIApi, CreateCompletionResponse } from "openai";

import { MODELS } from "./constants/models";
import { appendToFile, getUserInput } from "./util";

const BOT_NAME: string = 'NEMO'

const configuration: Configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai: OpenAIApi = new OpenAIApi(configuration);

function makeLog(prompt: string, response: string): string {
  return `${cleanText(prompt)}\n${cleanText(response)}\n`;
}

async function gtp3Completion(openaiOptions = {}): Promise<string|null> {
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
    user: 'developer-testing'
  }

  const options = { ...defaultOpenaiOptions, ...openaiOptions };

  try {
    const completion = await openai.createCompletion(options);

    return completion?.data?.choices[0]?.text?.trim() || null
  } catch (err) {
    console.error(err);
  }
  return null
}

function cleanText(text: string): string {
  return text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

const nemo = async (): Promise<void> => {
  console.log(`${BOT_NAME}: Welcome to Nemo! A chatbot with zero memory. Ask me anything! ctrl/cmd + C to quit.`);
  while (true) {
    await handleConversation();
  }
}

const handleConversation = async (): Promise<void> => {
  const userInput = await getUserInput('USER: ');
  const prompt = `USER: ${cleanText(userInput)}\n${BOT_NAME}:`;
  const response = await gtp3Completion({ prompt, stop: [`${BOT_NAME}:`, 'USER:'], temperature: 0.2 });

  if (!response) {
    console.log(`${BOT_NAME}: I'm sorry, I don't understand.`);
    return;
  }

  console.log(`${BOT_NAME}: ${response}`);
  await logConversation(userInput, response);
}

const logConversation = async (userInput: string, botResponse: string): Promise<void> => {
  const log: string = makeLog(`USER: ${cleanText(userInput)}`, `${BOT_NAME}: ${cleanText(botResponse)}`);
  await appendToFile('./logs', 'nemo.txt', log);
}

nemo();
