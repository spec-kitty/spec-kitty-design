#!/usr/bin/env node
/**
 * The no-build consumer, proven by interception (#80, NFR-002, SC-006).
 *
 * ADR-10 §2's second distribution entry is the classic-script bundle: a `<script>` tag, no
 * bundler, no npm install, no network. #82's whole premise. This opens a real `file://` page in
 * chromium, intercepts EVERY request, and asserts the elements upgraded and that nothing left
 * the machine.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * WHY THIS PROBE IS RED-FIRST AND NOT MERELY GREEN
 *
 * When this probe was written the criterion passed BY ACCIDENT, and that is why it is built the
 * way it is.
 *
 * tokens.css then carried
 *   @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono…')
 * positioned AFTER a style rule, which CSS forbids — so every browser dropped it. Measured in
 * chromium at the time: 32 rules parsed, 0 import rules, and a route watching
 * fonts.googleapis.com never fired. "Zero network requests" was true because the graph's only
 * network dependency was dead code, and a probe that merely observed the healthy tree would have
 * been green and blind.
 *
 * THAT LINE IS NOW DELETED (same PR, WP04), so the accident is gone — but the reasoning is not
 * historical trivia. The graph has no network dependency today, which means this probe's green is
 * indistinguishable from a probe that cannot see, and the only thing separating them is
 * `--selftest`: it plants a page that DOES fetch something and requires this probe to red on it.
 * A future change that reintroduces a fetch — a self-hosted webfont pulled from a CDN, an
 * analytics snippet, a repositioned @import — is exactly what this must catch, and the blindness
 * check is the reason it will.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * STAGED FROM REAL TARBALLS, not from the source tree.
 *
 * The first version copied `packages/elements/dist/elements.js` and `packages/tokens/dist/tokens.css`
 * into a temp directory and dropped `packages/tokens/fonts` beside the CSS. That layout is one no
 * consumer ever receives, and a lens showed what it hid: `files` listed `fonts/**`, so the fonts
 * packed at the TARBALL ROOT while `tokens.css` packed at `dist/tokens.css` — and `@font-face
 * src: url('./fonts/…')` resolves relative to the stylesheet, i.e. to `dist/fonts/`, which was not
 * in the package. All 30 faces 404'd for every npm consumer, silently, because `font-display: swap`
 * degrades quietly. The probe was green against a fiction.
 *
 * So it now runs `npm pack`, extracts what npm actually produces, and loads the page out of a
 * `node_modules/@spec-kitty/*` tree. If the published layout is broken, this reds.
 */
