import { gtp3Completion } from "./openai-utils";
import { appendToFile, getUserInput, cleanText } from "./util";

const BOT_NAME: string = 'NEMO'

function makeLog(prompt: string, response: string): string {
  return `${cleanText(prompt)}\n${cleanText(response)}\n`;
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
  const response = await gtp3Completion({ prompt, stop: [`${BOT_NAME}:`, 'USER:'], temperature: 0.2, user: 'nemo-chatbot' });

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
