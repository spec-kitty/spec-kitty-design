/* eslint-disable @nx/enforce-module-boundaries -- ADR-11 mutation selection requires direct element-module imports. */
import { userEvent } from 'vitest/browser';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../../packages/elements/src/theme-toggle/sk-theme-toggle.js';
import skThemeToggleSheet from '../../../packages/elements/src/theme-toggle/sk-theme-toggle.css.js';

type ThemePreference = 'system' | 'light' | 'dark';
type ThemeToggle = HTMLElement & {
  preference: ThemePreference;
  label: string;
  systemLabel: string;
  lightLabel: string;
  darkLabel: string;
  updateComplete?: Promise<unknown>;
};

const labels = {
  label: 'Appearance',
  'system-label': 'Use device setting',
  'light-label': 'Light theme',
  'dark-label': 'Dark theme',
};

class FakeMediaQueryList extends EventTarget {
  readonly media = '(prefers-color-scheme: dark)';
  onchange: ((event: MediaQueryListEvent) => void) | null = null;
  matches: boolean;
  #listeners = new Set<EventListenerOrEventListenerObject>();

  constructor(dark: boolean) {
    super();
    this.matches = dark;
  }

  get listenerCount(): number {
    return this.#listeners.size;
  }

  override addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (type === 'change' && callback) this.#listeners.add(callback);
    super.addEventListener(type, callback, options);
  }

  override removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void {
    if (type === 'change' && callback) this.#listeners.delete(callback);
    super.removeEventListener(type, callback, options);
  }

  addListener(callback: EventListenerOrEventListenerObject): void {
    this.addEventListener('change', callback);
  }

  removeListener(callback: EventListenerOrEventListenerObject): void {
    this.removeEventListener('change', callback);
  }

  setDark(dark: boolean): void {
    this.matches = dark;
    this.dispatchEvent(new Event('change'));
  }
}

let media: FakeMediaQueryList;

const installMedia = (dark: boolean): FakeMediaQueryList => {
  media = new FakeMediaQueryList(dark);
  vi.stubGlobal('matchMedia', vi.fn(() => media as unknown as MediaQueryList));
  return media;
};

const mount = async (attrs: Record<string, string> = {}): Promise<ThemeToggle> => {
  const element = document.createElement('sk-theme-toggle') as ThemeToggle;
  for (const [name, value] of Object.entries({ ...labels, ...attrs })) {
    element.setAttribute(name, value);
  }
  document.body.append(element);
  await (element.updateComplete ?? Promise.resolve());
  return element;
};

const radios = (element: ThemeToggle): HTMLInputElement[] =>
  Array.from(
    element.shadowRoot?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? [],
  );

const choose = async (element: ThemeToggle, value: ThemePreference): Promise<void> => {
  const radio = radios(element).find((candidate) => candidate.value === value);
  expect(radio, `missing ${value} radio`).toBeTruthy();
  await userEvent.click(radio!);
  await (element.updateComplete ?? Promise.resolve());
};

beforeEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.removeProperty('color-scheme');
  localStorage.removeItem('spec-kitty-theme');
  installMedia(false);
});

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.removeProperty('color-scheme');
  try {
    localStorage.removeItem('spec-kitty-theme');
  } catch {
    // A throwing-storage test owns the spy that caused this and restores it below.
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('[SC-012] exposes one labelled native three-choice control with visible selected text', async () => {
  const element = await mount();
  const root = element.shadowRoot;
  const group = root?.querySelector('fieldset') ?? null;
  const options = radios(element);

  expect(group).not.toBeNull();
  expect(root?.querySelector('[role="switch"]') ?? null).toBeNull();
  expect(group!.querySelector('legend')?.textContent?.trim()).toBe(labels.label);
  expect(options.map((radio) => radio.value)).toEqual(['system', 'light', 'dark']);
  expect(options.map((radio) => radio.name)).toEqual([
    'theme-preference',
    'theme-preference',
    'theme-preference',
  ]);
  expect(options.filter((radio) => radio.checked).map((radio) => radio.value)).toEqual([
    'system',
  ]);
  expect(root?.textContent ?? '').toContain(labels['system-label']);

  options[0]!.focus();
  await userEvent.keyboard('{ArrowRight}');
  await (element.updateComplete ?? Promise.resolve());
  expect(element.preference).toBe('light');
  expect(options[1]!.checked).toBe(true);
});

test('renders no unlabeled interactive fallback when consumer labels are absent', async () => {
  const element = document.createElement('sk-theme-toggle') as ThemeToggle;
  document.body.append(element);
  await (element.updateComplete ?? Promise.resolve());

  const controls = element.shadowRoot?.querySelectorAll('input, button, select') ?? [];
  expect(controls).toHaveLength(0);
  expect(element.textContent).toBe('');
});

test.each([
  { stored: null, systemDark: false, preference: 'system', resolved: 'light' },
  { stored: null, systemDark: true, preference: 'system', resolved: 'dark' },
  { stored: 'light', systemDark: true, preference: 'light', resolved: 'light' },
  { stored: 'dark', systemDark: false, preference: 'dark', resolved: 'dark' },
  { stored: 'sepia', systemDark: true, preference: 'system', resolved: 'dark' },
] as const)(
  'stored $stored with systemDark=$systemDark resolves $resolved',
  async ({ stored, systemDark, preference, resolved }) => {
    installMedia(systemDark);
    if (stored !== null) localStorage.setItem('spec-kitty-theme', stored);
    const element = await mount();

    expect(element.preference).toBe(preference);
    expect(document.documentElement.dataset.theme).toBe(resolved);
    expect(document.documentElement.style.colorScheme).toBe(resolved);
    expect(radios(element).find((radio) => radio.value === preference)?.checked).toBe(true);
  },
);

test('manual choices persist, ignore OS changes, and returning to System follows live changes', async () => {
  installMedia(true);
  const element = await mount();
  expect(media.listenerCount).toBe(1);

  await choose(element, 'light');
  expect(localStorage.getItem('spec-kitty-theme')).toBe('light');
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(media.listenerCount).toBe(0);
  media.setDark(false);
  expect(document.documentElement.dataset.theme).toBe('light');

  await choose(element, 'system');
  expect(localStorage.getItem('spec-kitty-theme')).toBe('system');
  expect(media.listenerCount).toBe(1);
  expect(document.documentElement.dataset.theme).toBe('light');
  media.setDark(true);
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(document.documentElement.style.colorScheme).toBe('dark');
});

test('storage exceptions preserve current-page selection and root application', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
  installMedia(false);
  const element = await mount();

  expect(element.preference).toBe('system');
  await choose(element, 'dark');
  expect(element.preference).toBe('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(document.documentElement.style.colorScheme).toBe('dark');
  expect(write).toHaveBeenCalledWith('spec-kitty-theme', 'dark');
});

test('reattachment restores persisted preference without accumulating a System listener', async () => {
  const element = await mount();
  expect(media.listenerCount).toBe(1);
  await choose(element, 'dark');
  expect(media.listenerCount).toBe(0);

  element.remove();
  document.body.append(element);
  await (element.updateComplete ?? Promise.resolve());
  expect(element.preference).toBe('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(media.listenerCount).toBe(0);

  await choose(element, 'system');
  expect(media.listenerCount).toBe(1);
  element.remove();
  expect(media.listenerCount).toBe(0);
  document.body.append(element);
  await (element.updateComplete ?? Promise.resolve());
  expect(media.listenerCount).toBe(1);
  element.remove();
  expect(media.listenerCount).toBe(0);
});

test('a fresh instance restores the persisted manual preference', async () => {
  const first = await mount();
  await choose(first, 'dark');
  first.remove();

  const second = await mount();
  expect(second.preference).toBe('dark');
  expect(radios(second).find((radio) => radio.value === 'dark')?.checked).toBe(true);
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(media.listenerCount).toBe(0);
});

test('missing matchMedia degrades System to light without making the control inoperable', async () => {
  vi.stubGlobal('matchMedia', undefined);
  const element = await mount();

  expect(element.preference).toBe('system');
  expect(document.documentElement.dataset.theme).toBe('light');
  await choose(element, 'dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
});

test('a user choice emits its textual preference and resolved theme', async () => {
  const element = await mount();
  const events: unknown[] = [];
  element.addEventListener('sk-theme-change', (event) => {
    events.push((event as CustomEvent).detail);
  });
  await choose(element, 'dark');
  expect(events).toEqual([{ preference: 'dark', theme: 'dark' }]);
});

test('[SC-010] a preference assigned before upgrade survives definition and reaches the root', async () => {
  const element = document.createElement('sk-theme-toggle-late') as ThemeToggle;
  element.preference = 'dark';
  Object.assign(element, {
    label: labels.label,
    systemLabel: labels['system-label'],
    lightLabel: labels['light-label'],
    darkLabel: labels['dark-label'],
  });
  document.body.append(element);

  const { SkThemeToggle } = await import('../../../packages/elements/src/theme-toggle/sk-theme-toggle.js');
  customElements.define('sk-theme-toggle-late', class extends SkThemeToggle {});
  await customElements.whenDefined('sk-theme-toggle-late');
  await (element.updateComplete ?? Promise.resolve());

  expect(element.getAttribute('preference')).toBe('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
});

test('[SC-013] the public control part is present and externally targetable', async () => {
  const style = document.createElement('style');
  style.textContent = 'sk-theme-toggle::part(control) { outline-width: 7px; }';
  document.head.append(style);
  const element = await mount();
  const control = element.shadowRoot?.querySelector<HTMLElement>('[part="control"]');

  expect(control).not.toBeNull();
  expect(getComputedStyle(control!).outlineWidth).toBe('7px');
  style.remove();
});

test('[SC-014] adopts a constructed stylesheet and injects no style element', async () => {
  const element = await mount();
  const root = element.shadowRoot;

  expect(root?.adoptedStyleSheets.length).toBe(1);
  expect(root?.adoptedStyleSheets[0]).toBe(skThemeToggleSheet);
  expect(root?.querySelector('style')).toBeNull();
});
