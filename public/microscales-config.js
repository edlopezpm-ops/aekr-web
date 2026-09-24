/* Deterministic artwork and motion parameters. Rebuild versioned assets with
   tools/visual/build-microscales.mjs after changing the surface parameters. */
(() => {
  'use strict';
  const config = Object.freeze({
    version: 'v2', seed: 0xAE2026, width: 1600, height: 1000,
    mobileWidth: 600, mobileSize: 0.85, mobileOpacity: 0.85,
    count: 7200, size: [26, 43], relief: 0.70, surfaceOpacity: 0.65, eligible: 128,
    maxDesktop: 64, maxMobile: 44, mobileBreakpoint: 768, flightSize: 0.8,
    duration: [14000, 22000], emission: [90, 180], firstEmission: 120,
    fadeStart: 0.52, fadeExponent: 1.15,
    speed: [38, 72], sway: [-36, 58], gustInterval: [900, 2600],
    fps: 30, maxDpr: 1.5, maxPixels: 2400000,
    surfaceAmplitude: 0.65, surfacePeriod: 21000,
  });
  function random(seed = config.seed) {
    let state = seed >>> 0;
    return () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }
  function distribution() {
    const next = random();
    return Array.from({ length: config.count }, (_, index) => {
      const x = next(), y = next();
      const edge = 0.76 - y * 0.52 + Math.sin(y * 9) * 0.035;
      const fade = Math.max(0, Math.min(1, (x - edge) / 0.22));
      return { x: x * config.width, y: y * config.height,
        size: config.size[0] + next() * (config.size[1] - config.size[0]),
        angle: (next() - 0.5) * 1.5,
        alpha: fade * fade * (3 - 2 * fade) * (0.55 + next() * 0.45), index };
    });
  }
  const points = distribution();
  const candidates = points.filter(p => p.alpha > 0.40 && p.x < 1540 && p.y > 60 && p.y < 960);
  const sources = Array.from({ length: config.eligible }, (_, i) => candidates[Math.floor(i * candidates.length / config.eligible)]);
  globalThis.AEKRMicroscales = Object.freeze({ config, random, points, sources });
})();
