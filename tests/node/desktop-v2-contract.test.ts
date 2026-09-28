import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkDesktopV2Contract,
  REQUIRED_FAMILIES,
  REQUIRED_STATES,
  REQUIRED_VISUAL_CAPTURE_COUNTS,
} from '../../scripts/check-desktop-v2-contract.mjs';
import { exportDesktopV2Handoff } from '../../scripts/export-desktop-v2-handoff.mjs';

const repoRoot = process.cwd();
const contractPath = resolve(repoRoot, 'contracts/desktop-v2/source-contract.json');
const sourceContract = JSON.parse(readFileSync(contractPath, 'utf8')) as {
  families: Array<{
    id: string;
    requiredStates: Array<{
      id: string;
      story: { sourcePath: string; storyId: string; exportName: string };
      visualTestId: string;
      snapshotPath: string;
      visualCapture?: { expectedMatchCount: number };
    }>;
    paths: { stylesCss: string; storySources: string[] };
    publicEntries: { stylesCss: string; elementExport: string | null };
    tokenClosure: string[];
    sourceRights?: {
      status: string;
      spdx: string;
      basis?: string;
      evidencePaths: string[];
      coveredPaths: string[];
    };
  }>;
  sharedAssets: {
    tokenStylesheetPath: string;
    fontAssets: Array<{ family: string; sourcePath: string }>;
    fontRights: Array<{
      match: string;
      status: string;
      spdx?: string;
      basis?: string;
    }>;
    fullTokenExport: { status: string; reason: string };
  };
};

function copyContract() {
  return structuredClone(sourceContract);
}

function check(contract: unknown, options: Record<string, unknown> = {}) {
  return checkDesktopV2Contract(contract, { repoRoot, ...options });
}

