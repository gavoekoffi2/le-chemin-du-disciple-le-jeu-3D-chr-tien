// ==== HUD : étape, grâce, ressources, objectif, notifications ====
import { STAGES, FRUITS, ARMOR, CONFIG } from '../config.js';

const $ = (id) => document.getElementById(id);

export class HUD {
  constructor() {
    this.el = {
      hud: $('hud'),
      stageIcon: $('stage-icon'), stageName: $('stage-name'),
      graceBar: $('grace-bar'), graceLabel: $('grace-label'),
      coins: $('res-coins'), verses: $('res-verses'),
      spiritBar: $('spirit-bar'),
      objText: $('objective-text'), objTimer: $('objective-timer'),
      interact: $('interact-prompt'), interactText: $('interact-text'),
      notifications: $('notifications'),
      arrow: $('offscreen-arrow'),
      versePopup: $('verse-popup'), verseText: $('verse-text'), verseRef: $('verse-ref'),
    };
  }

  show() { this.el.hud.classList.remove('hidden'); }
  hide() { this.el.hud.classList.add('hidden'); }

  updateStage(prog) {
    const stage = STAGES[prog.stage];
    this.el.stageIcon.textContent = stage.icon;
    this.el.stageName.textContent = stage.name;
    const needed = stage.graceNeeded;
    const prev = prog.stage > 0 ? STAGES[prog.stage - 1].graceNeeded : 0;
    const pct = needed === Infinity ? 100 : Math.min(100, ((prog.grace - prev) / (needed - prev)) * 100);
    this.el.graceBar.style.width = `${Math.max(0, pct)}%`;
    this.el.graceLabel.textContent = needed === Infinity
      ? `Grâce : ${Math.round(prog.grace)}`
      : `Grâce : ${Math.round(prog.grace)} / ${needed}`;
    this.el.coins.textContent = `🪙 ${prog.coins}`;
    this.el.verses.textContent = `📜 ${prog.versesFound.length}/${CONFIG.VERSE_COUNT}`;
  }

  updateSpirit(v) {
    this.el.spiritBar.style.width = `${(v / CONFIG.SPIRIT_MAX) * 100}%`;
  }

  setObjective(text) {
    this.el.objText.textContent = text || '—';
  }

  setTimer(seconds) {
    if (seconds === null) {
      this.el.objTimer.classList.add('hidden');
      return;
    }
    this.el.objTimer.classList.remove('hidden');
    const m = Math.floor(seconds / 60), s = Math.floor(seconds % 60);
    this.el.objTimer.textContent = `${m}:${String(s).padStart(2, '0')}`;
    this.el.objTimer.classList.toggle('urgent', seconds < 12);
  }

  showInteract(text) {
    this.el.interactText.textContent = text;
    this.el.interact.classList.remove('hidden');
  }
  hideInteract() { this.el.interact.classList.add('hidden'); }

  notify(text, kind = '') {
    const div = document.createElement('div');
    div.className = `notif ${kind}`;
    div.innerHTML = text;
    this.el.notifications.appendChild(div);
    setTimeout(() => div.classList.add('fading'), 4200);
    setTimeout(() => div.remove(), 5000);
    while (this.el.notifications.children.length > 5) {
      this.el.notifications.firstChild.remove();
    }
  }

  showVerse(verse) {
    this.el.verseText.textContent = `« ${verse.text} »`;
    this.el.verseRef.textContent = `— ${verse.ref}`;
    this.el.versePopup.classList.remove('hidden');
    clearTimeout(this._verseT);
    this._verseT = setTimeout(() => this.el.versePopup.classList.add('hidden'), 6000);
  }

  // Flèche vers l'objectif si hors écran
  updateArrow(screenPos) {
    const a = this.el.arrow;
    if (!screenPos) { a.classList.add('hidden'); return; }
    a.classList.remove('hidden');
    a.style.left = `${screenPos.x}px`;
    a.style.top = `${screenPos.y}px`;
    a.style.transform = `rotate(${screenPos.angle}rad)`;
  }
}
