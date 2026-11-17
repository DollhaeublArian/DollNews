import { DOMAINS, type Candidate, type Domain, type Lang } from "./sources.ts";
import type { Work } from "./store.ts";

export interface IndexEntry {
  date: string;
  title: string;
  domains: Domain[];
  headlines: string[];
  thinking: string;
  urls: string[];
}

const PER_DAY = 4;
/** Artikel plus Ersatz. */
const MIN_CANDIDATES = 2;

/**
 * Die Gebiete des Tages mit ihren Kandidaten: die am längsten nicht verwendeten zuerst,
 * genau eines davon englisch. Hat ein Gebiet zu wenige Kandidaten (Feed ausgefallen),
 * rückt das nächste nach; das übersprungene bleibt vorne und ist am Folgetag wieder dran.
 */
export function pickLists(index: IndexEntry[], candidates: Candidate[], date: string): Work["lists"] {
  const lastUsed = (domain: Domain) => index.find((entry) => entry.domains.includes(domain))?.date ?? "";
  const ranked = [...DOMAINS].sort((a, b) => lastUsed(a).localeCompare(lastUsed(b)));
  // Ab diesem Platz ist der englische Beitrag fällig: wechselt täglich.
  const englishFrom = Math.floor(Date.parse(date) / 86_400_000) % PER_DAY;

  const lists: Work["lists"] = [];
  for (const domain of ranked) {
    if (lists.length === PER_DAY) break;
    const hasEnglish = lists.some((list) => list.lang === "en");
    const langs: Lang[] = hasEnglish
      ? ["de"]
      : lists.length === PER_DAY - 1
        ? ["en"]
        : lists.length >= englishFrom
          ? ["en", "de"]
          : ["de", "en"];
    const found = langs
      .map((lang) => ({ lang, list: candidates.filter((c) => c.lang === lang && c.domains.includes(domain)) }))
      .find(({ list }) => list.length >= MIN_CANDIDATES);
    if (found) lists.push({ domain, lang: found.lang, candidates: found.list });
    else console.warn(`Gebiet übersprungen: ${domain} (zu wenige Kandidaten auf ${langs.join("/")})`);
  }
  if (lists.length < PER_DAY) throw new Error(`Nur ${lists.length} Gebiete mit genug Kandidaten, ${PER_DAY} nötig`);
  return lists;
}