function withCommittedHandoff(assertion: (artifactPath: string) => void) {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'desktop-v2-contract-rights-'));
  const artifactPath = join(temporaryRoot, 'handoff');
  try {
    const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
    const exportCommitted = exportDesktopV2Handoff as unknown as (options: {
      repoRoot: string;
      sourceSha: string;
      outputPath: string;
    }) => void;
    exportCommitted({ repoRoot, sourceSha, outputPath: artifactPath });
    assertion(artifactPath);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

describe('Desktop V2 source contract', () => {
  it('required state mapping closes the independent inventory over stories, visual tests, and snapshots', () => {
    expect(sourceContract.families.map((family) => family.id).sort()).toEqual(
      [...REQUIRED_FAMILIES].sort(),
    );

    for (const family of sourceContract.families) {
      const expectedStates = REQUIRED_STATES[family.id as keyof typeof REQUIRED_STATES];
      expect(family.requiredStates.map((state) => state.id).sort()).toEqual(
        [...expectedStates].sort(),
      );
      for (const state of family.requiredStates) {
        expect(family.paths.storySources).toContain(state.story.sourcePath);
        expect(state.visualTestId).toBe(`desktop-v2/${family.id}/${state.id}`);
        expect(state.snapshotPath).toBe(
          `apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-${family.id}-${state.id}-chromium-linux.png`,
        );
      }
    }
    expect(check(sourceContract)).toEqual([]);
  });

  it('deletion probes reject removal of a family from the independent exact list', () => {
    const mutated = copyContract();
    mutated.families = mutated.families.filter((family) => family.id !== REQUIRED_FAMILIES[0]);

    expect(check(mutated).join('\n')).toMatch(/missing family/i);
  });

  it('deletion probes reject a missing required state even when its story mapping disappears with it', () => {
    const mutated = copyContract();
    const button = mutated.families.find((family) => family.id === 'button');
    expect(button).toBeDefined();
    button!.requiredStates = button!.requiredStates.filter((state) => state.id !== 'disabled');

    expect(check(mutated).join('\n')).toMatch(/button.*required state.*disabled/i);
  });

  it('requires explicit selector counts for aggregate visual states', () => {
    for (const [familyId, states] of Object.entries(REQUIRED_VISUAL_CAPTURE_COUNTS)) {
      for (const [stateId, expectedMatchCount] of Object.entries(states)) {
        const family = sourceContract.families.find((entry) => entry.id === familyId);
        const state = family?.requiredStates.find((entry) => entry.id === stateId);
        expect(state?.visualCapture).toEqual({ expectedMatchCount });

        const missing = copyContract();
        const missingState = missing.families.find((entry) => entry.id === familyId)!
          .requiredStates.find((entry) => entry.id === stateId)!;
        delete missingState.visualCapture;
        expect(check(missing).join('\n')).toMatch(new RegExp(`${familyId}/${stateId}.*visual capture`));

        const wrong = copyContract();
        const wrongState = wrong.families.find((entry) => entry.id === familyId)!
          .requiredStates.find((entry) => entry.id === stateId)!;
        wrongState.visualCapture = { expectedMatchCount: expectedMatchCount - 1 };
        expect(check(wrong).join('\n')).toMatch(new RegExp(`${familyId}/${stateId}.*visual capture`));
      }
    }
  });

  it('deletion probes reject deletion of a mapped Storybook story', () => {
    const state = sourceContract.families[0].requiredStates[0];
    const absentPath = state.story.sourcePath;
    const fileExists = (relativePath: string) =>
      relativePath === absentPath ? false : existsSync(resolve(repoRoot, relativePath));

    expect(check(sourceContract, { fileExists }).join('\n')).toMatch(/story.*missing|missing.*story/i);
  });

  it('probes removal of the family repository-MIT basis or LICENSE evidence path', () => {
    const missingBasis = copyContract();
    delete missingBasis.families[0].sourceRights?.basis;
    expect(check(missingBasis).join('\n')).toMatch(/action-row.*source rights.*MIT.*repository LICENSE/i);

    const missingEvidence = copyContract();
    missingEvidence.families[0].sourceRights!.evidencePaths = [];
    expect(check(missingEvidence).join('\n')).toMatch(/action-row.*source rights.*LICENSE/i);

    const incompleteCoverage = copyContract();
    incompleteCoverage.families[0].sourceRights!.coveredPaths.pop();
    expect(check(incompleteCoverage).join('\n')).toMatch(/action-row.*source rights coverage.*authored/i);
  });

  it('deletion probes reject absent public/source paths and stale visual-test or snapshot mappings', () => {
    const missingPath = copyContract();
    missingPath.families[0].paths.stylesCss = 'packages/styles/src/missing/sk-missing.css';
    missingPath.families[0].publicEntries.stylesCss = '@spec-kitty/styles/missing/sk-missing.css';
    expect(check(missingPath).join('\n')).toMatch(/source path|public entry/i);

    const staleVisual = copyContract();
    staleVisual.families[0].requiredStates[0].visualTestId = 'desktop-v2/deleted-test';
    expect(check(staleVisual).join('\n')).toMatch(/visual test/i);

    const staleSnapshot = copyContract();
    staleSnapshot.families[0].requiredStates[0].snapshotPath =
      'apps/storybook/src/tests/visual.spec.ts-snapshots/deleted-snapshot.png';
    expect(check(staleSnapshot).join('\n')).toMatch(/snapshot/i);
  });

  it('rights closure preserves Swansea restriction, scoped token provenance, and Falling Sky OFL evidence', () => {
    expect(check(sourceContract)).toEqual([]);

    const swansea = sourceContract.sharedAssets.fontRights.find((entry) => entry.match === 'Swansea');
    expect(swansea).toMatchObject({ status: 'unresolved', basis: 'unresolved' });
    expect(sourceContract.sharedAssets.fullTokenExport.status).toBe('blocked');
    expect(check(sourceContract, { requireExportable: true }).join('\n'))
      .toMatch(/export blocked: Swansea redistribution rights are unresolved/i);

    const fallingSky = sourceContract.sharedAssets.fontRights.find((entry) => entry.match === 'Falling Sky');
    expect(fallingSky).toMatchObject({
      status: 'cleared',
      spdx: 'OFL-1.1',
      basis: 'embedded-font-license',
    });

    withCommittedHandoff((artifactPath) => {
      const manifest = JSON.parse(readFileSync(join(artifactPath, 'manifest.json'), 'utf8')) as {
        files: Array<{
          path: string;
          derivation?: string;
          sourceMapPath?: string;
          licenseRefs: string[];
        }>;
        licenses: Array<{
          id: string;
          fontFamily?: string;
          spdx: string;
          basis: string;
        }>;
      };
      const tokenFile = manifest.files.find(
        (file) => file.path === sourceContract.sharedAssets.tokenStylesheetPath,
      );
      expect(tokenFile?.derivation).toBe('scoped-token-css');
      expect(tokenFile?.sourceMapPath).toBe('payload/source-maps/tokens.css.source-map.json');

      const scopedCss = readFileSync(join(artifactPath, 'payload', tokenFile!.path), 'utf8');
      expect(scopedCss).not.toMatch(/url\([^)]*Swansea/i);
      const sourceMap = JSON.parse(
        readFileSync(join(artifactPath, tokenFile!.sourceMapPath!), 'utf8'),
      ) as {
        sourcePath: string;
        removedRules: Array<{ family: string }>;
        excludedFontAssets: Array<{ family: string; sourcePath: string }>;
      };
      expect(sourceMap.sourcePath).toBe(sourceContract.sharedAssets.tokenStylesheetPath);
      expect(sourceMap.removedRules.map((rule) => rule.family)).toContain('Swansea');
      expect(sourceMap.excludedFontAssets).toContainEqual(
        expect.objectContaining({ family: 'Swansea' }),
      );

      const swanseaAsset = sourceContract.sharedAssets.fontAssets.find(
        (asset) => asset.family === 'Swansea',
      );
      expect(swanseaAsset).toBeDefined();
      expect(manifest.files.some((file) => file.path === swanseaAsset!.sourcePath)).toBe(false);

      const fallingSkyAsset = sourceContract.sharedAssets.fontAssets.find(
        (asset) => asset.family === 'Falling Sky',
      );
      expect(fallingSkyAsset).toBeDefined();
      expect(manifest.files.some((file) => file.path === fallingSkyAsset!.sourcePath)).toBe(true);
      expect(manifest.licenses.find((license) => license.id === 'license:ofl-1-1:falling-sky'))
        .toMatchObject({
          fontFamily: 'Falling Sky',
          spdx: 'OFL-1.1',
          basis: 'embedded-font-license',
        });
    });
  });

  it('Swansea full CSS rejection blocks the unchanged tokens.css closure', () => {
    const fullTokensCss = readFileSync(
      resolve(repoRoot, sourceContract.sharedAssets.tokenStylesheetPath),
      'utf8',
    );
    expect(fullTokensCss).toMatch(/font-family:\s*['"]?Swansea['"]?/i);
    expect(fullTokensCss).toMatch(/url\([^)]*Swansea/i);

    const unblockedFullExport = copyContract();
    unblockedFullExport.sharedAssets.fullTokenExport.status = 'allowed';
    expect(check(unblockedFullExport).join('\n'))
      .toMatch(/full tokens\.css export must remain blocked while Swansea rights are unresolved/i);
    expect(check(sourceContract, { requireExportable: true }).join('\n'))
      .toMatch(/export blocked: Swansea redistribution rights are unresolved/i);
  });

  it('consumer boundary keeps selected navigation in the existing neutral primitive and excludes a generic domain tree', () => {
    const navPill = sourceContract.families.find((family) => family.id === 'nav-pill');
    expect(navPill).toBeDefined();
    expect(navPill!.publicEntries.stylesCss).toBe('@spec-kitty/styles/nav-pill/sk-nav-pill.css');
    expect(navPill!.publicEntries.elementExport).toBe('SkNavPill');
    const activeState = navPill!.requiredStates.find((state) => state.id === 'active');
    expect(activeState).toMatchObject({
      story: {
        sourcePath: 'packages/styles/src/nav-pill/sk-nav-pill.stories.ts',
        exportName: 'ActiveItem',
      },
      visualTestId: 'desktop-v2/nav-pill/active',
    });
    expect(navPill!.tokenClosure.length).toBeGreaterThan(0);
    expect(navPill!.tokenClosure.every((token) => token.startsWith('--sk-'))).toBe(true);

    const navPillCss = readFileSync(resolve(repoRoot, navPill!.paths.stylesCss), 'utf8');
    const activeRules = [
      navPillCss.match(/\.sk-nav-pill__item--active\s*\{([^}]*)\}/)?.[1],
      navPillCss.match(/::slotted\(\.sk-nav-pill__item--active\)\s*\{([^}]*)\}/)?.[1],
    ];
    for (const activeRule of activeRules) {
      expect(activeRule).toBeDefined();
      expect(activeRule).toMatch(
        /border\s*:\s*var\(\s*--sk-border-width-1\s*\)\s+solid\s+var\(\s*--sk-border-strong\s*\)/i,
      );
      const literalColorValues = activeRule!.replace(/var\([^)]*\)/g, '');
      expect(literalColorValues).not.toMatch(
        /\b(?:gold|yellow)\b|#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\s*\(/i,
      );
    }

    const stylesPackage = JSON.parse(
      readFileSync(resolve(repoRoot, 'packages/styles/package.json'), 'utf8'),
    ) as { exports: Record<string, string> };
    expect(stylesPackage.exports['./nav-pill/*']).toBe('./dist/nav-pill/*');
    expect(Object.keys(stylesPackage.exports).some((entry) =>
      /(?:desktop|artifact[-/]?tree|file[-/]?tree)/i.test(entry),
    )).toBe(false);

    const elementExports = readFileSync(resolve(repoRoot, 'packages/elements/src/index.ts'), 'utf8')
      .match(/export\s*\{[^}]+\}/g)?.join('\n') ?? '';
    expect(elementExports).toMatch(/\bSkNavPill\b/);
    expect(elementExports).not.toMatch(/\b(?:SkDesktop\w*|SkArtifactTree|SkFileTree)\b/);

    const primitiveDirectories = [
      ...readdirSync(resolve(repoRoot, 'packages/styles/src'), { withFileTypes: true }),
      ...readdirSync(resolve(repoRoot, 'packages/elements/src'), { withFileTypes: true }),
    ].filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    expect(primitiveDirectories.some((name) =>
      /(?:desktop|artifact[-/]?tree|file[-/]?tree)/i.test(name),
    )).toBe(false);
  });
});
