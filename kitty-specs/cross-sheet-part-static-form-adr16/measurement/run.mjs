// #314 — the cross-sheet `::part()` probe. Re-run with:
//
//     node kitty-specs/cross-sheet-part-static-form-adr16/measurement/run.mjs
//
// It writes `pages/*.html` (generated, committed, inspectable — open one in a browser and the
// probe is reproducible by hand) and `result.json`.
//
// THE BAR IS THE UNION of `outcomes.declared.json` and `outcomes.declared.cycle-2.json`, both
// committed BEFORE the run they govern. Every outcome id below appears in one of them with its
// expected result written in advance, and the runner refuses to finish if the two sets differ —
// so an outcome cannot be quietly added, dropped or relabelled after the fact.
//
// FOUR GROUPS:
//   M — the MECHANISM, on a synthetic two-element pair under full control of specificity,
//       importance and stylesheet order. Nothing shipped is involved, deliberately: the question
//       "what IS the cross-sheet ::part() cascade" must be answerable without a component's
//       accidental properties standing in for the rule.
//   P — REACHABILITY of a part nested one shadow level deeper than the document, which is the
//       shipped sk-metric shape.
//   S — the SHIPPED surface's values: real sk-metric + sk-pill-tag against the naive static
//       rewrite of sk-metric.css:67.
//   H — an ADR-15 FOLLOW-ON. ADR-15's kind-1/kind-2 verdict is a two-element wrapper carrying the
//       component's `:host` set. Its outcome tables are all library-only. H asks the question those
//       outcomes never asked: does the wrapper reproduce `:host`'s CASCADE POSITION against a
//       consumer's own rule, as opposed to its layout?
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MEASUREMENT_DIR, REPO_ROOT, startServer, perEngine } from './harness.mjs';

const PAGES_DIR = join(MEASUREMENT_DIR, 'pages');
const PAGES_URL_PREFIX = '/kitty-specs/cross-sheet-part-static-form-adr16/measurement/pages';

const TOKENS = '/pkg/%40spec-kitty%2Ftokens';
const METRIC_CSS = '/pkg/%40spec-kitty%2Fstyles%2Fmetric%2Fsk-metric.css';
const PILL_CSS = '/pkg/%40spec-kitty%2Fstyles%2Fpill-tag%2Fsk-pill-tag.css';
const ACTION_ROW_CSS = '/pkg/%40spec-kitty%2Fstyles%2Faction-row%2Fsk-action-row.css';
const ELEMENTS_JS = '/packages/elements/dist/elements.js';

/* ───────────────────────── group M: the mechanism ───────────────────────── */

// The synthetic pair. `probe-tag` is the component being reached INTO; `.wrap probe-tag::part(tag)`
// plays the role sk-metric.css:67 plays for sk-pill-tag. The static twin collapses the custom
// element away entirely and keeps the part node as the root — which is exactly what
// sk-pill-tag's generated static form does (`<span class="sk-pill-tag">`, no `part` attribute:
// a `part` attribute is meaningless outside a shadow root).
const shadowPage = ({ title, sheets, innerCss }) => `<!doctype html>
<meta charset="utf-8">
<title>${title}</title>
${sheets.map((s, i) => `<style data-sheet="${i}">\n${s}\n</style>`).join('\n')}
<div class="wrap"><probe-tag id="host">label</probe-tag></div>
<script type="text/plain" id="inner-sheet">
${innerCss}
</script>
<script>
  const innerCss = document.getElementById('inner-sheet').textContent;
  customElements.define('probe-tag', class extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>' + innerCss + '</style>'
        + '<span part="tag" class="tag a b" id="inner"><slot></slot></span>';
    }
  });
</script>
`;

const staticPage = ({ title, sheets, markup }) => `<!doctype html>
<meta charset="utf-8">
<title>${title}</title>
${sheets.map((s, i) => `<style data-sheet="${i}">\n${s}\n</style>`).join('\n')}
${markup}
`;

