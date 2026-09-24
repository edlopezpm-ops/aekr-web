const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

// Exercise the real renderer with controlled browser scheduling, image loading
// and Canvas draw observation. Visual fidelity is reviewed in a real browser.
const read = name => fs.readFileSync(path.join(__dirname, '../public', name), 'utf8');
const configSource = read('microscales-config.js');
const rendererSource = read('microscales.js');
const identity = [1, 0, 0, 1, 0, 0];
function setup(options = {}) {
  const events = new Map(), callbacks = new Map(), properties = new Map();
  const add = target => (name, fn) => {
    const key = `${target}:${name}`;
    events.set(key, [...events.get(key) || [], fn]);
  };
  let now = 0, id = 0, drawCount = 0, imageCount = 0;
  let width = options.width || 1440, height = options.height || 1000;
  let drawing = [], position, angle, projection, throwDrawing = false, model;
  const context = {
    globalAlpha: 1,
    setTransform(a, b, _c, _d, x, y) {
      if (options.countOnly) return;
      const dpr = Math.min(options.dpr || 1, model.config.maxDpr, Math.sqrt(model.config.maxPixels / (width * height)));
      position = [x / dpr, y / dpr]; angle = Math.atan2(b, a); projection = identity;
    },
    clearRect() { drawing = []; drawCount++; },
    transform(...values) { projection = values; },
    drawImage(_sprite, ...args) {
      if (throwDrawing) throw new Error('Canvas unavailable');
      if (options.countOnly) { drawing.length++; return; }
      const size = args.length === 4 ? args[2] : args[6];
      drawing.push({ position, angle, size, alpha: this.globalAlpha, projection });
    },
  };
  const canvas = { hidden: false, addEventListener: add('canvas'), getContext: () => options.noContext ? null : context };
  const root = { dataset: {}, querySelector: () => canvas,
    style: { setProperty: (key, value) => properties.set(key, value) },
    getBoundingClientRect: () => ({ width, height }) };
  const motion = { matches: !!options.reduced, addEventListener: add('motion') };
  const document = { hidden: !!options.hidden, currentScript: { src: 'https://aekr.test/microscales.js' }, addEventListener: add('document'),
    querySelector: selector => selector === '.atmosphere' ? root : null };
  let image;
  const sandbox = { document, URL, matchMedia: () => motion, devicePixelRatio: options.dpr || 1,
    addEventListener: add('window'), requestAnimationFrame: fn => { callbacks.set(++id, fn); return id; },
    cancelAnimationFrame: key => callbacks.delete(key),
    Image: class { constructor() { image = this; imageCount++; } } };
  sandbox.window = sandbox;
  const scope = vm.createContext(sandbox);
  vm.runInContext(configSource, scope);
  // A private fixture of the existing timing parameter supplies a same-frame
  // surface reference without adding a renderer hook or reproducing its PRNG.
  if (options.noEmissions) sandbox.AEKRMicroscales = Object.freeze({ ...sandbox.AEKRMicroscales,
    config: Object.freeze({ ...sandbox.AEKRMicroscales.config, firstEmission: Number.MAX_SAFE_INTEGER }) });
  model = sandbox.AEKRMicroscales;
  vm.runInContext(rendererSource, scope);
  const emit = (target, name, event) => { for (const fn of events.get(`${target}:${name}`) || []) fn(event); };
  return { root, canvas, properties, callbacks, events, model,
    dimensions: () => ({ width, height }),
    draws: () => drawing, drawCount: () => drawCount, imageCount: () => imageCount,
    load: () => image.onload(), imageFail: () => image.onerror(),
    rerun: () => vm.runInContext(rendererSource, scope),
    emit,
    hidden(value) { document.hidden = value; emit('document', 'visibilitychange'); },
    reduced(value) { motion.matches = value; emit('motion', 'change'); },
    resize(w, h) { width = w; height = h; emit('window', 'resize'); },
    failDraw() { throwDrawing = true; },
    advance(milliseconds, step = 40) {
      const end = now + milliseconds;
      while (now < end) {
        now = Math.min(end, now + step);
        const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(fn => fn(now));
      }
    },
  };
}
const comparable = env => JSON.stringify(env.draws());
// Conservative source envelope: partial sprites and their maximum surface
// travel stay eligible at edges. Flights have their own bounded lifetime.
function visibleSources(env) {
  const { width, height } = env.dimensions(), { config, sources } = env.model;
  const mobile = width < config.mobileBreakpoint, worldWidth = mobile ? config.mobileWidth : config.width;
  const scale = Math.max(width / worldWidth, height / config.height);
  return sources.map(source => {
    const x = width - worldWidth * scale + source.x * (mobile ? config.mobileWidth / config.width : 1) * scale;
    const y = (height - config.height * scale) / 2 + source.y * scale;
    const size = source.size * (mobile ? config.mobileSize : 1) * scale;
    return { source, x, y, size, scale, margin: size + config.surfaceTravel[1] * scale };
  }).filter(p => p.x > -p.margin && p.x < width + p.margin && p.y > -p.margin && p.y < height + p.margin);
}
const first = setup(), second = setup();
assert.equal(JSON.stringify(first.model.points), JSON.stringify(second.model.points), 'distribution is reproducible');
assert.equal(first.model.points.length, first.model.config.count);
assert.deepEqual(Array.from(first.model.sources, source => source.index),
  Array.from(first.model.points.filter(point => point.alpha > 0), source => source.index), 'every positive-alpha scale is a source');
