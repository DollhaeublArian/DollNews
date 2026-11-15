import { DOMAINS, type Domain } from "./sources.ts";

export interface IndexEntry {
  date: string;
  title: string;
  domains: Domain[];
  headlines: string[];
  thinking: string;
  urls: string[];
}

const PER_DAY = 4;

/** Die Gebiete, die am längsten nicht dran waren (Index ist neueste zuerst). */
export function pickDomains(index: IndexEntry[]): Domain[] {
  const lastUsed = (domain: Domain) => index.find((entry) => entry.domains.includes(domain))?.date ?? "";
  return [...DOMAINS].sort((a, b) => lastUsed(a).localeCompare(lastUsed(b))).slice(0, PER_DAY);
}

/** Welches der Tagesgebiete den englischen Beitrag bekommt: wechselt täglich. */
export function pickEnglishDomain(domains: Domain[], date: string): Domain {
  const day = Math.floor(Date.parse(date) / 86_400_000);
  return domains[day % domains.length];
}
