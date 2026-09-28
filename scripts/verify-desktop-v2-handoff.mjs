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