assert.equal(new Set(first.model.sources.map(source => source.index)).size, first.model.sources.length);
assert.equal(first.model.config.maxDesktop, 96); assert.equal(first.model.config.maxMobile, 66);
assert.deepEqual(Array.from(first.model.config.emission), [60, 120]);
assert.equal(first.callbacks.size, 0, 'loading image does not start continuous work');
first.load(); second.load();
assert.equal(first.root.dataset.renderer, 'canvas2d');
assert.equal(first.callbacks.size, 1);
assert.equal(first.draws().length, visibleSources(first).length, 'the whole visible source envelope is drawn');
assert.ok(first.draws().every(item => item.alpha > 0 && item.alpha <= 1));
assert.equal(comparable(first), comparable(second));
const listenerCount = first.events.size;
first.rerun();
assert.equal(first.events.size, listenerCount);
assert.ok([...first.events.values()].every(listeners => listeners.length === 1), 'initialization never duplicates listeners');
assert.equal(first.imageCount(), 1);
assert.equal(first.callbacks.size, 1);
console.log('PASS all positive-alpha sources, complete visible surface, reproducibility and single initialization');

// The first flight replaces one source at the exact source position, scale,
// orientation and opacity. It does not draw an identical copy underneath.
const transfer = setup(), reference = setup({ noEmissions: true }); transfer.load(); reference.load();
for (let elapsed = 0; elapsed < 10000 && transfer.root.dataset.particles === '0'; elapsed += 40) {
  transfer.advance(40); reference.advance(40);
}
assert.equal(transfer.root.dataset.particles, '1');
assert.equal(transfer.draws().length, reference.draws().length);
const airborne = transfer.draws().at(-1);
const original = reference.draws().find(item => item.size === airborne.size);
assert.ok(original, 'flight starts at a real surface source in its emission frame');
assert.deepEqual(airborne, original, 'position, roll, size, opacity and projection transfer without a discontinuity');
assert.equal(transfer.draws().filter(item => item.size === airborne.size).length, 1);
transfer.advance(80);
assert.ok(transfer.draws().find(item => item.size === airborne.size).position[0] < airborne.position[0], 'flight advances left');
assert.equal(transfer.draws().filter(item => item.size === airborne.size).length, 1, 'origin remains absent during early detachment');
let copies = [];
for (let elapsed = 0; elapsed < 4000 && copies.length < 2; elapsed += 40) {
  transfer.advance(40);
  copies = transfer.draws().filter(item => item.size === original.size);
}
assert.equal(copies.length, 2, 'vacated source regrows during the trajectory');
assert.ok(Math.hypot(copies[0].position[0] - copies[1].position[0], copies[0].position[1] - copies[1].position[1]) >= original.size - 1,
  'regrowth starts after a full emblem width of clearance, within one pixel of continuing surface drift');
