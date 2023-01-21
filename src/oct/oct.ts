import "module-alias/register";
import { v4 as uuid } from "uuid";

import { gpt3Embedding, gpt3Completion } from "@/openai";
import { getTimestamp, getUserInput, readFile, saveJson } from "@/util";
import { models } from "@/constants";

import {
  parseJsonFilesToLogs,
  fetchMemories,
  loadJsonLogFiles,
  buildPrompt,
  parseMemories,
  getLastMessages,
} from "./util";
import { Log, Memory, OctConfig } from "./types";

const defaultConfig = {
  botName: "OCT",
  userName: "USER",
  logsPathName: "oct_chat_logs",
  summarizationPromptPathName: "prompts/oct_notes.txt",
  convoPromptPathName: "prompts/oct_response.txt",
  embeddingModel: models.adaEmbedding,
  summarizationModel: models.davinci,
  gpt3User: "oct-chatbot",
};

/**
 * Config:
 *
 * botName: The name of the bot, default: OCT
 *
 * userName: The name of the user, default: USER
 *
 * logsPathName: The path to the directory containing the chat logs, default: oct_chat_logs
 *
 * summarizationPromptPathName: The path to the file containing the prompt for the summarization model, default: prompts/oct_notes.txt
 *
 * convoPromptPathName: The path to the file containing the prompt for the conversation model, default: prompts/oct_response.txt
 *
 * embeddingModel: The model to use for embedding, default: text-embedding-ada-002
 *
 * summarizationModel: The model to use for summarization, default: text-davinci-003
 *
 * gpt3User: The user to use for the GPT-3 API, default: oct-chatbot
 */
function oct(config: Partial<OctConfig> = {}) {
  const {
    botName,
    userName,
    logsPathName,
    summarizationModel,
    embeddingModel,
    gpt3User,
    summarizationPromptPathName,
    convoPromptPathName,
  } = {
    ...defaultConfig,
    ...config,
  };

  async function loadConversation(): Promise<Log[]> {
    const jsonFiles = await loadJsonLogFiles(logsPathName);
    const logs = await parseJsonFilesToLogs(jsonFiles, logsPathName);

    const sortedOldestFirst = logs.sort(
      (a, b) => Number(a.time) - Number(b.time)
    );
    return sortedOldestFirst;
  }

  async function getPromptHeader(): Promise<string | null> {
    return await readFile(summarizationPromptPathName);
  }

  async function summarizeMemories(memories: Memory[]): Promise<string | null> {
    const parsedMemories = await parseMemories(memories);
    const promptHeader = await getPromptHeader();
    const prompt = buildPrompt(promptHeader, parsedMemories);

    return gpt3Completion({
      prompt,
      model: summarizationModel,
      stop: [`${botName}:`, `${userName}:`],
      user: gpt3User,
    });
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

    saveJson<Log>(logsPathName, `log-${time}-${speaker}.json`, info);

    return inputVector;
  }

  async function buildConversationPrompt(replacements: [string, string][]) {
    let rawPrompt = await readFile(convoPromptPathName);

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

  async function handlePrompt(userInput: string) {
    const inputVector = await handleEmbedding(userInput, userName);
    const conversation = await loadConversation();
    const memories = fetchMemories(inputVector, conversation, 10);
    const notes = (await summarizeMemories(memories)) || "";
    const lastMessages = getLastMessages(conversation, 10);

    return buildConversationPrompt([
      ["<<NOTES>>", notes],
      ["<<CONVERSATION>>", lastMessages],
    ]);
  }

  async function handleConversation() {
    const userInput = await getUserInput(`\n\n${userName}: `);
    const prompt = await handlePrompt(userInput);
    const output = await getOutput(prompt);

    if (typeof output === "string") {
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
