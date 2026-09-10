// Shared harness for #314's cross-sheet `::part()` probes.
//
// Deliberately a near-copy of
// `kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/harness.mjs`, because this
// record extends ADR-15 and its evidence should be readable side by side with ADR-15's. Two jobs
// and no more:
//
//  1. Serve the repository over HTTP so a browser loads the REAL built artifacts. Two routes:
//       /pkg/<specifier>  -> resolved through Node's own export-map resolution
//                            (`import.meta.resolve`), so a static exemplar links literally the
//                            file an installed consumer's `@spec-kitty/styles/<name>/sk-<name>.css`
//                            resolves to. Every resolution is recorded in the result.
//       /<repo path>      -> a plain file read under the repository root.
//  2. Launch Playwright per engine and hand each probe a page. WebKit is ATTEMPTED and its
//     failure recorded verbatim rather than omitted — ADR-10's recorded host gap.
//
// It carries no assertions and no per-probe knowledge.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

export const MEASUREMENT_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolvePath(MEASUREMENT_DIR, '..', '..', '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
};

/** Export-map resolution of a bare specifier, recorded so the result record can cite it. */
export const resolvePackageSpecifier = (specifier) =>
  fileURLToPath(import.meta.resolve(specifier));

export const startServer = async () => {
  const resolvedSpecifiers = {};
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let filePath;
      if (url.pathname.startsWith('/pkg/')) {
        const specifier = decodeURIComponent(url.pathname.slice('/pkg/'.length));
        filePath = resolvePackageSpecifier(specifier);
        resolvedSpecifiers[specifier] = filePath;
      } else {
        filePath = join(REPO_ROOT, decodeURIComponent(url.pathname));
        if (!filePath.startsWith(REPO_ROOT)) throw new Error('path escape');
      }
      const ext = filePath.slice(filePath.lastIndexOf('.'));
      const body = await readFile(filePath);
      res.writeHead(200, { 'content-type': MIME[ext] ?? 'application/octet-stream' });
      res.end(body);
    } catch (error) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end(String(error?.message ?? error));
    }
  });
  // Port 0 — a kernel-assigned free port. Sibling agents contend for 6006; this probe never
  // touches it, and never touches the shared Storybook.
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    resolvedSpecifiers,
    close: () => new Promise((done) => server.close(done)),
  };
};

export const ENGINES = { chromium, firefox, webkit };

/**
 * Run `fn(page, engineName)` once per engine.
 *
 * An engine that cannot LAUNCH is recorded as `{ __unmeasurable: <message> }` rather than
 * dropped, so the result record shows the gap instead of hiding it.
 */
export const perEngine = async (fn) => {
  const out = {};
  for (const [name, launcher] of Object.entries(ENGINES)) {
    let browser;
    try {
      browser = await launcher.launch();
    } catch (error) {
      out[name] = { __unmeasurable: String(error?.message ?? error).split("\n").map((l) => l.replace(/[^\x20-\x7e]/g, "").trim()).filter(Boolean).slice(0, 3).join(" / ") };
      continue;
    }
    try {
      const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
      const page = await context.newPage();
      // The engine BUILD is recorded next to its values. A record that prints a version in prose
      // and nowhere in its evidence is asking to be trusted about the one thing it did not measure.
      out[name] = { version: browser.version(), outcomes: await fn(page, name) };
      await context.close();
    } finally {
      await browser.close();
    }
  }
  return out;
};
