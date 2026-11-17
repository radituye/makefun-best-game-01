// The HUD and the screens: title, pause, game over and victory. The game itself is
// drawn by the other modules; this one draws everything that talks to the player.
import { FIELD, FLASH, TOTAL_WAVES } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(7, 11, 36, 0.82)';
  ctx.strokeStyle = 'rgba(255, 210, 102, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();
}

function titleText(ctx, text, y, size, colour) {
  ctx.fillStyle = colour;
  ctx.font = `bold ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, FIELD.width / 2, y);
}

function bodyText(ctx, text, y, size, colour) {
  ctx.fillStyle = colour;
  ctx.font = `${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, FIELD.width / 2, y);
}

function statLine(ctx, label, value, y) {
  ctx.textAlign = 'right';
  ctx.fillStyle = '#b9c2e8';
  ctx.font = '20px "Trebuchet MS", sans-serif';
  ctx.fillText(label, FIELD.width / 2 - 12, y);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffe27a';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  ctx.fillText(String(value), FIELD.width / 2 + 12, y);
}

export function drawHud(ctx, view) {
  const { score, best, wave, lives, charge, combo } = view;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffe27a';
  ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
  ctx.fillText(`SCORE ${score}`, 22, 44);
  ctx.fillStyle = '#b9c2e8';
  ctx.font = '18px "Trebuchet MS", sans-serif';
  ctx.fillText(`BEST ${best}`, 24, 70);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8ecff';
  ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
  ctx.fillText(`WAVE ${wave} / ${TOTAL_WAVES}`, FIELD.width / 2, 44);

  // Petals (lives), top right.
  for (let i = 0; i < 3; i += 1) {
    const x = FIELD.width - 34 - i * 36;
    const y = 34;
    ctx.fillStyle = i < lives ? '#ff7eb6' : 'rgba(255, 126, 182, 0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y, 11, 7, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y, 11, 7, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flash charge bar, bottom left.
  const bw = 210;
  const bx = 22;
  const by = FIELD.height - 34;
  ctx.fillStyle = 'rgba(7, 11, 36, 0.7)';
  ctx.beginPath();
  ctx.roundRect(bx - 4, by - 4, bw + 8, 22, 10);
  ctx.fill();
  const frac = charge / FLASH.maxCharge;
  const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  grad.addColorStop(0, '#ffd166');
  grad.addColorStop(1, '#fff3c4');
  ctx.fillStyle = grad;
  if (frac > 0.01) {
    ctx.beginPath();
    ctx.roundRect(bx, by, bw * frac, 14, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#e8ecff';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(charge >= FLASH.maxCharge ? 'FLASH READY — SPACE' : 'FLASH', bx + 2, by - 10);

  // Combo, bottom right.
  if (combo.mult > 1) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#7ee8fa';
    ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
    ctx.fillText(`COMBO x${combo.mult}`, FIELD.width - 22, FIELD.height - 22);
  }
}

export function drawBanner(ctx, text, sub, frac) {
  const alpha = frac < 0.15 ? frac / 0.15 : frac > 0.8 ? (1 - frac) / 0.2 : 1;
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  titleText(ctx, text, 250, 54, '#ffe27a');
  if (sub) bodyText(ctx, sub, 292, 22, '#e8ecff');
  ctx.globalAlpha = 1;
}

export function drawTitle(ctx, best) {
  ctx.fillStyle = 'rgba(7, 11, 36, 0.45)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  titleText(ctx, 'GLOWMOTH', 218, 96, '#ffe27a');
  bodyText(ctx, '— Night Garden —', 262, 26, '#7ee8fa');
  bodyText(ctx, 'A glowmoth gathers the last light of the night.', 312, 22, '#e8ecff');
  bodyText(ctx, 'Dodge the shadow bats. Drink the pollen. Flash when the dark closes in.', 342, 22, '#e8ecff');
  bodyText(ctx, 'Survive 10 waves and see the dawn.', 372, 22, '#e8ecff');
  panel(ctx, FIELD.width / 2 - 260, 408, 520, 132);
  bodyText(ctx, 'WASD / Arrows — fly', 448, 21, '#e8ecff');
  bodyText(ctx, 'SPACE / Click — Flash (clears bats, needs a full charge)', 480, 21, '#e8ecff');
  bodyText(ctx, 'P — pause · M — mute', 512, 21, '#b9c2e8');
  if (best > 0) bodyText(ctx, `Best score: ${best}`, 580, 22, '#ffd166');
  bodyText(ctx, 'Press Enter or click to fly', 630, 24, '#ffe27a');
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(7, 11, 36, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  titleText(ctx, 'PAUSED', 330, 64, '#ffe27a');
  bodyText(ctx, 'The garden waits. Press P to keep flying.', 388, 22, '#e8ecff');
}

function drawStats(ctx, stats, startY) {
  statLine(ctx, 'Score', stats.score, startY);
  statLine(ctx, 'Best', stats.best, startY + 34);
  statLine(ctx, 'Wave reached', stats.wave, startY + 68);
  statLine(ctx, 'Pollen gathered', stats.orbs, startY + 102);
  statLine(ctx, 'Bats flashed', stats.batsFlashed, startY + 136);
  statLine(ctx, 'Time', `${Math.floor(stats.timeSeconds / 60)}:${String(Math.floor(stats.timeSeconds % 60)).padStart(2, '0')}`, startY + 170);
}

export function drawGameOver(ctx, stats) {
  ctx.fillStyle = 'rgba(7, 11, 36, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  titleText(ctx, 'THE NIGHT TAKES THE MOTH', 190, 52, '#ff7eb6');
  bodyText(ctx, 'The garden goes dark — but the light you gathered stays.', 240, 22, '#e8ecff');
  drawStats(ctx, stats, 310);
  bodyText(ctx, 'Press Enter or click to fly again', 560, 24, '#ffe27a');
}

export function drawVictory(ctx, stats, stars) {
  // Dawn sky washing over the panel.
  const dawn = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  dawn.addColorStop(0, 'rgba(255, 183, 94, 0.28)');
  dawn.addColorStop(0.5, 'rgba(255, 126, 182, 0.16)');
  dawn.addColorStop(1, 'rgba(7, 11, 36, 0)');
  ctx.fillStyle = dawn;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  titleText(ctx, 'DAWN BREAKS', 150, 64, '#ffe27a');
  bodyText(ctx, 'Ten waves survived — the first sun finds the garden.', 200, 22, '#e8ecff');
  // Stars.
  for (let i = 0; i < 3; i += 1) {
    const x = FIELD.width / 2 + (i - 1) * 78;
    const y = 262;
    const lit = i < stars;
    ctx.fillStyle = lit ? '#ffd166' : 'rgba(255, 209, 102, 0.18)';
    ctx.beginPath();
    for (let p = 0; p < 10; p += 1) {
      const r = p % 2 === 0 ? 30 : 13;
      const a = -Math.PI / 2 + (p * Math.PI) / 5;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  drawStats(ctx, stats, 330);
  bodyText(ctx, 'Press Enter or click to fly again', 580, 24, '#ffe27a');
}
