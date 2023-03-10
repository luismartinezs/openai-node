import {
  readFile,
  writeToFile,
  appendToFile,
  getUserInput,
  getTimestamp,
  appendToJSONArray,
  readJson,
  saveJson,
} from "./util";
import { makeLog, debugLog } from "./log";
import { cleanText } from "./parse";
import { useState } from "./state";
import { dotProduct } from "./math";

export {
  readFile,
  writeToFile,
  appendToFile,
  appendToJSONArray,
  readJson,
  saveJson,
  getUserInput,
  cleanText,
  getTimestamp,
  makeLog,
  debugLog,
  useState,
  dotProduct,
};
