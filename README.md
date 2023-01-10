# Playground for OpenAI

NodeJS scripts to interact with openai in different ways, mainly created as a way to challenge myself

## Bots

- Nemo: a quite dumb bot with zero memory, ask it anything.
- Dalla: a prompt generator for ai image generation such as Midjourney. It uses the davinci model because cheaper models won't work at all.

## Dev tasks

- [x] Create a script that sends an input and returns response
- [x] Convert to typescript
- [x] Dalla: give a random prompt for AI art generation
- [x] Apply chatGPT refactoring suggestions
- [ ] It prepends the history (up to a prompt + character limit) to the input and sends it
- [ ] It keeps a summary of the history (up to a limit) and prepends it to input
- [ ] It searches related history entries using embedding and prepends it to prompt
