// ==== Mini-jeu : quiz de la Parole (L'Épée de l'Esprit) ====
import { QUIZ_QUESTIONS } from '../data/verses.js';

const $ = (id) => document.getElementById(id);

export class QuizGame {
  constructor(game) {
    this.game = game;
    this.panel = $('quiz-panel');
    this.active = false;
  }

  start(count = 5, needed = 3, onDone = null) {
    this.active = true;
    this.onDone = onDone;
    this.needed = needed;
    this.correct = 0;
    this.index = 0;
    // Tirage de questions
    const pool = [...QUIZ_QUESTIONS];
    this.questions = [];
    for (let i = 0; i < count && pool.length; i++) {
      this.questions.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    this.game.uiLock = true;
    this.game.input.releasePointer();
    this.panel.classList.remove('hidden');
    this._showQuestion();
  }

  _showQuestion() {
    const q = this.questions[this.index];
    $('quiz-progress').textContent = `Question ${this.index + 1} / ${this.questions.length} — Bonnes réponses : ${this.correct} (il en faut ${this.needed})`;
    $('quiz-question').textContent = q.q;
    $('quiz-feedback').textContent = '';
    const answersEl = $('quiz-answers');
    answersEl.innerHTML = '';
    // Mélange (la bonne réponse est a[0])
    const shuffled = q.a.map((text, i) => ({ text, good: i === 0 }))
      .sort(() => Math.random() - 0.5);
    for (const ans of shuffled) {
      const btn = document.createElement('button');
      btn.className = 'quiz-answer';
      btn.textContent = ans.text;
      btn.addEventListener('click', () => this._answer(btn, ans, q));
      answersEl.appendChild(btn);
    }
  }

  _answer(btn, ans, q) {
    const buttons = [...$('quiz-answers').children];
    buttons.forEach(b => b.disabled = true);
    if (ans.good) {
      btn.classList.add('correct');
      this.correct++;
      this.game.audio.pickup();
      $('quiz-feedback').textContent = `✓ Exact ! (${q.ref})`;
    } else {
      btn.classList.add('wrong');
      this.game.audio.bad();
      buttons.find(b => {
        const isGood = q.a[0] === b.textContent;
        if (isGood) b.classList.add('correct');
        return isGood;
      });
      $('quiz-feedback').textContent = `✗ La bonne réponse était : « ${q.a[0]} » (${q.ref})`;
    }
    setTimeout(() => {
      this.index++;
      if (this.index < this.questions.length) this._showQuestion();
      else this._finish();
    }, 1600);
  }

  _finish() {
    this.panel.classList.add('hidden');
    this.active = false;
    this.game.uiLock = false;
    const success = this.correct >= this.needed;
    if (success) this.game.hud.notify(`📜 Quiz réussi : ${this.correct}/${this.questions.length} !`);
    this.onDone?.(success);
  }
}
