#!/usr/bin/env node
// FR-008 probe — construct kind 3: `::slotted()` child rule (sk-entity-marker's ::slotted(img)).
//
//   node kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/slotted-child-rule/run.mjs
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { startServer, perEngine, measurementUrl, diffOutcomes, resolvePackageSpecifier } from '../harness.mjs';

const CONSTRUCT = 'slotted-child-rule';
const HERE = new URL('.', import.meta.url).pathname;
const declared = JSON.parse(readFileSync(join(HERE, 'outcomes.declared.json'), 'utf8'));

const CASES = { C1: 'competing=none', C2: 'competing=equal', C3: 'competing=higher' };

const READS = {
  O1: ['C1', 'display'],
  O2: ['C1', 'inline-size'],
  O3: ['C1', 'block-size'],
  O4: ['C1', 'object-fit'],
  O5: ['C2', 'object-fit'],
  O6: ['C3', 'object-fit'],
};

const readImg = (prop) =>
  getComputedStyle(document.getElementById('probe-img')).getPropertyValue(prop).trim();

const settle = async (page, isShadow) => {
  if (isShadow) {
    await page.waitForFunction(() => !!document.getElementById('component')?.shadowRoot);
    await page.evaluate(async () => {
      await customElements.whenDefined('sk-entity-marker');
      await document.getElementById('component').updateComplete;
    });
  }
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

const collect = async (page, origin, file, extraQuery, isShadow) => {
  const values = {};
  for (const [caseId, query] of Object.entries(CASES)) {
    await page.goto(`${measurementUrl(origin, CONSTRUCT, file)}?${query}${extraQuery}`);
    await settle(page, isShadow);
    for (const [id, [c, prop]] of Object.entries(READS)) {
      if (c !== caseId) continue;
      values[id] = await page.evaluate(readImg, prop);
    }
  }
  return values;
};

// Supplementary: does the repository's PAIRED selector list survive in a shadow tree?
// The #143 hazard is that one invalid selector invalidates a whole comma list. sk-blog-card,
// sk-feature-card, sk-ribbon-card and sk-site-footer all bet on it not being invalid.
// Adopt a sheet spelling the pair into the real element's shadow root and see whether the
// slotted node picks the declaration up.
const pairedListValidity = async (page, origin) => {
  await page.goto(`${measurementUrl(origin, CONSTRUCT, 'shadow.html')}?competing=none`);
  await settle(page, true);
  return page.evaluate(() => {
    const host = document.getElementById('component');
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(
      '.sk-entity-marker__content > img, ::slotted(img) { outline-color: rgb(1, 2, 3); }',
    );
    host.shadowRoot.adoptedStyleSheets = [...host.shadowRoot.adoptedStyleSheets, sheet];
    const img = document.getElementById('probe-img');
    return {
      paired_list_rule_count: sheet.cssRules.length,
      paired_list_selector_text: sheet.cssRules[0]?.selectorText ?? null,
      slotted_node_picks_it_up:
        getComputedStyle(img).getPropertyValue('outline-color').trim() === 'rgb(1, 2, 3)',
    };
  });
};

const crossCheck = async (page, origin) => {
  await page.goto(
    `${origin}/apps/storybook/storybook-static/iframe.html?id=elements-skentitymarker--image-naming&viewMode=story`,
  );
  await page.waitForFunction(() => !!document.querySelector('sk-entity-marker')?.shadowRoot);
  await page.evaluate(async () => {
    await customElements.whenDefined('sk-entity-marker');
    await document.querySelector('sk-entity-marker').updateComplete;
  });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const story = await page.evaluate(() => {
    const img = document.querySelector('sk-entity-marker img');
    const cs = getComputedStyle(img);
    return {
      display: cs.display,
      inline_size: cs.getPropertyValue('inline-size').trim(),
      block_size: cs.getPropertyValue('block-size').trim(),
      object_fit: cs.objectFit,
    };
  });
  await page.goto(`${measurementUrl(origin, CONSTRUCT, 'shadow.html')}?competing=none`);
  await settle(page, true);
  const controlled = await page.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('probe-img'));
    return {
      display: cs.display,
      inline_size: cs.getPropertyValue('inline-size').trim(),
      block_size: cs.getPropertyValue('block-size').trim(),
      object_fit: cs.objectFit,
    };
  });
  return {
    story_id: 'elements-skentitymarker--image-naming',
    story,
    controlled_shadow_page: controlled,
    faithful: JSON.stringify(story) === JSON.stringify(controlled),
  };
};

const server = await startServer();
try {
  const perEngineResults = await perEngine(async (page) => {
    const shadow = await collect(page, server.origin, 'shadow.html', '', true);
    const varA = await collect(page, server.origin, 'exemplar.html', '&variant=A', false);
    const varB = await collect(page, server.origin, 'exemplar.html', '&variant=B', false);
    return {
      paired_list_validity_in_shadow_tree: await pairedListValidity(page, server.origin),
      fidelity_crosscheck: await crossCheck(page, server.origin),
      observed_outcomes: diffOutcomes(declared.declared_outcomes, shadow, {
        'A-descendant': varA,
        'B-paired-spelling': varB,
      }),
    };
  });

  const engines = Object.keys(perEngineResults);
  const variantPasses = {};
  const failures = {};
  for (const variant of ['A-descendant', 'B-paired-spelling']) {
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
    component: 'sk-entity-marker',
    generated_at: new Date().toISOString(),
    train_ref_note:
      'Run on mission/static-form-of-element-backed-css, branched from train/elements-first@2b59c8c.',
    shadow_form_source:
      'packages/elements/src/entity-marker/sk-entity-marker.ts, rendered from the Storybook build via shadow.html, cross-checked against Storybook story elements-skentitymarker--image-naming',
    static_exemplar_source:
      'kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/slotted-child-rule/exemplar.html (throwaway; links the export-map-resolved built CSS)',
    real_package_consumption: {
      specifier: '@spec-kitty/styles/entity-marker/sk-entity-marker.css',
      resolved_to: resolvePackageSpecifier('@spec-kitty/styles/entity-marker/sk-entity-marker.css'),
      how: "Node's own export-map resolution via import.meta.resolve, served to the browser by harness.mjs on /pkg/<specifier>",
    },
    engines,
    per_engine: perEngineResults,
    variant_passes_every_declared_outcome: variantPasses,
    declared_outcome_failures: failures,
    composed_case_tested: false,
    composed_case_note:
      'No composed/nested-container case applies: this sheet declares no container-type. The contract asks instead for the cascade/specificity observation, captured as declared outcomes O5 and O6.',
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
