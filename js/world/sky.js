// ==== Ciel, soleil, lune, étoiles — cycle jour/nuit ====
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { lerp, clamp } from '../utils.js';

export class Sky {
  constructor(scene, renderer) {
    this.scene = scene;
    this.time = 0.35 * CONFIG.DAY_LENGTH; // départ ~ matin (8h24)
    this.isNight = false;

    // Lumières
    this.ambient = new THREE.AmbientLight(0xffffff, 0.32);
    scene.add(this.ambient);
    this.hemi = new THREE.HemisphereLight(0xbfd6f0, 0x6a6a5a, 1.05);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2dd, 2.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const S = 70;
    this.sun.shadow.camera.left = -S;
    this.sun.shadow.camera.right = S;
    this.sun.shadow.camera.top = S;
    this.sun.shadow.camera.bottom = -S;
    this.sun.shadow.camera.near = 10;
    this.sun.shadow.camera.far = 400;
    this.sun.shadow.bias = -0.0005;
    scene.add(this.sun);
    scene.add(this.sun.target);

    // Brouillard + fond
    scene.fog = new THREE.Fog(0x9db8d8, 120, 620);
    scene.background = new THREE.Color(0x9db8d8);

    // Soleil / lune visibles
    this.sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(14, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff0b8, fog: false })
    );
    scene.add(this.sunMesh);
    this.moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(9, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0xe8ecf5, fog: false })
    );
    scene.add(this.moonMesh);

    // Étoiles
    const starCount = 700;
    const pos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.random() * Math.PI * 0.5;
      const r = 850;
      pos[i * 3] = Math.cos(a) * Math.cos(b) * r;
      pos[i * 3 + 1] = Math.sin(b) * r + 30;
      pos[i * 3 + 2] = Math.sin(a) * Math.cos(b) * r;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
    scene.add(this.stars);

    // Couleurs clés (0=minuit, 0.25=aube, 0.5=midi, 0.75=crépuscule)
    this.keyframes = [
      { t: 0.00, sky: 0x0a1020, fog: 0x141e30, sun: 0.0, hemi: 0.38, hc: 0x36486a },
      { t: 0.22, sky: 0x1a2440, fog: 0x2a3450, sun: 0.0, hemi: 0.44, hc: 0x44587a },
      { t: 0.28, sky: 0xe8a86a, fog: 0xd8a880, sun: 1.2, hemi: 0.6, hc: 0xd8b090 },
      { t: 0.38, sky: 0x9db8d8, fog: 0xa8c0dc, sun: 2.2, hemi: 0.9, hc: 0xbfd6f0 },
      { t: 0.62, sky: 0x9db8d8, fog: 0xa8c0dc, sun: 2.2, hemi: 0.9, hc: 0xbfd6f0 },
      { t: 0.72, sky: 0xe89a5a, fog: 0xd89870, sun: 1.1, hemi: 0.55, hc: 0xe0a878 },
      { t: 0.78, sky: 0x2a2448, fog: 0x342c50, sun: 0.0, hemi: 0.44, hc: 0x4a4a78 },
      { t: 1.00, sky: 0x0a1020, fog: 0x141e30, sun: 0.0, hemi: 0.38, hc: 0x36486a },
    ];
    this._ca = new THREE.Color();
    this._cb = new THREE.Color();
  }

  // t normalisé [0,1] du jour
  get dayT() { return (this.time % CONFIG.DAY_LENGTH) / CONFIG.DAY_LENGTH; }

  // heure lisible
  get hour() { return this.dayT * 24; }

  setHour(h) { this.time = (h / 24) * CONFIG.DAY_LENGTH; }

  update(dt, playerPos) {
    this.time += dt;
    const t = this.dayT;

    // Interpolation des keyframes
    const kf = this.keyframes;
    let a = kf[0], b = kf[kf.length - 1];
    for (let i = 0; i < kf.length - 1; i++) {
      if (t >= kf[i].t && t <= kf[i + 1].t) { a = kf[i]; b = kf[i + 1]; break; }
    }
    const f = (t - a.t) / Math.max(1e-6, b.t - a.t);

    this._ca.setHex(a.sky).lerp(this._cb.setHex(b.sky), f);
    this.scene.background.copy(this._ca);
    this._ca.setHex(a.fog).lerp(this._cb.setHex(b.fog), f);
    this.scene.fog.color.copy(this._ca);
    this._ca.setHex(a.hc).lerp(this._cb.setHex(b.hc), f);
    this.hemi.color.copy(this._ca);
    this.sun.intensity = lerp(a.sun, b.sun, f);
    this.hemi.intensity = lerp(a.hemi, b.hemi, f) * 1.15;
    this.ambient.intensity = 0.08 + this.hemi.intensity * 0.28;

    // Position du soleil : angle sur le cycle (midi = zénith)
    const sunAngle = (t - 0.25) * Math.PI * 2; // lever à t=0.25
    const sr = 500;
    const sx = Math.cos(sunAngle) * sr;
    const sy = Math.sin(sunAngle) * sr;
    this.sun.position.set(playerPos.x + sx * 0.5, Math.max(sy, 20), playerPos.z + 200);
    this.sun.target.position.set(playerPos.x, 0, playerPos.z);
    this.sunMesh.position.set(playerPos.x + sx, sy, playerPos.z + 300);
    this.sunMesh.visible = sy > -30;
    this.moonMesh.position.set(playerPos.x - sx, -sy, playerPos.z - 300);
    this.moonMesh.visible = -sy > -30;

    // Étoiles la nuit
    const nightAmount = clamp((0.24 - Math.min(Math.abs(t - 0), Math.abs(t - 1), Math.abs(t - 0.99))) * 8, 0, 1)
      + clamp((t < 0.24 || t > 0.76) ? 1 : 0, 0, 1);
    this.stars.material.opacity = clamp(t < 0.24 ? 1 - t * 3 : t > 0.76 ? (t - 0.76) * 4 : 0, 0, 1) * 0.9;
    this.stars.position.set(playerPos.x, 0, playerPos.z);

    const wasNight = this.isNight;
    this.isNight = t < 0.26 || t > 0.74;
    return wasNight !== this.isNight; // true si transition
  }
}
