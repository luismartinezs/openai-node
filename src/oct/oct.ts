import "module-alias/register";
const fs = require("fs");
const path = require("path");
import { v4 as uuid } from "uuid";
const isEqual = require("lodash.isequal");

import { gpt3Embedding, gpt3Completion } from "@/openai";
import {
  getTimestamp,
  getUserInput,
  readFile,
  saveJson,
  dotProduct,
} from "@/util";
import { models, type ModelTypes } from "@/constants";

type OctConfig = {
  botName: string;
  userName: string;
  logsPathName: string;
  embeddingModel: ModelTypes;
  summarizationModel: ModelTypes;
  gpt3User: string;
};

export type Log = {
  uuid: string;
  time: number;
  message: string;
  vector: number[];
  speaker: string;
};

type WithScore<T> = T & { score: number };

type Memory = WithScore<Log>;

function oct(config: Partial<OctConfig> = {}) {
  const defaultConfig = {
    botName: "OCT",
    userName: "USER",
    logsPathName: "oct_chat_logs",
    embeddingModel: models["adaEmbedding"],
    summarizationModel: models["davinci"],
    gpt3User: "oct-chatbot",
  };
  const {
    botName,
    userName,
    logsPathName,
    summarizationModel,
    embeddingModel,
    gpt3User,
  } = {
    ...defaultConfig,
    ...config,
  };

  function similarity(v1: number[], v2: number[]): number {
    return dotProduct(v1, v2);
  }

  async function loadJsonFiles(): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(logsPathName);
      return files.filter((file: string) => path.extname(file) === ".json");
    } catch (err) {
      console.error("Could not read logs directory", err);
      return [];
    }
  }

  function isLog(data: unknown): data is Log {
    const requiredProperties = ["uuid", "time", "message", "vector", "speaker"];
    return requiredProperties.every((prop) =>
      Object.prototype.hasOwnProperty.call(data, prop)
    );
  }

  async function parseJsonFilesToLogs(jsonData: string[]): Promise<Log[]> {
    const result: Log[] = [];

    for (const file of jsonData) {
      try {
        const data = JSON.parse(
          await fs.promises.readFile(path.join(logsPathName, file), "utf-8")
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

  async function loadConversation(): Promise<Log[]> {
    const jsonFiles = await loadJsonFiles();
    const logs = await parseJsonFilesToLogs(jsonFiles);

    const sortedOldestFirst = logs.sort(
      (a, b) => Number(a.time) - Number(b.time)
    );
    return sortedOldestFirst;
  }

  // pull episodic memories from the conversation
  // TODO - fetch declarative memories (facts, wikis, KB, company data, internet, etc)
  function fetchMemories(
    vector: number[],
    logs: Log[],
    count: number
  ): Memory[] {
    if (vector.length === 0) {
      throw new Error("vector must not be empty");
    }
    if (count < 1) {
      throw new Error("count must be positive");
    }

    return logs
      .filter((log) => !isEqual(vector, log.vector))
      .map((log) => {
        const score = similarity(log.vector, vector);
        return { ...log, time: Number(log.time), score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  function buildPrompt(promptHeader: string | null, block: string): string {
    if (promptHeader) {
      return promptHeader.replace("<<INPUT>>", block);
    } else {
      return block;
    }
  }

  function parseMemories(memories: Memory[]): string {
    return memories
      .map((mem) => `${mem.speaker}: ${mem.message}`)
      .join("\n\n")
      .trim();
  }

  async function getPromptHeader(): Promise<string | null> {
    return await readFile("prompts/oct_notes.txt");
  }

  async function summarizeMemories(memories: Memory[]): Promise<string | null> {
    const parsedMemories = await parseMemories(
      memories.sort((a, b) => a.time - b.time)
    );
    const promptHeader = await getPromptHeader();
    const prompt = buildPrompt(promptHeader, parsedMemories);

    return gpt3Completion({
      prompt,
      model: summarizationModel,
      stop: [`${botName}:`, `${userName}:`],
      user: gpt3User,
    });
  }

  function getLastMessages(conversation: Log[], limit: number): string {
    return conversation
      .slice(-limit)
      .map((log) => `${log.speaker}: ${log.message}`)
      .join("\n\n")
      .trim();
  }

  async function handleEmbedding(
    input: string,
    speaker: string
  ): Promise<number[]> {
    const inputVector = await gpt3Embedding(input, {
      model: embeddingModel,
    });
    const time = getTimestamp();
    const info: Log = {
      uuid: uuid(),
      time: Number(time),
      speaker,
      message: input,
      vector: inputVector,
    };
    const filename = `log-${time}-${speaker}.json`;
    saveJson<Log>(logsPathName, filename, info);
    return inputVector;
  }

  async function buildConversationPrompt(replacements: [string, string][]) {
    let rawPrompt = await readFile("prompts/oct_response.txt");

    if (typeof rawPrompt === "string") {
      replacements.forEach(([key, value]) => {
        rawPrompt = (rawPrompt as string).replace(key, value);
      });
    } else {
      throw new Error("Could not read conversation prompt");
    }

    return rawPrompt;
  }

  async function getOutput(prompt: string) {
    return gpt3Completion({
      prompt,
      model: summarizationModel,
      stop: [`${botName}:`, `${userName}:`],
      user: gpt3User,
    });
  }

  async function handleConversation() {
    const userInput = await getUserInput(`\n\n${userName}: `);
    const inputVector = await handleEmbedding(userInput, userName);
    const conversation = await loadConversation();
    const memories = fetchMemories(inputVector, conversation, 10);
    const notes = (await summarizeMemories(memories)) || "";
    const lastMessages = getLastMessages(conversation, 10);
    const prompt = await buildConversationPrompt([
      ["<<NOTES>>", notes],
      ["<<CONVERSATION>>", lastMessages],
    ]);
    const output = await getOutput(prompt);

    if (output) {
      handleEmbedding(output, botName);
    } else {
      throw new Error("Could not generate a response from GPT-3");
    }

    console.log(`\n\n${botName}: ${output}`);
  }

  async function init() {
    while (true) {
      await handleConversation();
    }
  }

  return {
    init,
  };
}

export default oct;
export { oct };
