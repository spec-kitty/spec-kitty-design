#!/usr/bin/env node
// FR-008 probe — construct kind 2: host-owned `container-type` (sk-action-row's 400px reflow).
//
//   node kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/host-container-type/run.mjs
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { startServer, perEngine, measurementUrl, diffOutcomes, resolvePackageSpecifier } from '../harness.mjs';

const CONSTRUCT = 'host-container-type';
const HERE = new URL('.', import.meta.url).pathname;
const declaredCycle1 = JSON.parse(readFileSync(join(HERE, 'outcomes.declared.json'), 'utf8'));
const declaredCycle2 = JSON.parse(readFileSync(join(HERE, 'outcomes.declared.cycle-2.json'), 'utf8'));
const declaredOutcomes = [...declaredCycle1.declared_outcomes, ...declaredCycle2.declared_outcomes];

const CASES = {
  S1: 'width=360&compose=none',
  S2: 'width=500&compose=none',
  S3: 'width=360&compose=wider&outer=1200',
  S4: 'width=700&compose=narrower&outer=320',
  // cycle 2 — HIGH-1: the layouts that discriminate the wrapper's declaration set.
  S5: 'layout=flex',
  S6: 'layout=grid',
  // cycle 2 — MEDIUM-2: the inclusive 400px boundary itself, which 360/500 straddle but
  // never touch. `@container (max-width: 400px)` must fire AT 400 and not at 401.
  S7: 'width=400&compose=none',
  S8: 'width=401&compose=none',
};

const READS = {
  O1: ['S1', '.sk-action-row', 'flex-wrap'],
  O2: ['S2', '.sk-action-row', 'flex-wrap'],
  O3: ['S1', '.sk-action-row__trigger', 'grid-template-columns'],
  O4: ['S2', '.sk-action-row__trigger', 'grid-template-columns'],
  O5: ['S1', '.sk-action-row__trigger', 'grid-template-areas'],
  O6: ['S2', '.sk-action-row__trigger', 'grid-template-areas'],
  O7: ['S1', '.sk-action-row__metadata', 'justify-self'],
  O8: ['S2', '.sk-action-row__metadata', 'justify-self'],
  O9: ['S1', '.sk-action-row__controls', 'width'],
  O10: ['S3', '.sk-action-row', 'flex-wrap'],
  O11: ['S3', '.sk-action-row__trigger', 'grid-template-areas'],
  O12: ['S4', '.sk-action-row', 'flex-wrap'],
  O13: ['S4', '.sk-action-row__trigger', 'grid-template-areas'],
  O14: ['S5', '.sk-action-row', 'width'],
  O15: ['S5', '.sk-action-row__trigger', 'grid-template-areas'],
  O16: ['S6', '.sk-action-row', 'width'],
  O17: ['S7', '.sk-action-row', 'flex-wrap'],
  O18: ['S7', '.sk-action-row__trigger', 'grid-template-areas'],
  O19: ['S8', '.sk-action-row', 'flex-wrap'],
  O20: ['S8', '.sk-action-row__trigger', 'grid-template-areas'],
};

const VARIANTS = { 'A-collapsed': 'A', 'B-wrapper': 'B', 'B-abbrev': 'Babbrev' };

const readInPage = ([sel, prop]) => {
  const c = document.getElementById('component');
  const scope = c.shadowRoot ?? c;
  const el = scope.matches?.(sel) ? scope : scope.querySelector(sel);
  if (!el) return `MISSING(${sel})`;
  return getComputedStyle(el).getPropertyValue(prop).trim();
};

const shapeInPage = () => {
  const c = document.getElementById('component');
  const scope = c.shadowRoot ?? c;
  const row = scope.matches?.('.sk-action-row') ? scope : scope.querySelector('.sk-action-row');
  const trigger = scope.querySelector('.sk-action-row__trigger');
  return {
    row_width: Math.round(row.getBoundingClientRect().width),
    trigger_tag: trigger.tagName.toLowerCase(),
    hidden_projection_wrappers: [...scope.querySelectorAll('[class*="sk-action-row__"]')]
      .filter((el) => el.hasAttribute('hidden'))
      .map((el) => el.className),
  };
};

