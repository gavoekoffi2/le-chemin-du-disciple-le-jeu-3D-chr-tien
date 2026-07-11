// ==== Entrées clavier/souris (event.code → compatible AZERTY & QWERTY) ====
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.canvas = canvas;
    this.yaw = 0;          // rotation caméra horizontale
    this.pitch = 0.35;     // rotation verticale
    this.pointerLocked = false;
    this.pressed = new Set();  // touches "just pressed" cette frame

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('click', () => {
      if (!this.pointerLocked && this.enabled) canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === canvas;
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked) return;
      this.yaw -= e.movementX * 0.0026;
      this.pitch += e.movementY * 0.0022;
      this.pitch = Math.max(-0.3, Math.min(1.2, this.pitch));
    });
    this.enabled = false;
  }

  get forward() { return this.keys.has('KeyW') || this.keys.has('ArrowUp'); }
  get back()    { return this.keys.has('KeyS') || this.keys.has('ArrowDown'); }
  get left()    { return this.keys.has('KeyA') || this.keys.has('ArrowLeft'); }
  get right()   { return this.keys.has('KeyD') || this.keys.has('ArrowRight'); }
  get run()     { return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'); }
  get jump()    { return this.keys.has('Space'); }

  justPressed(code) { return this.pressed.has(code); }
  endFrame() { this.pressed.clear(); }

  releasePointer() {
    if (this.pointerLocked) document.exitPointerLock();
  }
}
