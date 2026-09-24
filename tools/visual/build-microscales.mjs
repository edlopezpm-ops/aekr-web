// Offline artwork build. Reuses an external Playwright/browser installation;
// no dependency is shipped or installed in the website. Source art is untouched.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..') + path.sep);
const read = p => readFile(new URL(p, root));
const browser = await chromium.launch({ headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
try {
  const page = await browser.newPage();
  await page.addScriptTag({ content: await read('public/microscales-config.js').then(b => b.toString()) });
  const inputs = {};
  for (const name of ['mark', 'logo', 'banner']) inputs[name] = 'data:image/png;base64,' + (await read(`public/assets/aekr-${name}.png`)).toString('base64');
  // CSS owns the brand color; derived artwork cannot keep a separate palette.
  const css = await read('public/styles.css').then(b => b.toString());
  const accent = css.match(/--accent:\s*(#[0-9a-f]{6})\s*;/i)?.[1];
  if (!accent) throw new Error('Expected a six-digit --accent color in styles.css');
  const accentRgb = accent.slice(1).match(/../g).map(value => parseInt(value, 16));
  const assets = await page.evaluate(async ({ inputs, accentRgb }) => {
    const { config, points, sources } = AEKRMicroscales;
    const images = {};
    for (const [name, src] of Object.entries(inputs)) {
      const img = new Image(); img.src = src; await img.decode(); images[name] = img;
    }
    const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const result = {};
    for (const [name, img] of Object.entries(images)) {
      const c = canvas(img.width, img.height), ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height);
      // Source accents carry global translucency (e.g. mark/logo peak at 228).
      // Remove that tinting while retaining relative edge coverage and geometry.
      let accentAlpha = 0;
      for (let i = 0; i < data.data.length; i += 4) {
        const [r, g, b, a] = data.data.slice(i, i + 4);
        if (Math.max(r, g, b) - Math.min(r, g, b) >= 45) accentAlpha = Math.max(accentAlpha, a);
      }
      if (!accentAlpha) throw new Error(`Missing chromatic brand pixels: ${name}`);
      for (let i = 0; i < data.data.length; i += 4) {
        const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
        // Neutral alpha is unchanged; chromatic coverage is normalized to opaque.
        if (Math.max(r, g, b) - Math.min(r, g, b) < 45) {
          data.data[i] = 32; data.data[i + 1] = 42; data.data[i + 2] = 39;
        } else {
          [data.data[i], data.data[i + 1], data.data[i + 2]] = accentRgb;
          data.data[i + 3] = Math.round(data.data[i + 3] * 255 / accentAlpha);
        }
      }
      ctx.putImageData(data, 0, 0);
      result[`aekr-${name}-ivory-v2.png`] = c.toDataURL('image/png');
    }
    const mask = canvas(96, 96), mc = mask.getContext('2d');
    mc.drawImage(images.mark, 3, 3, 90, 90);
    const tinted = color => {
      const c = canvas(96, 96), ctx = c.getContext('2d');
      ctx.drawImage(mask, 0, 0); ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = color; ctx.fillRect(0, 0, 96, 96); return c;
    };
    const sprite = canvas(96, 96), sc = sprite.getContext('2d');
    sc.globalAlpha = config.relief;
    sc.drawImage(tinted('#887b67'), 1.6, 1.8);
    sc.globalAlpha = 0.95; sc.drawImage(tinted('#fffdf7'), -1.1, -1.2);
    sc.globalAlpha = 0.42; sc.drawImage(tinted('#e4ddcf'), 0, 0);
    result['aekr-scale-emboss-v1.png'] = sprite.toDataURL('image/png');
    for (const mobile of [false, true]) {
      const width = mobile ? config.mobileWidth : config.width;
      const surface = canvas(width * 2, config.height * 2), ctx = surface.getContext('2d');
      ctx.fillStyle = '#f6f2e9'; ctx.fillRect(0, 0, surface.width, surface.height);
      ctx.scale(2, 2);
      const eligible = new Set(sources.map(p => p.index));
      for (const p of points) {
        if (!p.alpha || eligible.has(p.index)) continue;
        const size = p.size * (mobile ? config.mobileSize : 1);
        ctx.save(); ctx.translate(p.x * width / config.width, p.y); ctx.rotate(p.angle);
        ctx.globalAlpha = p.alpha * (mobile ? config.mobileOpacity : 1);
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size); ctx.restore();
      }
      result[`aekr-microscales-${mobile ? 'mobile' : 'surface'}-v1.webp`] = surface.toDataURL('image/webp', 0.84);
    }
    return result;
  }, { inputs, accentRgb });
  const manifest = {};
  for (const [name, uri] of Object.entries(assets)) {
    const bytes = Buffer.from(uri.split(',')[1], 'base64');
    await writeFile(new URL(`public/assets/${name}`, root), bytes);
    manifest[name] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  }
  console.log(JSON.stringify(manifest, null, 2));
} finally { await browser.close(); }
