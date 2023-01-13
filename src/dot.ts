import 'module-alias/register';

import { summarize } from "@/openai";
import { getTimestamp } from '@/util';

const BOT_NAME = 'DOT'
const conversation: string[] = []
const summary = ''
const filename = `dot-${getTimestamp()}.txt`


async function dot() {
  // initialize conversation
  while (true) {

    // make summary of all previous conversation down to X tokens, if conversation is longer than X chars (ignore last Y messages that we keep for continuity)
    // store in-memory
    // get user input
    // make prompt (summary + last Y messages + input)
    // get response from gpt3
    // log user input and response
  }
}

// dot()

(async () => {
  const text = 'Toriyama\'s manga was adapted and divided into two anime series produced by Toei Animation: Dragon Ball and Dragon Ball Z, which together were broadcast in Japan from 1986 to 1996. Additionally, the studio has developed 21 animated feature films and three television specials, as well as two anime sequel series titled Dragon Ball GT (1996–1997) and Dragon Ball Super (2015–2018). From 2009 to 2015, a revised version of Dragon Ball Z aired in Japan under the title Dragon Ball Kai, as a recut that follows the manga\'s story more faithfully by removing most of the material featured exclusively in the anime. Several companies have developed various types of merchandising based on the series leading to a large media franchise that includes films, both animated and live-action, collectible trading card games, numerous action figures, along with several collections of soundtracks and numerous video games. Dragon Ball has become one of the highest-grossing media franchises of all time.'
  const summary = await summarize(text)
  console.log(summary)
})()