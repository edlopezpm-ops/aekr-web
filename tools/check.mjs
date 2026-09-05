import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const text = (relative) => readFileSync(path.join(root, relative), 'utf8');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const canonicalText = (value) => value.replace(/\r\n?/g, '\n');

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `Check failed: node ${args.join(' ')}`);
}

function walk(directory) {
  return readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    assert(!entry.isSymbolicLink(), `Symlink is outside the release contract: ${directory}/${entry.name}`);
    const relative = path.posix.join(directory, entry.name);
    return entry.isDirectory() ? walk(relative) : [relative];
  });
}

function checkProvenance() {
  const provenance = JSON.parse(text('tools/aekr/provenance.json'));
  for (const [relative, expected] of Object.entries(provenance.local_sha256)) {
    const bytes = readFileSync(path.join(root, relative));
    const normalized = relative.endsWith('.png') ? bytes : canonicalText(bytes.toString('utf8'));
    assert.equal(sha256(normalized), expected, `Pinned source changed: ${relative}`);
  }

  const local = canonicalText(text('tools/aekr/validate-generated-project.mjs'));
  const brandingPhrase = 'AI Engineering Knowledge Racking';
  assert.equal(local.split(brandingPhrase).length - 1, 3, 'Branding variance must have exactly three substitutions');
  const projectionPattern = /(export const VALIDATOR_PROJECTION_SHA256 =\s*\n\s*")[A-F0-9]{64}(";)/;
  const bannerPattern = /(const BRANDING_BANNER_SHA256 =\s*\n\s*")([A-F0-9]{64})(";)/g;
  const bannerMatches = [...local.matchAll(bannerPattern)];
  assert.equal(bannerMatches.length, 1, 'Banner variance must contain exactly one digest substitution');
  assert.equal(bannerMatches[0][2], provenance.local_sha256['assets/aekr-banner.png'].toUpperCase(),
    'The validator must require the exact pinned approved banner');
  const varianceBlock = /^[ \t]*\/\/ AEKR-WEB-VARIANCE-START ([a-z-]+)\n[\s\S]*?^[ \t]*\/\/ AEKR-WEB-VARIANCE-END \1\n\n?/gm;
  assert.equal([...local.matchAll(varianceBlock)].length, 5, 'Web-project variance must contain exactly five declared insertions');
  const reconstructed = local.replace(varianceBlock, '').replaceAll(brandingPhrase, 'AI Engineering Knowledge Repo')
    .replace(bannerPattern, `$1${provenance.upstream_banner_sha256}$3`)
    .replace(projectionPattern, `$1${provenance.upstream_projection_sha256}$2`);
  assert.equal(sha256(reconstructed), provenance.upstream_generated_validator_sha256,
    'The declared branding and public URL variance must reconstruct the exact upstream validator');
  assert.equal(text('assets/AEKR-BANNER-LICENSE.txt'), text('public/assets/AEKR-BANNER-LICENSE.txt'),
    'Website and repository banners must carry the same license');
  console.log('Provenance PASS: exact portable core/map validator; declared branding and public URL validator variance');
}

function checkWebsite() {
  const publicRoot = path.join(root, 'public');
  const files = walk('public');
  const forbidden = /(^|\/)(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|AGENTS\.md|OWNER_PROFILE\.md|MASTER_SWITCH\.md|PROJECT_MAP\.(?:html|md)|project-map\.json|aekr-scaffold\.json|node_modules|tools|docs)(?:\/|$)/i;
  for (const file of files) assert(!forbidden.test(file), `Private engineering/configuration file in website release: ${file}`);

  // Only local asset references are resolved here; outbound site links are not fetched.
  for (const file of files.filter((file) => /\.(?:html|css)$/.test(file))) {
    const source = text(file);
    const references = file.endsWith('.html')
      ? [...source.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1])
      : [...source.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/gi)].map((match) => match[1]);
    for (const reference of references) {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) continue;
      const relative = decodeURIComponent(reference.split(/[?#]/)[0]);
      if (!relative) continue;
      const target = path.resolve(relative.startsWith('/') ? publicRoot : path.dirname(path.join(root, file)),
        relative.replace(/^\//, ''));
      assert(target === publicRoot || target.startsWith(`${publicRoot}${path.sep}`),
        `Asset reference escapes public/: ${file} → ${reference}`);
      const resolved = statSync(target).isDirectory() ? path.join(target, 'index.html') : target;
      assert(statSync(resolved).isFile(), `Missing local source: ${file} → ${reference}`);
      assert(realpathSync(resolved).startsWith(`${publicRoot}${path.sep}`), `Asset resolves outside public/: ${reference}`);
    }
  }

  // This repository's small JSONC file uses full-line comments only.
  const config = JSON.parse(text('wrangler.jsonc').replace(/^\s*\/\/.*$/gm, ''));
  assert.equal(config.main, 'src/index.js');
  assert.equal(config.assets.directory, './public');
  assert.equal(config.assets.binding, 'ASSETS');
  assert.equal(config.assets.not_found_handling, '404-page');
  assert(!Object.hasOwn(config.vars ?? {}, 'CONTACT_RECIPIENT_EMAIL'), 'Recipient must remain a Worker secret');
  console.log(`Website integrity PASS: ${files.length} public files, local references and release boundaries`);
}

function checkSourceSnapshot() {
  // The inherited validator scans every source file as text. Validate Git inputs
  // in isolation so ignored Wrangler databases/caches never become source inputs.
  const listed = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (listed.error) throw listed.error;
  assert.equal(listed.status, 0, 'Could not enumerate the Git source snapshot');
  const snapshot = realpathSync(mkdtempSync(path.join(tmpdir(), 'aekr-web-check-')));
  try {
    for (const relative of new Set(listed.stdout.split('\0').filter(Boolean))) {
      assert(!path.isAbsolute(relative) && !relative.split('/').includes('..'), 'Unsafe Git source path');
      const source = path.join(root, relative);
      let info;
      try { info = lstatSync(source); } catch (error) {
        if (error.code === 'ENOENT') continue; // A tracked deletion is absent in the source snapshot.
        throw error;
      }
      assert(info.isFile() && !info.isSymbolicLink(), `Source must be a regular file: ${relative}`);
      assert(realpathSync(source).startsWith(`${root}${path.sep}`), `Source escapes repository: ${relative}`);
      const destination = path.join(snapshot, relative);
      mkdirSync(path.dirname(destination), { recursive: true });
      copyFileSync(source, destination);
    }
    run(['tools/aekr/validate-generated-project.mjs', snapshot]);
    run(['tests/validator-urls.cjs', snapshot]);
  } finally {
    rmSync(snapshot, { recursive: true, force: true });
  }
}

try {
  checkProvenance();
  for (const file of [...walk('public'), ...walk('src'), ...walk('tools')].filter((file) => /\.(?:js|mjs)$/.test(file))) {
    run(['--check', file]);
  }
  checkWebsite();
  run(['tests/atmosphere.cjs']);
  checkSourceSnapshot();
  console.log('Repository checks PASS (local evidence; review and deployment remain separate)');
} catch (error) {
  console.error(`Repository checks FAIL: ${error.message}`);
  process.exitCode = 1;
}
