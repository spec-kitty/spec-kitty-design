import {
  applyResolvedTheme,
  isThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from './theme-preference.js';

export type ThemeStoryParameters = Readonly<{ themePreference?: ThemePreference }>;

type ThemeStoryContext = Readonly<{
  parameters: ThemeStoryParameters;
  canvasElement?: ParentNode;
}>;

const THEME_CONTROL_SELECTOR = 'sk-theme-toggle[data-theme-control]';

const preferenceFor = (parameters: ThemeStoryParameters): ThemePreference =>
  isThemePreference(parameters.themePreference) ? parameters.themePreference : 'dark';

type ThemeStorySnapshot = Readonly<{
  themeAttribute: string | null;
  colorScheme: string;
  colorSchemePriority: string;
  stored: string | null;
  storageAvailable: boolean;
}>;

type ThemeStorySession = Readonly<{
  controlScope: ParentNode;
  controlsBeforeMount: Set<Element>;
  preference: ThemePreference;
}>;

type ThemeStoryEnvironment = {
  baseline: ThemeStorySnapshot;
  root: HTMLElement;
  sessions: ThemeStorySession[];
};

const environments = new WeakMap<Document, ThemeStoryEnvironment>();

const captureBaseline = (root: HTMLElement): ThemeStorySnapshot => {
  let stored: string | null = null;
  let storageAvailable = false;
  try {
    stored = localStorage.getItem(THEME_STORAGE_KEY);
    storageAvailable = true;
  } catch {
    // The component's documented storage-denied degradation must not block its stories.
  }
  return {
    themeAttribute: root.getAttribute('data-theme'),
    colorScheme: root.style.getPropertyValue('color-scheme'),
    colorSchemePriority: root.style.getPropertyPriority('color-scheme'),
    stored,
    storageAvailable,
  };
};

const setStoredPreference = (preference: ThemePreference): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // A storage policy may change during a story; root and listener ownership still apply.
  }
};

const restoreBaseline = (environment: ThemeStoryEnvironment): void => {
  const { baseline, root } = environment;
  if (baseline.themeAttribute === null) root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', baseline.themeAttribute);

  if (baseline.colorScheme === '') root.style.removeProperty('color-scheme');
  else root.style.setProperty(
    'color-scheme',
    baseline.colorScheme,
    baseline.colorSchemePriority,
  );

  if (!baseline.storageAvailable) return;
  try {
    if (baseline.stored === null) localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, baseline.stored);
  } catch {
    // A storage policy may change during a story; root and listener cleanup still completed.
  }
};

const controlsOwnedBy = (session: ThemeStorySession): Element[] =>
  Array.from(session.controlScope.querySelectorAll(THEME_CONTROL_SELECTOR))
    .filter((control) => !session.controlsBeforeMount.has(control));

const currentPreferenceFor = (session: ThemeStorySession): ThemePreference => {
  for (const control of controlsOwnedBy(session).reverse()) {
    const preference = (control as Element & { preference?: unknown }).preference;
    if (isThemePreference(preference)) return preference;
  }
  return session.preference;
};

const systemPrefersDark = (): boolean => {
  try {
    return typeof globalThis.matchMedia === 'function' &&
      globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

const applySession = (environment: ThemeStoryEnvironment, session: ThemeStorySession): void => {
  const preference = currentPreferenceFor(session);
  setStoredPreference(preference);
  applyResolvedTheme(environment.root, resolveTheme(preference, systemPrefersDark()));
};

/**
 * Isolate document-global theme state for a Storybook story.
 *
 * A Storybook iframe can render several stories without replacing its document. This helper
 * captures one true baseline per document and tracks overlapping sessions in creation order.
 * The Storybook canvas scopes control ownership so cleanup cannot disconnect another story's
 * control. Closing the current owner reapplies the most recent remaining session; closing an
 * older session keeps the newer owner authoritative. Only the final cleanup
 * restores the pre-first-session root, storage, and color-scheme baseline.
 */
export const isolateThemeStory = ({ parameters, canvasElement }: ThemeStoryContext) => {
  const storyDocument = document;
  const root = storyDocument.documentElement;
  const controlScope = canvasElement ?? document;
  const controlsBeforeMount = new Set(
    Array.from(controlScope.querySelectorAll(THEME_CONTROL_SELECTOR)),
  );
  let environment = environments.get(storyDocument);
  if (!environment) {
    environment = { baseline: captureBaseline(root), root, sessions: [] };
    environments.set(storyDocument, environment);
  }
  const session: ThemeStorySession = {
    controlScope,
    controlsBeforeMount,
    preference: preferenceFor(parameters),
  };
  environment.sessions.push(session);
  setStoredPreference(session.preference);

  return () => {
    const index = environment.sessions.indexOf(session);
    if (index < 0) return;
    controlsOwnedBy(session).forEach((toggle) => toggle.remove());
    environment.sessions.splice(index, 1);
    const current = environment.sessions.at(-1);
    if (!current) {
      restoreBaseline(environment);
      environments.delete(storyDocument);
    } else {
      applySession(environment, current);
    }
  };
};
