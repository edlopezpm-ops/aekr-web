const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
// Browser lifecycle contract with mocked platform/GPU calls; real shader rendering
// is checked separately in Chromium during visual review. No network or email.
const source = fs.readFileSync(path.join(__dirname, '../public/script.js'), 'utf8');
function setup(opts = {}) {
  const listeners = new Map();
  const callbacks = new Map();
  const queries = new Map();
  const properties = new Map();
  const canvases = [];
  const uniforms = new Map();
  let next = 0, now = 0, drawCount = 0, lostCount = 0, deleteCount = 0;
  const addEventListener = (name, cb) => listeners.set(name, [...(listeners.get(name) || []), cb]);
  const root = { dataset: {}, style: { setProperty: (k,v) => properties.set(k,v) },
    insertBefore: c => { c.connected = true; }, querySelector: () => ({}),
    toggleAttribute: () => {}, getBoundingClientRect: () => ({width: 1440,height: 1000}) };
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4,
    createShader: () => ({}), shaderSource: () => {}, compileShader: () => {},
    getShaderParameter: () => !opts.compileFailure, createProgram: () => ({}),
    attachShader: () => {}, linkProgram: () => {}, getProgramParameter: () => !opts.linkFailure,
    useProgram: () => {}, createBuffer: () => ({}), bindBuffer: () => {}, bufferData: () => {},
    getAttribLocation: () => 0, enableVertexAttribArray: () => {}, vertexAttribPointer: () => {},
    getUniformLocation: (_p, key) => key, uniform2f: (key,...v) => uniforms.set(key,v),
    uniform1f: (key,v) => uniforms.set(key,v), clearColor: () => {}, clear: () => {},
    drawArrays: () => drawCount++, viewport: () => {},
    deleteBuffer: () => deleteCount++, deleteProgram: () => deleteCount++, deleteShader: () => deleteCount++,
    getExtension: () => ({ loseContext: () => lostCount++ }),
  };
  const twoD = {clearRect(){},beginPath(){},arc(){},fill(){},setTransform(){}};
  const makeCanvas = () => {
    const events = new Map();
    const canvas = { events, style: {}, getBoundingClientRect: () => ({width: opts.width || 1773,height: opts.height || 1231}),
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
    matchMedia: query => { if (!queries.has(query)) queries.set(query,{matches: !!opts[query], callbacks: [], addEventListener(_n,cb){this.callbacks.push(cb);}}); return queries.get(query);},
    addEventListener, requestAnimationFrame: cb => {callbacks.set(++next,cb); return next;}, cancelAnimationFrame: id => callbacks.delete(id) };
  vm.runInNewContext(source, {document,window,navigator:{connection},performance:{now:()=>now}, ResizeObserver:class {observe(){}},Math,Float32Array});
  return {root,properties,canvases,uniforms,callbacks,connection,
    draws:()=>drawCount, losses:()=>lostCount, deletes:()=>deleteCount,
    advance(time) {now=time;const pending=[...callbacks.values()];callbacks.clear();pending.forEach(cb=>cb(time));},
    emit(name,event={}){for(const cb of listeners.get(name)||[])cb(event);},
    hidden(state){document.hidden=state;this.emit('visibilitychange');},
    preference(query,matches){const q=queries.get(query);q.matches=matches;q.callbacks.forEach(cb=>cb());} };
}
const desktop = setup();
assert.equal(desktop.root.dataset.renderer,'webgl');
assert.equal(desktop.canvases.length,2);
assert.equal(desktop.callbacks.size,2);
const initialTime=desktop.uniforms.get('u_time');
desktop.advance(34);
assert.ok(Math.abs(desktop.uniforms.get('u_time')-initialTime-0.034*1.194)<1e-9);
desktop.emit('pointermove',{clientX:1440,clientY:1000,pointerType:'mouse'});
desktop.advance(50);
assert.equal(desktop.properties.get('--nebula-pointer-x'),'-20.00px');
assert.equal(desktop.properties.get('--nebula-pointer-y'),'-12.00px');
assert.equal(desktop.properties.get('--nebula-far-x'),'6.80px');
const drawsBefore=desktop.draws();
desktop.hidden(true);
assert.equal(desktop.callbacks.size,0);
desktop.advance(4000);
assert.equal(desktop.draws(),drawsBefore);
desktop.hidden(false);
assert.equal(desktop.callbacks.size,2);
assert.equal(desktop.canvases.length,2);
desktop.advance(4034);
assert.equal(desktop.draws(),drawsBefore+1);
console.log('PASS desktop WebGL, exact home speed/parallax, hidden-tab pause and reuse');
for(const pref of ['(prefers-reduced-motion: reduce)','(update: slow)','(pointer: coarse)']) {
  const env=setup({[pref]:true});assert.equal(env.root.dataset.renderer,'fallback');assert.equal(env.canvases.length,1);assert.equal(env.callbacks.size,0);
  env.preference(pref,false);assert.equal(env.root.dataset.renderer,'webgl');assert.equal(env.callbacks.size,2);
  env.preference(pref,true);assert.equal(env.root.dataset.renderer,'fallback');assert.equal(env.callbacks.size,0);assert.equal(env.losses(),1);
}
assert.equal(setup({saveData:true}).callbacks.size,0);
console.log('PASS reduced motion, slow update, coarse/mobile and save-data fallback; preference changes');
for(const failure of ['noWebgl','compileFailure','linkFailure']){
  const env=setup({[failure]:true});assert.equal(env.root.dataset.renderer,'fallback');assert.equal(env.canvases.filter(c=>c.connected).length,0);
  if(failure!=='noWebgl'){assert.equal(env.losses(),1);assert.ok(env.deletes()>=3);}
}
console.log('PASS unavailable WebGL, shader/link failure cleanup and readable fallback');
const lost=setup();lost.canvases[1].events.get('webglcontextlost')({preventDefault(){}});
assert.equal(lost.root.dataset.renderer,'fallback');assert.equal(lost.callbacks.size,1);assert.equal(lost.canvases[1].connected,false);
lost.hidden(true);lost.hidden(false);assert.equal(lost.canvases.length,2);
const huge=setup({width:5000,height:3000,dpr:2});const size=huge.uniforms.get('u_resolution');assert.ok(size[0]*size[1]<=1500000);
console.log('PASS context loss stays fallback, resource cleanup and 1.5MP render budget');
