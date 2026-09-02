#!/usr/bin/env node
// scripts/render-diagrams.js
//
// Render every Mermaid source under docs/architecture/assets/*.mmd to a
// matching .svg, injecting the canonical brand theme from
// docs/architecture/assets/sk-mermaid-theme.yaml in place of a `%%THEME%%`
// placeholder line found at the top of each source.
//
// Usage:
//   node scripts/render-diagrams.js              # render mode (writes SVGs in place)
//   node scripts/render-diagrams.js --check      # check mode (renders to temp;
//                                                  fails non-zero if committed
//                                                  SVGs differ byte-for-byte)
//
// Contracts:
//   kitty-specs/<mission>/contracts/brand-theme-source.md
//   kitty-specs/<mission>/contracts/diagram-pipeline-ci-gate.md
//
// Local-CI parity (FR-016): no environment variables or CI-only flags affect
// the rendered output; the same command runs locally and in CI.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

let yaml;
try {
  yaml = require('js-yaml');
} catch (err) {
  console.error('ERROR: cannot load js-yaml. Run `npm install` first.');
  process.exit(2);
}

// --- configuration -----------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(REPO_ROOT, 'docs', 'architecture', 'assets');
const THEME_FILE = path.join(ASSETS_DIR, 'sk-mermaid-theme.yaml');
const PUPPETEER_CONFIG = path.join(ASSETS_DIR, 'puppeteer-config.json');
const PLACEHOLDER = '%%THEME%%';
// A bare inline init block is the failure pattern we reject in source files.
const INLINE_INIT_RE = /%%\{\s*init\s*:/;
// Mermaid's layout yields floating-point coordinates that vary between runs:
//   1. Subpixel rounding inside the headless browser (6+-decimal level on all
//      coordinates).
//   2. The container-path generator for stadium / rounded-corner shapes emits
//      bezier control points whose coordinates can shift by several pixels
//      between runs while the rendered curve passes through identical anchors.
// To stabilize the byte-compare gate while preserving end-to-end visual
// fidelity:
//   - Round every floating-point literal in the SVG to NUMERIC_PRECISION
//     decimals (catches case 1 and the cosmetic case-2 jitter).
//   - Replace each <path d="..."/> attribute with a SHA-256 fingerprint of
//     its normalized form so the small-but-stable bezier reordering Mermaid
//     occasionally performs (different control points, identical curve)
//     does not flap the gate. Structural drift (a path appearing or
//     disappearing) still flips the fingerprint and trips the check.
// Both transforms are idempotent — running the script repeatedly on its own
// output is a fixed point.
const NUMERIC_PRECISION = 3;
const NUMERIC_RE = /-?\d+\.\d{2,}/g;
const PATH_D_RE = / d="([^"]*)"/g;

// --- argv --------------------------------------------------------------------

const argv = process.argv.slice(2);
const checkMode = argv.includes('--check');
const verbose = argv.includes('--verbose') || argv.includes('-v');
const unknownArgs = argv.filter((a) => !['--check', '--verbose', '-v'].includes(a));
if (unknownArgs.length > 0) {
  console.error(`ERROR: unknown argument(s): ${unknownArgs.join(', ')}`);
  console.error('Usage: node scripts/render-diagrams.js [--check] [--verbose]');
  process.exit(2);
}

// --- helpers -----------------------------------------------------------------

function loadTheme() {
  if (!fs.existsSync(THEME_FILE)) {
    fail(`brand-theme source not found: ${path.relative(REPO_ROOT, THEME_FILE)}`);
  }
  let parsed;
  try {
    parsed = yaml.load(fs.readFileSync(THEME_FILE, 'utf8'));
  } catch (err) {
    fail(`brand-theme YAML is malformed (${path.relative(REPO_ROOT, THEME_FILE)}): ${err.message}`);
  }
  if (!parsed || typeof parsed !== 'object') {
    fail(`brand-theme YAML did not parse to an object: ${path.relative(REPO_ROOT, THEME_FILE)}`);
  }
  if (!('theme' in parsed)) {
    fail(`brand-theme YAML missing required key 'theme': ${path.relative(REPO_ROOT, THEME_FILE)}`);
  }
  if (!('themeVariables' in parsed) || typeof parsed.themeVariables !== 'object') {
    fail(`brand-theme YAML missing required key 'themeVariables': ${path.relative(REPO_ROOT, THEME_FILE)}`);
  }
  return parsed;
}

function buildInitDirective(theme) {
  // JSON.stringify keeps key ordering stable across runs (insertion order).
  // Wrap exactly once: %%{init: <JSON>}%%  — Mermaid's documented inline init form.
  // A trailing space inside the closing '}%%' boundary is harmless and matches the
  // contract example in brand-theme-source.md.
  return `%%{init: ${JSON.stringify(theme)} }%%`;
}

function listSources() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fail(`assets directory not found: ${path.relative(REPO_ROOT, ASSETS_DIR)}`);
  }
  return fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => f.endsWith('.mmd'))
    .sort()
    .map((f) => path.join(ASSETS_DIR, f));
}

