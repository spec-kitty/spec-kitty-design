import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_CONTRACT_PATH = 'contracts/desktop-v2/source-contract.json';
const ROOT_LICENSE_PATH = 'LICENSE';
const MANIFEST_SCHEMA_VERSION = 1;
const ARTIFACT_DIGEST_ALGORITHM = 'sha256-path-size-content-v1';
const TOKEN_SOURCE_MAP_PATH = 'source-maps/tokens.css.source-map.json';
const MAX_BLOB_BYTES = 128 * 1024 * 1024;

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function assertRelativePath(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty relative path`);
  }
  if (value.includes('\\') || value.includes('\0') || /[\x00-\x1f\x7f]/.test(value)) {
    throw new Error(`${label} is not a normalized POSIX path: ${JSON.stringify(value)}`);
  }
  if (path.posix.isAbsolute(value) || /^[a-zA-Z]:/.test(value)) {
    throw new Error(`${label} must not be absolute: ${value}`);
  }
  if (value.split('/').some((part) => part === '' || part === '.' || part === '..')) {
    throw new Error(`${label} contains a path traversal or empty segment: ${value}`);
  }
  if (path.posix.normalize(value) !== value) {
    throw new Error(`${label} is not normalized: ${value}`);
  }
  return value;
}

function runGit(repoRoot, args, options = {}) {
  try {
    return execFileSync('git', ['-C', repoRoot, ...args], {
      encoding: options.encoding ?? null,
      maxBuffer: MAX_BLOB_BYTES,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const details = error.stderr?.toString('utf8').trim();
    throw new Error(`git ${args.join(' ')} failed${details ? `: ${details}` : ''}`);
  }
}

function validateCommit(repoRoot, sourceSha) {
  if (typeof sourceSha !== 'string' || !/^[a-f0-9]{40}$/.test(sourceSha)) {
    throw new Error(`source SHA must be a full 40-character lowercase Git SHA: ${sourceSha ?? '(missing)'}`);
  }
  const resolved = runGit(repoRoot, ['rev-parse', '--verify', `${sourceSha}^{commit}`], { encoding: 'utf8' }).trim();
  if (resolved !== sourceSha) throw new Error(`source SHA did not resolve to the requested full commit: ${sourceSha}`);
}

function readCommittedBlob(repoRoot, sourceSha, sourcePath, onBeforeBlobRead) {
  const normalizedPath = assertRelativePath(sourcePath, 'source path');
  if (onBeforeBlobRead) onBeforeBlobRead(normalizedPath);

  const listing = runGit(repoRoot, [
    'ls-tree', '-rz', '--full-tree', sourceSha, '--', `:(literal)${normalizedPath}`,
  ]);
  const records = listing.toString('utf8').split('\0').filter(Boolean);
  const entry = records.map((record) => {
    const separator = record.indexOf('\t');
    if (separator < 0) throw new Error(`invalid git tree record for ${normalizedPath}`);
    const [mode, type, objectId] = record.slice(0, separator).split(' ');
    return { mode, type, objectId, path: record.slice(separator + 1) };
  }).find((record) => record.path === normalizedPath);

  if (!entry) throw new Error(`committed source path is missing at ${sourceSha}: ${normalizedPath}`);
  if (entry.mode === '120000') throw new Error(`source path is a symlink: ${normalizedPath}`);
  if (!['100644', '100755'].includes(entry.mode) || entry.type !== 'blob') {
    throw new Error(`source path is not a regular committed file: ${normalizedPath}`);
  }
  return runGit(repoRoot, ['cat-file', 'blob', entry.objectId]);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseContract(bytes, sourceSha) {
  let contract;
  try {
    contract = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`source contract is invalid JSON at ${sourceSha}: ${error.message}`);
  }
  if (!isRecord(contract) || contract.schemaVersion !== 1 || !Array.isArray(contract.families) || !isRecord(contract.sharedAssets)) {
    throw new Error(`source contract has an unsupported or incomplete shape at ${sourceSha}`);
  }
  return contract;
}

function fontRightsFor(fontFamily, fontRights) {
  return fontRights.find((entry) => entry.matchType === 'exact' && entry.match === fontFamily)
    ?? fontRights.find((entry) => entry.matchType === 'prefix' && fontFamily.startsWith(entry.match));
}

function licenseIdForFont(fontFamily, spdx) {
  const slug = fontFamily.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const licenseSlug = spdx.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `license:${licenseSlug}:${slug}`;
}

function addPlanFile(plan, sourcePath, { role, familyId, licenseRef }) {
  const normalizedPath = assertRelativePath(sourcePath, 'contract source path');
  let record = plan.get(normalizedPath);
  if (!record) {
    record = { path: normalizedPath, roles: new Set(), familyIds: new Set(), licenseRefs: new Set() };
    plan.set(normalizedPath, record);
  }
  if (role) record.roles.add(role);
  if (familyId) record.familyIds.add(familyId);
  if (licenseRef) record.licenseRefs.add(licenseRef);
  return record;
}

function collectPlan(contract) {
  const errors = [];
  const plan = new Map();
  const licenses = new Map();
  const fontRights = contract.sharedAssets.fontRights;
  const fontAssets = contract.sharedAssets.fontAssets;
  const tokenCssPath = contract.sharedAssets.tokenStylesheetPath;

  if (!Array.isArray(contract.families) || contract.families.length === 0) errors.push('source contract has no primitive families');
  if (!Array.isArray(fontRights) || !Array.isArray(fontAssets) || typeof tokenCssPath !== 'string') {
    errors.push('sharedAssets must declare token CSS, font rights, and font assets');
  }
  if (errors.length) throw new Error(errors.join('\n'));

  const mitLicense = {
    id: 'license:repository-mit',
    spdx: 'MIT',
    basis: 'repository-license',
    evidencePaths: [`payload/${ROOT_LICENSE_PATH}`],
  };
  licenses.set(mitLicense.id, mitLicense);
  addPlanFile(plan, ROOT_LICENSE_PATH, { role: 'license-evidence', licenseRef: mitLicense.id });

  for (const family of contract.families) {
    if (!isRecord(family) || typeof family.id !== 'string' || !isRecord(family.sourceRights)) {
      throw new Error('each primitive family must declare its source rights');
    }
    const rights = family.sourceRights;
    if (rights.status !== 'cleared' || rights.spdx !== 'MIT' || rights.basis !== 'repository-license') {
      throw new Error(`${family.id} source rights are not cleared under the repository MIT license`);
    }
    if (!Array.isArray(rights.evidencePaths) || !rights.evidencePaths.includes(ROOT_LICENSE_PATH)) {
      throw new Error(`${family.id} source rights must cite ${ROOT_LICENSE_PATH}`);
    }
    if (!Array.isArray(rights.coveredPaths) || rights.coveredPaths.length === 0) {
      throw new Error(`${family.id} source rights have no covered source paths`);
    }
    for (const sourcePath of rights.coveredPaths) {
      addPlanFile(plan, sourcePath, {
        role: 'primitive-source',
        familyId: family.id,
        licenseRef: mitLicense.id,
      });
    }
    for (const evidencePath of rights.evidencePaths) {
      addPlanFile(plan, evidencePath, { role: 'license-evidence', licenseRef: mitLicense.id });
    }
  }

  const unresolvedRights = fontRights.filter((entry) => entry.status !== 'cleared');
  for (const entry of unresolvedRights) {
    if (entry.status !== 'unresolved' || entry.match !== 'Swansea' || entry.matchType !== 'exact') {
      throw new Error(`font rights are not resolved for ${entry.match ?? '(unknown family)'}`);
    }
  }
  if (unresolvedRights.length && contract.sharedAssets.fullTokenExport?.status !== 'blocked') {
    throw new Error('full token stylesheet export must remain blocked while font redistribution rights are unresolved');
  }
  if (!unresolvedRights.length && contract.sharedAssets.fullTokenExport?.status === 'blocked') {
    throw new Error('full token stylesheet export is still marked blocked despite cleared font rights');
  }

  const unresolvedFamilies = new Set(unresolvedRights.map((entry) => entry.match));
  const fontFiles = [];
  const embeddedLicenseRefs = [];
  const unresolvedFontAssets = [];
  for (const asset of fontAssets) {
    if (!isRecord(asset) || typeof asset.family !== 'string' || typeof asset.sourcePath !== 'string') {
      throw new Error('font asset entries must name a family and committed source path');
    }
    const rights = fontRightsFor(asset.family, fontRights);
    if (!rights) throw new Error(`font asset ${asset.family} has no rights finding: ${asset.sourcePath}`);
    if (rights.status === 'unresolved') {
      if (!unresolvedFamilies.has(asset.family)) {
        throw new Error(`font asset ${asset.family} has unresolved rights: ${asset.sourcePath}`);
      }
      unresolvedFontAssets.push({ family: asset.family, sourcePath: assertRelativePath(asset.sourcePath, 'font asset source path') });
      continue;
    }
    if (rights.status !== 'cleared' || !rights.spdx || !Array.isArray(rights.evidencePaths) || rights.evidencePaths.length === 0) {
      throw new Error(`font asset ${asset.family} has incomplete license evidence: ${asset.sourcePath}`);
    }

    const licenseRef = licenseIdForFont(asset.family, rights.spdx);
    const artifactEvidencePaths = [];
    if (rights.basis === 'license-file') {
      for (const evidencePath of rights.evidencePaths) {
        assertRelativePath(evidencePath, `${asset.family} license evidence path`);
        addPlanFile(plan, evidencePath, { role: 'license-evidence', licenseRef });
        artifactEvidencePaths.push(`payload/${evidencePath}`);
      }
    } else if (rights.basis === 'embedded-font-license') {
      if (!rights.evidencePaths.includes(tokenCssPath)) {
        throw new Error(`${asset.family} embedded font license must cite ${tokenCssPath}`);
      }
      embeddedLicenseRefs.push({ family: asset.family, spdx: rights.spdx, licenseRef, sourcePath: tokenCssPath });
      artifactEvidencePaths.push(`payload/${TOKEN_SOURCE_MAP_PATH}#licenseEvidence/${encodeURIComponent(asset.family)}`);
    } else {
      throw new Error(`${asset.family} uses unsupported license evidence basis: ${rights.basis ?? '(missing)'}`);
    }

    licenses.set(licenseRef, {
      id: licenseRef,
      fontFamily: asset.family,
      spdx: rights.spdx,
      basis: rights.basis,
      evidencePaths: artifactEvidencePaths,
    });
    addPlanFile(plan, asset.sourcePath, { role: 'font-asset', licenseRef });
    fontFiles.push({ family: asset.family, sourcePath: asset.sourcePath, licenseRef });
  }

  addPlanFile(plan, tokenCssPath, {
    role: 'token-stylesheet',
    licenseRef: mitLicense.id,
  });
  for (const license of licenses.values()) {
    if (license.fontFamily && !fontFiles.some((font) => font.family === license.fontFamily)) continue;
    if (license.fontFamily) addPlanFile(plan, tokenCssPath, { role: 'token-stylesheet', licenseRef: license.id });
  }

  return {
    plan,
    licenses,
    fontFiles,
    unresolvedFontAssets,
    unresolvedFontFamilies: [...unresolvedFamilies].sort(compareStrings),
    embeddedLicenseRefs: [...new Map(embeddedLicenseRefs.map((entry) => [entry.licenseRef, entry])).values()],
    tokenCssPath,
  };
}

function maskCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
}

function parseFontFaceRules(source) {
  const syntax = maskCssComments(source);
  const found = [];
  const rulePattern = /@font-face\s*\{[^{}]*\}/gi;
  for (const match of syntax.matchAll(rulePattern)) {
    const syntaxRule = match[0];
    const start = match.index ?? 0;
    const end = start + syntaxRule.length;
    const rule = source.slice(start, end);
    const familyMatch = syntaxRule.match(/font-family\s*:\s*([^;]+);/i);
    if (!familyMatch) throw new Error(`token stylesheet has an @font-face rule without font-family: ${rule.slice(0, 80)}`);
    const family = familyMatch[1].trim().replace(/^(['"])(.*)\1$/, '$2');
    found.push({
      family,
      start,
      end,
      rule,
      lineStart: source.slice(0, start).split('\n').length,
      lineEnd: source.slice(0, end).split('\n').length,
      urls: [...syntaxRule.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)].map((url) => url[2]),
    });
  }
  const declaredRuleCount = [...syntax.matchAll(/@font-face\s*\{/gi)].length;
  if (found.length !== declaredRuleCount) throw new Error('token stylesheet has an unparseable @font-face rule');
  return found;
}

function scopedTokenStylesheet(sourceBytes, sourcePath, sourceSha, unresolvedFamilies, unresolvedFontAssets, fontFiles, embeddedLicenses) {
  const source = sourceBytes.toString('utf8');
  const rules = parseFontFaceRules(source);
  const unresolved = new Set(unresolvedFamilies.map((family) => family.toLowerCase()));
  const removedRules = rules.filter((rule) => unresolved.has(rule.family.toLowerCase()));
  if (unresolved.size && removedRules.length === 0) {
    throw new Error(`token stylesheet has no @font-face rule to omit for ${unresolvedFamilies.join(', ')}`);
  }

  const removedAssetPaths = new Set(removedRules.flatMap((rule) => rule.urls
    .map((url) => path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), url)))));
  const excludedAssetPaths = new Set(unresolvedFontAssets.map((font) => font.sourcePath));
  for (const assetPath of excludedAssetPaths) {
    if (!removedAssetPaths.has(assetPath)) {
      throw new Error(`unresolved font asset has no excluded @font-face source mapping: ${assetPath}`);
    }
  }
  for (const assetPath of removedAssetPaths) {
    if (!excludedAssetPaths.has(assetPath)) {
      throw new Error(`token stylesheet excludes an unmapped font asset: ${assetPath}`);
    }
  }

  let scoped = source;
  for (const rule of [...removedRules].sort((a, b) => b.start - a.start)) {
    scoped = `${scoped.slice(0, rule.start)}${scoped.slice(rule.end)}`;
  }

  const sourceDir = path.posix.dirname(sourcePath);
  const includedFonts = new Set(fontFiles.map((font) => font.sourcePath));
  const unresolvedAssetPaths = new Set();
  for (const font of unresolvedFontAssets) unresolvedAssetPaths.add(font.sourcePath);
  const scopedSyntax = maskCssComments(scoped);
  for (const match of scopedSyntax.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
    const reference = match[2].trim();
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) {
      throw new Error(`token stylesheet contains a non-local font URL: ${reference}`);
    }
    const resolvedPath = path.posix.normalize(path.posix.join(sourceDir, reference));
    assertRelativePath(resolvedPath, 'token font URL source path');
    if (unresolvedAssetPaths.has(resolvedPath)) {
      throw new Error(`scoped token stylesheet still references unresolved font asset: ${resolvedPath}`);
    }
    if (!includedFonts.has(resolvedPath)) {
      throw new Error(`token stylesheet references a font asset absent from the cleared closure: ${resolvedPath}`);
    }
  }

  const licenseEvidence = embeddedLicenses.map((entry) => {
    const evidenceFamily = entry.family.startsWith('Falling Sky ') ? 'Falling Sky' : entry.family;
    const marker = `${evidenceFamily} is OFL 1.1`;
    if (!new RegExp(`${evidenceFamily.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} is OFL 1\\.1`, 'i').test(source)) {
      throw new Error(`${entry.family} embedded license evidence is missing from ${sourcePath}`);
    }
    return {
      family: entry.family,
      spdx: entry.spdx,
      evidenceMarker: marker,
      sourcePath,
    };
  }).sort((a, b) => compareStrings(a.family, b.family));

  const outputBytes = Buffer.from(scoped, 'utf8');
  const sourceMap = {
    schemaVersion: 1,
    sourceSha,
    sourcePath,
    sourceSizeBytes: sourceBytes.length,
    sourceSha256: sha256(sourceBytes),
    outputPath: sourcePath,
    outputSizeBytes: outputBytes.length,
    outputSha256: sha256(outputBytes),
    transformation: removedRules.length ? 'remove-unresolved-font-face-rules' : 'identity',
    removedRules: removedRules.map((rule) => ({
      family: rule.family,
      sourceLineStart: rule.lineStart,
      sourceLineEnd: rule.lineEnd,
      sourceSha256: sha256(Buffer.from(rule.rule, 'utf8')),
      fontAssetPaths: rule.urls.map((url) => path.posix.normalize(path.posix.join(sourceDir, url))).sort(compareStrings),
    })).sort((a, b) => compareStrings(a.family, b.family) || a.sourceLineStart - b.sourceLineStart),
    excludedFontAssets: unresolvedFontAssets.map(({ family, sourcePath: assetPath }) => ({ family, sourcePath: assetPath }))
      .sort((a, b) => compareStrings(a.sourcePath, b.sourcePath)),
    includedFontAssets: fontFiles.map(({ family, sourcePath: assetPath }) => ({ family, sourcePath: assetPath }))
      .sort((a, b) => compareStrings(a.sourcePath, b.sourcePath)),
    licenseEvidence,
  };
  return { outputBytes, sourceMapBytes: Buffer.from(`${JSON.stringify(sourceMap, null, 2)}\n`) };
}

