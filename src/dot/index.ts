import "module-alias/register";
import dot from "./dot";
import { models } from "@/constants";

const config = {
  maxCurrentConvoTokenLength: 100,
  lastConvoMemory: 4,
  summarizeSummary: true,
  summaryMaxTokens: 100,
  botModel: models.curie,
  summarizationModel: models.davinci,
  mock: false,
  debugOptions: {
    toConsole: false,
    toFile: true,
  },
};

const { init } = dot(config);

init();
