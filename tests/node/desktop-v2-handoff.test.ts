import { createHash } from 'node:crypto';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { exportDesktopV2Handoff } from '../../scripts/export-desktop-v2-handoff.mjs';
import { verifyDesktopV2Handoff } from '../../scripts/verify-desktop-v2-handoff.mjs';

const repoRoot = process.cwd();
const verifierScript = resolve(repoRoot, 'scripts/verify-desktop-v2-handoff.mjs');
const sourceContractPath = 'contracts/desktop-v2/source-contract.json';
const familySourcePath = 'packages/styles/src/button/sk-button.css';
const tokenCssPath = 'packages/tokens/src/tokens.css';
const interFontPath = 'packages/tokens/src/fonts/inter.woff2';
const fallingSkyFontPath = 'packages/tokens/src/fonts/falling-sky.otf';
const swanseaFontPath = 'packages/tokens/src/fonts/swansea.ttf';
const interLicensePath = 'packages/tokens/src/fonts/Inter-OFL.txt';

let temporaryRoot = '';
let fixtureIndex = 0;

interface ExportedFile {
  path: string;
  sizeBytes: number;
  sha256: string;
  licenseRefs: string[];
  sourceMapPath?: string;
}

interface HandoffManifest {
  schemaVersion: number;
  sourceSha: string;
  contract: { path: string; sourcePath: string; sizeBytes: number; sha256: string };
  files: ExportedFile[];
  artifactDigest: string;
  artifactDigestAlgorithm: string;
}

function findPostSourceBindingFields(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [];
  const entries = Array.isArray(value)
    ? value.map((entry, index) => [String(index), entry] as const)
    : Object.entries(value);
  return entries.flatMap(([key, child]) => {
    const field = Array.isArray(value) ? `${prefix}[${key}]` : `${prefix}${prefix ? '.' : ''}${key}`;
    const ownFinding = !Array.isArray(value) && /^(?:source)?(?:sha|digest|timestamp|axeResults?|gateResults?)$/i.test(key)
      ? [field]
      : [];
    return [...ownFinding, ...findPostSourceBindingFields(child, field)];
  });
}

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function baseContract(coveredPaths = [familySourcePath]) {
  return {
    schemaVersion: 1,
    visualEvidence: {},
    families: [
      {
        id: 'button',
        paths: { stylesCss: familySourcePath },
        sourceRights: {
          status: 'cleared',
          spdx: 'MIT',
          basis: 'repository-license',
          evidencePaths: ['LICENSE'],
          coveredPaths,
        },
      },
    ],
    sharedAssets: {
      tokenStylesheetPath: tokenCssPath,
      fontAssets: [
        { family: 'Inter', sourcePath: interFontPath },
        { family: 'Falling Sky', sourcePath: fallingSkyFontPath },
        { family: 'Swansea', sourcePath: swanseaFontPath },
      ],
      fontRights: [
        {
          match: 'Inter',
          matchType: 'exact',
          status: 'cleared',
          spdx: 'OFL-1.1',
          basis: 'license-file',
          evidencePaths: [interLicensePath],
        },
        {
          match: 'Falling Sky',
          matchType: 'exact',
          status: 'cleared',
          spdx: 'OFL-1.1',
          basis: 'embedded-font-license',
          evidencePaths: [tokenCssPath],
        },
        {
          match: 'Swansea',
          matchType: 'exact',
          status: 'unresolved',
          basis: 'unresolved',
          evidencePaths: [tokenCssPath],
        },
      ],
      fullTokenExport: {
        status: 'blocked',
        reason: 'Swansea font redistribution terms are unresolved.',
      },
    },
  };
}

const tokenCss = [
  '/* Falling Sky is OFL 1.1 (verified from the binaries embedded license text). */',
  ':root { --sk-font-body: Inter, sans-serif; --sk-font-display: "Falling Sky", sans-serif; --sk-font-reference: Swansea, sans-serif; }',
  "@font-face { font-family: 'Inter'; src: url('./fonts/inter.woff2'); }",
  "@font-face { font-family: 'Falling Sky'; src: url('./fonts/falling-sky.otf'); }",
  "@font-face { font-family: 'Swansea'; src: url('./fonts/swansea.ttf'); }",
  '',
].join('\n');

