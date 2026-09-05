/* Progressive section navigation. The document remains a normal page if this
   controller is unavailable; the atmosphere and contact form own their events. */
(() => {
  const root = document.documentElement;
  const main = document.querySelector('main');
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  const navigation = document.querySelector('.section-nav');
  const status = document.querySelector('.section-status');
  const panels = Array.from(main?.querySelectorAll(':scope > section') || []);
  const links = Array.from(navigation?.querySelectorAll('a') || []);
  if (!main || !header || !footer || !status || panels.length !== 7 || links.length !== 6) return;
  if (typeof ResizeObserver !== 'function' || !('inert' in HTMLElement.prototype)) return;

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

  function show(index, { history = true, focus = false, end = false, initial = false } = {}) {
    if (index < 0 || index >= panels.length) return false;
    const outgoing = panels[current];
    const incoming = panels[index];
    const changed = index !== current;
    const moveFocus = focus || (changed && outgoing.contains(document.activeElement));
    current = index;
    incoming.inert = false;
    incoming.setAttribute('aria-hidden', 'false');
    incoming.classList.add('is-active');
    incoming.scrollTop = end ? incoming.scrollHeight : 0;
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
      if (changed) transitionUntil = performance.now() + (motion.matches ? 0 : 420);
    }
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

  const observer = new ResizeObserver(measureViewport);
  observer.observe(header);
  observer.observe(footer);
  window.addEventListener('resize', measureViewport, { passive: true });
  window.visualViewport?.addEventListener('resize', measureViewport, { passive: true });
  window.visualViewport?.addEventListener('scroll', measureViewport, { passive: true });

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
