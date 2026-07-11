/* LA VOIE — utilitaires globaux */
window.GAME = window.GAME || {};

GAME.U = {
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + Math.random() * (b - a),
  randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  dist2D: (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz),
  // interpolation d'angle en tenant compte du tour complet
  lerpAngle(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  formatTime(sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60), c = Math.floor((sec % 1) * 100);
    return `${m}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
  }
};

// Fabrique de matériaux partagés (économie GPU) — PBR pour un rendu plus riche
GAME.mats = {};
GAME.mat = function (color, opts) {
  const key = color + JSON.stringify(opts || {});
  if (!GAME.mats[key]) {
    GAME.mats[key] = new THREE.MeshStandardMaterial(
      Object.assign({ color, roughness: 0.88, metalness: 0.04 }, opts || {}));
  }
  return GAME.mats[key];
};

// Texture de bruit en niveaux de gris (à teinter via material.color)
GAME.makeNoiseTexture = function (brightness, contrast, size, blobs) {
  size = size || 128;
  blobs = blobs === undefined ? 40 : blobs;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.max(0, Math.min(255, brightness + (Math.random() - 0.5) * contrast));
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // quelques taches plus larges pour casser la régularité
  for (let k = 0; k < blobs; k++) {
    ctx.fillStyle = 'rgba(' + (brightness > 128 ? '0,0,0' : '255,255,255') + ',' + (0.02 + Math.random() * 0.03) + ')';
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 4 + Math.random() * 14, 0, 7);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.encoding = THREE.sRGBEncoding;
  return tex;
};

// Texture de fenêtres générée par canvas (pour les immeubles)
GAME.makeWindowTexture = function (baseColor, litRatio) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 122; y += 14) {
    for (let x = 6; x < 58; x += 14) {
      const lit = Math.random() < litRatio;
      ctx.fillStyle = lit ? '#ffe9a8' : '#1c2333';
      ctx.fillRect(x, y, 8, 9);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.encoding = THREE.sRGBEncoding;
  return tex;
};
