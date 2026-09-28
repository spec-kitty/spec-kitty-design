import { createHash } from 'node:crypto';
import {
  lstatSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MANIFEST_SCHEMA_VERSION = 1;
const ARTIFACT_DIGEST_ALGORITHM = 'sha256-path-size-content-v1';
const SOURCE_CONTRACT_PATH = 'contracts/desktop-v2/source-contract.json';
const ROOT_LICENSE_PATH = 'LICENSE';
const TOKEN_SOURCE_MAP_PATH = 'source-maps/tokens.css.source-map.json';
const EXPECTED_ARTIFACT_ENTRIES = ['contract', 'manifest.json', 'payload'];
const EXPECTED_CONTRACT_ENTRIES = ['source-contract.json'];

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
  if (path.posix.normalize(value) !== value) throw new Error(`${label} is not normalized: ${value}`);
  return value;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireRegularFile(root, relativePath, label) {
  const normalizedPath = assertRelativePath(relativePath, label);
  let current = root;
  const parts = normalizedPath.split('/');
  for (let index = 0; index < parts.length; index += 1) {
    current = path.join(current, parts[index]);
    let metadata;
    try {
      metadata = lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') throw new Error(`${label} is missing: ${normalizedPath}`);
      throw error;
    }
    if (metadata.isSymbolicLink()) throw new Error(`${label} is a symlink: ${normalizedPath}`);
    if (index < parts.length - 1 && !metadata.isDirectory()) {
      throw new Error(`${label} has a non-directory parent: ${normalizedPath}`);
    }
    if (index === parts.length - 1 && !metadata.isFile()) {
      throw new Error(`${label} is not a regular file: ${normalizedPath}`);
    }
  }
  return readFileSync(current);
}

function requireDirectory(root, relativePath, label) {
  const normalizedPath = assertRelativePath(relativePath, label);
  let current = root;
  for (const segment of normalizedPath.split('/')) {
    current = path.join(current, segment);
    let metadata;
    try {
      metadata = lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') throw new Error(`${label} is missing: ${normalizedPath}`);
      throw error;
    }
    if (metadata.isSymbolicLink()) throw new Error(`${label} is a symlink: ${normalizedPath}`);
    if (!metadata.isDirectory()) throw new Error(`${label} is not a directory: ${normalizedPath}`);
  }
  return current;
}

function walkPayload(payloadRoot) {
  const files = [];
  const walk = (directory, prefix = '') => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      assertRelativePath(relativePath, 'payload path');
      const absolutePath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`payload path is a symlink: ${relativePath}`);
      if (entry.isDirectory()) walk(absolutePath, relativePath);
      else if (entry.isFile()) files.push(relativePath);
      else throw new Error(`payload path is not a regular file or directory: ${relativePath}`);
    }
  };
  walk(payloadRoot);
  return files.sort(compareStrings);
}

function assertExactEntries(directory, expected, label) {
  const actual = readdirSync(directory).sort(compareStrings);
  const expectedSorted = [...expected].sort(compareStrings);
  if (actual.length !== expectedSorted.length || actual.some((entry, index) => entry !== expectedSorted[index])) {
    const extra = actual.filter((entry) => !expectedSorted.includes(entry));
    const missing = expectedSorted.filter((entry) => !actual.includes(entry));
    if (extra.length) throw new Error(`${label} has extra entry: ${extra[0]}`);
    if (missing.length) throw new Error(`${label} is missing entry: ${missing[0]}`);
    throw new Error(`${label} entries do not match the artifact format`);
  }
}

