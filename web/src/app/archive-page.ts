import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatDate, loadIndex } from './content';
import { ProgressStore } from './progress';

@Component({
  selector: 'app-archive-page',
  imports: [RouterLink],
  template: `
    <main class="archive">
      <section class="step">
        <h1>Archiv</h1>
        @if (index.value(); as entries) {
          @if (entries.length) {
            <ul class="index">
              @for (entry of entries; track entry.date) {
                <li>
                  <a [routerLink]="['/ausgabe', entry.date]">
                    <span class="meta">
                      {{ formatDate(entry.date) }}
                      @if (progress.read().has(entry.date)) {
                        <span class="read">· gelesen</span>
                      }
                    </span>
                    <span>{{ entry.title }}</span>
                    <span class="meta">{{ entry.domains.join(', ') }}</span>
                  </a>
                </li>
              }
            </ul>
          } @else {
            <p class="status">Noch keine Ausgabe erschienen.</p>
          }
        } @else if (index.error()) {
          <p class="status">Das Archiv konnte nicht geladen werden. Lade die Seite neu.</p>
        } @else {
          <p class="status">Archiv wird geladen …</p>
        }
      </section>
    </main>
  `,
})
export class ArchivePage {
  protected readonly progress = inject(ProgressStore);
  protected readonly formatDate = formatDate;
  protected readonly index = resource({ loader: loadIndex });
}