function stagePackages() {
  const dir = mkdtempSync(join(tmpdir(), 'sk-offline-'));
  const modules = join(dir, 'node_modules', '@spec-kitty');
  mkdirSync(modules, { recursive: true });
  for (const pkg of ['tokens', 'elements']) {
    const src = join(ROOT, 'packages', pkg);
    const out = execFileSync('npm', ['pack', '--pack-destination', dir, '--json'], {
      cwd: src, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    const tgz = join(dir, JSON.parse(out)[0].filename);
    const dest = join(modules, pkg);
    mkdirSync(dest, { recursive: true });
    // --strip-components=1 removes npm's `package/` prefix, giving the node_modules layout.
    execFileSync('tar', ['-xzf', tgz, '-C', dest, '--strip-components=1']);
  }
  return { dir, modules };
}

/**
 * The tags to assert, DERIVED from the manifest.
 *
 * This was a hand-written list of five, in the mission whose thesis is that hand-written lists
 * drift — three lenses said so. Its "floor" was `length === 0`, which a `const` literal cannot
 * reach, so it guarded the one failure mode that could not occur while ignoring the real one:
 * being short. The bundle registers fourteen.
 */
function manifestTags() {
  const m = JSON.parse(readFileSync(join(ROOT, 'packages/elements/custom-elements.json'), 'utf8'));
  const tags = [];
  for (const mod of m.modules ?? []) for (const d of mod.declarations ?? []) if (d.tagName) tags.push(d.tagName);
  const unique = [...new Set(tags)].sort();
  if (unique.length < 10) {
    console.error(`❌ derived only ${unique.length} tags from the manifest — refusing to assert over a near-empty set`);
    process.exit(1);
  }
  return unique;
}

function stage(extraHead = '') {
  const { dir, modules } = stagePackages();

  // FAIL CLOSED on the fonts. This was `if (existsSync(FONTS)) cpSync(...)` — a conditional copy
  // with no else, in a function whose own comment said a silent 404 "would look like a pass". A
  // lens moved the fonts away and the probe stayed green with all 30 faces missing.
  const fontDir = join(modules, 'tokens', 'dist', 'fonts');
  const fontCount = existsSync(fontDir) ? readdirSync(fontDir).length : 0;
  const css = readFileSync(join(modules, 'tokens', 'dist', 'tokens.css'), 'utf8');
  // BOTH quote styles and bare urls. The first version matched only `url('...')`, so reformatting
  // tokens.css to double quotes would have silently halved the checked set — the same
  // hand-written-narrowness the tag list was fixed for. Query strings and fragments are stripped:
  // `url('./fonts/x.otf?v=2')` resolves to the file, not to the literal.
  // EVERY url() form, and every @font-face counted. A lens walked three shapes past the first
  // version — `url("...")`, `url(...)` unquoted, and `url('../fonts/...')` — because it matched
  // only single-quoted `./fonts/`. The floor was `declared.size === 0`, which fires only if EVERY
  // face changes form; the failure that occurs is one face slipping through.
  const declared = new Set(
    [...css.matchAll(/url\(\s*['"]?([^'")]+?)['"]?\s*\)/g)]
      .map((m2) => m2[1].split(/[?#]/)[0])
      .filter((u) => !/^(https?:|data:|\/)/.test(u)),
  );
  const faceCount = (css.match(/@font-face/g) ?? []).length;
  if (declared.size < faceCount) {
    console.error(
      `❌ tokens.css has ${faceCount} @font-face rules but only ${declared.size} resolvable local ` +
        `src urls — a face is declared in a form this check does not parse, which is how one slips through`,
    );
    process.exit(1);
  }
  // Resolved RELATIVE TO THE STYLESHEET, which is what the browser does — `./fonts/x` and
  // `../fonts/x` are different files and the first version treated both as basenames.
  const cssDir = join(modules, 'tokens', 'dist');
  const missing = [...declared].filter((f) => !existsSync(join(cssDir, f)));
  if (declared.size === 0) {
    console.error('❌ tokens.css declares no @font-face sources — refusing to certify font loading over nothing');
    process.exit(1);
  }
  // A FLOOR THAT CAN ACTUALLY FIRE. `declared.size === 0` above guards the case a real stylesheet
  // cannot reach; shipping FEWER files than the sheet declares is the case that occurs, and it is
  // what the old `if (existsSync(FONTS))` let through silently.
  if (fontCount < declared.size) {
    console.error(`❌ tokens.css declares ${declared.size} @font-face sources but the package ships ${fontCount} font files`);
    process.exit(1);
  }
  if (missing.length) {
    console.error(
      `❌ the PUBLISHED tokens package declares ${declared.size} @font-face sources and ships ` +
        `${fontCount} font files, but ${missing.length} resolve to nothing relative to dist/tokens.css:\n   ` +
        missing.slice(0, 5).join('\n   ') + (missing.length > 5 ? `\n   … and ${missing.length - 5} more` : ''),
    );
    process.exit(1);
  }

  const tags = manifestTags();
  const html = `<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet" href="./node_modules/@spec-kitty/tokens/dist/tokens.css">
${extraHead}
<script src="./node_modules/@spec-kitty/elements/dist/elements.js"></script>
${tags.map((t) => `<${t}></${t}>`).join('\n')}
`;
  const page = join(dir, 'index.html');
  writeFileSync(page, html);
  return { page, tags, fontCount };
}

async function run(pagePath, tags) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const offsite = [];
  // EVERY request, then filtered by scheme. `file:` requests are the page loading its own
  // sibling assets and are what "no network" means here; anything else is a request that left
  // the machine, and http(s), ws(s) and data-exfiltrating schemes all count.
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('file://')) offsite.push(url);
  });
  // WEBSOCKETS NEED THEIR OWN LISTENER. The comment above used to claim `ws(s)` was covered by
  // scheme filtering; it is not — `page.on('request')` never fires for a WebSocket handshake, and
  // a lens proved the probe blind to `new WebSocket('wss://…')`. Same for the two other transports
  // that bypass the request event.
  page.on('websocket', (ws) => offsite.push(ws.url()));
  await page.goto(pathToFileURL(pagePath).href, { waitUntil: 'load' });
  await page.evaluate((t) => customElements.whenDefined(t), tags[0]);
  // A SETTLE WINDOW. The browser used to close the moment the first element upgraded, so a
  // request fired from a `setTimeout`, an idle callback, or a lazy import after load was invisible
  // — a lens demonstrated it with a 1.5s delayed fetch. This is not a fix for an arbitrarily late
  // request, and it is not claimed to be; it closes the common case.
  await page.waitForTimeout(2000);

  const result = await page.evaluate((tags) => {
    const out = { upgraded: [], notUpgraded: [], styled: null };
    for (const t of tags) {
      const el = document.querySelector(t);
      // An unupgraded custom element is an HTMLElement with no shadow root. Upgraded means the
      // class was applied, which for these is exactly "it has a shadowRoot".
      if (el && el.shadowRoot) out.upgraded.push(t);
      else out.notUpgraded.push(t);
    }
    // FONTS, asserted rather than assumed. The probe copied fonts into place and then never
    // looked at whether any of them loaded, so the whole paragraph about silent 404s guarded
    // nothing observable.
    out.fontFaces = document.fonts.size;
    const btn = document.querySelector(tags[0]);
    // Proof the ADOPTED sheet arrived, not just that the element exists: adoptedStyleSheets is
    // how ADR-10 §1 delivers CSS, so a non-empty list is the styling assertion.
    out.styled = btn?.shadowRoot ? btn.shadowRoot.adoptedStyleSheets.length : 0;
    return out;
  }, tags);

  await browser.close();
  return { offsite, ...result };
}

function report(r, { expectOffsite, tags }) {
  const problems = [];
  if (tags.length === 0) problems.push('the tag list is empty — this probe would assert nothing');
  if (r.notUpgraded.length) problems.push(`did not upgrade: ${r.notUpgraded.join(', ')}`);
  if (!r.styled) problems.push(`${tags[0]} adopted ZERO stylesheets — the bundle loaded but carries no CSS`);
  if (!r.fontFaces) problems.push('the page registered ZERO @font-face rules — tokens.css did not apply');
  if (!expectOffsite && r.offsite.length) {
    problems.push(`${r.offsite.length} off-machine request(s): ${[...new Set(r.offsite)].join(', ')}`);
  }
  if (expectOffsite && r.offsite.length === 0) {
    problems.push('the fixture was built to make an off-machine request and none was seen — this probe is blind');
  }
  return problems;
}

const selftest = process.argv.includes('--selftest');

if (selftest) {
  // A page that deliberately reaches off-machine. If the probe cannot see this, it cannot see
  // a repositioned @import either, and its green means nothing.
  const { page, tags } = stage('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap">');
  const r = await run(page, tags);
  const problems = report(r, { expectOffsite: true, tags });
  if (problems.length) {
    console.error('❌ the offline probe is blind:');
    problems.forEach((p) => console.error(`   ${p}`));
    process.exit(1);
  }
  console.log(`✅ probe sees an off-machine request when one is planted (${r.offsite.length} seen)`);
  console.log(`   ${[...new Set(r.offsite)].join('\n   ')}`);
} else {
  const { page, tags, fontCount } = stage();
  const r = await run(page, tags);
  const problems = report(r, { expectOffsite: false, tags });
  if (problems.length) {
    console.error('❌ file:// load failed:');
    problems.forEach((p) => console.error(`   ${p}`));
    process.exit(1);
  }
  console.log(
    `✅ file:// load from the PACKED tarballs: ${r.upgraded.length}/${tags.length} elements upgraded, ` +
      `${r.styled} adopted sheet(s), ${r.fontFaces} @font-face rules with ${fontCount} font files ` +
      `shipped, ZERO off-machine requests.`,
  );
}
