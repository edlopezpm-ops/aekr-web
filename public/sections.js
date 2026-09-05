/* Progressive section navigation. The document remains a normal page if this
   controller is unavailable; the atmosphere and contact form own their events. */
(() => {
  const root = document.documentElement;
  const main = document.querySelector('main');
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  const navigation = document.querySelector('.section-nav');
  const menuToggle = document.querySelector('.section-menu-toggle');
  const status = document.querySelector('.section-status');
  const heroMark = document.querySelector('.hero-mark');
  const dock = document.querySelector('.brand-dock');
  const atmosphere = document.querySelector('.atmosphere');
  const panels = Array.from(main?.querySelectorAll(':scope > section') || []);
  const links = Array.from(navigation?.querySelectorAll('a') || []);
  if (!main || !header || !footer || !menuToggle || !status || !heroMark || !dock || !atmosphere || panels.length !== 7 || links.length !== 6) return;
  if (typeof ResizeObserver !== 'function' || !('inert' in HTMLElement.prototype) || !Element.prototype.animate) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 767px), (pointer: coarse) and (max-width: 1024px) and (max-height: 560px)');
  const editable = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
  const controls = `${editable}, button, a`;
  let current = 0;
  let transitionUntil = 0;
  let wheelTime = 0;
  let wheelSum = 0;
  let wheelDirection = 0;
  let wheelConsumed = false;
  let wheelScrolled = false;
  let keyConsumed = false;
  let touch = null;
  let animationId = 0;
  let animations = [];
  let menuOpen = false;

  const traveler = heroMark.cloneNode(false);
  traveler.className = 'brand-traveler';
  traveler.alt = '';
  traveler.setAttribute('aria-hidden', 'true');
  traveler.hidden = true;
  document.body.append(traveler);
  const mist = document.createElement('div');
  mist.className = 'atmosphere__transition';
  atmosphere.append(mist);

  const sectionName = index => index === 0 ? 'main' : panels[index].id;
  const canScroll = (panel, direction) => direction > 0
    ? panel.scrollTop + panel.clientHeight < panel.scrollHeight - 2
    : panel.scrollTop > 2;

  function indexForHash(hash) {
    if (!hash || hash === '#main') return 0;
    let target;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch { return -1; }
    return panels.indexOf(target?.closest('.section-panel'));
  }

  function measureViewport() {
    const viewport = window.visualViewport;
    const unzoomed = !viewport || viewport.scale === 1;
    root.style.setProperty('--section-viewport-height', `${unzoomed && viewport ? viewport.height : window.innerHeight}px`);
    root.style.setProperty('--section-viewport-top', `${unzoomed && viewport ? viewport.offsetTop : 0}px`);
    root.style.setProperty('--section-header-height', `${header.getBoundingClientRect().height}px`);
    root.style.setProperty('--section-footer-height', `${footer.getBoundingClientRect().height}px`);
  }

  function fitHeader() {
    const mark = dock.getBoundingClientRect();
    const left = (compact.matches ? menuToggle : header.querySelector('.wordmark')).getBoundingClientRect();
    const contact = header.querySelector('.header-cta').getBoundingClientRect();
    root.classList.toggle('brand-header-wrapped', current !== 0 && (left.right + 12 > mark.left || contact.left - 12 < mark.right));
  }

  function setMenu(open, returnFocus = false) {
    menuOpen = compact.matches && open;
    menuToggle.setAttribute('aria-expanded', String(menuOpen));
    navigation.hidden = compact.matches && !menuOpen;
    navigation.inert = navigation.hidden;
    if (returnFocus) menuToggle.focus({ preventScroll: true });
  }

  function updateCompact() {
    const focused = document.activeElement;
    const wordmark = header.querySelector('.wordmark');
    root.classList.toggle('sections-compact', compact.matches);
    setMenu(false);
    if (compact.matches && (focused === wordmark || navigation.contains(focused))) menuToggle.focus({ preventScroll: true });
    else if (!compact.matches && focused === menuToggle) wordmark.focus({ preventScroll: true });
    settleMotion();
  }

  function placeTraveler(rect) {
    traveler.style.width = `${rect.width}px`;
    traveler.style.height = `${rect.height}px`;
    traveler.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
  }

  function cancelMotion() {
    animationId++;
    animations.forEach(animation => animation.cancel());
    animations = [];
    panels.forEach(panel => panel.classList.remove('is-leaving'));
    header.classList.remove('header-in-motion');
    main.removeAttribute('data-transitioning');
    transitionUntil = 0;
  }

  function settleMotion() {
    cancelMotion();
    fitHeader();
    measureViewport();
    placeTraveler(current === 0 ? heroMark.getBoundingClientRect() : dock.getBoundingClientRect());
    traveler.hidden = current === 0;
    heroMark.classList.toggle('hero-mark--traveling', current !== 0);
  }

  function animateChange(outgoing, incoming, outgoingStart, markStart, headerStart, direction) {
    const duration = 900;
    const easing = 'cubic-bezier(0.22, 0.75, 0.2, 1)';
    const travelEasing = 'cubic-bezier(0.4, 0, 0.2, 1)';
    const target = current === 0 ? heroMark.getBoundingClientRect() : dock.getBoundingClientRect();
    const headerEnd = header.getBoundingClientRect().height;
    const run = animationId;
    main.dataset.transitioning = 'true';
    transitionUntil = performance.now() + duration;
    outgoing.classList.add('is-leaving');
    animations.push(outgoing.animate([
      outgoingStart,
      { opacity: 0, filter: 'blur(3px)', transform: `translateY(${-direction * 10}px)` }
    ], { duration: 240, easing, fill: 'forwards' }));
    animations.push(incoming.animate([
      { opacity: 0, filter: 'blur(4px)', transform: `translateY(${direction * 10}px)` },
      { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0px)' }
    ], { delay: 260, duration: 520, easing, fill: 'both' }));
    animations.push(mist.animate([
      { opacity: 0, transform: 'translate(-3%, 2%) scale(0.96)', offset: 0 },
      { opacity: 0.6, transform: 'translate(0%, 0%) scale(1.02)', offset: 0.38 },
      { opacity: 0, transform: 'translate(4%, -3%) scale(1.08)', offset: 1 }
    ], { duration, easing: 'ease-in-out' }));

    heroMark.classList.add('hero-mark--traveling');
    traveler.hidden = false;
    placeTraveler(target);
    animations.push(traveler.animate([
      { transform: `translate(${markStart.left}px, ${markStart.top}px) scale(${markStart.width / target.width})` },
      { transform: `translate(${target.left}px, ${target.top}px) scale(1)` }
    ], { duration, easing: travelEasing, fill: 'both' }));
    if (Math.abs(headerStart - headerEnd) > 1) {
      header.classList.add('header-in-motion');
      animations.push(header.animate([
        { height: `${headerStart}px` }, { height: `${headerEnd}px` }
      ], { duration, easing: travelEasing, fill: 'both' }));
    }
    Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (run === animationId) settleMotion();
    });
  }

  function show(index, { history = true, focus = false, end = false, initial = false } = {}) {
    if (index < 0 || index >= panels.length) return false;
    const menuHadFocus = menuOpen && navigation.contains(document.activeElement);
    setMenu(false);
    const outgoing = panels[current];
    const incoming = panels[index];
    const changed = index !== current;
    const moveFocus = focus || menuHadFocus || (changed && outgoing.contains(document.activeElement));
    if (!changed && !initial) {
      incoming.scrollTop = 0;
      if (moveFocus) incoming.focus({ preventScroll: true });
      return false;
    }
    const markStart = (traveler.hidden ? heroMark : traveler).getBoundingClientRect();
    const headerStart = header.getBoundingClientRect().height;
    const style = getComputedStyle(outgoing);
    const outgoingStart = { opacity: style.opacity, filter: style.filter, transform: style.transform };
    const direction = index > current ? 1 : -1;
    cancelMotion();
    current = index;
    root.classList.toggle('brand-docked', index !== 0);
    fitHeader();
    measureViewport();
    incoming.inert = false;
    incoming.setAttribute('aria-hidden', 'false');
    incoming.classList.add('is-active');
    incoming.scrollTop = end && index !== 0 ? incoming.scrollHeight : 0;
    if (moveFocus) incoming.focus({ preventScroll: true });
    for (const panel of panels) {
      if (panel === incoming) continue;
      panel.inert = true;
      panel.setAttribute('aria-hidden', 'true');
      panel.classList.remove('is-active');
    }
    links.forEach((link, linkIndex) => {
      if (linkIndex + 1 === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    main.dataset.activeSection = sectionName(index);
    if (history && location.hash !== `#${sectionName(index)}`) {
      window.history.pushState(null, '', `#${sectionName(index)}`);
    }
    if (!initial) {
      status.textContent = index === 0 ? 'AEKR — introduction.' : `${links[index - 1].textContent.trim()}. Section ${index} of 6.`;
    }
    if (changed && !initial && !motion.matches) animateChange(outgoing, incoming, outgoingStart, markStart, headerStart, direction);
    else settleMotion();
    return changed;
  }

  panels.forEach(panel => {
    panel.classList.add('section-panel');
    panel.tabIndex = -1;
  });
  panels[0].setAttribute('aria-label', 'AEKR introduction');
  root.classList.add('sections-enabled');
  root.classList.toggle('sections-compact', compact.matches);
  setMenu(false);
  measureViewport();
  show(Math.max(0, indexForHash(location.hash)), { history: false, initial: true });
  window.history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const observer = new ResizeObserver(() => {
    fitHeader();
    measureViewport();
    if (!animations.length && current !== 0) placeTraveler(dock.getBoundingClientRect());
  });
  observer.observe(header);
  observer.observe(footer);
  observer.observe(menuToggle);
  observer.observe(header.querySelector('.header-cta'));
  window.addEventListener('resize', settleMotion, { passive: true });
  window.visualViewport?.addEventListener('resize', settleMotion, { passive: true });
  window.visualViewport?.addEventListener('scroll', measureViewport, { passive: true });
  motion.addEventListener('change', settleMotion);
  compact.addEventListener('change', updateCompact);
  menuToggle.addEventListener('click', () => setMenu(!menuOpen));

  document.addEventListener('focusin', event => {
    if (menuOpen && !header.contains(event.target) && !navigation.contains(event.target)) setMenu(false);
  });

  document.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const link = event.target.closest('a[href^="#"]');
    const index = link ? indexForHash(link.hash) : -1;
    if (index >= 0) {
      event.preventDefault();
      show(index, { focus: menuOpen || link.classList.contains('skip-link') || (compact.matches && navigation.contains(link)) });
    } else if (menuOpen && !navigation.contains(event.target) && !menuToggle.contains(event.target)) setMenu(false, true);
  });

  function followHistory() {
    const index = indexForHash(location.hash);
    if (index >= 0 && index !== current) show(index, { history: false });
  }
  window.addEventListener('popstate', followHistory);
  window.addEventListener('hashchange', followHistory);

  window.addEventListener('wheel', event => {
    if (menuOpen && !event.ctrlKey && !event.metaKey) {
      if (!navigation.contains(event.target)) event.preventDefault();
      return;
    }
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.target.closest(editable)) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
    if (navigation.contains(event.target) && navigation.scrollHeight > navigation.clientHeight) return;
    const now = performance.now();
    if (now - wheelTime > 180) {
      wheelSum = 0;
      wheelDirection = 0;
      wheelConsumed = false;
      wheelScrolled = false;
    }
    wheelTime = now;
    if (wheelConsumed || now < transitionUntil) {
      wheelConsumed = true;
      event.preventDefault();
      return;
    }
    const panel = panels[current];
    const direction = Math.sign(event.deltaY);
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? panel.clientHeight : 1);
    if (canScroll(panel, direction)) {
      wheelScrolled = true;
      wheelSum = 0;
      // A wheel over the fixed shell still scrolls the visible section.
      if (!panel.contains(event.target)) {
        event.preventDefault();
        panel.scrollTop += delta;
      }
      return;
    }
    event.preventDefault();
    // Reaching an inner scroll edge never spills momentum into another view.
    if (wheelScrolled) return;
    if (direction !== wheelDirection) wheelSum = 0;
    wheelDirection = direction;
    wheelSum += Math.abs(delta);
    if (wheelSum < 40) return;
    wheelConsumed = true;
    show(current + direction, { end: direction < 0 });
  }, { passive: false });

  document.addEventListener('keydown', event => {
    if (menuOpen) {
      if (event.key === 'Escape') { event.preventDefault(); setMenu(false, true); }
      return;
    }
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.target.closest(`${editable}, button`)) return;
    const direction = ['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey) ? 1
      : ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey) ? -1 : 0;
    if (!direction && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    if (keyConsumed || performance.now() < transitionUntil) return;
    if (!direction) {
      keyConsumed = true;
      show(event.key === 'Home' ? 0 : panels.length - 1, { focus: true });
      return;
    }
    const panel = panels[current];
    if (canScroll(panel, direction)) {
      const distance = event.key.startsWith('Arrow') ? 64 : panel.clientHeight * 0.85;
      panel.scrollTop += direction * distance;
      return;
    }
    keyConsumed = true;
    show(current + direction, { focus: true, end: direction < 0 });
  });
  document.addEventListener('keyup', () => { keyConsumed = false; });
  window.addEventListener('blur', () => { keyConsumed = false; touch = null; });

  document.addEventListener('touchstart', event => {
    touch = null;
    if (menuOpen || event.touches.length !== 1 || event.target.closest(controls)) return;
    const point = event.touches[0];
    touch = {
      x: point.clientX, y: point.clientY, index: current,
      top: !canScroll(panels[current], -1), bottom: !canScroll(panels[current], 1)
    };
  }, { passive: true });
  document.addEventListener('touchmove', event => {
    if (event.touches.length !== 1) touch = null;
  }, { passive: true });
  document.addEventListener('touchend', event => {
    const start = touch;
    touch = null;
    if (!start || !event.changedTouches.length || start.index !== current || performance.now() < transitionUntil) return;
    const point = event.changedTouches[0];
    const distance = start.y - point.clientY;
    if (Math.abs(distance) < 70 || Math.abs(distance) < Math.abs(point.clientX - start.x)) return;
    const direction = Math.sign(distance);
    if (direction > 0 ? start.bottom : start.top) show(current + direction, { end: direction < 0 });
  }, { passive: true });
  document.addEventListener('touchcancel', () => { touch = null; }, { passive: true });
})();

