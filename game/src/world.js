// The world: the whole game state, the wave director, collisions and scoring. The
// loop in main.js only reads input and calls step(); everything the game is lives here.
import { BAT, COMBO, FIELD, FLASH, HIT_INVULN_SECONDS, HIT_STOP_SECONDS, LIVES, MOTH, ORB, SCORE, TOTAL_WAVES, WAVE } from './config.js';
import { createGarden, stepGarden } from './garden.js';
import { createMoth, resetMoth, stepMoth } from './moth.js';
import { createBat, drawBat, KIND_CHASER, KIND_NIGHTJAR, KIND_SMALL, KIND_SPLITTER, KIND_WEAVER, stepBat } from './bats.js';
import { createCombo, createOrbs, notePickup, resetCombo, resetOrbs, stepCombo, stepOrbs } from './orbs.js';
import { addShake, burst, createParticles, floatText, resetParticles, ring, stepParticles } from './particles.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_VICTORY = 4;
export const EVENT_FLASH = 8;
export const EVENT_WAVE = 16;
export const EVENT_BOSS = 32;

export function createWorld(random) {
  const world = {
    random,
    garden: createGarden(random),
    moth: createMoth(),
    orbs: createOrbs(),
    combo: createCombo(),
    bats: [],
    particles: createParticles(),
    score: 0,
    best: 0,
    wave: 0,
    lives: LIVES,
    charge: 0,
    flashCooldown: 0,
    phase: 'breather',
    spawnQueue: [],
    spawnTimer: 0,
    breatherTimer: 0,
    banner: null,
    stats: { orbs: 0, batsFlashed: 0, timeSeconds: 0 },
    hitStop: 0,
    time: 0,
    stars: 0,
  };
  return world;
}

export function resetWorld(world) {
  world.garden = createGarden(world.random);
  resetMoth(world.moth);
  resetOrbs(world.orbs);
  resetCombo(world.combo);
  world.bats = [];
  resetParticles(world.particles);
  world.score = 0;
  world.wave = 0;
  world.lives = LIVES;
  world.charge = 0;
  world.flashCooldown = 0;
  world.phase = 'breather';
  world.spawnQueue = [];
  world.spawnTimer = 0;
  world.breatherTimer = WAVE.breatherSeconds;
  world.banner = null;
  world.stats = { orbs: 0, batsFlashed: 0, timeSeconds: 0 };
  world.hitStop = 0;
  world.time = 0;
  world.stars = 0;
}

function showBanner(world, text, sub) {
  world.banner = { text, sub: sub || '', timer: WAVE.bannerSeconds };
}

function edgeSpawn(world, kind) {
  const side = world.random.int(0, 3);
  let x;
  let y;
  if (side === 0) { x = -30; y = world.random.range(60, FIELD.height - 60); }
  else if (side === 1) { x = FIELD.width + 30; y = world.random.range(60, FIELD.height - 60); }
  else if (side === 2) { x = world.random.range(60, FIELD.width - 60); y = -30; }
  else { x = world.random.range(60, FIELD.width - 60); y = FIELD.height + 30; }
  return createBat(kind, x, y, world.wave, world.random);
}

