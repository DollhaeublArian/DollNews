// Schritt 2: Quelltext der gewählten Kandidaten ausgeben.
// Aufruf: npm run text -- <id> [<id> ...]
import { loadArticleText } from "./sources.ts";
import { readWork } from "./store.ts";

const candidates = readWork().lists.flatMap((list) => list.candidates);

for (const arg of process.argv.slice(2)) {
  const candidate = candidates.find((c) => c.id === Number(arg));
  if (!candidate) throw new Error(`Kandidat ${arg} steht in keiner Liste von heute.`);
  let text = await loadArticleText(candidate);
  // Seite nicht lesbar (Paywall, Sperre): wenigstens der Anriss aus dem Feed.
  if (text.length < candidate.teaser.length) text = candidate.teaser;
  console.log(`<quelle candidateId="${candidate.id}" sprache="${candidate.lang}" medium="${candidate.source}" zeichen="${text.length}">`);
  console.log(`Titel: ${candidate.title}\n\n${text}\n</quelle>\n`);
}
