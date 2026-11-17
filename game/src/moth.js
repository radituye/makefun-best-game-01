// The glowmoth: a soft glowing body with flapping wings, steered by acceleration with
// drag so it feels weighty, leaving a fading trail of light behind it.
import { FIELD, FLASH, MOTH } from './config.js';

export function createMoth() {
  return {
    x: FIELD.width / 2,
    y: FIELD.height / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    flap: 0,
    trail: [],
    flashTimer: 0,
    flashRing: 0,
    invuln: 0,
    alive: true,
  };
}

export function resetMoth(moth) {
  moth.x = FIELD.width / 2;
  moth.y = FIELD.height / 2 + 80;
  moth.vx = 0;
  moth.vy = 0;
  moth.angle = -Math.PI / 2;
  moth.trail = [];
  moth.flashTimer = 0;
  moth.flashRing = 0;
  moth.invuln = 0;
  moth.alive = true;
}

export function stepMoth(moth, steer, dt) {
  moth.vx += steer.x * MOTH.accel * dt;
  moth.vy += steer.y * MOTH.accel * dt;
  const drag = Math.max(0, 1 - MOTH.drag * dt);
  moth.vx *= drag;
  moth.vy *= drag;
  const speed = Math.hypot(moth.vx, moth.vy);
  if (speed > MOTH.maxSpeed) {
    moth.vx = (moth.vx / speed) * MOTH.maxSpeed;
    moth.vy = (moth.vy / speed) * MOTH.maxSpeed;
  }
  moth.x += moth.vx * dt;
  moth.y += moth.vy * dt;
  moth.x = Math.max(MOTH.radius, Math.min(FIELD.width - MOTH.radius, moth.x));
  moth.y = Math.max(MOTH.radius, Math.min(FIELD.height - MOTH.radius, moth.y));
  if (speed > 40) {
    const target = Math.atan2(moth.vy, moth.vx);
    let diff = target - moth.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    moth.angle += diff * Math.min(1, 12 * dt);
  }
  moth.flap += dt * (6 + speed / 55);
  if (moth.invuln > 0) moth.invuln -= dt;
  if (moth.flashTimer > 0) moth.flashTimer -= dt;
  if (moth.flashRing > 0) moth.flashRing = Math.max(0, moth.flashRing - dt * 2.2);
  moth.trail.unshift({ x: moth.x, y: moth.y });
  if (moth.trail.length > MOTH.trail) moth.trail.pop();
}

export function drawMoth(ctx, moth) {
  // Trail: fading gold dots.
  for (let i = moth.trail.length - 1; i >= 0; i -= 1) {
    const point = moth.trail[i];
    const f = 1 - i / moth.trail.length;
    ctx.globalAlpha = f * 0.35;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2 + f * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (moth.invuln > 0 && Math.floor(moth.invuln * 12) % 2 === 0) return;

  // Glow.
  const glow = ctx.createRadialGradient(moth.x, moth.y, 2, moth.x, moth.y, 46);
  glow.addColorStop(0, 'rgba(255, 224, 130, 0.85)');
  glow.addColorStop(1, 'rgba(255, 224, 130, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(moth.x - 46, moth.y - 46, 92, 92);

  ctx.save();
  ctx.translate(moth.x, moth.y);
  ctx.rotate(moth.angle + Math.PI / 2);
  // Wings, flapping.
  const flap = Math.sin(moth.flap) * 0.55;
  ctx.fillStyle = 'rgba(255, 214, 140, 0.92)';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * (0.35 + flap * 0.5));
    ctx.beginPath();
    ctx.ellipse(side * 13, -4, 13, 8, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(side * 10, 9, 9, 6, side * -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = '#5b3a1e';
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, -9, 4, 0, Math.PI * 2);
  ctx.fill();
  // Antennae.
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-2, -12);
  ctx.quadraticCurveTo(-7, -19, -9, -24);
  ctx.moveTo(2, -12);
  ctx.quadraticCurveTo(7, -19, 9, -24);
  ctx.stroke();
  ctx.restore();

  // Flash ring, expanding.
  if (moth.flashRing > 0) {
    const f = 1 - moth.flashRing;
    ctx.globalAlpha = (1 - f) * 0.9;
    ctx.strokeStyle = '#fff3c4';
    ctx.lineWidth = 5 * (1 - f) + 1;
    ctx.beginPath();
    ctx.arc(moth.x, moth.y, 20 + f * FLASH.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
