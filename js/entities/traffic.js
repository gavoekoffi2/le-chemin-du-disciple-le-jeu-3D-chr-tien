// ==== Trafic : voitures autonomes + voiture conduisible par le joueur ====
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { buildCar } from './character.js';
import { makeRNG, dist2D, lerpAngle, resolveCircleVsAABBs, clamp } from '../utils.js';

const B = CONFIG.BLOCK, R = CONFIG.ROAD, G = CONFIG.GRID;
const CITY = CONFIG.CITY_SIZE, HALF = CITY / 2;

// Centres des rues (8 lignes par axe)
function roadCenter(k) { return -HALF + R / 2 + k * (B + R); }

class AICar {
  constructor(scene, rng) {
    this.mesh = buildCar();
    scene.add(this.mesh);
    // Noeud de départ : intersection aléatoire
    this.node = { i: Math.floor(rng() * (G + 1)), j: Math.floor(rng() * (G + 1)) };
    this.next = this._pickNext(this.node, null, rng);
    this.x = roadCenter(this.node.i);
    this.z = roadCenter(this.node.j);
    this.speed = 0;
    this.maxSpeed = 9 + rng() * 5;
    this.heading = 0;
    this.rng = rng;
  }

  _pickNext(from, prev, rng) {
    const options = [];
    if (from.i > 0) options.push({ i: from.i - 1, j: from.j });
    if (from.i < G) options.push({ i: from.i + 1, j: from.j });
    if (from.j > 0) options.push({ i: from.i, j: from.j - 1 });
    if (from.j < G) options.push({ i: from.i, j: from.j + 1 });
    const filtered = prev ? options.filter(o => !(o.i === prev.i && o.j === prev.j)) : options;
    const list = filtered.length ? filtered : options;
    return list[Math.floor(rng() * list.length)];
  }

  update(dt, obstacles) {
    const tx = roadCenter(this.next.i), tz = roadCenter(this.next.j);
    // Offset de voie (conduite à droite)
    const dirX = Math.sign(tx - roadCenter(this.node.i));
    const dirZ = Math.sign(tz - roadCenter(this.node.j));
    const laneX = tx + (dirZ !== 0 ? -dirZ * 3 : 0);
    const laneZ = tz + (dirX !== 0 ? dirX * 3 : 0);

    const dx = laneX - this.x, dz = laneZ - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 2.5) {
      const prev = this.node;
      this.node = this.next;
      this.next = this._pickNext(this.node, prev, this.rng);
      return;
    }
    const ang = Math.atan2(dx, dz);
    this.heading = lerpAngle(this.heading, ang, Math.min(1, dt * 3));

    // Freiner si un obstacle (joueur / autre voiture) est devant
    let brake = false;
    const aheadX = this.x + Math.sin(this.heading) * 7;
    const aheadZ = this.z + Math.cos(this.heading) * 7;
    for (const ob of obstacles) {
      if (ob === this) continue;
      if (dist2D(aheadX, aheadZ, ob.x, ob.z) < 5) { brake = true; break; }
    }
    const target = brake ? 0 : this.maxSpeed;
    this.speed += clamp(target - this.speed, -30 * dt, 8 * dt);
    this.x += Math.sin(this.heading) * this.speed * dt;
    this.z += Math.cos(this.heading) * this.speed * dt;
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.heading;
  }
}

// Voiture garée que le joueur peut conduire
class PlayerCar {
  constructor(scene, x, z, ry, color) {
    this.mesh = buildCar(color);
    this.x = x; this.z = z;
    this.heading = ry;
    this.speed = 0;
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = ry;
    scene.add(this.mesh);
  }

  drive(dt, input, colliders) {
    const accel = input.forward ? CONFIG.CAR_ACCEL : 0;
    const brake = input.back;
    if (accel) this.speed = Math.min(CONFIG.CAR_MAX_SPEED, this.speed + accel * dt);
    else if (brake) this.speed = Math.max(-8, this.speed - CONFIG.CAR_BRAKE * dt);
    else this.speed *= Math.pow(0.4, dt); // frottement

    if (Math.abs(this.speed) > 0.5) {
      const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
      this.heading += steer * CONFIG.CAR_TURN * dt * Math.sign(this.speed) * Math.min(1, Math.abs(this.speed) / 8);
    }
    const nx = this.x + Math.sin(this.heading) * this.speed * dt;
    const nz = this.z + Math.cos(this.heading) * this.speed * dt;
    const resolved = resolveCircleVsAABBs(nx, nz, 1.5, colliders);
    // Choc : on amortit
    if (Math.abs(resolved.x - nx) > 0.01 || Math.abs(resolved.z - nz) > 0.01) this.speed *= 0.25;
    this.x = resolved.x; this.z = resolved.z;
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.heading;
  }
}

export class Traffic {
  constructor(scene) {
    this.scene = scene;
    const rng = makeRNG(4242);
    this.aiCars = [];
    for (let k = 0; k < 12; k++) this.aiCars.push(new AICar(scene, rng));
    // Voitures conduisibles garées à des endroits clés
    this.playerCars = [
      new PlayerCar(scene, -72 + 14, 210 + 42, Math.PI / 2, 0xd8b83a),   // près de la chapelle
      new PlayerCar(scene, 42, -6, 0, 0x3a6ac8),                          // marché
      new PlayerCar(scene, 6, -186, Math.PI, 0xc84a3a),                   // place de la fontaine
      new PlayerCar(scene, -180, 246, Math.PI / 2, 0x4a9a5a),             // port ouest
      new PlayerCar(scene, 150, -150, 0, 0xe8e8e8),                       // vers le temple
    ];
    this.driving = null;
  }

  nearestCar(x, z, maxDist = 3.5) {
    let best = null, bd = maxDist;
    for (const c of this.playerCars) {
      const d = dist2D(x, z, c.x, c.z);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  enter(car) { this.driving = car; }
  exit() {
    const car = this.driving;
    this.driving = null;
    return car;
  }

  update(dt, input, colliders, playerPos) {
    if (this.driving) this.driving.drive(dt, input, colliders);
    // Obstacles pour l'IA : joueur + voitures joueur + autres voitures IA
    const obstacles = [
      { x: playerPos.x, z: playerPos.z },
      ...this.playerCars,
      ...this.aiCars,
    ];
    for (const c of this.aiCars) c.update(dt, obstacles);
  }
}
