import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_FAMILIES = Object.freeze([
  'action-row',
  'app-shell',
  'button',
  'card',
  'context-sidebar',
  'data-table',
  'disclosure',
  'empty-state',
  'event-timeline',
  'facts',
  'form-select',
  'metric',
  'nav-pill',
  'notice',
  'page-header',
  'personal-rail',
  'pill-tag',
  'progress',
  'segmented-choice',
  'status-indicator',
  'workflow-board',
  'workflow-lane',
]);

// This list is deliberately independent of the contract's Storybook inventory. Removing a
// required state and its story together must still leave a detectable gap.
export const REQUIRED_STATES = Object.freeze({
  'action-row': ['default-dark', 'light-mode', 'responsive-narrow', 'hover', 'focus', 'active', 'selected'],
  'app-shell': ['default-dark', 'light-mode', 'responsive-narrow', 'focus', 'compact-open', 'compact-closed'],
  button: ['default-dark', 'light-mode', 'responsive-narrow', 'hover', 'focus', 'active', 'disabled'],
  card: ['default-dark', 'light-mode', 'responsive-narrow', 'hover'],
  'context-sidebar': ['default-dark', 'light-mode', 'responsive-narrow'],
  'data-table': ['default-dark', 'light-mode', 'responsive-narrow', 'hover', 'focus', 'sticky-header'],
  disclosure: ['default-dark', 'light-mode', 'responsive-narrow', 'focus', 'open'],
  'empty-state': ['default-dark', 'light-mode', 'responsive-narrow', 'with-action', 'without-action'],
  'event-timeline': ['default-dark', 'light-mode', 'responsive-narrow', 'compact'],
  facts: ['default-dark', 'light-mode', 'responsive-narrow', 'compact'],
  'form-select': ['default-dark', 'light-mode', 'responsive-narrow', 'focus', 'disabled', 'invalid'],
  metric: ['default-dark', 'light-mode', 'responsive-narrow', 'compact'],
  'nav-pill': ['default-dark', 'light-mode', 'responsive-narrow', 'hover', 'focus', 'active'],
  notice: ['default-dark', 'light-mode', 'responsive-narrow', 'focus', 'dismissible'],
  'page-header': ['default-dark', 'light-mode', 'responsive-narrow', 'compact', 'sticky'],
  'personal-rail': ['default-dark', 'light-mode', 'responsive-narrow'],
  'pill-tag': ['default-dark', 'light-mode', 'responsive-narrow', 'variants'],
  progress: ['default-dark', 'light-mode', 'responsive-narrow', 'indeterminate'],
  'segmented-choice': ['default-dark', 'light-mode', 'responsive-narrow', 'hover', 'focus', 'active', 'disabled', 'selected'],
  'status-indicator': ['default-dark', 'light-mode', 'responsive-narrow', 'all-tones', 'pulsing'],
  'workflow-board': ['default-dark', 'light-mode', 'responsive-narrow', 'focus', 'empty'],
  'workflow-lane': ['default-dark', 'light-mode', 'responsive-narrow', 'empty'],
});

const INTERACTION_AXES = ['hover', 'focus', 'active', 'disabled'];
const EXPECTED_FORMS = Object.freeze({
  'action-row': 'element-backed',
  'app-shell': 'element-backed',
  button: 'element-backed',
  card: 'element-backed',
  'context-sidebar': 'element-backed',
  'data-table': 'styles-only',
  disclosure: 'styles-only',
  'empty-state': 'styles-only',
  'event-timeline': 'styles-only',
  facts: 'styles-only',
  'form-select': 'styles-only',
  metric: 'element-backed',
  'nav-pill': 'element-backed',
  notice: 'element-backed',
  'page-header': 'element-backed',
  'personal-rail': 'element-backed',
  'pill-tag': 'element-backed',
  progress: 'styles-only',
  'segmented-choice': 'styles-only',
  'status-indicator': 'element-backed',
  'workflow-board': 'styles-only',
  'workflow-lane': 'styles-only',
});
const EXPECTED_VISUAL_SPEC = 'apps/storybook/src/tests/visual.spec.ts';
const EXPECTED_SNAPSHOT_DIR = 'apps/storybook/src/tests/visual.spec.ts-snapshots';
const EXPECTED_TOKEN_CSS = 'packages/tokens/src/tokens.css';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function storyPart(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function storyIdFor(title, exportName) {
  const storyName = String(exportName)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/([A-Za-z])([0-9]+)/g, '$1 $2')
    .replace(/([0-9]+)([A-Za-z])/g, '$1 $2');
  return `${storyPart(title)}--${storyPart(storyName)}`;
}