// The twin's markup. Same classes and same id as the shadow form's part node, so the flattened
// sheet's selectors are LITERALLY the same text in both forms — the only thing that changes is
// which tree they live in.
const TWIN = '<div class="wrap"><span id="inner" class="tag a b">label</span></div>';

const BASE_INNER = '.tag { display: inline-block; background-color: rgb(0, 0, 255); }';

const MECHANISM = {
  // M1 / M4 — white-space. Reaching rule (0,1,2) vs inner (0,1,0). M4 is M1 with the reaching
  // sheet moved to the very top of the document: if tree order is what decides, moving it
  // changes nothing.
  M1: {
    kind: 'shadow',
    title: 'M1 — shadow, reaching sheet LAST',
    innerCss: `${BASE_INNER}\n.tag { white-space: nowrap; }`,
    sheets: ['.wrap probe-tag::part(tag) { white-space: normal; }'],
    measure: 'whiteSpace',
  },
  M4: {
    kind: 'shadow',
    title: 'M4 — shadow, reaching sheet FIRST (identical rules, moved)',
    innerCss: `${BASE_INNER}\n.tag { white-space: nowrap; }`,
    // Identical single sheet; the shadow sheet is inside the shadow root either way, so "first"
    // and "last" in the document are the two positions a consumer can actually choose between.
    sheets: [
      '.wrap probe-tag::part(tag) { white-space: normal; }',
      '/* a later document sheet, to prove the reaching rule is not merely last */\n.wrap { outline: 0; }',
    ],
    measure: 'whiteSpace',
  },
  // M2 / M3 — specificity. The reaching rule is made as weak as a ::part() rule can be (0,0,2);
  // the inner rule as strong as this component could plausibly grow (1,3,0).
  M2: {
    kind: 'shadow',
    title: 'M2 — shadow, reaching (0,0,2) vs inner (1,3,0)',
    innerCss: `${BASE_INNER}\n#inner.a.b.tag { padding-block-start: 40px; }`,
    sheets: ['probe-tag::part(tag) { padding-block-start: 4px; }'],
    measure: 'paddingBlockStart',
  },
  M3: {
    kind: 'static',
    title: 'M3 — static twin of M2, reaching rewrite (0,2,0) vs inner (1,3,0)',
    sheets: [
      `${BASE_INNER}\n#inner.a.b.tag { padding-block-start: 40px; }`,
      '.wrap .tag { padding-block-start: 4px; }',
    ],
    markup: TWIN,
    measure: 'paddingBlockStart',
  },
  // M5 — order, at a tie. The static twin's two rules are both (0,1,0); the reaching rewrite is
  // authored FIRST, which is the position a bundler commonly puts a library sheet in.
  M5: {
    kind: 'static',
    title: 'M5 — static twin, tie at (0,1,0), reaching rewrite FIRST',
    sheets: [
      '.tag { white-space: normal; }',
      `${BASE_INNER}\n.tag { white-space: nowrap; }`,
    ],
    markup: TWIN,
    measure: 'whiteSpace',
  },
  // M6 / M7 / M8 — importance.
  M6: {
    kind: 'shadow',
    title: 'M6 — shadow, inner !important vs reaching normal',
    innerCss: `${BASE_INNER}\n.tag { padding-inline-start: 40px !important; }`,
    sheets: ['.wrap probe-tag::part(tag) { padding-inline-start: 4px; }'],
    measure: 'paddingInlineStart',
  },
  M7: {
    kind: 'shadow',
    title: 'M7 — shadow, BOTH !important',
    innerCss: `${BASE_INNER}\n.tag { padding-inline-start: 40px !important; }`,
    sheets: ['.wrap probe-tag::part(tag) { padding-inline-start: 4px !important; }'],
    measure: 'paddingInlineStart',
  },
  M8: {
    kind: 'static',
    title: 'M8 — static twin of M7, both !important, reaching rewrite (0,2,0)',
    sheets: [
      `${BASE_INNER}\n.tag { padding-inline-start: 40px !important; }`,
      '.wrap .tag { padding-inline-start: 4px !important; }',
    ],
    markup: TWIN,
    measure: 'paddingInlineStart',
  },
  // M9 / M10 — the PAGE, which is a third party to both sheets above.
  M9: {
    kind: 'shadow',
    title: 'M9 — shadow, a page rule .tag { background-color: red }',
    innerCss: BASE_INNER,
    sheets: ['.tag { background-color: rgb(255, 0, 0); }'],
    measure: 'backgroundColor',
  },
  // M11 — the bound on M2. Two OUTER-tree rules, the weaker one authored LAST.
  M11: {
    kind: 'shadow',
    title: 'M11 — shadow, two outer-tree reaching rules, (0,1,2) FIRST vs (0,0,2) LAST',
    innerCss: BASE_INNER,
    sheets: [
      '.wrap probe-tag::part(tag) { padding-block-start: 4px; }',
      'probe-tag::part(tag) { padding-block-start: 40px; }',
    ],
    measure: 'paddingBlockStart',
  },
  M10: {
    kind: 'static',
    title: 'M10 — static twin of M9, page sheet LAST',
    sheets: [BASE_INNER, '.tag { background-color: rgb(255, 0, 0); }'],
    markup: TWIN,
    measure: 'backgroundColor',
  },
};

