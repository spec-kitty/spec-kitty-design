/* eslint-disable @nx/enforce-module-boundaries -- ADR-11 mutation selection requires direct element-module imports. */
import { userEvent } from 'vitest/browser';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../../packages/elements/src/theme-toggle/sk-theme-toggle.js';
import skThemeToggleSheet from '../../../packages/elements/src/theme-toggle/sk-theme-toggle.css.js';
import themeBootstrapSource from '../../../packages/elements/theme-bootstrap.js?raw';

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

type LegacyMediaListener = (event: MediaQueryListEvent) => void;

/** A deliberately legacy-only MQL: the modern listener methods do not exist. */
class LegacyMediaQueryList {
  readonly media = '(prefers-color-scheme: dark)';
  onchange: ((event: MediaQueryListEvent) => void) | null = null;
  matches: boolean;
  #listeners = new Set<LegacyMediaListener>();

  constructor(dark: boolean) {
    this.matches = dark;
  }

  get listenerCount(): number {
    return this.#listeners.size;
  }

  addListener(callback: LegacyMediaListener): void {
    this.#listeners.add(callback);
  }

  removeListener(callback: LegacyMediaListener): void {
    this.#listeners.delete(callback);
  }

  setDark(dark: boolean): void {
    this.matches = dark;
    const event = { matches: dark, media: this.media } as MediaQueryListEvent;
    for (const listener of this.#listeners) listener(event);
  }
}

/** A valid static MQL result from an environment that exposes no listener API. */
class ListenerlessMediaQueryList {
  readonly media = '(prefers-color-scheme: dark)';
  readonly onchange = null;

  constructor(readonly matches: boolean) {}
}

let media: FakeMediaQueryList;

const installMedia = (dark: boolean): FakeMediaQueryList => {
  media = new FakeMediaQueryList(dark);
  vi.stubGlobal('matchMedia', vi.fn(() => media as unknown as MediaQueryList));
  return media;
};

const installLegacyMedia = (dark: boolean): LegacyMediaQueryList => {
  const legacy = new LegacyMediaQueryList(dark);
  vi.stubGlobal('matchMedia', vi.fn(() => legacy as unknown as MediaQueryList));
  return legacy;
};

const installListenerlessMedia = (dark: boolean): ListenerlessMediaQueryList => {
  const listenerless = new ListenerlessMediaQueryList(dark);
  vi.stubGlobal('matchMedia', vi.fn(() => listenerless as unknown as MediaQueryList));
  return listenerless;
};

const installIncompleteMedia = (
  dark: boolean,
  mechanism: 'modern' | 'legacy',
): { addCalls: () => number } => {
  let additions = 0;
  const incomplete = {
    media: '(prefers-color-scheme: dark)',
    matches: dark,
    onchange: null,
    ...(mechanism === 'modern'
      ? { addEventListener: () => { additions += 1; } }
      : { addListener: () => { additions += 1; } }),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => incomplete as unknown as MediaQueryList));
  return { addCalls: () => additions };
};

type BootstrapScenario = {
  stored: string | null;
  systemDark: boolean;
  storageThrows?: boolean;
  resolved: 'light' | 'dark';
};

type BootstrapBoundary = {
  colorScheme: string;
  stylesheetCount: number;
  theme: string | undefined;
};

