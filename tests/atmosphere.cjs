const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
// Browser lifecycle contract with mocked platform/GPU calls; real shader rendering
// is checked separately in Chromium during visual review. No network or email.
const source = fs.readFileSync(path.join(__dirname, '../public/script.js'), 'utf8');
class MockElement {
  constructor(selectors, parent = null) { this.selectors = selectors; this.parent = parent; }
  matches(selector) { return selector.split(',').some(s => this.selectors.includes(s.trim())); }
  closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector) || null; }
}
function setup(opts = {}) {
  const listeners = new Map();
  const callbacks = new Map();
  const queries = new Map();
  const properties = new Map();
  const canvases = [];
  const uniforms = new Map();
  const reads = [];
  const eventOptions = new Map();
  let starPositions = [];
  let viewport = [], framebuffer = null;
  let next = 0, now = 0, drawCount = 0, lostCount = 0, deleteCount = 0;
  const addEventListener = (name, cb, options) => { listeners.set(name, [...(listeners.get(name) || []), cb]); eventOptions.set(name, options); };
  const root = { dataset: {}, style: { setProperty: (k,v) => properties.set(k,v) },
    insertBefore: c => { c.connected = true; }, querySelector: () => ({}),
    toggleAttribute: () => {}, getBoundingClientRect: () => ({width: 1440,height: 1000}) };
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4, FRAMEBUFFER_COMPLETE: 5,
    createShader: () => ({}), shaderSource: () => {}, compileShader: () => {},
    getShaderParameter: () => !opts.compileFailure, createProgram: () => ({}),
    attachShader: () => {}, linkProgram: () => {}, getProgramParameter: () => !opts.linkFailure,
    useProgram: () => {}, createBuffer: () => ({}), bindBuffer: () => {}, bufferData: () => {},
    getAttribLocation: () => 0, enableVertexAttribArray: () => {}, vertexAttribPointer: () => {},
    getUniformLocation: (_p, key) => key, uniform2f: (key,...v) => uniforms.set(key,v),
    uniform4fv: (key,v) => uniforms.set(key,Array.from(v)),
    uniform1f: (key,v) => uniforms.set(key,v), clearColor: () => {}, clear: () => {},
    drawArrays: () => drawCount++, viewport: (...v) => { viewport=v; },
    createTexture: () => opts.textureFailure ? null : ({}), createFramebuffer: () => opts.framebufferFailure ? null : ({}),
    bindTexture: () => {}, texImage2D: () => {}, texParameteri: () => {},
    bindFramebuffer: (_target,value) => { framebuffer=value; }, framebufferTexture2D: () => {},
    checkFramebufferStatus: () => opts.pickingFailure ? 0 : 5, isContextLost: () => !!opts.contextLost,
    readPixels: (x,y,w,h,_format,_type,destination) => {
      reads.push([x,y,w,h]);
      if(opts.readbackFailure) throw new Error('readback unavailable');
      destination[0]=opts.density ?? 255;
    },
    deleteTexture: () => deleteCount++, deleteFramebuffer: () => deleteCount++,
    deleteBuffer: () => deleteCount++, deleteProgram: () => deleteCount++, deleteShader: () => deleteCount++,
    getExtension: () => ({ loseContext: () => lostCount++ }),
  };
  const twoD = {clearRect(){starPositions=[];},beginPath(){},arc(x,y){starPositions.push([x,y]);},fill(){},setTransform(){}};
  const makeCanvas = () => {
    const events = new Map();
    const canvas = { events, style: {}, getBoundingClientRect: () => ({left:0,top:0,width: opts.width ?? 1440,height: opts.height ?? 1000}),
      getContext: type => type === '2d' ? twoD : opts.noWebgl ? null : gl,
      addEventListener: (type, cb) => events.set(type,cb), removeEventListener: (type) => events.delete(type),
      remove: () => {canvas.connected = false;}, connected: false };
    canvases.push(canvas); return canvas;
  };
  const starCanvas = makeCanvas();
  const connection = { saveData: !!opts.saveData, addEventListener };
  const document = { hidden: false, querySelector: s => s === '.atmosphere' ? root : s === '.atmosphere__starfield' ? starCanvas : null,
    getElementById: () => null, createElement: () => makeCanvas(), addEventListener };
  const window = {innerWidth: 1440,innerHeight: 1000,devicePixelRatio: opts.dpr || 1,
    getComputedStyle: () => ({opacity:String(opts.opacity ?? 0.8096)}),
    matchMedia: query => { if (!queries.has(query)) queries.set(query,{matches: !!opts[query], callbacks: [], addEventListener(_n,cb){this.callbacks.push(cb);}}); return queries.get(query);},
    addEventListener, requestAnimationFrame: cb => {callbacks.set(++next,cb); return next;}, cancelAnimationFrame: id => callbacks.delete(id) };
  vm.runInNewContext(source, {document,window,navigator:{connection},performance:{now:()=>now}, ResizeObserver:class {observe(){}},Math,Float32Array,Uint8Array,Element:MockElement});
  return {root,properties,canvases,uniforms,callbacks,connection,reads,eventOptions,
    draws:()=>drawCount, losses:()=>lostCount, deletes:()=>deleteCount,
    stars:()=>starPositions,
    viewport:()=>viewport, framebuffer:()=>framebuffer,
    click(event={}) { this.emit('click',{button:0,detail:1,clientX:1080,clientY:500,pointerType:'mouse',target:new MockElement(['body']),...event}); },
    advance(time) {now=time;const pending=[...callbacks.values()];callbacks.clear();pending.forEach(cb=>cb(time));},
    emit(name,event={}){for(const cb of listeners.get(name)||[])cb(event);},
    hidden(state){document.hidden=state;this.emit('visibilitychange');},
    preference(query,matches){const q=queries.get(query);q.matches=matches;q.callbacks.forEach(cb=>cb());} };
}
const activeBursts = env => env.uniforms.get('u_bursts[0]').filter((_value,index) => index % 4 === 3 && _value === 1).length;
const desktop = setup();
assert.equal(desktop.root.dataset.renderer,'webgl');
assert.equal(desktop.canvases.length,2);
assert.equal(desktop.callbacks.size,2);
assert.equal(desktop.uniforms.get('u_bursts[0]').length,16);
const initialTime=desktop.uniforms.get('u_time');
desktop.advance(34);
assert.ok(Math.abs(desktop.uniforms.get('u_time')-initialTime-0.034*3.15)<1e-9,'deployed home speed is 0.55 + 2.6');
desktop.emit('pointermove',{clientX:1440,clientY:1000,pointerType:'mouse'});
assert.equal(desktop.callbacks.size,2,'pointer movement adds no animation or parallax callback');
assert.equal(desktop.properties.size,0);
assert.equal(desktop.uniforms.has('u_pointer'),false);
assert.equal(desktop.reads.length,0,'ordinary animation never reads GPU pixels');
const drawsBefore=desktop.draws();
desktop.hidden(true);assert.equal(desktop.callbacks.size,0);
desktop.advance(4000);assert.equal(desktop.draws(),drawsBefore);
desktop.click();assert.equal(desktop.reads.length,0);
desktop.hidden(false);assert.equal(desktop.callbacks.size,2);assert.equal(desktop.canvases.length,2);
desktop.advance(4034);assert.equal(desktop.draws(),drawsBefore+1);
console.log('PASS deployed home speed, autonomous gas, no pointer coupling, hidden-tab pause and reuse');