console.log('PASS source-to-flight transfer without duplicate, preserved emblem and leftward movement');

const surface = setup({ noEmissions: true }); surface.load();
const surfaceBounds = new Map(visibleSources(surface).map(item => [item.size, item]));
const tracks = surface.draws().filter(item => item.alpha > 0.02 && item.position[0] > 50 && item.position[0] < 1390
  && item.position[1] > 50 && item.position[1] < 950).slice(0, 24).map(item => ({
  first: item, previous: item, hidden: false, leftSteps: 0, resets: [],
  minY: item.position[1], maxY: item.position[1], minAngle: item.angle, maxAngle: item.angle,
}));
assert.equal(tracks.length, 24);
assert.deepEqual(Array.from(surface.model.config.surfaceCycle), [14000, 26000]);
assert.deepEqual(Array.from(surface.model.config.surfaceTravel), [2, 5]);
for (let sample = 0; sample < 750; sample++) {
  surface.advance(40);
  const frame = new Map(surface.draws().map(item => [item.size, item]));
  for (const track of tracks) {
    const item = frame.get(track.first.size), base = surfaceBounds.get(track.first.size);
    if (!item) { track.hidden = true; continue; }
    assert.ok(item.alpha > 0);
    if (item.position[0] > track.previous.position[0] + 1e-8) {
      assert.ok(track.hidden, 'a surface reset returns right only after an invisible frame');
      track.resets.push(sample);
    } else if (item.position[0] < track.previous.position[0] - 1e-8) track.leftSteps++;
    assert.ok(item.position[0] <= base.x + 1e-8 && item.position[0] >= base.x - 5 * base.scale - 1e-8);
    assert.ok(Math.abs(item.position[1] - base.y) <= 2.01 * base.scale, 'vertical relief stays subtle even during gusts');
    assert.ok(Math.abs(item.angle - base.source.angle) <= 0.036, 'surface roll stays subtle');
    track.minY = Math.min(track.minY, item.position[1]); track.maxY = Math.max(track.maxY, item.position[1]);
    track.minAngle = Math.min(track.minAngle, item.angle); track.maxAngle = Math.max(track.maxAngle, item.angle);
    track.previous = item; track.hidden = false;
  }
}
assert.equal(surface.root.dataset.particles, '0');
assert.ok(tracks.every(track => track.leftSteps > 500 && track.resets.length > 0), 'all sampled scales drift left and complete a renewal');
assert.ok(tracks.every(track => track.maxY - track.minY > 0.5 && track.maxAngle - track.minAngle > 0.01));
assert.ok(new Set(tracks.map(track => track.resets[0])).size > 12, 'surface renewals are independently staggered');
assert.ok(new Set(tracks.map(track => (track.previous.position[1] - track.first.position[1]).toFixed(3))).size > 12,
  'surface scales have different vertical phases instead of a common rigid path');
console.log('PASS continuous leftward surface movement, invisible renewal and independent vertical/roll cycles');

// A live RAF and a nonzero pool did not make the former animation perceptible:
// symbols barely travelled before fading. Verify a useful visible journey.
const visible = setup(); visible.load();
while (visible.root.dataset.particles === '0') visible.advance(40);
const launched = visible.draws().at(-1);
visible.advance(4000);
const travelled = visible.draws().filter(item => item.size === launched.size).at(-1);
assert.ok(travelled, 'first detached emblem remains visible after four seconds');
assert.ok(launched.position[0] - travelled.position[0] > 100, 'visible flight crosses at least 100 CSS pixels');
assert.ok(travelled.alpha >= launched.alpha * 0.85, 'flight retains relief before dissolving');
assert.ok(Math.abs(travelled.position[1] - launched.position[1]) > 3, 'petal moves vertically as well as left');
assert.notDeepEqual(travelled.projection, launched.projection, 'petal tumbles in depth on independent axes');
const airbornePoses = visible.draws().filter(item => item.projection[0] !== 1);
assert.ok(new Set(airbornePoses.map(item => item.projection.join(','))).size > 4, 'petals do not share a rigid common orientation');
const verticalSteps = [];
let prior = travelled;
for (let sample = 0; sample < 8; sample++) {
  visible.advance(500);
  const current = visible.draws().filter(item => item.size === launched.size).at(-1);
  assert.ok(current);
  verticalSteps.push(current.position[1] - prior.position[1]); prior = current;
}
assert.ok(Math.max(...verticalSteps) - Math.min(...verticalSteps) > 2, 'independent gust targets change the petal vertical course');