function assertDigest(value, label) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${label} must be a 64-character lowercase SHA-256 digest`);
  }
}

function assertSourceSha(value, label) {
  if (typeof value !== 'string' || !/^[a-f0-9]{40}$/.test(value)) {
    throw new Error(`${label} must be a full 40-character lowercase Git SHA`);
  }
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

function expectedApprovedLicenses(contract) {
  if (!isRecord(contract.sharedAssets)
    || !Array.isArray(contract.sharedAssets.fontAssets)
    || !Array.isArray(contract.sharedAssets.fontRights)) {
    throw new Error('pinned source contract does not declare font assets and rights');
  }

  const expected = new Map([['license:repository-mit', {
    id: 'license:repository-mit',
    spdx: 'MIT',
    basis: 'repository-license',
    evidencePaths: [`payload/${ROOT_LICENSE_PATH}`],
  }]]);

  for (const asset of contract.sharedAssets.fontAssets) {
    if (!isRecord(asset) || typeof asset.family !== 'string') {
      throw new Error('pinned source contract has an invalid font asset');
    }
    const rights = fontRightsFor(asset.family, contract.sharedAssets.fontRights);
    if (!rights) throw new Error(`pinned source contract has no font rights for ${asset.family}`);
    if (rights.status !== 'cleared') continue;
    if (typeof rights.spdx !== 'string' || typeof rights.basis !== 'string' || !Array.isArray(rights.evidencePaths)) {
      throw new Error(`pinned source contract has incomplete font rights for ${asset.family}`);
    }

    let evidencePaths;
    if (rights.basis === 'license-file') {
      evidencePaths = rights.evidencePaths.map((evidencePath) =>
        `payload/${assertRelativePath(evidencePath, `license evidence path for ${asset.family}`)}`);
    } else if (rights.basis === 'embedded-font-license') {
      evidencePaths = [`payload/${TOKEN_SOURCE_MAP_PATH}#licenseEvidence/${encodeURIComponent(asset.family)}`];
    } else {
      throw new Error(`pinned source contract has unsupported font license basis for ${asset.family}: ${rights.basis}`);
    }

    const id = licenseIdForFont(asset.family, rights.spdx);
    expected.set(id, {
      id,
      fontFamily: asset.family,
      spdx: rights.spdx,
      basis: rights.basis,
      evidencePaths,
    });
  }

  return [...expected.values()].sort((left, right) => compareStrings(left.id, right.id));
}

function expectedApprovedFileLicenseRefs(contract) {
  if (!isRecord(contract.sharedAssets)
    || !Array.isArray(contract.sharedAssets.fontAssets)
    || !Array.isArray(contract.sharedAssets.fontRights)
    || typeof contract.sharedAssets.tokenStylesheetPath !== 'string'
    || !Array.isArray(contract.families)) {
    throw new Error('pinned source contract has incomplete file provenance mappings');
  }

  const expected = new Map();
  const add = (sourcePath, licenseRef) => {
    const normalizedPath = assertRelativePath(sourcePath, `pinned source path for ${licenseRef}`);
    if (!expected.has(normalizedPath)) expected.set(normalizedPath, new Set());
    expected.get(normalizedPath).add(licenseRef);
  };

  add(ROOT_LICENSE_PATH, 'license:repository-mit');
  for (const family of contract.families) {
    if (!isRecord(family) || !isRecord(family.sourceRights)
      || !Array.isArray(family.sourceRights.coveredPaths)
      || !Array.isArray(family.sourceRights.evidencePaths)) {
      throw new Error('pinned source contract has incomplete family source rights');
    }
    for (const sourcePath of family.sourceRights.coveredPaths) add(sourcePath, 'license:repository-mit');
    for (const evidencePath of family.sourceRights.evidencePaths) add(evidencePath, 'license:repository-mit');
  }

  const tokenCssPath = assertRelativePath(contract.sharedAssets.tokenStylesheetPath, 'pinned token stylesheet path');
  add(tokenCssPath, 'license:repository-mit');
  let hasUnresolvedFontRights = false;
  for (const asset of contract.sharedAssets.fontAssets) {
    if (!isRecord(asset) || typeof asset.family !== 'string' || typeof asset.sourcePath !== 'string') {
      throw new Error('pinned source contract has an invalid font asset');
    }
    const rights = fontRightsFor(asset.family, contract.sharedAssets.fontRights);
    if (!rights) throw new Error(`pinned source contract has no font rights for ${asset.family}`);
    if (rights.status !== 'cleared') {
      hasUnresolvedFontRights = true;
      continue;
    }

    const licenseRef = licenseIdForFont(asset.family, rights.spdx);
    add(asset.sourcePath, licenseRef);
    if (rights.basis === 'license-file') {
      for (const evidencePath of rights.evidencePaths) add(evidencePath, licenseRef);
    }
    add(tokenCssPath, licenseRef);
  }
  if (hasUnresolvedFontRights) add(TOKEN_SOURCE_MAP_PATH, 'license:repository-mit');

  return new Map([...expected].map(([sourcePath, licenseRefs]) => [
    sourcePath,
    [...licenseRefs].sort(compareStrings),
  ]));
}

