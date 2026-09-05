// Real browser behavior checks. Uses an existing Playwright installation; the
// site itself and its default repository checks remain dependency-free.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ids = ['main', 'practice', 'orchestration', 'lifecycle', 'engagements', 'why', 'contact'];
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };
let server;
let base = process.env.SITE_URL;
if (!base) {
  server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const relative = decodeURIComponent(url.pathname).slice(1) || 'index.html';
      const target = path.resolve(root, 'public', relative);
      if (!target.startsWith(path.join(root, 'public') + path.sep)) throw new Error('Invalid path');
      res.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
      res.end(await readFile(target));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
}
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const errors = [];
const shots = process.env.SCREENSHOT_DIR;
if (shots) await mkdir(shots, { recursive: true });
async function open(options = {}, hash = '', sources = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  // Never deliver real email, including when SITE_URL points at production.
  await page.route('**/*', route => {
    const pathname = new URL(route.request().url()).pathname;
    const fixtureName = pathname.slice(1) || 'index.html';
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false}' });
    }
    if (sources[fixtureName]) {
      return route.fulfill({ contentType: mime[path.extname(fixtureName)] || 'text/html', body: sources[fixtureName] });
    }
    return route.continue();
  });
  await page.goto(base + '/' + hash);
  return page;
}
async function active(page, id) {
  await page.waitForFunction(id => document.querySelector('main').dataset.activeSection === id, id);
  await page.waitForFunction(() => document.querySelector('main').dataset.transitioning !== 'true');
  await page.waitForTimeout(60);
  const state = await page.evaluate(() => {
    const panels = [...document.querySelectorAll('.section-panel')];
    return { visible: panels.filter(p => p.classList.contains('is-active')).length,
      accessible: panels.filter(p => !p.inert && p.getAttribute('aria-hidden') !== 'true').length,
      current: document.querySelector('.section-nav [aria-current]')?.hash || null };
  });
  assert.equal(state.visible, 1); assert.equal(state.accessible, 1);
  assert.equal(state.current, id === 'main' ? null : '#' + id);
}
async function go(page, id) {
  await page.locator(id === 'main' ? '.wordmark' : `.section-nav a[href="#${id}"]`).click();
  await active(page, id);
}
async function edge(page, bottom) {
  await page.locator('.section-panel.is-active').evaluate((p, bottom) => { p.scrollTop = bottom ? p.scrollHeight : 0; }, bottom);
  await page.waitForTimeout(300);
}
async function geometry(page) {
  const result = await page.evaluate(() => {
    const p = document.querySelector('.section-panel.is-active').getBoundingClientRect();
    const f = document.querySelector('.site-footer').getBoundingClientRect();
    const h = document.querySelector('.site-header').getBoundingClientRect();
    return { width: innerWidth, height: innerHeight, pageWidth: document.documentElement.scrollWidth,
      pageScroll: document.scrollingElement.scrollTop, panel: { top: p.top, bottom: p.bottom, width: p.width, height: p.height },
      innerWidth: document.querySelector('.section-panel.is-active').clientWidth,
      contentWidth: document.querySelector('.section-panel.is-active').scrollWidth,
      footer: { top: f.top, bottom: f.bottom }, headerBottom: h.bottom,
      scrollbar: getComputedStyle(document.querySelector('.section-panel.is-active')).scrollbarWidth,
      controls: [...document.querySelectorAll('.wordmark, .header-cta, .section-nav a, .brand-dock')]
        .filter(el => getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none').map(el => {
        const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      }),
      copyright: document.querySelector('.footer-legal').textContent.trim() };
  });
  assert(result.pageWidth <= result.width + 1, 'No horizontal document overflow');
  assert(result.contentWidth <= result.innerWidth + 1, 'No hidden horizontal clipping inside a section');
  assert.equal(result.pageScroll, 0, 'The viewport stays stationary');
  assert(result.panel.top >= result.headerBottom - 1, 'Header does not cover content');
  assert(result.panel.bottom <= result.footer.top + 1, 'Footer does not cover content');
  assert(result.panel.height > 40, 'Usable content viewport');
  assert(result.footer.bottom <= result.height + 1, 'Footer fits viewport');
  assert(result.controls.every(r => r.left >= 0 && r.right <= result.width + 1 && r.top >= 0 && r.bottom <= result.height + 1),
    'Fixed navigation controls remain inside the viewport');
  assert.equal(result.scrollbar, 'none'); assert.equal(result.copyright, '© 2026');
}

