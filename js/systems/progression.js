// ==== Progression spirituelle : grâce, étapes, fruits, armure ====
import { STAGES, FRUITS, ARMOR, CONFIG } from '../config.js';

export class Progression {
  constructor(events) {
    this.events = events; // { onStageUp(stage), onFruitGain(fruit, amt), onGraceGain(amt), onArmorUnlock(piece) }
    this.reset();
  }

  reset() {
    this.stage = 0;
    this.grace = 0;
    this.coins = 15;
    this.fruits = {};
    for (const f of FRUITS) this.fruits[f.id] = 5;
    this.armor = {}; // id -> true
    this.versesFound = [];
    this.completedQuests = [];
  }

  get stageData() { return STAGES[this.stage]; }

  addGrace(amount, silent = false) {
    this.grace += amount;
    if (!silent) this.events.onGraceGain?.(amount);
    // Passage d'étape
    while (this.stage < STAGES.length - 1 && this.grace >= STAGES[this.stage].graceNeeded) {
      // Le passage réel est déclenché par la quête finale de chaque étape,
      // mais la grâce ne bloque jamais : on plafonne l'affichage seulement.
      break;
    }
  }

  canAdvanceStage() {
    return this.grace >= STAGES[this.stage].graceNeeded;
  }

  advanceStage() {
    if (this.stage >= STAGES.length - 1) return null;
    // La grâce rejoint au moins le seuil franchi (la barre reste cohérente, jamais de blocage)
    this.grace = Math.max(this.grace, STAGES[this.stage].graceNeeded);
    this.stage++;
    const newStage = STAGES[this.stage];
    // Débloque les pièces d'armure de cette étape
    const unlocked = [];
    for (const piece of ARMOR) {
      if (piece.stage <= this.stage && !this.armor[piece.id]) {
        this.armor[piece.id] = true;
        unlocked.push(piece);
        this.events.onArmorUnlock?.(piece);
      }
    }
    this.events.onStageUp?.(newStage, unlocked);
    return { stage: newStage, unlocked };
  }

  addFruit(fruitId, amount = 1) {
    if (!(fruitId in this.fruits)) return;
    this.fruits[fruitId] = Math.min(100, this.fruits[fruitId] + amount);
    const fruit = FRUITS.find(f => f.id === fruitId);
    this.events.onFruitGain?.(fruit, amount);
  }

  addCoins(amount) {
    this.coins = Math.max(0, this.coins + amount);
    this.events.onCoinsChange?.(this.coins);
  }

  foundVerse(index) {
    if (this.versesFound.includes(index)) return false;
    this.versesFound.push(index);
    return true;
  }

  fruitLevel(fruitId) { return this.fruits[fruitId] ?? 0; }

  serialize() {
    return {
      stage: this.stage, grace: this.grace, coins: this.coins,
      fruits: this.fruits, armor: this.armor,
      versesFound: this.versesFound, completedQuests: this.completedQuests,
    };
  }

  deserialize(data) {
    this.stage = data.stage ?? 0;
    this.grace = data.grace ?? 0;
    this.coins = data.coins ?? 15;
    this.fruits = { ...this.fruits, ...(data.fruits || {}) };
    this.armor = data.armor || {};
    this.versesFound = data.versesFound || [];
    this.completedQuests = data.completedQuests || [];
  }
}
