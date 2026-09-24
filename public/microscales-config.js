/* Deterministic artwork and motion parameters. Rebuild versioned assets with
   tools/visual/build-microscales.mjs after changing the surface parameters. */
(() => {
  'use strict';
  const config = Object.freeze({
    version: 'v1', seed: 0xAE2026, width: 1600, height: 1000,
    mobileWidth: 600, mobileSize: 0.78, mobileOpacity: 0.65,
    count: 4700, size: [18, 31], relief: 0.32, eligible: 18,
    maxDesktop: 6, maxMobile: 3, mobileBreakpoint: 768,
    duration: [14000, 23000], emission: [2800, 5200], firstEmission: 1800,
    fadeStart: 0.16, fadeExponent: 1.4,
    travel: [140, 280], oscillation: 12, rotation: 0.7,
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
      const edge = 0.62 - y * 0.24 + Math.sin(y * 7) * 0.035;
      const fade = Math.max(0, Math.min(1, (x - edge) / 0.30));
      return { x: x * config.width, y: y * config.height,
        size: config.size[0] + next() * (config.size[1] - config.size[0]),
        angle: (next() - 0.5) * 1.5,
        alpha: fade * fade * (3 - 2 * fade) * (0.55 + next() * 0.45), index };
    });
  }
  const points = distribution();
  const sources = points.filter(p => p.alpha > 0.50 && p.x < 1510 && p.y > 80 && p.y < 920)
    .filter((_, i) => i % 61 === 0).slice(0, config.eligible);
  globalThis.AEKRMicroscales = Object.freeze({ config, random, points, sources });
})();