async function brandFrame(page) {
  return page.evaluate(() => {
    const box = el => {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      return { x: r.x, y: r.y, width: r.width, height: r.height, cx: r.x + r.width / 2,
        cy: r.y + r.height / 2, opacity: Number(s.opacity), visible: el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) };
    };
    return { hero: box(document.querySelector('.hero-mark')), traveler: box(document.querySelector('.brand-traveler')),
      dock: box(document.querySelector('.brand-dock')), header: box(document.querySelector('.site-header')),
      docked: document.documentElement.classList.contains('brand-docked'), width: innerWidth,
      transitioning: document.querySelector('main').dataset.transitioning === 'true' };
  });
}

async function brandJourney(page, label) {
  await go(page, 'main');
  const home = await brandFrame(page);
  assert(home.hero.visible && !home.traveler.visible, 'Home presents one original symbol');
  await page.locator('.section-nav a[href="#practice"]').click();
  await page.waitForTimeout(180);
  const moving = await brandFrame(page);
  assert(moving.transitioning && moving.traveler.visible && !moving.hero.visible, 'One crisp symbol remains visible in flight');
  assert(moving.traveler.opacity > .99, 'The traveling symbol does not fade');
  assert(Math.abs(moving.traveler.cy - home.hero.cy) > 2, 'Symbol actually leaves its hero position');
  if (shots) await page.screenshot({ path: path.join(shots, `${label}-outbound.png`) });
  await active(page, 'practice');
  const docked = await brandFrame(page);
  assert(docked.docked && docked.traveler.visible && !docked.hero.visible);
  assert(Math.abs(docked.traveler.cx - docked.width / 2) <= 1, 'Symbol docks at viewport center');
  assert(Math.abs(docked.traveler.cy - docked.dock.cy) <= 1, 'Symbol meets the real header anchor');
  assert(docked.header.height > home.header.height + 8, 'Header grows when leaving home');
  await go(page, 'orchestration');
  const stable = await brandFrame(page);
  assert(Math.abs(stable.header.height - docked.header.height) <= 1, 'Header remains expanded between content views');
  assert(Math.abs(stable.traveler.cy - docked.traveler.cy) <= 1, 'Docked symbol stays put between sections');
  await page.locator('.brand-dock').click();
  await page.waitForTimeout(180);
  const returning = await brandFrame(page);
  assert(returning.traveler.visible && returning.traveler.opacity > .99, 'Return journey keeps the symbol visible');
  assert(Math.abs(returning.traveler.cy - stable.traveler.cy) > 2, 'Symbol actually travels back');
  if (shots) await page.screenshot({ path: path.join(shots, `${label}-return.png`) });
  await active(page, 'main');
  const restored = await brandFrame(page);
  assert(!restored.docked && restored.hero.visible && !restored.traveler.visible);
  assert(Math.abs(restored.hero.cy - home.hero.cy) <= 1, 'Symbol returns above the original hero lettering');
  assert(Math.abs(restored.header.height - home.header.height) <= 1, 'Original header height is restored');
}