function computeArtifactDigest(contractPath, contractBytes, payloadFiles) {
  const entries = [
    { path: contractPath, bytes: contractBytes },
    ...payloadFiles.map((file) => ({ path: `payload/${file.path}`, bytes: file.bytes })),
  ].sort((a, b) => compareStrings(a.path, b.path));
  const digest = createHash('sha256');
  for (const entry of entries) {
    digest.update(`${entry.path}\0${entry.bytes.length}\0`);
    digest.update(entry.bytes);
    digest.update('\0');
  }
  return digest.digest('hex');
}

function outputPathIsOccupied(outputPath) {
  try {
    lstatSync(outputPath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function writeArtifactFile(root, relativePath, bytes) {
  const normalizedPath = assertRelativePath(relativePath, 'artifact output path');
  const target = path.join(root, ...normalizedPath.split('/'));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, bytes, { flag: 'wx', mode: 0o644 });
}

export function exportDesktopV2Handoff({
  repoRoot = process.cwd(),
  sourceSha,
  outputPath,
  contractPath = SOURCE_CONTRACT_PATH,
  onBeforeBlobRead,
} = {}) {
  const absoluteRepoRoot = path.resolve(repoRoot);
  const normalizedContractPath = assertRelativePath(contractPath, 'contract path');
  const absoluteOutputPath = outputPath ? path.resolve(outputPath) : '';
  if (!absoluteOutputPath) throw new Error('output path is required');
  if (typeof onBeforeBlobRead !== 'undefined' && typeof onBeforeBlobRead !== 'function') {
    throw new Error('onBeforeBlobRead must be a function when provided');
  }
  validateCommit(absoluteRepoRoot, sourceSha);

  const contractBytes = readCommittedBlob(absoluteRepoRoot, sourceSha, normalizedContractPath);
  const contract = parseContract(contractBytes, sourceSha);
  const closure = collectPlan(contract);
  const payloadFiles = [];
  let tokenSourceMapPath = null;
  let tokenSourceSha256 = null;

  for (const sourcePath of [...closure.plan.keys()].sort(compareStrings)) {
    const committedBytes = readCommittedBlob(absoluteRepoRoot, sourceSha, sourcePath, onBeforeBlobRead);
    const planned = closure.plan.get(sourcePath);
    let outputBytes = committedBytes;
    let sourceMapPath;
    let derivation;
    if (sourcePath === closure.tokenCssPath) {
      const transformed = scopedTokenStylesheet(
        committedBytes,
        sourcePath,
        sourceSha,
        closure.unresolvedFontFamilies,
        closure.unresolvedFontAssets,
        closure.fontFiles,
        closure.embeddedLicenseRefs,
      );
      outputBytes = transformed.outputBytes;
      if (closure.unresolvedFontFamilies.length) {
        tokenSourceMapPath = TOKEN_SOURCE_MAP_PATH;
        tokenSourceSha256 = sha256(committedBytes);
        sourceMapPath = `payload/${TOKEN_SOURCE_MAP_PATH}`;
        derivation = 'scoped-token-css';
        payloadFiles.push({
          path: TOKEN_SOURCE_MAP_PATH,
          sourcePath,
          bytes: transformed.sourceMapBytes,
          roles: ['source-map'],
          familyIds: [],
          licenseRefs: ['license:repository-mit'],
        });
      }
    }
    payloadFiles.push({
      path: sourcePath,
      sourcePath,
      bytes: outputBytes,
      roles: [...planned.roles].sort(compareStrings),
      familyIds: [...planned.familyIds].sort(compareStrings),
      licenseRefs: [...planned.licenseRefs].sort(compareStrings),
      ...(derivation ? { derivation } : {}),
      ...(sourceMapPath ? { sourceMapPath } : {}),
    });
  }

  if (tokenSourceMapPath) {
    const embeddedLicenseId = closure.embeddedLicenseRefs.find((entry) => entry.family === 'Falling Sky')?.licenseRef;
    const mapRecord = payloadFiles.find((file) => file.path === tokenSourceMapPath);
    if (!mapRecord) throw new Error('scoped token stylesheet source map was not generated');
    if (embeddedLicenseId) {
      const tokenRecord = payloadFiles.find((file) => file.path === closure.tokenCssPath);
      tokenRecord.licenseRefs = [...new Set([...tokenRecord.licenseRefs, embeddedLicenseId])].sort(compareStrings);
    }
  }

  payloadFiles.sort((a, b) => compareStrings(a.path, b.path));
  const fileRecords = payloadFiles.map((file) => ({
    path: file.path,
    sourcePath: file.sourcePath,
    roles: file.roles,
    familyIds: file.familyIds,
    sizeBytes: file.bytes.length,
    sha256: sha256(file.bytes),
    licenseRefs: file.licenseRefs,
    ...(file.derivation ? { derivation: file.derivation } : {}),
    ...(file.sourceMapPath ? { sourceMapPath: file.sourceMapPath } : {}),
  }));
  const licenseRecords = [...closure.licenses.values()].map((license) => ({ ...license }))
    .sort((a, b) => compareStrings(a.id, b.id));
  const manifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    sourceSha,
    contract: {
      path: 'contract/source-contract.json',
      sourcePath: normalizedContractPath,
      sizeBytes: contractBytes.length,
      sha256: sha256(contractBytes),
      licenseRefs: ['license:repository-mit'],
    },
    files: fileRecords,
    licenses: licenseRecords,
    ...(tokenSourceMapPath ? {
      scopedTokenStylesheet: {
        path: `payload/${closure.tokenCssPath}`,
        sourceMapPath: `payload/${tokenSourceMapPath}`,
        sourceSha256: tokenSourceSha256,
      },
    } : {}),
    artifactDigestAlgorithm: ARTIFACT_DIGEST_ALGORITHM,
    artifactDigest: computeArtifactDigest('contract/source-contract.json', contractBytes, payloadFiles),
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);

  if (outputPathIsOccupied(absoluteOutputPath)) {
    throw new Error(`output path already exists; refusing to overwrite it: ${absoluteOutputPath}`);
  }
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  const stagingPath = mkdtempSync(path.join(path.dirname(absoluteOutputPath), `.${path.basename(absoluteOutputPath)}.tmp-`));
  try {
    writeArtifactFile(stagingPath, 'contract/source-contract.json', contractBytes);
    for (const file of payloadFiles) writeArtifactFile(stagingPath, `payload/${file.path}`, file.bytes);
    writeArtifactFile(stagingPath, 'manifest.json', manifestBytes);
    renameSync(stagingPath, absoluteOutputPath);
  } catch (error) {
    rmSync(stagingPath, { recursive: true, force: true });
    throw error;
  }

  return {
    outputPath: absoluteOutputPath,
    sourceSha,
    artifactDigest: manifest.artifactDigest,
    fileCount: fileRecords.length,
    manifest,
  };
}

function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === '--help' || flag === '-h') result.help = true;
    else if (['--repo-root', '--source-sha', '--output', '--contract-path'].includes(flag)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
      const key = {
        '--repo-root': 'repoRoot',
        '--source-sha': 'sourceSha',
        '--output': 'outputPath',
        '--contract-path': 'contractPath',
      }[flag];
      result[key] = value;
      index += 1;
    } else {
      throw new Error(`unknown option: ${flag}`);
    }
  }
  return result;
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log('Usage: node scripts/export-desktop-v2-handoff.mjs --source-sha <full-commit-sha> --output <new-directory> [--repo-root <path>] [--contract-path <path>]');
      return;
    }
    const result = exportDesktopV2Handoff(args);
    console.log(`Desktop V2 handoff exported from ${result.sourceSha}`);
    console.log(`Artifact digest: ${result.artifactDigest}`);
    console.log(`Payload files: ${result.fileCount}`);
    console.log(`Output: ${result.outputPath}`);
  } catch (error) {
    console.error(`Desktop V2 handoff export failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
