
const { Configuration, OpenAIApi } = require("openai");

const { MODELS } = require("./constants/models");
const { appendToFile, getUserInput } = require("./util");

const BOT_NAME = 'NEMO'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

function makeLog(prompt, response) {
  return `${cleanText(prompt)}\n${cleanText(response)}\n`;
}

async function gtp3Completion(openaiOptions = {}) {
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

    return completion.data.choices[0].text.trim();
  } catch (err) {
    console.error(err);
  }
}

function cleanText(text) {
  return text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

// a chatbot without any memory
const nemo = async () => {
  console.log(`${BOT_NAME}: Welcome to Nemo! A chatbot with zero memory. Ask me anything! ctrl/cmd + C to quit.`);
  while (true) {
    const userInput = await getUserInput('USER: ');
    const prompt = `USER: ${cleanText(userInput)}\n${BOT_NAME}:`
    const response = await gtp3Completion({ prompt, stop: [`${BOT_NAME}:`, 'USER:'], temperature: 0.2 })
    console.log(`${BOT_NAME}: ${response}`)
    const log = makeLog(`USER: ${cleanText(userInput)}`, `${BOT_NAME}: ${cleanText(response)}`);
    await appendToFile('./logs', 'nemo.txt', log);
  }
}

nemo()