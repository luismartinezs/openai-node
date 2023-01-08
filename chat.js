const fs = require('fs');

const { Configuration, OpenAIApi } = require("openai");

const { MODELS } = require("./constants/models");

async function readFile(path) {
  try {
    const data = fs.readFileSync(path, 'utf8');
    return data
  } catch (err) {
    console.error(err);
  }
  return null
}

async function writeToFile(path, filename, data) {
  try {
    const newPath = `${path}/${filename}`;
    fs.writeFileSync(newPath, data);
  } catch (err) {
    console.error(err);
  }
}

async function appendToFile(path, filename, data) {
  try {
    const newPath = `${path}/${filename}`;
    fs.appendFileSync(newPath, data);
  } catch (err) {
    console.error(err);
  }
}

function makeLog(prompt, response) {
  return `${prompt.trim()}\n\n${response.trim()}\n\n`;
}

const complete = async () => {
  const prompt = (await readFile("./prompt.txt")).trim();
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const completion = await openai.createCompletion({
    model: MODELS.babbage,
    prompt: prompt,
  });

  const log = makeLog(prompt, completion.data.choices[0].text);

  await appendToFile('./logs', 'response.txt', log);
}

complete()