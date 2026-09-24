/* One site-wide decorative instance. Only reserved source emblems and a bounded
   flight pool are drawn per frame; the dense surface is precomposed offline. */
(() => {
  'use strict';
  const root = document.querySelector('.atmosphere');
  const canvas = root?.querySelector('.atmosphere__scales');
  const model = window.AEKRMicroscales;
  if (!root || !canvas || !model || root.dataset.renderer) return;
  const { config, sources, random } = model;
  const next = random(config.seed + 1);
  const between = range => range[0] + next() * (range[1] - range[0]);
  let context, frame = 0, clock = 0, previous = 0, nextEmission = config.firstEmission;
  let ready = false, failed = false;
  let width = 1, height = 1, scale = 1, offsetX = 0, offsetY = 0, mobile = false;
  let flights = [];
  let gust = 0, pointerSource = null, lastPointerRelease = -1500;
  const sprite = new Image();
  const allowed = () => ready && !failed && !document.hidden;
  function fail() {
    failed = true;
    cancelAnimationFrame(frame); frame = 0;
    root.dataset.renderer = 'static'; root.dataset.paused = 'true';
    canvas.hidden = true;
  }
  function geometry() {
    const bounds = root.getBoundingClientRect();
    width = bounds.width; height = bounds.height;
    mobile = width < config.mobileBreakpoint;
    const worldWidth = mobile ? config.mobileWidth : config.width;
    scale = Math.max(width / worldWidth, height / config.height);
    offsetX = width - worldWidth * scale; offsetY = (height - config.height * scale) / 2;
    const dpr = Math.min(devicePixelRatio || 1, config.maxDpr, Math.sqrt(config.maxPixels / (width * height)));
    canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Keep surviving trajectories normalized to the same source after resize.
    flights = flights.slice(0, mobile ? config.maxMobile : config.maxDesktop);
    draw();
  }
  function sourcePosition(source) {
    return { x: offsetX + source.x * (mobile ? config.mobileWidth / config.width : 1) * scale,
      y: offsetY + source.y * scale,
      size: source.size * (mobile ? config.mobileSize : 1) * scale };
  }
  function paint(source, x, y, angle, opacity, pose = null, dissolve = 0) {
    if (opacity <= 0) return;
    const size = sourcePosition(source).size;
    context.save(); context.translate(x, y); context.rotate(angle);
    if (pose) {
      // Project independent rotations around X/Y, then roll around Z. Changing
      // face/edge and depth makes these thin petals, not translating circles.
      const release = Math.min(1, (clock - pose.start) / 800);
      const depth = (1 - (1 - config.flightSize) * release) * (1 + pose.z * 0.22);
      context.transform(Math.cos(pose.ry) * depth, Math.sin(pose.rx) * Math.sin(pose.ry) * depth,
        0, Math.cos(pose.rx) * depth, 0, 0);
    }
    context.globalAlpha = Math.max(0, Math.min(1, opacity));
    if (!dissolve) context.drawImage(sprite, -size / 2, -size / 2, size, size);
    else {
      // Four pieces of the actual mark drift apart as it dissolves. This is a
      // bounded sprite operation, not an accumulating second particle system.
      for (let row = 0; row < 4; row++) {
        context.globalAlpha = Math.max(0, opacity * (1 - dissolve * row / 4));
        context.drawImage(sprite, 0, row * 24, 96, 24,
          -size / 2 - dissolve * row * size * 0.18,
          -size / 2 + row * size / 4 + Math.sin(row * 2) * dissolve * size * 0.22,
          size, size / 4);
      }
    }
    context.restore();
  }
  function advanceFlight(flight, delta) {
    const seconds = delta / 1000;
    if (clock >= flight.changeAt) {
      flight.targetX = -between(config.speed); flight.targetY = between(config.sway);
      flight.targetZ = between([-1, 1]);
      flight.changeAt = clock + between(config.gustInterval);
    }
    const ease = 1 - Math.exp(-seconds * 1.2);
    flight.vx += (flight.targetX - flight.vx) * ease;
    flight.vy += (flight.targetY - flight.vy) * ease;
    flight.z += (flight.targetZ - flight.z) * ease * 0.4;
    // Slow shared gusts and independent eddies: no two petals retrace one curve.
    flight.x += (flight.vx + Math.sin(clock / 2700 + flight.phase) * 14 - gust * 30) * seconds;
    flight.y += (flight.vy + Math.cos(clock / 1700 + flight.phase) * 17) * seconds;
    const age = (clock - flight.start) / 1000;
    flight.rx = age * flight.spinX + Math.sin(age * flight.wobble) * 0.45;
    flight.ry = age * flight.spinY + Math.sin(age * flight.wobble * 0.7) * 0.55;
    flight.rz = age * flight.spinZ + Math.sin(age * flight.wobble * 0.6) * 0.38;
  }
  function availableSource(source) {
    const position = sourcePosition(source);
    return !flights.some(item => item.source === source) && position.x > width * 0.30
      && position.x < width - 15 && position.y > 20 && position.y < height - 20;
  }
  function draw() {
    context.clearRect(0, 0, width, height);
    const drift = config.surfaceAmplitude * Math.sin(clock / config.surfacePeriod * Math.PI * 2);
    root.style.setProperty('--surface-drift', `${drift}px`);
    for (const source of sources) {
      const origin = sourcePosition(source);
      const flight = flights.find(item => item.source === source);
      // Source transfers to the airborne emblem on the same frame; it regrows
      // only once the flying copy has travelled at least one symbol width.
      const distance = flight ? Math.hypot(flight.x, flight.y) * scale : 0;
      const regrowth = flight ? Math.max(0, Math.min(1, (distance - origin.size) / origin.size)) : 1;
      paint(source, origin.x + drift, origin.y, source.angle,
        source.alpha * config.surfaceOpacity * regrowth * (mobile ? config.mobileOpacity : 1));
    }
    for (const flight of flights) {
      const progress = Math.min(1, (clock - flight.start) / flight.duration);
      const origin = sourcePosition(flight.source);
      const fade = progress < config.fadeStart ? 1
        : Math.pow(1 - (progress - config.fadeStart) / (1 - config.fadeStart), config.fadeExponent);
      // Own fade, no surface mask: detached emblems can travel into quiet space.
      const relief = config.surfaceOpacity + (1 - config.surfaceOpacity) * Math.min(1, progress / 0.12);
      paint(flight.source, origin.x + flight.drift + flight.x * scale,
        origin.y + flight.y * scale,
        flight.source.angle + flight.rz,
        flight.source.alpha * relief * fade * (mobile ? config.mobileOpacity : 1),
        flight,
        Math.max(0, (progress - 0.68) / 0.32));
    }
    root.dataset.particles = String(flights.length);
  }
  function tick(now) {
    frame = 0;
    if (!allowed()) return;
    if (!previous) previous = now;
    if (now - previous >= 1000 / config.fps) {
      const delta = Math.min(now - previous, 80);
      clock += delta; previous = now;
      gust *= Math.exp(-delta / 1500);
      flights = flights.filter(flight => clock - flight.start < flight.duration);
      for (const flight of flights) advanceFlight(flight, delta);
      if (clock >= nextEmission) {
        const available = sources.filter(availableSource);
        if (available.length && flights.length < (mobile ? config.maxMobile : config.maxDesktop)) {
          const source = available.includes(pointerSource) ? pointerSource : available[Math.floor(next() * available.length)];
          const vx = -between(config.speed), vy = between(config.sway);
          flights.push({ source, start: clock, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0,
            vx, vy, targetX: vx, targetY: vy, targetZ: between([-1, 1]),
            spinX: between([-1.3, 1.3]), spinY: between([-1.1, 1.1]), spinZ: between([-0.75, 0.75]),
            wobble: between([0.7, 1.8]), changeAt: clock + between(config.gustInterval),
            duration: between(config.duration), phase: next() * Math.PI * 2,
            drift: config.surfaceAmplitude * Math.sin(clock / config.surfacePeriod * Math.PI * 2) });
        }
        pointerSource = null;
        nextEmission = clock + between(config.emission);
      }
      try { draw(); } catch { fail(); return; }
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; previous = 0;
    root.dataset.paused = String(!allowed());
    if (allowed()) frame = requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange', sync);
  // Passive pointer response adds a brief gust near the textured field. It never
  // captures a gesture or competes with scrolling, navigation or form controls.
  window.addEventListener('pointermove', event => {
    if (!allowed() || event.pointerType === 'touch' || clock - lastPointerRelease < 1200) return;
    let closest = null, distance = mobile ? 65 : 110;
    for (const source of sources) {
      if (!availableSource(source)) continue;
      const point = sourcePosition(source);
      const separation = Math.hypot(event.clientX - point.x, event.clientY - point.y);
      if (separation < distance) { closest = source; distance = separation; }
    }
    if (closest) {
      gust = 1; pointerSource = closest; lastPointerRelease = clock;
      nextEmission = Math.min(nextEmission, clock);
    }
  }, { passive: true });
  window.addEventListener('resize', () => { if (ready && !failed) { try { geometry(); } catch { fail(); } } }, { passive: true });
  canvas.addEventListener('contextlost', fail);
  root.dataset.renderer = 'static';
  sprite.onload = () => {
    try {
      context = canvas.getContext('2d', { alpha: true });
      if (!context) { fail(); return; }
      ready = true; geometry(); root.dataset.renderer = 'canvas2d'; sync();
    } catch { fail(); }
  };
  sprite.onerror = fail;
  sprite.src = new URL(`assets/aekr-scale-emboss-${config.version}.png`, document.currentScript.src).href;
})();
