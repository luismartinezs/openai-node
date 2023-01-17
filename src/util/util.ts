const fs = require("fs");
const readline = require("readline");

function createFolderIfNotExist(path: string) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

function createFileIfNotExist(path: string, filename: string) {
  createFolderIfNotExist(path);

  const newPath = `${path}/${filename}`;
  if (!fs.existsSync(newPath)) {
    fs.writeFileSync(newPath, "[]");
  }
}

async function readFile(path: string): Promise<string | null> {
  try {
    const data: string = fs.readFileSync(path, "utf8");
    return data;
  } catch (err) {
    console.error(err);
  }
  return null;
}

function writeToFile(path: string, filename: string, data: string): void {
  try {
    createFolderIfNotExist(path);
    const newPath = `${path}/${filename}`;
    fs.writeFileSync(newPath, data);
  } catch (err) {
    console.error(err);
  }
}

async function saveJson<Data>(
  path: string,
  filename: string,
  data: Data
): Promise<void> {
  try {
    const newPath = `${path}/${filename}`;

    createFileIfNotExist(path, filename);
    await fs.promises.writeFile(newPath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(err);
  }
}

async function appendToFile(
  path: string,
  filename: string,
  data: string
): Promise<void> {
  try {
    const newPath = `${path}/${filename}`;
    fs.appendFileSync(newPath, data);
  } catch (err) {
    console.error(err);
  }
}

function readJson(path: string) {
  const fileData = fs.readFileSync(path, "utf8");

  if (fileData) {
    return JSON.parse(fileData);
  }

  return null;
}

async function appendToJSONArray(
  path: string,
  filename: string,
  data: { content: string; vector: number[] }[]
): Promise<void> {
  try {
    const newPath = `${path}/${filename}`;

    createFileIfNotExist(path, filename);

    let jsonData = [];

    const fileData = fs.readFileSync(newPath, "utf8");
    // Parse the JSON
    jsonData = fileData ? JSON.parse(fileData) : [];

    // Append the new data
    jsonData.push(...data);
    // Write the updated JSON back to the file
    fs.writeFileSync(newPath, JSON.stringify(jsonData));
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

function getTimestamp() {
  const date: Date = new Date();
  return date.toISOString().replace(/[-T:]/g, "").replace(/\..+/, "");
}

export {
  readFile,
  writeToFile,
  appendToFile,
  getUserInput,
  getTimestamp,
  appendToJSONArray,
  readJson,
  saveJson,
};
