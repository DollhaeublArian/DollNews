import { Injectable, computed, signal } from '@angular/core';

const KEY = 'dollnews.progress';

interface Progress {
  /** Datum der fertig gelesenen Ausgaben. */
  read: string[];
  /** Kalendertage, an denen eine Ausgabe fertig gelesen wurde. */
  days: string[];
}

const isoDay = (date: Date) => date.toLocaleDateString('sv-SE');

function load(): Progress {
  try {
    return { read: [], days: [], ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { read: [], days: [] };
  }
}

/** Lesefortschritt, nur in diesem Browser gespeichert. */
@Injectable({ providedIn: 'root' })
export class ProgressStore {
  private readonly state = signal(load());

  readonly read = computed(() => new Set(this.state().read));

  /** Tage in Folge bis heute; ist heute noch offen, zählt die Serie bis gestern. */
  readonly streak = computed(() => {
    const days = new Set(this.state().days);
    const day = new Date();
    if (!days.has(isoDay(day))) day.setDate(day.getDate() - 1);
    let count = 0;
    while (days.has(isoDay(day))) {
      count++;
      day.setDate(day.getDate() - 1);
    }
    return count;
  });

  finish(editionDate: string): void {
    const { read, days } = this.state();
    const next = { read: [...new Set([...read, editionDate])], days: [...new Set([...days, isoDay(new Date())])] };
    this.state.set(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }
}