/* ────────────── groups P and S: the shipped sk-metric / sk-pill-tag surface ────────────── */

// The six declarations sk-metric.css:67 carries, rewritten as an ordinary document rule at
// (0,2,0). This is the NAIVE static form — the thing the question asks whether we can gate.
const NAIVE_REWRITE = `.sk-metric__annotation .sk-pill-tag {
  box-sizing: border-box;
  max-width: 100%;
  padding-block: 0;
  padding-inline: var(--sk-space-2);
  overflow-wrap: anywhere;
  white-space: normal;
}`;

// sk-metric has NO generated static markup (no sk-metric.markup.ts, no sk-metric.html — checked
// at this head). This is the flattened shape its element renders, written out by hand for the
// probe. It is a HYPOTHETICAL static form, and the record says so: the point of these outcomes
// is not that this markup ships, but what its cascade would be if it did.
const METRIC_STATIC_MARKUP = `<dl class="sk-metric sk-metric--neutral">
  <dt class="sk-metric__label">Label</dt>
  <dd class="sk-metric__content">
    <span class="sk-metric__value">42</span>
    <span class="sk-metric__annotation"><span class="sk-pill-tag" id="tag">a fairly long annotation string</span></span>
  </dd>
</dl>`;

const metricShadowPage = ({ title, pageSheets = [], extraInner = '', exportparts = false }) => `<!doctype html>
<meta charset="utf-8">
<title>${title}</title>
<link rel="stylesheet" href="${TOKENS}">
<script src="${ELEMENTS_JS}"></script>
<div style="width: 320px">
  <sk-metric id="metric" label="Label" display-value="42" annotation="a fairly long annotation string"></sk-metric>
</div>
${pageSheets.map((s, i) => `<style data-page-sheet="${i}">\n${s}\n</style>`).join('\n')}
<script type="text/plain" id="extra-inner">${extraInner}</script>
<script>
  window.__ready = (async () => {
    await customElements.whenDefined('sk-metric');
    await customElements.whenDefined('sk-pill-tag');
    const metric = document.getElementById('metric');
    await metric.updateComplete;
    const pill = metric.shadowRoot.querySelector('sk-pill-tag');
    await pill.updateComplete;
    if (${String(exportparts)}) {
      // The one line sk-metric does NOT carry today. Nothing else changes.
      pill.setAttribute('exportparts', 'tag');
      await new Promise((r) => requestAnimationFrame(r));
    }
    const extra = document.getElementById('extra-inner').textContent.trim();
    if (extra) {
      // Simulates the component OWNER adding a rule to sk-pill-tag.css. Injected into
      // sk-pill-tag's own shadow root, which is where such a rule would live.
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(extra);
      pill.shadowRoot.adoptedStyleSheets = [...pill.shadowRoot.adoptedStyleSheets, sheet];
    }
    window.__tag = pill.shadowRoot.querySelector('[part="tag"]');
    return true;
  })();
</script>
`;

