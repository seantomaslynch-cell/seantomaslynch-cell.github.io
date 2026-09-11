// Copies each game's committed runtime files (HEAD, never the working tree) into the
// public site repo, minified, so the source repos can go private.
const esbuild = require('A:/LifeLine/node_modules/esbuild');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, 'site');
const git = (repo, args, enc = 'utf8') => execFileSync('git', ['-C', repo, ...args], { encoding: enc, maxBuffer: 1 << 28 });

function extract(repo, folder, paths, strip = '') {
  const dest = path.join(SITE, folder);
  fs.rmSync(dest, { recursive: true, force: true });
  const files = git(repo, ['ls-tree', '-r', '--name-only', 'HEAD', '--', ...paths]).split('\n').filter(Boolean);
  for (const f of files) {
    const rel = strip && f.startsWith(strip) ? f.slice(strip.length) : f;
    if (rel === '.nojekyll') continue;
    const out = path.join(dest, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, git(repo, ['show', `HEAD:${f}`], 'buffer'));
  }
  return dest;
}

const min = (code, loader) => esbuild.transformSync(code, { loader, minify: true, legalComments: 'none' }).code;
const minFile = (p, loader) => fs.writeFileSync(p, min(fs.readFileSync(p, 'utf8'), loader));
const mustReplace = (s, a, b) => { if (!s.includes(a)) throw new Error('missing: ' + a); return s.replace(a, b); };

// Cat Burglar: ES modules under src/, bundled into one file.
{
  const d = extract('A:/CatBurglar', 'cat-burglar', ['index.html', 'style.css', 'src']);
  esbuild.buildSync({ entryPoints: [path.join(d, 'src/main.js')], bundle: true, format: 'esm', minify: true, legalComments: 'none', outfile: path.join(d, 'game.js') });
  fs.rmSync(path.join(d, 'src'), { recursive: true });
  minFile(path.join(d, 'style.css'), 'css');
  const html = path.join(d, 'index.html');
  fs.writeFileSync(html, mustReplace(fs.readFileSync(html, 'utf8'), 'src="src/main.js"', 'src="game.js"'));
}

// Endless Core and Sinkhole: one classic script each. No output format, so esbuild keeps
// top-level names, which the page may reach as globals.
for (const [repo, folder, paths] of [
  ['A:/EndlessCore', 'endless-core', ['index.html', 'game.js', 'style.css', 'menu-bg.jpg', 'base-scene-tier0.jpg', 'base-scene-tier1.jpg', 'base-scene-tier2.jpg', 'base-scene-tier3.jpg', 'screenshot.png', 'privacy.html', 'support.html', 'playgama-bridge-config.json']],
  ['A:/Sinkhole', 'sinkhole', ['index.html', 'game.js', 'style.css', 'playgama-bridge-config.json', 'store-assets/playgama-covers']],
]) {
  const d = extract(repo, folder, paths);
  minFile(path.join(d, 'game.js'), 'js');
  minFile(path.join(d, 'style.css'), 'css');
}

// Vending Machine Empire: everything is inline in index.html. The build zips stay out.
{
  const d = extract('A:/VendingEmpire', 'vending-machine-empire', ['index.html']);
  const html = path.join(d, 'index.html');
  let s = fs.readFileSync(html, 'utf8');
  let n = 0;
  s = s.replace(/<script>([\s\S]*?)<\/script>/g, (_, js) => { n++; return `<script>${min(js, 'js')}</script>`; });
  s = s.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => `<style>${min(css, 'css')}</style>`);
  if (n !== 2) throw new Error('expected 2 inline scripts, got ' + n);
  fs.writeFileSync(html, s);
}

// Cottage Sort: only the store pages from docs/ (these were 404 before, see LISTING_v1.md).
extract('A:/cottage-sort', 'cottage-sort', ['docs'], 'docs/');

for (const f of ['cat-burglar', 'endless-core', 'sinkhole', 'vending-machine-empire', 'cottage-sort']) {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  console.log(f.padEnd(24), walk(path.join(SITE, f)).map(p => path.relative(path.join(SITE, f), p).replace(/\\/g, '/')).join(' '));
}
