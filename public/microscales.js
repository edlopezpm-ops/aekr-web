/* One site-wide decorative instance. Only reserved source emblems and a bounded
   flight pool are drawn per frame; the dense surface is precomposed offline. */
(() => {
  'use strict';
  const root = document.querySelector('.atmosphere');
  const canvas = root?.querySelector('.atmosphere__scales');
  const model = window.AEKRMicroscales;
  if (!root || !canvas || !model || root.dataset.renderer) return;
  const { config, sources, random } = model;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // Cache the query state: reading matches in every RAF can consume a pending
  // media transition before Chromium dispatches its change event.
  let reduced = motion.matches;
  const next = random(config.seed + 1);
  const between = range => range[0] + next() * (range[1] - range[0]);
  let context, frame = 0, clock = 0, previous = 0, nextEmission = config.firstEmission;
  let ready = false, failed = false;
  let width = 1, height = 1, scale = 1, offsetX = 0, offsetY = 0, mobile = false;
  let flights = [];
  const sprite = new Image();
  const allowed = () => ready && !failed && !reduced && !document.hidden;
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
  function paint(source, x, y, angle, opacity) {
    if (opacity <= 0) return;
    const size = sourcePosition(source).size;
    context.save(); context.translate(x, y); context.rotate(angle);
    context.globalAlpha = Math.max(0, opacity);
    context.drawImage(sprite, -size / 2, -size / 2, size, size); context.restore();
  }
  function draw() {
    context.clearRect(0, 0, width, height);
    const drift = config.surfaceAmplitude * Math.sin(clock / config.surfacePeriod * Math.PI * 2);
    root.style.setProperty('--surface-drift', `${drift}px`);
    for (const source of sources) {
      const origin = sourcePosition(source);
      const flight = flights.find(item => item.source === source);
      const elapsed = flight ? clock - flight.start : 0;
      // Source transfers to the airborne emblem on the same frame; it regrows
      // only once the flying copy has travelled at least one symbol width.
      const progress = flight ? Math.min(1, elapsed / flight.duration) : 0;
      const distance = flight ? flight.distance * scale * (0.4 * progress + 0.6 * progress * progress) : 0;
      const regrowth = flight ? Math.max(0, Math.min(1, (distance - origin.size) / origin.size)) : 1;
      paint(source, origin.x + drift, origin.y, source.angle,
        source.alpha * regrowth * (mobile ? config.mobileOpacity : 1));
    }
    for (const flight of flights) {
      const progress = Math.min(1, (clock - flight.start) / flight.duration);
      const origin = sourcePosition(flight.source);
      const travel = flight.distance * scale * (0.4 * progress + 0.6 * progress * progress);
      const fade = progress < config.fadeStart ? 1
        : Math.pow(1 - (progress - config.fadeStart) / (1 - config.fadeStart), config.fadeExponent);
      // Own fade, no surface mask: detached emblems can travel into quiet space.
      paint(flight.source, origin.x + flight.drift - travel,
        origin.y + Math.sin(progress * Math.PI * 2 + flight.phase) * config.oscillation * progress * scale,
        flight.source.angle + Math.sin(progress * 3 + flight.phase) * config.rotation * progress,
        flight.source.alpha * fade * (mobile ? config.mobileOpacity : 1));
    }
    root.dataset.particles = String(flights.length);
  }
  function tick(now) {
    frame = 0;
    if (!allowed()) return;
    if (!previous) previous = now;
    if (now - previous >= 1000 / config.fps) {
      clock += Math.min(now - previous, 80); previous = now;
      flights = flights.filter(flight => clock - flight.start < flight.duration);
      if (clock >= nextEmission) {
        const available = sources.filter(source => !flights.some(item => item.source === source)
          && sourcePosition(source).x > width * 0.48 && sourcePosition(source).x < width - 15);
        if (available.length && flights.length < (mobile ? config.maxMobile : config.maxDesktop)) {
          flights.push({ source: available[Math.floor(next() * available.length)], start: clock,
            duration: between(config.duration), distance: between(config.travel), phase: next() * Math.PI * 2,
            drift: config.surfaceAmplitude * Math.sin(clock / config.surfacePeriod * Math.PI * 2) });
        }
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
  motion.addEventListener('change', () => {
    // Reduced motion gets a fully static surface, never stranded flying scales.
    reduced = motion.matches;
    if (reduced) {
      flights = [];
      if (ready && !failed) { try { draw(); } catch { fail(); } }
    }
    sync();
  });
  document.addEventListener('visibilitychange', sync);
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
  sprite.src = new URL('assets/aekr-scale-emboss-v1.png', document.currentScript.src).href;
})();
