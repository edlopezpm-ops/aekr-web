/* Progressive section navigation. The document remains a normal page if this
   controller is unavailable; the atmosphere and contact form own their events. */
(() => {
  const root = document.documentElement;
  const main = document.querySelector('main');
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  const navigation = document.querySelector('.section-nav');
  const status = document.querySelector('.section-status');
  const heroMark = document.querySelector('.hero-mark');
  const dock = document.querySelector('.brand-dock');
  const atmosphere = document.querySelector('.atmosphere');
  const panels = Array.from(main?.querySelectorAll(':scope > section') || []);
  const links = Array.from(navigation?.querySelectorAll('a') || []);
  if (!main || !header || !footer || !status || !heroMark || !dock || !atmosphere || panels.length !== 7 || links.length !== 6) return;
  if (typeof ResizeObserver !== 'function' || !('inert' in HTMLElement.prototype) || !Element.prototype.animate) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
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
    const wordmark = header.querySelector('.wordmark').getBoundingClientRect();
    const contact = header.querySelector('.header-cta').getBoundingClientRect();
    root.classList.toggle('brand-header-wrapped', current !== 0 && (wordmark.right + 12 > mark.left || contact.left - 12 < mark.right));
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
    const outgoing = panels[current];
    const incoming = panels[index];
    const changed = index !== current;
    const moveFocus = focus || (changed && outgoing.contains(document.activeElement));
    if (!changed && !initial) {
      incoming.scrollTop = 0;
      if (focus) incoming.focus({ preventScroll: true });
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
  window.addEventListener('resize', settleMotion, { passive: true });
  window.visualViewport?.addEventListener('resize', settleMotion, { passive: true });
  window.visualViewport?.addEventListener('scroll', measureViewport, { passive: true });
  motion.addEventListener('change', settleMotion);

  document.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const index = indexForHash(link.hash);
    if (index < 0) return;
    event.preventDefault();
    show(index, { focus: link.classList.contains('skip-link') });
  });

  function followHistory() {
    const index = indexForHash(location.hash);
    if (index >= 0 && index !== current) show(index, { history: false });
  }
  window.addEventListener('popstate', followHistory);
  window.addEventListener('hashchange', followHistory);

  window.addEventListener('wheel', event => {
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
    if (event.touches.length !== 1 || event.target.closest(controls)) return;
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
