import { Component, computed, inject, input, linkedSignal, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatDate, loadEdition, loadIndex } from './content';
import { ProgressStore } from './progress';
import { Quiz } from './quiz';

/** Eine Ausgabe, Schritt für Schritt: Übersicht, Beiträge, Kritisches Denken, Quiz. */
@Component({
  selector: 'app-edition-page',
  imports: [Quiz, RouterLink],
  template: `
    @if (edition.value(); as e) {
      <main>
        @if (step() === 0) {
          <section class="step intro">
            <p class="date">{{ formatDate(e.date) }}</p>
            <h1>{{ e.title }}</h1>
            <p class="lede">
              {{ e.articles.length }} Beiträge, ein Denkanstoß, {{ e.quiz.length }} Fragen. Etwa zehn Minuten.
            </p>
            <ol class="index">
              @for (a of e.articles; track a.headline; let i = $index) {
                <li><button type="button" (click)="go(i + 1)">{{ a.domain }}</button></li>
              }
            </ol>
          </section>
        } @else if (step() <= e.articles.length) {
          @let a = e.articles[step() - 1];
          @let en = a.lang === 'en';
          <article class="step" [attr.lang]="a.lang">
            <p class="domain">
              <span>{{ a.domain }}</span>
              @if (en) {
                <span class="lang">English</span>
              }
            </p>
            <h2>{{ a.headline }}</h2>
            <p class="summary">{{ a.summary }}</p>
            <p class="why"><strong>{{ en ? 'Why it matters' : 'Warum das zählt' }}</strong> {{ a.whyItMatters }}</p>
            <p class="think"><strong>{{ en ? 'Think further' : 'Zum Weiterdenken' }}</strong> {{ a.thinkQuestion }}</p>
            <p class="source">
              {{ en ? 'Source' : 'Quelle' }}:
              <a [href]="a.source.url" target="_blank" rel="noopener">{{ a.source.name }}</a>
            </p>
          </article>
        } @else if (step() === e.articles.length + 1) {
          <section class="step">
            <p class="domain"><span>{{ e.criticalThinking.type }}</span></p>
            <h2>{{ e.criticalThinking.title }}</h2>
            <p class="summary">{{ e.criticalThinking.explanation }}</p>
            <p class="why"><strong>Beispiel</strong> {{ e.criticalThinking.example }}</p>
            <p class="think"><strong>Selbsttest</strong> {{ e.criticalThinking.selfCheck }}</p>
          </section>
        }
        <!-- Bleibt eingehängt, damit Antworten beim Zurückblättern erhalten bleiben. -->
        <section class="step" [hidden]="step() !== last()">
          <p class="domain"><span>Quiz</span></p>
          <h2>Was ist hängen geblieben?</h2>
          <app-quiz [questions]="e.quiz" (done)="progress.finish(e.date)" />
          @if (progress.read().has(e.date)) {
            <p class="after"><a routerLink="/archiv">Ältere Ausgaben im Archiv</a></p>
          }
        </section>
      </main>
      <nav class="pager" aria-label="Abschnitte">
        <button type="button" [disabled]="step() === 0" (click)="go(step() - 1)">Zurück</button>
        <ol class="progress" [attr.aria-label]="'Abschnitt ' + (step() + 1) + ' von ' + (last() + 1)">
          @for (s of steps(); track s) {
            <li [class.on]="s <= step()"></li>
          }
        </ol>
        <button type="button" class="next" [disabled]="step() === last()" (click)="go(step() + 1)">Weiter</button>
      </nav>
    } @else if (index.error() || edition.error()) {
      <main><p class="status">Die Ausgabe konnte nicht geladen werden. Lade die Seite neu.</p></main>
    } @else if (index.hasValue() && !editionDate()) {
      <main><p class="status">Noch keine Ausgabe erschienen. Die erste kommt morgen früh.</p></main>
    } @else {
      <main><p class="status">Ausgabe wird geladen …</p></main>
    }
  `,
})
export class EditionPage {
  /** Routenparameter; ohne Datum wird die neueste Ausgabe gezeigt. */
  readonly date = input<string>();

  protected readonly progress = inject(ProgressStore);
  protected readonly formatDate = formatDate;

  protected readonly index = resource({ loader: loadIndex });
  protected readonly editionDate = computed(() => this.date() ?? this.index.value()?.[0]?.date);
  protected readonly edition = resource({
    params: () => this.editionDate(),
    loader: ({ params }) => loadEdition(params),
  });

  protected readonly step = linkedSignal({ source: this.editionDate, computation: () => 0 });
  protected readonly last = computed(() => (this.edition.value()?.articles.length ?? 0) + 2);
  protected readonly steps = computed(() => Array.from({ length: this.last() + 1 }, (_, i) => i));

  protected go(step: number): void {
    this.step.set(step);
    scrollTo(0, 0);
  }
}
