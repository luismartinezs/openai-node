/**
 * Dot is a chatbot that uses GPT-3 to have a conversation with you. It remembers the conversation somewhat, to do that, it summarizes the conversation up to a certain point, and then appends the summary and the last few messages to the prompt.
 */
import 'module-alias/register';

import { composePrompt, estimateTokenLength, gtp3Completion, summarize } from "@/openai";
import { appendToFile, cleanText, getUserInput, makeLog, readFile, debugLog, useState } from '@/util';

import {
  BOT_NAME,
  BOT_MODEL,
  FILENAME,
  LAST_CONVO_MEMORY,
  MAX_CURRENT_CONVO_TOKEN_LENGTH,
  MOCK,
  SUMMARY_MAX_TOKENS,
  SUMMARIZE_SUMMARY,
  SUMMARIZATION_MODEL,
  debugOptions
} from './config'

// Convo variables
const [conversation, setConversation] = useState<string[]>([])
const [summary, setSummary] = useState('')
const [summarizedConvoIndex, setSummarizedConvoIndex] = useState(0) // up to what index convo was summarized so far

function getConvoToSummarize(conversation: string[], _summarizedConvoIndex: number, lastConvoMemory: number) {
  const startIndex = _summarizedConvoIndex - conversation.length - 1;
  return conversation.slice(startIndex, -lastConvoMemory);
}

function getUnsummarizedConvo(conversation: string[], _summarizedConvoIndex: number) {
  const startIndex = _summarizedConvoIndex - conversation.length - 1;
  return conversation.slice(startIndex);
}

type SummaryOptions = {
  mock?: boolean
}

async function handleSummary(options: SummaryOptions = {}) {
  const defaultOptions = {
    mock: false
  }

  const { mock } = { ...defaultOptions, ...options }

  const convoToSummarize = getConvoToSummarize(conversation, summarizedConvoIndex, LAST_CONVO_MEMORY)

  if (estimateTokenLength(convoToSummarize.join('')) > MAX_CURRENT_CONVO_TOKEN_LENGTH) {

    if (mock) {
      setSummarizedConvoIndex(conversation.length - LAST_CONVO_MEMORY)
      setSummary(`This is a mock summary of the conversation from the start up to the ${summarizedConvoIndex}th message`)
      return
    }

    const _toSummarize = SUMMARIZE_SUMMARY ? `${summary}\n${convoToSummarize.join('\n')}` : convoToSummarize.join('\n')

    const _newSummary = await summarize(`Conversation between USER and ${BOT_NAME} (a bot)\n\n${_toSummarize}`, { max_tokens: SUMMARY_MAX_TOKENS, model: SUMMARIZATION_MODEL })
    setSummary(SUMMARIZE_SUMMARY ? _newSummary : `${summary}\n${_newSummary}`)
    setSummarizedConvoIndex(conversation.length - LAST_CONVO_MEMORY)
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
  const convoToSummarize = getConvoToSummarize(conversation, summarizedConvoIndex, LAST_CONVO_MEMORY)
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
      block: getUnsummarizedConvo(conversation, summarizedConvoIndex)
    },
    {
      label: 'convo to summarize',
      block: convoToSummarize
    },
    {
      label: 'convo to summarize token length',
      block: estimateTokenLength(convoToSummarize.join(''))
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

  debug({ prompt, ...debugOptions })

  setConversation([...conversation, `USER: ${userInput}`])

  const response = await gtp3Completion({ prompt, stop: [`${BOT_NAME}:`, 'USER:'], temperature: 0.7, max_tokens: 400, user: 'dot-chatbot', model: BOT_MODEL }, { mock: MOCK });

  if (!response) {
    console.log(`${BOT_NAME}: I'm sorry, I don't understand.`);
    return;
  }

  console.log(`${BOT_NAME}: ${response}`);
  setConversation([...conversation, `${BOT_NAME}: ${response}`])
  logConversation(userInput, response)
}

export async function dot() {
  // initialize conversation
  while (true) {
    await handleConversation();
  }
}
