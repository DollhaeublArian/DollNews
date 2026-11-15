// Schritt 3: Entwurf prüfen und als Ausgabe ablegen.
// Aufruf: npm run publish -- <entwurf.json>
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { contentDir, readIndex, readWork, writeIndex } from "./store.ts";

const text = z.string().trim().min(1);
const Draft = z.strictObject({
  title: text,
  articles: z.array(
    z.strictObject({
      domain: text,
      candidateId: z.number().int(),
      headline: text,
      summary: text,
      whyItMatters: text,
      thinkQuestion: text,
    }),
  ),
  criticalThinking: z.strictObject({
    type: z.enum(["Denkfehler", "Stimmt das wirklich?"]),
    title: text,
    explanation: text,
    example: text,
    selfCheck: text,
  }),
  quiz: z
    .array(
      z.strictObject({
        question: text,
        options: z.array(text).length(4),
        correctIndex: z.number().int().min(0).max(3),
        explanation: text,
      }),
    )
    .length(4),
});

const draftPath = process.argv[2];
if (!draftPath) throw new Error("Aufruf: npm run publish -- <entwurf.json>");
const draft = Draft.parse(JSON.parse(readFileSync(draftPath, "utf8")));
const { date, lists } = readWork();

// Genau ein Beitrag je Gebiet, und nur aus der Kandidatenliste dieses Gebiets:
// so stimmen Sprache und Quellen-URL, ohne dass der Entwurf sie selbst angibt.
const articles = lists.map(({ domain, candidates }) => {
  const matches = draft.articles.filter((a) => a.domain === domain);
  if (matches.length !== 1) throw new Error(`${domain}: genau ein Beitrag erwartet, gefunden: ${matches.length}`);
  const { candidateId, domain: _, ...content } = matches[0];
  const candidate = candidates.find((c) => c.id === candidateId);
  if (!candidate) throw new Error(`${domain}: Kandidat ${candidateId} steht nicht in der Liste dieses Gebiets`);
  const words = content.summary.split(/\s+/).length;
  if (words < 60 || words > 220) throw new Error(`${domain}: Zusammenfassung hat ${words} Wörter (erlaubt 60 bis 220)`);
  return { domain, lang: candidate.lang, ...content, source: { name: candidate.source, url: candidate.url } };
});
if (draft.articles.length !== lists.length) throw new Error(`Genau ${lists.length} Beiträge erwartet`);
if (new Set(articles.map((a) => a.source.url)).size !== articles.length) throw new Error("Jeder Beitrag braucht eine eigene Quelle");

const edition = { date, title: draft.title, articles, criticalThinking: draft.criticalThinking, quiz: draft.quiz };
mkdirSync(`${contentDir}editions`, { recursive: true });
writeFileSync(`${contentDir}editions/${date}.json`, JSON.stringify(edition, null, 2) + "\n");

const index = readIndex();
index.unshift({
  date,
  title: edition.title,
  domains: lists.map((list) => list.domain),
  headlines: articles.map((a) => a.headline),
  thinking: edition.criticalThinking.title,
  urls: articles.map((a) => a.source.url),
});
writeIndex(index);
console.log(`Geschrieben: web/public/content/editions/${date}.json`);