function writeFixtureFile(root: string, path: string, contents: string | Buffer) {
  const target = join(root, ...path.split('/'));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function git(root: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function createFixture(options: {
  contract?: ReturnType<typeof baseContract>;
  sourceSymlink?: boolean;
} = {}) {
  const root = join(temporaryRoot, `repo-${fixtureIndex++}`);
  mkdirSync(root, { recursive: true });
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  git(root, 'config', 'user.email', 'handoff-test@example.invalid');
  git(root, 'config', 'user.name', 'Handoff Test');

  writeFixtureFile(root, 'LICENSE', 'MIT License\n');
  if (options.sourceSymlink) {
    writeFixtureFile(root, 'packages/styles/src/button/target.css', '.button { color: red; }\n');
    const symlinkPath = join(root, ...familySourcePath.split('/'));
    mkdirSync(dirname(symlinkPath), { recursive: true });
    symlinkSync('target.css', symlinkPath);
  } else {
    writeFixtureFile(root, familySourcePath, '.sk-button { display: inline-flex; }\n');
  }
  writeFixtureFile(root, tokenCssPath, tokenCss);
  writeFixtureFile(root, interFontPath, Buffer.from('inter font bytes'));
  writeFixtureFile(root, fallingSkyFontPath, Buffer.from('falling sky font bytes'));
  writeFixtureFile(root, swanseaFontPath, Buffer.from('unresolved Swansea font bytes'));
  writeFixtureFile(root, interLicensePath, 'SIL OPEN FONT LICENSE Version 1.1\n');
  writeFixtureFile(
    root,
    sourceContractPath,
    `${JSON.stringify(options.contract ?? baseContract(), null, 2)}\n`,
  );

  git(root, 'add', '-A');
  git(root, 'commit', '--quiet', '-m', 'fixture');
  return { root, sourceSha: git(root, 'rev-parse', 'HEAD') };
}

function manifestAt(artifactPath: string): HandoffManifest {
  return JSON.parse(readFileSync(join(artifactPath, 'manifest.json'), 'utf8')) as HandoffManifest;
}

function artifactTree(directory: string): Array<[string, Buffer]> {
  const result: Array<[string, Buffer]> = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`unexpected symlink in fixture output: ${path}`);
      if (entry.isDirectory()) walk(path);
      else result.push([relative(directory, path).split(sep).join('/'), readFileSync(path)]);
    }
  };
  walk(directory);
  return result.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
}

function expectedArtifactDigest(artifactPath: string, manifest: HandoffManifest): string {
  const entries = [
    {
      path: manifest.contract.path,
      bytes: readFileSync(join(artifactPath, ...manifest.contract.path.split('/'))),
    },
    ...manifest.files.map((file) => ({
      path: `payload/${file.path}`,
      bytes: readFileSync(join(artifactPath, 'payload', ...file.path.split('/'))),
    })),
  ].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);

  const digest = createHash('sha256');
  for (const entry of entries) {
    digest.update(`${entry.path}\0${entry.bytes.length}\0`);
    digest.update(entry.bytes);
    digest.update('\0');
  }
  return digest.digest('hex');
}

