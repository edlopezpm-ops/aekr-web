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
  const languageControl = document.querySelector('.language-control');
  const text = value => window.AEKRLanguage?.text(value) || value;
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

  // A local, disposable 2D layer samples the existing official bitmap. It never
  // starts a delayed journey when image decoding or a browser context fails.
  const brandCanvas = document.createElement('canvas');
  brandCanvas.className = 'brand-particles';
  brandCanvas.setAttribute('aria-hidden', 'true');
  brandCanvas.hidden = true;
  document.body.append(brandCanvas);
  const brandMask = document.createElement('canvas');
  brandMask.className = 'brand-mask';
  let brandContext, brandSample;
  try {
    brandContext = brandCanvas.getContext('2d');
    brandSample = brandMask.getContext('2d', { willReadFrequently: true });
  } catch { /* Bitmap travel remains available when Canvas is restricted. */ }
  let brandPoints = null, brandFailed = !brandContext || !brandSample;
  let brandJourney = null, brandFrame = 0;
  const unit = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = unit(value); return t * t * (3 - 2 * t); };

  function sampleBrand() {
    if (brandFailed || !heroMark.complete || !heroMark.naturalWidth) return false;
    if (brandPoints) return true;
    brandMask.width = brandMask.height = 225;
    try {
      brandSample.drawImage(heroMark, 0, 0, 225, 225);
      const pixels = brandSample.getImageData(0, 0, 225, 225).data;
      if ([0, 224, 225 * 224, 225 * 225 - 1].some(point => pixels[point * 4 + 3] > 16)) throw new Error('Mask unavailable');
      const points = [];
      for (let y = 0; y < 225; y += 2) {
        for (let x = 0; x < 225; x += 2) {
          const offset = (y * 225 + x) * 4;
          if (pixels[offset + 3] > 100) points.push({
            x: x / 225 - .5, y: y / 225 - .5,
            color: `rgb(${pixels[offset]}, ${pixels[offset + 1]}, ${pixels[offset + 2]})`,
            alpha: pixels[offset + 3] / 255,
          });
        }
      }
      if (points.length < 40 || points.length > 8000) throw new Error('Mask unavailable');
      // Reuse the sampled mask as a tiny radial-sprite atlas. Each palette
      // entry keeps a sampled bitmap color; no additional backing store exists.
      brandSample.clearRect(0, 0, 225, 225);
      const palette = new Map();
      for (const point of points) {
        const channels = point.color.match(/\d+/g).map(Number);
        const key = channels.map(channel => Math.round(channel / 64)).join(',');
        if (!palette.has(key)) {
          const slot = palette.size, x = slot % 14 * 16, y = Math.floor(slot / 14) * 16;
          const gradient = brandSample.createRadialGradient(x + 8, y + 8, 0, x + 8, y + 8, 8);
          gradient.addColorStop(0, point.color);
          gradient.addColorStop(.2, point.color);
          gradient.addColorStop(1, 'transparent');
          brandSample.fillStyle = gradient;
          brandSample.fillRect(x, y, 16, 16);
          palette.set(key, { x, y });
        }
        point.sprite = palette.get(key);
      }
      brandPoints = points;
      return true;
    } catch {
      brandFailed = true;
      return false;
    }
  }

  function cancelBrand() {
    cancelAnimationFrame(brandFrame);
    brandFrame = 0;
    brandJourney = null;
    brandCanvas.hidden = true;
    // Release the journey's backing store; no drawing work exists while docked.
    brandCanvas.width = brandCanvas.height = 1;
  }

  function finishBrand() {
    cancelBrand();
    placeTraveler(current === 0 ? heroMark.getBoundingClientRect() : dock.getBoundingClientRect());
    traveler.hidden = current === 0;
    heroMark.classList.toggle('hero-mark--traveling', current !== 0);
  }

  function startBrand(from, to, snapshot) {
    if (!sampleBrand() || !from.width || !to.width) return false;
    if (from.top + from.height < 0 || from.top > innerHeight) return false;
    const halo = compact.matches ? 40 : 64;
    const prior = snapshot?.positions || [];
    const left = Math.max(0, Math.floor(Math.min(from.left, to.left, ...prior.map(point => point.x)) - halo));
    const top = Math.max(0, Math.floor(Math.min(from.top, to.top, ...prior.map(point => point.y)) - halo));
    const right = Math.min(innerWidth, Math.ceil(Math.max(from.left + from.width, to.left + to.width, ...prior.map(point => point.x)) + halo));
    const bottom = Math.min(innerHeight, Math.ceil(Math.max(from.top + from.height, to.top + to.height, ...prior.map(point => point.y)) + halo));
    const width = right - left, height = bottom - top, area = width * height;
    const available = 900000 - 225 * 225;
    if (width <= 0 || height <= 0 || area > available) return false;
    const ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(available / area));
    brandCanvas.width = Math.floor(width * ratio);
    brandCanvas.height = Math.floor(height * ratio);
    Object.assign(brandCanvas.style, {
      left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`,
    });
    brandContext.setTransform(ratio, 0, 0, ratio, -left * ratio, -top * ratio);
    const count = Math.min(compact.matches ? 600 : 900, brandPoints.length);
    const points = Array.from({ length: count }, (_, i) => ({
      ...brandPoints[Math.floor(i * brandPoints.length / count)],
      lag: Math.random() - .5, curl: Math.random() * Math.PI * 2,
      spread: 6 + Math.random() * 12,
    }));
    brandJourney = {
      from, to, home: current === 0, start: performance.now(), lastDraw: 0,
      rect: from, positions: prior, snapshot, points, left, top, width, height,
      bend: (Math.random() > .5 ? 1 : -1) * (compact.matches ? 20 : 34),
    };
    brandCanvas.hidden = false;
    renderBrand(brandJourney.start);
    return true;
  }

  function renderBrand(now) {
    brandFrame = 0;
    const journey = brandJourney;
    if (!journey) return;
    const elapsed = now - journey.start;
    if (document.hidden || motion.matches || elapsed >= 1500) { finishBrand(); return; }
    if (now - journey.lastDraw >= 1000 / 30 || !journey.lastDraw) {
      journey.lastDraw = now;
      const { from, to, points, snapshot, left, top, width, height } = journey;
      brandContext.clearRect(left, top, width, height);
      const travel = smooth((elapsed - 300) / 800);
      const forming = smooth((elapsed - 1100) / 400);
      const atomize = smooth(elapsed / 300);
      const shape = 1 - atomize + forming;
      const sourceAlpha = snapshot ? 0 : 1 - atomize;
      const targetAlpha = smooth((elapsed - 1300) / 200);
      const startX = from.left + from.width / 2, startY = from.top + from.height / 2;
      const endX = to.left + to.width / 2, endY = to.top + to.height / 2;
      const dx = endX - startX, dy = endY - startY, distance = Math.hypot(dx, dy) || 1;
      const normalX = -dy / distance, normalY = dx / distance;
      const size = from.width + (to.width - from.width) * travel;
      journey.rect = { left: startX + dx * travel - size / 2, top: startY + dy * travel - size / 2, width: size, height: size };
      if (sourceAlpha) {
        brandContext.globalAlpha = sourceAlpha;
        brandContext.drawImage(heroMark, from.left, from.top, from.width, from.height);
      }
      journey.positions = points.map((point, i) => {
        const flow = unit(travel + Math.sin(Math.PI * travel) * point.lag * .45);
        const wave = Math.sin(Math.PI * flow) * (journey.bend + Math.sin(flow * Math.PI * 2 + point.curl) * point.spread);
        let x = startX + dx * flow + normalX * wave + point.x * size * shape;
        let y = startY + dy * flow + normalY * wave + point.y * size * shape;
        const prior = snapshot?.positions[i % snapshot.positions.length];
        let alpha = (snapshot ? 1 : atomize) * (1 - targetAlpha) * (.16 + shape * .84) * point.alpha;
        if (prior && elapsed < 300) {
          x = prior.x + (x - prior.x) * atomize;
          y = prior.y + (y - prior.y) * atomize;
          alpha = prior.alpha + (alpha - prior.alpha) * atomize;
        }
        alpha *= smooth(Math.min(x - left, left + width - x, y - top, top + height - y) / 16);
        brandContext.globalAlpha = alpha;
        const radius = 1.15 + (1 - shape) * 1.3;
        brandContext.drawImage(brandMask, point.sprite.x, point.sprite.y, 16, 16,
          x - radius, y - radius, radius * 2, radius * 2);
        return { x, y, alpha };
      });
      if (targetAlpha) {
        brandContext.globalAlpha = targetAlpha;
        brandContext.drawImage(heroMark, to.left, to.top, to.width, to.height);
      }
      brandContext.globalAlpha = 1;
    }
    brandFrame = requestAnimationFrame(renderBrand);
  }

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
    const rightEdge = languageControl?.parentElement === header
      ? Math.min(contact.left, languageControl.getBoundingClientRect().left) : contact.left;
    root.classList.toggle('brand-header-wrapped', current !== 0 && (left.right + 12 > mark.left || rightEdge - 12 < mark.right));
  }

  function setMenu(open, returnFocus = false) {
    menuOpen = compact.matches && open;
    menuToggle.setAttribute('aria-expanded', String(menuOpen));
    navigation.hidden = compact.matches && !menuOpen;
    navigation.inert = navigation.hidden;
    if (returnFocus) menuToggle.focus({ preventScroll: true });
  }

  function moveLanguageControl() {
    if (!languageControl) return;
    if (compact.matches) navigation.prepend(languageControl);
    else header.insertBefore(languageControl, header.querySelector('.header-cta'));
  }

  function updateCompact() {
    const focused = document.activeElement;
    const wordmark = header.querySelector('.wordmark');
    const languageFocused = languageControl?.contains(focused);
    root.classList.toggle('sections-compact', compact.matches);
    moveLanguageControl();
    setMenu(false);
    if (compact.matches && (focused === wordmark || navigation.contains(focused) || languageFocused)) menuToggle.focus({ preventScroll: true });
    else if (!compact.matches && focused === menuToggle) wordmark.focus({ preventScroll: true });
    else if (languageFocused) focused.focus({ preventScroll: true });
    settleMotion();
  }

  function placeTraveler(rect) {
    traveler.style.width = `${rect.width}px`;
    traveler.style.height = `${rect.height}px`;
    traveler.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
  }

  function cancelMotion(keepBrand = false) {
    if (!keepBrand) cancelBrand();
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

  function animateChange(outgoing, incoming, outgoingStart, markStart, headerStart, direction, brandMove) {
    const duration = 1500;
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
      { opacity: 0, filter: 'blur(3px)', transform: `translateY(${-direction * 8}px)` }
    ], { duration: 460, easing, fill: 'forwards' }));
    animations.push(incoming.animate([
      { opacity: 0, filter: 'blur(3px)', transform: `translateY(${direction * 8}px)` },
      { opacity: 1, filter: 'blur(0px)', transform: `translateY(${-direction * 1.5}px)`, offset: .85 },
      { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0px)' }
    ], { delay: 460, duration: 820, easing, fill: 'both' }));
    mist.style.setProperty('--mist-x', `${22 + Math.random() * 18}%`);
    mist.style.setProperty('--mist-y', `${55 + Math.random() * 18}%`);
    animations.push(mist.animate([
      { opacity: 0, transform: 'translate(-3%, 2%) scale(0.96)', offset: 0 },
      { opacity: 0.38, transform: 'translate(0%, 0%) scale(1.02)', offset: 0.38 },
      { opacity: 0, transform: 'translate(4%, -3%) scale(1.08)', offset: 1 }
    ], { duration, easing: 'ease-in-out' }));

    heroMark.classList.add('hero-mark--traveling');
    if (!brandMove.keep) {
      placeTraveler(target);
      traveler.hidden = false;
      if (brandMove.move && startBrand(markStart, target, brandMove.snapshot)) {
        traveler.hidden = true;
      } else if (brandMove.move) {
        animations.push(traveler.animate([
          { transform: `translate(${markStart.left}px, ${markStart.top}px) scale(${markStart.width / target.width})` },
          { transform: `translate(${target.left}px, ${target.top}px) scale(1)` }
        ], { duration, easing: travelEasing, fill: 'both' }));
      }
    }
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
    const brandMove = {
      move: (current === 0) !== (index === 0) || !!brandJourney,
      keep: !!brandJourney && brandJourney.home === (index === 0),
      snapshot: brandJourney ? { positions: brandJourney.positions, rect: brandJourney.rect } : null,
    };
    const markStart = brandJourney?.rect || (traveler.hidden ? heroMark : traveler).getBoundingClientRect();
    const headerStart = header.getBoundingClientRect().height;
    const style = getComputedStyle(outgoing);
    const outgoingStart = { opacity: style.opacity, filter: style.filter, transform: style.transform };
    const direction = index > current ? 1 : -1;
    cancelMotion(brandMove.keep);
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
      announce();
    }
    if (changed && !initial && !motion.matches) animateChange(outgoing, incoming, outgoingStart, markStart, headerStart, direction, brandMove);
    else settleMotion();
    return changed;
  }

  function announce() {
    status.textContent = current === 0 ? text('AEKR — introduction.')
      : `${links[current - 1].textContent.trim()}. ${text('Section')} ${current} ${text('of')} 6.`;
  }

  panels.forEach(panel => {
    panel.classList.add('section-panel');
    panel.tabIndex = -1;
  });
  panels[0].setAttribute('aria-label', text('AEKR introduction'));
  root.classList.add('sections-enabled');
  root.classList.toggle('sections-compact', compact.matches);
  moveLanguageControl();
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
  if (languageControl) observer.observe(languageControl);
  window.addEventListener('resize', settleMotion, { passive: true });
  window.visualViewport?.addEventListener('resize', settleMotion, { passive: true });
  window.visualViewport?.addEventListener('scroll', measureViewport, { passive: true });
  motion.addEventListener('change', settleMotion);
  document.addEventListener('visibilitychange', () => { if (document.hidden) settleMotion(); });
  document.addEventListener('aekr:languagechange', () => {
    panels[0].setAttribute('aria-label', text('AEKR introduction'));
    announce();
    settleMotion();
  });
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
  const text = value => window.AEKRLanguage?.text(value) || value;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const phrases = [
    'An AI-native, human-orchestrated engineering practice.',
    'Humans orchestrate. Machines execute.',
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
    span.textContent = text(phrase);
    lines.append(span);
    return span;
  });
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-particles';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.hidden = true;
  const mask = document.createElement('canvas');
  mask.className = 'hero-particle-mask';
  let context, sample;
  try {
    context = canvas.getContext('2d');
    sample = mask.getContext('2d', { willReadFrequently: true });
  } catch { /* A browser privacy/context restriction keeps the original prose. */ }
  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'hero-pause';
  pause.setAttribute('aria-label', text('Pause rotating introduction'));
  pause.setAttribute('aria-pressed', 'false');
  story.append(lines, canvas, pause);
  lede.after(story);

  const frameInterval = 1000 / 30, maxPixels = 1500000;
  let index = 0, userPaused = false, inView = false, started = false;
  let failed = !context || !sample, dirty = true;
  let frame = 0, timer = 0, phaseStart = 0, lastDraw = 0;
  let width = 0, height = 0, ratio = 1, particles = [];
  let featherTop = 0, featherBottom = 0, pauseBounds = null;
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
    const lettering = lines.getBoundingClientRect();
    const halo = Math.min(96, Math.max(48, lettering.width * .14));
    const left = Math.max(0, Math.floor(lettering.left - halo));
    const right = Math.min(innerWidth, Math.ceil(lettering.right + halo));
    const top = lettering.top - halo;
    width = right - left;
    height = Math.ceil(lettering.height + halo * 2);
    // Keep the broad lateral cloud, but let it disappear before adjacent copy
    // and controls. Geometry follows the actual compact/landscape arrangement.
    const eyebrow = main.querySelector('.hero .eyebrow').getBoundingClientRect();
    const pauseBox = pause.getBoundingClientRect();
    pauseBounds = {
      left: pauseBox.left - left - 2, right: pauseBox.right - left + 2,
      top: pauseBox.top - top - 2, bottom: pauseBox.bottom - top + 2,
    };
    const cta = main.querySelector('.hero .cta-row').getBoundingClientRect();
    const overlaps = rect => rect.right > lettering.left && rect.left < lettering.right;
    const panel = main.getBoundingClientRect();
    const above = Math.max(panel.top + 4,
      overlaps(eyebrow) && eyebrow.bottom <= lettering.top ? eyebrow.bottom + 8 : top);
    let below = Math.min(top + height, panel.bottom - 4);
    for (const rect of [pauseBox, cta]) {
      if (overlaps(rect) && rect.top >= lettering.bottom) below = Math.min(below, rect.top - 3);
    }
    featherTop = Math.max(0, above - top);
    featherBottom = Math.min(height, below - top);
    const area = width * height;
    // Both backing stores together stay below 1.5 million pixels (6 MB RGBA).
    if (!area || area * 2 > maxPixels) return false;
    ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(maxPixels / area - 1));
    mask.width = width;
    mask.height = height;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    Object.assign(canvas.style, {
      width: `${width}px`, height: `${height}px`, left: `${left - box.left}px`, top: `${top - box.top}px`,
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
      const baseline = row.top - top + metrics.fontBoundingBoxAscent +
        (row.height - metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2;
      sample.fillText(row.text.trimEnd(), row.left - left, baseline);
    }
    let pixels;
    try { pixels = sample.getImageData(0, 0, width, height).data; }
    catch { return false; }
    // Ignore tiny alpha perturbations; reject blocked/noisy readbacks rather
    // than turning browser privacy output into illegible animated text.
    const corners = [0, width - 1, width * (height - 1), area - 1];
    if (corners.some(point => pixels[point * 4 + 3] > 16)) return false;
    const targets = [];
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if (pixels[(y * width + x) * 4 + 3] > 128) targets.push({ x, y });
      }
    }
    if (targets.length < 40 || targets.length > area / 8) return false;
    sample.globalCompositeOperation = 'source-in';
    sample.fillStyle = style.color;
    sample.fillRect(0, 0, width, height);
    sample.globalCompositeOperation = 'source-over';
    const count = Math.min(1600, targets.length), previous = particles;
    // Each cycle has a few correlated, oblique clouds rather than independent
    // uniform coordinates. Outlying samples fade at the viewport, never clamp.
    const lobes = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => ({
      x: width * (.22 + Math.random() * .56),
      y: height * (.25 + Math.random() * .5),
      angle: (Math.random() - .5) * 1.8,
      major: width * (.2 + Math.random() * .13),
      minor: Math.min(height * .28, 30 + Math.random() * 32),
    }));
    const cloudPoint = () => {
      const lobe = lobes[Math.floor(Math.random() * lobes.length)];
      const u = (Math.random() + Math.random() + Math.random() - 1.5) * lobe.major;
      const v = (Math.random() + Math.random() + Math.random() - 1.5) * lobe.minor;
      return { x: lobe.x + u * Math.cos(lobe.angle) - v * Math.sin(lobe.angle),
        y: lobe.y + u * Math.sin(lobe.angle) + v * Math.cos(lobe.angle) };
    };
    particles = Array.from({ length: count }, (_, i) => {
      const target = targets[Math.floor(i * targets.length / count)];
      const old = previous[i % previous.length], from = cloudPoint(), cloud = cloudPoint();
      return {
        x: target.x, y: target.y,
        fromX: old?.cloudX ?? from.x, fromY: old?.cloudY ?? from.y,
        cloudX: cloud.x, cloudY: cloud.y,
        bend: (Math.random() - .5) * 66, angle: Math.random() * Math.PI * 2,
        delay: Math.random() * .18, alpha: .08 + Math.random() * .12,
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
    const handoff = forming ? Math.max(0, (fraction * 1400 - 1200) / 200) : Math.max(0, 1 - fraction * 1300 / 200);
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
      const x = startX + (endX - startX) * eased + curl * Math.cos(particle.angle);
      const y = startY + (endY - startY) * eased + curl * Math.sin(particle.angle);
      const coherence = forming ? eased : 1 - eased;
      context.fillStyle = coherence > .85 ? colors[2] : colors[i % colors.length];
      const edge = Math.max(0, Math.min(1,
        x / 24, (width - x) / 24, (y - featherTop) / 20, (featherBottom - y) / 20));
      const feather = edge * edge * (3 - 2 * edge);
      // Pause sits beside the text on desktop. Fade around its actual target,
      // including the particle radius, as well as around the vertical neighbors.
      const pauseDistance = Math.hypot(
        Math.max(pauseBounds.left - x, 0, x - pauseBounds.right),
        Math.max(pauseBounds.top - y, 0, y - pauseBounds.bottom));
      const pauseEdge = Math.min(1, pauseDistance / 18);
      const pauseFeather = pauseEdge * pauseEdge * (3 - 2 * pauseEdge);
      context.globalAlpha = (particle.alpha + coherence * (1 - particle.alpha)) * (1 - maskAlpha) * feather * pauseFeather;
      const radius = 1.1 - coherence * .55;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
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
    const duration = forming ? 1400 : 1300;
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
    pause.setAttribute('aria-label', text(userPaused ? 'Resume rotating introduction' : 'Pause rotating introduction'));
    sync();
  });
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }).observe(story);
  new MutationObserver(sync).observe(main, { attributes: true, attributeFilter: ['data-active-section', 'data-transitioning'] });
  new ResizeObserver(resize).observe(lines);
  window.addEventListener('resize', resize, { passive: true });
  document.fonts?.addEventListener('loadingdone', () => { dirty = true; stopWork(); sync(); });
  document.addEventListener('aekr:languagechange', () => {
    stopWork();
    spans.forEach((span, i) => { span.textContent = text(phrases[i]); });
    pause.setAttribute('aria-label', text(userPaused ? 'Resume rotating introduction' : 'Pause rotating introduction'));
    particles = [];
    dirty = true;
    readable('paused');
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  readable('paused');
  sync();
})();
