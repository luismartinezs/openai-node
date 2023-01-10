import { MODELS } from "./constants/models";
import { gtp3Completion } from "./openai-utils";
import { readFile, appendToFile, cleanText } from "./util";

const BOT_NAME = "DALLA";

const dalla = async (): Promise<void> => {
  const prompt = await readFile("./prompts/dalla.txt");
  if (!prompt) {
    console.log(`${BOT_NAME}: You're not asking anything!`);
    return;
  }
  const response: string | null = await gtp3Completion({
    prompt: `${prompt}\n\n:`,
    stop: ["\n\n"],
    temperature: 0.9,
    user: "dalla-prompt-generator",
    model: MODELS.davinci,
  });

  if (!response) {
    console.log(`${BOT_NAME}: I\'m sorry, I don\'t understand.`);
    return;
  }
  console.log(`${BOT_NAME}: ${response}`);
  await appendToFile("./logs", "dalla.txt", response);
};

dalla();
