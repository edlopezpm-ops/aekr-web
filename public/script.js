/* --------------------------------------------------------------------------
   Atmosphere — autonomous drifting starfield.
   Capped at 30fps, pauses when hidden, and holds still under reduced motion.
   -------------------------------------------------------------------------- */
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
    { alpha: [0.25, 0.5], densityPerMegapixel: 40, driftPx: 10, periodSeconds: [50, 80], radiusPx: [0.4, 0.8] },
    { alpha: [0.35, 0.6], densityPerMegapixel: 16, driftPx: 16, periodSeconds: [36, 58], radiusPx: [0.8, 1.3] },
    { alpha: [0.45, 0.75], densityPerMegapixel: 6, driftPx: 26, periodSeconds: [24, 40], radiusPx: [1.3, 2] },
  ];

  const STAR_COLORS = ["#eef1f5", "#4dd6c0", "#9db3c9"];

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const slowUpdateQuery = window.matchMedia("(update: slow)");
  const connection = navigator.connection;

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

  const viewport = { width: 1, height: 1 };
  let areaMegapixels = MIN_AREA_MEGAPIXELS;
  let animationFrame = 0;
  let lastFrame = 0;
  let paused = document.hidden;

  const motionAllowed = () => !paused && !reducedMotionQuery.matches &&
    !slowUpdateQuery.matches && !connection?.saveData;

  function draw(now) {
    context.clearRect(0, 0, viewport.width, viewport.height);

    DEPTH_SPECS.forEach((spec, depthIndex) => {
      const pool = pools[depthIndex];
      const visibleCount = Math.min(pool.length, Math.ceil(spec.densityPerMegapixel * areaMegapixels));

      for (let i = 0; i < visibleCount; i += 1) {
        const star = pool[i];
        const phase = motionAllowed() ? (now / star.periodMs) * TWO_PI : 0;
        const driftX = spec.driftPx * Math.sin(phase + star.phaseA);
        const driftY = spec.driftPx * 0.7 * Math.cos(phase * 0.8 + star.phaseB);
        const x = star.x * viewport.width + driftX;
        const y = star.y * viewport.height + driftY;

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
    lastFrame = now;
    draw(now);

  }

  function startLoop() {
    window.cancelAnimationFrame(animationFrame);
    if (motionAllowed()) {
      animationFrame = window.requestAnimationFrame(tick);
    } else {
      draw(0);
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();
  startLoop();

  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    startLoop();
  });
  reducedMotionQuery.addEventListener("change", startLoop);
  slowUpdateQuery.addEventListener("change", startLoop);
  connection?.addEventListener?.("change", startLoop);
})();

/* --------------------------------------------------------------------------
   Procedural nebula adapted from accreatio, Copyright (c) 2026 Ed Lopez.
   All rights reserved. AEKR adaptation authorized by the copyright holder.
   Source: src/components/nebula.ts and src/components/Atmosphere.tsx,
   accreatio deployed preview commit 53343211a2176be487c17fa8f58202146f3eac7e.
   The source's autonomous home currents and click pressure waves are preserved;
   strata colors use AEKR mint/steel. No service or third-party runtime.
   -------------------------------------------------------------------------- */
(() => {
  "use strict";

  const root = document.querySelector(".atmosphere");
  if (!root) return;

  const VERTEX_SOURCE = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }`;

  /** Value-noise fbm with two-level domain warping (the classic warp-of-a-warp
   * construction) plus absorption and emission shaping. Written for WebGL1. */
  const FRAGMENT_SOURCE = `
  precision highp float;
  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_theme;
  uniform float u_cssHeight;
  uniform vec4 u_bursts[4];
  uniform float u_picking;
  uniform vec2 u_pickUv;

  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = ROT * p * 2.02;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 sampleUv = mix(v_uv, u_pickUv, u_picking);
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 uv = sampleUv * aspect;
    float t = u_time;

    // Autonomous currents: travel and curl remain independent of the pointer.
    vec2 p = uv * 2.1 + vec2(t * 0.026, -t * 0.017);
    p += vec2(sin(t * 0.13 + uv.y * 2.0), cos(t * 0.11 + uv.x)) * 0.13;

    // A local pressure wave pushes gas aside, curls its rim, then dissipates.
    // Distances are CSS pixels, so each bubble has the same size on every screen.
    float shell = 0.0;
    float hollow = 0.0;
    for (int i = 0; i < 4; i++) {
      vec4 burst = u_bursts[i];
      if (burst.w < 0.5) continue;
      vec2 offset = (sampleUv - burst.xy) * aspect;
      float distancePx = length(offset) * u_cssHeight;
      vec2 direction = offset / max(length(offset), 0.0001);
      float progress = clamp(burst.z / 1.6, 0.0, 1.0);
      float life = (1.0 - smoothstep(0.2, 1.0, progress)) * burst.w;
      float radius = 8.0 + 105.0 * (1.0 - pow(1.0 - progress, 2.0));
      float angle = atan(offset.y, offset.x + 0.00001);
      float ruffle = sin(angle * 6.0 + progress * 8.0) * 4.0
                   + sin(angle * 11.0 - progress * 5.0) * 2.5;
      float ring = exp(-pow((distancePx - radius - ruffle) / (11.0 + progress * 15.0), 2.0)) * life;
      p += direction * ring * 0.16;
      p += vec2(-direction.y, direction.x) * ring * 0.055 * sin(angle * 4.0);
      shell += ring;
      hollow += (1.0 - smoothstep(radius * 0.35, radius, distancePx)) * life;
    }

    vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));
    vec2 r = vec2(
      fbm(p + 2.6 * q + vec2(1.7, 9.2) + 0.06 * t),
      fbm(p + 2.6 * q + vec2(8.3, 2.8) + 0.045 * t)
    );
    float f = fbm(p + 2.4 * r);

    // Density: keep the left reading column airy, thicken toward the right.
    float column = smoothstep(0.05, 0.72, sampleUv.x);
    float density = smoothstep(0.32, 0.94, f) * mix(0.35, 1.0, column);

    // Strata coloring.
    vec3 deep = vec3(0.020, 0.027, 0.039);
    vec3 mint = vec3(0.302, 0.839, 0.753);
    vec3 steel = vec3(0.435, 0.561, 0.682);
    vec3 teal = vec3(0.184, 0.525, 0.463);
    vec3 silver = vec3(0.616, 0.702, 0.788);

    vec3 color = mix(deep, mint, clamp(f * f * 2.4, 0.0, 1.0));
    color = mix(color, steel, clamp(dot(q, q) * 0.85, 0.0, 1.0));
    color = mix(color, teal, clamp(r.y * r.y * 0.9, 0.0, 1.0) * 0.55);

    // Both emission cores drift with the gas currents.
    vec2 core = (vec2(0.72, 0.46) + vec2(sin(t * 0.08), cos(t * 0.07)) * 0.07) * aspect;
    float coreGlow = exp(-dot(uv - core, uv - core) * 5.5);
    vec2 lamp = (vec2(0.57, 0.58) + vec2(cos(t * 0.1), sin(t * 0.06)) * 0.09) * aspect;
    float lampGlow = exp(-dot(uv - lamp, uv - lamp) * 7.0);
    float emission = (coreGlow * 0.85 + lampGlow * 0.5) * (0.45 + 0.55 * f);
    color += silver * emission * 0.55;
    color += mint * lampGlow * 0.35;

    // Dust lanes: cold foreground absorption carves filaments into the glow.
    float dust = fbm(p * 2.3 + r * 1.4);
    float absorption = smoothstep(0.28, 0.72, dust);
    color *= mix(0.42, 1.06, absorption);

    // Micro star grains, dimmed where the dust is thickest.
    vec2 grid = uv * 210.0;
    float cell = hash(floor(grid));
    float grain = smoothstep(0.9975, 1.0, cell);
    float twinkle = 0.7 + 0.3 * sin(t * 1.4 + cell * 40.0);
    color += vec3(0.92, 0.94, 1.0) * grain * twinkle * absorption * 0.8;

    float alpha = clamp(density * 1.15 + emission * 0.5, 0.0, 1.0);
    float clearing = 1.0 - min(hollow, 1.0) * 0.84;
    alpha = clamp(alpha * clearing + shell * 0.42, 0.0, 1.0);
    color += (mint * 0.6 + steel * 0.35 + silver * 0.25) * shell;

    // Shared rendering/picking mask. There is no second CSS mask or transform
    // that can make an invisible part of the gas respond to a click.
    float visibility = sampleUv.x < 0.18
      ? mix(0.0, 0.38, sampleUv.x / 0.18)
      : sampleUv.x < 0.42
        ? mix(0.38, 0.88, (sampleUv.x - 0.18) / 0.24)
        : mix(0.88, 1.0, clamp((sampleUv.x - 0.42) / 0.24, 0.0, 1.0));
    alpha *= visibility;

    // Light theme renders the same field as a faint pastel wash.
    vec3 paper = vec3(0.976, 0.976, 0.984);
    vec3 lightInk = mix(paper, color * 0.5 + vec3(0.42), 0.9);
    color = mix(color, lightInk, u_theme);
    alpha = mix(alpha, alpha * 0.42, u_theme);

    // Dither kills gradient banding on wide soft ramps.
    color += (hash(uv * 913.7 + t) - 0.5) * 0.012;

    if (u_picking > 0.5) {
      // Density excludes emission haze and star grains; holes do not count as gas.
      gl_FragColor = vec4(density * visibility * clearing, 0.0, 0.0, 1.0);
      return;
    }
    gl_FragColor = vec4(color * alpha, alpha);
  }`;

  const FRAME_INTERVAL_MS = 1000 / 30;
  const HOME_SPEED = 2.6;
  const RESOLUTION_SCALE = 0.6;
  const COMPACT_RESOLUTION_SCALE = 0.4;
  const MAX_PIXEL_RATIO = 1.5;
  const MAX_RENDER_PIXELS = 1_500_000;
  const BURST_LIFETIME_SECONDS = 1.6;
  const MIN_VISIBLE_DENSITY = 0.06;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const slowUpdate = window.matchMedia("(update: slow)");
  const connection = navigator.connection;
  let renderer = null;
  let frame = 0;
  let lastFrame = 0;
  let simulatedTime = Math.random() * 400;
  let elapsedSeconds = 0;
  let failed = false;
  root.dataset.renderer = "fallback";

  const motionAllowed = () => !reducedMotion.matches && !slowUpdate.matches &&
    !connection?.saveData;

  function createRenderer() {
    const canvas = document.createElement("canvas");
    canvas.className = "atmosphere__webgl";
    let gl;
    try {
      gl = canvas.getContext("webgl", {
        alpha: true, antialias: false, depth: false, stencil: false,
        powerPreference: "low-power", premultipliedAlpha: true,
      });
    } catch {
      return null;
    }
    if (!gl) return null;

    const shaders = [];
    let program = null;
    let buffer = null;
    let pickTexture = null;
    let pickFramebuffer = null;
    function dispose() {
      if (pickTexture) gl.deleteTexture(pickTexture);
      if (pickFramebuffer) gl.deleteFramebuffer(pickFramebuffer);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
      canvas.removeEventListener("webglcontextlost", handleContextLoss);
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    function compile(type, source) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    }

    const vertex = compile(gl.VERTEX_SHADER, VERTEX_SOURCE);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
    program = gl.createProgram();
    if (!vertex || !fragment || !program) {
      dispose();
      return null;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      dispose();
      return null;
    }
    gl.useProgram(program);
    buffer = gl.createBuffer();
    if (!buffer) {
      dispose();
      return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      theme: gl.getUniformLocation(program, "u_theme"),
      cssHeight: gl.getUniformLocation(program, "u_cssHeight"),
      bursts: gl.getUniformLocation(program, "u_bursts[0]"),
      picking: gl.getUniformLocation(program, "u_picking"),
      pickUv: gl.getUniformLocation(program, "u_pickUv"),
    };

    // Sample the same gas shader at one pixel only after an eligible click.
    // A failed picking target disables bursts while autonomous gas continues.
    pickTexture = gl.createTexture();
    pickFramebuffer = gl.createFramebuffer();
    let pickingSupported = false;
    if (pickTexture && pickFramebuffer) {
      gl.bindTexture(gl.TEXTURE_2D, pickTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, pickFramebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pickTexture, 0);
      pickingSupported = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    let rendered = false;
    let cssHeight = 1;
    let nextBurst = 0;
    const bursts = [];
    const burstUniforms = new Float32Array(16);
    const pickedPixel = new Uint8Array(4);
    canvas.addEventListener("webglcontextlost", handleContextLoss);
    root.insertBefore(canvas, root.querySelector(".atmosphere__scrim"));

    return {
      dispose,
      resize() {
        rendered = false;
        const bounds = canvas.getBoundingClientRect();
        cssHeight = Math.max(1, bounds.height);
        const resolutionScale = bounds.width <= 600 ? COMPACT_RESOLUTION_SCALE : RESOLUTION_SCALE;
        let scale = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO) * resolutionScale;
        scale = Math.min(scale, Math.sqrt(MAX_RENDER_PIXELS / Math.max(1, bounds.width * bounds.height)));
        canvas.width = Math.max(1, Math.floor(bounds.width * scale));
        canvas.height = Math.max(1, Math.floor(bounds.height * scale));
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      draw() {
        burstUniforms.fill(0);
        bursts.forEach((burst, index) => {
          const age = elapsedSeconds - burst.started;
          if (age >= BURST_LIFETIME_SECONDS) return;
          burstUniforms.set([burst.x, burst.y, age, 1], index * 4);
        });
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform1f(uniforms.time, simulatedTime);
        gl.uniform1f(uniforms.theme, 0);
        gl.uniform1f(uniforms.cssHeight, cssHeight);
        gl.uniform4fv(uniforms.bursts, burstUniforms);
        gl.uniform1f(uniforms.picking, 0);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        rendered = true;
      },
      burstAt(clientX, clientY) {
        if (!rendered || !pickingSupported || gl.isContextLost()) return false;
        const bounds = canvas.getBoundingClientRect();
        if (bounds.width <= 0 || bounds.height <= 0) return false;
        const x = (clientX - bounds.left) / bounds.width;
        const y = 1 - (clientY - bounds.top) / bounds.height;
        if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return false;

        pickedPixel.fill(0);
        try {
          gl.bindFramebuffer(gl.FRAMEBUFFER, pickFramebuffer);
          gl.viewport(0, 0, 1, 1);
          gl.uniform1f(uniforms.picking, 1);
          gl.uniform2f(uniforms.pickUv, x, y);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pickedPixel);
        } catch {
          return false;
        } finally {
          gl.uniform1f(uniforms.picking, 0);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, canvas.width, canvas.height);
        }

        const opacity = Number.parseFloat(window.getComputedStyle(canvas).opacity);
        if (!Number.isFinite(opacity) || (pickedPixel[0] / 255) * opacity < MIN_VISIBLE_DENSITY) return false;
        bursts[nextBurst] = { x, y, started: elapsedSeconds };
        nextBurst = (nextBurst + 1) % 4;
        return true;
      },
    };
  }

  function render(now) {
    if (!renderer || document.hidden || !motionAllowed()) return;
    frame = window.requestAnimationFrame(render);
    if (now - lastFrame < FRAME_INTERVAL_MS) return;
    const step = Math.min(now - lastFrame, 100) / 1000;
    lastFrame = now;
    elapsedSeconds += step;
    simulatedTime += step * (0.55 + HOME_SPEED);
    renderer.draw();
  }

  function syncMotion() {
    window.cancelAnimationFrame(frame);
    frame = 0;
    root.toggleAttribute("data-paused", document.hidden);
    if (!motionAllowed() || failed) {
      renderer?.dispose();
      renderer = null;
      root.dataset.renderer = "fallback";
      return;
    }
    if (document.hidden) return;
    if (!renderer) {
      renderer = createRenderer();
      if (!renderer) {
        failed = true;
        return;
      }
      renderer.resize();
      renderer.draw();
      root.dataset.renderer = "webgl";
    }
    lastFrame = performance.now();
    frame = window.requestAnimationFrame(render);
  }

  function handleContextLoss(event) {
    event.preventDefault();
    failed = true;
    syncMotion();
  }

  // A new visibility/preference state may make WebGL available again. Retry
  // once at that boundary; never allocate replacement contexts in a frame loop.
  function resumeMotion() {
    failed = false;
    syncMotion();
  }

  function resize() {
    if (!renderer) return;
    renderer.resize();
    if (!document.hidden) renderer.draw();
  }

  // Observe completed left clicks on exposed AEKR layout only. Foreground
  // content, controls, keyboard activation and touch remain wholly unaffected.
  window.addEventListener("click", (event) => {
    if (!renderer || document.hidden || !motionAllowed() || event.button !== 0 ||
        event.detail === 0 || event.defaultPrevented ||
        ("pointerType" in event && event.pointerType !== "mouse") ||
        !(event.target instanceof Element) ||
        !event.target.matches("body, main, .hero, .section") ||
        event.target.closest("button, a, input, textarea, select, label, form, header, nav, footer, dialog, [role], [contenteditable], .panel, .modal, .cta-row")) return;
    renderer.burstAt(event.clientX, event.clientY);
  }, { passive: true });
  document.addEventListener("visibilitychange", resumeMotion);
  reducedMotion.addEventListener("change", resumeMotion);
  slowUpdate.addEventListener("change", resumeMotion);
  connection?.addEventListener?.("change", resumeMotion);
  new ResizeObserver(resize).observe(root);
  syncMotion();
})();

/* --------------------------------------------------------------------------
   Header — hairline appears once the page has scrolled off the top.
   -------------------------------------------------------------------------- */
(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  if (!header) return;

  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;";
  document.body.prepend(sentinel);

  new IntersectionObserver(
    ([entry]) => header.classList.toggle("is-stuck", !entry.isIntersecting),
    { rootMargin: "0px" }
  ).observe(sentinel);
})();

/* --------------------------------------------------------------------------
   Contact form.

   Both buttons post to the same endpoint; the one that submitted decides the
   request type. Success is shown only after the server accepts the request —
   never optimistically.
   -------------------------------------------------------------------------- */
(() => {
  "use strict";

  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const thanks = document.getElementById("contact-thanks");
  const main = document.getElementById("main");
  if (!form || !status || !thanks) return;

  const emailField = form.elements.email;
  const buttons = Array.from(form.querySelectorAll("button[type=submit]"));
  const ENDPOINT = form.getAttribute("action") || "/api/contact";

  let submitting = false;
  let completed = false;
  let lastClicked = null;
  let statusMessage = "";
  let inContact = main?.dataset.activeSection === "contact";
  let visit = inContact ? 1 : 0;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      lastClicked = button;
    });
  });

  function translateStatus() {
    status.textContent = window.AEKRLanguage?.text(statusMessage) ?? statusMessage;
  }

  document.addEventListener("aekr:languagechange", translateStatus);

  function setStatus(message, variant) {
    statusMessage = message;
    translateStatus();
    status.classList.remove("form-status--success", "form-status--error");
    if (variant) status.classList.add(`form-status--${variant}`);
  }

  function setBusy(isBusy, activeButton) {
    submitting = isBusy;
    buttons.forEach((button) => {
      button.disabled = isBusy || completed;
    });
    if (activeButton) {
      activeButton.setAttribute("aria-busy", isBusy ? "true" : "false");
    }
  }

  function syncContactVisit(records = navigationObserver?.takeRecords() || []) {
    records.forEach((record, index) => {
      // A complete leave/re-entry can occur in one observer batch.
      const section = index + 1 < records.length ? records[index + 1].oldValue : main.dataset.activeSection;
      const entering = section === "contact" && !inContact;
      inContact = section === "contact";
      if (!entering) return;
      visit++;
      if (!completed) return;
      completed = false;
      form.hidden = false;
      thanks.hidden = true;
      lastClicked = null;
      setStatus("");
      setBusy(submitting);
    });
  }

  const navigationObserver = main ? new MutationObserver(syncContactVisit) : null;
  navigationObserver?.observe(main, {
    attributes: true,
    attributeFilter: ["data-active-section"],
    attributeOldValue: true,
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncContactVisit();
    if (submitting || completed) return;

    const trigger = event.submitter || lastClicked || buttons[0];
    const requestType = trigger && trigger.dataset.requestType === "pricing" ? "pricing" : "contact";

    const email = (emailField.value || "").trim();
    const comment = (form.elements.comment.value || "").trim();
    const company = (form.elements.company.value || "").trim();

    if (!email || !emailField.checkValidity()) {
      emailField.setAttribute("aria-invalid", "true");
      emailField.focus();
      setStatus("Enter a valid email address so we can reply.", "error");
      return;
    }
    emailField.removeAttribute("aria-invalid");

    setBusy(true, trigger);
    setStatus("Sending…");
    const requestVisit = visit;

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, comment, company, requestType }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result?.ok !== true) throw new Error("rejected");

      syncContactVisit();
      if (requestVisit !== visit) return;
      completed = true;
      form.reset();
      setStatus("");
      form.hidden = true;
      thanks.hidden = false;
      if (inContact || !main?.dataset.activeSection) {
        thanks.focus({ preventScroll: true });
        thanks.scrollIntoView({ block: "start", behavior: "instant" });
      }
    } catch (error) {
      // The comment is deliberately left in place so nothing typed is lost.
      syncContactVisit();
      if (requestVisit === visit) setStatus("We couldn't send your request. Please try again.", "error");
    } finally {
      setBusy(false, trigger);
      if (requestVisit !== visit) setStatus("");
    }
  });
})();
