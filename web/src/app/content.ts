export interface Article {
  domain: string;
  lang: 'de' | 'en';
  headline: string;
  summary: string;
  whyItMatters: string;
  thinkQuestion: string;
  source: { name: string; url: string };
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Edition {
  date: string;
  title: string;
  articles: Article[];
  criticalThinking: { type: string; title: string; explanation: string; example: string; selfCheck: string };
  quiz: QuizQuestion[];
}

export interface IndexEntry {
  date: string;
  title: string;
  domains: string[];
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${response.status} ${path}`);
  return response.json();
}

export const loadIndex = () => getJson<IndexEntry[]>('content/index.json');
export const loadEdition = (date: string) => getJson<Edition>(`content/editions/${date}.json`);

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
