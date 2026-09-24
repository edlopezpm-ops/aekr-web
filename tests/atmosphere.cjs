const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

// Exercise the real renderer with controlled browser scheduling, image loading
// and Canvas draw observation. Visual fidelity is reviewed in a real browser.
const read = name => fs.readFileSync(path.join(__dirname, '../public', name), 'utf8');
const configSource = read('microscales-config.js');
const rendererSource = read('microscales.js');
function setup(options = {}) {
  const events = new Map(), callbacks = new Map(), properties = new Map();
  const add = target => (name, fn) => {
    const key = `${target}:${name}`;
    events.set(key, [...events.get(key) || [], fn]);
  };
  let now = 0, id = 0, drawCount = 0, imageCount = 0;
  let width = options.width || 1440, height = options.height || 1000;
  let drawing = [], position, angle, projection, throwDrawing = false;
  const context = {
    globalAlpha: 1,
    setTransform() {}, clearRect() { drawing = []; drawCount++; },
    save() { projection = [1, 0, 0, 1, 0, 0]; }, restore() {},
    translate(x, y) { position = [x, y]; }, rotate(value) { angle = value; }, scale() {},
    transform(...values) { projection = values; },
    drawImage(_sprite, ...args) {
      if (throwDrawing) throw new Error('Canvas unavailable');
      const size = args.length === 4 ? args[2] : args[6];
      drawing.push({ position: [...position], angle, size, alpha: this.globalAlpha, projection });
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
  vm.runInContext(rendererSource, scope);
  const emit = (target, name, event) => { for (const fn of events.get(`${target}:${name}`) || []) fn(event); };
  return { root, canvas, properties, callbacks, events, model: sandbox.AEKRMicroscales,
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
const stationarySources = env => env.draws().slice(0, env.model.sources.length);
const first = setup(), second = setup();
assert.equal(JSON.stringify(first.model.points), JSON.stringify(second.model.points), 'distribution is reproducible');
assert.equal(first.model.points.length, first.model.config.count);
assert.equal(first.model.sources.length, first.model.config.eligible);
assert.equal(new Set(first.model.sources.map(source => source.index)).size, first.model.config.eligible);
assert.equal(first.callbacks.size, 0, 'loading image does not start continuous work');
first.load(); second.load();
assert.equal(first.root.dataset.renderer, 'canvas2d');
assert.equal(first.callbacks.size, 1);
assert.equal(first.draws().length, first.model.sources.length);
assert.equal(comparable(first), comparable(second));
const listenerCount = first.events.size;
first.rerun();
assert.equal(first.events.size, listenerCount);
assert.ok([...first.events.values()].every(listeners => listeners.length === 1), 'initialization never duplicates listeners');
assert.equal(first.imageCount(), 1);
assert.equal(first.callbacks.size, 1);
console.log('PASS reproducible distribution, reserved sources and single initialization');

// The first flight replaces one source at the exact source position, scale,
// orientation and opacity. It does not draw an identical copy underneath.
const transfer = setup(); transfer.load();
const origins = stationarySources(transfer);
for (let elapsed = 0; elapsed < 10000 && transfer.root.dataset.particles === '0'; elapsed += 40) transfer.advance(40);
assert.equal(transfer.root.dataset.particles, '1');
assert.equal(transfer.draws().length, origins.length);
const airborne = transfer.draws().at(-1);
const original = origins.find(item => item.angle === airborne.angle);
assert.ok(original, 'flight starts at a real reserved source');
assert.equal(airborne.position[1], original.position[1]);
assert.equal(airborne.position[0], original.position[0] + parseFloat(transfer.properties.get('--surface-drift')));
assert.equal(airborne.size, original.size);
assert.equal(airborne.alpha, original.alpha);
assert.equal(transfer.draws().filter(item => item.angle === airborne.angle).length, 1);
transfer.advance(80);
assert.ok(transfer.draws().at(-1).position[0] < airborne.position[0], 'flight advances left');
assert.equal(transfer.draws().length, origins.length, 'origin remains absent during early detachment');
let regrown;
for (let elapsed = 0; elapsed < 14000 && !regrown; elapsed += 40) {
  transfer.advance(40);
  regrown = transfer.draws().find(item => item.angle === original.angle);
}
assert.ok(regrown, 'vacated source regrows during the trajectory');
const departing = transfer.draws().find(item => item.size === original.size && item.angle !== original.angle);
assert.ok(departing);
assert.ok(Math.hypot(regrown.position[0] - departing.position[0], regrown.position[1] - departing.position[1]) >= original.size - transfer.model.config.surfaceAmplitude * 2,
  'regrowth starts only after flight clears a full emblem width, allowing bounded surface drift');
console.log('PASS source-to-flight transfer without duplicate, preserved emblem and leftward movement');

// A live RAF and a nonzero pool did not make the former animation perceptible:
// symbols barely travelled before fading. Verify a useful visible journey.
const visible = setup(); visible.load();
while (visible.root.dataset.particles === '0') visible.advance(40);
const launched = visible.draws().at(-1);
visible.advance(4000);
const travelled = visible.draws().find(item => item.size === launched.size && item.angle !== launched.angle);
assert.ok(travelled, 'first detached emblem remains visible after four seconds');
assert.ok(launched.position[0] - travelled.position[0] > 100, 'visible flight crosses at least 100 CSS pixels');
assert.ok(travelled.alpha >= launched.alpha * 0.85, 'flight retains relief before dissolving');
assert.ok(Math.abs(travelled.position[1] - launched.position[1]) > 3, 'petal moves vertically as well as left');
assert.notDeepEqual(travelled.projection, launched.projection, 'petal tumbles in depth on independent axes');
const airbornePoses = visible.draws().filter(item => item.projection[0] !== 1);
assert.ok(new Set(airbornePoses.map(item => item.projection.join(','))).size > 4, 'petals do not share a rigid common orientation');

const breeze = setup(), passive = setup(); breeze.load(); passive.load();
const target = breeze.draws().find(item => item.position[0] > 800 && item.position[0] < 1400);
breeze.emit('window', 'pointermove', { clientX: target.position[0], clientY: target.position[1], pointerType: 'mouse' });
breeze.advance(80); passive.advance(80);
assert.equal(breeze.root.dataset.particles, '1', 'pointer lifts a nearby source before the next autonomous emission');
assert.equal(passive.root.dataset.particles, '0');
const pointed = breeze.draws().at(-1);
assert.equal(pointed.angle, target.angle, 'the touched source supplies the new flight');
for (let i = 0; i < 100; i++) breeze.emit('window', 'pointermove', { clientX: target.position[0], clientY: target.position[1], pointerType: 'mouse' });
breeze.advance(80); assert.equal(breeze.root.dataset.particles, '1', 'pointer input is rate bounded');
breeze.reduced(true);
breeze.emit('window', 'pointermove', { clientX: target.position[0], clientY: target.position[1], pointerType: 'mouse' });
breeze.advance(2000); assert.ok(Number(breeze.root.dataset.particles) > 0);
console.log('PASS visible multi-axis petal travel, source rebirth and bounded pointer detachment');

const edgePointer = setup({ width: 1366, height: 600 }); edgePointer.load();
const marginalSource = edgePointer.draws().find(item => item.position[1] > 580 && item.position[0] < 1351);
assert.ok(marginalSource);
edgePointer.emit('window', 'pointermove', { clientX: marginalSource.position[0], clientY: marginalSource.position[1], pointerType: 'mouse' });
edgePointer.advance(80);
if (edgePointer.root.dataset.particles !== '0') {
  const nearby = edgePointer.draws().at(-1);
  assert.ok(Math.hypot(nearby.position[0] - marginalSource.position[0], nearby.position[1] - marginalSource.position[1]) <= 110,
    'pointer near an ineligible edge source never launches a random distant emblem');
}

for (const options of [{}, { width: 390, height: 844, dpr: 3 }]) {
  const env = setup(options); env.load();
  const config = env.model.config;
  const cap = options.width ? config.maxMobile : config.maxDesktop;
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
  assert.ok(maxParticles > 0 && departures > 0, 'particles emit and expire over a three-minute run');
  assert.ok(maxDraws <= config.eligible + cap * 4, 'per-frame draw work includes at most four dissolving fragments per flight');
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