const mobile=setup({'(pointer: coarse)':true,width:390,height:844,dpr:3});
assert.equal(mobile.root.dataset.renderer,'webgl','a touch screen must not disable autonomous nebula motion');
assert.deepEqual(mobile.uniforms.get('u_resolution'),[234,506],'compact rendering uses source scale 0.4 at capped DPR 1.5');
const mobileTime=mobile.uniforms.get('u_time'), mobileStars=mobile.stars();
for(let time=34;time<=1020;time+=34) mobile.advance(time);
assert.ok(mobile.draws()>25);
assert.ok(Math.abs(mobile.uniforms.get('u_time')-mobileTime-1.020*3.15)<1e-9);
assert.notDeepEqual(mobile.stars(),mobileStars,'stars drift without pointer input');
mobile.emit('pointermove',{clientX:0,clientY:0,pointerType:'touch'});
mobile.click({pointerType:'touch',clientX:200,clientY:400});
assert.equal(mobile.reads.length,0);assert.equal(activeBursts(mobile),0);assert.equal(mobile.properties.size,0);
console.log('PASS coarse/mobile autonomous gas and stars, compact buffer and touch isolation');

const clicks=setup();
assert.equal(clicks.eventOptions.get('click').passive,true);
clicks.click();assert.deepEqual(clicks.reads,[[0,0,1,1]],'a completed eligible click samples only one pixel');
assert.deepEqual(clicks.uniforms.get('u_pickUv'),[0.75,0.5]);
assert.equal(clicks.uniforms.get('u_picking'),0);assert.equal(clicks.framebuffer(),null);
assert.deepEqual(clicks.viewport(),[0,0,864,600]);
clicks.advance(34);assert.equal(activeBursts(clicks),1);
const burst=clicks.uniforms.get('u_bursts[0]');
assert.equal(burst[0],0.75);assert.equal(burst[1],0.5);assert.ok(Math.abs(burst[2]-0.034)<1e-6);
for(let index=0;index<8;index++) clicks.click({clientX:200+index*100});
clicks.advance(68);assert.equal(activeBursts(clicks),4,'repeated clicks replace a bounded four-slot pool');
for(let time=102;time<=1734;time+=34) clicks.advance(time);
assert.equal(activeBursts(clicks),0,'pressure waves expire after 1.6 animation seconds');
assert.equal(clicks.reads.length,9,'aging bursts performs no further readback');
console.log('PASS one-pixel density picking, exact click coordinates, four-burst cap and 1.6-second expiry');

