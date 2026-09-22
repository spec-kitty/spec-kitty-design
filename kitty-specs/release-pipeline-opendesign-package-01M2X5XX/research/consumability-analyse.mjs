// Usage: node kitty-specs/release-pipeline-opendesign-package-01M2X5XX/research/consumability-analyse.mjs <output.html> <package-dir>
//
// Measures an OpenDesign output against the package, as consumability-proof.md describes:
//   classes  every sk-*/is-* class in the output is looked up in the union of the per-component class
//            vocabularies (the generator's own classVocabulary() over components/<name>.html); a class
//            in no vocabulary is INVENTED.
//   CSS      for each component, a rule is APPLICABLE when every class in its selector is used by the
//            output; :host, ::slotted and light-theme rules are left out (a dark static page cannot
//            exercise them). Each applicable rule is searched for, whitespace-normalised, in the
//            output's <style> blocks. Components with no applicable rule are not listed.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const [out, pkg] = process.argv.slice(2);
const html = readFileSync(out, 'utf8');
const { classVocabulary } = await import(new URL('../../../scripts/build-opendesign-package.mjs', import.meta.url).href);
const norm = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').trim();
const outCss = norm([...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n'));
const used = new Set([...html.matchAll(/\bclass\s*=\s*"([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean));

const vocabulary = new Set();
const pages = [];
for (const f of readdirSync(join(pkg, 'components')).sort()) {
  const page = readFileSync(join(pkg, 'components', f), 'utf8');
  const css = (page.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
  const forms = [...page.matchAll(/<figure[\s\S]*?<\/figure>/g)].map((m) => ({ markup: m[0] }));
  for (const c of classVocabulary(css, forms)) vocabulary.add(c);
  pages.push({ name: f.replace(/\.html$/, ''), css });
}

const ns = [...used].filter((u) => /^(sk-|is-)/.test(u)).sort();
const invented = ns.filter((u) => !vocabulary.has(u));
console.log(`library-namespace classes used: ${ns.length}; real: ${ns.length - invented.length}; invented: ${invented.length}`);
if (invented.length) console.log(`  invented: ${invented.join(' ')}`);

for (const { name, css } of pages) {
  // Inner rules of an at-rule block are matched on their own; the at-rule header is not a rule.
  const rules = [...norm(css).matchAll(/([^{}@]+\{[^{}]*\})/g)].map((m) => m[1]);
  const applicable = rules.filter((r) => {
    const sel = r.slice(0, r.indexOf('{'));
    if (/:host|::slotted|data-theme|sk-light/.test(sel)) return false;
    const cls = [...sel.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);
    return cls.length > 0 && cls.every((c) => used.has(c));
  });
  if (!applicable.length) continue;
  const verbatim = applicable.filter((r) => outCss.includes(r)).length;
  console.log(`  ${name}: ${verbatim}/${applicable.length} applicable CSS rules present verbatim (of ${rules.length} rules)`);
}
