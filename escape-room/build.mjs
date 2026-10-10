// Bundles src/ into a single self-contained page.
// dist/index.html is a full document; dist/artifact.html is the body-only form the artifact host wraps.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = await build({
  entryPoints: [join(root, 'src/main.js')], bundle: true, format: 'iife', minify: true,
  target: ['es2020'], write: false, charset: 'utf8',
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync(join(root, 'src/styles.css'), 'utf8');
const body = readFileSync(join(root, 'template.html'), 'utf8')
  .replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js);
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/artifact.html'), body);
writeFileSync(join(root, 'dist/index.html'),
  `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${body}</body></html>`);
console.log('built', (body.length / 1024).toFixed(1) + ' KB');
