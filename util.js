const fs = require('fs');
const readline = require('readline')

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


async function getUserInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

module.exports = {
  readFile,
  writeToFile,
  appendToFile,
  getUserInput
};