const settle = async (page, isShadow) => {
  if (isShadow) {
    await page.waitForFunction(() => !!document.getElementById('component')?.shadowRoot);
    await page.evaluate(async () => {
      await customElements.whenDefined('sk-action-row');
      await document.getElementById('component').updateComplete;
    });
  }
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

const collect = async (page, origin, file, extraQuery, isShadow) => {
  const values = {};
  const shape = {};
  for (const [caseId, query] of Object.entries(CASES)) {
    await page.goto(`${measurementUrl(origin, CONSTRUCT, file)}?${query}${extraQuery}`);
    await settle(page, isShadow);
    shape[caseId] = await page.evaluate(shapeInPage);
    for (const [id, [c, sel, prop]] of Object.entries(READS)) {
      if (c !== caseId) continue;
      values[id] = await page.evaluate(readInPage, [sel, prop]);
    }
  }
  return { values, shape };
};

const crossCheck = async (page, origin) => {
  await page.goto(
    `${origin}/apps/storybook/storybook-static/iframe.html?id=elements-skactionrow--default&viewMode=story`,
  );
  await page.waitForFunction(() => !!document.querySelector('sk-action-row')?.shadowRoot);
  await page.evaluate(async () => {
    await customElements.whenDefined('sk-action-row');
    await document.querySelector('sk-action-row').updateComplete;
  });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const story = await page.evaluate(() => {
    const root = document.querySelector('sk-action-row').shadowRoot;
    const cs = (sel, prop) => getComputedStyle(root.querySelector(sel)).getPropertyValue(prop).trim();
    return {
      row_width: Math.round(root.querySelector('.sk-action-row').getBoundingClientRect().width),
      flex_wrap: cs('.sk-action-row', 'flex-wrap'),
      trigger_grid_template_areas: cs('.sk-action-row__trigger', 'grid-template-areas'),
    };
  });
  await page.goto(`${measurementUrl(origin, CONSTRUCT, 'shadow.html')}?width=${story.row_width}&compose=none`);
  await settle(page, true);
  const controlled = await page.evaluate(() => {
    const root = document.getElementById('component').shadowRoot;
    const cs = (sel, prop) => getComputedStyle(root.querySelector(sel)).getPropertyValue(prop).trim();
    return {
      row_width: Math.round(root.querySelector('.sk-action-row').getBoundingClientRect().width),
      flex_wrap: cs('.sk-action-row', 'flex-wrap'),
      trigger_grid_template_areas: cs('.sk-action-row__trigger', 'grid-template-areas'),
    };
  });
  return {
    story_id: 'elements-skactionrow--default',
    story,
    controlled_shadow_page: controlled,
    faithful:
      story.flex_wrap === controlled.flex_wrap &&
      story.trigger_grid_template_areas === controlled.trigger_grid_template_areas,
  };
};

const server = await startServer();
try {
  const perEngineResults = await perEngine(async (page) => {
    const shadow = await collect(page, server.origin, 'shadow.html', '', true);
    const statics = {};
    const shapes = { shadow: shadow.shape };
    for (const [label, param] of Object.entries(VARIANTS)) {
      const run = await collect(page, server.origin, 'exemplar.html', `&variant=${param}`, false);
      statics[label] = run.values;
      shapes[label] = run.shape;
    }
    const fidelity = await crossCheck(page, server.origin);
    return {
      rendered_shape: shapes,
      fidelity_crosscheck: fidelity,
      observed_outcomes: diffOutcomes(declaredOutcomes, shadow.values, statics),
    };
  });

  const engines = Object.keys(perEngineResults);
  const variantPasses = {};
  const failures = {};
  for (const variant of Object.keys(VARIANTS)) {
    variantPasses[variant] = engines.every((e) =>
      perEngineResults[e].observed_outcomes.every((row) => row.equal[variant] === true),
    );
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
  const passingVariant = Object.entries(variantPasses).find(([, ok]) => ok)?.[0] ?? null;

  const result = {
    construct_kind: CONSTRUCT,
    component: 'sk-action-row',
    generated_at: new Date().toISOString(),
    train_ref_note:
      'Run on mission/static-form-of-element-backed-css, branched from train/elements-first@2b59c8c.',
    shadow_form_source:
      'packages/elements/src/action-row/sk-action-row.ts, rendered from the Storybook build via shadow.html, cross-checked against Storybook story elements-skactionrow--default',
    static_exemplar_source:
      'kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/host-container-type/exemplar.html (throwaway; links the export-map-resolved built CSS)',
    real_package_consumption: {
      specifier: '@spec-kitty/styles/action-row/sk-action-row.css',
      resolved_to: resolvePackageSpecifier('@spec-kitty/styles/action-row/sk-action-row.css'),
      how: "Node's own export-map resolution via import.meta.resolve, served to the browser by harness.mjs on /pkg/<specifier>",
    },
    declared_outcome_sources: ['outcomes.declared.json', 'outcomes.declared.cycle-2.json'],
    declared_outcome_count: declaredOutcomes.length,
    static_exemplar_variants: VARIANTS,
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
