// The screenshot scenes behind ?shot=title|play|boss|victory. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a simple
// autopilot (flee nearby bats, chase the nearest orb, flash when the charge is full
// and a bat is in range), so the frame is what a real game looks like and the same
// seed always gives the same frame. The boss and victory scenes stage their moment
// directly from the real state (wave 5 with the Nightjar; the dawn screen over a
// live garden) instead of hoping a blind run reaches it.
import { FIELD, FLASH, STEP, TOTAL_WAVES } from './config.js';
import { EVENT_OVER, EVENT_VICTORY, resetWorld, startWave, stepWorld } from './world.js';
import { createBat, KIND_CHASER, KIND_NIGHTJAR, KIND_WEAVER } from './bats.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './hud.js';

const SAMPLE = STEP;

/** Steer the moth: flee close bats, chase the nearest orb, flash when it pays. */
function autopilot(world) {
  const moth = world.moth;
  let fx = 0;
  let fy = 0;
  for (const bat of world.bats) {
    const dx = moth.x - bat.x;
    const dy = moth.y - bat.y;
    const d = Math.hypot(dx, dy);
    if (d < 160) {
      const w = (160 - d) / 160;
      fx += (dx / (d || 1)) * w * 2.4;
      fy += (dy / (d || 1)) * w * 2.4;
    }
  }
  let tx = FIELD.width / 2;
  let ty = FIELD.height / 2;
  let bestD = Infinity;
  for (const orb of world.orbs.list) {
    const d = Math.hypot(orb.x - moth.x, orb.y - moth.y);
    if (d < bestD) {
      bestD = d;
      tx = orb.x;
      ty = orb.y;
    }
  }
  let sx = 0;
  let sy = 0;
  if (bestD < Infinity) {
    sx = (tx - moth.x) / (bestD || 1);
    sy = (ty - moth.y) / (bestD || 1);
  }
  let x = sx + fx;
  let y = sy + fy;
  if (moth.x < 100) x += 1;
  if (moth.x > FIELD.width - 100) x -= 1;
  if (moth.y < 100) y += 1;
  if (moth.y > FIELD.height - 100) y -= 1;
  const len = Math.hypot(x, y) || 1;
  const flash =
    world.charge >= FLASH.maxCharge &&
    world.bats.some((b) => Math.hypot(b.x - moth.x, b.y - moth.y) < FLASH.radius + b.radius);
  return { steer: { x: x / len, y: y / len }, flash };
}

function runSteps(world, seconds, until) {
  const steps = Math.floor(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    const pilot = autopilot(world);
    const events = stepWorld(world, pilot.steer, pilot.flash, SAMPLE);
    if (events & EVENT_OVER) return 'over';
    if (events & EVENT_VICTORY) return 'victory';
    if (until && until(world)) return 'until';
  }
  return 'time';
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the best
 * score to show.
 */
export function stageShot(name, world) {
  resetWorld(world);
  if (name === 'boss') {
    // Wave 5, the Nightjar already in the garden, moth charged and ready.
    world.wave = 5;
    world.phase = 'fighting';
    world.bats.push(createBat(KIND_NIGHTJAR, FIELD.width / 2, 150, 5, world.random));
    world.bats.push(createBat(KIND_CHASER, 200, 200, 5, world.random));
    world.bats.push(createBat(KIND_WEAVER, FIELD.width - 200, 420, 5, world.random));
    world.bats.push(createBat(KIND_CHASER, FIELD.width - 320, 140, 5, world.random));
    world.charge = FLASH.maxCharge;
    world.score = 1240;
    for (let i = 0; i < 6; i += 1) runSteps(world, 1.2);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'victory') {
    // The dawn screen over a live garden, with a finished run's stats.
    runSteps(world, 5);
    world.score = 2840;
    world.best = 2840;
    world.wave = TOTAL_WAVES;
    world.lives = 3;
    world.stars = 3;
    world.stats = { orbs: 96, batsFlashed: 41, timeSeconds: 312 };
    return { screen: SCREEN_VICTORY, best: 2840 };
  }
  if (name === 'play') {
    // Stage wave 3 directly: the wave is underway, bats on screen, orbs to chase.
    world.wave = 2;
    startWave(world);
    world.score = 480;
    world.charge = 60;
    runSteps(world, 10);
    const over = world.lives <= 0;
    return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: 0 };
  }
  // Title: five seconds of the garden waking, moth hovering.
  runSteps(world, 5);
  return { screen: SCREEN_TITLE, best: 0 };
}

export { startWave };
