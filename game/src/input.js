// Keyboard, mouse and touch, read as one input: WASD or arrows steer the moth, Space
// (or a click/tap) fires the Flash, P pauses, M mutes, Enter confirms a screen.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_FLASH = 'flash';

const KEYMAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: ACTION_FLASH,
  Enter: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyM: ACTION_MUTE,
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let pointer = null;
  let pointerDown = false;

  function onKeyDown(event) {
    const action = KEYMAP[event.code];
    if (!action) return;
    event.preventDefault();
    if (!event.repeat) pressed.add(action);
    held.add(action);
  }
  function onKeyUp(event) {
    const action = KEYMAP[event.code];
    if (action) held.delete(action);
  }
  function onPointerDown(event) {
    pointerDown = true;
    pressed.add(ACTION_FLASH);
    const rect = canvas.getBoundingClientRect();
    pointer = { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height) };
  }
  function onPointerUp() {
    pointerDown = false;
    pointer = null;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return {
    /** -1, 0 or 1 on each axis from the keys held down. */
    steer() {
      const x = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
      const y = (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0);
      return { x, y };
    },
    held(action) {
      return held.has(action);
    },
    /** True once per physical press; cleared by endFrame(). */
    wasPressed(action) {
      return pressed.has(action);
    },
    pointerActive() {
      return pointerDown;
    },
    pointer() {
      return pointer;
    },
    endFrame() {
      pressed.clear();
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    },
  };
}
