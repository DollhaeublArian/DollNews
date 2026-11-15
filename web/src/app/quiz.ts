import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { QuizQuestion } from './content';

@Component({
  selector: 'app-quiz',
  template: `
    @for (q of questions(); track $index; let i = $index) {
      <fieldset class="question">
        <legend>{{ i + 1 }}. {{ q.question }}</legend>
        @for (option of q.options; track $index; let j = $index) {
          <button
            type="button"
            class="option"
            [class.right]="answers()[i] !== null && j === q.correctIndex"
            [class.wrong]="answers()[i] === j && j !== q.correctIndex"
            [disabled]="answers()[i] !== null"
            (click)="answer(i, j)"
          >
            <i>{{ letters[j] }}</i><span>{{ option }}</span>
          </button>
        }
        @if (answers()[i] !== null) {
          <p class="explain">{{ q.explanation }}</p>
        }
      </fieldset>
    }
    @if (finished()) {
      <p class="score">{{ right() }} von {{ questions().length }} richtig. Fertig für heute.</p>
    }
  `,
})
export class Quiz {
  readonly questions = input.required<QuizQuestion[]>();
  readonly done = output<void>();

  protected readonly letters = ['A', 'B', 'C', 'D'];
  protected readonly answers = linkedSignal<(number | null)[]>(() => this.questions().map(() => null));
  protected readonly finished = computed(() => this.answers().every((a) => a !== null));
  protected readonly right = computed(
    () => this.answers().filter((a, i) => a === this.questions()[i].correctIndex).length,
  );

  protected answer(question: number, option: number): void {
    this.answers.update((answers) => answers.map((a, i) => (i === question ? option : a)));
    if (this.finished()) this.done.emit();
  }
}