function validateApprovedScopedSourceMap(manifest, contract, artifactRoot) {
  const tokenCssPath = contract.sharedAssets.tokenStylesheetPath;
  const tokenCssFile = manifest.files.find((file) => file.path === tokenCssPath);
  if (!tokenCssFile) throw new Error(`manifest token stylesheet is missing: ${tokenCssPath}`);

  const hasUnresolvedFontRights = contract.sharedAssets.fontRights.some((rights) => rights.status !== 'cleared');
  const sourceMapPath = `payload/${TOKEN_SOURCE_MAP_PATH}`;
  const sourceMapFile = manifest.files.find((file) => file.path === TOKEN_SOURCE_MAP_PATH);
  if (!hasUnresolvedFontRights) {
    if (sourceMapFile || tokenCssFile.derivation !== undefined || tokenCssFile.sourceMapPath !== undefined
      || manifest.scopedTokenStylesheet !== undefined) {
      throw new Error('manifest declares scoped token provenance absent from the pinned source contract');
    }
    return;
  }

  if (tokenCssFile.derivation !== 'scoped-token-css' || tokenCssFile.sourceMapPath !== sourceMapPath) {
    throw new Error(`manifest token stylesheet derivation or source map mismatch for ${tokenCssPath}`);
  }
  if (!sourceMapFile) throw new Error(`manifest token stylesheet source map is missing: ${TOKEN_SOURCE_MAP_PATH}`);
  const scoped = manifest.scopedTokenStylesheet;
  if (!isRecord(scoped) || scoped.path !== `payload/${tokenCssPath}` || scoped.sourceMapPath !== sourceMapPath) {
    throw new Error('manifest scoped token stylesheet paths do not match the pinned source contract');
  }

  const sourceMapBytes = requireRegularFile(artifactRoot, sourceMapPath, 'token stylesheet source map');
  const sourceMap = parseJson(sourceMapBytes, 'token stylesheet source map');
  if (!isRecord(sourceMap) || sourceMap.schemaVersion !== 1
    || sourceMap.sourceSha !== manifest.sourceSha
    || sourceMap.sourcePath !== tokenCssPath
    || sourceMap.outputPath !== tokenCssPath) {
    throw new Error('token stylesheet source map provenance does not match the pinned source contract');
  }
  assertDigest(sourceMap.sourceSha256, 'token stylesheet source digest in source map');
  assertDigest(sourceMap.outputSha256, 'token stylesheet output digest in source map');
  if (scoped.sourceSha256 !== sourceMap.sourceSha256) {
    throw new Error('manifest scoped token source digest does not match its source map');
  }
  if (sourceMap.outputSha256 !== tokenCssFile.sha256 || sourceMap.outputSizeBytes !== tokenCssFile.sizeBytes) {
    throw new Error('token stylesheet output metadata does not match its source map');
  }
}

