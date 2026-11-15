import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ProgressStore } from './progress';

@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'app-root',
  template: `
    <header class="top">
      <a class="brand" routerLink="/">DollNews</a>
      <nav>
        <a routerLink="/archiv">Archiv</a>
        @if (progress.streak(); as streak) {
          <span class="streak">
            <b>{{ streak }}</b> {{ streak === 1 ? 'Tag' : 'Tage' }} in Folge
          </span>
        }
        <button class="theme" type="button" aria-label="Hell/Dunkel umschalten" (click)="toggleTheme()">◐</button>
      </nav>
    </header>
    <router-outlet />
  `,
})
export class App {
  protected readonly progress = inject(ProgressStore);

  protected toggleTheme(): void {
    const root = document.documentElement;
    root.dataset['theme'] = root.dataset['theme'] === 'dark' ? 'light' : 'dark';
    localStorage.setItem('dollnews.theme', root.dataset['theme']);
  }
}
