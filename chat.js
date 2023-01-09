
const { Configuration, OpenAIApi } = require("openai");

const { MODELS } = require("./constants/models");
const { readFile, appendToFile } = require("./util");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

function makeLog(prompt, response) {
  return `${prompt.trim()}\n\n${response.trim()}\n\n`;
}

async function gtp3Completion(openaiOptions = {}) {
  const defaultOpenaiOptions = {
    model: MODELS.babbage,
    max_tokens: 100,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ["\n"],
  }

  try {
    const completion = await openai.createCompletion({ ...defaultOpenaiOptions, ...openaiOptions });

    return completion.data.choices[0].text;
  } catch (err) {
    console.error(err);
  }
}

const chat = async () => {
  const prompt = (await readFile("./prompt.txt")).trim();
  const response = await gtp3Completion({ prompt })
  const log = makeLog(prompt, response);
  await appendToFile('./logs', 'response.txt', log);
}

chat()