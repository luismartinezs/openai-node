/**
 * Dot is a chatbot that uses GPT-3 to have a conversation with you. It remembers the conversation somewhat, to do that, it summarizes the conversation up to a certain point, and then appends the summary and the last few messages to the prompt.
 */
import "module-alias/register";

import {
  composePrompt,
  estimateTokenLength,
  gpt3Completion,
  summarize,
} from "@/openai";
import {
  appendToFile,
  cleanText,
  getUserInput,
  makeLog,
  readFile,
  debugLog,
  useState,
  getTimestamp,
} from "@/util";
import { type ModelTypes, models } from "@/constants";

type DotConfig = {
  botName: string;
  filename: string;
  maxCurrentConvoTokenLength: number;
  lastConvoMemory: number;
  summarizeSummary: boolean;
  summaryMaxTokens: number;
  botModel: ModelTypes;
  summarizationModel: ModelTypes;
  mock: boolean;
  debugOptions: {
    toConsole: boolean;
    toFile: boolean;
  };
};

/**
 *
 * dot config:
 *
 * maxCurrentConvoTokenLength: if conversation is longer than this, summarize it (except last LAST_CONVO_MEMORY messages)
 *
 * lastConvoMemory: how many messages from convo ALWAYS prepend to prompt
 *
 * summarizeSummary: if true, summarize the summary and the last lastConvoMemory-th messages. If false, only summarize the last lastConvoMemory-th messages AND append to existing summary. Setting it to false will make the summary longer and longer, so for now set it to true
 *
 * summaryMaxTokens: max tokens for summary, should probably be smaller or equal to maxCurrentConvoTokenLength
 *
 * botModel: model for bot
 *
 * summarizationModel: model for summarization, maybe you can get away with using a cheaper model for summarization than for the bot and still have things work decently
 *
 * mock: if true, don't call openai api
 *
 * debugOptions: {
 *  toConsole: if true, log debug info to console
 *  toFile: if true, log debug info to file
 * }
 */
function dot(config: Partial<DotConfig> = {}) {
  // config
  const defaultConfig = {
    botName: "DOT",
    filename: `dot-${getTimestamp()}.txt`,
    maxCurrentConvoTokenLength: 1000,
    lastConvoMemory: 4,
    summarizeSummary: true,
    summaryMaxTokens: 800,
    botModel: models.davinci,
    summarizationModel: models.curie,
    mock: false,
    debugOptions: {
      toConsole: false,
      toFile: false,
    },
  };

  const debugOptions = {
    ...defaultConfig.debugOptions,
    ...config.debugOptions,
  };

  const {
    botName,
    filename,
    maxCurrentConvoTokenLength,
    lastConvoMemory,
    summarizeSummary,
    summaryMaxTokens,
    botModel,
    summarizationModel,
    mock,
  } = { ...defaultConfig, ...config };

  // state
  const [conversation, setConversation] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [summarizedConvoIndex, setSummarizedConvoIndex] = useState(0); // up to what index convo was summarized so far

  // getters (computed state)
  function getConvoToSummarize() {
    const startIndex = summarizedConvoIndex() - conversation().length - 1;
    return conversation().slice(startIndex, -lastConvoMemory);
  }

  function getUnsummarizedConvo() {
    const startIndex = summarizedConvoIndex() - conversation().length - 1;
    return conversation().slice(startIndex);
  }

  function shouldSummarize() {
    return (
      estimateTokenLength(getConvoToSummarize().join("")) >
      maxCurrentConvoTokenLength
    );
  }

  // methods
  function handleMockSummarize() {
    setSummarizedConvoIndex(conversation().length - lastConvoMemory);
    setSummary(
      `This is a mock summary of the conversation from the start up to the ${summarizedConvoIndex()}th message`
    );
  }

  async function handleSummary() {
    if (shouldSummarize()) {
      if (mock) {
        handleMockSummarize();
        return;
      }

      const summaryPrompt = `Conversation between USER and ${botName} (a bot)\n\n${
        summarizeSummary
          ? `${summary()}\n${getConvoToSummarize().join("\n")}`
          : getConvoToSummarize().join("\n")
      }`;

      const _newSummary = await summarize(summaryPrompt, {
        max_tokens: summaryMaxTokens,
        model: summarizationModel,
      });
      setSummary(
        summarizeSummary ? _newSummary : `${summary()}\n${_newSummary}`
      );
      setSummarizedConvoIndex(conversation().length - lastConvoMemory);
    }
  }

  async function logConversationToFile(
    userInput: string,
    botResponse: string
  ): Promise<void> {
    try {
      const log: string = makeLog({
        prompt: `USER: ${cleanText(userInput)}`,
        response: `${botName}: ${cleanText(botResponse)}`,
      });
      await appendToFile(`./logs/${botName.toLowerCase()}`, filename, log);
    } catch (error) {
      console.log("Error in logging conversation to file", error);
    }
  }

  function debug(prompt: string) {
    const args = [
      {
        label: "prompt",
        block: prompt,
      },
      {
        label: "convo",
        block: conversation(),
      },
      {
        label: "unsummarized convo",
        block: getUnsummarizedConvo(),
      },
      {
        label: "convo to summarize",
        block: getConvoToSummarize(),
      },
      {
        label: "convo to summarize token length",
        block: estimateTokenLength(getConvoToSummarize().join("")),
      },
      { label: "summary", block: summary() },
    ];
    if (debugOptions.toConsole) {
      debugLog(args);
    }
    if (debugOptions.toFile) {
      debugLog(args, (log) =>
        appendToFile(
          `./logs/${botName.toLowerCase()}`,
          `debug-${filename}`,
          `\n${log}\n`
        )
      );
    }
  }

  async function handleConversation() {
    console.log("\n");
    const userInput = await getUserInput("USER: ");

    const initPrompt = await readFile("./prompts/dot.txt");

    if (!initPrompt) {
      console.error("Could not read init prompt");
      return;
    }

    await handleSummary();

    const lastConvo = conversation().slice(-lastConvoMemory).join("\n\n");

    const prompt = composePrompt(
      [initPrompt, summary(), lastConvo, `USER: ${userInput}`, `${botName}: `],
      "\n\n"
    );

    if (!prompt) {
      console.error(`Invalid prompt`);
      return;
    }

    debug(prompt);

    setConversation([...conversation(), `USER: ${userInput}`]);

    const response = await gpt3Completion(
      {
        prompt,
        stop: [`${botName}:`, "USER:"],
        temperature: 0.7,
        max_tokens: 400,
        user: "dot-chatbot",
        model: botModel,
      },
      { mock }
    );

    if (!response) {
      console.log(`\n\n${botName}: I'm sorry, I don't understand.`);
      return;
    }

    console.log(`\n\n${botName}: ${response}`);
    setConversation([...conversation(), `${botName}: ${response}`]);
    logConversationToFile(userInput, response);
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

export default dot;
export { dot };
