// ==== Panneaux : journal, fiche du disciple, grande carte, pause, montée d'étape ====
import { FRUITS, ARMOR, STAGES } from '../config.js';

const $ = (id) => document.getElementById(id);

const PAUSE_VERSES = [
  '« Arrêtez, et sachez que je suis Dieu. » — Psaume 46:10',
  '« Venez à moi, vous tous qui êtes fatigués. » — Matthieu 11:28',
  '« Mon âme, retourne à ton repos. » — Psaume 116:7',
  '« Je vous laisse la paix, je vous donne ma paix. » — Jean 14:27',
];

export class Panels {
  constructor(game) {
    this.game = game;
    this.openPanel = null;
    // Boutons "fermer"
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });
  }

  get anyOpen() { return this.openPanel !== null; }

  toggle(id) {
    if (this.openPanel === id) { this.close(); return; }
    this.close();
    this.openPanel = id;
    if (id === 'journal-panel') this._renderJournal();
    if (id === 'character-panel') this._renderCharacter();
    if (id === 'bigmap-panel') this.game.minimap.renderBig();
    if (id === 'pause-panel') {
      $('pause-verse').textContent = PAUSE_VERSES[Math.floor(Math.random() * PAUSE_VERSES.length)];
    }
    $(id).classList.remove('hidden');
    this.game.input.releasePointer();
  }

  close() {
    if (!this.openPanel) return;
    $(this.openPanel).classList.add('hidden');
    this.openPanel = null;
  }

  _renderJournal() {
    const el = $('journal-content');
    const { quests, progression } = this.game;
    let html = '';
    const active = quests.activeQuest;
    if (active) {
      html += `<div class="quest-entry active">
        <div class="quest-title">▶ ${active.def.title}</div>
        <div class="quest-parable">${active.def.parable || ''}</div>
        <div class="quest-desc">${active.def.desc}</div>
        <div class="quest-step">➤ ${quests.currentObjectiveText()}</div>
      </div>`;
    } else {
      const next = quests.nextQuestDef();
      if (next) {
        html += `<div class="quest-entry">
          <div class="quest-title">Prochaine quête : ${next.title}</div>
          <div class="quest-desc">Cherchez le marqueur doré « ! » sur la carte.</div>
        </div>`;
      }
    }
    for (const qid of [...progression.completedQuests].reverse()) {
      const def = quests.defs.find(d => d.id === qid);
      if (!def) continue;
      html += `<div class="quest-entry done">
        <div class="quest-title">✓ ${def.title}</div>
        <div class="quest-parable">${def.parable || ''}</div>
      </div>`;
    }
    if (!html) html = '<p>Votre chemin commence à peine…</p>';
    el.innerHTML = html;
  }

  _renderCharacter() {
    const prog = this.game.progression;
    const stage = STAGES[prog.stage];
    $('char-stage-line').textContent = `${stage.icon} ${stage.name} — ${stage.desc}`;
    // Fruits
    let fh = '';
    for (const f of FRUITS) {
      const v = prog.fruits[f.id];
      fh += `<div class="fruit-row">
        <span>${f.icon}</span><span class="fruit-name">${f.name}</span>
        <div class="fruit-bar-outer"><div class="fruit-bar" style="width:${v}%"></div></div>
        <span class="fruit-val">${v}</span>
      </div>`;
    }
    $('fruits-list').innerHTML = fh;
    // Armure
    let ah = '';
    for (const a of ARMOR) {
      const has = prog.armor[a.id];
      ah += `<div class="armor-row ${has ? '' : 'locked'}">
        <span class="armor-icon">${a.icon}</span>
        <span><strong>${a.name}</strong><small>${has ? a.verse : `Se débloque à l'étape ${a.stage + 1}`}</small></span>
      </div>`;
    }
    $('armor-list').innerHTML = ah;
  }

  showStageUp(stage, unlocked, onOk) {
    $('stageup-name').textContent = `${stage.icon} ${stage.name}`;
    $('stageup-desc').textContent = stage.desc;
    $('stageup-armor').textContent = unlocked.length
      ? `Armure reçue : ${unlocked.map(u => `${u.icon} ${u.name}`).join(' · ')}`
      : '';
    $('stageup-panel').classList.remove('hidden');
    this.game.input.releasePointer();
    const btn = $('btn-stageup-ok');
    const handler = () => {
      btn.removeEventListener('click', handler);
      $('stageup-panel').classList.add('hidden');
      onOk?.();
    };
    btn.addEventListener('click', handler);
  }

  showEnding(text, onContinue) {
    $('ending-text').textContent = text;
    $('ending-panel').classList.remove('hidden');
    this.game.input.releasePointer();
    const btn = $('btn-ending-continue');
    const handler = () => {
      btn.removeEventListener('click', handler);
      $('ending-panel').classList.add('hidden');
      onContinue?.();
    };
    btn.addEventListener('click', handler);
  }
}
