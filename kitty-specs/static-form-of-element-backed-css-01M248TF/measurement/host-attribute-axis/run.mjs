#!/usr/bin/env node
// FR-008 probe — construct kind 1: host-attribute variant axis inside a host-owned @container.
//
// Compares the REAL <sk-app-shell> (Storybook-built element bundle, its own adopted sheet)
// against two static exemplars built on the SAME built CSS file, resolved through the
// @spec-kitty/styles export map. Outcomes were pre-declared in outcomes.declared.json in an
// earlier commit; this script only fills in values and applies the declared pass bar.
//
//   node kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/host-attribute-axis/run.mjs
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { startServer, perEngine, measurementUrl, diffOutcomes, resolvePackageSpecifier } from '../harness.mjs';

const CONSTRUCT = 'host-attribute-axis';
const HERE = new URL('.', import.meta.url).pathname;
const declared = JSON.parse(readFileSync(join(HERE, 'outcomes.declared.json'), 'utf8'));

const CASES = {
  S1: 'presentation=compact&width=800&compose=none',
  S2: 'presentation=compact&width=900&compose=none',
  S3: 'presentation=rail-preserving&width=1000&compose=none',
  S4: 'presentation=rail-preserving&width=1200&compose=none',
  S5: 'presentation=compact&width=800&compose=wider&outer=1400',
  S6: 'presentation=compact&width=1200&compose=narrower&outer=500',
};

// outcome id -> [case, selector, property]
const READS = {
  O1: ['S1', '.sk-app-shell', 'grid-template-columns'],
  O2: ['S2', '.sk-app-shell', 'grid-template-columns'],
  O3: ['S1', '.sk-app-shell__compact-header', 'display'],
  O4: ['S2', '.sk-app-shell__compact-header', 'display'],
  O5: ['S1', '.sk-app-shell__compact-navigation', 'display'],
  O6: ['S1', '.sk-app-shell__personal', 'display'],
  O7: ['S3', '.sk-app-shell', 'grid-template-columns'],
  O8: ['S4', '.sk-app-shell', 'grid-template-columns'],
  O9: ['S3', '.sk-app-shell__compact-header', 'display'],
  O10: ['S3', '.sk-app-shell__context', 'display'],
  O11: ['S5', '.sk-app-shell', 'grid-template-columns'],
  O12: ['S5', '.sk-app-shell__compact-header', 'display'],
  O13: ['S6', '.sk-app-shell', 'grid-template-columns'],
  O14: ['S6', '.sk-app-shell__compact-header', 'display'],
};

const readInPage = ([sel, prop]) => {
  const c = document.getElementById('component');
  const scope = c.shadowRoot ?? c;
  const el = scope.matches?.(sel) ? scope : scope.querySelector(sel);
  if (!el) return `MISSING(${sel})`;
  return getComputedStyle(el).getPropertyValue(prop).trim();
};

const shellWidthInPage = () => {
  const c = document.getElementById('component');
  const scope = c.shadowRoot ?? c;
  const el = scope.matches?.('.sk-app-shell') ? scope : scope.querySelector('.sk-app-shell');
  return Math.round(el.getBoundingClientRect().width);
};

