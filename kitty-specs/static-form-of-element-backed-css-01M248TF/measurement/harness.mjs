// Shared harness for this mission's three FR-008 probes.
//
// It does two jobs and deliberately no more:
//
//  1. Serves the repository over HTTP so a browser can load the REAL built artifacts —
//     `packages/tokens/dist/tokens.css`, the Storybook-built elements bundle, and the
//     built component CSS. Two route shapes exist:
//       /pkg/<specifier>  -> resolved through Node's own export-map resolution
//                            (`import.meta.resolve`), so the bytes a static exemplar
//                            links are literally the file `@spec-kitty/styles/<name>/
//                            sk-<name>.css` resolves to for an installed consumer.
//                            This is what makes FR-004 a real package-consumption
//                            measurement rather than a source read.
//       /<repo path>      -> a plain file read under the repository root.
//  2. Launches Playwright (chromium and firefox, the two engines ADR-9/ADR-10
//     confirmations already use here) and hands each probe a page.
//
// It contains no assertions and no per-construct knowledge. Each construct's run.mjs
// owns its own pages, its own outcome capture and its own verdict logic.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { chromium, firefox } from 'playwright';

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
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    resolvedSpecifiers,
    close: () => new Promise((done) => server.close(done)),
  };
};

export const ENGINES = { chromium, firefox };

/** Run `fn(page)` once per engine and return { chromium: ..., firefox: ... }. */
export const perEngine = async (fn) => {
  const out = {};
  for (const [name, launcher] of Object.entries(ENGINES)) {
    const browser = await launcher.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
      const page = await context.newPage();
      out[name] = await fn(page, name);
      await context.close();
    } finally {
      await browser.close();
    }
  }
  return out;
};

/** The construct's own directory, served over HTTP. */
export const measurementUrl = (origin, construct, file) =>
  `${origin}/kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/${construct}/${file}`;

/** Compare two per-engine outcome maps and produce the contract's observed_outcomes rows. */
export const diffOutcomes = (declared, shadow, statics) =>
  declared.map((d) => {
    const row = {
      id: d.id,
      description: d.description,
      viewport_or_state: d.viewport_or_state,
      shadow_form_value: shadow[d.id],
      static_exemplar_value: {},
      equal: {},
    };
    for (const [variant, values] of Object.entries(statics)) {
      row.static_exemplar_value[variant] = values[d.id];
      row.equal[variant] = JSON.stringify(values[d.id]) === JSON.stringify(shadow[d.id]);
    }
    return row;
  });
