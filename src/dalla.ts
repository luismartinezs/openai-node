import { models } from "@/constants";
import { gpt3Completion } from "@/openai";
import { readFile, appendToFile } from "./util/util";

const BOT_NAME = "DALLA";

async function getPrompt(): Promise<string> {
  const prompt = await readFile("./prompts/dalla.txt");
  if (!prompt) {
    throw new Error(`There was an error getting the prompt`);
  }
  return prompt;
}

const dalla = async (): Promise<void> => {
  const prompt = await getPrompt();
  let response;
  try {
    response = await gpt3Completion({
      prompt: `${prompt}\n\n:`,
      stop: ["\n\n"],
      temperature: 0.9,
      user: "dalla-prompt-generator",
      model: models.davinci,
    });
  } catch (err) {
    if (err instanceof Error) {
      console.error(`${BOT_NAME}: ${err.message}`);
    } else {
      console.error(`${BOT_NAME}: I'm sorry, I don't understand.`);
    }
  }

  if (!response) {
    console.log(`${BOT_NAME}: I'm sorry, I don't understand.`);
    return;
  }
  console.log(`${BOT_NAME}: ${response}`);
  await appendToFile("./logs", "dalla.txt", `\n\n${response}`);
};

dalla();
