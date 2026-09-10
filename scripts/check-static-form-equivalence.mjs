#!/usr/bin/env node
/**
 * Hold the generated light-DOM static form equal to the shadow form (ADR-15 kinds 1 and 2, #310).
 *
 * WHAT THIS GATE ESTABLISHES, AND WHAT IT DOES NOT. READ THIS BEFORE TRUSTING ITS GREEN.
 *
 * ADR-15's candidate (a) is `a generated static form WITH A GATE HOLDING THE TWO FORMS EQUAL`.
 * `equal` is the load-bearing word and it has a weak reading and a strong one, so this file says
 * which one it enforces.
 *
 *   * ESTABLISHED — computed-style equality on a LIBRARY-ONLY page. Every scenario in
 *     `expected-static-form.json` renders the real element and the generated static form in one
 *     engine, in a document whose only author CSS is this library's own, and requires every
 *     declared observable to agree. That covers what ADR-15's 42 outcomes covered — the composed
 *     cases, the flex-item case, the unconditional-`@container` case, the exact breakpoints —
 *     across four components rather than two, and it is a real property: it is what fails when a
 *     generator collapses the wrapper, abbreviates it, or `display: contents` it away.
 *
 *   * NOT ESTABLISHED — CASCADE equivalence. `:host` declarations sit in the INNER tree, so a
 *     document declaration beats them regardless of specificity and regardless of order. Moved
 *     onto `.sk-<name>-host` the same declarations become ordinary (0,1,0) DOCUMENT declarations
 *     a consumer now has to outbid. The wrapper reproduces `:host`'s layout and HARDENS its
 *     cascade position. That is #375, found by ADR-16's group H, and no amount of computed-style
 *     comparison on a library-only page can see it — which is exactly why a naive implementation
 *     of this issue would have shipped a green gate over an untested claim.
 *
 * So the equality bar is stated as LIBRARY-ONLY and the divergence is not left invisible: the
 * `consumerOverrides` table renders the same consumer intent against both forms, asserts the two
 * spellings weigh the same, and PINS THE VERDICT — `diverge` where CSS diverges, `equal` where it
 * does not. Those rows are not equality assertions and never go green by becoming equal; a row
 * flipping either way reds the gate, because the wrapper's weight is a decision consumers write
 * overrides against, not an implementation detail.
 *
 * This is the same test ADR-15 applied to `::slotted()` and ADR-16 applied to cross-sheet
 * `::part()`, reaching a DIFFERENT answer: for those two, the divergence is the whole substance of
 * the construct, so no useful gate exists and both were ruled shadow-only. Here the layout
 * equivalence is real, generable and worth gating, and the cascade divergence is a bounded,
 * measurable, statable trade. Gating the first while naming the second is the honest position;
 * gating the first and calling it `equal to the shadow form` is not.
 *
 * THREE CHECKS. The second and third are the ones that are easy to skip.
 *
 *   1. STRUCTURAL, over the generated sheet: `:host` is gone; a `.sk-<name>-host` rule exists;
 *      `container-type` is declared on the wrapper and NOWHERE else, which is a static, parseable
 *      statement of `an element is never its own query container`; and the wrapper is not
 *      `display: contents`, which removes the principal box and therefore the container.
 *   2. DECLARATION-SET COMPLETENESS, per component, against that component's OWN authored `:host`.
 *      Its own check because the structural one passes a wrapper that exists and is missing
 *      declarations — the defect ADR-15's cycle-1 draft shipped in prose. It is also what catches
 *      an abbreviated wrapper for `sk-action-row`, whose `:host` declares no `width` and whose
 *      abbreviated wrapper therefore passes every RENDERED outcome by coincidence.
 *   3. RENDERED EQUIVALENCE. Neither static check can see a divergence that comes from markup or
 *      from layout context.
 *
 * HOW THE STATIC TWIN IS BUILT, AND WHY IT IS NOT HAND-AUTHORED
 *
 * Three of the four components in scope have no `*.markup.ts` at this head, so there is no
 * generated static markup to render — `sk-action-row` is the only one, and #307 authored it. A
 * hand-written twin for the other three would be a second authored source that could itself be
 * wrong, and a wrong twin makes this gate certify a comparison between two mistakes.
 *
 * So the twin is FLATTENED FROM THE REAL ELEMENT: mount it, read its shadow root, replace every
 * `<slot>` with its assigned nodes, and wrap the result in `.sk-<name>-host` plus the modifier
 * classes the scenario's host attributes map to. That is exactly what ADR-15's own exemplars did
 * by hand, and it makes the subject of the comparison the CSS TRANSFORM — which is what #309
 * emits — rather than a markup module that may not exist. Where generated markup DOES exist, its
 * wrapper is checked separately (check 1c below), so the markup contract is not unenforced.
 *
 * COMPARE WITHIN ONE ENGINE. ADR-15's own table is chromium; firefox reaches the same verdict on
 * every one of its 52 outcomes and NOT always the same value, because `sk-action-row`'s grid
 * tracks resolve from font metrics. This gate diffs shadow against static inside one engine and
 * never against a literal, which is why nothing in `expected-static-form.json` is a transcribed
 * length.
 *
 * Usage: node scripts/check-static-form-equivalence.mjs [--static] [--selftest] [--record <path>]
 *
 *   --static    checks 1 and 2 only. No browser. This is the arm that runs in `lint-code`.
 *   (default)   checks 1, 2 and 3 against the committed generated sheets. Needs a browser and a
 *               built `packages/{tokens,styles,elements}/dist`.
 *   --selftest  the red-first probe table: four DELIBERATELY BROKEN static forms rendered through
 *               the same comparison, each asserted rejected or accepted as recorded, plus the
 *               `:where()` candidate #375 asks to be measured rather than argued.
 *   --record    additionally write the full measured table to a JSON file.
 */
