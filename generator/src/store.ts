import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { IndexEntry } from "./pick.ts";
import type { Candidate, Domain } from "./sources.ts";

// Liegt im public-Ordner der Angular-App, damit der Build die Ausgaben mit ausliefert.
export const contentDir = fileURLToPath(new URL("../../web/public/content/", import.meta.url));
const indexPath = `${contentDir}index.json`;

// Zwischenstand eines Laufs (nicht im Repo): verbindet die drei Schritte candidates → text → publish.
const workDir = fileURLToPath(new URL("../work/", import.meta.url));
const workPath = `${workDir}candidates.json`;

export interface Work {
  date: string;
  lists: { domain: Domain; lang: "de" | "en"; candidates: Candidate[] }[];
}

export function readIndex(): IndexEntry[] {
  return existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, "utf8")) : [];
}

export function writeIndex(index: IndexEntry[]): void {
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");
}

export function readWork(): Work {
  if (!existsSync(workPath)) throw new Error("Zuerst `npm run candidates` ausführen.");
  return JSON.parse(readFileSync(workPath, "utf8"));
}

export function writeWork(work: Work): void {
  mkdirSync(workDir, { recursive: true });
  writeFileSync(workPath, JSON.stringify(work));
}
