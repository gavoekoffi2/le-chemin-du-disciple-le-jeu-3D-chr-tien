// ==== Audio génératif (WebAudio) — nappes paisibles + effets ====
// Aucun fichier audio : tout est synthétisé, donc 100 % statique et léger.

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicGain = null;
    this._padTimer = null;
    this._chordIndex = 0;
    // Progression d'accords paisible (La majeur / fa# mineur, ambiance hymne)
    this.chords = [
      [220.00, 277.18, 329.63],          // La
      [174.61, 220.00, 261.63],          // Fa
      [196.00, 246.94, 293.66],          // Sol
      [164.81, 220.00, 261.63],          // La min inversion / Mi
    ];
  }

  // Doit être appelé après un geste utilisateur
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);
      this._startPads();
    } catch (e) {
      console.warn('WebAudio indisponible', e);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.master) this.master.gain.value = this.enabled ? 0.5 : 0;
    return this.enabled;
  }

  _startPads() {
    const playChord = () => {
      if (!this.ctx || !this.enabled) { return; }
      const chord = this.chords[this._chordIndex % this.chords.length];
      this._chordIndex++;
      const now = this.ctx.currentTime;
      const dur = 7;
      for (const freq of chord) {
        for (const detune of [-3, 3]) {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          osc.detune.value = detune;
          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(0.06, now + 2.2);
          g.gain.linearRampToValueAtTime(0.0, now + dur);
          osc.connect(g).connect(this.musicGain);
          osc.start(now);
          osc.stop(now + dur);
        }
      }
      // Note haute aléatoire façon carillon
      if (Math.random() < 0.5) {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = chord[Math.floor(Math.random() * chord.length)] * 4;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0, now + 1);
        g.gain.linearRampToValueAtTime(0.025, now + 1.4);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
        osc.connect(g).connect(this.musicGain);
        osc.start(now + 1);
        osc.stop(now + 5);
      }
    };
    playChord();
    this._padTimer = setInterval(playChord, 6000);
  }

  _blip(freq, dur = 0.12, type = 'sine', vol = 0.15, when = 0) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g).connect(this.master);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  pickup() { this._blip(660, 0.15, 'triangle', 0.18); this._blip(990, 0.2, 'triangle', 0.14, 0.08); }
  verse() { this._blip(523, 0.3, 'sine', 0.16); this._blip(659, 0.3, 'sine', 0.14, 0.12); this._blip(784, 0.5, 'sine', 0.14, 0.24); }
  questDone() { [523, 659, 784, 1047].forEach((f, i) => this._blip(f, 0.35, 'triangle', 0.16, i * 0.13)); }
  stageUp() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this._blip(f, 0.6, 'sine', 0.15, i * 0.16)); }
  dialogueBlip() { this._blip(440 + Math.random() * 120, 0.05, 'square', 0.03); }
  bad() { this._blip(220, 0.25, 'sawtooth', 0.08); this._blip(196, 0.3, 'sawtooth', 0.08, 0.1); }
  bell() { this._blip(880, 1.2, 'sine', 0.12); this._blip(1760, 0.8, 'sine', 0.05); }
}