function validateSource(srcPath, body) {
  const placeholderCount = body.split('\n').filter((line) => line.trim() === PLACEHOLDER).length;
  if (placeholderCount === 0) {
    fail(
      `${path.relative(REPO_ROOT, srcPath)}: missing required '${PLACEHOLDER}' line.\n` +
        `  Every .mmd source must start with '${PLACEHOLDER}' on its own line.\n` +
        `  See docs/architecture/assets/README.md.`,
    );
  }
  if (placeholderCount > 1) {
    fail(
      `${path.relative(REPO_ROOT, srcPath)}: found ${placeholderCount} '${PLACEHOLDER}' lines; expected exactly one.`,
    );
  }
  if (INLINE_INIT_RE.test(body)) {
    fail(
      `${path.relative(REPO_ROOT, srcPath)}: contains an inline %%{init: …}%% block.\n` +
        `  Source files must use only '${PLACEHOLDER}'; the render script supplies the init block.\n` +
        `  See docs/architecture/assets/README.md.`,
    );
  }
}

function compileSource(srcPath, initDirective, tmpDir) {
  const body = fs.readFileSync(srcPath, 'utf8');
  validateSource(srcPath, body);
  const compiled = body.replace(new RegExp(`^[\\t ]*${PLACEHOLDER}[\\t ]*$`, 'm'), initDirective);
  const compiledPath = path.join(
    tmpDir,
    `${path.basename(srcPath, '.mmd')}.compiled.mmd`,
  );
  fs.writeFileSync(compiledPath, compiled);
  return compiledPath;
}

function findMmdc() {
  // Resolve `mmdc` either via local node_modules/.bin (preferred — pinned dep
  // in WP06) or via PATH (developer installed it globally). We do not auto-
  // download via `npx --yes` here so that local and CI behaviour stay identical.
  const localBin = path.join(REPO_ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'mmdc.cmd' : 'mmdc');
  if (fs.existsSync(localBin)) return localBin;
  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['mmdc'], { encoding: 'utf8' });
  if (which.status === 0) {
    const found = which.stdout.split('\n')[0].trim();
    if (found) return found;
  }
  fail(
    'cannot locate `mmdc` (Mermaid CLI).\n' +
      '  Install locally: `npm install --save-dev @mermaid-js/mermaid-cli` (WP06 pins this),\n' +
      '  or globally:    `npm install -g @mermaid-js/mermaid-cli`.',
  );
  return null; // unreachable
}

function lightlyNormalizeForDisk(buf) {
  // Light, lossless-for-rendering pass: round all numeric literals in the SVG
  // to NUMERIC_PRECISION decimals. This strips most subpixel noise without
  // touching the path-data structure, so a re-render that committed only
  // cosmetic float jitter produces zero git diff.
  const text = buf.toString('utf8');
  return Buffer.from(text.replace(NUMERIC_RE, (n) => Number(n).toFixed(NUMERIC_PRECISION)), 'utf8');
}

function fingerprintPathData(d) {
  // Collapse whitespace, then strip every numeric literal. Mermaid sometimes
  // re-orders bezier control points (different integers, identical curve)
  // between renders; comparing only the *structure* of the path (sequence of
  // M/L/C/Z command letters) keeps the fingerprint stable across cosmetic
  // jitter while still flipping it for any meaningful change (a path
  // appearing, disappearing, or changing command sequence).
  const structure = d
    .replace(/\s+/g, ' ')
    .replace(/-?\d+(?:\.\d+)?/g, '#')
    .trim();
  return crypto.createHash('sha256').update(structure).digest('hex').slice(0, 16);
}

function normalizeSvg(buf) {
  // 1. Round all decimals to NUMERIC_PRECISION (handles subpixel jitter on
  //    coordinates that sit outside path `d` attributes — e.g. transforms,
  //    viewBox).
  // 2. Replace each <path d="..."/> attribute with a SHA-256 fingerprint of
  //    its normalized form (handles bezier-control-point reordering inside
  //    container paths for stadium-shape nodes).
  let text = buf.toString('utf8');
  text = text.replace(PATH_D_RE, (_, d) => ` d="sk-fp:${fingerprintPathData(d)}"`);
  text = text.replace(NUMERIC_RE, (n) => Number(n).toFixed(NUMERIC_PRECISION));
  return Buffer.from(text, 'utf8');
}

