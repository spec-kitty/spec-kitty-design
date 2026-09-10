import {
  isThemePreference,
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

/**
 * Isolate document-global theme state for a Storybook story.
 *
 * A Storybook iframe can render several stories without replacing its document. This helper
 * snapshots every shared surface before a story mounts and restores it from Storybook's
 * supported `beforeEach` cleanup callback. The Storybook canvas scopes control ownership so
 * cleanup cannot disconnect another story's control. Removing this story's mounted controls
 * first lets each element release its media-query listener before root and storage state are
 * restored.
 */
export const isolateThemeStory = ({ parameters, canvasElement }: ThemeStoryContext) => {
  const root = document.documentElement;
  const controlScope = canvasElement ?? document;
  const controlsBeforeMount = new Set(
    Array.from(controlScope.querySelectorAll(THEME_CONTROL_SELECTOR)),
  );
  const themeAttribute = root.getAttribute('data-theme');
  const colorScheme = root.style.getPropertyValue('color-scheme');
  const colorSchemePriority = root.style.getPropertyPriority('color-scheme');
  let stored: string | null = null;
  let storageAvailable = false;

  try {
    stored = localStorage.getItem(THEME_STORAGE_KEY);
    localStorage.setItem(THEME_STORAGE_KEY, preferenceFor(parameters));
    storageAvailable = true;
  } catch {
    // The component's documented storage-denied degradation must not block its stories.
  }

  return () => {
    controlScope.querySelectorAll(THEME_CONTROL_SELECTOR).forEach((toggle) => {
      if (!controlsBeforeMount.has(toggle)) toggle.remove();
    });

    if (themeAttribute === null) root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', themeAttribute);

    if (colorScheme === '') root.style.removeProperty('color-scheme');
    else root.style.setProperty('color-scheme', colorScheme, colorSchemePriority);

    if (!storageAvailable) return;
    try {
      if (stored === null) localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, stored);
    } catch {
      // A storage policy may change during a story; root and listener cleanup still completed.
    }
  };
};
