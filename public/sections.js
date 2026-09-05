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
      announce();
    }
    if (changed && !initial && !motion.matches) animateChange(outgoing, incoming, outgoingStart, markStart, headerStart, direction);
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
   Whole phrases use one browser animation, followed by a stationary three-second
   reading interval. The original prose remains the accessible/static fallback. */
(() => {
  'use strict';
  const main = document.querySelector('main');
  const lede = document.querySelector('.hero .hero-lede');
  if (!lede || !window.IntersectionObserver || !window.ResizeObserver || !Element.prototype.animate) return;
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
  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'hero-pause';
  pause.setAttribute('aria-label', text('Pause rotating introduction'));
  pause.setAttribute('aria-pressed', 'false');
  story.append(lines, pause);
  lede.after(story);

  let index = 0, userPaused = false, inView = false;
  let animation = null, timer = 0;
  let layoutWidth = lines.clientWidth, layoutHeight = lines.clientHeight;
  const canRun = () => !motion.matches && !userPaused && !document.hidden && inView &&
    (!main.dataset.activeSection || main.dataset.activeSection === 'main') &&
    !main.hasAttribute('data-transitioning');

  function stopWork() {
    clearTimeout(timer);
    timer = 0;
    animation?.cancel();
    animation = null;
  }

  function readable(phase) {
    story.dataset.phase = phase;
    spans.forEach((span, i) => span.classList.toggle('is-current', i === index));
  }

  function dwell() {
    stopWork();
    readable('dwell');
    timer = setTimeout(() => {
      timer = 0;
      if (canRun()) animate('leaving');
      else sync();
    }, 3000);
  }

  function animate(phase) {
    stopWork();
    readable(phase);
    const entering = phase === 'entering';
    const run = spans[index].animate(entering ? [
      { opacity: 0, transform: 'translateY(4px)' },
      { opacity: 1, transform: 'translateY(0px)' }
    ] : [
      { opacity: 1, transform: 'translateY(0px)' },
      { opacity: 0, transform: 'translateY(-2px)' }
    ], {
      duration: entering ? 400 : 240,
      easing: entering ? 'cubic-bezier(0, 0, .38, .9)' : 'cubic-bezier(.2, 0, 1, .9)',
      fill: 'both',
    });
    animation = run;
    run.finished.then(() => {
      if (animation !== run) return;
      animation = null;
      run.cancel();
      if (!canRun()) { sync(); return; }
      if (entering) dwell();
      else {
        index = (index + 1) % spans.length;
        animate('entering');
      }
    }, () => { /* Cancellation leaves the current phrase readable via sync. */ });
  }

  function sync() {
    story.hidden = motion.matches;
    lede.classList.toggle('visually-hidden', !motion.matches);
    if (!canRun()) {
      stopWork();
      readable(motion.matches ? 'fallback' : 'paused');
      if (motion.matches && story.contains(document.activeElement)) main.querySelector('.hero').focus({ preventScroll: true });
      return;
    }
    if (!animation && !timer) dwell();
  }

  function reset() {
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
  new ResizeObserver(() => {
    if (lines.clientWidth === layoutWidth && lines.clientHeight === layoutHeight) return;
    layoutWidth = lines.clientWidth;
    layoutHeight = lines.clientHeight;
    reset();
  }).observe(lines);
  window.addEventListener('resize', reset, { passive: true });
  document.fonts?.addEventListener('loadingdone', reset);
  document.addEventListener('aekr:languagechange', () => {
    spans.forEach((span, i) => { span.textContent = text(phrases[i]); });
    pause.setAttribute('aria-label', text(userPaused ? 'Resume rotating introduction' : 'Pause rotating introduction'));
    reset();
  });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  readable('paused');
  sync();
})();
