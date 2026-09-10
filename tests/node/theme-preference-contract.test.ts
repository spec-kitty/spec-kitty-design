import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, test, vi } from 'vitest';

const bootstrapPath = 'packages/elements/theme-bootstrap.js';

const runBootstrap = (options: {
  stored?: string | null;
  storageThrows?: boolean;
  systemDark?: boolean;
  matchMediaThrows?: boolean;
  document?: boolean;
}) => {
  const root = { dataset: {} as { theme?: string }, style: { colorScheme: '' } };
  const sandbox: Record<string, unknown> = {};
  if (options.document !== false) sandbox['document'] = { documentElement: root };
  if (options.matchMediaThrows) {
    sandbox['matchMedia'] = () => { throw new Error('media query unavailable'); };
  } else if (options.systemDark !== undefined) {
    sandbox['matchMedia'] = () => ({ matches: options.systemDark });
  }
  if (options.storageThrows) {
    Object.defineProperty(sandbox, 'localStorage', {
      get() { throw new Error('storage denied'); },
    });
  } else {
    sandbox['localStorage'] = { getItem: () => options.stored ?? null };
  }
  runInNewContext(readFileSync(bootstrapPath, 'utf8'), sandbox);
  return root;
};

test('publishes one DOM-free theme preference contract and bootstrap export', async () => {
  const api = (await import('../../packages/elements/src/theme-toggle/theme-preference.js')) as Record<string, unknown>;

  expect(api['THEME_STORAGE_KEY']).toBe('spec-kitty-theme');
  expect(api['isThemePreference']).toBeTypeOf('function');
  expect(api['readThemePreference']).toBeTypeOf('function');
  expect(api['resolveTheme']).toBeTypeOf('function');
  expect(api['applyResolvedTheme']).toBeTypeOf('function');
});

test('the DOM-free contract owns validation, fallback, resolution, and both root signals', async () => {
  const {
    applyResolvedTheme,
    readThemePreference,
    resolveTheme,
    writeThemePreference,
  } = await import('../../packages/elements/src/theme-toggle/theme-preference.js');
  const getItem = vi.fn();
  const setItem = vi.fn();
  const storage = { getItem, setItem };

  getItem.mockReturnValueOnce('dark').mockReturnValueOnce('sepia').mockImplementationOnce(() => {
    throw new Error('storage denied');
  });
  expect(readThemePreference(storage)).toBe('dark');
  expect(readThemePreference(storage)).toBe('system');
  expect(readThemePreference(storage)).toBe('system');
  expect(readThemePreference()).toBe('system');
  expect(resolveTheme('system', false)).toBe('light');
  expect(resolveTheme('system', true)).toBe('dark');
  expect(resolveTheme('light', true)).toBe('light');
  expect(resolveTheme('dark', false)).toBe('dark');

  const root = { dataset: {}, style: { colorScheme: '' } };
  applyResolvedTheme(root, 'dark');
  expect(root).toEqual({ dataset: { theme: 'dark' }, style: { colorScheme: 'dark' } });
  expect(writeThemePreference(storage, 'light')).toBe(true);
  expect(setItem).toHaveBeenCalledWith('spec-kitty-theme', 'light');
  setItem.mockImplementation(() => { throw new Error('storage denied'); });
  expect(writeThemePreference(storage, 'system')).toBe(false);
});

test('the bootstrap source is safe to import without DOM globals', async () => {
  await expect(import('../../packages/elements/src/theme-bootstrap.js')).resolves.toBeTruthy();
});

test('the registration helper is inert when no custom-element registry exists', async () => {
  expect('customElements' in globalThis).toBe(false);
  const { define, registeredTags } = await import('../../packages/elements/src/define.js');
  const probe = class {} as unknown as CustomElementConstructor;

  expect(() => define('sk-ssr-probe', probe)).not.toThrow();
  expect(registeredTags).not.toContain('sk-ssr-probe');
});

test('the actual theme-toggle element is safe to import without DOM globals', async () => {
  expect('document' in globalThis).toBe(false);
  expect('window' in globalThis).toBe(false);
  expect('CSSStyleSheet' in globalThis).toBe(false);
  expect('customElements' in globalThis).toBe(false);

  const module = await import('../../packages/elements/src/theme-toggle/sk-theme-toggle.js');
  expect(module.SkThemeToggle).toBeTypeOf('function');
});

test('the generated classic bootstrap has parity for accepted, invalid, missing, and denied storage', () => {
  const cases = [
    { stored: undefined, systemDark: false, expected: 'light' },
    { stored: undefined, systemDark: true, expected: 'dark' },
    { stored: 'light', systemDark: true, expected: 'light' },
    { stored: 'dark', systemDark: false, expected: 'dark' },
    { stored: 'system', systemDark: true, expected: 'dark' },
    { stored: 'sepia', systemDark: false, expected: 'light' },
    { stored: undefined, storageThrows: true, systemDark: true, expected: 'dark' },
  ] as const;

  for (const item of cases) {
    const root = runBootstrap(item);
    expect(root.dataset.theme, JSON.stringify(item)).toBe(item.expected);
    expect(root.style.colorScheme, JSON.stringify(item)).toBe(item.expected);
  }
});

test('the bootstrap is inert during SSR and safely falls back when matchMedia is absent or throws', () => {
  expect(() => runBootstrap({ document: false, systemDark: true })).not.toThrow();
  expect(runBootstrap({ stored: 'system' }).dataset.theme).toBe('light');
  expect(() => runBootstrap({ stored: 'system', matchMediaThrows: true })).not.toThrow();
  expect(runBootstrap({ stored: 'system', matchMediaThrows: true }).dataset.theme).toBe('light');
});

test('the bootstrap remains generated from the DOM-free contract and its gate probes itself', () => {
  const entry = readFileSync('packages/elements/src/theme-bootstrap.ts', 'utf8');
  const generated = readFileSync(bootstrapPath, 'utf8');
  expect(entry).toContain("from './theme-toggle/theme-preference.js'");
  expect(entry).not.toContain('spec-kitty-theme');
  expect(generated.match(/spec-kitty-theme/g)).toHaveLength(1);

  expect(() => execFileSync('node', ['scripts/build-theme-bootstrap.mjs', '--check'], {
    stdio: 'pipe',
  })).not.toThrow();
  expect(execFileSync('node', ['scripts/build-theme-bootstrap.mjs', '--selftest'], {
    encoding: 'utf8',
  })).toContain('3/3');
});

test('documentation places the inline bootstrap before every stylesheet link', () => {
  const docs = readFileSync('docs/design-system/using-components.md', 'utf8');
  const section = docs.match(/## Theme preference[\s\S]*?(?=\n## )/)?.[0] ?? '';
  expect(section).toContain('spec-kitty-theme');
  expect(section).toContain('consumer-supplied');
  expect(section).toContain('@spec-kitty/elements/theme-bootstrap.js');
  const script = section.indexOf('<script data-sk-theme-bootstrap>');
  const stylesheet = section.indexOf('<link rel="stylesheet"');
  expect(script).toBeGreaterThanOrEqual(0);
  expect(stylesheet).toBeGreaterThan(script);
});