const metricStaticPage = ({ title, sheets }) => `<!doctype html>
<meta charset="utf-8">
<title>${title}</title>
<link rel="stylesheet" href="${TOKENS}">
${sheets.join('\n')}
<div style="width: 320px">
${METRIC_STATIC_MARKUP}
</div>
<script>window.__ready = Promise.resolve(true); window.__tag = document.getElementById('tag');</script>
`;

const LINK_METRIC = `<link rel="stylesheet" href="${METRIC_CSS}">`;
const LINK_PILL = `<link rel="stylesheet" href="${PILL_CSS}">`;
const STYLE_REWRITE = `<style>\n${NAIVE_REWRITE}\n</style>`;

const SHIPPED_PROPS = [
  'whiteSpace',
  'paddingBlockStart',
  'paddingInlineStart',
  'overflowWrap',
  'boxSizing',
  'maxWidth',
];

// A rule at (0,2,0) inside sk-pill-tag's OWN sheet, standing in for a compound the component
// owner may add at any time (a variant × shape pair, say). Nothing about sk-metric changes.
const SIMULATED_INNER_COMPOUND = '.sk-pill-tag.sk-pill-tag--future { white-space: nowrap; }';
// (0,3,0) — STRICTLY above the (0,2,0) naive rewrite. Same shape a variant x shape x state
// compound in a component's own sheet would have.
const SIMULATED_INNER_COMPOUND_HIGHER =
  '.sk-pill-tag.sk-pill-tag--future.sk-pill-tag--future2 { white-space: nowrap; }';
const SIMULATED_INNER_CLASSES = ['sk-pill-tag--future', 'sk-pill-tag--future2'];

/* ────────────── group H: ADR-15's kind-1/kind-2 wrapper, against a consumer ────────────── */

const ACTION_ROW_WRAPPER_RULE = `.sk-action-row-host {
  display: block;
  min-width: 0;
  container-type: inline-size;
}`;

/* ──────────────────────────────── page assembly ──────────────────────────────── */