function validateApprovedSourceBindings(manifest, contract, artifactRoot) {
  if (manifest.contract.sourcePath !== SOURCE_CONTRACT_PATH) {
    throw new Error(`manifest source contract provenance mismatch: expected ${SOURCE_CONTRACT_PATH}, got ${manifest.contract.sourcePath}`);
  }
  if (manifest.contract.licenseRefs.length !== 1 || manifest.contract.licenseRefs[0] !== 'license:repository-mit') {
    throw new Error('manifest source contract license references do not match the repository MIT license');
  }

  const expectedLicenses = expectedApprovedLicenses(contract);
  const expectedFileLicenseRefs = expectedApprovedFileLicenseRefs(contract);
  const tokenCssPath = contract.sharedAssets.tokenStylesheetPath;
  for (const file of manifest.files) {
    const expectedSourcePath = file.path === TOKEN_SOURCE_MAP_PATH ? tokenCssPath : file.path;
    if (!expectedFileLicenseRefs.has(file.path)) {
      throw new Error(`manifest payload path has no pinned source contract mapping: ${file.path}`);
    }
    if (file.sourcePath !== expectedSourcePath) {
      throw new Error(`manifest source path mismatch for ${file.path}: pinned source contract expects ${expectedSourcePath}, got ${file.sourcePath}`);
    }
    const expectedLicenseRefs = expectedFileLicenseRefs.get(file.path);
    if (file.licenseRefs.length !== expectedLicenseRefs.length
      || file.licenseRefs.some((licenseRef, index) => licenseRef !== expectedLicenseRefs[index])) {
      throw new Error(`manifest license references do not match the pinned source contract for ${file.path}`);
    }
    if (file.path !== tokenCssPath && (file.derivation !== undefined || file.sourceMapPath !== undefined)) {
      throw new Error(`manifest declares unexpected source derivation metadata for ${file.path}`);
    }
  }
  validateApprovedScopedSourceMap(manifest, contract, artifactRoot);

  if (manifest.licenses.length !== expectedLicenses.length) {
    throw new Error(`manifest license rights do not match the pinned source contract: expected ${expectedLicenses.length}, got ${manifest.licenses.length}`);
  }
  for (let index = 0; index < expectedLicenses.length; index += 1) {
    const expected = expectedLicenses[index];
    const actual = manifest.licenses[index];
    if (actual.id !== expected.id) {
      throw new Error(`manifest license rights do not match the pinned source contract: expected ${expected.id}, got ${actual.id}`);
    }
    if (actual.spdx !== expected.spdx) {
      throw new Error(`manifest license SPDX mismatch for ${expected.id}: source contract expects ${expected.spdx}, manifest has ${actual.spdx}`);
    }
    if (actual.basis !== expected.basis) {
      throw new Error(`manifest license rights basis mismatch for ${expected.id}: source contract expects ${expected.basis}, manifest has ${actual.basis}`);
    }
    if (actual.fontFamily !== expected.fontFamily) {
      throw new Error(`manifest license rights font family mismatch for ${expected.id}`);
    }
    if (actual.evidencePaths.length !== expected.evidencePaths.length
      || actual.evidencePaths.some((evidencePath, pathIndex) => evidencePath !== expected.evidencePaths[pathIndex])) {
      throw new Error(`manifest license rights evidence mismatch for ${expected.id}`);
    }
  }
}

function collectSelfBindingFields(value, prefix = '') {
  if (!isRecord(value) && !Array.isArray(value)) return [];
  const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
  const found = [];
  for (const [key, child] of entries) {
    const field = Array.isArray(value) ? `${prefix}[${key}]` : `${prefix}${prefix ? '.' : ''}${key}`;
    if (!Array.isArray(value) && /^(?:source)?(?:sha|digest|timestamp|axeResults?|gateResults?)$/i.test(key)) {
      found.push(field);
    }
    found.push(...collectSelfBindingFields(child, field));
  }
  return found;
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
}

function artifactDigest(contractPath, contractBytes, files, artifactRoot) {
  const entries = [
    { path: contractPath, bytes: contractBytes },
    ...files.map((file) => ({
      path: `payload/${file.path}`,
      bytes: requireRegularFile(artifactRoot, `payload/${file.path}`, 'payload file'),
    })),
  ].sort((a, b) => compareStrings(a.path, b.path));

  const digest = createHash('sha256');
  for (const entry of entries) {
    digest.update(`${entry.path}\0${entry.bytes.length}\0`);
    digest.update(entry.bytes);
    digest.update('\0');
  }
  return digest.digest('hex');
}