const breeze = setup({ noEmissions: true }), passive = setup({ noEmissions: true }), singlePointer = setup({ noEmissions: true });
breeze.load(); passive.load(); singlePointer.load();
const target = breeze.draws().find(item => item.alpha > 0.2 && item.position[0] > 800 && item.position[0] < 1400
  && item.position[1] > 50 && item.position[1] < 950);
breeze.emit('window', 'pointermove', { clientX: target.position[0], clientY: target.position[1], pointerType: 'mouse' });
singlePointer.emit('window', 'pointermove', { clientX: target.position[0], clientY: target.position[1], pointerType: 'mouse' });
breeze.advance(80); passive.advance(80); singlePointer.advance(80);
assert.equal(breeze.root.dataset.particles, '1', 'pointer lifts a nearby source before the next autonomous emission');
assert.equal(passive.root.dataset.particles, '0');
const pointed = breeze.draws().at(-1);
assert.equal(pointed.size, target.size, 'the touched source supplies the new flight');
for (let i = 0; i < 100; i++) breeze.emit('window', 'pointermove', { clientX: target.position[0], clientY: target.position[1], pointerType: 'mouse' });
breeze.advance(80); singlePointer.advance(80);
assert.equal(comparable(breeze), comparable(singlePointer), 'pointer spam adds no work beyond one lift plus autonomous emissions');
passive.emit('window', 'pointermove', { clientX: target.position[0], clientY: target.position[1], pointerType: 'touch' });
passive.advance(80); assert.equal(passive.root.dataset.particles, '0', 'touch does not inject pointer gusts');
breeze.reduced(true);
breeze.emit('window', 'pointermove', { clientX: target.position[0], clientY: target.position[1], pointerType: 'mouse' });
breeze.advance(2000); assert.ok(Number(breeze.root.dataset.particles) > 0);
console.log('PASS visible multi-axis petal travel, source rebirth and bounded pointer detachment');

for (const { width, height, edge } of [
  { width: 1440, height: 1000, edge: 'left' }, { width: 1366, height: 600, edge: 'bottom' }, { width: 390, height: 844, edge: 'right' },
]) {
  const edgePointer = setup({ width, height, noEmissions: true }); edgePointer.load();
  const candidates = edgePointer.draws().filter(item => item.alpha > 0.001 && item.position[0] > 0 && item.position[0] < width
    && item.position[1] > 0 && item.position[1] < height);
  const marginalSource = candidates.find(item => edge === 'left' ? item.position[0] < width * 0.3 - 15
    : edge === 'bottom' ? item.position[1] > height - 12 : item.position[0] > width - 12);
  assert.ok(marginalSource, `${edge} has a visible source outside the former central-only zone`);
  edgePointer.emit('window', 'pointermove', { clientX: marginalSource.position[0], clientY: marginalSource.position[1], pointerType: 'mouse' });
  edgePointer.advance(80);
  assert.equal(edgePointer.root.dataset.particles, '1');
  assert.equal(edgePointer.draws().at(-1).size, marginalSource.size, `${edge} pointer lifts its actual nearby source`);
}
console.log('PASS partial edge sources lift without left or bottom dead zones');

