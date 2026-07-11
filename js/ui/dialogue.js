// ==== Système de dialogue avec effet machine à écrire et choix ====
const $ = (id) => document.getElementById(id);

export class DialogueSystem {
  constructor(audio) {
    this.audio = audio;
    this.box = $('dialogue-box');
    this.nameEl = $('dialogue-name');
    this.textEl = $('dialogue-text');
    this.portraitEl = $('dialogue-portrait');
    this.choicesEl = $('dialogue-choices');
    this.nextEl = $('dialogue-next');
    this.active = false;
    this.queue = [];
    this.onDone = null;
    this.typing = false;
    this._typeTimer = null;

    this.box.addEventListener('click', () => this.advance());
  }

  // lines: [{ name, text, portrait }] ; choices (facultatif, sur la dernière ligne) :
  // [{ text, hint, onPick }]
  start(lines, onDone = null, choices = null) {
    this.queue = [...lines];
    this.onDone = onDone;
    this.choices = choices;
    this.active = true;
    this.box.classList.remove('hidden');
    this._showNext();
  }

  _showNext() {
    const line = this.queue.shift();
    if (!line) { this._finish(); return; }
    this.currentLine = line;
    this.nameEl.textContent = line.name;
    this.portraitEl.textContent = line.portrait || '🙂';
    this.choicesEl.classList.add('hidden');
    this.choicesEl.innerHTML = '';
    this.nextEl.classList.remove('hidden');
    // Machine à écrire
    this.typing = true;
    this.textEl.textContent = '';
    const full = line.text;
    let i = 0;
    clearInterval(this._typeTimer);
    this._typeTimer = setInterval(() => {
      i += 2;
      this.textEl.textContent = full.slice(0, i);
      if (i % 6 === 0) this.audio?.dialogueBlip();
      if (i >= full.length) {
        clearInterval(this._typeTimer);
        this.typing = false;
        this._maybeShowChoices();
      }
    }, 18);
  }

  _maybeShowChoices() {
    // Choix uniquement quand la file est vide (dernière ligne)
    if (this.queue.length === 0 && this.choices && this.choices.length) {
      this.nextEl.classList.add('hidden');
      this.choicesEl.classList.remove('hidden');
      for (const choice of this.choices) {
        const btn = document.createElement('button');
        btn.className = 'dialogue-choice';
        btn.innerHTML = choice.text + (choice.hint ? ` <small>${choice.hint}</small>` : '');
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._close();
          choice.onPick?.();
        });
        this.choicesEl.appendChild(btn);
      }
    }
  }

  advance() {
    if (!this.active) return;
    if (this.typing) {
      // Terminer la ligne instantanément
      clearInterval(this._typeTimer);
      this.textEl.textContent = this.currentLine.text;
      this.typing = false;
      this._maybeShowChoices();
      return;
    }
    // Si des choix sont affichés, ne pas avancer par clic générique
    if (!this.choicesEl.classList.contains('hidden')) return;
    if (this.queue.length === 0 && this.choices && this.choices.length) return;
    if (this.queue.length === 0) { this._finish(); return; }
    this._showNext();
  }

  _finish() {
    if (this.choices && this.choices.length) return; // attend un choix
    this._close();
    this.onDone?.();
  }

  _close() {
    this.active = false;
    this.box.classList.add('hidden');
    clearInterval(this._typeTimer);
  }
}
