import { swarm, MODELS } from "./openai";

const s = swarm();

async function main() {
  const assistant = await s.createAssistant({
    model: MODELS["gpt-3.5-turbo-1106"],
  });
  console.log(assistant);
}

main();
