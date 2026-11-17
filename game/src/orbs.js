// The light orbs (pollen): they drift, glow, and expire. Picking them up in quick
// succession raises the combo multiplier, and each one charges the Flash.
import { COMBO, FIELD, ORB } from './config.js';

export function createOrbs() {
  return { list: [], spawnTimer: 0 };
}

export function resetOrbs(orbs) {
  orbs.list = [];
  orbs.spawnTimer = 0;
}

export function stepOrbs(orbs, random, dt) {
  orbs.spawnTimer += dt;
  if (orbs.spawnTimer >= ORB.spawnEvery && orbs.list.length < ORB.maxOnField) {
    orbs.spawnTimer = 0;
    orbs.list.push({
      x: random.range(50, FIELD.width - 50),
      y: random.range(70, FIELD.height - 70),
      vx: random.range(-ORB.drift, ORB.drift),
      vy: random.range(-ORB.drift, ORB.drift),
      age: 0,
      phase: random.range(0, Math.PI * 2),
      dead: false,
    });
  }
  for (const orb of orbs.list) {
    orb.age += dt;
    orb.x += orb.vx * dt;
    orb.y += orb.vy * dt;
    if (orb.x < 24 || orb.x > FIELD.width - 24) orb.vx *= -1;
    if (orb.y < 50 || orb.y > FIELD.height - 24) orb.vy *= -1;
  }
  orbs.list = orbs.list.filter((orb) => !orb.dead && orb.age < ORB.lifeSeconds);
}

export function createCombo() {
  return { count: 0, timer: 0, mult: 1 };
}

export function resetCombo(combo) {
  combo.count = 0;
  combo.timer = 0;
  combo.mult = 1;
}

/** A pickup inside the combo window raises the multiplier; a gap resets it. */
export function notePickup(combo) {
  if (combo.timer > 0) combo.count += 1;
  else combo.count = 1;
  combo.timer = COMBO.windowSeconds;
  combo.mult = Math.min(COMBO.max, combo.count);
}

export function stepCombo(combo, dt) {
  if (combo.timer > 0) {
    combo.timer -= dt;
    if (combo.timer <= 0) {
      combo.count = 0;
      combo.mult = 1;
    }
  }
}

export function drawOrbs(ctx, orbs, time) {
  for (const orb of orbs.list) {
    const fading = orb.age > ORB.lifeSeconds - ORB.blinkSeconds;
    const blink = fading ? (Math.floor(orb.age * 6) % 2 === 0 ? 0.35 : 1) : 1;
    const pulse = 0.75 + 0.25 * Math.sin(time * 3 + orb.phase);
    ctx.globalAlpha = blink;
    const glow = ctx.createRadialGradient(orb.x, orb.y, 1, orb.x, orb.y, 30 * pulse);
    glow.addColorStop(0, 'rgba(255, 226, 122, 0.9)');
    glow.addColorStop(1, 'rgba(255, 226, 122, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(orb.x - 30, orb.y - 30, 60, 60);
    ctx.fillStyle = '#ffe27a';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, ORB.radius * 0.62 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffbe8';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, ORB.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
