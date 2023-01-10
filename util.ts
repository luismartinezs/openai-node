import fs from 'fs';
import readline from 'readline';

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
  const rl: readline.ReadLine = readline.createInterface({
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

export {
  readFile,
  writeToFile,
  appendToFile,
  getUserInput
};