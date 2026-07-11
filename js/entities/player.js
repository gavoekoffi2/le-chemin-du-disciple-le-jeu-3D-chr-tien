// ==== Joueur : contrôleur 3ème personne + armure de Dieu visible ====
import * as THREE from 'three';
import { CONFIG, STAGES } from '../config.js';
import { buildHumanoid, animateHumanoid } from './character.js';
import { resolveCircleVsAABBs, lerpAngle, clamp, lerp } from '../utils.js';

export class Player {
  constructor(scene, input) {
    this.scene = scene;
    this.input = input;
    this.pos = new THREE.Vector3(-72, 0, 210); // départ : devant la chapelle
    this.velY = 0;
    this.grounded = true;
    this.heading = 0;         // orientation du mesh
    this.speed = 0;
    this.spirit = CONFIG.SPIRIT_MAX;
    this.inVehicle = null;

    // Héros métis : peau brune intermédiaire, cheveux noirs bouclés
    this.human = buildHumanoid({ skin: 0xa9764f, cloth: 0x4a6a9a, pants: 0x3a4050, hair: 0x191310, curly: true });
    this.mesh = new THREE.Group();
    this.mesh.add(this.human.group);
    scene.add(this.mesh);

    // Aura d'étape spirituelle (anneau lumineux au sol)
    this.aura = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 0.95, 24),
      new THREE.MeshBasicMaterial({ color: 0xbfd9f2, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    this.aura.rotation.x = -Math.PI / 2;
    this.aura.position.y = 0.06;
    this.mesh.add(this.aura);

    this._buildArmor();
    this.mesh.position.copy(this.pos);
  }

  // ---- Pièces d'armure (cachées tant que non débloquées) ----
  _buildArmor() {
    const gold = new THREE.MeshLambertMaterial({ color: 0xe8c454, emissive: 0x554510 });
    const silver = new THREE.MeshLambertMaterial({ color: 0xc8ccd8, emissive: 0x222630 });
    const p = this.human.parts;
    this.armorMeshes = {};

    // Ceinture de la Vérité
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.18, 0.58), gold);
    belt.position.y = 0.95;
    this.armorMeshes.ceinture = belt;
    this.human.group.add(belt);

    // Chaussures de l'Évangile (surbottes dorées)
    const shoes = new THREE.Group();
    for (const pivot of [p.legL, p.legR]) {
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.52), gold);
      shoe.position.set(0, -0.86, 0.08);
      pivot.add(shoe);
      shoes.children.push(shoe); // référence pour visibilité
      shoe.userData.armorPart = true;
    }
    this.armorMeshes.chaussures = { visible: false, set: (v) => { p.legL.children.forEach(c => { if (c.userData.armorPart) c.visible = v; }); p.legR.children.forEach(c => { if (c.userData.armorPart) c.visible = v; }); } };

    // Cuirasse de la Justice
    const cuirass = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 0.6), silver);
    cuirass.position.y = 1.55;
    this.armorMeshes.cuirasse = cuirass;
    this.human.group.add(cuirass);

    // Bouclier de la Foi (bras gauche)
    const shield = new THREE.Group();
    const shieldBody = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.12, 6), silver);
    shieldBody.rotation.z = Math.PI / 2;
    shield.add(shieldBody);
    const shieldCross = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.06), gold);
    shieldCross.position.x = -0.09;
    shield.add(shieldCross);
    shield.position.set(-0.28, -0.5, 0);
    shield.rotation.y = Math.PI / 2;
    this.armorMeshes.bouclier = shield;
    p.armL.add(shield);

    // Casque du Salut
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.4, 0.62), silver);
    helmet.position.y = 0.55;
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.5), gold);
    crest.position.y = 0.85;
    const helmG = new THREE.Group();
    helmG.add(helmet, crest);
    this.armorMeshes.casque = helmG;
    p.headPivot.add(helmG);

    // Épée de l'Esprit (main droite)
    const sword = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.0, 0.02), new THREE.MeshLambertMaterial({ color: 0xf0f4ff, emissive: 0x445570 }));
    blade.position.y = -0.55;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.07), gold);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.07), new THREE.MeshLambertMaterial({ color: 0x5a3a22 }));
    grip.position.y = 0.14;
    sword.add(blade, guard, grip);
    sword.position.set(0, -1.0, 0.15);
    sword.rotation.x = 0.5;
    this.armorMeshes.epee = sword;
    p.armR.add(sword);

    // Tout caché par défaut
    for (const key of ['ceinture', 'cuirasse', 'bouclier', 'casque', 'epee']) {
      this.armorMeshes[key].visible = false;
    }
    this.armorMeshes.chaussures.set(false);
  }

  applyArmor(equipped) {
    for (const key of ['ceinture', 'cuirasse', 'bouclier', 'casque', 'epee']) {
      this.armorMeshes[key].visible = !!equipped[key];
    }
    this.armorMeshes.chaussures.set(!!equipped.chaussures);
  }

  applyStage(stageId) {
    const stage = STAGES[Math.min(stageId, STAGES.length - 1)];
    this.aura.material.color.setHex(stage.color);
  }

  update(dt, colliders, camYaw) {
    const input = this.input;
    if (this.inVehicle) return; // géré par traffic.js

    // Direction voulue par rapport à la caméra
    let mx = 0, mz = 0;
    if (input.forward) mz += 1;
    if (input.back) mz -= 1;
    if (input.left) mx += 1;
    if (input.right) mx -= 1;
    const moving = (mx !== 0 || mz !== 0);

    let targetSpeed = 0;
    if (moving) {
      const wantRun = input.run && this.spirit > 1;
      targetSpeed = wantRun ? CONFIG.RUN_SPEED : CONFIG.WALK_SPEED;
      if (wantRun) this.spirit = Math.max(0, this.spirit - CONFIG.SPIRIT_DRAIN * dt);
    }
    if (!input.run || !moving) this.spirit = Math.min(CONFIG.SPIRIT_MAX, this.spirit + CONFIG.SPIRIT_REGEN * dt);

    this.speed = lerp(this.speed, targetSpeed, Math.min(1, dt * 8));

    if (moving) {
      const ang = Math.atan2(mx, mz) + camYaw;
      this.heading = lerpAngle(this.heading, ang, Math.min(1, dt * 10));
      const dx = Math.sin(this.heading) * this.speed * dt;
      const dz = Math.cos(this.heading) * this.speed * dt;
      const resolved = resolveCircleVsAABBs(this.pos.x + dx, this.pos.z + dz, CONFIG.PLAYER_RADIUS, colliders);
      this.pos.x = resolved.x;
      this.pos.z = resolved.z;
    }

    // Saut / gravité
    if (input.jump && this.grounded) {
      this.velY = CONFIG.JUMP_VELOCITY;
      this.grounded = false;
    }
    if (!this.grounded) {
      this.velY -= CONFIG.GRAVITY * dt;
      this.pos.y += this.velY * dt;
      if (this.pos.y <= 0) { this.pos.y = 0; this.velY = 0; this.grounded = true; }
    }

    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.heading;
    animateHumanoid(this.human, dt, this.speed, this.grounded);
    this.aura.rotation.z += dt * 0.8;
    // L'aura reste au sol pendant les sauts
    this.aura.position.y = 0.06 - this.pos.y + Math.max(0, this.pos.y * 0);
    this.aura.position.y = 0.06 - (this.grounded ? 0 : this.pos.y);
  }

  teleport(x, z, heading = null) {
    this.pos.set(x, 0, z);
    if (heading !== null) this.heading = heading;
    this.mesh.position.copy(this.pos);
  }
}
