import {
  applyResolvedTheme,
  readThemePreference,
  resolveTheme,
  THEME_DARK_SCHEME_QUERY,
  type ThemeStorage,
} from './theme-toggle/theme-preference.js';

// Bundled to `theme-bootstrap.js`: one synchronous resolution, no listener. The element owns
// the live media-query lifecycle after custom elements load.
if (typeof document !== 'undefined') {
  let media: MediaQueryList | undefined;
  try {
    media = typeof globalThis.matchMedia === 'function'
      ? globalThis.matchMedia(THEME_DARK_SCHEME_QUERY)
      : undefined;
  } catch {
    media = undefined;
  }
  let storage: ThemeStorage | undefined;
  try {
    storage = globalThis.localStorage;
  } catch {
    storage = undefined;
  }
  applyResolvedTheme(
    document.documentElement,
    resolveTheme(readThemePreference(storage), media?.matches ?? false),
  );
}