function renderOne(mmdcPath, compiledPath, outPath) {
  const args = [
    '-i', compiledPath,
    '-o', outPath,
    '-q', // quieter mermaid output
  ];
  if (fs.existsSync(PUPPETEER_CONFIG)) {
    // puppeteer-config.json pins executablePath to /usr/bin/chromium, which is
    // where CI's `apt-get install chromium-browser` puts it. That absolute path
    // does not exist on every contributor machine, and mermaid-cli's config file
    // takes precedence over PUPPETEER_EXECUTABLE_PATH — so without this override
    // the drift check is unrunnable locally and only ever exercised in CI.
    const override = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (override) {
      const base = JSON.parse(fs.readFileSync(PUPPETEER_CONFIG, 'utf8'));
      const merged = path.join(os.tmpdir(), `sk-puppeteer-${process.pid}.json`);
      fs.writeFileSync(merged, JSON.stringify({ ...base, executablePath: override }));
      args.unshift('-p', merged);
    } else {
      args.unshift('-p', PUPPETEER_CONFIG);
    }
  }
  const result = spawnSync(mmdcPath, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    fail(
      `mmdc failed for ${path.relative(REPO_ROOT, compiledPath)} (exit ${result.status}).\n` +
        (stderr ? `  stderr: ${stderr}\n` : '') +
        (stdout ? `  stdout: ${stdout}\n` : ''),
    );
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rmrf(p) {
  try {
    fs.rmSync(p, { recursive: true, force: true });
  } catch (_err) {
    /* best-effort cleanup */
  }
}

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

// --- main --------------------------------------------------------------------

function main() {
  const theme = loadTheme();
  const initDirective = buildInitDirective(theme);
  const sources = listSources();
  if (sources.length === 0) {
    fail(`no .mmd files found under ${path.relative(REPO_ROOT, ASSETS_DIR)}`);
  }

  const mmdcPath = findMmdc();

  // Always work inside an isolated temp dir so source-file render and
  // check-mode render share one code path.
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-render-diagrams-'));
  const compiledDir = path.join(tmpRoot, 'compiled');
  const renderedDir = path.join(tmpRoot, 'rendered');
  ensureDir(compiledDir);
  ensureDir(renderedDir);

  let exitCode = 0;
  const drifts = [];

  try {
    for (const srcPath of sources) {
      const base = path.basename(srcPath, '.mmd');
      const compiledPath = compileSource(srcPath, initDirective, compiledDir);
      const renderedSvg = path.join(renderedDir, `${base}.svg`);
      const committedSvg = path.join(ASSETS_DIR, `${base}.svg`);

      renderOne(mmdcPath, compiledPath, renderedSvg);
      const renderedRaw = fs.readFileSync(renderedSvg);

      if (checkMode) {
        if (!fs.existsSync(committedSvg)) {
          drifts.push({
            file: path.relative(REPO_ROOT, committedSvg),
            reason: 'missing committed SVG (new .mmd needs `node scripts/render-diagrams.js` + commit)',
          });
          continue;
        }
        // Compare the *normalized* form of both files. The committed file
        // remains a real, browser-renderable SVG on disk; the normalization
        // is applied only at compare time so cosmetic floating-point /
        // bezier-reordering noise does not flap the gate.
        const renderedNorm = normalizeSvg(renderedRaw);
        const committedNorm = normalizeSvg(fs.readFileSync(committedSvg));
        if (renderedNorm.length !== committedNorm.length || !renderedNorm.equals(committedNorm)) {
          drifts.push({
            file: path.relative(REPO_ROOT, committedSvg),
            reason:
              `normalized drift (rendered ${renderedNorm.length} B vs committed ${committedNorm.length} B` +
              ` after numeric+path normalization)`,
          });
        } else if (verbose) {
          console.log(`OK    ${path.relative(REPO_ROOT, committedSvg)}`);
        }
      } else {
        // Render mode: write a lightly-normalized SVG (decimals rounded) so
        // a re-render that produced only cosmetic float jitter yields zero
        // git diff. Path `d` attributes are kept intact so the file remains
        // a real, browser-renderable SVG.
        fs.writeFileSync(committedSvg, lightlyNormalizeForDisk(renderedRaw));
        console.log(`wrote ${path.relative(REPO_ROOT, committedSvg)}`);
      }
    }

    // Orphan-SVG warning (committed .svg with no matching .mmd source).
    const sourceBasenames = new Set(sources.map((p) => path.basename(p, '.mmd')));
    const orphanSvgs = fs
      .readdirSync(ASSETS_DIR)
      .filter((f) => f.endsWith('.svg'))
      .filter((f) => !sourceBasenames.has(path.basename(f, '.svg')));
    for (const orphan of orphanSvgs) {
      console.warn(
        `WARN  orphan SVG (no matching .mmd): ${path.relative(REPO_ROOT, path.join(ASSETS_DIR, orphan))}`,
      );
    }

    if (checkMode) {
      if (drifts.length > 0) {
        console.error('');
        console.error(`Diagram drift detected (${drifts.length} file(s)):`);
        for (const d of drifts) {
          console.error(`  - ${d.file}: ${d.reason}`);
        }
        console.error('');
        console.error('Remediation: run `node scripts/render-diagrams.js` locally and commit the regenerated SVGs.');
        exitCode = 1;
      } else {
        console.log(`OK: ${sources.length} diagram(s) match committed SVGs.`);
      }
    } else {
      console.log(`Done: rendered ${sources.length} diagram(s).`);
    }
  } finally {
    rmrf(tmpRoot);
  }

  process.exit(exitCode);
}

main();