function writeManifest(artifactPath: string, manifest: HandoffManifest) {
  writeFileSync(join(artifactPath, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

beforeEach(() => {
  temporaryRoot = mkdtempSync(join(tmpdir(), 'desktop-v2-handoff-'));
  fixtureIndex = 0;
});

afterEach(() => {
  if (temporaryRoot) rmSync(temporaryRoot, { recursive: true, force: true });
  temporaryRoot = '';
});

describe('Desktop V2 offline handoff', () => {
  it('offline copied verification is byte-repeatable and omits unresolved font assets', () => {
    const fixture = createFixture();
    const first = join(temporaryRoot, 'export-a');
    const second = join(temporaryRoot, 'export-b');

    exportDesktopV2Handoff({ repoRoot: fixture.root, sourceSha: fixture.sourceSha, outputPath: first });
    exportDesktopV2Handoff({ repoRoot: fixture.root, sourceSha: fixture.sourceSha, outputPath: second });

    expect(artifactTree(first)).toEqual(artifactTree(second));
    const manifest = manifestAt(first);
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.sourceSha).toBe(fixture.sourceSha);
    expect(manifest.contract.path).toBe('contract/source-contract.json');
    expect(manifest.artifactDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.artifactDigestAlgorithm).toBe('sha256-path-size-content-v1');
    expect(manifest.artifactDigest).toBe(expectedArtifactDigest(first, manifest));
    const exportedContract = JSON.parse(readFileSync(join(first, 'contract/source-contract.json'), 'utf8'));
    expect(findPostSourceBindingFields(exportedContract)).toEqual([]);
    expect(readFileSync(join(first, 'payload', familySourcePath), 'utf8'))
      .toContain('.sk-button');

    const scopedTokens = readFileSync(join(first, 'payload', tokenCssPath), 'utf8');
    expect(scopedTokens).not.toMatch(/url\([^)]*Swansea/i);
    expect(manifest.files.some((file) => file.path === swanseaFontPath)).toBe(false);
    const tokenRecord = manifest.files.find((file) => file.path === tokenCssPath);
    expect(tokenRecord?.sourceMapPath).toBeTruthy();
    const tokenSourceMap = JSON.parse(
      readFileSync(join(first, tokenRecord!.sourceMapPath!), 'utf8'),
    ) as { transformation: string; removedRules: unknown[] };
    expect(tokenSourceMap.transformation).toBe(
      tokenSourceMap.removedRules.length > 0 ? 'remove-unresolved-font-face-rules' : 'identity',
    );
    expect(tokenSourceMap.removedRules).toHaveLength(1);

    const copied = join(temporaryRoot, 'detached-copy');
    cpSync(first, copied, { recursive: true });
    expect(verifyDesktopV2Handoff({ artifactPath: copied, mode: 'internal' }).authenticity)
      .toBe('internal-integrity-only');
    const independentlyPinnedDigest = expectedArtifactDigest(first, manifest);
    expect(verifyDesktopV2Handoff({
      artifactPath: copied,
      mode: 'approved-source',
      expectedSourceSha: fixture.sourceSha,
      expectedArtifactDigest: independentlyPinnedDigest,
    }).authenticity).toBe('independently-pinned-source');
    expect(() => verifyDesktopV2Handoff({ artifactPath: copied, mode: 'approved-source' }))
      .toThrow(/expected source SHA must|expected artifact digest must/i);

    const detachedWorkingDirectory = join(temporaryRoot, 'outside-git');
    mkdirSync(detachedWorkingDirectory);
    const cliResult = execFileSync(
      process.execPath,
      [verifierScript, '--artifact', copied, '--mode', 'internal'],
      { cwd: detachedWorkingDirectory, encoding: 'utf8' },
    );
    expect(cliResult).toMatch(/internal-integrity-only/);
  });

  it('committed blob provenance ignores dirty worktree bytes', () => {
    const fixture = createFixture();
    const committedBytes = readFileSync(join(fixture.root, ...familySourcePath.split('/')));
    writeFixtureFile(fixture.root, familySourcePath, '.sk-button { color: hotpink; }\n');
    const outputPath = join(temporaryRoot, 'dirty-export');

    exportDesktopV2Handoff({
      repoRoot: fixture.root,
      sourceSha: fixture.sourceSha,
      outputPath,
    });

    expect(readFileSync(join(outputPath, 'payload', familySourcePath))).toEqual(committedBytes);
  });

  it('source race rejection preserves committed blob bytes during mutation', () => {
    const fixture = createFixture();
    const committedFontBytes = readFileSync(join(fixture.root, ...interFontPath.split('/')));
    const outputPath = join(temporaryRoot, 'racing-export');
    let mutationObserved = false;

    exportDesktopV2Handoff({
      repoRoot: fixture.root,
      sourceSha: fixture.sourceSha,
      outputPath,
      onBeforeBlobRead: (path: string) => {
        if (path === familySourcePath) {
          writeFixtureFile(fixture.root, interFontPath, Buffer.from('mutated mid-export'));
          mutationObserved = true;
        }
      },
    });

    expect(mutationObserved).toBe(true);
    expect(readFileSync(join(outputPath, 'payload', interFontPath))).toEqual(committedFontBytes);
  });

  it('blocks unresolved redistribution rights and rejects unsafe source paths and symlinks', () => {
    const unknownFontContract = baseContract();
    unknownFontContract.sharedAssets.fontAssets.push({ family: 'Uncleared Font', sourcePath: 'fonts/uncleared.otf' });
    const unknownRights = createFixture({ contract: unknownFontContract });
    expect(() => exportDesktopV2Handoff({
      repoRoot: unknownRights.root,
      sourceSha: unknownRights.sourceSha,
      outputPath: join(temporaryRoot, 'unknown-rights'),
    })).toThrow(/Uncleared Font.*rights|rights.*Uncleared Font/i);

    const traversalContract = baseContract(['../outside.txt']);
    const traversal = createFixture({ contract: traversalContract });
    expect(() => exportDesktopV2Handoff({
      repoRoot: traversal.root,
      sourceSha: traversal.sourceSha,
      outputPath: join(temporaryRoot, 'traversal'),
    })).toThrow(/\.\.\/outside\.txt|path.*traversal/i);

    const symlink = createFixture({ sourceSymlink: true });
    expect(() => exportDesktopV2Handoff({
      repoRoot: symlink.root,
      sourceSha: symlink.sourceSha,
      outputPath: join(temporaryRoot, 'source-symlink'),
    })).toThrow(/symlink.*sk-button\.css|sk-button\.css.*symlink/i);
  });

  it('tamper matrix rejects ordinary payload changes in internal and pinned modes by path', () => {
    const fixture = createFixture();
    const outputPath = join(temporaryRoot, 'tamper-export');
    exportDesktopV2Handoff({ repoRoot: fixture.root, sourceSha: fixture.sourceSha, outputPath });
    const manifest = manifestAt(outputPath);
    const originalDigest = manifest.artifactDigest;
    writeFixtureFile(outputPath, `payload/${familySourcePath}`, '.sk-button { color: red; }\n');

    expect(() => verifyDesktopV2Handoff({ artifactPath: outputPath, mode: 'internal' }))
      .toThrow(new RegExp(familySourcePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    expect(() => verifyDesktopV2Handoff({
      artifactPath: outputPath,
      mode: 'approved-source',
      expectedSourceSha: fixture.sourceSha,
      expectedArtifactDigest: originalDigest,
    })).toThrow(/button\.css|artifact digest/i);
  });

  it('coordinated rehash is only internally consistent and fails independent pins', () => {
    const fixture = createFixture();
    const outputPath = join(temporaryRoot, 'coordinated-rehash');
    exportDesktopV2Handoff({ repoRoot: fixture.root, sourceSha: fixture.sourceSha, outputPath });
    const manifest = manifestAt(outputPath);
    const originalDigest = manifest.artifactDigest;
    const contractFile = join(outputPath, ...manifest.contract.path.split('/'));
    const changedContract = { ...JSON.parse(readFileSync(contractFile, 'utf8')), attackerNote: 'replacement' };
    const contractBytes = Buffer.from(`${JSON.stringify(changedContract, null, 2)}\n`);
    writeFileSync(contractFile, contractBytes);
    manifest.contract.sizeBytes = contractBytes.length;
    manifest.contract.sha256 = sha256(contractBytes);

    const modifiedPayload = join(outputPath, 'payload', ...familySourcePath.split('/'));
    const replacement = Buffer.from('.sk-button { color: blue; }\n');
    writeFileSync(modifiedPayload, replacement);
    const record = manifest.files.find((file) => file.path === familySourcePath)!;
    record.sizeBytes = replacement.length;
    record.sha256 = sha256(replacement);
    manifest.sourceSha = 'a'.repeat(40);
    manifest.artifactDigest = expectedArtifactDigest(outputPath, manifest);
    writeManifest(outputPath, manifest);

    expect(verifyDesktopV2Handoff({ artifactPath: outputPath, mode: 'internal' }).authenticity)
      .toBe('internal-integrity-only');
    expect(() => verifyDesktopV2Handoff({
      artifactPath: outputPath,
      mode: 'approved-source',
      expectedSourceSha: fixture.sourceSha,
      expectedArtifactDigest: originalDigest,
    })).toThrow(/approved source SHA mismatch/i);
  });

  it('rejects missing, extra, duplicate, case-colliding, traversing and symlinked payload paths', () => {
    const fixture = createFixture();

    const missing = join(temporaryRoot, 'missing-file');
    exportDesktopV2Handoff({ repoRoot: fixture.root, sourceSha: fixture.sourceSha, outputPath: missing });
    rmSync(join(missing, 'payload', ...familySourcePath.split('/')));
    expect(() => verifyDesktopV2Handoff({ artifactPath: missing, mode: 'internal' }))
      .toThrow(/missing.*sk-button\.css|sk-button\.css.*missing/i);

    const extra = join(temporaryRoot, 'extra-file');
    exportDesktopV2Handoff({ repoRoot: fixture.root, sourceSha: fixture.sourceSha, outputPath: extra });
    writeFixtureFile(extra, 'payload/unlisted.txt', 'extra\n');
    expect(() => verifyDesktopV2Handoff({ artifactPath: extra, mode: 'internal' }))
      .toThrow(/extra.*unlisted\.txt|unlisted\.txt.*extra/i);

    const duplicate = join(temporaryRoot, 'duplicate-path');
    exportDesktopV2Handoff({ repoRoot: fixture.root, sourceSha: fixture.sourceSha, outputPath: duplicate });
    const duplicateManifest = manifestAt(duplicate);
    duplicateManifest.files.push({ ...duplicateManifest.files.find((file) => file.path === familySourcePath)! });
    writeManifest(duplicate, duplicateManifest);
    expect(() => verifyDesktopV2Handoff({ artifactPath: duplicate, mode: 'internal' }))
      .toThrow(/duplicate.*sk-button\.css|sk-button\.css.*duplicate/i);

    const caseCollision = join(temporaryRoot, 'case-collision');
    exportDesktopV2Handoff({ repoRoot: fixture.root, sourceSha: fixture.sourceSha, outputPath: caseCollision });
    const collisionManifest = manifestAt(caseCollision);
    collisionManifest.files.push({
      ...collisionManifest.files.find((file) => file.path === familySourcePath)!,
      path: familySourcePath.toUpperCase(),
    });
    writeManifest(caseCollision, collisionManifest);
    expect(() => verifyDesktopV2Handoff({ artifactPath: caseCollision, mode: 'internal' }))
      .toThrow(/case-colliding.*sk-button|sk-button.*case-colliding/i);

    const traversal = join(temporaryRoot, 'artifact-traversal');
    exportDesktopV2Handoff({ repoRoot: fixture.root, sourceSha: fixture.sourceSha, outputPath: traversal });
    const traversalManifest = manifestAt(traversal);
    traversalManifest.files[0].path = '../outside.txt';
    writeManifest(traversal, traversalManifest);
    expect(() => verifyDesktopV2Handoff({ artifactPath: traversal, mode: 'internal' }))
      .toThrow(/\.\.\/outside\.txt|path.*traversal/i);

    const symlinked = join(temporaryRoot, 'artifact-symlink');
    exportDesktopV2Handoff({ repoRoot: fixture.root, sourceSha: fixture.sourceSha, outputPath: symlinked });
    const linkPath = join(symlinked, 'payload', 'link.txt');
    symlinkSync('LICENSE', linkPath);
    expect(() => verifyDesktopV2Handoff({ artifactPath: symlinked, mode: 'internal' }))
      .toThrow(/symlink.*link\.txt|link\.txt.*symlink/i);
  });

  it('components CI filter includes source-contract changes and wires contract/export checks', () => {
    const workflow = readFileSync(resolve(repoRoot, '.github/workflows/ci-quality.yml'), 'utf8');
    expect(workflow).toContain("- 'contracts/desktop-v2/**'");
    expect(workflow).toContain('node scripts/check-desktop-v2-contract.mjs');
    expect(workflow).toContain('node scripts/export-desktop-v2-handoff.mjs');
    expect(workflow).toContain('verify-desktop-v2-handoff.mjs');
  });

  it('post-source binding records the full source SHA outside the contract and carries no gate results', () => {
    const fixture = createFixture();
    const outputPath = join(temporaryRoot, 'post-source-binding');
    exportDesktopV2Handoff({ repoRoot: fixture.root, sourceSha: fixture.sourceSha, outputPath });

    const manifest = manifestAt(outputPath);
    const exportedContract = JSON.parse(readFileSync(join(outputPath, 'contract/source-contract.json'), 'utf8'));
    expect(manifest.sourceSha).toBe(fixture.sourceSha);
    expect(manifest.sourceSha).toMatch(/^[a-f0-9]{40}$/);
    expect(findPostSourceBindingFields(exportedContract)).toEqual([]);
    expect(manifest).not.toHaveProperty('gateResults');
    expect(manifest).not.toHaveProperty('axeResults');
  });
});
