// ==== Sauvegarde locale (localStorage) ====
import { CONFIG } from '../config.js';

export const Save = {
  exists() {
    try { return !!localStorage.getItem(CONFIG.SAVE_KEY); }
    catch { return false; }
  },

  write(game) {
    try {
      const data = {
        v: 1,
        savedAt: Date.now(),
        progression: game.progression.serialize(),
        quests: game.quests.serialize(),
        player: { x: game.player.pos.x, z: game.player.pos.z, heading: game.player.heading },
        time: game.sky.time,
        collectedVerses: game.collectibles?.serialize() || [],
      };
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Sauvegarde impossible :', e);
      return false;
    }
  },

  read() {
    try {
      const raw = localStorage.getItem(CONFIG.SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  clear() {
    try { localStorage.removeItem(CONFIG.SAVE_KEY); } catch { /* ignore */ }
  },
};
