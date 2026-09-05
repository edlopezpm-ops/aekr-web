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
async function open(options = {}, hash = '') {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  // Never deliver real email, including when SITE_URL points at production.
  await page.route('**/*', route => route.request().method() === 'POST'
    ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false}' })
    : route.continue());
  await page.goto(base + '/' + hash);
  return page;
}
async function active(page, id) {
  await page.waitForFunction(id => document.querySelector('main').dataset.activeSection === id, id);
  await page.waitForTimeout(500);
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
      controls: [...document.querySelectorAll('.wordmark, .header-cta, .section-nav a')].map(el => {
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

try {
  const page = await open({ viewport: { width: 1440, height: 1000 } });
  await active(page, 'main'); await geometry(page);
  if (process.env.BASELINE_REF && !process.env.SITE_URL) {
    const baseline = execFileSync('git', ['show', `${process.env.BASELINE_REF}:public/index.html`], { cwd: root, encoding: 'utf8' });
    const current = await readFile(path.join(root, 'public/index.html'), 'utf8');
    const same = await page.evaluate(({ baseline, current }) => {
      const parse = source => [...new DOMParser().parseFromString(source, 'text/html').querySelectorAll('main > section')].map(s => s.innerHTML);
      return JSON.stringify(parse(baseline)) === JSON.stringify(parse(current));
    }, { baseline, current });
    assert(same, 'Every original section retains its exact inner markup');
  }
  for (const id of ids) {
    await go(page, id); await geometry(page);
    if (shots) await page.screenshot({ path: path.join(shots, `desktop-${id}.png`) });
  }
  await go(page, 'practice');
  await page.locator('.section-nav a[href="#orchestration"]').click();
  await page.waitForTimeout(100);
  const fade = await page.locator('#orchestration').evaluate(p => Number(getComputedStyle(p).opacity));
  assert(fade > 0 && fade < 1, 'Navigation actually fades the incoming view');
  await active(page, 'orchestration');
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

  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    const mobile = await open({ viewport, isMobile: true, hasTouch: true });
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

  const reduced = await open({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' }, '#why');
  await active(reduced, 'why');
  await reduced.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await reduced.waitForTimeout(300); await geometry(reduced);
  await go(reduced, 'contact'); await geometry(reduced); await edge(reduced, true);
  const duration = await reduced.locator('.section-panel.is-active').evaluate(p => getComputedStyle(p).transitionDuration);
  assert(duration.split(',').every(d => parseFloat(d) <= 0.001), 'Reduced motion disables perceptible panel transitions');
  await reduced.setViewportSize({ width: 320, height: 568 });
  for (const id of ids) { await go(reduced, id); await geometry(reduced); await edge(reduced, true); }
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
