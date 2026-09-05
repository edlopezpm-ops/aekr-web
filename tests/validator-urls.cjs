const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Runs only against the disposable source snapshot owned by tools/check.mjs.
async function main() {
  const snapshot = process.argv[2];
  assert(snapshot && path.basename(snapshot).startsWith('aekr-web-check-'));
  const { validateGeneratedProject } = await import(pathToFileURL(
    path.resolve(__dirname, '../tools/aekr/validate-generated-project.mjs')).href);
  const probe = path.join(snapshot, 'public', 'validator-url-probe.html');
  assert(!fs.existsSync(probe), 'The regression probe must not overwrite source');
  const url = (...segments) => ['', ...segments].join('/');
  const cases = [
    ['stylesheet URL', 'href', url('styles.css'), true],
    ['artwork URL', 'src', url('assets', 'aekr-logo.png'), true],
    ['contact form', 'action', url('api', 'contact'), true],
    ['home directory', 'href', url('Users', 'example', 'secret'), false],
    ['temporary directory', 'href', url('tmp', 'example'), false],
    ['parent traversal', 'href', url('assets', '..', '..', 'OWNER_PROFILE.md'), false],
    ['encoded traversal', 'href', url('%2e%2e', 'OWNER_PROFILE.md'), false],
    ['missing asset', 'src', url('missing-file.png'), false],
    ['contact is not an image', 'src', url('api', 'contact'), false],
    ['network path', 'href', url('', 'example.invalid', 'asset'), false],
  ];
  try {
    for (const [name, attribute, target, accepted] of cases) {
      fs.writeFileSync(probe, `<link ${attribute}="${target}">\n`);
      if (accepted) assert.doesNotThrow(() => validateGeneratedProject(snapshot), name);
      else assert.throws(() => validateGeneratedProject(snapshot), undefined, name);
    }
  } finally {
    fs.rmSync(probe, { force: true });
  }
  console.log(`Validator URL regression PASS: ${cases.length} public URL, endpoint and filesystem boundary cases`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