function buildWaveQueue(world) {
  const n = world.wave;
  const queue = [];
  const count = WAVE.baseCount + WAVE.perWave * n;
  for (let i = 0; i < count; i += 1) {
    const roll = world.random.next();
    if (n >= 3 && roll < 0.22) queue.push(KIND_SPLITTER);
    else if (n >= 2 && roll < 0.55) queue.push(KIND_WEAVER);
    else queue.push(KIND_CHASER);
  }
  if (n === 5 || n === TOTAL_WAVES) queue.push(KIND_NIGHTJAR);
  // Shuffle, but keep the boss last so it arrives as the wave's climax.
  const boss = queue.filter((k) => k === KIND_NIGHTJAR);
  const rest = queue.filter((k) => k !== KIND_NIGHTJAR);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(world.random.next() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [...rest, ...boss];
}

export function startWave(world) {
  world.wave += 1;
  world.spawnQueue = buildWaveQueue(world);
  world.spawnTimer = 0;
  world.phase = 'spawning';
  if (world.wave === 5 || world.wave === TOTAL_WAVES) {
    showBanner(world, `WAVE ${world.wave}`, 'The Nightjar approaches…');
    return EVENT_BOSS;
  }
  showBanner(world, `WAVE ${world.wave}`, '');
  return EVENT_WAVE;
}

function doFlash(world) {
  const moth = world.moth;
  let flashed = 0;
  let gained = 0;
  const newborn = [];
  for (const bat of world.bats) {
    const dist = Math.hypot(bat.x - moth.x, bat.y - moth.y);
    if (dist > FLASH.radius + bat.radius) continue;
    if (bat.kind === KIND_NIGHTJAR) {
      bat.hp -= 1;
      burst(world.particles, bat.x, bat.y, '#ff5470', 18, 260);
      if (bat.hp <= 0) {
        bat.dead = true;
        flashed += 1;
        gained += BAT.nightjar.score;
        floatText(world.particles, bat.x, bat.y, `+${BAT.nightjar.score}`, '#ff5470');
      }
      continue;
    }
    bat.dead = true;
    flashed += 1;
    gained += BAT[bat.kind].score;
    burst(world.particles, bat.x, bat.y, '#b9c2e8', 10, 200);
    floatText(world.particles, bat.x, bat.y, `+${BAT[bat.kind].score}`, '#e8ecff');
    if (bat.kind === KIND_SPLITTER) {
      for (let i = 0; i < 2; i += 1) {
        const small = createBat(KIND_SMALL, bat.x + (i === 0 ? -14 : 14), bat.y, world.wave, world.random);
        newborn.push(small);
      }
    }
  }
  world.bats = world.bats.filter((b) => !b.dead);
  world.bats.push(...newborn);
  world.stats.batsFlashed += flashed;
  world.score += gained;
  moth.flashTimer = FLASH.invulnSeconds;
  moth.invuln = Math.max(moth.invuln, FLASH.invulnSeconds);
  moth.flashRing = 1;
  ring(world.particles, moth.x, moth.y, '#fff3c4', FLASH.radius);
  addShake(world.particles, 5);
  return flashed;
}

function hurtMoth(world) {
  world.lives -= 1;
  world.moth.invuln = HIT_INVULN_SECONDS;
  world.hitStop = HIT_STOP_SECONDS;
  addShake(world.particles, 12);
  burst(world.particles, world.moth.x, world.moth.y, '#ff7eb6', 22, 300);
  resetCombo(world.combo);
  if (world.lives <= 0) {
    world.moth.alive = false;
    return EVENT_OVER;
  }
  return EVENT_HIT;
}

/**
 * Advance the world one fixed step. `steer` is {x, y} from input, `flash` is a fresh
 * press. Returns a bitmask of EVENT_*.
 */
export function stepWorld(world, steer, flash, dt) {
  let events = 0;
  world.time += dt;
  world.stats.timeSeconds += dt;
  stepGarden(world.garden, dt);
  stepParticles(world.particles, dt);
  if (world.banner) {
    world.banner.timer -= dt;
    if (world.banner.timer <= 0) world.banner = null;
  }
  if (world.flashCooldown > 0) world.flashCooldown -= dt;
  if (world.hitStop > 0) {
    world.hitStop -= dt;
    return events;
  }

  stepMoth(world.moth, steer, dt);
  stepOrbs(world.orbs, world.random, dt);
  stepCombo(world.combo, dt);

  // Flash: only on a full charge.
  if (flash && world.charge >= FLASH.maxCharge && world.flashCooldown <= 0) {
    world.charge = 0;
    world.flashCooldown = FLASH.cooldownSeconds;
    doFlash(world);
    events |= EVENT_FLASH;
  }

  // Orb pickups.
  for (const orb of world.orbs.list) {
    if (orb.dead) continue;
    const dist = Math.hypot(orb.x - world.moth.x, orb.y - world.moth.y);
    if (dist < ORB.radius + MOTH.radius + 6) {
      orb.dead = true;
      notePickup(world.combo);
      const value = SCORE.orb * world.combo.mult;
      world.score += value;
      world.charge = Math.min(FLASH.maxCharge, world.charge + FLASH.chargePerOrb);
      world.stats.orbs += 1;
      burst(world.particles, orb.x, orb.y, '#ffe27a', 8, 160);
      floatText(world.particles, orb.x, orb.y, `+${value}`, '#ffe27a');
    }
  }
  world.orbs.list = world.orbs.list.filter((o) => !o.dead);

  // Wave director.
  if (world.phase === 'breather') {
    world.breatherTimer -= dt;
    if (world.breatherTimer <= 0) events |= startWave(world);
  } else {
    if (world.spawnQueue.length > 0) {
      world.spawnTimer += dt;
      if (world.spawnTimer >= 0.7 && world.bats.length < 14) {
        world.spawnTimer = 0;
        world.bats.push(edgeSpawn(world, world.spawnQueue.shift()));
      }
    } else if (world.bats.length === 0) {
      // Wave cleared.
      const bonus = SCORE.waveBonus * world.wave;
      world.score += bonus;
      floatText(world.particles, world.moth.x, world.moth.y - 40, `WAVE BONUS +${bonus}`, '#7ee8fa');
      if (world.wave >= TOTAL_WAVES) {
        world.stars = world.lives >= 3 ? 3 : world.lives === 2 ? 2 : 1;
        return events | EVENT_VICTORY;
      }
      world.phase = 'breather';
      world.breatherTimer = WAVE.breatherSeconds;
      showBanner(world, `WAVE ${world.wave} CLEAR`, `+${bonus} bonus — rest, moth`);
      events |= EVENT_WAVE;
    }
  }

  // Bats: move, boss births, collide.
  for (const bat of world.bats) {
    stepBat(bat, world.moth, dt);
    if (bat.kind === KIND_NIGHTJAR && bat.spawnTimer >= BAT.nightjar.spawnEvery && world.bats.length < 14) {
      bat.spawnTimer = 0;
      for (let i = 0; i < 2; i += 1) {
        world.bats.push(createBat(KIND_SMALL, bat.x + (i === 0 ? -30 : 30), bat.y + 20, world.wave, world.random));
      }
    }
  }
  if (world.moth.invuln <= 0) {
    for (const bat of world.bats) {
      const dist = Math.hypot(bat.x - world.moth.x, bat.y - world.moth.y);
      if (dist < bat.radius + MOTH.radius - 2) {
        events |= hurtMoth(world);
        break;
      }
    }
  }
  world.bats = world.bats.filter((b) => !b.dead && b.y > -80 && b.y < FIELD.height + 80 && b.x > -80 && b.x < FIELD.width + 80);
  return events;
}