const settle = async (page, isShadow) => {
  if (isShadow) {
    await page.waitForFunction(() => !!document.getElementById('component')?.shadowRoot);
    await page.evaluate(async () => {
      await customElements.whenDefined('sk-app-shell');
      await document.getElementById('component').updateComplete;
    });
  }
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

const collect = async (page, origin, file, extraQuery, isShadow) => {
  const values = {};
  const widths = {};
  const notes = {};
  for (const [caseId, query] of Object.entries(CASES)) {
    await page.goto(`${measurementUrl(origin, CONSTRUCT, file)}?${query}${extraQuery}`);
    await settle(page, isShadow);
    widths[caseId] = await page.evaluate(shellWidthInPage);
    if (isShadow) {
      notes[caseId] = await page.evaluate(() => {
        const nav = document
          .getElementById('component')
          .shadowRoot.querySelector('.sk-app-shell__compact-navigation');
        return { compact_navigation_hidden_attr: nav.hasAttribute('hidden') };
      });
    }
    for (const [id, [c, sel, prop]] of Object.entries(READS)) {
      if (c !== caseId) continue;
      values[id] = await page.evaluate(readInPage, [sel, prop]);
    }
  }
  return { values, widths, notes };
};

// Fidelity cross-check: is the controlled shadow page the same thing the shipped Storybook
// harness renders? Measure the real story, then re-measure the controlled page at the story's
// own shell width.
const crossCheck = async (page, origin) => {
  await page.goto(
    `${origin}/apps/storybook/storybook-static/iframe.html?id=elements-skappshell--compact-860&viewMode=story`,
  );
  await page.waitForFunction(() => !!document.querySelector('sk-app-shell')?.shadowRoot);
  await page.evaluate(async () => {
    await customElements.whenDefined('sk-app-shell');
    await document.querySelector('sk-app-shell').updateComplete;
  });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const story = await page.evaluate(() => {
    const host = document.querySelector('sk-app-shell');
    const root = host.shadowRoot;
    const cs = (sel, prop) => getComputedStyle(root.querySelector(sel)).getPropertyValue(prop).trim();
    return {
      shell_width: Math.round(root.querySelector('.sk-app-shell').getBoundingClientRect().width),
      host_presentation: host.getAttribute('presentation'),
      grid_template_columns: cs('.sk-app-shell', 'grid-template-columns'),
      compact_header_display: cs('.sk-app-shell__compact-header', 'display'),
    };
  });

  await page.goto(
    `${measurementUrl(origin, CONSTRUCT, 'shadow.html')}?presentation=${story.host_presentation}&width=${story.shell_width}&compose=none`,
  );
  await settle(page, true);
  const controlled = await page.evaluate(() => {
    const root = document.getElementById('component').shadowRoot;
    const cs = (sel, prop) => getComputedStyle(root.querySelector(sel)).getPropertyValue(prop).trim();
    return {
      shell_width: Math.round(root.querySelector('.sk-app-shell').getBoundingClientRect().width),
      grid_template_columns: cs('.sk-app-shell', 'grid-template-columns'),
      compact_header_display: cs('.sk-app-shell__compact-header', 'display'),
    };
  });
  return {
    story_id: 'elements-skappshell--compact-860',
    story,
    controlled_shadow_page: controlled,
    faithful:
      story.grid_template_columns === controlled.grid_template_columns &&
      story.compact_header_display === controlled.compact_header_display,
  };
};

const server = await startServer();
try {
  const perEngineResults = await perEngine(async (page) => {
    const shadow = await collect(page, server.origin, 'shadow.html', '', true);
    const varA = await collect(page, server.origin, 'exemplar.html', '&variant=A', false);
    const varB = await collect(page, server.origin, 'exemplar.html', '&variant=B', false);
    const fidelity = await crossCheck(page, server.origin);
    return {
      widths: { shadow: shadow.widths, 'A-collapsed': varA.widths, 'B-wrapper': varB.widths },
      shadow_notes: shadow.notes,
      fidelity_crosscheck: fidelity,
      observed_outcomes: diffOutcomes(declared.declared_outcomes, shadow.values, {
        'A-collapsed': varA.values,
        'B-wrapper': varB.values,
      }),
    };
  });

  const engines = Object.keys(perEngineResults);
  const variantPasses = {};
  for (const variant of ['A-collapsed', 'B-wrapper']) {
    variantPasses[variant] = engines.every((e) =>
      perEngineResults[e].observed_outcomes.every((row) => row.equal[variant] === true),
    );
  }
  const passingVariant = Object.entries(variantPasses).find(([, ok]) => ok)?.[0] ?? null;

  const failures = {};
  for (const variant of ['A-collapsed', 'B-wrapper']) {
    failures[variant] = engines.flatMap((e) =>
      perEngineResults[e].observed_outcomes
        .filter((row) => row.equal[variant] !== true)
        .map((row) => ({
          engine: e,
          id: row.id,
          description: row.description,
          viewport_or_state: row.viewport_or_state,
          shadow_form_value: row.shadow_form_value,
          static_exemplar_value: row.static_exemplar_value[variant],
        })),
    );
  }

  const result = {
    construct_kind: CONSTRUCT,
    component: 'sk-app-shell',
    generated_at: new Date().toISOString(),
    train_ref_note:
      'Run on mission/static-form-of-element-backed-css, branched from train/elements-first@2b59c8c.',
    shadow_form_source:
      'packages/elements/src/app-shell/sk-app-shell.ts, rendered from the Storybook build (apps/storybook/storybook-static/elements-dist/elements.js) via shadow.html, cross-checked against Storybook story elements-skappshell--compact-860',
    static_exemplar_source:
      'kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/host-attribute-axis/exemplar.html (throwaway; links the export-map-resolved built CSS)',
    real_package_consumption: {
      specifier: '@spec-kitty/styles/app-shell/sk-app-shell.css',
      resolved_to: resolvePackageSpecifier('@spec-kitty/styles/app-shell/sk-app-shell.css'),
      how: "Node's own export-map resolution via import.meta.resolve, served to the browser by harness.mjs on /pkg/<specifier>",
    },
    engines,
    per_engine: perEngineResults,
    variant_passes_every_declared_outcome: variantPasses,
    declared_outcome_failures: failures,
    composed_case_tested: true,
    verdict_for_this_construct_kind: passingVariant ? 'generated-static-form' : 'shadow-only',
    passing_static_exemplar_variant: passingVariant,
  };
  writeFileSync(join(HERE, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(`verdict: ${result.verdict_for_this_construct_kind} (variant: ${passingVariant})`);
  for (const [v, ok] of Object.entries(variantPasses)) {
    console.log(`  ${v}: ${ok ? 'ALL DECLARED OUTCOMES EQUAL' : `${failures[v].length} failing outcome-engine pairs`}`);
  }
} finally {
  await server.close();
}
