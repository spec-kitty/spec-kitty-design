import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkDesktopV2Contract,
  REQUIRED_FAMILIES,
  REQUIRED_STATES,
  REQUIRED_VISUAL_CAPTURE_COUNTS,
} from '../../scripts/check-desktop-v2-contract.mjs';

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
    paths: { stylesCss: string };
    publicEntries: { stylesCss: string };
    sourceRights?: {
      status: string;
      spdx: string;
      basis?: string;
      evidencePaths: string[];
      coveredPaths: string[];
    };
  }>;
};

function copyContract() {
  return structuredClone(sourceContract);
}

function check(contract: unknown, options: Record<string, unknown> = {}) {
  return checkDesktopV2Contract(contract, { repoRoot, ...options });
}

describe('Desktop V2 source contract', () => {
  it('contains exactly the 22 issue-listed families and required states', () => {
    expect(sourceContract.families.map((family) => family.id).sort()).toEqual(
      [...REQUIRED_FAMILIES].sort(),
    );

    for (const family of sourceContract.families) {
      expect(family.requiredStates.map((state) => state.id).sort()).toEqual(
        [...REQUIRED_STATES[family.id]].sort(),
      );
    }
    expect(check(sourceContract)).toEqual([]);
  });

  it('probes family deletion against the independent exact family list', () => {
    const mutated = copyContract();
    mutated.families = mutated.families.filter((family) => family.id !== REQUIRED_FAMILIES[0]);

    expect(check(mutated).join('\n')).toMatch(/missing family/i);
  });

  it('probes required-state deletion even when its story mapping disappears with it', () => {
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

  it('probes deletion of a mapped Storybook story', () => {
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

  it('rejects absent public/source paths and stale visual-test or snapshot mappings', () => {
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

  it('fails closed when export is requested with unresolved Swansea font rights', () => {
    const findings = check(sourceContract, { requireExportable: true });
    expect(findings.join('\n')).toMatch(/swansea.*unresolved|unresolved.*swansea/i);
  });
});