function validateFileRecord(file, seenPaths, caseFoldedPaths, listedPaths, knownLicenses) {
  if (!isRecord(file)) throw new Error('manifest has a non-object file record');
  const normalizedPath = assertRelativePath(file.path, 'manifest file path');
  if (seenPaths.has(normalizedPath)) throw new Error(`duplicate manifest payload path: ${normalizedPath}`);
  seenPaths.add(normalizedPath);
  const folded = normalizedPath.toLowerCase();
  const priorCasePath = caseFoldedPaths.get(folded);
  if (priorCasePath) throw new Error(`case-colliding payload paths: ${priorCasePath} and ${normalizedPath}`);
  caseFoldedPaths.set(folded, normalizedPath);
  listedPaths.push(normalizedPath);

  assertRelativePath(file.sourcePath, `source path for ${normalizedPath}`);
  if (!Number.isSafeInteger(file.sizeBytes) || file.sizeBytes < 0) {
    throw new Error(`manifest byte size is invalid for ${normalizedPath}`);
  }
  assertDigest(file.sha256, `manifest file digest for ${normalizedPath}`);
  if (!Array.isArray(file.roles) || !file.roles.length || file.roles.some((role) => typeof role !== 'string')) {
    throw new Error(`manifest role list is invalid for ${normalizedPath}`);
  }
  if (!Array.isArray(file.familyIds) || file.familyIds.some((familyId) => typeof familyId !== 'string')) {
    throw new Error(`manifest family list is invalid for ${normalizedPath}`);
  }
  if (!Array.isArray(file.licenseRefs) || !file.licenseRefs.length) {
    throw new Error(`manifest license references are missing for ${normalizedPath}`);
  }
  for (const licenseRef of file.licenseRefs) {
    if (typeof licenseRef !== 'string' || !knownLicenses.has(licenseRef)) {
      throw new Error(`unknown license reference for ${normalizedPath}: ${licenseRef}`);
    }
  }
  if (file.sourceMapPath !== undefined) {
    const sourceMapPath = assertRelativePath(file.sourceMapPath, `source map path for ${normalizedPath}`);
    if (!sourceMapPath.startsWith('payload/')) {
      throw new Error(`source map path for ${normalizedPath} must point inside payload: ${sourceMapPath}`);
    }
  }
}

