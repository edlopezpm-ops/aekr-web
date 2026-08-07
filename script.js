(() => {
  "use strict";

  const canvas = document.querySelector(".atmosphere__starfield");
  const root = document.querySelector(".atmosphere");
  if (!canvas || !root) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const TWO_PI = Math.PI * 2;
  const FRAME_INTERVAL_MS = 1000 / 30;
  const MAX_AREA_MEGAPIXELS = 2.4;
  const MIN_AREA_MEGAPIXELS = 0.65;

  const DEPTH_SPECS = [
    { alpha: [0.25, 0.5], densityPerMegapixel: 40, driftPx: 10, parallaxPx: 1.2, periodSeconds: [50, 80], radiusPx: [0.4, 0.8] },
    { alpha: [0.35, 0.6], densityPerMegapixel: 16, driftPx: 16, parallaxPx: 2.6, periodSeconds: [36, 58], radiusPx: [0.8, 1.3] },
    { alpha: [0.45, 0.75], densityPerMegapixel: 6, driftPx: 26, parallaxPx: 4.5, periodSeconds: [24, 40], radiusPx: [1.3, 2] },
  ];

  const STAR_COLORS = ["#eef1f5", "#4dd6c0", "#9db3c9"];

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointerQuery = window.matchMedia("(pointer: fine)");

  function seededRandom(seed) {
    let state = seed >>> 0;
    return () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function between(random, [min, max]) {
    return min + (max - min) * random();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  const pools = DEPTH_SPECS.map((spec, depthIndex) => {
    const random = seededRandom(0x0aec0000 + depthIndex * 0x9e3779b9);
    const count = Math.ceil(spec.densityPerMegapixel * MAX_AREA_MEGAPIXELS);
    return Array.from({ length: count }, () => ({
      x: random(),
      y: random(),
      radiusPx: between(random, spec.radiusPx),
      alpha: between(random, spec.alpha),
      colorIndex: Math.floor(random() * STAR_COLORS.length),
      periodMs: between(random, spec.periodSeconds) * 1000,
      phaseA: random() * TWO_PI,
      phaseB: random() * TWO_PI,
    }));
  });

  const pointer = { currentX: 0, currentY: 0, targetX: 0, targetY: 0 };
  const viewport = { width: 1, height: 1 };
  let areaMegapixels = MIN_AREA_MEGAPIXELS;
  let animationFrame = 0;
  let lastFrame = 0;
  let paused = document.hidden;

  const motionAllowed = () => !paused && !reducedMotionQuery.matches;

  function draw(now) {
    context.clearRect(0, 0, viewport.width, viewport.height);

    DEPTH_SPECS.forEach((spec, depthIndex) => {
      const pool = pools[depthIndex];
      const visibleCount = Math.min(pool.length, Math.ceil(spec.densityPerMegapixel * areaMegapixels));
      const parallaxX = pointer.currentX * spec.parallaxPx * -2;
      const parallaxY = pointer.currentY * spec.parallaxPx * -1.3;

      for (let i = 0; i < visibleCount; i += 1) {
        const star = pool[i];
        const phase = motionAllowed() ? (now / star.periodMs) * TWO_PI : 0;
        const driftX = spec.driftPx * Math.sin(phase + star.phaseA);
        const driftY = spec.driftPx * 0.7 * Math.cos(phase * 0.8 + star.phaseB);
        const x = star.x * viewport.width + driftX + parallaxX;
        const y = star.y * viewport.height + driftY + parallaxY;

        context.beginPath();
        context.globalAlpha = star.alpha;
        context.fillStyle = STAR_COLORS[star.colorIndex];
        context.arc(x, y, star.radiusPx, 0, TWO_PI);
        context.fill();
      }
    });

    context.globalAlpha = 1;
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    viewport.width = Math.max(1, bounds.width);
    viewport.height = Math.max(1, bounds.height);
    areaMegapixels = clamp((viewport.width * viewport.height) / 1_000_000, MIN_AREA_MEGAPIXELS, MAX_AREA_MEGAPIXELS);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(viewport.width * pixelRatio);
    canvas.height = Math.round(viewport.height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    draw(performance.now());
  }

  function tick(now) {
    animationFrame = window.requestAnimationFrame(tick);
    if (now - lastFrame < FRAME_INTERVAL_MS) return;
    const interpolation = 1 - Math.pow(0.001, (now - lastFrame) / 1000);
    pointer.currentX += (pointer.targetX - pointer.currentX) * interpolation;
    pointer.currentY += (pointer.targetY - pointer.currentY) * interpolation;
    lastFrame = now;
    draw(now);

    root.style.setProperty("--cursor-x", `${(pointer.currentX + 0.5) * 100}%`);
    root.style.setProperty("--cursor-y", `${(pointer.currentY + 0.5) * 100}%`);
  }

  function startLoop() {
    window.cancelAnimationFrame(animationFrame);
    if (motionAllowed()) {
      animationFrame = window.requestAnimationFrame(tick);
    } else {
      draw(0);
    }
  }

  function handlePointerMove(event) {
    if (!motionAllowed() || !finePointerQuery.matches) return;
    pointer.targetX = clamp(event.clientX / window.innerWidth - 0.5, -0.5, 0.5);
    pointer.targetY = clamp(event.clientY / window.innerHeight - 0.5, -0.5, 0.5);
  }

  function resetPointer() {
    pointer.targetX = 0;
    pointer.targetY = 0;
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();
  startLoop();

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerout", (event) => {
    if (event.relatedTarget === null) resetPointer();
  });
  window.addEventListener("blur", resetPointer);
  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    startLoop();
  });
  reducedMotionQuery.addEventListener("change", startLoop);
})();
