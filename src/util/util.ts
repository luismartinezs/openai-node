const fs = require('fs');
const readline = require('readline');

async function readFile(path: string): Promise<string | null> {
  try {
    const data: string = fs.readFileSync(path, 'utf8');
    return data;
  } catch (err) {
    console.error(err);
  }
  return null;
}

async function writeToFile(path: string, filename: string, data: string): Promise<void> {
  try {
    const newPath = `${path}/${filename}`;
    fs.writeFileSync(newPath, data);
  } catch (err) {
    console.error(err);
  }
}

async function appendToFile(path: string, filename: string, data: string): Promise<void> {
  try {
    const newPath = `${path}/${filename}`;
    fs.appendFileSync(newPath, data);
  } catch (err) {
    console.error(err);
  }
}


async function getUserInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });
}

function cleanText(text: string): string {
  return text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

function getTimestamp() {
  const date: Date = new Date();
  return date.toISOString().replace(/[-T:]/g, '').replace(/\..+/, '')
}

function makeLog({ prompt, response }: {
  prompt?: string,
  response?: string
}): string {
  let log = ''

  if (prompt) {
    log += `${cleanText(prompt)}\n`
  }
  if (response) {
    log += `${cleanText(response)}\n`
  }

  return log;
}


function debugLog(logs: { label: string, block: any }[], log = console.log) {
  const thickHr = '==============='
  const hr = '------------'
  log(`${thickHr}DEBUG LOG${thickHr}`)
  logs.forEach(({ label, block }) => {
    log(`${hr}${label}${hr}`)
    log(block)
  })
  log(`${thickHr}DEBUG LOG END${thickHr}`)
}


export {
  readFile,
  writeToFile,
  appendToFile,
  getUserInput,
  cleanText,
  getTimestamp,
  makeLog,
  debugLog
};