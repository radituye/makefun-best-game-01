// The night garden the game plays in: a parallax star field, a low moon, swaying
// glowflowers and drifting fireflies. Everything is drawn in code from a seed, so the
// garden is the same every run and costs no assets.
import { FIELD } from './config.js';

const FLOWER_COLOURS = ['#ffd166', '#ff7eb6', '#7ee8fa', '#c77dff', '#ff9e5e'];

export function createGarden(random) {
  const stars = [];
  for (let i = 0; i < 130; i += 1) {
    stars.push({
      x: random.range(0, FIELD.width),
      y: random.range(0, FIELD.height * 0.62),
      r: random.range(0.6, 2.1),
      depth: random.range(0.15, 1),
      twinkle: random.range(0, Math.PI * 2),
    });
  }
  const flowers = [];
  for (let i = 0; i < 26; i += 1) {
    flowers.push({
      x: random.range(40, FIELD.width - 40),
      y: random.range(FIELD.height * 0.55, FIELD.height - 24),
      stem: random.range(26, 62),
      petals: random.int(5, 7),
      colour: random.pick(FLOWER_COLOURS),
      phase: random.range(0, Math.PI * 2),
      glow: random.range(0.5, 1),
    });
  }
  const fireflies = [];
  for (let i = 0; i < 16; i += 1) {
    fireflies.push({
      x: random.range(0, FIELD.width),
      y: random.range(60, FIELD.height - 60),
      vx: random.range(-12, 12),
      vy: random.range(-9, 9),
      phase: random.range(0, Math.PI * 2),
    });
  }
  return { stars, flowers, fireflies, time: 0 };
}

export function stepGarden(garden, dt) {
  garden.time += dt;
  for (const fly of garden.fireflies) {
    fly.x += fly.vx * dt;
    fly.y += fly.vy * dt;
    if (fly.x < 0 || fly.x > FIELD.width) fly.vx *= -1;
    if (fly.y < 40 || fly.y > FIELD.height - 20) fly.vy *= -1;
  }
}

export function drawGarden(ctx, garden) {
  const t = garden.time;
  // Sky: deep indigo to a violet horizon.
  const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  sky.addColorStop(0, '#070b24');
  sky.addColorStop(0.55, '#141a3d');
  sky.addColorStop(1, '#241b3f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  // Moon, low and hazy.
  const moonX = FIELD.width - 190;
  const moonY = 108;
  const halo = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 120);
  halo.addColorStop(0, 'rgba(255, 244, 200, 0.55)');
  halo.addColorStop(1, 'rgba(255, 244, 200, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(moonX - 120, moonY - 120, 240, 240);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(214, 196, 140, 0.5)';
  ctx.beginPath();
  ctx.arc(moonX - 12, moonY - 8, 9, 0, Math.PI * 2);
  ctx.arc(moonX + 14, moonY + 12, 6, 0, Math.PI * 2);
  ctx.fill();

  // Stars, twinkling.
  for (const star of garden.stars) {
    const alpha = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.4 + star.twinkle));
    ctx.globalAlpha = alpha * star.depth;
    ctx.fillStyle = '#e8ecff';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Ground: a dark hill the flowers grow from.
  ctx.fillStyle = '#0d1226';
  ctx.beginPath();
  ctx.moveTo(0, FIELD.height);
  ctx.lineTo(0, FIELD.height - 74);
  ctx.quadraticCurveTo(FIELD.width * 0.3, FIELD.height - 118, FIELD.width * 0.55, FIELD.height - 82);
  ctx.quadraticCurveTo(FIELD.width * 0.8, FIELD.height - 52, FIELD.width, FIELD.height - 88);
  ctx.lineTo(FIELD.width, FIELD.height);
  ctx.closePath();
  ctx.fill();

  // Glowflowers, swaying.
  for (const flower of garden.flowers) {
    const sway = Math.sin(t * 0.9 + flower.phase) * 5;
    const topX = flower.x + sway;
    const topY = flower.y - flower.stem;
    ctx.strokeStyle = 'rgba(46, 160, 90, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(flower.x, flower.y);
    ctx.quadraticCurveTo(flower.x + sway * 0.4, flower.y - flower.stem * 0.55, topX, topY);
    ctx.stroke();
    const glow = ctx.createRadialGradient(topX, topY, 1, topX, topY, 22 * flower.glow);
    glow.addColorStop(0, flower.colour);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 1.6 + flower.phase);
    ctx.fillStyle = glow;
    ctx.fillRect(topX - 22, topY - 22, 44, 44);
    ctx.globalAlpha = 1;
    ctx.fillStyle = flower.colour;
    for (let p = 0; p < flower.petals; p += 1) {
      const a = (p / flower.petals) * Math.PI * 2 + flower.phase * 0.2;
      ctx.beginPath();
      ctx.ellipse(topX + Math.cos(a) * 8, topY + Math.sin(a) * 8, 6, 3.4, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff7d6';
    ctx.beginPath();
    ctx.arc(topX, topY, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fireflies.
  for (const fly of garden.fireflies) {
    const glow = 0.5 + 0.5 * Math.sin(t * 2.2 + fly.phase);
    ctx.globalAlpha = 0.25 + 0.55 * glow;
    ctx.fillStyle = '#ffe27a';
    ctx.beginPath();
    ctx.arc(fly.x, fly.y, 2.6 + glow * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