function collectBannedFields(value, prefix = '') {
  const found = [];
  if (!isRecord(value) && !Array.isArray(value)) return found;
  const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
  for (const [key, child] of entries) {
    const label = Array.isArray(value) ? `${prefix}[${key}]` : `${prefix}${prefix ? '.' : ''}${key}`;
    if (!Array.isArray(value) && /^(?:source)?(?:sha|digest|timestamp|axeResults?|gateResults?)$/i.test(key)) {
      found.push(label);
    }
    found.push(...collectBannedFields(child, label));
  }
  return found;
}

function packageJson(repoRoot, relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function readText(repoRoot, relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function filesUnder(repoRoot, relativeRoot, predicate) {
  const absoluteRoot = path.join(repoRoot, relativeRoot);
  if (!existsSync(absoluteRoot)) return [];
  const files = [];
  const walk = (absoluteDirectory) => {
    for (const entry of readdirSync(absoluteDirectory, { withFileTypes: true })) {
      const absolutePath = path.join(absoluteDirectory, entry.name);
      if (entry.isDirectory()) walk(absolutePath);
      else {
        const relativePath = path.relative(repoRoot, absolutePath).split(path.sep).join('/');
        if (predicate(relativePath)) files.push(relativePath);
      }
    }
  };
  walk(absoluteRoot);
  return files.sort();
}

function expectedSnapshotPath(familyId, stateId) {
  return `${EXPECTED_SNAPSHOT_DIR}/desktop-v2-${familyId}-${stateId}-chromium-linux.png`;
}

function expectedVisualTestId(familyId, stateId) {
  return `desktop-v2/${familyId}/${stateId}`;
}

function findFontRights(fontRights, familyName) {
  return fontRights.find((entry) =>
    entry.match === familyName ||
    (entry.matchType === 'prefix' && familyName.startsWith(entry.match)),
  );
}

function validateSharedAssets(contract, context, errors) {
  const { repoRoot, fileExists } = context;
  const shared = contract.sharedAssets;
  if (!isRecord(shared)) {
    errors.push('sharedAssets must document the token stylesheet and font redistribution basis');
    return;
  }
  if (shared.tokenStylesheetPath !== EXPECTED_TOKEN_CSS || !fileExists(shared.tokenStylesheetPath)) {
    errors.push(`shared token source path is absent or unexpected: ${shared.tokenStylesheetPath ?? '(missing)'}`);
    return;
  }
  if (!Array.isArray(shared.fontRights)) {
    errors.push('sharedAssets.fontRights must classify every font family referenced by tokens.css');
    return;
  }

  const tokenCss = readText(repoRoot, EXPECTED_TOKEN_CSS);
  const fontFaceBlocks = [...tokenCss.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((match) => match[1]);
  const fontFamilies = new Set();
  const referencedFontPaths = new Set();
  const referencedFontAssets = new Map();
  for (const block of fontFaceBlocks) {
    const family = block.match(/font-family\s*:\s*['"]?([^;'"}]+)['"]?/i)?.[1]?.trim();
    if (!family) continue;
    fontFamilies.add(family);
    for (const urlMatch of block.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/gi)) {
      const url = urlMatch[1];
      if (/^(?:[a-z]+:|\/|\\)/i.test(url)) {
        errors.push(`font asset must resolve from a repository-relative source path: ${url}`);
        continue;
      }
      const assetPath = path.posix.normalize(path.posix.join('packages/tokens/src', url));
      if (assetPath.startsWith('../') || assetPath.includes('/../')) {
        errors.push(`font asset path escapes the token source tree: ${url}`);
        continue;
      }
      referencedFontPaths.add(assetPath);
      referencedFontAssets.set(`${family}\0${assetPath}`, { family, sourcePath: assetPath });
      if (!fileExists(assetPath)) errors.push(`font asset referenced by tokens.css is missing: ${assetPath}`);
    }
  }

  const expectedFontAssets = [...referencedFontAssets.values()].sort((left, right) =>
    left.family.localeCompare(right.family) || left.sourcePath.localeCompare(right.sourcePath),
  );
  const declaredFontAssets = Array.isArray(shared.fontAssets)
    ? [...shared.fontAssets].sort((left, right) =>
      String(left.family).localeCompare(String(right.family)) || String(left.sourcePath).localeCompare(String(right.sourcePath)),
    )
    : [];
  if (JSON.stringify(declaredFontAssets) !== JSON.stringify(expectedFontAssets)) {
    errors.push('sharedAssets.fontAssets must map every referenced @font-face family to its repository-relative asset path');
  }

  for (const familyName of fontFamilies) {
    const rights = findFontRights(shared.fontRights, familyName);
    if (!rights) {
      errors.push(`font redistribution basis is missing for ${familyName}`);
      continue;
    }
    if (rights.status === 'unresolved' && rights.basis !== 'unresolved') {
      errors.push(`${familyName} rights are unresolved but the contract has no explicit rights finding`);
    }
    if (rights.status === 'cleared' && (!rights.spdx || !rights.evidencePaths?.length)) {
      errors.push(`${familyName} is marked cleared without a license identifier and evidence path`);
    }
    for (const evidencePath of rights.evidencePaths ?? []) {
      if (!fileExists(evidencePath)) errors.push(`${familyName} license evidence path is missing: ${evidencePath}`);
    }
  }

  const expectedFontRights = [
    ['Inter', 'cleared', 'OFL-1.1'],
    ['Falling Sky', 'cleared', 'OFL-1.1'],
    ['Swansea', 'unresolved', undefined],
  ];
  for (const [name, status, spdx] of expectedFontRights) {
    const record = shared.fontRights.find((entry) => entry.match === name);
    if (!record || record.status !== status || (spdx && record.spdx !== spdx)) {
      errors.push(`font rights must record ${name} as ${status}${spdx ? ` under ${spdx}` : ''}`);
    }
  }
  const inter = shared.fontRights.find((entry) => entry.match === 'Inter');
  if (inter && !inter.evidencePaths?.includes('packages/tokens/src/fonts/Inter-OFL.txt')) {
    errors.push('Inter redistribution evidence must include packages/tokens/src/fonts/Inter-OFL.txt');
  }
  const fallingSky = shared.fontRights.find((entry) => entry.match === 'Falling Sky');
  if (fallingSky?.basis !== 'embedded-font-license' || !/Falling Sky is OFL 1\.1/i.test(tokenCss)) {
    errors.push('Falling Sky must retain its embedded SIL OFL 1.1 evidence');
  }

  const swansea = shared.fontRights.find((entry) => entry.match === 'Swansea');
  const fullExport = shared.fullTokenExport;
  if (!isRecord(fullExport)) {
    errors.push('sharedAssets.fullTokenExport must state the rights disposition for tokens.css');
  } else if (swansea?.status === 'unresolved' && fullExport.status !== 'blocked') {
    errors.push('full tokens.css export must remain blocked while Swansea rights are unresolved');
  }
  if (context.requireExportable) {
    for (const familyName of fontFamilies) {
      const rights = findFontRights(shared.fontRights, familyName);
      if (rights?.status !== 'cleared') {
        errors.push(`export blocked: ${familyName} redistribution rights are unresolved`);
      }
    }
    if (fullExport?.status === 'blocked') {
      errors.push(`export blocked: ${fullExport.reason ?? 'tokens.css has an unresolved rights dependency'}`);
    }
  }
}

/** Return named contract gaps; with requireExportable, known unresolved rights fail closed. */
export function checkDesktopV2Contract(contract, options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const fileExists = options.fileExists ?? ((relativePath) => existsSync(path.join(repoRoot, relativePath)));
  const errors = [];
  const context = { repoRoot, fileExists, requireExportable: options.requireExportable === true };

  if (!isRecord(contract)) return ['contract root must be a JSON object'];
  const banned = collectBannedFields(contract);
  for (const field of banned) errors.push(`source contract must not embed run-specific provenance or results: ${field}`);

  if (!Array.isArray(contract.families)) {
    errors.push('families must be an array containing exactly the 22 issue-listed families');
    return errors;
  }
  const familyIds = contract.families.map((family) => family?.id).filter((id) => typeof id === 'string');
  for (const expected of REQUIRED_FAMILIES) {
    if (!familyIds.includes(expected)) errors.push(`missing family ${expected}; the family inventory must match the issue exactly`);
  }
  for (const actual of familyIds) {
    if (!REQUIRED_FAMILIES.includes(actual)) errors.push(`extra family ${actual}; the family inventory must match the issue exactly`);
  }
  if (new Set(familyIds).size !== familyIds.length) errors.push('family ids must be unique');
  if (familyIds.length !== REQUIRED_FAMILIES.length) errors.push('family inventory must contain exactly 22 entries');

  const stylesPackage = packageJson(repoRoot, 'packages/styles/package.json');
  const elementIndexPath = 'packages/elements/src/index.ts';
  const elementIndex = fileExists(elementIndexPath) ? readText(repoRoot, elementIndexPath) : '';
  const tokenCss = fileExists(EXPECTED_TOKEN_CSS) ? readText(repoRoot, EXPECTED_TOKEN_CSS) : '';
  const definedTokens = new Set([...tokenCss.matchAll(/(--sk-[a-z0-9-]+)\s*:/gi)].map((match) => match[1]));
  const visual = contract.visualEvidence;
  let visualSource = '';
  if (visual?.runnerPath !== EXPECTED_VISUAL_SPEC || !fileExists(visual.runnerPath)) {
    errors.push(`visual test runner path is missing or unexpected: ${visual?.runnerPath ?? '(missing)'}`);
  } else {
    visualSource = readText(repoRoot, visual.runnerPath);
    for (const marker of ['test(visualTestId', 'state.story.storyId', 'state.snapshotPath', 'toHaveScreenshot']) {
      if (!visualSource.includes(marker)) errors.push(`visual runner no longer consumes contract mapping field: ${marker}`);
    }
  }
  if (visual?.testIdFormat !== 'desktop-v2/{family}/{state}' ||
      visual?.snapshotPathFormat !== `${EXPECTED_SNAPSHOT_DIR}/desktop-v2-{family}-{state}-chromium-linux.png`) {
    errors.push('visual evidence formats must map every required state to a stable test id and Chromium snapshot path');
  }

  let generatedStories;
  if (options.verifyGeneratedStoryIndex === true) {
    const storyIndexPath = 'apps/storybook/storybook-static/index.json';
    if (!fileExists(storyIndexPath)) {
      errors.push(`generated Storybook index is missing; build Storybook before checking live story IDs: ${storyIndexPath}`);
    } else {
      try {
        const storyIndex = JSON.parse(readText(repoRoot, storyIndexPath));
        generatedStories = storyIndex.entries;
        if (!isRecord(generatedStories)) errors.push('generated Storybook index has no entries object');
      } catch (error) {
        errors.push(`generated Storybook index is invalid JSON: ${error.message}`);
      }
    }
  }

  for (const family of contract.families) {
    if (!isRecord(family)) continue;
    const familyId = family.id;
    const familyErrorsBefore = errors.length;
    const expectedStates = REQUIRED_STATES[familyId];
    if (!expectedStates) continue;
    if (family.form !== EXPECTED_FORMS[familyId]) {
      errors.push(`${familyId} source form must be ${EXPECTED_FORMS[familyId] ?? 'declared from the issue inventory'}`);
    }
    if (!isRecord(family.paths) || !isRecord(family.publicEntries)) {
      errors.push(`${familyId} must declare source paths and public entry points`);
      continue;
    }

    const expectedCss = `packages/styles/src/${familyId}/sk-${familyId}.css`;
    if (family.paths.stylesCss !== expectedCss || !fileExists(family.paths.stylesCss)) {
      errors.push(`${familyId} source path is absent or unexpected: ${family.paths.stylesCss ?? '(missing styles CSS)'}`);
    }
    const expectedAdditionalCss = filesUnder(repoRoot, `packages/styles/src/${familyId}`, (sourcePath) => sourcePath.endsWith('.css'))
      .filter((sourcePath) => sourcePath !== expectedCss);
    const listedAdditionalCss = Array.isArray(family.paths.additionalStylesCss)
      ? [...family.paths.additionalStylesCss].sort()
      : [];
    if (JSON.stringify(listedAdditionalCss) !== JSON.stringify(expectedAdditionalCss)) {
      errors.push(`${familyId} additional CSS source inventory differs from authored styles files`);
    }
    const expectedStylesEntry = `@spec-kitty/styles/${familyId}/sk-${familyId}.css`;
    if (family.publicEntries.stylesCss !== expectedStylesEntry ||
        stylesPackage.exports?.[`./${familyId}/*`] !== `./dist/${familyId}/*`) {
      errors.push(`${familyId} public entry is absent or not exported: ${family.publicEntries.stylesCss ?? '(missing)'}`);
    }
    if (family.paths.stylesCss && fileExists(family.paths.stylesCss)) {
      const cssPaths = [family.paths.stylesCss, ...listedAdditionalCss];
      const actualTokens = [...new Set(cssPaths.flatMap((sourcePath) =>
        fileExists(sourcePath)
          ? [...readText(repoRoot, sourcePath).matchAll(/var\(\s*(--sk-[a-z0-9-]+)/g)].map((match) => match[1])
          : [],
      ))].sort();
      const contractTokens = Array.isArray(family.tokenClosure) ? [...family.tokenClosure].sort() : [];
      if (JSON.stringify(contractTokens) !== JSON.stringify(actualTokens)) {
        errors.push(`${familyId} token closure differs from its authored styles source`);
      }
      for (const token of contractTokens) {
        if (!definedTokens.has(token)) errors.push(`${familyId} references undefined token ${token}`);
      }
    }

    const elementPath = family.paths.elementTs;
    const expectedElementName = `Sk${familyId.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('')}`;
    if (family.form === 'element-backed') {
      const expectedElementPath = `packages/elements/src/${familyId}/sk-${familyId}.ts`;
      if (elementPath !== expectedElementPath || !fileExists(expectedElementPath)) {
        errors.push(`${familyId} is marked element-backed without an authored element source path`);
      }
      const expectedMarkupPath = `packages/elements/src/${familyId}/sk-${familyId}.markup.ts`;
      const actualMarkupPath = fileExists(expectedMarkupPath) ? expectedMarkupPath : null;
      if (family.paths.elementMarkupTs !== actualMarkupPath) {
        errors.push(`${familyId} authored markup source inventory is absent or stale`);
      }
      if (family.publicEntries.elementExport !== expectedElementName || !new RegExp(`\\b${expectedElementName}\\b`).test(elementIndex)) {
        errors.push(`${familyId} public element entry ${family.publicEntries.elementExport ?? '(missing)'} is not exported from @spec-kitty/elements`);
      }
    } else if (elementPath !== null || family.paths.elementMarkupTs !== null || family.publicEntries.elementExport !== null) {
      errors.push(`${familyId} is styles-only but claims a custom element source or public element entry`);
    }

    const expectedStories = [
      ...filesUnder(repoRoot, `packages/styles/src/${familyId}`, (sourcePath) => sourcePath.endsWith('.stories.ts')),
      ...filesUnder(repoRoot, `packages/elements/src/${familyId}`, (sourcePath) => sourcePath.endsWith('.stories.ts')),
    ].sort();
    const listedStories = Array.isArray(family.paths.storySources) ? [...family.paths.storySources].sort() : [];
    if (JSON.stringify(listedStories) !== JSON.stringify(expectedStories)) {
      errors.push(`${familyId} Storybook source inventory differs from authored family stories`);
    }
    if (family.form === 'styles-only') {
      const expectedMarkup = filesUnder(repoRoot, `packages/styles/src/${familyId}`, (sourcePath) => sourcePath.endsWith('.html'));
      const listedMarkup = Array.isArray(family.paths.staticMarkup) ? [...family.paths.staticMarkup].sort() : [];
      if (JSON.stringify(listedMarkup) !== JSON.stringify(expectedMarkup)) {
        errors.push(`${familyId} authored static markup inventory differs from its source fixtures`);
      }
    } else if (Array.isArray(family.paths.staticMarkup) && family.paths.staticMarkup.length > 0) {
      errors.push(`${familyId} element-backed static HTML is generated and must not be inventoried as authored source`);
    }

    const authoredPaths = [
      family.paths.stylesCss,
      ...(family.paths.additionalStylesCss ?? []),
      family.paths.elementTs,
      family.paths.elementMarkupTs,
      ...(family.paths.staticMarkup ?? []),
      ...(family.paths.storySources ?? []),
    ].filter((entry) => typeof entry === 'string');
    for (const sourcePath of authoredPaths) {
      if (!fileExists(sourcePath)) errors.push(`${familyId} source path is missing: ${sourcePath}`);
      if (sourcePath.startsWith('/') || sourcePath.split('/').includes('..')) {
        errors.push(`${familyId} source paths must be repository-relative: ${sourcePath}`);
      }
      if (/packages\/react\/src|\.css\.js$|\/index\.ts$/.test(sourcePath) ||
          (family.form === 'element-backed' && /\.html$/.test(sourcePath))) {
        errors.push(`${familyId} source list crosses an authored/generated boundary: ${sourcePath}`);
      }
    }
    if (family.paths.elementMarkupTs && !fileExists(family.paths.elementMarkupTs)) {
      errors.push(`${familyId} authored markup module is missing: ${family.paths.elementMarkupTs}`);
    }
    if (!Array.isArray(family.paths.storySources) || family.paths.storySources.length === 0) {
      errors.push(`${familyId} must inventory at least one authored Storybook source file`);
    }
    if (family.form === 'styles-only' && (!Array.isArray(family.paths.staticMarkup) || family.paths.staticMarkup.length === 0)) {
      errors.push(`${familyId} styles-only source must inventory its authored static markup fixtures`);
    }

    const states = Array.isArray(family.requiredStates) ? family.requiredStates : [];
    const stateIds = states.map((state) => state?.id).filter((id) => typeof id === 'string');
    for (const stateId of expectedStates) {
      if (!stateIds.includes(stateId)) errors.push(`${familyId} is missing required state ${stateId}`);
    }
    for (const stateId of stateIds) {
      if (!expectedStates.includes(stateId)) errors.push(`${familyId} has unexpected required state ${stateId}`);
    }
    if (new Set(stateIds).size !== stateIds.length) errors.push(`${familyId} required-state ids must be unique`);

    const storyIdSet = new Set();
    for (const state of states) {
      if (!isRecord(state) || !isRecord(state.story)) {
        errors.push(`${familyId} required state must map to a story, visual test id, and snapshot`);
        continue;
      }
      const storySource = state.story.sourcePath;
      if (!family.paths.storySources?.includes(storySource)) {
        errors.push(`${familyId}/${state.id} mapped story source is not part of the inventoried authored story sources: ${storySource ?? '(missing)'}`);
      }
      if (typeof storySource !== 'string' || !fileExists(storySource)) {
        errors.push(`${familyId} mapped Storybook story source is missing: ${storySource ?? '(missing)'}`);
      } else {
        const source = readText(repoRoot, storySource);
        const title = source.match(/\btitle\s*:\s*(['"])(.*?)\1/)?.[2];
        const exportPattern = new RegExp(`\\bexport\\s+const\\s+${state.story.exportName}\\b`);
        if (!title || !exportPattern.test(source)) {
          errors.push(`${familyId} mapped story ${state.story.storyId} cannot resolve ${state.story.exportName} in ${storySource}`);
        } else if (storyIdFor(title, state.story.exportName) !== state.story.storyId) {
          errors.push(`${familyId} story id ${state.story.storyId} is stale; ${state.story.exportName} resolves as ${storyIdFor(title, state.story.exportName)}`);
        }
        if (isRecord(generatedStories)) {
          const builtStory = generatedStories[state.story.storyId];
          if (!isRecord(builtStory) || builtStory.type !== 'story' ||
              builtStory.importPath !== `./${storySource}` || builtStory.exportName !== state.story.exportName ||
              builtStory.title !== title) {
            errors.push(`${familyId} generated Storybook entry does not resolve ${state.story.storyId} to ${storySource}#${state.story.exportName}`);
          }
        }
      }
      storyIdSet.add(state.story.storyId);
      if (state.visualTestId !== expectedVisualTestId(familyId, state.id)) {
        errors.push(`${familyId}/${state.id} visual test id is stale or missing`);
      }
      const expectedSnapshot = expectedSnapshotPath(familyId, state.id);
      if (state.snapshotPath !== expectedSnapshot || !fileExists(state.snapshotPath)) {
        errors.push(`${familyId}/${state.id} snapshot is stale or missing: ${state.snapshotPath ?? '(missing)'}`);
      }
      if (!state.viewport || !Number.isInteger(state.viewport.width) || !Number.isInteger(state.viewport.height)) {
        errors.push(`${familyId}/${state.id} must declare a concrete visual-test viewport`);
      }
      const requiredInteraction = INTERACTION_AXES.includes(state.id);
      if (requiredInteraction && (!isRecord(state.interaction) || !state.interaction.type)) {
        errors.push(`${familyId}/${state.id} requires an explicit interaction mapping`);
      }
      if (requiredInteraction && state.id !== 'active' &&
          (state.interaction?.type !== state.id || typeof state.interaction?.selector !== 'string' || !state.interaction.selector.trim())) {
        errors.push(`${familyId}/${state.id} interaction must exercise its authored ${state.id} selector`);
      }
      if (state.id === 'active' && state.interaction?.type !== 'active' && state.interaction?.type !== 'story-state') {
        errors.push(`${familyId}/active must exercise an authored active selector or map a named active story state`);
      }
    }

    const applicable = new Set(expectedStates.filter((stateId) => INTERACTION_AXES.includes(stateId)));
    if (!isRecord(family.nonApplicableStates)) {
      errors.push(`${familyId} must explicitly explain non-applicable interaction states`);
    } else {
      for (const axis of INTERACTION_AXES) {
        if (applicable.has(axis)) {
          if (axis in family.nonApplicableStates) errors.push(`${familyId} marks required ${axis} coverage as non-applicable`);
        } else if (typeof family.nonApplicableStates[axis] !== 'string' || !family.nonApplicableStates[axis].trim()) {
          errors.push(`${familyId} must give a reason why ${axis} is not applicable`);
        }
      }
    }
    if (errors.length !== familyErrorsBefore) continue;
  }

  validateSharedAssets(contract, context, errors);
  return errors;
}

function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const contractPath = path.join(repoRoot, 'contracts/desktop-v2/source-contract.json');
  const requireExportable = process.argv.includes('--require-exportable');
  let contract;
  try {
    contract = JSON.parse(readFileSync(contractPath, 'utf8'));
  } catch (error) {
    console.error(`Unable to read Desktop V2 source contract: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  const errors = checkDesktopV2Contract(contract, {
    repoRoot,
    requireExportable,
    verifyGeneratedStoryIndex: true,
  });
  if (errors.length) {
    for (const error of errors) console.error(`FAIL ${error}`);
    process.exitCode = 1;
    return;
  }
  const states = contract.families.reduce((count, family) => count + family.requiredStates.length, 0);
  console.log(`Desktop V2 contract valid: ${contract.families.length} families, ${states} independently required states, generated stories and visual snapshot paths verified.`);
  if (!requireExportable && contract.sharedAssets.fullTokenExport.status === 'blocked') {
    console.log(`Full token export remains blocked: ${contract.sharedAssets.fullTokenExport.reason}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
