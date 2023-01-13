import 'module-alias/register';

import { composePrompt, estimateTokenLength, gtp3Completion, summarize } from "@/openai";
import { appendToFile, cleanText, getTimestamp, getUserInput, makeLog, readFile, debugLog } from '@/util';

const BOT_NAME = 'DOT'
const FILENAME = `dot-${getTimestamp()}.txt`
const MAX_CURRENT_CONVO_TOKEN_LENGTH = 30 // if conversation is longer than this, summarize it (except last 4 messages)
const LAST_CONVO_MEMORY = 4 // how many messages from convo ALWAYS prepend to prompt

const conversation: string[] = []
let summary = ''
let summarizedConvoIndex = 0 // up to what index convo was summarized

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

    summary = await summarize(getConvoToSummarize().join('\n'))
    summarizedConvoIndex = conversation.length - LAST_CONVO_MEMORY
  }
}

async function handleConversation() {
  const userInput = await getUserInput('USER: ');

  const initPrompt = await readFile('./prompts/dot.txt')

  if (!initPrompt) {
    console.error('Could not read init prompt')
    return
  }

  await handleSummary({ mock: true })

  const lastConvo = conversation.slice(-LAST_CONVO_MEMORY).join('\n\n')

  const prompt = composePrompt([initPrompt, summary, lastConvo, `USER: ${userInput}`, `${BOT_NAME}: `], '\n\n')

  if (!prompt) {
    console.error(`Invalid prompt`);
    return;
  }

  debugLog([
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
  ])

  conversation.push(`USER: ${userInput}`)

  const response = await gtp3Completion({ prompt, stop: [`${BOT_NAME}:`, 'USER:'], temperature: 0.7, max_tokens: 400, user: 'dot-chatbot' }, { mock: true });

  if (!response) {
    console.log(`${BOT_NAME}: I'm sorry, I don't understand.`);
    return;
  }

  console.log(`${BOT_NAME}: ${response}`);
  conversation.push(`${BOT_NAME}: ${response}`)
  logConversation(userInput, response)


  // make summary of all previous conversation down to X tokens, if conversation is longer than X chars (ignore last Y messages that we keep for continuity)
  // store in-memory
  // get user input
  // make prompt (summary + last Y messages + input)
  // get response from gpt3
  // log user input and response
}

async function dot() {
  // initialize conversation
  while (true) {
    await handleConversation();



  }
}

async function logConversation(userInput: string, botResponse: string): Promise<void> {
  const log: string = makeLog({ prompt: `USER: ${cleanText(userInput)}`, response: `${BOT_NAME}: ${cleanText(botResponse)}` });
  await appendToFile('./logs/hal', FILENAME, log);
}

dot()