try {
  const page = await open({ viewport: { width: 1440, height: 1000 } });
  await active(page, 'main'); await geometry(page);
  await brandJourney(page, 'desktop-brand');
  console.log('PASS: continuous official symbol travel, centered dock, stable enlarged header and return');
  if (process.env.BASELINE_REF && !process.env.SITE_URL) {
    const baseline = execFileSync('git', ['show', `${process.env.BASELINE_REF}:public/index.html`], { cwd: root, encoding: 'utf8' });
    const current = await readFile(path.join(root, 'public/index.html'), 'utf8');
    const same = await page.evaluate(({ baseline, current }) => {
      const parse = source => new DOMParser().parseFromString(source, 'text/html');
      const old = parse(baseline), next = parse(current);
      const normalize = el => el.textContent.replace(/\s+/g, ' ').trim();
      return ['.hero', '#practice', '#orchestration', '#engagements', '#why', '#contact-form', '.site-footer']
        .every(selector => old.querySelector(selector).innerHTML === next.querySelector(selector).innerHTML) &&
        normalize(old.querySelector('#lifecycle')) === normalize(next.querySelector('#lifecycle'));
    }, { baseline, current });
    assert(same, 'Unchanged sections/form/footer retain markup; all lifecycle wording is preserved');
    const sources = { 'index.html': baseline };
    for (const file of ['styles.css', 'script.js', 'sections.js']) {
      sources[file] = execFileSync('git', ['show', `${process.env.BASELINE_REF}:public/${file}`], { cwd: root, encoding: 'utf8' });
    }
    const currentScript = await readFile(path.join(root, 'public/script.js'), 'utf8');
    const contactBoundary = '   Contact form.';
    assert.equal(currentScript.split(contactBoundary)[0], sources['script.js'].split(contactBoundary)[0],
      'The atmosphere renderer and header script remain byte-identical');
    const currentSections = await readFile(path.join(root, 'public/sections.js'), 'utf8');
    assert.equal(currentSections.split('/* Hero storytelling')[0].trim(), sources['sections.js'].trim(),
      'The approved section and symbol transition controller remains byte-identical');
    const oldPage = await open({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }, '', sources);
    const identitySizes = p => p.evaluate(() => ({
      symbol: document.querySelector('.hero-mark').getBoundingClientRect().width,
      lettering: document.querySelector('.hero-title').getBoundingClientRect().width,
      expansion: parseFloat(getComputedStyle(document.querySelector('.hero-expansion')).fontSize),
      legend: parseFloat(getComputedStyle(document.querySelector('.hero .eyebrow')).fontSize),
    }));
    const originalSizes = await identitySizes(oldPage), updatedSizes = await identitySizes(page);
    for (const key of Object.keys(originalSizes)) {
      assert(Math.abs(updatedSizes[key] / originalSizes[key] - 1.15) < .001, `${key} is 15% larger`);
    }
    await go(oldPage, 'lifecycle'); await go(page, 'lifecycle');
    const lifecycleSize = p => p.evaluate(() => {
      const list = document.querySelector('.lifecycle').getBoundingClientRect();
      const layer = document.querySelector('.lifecycle-layer').getBoundingClientRect();
      return { height: Math.max(list.bottom, layer.bottom) - Math.min(list.top, layer.top),
        aside: layer.left >= list.right && layer.height > layer.width };
    });
    const oldLifecycle = await lifecycleSize(oldPage), newLifecycle = await lifecycleSize(page);
    assert(newLifecycle.aside, 'Interferometry is a tall right-hand panel');
    assert(newLifecycle.height < oldLifecycle.height, 'The lifecycle is shorter than the approved baseline');
    console.log('PASS: 15% hero identity scale, unchanged boundaries and shorter lifecycle', { originalSizes, updatedSizes, oldLifecycle, newLifecycle });
    await oldPage.context().close();
  }
  const heroPage = await open({ viewport: { width: 1440, height: 1000 } });
  const phraseState = p => p.evaluate(() => {
    const current = document.querySelector('.hero-phrase.is-current');
    const rect = document.querySelector('.hero-story').getBoundingClientRect();
    const style = getComputedStyle(current);
    return { text: current.textContent, opacity: Number(style.opacity), transform: style.transform,
      height: rect.height, top: rect.top,
      visible: [...document.querySelectorAll('.hero-phrase')].filter(el => getComputedStyle(el).visibility === 'visible').length };
  });
  await heroPage.waitForTimeout(1200);
  const readable = await phraseState(heroPage);
  assert.equal(readable.visible, 1); assert.equal(readable.opacity, 1);
  await heroPage.waitForTimeout(700);
  assert.notEqual((await phraseState(heroPage)).transform, readable.transform, 'The readable phrase gently floats');
  await heroPage.waitForFunction(text => document.querySelector('.hero-phrase.is-current').textContent !== text, readable.text);
  const nextPhrase = await phraseState(heroPage);
  assert.equal(nextPhrase.visible, 1); assert(nextPhrase.opacity < .5, 'The next phrase condenses from a soft dissolve');
  assert.equal(nextPhrase.height, readable.height); assert.equal(nextPhrase.top, readable.top);
  await heroPage.locator('.hero-pause').click();
  const pausedPhrase = await phraseState(heroPage);
  await heroPage.waitForTimeout(400);
  assert.deepEqual(await phraseState(heroPage), pausedPhrase, 'Pause holds one crisp phrase without layout movement');
  assert.equal(pausedPhrase.opacity, 1);
  await heroPage.locator('.hero-pause').click();
  await go(heroPage, 'practice');
  assert(await heroPage.locator('.hero-story').evaluate(el => el.getAnimations({ subtree: true }).every(a => a.playState === 'paused')),
    'The loop stops outside the introduction');
  await go(heroPage, 'main');
  assert(await heroPage.locator('.hero-story').evaluate(el => el.getAnimations({ subtree: true }).some(a => a.playState === 'running')));
  await heroPage.locator('.hero-pause').focus();
  await heroPage.emulateMedia({ reducedMotion: 'reduce' });
  await heroPage.waitForFunction(() => document.querySelector('.hero-story').hidden);
  assert(await heroPage.locator('.hero-story').isHidden());
  assert(await heroPage.locator('.hero-lede').evaluate(el => !el.classList.contains('visually-hidden')));
  assert.equal(await heroPage.locator('.hero-story').evaluate(el => el.getAnimations({ subtree: true }).length), 0);
  assert(await heroPage.locator('.hero').evaluate(el => el === document.activeElement), 'Preference changes never strand focus in the hidden pause control');
  await heroPage.context().close();
  console.log('PASS: one floating phrase, natural loop, stable layout, pause/resume, off-section suspension and reduced motion');

  for (const id of ids) {
    await go(page, id); await geometry(page);
    if (shots) await page.screenshot({ path: path.join(shots, `desktop-${id}.png`) });
  }
  await go(page, 'practice');
  await page.locator('.section-nav a[href="#orchestration"]').click();
  await page.waitForTimeout(100);
  const early = await page.locator('#orchestration').evaluate(p => Number(getComputedStyle(p).opacity));
  const mistStart = await page.locator('.atmosphere__transition').evaluate(el => ({ opacity: Number(getComputedStyle(el).opacity), transform: getComputedStyle(el).transform }));
  assert(early < 0.1, 'Incoming text waits while the outgoing view dissolves');
  await page.waitForTimeout(300);
  const fade = await page.locator('#orchestration').evaluate(p => Number(getComputedStyle(p).opacity));
  const mistPeak = await page.locator('.atmosphere__transition').evaluate(el => ({ opacity: Number(getComputedStyle(el).opacity), transform: getComputedStyle(el).transform }));
  assert(mistPeak.opacity > 0.1 && mistPeak.opacity > mistStart.opacity && mistPeak.transform !== mistStart.transform,
    'Nebular mist moves and rises during the transition');
  assert(fade > 0 && fade < 1, 'Navigation actually fades the incoming view');
  await active(page, 'orchestration');
  assert.equal(await page.locator('.atmosphere__transition').evaluate(el => Number(getComputedStyle(el).opacity)), 0,
    'The temporary mist clears after the transition');
  console.log('PASS: six links, one visible/accessibile view, preserved content and fixed layout');

  await go(page, 'orchestration'); await edge(page, true);
  await page.mouse.move(600, 450); await page.mouse.wheel(0, 140);
  await active(page, 'lifecycle');
  await edge(page, false); await page.mouse.wheel(0, -140);
  await active(page, 'orchestration');
  await go(page, 'main'); await edge(page, true);
  for (let i = 0; i < 16; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(35); }
  await active(page, 'practice');
  console.log('PASS: forward/back wheel transitions and momentum cannot skip sections');

  await go(page, 'why'); await go(page, 'contact');
  await page.goBack(); await active(page, 'why');
  await page.goForward(); await active(page, 'contact');
  await page.reload(); await active(page, 'contact');
  await page.locator('#contact-email').fill('navigation@example.invalid');
  await page.locator('#contact-comment').fill('A draft that must survive navigation.');
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('Space');
  const textarea = await page.locator('#contact-comment').boundingBox();
  await page.mouse.move(textarea.x + 10, textarea.y + 10);
  await page.mouse.wheel(0, 160); await active(page, 'contact');
  await page.locator('#contact-comment').fill('A draft that must survive navigation.');
  await go(page, 'practice'); await go(page, 'contact');
  assert.equal(await page.locator('#contact-comment').inputValue(), 'A draft that must survive navigation.');
  await page.locator('button[data-request-type="contact"]').click();
  await page.waitForFunction(() => document.querySelector('.form-status--error'));
  assert.equal(await page.locator('#contact-email').inputValue(), 'navigation@example.invalid');
  await page.locator('.wordmark').focus(); await page.keyboard.press('Enter');
  await active(page, 'main');
  await edge(page, true); await page.keyboard.press('PageDown'); await active(page, 'practice');
  await edge(page, false); await page.keyboard.press('PageUp'); await active(page, 'main');
  console.log('PASS: history, deep links, keyboard, form draft and failed-submit preservation');

  await page.locator('.section-nav a[href="#practice"]').click();
  await page.waitForTimeout(100);
  const unrevealed = await page.locator('#practice').evaluate(el => Number(getComputedStyle(el).opacity));
  await page.locator('.section-nav a[href="#orchestration"]').click({ force: true });
  const interrupted = await page.locator('#practice').evaluate(el => Number(getComputedStyle(el).opacity));
  assert(interrupted <= unrevealed + 0.05, 'Rapid navigation cannot flash text that has not appeared yet');
  await active(page, 'orchestration');
  await go(page, 'main');
  await page.locator('.section-nav a[href="#practice"]').click();
  await page.waitForTimeout(170);
  const beforeReverse = await brandFrame(page);
  // A user can activate a moving header control; skip Playwright's automatic
  // geometry-stability wait so this actually interrupts the flight.
  await page.locator('.wordmark').click({ force: true });
  const afterReverse = await brandFrame(page);
  assert(Math.abs(afterReverse.traveler.cy - beforeReverse.traveler.cy) < 40, 'Interrupted flight retargets without a position reset');
  await active(page, 'main');
  await page.locator('.section-nav a[href="#contact"]').click();
  await page.waitForTimeout(120); await page.emulateMedia({ reducedMotion: 'reduce' });
  await active(page, 'contact');
  const stopped = await brandFrame(page);
  assert(stopped.docked && !stopped.transitioning && stopped.traveler.visible);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await go(page, 'main');
  await page.locator('.section-nav a[href="#engagements"]').click();
  await page.waitForTimeout(100); await page.setViewportSize({ width: 1280, height: 800 });
  await active(page, 'engagements'); await geometry(page);
  const resized = await brandFrame(page);
  assert(Math.abs(resized.traveler.cx - resized.width / 2) <= 1, 'Resize settles the symbol at the current destination');
  await page.setViewportSize({ width: 1440, height: 1000 });
  console.log('PASS: interrupted flight, preference change and viewport change preserve the current destination');

  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    const mobile = await open({ viewport, isMobile: true, hasTouch: true });
    if (viewport.width === 390) await brandJourney(mobile, 'mobile-brand');
    for (const id of ids) {
      await go(mobile, id); await geometry(mobile);
      await edge(mobile, true);
      const reachable = await mobile.locator('.section-panel.is-active').evaluate(p => p.scrollHeight - p.scrollTop - p.clientHeight <= 2);
      assert(reachable, 'Tall content remains reachable');
      if (shots && viewport.width === 390) await mobile.screenshot({ path: path.join(shots, `mobile-${id}.png`) });
    }
    await go(mobile, 'lifecycle');
    await mobile.locator('.section-panel.is-active').evaluate(p => { p.scrollTop = p.scrollHeight - p.clientHeight - 25; });
    await mobile.waitForTimeout(300);
    await mobile.mouse.move(100, viewport.height / 2);
    for (let i = 0; i < 12; i++) { await mobile.mouse.wheel(0, 90); await mobile.waitForTimeout(25); }
    await active(mobile, 'lifecycle');
    await mobile.waitForTimeout(300); await mobile.mouse.wheel(0, 120);
    await active(mobile, 'engagements');
    await go(mobile, 'orchestration'); await edge(mobile, true);
    const client = await mobile.context().newCDPSession(mobile);
    const area = await mobile.locator('.section-panel.is-active').boundingBox();
    const x = area.x + 50, y = area.y + area.height * .75;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 5; i++) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 16 }] });
      await mobile.waitForTimeout(20);
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await active(mobile, 'lifecycle');
    await mobile.context().close();
  }
  console.log('PASS: narrow/short mobile layouts, overflow reachability and touch boundary navigation');

  {
    const contactFlow = await open({
      viewport: { width: 1280, height: 900 },
      reducedMotion: 'reduce',
    }, '#contact');
    const requests = [];
    const contactEndpoint = new URL('api/contact', base).href;
    let reply = { status: 200, contentType: 'application/json', body: '{"ok":true}' };
    let capturePending = null;

    // This narrower mock takes precedence over open()'s all-POST rejection.
    // No request in this group is delivered to the real contact endpoint.
    await contactFlow.route(contactEndpoint, async route => {
      const request = route.request();
      assert.equal(request.method(), 'POST');
      assert.equal(request.url(), contactEndpoint);
      assert.equal(request.headers()['content-type'], 'application/json');
      requests.push(request.postDataJSON());
      if (capturePending) {
        const resolvePending = capturePending;
        capturePending = null;
        resolvePending(route);
        return;
      }
      await route.fulfill(reply);
    });

    await active(contactFlow, 'contact');
    for (const requestType of ['pricing', 'contact']) {
      const email = `${requestType}@example.invalid`;
      await contactFlow.locator('#contact-email').fill(email);
      await contactFlow.locator('#contact-comment').fill('  A bounded project.  ');
      const before = requests.length;
      await contactFlow.locator(`button[data-request-type="${requestType}"]`).click();
      await contactFlow.waitForFunction(() => document.getElementById('contact-form').hidden);
      assert.deepEqual(requests.at(-1), {
        email, comment: 'A bounded project.', company: '', requestType,
      });
      assert.equal(requests.length, before + 1);
      assert.equal(await contactFlow.locator('#contact-thanks').textContent().then(text => text.replace(/\s+/g, ' ').trim()),
        'Thank you. We’ll reach out soon.');
      assert(await contactFlow.locator('#contact-thanks').isVisible());
      assert.equal(await contactFlow.locator('#contact-form').isVisible(), false);
      assert.equal(await contactFlow.evaluate(() => document.activeElement.id), 'contact-thanks');
      assert.equal(await contactFlow.locator('#contact-form button:enabled').count(), 0);

      // Bypass native validation deliberately: completed state must still guard POST.
      await contactFlow.locator('#contact-form').evaluate(form => {
        form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      });
      assert.equal(requests.length, before + 1, 'A completed visit cannot submit again');
      await go(contactFlow, 'contact');
      assert(await contactFlow.locator('#contact-form').evaluate(form => form.hidden),
        'Selecting the current section is not a new visit');
      if (shots) await contactFlow.screenshot({ path: path.join(shots, `contact-thanks-${requestType}.png`) });
      await go(contactFlow, 'practice');
      assert(await contactFlow.locator('#contact-form').evaluate(form => form.hidden),
        'Leaving alone does not reopen the completed form');
      await go(contactFlow, 'contact');
      assert(await contactFlow.locator('#contact-form').isVisible());
      assert.equal(await contactFlow.locator('#contact-thanks').isVisible(), false);
      assert.equal(await contactFlow.locator('#contact-email').inputValue(), '');
    }

    // Observe every transition: the return arrow must go directly to the hero.
    await contactFlow.evaluate(() => {
      const main = document.getElementById('main');
      window.contactReturnStates = [];
      window.contactReturnObserver = new MutationObserver(records => {
        records.forEach((record, index) => {
          const next = index + 1 < records.length ? records[index + 1].oldValue : main.dataset.activeSection;
          window.contactReturnStates.push(next);
        });
      });
      window.contactReturnObserver.observe(main, {
        attributes: true, attributeFilter: ['data-active-section'], attributeOldValue: true,
      });
    });
    await contactFlow.locator('.contact-home').click();
    await active(contactFlow, 'main');
    const returnStates = await contactFlow.evaluate(() => {
      window.contactReturnObserver.disconnect();
      const states = window.contactReturnStates;
      delete window.contactReturnObserver;
      delete window.contactReturnStates;
      return states;
    });
    assert.deepEqual(returnStates, ['main'], 'The arrow does not traverse intermediate views');
    await go(contactFlow, 'contact');

    for (const pendingReply of [
      { status: 200, contentType: 'application/json', body: '{"ok":true}' },
      { status: 503, contentType: 'application/json', body: '{"ok":false}' },
    ]) {
      await contactFlow.locator('#contact-email').fill('old-visit@example.invalid');
      const pending = new Promise(resolve => { capturePending = resolve; });
      const before = requests.length;
      await contactFlow.locator('button[data-request-type="contact"]').click();
      const held = await pending;
      if (pendingReply.status === 200) {
        // Two real navigation clicks in one task exercise batched view changes.
        await contactFlow.evaluate(() => {
          document.querySelector('.wordmark').click();
          document.querySelector('.section-nav a[href="#contact"]').click();
        });
        await active(contactFlow, 'contact');
      } else {
        await go(contactFlow, 'practice');
        await go(contactFlow, 'contact');
      }
      await contactFlow.locator('#contact-email').fill('new-visit@example.invalid');
      await contactFlow.locator('#contact-comment').fill('Keep this newer draft.');
      assert.equal(await contactFlow.locator('#contact-form button:enabled').count(), 0,
        'A pending request remains guarded across navigation');
      await contactFlow.locator('#contact-form').evaluate(form => {
        form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
      });
      assert.equal(requests.length, before + 1, 'Navigation cannot duplicate an in-flight POST');
      await held.fulfill(pendingReply);
      await contactFlow.waitForFunction(() => !document.querySelector('button[data-request-type="contact"]').disabled);
      assert(await contactFlow.locator('#contact-form').isVisible());
      assert.equal(await contactFlow.locator('#contact-thanks').isVisible(), false);
      assert.equal(await contactFlow.locator('#contact-email').inputValue(), 'new-visit@example.invalid');
      assert.equal(await contactFlow.locator('#contact-comment').inputValue(), 'Keep this newer draft.');
      assert.equal(await contactFlow.locator('#form-status').textContent(), '');
      assert.equal(await contactFlow.evaluate(() => document.activeElement.id), 'contact-comment',
        'An old response does not move focus from the new draft');
    }

    for (const body of ['{}', 'null', '{"ok":false}', '<!doctype html><title>Unexpected response']) {
      reply = { status: 200, contentType: 'application/json', body };
      await contactFlow.locator('button[data-request-type="contact"]').click();
      await contactFlow.waitForFunction(() => document.querySelector('.form-status--error'));
      assert(await contactFlow.locator('#contact-form').isVisible());
      assert.equal(await contactFlow.locator('#contact-thanks').isVisible(), false);
      assert.equal(await contactFlow.locator('#contact-comment').inputValue(), 'Keep this newer draft.');
      assert.equal(await contactFlow.locator('#contact-form button:enabled').count(), 2);
    }

    // Success while away must not steal focus; the next entry starts a new visit.
    const awayPending = new Promise(resolve => { capturePending = resolve; });
    await contactFlow.locator('button[data-request-type="pricing"]').click();
    const awayRequest = await awayPending;
    await go(contactFlow, 'practice');
    await awayRequest.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    await contactFlow.waitForFunction(() => document.getElementById('contact-form').hidden);
    assert.equal(await contactFlow.evaluate(() => document.activeElement.getAttribute('href')), '#practice');
    await go(contactFlow, 'contact');
    assert(await contactFlow.locator('#contact-form').isVisible());
    assert.equal(await contactFlow.locator('#contact-thanks').isVisible(), false);
    await geometry(contactFlow);
    await contactFlow.context().close();

    const contactLarge = await open({
      viewport: { width: 320, height: 568 },
      reducedMotion: 'reduce',
    }, '#contact');
    await contactLarge.route(contactEndpoint, route => route.fulfill({
      status: 200, contentType: 'application/json', body: '{"ok":true}',
    }));
    await contactLarge.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await active(contactLarge, 'contact');
    await contactLarge.locator('#contact-email').fill('enlarged@example.invalid');
    await contactLarge.locator('#contact').evaluate(panel => { panel.scrollTop = panel.scrollHeight; });
    await contactLarge.locator('button[data-request-type="contact"]').click();
    await contactLarge.waitForFunction(() => document.getElementById('contact-form').hidden);
    const acknowledgment = await contactLarge.evaluate(() => {
      const panel = document.getElementById('contact').getBoundingClientRect();
      const thanks = document.getElementById('contact-thanks').getBoundingClientRect();
      const heading = document.querySelector('#contact-thanks h3').getBoundingClientRect();
      return {
        panelTop: panel.top, panelBottom: panel.bottom,
        thanksTop: thanks.top, thanksBottom: thanks.bottom,
        headingTop: heading.top, headingBottom: heading.bottom,
        focus: document.activeElement.id,
      };
    });
    assert.equal(acknowledgment.focus, 'contact-thanks');
    assert(acknowledgment.headingTop >= acknowledgment.panelTop - 1 &&
      acknowledgment.headingBottom <= acknowledgment.panelBottom + 1,
    'The complete enlarged thank-you heading is visible after the form collapses');
    if (shots) await contactLarge.screenshot({ path: path.join(shots, 'contact-thanks-320-enlarged.png') });
    await contactLarge.locator('#contact-thanks p').scrollIntoViewIfNeeded();
    const detail = await contactLarge.locator('#contact-thanks p').boundingBox();
    assert(detail.y >= acknowledgment.panelTop - 1 && detail.y + detail.height <= acknowledgment.panelBottom + 1,
      'The lower acknowledgment text remains reachable with inner scrolling');
    await geometry(contactLarge);
    await contactLarge.context().close();
    console.log('PASS: exact success acknowledgment, request payloads, duplicate guards, visit resets, direct return and stale-response isolation');
  }

  const reduced = await open({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' }, '#why');
  await active(reduced, 'why');
  const direct = await brandFrame(reduced);
  assert(direct.docked && !direct.transitioning && direct.traveler.visible, 'Direct links initialize already docked');
  await reduced.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await reduced.waitForTimeout(300); await geometry(reduced);
  await go(reduced, 'contact'); await geometry(reduced); await edge(reduced, true);
  const duration = await reduced.locator('.section-panel.is-active').evaluate(p => getComputedStyle(p).transitionDuration);
  assert(duration.split(',').every(d => parseFloat(d) <= 0.001), 'Reduced motion disables perceptible panel transitions');
  await reduced.setViewportSize({ width: 320, height: 568 });
  for (const id of ids) {
    await go(reduced, id); await geometry(reduced); await edge(reduced, true);
    if (id !== 'main') {
      const frame = await brandFrame(reduced);
      assert(Math.abs(frame.traveler.cx - frame.width / 2) <= 1);
      const collides = await reduced.evaluate(() => {
        const mark = document.querySelector('.brand-dock').getBoundingClientRect();
        return [...document.querySelectorAll('.wordmark, .header-cta')].some(el => {
          const r = el.getBoundingClientRect();
          return Math.min(mark.right, r.right) > Math.max(mark.left, r.left) && Math.min(mark.bottom, r.bottom) > Math.max(mark.top, r.top);
        });
      });
      assert(!collides, 'Enlarged text controls do not collide with the centered symbol');
    }
  }
  await reduced.emulateMedia({ reducedMotion: 'no-preference' });
  await go(reduced, 'main');
  await reduced.locator('.section-nav a[href="#practice"]').click();
  await reduced.waitForTimeout(80);
  const contactUnclipped = await reduced.evaluate(() => {
    const el = document.querySelector('.header-cta'), r = el.getBoundingClientRect();
    return document.elementFromPoint(r.x + r.width / 2, r.bottom - 4)?.closest('.header-cta') === el;
  });
  assert(contactUnclipped, 'The enlarged Contact control remains visible and clickable while the header grows');
  await active(reduced, 'practice');
  const fallback = await open({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  assert.equal(await fallback.locator('main > section:visible').count(), 7);
  assert.equal(await fallback.locator('html.sections-enabled').count(), 0);
  await fallback.locator('#contact').scrollIntoViewIfNeeded();
  assert(await fallback.locator('#contact').isVisible());
  assert.deepEqual(errors, []);
  console.log('PASS: enlarged text, reduced motion, no-JavaScript fallback and zero page errors');
} finally {
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
