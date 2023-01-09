const fs = require('fs');

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

module.exports = {
  readFile,
  writeToFile,
  appendToFile,
};