const buildPages = async () => {
  const staticRowMarkup = (await readFile(
    join(REPO_ROOT, 'packages/styles/dist/action-row/sk-action-row.html'),
    'utf8',
  ))
    .split('\n')
    .filter((line) => !line.startsWith('<!--'))
    .join('\n')
    .trim();

  const pages = {};
  for (const [id, spec] of Object.entries(MECHANISM)) {
    pages[id] = spec.kind === 'shadow' ? shadowPage(spec) : staticPage(spec);
  }

  // ── P: reachability of a part one shadow level deeper than the document ──
  pages.P1 = metricShadowPage({
    title: 'P1 — shadow, document rule sk-pill-tag::part(tag)',
    pageSheets: ['sk-pill-tag::part(tag) { margin-block-start: 9px; }'],
  });
  pages.P2 = metricShadowPage({
    title: 'P2 — shadow, document rule sk-metric::part(tag)',
    pageSheets: ['sk-metric::part(tag) { margin-block-start: 9px; }'],
  });
  pages.P3 = metricStaticPage({
    title: 'P3 — static twin, the same consumer intent as .sk-pill-tag',
    sheets: [LINK_METRIC, LINK_PILL, STYLE_REWRITE, '<style>.sk-pill-tag { margin-block-start: 9px; }</style>'],
  });
  pages.P4 = metricShadowPage({
    title: 'P4 — shadow, document rule .sk-pill-tag { background }',
    pageSheets: ['.sk-pill-tag { background-color: rgb(255, 0, 0); }'],
  });
  pages.P5 = metricStaticPage({
    title: 'P5 — static twin of P4, page sheet LAST',
    sheets: [LINK_METRIC, LINK_PILL, STYLE_REWRITE, '<style>.sk-pill-tag { background-color: rgb(255, 0, 0); }</style>'],
  });

  // ── S: the shipped surface's values ──
  pages.S_shadow = metricShadowPage({ title: 'S1-S6 — shadow, the real elements' });
  pages.S_static = metricStaticPage({
    title: 'S1-S6 — static twin, the naive rewrite',
    sheets: [LINK_METRIC, LINK_PILL, STYLE_REWRITE],
  });
  pages.S7_static = metricStaticPage({
    title: 'S7 — static twin, sk-pill-tag.css ordered AFTER the rewrite',
    sheets: [LINK_METRIC, STYLE_REWRITE, LINK_PILL],
  });
  pages.S8_shadow = metricShadowPage({
    title: 'S8 — shadow, with a simulated (0,2,0) rule added to sk-pill-tag.css',
    extraInner: SIMULATED_INNER_COMPOUND,
  });
  pages.S8_static = metricStaticPage({
    title: 'S8 — static twin, the same simulated rule as a document rule',
    sheets: [LINK_METRIC, LINK_PILL, `<style>${SIMULATED_INNER_COMPOUND}</style>`, STYLE_REWRITE],
  });

  pages.S9_shadow = metricShadowPage({
    title: 'S9 — shadow, with a simulated (0,3,0) rule added to sk-pill-tag.css',
    extraInner: SIMULATED_INNER_COMPOUND_HIGHER,
  });
  pages.S9_static = metricStaticPage({
    title: 'S9 — static twin, the same simulated (0,3,0) rule as a document rule, BEFORE the rewrite',
    sheets: [LINK_METRIC, LINK_PILL, `<style>${SIMULATED_INNER_COMPOUND_HIGHER}</style>`, STYLE_REWRITE],
  });
  pages.S10_static = metricStaticPage({
    title: 'S10 — static twin, the S8 tie with document order reversed',
    sheets: [LINK_METRIC, LINK_PILL, STYLE_REWRITE, `<style>${SIMULATED_INNER_COMPOUND}</style>`],
  });
  pages.P6 = metricShadowPage({
    title: 'P6 — shadow, with exportparts forwarding the pill\'s tag part to the document',
    pageSheets: ['sk-metric::part(tag) { margin-block-start: 9px; }'],
    exportparts: true,
  });

  // ── H: ADR-15's wrapper, against a consumer's own rule ──
  pages.H1 = `<!doctype html>
<meta charset="utf-8">
<title>H1 — shadow, consumer rule sk-action-row { display: flex } at (0,0,1)</title>
<link rel="stylesheet" href="${TOKENS}">
<script src="${ELEMENTS_JS}"></script>
<style>sk-action-row { display: flex; }</style>
<div style="width: 360px"><sk-action-row id="row" rowid="r1">Row title</sk-action-row></div>
<script>
  window.__ready = (async () => {
    await customElements.whenDefined('sk-action-row');
    const row = document.getElementById('row');
    await row.updateComplete;
    window.__host = row;
    window.__root = row.shadowRoot.querySelector('.sk-action-row');
    return true;
  })();
</script>
`;
  pages.H2 = `<!doctype html>
<meta charset="utf-8">
<title>H2 — ADR-15's static wrapper, consumer rule div { display: flex } at (0,0,1)</title>
<link rel="stylesheet" href="${TOKENS}">
<link rel="stylesheet" href="${ACTION_ROW_CSS}">
<style>${ACTION_ROW_WRAPPER_RULE}</style>
<style>div { display: flex; }</style>
<div style="width: 360px">${staticRowMarkup}</div>
<script>
  window.__ready = Promise.resolve(true);
  window.__host = document.querySelector('.sk-action-row-host');
  window.__root = document.querySelector('.sk-action-row');
</script>
`;
  pages.H3 = `<!doctype html>
<meta charset="utf-8">
<title>H3 — shadow, consumer rule sk-action-row { container-type: normal }</title>
<link rel="stylesheet" href="${TOKENS}">
<script src="${ELEMENTS_JS}"></script>
<style>sk-action-row { container-type: normal; }</style>
<div style="width: 360px"><sk-action-row id="row" rowid="r1">Row title</sk-action-row></div>
<script>
  window.__ready = (async () => {
    await customElements.whenDefined('sk-action-row');
    const row = document.getElementById('row');
    await row.updateComplete;
    window.__host = row;
    window.__root = row.shadowRoot.querySelector('.sk-action-row');
    return true;
  })();
</script>
`;
  pages.H4 = `<!doctype html>
<meta charset="utf-8">
<title>H4 — static wrapper, consumer rule .sk-action-row-host { container-type: normal } FIRST</title>
<link rel="stylesheet" href="${TOKENS}">
<link rel="stylesheet" href="${ACTION_ROW_CSS}">
<style>.sk-action-row-host { container-type: normal; }</style>
<style>${ACTION_ROW_WRAPPER_RULE}</style>
<div style="width: 360px">${staticRowMarkup}</div>
<script>
  window.__ready = Promise.resolve(true);
  window.__host = document.querySelector('.sk-action-row-host');
  window.__root = document.querySelector('.sk-action-row');
</script>
`;

  await mkdir(PAGES_DIR, { recursive: true });
  for (const [id, html] of Object.entries(pages)) {
    await writeFile(
      join(PAGES_DIR, `${id}.html`),
      `<!-- GENERATED by ../run.mjs — DO NOT EDIT. Committed so the probe can be reproduced by hand. -->\n${html}`,
    );
  }
  return Object.keys(pages);
};

