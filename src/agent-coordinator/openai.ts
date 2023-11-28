import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MODELS = {
  "gpt-3.5-turbo-1106": "gpt-3.5-turbo-1106",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Tools = any[];
type Metadata = any;

export function swarm() {
  // assistants
  async function create(params: {
    model: string;
    tools?: Tools;
    file_ids?: string[];
    name?: string;
    description?: string;
    instructions?: string;
    metadata?: Metadata;
  }) {
    try {
      const res = await openai.beta.assistants.create(params);
      return res;
    } catch (error) {
      console.error("Error creating assistant:", error);
      throw error;
    }
  }

  async function del(assistantId: string) {
    try {
      const res = await openai.beta.assistants.del(assistantId);
      console.log(`Assistant ${assistantId} deleted successfully.`);
      return res;
    } catch (error) {
      console.error("Error deleting assistant:", error);
      throw error;
    }
  }

  async function list(
    params: {
      limit?: number;
      order?: "desc" | "asc";
      after?: string;
      before?: string;
    } = {}
  ) {
    try {
      const res = await openai.beta.assistants.list(params);
      return res;
    } catch (error) {
      console.error("Error listing assistants:", error);
      throw error;
    }
  }

  async function delAll() {
    const assistants = await list();
    for (const { id } of assistants.data) {
      await del(id);
    }
  }

  async function get(id: string) {
    try {
      const res = await openai.beta.assistants.retrieve(id);
      return res;
    } catch (error) {
      console.error("Error retrieving assistant:", error);
      throw error;
    }
  }

  async function update(id: string, params: any) {
    try {
      const res = await openai.beta.assistants.update(id, params);
      return res;
    } catch (error) {
      console.error("Error updating assistant:", error);
      throw error;
    }
  }

  // threads
  async function createThread() {
    // params: {
    //   messages?: Array<{
    //     role: "string";
    //     content: "string";
    //     file_ids?: string[];
    //     metadata?: Metadata;
    //   }>;
    //   metadata?: Metadata;
    // } = {}
    try {
      const res = await openai.beta.threads.create();
      return res;
    } catch (error) {
      console.error("Error creating thread:", error);
      throw error;
    }
  }

  async function createMessage(
    threadId: string,
    params: {
      content: string;
    }
  ) {
    try {
      const res = await openai.beta.threads.messages.create(threadId, {
        role: "user",
        ...params,
      });
      return res;
    } catch (error) {
      console.error("Error creating message:", error);
      throw error;
    }
  }

  async function run(
    threadId: string,
    params: {
      assistant_id: string;
      instructions: string;
    }
  ) {
    try {
      const res = await openai.beta.threads.runs.create(threadId, params);
      return res;
    } catch (err) {
      console.error("Error running thread:", err);
      throw err;
    }
  }

  async function getRun(threadId: string, runId: string) {
    try {
      const run = await openai.beta.threads.runs.retrieve(threadId, runId);
      return run;
    } catch (err) {
      console.error("Error getting run:", err);
      throw err;
    }
  }

  async function getThreadMessagesList(threadId: string) {
    try {
      return openai.beta.threads.messages.list(threadId);
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }

  async function waitForMessages<
    AvailableFunctions extends { [index: string]: () => void },
  >(threadId: string, runId: string, availableFunctions?: AvailableFunctions) {
    let _run = await getRun(threadId, runId);
    let status = _run.status;

    while (status === "queued" || status === "in_progress") {
      await sleep(1000);
      console.log("running GPT, current status", status);
      _run = await getRun(threadId, runId);
      status = _run.status;
    }

    if (status === "requires_action") {
      console.log("Action required");
      // console.log(_run);
      if (_run.required_action && availableFunctions) {
        await callFunction(
          _run.required_action.submit_tool_outputs.tool_calls,
          availableFunctions
        );
      }
      return await getThreadMessagesList(threadId);
    }

    if (status === "completed") {
      return getThreadMessagesList(threadId);
    } else {
      console.log("Run did not complete successfully.");
    }
  }

  async function callFunction<
    AvailableFunctions extends { [index: string]: () => void },
  >(
    functionCalls: {
      id: string;
      type: "function";
      function: {
        name: string;
        arguments: string; // Stringified JSON
      };
    }[],
    availableFunctions: AvailableFunctions
  ) {
    await Promise.all(
      functionCalls.map((fnCall) => {
        const { name, arguments: strArgs } = fnCall.function;
        const args = JSON.parse(strArgs);
        const fnc = availableFunctions[name];
        if (!fnc) {
          throw new Error(`Function ${name} not found`);
        }
        console.log("Calling function", name, "with args", args);
        return fnc(args);
      })
    );
  }

  return {
    // assistant
    create,
    get,
    update,
    del,
    list,
    delAll,
    // threads
    createThread,
    createMessage,
    run,
    getRun,
    getThreadMessagesList,
    waitForMessages,
  };
}
