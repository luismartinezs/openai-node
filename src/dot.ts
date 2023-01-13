/**
 * Dot is a chatbot that uses GPT-3 to have a conversation with you. It remembers the conversation somewhat, to do that, it summarizes the conversation up to a certain point, and then appends the summary and the last few messages to the prompt.
 */
import 'module-alias/register';

import { composePrompt, estimateTokenLength, gtp3Completion, summarize } from "@/openai";
import { appendToFile, cleanText, getTimestamp, getUserInput, makeLog, readFile, debugLog } from '@/util';
import { MODELS } from '@/constants'

const MOCK = false

// Params
const BOT_NAME = 'DOT'
const FILENAME = `dot-${getTimestamp()}.txt`
const MAX_CURRENT_CONVO_TOKEN_LENGTH = 100 // 1000 // if conversation is longer than this, summarize it (except last LAST_CONVO_MEMORY messages)
const LAST_CONVO_MEMORY = 4 // how many messages from convo ALWAYS prepend to prompt
const SUMMARIZE_SUMMARY = true // add previous summary to the part to summarize and refresh summary, otherwise just summarize the last messages and append to existing summary. Setting it to false will make the summary longer and longer, so for now set it to true
const SUMMARY_MAX_TOKENS = 100 // 800 // max tokens for summary, should probably be smaller or equal to MAX_CURRENT_CONVO_TOKEN_LENGTH
const BOT_MODEL = MODELS.curie
const SUMMARIZATION_MODEL = MODELS.davinci

const conversation: string[] = []
let summary = ''
let summarizedConvoIndex = 0 // up to what index convo was summarized so far

function getConvoToSummarize() {
  return conversation.slice(summarizedConvoIndex - conversation.length - 1, -LAST_CONVO_MEMORY)
}

function getUnsummarizedConvo() {
  return conversation.slice(summarizedConvoIndex - conversation.length - 1)
}

type SummaryOptions = {
  mock?: boolean
}

async function handleSummary(options: SummaryOptions = {}) {
  const defaultOptions = {
    mock: false
  }

  const { mock } = { ...defaultOptions, ...options }

  if (estimateTokenLength(getConvoToSummarize().join('')) > MAX_CURRENT_CONVO_TOKEN_LENGTH) {

    if (mock) {
      summarizedConvoIndex = conversation.length - LAST_CONVO_MEMORY
      summary = `This is a mock summary of the conversation from the start up to the ${summarizedConvoIndex}th message`
      return
    }

    const _toSummarize = SUMMARIZE_SUMMARY ? `${summary}\n${getConvoToSummarize().join('\n')}` : getConvoToSummarize().join('\n')

    const _newSummary = await summarize(`Conversation between USER and ${BOT_NAME} (a bot)\n\n${_toSummarize}`, { max_tokens: SUMMARY_MAX_TOKENS, model: SUMMARIZATION_MODEL })
    summary = SUMMARIZE_SUMMARY ? _newSummary : `${summary}\n${_newSummary}`
    summarizedConvoIndex = conversation.length - LAST_CONVO_MEMORY
  }
}

async function logConversation(userInput: string, botResponse: string): Promise<void> {
  const log: string = makeLog({ prompt: `USER: ${cleanText(userInput)}\n`, response: `${BOT_NAME}: ${cleanText(botResponse)}\n` });
  await appendToFile(`./logs/${BOT_NAME.toLowerCase()}`, FILENAME, log);
}

function debug({ prompt, toConsole = false, toFile = false }: {
  prompt: string;
  toConsole?: boolean;
  toFile?: boolean;
}) {
  const args = [
    {
      label: 'prompt',
      block: prompt
    },
    {
      label: 'convo',
      block: conversation
    },
    {
      label: 'unsummarized convo',
      block: getUnsummarizedConvo()
    },
    {
      label: 'convo to summarize',
      block: getConvoToSummarize()
    },
    {
      label: 'convo to summarize token length',
      block: estimateTokenLength(getConvoToSummarize().join(''))
    }
    ,
    { label: 'summary', block: summary }
  ]
  if (toConsole) {
    debugLog(args)
  }
  if (toFile) {
    debugLog(args, (log) => appendToFile(`./logs/${BOT_NAME.toLowerCase()}`, `debug-${FILENAME}`, `\n${log}\n`))
  }
}

async function handleConversation() {
  const userInput = await getUserInput('USER: ');

  const initPrompt = await readFile('./prompts/dot.txt')

  if (!initPrompt) {
    console.error('Could not read init prompt')
    return
  }

  await handleSummary({ mock: MOCK })

  const lastConvo = conversation.slice(-LAST_CONVO_MEMORY).join('\n\n')

  const prompt = composePrompt([initPrompt, summary, lastConvo, `USER: ${userInput}`, `${BOT_NAME}: `], '\n\n')

  if (!prompt) {
    console.error(`Invalid prompt`);
    return;
  }

  debug({ prompt, toConsole: false, toFile: true })

  conversation.push(`USER: ${userInput}`)

  const response = await gtp3Completion({ prompt, stop: [`${BOT_NAME}:`, 'USER:'], temperature: 0.7, max_tokens: 400, user: 'dot-chatbot', model: BOT_MODEL }, { mock: MOCK });

  if (!response) {
    console.log(`${BOT_NAME}: I'm sorry, I don't understand.`);
    return;
  }

  console.log(`${BOT_NAME}: ${response}`);
  conversation.push(`${BOT_NAME}: ${response}`)
  logConversation(userInput, response)
}

async function dot() {
  // initialize conversation
  while (true) {
    await handleConversation();
  }
}

dot()