/* ─────────────────────────────────── the run ─────────────────────────────────── */

const url = (origin, id) => `${origin}${PAGES_URL_PREFIX}/${id}.html`;

const readMechanism = (page, id, prop) =>
  page.evaluate(
    ({ id, prop }) => {
      const node = document.querySelector('probe-tag')
        ? document.querySelector('probe-tag').shadowRoot.querySelector('[part="tag"]')
        : document.getElementById('inner');
      return getComputedStyle(node)[prop];
    },
    { id, prop },
  );

const readTag = (page, props) =>
  page.evaluate(async (props) => {
    await window.__ready;
    const cs = getComputedStyle(window.__tag);
    const out = {};
    for (const p of props) out[p] = cs[p];
    return out;
  }, props);

const measureEngine = async (page, origin) => {
  const observed = {};

  for (const [id, spec] of Object.entries(MECHANISM)) {
    await page.goto(url(origin, id));
    observed[id] = await readMechanism(page, id, spec.measure);
  }

  await page.goto(url(origin, 'P1'));
  observed.P1 = (await readTag(page, ['marginBlockStart'])).marginBlockStart;
  await page.goto(url(origin, 'P2'));
  observed.P2 = (await readTag(page, ['marginBlockStart'])).marginBlockStart;
  await page.goto(url(origin, 'P3'));
  observed.P3 = (await readTag(page, ['marginBlockStart'])).marginBlockStart;
  await page.goto(url(origin, 'P4'));
  observed.P4 = (await readTag(page, ['backgroundColor'])).backgroundColor;
  await page.goto(url(origin, 'P5'));
  observed.P5 = (await readTag(page, ['backgroundColor'])).backgroundColor;

  await page.goto(url(origin, 'S_shadow'));
  const sShadow = await readTag(page, SHIPPED_PROPS);
  await page.goto(url(origin, 'S_static'));
  const sStatic = await readTag(page, SHIPPED_PROPS);
  SHIPPED_PROPS.forEach((prop, i) => {
    observed[`S${i + 1}`] = { property: prop, shadow: sShadow[prop], static: sStatic[prop] };
  });

  await page.goto(url(origin, 'P6'));
  observed.P6 = (await readTag(page, ['marginBlockStart'])).marginBlockStart;

  await page.goto(url(origin, 'S7_static'));
  observed.S7 = {
    property: 'whiteSpace',
    shadow: sShadow.whiteSpace,
    static: (await readTag(page, ['whiteSpace'])).whiteSpace,
  };

  // S8 / S9 / S10 — the simulated future rules. The extra classes have to be present on the tag
  // node for the compounds to match, on BOTH paths.
  const withClasses = (p) =>
    p.evaluate(async (classes) => {
      await window.__ready;
      window.__tag.classList.add(...classes);
      return getComputedStyle(window.__tag).whiteSpace;
    }, SIMULATED_INNER_CLASSES);

  await page.goto(url(origin, 'S8_shadow'));
  const s8shadow = await withClasses(page);
  await page.goto(url(origin, 'S8_static'));
  const s8static = await withClasses(page);
  observed.S8 = { property: 'whiteSpace', shadow: s8shadow, static: s8static };

  await page.goto(url(origin, 'S9_shadow'));
  const s9shadow = await withClasses(page);
  await page.goto(url(origin, 'S9_static'));
  const s9static = await withClasses(page);
  observed.S9 = { property: 'whiteSpace', shadow: s9shadow, static: s9static };

  await page.goto(url(origin, 'S10_static'));
  const s10static = await withClasses(page);
  observed.S10 = { property: 'whiteSpace', shadow: s8shadow, static: s10static };

  const readRow = (p) =>
    p.evaluate(async () => {
      await window.__ready;
      return {
        host_display: getComputedStyle(window.__host).display,
        host_container_type: getComputedStyle(window.__host).containerType,
        root_flex_wrap: getComputedStyle(window.__root).flexWrap,
      };
    });

  for (const id of ['H1', 'H2', 'H3', 'H4']) {
    await page.goto(url(origin, id));
    observed[id] = await readRow(page);
  }

  return observed;
};

