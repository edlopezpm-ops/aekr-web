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
      res.setHeader('Cache-Control', 'public, max-age=3600');
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
async function open(options = {}, hash = '', sources = {}, setup) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  if (setup) await page.addInitScript(setup);
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
async function sectionLink(page, id) {
  const link = page.locator(`.section-nav a[href="#${id}"]`);
  if (!await link.isVisible()) await page.locator('.section-menu-toggle').click();
  return link;
}
async function go(page, id) {
  if (id === 'main') {
    if (await page.locator('main').getAttribute('data-active-section') !== 'main') {
      await page.locator(await page.locator('.wordmark').isVisible() ? '.wordmark' : '.brand-dock').click();
    }
  } else await (await sectionLink(page, id)).click();
  await active(page, id);
}
async function chooseLanguage(page, language) {
  const button = page.locator('#site-language');
  if (await page.locator('html').getAttribute('lang') !== language) {
    if (!await button.isVisible()) await page.locator('.section-menu-toggle').click();
    await button.click();
  }
  await page.waitForFunction(language => document.documentElement.lang === language, language);
  assert.equal((await button.textContent()).trim(), language === 'es' ? 'SP' : 'EN');
  assert.equal(await button.getAttribute('aria-label'), language === 'es'
    ? 'SP: Español. Cambiar a inglés.' : 'EN: English. Switch to Spanish.');
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
      controls: [...document.querySelectorAll('.wordmark, .section-menu-toggle, .header-cta, .section-nav a, .brand-dock, #site-language')]
        .filter(el => el.checkVisibility({ checkVisibilityCSS: true })).map(el => {
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

async function compactDesktopPanels() {
  for (const viewport of [
    { width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1280, height: 720 },
    { width: 959, height: 805 }, { width: 900, height: 805 }, { width: 686, height: 805 },
  ]) {
    const compact = await open({ viewport }, '#contact');
    await active(compact, 'contact');
    for (const language of ['en', 'es']) {
      await chooseLanguage(compact, language);
      const label = `${viewport.width}x${viewport.height} ${language}`;
      for (const id of viewport.width >= 1366 ? ids : ['contact']) {
        await go(compact, id); await geometry(compact);
        const size = await compact.locator('.section-panel.is-active').evaluate(panel => ({
          viewport: panel.clientHeight, content: panel.scrollHeight, scroll: panel.scrollTop,
        }));
        assert(size.content <= size.viewport + 1, `${label} #${id}: the complete desktop panel fits without inner scrolling (${size.content}/${size.viewport})`);
        assert.equal(size.scroll, 0, `${label} #${id}: the panel starts with every row visible`);
      }
      const corners = await compact.evaluate(() => {
        const box = selector => {
          const r = document.querySelector(selector).getBoundingClientRect();
          return { left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
        };
        return { banner: box('.provenance img'), legal: box('.footer-legal') };
      });
      assert(corners.banner.width <= 180 && corners.banner.height <= 52,
        `${label}: the attribution banner stays compact`);
      assert(corners.banner.left > viewport.width / 2 && viewport.width - corners.banner.right <= 40,
        `${label}: the banner occupies the lower right corner`);
      assert(corners.legal.left >= 0 && corners.legal.left <= 40 && corners.legal.right < viewport.width / 2,
        `${label}: copyright occupies the lower left corner`);
      for (const corner of Object.values(corners)) {
        assert(corner.bottom <= viewport.height + 1 && viewport.height - corner.bottom <= 32,
          `${label}: attribution stays at the viewport bottom`);
      }
      const contactFrame = () => compact.evaluate(() => {
        const panel = document.querySelector('#contact'), bounds = panel.getBoundingClientRect();
        const elements = [...panel.querySelectorAll('#contact-heading, #contact-form, .form-actions button, .contact-home')];
        return { scroll: panel.scrollTop, boxes: elements.map(element => {
          const r = element.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        }), controlsReachable: [...panel.querySelectorAll('.form-actions button, .contact-home')].every(element => {
          const r = element.getBoundingClientRect();
          return r.top >= bounds.top && r.bottom <= bounds.bottom
            && [r.top + 4, r.top + r.height / 2, r.bottom - 4].map(y => [r.left + r.width / 2, y])
              .every(([x, y]) => element.contains(document.elementFromPoint(x, y)));
        }) };
      });
      const before = await contactFrame();
      assert(before.controlsReachable, `${label}: both Contact actions and Back are fully visible and hit-testable`);
      const form = await compact.locator('#contact-form').boundingBox();
      await compact.mouse.move(form.x + 12, form.y + 12);
      await compact.mouse.wheel(0, 360); await compact.waitForTimeout(250);
      assert.equal(await compact.locator('main').getAttribute('data-active-section'), 'contact');
      assert.deepEqual(await contactFrame(), before, `${label}: a downward wheel gesture cannot shift Contact or its controls`);
      if (shots) await compact.screenshot({ path: path.join(shots, `compact-contact-${viewport.width}-${language}.png`) });
    }
    if (viewport.width === 959) {
      await compact.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await compact.waitForTimeout(300);
      for (const language of ['en', 'es']) {
        await chooseLanguage(compact, language);
        for (const selector of ['#contact-email', '#contact-comment', '.form-actions button[data-request-type="pricing"]', '.form-actions button[data-request-type="contact"]', '.contact-home']) {
          const control = compact.locator(selector);
          await control.scrollIntoViewIfNeeded();
          assert(await control.evaluate(element => {
            const r = element.getBoundingClientRect(), panel = element.closest('.section-panel').getBoundingClientRect();
            const x = r.left + r.width / 2, y = r.top + r.height / 2;
            return x >= panel.left && x <= panel.right && y >= panel.top && y <= panel.bottom
              && element.contains(document.elementFromPoint(x, y));
          }), `959x805 ${language} at 200% text: ${selector} remains reachable and unobstructed`);
        }
        await geometry(compact);
        if (shots) await compact.screenshot({ path: path.join(shots, `compact-contact-959-${language}-enlarged.png`) });
      }
    }
    await compact.context().close();
  }
  console.log('PASS: complete desktop panels and compact Contact in both languages, stationary forms, corner attribution and unobstructed actions');
}

async function brandFrame(page) {
  return page.evaluate(() => {
    const box = el => {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      return { x: r.x, y: r.y, width: r.width, height: r.height, cx: r.x + r.width / 2,
        cy: r.y + r.height / 2, opacity: Number(s.opacity), visible: el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) };
    };
    const original = document.querySelector('.hero-mark'), traveler = document.querySelector('.brand-traveler');
    return { bitmap: { ready: traveler.complete && traveler.naturalWidth > 0,
      source: traveler.currentSrc, original: original.currentSrc },
      hero: box(original), traveler: box(traveler),
      dock: box(document.querySelector('.brand-dock')), header: box(document.querySelector('.site-header')),
      docked: document.documentElement.classList.contains('brand-docked'), width: innerWidth,
      transitioning: document.querySelector('main').dataset.transitioning === 'true' };
  });
}

async function startupGeometry() {
  for (const scenario of [
    { name: 'cold-warm', width: 1440, height: 1000 },
    { name: 'delayed-desktop', width: 1440, height: 1000, delay: true },
    { name: 'delayed-mobile', width: 390, height: 844, delay: true },
    { name: 'delayed-reduced', width: 1440, height: 1000, delay: true, reduced: true },
    { name: 'delayed-deep-link', width: 390, height: 844, delay: true, hash: '#contact' },
  ]) {
    const context = await browser.newContext({ viewport: { width: scenario.width, height: scenario.height },
      reducedMotion: scenario.reduced ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    if (scenario.delay) await page.route(/\.js(?:\?|$)/, async route => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      await route.continue();
    });
    await page.addInitScript(() => {
      window.startupFrames = [];
      let last = '';
      const sample = () => {
        const main = document.querySelector('main');
        if (main?.children.length === 7) {
          const rect = main.getBoundingClientRect();
          const bounds = selector => {
            const element = document.querySelector(selector);
            if (!element) return null;
            const box = element.getBoundingClientRect();
            return [box.x, box.y, box.width, box.height];
          };
          const state = { x: rect.x, y: rect.y, width: rect.width, height: rect.height,
            documentHeight: document.documentElement.scrollHeight,
            visible: [...main.children].filter(el => el.checkVisibility({ checkVisibilityCSS: true })).map(el => el.id || 'main'),
            story: bounds('.hero-story'), mark: bounds('.hero-mark'),
            header: bounds('.site-header'), footer: bounds('.site-footer'),
            color: getComputedStyle(document.body).backgroundColor };
          const key = JSON.stringify(state);
          if (key !== last) { window.startupFrames.push(state); last = key; }
        }
        if (performance.now() < 2200) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const verify = async label => {
      await page.waitForTimeout(scenario.delay ? 1600 : 350);
      const frames = await page.evaluate(() => window.startupFrames);
      assert(frames.length > 0, `${label}: startup frames captured`);
      const settled = frames.at(-1);
      assert.deepEqual(settled.visible, [scenario.hash?.slice(1) || 'main'], `${label}: correct initial panel`);
      for (const frame of frames) {
        assert.deepEqual(frame, settled, `${label}: first visible panel geometry/color stays stable`);
        assert.equal(frame.documentHeight, scenario.height, `${label}: no long-document first paint`);
        assert.equal(frame.color, 'rgb(246, 242, 233)', `${label}: ivory from first paint`);
      }
    };
    await page.goto(base + '/' + (scenario.hash || ''), { waitUntil: 'commit' });
    await verify(scenario.name);
    if (scenario.name === 'cold-warm') {
      await page.reload({ waitUntil: 'commit' });
      await verify('warm');
    }
    await context.close();
  }
  console.log('PASS: cold/warm, delayed JavaScript, mobile, reduced motion and deep-link first paints retain one ivory panel shell');
}

async function brandJourney(page, label) {
  await go(page, 'main');
  const home = await brandFrame(page);
  assert(home.hero.visible && !home.traveler.visible, 'Home presents one original symbol');
  await (await sectionLink(page, 'practice')).click();
  await page.waitForTimeout(600);
  const moving = await brandFrame(page);
  assert(moving.transitioning && moving.traveler.visible && !moving.hero.visible, 'One intact symbol travels between hero and header');
  assert(moving.bitmap.ready && moving.bitmap.source === moving.bitmap.original, 'The traveler uses the loaded original bitmap');
  assert(moving.traveler.opacity > .99, 'The traveling symbol stays crisp and fully opaque');
  assert(Math.abs(moving.traveler.cy - home.hero.cy) > 2, 'The bitmap actually leaves the hero position');
  await page.waitForTimeout(200);
  assert(Math.abs((await brandFrame(page)).traveler.cy - moving.traveler.cy) > 2, 'Bitmap position advances during the journey');
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
  await page.waitForTimeout(600);
  const returning = await brandFrame(page);
  assert(returning.transitioning && returning.traveler.visible && !returning.hero.visible, 'The reverse route keeps one intact bitmap');
  assert(returning.traveler.opacity > .99 && Math.abs(returning.traveler.cy - stable.traveler.cy) > 2,
    'The opaque symbol actually travels back toward the hero');
  if (shots) await page.screenshot({ path: path.join(shots, `${label}-return.png`) });
  await active(page, 'main');
  const restored = await brandFrame(page);
  assert(!restored.docked && restored.hero.visible && !restored.traveler.visible);
  assert(Math.abs(restored.hero.cy - home.hero.cy) <= 1, 'Symbol returns above the original hero lettering');
  assert(Math.abs(restored.header.height - home.header.height) <= 1, 'Original header height is restored');
}

try {
  await startupGeometry();
  await compactDesktopPanels();
  const page = await open({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' }, '', {}, () => {
    window.atmosphereDraws = 0;
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.classList.contains('atmosphere__scales')) window.atmosphereDraws++;
      return clear.apply(this, args);
    };
  });
  await active(page, 'main'); await geometry(page);
  assert.equal(await page.locator('.background-pause, .hero-pause').count(), 0, 'The owner-requested page has no pause controls');
  await page.waitForFunction(() => document.querySelector('.atmosphere').dataset.renderer === 'canvas2d'
    && Number(document.querySelector('.atmosphere').dataset.particles) > 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const beforeMotion = await page.evaluate(() => ({ draws: window.atmosphereDraws,
    pixels: document.querySelector('.atmosphere__scales').toDataURL() }));
  await page.waitForTimeout(1200);
  const afterMotion = await page.evaluate(() => ({ draws: window.atmosphereDraws,
    pixels: document.querySelector('.atmosphere__scales').toDataURL(),
    paused: document.querySelector('.atmosphere').dataset.paused }));
  assert.equal(afterMotion.paused, 'false');
  assert(afterMotion.draws > beforeMotion.draws && afterMotion.pixels !== beforeMotion.pixels,
    'The visible petal layer keeps changing even when the browser reports reduced motion');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(draws => document.querySelector('.atmosphere').dataset.paused === 'false'
    && window.atmosphereDraws > draws, afterMotion.draws);
  console.log('PASS: visible animated petals continue across browser motion preferences with no pause controls');
  assert.equal(await page.locator('.hero-particles, .brand-particles').count(), 0, 'Phrase and symbol particle layers are removed');
  assert(await page.locator('canvas').evaluateAll(canvases => canvases.every(canvas => canvas.closest('.atmosphere'))),
    'Only the decorative atmosphere owns Canvas elements');
  await brandJourney(page, 'desktop-brand');
  console.log('PASS: original bitmap travel, centered dock, stable header and reverse return without particle layers');
  if (process.env.BASELINE_REF && !process.env.SITE_URL) {
    const baseline = execFileSync('git', ['show', `${process.env.BASELINE_REF}:public/index.html`], { cwd: root, encoding: 'utf8' });
    const current = await readFile(path.join(root, 'public/index.html'), 'utf8');
    const same = await page.evaluate(({ baseline, current }) => {
      const parse = source => new DOMParser().parseFromString(source, 'text/html');
      const old = parse(baseline), next = parse(current);
      const normalize = el => el.textContent.replace(/\s+/g, ' ').trim();
      return ['#practice', '#orchestration', '#engagements', '#why', '#contact-form']
        .every(selector => old.querySelector(selector).innerHTML === next.querySelector(selector).innerHTML) &&
        normalize(old.querySelector('#lifecycle')) === normalize(next.querySelector('#lifecycle')) &&
        normalize(old.querySelector('.site-footer')) === normalize(next.querySelector('.site-footer')) &&
        old.querySelector('.provenance img').alt === next.querySelector('.provenance img').alt;
    }, { baseline, current });
    assert(same, 'Unchanged sections/form/footer retain markup; all lifecycle wording is preserved');
    const sources = { 'index.html': baseline };
    for (const file of ['styles.css', 'script.js', 'sections.js', 'i18n.js']) {
      sources[file] = execFileSync('git', ['show', `${process.env.BASELINE_REF}:public/${file}`], { cwd: root, encoding: 'utf8' });
    }
    const currentScript = await readFile(path.join(root, 'public/script.js'), 'utf8');
    const contactBoundary = '   Both buttons post to the same endpoint';
    assert(currentScript.includes(contactBoundary) && sources['script.js'].includes(contactBoundary));
    assert.equal(currentScript.replace(/\r\n/g, '\n').split(contactBoundary)[1], sources['script.js'].replace(/\r\n/g, '\n').split(contactBoundary)[1],
      'The contact source remains identical after Git line-ending normalization');
    assert.equal(await page.locator('.hero-tagline').count(), 0, 'The fixed tagline is removed');
    assert.equal(await page.locator('.hero-phrase').filter({ hasText: 'Humans orchestrate. Machines execute.' }).count(), 1,
      'The former tagline appears once in the phrase loop');
    assert((await page.locator('.hero-lede').textContent()).includes('Humans orchestrate. Machines execute.'),
      'Accessible static prose retains the moved message');
    const oldPage = await open({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }, '', sources);
    const identitySizes = p => p.evaluate(() => ({
      symbol: document.querySelector('.hero-mark').getBoundingClientRect().width,
      lettering: document.querySelector('.hero-title').getBoundingClientRect().width,
      expansion: parseFloat(getComputedStyle(document.querySelector('.hero-expansion')).fontSize),
      legend: parseFloat(getComputedStyle(document.querySelector('.hero .eyebrow')).fontSize),
    }));
    const originalSizes = await identitySizes(oldPage), updatedSizes = await identitySizes(page);
    for (const key of Object.keys(originalSizes)) {
      assert(Math.abs(updatedSizes[key] - originalSizes[key]) < .01, `${key} retains its approved size`);
    }
    await go(oldPage, 'lifecycle'); await go(page, 'lifecycle');
    const lifecycleLayout = await page.evaluate(() => {
      const panel = document.querySelector('#lifecycle').getBoundingClientRect();
      const list = document.querySelector('.lifecycle').getBoundingClientRect();
      const layer = document.querySelector('.lifecycle-layer').getBoundingClientRect();
      const phases = [...document.querySelectorAll('.phase')].map(el => el.getBoundingClientRect());
      return { followsStages: layer.top >= list.bottom,
        fits: layer.left >= panel.left && layer.right <= panel.right && layer.bottom <= panel.bottom,
        distinctStages: phases.every((phase, i) => phases.slice(i + 1).every(other =>
          Math.min(phase.right, other.right) <= Math.max(phase.left, other.left) + 1 ||
          Math.min(phase.bottom, other.bottom) <= Math.max(phase.top, other.top) + 1)) };
    });
    assert(lifecycleLayout.followsStages && lifecycleLayout.fits && lifecycleLayout.distinctStages,
      'The compact lifecycle keeps stages distinct and verification fully visible after them');
    const upperGap = p => p.locator('.hero-story').evaluate(el => parseFloat(getComputedStyle(el).marginTop));
    assert.equal(await upperGap(page), await upperGap(oldPage), 'The approved phrase spacing is preserved');
    assert.equal((await page.locator('.contact-home').textContent()).trim(), 'Back');
    const desktopLayout = p => p.evaluate(() => {
      const elements = document.querySelectorAll('.site-header, .site-footer, .section-nav, .section-panel.is-active h2, .section-panel.is-active h3, .section-panel.is-active p, .section-panel.is-active li, .section-panel.is-active input, .section-panel.is-active textarea');
      return [...elements].map(el => {
        const style = getComputedStyle(el);
        return { text: el.textContent.replace(/\s+/g, ' ').trim(), fontSize: style.fontSize, lineHeight: style.lineHeight,
          compactSpacing: el.matches('.phase-body p, .lifecycle-layer') };
      });
    });
    for (const id of ids.slice(1)) {
      await go(oldPage, id); await go(page, id);
      const before = await desktopLayout(oldPage), after = await desktopLayout(page);
      // The compact-only Menu button is hidden on desktop but part of header text.
      before[0].text = after[0].text = '';
      for (let i = 0; i < after.length; i++) {
        if (!after[i].compactSpacing) continue;
        assert(parseFloat(after[i].lineHeight) >= parseFloat(after[i].fontSize) * 1.49,
          'Compact lifecycle prose retains readable line spacing');
        before[i].lineHeight = after[i].lineHeight;
      }
      assert.deepEqual(after, before, `Desktop ${id} keeps its content and type sizes outside authorized lifecycle spacing`);
    }
    console.log('PASS: approved identity, section content/typography, unchanged contact boundary and Back preserved');
    await oldPage.context().close();
  }
  const heroPage = await open({ viewport: { width: 1440, height: 1000 } }, '', {}, () => {
    window.heroEvidence = { phases: [] };
    new MutationObserver(records => {
      for (const record of records) {
        if (record.target.matches?.('.hero-story') && record.attributeName === 'data-phase') {
          window.heroEvidence.phases.push({ phase: record.target.dataset.phase, at: performance.now() });
        }
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-phase'] });
  });
  const phase = (p, value) => p.waitForFunction(value => document.querySelector('.hero-story').dataset.phase === value, value);
  const phraseState = p => p.evaluate(() => {
    const current = document.querySelector('.hero-phrase.is-current');
    const rect = document.querySelector('.hero-story').getBoundingClientRect();
    const style = getComputedStyle(current), transform = new DOMMatrixReadOnly(style.transform);
    return { text: current.textContent, opacity: Number(style.opacity), filter: style.filter,
      x: transform.m41, y: transform.m42, scaleX: transform.m11, scaleY: transform.m22,
      height: rect.height, top: rect.top,
      animations: document.querySelector('.hero-story').getAnimations({ subtree: true }).length,
      visible: [...document.querySelectorAll('.hero-phrase')].filter(el => getComputedStyle(el).visibility === 'visible').length };
  });
  const fullyReadable = state => {
    assert.equal(state.visible, 1); assert.equal(state.opacity, 1);
    assert.equal(state.x, 0); assert.equal(state.y, 0);
    assert.equal(state.scaleX, 1); assert.equal(state.scaleY, 1); assert.equal(state.filter, 'none');
    assert.equal(state.animations, 0, 'Reading has no active phrase animation');
  };
  // The lazy footer bitmap's natural aspect ratio settles the centered hero.
  // Wait for decode and the viewport observer before measuring phrase motion.
  await heroPage.locator('.provenance img').evaluate(image => image.decode());
  await heroPage.waitForFunction(() =>
    parseFloat(document.documentElement.style.getPropertyValue('--section-footer-height')) ===
      document.querySelector('.site-footer').getBoundingClientRect().height);
  await phase(heroPage, 'dwell');
  const readable = await phraseState(heroPage);
  fullyReadable(readable);
  assert.equal(readable.text, 'An AI-native, human-orchestrated engineering practice.', 'The first phrase is immediately readable');
  await heroPage.waitForTimeout(1000);
  assert.deepEqual(await phraseState(heroPage), readable, 'The whole line is stationary during reading');
  if (shots) await heroPage.screenshot({ path: path.join(shots, 'hero-phrase-dwell.png') });
  await phase(heroPage, 'leaving');
  const dwellDuration = await heroPage.evaluate(() => {
    const phases = window.heroEvidence.phases;
    const end = phases.findIndex(p => p.phase === 'leaving');
    const start = phases.slice(0, end).findLast(p => p.phase === 'dwell');
    return phases[end].at - start.at;
  });
  assert(dwellDuration >= 6990 && dwellDuration < 9500, `The slower phrase loop leaves a long stationary reading interval: ${dwellDuration} ms`);
  await heroPage.waitForTimeout(80);
  const leaving = await phraseState(heroPage);
  assert(leaving.opacity > 0 && leaving.opacity < 1 && leaving.y < 0 && leaving.y >= -2.01,
    'The whole line fades out with at most two pixels of upward displacement');
  assert.equal(leaving.visible, 1); assert.equal(leaving.filter, 'none');
  assert.equal(leaving.scaleX, 1); assert.equal(leaving.scaleY, 1); assert.equal(leaving.x, 0);
  if (shots) await heroPage.screenshot({ path: path.join(shots, 'hero-phrase-leaving.png') });
  await phase(heroPage, 'entering'); await heroPage.waitForTimeout(120);
  const entering = await phraseState(heroPage);
  assert.notEqual(entering.text, readable.text, 'The next phrase replaces the outgoing line');
  assert(entering.opacity > 0 && entering.opacity < 1 && entering.y > 0 && entering.y <= 4.01,
    'The next whole line fades in with at most four pixels of settling displacement');
  assert.equal(entering.visible, 1); assert.equal(entering.filter, 'none');
  assert.equal(entering.scaleX, 1); assert.equal(entering.scaleY, 1); assert.equal(entering.x, 0);
  if (shots) await heroPage.screenshot({ path: path.join(shots, 'hero-phrase-entering.png') });
  await phase(heroPage, 'dwell');
  fullyReadable(await phraseState(heroPage));
  assert.equal((await phraseState(heroPage)).height, readable.height, 'The loop reserves stable layout height');
  const fadeDurations = await heroPage.evaluate(() => {
    const phases = window.heroEvidence.phases;
    const leaving = phases.findIndex(p => p.phase === 'leaving');
    const entering = phases.findIndex((p, i) => i > leaving && p.phase === 'entering');
    const settled = phases.findIndex((p, i) => i > entering && p.phase === 'dwell');
    return [phases[entering].at - phases[leaving].at, phases[settled].at - phases[entering].at];
  });
  assert(fadeDurations.every(duration => duration >= 990 && duration < 1900),
    `Both whole-line fades are gradual: ${fadeDurations.join(', ')} ms`);
  for (const changingPhase of ['dwell', 'leaving', 'entering']) {
    await phase(heroPage, changingPhase);
    const before = await phraseState(heroPage);
    const language = await heroPage.locator('html').getAttribute('lang') === 'en' ? 'es' : 'en';
    await chooseLanguage(heroPage, language); await phase(heroPage, 'dwell');
    const translated = await phraseState(heroPage); fullyReadable(translated);
    assert.notEqual(translated.text, before.text, 'Locale changes immediately settle the current line in its new language');
    await heroPage.waitForTimeout(450);
    assert.deepEqual(await phraseState(heroPage), translated, 'Canceled locale transitions cannot replace or hide the translated phrase');
  }
  await go(heroPage, 'practice'); await phase(heroPage, 'paused');
  const offSection = await phraseState(heroPage); fullyReadable(offSection);
  await heroPage.waitForTimeout(700);
  assert.deepEqual(await phraseState(heroPage), offSection, 'Off-section phrase work is suspended');
  await go(heroPage, 'main'); await phase(heroPage, 'dwell');
  await phase(heroPage, 'leaving');
  // Exercise visibility cancellation without depending on headless tab policy.
  await heroPage.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await phase(heroPage, 'paused');
  const hidden = await phraseState(heroPage); fullyReadable(hidden);
  await heroPage.waitForTimeout(700);
  assert.deepEqual(await phraseState(heroPage), hidden, 'Hidden-document cancellation leaves no continuing phrase animation');
  await heroPage.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await phase(heroPage, 'dwell');
  await heroPage.setViewportSize({ width: 320, height: 568 });
  await heroPage.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await heroPage.locator('.hero-story').scrollIntoViewIfNeeded();
  await phase(heroPage, 'dwell'); fullyReadable(await phraseState(heroPage));
  await geometry(heroPage);
  await phase(heroPage, 'entering'); await geometry(heroPage);
  await heroPage.emulateMedia({ reducedMotion: 'reduce' });
  assert(await heroPage.locator('.hero-story').isVisible(), 'The rotating introduction stays visible under reduced-motion emulation');
  await phase(heroPage, 'dwell'); fullyReadable(await phraseState(heroPage));
  await phase(heroPage, 'leaving');
  await heroPage.waitForTimeout(300);
  const preferenceFade = await phraseState(heroPage);
  assert(preferenceFade.opacity > 0 && preferenceFade.opacity < 1,
    'The next phrase still fades under reduced-motion emulation');
  await heroPage.context().close();
  console.log('PASS: slower whole-line fades, long stationary reading, locale cancellation, hidden-tab suspension and continuing animation across motion preferences');

  for (const id of ids) {
    await go(page, id); await geometry(page);
    if (shots) await page.screenshot({ path: path.join(shots, `desktop-${id}.png`) });
  }
  await go(page, 'practice');
  const transitionFrames = await page.evaluate(async () => {
    const frames = [], start = performance.now();
    document.querySelector('.section-nav a[href="#orchestration"]').click();
    return new Promise(resolve => {
      const sample = () => {
        const elapsed = performance.now() - start;
        const transitioning = document.querySelector('main').dataset.transitioning === 'true';
        frames.push({ elapsed, transitioning, opacity: Number(getComputedStyle(document.querySelector('#orchestration')).opacity) });
        if (transitioning && elapsed < 5000) requestAnimationFrame(sample);
        else resolve(frames);
      };
      requestAnimationFrame(sample);
    });
  });
  assert.equal(await page.locator('.atmosphere__transition').count(), 0, 'Navigation does not create a decorative transition layer');
  assert(transitionFrames[0].opacity < 0.1, 'Incoming text waits while the outgoing view dissolves');
  assert(transitionFrames.some(frame => frame.opacity > 0 && frame.opacity < 1), 'Navigation actually fades the incoming view');
  assert(transitionFrames.some(frame => frame.elapsed > 1200 && frame.transitioning), 'The gentle transition remains active beyond 1.2 seconds');
  await active(page, 'orchestration');
  assert.equal(await page.locator('.atmosphere__transition').count(), 0, 'The persistent background remains independent of navigation');
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

  await (await sectionLink(page, 'practice')).click();
  await page.waitForTimeout(100);
  const unrevealed = await page.locator('#practice').evaluate(el => Number(getComputedStyle(el).opacity));
  await page.locator('.section-nav a[href="#orchestration"]').click({ force: true });
  const interrupted = await page.locator('#practice').evaluate(el => Number(getComputedStyle(el).opacity));
  assert(interrupted <= unrevealed + 0.05, 'Rapid navigation cannot flash text that has not appeared yet');
  await active(page, 'orchestration');
  await go(page, 'main');
  await (await sectionLink(page, 'practice')).click();
  await page.waitForTimeout(170);
  // A user can activate a moving header control; skip Playwright's automatic
  // geometry-stability wait so this actually interrupts the flight.
  const beforeReverse = await brandFrame(page);
  await page.locator('.wordmark').click({ force: true });
  const afterReverse = await brandFrame(page);
  assert(afterReverse.transitioning && afterReverse.traveler.visible && !afterReverse.hero.visible, 'Interrupted flight keeps one visible bitmap');
  assert(Math.abs(afterReverse.traveler.cy - beforeReverse.traveler.cy) < 40, 'The reversed bitmap starts from its current position');
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

  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 360, height: 800 }, { width: 430, height: 932 }, { width: 844, height: 390 }]) {
    const mobile = await open({ viewport, isMobile: true, hasTouch: true });
    await active(mobile, 'main');
    const shell = await mobile.evaluate(() => {
      const hero = document.querySelector('.hero'), panel = hero.getBoundingClientRect();
      const style = getComputedStyle(hero), mark = document.querySelector('.hero-mark').getBoundingClientRect();
      const cta = hero.querySelector('.btn-primary').getBoundingClientRect(), story = hero.querySelector('.hero-story').getBoundingClientRect();
      return { readingWidth: hero.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
        center: mark.x + mark.width / 2, footer: document.querySelector('.site-footer').getBoundingClientRect().height,
        header: document.querySelector('.site-header').getBoundingClientRect().height,
        propositionVisible: story.top >= panel.top && story.bottom <= panel.bottom,
        ctaVisible: cta.top >= panel.top && cta.bottom <= panel.bottom };
    });
    assert(shell.readingWidth >= viewport.width - 40, 'Compact panels reclaim the rail gutter');
    if (viewport.width === 320) assert(shell.readingWidth >= 288);
    if (viewport.width < 600) assert(Math.abs(shell.center - viewport.width / 2) <= 2, 'Portrait brand is centered');
    assert(shell.footer <= 52 && shell.header === 60, 'Compact chrome leaves space for reading');
    if ([390, 844].includes(viewport.width)) assert(shell.propositionVisible && shell.ctaVisible, 'Proposition and primary CTA are initially visible');
    const toggle = mobile.locator('.section-menu-toggle'), menu = mobile.locator('.section-nav');
    assert(await toggle.isVisible()); assert(await menu.isHidden());
    await toggle.tap();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    const choices = await menu.locator('a').evaluateAll(links => links.map(link => ({
      height: link.getBoundingClientRect().height, label: link.querySelector('.section-nav__label').textContent.trim(),
      opacity: Number(getComputedStyle(link.querySelector('.section-nav__label')).opacity),
    })));
    assert.equal(choices.length, 6);
    assert(choices.every(choice => choice.height >= 44 && choice.label && choice.opacity === 1), 'Every mobile destination is named with a usable touch target');
    await menu.locator('a').first().focus();
    await mobile.keyboard.press('End'); await mobile.keyboard.press('PageDown');
    assert.equal(await mobile.locator('main').getAttribute('data-active-section'), 'main', 'Menu keys never route the underlying section');
    const menuBox = await menu.boundingBox();
    await mobile.mouse.move(menuBox.x + 30, menuBox.y + 30); await mobile.mouse.wheel(0, 180);
    await mobile.waitForTimeout(100);
    assert.equal(await mobile.locator('main').getAttribute('data-active-section'), 'main', 'Menu wheel input stays in the disclosure');
    await mobile.keyboard.press('Escape');
    assert(await menu.isHidden());
    assert(await toggle.evaluate(el => el === document.activeElement), 'Escape restores focus to Menu');
    assert(await menu.evaluate(el => el.inert), 'Closed menu links are outside keyboard navigation');
    await toggle.tap();
    await mobile.mouse.click(viewport.width - 3, viewport.height - 3);
    assert(await menu.isHidden());
    assert(await toggle.evaluate(el => el === document.activeElement), 'Outside cancellation restores focus');
    await toggle.tap(); await menu.locator('a[href="#practice"]').tap(); await active(mobile, 'practice');
    assert(await menu.isHidden());
    assert(await mobile.locator('#practice').evaluate(el => el === document.activeElement), 'Selecting a destination transfers focus to its panel');
    if (viewport.width === 390) await brandJourney(mobile, 'mobile-brand');
    for (const id of ids) {
      await go(mobile, id); await geometry(mobile);
      await edge(mobile, true);
      const reachable = await mobile.locator('.section-panel.is-active').evaluate(p => p.scrollHeight - p.scrollTop - p.clientHeight <= 2);
      assert(reachable, 'Tall content remains reachable');
      if (shots && viewport.width === 390) await mobile.screenshot({ path: path.join(shots, `mobile-${id}.png`) });
    }
    await go(mobile, 'lifecycle');
    const flow = await mobile.evaluate(() => {
      const list = document.querySelector('.lifecycle').getBoundingClientRect();
      const layer = document.querySelector('.lifecycle-layer').getBoundingClientRect();
      return { width: list.width, below: layer.top >= list.bottom,
        aligned: [...document.querySelectorAll('.phase-body p')].every(el => Math.abs(el.getBoundingClientRect().left - list.left) < 1) };
    });
    assert(flow.width >= viewport.width - 40 && flow.below && flow.aligned,
      'Compact lifecycle retains its full column and places verification below stage seven, including landscape');
    if (viewport.width < 600) {
      const descriptions = await mobile.locator('.phase-body p').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().width));
      assert(descriptions.every(width => width >= viewport.width - 40), 'Lifecycle descriptions use the reading column below the number/title');
    }
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
  console.log('PASS: centered compact layouts, named disclosure, first-view message, full-width lifecycle and trusted touch boundaries');

  const breakpoint = await open({ viewport: { width: 390, height: 844 } });
  await breakpoint.locator('.section-menu-toggle').click();
  await breakpoint.setViewportSize({ width: 1440, height: 1000 });
  await breakpoint.waitForTimeout(150);
  assert(await breakpoint.locator('.section-menu-toggle').isHidden());
  assert(await breakpoint.locator('.wordmark').evaluate(el => el === document.activeElement), 'Desktop resize transfers focus to the visible home control');
  assert(await breakpoint.locator('.section-nav').isVisible());
  await breakpoint.locator('.section-nav a').first().focus();
  await breakpoint.setViewportSize({ width: 320, height: 568 });
  await breakpoint.waitForTimeout(150);
  assert(await breakpoint.locator('.section-nav').isHidden());
  assert(await breakpoint.locator('.section-menu-toggle').evaluate(el => el === document.activeElement), 'Compact resize recovers focus from hidden rail links');
  await breakpoint.context().close();
  console.log('PASS: breakpoint changes clear the disclosure and preserve a visible focus target');

  const liveText = await open({ viewport: { width: 320, height: 568 }, reducedMotion: 'reduce' }, '#lifecycle');
  await active(liveText, 'lifecycle');
  await liveText.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  // A live text-size change must work without a resize event to repair the header.
  await liveText.waitForFunction(() => {
    const dock = document.querySelector('.brand-dock').getBoundingClientRect();
    return [...document.querySelectorAll('.section-menu-toggle, .header-cta')].every(el => {
      const r = el.getBoundingClientRect();
      return Math.min(dock.right, r.right) <= Math.max(dock.left, r.left) || Math.min(dock.bottom, r.bottom) <= Math.max(dock.top, r.top);
    });
  }, null, { timeout: 2000 });
  await geometry(liveText);
  assert(await liveText.locator('.section-panel.is-active').evaluate(el => el.clientHeight >= 350));
  await liveText.context().close();
  console.log('PASS: live text enlargement reflows header controls without a viewport resize');

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

  {
    const bilingual = await open({ viewport: { width: 1440, height: 1000 }, locale: 'es-ES', reducedMotion: 'reduce' });
    await active(bilingual, 'main');
    assert.equal(await bilingual.locator('html').getAttribute('lang'), 'en', 'English is default regardless of browser locale');
    assert.equal(await bilingual.locator('#site-language').count(), 1);
    assert.equal(await bilingual.locator('#site-language').evaluate(el => el.tagName), 'BUTTON');
    assert.equal(await bilingual.locator('#site-language').getAttribute('type'), 'button');
    assert.equal(await bilingual.locator('.language-control select, .language-control label').count(), 0, 'The language control has no dropdown or visible label');
    await chooseLanguage(bilingual, 'en');
    await bilingual.locator('#site-language').focus(); await bilingual.keyboard.press('Enter');
    await bilingual.waitForFunction(() => document.documentElement.lang === 'es');
    assert.equal(await bilingual.locator('#site-language').textContent(), 'SP');
    await bilingual.keyboard.press('Space');
    await bilingual.waitForFunction(() => document.documentElement.lang === 'en');
    assert.equal(await bilingual.locator('#site-language').textContent(), 'EN');
    assert.equal(await bilingual.locator('main').getAttribute('data-active-section'), 'main', 'Native language-button keys do not navigate sections');
    const english = {};
    const spanish = { practice: 'Qué hace AEKR', orchestration: 'Gravital Orchestration', lifecycle: 'Cómo avanza el trabajo',
      engagements: 'Un proyecto. Distintos niveles de entrega.', why: 'Ingeniería controlada, más rápida', contact: 'Cuéntanos qué necesitas crear' };
    for (const id of ids.slice(1)) {
      await go(bilingual, id);
      english[id] = await bilingual.locator(`#${id} h2`).textContent();
    }
    await chooseLanguage(bilingual, 'es');
    for (const id of ids.slice(1)) {
      await go(bilingual, id); await geometry(bilingual);
      assert.equal(await bilingual.locator(`#${id} h2`).textContent(), spanish[id], `${id} has the intended Spanish heading or preserved official name`);
    }
    assert.equal(await bilingual.locator('.header-cta').textContent(), 'Contacto');
    await bilingual.locator('#contact-email').fill('language@example.invalid');
    await bilingual.locator('#contact-comment').fill('Preservar este borrador.');
    await chooseLanguage(bilingual, 'en');
    assert.equal(await bilingual.locator('#contact-comment').inputValue(), 'Preservar este borrador.');
    for (const id of ids.slice(1)) {
      await go(bilingual, id);
      assert.equal(await bilingual.locator(`#${id} h2`).textContent(), english[id], 'English round-trip restores original copy');
    }
    await chooseLanguage(bilingual, 'es');
    await bilingual.reload(); await active(bilingual, 'contact');
    assert.equal(await bilingual.locator('html').getAttribute('lang'), 'es', 'An explicit selection persists after reload');
    assert.equal(await bilingual.locator('#site-language').textContent(), 'SP');
    await bilingual.locator('button[data-request-type="contact"]').click();
    assert((await bilingual.locator('#form-status').textContent()).includes('correo'), 'Validation is in the selected language');
    const endpoint = new URL('api/contact', base).href;
    let resolveRequest;
    const request = new Promise(resolve => { resolveRequest = resolve; });
    await bilingual.route(endpoint, route => resolveRequest(route));
    await bilingual.locator('#contact-email').fill('locale@example.invalid');
    await bilingual.locator('#contact-comment').fill('Draft during locale switch.');
    await bilingual.locator('button[data-request-type="contact"]').click();
    const pending = await request;
    assert.equal(await bilingual.locator('#form-status').textContent(), 'Enviando…');
    await chooseLanguage(bilingual, 'en');
    assert.equal(await bilingual.locator('#form-status').textContent(), 'Sending…');
    assert.equal(await bilingual.locator('#contact-comment').inputValue(), 'Draft during locale switch.');
    assert.equal(await bilingual.locator('#contact-form button:enabled').count(), 0, 'Language changes preserve the in-flight guard');
    await pending.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false}' });
    await bilingual.waitForFunction(() => document.querySelector('.form-status--error'));
    assert.equal(await bilingual.locator('#form-status').textContent(), "We couldn't send your request. Please try again.");
    await chooseLanguage(bilingual, 'es');
    assert.notEqual(await bilingual.locator('#form-status').textContent(), "We couldn't send your request. Please try again.");
    await bilingual.route(endpoint, route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    await bilingual.locator('button[data-request-type="contact"]').click();
    await bilingual.waitForFunction(() => document.getElementById('contact-form').hidden);
    assert.equal(await bilingual.locator('#contact-thanks h3').textContent(), 'Gracias.');
    await chooseLanguage(bilingual, 'en');
    assert(await bilingual.locator('#contact-form').isHidden(), 'Changing language does not reopen a completed form');
    assert.equal(await bilingual.locator('#contact-thanks h3').textContent(), 'Thank you.');
    await bilingual.context().close();

    const mobileLanguage = await open({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await chooseLanguage(mobileLanguage, 'es');
    await mobileLanguage.locator('#site-language').focus();
    await mobileLanguage.setViewportSize({ width: 1280, height: 900 });
    await mobileLanguage.waitForFunction(() => !document.documentElement.classList.contains('sections-compact'));
    assert(await mobileLanguage.locator('#site-language').isVisible());
    assert(await mobileLanguage.evaluate(() => document.activeElement.checkVisibility({ checkVisibilityCSS: true })),
      'Reparenting the focused language button leaves focus on a visible control');
    await mobileLanguage.setViewportSize({ width: 320, height: 568 });
    await mobileLanguage.waitForFunction(() => document.documentElement.classList.contains('sections-compact'));
    assert(await mobileLanguage.evaluate(() => document.activeElement.checkVisibility({ checkVisibilityCSS: true })));
    await mobileLanguage.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    for (const id of ids.slice(1)) { await go(mobileLanguage, id); await geometry(mobileLanguage); }
    await mobileLanguage.locator('.section-menu-toggle').click();
    await mobileLanguage.locator('#site-language').scrollIntoViewIfNeeded();
    const target = await mobileLanguage.locator('#site-language').boundingBox();
    assert(target.height >= 44 && target.width >= 44, 'Language choice is touch accessible at enlarged text');
    if (shots) await mobileLanguage.screenshot({ path: path.join(shots, 'mobile-spanish-menu-enlarged.png') });
    await mobileLanguage.context().close();

    const landscapeLanguage = await open({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    await chooseLanguage(landscapeLanguage, 'es');
    await landscapeLanguage.locator('.section-menu-toggle').click();
    await active(landscapeLanguage, 'main');
    const landscapeFit = await landscapeLanguage.evaluate(() => {
      const panel = document.querySelector('.hero').getBoundingClientRect();
      return [...document.querySelectorAll('.hero .eyebrow, .hero .btn-primary, .hero-story')].every(el => {
        const box = el.getBoundingClientRect(); return box.top >= panel.top && box.bottom <= panel.bottom;
      });
    });
    assert(landscapeFit, 'Spanish landscape keeps the full legend, phrase and primary CTA above the fixed footer');
    if (shots) await landscapeLanguage.screenshot({ path: path.join(shots, 'landscape-spanish-home.png') });
    await landscapeLanguage.context().close();

    const mediumLanguage = await open({ viewport: { width: 768, height: 900 }, reducedMotion: 'reduce' }, '#practice');
    await chooseLanguage(mediumLanguage, 'es');
    await mediumLanguage.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await mediumLanguage.waitForTimeout(150);
    await geometry(mediumLanguage);
    const languageFits = await mediumLanguage.locator('#site-language').evaluate(el => {
      const range = document.createRange(); range.selectNodeContents(el);
      const text = range.getBoundingClientRect(), box = el.getBoundingClientRect();
      return text.left >= box.left && text.right <= box.right && text.top >= box.top && text.bottom <= box.bottom;
    });
    assert(languageFits, 'The enlarged SP language code fits inside its button at the desktop breakpoint');
    assert(await mediumLanguage.evaluate(() => {
      const boxes = [...document.querySelectorAll('.site-header .wordmark, .site-header .language-control, .header-cta, .brand-dock')]
        .filter(el => el.checkVisibility({ checkVisibilityCSS: true })).map(el => el.getBoundingClientRect());
      return boxes.every((box, i) => boxes.slice(i + 1).every(other =>
        Math.min(box.right, other.right) <= Math.max(box.left, other.left) + 1 ||
        Math.min(box.bottom, other.bottom) <= Math.max(box.top, other.top) + 1));
    }), 'Enlarged header controls do not overlap each other or the centered symbol');
    if (shots) await mediumLanguage.screenshot({ path: path.join(shots, 'desktop-breakpoint-spanish-enlarged.png') });
    await mediumLanguage.context().close();

    const blockedStorage = await open({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }, '', {}, () => {
      Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
    });
    assert.equal(await blockedStorage.locator('html').getAttribute('lang'), 'en');
    await chooseLanguage(blockedStorage, 'es'); await go(blockedStorage, 'contact');
    assert.equal(await blockedStorage.locator('.header-cta').textContent(), 'Contacto');
    await blockedStorage.reload();
    assert.equal(await blockedStorage.locator('html').getAttribute('lang'), 'en', 'Blocked storage falls back to English without breaking selection');
    await blockedStorage.context().close();
    console.log('PASS: English default, complete section switching, preference, accessible mobile language button and localized contact states without lost drafts');
  }

  for (const unavailable of ['controller', 'web-animations']) {
    const ordinary = await open({ viewport: { width: 320, height: 568 } }, '',
      unavailable === 'controller' ? { 'sections.js': '/* Optional navigation controller unavailable. */' } : {},
      unavailable === 'web-animations' ? () => { Element.prototype.animate = undefined; } : undefined);
    assert.equal(await ordinary.locator('html.sections-enabled:not(.sections-ready)').count(), 1);
    assert(await ordinary.locator('.hero-phrase.is-current').isVisible(),
      'Without the optional controller or motion capability the static introduction remains readable');
    for (const language of ['en', 'es']) {
      await chooseLanguage(ordinary, language);
      assert.equal(await ordinary.locator('html').getAttribute('lang'), language);
      assert.equal((await ordinary.locator('.hero-phrase.is-current').textContent()).trim(), language === 'es'
        ? 'Ingeniería nativa en IA, orquestada por personas.'
        : 'An AI-native, human-orchestrated engineering practice.', 'The static introduction follows the fallback language');
      assert(await ordinary.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        'Without the optional section controller, the bilingual document has no horizontal overflow');
      const contact = await ordinary.locator('.header-cta').boundingBox();
      assert(contact.x >= 0 && contact.x + contact.width <= 321, 'Fallback Contact remains inside the viewport');
      await ordinary.locator('.section-menu-fallback').click();
      await ordinary.locator('.section-nav a[href="#practice"]').click();
      assert(await ordinary.locator('#practice').isVisible(), 'Native fragment navigation exposes the selected panel');
      await ordinary.locator('.section-menu-fallback').click();
      await ordinary.locator('.section-home-fallback').click();
    }
    await ordinary.context().close();
  }
  console.log('PASS: bilingual native-panel fallback fits when navigation or its animation capability is unavailable');

  const reduced = await open({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' }, '#why');
  await active(reduced, 'why');
  const direct = await brandFrame(reduced);
  assert(direct.docked && !direct.transitioning && direct.traveler.visible, 'Direct links initialize already docked');
  await reduced.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await reduced.waitForTimeout(300); await geometry(reduced);
  await (await sectionLink(reduced, 'contact')).click();
  await reduced.waitForTimeout(1000);
  const preferredTransition = await reduced.evaluate(() => ({
    active: document.querySelector('main').dataset.transitioning,
    opacity: Number(getComputedStyle(document.querySelector('#contact')).opacity),
  }));
  assert.equal(preferredTransition.active, 'true');
  assert(preferredTransition.opacity > 0 && preferredTransition.opacity < 1,
    'Section fades remain visible under reduced-motion emulation');
  await active(reduced, 'contact'); await geometry(reduced); await edge(reduced, true);
  await reduced.setViewportSize({ width: 320, height: 568 });
  for (const id of ids) {
    await go(reduced, id); await geometry(reduced); await edge(reduced, true);
    assert(await reduced.locator('.section-panel.is-active').evaluate(el => el.clientHeight >= 350),
      'The compact shell preserves a useful reading viewport at 200% text');
    if (id === 'lifecycle') {
      assert(await reduced.locator('.phase-body p').evaluateAll(elements => elements.every(el => el.getBoundingClientRect().width >= 260)),
        'Enlarged lifecycle prose retains its full reading width');
    }
    if (id !== 'main') {
      const frame = await brandFrame(reduced);
      assert(Math.abs(frame.traveler.cx - frame.width / 2) <= 1);
      const collides = await reduced.evaluate(() => {
        const mark = document.querySelector('.brand-dock').getBoundingClientRect();
        return [...document.querySelectorAll('.wordmark, .section-menu-toggle, .header-cta')].filter(el => el.checkVisibility()).some(el => {
          const r = el.getBoundingClientRect();
          return Math.min(mark.right, r.right) > Math.max(mark.left, r.left) && Math.min(mark.bottom, r.bottom) > Math.max(mark.top, r.top);
        });
      });
      assert(!collides, 'Enlarged text controls do not collide with the centered symbol');
    }
  }
  await reduced.emulateMedia({ reducedMotion: 'no-preference' });
  await go(reduced, 'main');
  await (await sectionLink(reduced, 'practice')).click();
  await reduced.waitForTimeout(80);
  const contactUnclipped = await reduced.evaluate(() => {
    const el = document.querySelector('.header-cta'), r = el.getBoundingClientRect();
    return document.elementFromPoint(r.x + r.width / 2, r.bottom - 4)?.closest('.header-cta') === el;
  });
  assert(contactUnclipped, 'The enlarged Contact control remains visible and clickable while the header grows');
  await active(reduced, 'practice');
  const fallback = await open({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  assert.equal(await fallback.locator('main > section:visible').count(), 1);
  assert.equal(await fallback.locator('html.sections-enabled:not(.sections-ready)').count(), 1);
  await fallback.locator('.section-menu-fallback').click();
  await fallback.locator('.section-nav a[href="#contact"]').click();
  assert(await fallback.locator('#contact').isVisible());
  await fallback.locator('.section-menu-fallback').click();
  await fallback.locator('.section-home-fallback').click();
  assert(await fallback.locator('.hero').isVisible());
  assert.deepEqual(errors, []);
  console.log('PASS: enlarged text, animation under either motion preference, no-JavaScript fallback and zero page errors');
} finally {
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
