/* LA VOIE — audio procédural (WebAudio, aucun fichier externe) */
GAME.audio = (function () {
  let ctx = null, master = null, padTimer = null, enabled = true;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.16;
        master.connect(ctx.destination);
      } catch (e) { enabled = false; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return !!ctx;
  }

  function tone(freq, dur, type, vol, delay) {
    if (!enabled || !ensure()) return;
    const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol || 0.5, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  // Nappe ambiante douce : accords lents façon orgue lointain
  const chords = [
    [261.6, 329.6, 392.0],   // C
    [220.0, 261.6, 329.6],   // Am
    [174.6, 220.0, 261.6],   // F
    [196.0, 246.9, 293.7]    // G
  ];
  let chordIdx = 0;
  const melodyNotes = [523.3, 587.3, 659.3, 784.0, 880.0]; // pentatonique de do
  function playPad() {
    if (!enabled || !ctx) return;
    const chord = chords[chordIdx % chords.length];
    chordIdx++;
    chord.forEach((f, i) => {
      tone(f / 2, 7.5, 'sine', 0.10 - i * 0.02, i * 0.15);
      tone(f, 7.5, 'triangle', 0.03, i * 0.2);
    });
    // petite phrase mélodique aléatoire par-dessus la nappe
    let d = 1.2 + Math.random() * 1.5;
    const notes = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < notes; k++) {
      tone(melodyNotes[Math.floor(Math.random() * melodyNotes.length)], 1.6, 'sine', 0.05, d);
      d += 0.9 + Math.random() * 0.9;
    }
  }
  function startAmbient() {
    if (!ensure() || padTimer) return;
    playPad();
    padTimer = setInterval(playPad, 8000);
  }

  return {
    startAmbient,
    ui() { tone(660, 0.09, 'square', 0.12); },
    step() { tone(90 + Math.random() * 30, 0.05, 'triangle', 0.10); },
    pickup() { tone(523, 0.12, 'sine', 0.3); tone(784, 0.25, 'sine', 0.25, 0.1); },
    success() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, 'sine', 0.3, i * 0.12)); },
    fail() { tone(220, 0.3, 'sawtooth', 0.12); tone(185, 0.4, 'sawtooth', 0.1, 0.15); },
    stageUp() { [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.6, 'sine', 0.28, i * 0.16)); },
    block() { tone(300, 0.08, 'square', 0.2); tone(500, 0.1, 'square', 0.12, 0.03); },
    bell() { tone(880, 1.4, 'sine', 0.2); tone(1320, 1.0, 'sine', 0.08, 0.02); },
    toggle() { enabled = !enabled; if (!enabled && padTimer) { clearInterval(padTimer); padTimer = null; } else if (enabled) startAmbient(); return enabled; }
  };
})();