import { readFileSync, writeFileSync, existsSync, globSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { hostClass, specificityOf, staticFormSources } from './build-static-form-css.mjs';

const args = process.argv.slice(2);
const staticOnly = args.includes('--static');
const selftest = args.includes('--selftest');
const recordAt = args.includes('--record') ? args[args.indexOf('--record') + 1] : null;

const DECLARATION = 'expected-static-form.json';
const declared = JSON.parse(readFileSync(DECLARATION, 'utf8'));
const problems = [];
const say = (line) => console.log(line);

// ===========================================================================
// Scope, derived once and shared by all three checks.
// ===========================================================================

const sources = staticFormSources();
if (sources.length === 0) {
  console.error(
    `❌ No sheet declares \`container-type\` on \`:host\` — refusing to report green over an empty\n` +
      '   comparison set. This gate holds a generated artifact equal to a shadow form; with no\n' +
      '   artifact in scope it certifies nothing, and a green line here would be indistinguishable\n' +
      '   from a passing one.',
  );
  process.exit(1);
}
if (sources.length < declared.floors.components) {
  console.error(
    `❌ ${sources.length} component(s) in scope, floor is ${declared.floors.components}. ` +
      'The derivation stopped finding sheets it used to find; that is a defect until proven ' +
      'otherwise, not a smaller job.',
  );
  process.exit(1);
}

// EVERY component in scope must be DECLARED, and every declared component must be in scope. A
// component that quietly leaves the declaration file is a component this gate stops comparing,
// with no line of output saying so.
for (const { component } of sources) {
  if (!declared.components[component]) {
    problems.push(
      `sk-${component} declares a host-owned \`container-type\` and has no entry in ${DECLARATION} — ` +
        'it would be generated and never compared.',
    );
  }
}
for (const component of Object.keys(declared.components)) {
  if (!sources.some((s) => s.component === component)) {
    problems.push(
      `${DECLARATION} declares sk-${component}, which no longer declares a host-owned ` +
        '`container-type`. Remove the entry deliberately, or find out why the sheet changed.',
    );
  }
}

// ===========================================================================
// CHECK 1 — structural, over the generated sheet.
// ===========================================================================

/** Every class named in a selector's rightmost SUBJECT compound. */
const subjectClasses = (selector) => {
  const out = [];
  for (const sel of selectorParser().astSync(selector).nodes) {
    const compound = [];
    for (const n of sel.nodes) {
      if (n.type === 'combinator') compound.length = 0;
      else compound.push(n);
    }
    out.push(compound.filter((n) => n.type === 'class').map((n) => n.value));
  }
  return out;
};

const structuralCheck = ({ file, component, out }) => {
  if (!existsSync(out)) {
    problems.push(`${out} does not exist — run \`node scripts/build-static-form-css.mjs\`.`);
    return;
  }
  const wrapper = hostClass(component);
  const root = postcss.parse(readFileSync(out, 'utf8'));

  let wrapperRule = null;
  let sawContainerQuery = false;
  root.walkAtRules('container', () => {
    sawContainerQuery = true;
  });

  root.walkRules((rule) => {
    // 1a. NO `:host` SURVIVES. A `:host` rule in a document sheet matches nothing at all, so a
    // partially-applied rewrite is silent by construction: the rule is simply absent, and every
    // OTHER rule keeps working.
    if (/(^|[^-\w]):host\b/.test(rule.selector)) {
      problems.push(
        `${out}: \`${rule.selector.replace(/\s+/g, ' ')}\` still names \`:host\`, which matches ` +
          'nothing in a document. The rewrite did not reach it.',
      );
    }
    if (rule.selector.trim() === `.${wrapper}`) wrapperRule = rule;

    // 1b. `container-type` ON THE WRAPPER AND NOWHERE ELSE. This is the static, parseable form of
    // the mechanism ADR-15 measured — an element is never its own query container — and it is
    // what refuses the collapsed transform without having to render anything.
    rule.walkDecls('container-type', (decl) => {
      if (decl.value.trim() === 'normal') return;
      const subjects = subjectClasses(rule.selector);
      const onlyWrapper = subjects.every((classes) => classes.every((c) => c === wrapper || c.startsWith(`${wrapper}--`)));
      if (!onlyWrapper) {
        problems.push(
          `${out}: \`container-type: ${decl.value}\` is declared on ` +
            `\`${rule.selector.replace(/\s+/g, ' ')}\`, whose subject is not the ` +
            `\`.${wrapper}\` wrapper. A container query styles a container's DESCENDANTS, so ` +
            'every rule on that element itself would start answering some outer ancestor while ' +
            'its descendants kept working — which is what makes the collapse silent.',
        );
      }
    });
  });

  if (!wrapperRule) {
    problems.push(
      `${out}: no \`.${wrapper} { … }\` rule. \`:host\` must become a WRAPPER element, never ` +
        `declarations merged onto \`.sk-${component}\`.`,
    );
    return;
  }
  if (!sawContainerQuery) {
    problems.push(
      `${out}: the sheet declares a host-owned \`container-type\` and carries no \`@container\` ` +
        'rule at all. Either the container is unused, or the rewrite dropped the blocks that ' +
        'query it.',
    );
  }

  // 1c. NOT `display: contents`. Stated by ADR-15 from the specification and left unprobed there:
  // `container-type` needs a principal box to establish a containment context, and
  // `display: contents` removes the element's box. This is the `remove the redundant div` edit a
  // template author makes, and it reverts the whole fix without leaving a trace. It is a static
  // condition, so it is refused statically here AND rendered as a red probe in --selftest.
  wrapperRule.walkDecls('display', (decl) => {
    if (decl.value.trim() === 'contents') {
      problems.push(
        `${out}: \`.${wrapper}\` declares \`display: contents\`, which removes its principal box ` +
          'and therefore the container every `@container` rule in this sheet queries.',
      );
    }
  });

  // 1d. The AUTHORED sheet must not define the wrapper itself. Two definitions of one class, one
  // generated and one not, is the two-source arrangement ADR-10 §3 exists to end.
  postcss.parse(readFileSync(file, 'utf8')).walkRules((rule) => {
    if (subjectClasses(rule.selector).some((classes) => classes.includes(wrapper))) {
      problems.push(
        `${file}: the AUTHORED sheet declares a rule for \`.${wrapper}\`. That class is generated ` +
          `output (${out}); an authored copy is a second source of record for it.`,
      );
    }
  });

  return wrapperRule;
};

// ===========================================================================
// CHECK 2 — declaration-set completeness, against the component's OWN `:host`.
// ===========================================================================

const declarationSet = (rule) => {
  const out = [];
  rule?.walkDecls((decl) => out.push(`${decl.prop}: ${decl.value.trim()}${decl.important ? ' !important' : ''}`));
  return out.sort();
};

const authoredHostRule = (file) => {
  let found = null;
  postcss.parse(readFileSync(file, 'utf8')).walkRules((rule) => {
    if (rule.selector.trim() === ':host' && rule.parent?.type === 'root') found = rule;
  });
  return found;
};

const completenessCheck = ({ file, component, out }, wrapperRule) => {
  if (!wrapperRule) return;
  const authored = declarationSet(authoredHostRule(file));
  const emitted = declarationSet(wrapperRule);
  if (authored.length === 0) {
    problems.push(`${file}: no top-level \`:host { … }\` rule — this component cannot be in scope.`);
    return;
  }
  const missing = authored.filter((d) => !emitted.includes(d));
  const extra = emitted.filter((d) => !authored.includes(d));
  if (missing.length || extra.length) {
    problems.push(
      `${out}: \`.${hostClass(component)}\` does not carry ${basename(file)}'s \`:host\` set.\n` +
        (missing.length ? `      missing: ${missing.join('; ')}\n` : '') +
        (extra.length ? `      extra:   ${extra.join('; ')}\n` : '') +
        '      The wrapper is `whatever that component\'s `:host` declares`, compared per component ' +
        'and never against a fixed list: sk-app-shell\'s `:host` declares `width: 100%` and losing ' +
        'it makes the component compute 0px as a flex item, while sk-action-row\'s declares no ' +
        '`width` at all and adding one would be just as wrong.',
    );
  }
};

// ===========================================================================
// CHECK 1c(ii) — the generated MARKUP's wrapper, where generated markup exists.
// ===========================================================================

const markupCheck = ({ component }) => {
  const markupSource = `packages/elements/src/${component}/sk-${component}.markup.ts`;
  const html = `packages/styles/src/${component}/sk-${component}.html`;
  const barrel = `packages/styles/src/${component}/index.ts`;
  if (!existsSync(markupSource)) {
    // STATED, not silently passed. Three of the four components in scope have no authored markup
    // module at this head, so #309's `the generated markup emits that wrapper` is vacuous for
    // them — and a gate that printed nothing here would read as if it had checked four.
    say(
      `   ·  sk-${component}: no ${markupSource} — no generated static markup exists for this ` +
        'component, so its wrapper markup is UNCHECKED (the CSS is not).',
    );
    return;
  }
  const wrapper = hostClass(component);
  const open = new RegExp(`^<div class="${wrapper}(?:\\s[^"]*)?">`);
  for (const path of [html, barrel]) {
    if (!existsSync(path)) {
      problems.push(`${path} does not exist, but ${markupSource} does.`);
      continue;
    }
    const text = readFileSync(path, 'utf8');
    const forms =
      path === html
        ? [text.replace(/^(?:\s*<!--[\s\S]*?-->\s*)+/, '').trim()]
        : [...text.matchAll(/^export const (\w+) = ("(?:[^"\\]|\\.)*");$/gm)].map((m) => JSON.parse(m[2]));
    if (forms.length === 0) {
      problems.push(`${path}: no static form found to check the wrapper on.`);
    }
    for (const form of forms) {
      if (!open.test(form)) {
        problems.push(
          `${path}: a generated static form does not open with \`<div class="${wrapper}">\` — ` +
            `it starts \`${form.slice(0, 60)}…\`. ADR-15 requires TWO elements; a single-element ` +
            'collapse makes the component answer an outer ancestor silently.',
        );
      }
    }
  }
  say(`   ·  sk-${component}: generated markup opens with the \`.${wrapper}\` wrapper.`);
};

// ===========================================================================
// Run the static checks.
// ===========================================================================

say(`static-form equivalence — ${sources.length} component(s) in scope, derived from a host-owned \`container-type\`:`);
const wrapperRules = new Map();
for (const source of sources) {
  const wrapperRule = structuralCheck(source);
  wrapperRules.set(source.component, wrapperRule);
  completenessCheck(source, wrapperRule);
  markupCheck(source);
}

const failStatic = () => {
  if (problems.length === 0) return;
  console.error(`\n❌ ${problems.length} problem(s):`);
  for (const p of problems) console.error(`   ${p}`);
  process.exit(1);
};

if (staticOnly) {
  failStatic();
  say(
    `\n✅ Structural and declaration-set checks pass for ${sources.length} component(s): ` +
      `${sources.map((s) => `sk-${s.component}`).join(', ')}.`,
  );
  say(
    '   This arm establishes the SHAPE of the static form only. The rendered equivalence, and the\n' +
      "   #375 consumer-override table it cannot see, run in the `release-gate` job — see this file's\n" +
      '   header for what each half does and does not certify.',
  );
  process.exit(0);
}

// ===========================================================================
// CHECK 3 — rendered equivalence.
// ===========================================================================

const { chromium, firefox, webkit } = await import('playwright');

const REPO_ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

/** The bytes an INSTALLED consumer links, resolved through Node's own export map. */
const resolvedSpecifiers = {};
const resolveSpecifier = (specifier) => {
  const path = fileURLToPath(import.meta.resolve(specifier));
  resolvedSpecifiers[specifier] = path;
  return path;
};

const pages = new Map();
const sheets = new Map();
let nextId = 0;

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const send = (body, ext) => {
    res.writeHead(200, { 'content-type': MIME[ext] ?? 'text/plain' });
    res.end(body);
  };
  try {
    if (url.pathname.startsWith('/probe/')) return send(pages.get(url.pathname.slice(7)), '.html');
    if (url.pathname.startsWith('/sheet/')) return send(sheets.get(url.pathname.slice(7)), '.css');
    if (url.pathname.startsWith('/pkg/')) {
      const specifier = decodeURIComponent(url.pathname.slice(5));
      const file = resolveSpecifier(specifier);
      return send(readFileSync(file), file.slice(file.lastIndexOf('.')));
    }
    const file = join(REPO_ROOT, decodeURIComponent(url.pathname));
    if (!file.startsWith(REPO_ROOT)) throw new Error('path escape');
    return send(readFileSync(file), file.slice(file.lastIndexOf('.')));
  } catch (error) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end(String(error?.message ?? error));
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

const ELEMENTS_BUNDLE = 'packages/elements/dist/elements.js';
if (!existsSync(ELEMENTS_BUNDLE)) {
  console.error(
    `❌ ${ELEMENTS_BUNDLE} is missing. The shadow side of this comparison is the REAL built ` +
      'element (ADR-10 §2\'s self-contained classic script), not a source import.\n' +
      '   Run: npx nx run-many --target=build --projects=tokens,styles,elements',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// The sheets each side links, derived from the element's own `static styles`.
// ---------------------------------------------------------------------------

/**
 * The stylesheets an element adopts, IN ORDER, as `packages/styles` paths.
 *
 * Derived rather than declared: `sk-copy-field` adopts `[buttonSheet, sheet]` — a FOREIGN sheet
 * first — and a static twin that linked only its own sheet would be missing the `.sk-button`
 * rules its own `@container` block styles. Fails closed: anything this cannot read is an error,
 * never an empty list, because an empty list renders an unstyled twin that diverges everywhere
 * and reads as a real defect.
 */
const adoptedSheetsOf = (component) => {
  const file = `packages/elements/src/${component}/sk-${component}.ts`;
  const source = readFileSync(file, 'utf8');
  const imports = new Map(
    [...source.matchAll(/^import\s+(\w+)\s+from\s+'([^']+)\.css\.js';$/gm)].map(([, id, path]) => [id, path]),
  );
  const styles = /static\s+(?:override\s+)?styles(?:\s*:[^=]+)?\s*=\s*\[([^\]]*)\]/.exec(source);
  if (!styles) throw new Error(`${file}: could not read \`static styles = [...]\``);
  const order = styles[1]
    .split(',')
    .map((s) => s.replace(/\/\/.*$/gm, '').trim())
    .filter(Boolean);
  return order.map((id) => {
    const specifier = imports.get(id);
    if (!specifier) throw new Error(`${file}: \`static styles\` names \`${id}\`, which is not a \`*.css.js\` import`);
    const dir = basename(dirname(join(`packages/elements/src/${component}`, specifier)));
    const found = globSync(`packages/styles/src/${dir}/sk-*.css`, {}).sort((a, b) =>
      basename(a) === `sk-${dir}.css` ? -1 : basename(b) === `sk-${dir}.css` ? 1 : a.localeCompare(b),
    );
    if (found.length === 0) throw new Error(`${file}: \`${id}\` resolves to no sheet under packages/styles/src/${dir}/`);
    return { dir, files: found };
  });
};

/** The `@spec-kitty/styles` specifier a static consumer links for one adopted sheet. */
const staticSpecifierFor = (dir, file) => {
  const staticForm = join(dirname(file), 'static', `${basename(file, '.css')}.static.css`);
  return existsSync(staticForm)
    ? `@spec-kitty/styles/${dir}/static/${basename(staticForm)}`
    : `@spec-kitty/styles/${dir}/${basename(file)}`;
};

// ---------------------------------------------------------------------------
// Page construction.
// ---------------------------------------------------------------------------

const TOKENS = '@spec-kitty/tokens';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const frameFor = (scenario, inner, scope) => {
  const { context, width, outer } = scenario;
  const framed =
    context === 'flex-item'
      ? `<div style="display:flex;width:${width}px">${inner}</div>`
      : context === 'grid-track'
        ? `<div style="display:grid;grid-template-columns:${width}px">${inner}</div>`
        : context === 'composed'
          ? `<div style="container-type:inline-size;width:${outer}px"><div style="width:${width}px">${inner}</div></div>`
          : `<div style="width:${width}px">${inner}</div>`;
  // A `scope` class exists for the override rows that reach the subject through an ancestor —
  // `.page-scope .sk-x-host { … }`. Without the ancestor the rule matches NOTHING and the row
  // measures the sheet against itself, which is a green that means nothing. Both forms get the
  // same wrapper, so the scope never becomes a difference between them.
  return scope ? `<div class="${scope}">${framed}</div>` : framed;
};

const publish = (html) => {
  const id = `p${nextId++}`;
  pages.set(id, html);
  return `${ORIGIN}/probe/${id}`;
};

const publishSheet = (css) => {
  const id = `s${nextId++}`;
  sheets.set(id, css);
  return `${ORIGIN}/sheet/${id}`;
};

const shadowPage = (component, spec, scenario, consumerCss, consumerScope) => {
  const attrs = Object.entries({ ...(spec.attrs ?? {}), ...(scenario.attrs ?? {}) })
    .map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${esc(v)}"`))
    .join('');
  const element = `<${spec.tag}${attrs} id="subject">${spec.light ?? ''}</${spec.tag}>`;
  return publish(`<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="${ORIGIN}/pkg/${encodeURIComponent(TOKENS)}">
<style>html,body{margin:0}</style>
${consumerCss ? `<style>${consumerCss}</style>` : ''}
<script src="${ORIGIN}/${ELEMENTS_BUNDLE}"></script>
${frameFor(scenario, element, consumerScope)}`);
};

/**
 * The static twin: the element's own flattened tree, wrapped, under the generated sheet.
 *
 * `modifiers` are derived from the scenario's host attributes exactly as the generator derives
 * the classes from `:host([attr="value"])` — value where there is one, attribute name where there
 * is not — so a scenario cannot silently exercise a modifier the generator never emits.
 */
const staticPage = (component, spec, scenario, flattened, links, consumerCss, position, consumerScope) => {
  const modifiers = Object.entries({ ...(spec.attrs ?? {}), ...(scenario.attrs ?? {}) })
    .map(([k, v]) => `${hostClass(component)}--${v === '' ? k : v}`)
    .filter((c) => /^sk-[a-z][a-z0-9-]*--[a-z][a-z0-9-]*$/.test(c));
  const wrapper = `<div class="${[hostClass(component), ...modifiers].join(' ')}" id="subject">${flattened}</div>`;
  const consumer = consumerCss ? `<style>${consumerCss}</style>` : '';
  const linkTags = links.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n');
  return publish(`<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="${ORIGIN}/pkg/${encodeURIComponent(TOKENS)}">
<style>html,body{margin:0}</style>
${position === 'before' ? consumer : ''}
${linkTags}
${position === 'before' ? '' : consumer}
${frameFor(scenario, wrapper, consumerScope)}`);
};

// ---------------------------------------------------------------------------
// Measurement.
// ---------------------------------------------------------------------------

/** In-page: the subject's flattened tree, `<slot>`s replaced by their assigned nodes. */
const FLATTEN = `() => {
  const host = document.getElementById('subject');
  const holder = document.createElement('div');
  holder.innerHTML = host.shadowRoot.innerHTML;
  const from = [...host.shadowRoot.querySelectorAll('slot')];
  const to = [...holder.querySelectorAll('slot')];
  for (let i = 0; i < from.length; i += 1) {
    const frag = document.createDocumentFragment();
    for (const node of from[i].assignedNodes({ flatten: true })) frag.append(node.cloneNode(true));
    to[i].replaceWith(frag);
  }
  return holder.innerHTML;
}`;

/** In-page: computed values for the declared observables. `:host` means the subject itself. */
const MEASURE = `(observables) => {
  const subject = document.getElementById('subject');
  const root = subject.shadowRoot ?? subject;
  const out = {};
  for (const { selector, properties } of observables) {
    const node = selector === ':host' ? subject : root.querySelector(selector);
    for (const property of properties) {
      out[selector + '|' + property] = node === null ? '<no such node>' : getComputedStyle(node).getPropertyValue(property);
    }
  }
  return out;
}`;

const engines = [];
for (const [name, launcher] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  try {
    const browser = await launcher.launch();
    engines.push({ name, browser });
  } catch (error) {
    // NAMED, never silently skipped. ADR-10 records WebKit as unlaunchable on this project's
    // workstation ("Host system is missing dependencies to run browsers"); an engine that cannot
    // run has to appear in the output as an engine that did not run, or the count below reads as
    // coverage it does not have.
    const why = String(error?.message ?? error).replace(/\s+/g, ' ').replace(/[\u2500-\u257F]+/g, '').trim().slice(0, 200);
    say(`   ·  ${name}: could not launch — ${why}`);
  }
}
if (engines.length < declared.floors.engines) {
  console.error(`❌ ${engines.length} engine(s) launched, floor is ${declared.floors.engines}. Nothing was compared.`);
  process.exit(1);
}
if (!engines.some((e) => e.name === 'chromium')) {
  console.error('❌ chromium did not launch. It is the engine ADR-15 printed every value in, so a run without it cannot be read against that record.');
  process.exit(1);
}

/**
 * One component measured in one engine, against one static-form variant.
 *
 * `variantSheet` maps a generated static-form path to the CSS actually served, so a mutated form
 * can be rendered without ever touching the working tree. `null` means the committed bytes,
 * resolved through the package's own export map.
 */
async function measureComponent(page, component, spec, variantSheet, consumerRow) {
  const adopted = adoptedSheetsOf(component);
  const links = [];
  for (const { dir, files } of adopted) {
    for (const file of files) {
      const specifier = staticSpecifierFor(dir, file);
      const mutated = variantSheet?.(specifier);
      links.push(mutated === undefined || mutated === null ? `${ORIGIN}/pkg/${encodeURIComponent(specifier)}` : publishSheet(mutated));
    }
  }

  const rows = [];
  const scenarios = consumerRow
    ? spec.scenarios.filter((s) => s.id === consumerRow.scenario)
    : spec.scenarios;
  for (const scenario of scenarios) {
    await page.goto(shadowPage(component, spec, scenario, consumerRow?.shadowCss, consumerRow?.scope));
    await page.waitForFunction('document.getElementById("subject")?.shadowRoot?.childElementCount > 0');
    // `(${FLATTEN})()`, never a bare `page.evaluate(FLATTEN)`. Playwright evaluates a STRING as
    // an expression, so the bare form yields the function object rather than calling it — and
    // what came back was the function's own source text, injected as the twin's markup. Every
    // descendant observable then reported `<no such node>` in the static form and every `:host`
    // observable still passed, which reads exactly like a real defect in the wrapper.
    const flattened = await page.evaluate(`(${FLATTEN})()`);
    const observables = consumerRow
      ? [{ selector: consumerRow.selector, properties: [consumerRow.property] }]
      : spec.observables;
    const shadow = await page.evaluate(`(${MEASURE})(${JSON.stringify(observables)})`);

    await page.goto(staticPage(component, spec, scenario, flattened, links, consumerRow?.staticCss, consumerRow?.position, consumerRow?.scope));
    const statics = await page.evaluate(`(${MEASURE})(${JSON.stringify(observables)})`);

    for (const key of Object.keys(shadow)) {
      rows.push({
        component,
        scenario: scenario.id,
        observable: key,
        shadow: shadow[key],
        static: statics[key],
        equal: shadow[key] === statics[key],
      });
    }
  }
  return rows;
}

/** Run `fn(page, engineName)` once per launched engine. */
const perEngine = async (fn) => {
  const out = {};
  for (const { name, browser } of engines) {
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    const page = await context.newPage();
    try {
      out[name] = await fn(page, name);
    } finally {
      await context.close();
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// The static-form variants: the committed one, and the four this gate must refuse.
// ---------------------------------------------------------------------------

const generatedFor = (specifier) => {
  const match = /^@spec-kitty\/styles\/([^/]+)\/static\/(.+)$/.exec(specifier);
  return match ? `packages/styles/src/${match[1]}/static/${match[2]}` : null;
};

/**
 * ADR-15's VARIANT A — the transform it measured and REJECTED — reproduced here because a gate
 * that has only ever seen the correct form has demonstrated nothing.
 *
 * `.sk-x-host` becomes `.sk-x`, and the descendant `.sk-x` that used to follow it is ABSORBED into
 * the same compound, because in variant A the host and the root are one element. Doing the
 * absorption matters: without it `.sk-x.sk-x--m .sk-x` simply matches nothing, and the probe would
 * go red for a trivial reason instead of for the reason ADR-15 measured — an element is never its
 * own query container.
 *
 * Parsed, never split on `,`: `.sk-app-shell-host:is(.sk-app-shell-host--compact, …)` carries a
 * comma inside a functional pseudo, and a text split cuts it in half.
 */
const collapse = (css, component) => {
  const wrapper = hostClass(component);
  const root = postcss.parse(css);
  root.walkRules((rule) => {
    const parsed = selectorParser().astSync(rule.selector);
    rule.selector = parsed.nodes
      .map((sel) => {
        sel.walkClasses((node) => {
          if (node.value === wrapper) node.value = `sk-${component}`;
          else if (node.value.startsWith(`${wrapper}--`)) node.value = node.value.replace(wrapper, `sk-${component}`);
        });
        // Drop a `.sk-x` compound that follows the (now-merged) host compound — that compound IS
        // the root element, and in variant A the host and the root are the same element. Done by
        // rebuilding the compound list rather than splicing in place: a splice inside a reverse
        // walk moves every index behind it, which is how the first draft of this ran off the end.
        const compounds = [[]];
        for (const node of sel.nodes) {
          if (node.type === 'combinator' && String(node).trim() === '') compounds.push([]);
          else if (node.type === 'combinator') compounds.push([node], []);
          else compounds[compounds.length - 1].push(node);
        }
        const kept = compounds.filter(
          (compound, i) =>
            i === 0 ||
            !(compound.length === 1 && compound[0].type === 'class' && compound[0].value === `sk-${component}`),
        );
        return kept
          .map((compound) => compound.map((n) => String(n).trim()).join(''))
          .filter(Boolean)
          .join(' ')
          .replace(/\s+([>+~])\s+/g, ' $1 ')
          .trim();
      })
      .join(',\n');
  });
  return root.toString();
};

const abbreviate = (css, component) => {
  const root = postcss.parse(css);
  root.walkRules(`.${hostClass(component)}`, (rule) => {
    rule.walkDecls((decl) => {
      if (decl.prop !== 'container-type') decl.remove();
    });
  });
  return root.toString();
};

const asContents = (css, component) => {
  const root = postcss.parse(css);
  root.walkRules(`.${hostClass(component)}`, (rule) => rule.append({ prop: 'display', value: 'contents' }));
  return root.toString();
};

const lowerWeight = (css, component) => {
  const root = postcss.parse(css);
  root.walkRules(`.${hostClass(component)}`, (rule) => {
    rule.selector = `:where(.${hostClass(component)})`;
  });
  return root.toString();
};

const variantMaker = (mutate) => (component) => (specifier) => {
  const path = generatedFor(specifier);
  if (path === null) return null;
  const owner = basename(dirname(dirname(path)));
  if (owner !== component) return null;
  return mutate(readFileSync(path, 'utf8'), component);
};

const VARIANTS = {
  collapsed: variantMaker(collapse),
  abbreviated: variantMaker(abbreviate),
  contents: variantMaker(asContents),
  where: variantMaker(lowerWeight),
};

// ===========================================================================
// The run.
// ===========================================================================

const record = { declaration: DECLARATION, engines: engines.map((e) => e.name), library_only: {}, consumer_overrides: {}, variants: {} };
let totalOutcomes = 0;
let totalScenarios = 0;

const measured = await perEngine(async (page, engine) => {
  const out = { libraryOnly: [], consumerOverrides: [], variants: {} };
  for (const { component } of sources) {
    const spec = declared.components[component];
    if (!spec) continue;
    out.libraryOnly.push(...(await measureComponent(page, component, spec, null, null)));
    if (engine === engines[0].name) totalScenarios += spec.scenarios.length;
  }

  for (const row of declared.consumerOverrides.rows) {
    const spec = declared.components[row.component];
    const [measuredRow] = await measureComponent(page, row.component, spec, null, row);
    out.consumerOverrides.push({ ...row, ...measuredRow });
  }

  if (selftest) {
    for (const [name, make] of Object.entries(VARIANTS)) {
      out.variants[name] = [];
      for (const { component } of sources) {
        const spec = declared.components[component];
        if (!spec) continue;
        out.variants[name].push(...(await measureComponent(page, component, spec, make(component), null)));
      }
      // The #375 candidate is measured on the OVERRIDE table too — that is the table it exists to
      // move, and the library-only table cannot see the difference at all.
      if (name === 'where') {
        out.variants['where-overrides'] = [];
        for (const row of declared.consumerOverrides.rows) {
          const spec = declared.components[row.component];
          const [measuredRow] = await measureComponent(page, row.component, spec, make(row.component), row);
          out.variants['where-overrides'].push({ ...row, ...measuredRow });
        }
      }
    }
  }
  return out;
});

for (const { browser } of engines) await browser.close();
server.close();

// ---------------------------------------------------------------------------
// Verdicts.
// ---------------------------------------------------------------------------

say('');
for (const engine of engines.map((e) => e.name)) {
  const rows = measured[engine].libraryOnly;
  const diverged = rows.filter((r) => !r.equal);
  const missing = rows.filter((r) => r.shadow === '<no such node>' || r.static === '<no such node>');
  totalOutcomes = Math.max(totalOutcomes, rows.length);
  record.library_only[engine] = rows;
  say(`   ${diverged.length === 0 ? '✅' : '❌'} ${engine}: ${rows.length - diverged.length}/${rows.length} library-only outcomes equal`);
  for (const row of diverged.slice(0, 40)) {
    problems.push(
      `[${engine}] ${row.component} ${row.scenario} ${row.observable}: shadow \`${row.shadow}\` vs static \`${row.static}\``,
    );
  }
  if (diverged.length > 40) problems.push(`[${engine}] …and ${diverged.length - 40} more divergences.`);
  // A SELECTOR THAT MATCHES NOTHING compares equal to another selector that matches nothing, so
  // an observable naming a class no longer in the markup would pass silently in BOTH forms — the
  // vacuous-pass shape this repository refuses everywhere else.
  if (missing.length) {
    for (const row of [...new Set(missing.map((r) => `${r.component} ${r.observable}`))]) {
      problems.push(`[${engine}] the observable \`${row}\` matched no node in either form — it is comparing nothing.`);
    }
  }
}

for (const engine of engines.map((e) => e.name)) {
  const rows = measured[engine].consumerOverrides;
  record.consumer_overrides[engine] = rows;
  say(`\n   #375 consumer-override table (${engine}) — pinned by VERDICT, never by equality:`);
  for (const row of rows) {
    const verdict = row.equal ? 'equal' : 'diverge';
    const ok = verdict === row.verdict && (row.shadowValue === '' || row.shadow === row.shadowValue);
    say(
      `   ${ok ? '✅' : '❌'} ${row.id.padEnd(3)} ${verdict.padEnd(8)} ${row.component} ${row.selector}|${row.property}` +
        `  shadow \`${row.shadow}\` / static \`${row.static}\``,
    );
    if (!ok) {
      problems.push(
        `[${engine}] ${row.id}: recorded \`${row.verdict}\`${row.shadowValue ? ` with the element at \`${row.shadowValue}\`` : ''}, ` +
          `measured \`${verdict}\` with shadow \`${row.shadow}\` and static \`${row.static}\`. ${row.note}`,
      );
    }
  }
  // WHERE EACH OVERRIDE SITS RELATIVE TO THE WRAPPER RULE, checked rather than asserted — and
  // the reason it is stated relative to the WRAPPER rather than to the shadow-side spelling is
  // itself the finding. In the shadow form a consumer targets the element, which is a TYPE
  // selector at (0,0,1); there is no document spelling of the wrapper below (0,1,0), because the
  // wrapper is reached by a class. So `the same consumer intent at the same weight` is available
  // for the `display` rows (element vs `div`, both (0,0,1)) and is NOT available for the
  // container rows at all: to so much as TIE the wrapper a consumer has to climb a whole
  // specificity level above what beat the element. That asymmetry is #375 in one line, and it is
  // asserted here so a row cannot quietly stop measuring it.
  for (const row of declared.consumerOverrides.rows) {
    const of = (css) => specificityOf(css.slice(0, css.indexOf('{')).trim());
    // THE BOUNDARY IS READ OFF THE GENERATED SHEET, never assumed to be the wrapper's (0,1,0).
    // `position: sticky` on sk-page-header is emitted by the MODIFIER rule at (0,2,0) while
    // `display` on the same component is emitted by the base wrapper rule at (0,1,0) — so a
    // consumer overriding the first needs a different number from one overriding the second.
    // That is ADR-15's #304 shape ("stated generically rather than by transcribing a number"),
    // applied to the rule actually shipped.
    const generated = `packages/styles/src/${row.component}/static/sk-${row.component}.static.css`;
    let againstRule = null;
    postcss.parse(readFileSync(generated, 'utf8')).walkRules((rule) => {
      if (againstRule === null && rule.selector.replace(/\s+/g, ' ').trim() === row.against) againstRule = rule;
    });
    if (againstRule === null) {
      problems.push(
        `${row.id}: \`${row.against}\` is not a rule in ${generated}. The row's boundary is computed ` +
          'from the rule actually emitted, so a row naming a rule that does not exist measures nothing.',
      );
      continue;
    }
    // The property the CONSUMER sets, which is not always the one the row OBSERVES: H3, H7 and H9
    // override `container-type` on the wrapper and read the consequence one level down, on a
    // descendant the sheet's own `@container` block styles. The boundary belongs to the rule that
    // declares what is being overridden.
    const overridden = /\{\s*([-a-zA-Z]+)\s*:/.exec(row.staticCss)?.[1];
    if (overridden === undefined) {
      problems.push(`${row.id}: could not read a declaration out of \`${row.staticCss}\`.`);
      continue;
    }
    if (!againstRule.some((decl) => decl.prop === overridden)) {
      problems.push(
        `${row.id}: \`${row.against}\` does not declare \`${overridden}\`, so it is not the rule this ` +
          'override competes with.',
      );
      continue;
    }
    const boundary = specificityOf(row.against);
    const staticWeight = of(row.staticCss);
    const relation = ['below', 'tie', 'above'][Math.sign(staticWeight.join('') - boundary.join('')) + 1];
    if (relation !== row.staticWeight) {
      problems.push(
        `${row.id}: \`${row.staticCss}\` weighs (${staticWeight}) against \`${row.against}\`'s ` +
          `(${boundary}) — that is \`${relation}\`, and the row records \`${row.staticWeight}\`. ` +
          'The relation is what the row measures; a row whose weight moved measures a different question.',
      );
    }
    if (row.sameWeightAsShadow && of(row.shadowCss).join() !== staticWeight.join()) {
      problems.push(
        `${row.id} records \`sameWeightAsShadow\`, but \`${row.shadowCss}\` weighs ` +
          `(${of(row.shadowCss)}) and \`${row.staticCss}\` weighs (${staticWeight}).`,
      );
    }
  }
}

if (selftest) {
  say('\n   Red-first probe table — four deliberately broken static forms, run through the same comparison:');
  const EXPECT = {
    collapsed: {
      all: 'reject',
      why: "ADR-15's variant A: `:host` collapsed onto the root class. An element is never its own query container.",
    },
    abbreviated: {
      all: null,
      why: 'the wrapper cut to `container-type` alone. #310 says explicitly this must NOT be hardcoded as a rejection: sk-action-row\'s `:host` declares no `width`, so nothing is lost and it passes the RENDERED comparison — check 2 is what refuses it, for every component, by reading the component\'s own `:host`.',
    },
    contents: {
      all: 'reject',
      why: '`display: contents` on the wrapper. ADR-15 stated this from the specification and did not probe it; it is a measured red probe here.',
    },
    where: {
      all: null,
      why: "#375's `:where(.sk-<name>-host)` candidate, MEASURED rather than argued. Expected to leave the library-only table untouched (it competes with nothing in this library) and to move the override table.",
    },
  };
  for (const [name, expectation] of Object.entries(EXPECT)) {
    for (const engine of engines.map((e) => e.name)) {
      const rows = measured[engine].variants[name] ?? [];
      record.variants[`${name}:${engine}`] = rows;
      const byComponent = new Map();
      for (const row of rows) {
        if (!byComponent.has(row.component)) byComponent.set(row.component, { total: 0, diverged: 0, first: null });
        const bucket = byComponent.get(row.component);
        bucket.total += 1;
        if (!row.equal) {
          bucket.diverged += 1;
          bucket.first ??= row;
        }
      }
      for (const [component, bucket] of byComponent) {
        const got = bucket.diverged > 0 ? 'reject' : 'accept';
        const ok = expectation.all === null || got === expectation.all;
        say(
          `   ${ok ? '✅' : '❌'} ${name.padEnd(12)} ${engine.padEnd(8)} sk-${component.padEnd(12)} ${got}` +
            ` (${bucket.diverged}/${bucket.total} outcomes diverge` +
            (bucket.first ? `; e.g. ${bucket.first.scenario} ${bucket.first.observable}: \`${bucket.first.shadow}\` vs \`${bucket.first.static}\`` : '') +
            ')',
        );
        if (!ok) {
          problems.push(
            `red-first probe \`${name}\` on sk-${component} in ${engine} was ${got}, recorded ${expectation.all}. ${expectation.why}`,
          );
        }
      }
      if (byComponent.size === 0) {
        problems.push(`red-first probe \`${name}\` produced no rows in ${engine} — it compared nothing.`);
      }
    }
    say(`      ${expectation.why}`);
  }

  say('\n   The #375 candidate against the override table — the measurement #375 asks for:');
  for (const engine of engines.map((e) => e.name)) {
    for (const row of measured[engine].variants['where-overrides'] ?? []) {
      const verdict = row.equal ? 'equal' : 'diverge';
      say(
        `      ${engine.padEnd(8)} ${row.id.padEnd(3)} ${row.component} ${row.selector}|${row.property}: ` +
          `${verdict} (recorded for the emitted wrapper: ${row.verdict})  shadow \`${row.shadow}\` / :where() static \`${row.static}\``,
      );
    }
  }
  say(
    '\n      This is a MEASUREMENT, not an adoption. Lowering the wrapper to (0,0,0) restores the\n' +
      '      element\'s deference to the page for the overrides above and hands it to every other\n' +
      '      document rule too, including a consumer reset. #375 owns the decision; this gate\n' +
      '      supplies the number it asked for and pins the emitted wrapper\'s behaviour meanwhile.',
  );

  // Check 2 must refuse the abbreviated wrapper for EVERY component, including the one the
  // rendered comparison accepts. Driven here rather than asserted, because that pair — accepted
  // by check 3, refused by check 2 — is the entire reason check 2 exists as its own check.
  say('\n   Check 2 against the same abbreviated wrapper (the check the rendered comparison cannot replace):');
  for (const { file, component } of sources) {
    const path = `packages/styles/src/${component}/static/sk-${component}.static.css`;
    const mutated = postcss.parse(abbreviate(readFileSync(path, 'utf8'), component));
    let rule = null;
    mutated.walkRules(`.${hostClass(component)}`, (r) => {
      rule ??= r;
    });
    const authored = declarationSet(authoredHostRule(file));
    const emitted = declarationSet(rule);
    const refused = authored.some((d) => !emitted.includes(d));
    say(`   ${refused ? '✅' : '❌'} abbreviated  sk-${component.padEnd(12)} refused by check 2 (missing ${authored.filter((d) => !emitted.includes(d)).join('; ') || 'nothing'})`);
    if (!refused) {
      problems.push(
        `check 2 does not refuse an abbreviated wrapper for sk-${component} — its \`:host\` set is ` +
          'reproduced by `container-type` alone, which cannot be true unless the sheet declares nothing else.',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Floors.
// ---------------------------------------------------------------------------

if (totalScenarios < declared.floors.scenarios) {
  problems.push(`${totalScenarios} scenarios ran, floor is ${declared.floors.scenarios}.`);
}
if (totalOutcomes < declared.floors.outcomes) {
  problems.push(`${totalOutcomes} outcomes compared per engine, floor is ${declared.floors.outcomes}.`);
}
if (declared.consumerOverrides.rows.length < declared.floors.consumerOverrides) {
  problems.push(
    `${declared.consumerOverrides.rows.length} consumer-override rows, floor is ${declared.floors.consumerOverrides}. ` +
      'That table is the only thing in this gate that can see #375; shrinking it makes the ' +
      'equality claim above read as wider than it is.',
  );
}

if (recordAt) {
  writeFileSync(recordAt, `${JSON.stringify({ ...record, resolvedSpecifiers }, null, 2)}\n`);
  say(`\n   Full measured table written to ${recordAt}`);
}

failStatic();

say(
  `\n✅ ${totalOutcomes} library-only outcomes per engine across ${totalScenarios} scenarios and ` +
    `${sources.length} components are EQUAL between the shadow form and the generated static form, in ` +
    `${engines.map((e) => e.name).join(' and ')}.`,
);
say(
  `   ${declared.consumerOverrides.rows.length} consumer-override outcomes behaved as recorded — ` +
    'and the recorded behaviour includes divergence. See this file\'s header, and #375: the wrapper\n' +
    '   reproduces `:host`\'s LAYOUT and HARDENS its cascade position. This gate does not establish\n' +
    '   cascade equivalence and does not claim to.',
);
