// ==== Mini-jeu 3D : le Combat Spirituel (Arène) ====
// Recueillir des flammes de prière, esquiver les ombres de la tentation.
import * as THREE from 'three';
import { dist2D } from '../utils.js';

export class ArenaGame {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.objects = [];
  }

  start(needed = 10, maxHits = 3, onDone = null) {
    const g = this.game;
    this.needed = needed;
    this.maxHits = maxHits;
    this.onDone = onDone;
    this.collected = 0;
    this.hits = 0;
    this.waiting = true;   // en attente que le joueur entre dans l'arène
    this.active = true;
    g.hud.notify('⚔ Rendez-vous dans l\'Arène pour commencer le combat spirituel !');
  }

  _begin() {
    const g = this.game;
    this.waiting = false;
    this.center = g.city.arenaCenter;
    this.flames = [];
    this.shadows = [];
    // 4 flammes visibles à la fois
    for (let i = 0; i < 4; i++) this._spawnFlame();
    // 3 ombres qui orbitent puis foncent
    for (let i = 0; i < 3; i++) this._spawnShadow(i);
    g.hud.notify(`🔥 Recueillez ${this.needed} flammes — évitez les ombres ! (${this.maxHits} contacts = échec)`);
  }

  _spawnFlame() {
    const a = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 17;
    const x = this.center.x + Math.cos(a) * r;
    const z = this.center.z + Math.sin(a) * r;
    const mesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 1.1, 6),
      new THREE.MeshBasicMaterial({ color: 0xffc040 })
    );
    mesh.position.set(x, 1, z);
    this.game.scene.add(mesh);
    const flame = { mesh, x, z };
    this.flames.push(flame);
    this.objects.push(mesh);
  }

  _spawnShadow(i) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0x30104a, transparent: true, opacity: 0.85 })
    );
    const a = (i / 3) * Math.PI * 2;
    mesh.position.set(this.center.x + Math.cos(a) * 15, 1, this.center.z + Math.sin(a) * 15);
    this.game.scene.add(mesh);
    this.objects.push(mesh);
    this.shadows.push({ mesh, angle: a, radius: 15, mode: 'orbit', speed: 0.9 + i * 0.35, cooldown: 0 });
  }

  update(dt) {
    if (!this.active) return;
    const g = this.game;
    const p = g.player.pos;

    if (this.waiting) {
      if (dist2D(p.x, p.z, g.city.arenaCenter.x, g.city.arenaCenter.z) < 20) this._begin();
      return;
    }

    // Flammes : contact = recueillies
    for (const f of this.flames) {
      if (f.taken) continue;
      f.mesh.rotation.y += dt * 3;
      f.mesh.position.y = 1 + Math.sin(performance.now() * 0.004 + f.x) * 0.2;
      if (dist2D(p.x, p.z, f.x, f.z) < 1.4) {
        f.taken = true;
        g.scene.remove(f.mesh);
        this.collected++;
        g.audio.pickup();
        g.hud.setObjective(`⚔ Flammes de prière : ${this.collected}/${this.needed} — Ombres subies : ${this.hits}/${this.maxHits - 1} max`);
        if (this.collected + this.flames.filter(x => !x.taken).length < this.needed + 2) this._spawnFlame();
      }
    }

    // Ombres : orbitent, puis chargent le joueur par vagues
    for (const s of this.shadows) {
      s.cooldown -= dt;
      if (s.mode === 'orbit') {
        s.angle += dt * s.speed;
        s.mesh.position.x = this.center.x + Math.cos(s.angle) * s.radius;
        s.mesh.position.z = this.center.z + Math.sin(s.angle) * s.radius;
        if (s.cooldown <= 0 && Math.random() < 0.012) { s.mode = 'charge'; }
      } else {
        // Charge vers le joueur
        const dx = p.x - s.mesh.position.x, dz = p.z - s.mesh.position.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        const sp = 8.5;
        s.mesh.position.x += (dx / d) * sp * dt;
        s.mesh.position.z += (dz / d) * sp * dt;
        if (d < 1.2 && s.cooldown <= 0) {
          this.hits++;
          s.cooldown = 2;
          s.mode = 'orbit';
          g.audio.bad();
          document.body.style.transition = 'none';
          document.body.style.boxShadow = 'inset 0 0 120px rgba(120,20,60,0.9)';
          setTimeout(() => { document.body.style.transition = 'box-shadow 1s'; document.body.style.boxShadow = 'none'; }, 60);
          g.hud.notify(`💢 Une ombre vous a atteint ! (${this.hits}/${this.maxHits})`);
          if (this.hits >= this.maxHits) { this._finish(false); return; }
        }
        if (d > 26 || (d < 1.2 && s.cooldown > 0)) s.mode = 'orbit';
      }
      s.mesh.position.y = 1 + Math.sin(performance.now() * 0.005) * 0.15;
      // Reste dans l'arène
      const dc = dist2D(s.mesh.position.x, s.mesh.position.z, this.center.x, this.center.z);
      if (dc > 23) {
        const ax = (s.mesh.position.x - this.center.x) / dc;
        const az = (s.mesh.position.z - this.center.z) / dc;
        s.mesh.position.x = this.center.x + ax * 23;
        s.mesh.position.z = this.center.z + az * 23;
        s.mode = 'orbit';
      }
    }

    if (this.collected >= this.needed) this._finish(true);
  }

  _finish(success) {
    const g = this.game;
    this.active = false;
    for (const o of this.objects) g.scene.remove(o);
    this.objects = [];
    if (success) {
      g.audio.questDone();
      g.hud.notify('⚔ Victoire ! « Résistez au diable, et il fuira loin de vous. » (Jacques 4:7)');
    } else {
      g.hud.notify('Les ombres vous ont submergé… Reprenez souffle et réessayez.');
    }
    this.onDone?.(success);
  }
}
