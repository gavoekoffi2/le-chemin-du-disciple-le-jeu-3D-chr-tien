// ==== PNJ : piétons ambiants + personnages de quête ====
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { buildHumanoid, animateHumanoid } from './character.js';
import { blockOrigin } from '../world/city.js';
import { makeRNG, lerpAngle, dist2D } from '../utils.js';

const B = CONFIG.BLOCK, G = CONFIG.GRID;

// Piéton qui fait le tour de son bloc sur le trottoir
class Pedestrian {
  constructor(scene, rng) {
    const i = Math.floor(rng() * G), j = Math.floor(rng() * G);
    const o = blockOrigin(i, j);
    const m = 1.5; // distance au bord du bloc (sur le trottoir)
    this.corners = [
      { x: o.x + m, z: o.z + m },
      { x: o.x + B - m, z: o.z + m },
      { x: o.x + B - m, z: o.z + B - m },
      { x: o.x + m, z: o.z + B - m },
    ];
    this.target = Math.floor(rng() * 4);
    this.human = buildHumanoid();
    this.speed = 1.6 + rng() * 1.4;
    this.pauseT = 0;
    const start = this.corners[(this.target + 3) % 4];
    this.x = start.x; this.z = start.z;
    this.heading = 0;
    this.dir = rng() < 0.5 ? 1 : 3; // sens horaire ou anti-horaire
    this.human.group.position.set(this.x, 0, this.z);
    scene.add(this.human.group);
  }

  update(dt, playerPos) {
    // Optimisation : n'animer finement que près du joueur
    const d = dist2D(this.x, this.z, playerPos.x, playerPos.z);
    if (d > 160) return;

    if (this.pauseT > 0) {
      this.pauseT -= dt;
      animateHumanoid(this.human, dt, 0);
      return;
    }
    const t = this.corners[this.target];
    const dx = t.x - this.x, dz = t.z - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.5) {
      this.target = (this.target + this.dir) % 4;
      if (Math.random() < 0.25) this.pauseT = 1.5 + Math.random() * 3;
      return;
    }
    const ang = Math.atan2(dx, dz);
    this.heading = lerpAngle(this.heading, ang, Math.min(1, dt * 6));
    this.x += Math.sin(this.heading) * this.speed * dt;
    this.z += Math.cos(this.heading) * this.speed * dt;
    this.human.group.position.set(this.x, this.human.group.position.y, this.z);
    this.human.group.rotation.y = this.heading;
    if (d < 90) animateHumanoid(this.human, dt, this.speed);
  }
}

// PNJ nommé (mentor / personnage de quête) — statique avec marqueur
export class QuestNPC {
  constructor(scene, def) {
    this.def = def;
    this.name = def.name;
    this.x = def.x; this.z = def.z;
    this.human = buildHumanoid(def.look || {});
    this.human.group.position.set(def.x, 0, def.z);
    this.human.group.rotation.y = def.ry ?? Math.PI;
    scene.add(this.human.group);
    this.scene = scene;

    // Marqueur "!" flottant (visible si quête dispo)
    const markerCanvas = document.createElement('canvas');
    markerCanvas.width = 64; markerCanvas.height = 64;
    const g = markerCanvas.getContext('2d');
    g.fillStyle = '#e8c454';
    g.font = 'bold 52px Georgia';
    g.textAlign = 'center';
    g.fillText('!', 32, 50);
    const tex = new THREE.CanvasTexture(markerCanvas);
    this.marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    this.marker.scale.set(0.9, 0.9, 1);
    this.marker.position.set(def.x, 3.4, def.z);
    this.marker.visible = false;
    scene.add(this.marker);
    this.markerT = 0;
  }

  setMarker(visible) { this.marker.visible = visible; }

  lookAt(px, pz) {
    this.human.group.rotation.y = Math.atan2(px - this.x, pz - this.z);
  }

  update(dt, playerPos) {
    this.markerT += dt;
    this.marker.position.y = 3.4 + Math.sin(this.markerT * 2.5) * 0.18;
    const d = dist2D(this.x, this.z, playerPos.x, playerPos.z);
    if (d < 60) animateHumanoid(this.human, dt, 0);
    if (d < 6) this.lookAt(playerPos.x, playerPos.z);
  }

  remove() {
    this.scene.remove(this.human.group);
    this.scene.remove(this.marker);
  }
}

export class NPCManager {
  constructor(scene) {
    this.scene = scene;
    this.pedestrians = [];
    this.questNPCs = new Map();
    const rng = makeRNG(777);
    for (let k = 0; k < 48; k++) this.pedestrians.push(new Pedestrian(scene, rng));
  }

  addQuestNPC(def) {
    this.removeQuestNPC(def.id); // évite les doublons (rechargement de partie)
    const npc = new QuestNPC(this.scene, def);
    this.questNPCs.set(def.id, npc);
    return npc;
  }
  get(id) { return this.questNPCs.get(id); }
  removeQuestNPC(id) {
    const npc = this.questNPCs.get(id);
    if (npc) { npc.remove(); this.questNPCs.delete(id); }
  }

  update(dt, playerPos) {
    for (const p of this.pedestrians) p.update(dt, playerPos);
    for (const npc of this.questNPCs.values()) npc.update(dt, playerPos);
  }
}
