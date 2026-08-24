/* --------------------------------------------------------------------------
   Atmosphere — drifting starfield with pointer parallax.
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
  if (!form || !status) return;

  const emailField = form.elements.email;
  const buttons = Array.from(form.querySelectorAll("button[type=submit]"));
  const ENDPOINT = form.getAttribute("action") || "/api/contact";

  let submitting = false;
  let lastClicked = null;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      lastClicked = button;
    });
  });

  function setStatus(message, variant) {
    status.textContent = message;
    status.classList.remove("form-status--success", "form-status--error");
    if (variant) status.classList.add(`form-status--${variant}`);
  }

  function setBusy(isBusy, activeButton) {
    submitting = isBusy;
    buttons.forEach((button) => {
      button.disabled = isBusy;
    });
    if (activeButton) {
      activeButton.setAttribute("aria-busy", isBusy ? "true" : "false");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;

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

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, comment, company, requestType }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json().catch(() => ({}));
      if (result && result.ok === false) throw new Error("rejected");

      form.reset();
      setStatus(
        requestType === "pricing"
          ? "Request received. We'll send the AEKR engagement structure to your email."
          : "Message received. We'll get back to you at that address.",
        "success"
      );
    } catch (error) {
      // The comment is deliberately left in place so nothing typed is lost.
      setStatus("We couldn't send your request. Please try again.", "error");
    } finally {
      setBusy(false, trigger);
    }
  });
})();
