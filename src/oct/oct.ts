import "module-alias/register";
const fs = require("fs");
const path = require("path");
import { dot, norm } from "mathjs";
import { v4 as uuid } from "uuid";
const isEqual = require("lodash.isequal");

import { gpt3Embedding, gpt3Completion } from "@/openai";
import { getTimestamp, getUserInput, readFile, saveJson } from "@/util";
import { models, type ModelTypes } from "@/constants";

type OctConfig = {
  botName: string;
  userName: string;
  logsPathName: string;
  embeddingModel: ModelTypes;
  summarizationModel: ModelTypes;
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
  };
  const {
    botName,
    userName,
    logsPathName,
    summarizationModel,
    embeddingModel,
  } = {
    ...defaultConfig,
    ...config,
  };

  function dotProduct(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      throw new Error("Vectors must have the same length");
    }
    return (
      dot(vector1, vector2) /
      ((norm(vector1) as number) * (norm(vector2) as number))
    );
  }

  function similarity(v1: number[], v2: number[]): number {
    return dotProduct(v1, v2);
  }

  async function loadConversation(): Promise<Log[]> {
    try {
      const files = await fs.promises.readdir(logsPathName);
      const jsonFiles = files.filter(
        (file: string) => path.extname(file) === ".json"
      );

      const result = [];
      for (const file of jsonFiles) {
        const data = JSON.parse(
          await fs.promises.readFile(path.join(logsPathName, file), "utf-8")
        );
        result.push(data);
      }

      const sortedOldestFirst = result.sort(
        (a, b) => Number(a.time) - Number(b.time)
      );
      return sortedOldestFirst;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  function fetchMemories(
    vector: number[],
    logs: Log[],
    count: number
  ): Memory[] {
    const scores: Memory[] = logs
      .filter((log) => !isEqual(vector, log.vector))
      .map((log) => {
        const score = similarity(log.vector, vector);
        return { ...log, time: Number(log.time), score };
      });
    let ordered = scores.sort((a, b) => b.score - a.score);
    ordered = ordered.slice(0, count);
    return ordered;
  }

  async function summarizeMemories(memories: Memory[]): Promise<string | null> {
    const _memories = memories.sort((a, b) => a.time - b.time);
    let block = "";
    for (const mem of _memories) {
      block += `${mem.speaker}: ${mem.message}\n\n`;
    }
    block = block.trim();
    let prompt = await readFile("prompts/oct_notes.txt");
    if (prompt) {
      prompt = prompt.replace("<<INPUT>>", block);
    } else {
      // TODO this is ugly, refactor
      throw new Error("Could not read prompt file");
    }
    // TODO - do this in the background over time to handle huge amounts of memories
    const notes = await gpt3Completion({
      prompt,
      model: summarizationModel,
      stop: [`${botName}:`, `${userName}:`],
      user: "oct-chatbot",
    });
    return notes;
  }

  function getLastMessages(conversation: Log[], limit: number): string {
    return conversation
      .slice(-limit)
      .map((log: any) => `${log.speaker}: ${log.message}`)
      .join("\n\n")
      .trim();
  }

  async function handleConversation() {
    // handle user input
    const userInput = await getUserInput(`\n\n${userName}: `);
    const inputVector = await gpt3Embedding(userInput, {
      model: embeddingModel,
    });
    const info: Log = {
      uuid: uuid(),
      time: Date.now(),
      speaker: userName,
      message: userInput,
      vector: inputVector,
    };
    const filename = `log-${getTimestamp()}-${userName}.json`;
    saveJson<Log>(logsPathName, filename, info);
    // load conversation
    const conversation = await loadConversation();
    // Compose corpus (fetch memories, etc)
    const memories = fetchMemories(inputVector, conversation, 10); // pull episodic memories
    // TODO - fetch declarative memories (facts, wikis, KB, company data, internet, etc)
    const notes = (await summarizeMemories(memories)) || "";
    const lastMessages = getLastMessages(conversation, 10);
    const prompt =
      (await readFile("prompts/oct_response.txt"))
        ?.replace("<<NOTES>>", notes)
        .replace("<<CONVERSATION>>", lastMessages) || "";
    const output = await gpt3Completion({
      prompt,
      model: summarizationModel,
      stop: [`${botName}:`, `${userName}:`],
      user: "oct-chatbot",
    });
    if (!output) {
      throw new Error("Could not generate output");
    }
    const outputVector = await gpt3Embedding(output, { model: embeddingModel });
    const outputInfo: Log = {
      uuid: uuid(),
      time: Date.now(),
      speaker: botName,
      message: output,
      vector: outputVector,
    };
    const outputFilename = `log-${getTimestamp()}-${botName}.json`;
    saveJson<Log>(logsPathName, outputFilename, outputInfo);
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
