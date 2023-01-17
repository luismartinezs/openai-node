# Playground for OpenAI

NodeJS scripts to interact with openai in different ways, mainly created as a way to challenge myself

Note: this is work in progress and mostly me playing around with the openai API

## Usage

- Install node in your local machine
- `cp .env.example .env` and paste your openai API key to the `.env` file

```bash
pnpm i # Install dependencies
pnpm build # you'll need to run this every time you change the code
# Run any of the bots
pnpm nemo
pnpm dalla
pnpm hal
pnpm dot
pnpm oct
```

## Bots

- Nemo: A very dumb bot with zero memory, ask it anything.
- Dalla: A prompt generator for ai image generation tools such as Midjourney. It uses the davinci model because cheaper models won't work at all.
- Hal: A rather unfriendly bot with short memory (it remembers up to the last 10 answers). Quitting will reset the memory.
- Dot: Bot with limited memory (it remembers the last 4 answers and a summary of the rest of the conversation). Quitting will reset the memory.
- Oct: Pretty smart, long term memory bot, it uses embeddings and summarization to include info related to the current prompt. Quitting does NOT reset the memory. Pretty much [LongtermChatExternalSources repo](https://github.com/daveshap/LongtermChatExternalSources) converted to NodeJS.

## Dev tasks

- [x] Create a script that sends an input and returns response
- [x] Convert to typescript
- [x] Dalla: give a random prompt for AI art generation
- [x] Apply chatGPT refactoring suggestions
- [x] It prepends the history (up to a prompt + character limit) to the input and sends it
- [x] Add eslint and prettier
- [x] It keeps a summary of the history and prepends it to input
- [x] It searches related history entries using embedding and prepends it to prompt, it saves embeddings to log so it's persistent
- [ ] Refactoring, cleanup
