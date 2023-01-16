import "module-alias/register";

import { gpt3Embedding } from "@/openai";
import { appendToJSONArray, getTimestamp, readJson } from "@/util";

type OctConfig = {
  botName: string;
};

function oct(config: Partial<OctConfig> = {}) {
  const defaultConfig = {
    botName: "OCT",
  };
  const { botName } = { ...defaultConfig, ...config };

  async function indexEmbeddings({
    path,
    filename,
    input,
  }: {
    path: string;
    filename: string;
    input: string[];
  }) {
    const embedding = await gpt3Embedding({
      input,
    });
    embedding &&
      appendToJSONArray(
        path,
        filename,
        input.map((content, index) => ({ content, vector: embedding[index] }))
      );
  }

  function dotProduct(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      throw new Error("Vectors must have the same length");
    }
    return vector1.reduce(
      (dotProduct, value, index) => dotProduct + value * vector2[index],
      0
    );
  }

  function similarity(v1: number[], v2: number[]): number {
    return dotProduct(v1, v2);
  }

  async function init() {
    const data = readJson("./embeddings/oct/index-20230115234752.json");
    console.log(data);
    const [v1, ...rest] = data;
    const sims = rest.map((v2) => similarity(v1.vector, v2.vector));
    console.log(sims);
    // indexEmbeddings({
    //   path: `./embeddings/${botName.toLowerCase()}`,
    //   filename: `index-${getTimestamp()}.json`,
    //   input: ["German Shepherd", "Bulldog", "Shiba inu", "Jupiter"],
    // });
  }

  return {
    init,
  };
}

export default oct;
export { oct };
