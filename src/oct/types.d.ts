import { ModelTypes } from "@/constants";

export type Log = {
  uuid: string;
  time: number;
  message: string;
  vector: number[];
  speaker: string;
};

type WithScore<T> = T & { score: number };

export type Memory = WithScore<Log>;

export type OctConfig = {
  botName: string;
  userName: string;
  logsPathName: string;
  summarizationPromptPathName: string;
  convoPromptPathName: string;
  embeddingModel: ModelTypes;
  summarizationModel: ModelTypes;
  gpt3User: string;
};