for (const options of [{}, { width: 390, height: 844, dpr: 3 }]) {
  const env = setup({ ...options, countOnly: true }); env.load();
  const config = env.model.config;
  const cap = options.width ? config.maxMobile : config.maxDesktop;
  const envelopeCount = visibleSources(env).length;
  let maxParticles = 0, maxDraws = 0, departures = 0, previous = 0;
  for (let sample = 0; sample < 4500; sample++) {
    env.advance(40);
    const active = Number(env.root.dataset.particles);
    assert.ok(active <= cap);
    assert.equal(env.callbacks.size, 1);
    maxParticles = Math.max(maxParticles, active); maxDraws = Math.max(maxDraws, env.draws().length);
    if (active < previous) departures++;
    previous = active;
  }
  assert.equal(maxParticles, options.width ? 66 : 96, 'the requested flight capacity is reached');
  assert.ok(departures > 0, 'particles expire over a three-minute run');
  assert.ok(maxDraws <= envelopeCount + cap * 4, 'per-frame work is bounded by the source envelope plus four fragments per flight');
  assert.ok(env.canvas.width <= (options.width || 1440) * config.maxDpr);
  console.log(`PASS ${options.width ? 'mobile' : 'desktop'} three-minute lifecycle: maximum ${maxParticles}/${cap} flights, ${maxDraws} sprite draws`);
}

const pause = setup(); pause.load(); pause.advance(8000);
{
  const before = comparable(pause), particles = pause.root.dataset.particles, calls = pause.drawCount();
  pause.hidden(true); assert.equal(pause.callbacks.size, 0); assert.equal(pause.root.dataset.paused, 'true');
  pause.advance(90000); assert.equal(pause.drawCount(), calls); assert.equal(comparable(pause), before);
  pause.hidden(false); assert.equal(pause.callbacks.size, 1);
  pause.advance(40); assert.equal(comparable(pause), before, 'first resume frame resets the clock without catch-up');
  pause.advance(40); assert.equal(pause.root.dataset.particles, particles, 'resume does not burst accumulated emissions');
}
const beforeLocale = comparable(pause);
pause.emit('document', 'aekr:languagechange'); pause.emit('window', 'hashchange'); pause.emit('window', 'popstate');
assert.equal(comparable(pause), beforeLocale);
assert.equal(pause.callbacks.size, 1);
pause.reduced(true);
assert.equal(pause.callbacks.size, 1);
const reducedDraws = pause.drawCount(); pause.advance(2000); assert.ok(pause.drawCount() > reducedDraws);
pause.reduced(false); assert.equal(pause.callbacks.size, 1);
const preference = setup({ reduced: true }); preference.load(); preference.advance(3000);
assert.ok(Number(preference.root.dataset.particles) > 0, 'owner-requested animation remains active for every motion preference');
const hidden = setup({ hidden: true }); hidden.load(); assert.equal(hidden.callbacks.size, 0); assert.equal(hidden.root.dataset.particles, '0');
console.log('PASS hidden-tab suspension/resume, no catch-up, preference-independent animation and locale/history isolation');

const resizing = setup({ width: 5000, height: 3000, dpr: 3 }); resizing.load();
// Rounding either dimension may add less than one row/column to the pixel budget.
assert.ok(resizing.canvas.width * resizing.canvas.height <= resizing.model.config.maxPixels + resizing.canvas.width + resizing.canvas.height);
resizing.advance(16000); resizing.resize(390, 844);
assert.ok(Number(resizing.root.dataset.particles) <= resizing.model.config.maxMobile);
assert.equal(resizing.callbacks.size, 1); assert.equal(resizing.imageCount(), 1);
for (const failure of ['noContext', 'image', 'draw', 'resizeDraw', 'lost']) {
  const env = setup({ noContext: failure === 'noContext' });
  if (failure === 'image') env.imageFail(); else env.load();
  if (failure === 'draw') { env.failDraw(); env.advance(80); }
  if (failure === 'resizeDraw') { env.failDraw(); env.resize(800, 600); }
  if (failure === 'lost') env.emit('canvas', 'contextlost');
  assert.equal(env.root.dataset.renderer, 'static'); assert.equal(env.canvas.hidden, true);
  assert.equal(env.callbacks.size, 0);
  env.hidden(true); env.hidden(false); env.resize(800, 600); env.advance(4000);
  assert.equal(env.callbacks.size, 0); assert.equal(env.imageCount(), 1, 'failure does not create retry allocations');
}
console.log('PASS buffer budget, resize reuse and static fallback for image/context/draw/context-loss failures');
