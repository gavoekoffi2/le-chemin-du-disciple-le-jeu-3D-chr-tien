/* LA VOIE — joueur : contrôles, caméra 3e personne, collisions, interactions */
GAME.Player = (function () {
  const U = GAME.U;

  const player = {
    ch: null, group: null,
    pos: new THREE.Vector3(0, 0, 130),
    vel: new THREE.Vector3(),
    yaw: Math.PI,            // orientation du personnage
    camYaw: Math.PI, camPitch: 0.32, camDist: 7.5,
    onGround: true,
    speedWalk: 5.2, speedRun: 9.5,
    state: 'idle',
    onBike: false,
    stepCd: 0,
    frozen: false            // dialogues / menus
  };

  const keys = {};
  let mouseDown = false, lastMX = 0, lastMY = 0;

  function init(scene, camera, canvas) {
    // personnage de secours immédiat (remplacé dès que le modèle réaliste est prêt)
    player.ch = GAME.Character.create({ shirt: 0x3a6ea5, pants: 0x2f3550, skin: 0xd9a679, hair: 0x2a1a0a });
    player.group = player.ch.group;
    scene.add(player.group);
    player.camera = camera;

    // ré-application de l'armure sauvegardée
    (GAME.state.armor || []).forEach(id => GAME.Character.addArmorPiece(player.ch, id));

    // modèle humain réaliste riggé (asynchrone : décodage + parse du GLB embarqué)
    GAME.Character.loadRealPlayer(real => {
      if (!real) return; // en cas d'échec, on garde le personnage stylisé
      scene.remove(player.group);
      player.ch = real;
      player.group = real.group;
      player.group.position.copy(player.pos);
      player.group.rotation.y = player.yaw;
      scene.add(player.group);
      (GAME.state.armor || []).forEach(id => GAME.Character.addArmorPiece(player.ch, id));
    });

    const p = GAME.state.pos;
    player.pos.set(p[0], p[1], p[2]);

    window.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

    canvas.addEventListener('mousedown', e => { mouseDown = true; lastMX = e.clientX; lastMY = e.clientY; });
    window.addEventListener('mouseup', () => { mouseDown = false; });
    window.addEventListener('mousemove', e => {
      if (!mouseDown) return;
      const dx = e.clientX - lastMX, dy = e.clientY - lastMY;
      lastMX = e.clientX; lastMY = e.clientY;
      player.camYaw -= dx * 0.0075;
      player.camPitch = U.clamp(player.camPitch + dy * 0.006, -0.15, 1.15);
    });
    canvas.addEventListener('wheel', e => {
      player.camDist = U.clamp(player.camDist + e.deltaY * 0.01, 4, 16);
      e.preventDefault();
    }, { passive: false });

    // tactile : joystick virtuel simplifié (déplacement au toucher gauche, caméra au droit)
    setupTouch(canvas);
  }

  function setupTouch(canvas) {
    let moveTouch = null, camTouch = null, camLX = 0, camLY = 0;
    player.touchMove = { x: 0, y: 0 };
    canvas.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) {
        if (t.clientX < window.innerWidth / 2 && moveTouch === null) {
          moveTouch = { id: t.identifier, sx: t.clientX, sy: t.clientY };
        } else if (camTouch === null) {
          camTouch = t.identifier; camLX = t.clientX; camLY = t.clientY;
        }
      }
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (moveTouch && t.identifier === moveTouch.id) {
          player.touchMove.x = U.clamp((t.clientX - moveTouch.sx) / 50, -1, 1);
          player.touchMove.y = U.clamp((t.clientY - moveTouch.sy) / 50, -1, 1);
        } else if (t.identifier === camTouch) {
          player.camYaw -= (t.clientX - camLX) * 0.008;
          player.camPitch = U.clamp(player.camPitch + (t.clientY - camLY) * 0.006, -0.15, 1.15);
          camLX = t.clientX; camLY = t.clientY;
        }
      }
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (moveTouch && t.identifier === moveTouch.id) { moveTouch = null; player.touchMove.x = player.touchMove.y = 0; }
        if (t.identifier === camTouch) camTouch = null;
      }
    });
  }

  function inputAxis() {
    let x = 0, y = 0;
    if (keys['KeyW'] || keys['KeyZ'] || keys['ArrowUp']) y -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) y += 1;
    if (keys['KeyA'] || keys['KeyQ'] || keys['ArrowLeft']) x -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) x += 1;
    if (player.touchMove) { x += player.touchMove.x; y += player.touchMove.y; }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  // collision : cercle joueur (r=0.45) contre AABB de la ville
  function collide(nx, nz) {
    const r = 0.45;
    const cols = GAME.world.colliders;
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      const cx = U.clamp(nx, c.x1, c.x2);
      const cz = U.clamp(nz, c.z1, c.z2);
      const dx = nx - cx, dz = nz - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-6) {
          const d = Math.sqrt(d2);
          nx = cx + dx / d * r;
          nz = cz + dz / d * r;
        } else {
          // au centre : repousse vers l'extérieur le plus proche
          const pushL = Math.abs(nx - c.x1), pushR = Math.abs(c.x2 - nx);
          const pushT = Math.abs(nz - c.z1), pushB = Math.abs(c.z2 - nz);
          const m = Math.min(pushL, pushR, pushT, pushB);
          if (m === pushL) nx = c.x1 - r; else if (m === pushR) nx = c.x2 + r;
          else if (m === pushT) nz = c.z1 - r; else nz = c.z2 + r;
        }
      }
    }
    const L = GAME.world.limit;
    nx = U.clamp(nx, -L, L);
    nz = U.clamp(nz, -L, L);
    return { x: nx, z: nz };
  }

  function update(dt, t) {
    const cam = player.camera;
    if (player.onBike) { GAME.Bike.update(dt, keys, player, t); positionCamera(dt); return; }

    const ax = inputAxis();
    const moving = (Math.abs(ax.x) > 0.05 || Math.abs(ax.y) > 0.05) && !player.frozen;
    const running = moving && (keys['ShiftLeft'] || keys['ShiftRight']);

    let speed = running ? player.speedRun : player.speedWalk;
    if (GAME.state.armor.includes('ceinture')) speed *= 1.05;
    if (running && GAME.state.armor.includes('chaussures')) speed *= 1.10;

    if (moving) {
      // direction relative à la caméra
      const dirAngle = Math.atan2(ax.x, ax.y) + player.camYaw + Math.PI;
      const vx = Math.sin(dirAngle) * speed;
      const vz = Math.cos(dirAngle) * speed;
      const res = collide(player.pos.x + vx * dt, player.pos.z + vz * dt);
      player.pos.x = res.x; player.pos.z = res.z;
      player.yaw = U.lerpAngle(player.yaw, dirAngle, 0.18);
      // bruit de pas
      player.stepCd -= dt;
      if (player.onGround && player.stepCd <= 0) {
        GAME.audio.step();
        player.stepCd = running ? 0.26 : 0.42;
      }
    }

    // saut & gravité (par rapport au relief)
    const groundY = GAME.world.groundHeight(player.pos.x, player.pos.z);
    if ((keys['Space']) && player.onGround && !player.frozen) {
      player.vel.y = 7.2;
      player.onGround = false;
    }
    if (!player.onGround) {
      player.vel.y -= 22 * dt;
      player.pos.y += player.vel.y * dt;
      if (player.pos.y <= groundY) { player.pos.y = groundY; player.vel.y = 0; player.onGround = true; }
    } else {
      // suit le relief en douceur
      player.pos.y = U.lerp(player.pos.y, groundY, Math.min(1, dt * 14));
      if (player.pos.y < groundY - 0.5) player.pos.y = groundY;
    }

    // état d'animation
    player.state = !player.onGround ? 'jump' : (moving ? (running ? 'run' : 'walk') : 'idle');
    GAME.Character.animate(player.ch, t, player.state);

    player.group.position.copy(player.pos);
    player.group.rotation.y = player.yaw;

    positionCamera(dt);
  }

  const camTarget = new THREE.Vector3();
  const camDesired = new THREE.Vector3();
  const camSmoothed = new THREE.Vector3();
  let camInit = false;
  function positionCamera(dt) {
    const cam = player.camera;
    const d = player.camDist;
    const cy = player.camYaw, cp = player.camPitch;
    const px = player.pos.x - Math.sin(cy) * Math.cos(cp) * d;
    const pz = player.pos.z - Math.cos(cy) * Math.cos(cp) * d;
    let py = player.pos.y + 1.6 + Math.sin(cp) * d;
    // la caméra ne passe pas sous le sol
    const gy = GAME.world.groundHeight(px, pz);
    if (py < gy + 0.6) py = gy + 0.6;
    camDesired.set(px, py, pz);
    // amortissement doux (et rattrapage instantané après une téléportation)
    if (!camInit || camSmoothed.distanceTo(camDesired) > 30) {
      camSmoothed.copy(camDesired);
      camInit = true;
    } else {
      const k = 1 - Math.exp(-(dt || 0.016) * 12);
      camSmoothed.lerp(camDesired, k);
    }
    cam.position.copy(camSmoothed);
    camTarget.set(player.pos.x, player.pos.y + 1.5, player.pos.z);
    cam.lookAt(camTarget);
  }

  function teleport(x, z) {
    player.pos.set(x, GAME.world.groundHeight(x, z), z);
  }

  return { player, init, update, teleport, keys };
})();
