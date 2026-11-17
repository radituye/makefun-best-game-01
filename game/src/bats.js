// The shadow bats: three ordinary kinds with different flights, a small fast kind a
// splitter breaks into, and the Nightjar boss that swoops in arcs and births small bats.
import { BAT, FIELD } from './config.js';

export const KIND_CHASER = 'chaser';
export const KIND_WEAVER = 'weaver';
export const KIND_SPLITTER = 'splitter';
export const KIND_SMALL = 'small';
export const KIND_NIGHTJAR = 'nightjar';

export function createBat(kind, x, y, wave, random) {
  const spec = BAT[kind];
  const speed = spec.speed + (spec.speedPerWave || 0) * (wave - 1);
  return {
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: spec.radius,
    speed,
    hp: kind === KIND_NIGHTJAR ? BAT.nightjar.hp : 1,
    age: random.range(0, Math.PI * 2),
    seed: random.range(0, Math.PI * 2),
    flap: random.range(0, Math.PI * 2),
    spawnTimer: 0,
    angle: 0,
    dead: false,
  };
}

function steerToward(bat, tx, ty, dt) {
  const dx = tx - bat.x;
  const dy = ty - bat.y;
  const len = Math.hypot(dx, dy) || 1;
  bat.vx += (dx / len) * bat.speed * 2.4 * dt;
  bat.vy += (dy / len) * bat.speed * 2.4 * dt;
  const v = Math.hypot(bat.vx, bat.vy);
  const cap = bat.speed * 1.15;
  if (v > cap) {
    bat.vx = (bat.vx / v) * cap;
    bat.vy = (bat.vy / v) * cap;
  }
}

export function stepBat(bat, moth, dt) {
  bat.age += dt;
  bat.flap += dt * 9;
  if (bat.kind === KIND_CHASER) {
    steerToward(bat, moth.x, moth.y, dt);
  } else if (bat.kind === KIND_WEAVER) {
    const dir = bat.seed > Math.PI ? 1 : -1;
    bat.vx = dir * bat.speed;
    bat.vy = Math.sin(bat.age * BAT.weaver.sineFreq + bat.seed) * BAT.weaver.sineAmp * 1.6;
    if (bat.x < -30) bat.x = FIELD.width + 30;
    if (bat.x > FIELD.width + 30) bat.x = -30;
  } else if (bat.kind === KIND_SPLITTER || bat.kind === KIND_SMALL) {
    steerToward(bat, moth.x, moth.y, dt);
  } else if (bat.kind === KIND_NIGHTJAR) {
    // Swooping arcs: circle the moth, then dive.
    const phase = bat.age % 5;
    if (phase < 3.2) {
      const cx = moth.x + Math.cos(bat.age * 0.9) * 260;
      const cy = moth.y + Math.sin(bat.age * 0.9) * 150 - 60;
      steerToward(bat, cx, cy, dt);
    } else {
      steerToward(bat, moth.x, moth.y, dt * 2.2);
    }
    bat.spawnTimer += dt;
  }
  bat.x += bat.vx * dt;
  bat.y += bat.vy * dt;
  bat.x = Math.max(-60, Math.min(FIELD.width + 60, bat.x));
  bat.y = Math.max(-60, Math.min(FIELD.height + 60, bat.y));
  bat.angle = Math.atan2(bat.vy, bat.vx);
}

export function drawBat(ctx, bat) {
  ctx.save();
  ctx.translate(bat.x, bat.y);
  const flap = Math.sin(bat.flap) * 0.6;
  const wingSpan = bat.radius * 1.9;
  // Dark wings.
  ctx.fillStyle = 'rgba(16, 12, 32, 0.95)';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * (0.5 + flap * 0.45));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(side * wingSpan * 0.5, -bat.radius * 0.9, side * wingSpan, -bat.radius * 0.2);
    ctx.quadraticCurveTo(side * wingSpan * 0.55, bat.radius * 0.35, 0, bat.radius * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = '#1a1430';
  ctx.beginPath();
  ctx.ellipse(0, 0, bat.radius * 0.55, bat.radius * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  // Glowing eyes.
  const eyeColour = bat.kind === KIND_NIGHTJAR ? '#ff5470' : '#ff5e78';
  ctx.fillStyle = eyeColour;
  ctx.beginPath();
  ctx.arc(-bat.radius * 0.22, -bat.radius * 0.18, bat.radius * 0.13, 0, Math.PI * 2);
  ctx.arc(bat.radius * 0.22, -bat.radius * 0.18, bat.radius * 0.13, 0, Math.PI * 2);
  ctx.fill();
  if (bat.kind === KIND_NIGHTJAR) {
    // Crown of thorns and a health ring.
    ctx.strokeStyle = '#ff5470';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + (i - 2) * 0.35;
      ctx.moveTo(Math.cos(a) * bat.radius * 0.5, Math.sin(a) * bat.radius * 0.5 - bat.radius * 0.3);
      ctx.lineTo(Math.cos(a) * bat.radius * 0.85, Math.sin(a) * bat.radius * 0.85 - bat.radius * 0.55);
    }
    ctx.stroke();
  }
  ctx.restore();
}
