// GLOWMOTH — Night Garden: boot and the one loop. Input is read every frame, the
// world advances in fixed 1/60 s steps (several in a slow frame, none in a fast one),
// and the renderer paints what is there. The game moves between five screens: title,
// play, paused, game over and victory (dawn).
//
// ?seed=N fixes the garden and the waves. ?shot=title|play|boss|victory (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, FIELD, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BOSS, EVENT_FLASH, EVENT_HIT, EVENT_OVER, EVENT_VICTORY, EVENT_WAVE, resetWorld, stepWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_FLASH, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createAudio } from './audio.js';
import { drawGarden } from './garden.js';
import { drawMoth } from './moth.js';
import { drawBat } from './bats.js';
import { drawOrbs } from './orbs.js';
import { drawParticles, shakeOffset } from './particles.js';
import { drawBanner, drawGameOver, drawHud, drawPaused, drawTitle, drawVictory, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './hud.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
const world = createWorld(createRandom(seed));
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function draw(state, screen, best) {
  ctx.save();
  const shake = shakeOffset(state.particles);
  ctx.translate(shake.x, shake.y);
  drawGarden(ctx, state.garden);
  drawOrbs(ctx, state.orbs, state.time);
  for (const bat of state.bats) drawBat(ctx, bat);
  // On the victory screen the moth has flown into the dawn; it is not drawn.
  if (state.moth.alive && screen !== SCREEN_VICTORY) drawMoth(ctx, state.moth);
  drawParticles(ctx, state.particles);
  ctx.restore();
  if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
    drawHud(ctx, {
      score: state.score,
      best,
      wave: Math.max(1, state.wave),
      lives: state.lives,
      charge: state.charge,
      combo: state.combo,
    });
  }
  if (state.banner && screen === SCREEN_PLAY) {
    drawBanner(ctx, state.banner.text, state.banner.sub, 1 - state.banner.timer / 1.6);
  }
  if (screen === SCREEN_TITLE) drawTitle(ctx, best);
  if (screen === SCREEN_PAUSED) drawPaused(ctx);
  if (screen === SCREEN_OVER) {
    drawGameOver(ctx, {
      score: state.score,
      best,
      wave: Math.max(1, state.wave),
      orbs: state.stats.orbs,
      batsFlashed: state.stats.batsFlashed,
      timeSeconds: state.stats.timeSeconds,
    });
  }
  if (screen === SCREEN_VICTORY) {
    drawVictory(ctx, {
      score: state.score,
      best,
      wave: state.wave,
      orbs: state.stats.orbs,
      batsFlashed: state.stats.batsFlashed,
      timeSeconds: state.stats.timeSeconds,
    }, state.stars);
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    draw(world, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let lastOrbs = 0;

  function finishRun(victory) {
    if (world.score > best) {
      best = world.score;
      saveBest(best);
    }
    screen = victory ? SCREEN_VICTORY : SCREEN_OVER;
  }

  function startRun() {
    audio.unlock();
    resetWorld(world);
    world.best = best;
    screen = SCREEN_PLAY;
    lastOrbs = 0;
  }

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    if (input.wasPressed(ACTION_MUTE)) audio.setMuted(!audio.isMuted());
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_VICTORY) {
      if (input.wasPressed(ACTION_CONFIRM) || input.wasPressed(ACTION_FLASH)) startRun();
    } else if (screen === SCREEN_PLAY) {
      if (input.wasPressed(ACTION_PAUSE)) {
        screen = SCREEN_PAUSED;
      } else {
        accumulator += elapsed;
        while (accumulator >= STEP) {
          accumulator -= STEP;
          const steer = input.steer();
          const flash = input.wasPressed(ACTION_FLASH);
          const events = stepWorld(world, steer, flash, STEP);
          if (world.stats.orbs > lastOrbs) {
            lastOrbs = world.stats.orbs;
            audio.pickup(world.combo.mult);
          }
          if (events & EVENT_FLASH) audio.flash();
          if (events & EVENT_HIT) audio.hit();
          if (events & EVENT_WAVE) audio.wave();
          if (events & EVENT_BOSS) audio.boss();
          if (events & EVENT_OVER) {
            finishRun(false);
            audio.gameOver();
            break;
          }
          if (events & EVENT_VICTORY) {
            finishRun(true);
            audio.victory();
            break;
          }
        }
      }
    } else if (screen === SCREEN_PAUSED) {
      if (input.wasPressed(ACTION_PAUSE)) screen = SCREEN_PLAY;
      if (input.wasPressed(ACTION_CONFIRM)) startRun();
    }
    draw(world, screen, best);
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();

if (status) {
  status.textContent = shot
    ? `GLOWMOTH — screenshot scene "${shot}" (seed ${seed})`
    : 'GLOWMOTH — WASD/arrows to fly, Space to Flash, P to pause, M to mute.';
}
