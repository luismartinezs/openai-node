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
    const newPath: string = `${path}/${filename}`;
    fs.writeFileSync(newPath, data);
  } catch (err) {
    console.error(err);
  }
}

async function appendToFile(path: string, filename: string, data: string): Promise<void> {
  try {
    const newPath: string = `${path}/${filename}`;
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

export {
  readFile,
  writeToFile,
  appendToFile,
  getUserInput,
  cleanText,
  getTimestamp
};