const excluded=setup();
for(const event of [
  {button:1},{button:2},{detail:0},{defaultPrevented:true},{pointerType:'touch'},{pointerType:'pen'},
  {target:null},{target:new MockElement(['p'])},{target:new MockElement(['img'])},
  {target:new MockElement(['.cta-row'])},{target:new MockElement(['button'])},
  {target:new MockElement(['.section'],new MockElement(['form']))},
  {target:new MockElement(['.section'],new MockElement(['[contenteditable]']))},
  {target:new MockElement(['.section'],new MockElement(['[role]']))},
  {target:new MockElement(['.hero'],new MockElement(['header']))},
  {target:new MockElement(['.section'],new MockElement(['footer']))},
  {clientX:-1},{clientY:1001},{clientX:NaN},{clientY:Infinity},
]) excluded.click(event);
assert.equal(excluded.reads.length,0,'foreground, non-mouse, prevented, keyboard and invalid clicks never sample gas');
for(const selector of ['body','main','.hero','.section']) excluded.click({target:new MockElement([selector])});
assert.equal(excluded.reads.length,4,'exposed AEKR layout accepts completed mouse clicks');
for(const opts of [{density:0},{density:18},{opacity:0},{opacity:'invalid'},{contextLost:true}]) {
  const env=setup(opts);env.click();env.advance(34);assert.equal(activeBursts(env),0);
}
const edge=setup({density:19});edge.click();edge.advance(34);assert.equal(activeBursts(edge),1,'density threshold includes computed canvas opacity');
console.log('PASS exposed-layout eligibility, foreground exclusions, finite coordinates and visible-density threshold');

for(const failure of ['textureFailure','framebufferFailure','pickingFailure','readbackFailure']) {
  const env=setup({[failure]:true});const before=env.draws();env.click();env.advance(34);
  assert.equal(env.root.dataset.renderer,'webgl');assert.ok(env.draws()>before);assert.equal(activeBursts(env),0);
  assert.equal(env.uniforms.get('u_picking'),0);assert.equal(env.framebuffer(),null);
  assert.deepEqual(env.viewport(),[0,0,864,600]);
}
console.log('PASS unavailable/failed picking keeps autonomous gas and restores framebuffer, viewport and shader mode');

for(const pref of ['(prefers-reduced-motion: reduce)','(update: slow)']) {
  const env=setup({[pref]:true});assert.equal(env.root.dataset.renderer,'fallback');assert.equal(env.canvases.length,1);assert.equal(env.callbacks.size,0);
  env.click();assert.equal(env.reads.length,0);
  env.preference(pref,false);assert.equal(env.root.dataset.renderer,'webgl');assert.equal(env.callbacks.size,2);
  env.preference(pref,true);assert.equal(env.root.dataset.renderer,'fallback');assert.equal(env.callbacks.size,0);assert.equal(env.losses(),1);
}
const data=setup({saveData:true});assert.equal(data.callbacks.size,0);data.click();assert.equal(data.reads.length,0);
data.connection.saveData=false;data.emit('change');assert.equal(data.root.dataset.renderer,'webgl');
data.connection.saveData=true;data.emit('change');assert.equal(data.callbacks.size,0);
console.log('PASS reduced motion, slow update and save-data suppress animation/clicks and follow preference changes');

for(const failure of ['noWebgl','compileFailure','linkFailure']) {
  const env=setup({[failure]:true});assert.equal(env.root.dataset.renderer,'fallback');assert.equal(env.canvases.filter(c=>c.connected).length,0);
  env.click();assert.equal(env.reads.length,0);
  if(failure!=='noWebgl'){assert.equal(env.losses(),1);assert.ok(env.deletes()>=3);}
}
const lost=setup();lost.canvases[1].events.get('webglcontextlost')({preventDefault(){}});
assert.equal(lost.root.dataset.renderer,'fallback');assert.equal(lost.callbacks.size,1);assert.equal(lost.canvases[1].connected,false);
assert.equal(lost.deletes(),6,'buffer, program, two shaders and picking texture/framebuffer are released');
lost.advance(34);lost.advance(68);assert.equal(lost.canvases.length,2,'context loss must not trigger a frame retry loop');
lost.hidden(true);lost.hidden(false);assert.equal(lost.canvases.length,3);assert.equal(lost.root.dataset.renderer,'webgl');
const restoredTime=lost.uniforms.get('u_time');lost.advance(102);assert.ok(lost.uniforms.get('u_time')>restoredTime);
const unavailable={noWebgl:true};const recover=setup(unavailable);
recover.advance(34);recover.advance(68);assert.equal(recover.canvases.length,2);
recover.hidden(true);recover.hidden(false);assert.equal(recover.canvases.length,3);assert.equal(recover.root.dataset.renderer,'fallback');
recover.advance(102);assert.equal(recover.canvases.length,3,'a failed lifecycle retry does not repeatedly allocate a GPU context');
unavailable.noWebgl=false;recover.hidden(true);recover.hidden(false);assert.equal(recover.root.dataset.renderer,'webgl');
const huge=setup({width:5000,height:3000,dpr:2});const size=huge.uniforms.get('u_resolution');assert.ok(size[0]*size[1]<=1500000);
console.log('PASS WebGL failures, full resource cleanup, bounded lifecycle recovery and 1.5MP render budget');