/* Hero storytelling shares selected-view state; it never drives navigation.
   Local glyph samples form/disperse through particles. The three-second reading
   phase is ordinary, stationary DOM text, with no animation frame scheduled. */
(() => {
  'use strict';
  const main = document.querySelector('main');
  const lede = document.querySelector('.hero .hero-lede');
  if (!lede || !window.IntersectionObserver || !window.ResizeObserver) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const phrases = [
    'An AI-native, human-orchestrated engineering practice.',
    'From ambiguous ideas to clear engineering direction.',
    'Engineering outcomes you can inspect, verify, and own.',
    'Architecture with intent. Delivery with control.',
    'Human-led decisions. Evidence at every step.',
    'Software you can understand, transfer, and own.',
  ];
  const story = document.createElement('div');
  story.className = 'hero-story';
  const lines = document.createElement('div');
  lines.className = 'hero-phrases';
  lines.setAttribute('aria-hidden', 'true');
  const spans = phrases.map(phrase => {
    const span = document.createElement('span');
    span.className = 'hero-phrase';
    span.textContent = phrase;
    lines.append(span);
    return span;
  });
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-particles';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.hidden = true;
  const mask = document.createElement('canvas');
  let context, sample;
  try {
    context = canvas.getContext('2d');
    sample = mask.getContext('2d', { willReadFrequently: true });
  } catch { /* A browser privacy/context restriction keeps the original prose. */ }
  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'hero-pause';
  pause.setAttribute('aria-label', 'Pause rotating introduction');
  pause.setAttribute('aria-pressed', 'false');
  story.append(lines, canvas, pause);
  lede.after(story);

  const padding = 32, frameInterval = 1000 / 30, maxPixels = 1500000;
  let index = 0, userPaused = false, inView = false, started = false;
  let failed = !context || !sample, dirty = true;
  let frame = 0, timer = 0, phaseStart = 0, lastDraw = 0;
  let width = 0, height = 0, ratio = 1, particles = [];
  let layoutWidth = lines.clientWidth, layoutHeight = lines.clientHeight;
  let layoutRatio = devicePixelRatio;
  const canRun = () => !failed && !motion.matches && !userPaused && !document.hidden && inView &&
    (!main.dataset.activeSection || main.dataset.activeSection === 'main') &&
    !main.hasAttribute('data-transitioning');

  function stopWork() {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    frame = timer = 0;
  }

  function readable(phase) {
    story.dataset.phase = phase;
    canvas.hidden = true;
    context?.clearRect(0, 0, width, height);
    spans.forEach((span, i) => span.classList.toggle('is-current', i === index));
  }

  function fallback() {
    failed = true;
    stopWork();
    readable('fallback');
    story.hidden = true;
    lede.classList.remove('visually-hidden');
    if (story.contains(document.activeElement)) main.querySelector('.hero').focus({ preventScroll: true });
  }

  function prepareParticles() {
    const box = story.getBoundingClientRect();
    width = Math.ceil(box.width + padding * 2);
    height = Math.ceil(box.height + padding * 2);
    const area = width * height;
    // Both backing stores together stay below 1.5 million pixels (6 MB RGBA).
    if (!area || area * 2 > maxPixels) return false;
    ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(maxPixels / area - 1));
    mask.width = width;
    mask.height = height;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    Object.assign(canvas.style, {
      width: `${width}px`, height: `${height}px`, left: `${-padding}px`, top: `${-padding}px`,
    });
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const style = getComputedStyle(spans[index]);
    sample.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    sample.fillStyle = '#fff';
    sample.textBaseline = 'alphabetic';
    if ('letterSpacing' in sample) sample.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
    const metrics = sample.measureText('Mg');
    if (!Number.isFinite(metrics.fontBoundingBoxAscent)) return false;

    // Range follows the browser's balanced wrapping and actual system font.
    // Drawing a complete line retains its kerning instead of guessing a wrap.
    const range = document.createRange(), rows = [];
    const node = spans[index].firstChild;
    for (let i = 0; i < node.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getBoundingClientRect();
      if (!rect.width) continue;
      let row = rows[rows.length - 1];
      if (!row || Math.abs(row.top - rect.top) > 2) {
        row = { text: '', left: rect.left, top: rect.top, height: rect.height };
        rows.push(row);
      }
      row.text += node.textContent[i];
    }
    for (const row of rows) {
      const baseline = row.top - box.top + padding + metrics.fontBoundingBoxAscent +
        (row.height - metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2;
      sample.fillText(row.text.trimEnd(), row.left - box.left + padding, baseline);
    }
    let pixels;
    try { pixels = sample.getImageData(0, 0, width, height).data; }
    catch { return false; }
    // Ignore tiny alpha perturbations; reject blocked/noisy readbacks rather
    // than turning browser privacy output into illegible animated text.
    const corners = [0, width - 1, width * (height - 1), area - 1];
    if (corners.some(point => pixels[point * 4 + 3] > 16)) return false;
    const targets = [];
    for (let y = padding; y < height - padding; y += 2) {
      for (let x = padding; x < width - padding; x += 2) {
        if (pixels[(y * width + x) * 4 + 3] > 128) targets.push({ x, y });
      }
    }
    if (targets.length < 40 || targets.length > area / 8) return false;
    sample.globalCompositeOperation = 'source-in';
    sample.fillStyle = style.color;
    sample.fillRect(0, 0, width, height);
    sample.globalCompositeOperation = 'source-over';
    const count = Math.min(1600, targets.length), previous = particles;
    particles = Array.from({ length: count }, (_, i) => {
      const target = targets[Math.floor(i * targets.length / count)];
      const old = previous[i % previous.length];
      return {
        x: target.x, y: target.y,
        fromX: old?.cloudX ?? padding + Math.random() * (width - padding * 2),
        fromY: old?.cloudY ?? height / 2 + (Math.random() - .5) * Math.min(height - 8, 100),
        cloudX: Math.max(4, Math.min(width - 4, target.x + (Math.random() - .5) * 160)),
        cloudY: Math.max(4, Math.min(height - 4, target.y + (Math.random() - .5) * 96)),
        bend: (Math.random() - .5) * 44, delay: Math.random() * .18,
      };
    });
    story.dataset.particleCount = String(count);
    dirty = false;
    return true;
  }

  function drawParticles(fraction) {
    context.clearRect(0, 0, width, height);
    const forming = story.dataset.phase === 'forming';
    const colors = ['#4dd6c0', '#6f8fae', '#9aa4b2'];
    // A short glyph-mask handoff closes the sampled grid's gaps before DOM
    // takes over; the inverse handoff releases the exact lettering into dust.
    const handoff = forming ? Math.max(0, (fraction * 1100 - 950) / 150) : Math.max(0, 1 - fraction * 1000 / 150);
    const maskAlpha = handoff * handoff * (3 - 2 * handoff);
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const progress = Math.max(0, Math.min(1, (fraction - particle.delay) / (1 - particle.delay)));
      const eased = progress * progress * (3 - 2 * progress);
      const startX = forming ? particle.fromX : particle.x;
      const startY = forming ? particle.fromY : particle.y;
      const endX = forming ? particle.x : particle.cloudX;
      const endY = forming ? particle.y : particle.cloudY;
      const curl = Math.sin(Math.PI * progress) * particle.bend;
      const x = startX + (endX - startX) * eased + curl;
      const y = startY + (endY - startY) * eased + curl * .65;
      const coherence = forming ? eased : 1 - eased;
      context.fillStyle = coherence > .85 ? colors[2] : colors[i % colors.length];
      context.globalAlpha = (.28 + coherence * .72) * (1 - maskAlpha);
      const size = 1.65 - coherence * .6;
      context.fillRect(x - size / 2, y - size / 2, size, size);
    }
    if (maskAlpha > 0) {
      context.globalAlpha = maskAlpha;
      context.drawImage(mask, 0, 0);
    }
    context.globalAlpha = 1;
  }

  function dwell() {
    stopWork();
    readable('dwell');
    timer = setTimeout(() => {
      timer = 0;
      if (canRun()) animate('dispersing');
      else sync();
    }, 3000);
  }

  function renderParticles(now) {
    frame = 0;
    if (!canRun()) { sync(); return; }
    const forming = story.dataset.phase === 'forming';
    const duration = forming ? 1100 : 1000;
    const elapsed = now - phaseStart;
    if (elapsed >= duration) {
      if (forming) dwell();
      else {
        drawParticles(1);
        index = (index + 1) % spans.length;
        dirty = true;
        animate('forming');
      }
      return;
    }
    if (now - lastDraw >= frameInterval) {
      drawParticles(elapsed / duration);
      lastDraw = now;
    }
    frame = requestAnimationFrame(renderParticles);
  }

  function animate(phase) {
    stopWork();
    if (dirty && !prepareParticles()) { fallback(); return; }
    spans.forEach((span, i) => span.classList.toggle('is-current', i === index));
    story.dataset.phase = phase;
    canvas.hidden = false;
    phaseStart = performance.now();
    lastDraw = phaseStart;
    drawParticles(0);
    frame = requestAnimationFrame(renderParticles);
  }

  function sync() {
    if (failed) { fallback(); return; }
    story.hidden = motion.matches;
    lede.classList.toggle('visually-hidden', !motion.matches);
    if (motion.matches || !canRun()) {
      stopWork();
      readable(motion.matches ? 'fallback' : 'paused');
      if (motion.matches && story.contains(document.activeElement)) main.querySelector('.hero').focus({ preventScroll: true });
      return;
    }
    if (frame || timer) return;
    if (!started) { started = true; animate('forming'); }
    else dwell();
  }

  function resize() {
    if (lines.clientWidth === layoutWidth && lines.clientHeight === layoutHeight && devicePixelRatio === layoutRatio) return;
    layoutWidth = lines.clientWidth;
    layoutHeight = lines.clientHeight;
    layoutRatio = devicePixelRatio;
    particles = [];
    dirty = true;
    stopWork();
    readable('paused');
    sync();
  }

  pause.addEventListener('click', () => {
    userPaused = !userPaused;
    pause.setAttribute('aria-pressed', String(userPaused));
    pause.setAttribute('aria-label', userPaused ? 'Resume rotating introduction' : 'Pause rotating introduction');
    sync();
  });
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }).observe(story);
  new MutationObserver(sync).observe(main, { attributes: true, attributeFilter: ['data-active-section', 'data-transitioning'] });
  new ResizeObserver(resize).observe(lines);
  window.addEventListener('resize', resize, { passive: true });
  document.fonts?.addEventListener('loadingdone', () => { dirty = true; stopWork(); sync(); });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  readable('paused');
  sync();
})();
