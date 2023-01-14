import { cleanText } from "./parse";

function makeLog({
  prompt,
  response,
}: {
  prompt?: string;
  response?: string;
}): string {
  let log = "";

  if (prompt) {
    log += `${cleanText(prompt)}\n\n`;
  }
  if (response) {
    log += `${cleanText(response)}\n\n`;
  }

  return log;
}

const thickHr = "========";
const thinHr = "------";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debugLog(logs: { label: string; block: any }[], log = console.log) {
  log(`${thickHr}DEBUG LOG${thickHr}`);
  logs.forEach(({ label, block }) => {
    log(`${thinHr}${label.toUpperCase()}${thinHr}`);
    log(block);
  });
  log(`${thickHr}DEBUG LOG END${thickHr}`);
}

export { debugLog, makeLog };