const runBootstrapConsumer = async (scenario: BootstrapScenario): Promise<{
  boundary: BootstrapBoundary;
  document: Document;
}> => {
  const bootstrapUrl = URL.createObjectURL(new Blob([themeBootstrapSource], {
    type: 'text/javascript',
  }));
  const stylesheetUrl = URL.createObjectURL(new Blob([
    ':root { --theme-bootstrap-consumer-stylesheet: loaded; }',
  ], { type: 'text/css' }));
  const storageSetup = scenario.storageThrows
    ? `Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        get() { throw new DOMException('blocked', 'SecurityError'); }
      });`
    : scenario.stored === null
      ? `localStorage.removeItem('spec-kitty-theme');`
      : `localStorage.setItem('spec-kitty-theme', ${JSON.stringify(scenario.stored)});`;
  const iframe = document.createElement('iframe');
  iframe.srcdoc = `<!doctype html><html><head>
    <script>${storageSetup}
      globalThis.matchMedia = () => ({ matches: ${String(scenario.systemDark)} });
    <\/script>
    <script id="theme-bootstrap" src="${bootstrapUrl}"><\/script>
    <script>
      globalThis.__themeAtPreStylesheetBoundary = {
        theme: document.documentElement.dataset.theme,
        colorScheme: document.documentElement.style.colorScheme,
        stylesheetCount: document.styleSheets.length
      };
    <\/script>
    <link id="consumer-stylesheet" rel="stylesheet" href="${stylesheetUrl}">
  </head><body></body></html>`;

  try {
    const loaded = new Promise<void>((resolve, reject) => {
      iframe.addEventListener('load', () => resolve(), { once: true });
      iframe.addEventListener('error', () => reject(new Error('bootstrap consumer failed')), {
        once: true,
      });
    });
    document.body.append(iframe);
    await loaded;
    const consumerDocument = iframe.contentDocument;
    const consumerWindow = iframe.contentWindow as Window & {
      __themeAtPreStylesheetBoundary?: BootstrapBoundary;
    };
    if (!consumerDocument || !consumerWindow.__themeAtPreStylesheetBoundary) {
      throw new Error('bootstrap consumer did not record its pre-stylesheet boundary');
    }
    return {
      boundary: consumerWindow.__themeAtPreStylesheetBoundary,
      document: consumerDocument,
    };
  } finally {
    URL.revokeObjectURL(bootstrapUrl);
    URL.revokeObjectURL(stylesheetUrl);
  }
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
  const choice = element.shadowRoot?.querySelector<HTMLInputElement>(`input[value="${value}"]`);
  expect(choice, `missing ${value} choice`).toBeTruthy();
  await userEvent.click(choice!);
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

test('legacy-only matchMedia follows System and cleans up across manual mode and reconnects', async () => {
  const legacy = installLegacyMedia(true);
  const element = await mount();
  expect(legacy.listenerCount).toBe(1);
  expect(document.documentElement.dataset.theme).toBe('dark');

  legacy.setDark(false);
  expect(document.documentElement.dataset.theme).toBe('light');

  await choose(element, 'dark');
  expect(legacy.listenerCount).toBe(0);
  legacy.setDark(false);
  expect(document.documentElement.dataset.theme).toBe('dark');

  await choose(element, 'system');
  expect(legacy.listenerCount).toBe(1);
  expect(document.documentElement.dataset.theme).toBe('light');
  element.remove();
  expect(legacy.listenerCount).toBe(0);

  document.body.append(element);
  await (element.updateComplete ?? Promise.resolve());
  expect(legacy.listenerCount).toBe(1);
  element.remove();
  expect(legacy.listenerCount).toBe(0);
});

test('[SC-012] listenerless matchMedia remains a static System source and the control stays operable', async () => {
  installListenerlessMedia(true);
  const element = await mount();

  expect(element.preference).toBe('system');
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(document.documentElement.style.colorScheme).toBe('dark');

  await choose(element, 'light');
  expect(element.preference).toBe('light');
  expect(document.documentElement.dataset.theme).toBe('light');

  element.remove();
  document.body.append(element);
  await (element.updateComplete ?? Promise.resolve());
  expect(document.documentElement.dataset.theme).toBe('light');
});

test.each(['modern', 'legacy'] as const)(
  '[SC-012] an incomplete $0 listener pair stays static and is never installed',
  async (mechanism) => {
    const probe = installIncompleteMedia(false, mechanism);
    const element = await mount();

    expect(element.preference).toBe('system');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(probe.addCalls()).toBe(0);

    element.remove();
    expect(probe.addCalls()).toBe(0);
  },
);

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

test('[SC-006][SC-007][SC-008] a user choice emits once with exact public detail and propagation', async () => {
  const element = await mount();
  const events: CustomEvent[] = [];
  const recordEvent = (event: Event) => {
    events.push(event as CustomEvent);
  };
  document.body.addEventListener('sk-theme-change', recordEvent);
  await choose(element, 'dark');
  document.body.removeEventListener('sk-theme-change', recordEvent);
  expect(events).toHaveLength(1);
  expect(events[0]!.detail).toEqual({ preference: 'dark', theme: 'dark' });
  expect(Object.keys(events[0]!.detail).sort()).toEqual(['preference', 'theme']);
  expect(events[0]!.bubbles).toBe(true);
  expect(events[0]!.composed).toBe(true);
  expect(events[0]!.cancelable).toBe(false);
});

test.each([
  { stored: 'light', systemDark: true, resolved: 'light' },
  { stored: 'dark', systemDark: false, resolved: 'dark' },
  { stored: null, systemDark: false, resolved: 'light' },
  { stored: 'sepia', systemDark: true, resolved: 'dark' },
  { stored: 'system', systemDark: false, resolved: 'light' },
  { stored: 'system', systemDark: true, resolved: 'dark' },
  { stored: null, systemDark: true, storageThrows: true, resolved: 'dark' },
] as const)(
  'generated classic bootstrap resolves stored=$stored systemDark=$systemDark before consumer CSS',
  async (scenario) => {
    const consumer = await runBootstrapConsumer(scenario);
    const bootstrap = consumer.document.querySelector('#theme-bootstrap');
    const stylesheet = consumer.document.querySelector('#consumer-stylesheet');

    expect(bootstrap?.getAttribute('type')).toBeNull();
    expect(
      bootstrap?.compareDocumentPosition(stylesheet!) ?? 0,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(consumer.boundary).toEqual({
      theme: scenario.resolved,
      colorScheme: scenario.resolved,
      stylesheetCount: 0,
    });
    expect(consumer.document.styleSheets).toHaveLength(1);
    expect(
      consumer.document.defaultView?.getComputedStyle(consumer.document.documentElement)
        .getPropertyValue('--theme-bootstrap-consumer-stylesheet').trim(),
    ).toBe('loaded');
  },
);

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
