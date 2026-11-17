import { XMLParser } from "fast-xml-parser";

export const DOMAINS = [
  "Biologie",
  "Physik & Chemie",
  "Medizin",
  "Geografie",
  "Länder & Kulturen",
  "Geschichte",
  "Sport",
  "Wirtschaft",
  "Technik",
  "Psychologie",
  "Kunst, Musik & Literatur",
  "Politik & Gesellschaft",
  "Weltraum",
] as const;
export type Domain = (typeof DOMAINS)[number];
export type Lang = "de" | "en";

export interface Candidate {
  id: number;
  title: string;
  teaser: string;
  /** Volltext aus dem Feed, falls der Feed ihn mitliefert. */
  body: string;
  url: string;
  source: string;
  lang: Lang;
  domains: readonly Domain[];
}

interface Feed {
  name: string;
  url: string;
  lang: Lang;
  domains: readonly Domain[];
}

// Alle Feeds am 2026-11-15 mit echtem GET geprüft (200).
// Bewusst nicht dabei, weil kein Artikeltext abrufbar ist: Spektrum und
// Atlas Obscura (403 für automatische Abrufe), Deutschlandfunk Kultur (nur Sammelseite),
// Deutschlandfunk Wissen (Audio-Seiten, liefern für jeden Artikel denselben Fremdtext).
// Entfernt am 2026-11-17: DW, tagesschau und BBC. Die Cloud-Umgebung der Routine sperrt diese
// Hosts („Blocked by egress policy“), außerdem schließen sie ClaudeBot per robots.txt aus.
// ORF ebenfalls nicht (robots.txt schließt ClaudeBot aus).
const FEEDS: Feed[] = [
  { name: "scinexx", url: "https://www.scinexx.de/feed/", lang: "de", domains: ["Biologie", "Physik & Chemie", "Geografie", "Technik", "Weltraum"] },
  { name: "wissenschaft.de", url: "https://www.wissenschaft.de/feed/", lang: "de", domains: ["Biologie", "Physik & Chemie", "Medizin", "Psychologie", "Geschichte", "Geografie", "Technik", "Weltraum"] },
  { name: "Der Standard Wissenschaft", url: "https://www.derstandard.at/rss/wissenschaft", lang: "de", domains: ["Biologie", "Medizin", "Geschichte", "Geografie", "Weltraum"] },
  { name: "Der Standard Wirtschaft", url: "https://www.derstandard.at/rss/wirtschaft", lang: "de", domains: ["Wirtschaft"] },
  { name: "euronews", url: "https://de.euronews.com/rss", lang: "de", domains: ["Länder & Kulturen", "Politik & Gesellschaft", "Wirtschaft"] },
  { name: "sportschau", url: "https://www.sportschau.de/index~rss2.xml", lang: "de", domains: ["Sport"] },
  { name: "Der Standard Sport", url: "https://www.derstandard.at/rss/sport", lang: "de", domains: ["Sport"] },
  { name: "Der Standard Kultur", url: "https://www.derstandard.at/rss/kultur", lang: "de", domains: ["Kunst, Musik & Literatur", "Länder & Kulturen"] },
  { name: "heise online", url: "https://www.heise.de/rss/heise-atom.xml", lang: "de", domains: ["Technik"] },

  { name: "Quanta Magazine", url: "https://www.quantamagazine.org/feed/", lang: "en", domains: ["Physik & Chemie", "Biologie"] },
  { name: "ScienceDaily", url: "https://www.sciencedaily.com/rss/top/science.xml", lang: "en", domains: ["Biologie", "Medizin", "Physik & Chemie"] },
  { name: "NASA", url: "https://www.nasa.gov/feed/", lang: "en", domains: ["Weltraum"] },
  { name: "Smithsonian History", url: "https://www.smithsonianmag.com/rss/history/", lang: "en", domains: ["Geschichte"] },
  { name: "Smithsonian Arts & Culture", url: "https://www.smithsonianmag.com/rss/arts-culture/", lang: "en", domains: ["Kunst, Musik & Literatur"] },
  { name: "The Conversation Psychology", url: "https://theconversation.com/global/topics/psychology-28/articles.atom", lang: "en", domains: ["Psychologie"] },
  { name: "The Conversation", url: "https://theconversation.com/global/articles.atom", lang: "en", domains: ["Politik & Gesellschaft", "Wirtschaft", "Medizin"] },
  { name: "Aeon", url: "https://aeon.co/feed.rss", lang: "en", domains: ["Psychologie", "Politik & Gesellschaft", "Geschichte", "Kunst, Musik & Literatur"] },
  { name: "Our World in Data", url: "https://ourworldindata.org/atom.xml", lang: "en", domains: ["Wirtschaft", "Politik & Gesellschaft", "Medizin", "Geografie"] },
];

