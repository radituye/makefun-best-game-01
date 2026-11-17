// Juice: sparks, expanding rings, poofs, floating score text and the screen shake.
// Nothing here changes the rules; it only makes the rules feel good.
export function createParticles() {
  return { sparks: [], rings: [], texts: [], shake: 0 };
}

export function resetParticles(particles) {
  particles.sparks = [];
  particles.rings = [];
  particles.texts = [];
  particles.shake = 0;
}

export function burst(particles, x, y, colour, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
    const v = speed * (0.4 + Math.random() * 0.8);
    particles.sparks.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life: 0.5 + Math.random() * 0.4,
      age: 0,
      size: 2 + Math.random() * 3.5,
      colour,
    });
  }
}

export function ring(particles, x, y, colour, maxRadius) {
  particles.rings.push({ x, y, colour, maxRadius, age: 0, life: 0.55 });
}

export function floatText(particles, x, y, text, colour) {
  particles.texts.push({ x, y, text, colour, age: 0, life: 0.9 });
}

export function addShake(particles, amount) {
  particles.shake = Math.min(18, particles.shake + amount);
}

export function stepParticles(particles, dt) {
  for (const spark of particles.sparks) {
    spark.age += dt;
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    spark.vx *= Math.max(0, 1 - 2.4 * dt);
    spark.vy *= Math.max(0, 1 - 2.4 * dt);
  }
  particles.sparks = particles.sparks.filter((s) => s.age < s.life);
  for (const r of particles.rings) r.age += dt;
  particles.rings = particles.rings.filter((r) => r.age < r.life);
  for (const t of particles.texts) {
    t.age += dt;
    t.y -= 42 * dt;
  }
  particles.texts = particles.texts.filter((t) => t.age < t.life);
  particles.shake = Math.max(0, particles.shake - 42 * dt);
}

export function shakeOffset(particles) {
  if (particles.shake <= 0.2) return { x: 0, y: 0 };
  return {
    x: (Math.random() - 0.5) * particles.shake,
    y: (Math.random() - 0.5) * particles.shake,
  };
}

export function drawParticles(ctx, particles) {
  for (const spark of particles.sparks) {
    const f = 1 - spark.age / spark.life;
    ctx.globalAlpha = f;
    ctx.fillStyle = spark.colour;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.size * f + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const r of particles.rings) {
    const f = r.age / r.life;
    ctx.globalAlpha = (1 - f) * 0.8;
    ctx.strokeStyle = r.colour;
    ctx.lineWidth = 3 * (1 - f) + 1;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 8 + f * r.maxRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  for (const t of particles.texts) {
    const f = 1 - t.age / t.life;
    ctx.globalAlpha = f;
    ctx.fillStyle = t.colour;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