function validateManifestMetadata(manifest, contract, actualPayloadPaths) {
  if (!isRecord(manifest) || manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    throw new Error(`manifest schemaVersion must be ${MANIFEST_SCHEMA_VERSION}`);
  }
  assertSourceSha(manifest.sourceSha, 'manifest source SHA');
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) throw new Error('manifest files must be a non-empty array');
  if (!Array.isArray(manifest.licenses) || manifest.licenses.length === 0) throw new Error('manifest licenses must be a non-empty array');
  if (manifest.artifactDigestAlgorithm !== ARTIFACT_DIGEST_ALGORITHM) {
    throw new Error(`unsupported artifact digest algorithm: ${manifest.artifactDigestAlgorithm ?? '(missing)'}`);
  }
  assertDigest(manifest.artifactDigest, 'manifest artifact digest');

  if (!isRecord(manifest.contract)) throw new Error('manifest contract record is missing');
  if (manifest.contract.path !== 'contract/source-contract.json') {
    throw new Error(`manifest contract path is not canonical: ${manifest.contract.path ?? '(missing)'}`);
  }
  assertRelativePath(manifest.contract.sourcePath, 'manifest source contract path');
  if (!Number.isSafeInteger(manifest.contract.sizeBytes) || manifest.contract.sizeBytes < 0) {
    throw new Error('manifest source contract byte size is invalid');
  }
  assertDigest(manifest.contract.sha256, 'manifest source contract digest');
  if (!Array.isArray(manifest.contract.licenseRefs) || !manifest.contract.licenseRefs.includes('license:repository-mit')) {
    throw new Error('manifest source contract must reference the repository MIT license');
  }

  const knownLicenses = new Set();
  let previousLicenseId = '';
  const evidencePaths = [];
  for (const license of manifest.licenses) {
    if (!isRecord(license) || typeof license.id !== 'string' || typeof license.spdx !== 'string' || typeof license.basis !== 'string') {
      throw new Error('manifest has an incomplete license record');
    }
    if (knownLicenses.has(license.id)) throw new Error(`duplicate manifest license id: ${license.id}`);
    if (previousLicenseId && compareStrings(previousLicenseId, license.id) >= 0) {
      throw new Error('manifest license records are not in canonical order');
    }
    previousLicenseId = license.id;
    knownLicenses.add(license.id);
    if (!Array.isArray(license.evidencePaths) || license.evidencePaths.length === 0) {
      throw new Error(`manifest license has no evidence path: ${license.id}`);
    }
    for (const evidencePath of license.evidencePaths) {
      if (typeof evidencePath !== 'string') throw new Error(`manifest license evidence path is invalid: ${license.id}`);
      const [artifactPath] = evidencePath.split('#', 1);
      const normalizedPath = assertRelativePath(artifactPath, `license evidence path for ${license.id}`);
      if (!normalizedPath.startsWith('payload/')) {
        throw new Error(`license evidence path must point inside payload: ${normalizedPath}`);
      }
      evidencePaths.push(normalizedPath.slice('payload/'.length));
    }
  }
  if (!knownLicenses.has('license:repository-mit')) throw new Error('repository MIT license record is missing');

  const seenPaths = new Set();
  const caseFoldedPaths = new Map();
  const listedPaths = [];
  for (const file of manifest.files) validateFileRecord(file, seenPaths, caseFoldedPaths, listedPaths, knownLicenses);
  const sortedPaths = [...listedPaths].sort(compareStrings);
  if (listedPaths.some((value, index) => value !== sortedPaths[index])) {
    throw new Error('manifest file records are not in canonical path order');
  }

  const actualSet = new Set(actualPayloadPaths);
  for (const filePath of listedPaths) {
    if (!actualSet.has(filePath)) throw new Error(`missing payload file: ${filePath}`);
  }
  for (const filePath of actualPayloadPaths) {
    if (!seenPaths.has(filePath)) throw new Error(`extra payload file: ${filePath}`);
  }

  for (const evidencePath of evidencePaths) {
    if (!seenPaths.has(evidencePath)) throw new Error(`license evidence file is absent from manifest: ${evidencePath}`);
  }
  for (const file of manifest.files) {
    if (file.sourceMapPath && !seenPaths.has(file.sourceMapPath.slice('payload/'.length))) {
      throw new Error(`source map file is absent from manifest: ${file.sourceMapPath}`);
    }
  }
  if (manifest.scopedTokenStylesheet !== undefined) {
    const scoped = manifest.scopedTokenStylesheet;
    if (!isRecord(scoped)) throw new Error('scoped token stylesheet record is invalid');
    const tokenPath = assertRelativePath(scoped.path, 'scoped token stylesheet path');
    const sourceMapPath = assertRelativePath(scoped.sourceMapPath, 'scoped token stylesheet source map path');
    if (!tokenPath.startsWith('payload/') || !sourceMapPath.startsWith('payload/')) {
      throw new Error('scoped token stylesheet references must point inside payload');
    }
    if (!seenPaths.has(tokenPath.slice('payload/'.length)) || !seenPaths.has(sourceMapPath.slice('payload/'.length))) {
      throw new Error('scoped token stylesheet or its source map is absent from manifest');
    }
    assertDigest(scoped.sourceSha256, 'scoped token source digest');
  }

  if (!isRecord(contract) || contract.schemaVersion !== 1 || !Array.isArray(contract.families)) {
    throw new Error('source contract has an unsupported or incomplete shape');
  }
  const selfBindingFields = collectSelfBindingFields(contract);
  if (selfBindingFields.length) {
    throw new Error(`source contract must not contain post-source binding fields: ${selfBindingFields.join(', ')}`);
  }
}