const ITEMS_PER_FEED = 8;
const MAX_TEXT = 12_000;
// Wikimedia verlangt einen User-Agent mit Kontaktmöglichkeit, sonst drosselt es (429).
const USER_AGENT = "dollnews-generator/1.0 (+https://news.ariandoll.dev)";
const ATTEMPTS = 3;
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", htmlEntities: true });

/** Wiederholt bei Netzwerkfehlern, 429 und 5xx. 403 und 404 ändern sich durch Warten nicht. */
async function get(url: string): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(20_000) })
      .catch((error: Error) => error);
    if (res instanceof Response && res.ok) return res.text();
    const retry = attempt < ATTEMPTS && (!(res instanceof Response) || res.status === 429 || res.status >= 500);
    if (!retry) throw res instanceof Response ? new Error(`${res.status} ${url}`) : res;
    await new Promise((resolve) => setTimeout(resolve, 3_000 * attempt));
  }
}

function list<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "#text" in value) return text(value["#text"]);
  return "";
}

export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style|noscript|figure)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

type Item = Omit<Candidate, "id">;

async function readFeed(feed: Feed): Promise<Item[]> {
  const xml = parser.parse(await get(feed.url));
  const entries: any[] = xml.rss ? list(xml.rss.channel?.item) : list(xml.feed?.entry);
  return entries.slice(0, ITEMS_PER_FEED).flatMap((entry) => {
    const link =
      typeof entry.link === "string"
        ? entry.link
        : (list<any>(entry.link).find((l) => l["@_rel"] !== "self" && l["@_href"])?.["@_href"] ?? text(entry.link));
    const title = stripHtml(text(entry.title));
    if (!link || !title) return [];
    const teaser = stripHtml(text(entry.description ?? entry.summary ?? entry.content)).slice(0, 300);
    const body = stripHtml(text(entry["content:encoded"] ?? entry.content)).slice(0, MAX_TEXT);
    return [{ title, teaser, body, url: link.trim(), source: feed.name, lang: feed.lang, domains: feed.domains }];
  });
}

async function readWikipedia(lang: Lang, date: string): Promise<Item[]> {
  const [y, m, d] = date.split("-");
  const feed = JSON.parse(await get(`https://api.wikimedia.org/feed/v1/wikipedia/${lang}/featured/${y}/${m}/${d}`));
  const pages: { page: any; title?: string; domains: readonly Domain[] }[] = [];
  if (feed.tfa) pages.push({ page: feed.tfa, domains: DOMAINS });
  for (const event of list<any>(feed.onthisday)) {
    if (event.pages?.[0]) pages.push({ page: event.pages[0], title: event.text, domains: ["Geschichte"] });
  }
  return pages.flatMap(({ page, title, domains }) => {
    const url = page.content_urls?.desktop?.page;
    if (!url) return [];
    return [{
      title: stripHtml(title ?? page.titles?.normalized ?? ""),
      teaser: String(page.extract ?? "").slice(0, 300),
      body: "",
      url,
      source: "Wikipedia",
      lang,
      domains,
    }];
  });
}

/** Alle Kandidaten des Tages. Ein ausgefallener Feed ist kein Abbruchgrund. */
export async function loadCandidates(date: string, usedUrls: Set<string>): Promise<Candidate[]> {
  const jobs: [string, Promise<Item[]>][] = [
    ...FEEDS.map((feed): [string, Promise<Item[]>] => [feed.name, readFeed(feed)]),
    ["Wikipedia de", readWikipedia("de", date)],
    ["Wikipedia en", readWikipedia("en", date)],
  ];
  const results = await Promise.allSettled(jobs.map(([, job]) => job));
  const items: Item[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") items.push(...result.value);
    else console.warn(`Feed übersprungen: ${jobs[i][0]} (${result.reason})`);
  });
  return items.filter((item) => !usedUrls.has(item.url)).map((item, id) => ({ id, ...item }));
}

/** Quelltext eines Kandidaten: der längere von Feed-Volltext und den <p>-Absätzen der Artikelseite. */
export async function loadArticleText(candidate: Candidate): Promise<string> {
  const html = await get(candidate.url).catch(() => "");
  const page = [...html.matchAll(/<p[\s>][\s\S]*?<\/p>/gi)]
    .map((match) => stripHtml(match[0]))
    .filter((p) => p.length > 60)
    .join("\n")
    .slice(0, MAX_TEXT);
  return page.length > candidate.body.length ? page : candidate.body;
}
