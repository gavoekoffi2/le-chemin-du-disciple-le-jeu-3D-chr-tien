/* LA VOIE — le vélo du disciple (véhicule libre, touche F) */
GAME.Bike = (function () {
  const U = GAME.U;
  let bike = null;
  const state = { speed: 0, yaw: 0, maxSpeed: 16, wheels: [] };

  function build(scene, world) {
    const g = new THREE.Group();
    const frameMat = GAME.mat(0xc0392b);
    const darkMat = GAME.mat(0x1a1a1a);

    const wheelGeo = new THREE.TorusGeometry(0.42, 0.07, 8, 18);
    // les roues tournent dans le plan de la marche (axe gauche-droite)
    const wf = new THREE.Mesh(wheelGeo, darkMat); wf.rotation.y = Math.PI / 2; wf.position.set(0, 0.42, 0.75); g.add(wf);
    const wb = new THREE.Mesh(wheelGeo, darkMat); wb.rotation.y = Math.PI / 2; wb.position.set(0, 0.42, -0.75); g.add(wb);
    // rayons visibles pour percevoir la rotation
    [wf, wb].forEach(w => {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.78, 0.03), GAME.mat(0x888888));
      w.add(spoke);
      const spoke2 = spoke.clone(); spoke2.rotation.z = Math.PI / 2; w.add(spoke2);
    });
    state.wheels = [wf, wb];

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

    g.position.set(8, 0, 120); // garé près du point de départ
    scene.add(g);
    bike = g;

    // interactable "monter sur le vélo"
    world.interactables.push({
      id: 'bike', tag: 'bike', pos: g.position, radius: 2.5,
      label: 'Monter sur le vélo (F)', passive: true
    });
  }

  function toggle(player) {
    if (!bike) return;
    if (player.onBike) {
      // descendre
      player.onBike = false;
      state.speed = 0;
      player.pos.x = bike.position.x + Math.cos(state.yaw) * 1.2;
      player.pos.z = bike.position.z - Math.sin(state.yaw) * 1.2;
      player.group.visible = true;
      GAME.UI.toast('Tu descends du vélo.');
    } else {
      const d = U.dist2D(bike.position.x, bike.position.z, player.pos.x, player.pos.z);
      if (d < 3.5) {
        player.onBike = true;
        state.yaw = player.yaw;
        GAME.UI.toast('🚲 Tu roules ! (Maj = sprint, F = descendre)');
      }
    }
  }

  function update(dt, keys, player) {
    if (!bike) return;
    let accel = 0, steer = 0;
    if (keys['KeyW'] || keys['KeyZ'] || keys['ArrowUp']) accel = 1;
    if (keys['KeyS'] || keys['ArrowDown']) accel = -0.6;
    if (keys['KeyA'] || keys['KeyQ'] || keys['ArrowLeft']) steer = 1;
    if (keys['KeyD'] || keys['ArrowRight']) steer = -1;
    const boost = (keys['ShiftLeft'] || keys['ShiftRight']) ? 1.4 : 1;

    state.speed = U.clamp(state.speed + accel * 14 * dt, -6, state.maxSpeed * boost);
    if (!accel) state.speed *= Math.pow(0.35, dt); // frottement
    state.yaw += steer * dt * 1.9 * U.clamp(Math.abs(state.speed) / 6, 0, 1) * Math.sign(state.speed || 1);

    const nx = bike.position.x + Math.sin(state.yaw) * state.speed * dt;
    const nz = bike.position.z + Math.cos(state.yaw) * state.speed * dt;

    // collision simple : on s'arrête contre les obstacles
    const r = 0.6;
    let blocked = false;
    for (const c of GAME.world.colliders) {
      const cx = U.clamp(nx, c.x1, c.x2), cz = U.clamp(nz, c.z1, c.z2);
      if ((nx - cx) ** 2 + (nz - cz) ** 2 < r * r) { blocked = true; break; }
    }
    if (!blocked) {
      const L = GAME.world.limit;
      bike.position.x = U.clamp(nx, -L, L);
      bike.position.z = U.clamp(nz, -L, L);
    } else {
      state.speed = -state.speed * 0.3;
    }
    bike.position.y = GAME.world.groundHeight(bike.position.x, bike.position.z);
    bike.rotation.y = state.yaw;
    bike.rotation.z = U.lerp(bike.rotation.z, -steer * 0.14 * U.clamp(state.speed / 10, 0, 1), 0.2);
    state.wheels.forEach(w => { w.rotation.z -= state.speed * dt * 2.4; });

    // le joueur "assis" sur le vélo
    player.pos.copy(bike.position);
    player.group.position.copy(bike.position);
    player.group.position.y += 0.55;
    player.group.rotation.y = state.yaw;
    player.group.visible = true;
    // pose assise : jambes pliées
    const p = player.ch.parts;
    p.legL.rotation.x = -1.2 + Math.sin(performance.now() * 0.01) * 0.4 * U.clamp(state.speed / 8, 0, 1);
    p.legR.rotation.x = -1.2 - Math.sin(performance.now() * 0.01) * 0.4 * U.clamp(state.speed / 8, 0, 1);
    p.armL.rotation.x = -0.8; p.armR.rotation.x = -0.8;
  }

  function getBike() { return bike; }

  return { build, toggle, update, getBike, state };
})();
