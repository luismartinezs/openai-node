import 'module-alias/register';
import { gtp3Completion } from "@/openai";
import { appendToFile, getUserInput, cleanText, getTimestamp, readFile, makeLog } from "@/util";

const BOT_NAME: string = 'HAL'
const conversation: string[] = []
const fileName = `hal-${getTimestamp()}.txt`

const hal = async (): Promise<void> => {
  console.log(`${BOT_NAME}: Welcome to ${BOT_NAME}! A chatbot with limited memory. Ask anything! ctrl/cmd + C to quit.\n`);
  const initialPrompt = (await readFile('./prompts/hal.txt'))?.replace('<<BLOCK>>', '')
  if (initialPrompt) {
    await appendToFile('./logs/hal', fileName, initialPrompt);
  }

  while (true) {
    await handleConversation();
  }
}

const handleConversation = async (): Promise<void> => {
  const userInput = await getUserInput('USER: ');
  conversation.push(`USER: ${userInput}`)
  const textBlock = conversation.slice(-21).join('\n')
  let prompt = (await readFile('./prompts/hal.txt'))?.replace('<<BLOCK>>', textBlock)
  prompt += `\n${BOT_NAME}:`
  if (!prompt) {
    console.log(`${BOT_NAME}: I'm sorry, I don't understand.`);
    return;
  }
  const response = await gtp3Completion({ prompt, stop: [`${BOT_NAME}:`, 'USER:'], temperature: 0.7, max_tokens: 400, user: 'hal-chatbot' });

  if (!response) {
    console.log(`${BOT_NAME}: I'm sorry, I don't understand.`);
    return;
  }

  console.log(`${BOT_NAME}: ${response}`);
  conversation.push(`${BOT_NAME}: ${response}`)
  logConversation(userInput, response)
}

const logConversation = async (userInput: string, botResponse: string): Promise<void> => {
  const log: string = makeLog({ prompt: `USER: ${cleanText(userInput)}`, response: `${BOT_NAME}: ${cleanText(botResponse)}` });
  await appendToFile('./logs/hal', fileName, log);
}

hal();
