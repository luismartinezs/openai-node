import { v4 as uuidv4 } from "uuid";
import { swarm, MODELS } from "./openai";

const s = swarm();
const uuid = uuidv4();

function listAndLog() {
  s.list().then((assistants) => {
    console.log(
      assistants.data
        .filter(({ name }) => name?.includes(uuid))
        .map(({ id, name, description, instructions }) => [
          id,
          name,
          description,
          instructions,
        ])
    );
  });
}

function test({ str }: { str: string }) {
  console.log(str);
}

async function createAssistant(
  name?: string,
  description?: string,
  instructions?: string
) {
  // Your logic to create an assistant goes here
  s.create();
  // For now, let's just log the parameters
  console.log(`Creating assistant with name: ${name}`);
  // Return a dummy assistant object
  return { id: uuidv4(), name, description, instructions };
}

async function main() {
  const assistant = await s.create({
    model: MODELS["gpt-3.5-turbo-1106"],
    name: `test-${uuid}`,
    description: `test assistant for uuid ${uuid}`,
    instructions:
      // "You are an assistant coordinator. You task is to evaluate a task, split it into units, and spin up assistants that handle each unit. You wait for the output from the assistants, evaluate it, and determine if the unit task is complete.",
      "you are a helpful assistant",
    tools: [
      {
        type: "function",
        function: {
          name: "test",
          description: "log the string passed in as a parameter",
          parameters: {
            type: "object",
            properties: {
              str: {
                type: "string",
                description: "string to log",
              },
            },
            required: ["str"],
          },
        },
      },
    ],
  });
  const thread = await s.createThread();
  await s.createMessage(thread.id, {
    content: "helloworld",
  });
  await s.createMessage(thread.id, {
    content: "tyrannosaurus",
  });
  await s.createMessage(thread.id, {
    content: "One Piece",
  });
  const run = await s.run(thread.id, {
    assistant_id: assistant.id,
    instructions: "Log whatever string passed in by the user",
  });
  const res = await s.waitForMessages(thread.id, run.id, {
    test,
  });

  if (res) {
    console.log("=== MESSAGES ===");
    console.log(...res.data.map((d) => d.content.map((c) => c.text.value)));
  }

  await s.del(assistant.id);
}

main();

// s.delAll();
