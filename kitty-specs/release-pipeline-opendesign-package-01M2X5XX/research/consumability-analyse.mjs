// Usage: node kitty-specs/release-pipeline-opendesign-package-01M2X5XX/research/consumability-analyse.mjs <output.html> <package-dir>
// Classifies every sk-/is- class in the output against the package's per-component vocabulary, and
// measures, per component used, how many of its CSS rules appear verbatim (whitespace-normalised).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const [out, pkg] = process.argv.slice(2);
const html = readFileSync(out, 'utf8');
const { classVocabulary } = await import(new URL('../../../scripts/build-opendesign-package.mjs', import.meta.url).href);
const norm = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').trim();
const outCss = norm([...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n'));
const vocab = new Map();
for (const f of readdirSync(join(pkg, 'components'))) {
  const page = readFileSync(join(pkg, 'components', f), 'utf8');
  const css = (page.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
  const forms = [...page.matchAll(/<figure[\s\S]*?<\/figure>/g)].map((m) => ({ markup: m[0] }));
  for (const c of classVocabulary(css, forms)) if (!vocab.has(c)) vocab.set(c, f.replace('.html', ''));
  vocab.set(`__css__${f.replace('.html', '')}`, css);
}
const used = [...new Set([...html.matchAll(/\bclass\s*=\s*"([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter((t) => /^(sk-|is-)/.test(t)))].sort();
const real = used.filter((u) => vocab.has(u));
const invented = used.filter((u) => !vocab.has(u));
console.log(`library-namespace classes used: ${used.length}; real: ${real.length}; invented: ${invented.length}`);
if (invented.length) console.log(`  invented: ${invented.join(' ')}`);
const comps = [...new Set(real.map((u) => vocab.get(u)))].sort();
for (const c of comps) {
  const rules = [...norm(vocab.get(`__css__${c}`)).matchAll(/([^{}]+\{[^{}]*\})/g)].map((m) => m[1]).filter((r) => !r.startsWith('@'));
  const hit = rules.filter((r) => outCss.includes(r)).length;
  console.log(`  ${c}: ${hit}/${rules.length} of its CSS rules present verbatim`);
}
