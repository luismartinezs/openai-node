# Playground for OpenAI

NodeJS scripts to interact with openai in different ways, mainly created as a way to challenge myself

## Bots

- Nemo: a quite dumb bot with zero memory, ask it anything.
- Dalla: a prompt generator for ai image generation such as Midjourney. It uses the davinci model because cheaper models won't work at all.
- Hal: a bot with short memory (it remembers up to the last 10 answers). Quitting will reset the memory.
- Dot: bot with memory (it remembers the last 4 answers and a summary of the rest of the conversation).
- Oct: Long term memory bot, it uses embeddings.

## Dev tasks

- [x] Create a script that sends an input and returns response
- [x] Convert to typescript
- [x] Dalla: give a random prompt for AI art generation
- [x] Apply chatGPT refactoring suggestions
- [x] It prepends the history (up to a prompt + character limit) to the input and sends it
- [x] Add eslint and prettier
- [x] It keeps a summary of the history and prepends it to input
- [x] It searches related history entries using embedding and prepends it to prompt, it saves embeddings to log so it's persistent

### Hal

- The bot keeps track of the last 5 answers
- The answers are stored in-memory in an array
- The initial prompt (bot definition) is always included
