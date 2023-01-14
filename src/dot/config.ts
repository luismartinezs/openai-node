import { MODELS } from '@/constants'
import { getTimestamp } from '@/util';

// Bot params
export const BOT_NAME = 'DOT';
export const FILENAME = `dot-${getTimestamp()}.txt`;
export const MAX_CURRENT_CONVO_TOKEN_LENGTH = 100 // 1000 // if conversation is longer than this, summarize it (except last LAST_CONVO_MEMORY messages)
export const LAST_CONVO_MEMORY = 4 // how many messages from convo ALWAYS prepend to prompt
export const SUMMARIZE_SUMMARY = true // add previous summary to the part to summarize and refresh summary, otherwise just summarize the last messages and append to existing summary. Setting it to false will make the summary longer and longer, so for now set it to true
export const SUMMARY_MAX_TOKENS = 100 // 800 // max tokens for summary, should probably be smaller or equal to MAX_CURRENT_CONVO_TOKEN_LENGTH
export const BOT_MODEL = MODELS.curie
export const SUMMARIZATION_MODEL = MODELS.davinci

// Mock constants
export const MOCK = false

// Constants for the debug
export const debugOptions = {
  toConsole: false,
  toFile: true
}