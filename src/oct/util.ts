import "module-alias/register";
const fs = require("fs");
const path = require("path");
const isEqual = require("lodash.isequal");

import { dotProduct } from "@/util";

import { Log, Memory } from "./types";

function calcEmbeddingSimilarity(v1: number[], v2: number[]): number {
  return dotProduct(v1, v2);
}

function isLog(data: unknown): data is Log {
  const requiredProperties = ["uuid", "time", "message", "vector", "speaker"];
  return requiredProperties.every((prop) =>
    Object.prototype.hasOwnProperty.call(data, prop)
  );
}

// pull episodic memories from the conversation
// TODO - fetch declarative memories (facts, wikis, KB, company data, internet, etc)
function fetchMemories(vector: number[], logs: Log[], count: number): Memory[] {
  if (vector.length === 0) {
    throw new Error("vector must not be empty");
  }
  if (count < 1) {
    throw new Error("count must be positive");
  }

  return logs
    .filter((log) => !isEqual(vector, log.vector))
    .map((log) => {
      const score = calcEmbeddingSimilarity(log.vector, vector);
      return { ...log, time: Number(log.time), score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

async function parseJsonFilesToLogs(
  jsonData: string[],
  pathName: string
): Promise<Log[]> {
  const result: Log[] = [];

  for (const file of jsonData) {
    try {
      const data = JSON.parse(
        await fs.promises.readFile(path.join(pathName, file), "utf-8")
      );
      if (isLog(data)) {
        result.push(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return result;
}

async function loadJsonLogFiles(pathName: string): Promise<string[]> {
  try {
    const files = await fs.promises.readdir(pathName);
    return files.filter((file: string) => path.extname(file) === ".json");
  } catch (err) {
    console.error("Could not read logs directory", err);
    return [];
  }
}

function buildPrompt(promptHeader: string | null, block: string): string {
  if (promptHeader) {
    return promptHeader.replace("<<INPUT>>", block);
  } else {
    return block;
  }
}

function parseMemories(memories: Memory[]): string {
  return [...memories]
    .sort((a, b) => a.time - b.time)
    .map((mem) => `${mem.speaker}: ${mem.message}`)
    .join("\n\n")
    .trim();
}

function getLastMessages(conversation: Log[], limit: number): string {
  return conversation
    .slice(-limit)
    .map((log) => `${log.speaker}: ${log.message}`)
    .join("\n\n")
    .trim();
}

export {
  calcEmbeddingSimilarity,
  isLog,
  fetchMemories,
  parseJsonFilesToLogs,
  loadJsonLogFiles,
  buildPrompt,
  parseMemories,
  getLastMessages,
};
