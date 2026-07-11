/* LA VOIE — PNJ : mentors, personnages de quête, passants */
GAME.NPCManager = (function () {
  const U = GAME.U;
  const npcs = {};        // id -> objet PNJ
  const walkers = [];     // passants ambiants
  let markerTex = null;

  function makeMarkerSprite(color, symbol) {
    const c = document.createElement('canvas');
    c.width = c.height = 96;
    const ctx = c.getContext('2d');
    ctx.font = 'bold 72px Georgia';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = color; ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    ctx.fillText(symbol, 48, 52);
    const tex = new THREE.CanvasTexture(c);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(1.4, 1.4, 1);
    return sp;
  }

  function spawnAll(scene, world) {
    const skins = [0xd9a679, 0xb07b4f, 0x8a5a34, 0xe8c098];
    for (const id in GAME.DATA.npcs) {
      const def = GAME.DATA.npcs[id];
      const ch = GAME.Character.create({
        shirt: def.color, pants: 0x2f3550 + (def.color & 0xffff) % 0x202020,
        skin: U.pick(skins), hair: U.pick([0x2a1a0a, 0x4a3a2a, 0x888888, 0x1a1a1a]),
        hasHalo: !!def.mentor
      });
      const y = world.groundHeight(def.pos[0], def.pos[1]);
      ch.group.position.set(def.pos[0], y, def.pos[1]);
      ch.group.rotation.y = Math.PI; // face au sud par défaut
      scene.add(ch.group);

      const npc = {
        id, def, ch, group: ch.group,
        pos: new THREE.Vector3(def.pos[0], y, def.pos[1]),
        marker: null, visible: true
      };
      // marqueur au-dessus des mentors
      if (def.mentor) {
        npc.marker = makeMarkerSprite('#ffd977', '✝');
        npc.marker.position.y = 2.6;
        ch.group.add(npc.marker);
      }
      npcs[id] = npc;
    }

    // passants ambiants
    const count = 22;
    for (let i = 0; i < count; i++) {
      const ch = GAME.Character.create({
        shirt: Math.floor(Math.random() * 0xffffff),
        pants: U.pick([0x2f3550, 0x3a3a3a, 0x5a4a3a, 0x2a4a3a]),
        skin: U.pick(skins), hair: U.pick([0x2a1a0a, 0x4a3a2a, 0x888888, 0xd8c060, 0x1a1a1a])
      });
      // les passants marchent sur les trottoirs (le long des rues)
      const roadC = U.pick([-180, -108, -36, 36, 108, 180]);
      const horiz = Math.random() < 0.5;
      const off = (Math.random() < 0.5 ? -7.2 : 7.2);
      const w = {
        ch, group: ch.group, horiz,
        c: roadC + off,
        t: U.rand(-220, 220),
        dir: Math.random() < 0.5 ? 1 : -1,
        speed: U.rand(1.2, 2.4),
        chatCd: 0
      };
      scene.add(ch.group);
      walkers.push(w);
    }
  }

  function updateVisibility() {
    const stage = GAME.state.stage;
    for (const id in npcs) {
      const npc = npcs[id], def = npc.def;
      let vis = true;
      if (def.hidden && !npc.forceVisible) vis = false;
      if (def.minStage !== undefined && stage < def.minStage) vis = false;
      if (def.maxStage !== undefined && stage > def.maxStage) vis = false;
      npc.visible = vis;
      npc.group.visible = vis;
    }
  }

  function update(dt, t, playerPos) {
    // PNJ fixes : respiration + se tournent vers le joueur s'il est proche
    for (const id in npcs) {
      const npc = npcs[id];
      if (!npc.visible) continue;
      GAME.Character.animate(npc.ch, t + npc.pos.x, 'idle');
      const d = npc.pos.distanceTo(playerPos);
      if (d < 8) {
        const target = Math.atan2(playerPos.x - npc.pos.x, playerPos.z - npc.pos.z);
        npc.group.rotation.y = U.lerpAngle(npc.group.rotation.y, target, 0.08);
      }
      if (npc.marker) npc.marker.position.y = 2.6 + Math.sin(t * 2.5) * 0.12;
    }
    // passants
    walkers.forEach(w => {
      w.t += w.dir * w.speed * dt;
      if (w.t > 230) { w.t = 230; w.dir = -1; }
      if (w.t < -230) { w.t = -230; w.dir = 1; }
      if (w.horiz) {
        w.group.position.set(w.t, 0, w.c);
        w.group.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        w.group.position.set(w.c, 0, w.t);
        w.group.rotation.y = w.dir > 0 ? 0 : Math.PI;
      }
      GAME.Character.animate(w.ch, t + w.c, 'walk');
    });
  }

  function get(id) { return npcs[id]; }
  function reveal(id) { if (npcs[id]) { npcs[id].forceVisible = true; updateVisibility(); } }
  function hide(id) { if (npcs[id]) { npcs[id].forceVisible = false; npcs[id].def.hidden = true; updateVisibility(); } }

  // passant le plus proche pouvant "papoter"
  function nearestWalker(playerPos, maxDist) {
    let best = null, bd = maxDist;
    walkers.forEach(w => {
      const d = U.dist2D(w.group.position.x, w.group.position.z, playerPos.x, playerPos.z);
      if (d < bd) { bd = d; best = w; }
    });
    return best;
  }

  return { spawnAll, update, updateVisibility, get, reveal, hide, npcs, walkers, nearestWalker };
})();
