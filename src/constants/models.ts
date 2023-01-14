const models = Object.freeze({
  davinci: "text-davinci-003",
  curie: "text-curie-001",
  babbage: "text-babbage-001",
  ada: "text-ada-001",
  adaEmbedding: "text-embedding-ada-002",
});

type Models = typeof models;

type ModelTypes = Models[keyof Models];

export { models, Models, ModelTypes };
