// Schritt 1: Gebiete des Tages wählen und die Kandidaten je Gebiet auflisten.
// Aufruf: npm run candidates [-- YYYY-MM-DD]; ohne Datum: heute in Wien.
import { existsSync } from "node:fs";
import { pickLists } from "./pick.ts";
import { loadCandidates } from "./sources.ts";
import { contentDir, readIndex, writeWork } from "./store.ts";

const date = process.argv[2] ?? new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Vienna" });
if (existsSync(`${contentDir}editions/${date}.json`)) {
  console.log(`Ausgabe ${date} existiert bereits. Nichts zu tun.`);
  process.exit(0);
}

const index = readIndex();
const candidates = await loadCandidates(date, new Set(index.flatMap((entry) => entry.urls)));
const lists = pickLists(index, candidates, date);
writeWork({ date, lists });

console.log(`# Ausgabe ${date}\n`);
for (const { domain, lang, candidates } of lists) {
  console.log(`## Gebiet: ${domain} (Sprache: ${lang})`);
  for (const c of candidates) console.log(`[${c.id}] ${c.title} (${c.source})\n    ${c.teaser}`);
  console.log();
}
console.log("## Zuletzt erschienene Überschriften (keine ähnlichen Themen wählen)");
console.log(index.slice(0, 30).flatMap((entry) => entry.headlines).join("\n") || "(noch keine)");
console.log("\n## Bereits verwendete Themen für „Kritisches Denken“ (nicht wiederholen)");
console.log(index.map((entry) => entry.thinking).join("\n") || "(noch keine)");
