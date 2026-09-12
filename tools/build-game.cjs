// Builds one game's published folder from its (private) source repo.
//   node tools/build-game.cjs <game> <path-to-source-repo>
// Writes ../<game> next to this tools/ directory. CI runs this on every push to a
// game repo; the source repos are private, so this folder is the only public copy.
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const GAMES = {
  'cat-burglar': {
    copy: ['index.html', 'style.css', 'src'],
    build: d => {
      // ES modules under src/, bundled to one file so nothing ships unbundled.
      esbuild.buildSync({ entryPoints: [path.join(d, 'src/main.js')], bundle: true, format: 'esm', minify: true, legalComments: 'none', outfile: path.join(d, 'game.js') });
      fs.rmSync(path.join(d, 'src'), { recursive: true });
      minFile(path.join(d, 'style.css'), 'css');
      rewrite(path.join(d, 'index.html'), 'src="src/main.js"', 'src="game.js"');
    },
  },
  'endless-core': {
    copy: ['index.html', 'game.js', 'style.css', 'menu-bg.jpg', 'base-scene-tier0.jpg', 'base-scene-tier1.jpg', 'base-scene-tier2.jpg', 'base-scene-tier3.jpg', 'screenshot.png', 'privacy.html', 'support.html', 'playgama-bridge-config.json'],
    build: d => { minFile(path.join(d, 'game.js'), 'js'); minFile(path.join(d, 'style.css'), 'css'); },
  },
  sinkhole: {
    copy: ['index.html', 'game.js', 'style.css', 'playgama-bridge-config.json', 'store-assets/playgama-covers'],
    build: d => { minFile(path.join(d, 'game.js'), 'js'); minFile(path.join(d, 'style.css'), 'css'); },
  },
  'vending-machine-empire': {
    copy: ['index.html'],
    build: d => {
      // Whole game is inline in index.html. The build zips stay out of the public copy.
      const p = path.join(d, 'index.html');
      let s = fs.readFileSync(p, 'utf8'), n = 0;
      s = s.replace(/<script>([\s\S]*?)<\/script>/g, (_, js) => { n++; return `<script>${min(js, 'js')}</script>`; });
      s = s.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => `<style>${min(css, 'css')}</style>`);
      if (n !== 2) throw new Error(`expected 2 inline scripts, found ${n}`);
      fs.writeFileSync(p, s);
    },
  },
  'cottage-sort': { copy: ['docs'], strip: 'docs/', build: () => {} },
};

// esbuild keeps top-level names when no output format is set, which these classic
// scripts rely on: the page reaches some of them as globals.
const min = (code, loader) => esbuild.transformSync(code, { loader, minify: true, legalComments: 'none' }).code;
const minFile = (p, loader) => fs.writeFileSync(p, min(fs.readFileSync(p, 'utf8'), loader));
const rewrite = (p, from, to) => {
  const s = fs.readFileSync(p, 'utf8');
  if (!s.includes(from)) throw new Error(`${path.basename(p)} no longer contains ${from}`);
  fs.writeFileSync(p, s.replace(from, to));
};

// Paths keep their place relative to the repo root, so store-assets/playgama-covers
// lands where index.html expects it rather than at the top of the folder.
function copyInto(root, relPath, dest, strip) {
  const src = path.join(root, relPath);
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  for (const file of fs.statSync(src).isDirectory() ? walk(src) : [src]) {
    let rel = path.relative(root, file).replace(/\\/g, '/');
    if (strip && rel.startsWith(strip)) rel = rel.slice(strip.length);
    if (rel === '.nojekyll') continue;
    const out = path.join(dest, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.copyFileSync(file, out);
  }
}

const [game, source, outArg] = process.argv.slice(2);
const cfg = GAMES[game];
if (!cfg || !source) {
  console.error(`usage: node tools/build-game.cjs <${Object.keys(GAMES).join('|')}> <source-repo> [out]`);
  process.exit(2);
}
const dest = path.resolve(outArg || path.join(__dirname, '..', game));
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const rel of cfg.copy) {
  if (!fs.existsSync(path.join(source, rel))) throw new Error(`missing in source repo: ${rel}`);
  copyInto(source, rel, dest, cfg.strip);
}
cfg.build(dest);
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
console.log(`${game}: ${walk(dest).map(p => path.relative(dest, p).replace(/\\/g, '/')).join(' ')}`);
