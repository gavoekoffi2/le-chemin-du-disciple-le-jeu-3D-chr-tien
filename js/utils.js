// ==== Utilitaires ====
import * as THREE from 'three';

// RNG déterministe (mulberry32) pour une ville reproductible
export function makeRNG(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function dist2D(x1, z1, x2, z2) { const dx = x2 - x1, dz = z2 - z1; return Math.sqrt(dx * dx + dz * dz); }
export function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// Interpolation d'angle (chemin le plus court)
export function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

// ---- Collisions : cercle (joueur) vs AABB (bâtiments) ----
// Les AABB sont { minX, maxX, minZ, maxZ }
export function resolveCircleVsAABBs(x, z, radius, aabbs) {
  let px = x, pz = z;
  for (const b of aabbs) {
    const cx = clamp(px, b.minX, b.maxX);
    const cz = clamp(pz, b.minZ, b.maxZ);
    const dx = px - cx, dz = pz - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < radius * radius) {
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2);
        px = cx + (dx / d) * radius;
        pz = cz + (dz / d) * radius;
      } else {
        // Centre dans la boîte : expulser par la face la plus proche
        const left = px - b.minX, right = b.maxX - px, top = pz - b.minZ, bottom = b.maxZ - pz;
        const m = Math.min(left, right, top, bottom);
        if (m === left) px = b.minX - radius;
        else if (m === right) px = b.maxX + radius;
        else if (m === top) pz = b.minZ - radius;
        else pz = b.maxZ + radius;
      }
    }
  }
  return { x: px, z: pz };
}

export function pointInAABB(x, z, b, margin = 0) {
  return x > b.minX - margin && x < b.maxX + margin && z > b.minZ - margin && z < b.maxZ + margin;
}

// ---- Textures générées par canvas ----
export function makeWindowTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 128, 256);
  // Fenêtres sombres sur fond clair (teinté par instance)
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 4; x++) {
      const lit = Math.random() < 0.25;
      g.fillStyle = lit ? '#ffe9a8' : '#20304a';
      g.fillRect(10 + x * 30, 14 + y * 30, 18, 20);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeRoadTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#3a3f47';
  g.fillRect(0, 0, 64, 256);
  g.fillStyle = '#d8d8c8';
  for (let y = 0; y < 256; y += 64) g.fillRect(29, y + 8, 6, 32); // ligne médiane
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeWaterTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#2a5a8a';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(255,255,255,0.18)';
  g.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    const y = Math.random() * 128;
    g.moveTo(Math.random() * 128, y);
    g.quadraticCurveTo(Math.random() * 128, y + 6, Math.random() * 128, y);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Fusion manuelle de géométries (positions/normales/uv, non indexées)
export function mergeGeometries(geoms) {
  let posCount = 0;
  let hasUV = true;
  const nonIndexed = geoms.map(g => g.index ? g.toNonIndexed() : g);
  for (const g of nonIndexed) {
    posCount += g.attributes.position.count;
    if (!g.attributes.uv) hasUV = false;
  }
  const pos = new Float32Array(posCount * 3);
  const norm = new Float32Array(posCount * 3);
  const uv = hasUV ? new Float32Array(posCount * 2) : null;
  let offset = 0;
  for (const g of nonIndexed) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, offset * 3);
    norm.set(g.attributes.normal.array, offset * 3);
    if (uv) uv.set(g.attributes.uv.array, offset * 2);
    offset += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
  if (uv) out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}

// Applique une matrice de transformation à une géométrie clonée
export function transformed(geom, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) {
  const g = geom.clone();
  const m = new THREE.Matrix4()
    .makeRotationY(ry)
    .scale(new THREE.Vector3(sx, sy, sz))
    .setPosition(x, y, z);
  g.applyMatrix4(m);
  return g;
}
