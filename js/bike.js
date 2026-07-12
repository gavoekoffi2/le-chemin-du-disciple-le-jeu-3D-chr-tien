/* LA VOIE — véhicules conduisibles : vélo + voitures (touche F)
   Le module garde le nom GAME.Bike pour compatibilité interne. */
GAME.Bike = (function () {
  const U = GAME.U;
  const vehicles = [];   // { mesh, type:'bike'|'car', wheels, yaw, speed, params }
  let current = null;    // véhicule conduit

  const PARAMS = {
    bike: { maxSpeed: 16, accel: 14, brake: 0.35, steer: 1.9, r: 0.6, boost: 1.4, lean: 0.14, seatY: 0.55 },
    car:  { maxSpeed: 27, accel: 19, brake: 0.15, steer: 1.5, r: 1.2, boost: 1.25, lean: 0.05, seatY: 0.6 }
  };

  /* ---------- construction ---------- */
  function buildBikeMesh() {
    const g = new THREE.Group();
    const frameMat = GAME.mat(0xc0392b);
    const darkMat = GAME.mat(0x1a1a1a);
    const wheelGeo = new THREE.TorusGeometry(0.42, 0.07, 8, 18);
    const wf = new THREE.Mesh(wheelGeo, darkMat); wf.rotation.y = Math.PI / 2; wf.position.set(0, 0.42, 0.75); g.add(wf);
    const wb = new THREE.Mesh(wheelGeo, darkMat); wb.rotation.y = Math.PI / 2; wb.position.set(0, 0.42, -0.75); g.add(wb);
    [wf, wb].forEach(w => {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.78, 0.03), GAME.mat(0x888888));
      w.add(spoke);
      const spoke2 = spoke.clone(); spoke2.rotation.z = Math.PI / 2; w.add(spoke2);
    });
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.5), frameMat);
    bar1.position.set(0, 0.75, 0); g.add(bar1);
    const seatPost = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), frameMat);
    seatPost.position.set(0, 0.95, -0.5); g.add(seatPost);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.45), darkMat);
    seat.position.set(0, 1.2, -0.5); g.add(seat);
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), frameMat);
    fork.position.set(0, 0.75, 0.72); fork.rotation.x = 0.25; g.add(fork);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.06), darkMat);
    handle.position.set(0, 1.15, 0.62); g.add(handle);
    return { mesh: g, wheels: [wf, wb] };
  }

  function buildCarMesh(color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.85, 4.6), GAME.mat(color));
    body.position.y = 0.75;
    body.castShadow = true;
    g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 2.4),
      new THREE.MeshLambertMaterial({ color: 0x223044, transparent: true, opacity: 0.92 }));
    cab.position.set(0, 1.5, -0.25);
    g.add(cab);
    // phares + calandre
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2c8 });
    [-0.7, 0.7].forEach(x => {
      const ph = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.08), lightMat);
      ph.position.set(x, 0.8, 2.32);
      g.add(ph);
    });
    const wheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.32, 12);
    const wheelMat = GAME.mat(0x14141a);
    [[-1.02, 1.45], [1.02, 1.45], [-1.02, -1.45], [1.02, -1.45]].forEach(([x, z]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.4, z);
      g.add(w);
      wheels.push(w);
    });
    return { mesh: g, wheels };
  }

  function addVehicle(scene, type, x, z, color) {
    const built = type === 'bike' ? buildBikeMesh() : buildCarMesh(color || 0xf0f0f4);
    built.mesh.position.set(x, 0, z);
    scene.add(built.mesh);
    vehicles.push({
      mesh: built.mesh, wheels: built.wheels, type,
      yaw: 0, speed: 0, params: PARAMS[type]
    });
  }

  function build(scene, world) {
    addVehicle(scene, 'bike', 8, 120);                       // vélo près du départ
    addVehicle(scene, 'car', -14, 116, 0xf0f0f4);            // voiture blanche, quartier de départ
    addVehicle(scene, 'car', -96, 36, 0x3a76c4);             // voiture bleue près du marché
    addVehicle(scene, 'car', 150, -66, 0xc4a13a);            // voiture dorée près du parc
  }

  /* ---------- monter / descendre ---------- */
  function nearest(playerPos, maxDist) {
    let best = null, bd = maxDist;
    vehicles.forEach(v => {
      const d = U.dist2D(v.mesh.position.x, v.mesh.position.z, playerPos.x, playerPos.z);
      if (d < bd) { bd = d; best = v; }
    });
    return best;
  }

  function toggle(player) {
    if (player.onBike && current) {
      // descendre
      player.onBike = false;
      current.speed = 0;
      player.pos.x = current.mesh.position.x + Math.cos(current.yaw) * (current.type === 'car' ? 2 : 1.2);
      player.pos.z = current.mesh.position.z - Math.sin(current.yaw) * (current.type === 'car' ? 2 : 1.2);
      player.group.visible = true;
      if (player.ch.isReal && player.ch.inner) player.ch.inner.rotation.x = 0;
      GAME.UI.toast(current.type === 'car' ? 'Tu sors de la voiture.' : 'Tu descends du vélo.');
      current = null;
    } else {
      const v = nearest(player.pos, 3.8);
      if (v) {
        current = v;
        player.onBike = true;
        v.yaw = player.yaw;
        GAME.UI.toast(v.type === 'car'
          ? '🚗 Tu conduis ! (Maj = accélération, F = sortir)'
          : '🚲 Tu roules ! (Maj = sprint, F = descendre)');
      }
    }
  }

  /* ---------- conduite ---------- */
  function update(dt, keys, player, t) {
    if (!current) return;
    const v = current, P = v.params;
    let accel = 0, steer = 0;
    if (keys['KeyW'] || keys['KeyZ'] || keys['ArrowUp']) accel = 1;
    if (keys['KeyS'] || keys['ArrowDown']) accel = -0.6;
    if (keys['KeyA'] || keys['KeyQ'] || keys['ArrowLeft']) steer = 1;
    if (keys['KeyD'] || keys['ArrowRight']) steer = -1;
    if (player.touchMove) {
      if (player.touchMove.y < -0.12) accel = Math.max(accel, -player.touchMove.y);
      if (player.touchMove.y > 0.18) accel = Math.min(accel, -0.6 * player.touchMove.y);
      if (Math.abs(player.touchMove.x) > 0.12) steer = -player.touchMove.x;
    }
    const boost = (keys['ShiftLeft'] || keys['ShiftRight']) ? P.boost : 1;

    v.speed = U.clamp(v.speed + accel * P.accel * dt, -8, P.maxSpeed * boost);
    if (!accel) v.speed *= Math.pow(P.brake, dt);
    v.yaw += steer * dt * P.steer * U.clamp(Math.abs(v.speed) / 6, 0, 1) * Math.sign(v.speed || 1);

    const nx = v.mesh.position.x + Math.sin(v.yaw) * v.speed * dt;
    const nz = v.mesh.position.z + Math.cos(v.yaw) * v.speed * dt;

    let blocked = false;
    for (const c of GAME.world.colliders) {
      const cx = U.clamp(nx, c.x1, c.x2), cz = U.clamp(nz, c.z1, c.z2);
      if ((nx - cx) ** 2 + (nz - cz) ** 2 < P.r * P.r) { blocked = true; break; }
    }
    if (!blocked) {
      const L = GAME.world.limit;
      v.mesh.position.x = U.clamp(nx, -L, L);
      v.mesh.position.z = U.clamp(nz, -L, L);
    } else {
      if (Math.abs(v.speed) > 12) GAME.audio.fail();
      v.speed = -v.speed * 0.3;
    }
    v.mesh.position.y = GAME.world.groundHeight(v.mesh.position.x, v.mesh.position.z);
    v.mesh.rotation.y = v.yaw;
    v.mesh.rotation.z = U.lerp(v.mesh.rotation.z, -steer * P.lean * U.clamp(v.speed / 10, 0, 1), 0.2);
    v.wheels.forEach(w => {
      if (v.type === 'bike') w.rotation.z -= v.speed * dt * 2.4;
    });

    // le joueur sur/dans le véhicule
    player.pos.copy(v.mesh.position);
    player.group.position.copy(v.mesh.position);
    player.group.rotation.y = v.yaw;

    if (v.type === 'car') {
      // assis dans l'habitacle : on cache le corps (vitres teintées)
      player.group.visible = false;
    } else {
      player.group.visible = true;
      player.group.position.y += P.seatY;
      if (player.ch.isReal) {
        player.group.position.y -= 0.12;
        if (player.ch.inner) player.ch.inner.rotation.x = 0.2;
        GAME.Character.animate(player.ch, t || 0, Math.abs(v.speed) > 2 ? 'walk' : 'idle');
      } else {
        const p = player.ch.parts;
        p.legL.rotation.x = -1.2 + Math.sin(performance.now() * 0.01) * 0.4 * U.clamp(v.speed / 8, 0, 1);
        p.legR.rotation.x = -1.2 - Math.sin(performance.now() * 0.01) * 0.4 * U.clamp(v.speed / 8, 0, 1);
        p.armL.rotation.x = -0.8; p.armR.rotation.x = -0.8;
      }
    }
  }

  // pour l'invite d'interaction : véhicule le plus proche
  function getBike() {
    const p = GAME.Player.player;
    if (p.onBike) return null;
    const v = nearest(p.pos, 3.5);
    return v ? v.mesh : null;
  }
  function nearestType(playerPos) {
    const v = nearest(playerPos, 3.5);
    return v ? v.type : null;
  }

  return { build, toggle, update, getBike, nearestType, vehicles };
})();
