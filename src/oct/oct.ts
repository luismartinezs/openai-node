import "module-alias/register";

import { gpt3Embedding } from "@/openai";

function oct() {
  async function init() {
    const embedding = await gpt3Embedding({
      input: "The food was delicious and the waiter brought more",
    });
    console.log(embedding);
  }

  return {
    init,
  };
}

export default oct;
export { oct };