const main = async () => {
  const ids = await buildPages();
  // THE BAR IS THE UNION of both declaration files, per ADR-15's convention. Reading only
  // cycle 1 would accept a run that never probed S9/S10 — the outcomes that separate a static
  // form which agrees from one which agrees by ordering accident.
  const declaredSources = ['outcomes.declared.json', 'outcomes.declared.cycle-2.json'];
  const declaredFiles = await Promise.all(
    declaredSources.map(async (f) => JSON.parse(await readFile(join(MEASUREMENT_DIR, f), 'utf8'))),
  );
  const declared = { outcomes: declaredFiles.flatMap((d) => d.outcomes) };
  const server = await startServer();
  let observed;
  try {
    observed = await perEngine((page) => measureEngine(page, server.origin));
  } finally {
    await server.close();
  }

  // The declared set is the bar; refuse to record a run whose outcome ids differ from it.
  const declaredIds = declared.outcomes.map((o) => o.id).sort();
  const measurable = Object.values(observed).find((v) => !v.__unmeasurable);
  const observedIds = Object.keys(measurable ?? {}).sort();
  const missing = declaredIds.filter((id) => !observedIds.includes(id));
  const extra = observedIds.filter((id) => !declaredIds.includes(id));
  if (missing.length || extra.length) {
    throw new Error(
      `outcome set does not match the pre-declared bar. missing=${missing.join(',')} extra=${extra.join(',')}`,
    );
  }
  if (declaredIds.length === 0) throw new Error('empty declared set — refusing a vacuous pass');

  const result = {
    issue: 314,
    ran_at: new Date().toISOString(),
    head: process.env.PROBE_HEAD ?? null,
    declared_outcome_sources: declaredSources,
    declared_outcome_count: declaredIds.length,
    pages: ids,
    resolved_specifiers: server.resolvedSpecifiers,
    engines: Object.fromEntries(
      Object.entries(observed).map(([engine, values]) => [
        engine,
        values.__unmeasurable ? { unmeasurable: values.__unmeasurable } : { outcomes: values },
      ]),
    ),
  };
  await writeFile(join(MEASUREMENT_DIR, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result.engines, null, 2));
};

await main();
