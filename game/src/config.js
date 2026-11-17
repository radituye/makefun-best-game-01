// GLOWMOTH — Night Garden: every number the game tunes lives here, so a balance
// change is one edit and the rules stay readable in one place.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'glowmoth-best';
export const TOTAL_WAVES = 10;

export const MOTH = {
  radius: 14,
  accel: 2600,
  maxSpeed: 430,
  drag: 3.2,
  trail: 26,
};

export const FLASH = {
  radius: 200,
  chargePerOrb: 20,
  maxCharge: 100,
  invulnSeconds: 1.2,
  cooldownSeconds: 0.35,
};

export const ORB = {
  radius: 11,
  value: 10,
  spawnEvery: 0.75,
  maxOnField: 7,
  lifeSeconds: 9,
  blinkSeconds: 2,
  drift: 26,
};

export const COMBO = {
  windowSeconds: 1.4,
  max: 8,
};

export const LIVES = 3;
export const HIT_INVULN_SECONDS = 2.0;
export const HIT_STOP_SECONDS = 0.09;

export const BAT = {
  chaser: { radius: 16, speed: 150, speedPerWave: 7, score: 25 },
  weaver: { radius: 14, speed: 195, speedPerWave: 6, sineAmp: 95, sineFreq: 2.6, score: 25 },
  splitter: { radius: 21, speed: 125, speedPerWave: 5, score: 25 },
  small: { radius: 9, speed: 265, speedPerWave: 8, score: 15 },
  nightjar: { radius: 48, speed: 170, hp: 3, spawnEvery: 4.0, score: 500 },
};

export const WAVE = {
  baseCount: 3,
  perWave: 2,
  clearBonus: 100,
  breatherSeconds: 3.0,
  bannerSeconds: 1.6,
};

export const SCORE = {
  orb: 10,
  waveBonus: 100,
};

export const SHOT_SCENES = ['title', 'play', 'boss', 'victory'];