export function verifyDesktopV2Handoff({
  artifactPath,
  mode,
  expectedSourceSha,
  expectedArtifactDigest,
} = {}) {
  if (!artifactPath) throw new Error('artifact directory is required');
  if (!['internal', 'approved-source'].includes(mode)) {
    throw new Error('verification mode must be explicitly internal or approved-source');
  }
  const absoluteArtifactPath = path.resolve(artifactPath);
  const rootMetadata = lstatSync(absoluteArtifactPath);
  if (rootMetadata.isSymbolicLink() || !rootMetadata.isDirectory()) {
    throw new Error(`artifact root is not a regular directory: ${absoluteArtifactPath}`);
  }
  assertExactEntries(absoluteArtifactPath, EXPECTED_ARTIFACT_ENTRIES, 'artifact root');

  const manifestBytes = requireRegularFile(absoluteArtifactPath, 'manifest.json', 'manifest');
  const contractBytes = requireRegularFile(absoluteArtifactPath, 'contract/source-contract.json', 'source contract');
  const payloadRoot = requireDirectory(absoluteArtifactPath, 'payload', 'payload directory');
  const contractRoot = requireDirectory(absoluteArtifactPath, 'contract', 'contract directory');
  assertExactEntries(contractRoot, EXPECTED_CONTRACT_ENTRIES, 'contract directory');

  const manifest = parseJson(manifestBytes, 'manifest');
  const contract = parseJson(contractBytes, 'source contract');
  const actualPayloadPaths = walkPayload(payloadRoot);
  validateManifestMetadata(manifest, contract, actualPayloadPaths);

  if (contractBytes.length !== manifest.contract.sizeBytes) {
    throw new Error(`source contract byte size mismatch: expected ${manifest.contract.sizeBytes}, got ${contractBytes.length}`);
  }
  const actualContractDigest = sha256(contractBytes);
  if (actualContractDigest !== manifest.contract.sha256) {
    throw new Error(`source contract digest mismatch: expected ${manifest.contract.sha256}, got ${actualContractDigest}`);
  }

  for (const file of manifest.files) {
    const bytes = requireRegularFile(absoluteArtifactPath, `payload/${file.path}`, 'payload file');
    if (bytes.length !== file.sizeBytes) {
      throw new Error(`payload byte size mismatch for ${file.path}: expected ${file.sizeBytes}, got ${bytes.length}`);
    }
    const actualDigest = sha256(bytes);
    if (actualDigest !== file.sha256) {
      throw new Error(`payload digest mismatch for ${file.path}: expected ${file.sha256}, got ${actualDigest}`);
    }
  }

  const actualArtifactDigest = artifactDigest(manifest.contract.path, contractBytes, manifest.files, absoluteArtifactPath);
  if (actualArtifactDigest !== manifest.artifactDigest) {
    throw new Error(`artifact digest mismatch: expected ${manifest.artifactDigest}, got ${actualArtifactDigest}`);
  }

  if (mode === 'approved-source') {
    assertSourceSha(expectedSourceSha, 'expected source SHA');
    assertDigest(expectedArtifactDigest, 'expected artifact digest');
    if (manifest.sourceSha !== expectedSourceSha) {
      throw new Error(`approved source SHA mismatch: expected ${expectedSourceSha}, manifest names ${manifest.sourceSha}`);
    }
    if (manifest.artifactDigest !== expectedArtifactDigest) {
      throw new Error(`approved artifact digest mismatch: expected ${expectedArtifactDigest}, manifest names ${manifest.artifactDigest}`);
    }
    validateApprovedSourceBindings(manifest, contract, absoluteArtifactPath);
  }

  return {
    mode,
    authenticity: mode === 'approved-source' ? 'independently-pinned-source' : 'internal-integrity-only',
    sourceSha: manifest.sourceSha,
    artifactDigest: manifest.artifactDigest,
    fileCount: manifest.files.length,
  };
}

function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === '--help' || flag === '-h') result.help = true;
    else if (['--artifact', '--mode', '--expected-source-sha', '--expected-artifact-digest'].includes(flag)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
      const key = {
        '--artifact': 'artifactPath',
        '--mode': 'mode',
        '--expected-source-sha': 'expectedSourceSha',
        '--expected-artifact-digest': 'expectedArtifactDigest',
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
      console.log('Usage: node scripts/verify-desktop-v2-handoff.mjs --artifact <directory> --mode <internal|approved-source> [--expected-source-sha <full-sha> --expected-artifact-digest <sha256>]');
      return;
    }
    const result = verifyDesktopV2Handoff(args);
    console.log(`Verified ${result.authenticity}: ${result.fileCount} payload files`);
    console.log(`Source SHA: ${result.sourceSha}`);
    console.log(`Artifact digest: ${result.artifactDigest}`);
  } catch (error) {
    console.error(`Desktop V2 handoff verification failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
