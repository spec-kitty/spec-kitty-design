/** A consumer's persisted theme preference. */
export type ThemePreference = 'system' | 'light' | 'dark';

/** The concrete theme resolved onto the document root. */
export type ResolvedTheme = 'light' | 'dark';

/** The one storage key shared by the pre-paint bootstrap and the element. */
export const THEME_STORAGE_KEY = 'spec-kitty-theme';

/** The complete public preference vocabulary, in control order. */
export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

/** The minimum storage surface needed by the theme contract. */
export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** The minimum root surface needed to apply a resolved theme without importing DOM globals. */
export interface ThemeRoot {
  dataset: { theme?: string };
  style: { colorScheme: string };
}

/** Whether an unknown value is one of the three public preferences. */
export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/** Read a preference. Missing, invalid, and inaccessible storage all mean System. */
export function readThemePreference(storage?: ThemeStorage | null): ThemePreference {
  if (!storage) return 'system';
  try {
    const stored = storage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

/** Persist a preference. Storage denial is a recoverable degradation. */
export function writeThemePreference(
  storage: ThemeStorage | null | undefined,
  preference: ThemePreference,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(THEME_STORAGE_KEY, preference);
    return true;
  } catch {
    return false;
  }
}

/** Resolve System against the current OS preference; manual choices pass through. */
export function resolveTheme(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
}

/** Apply both root signals atomically from the same resolved value. */
export function applyResolvedTheme(root: ThemeRoot, theme: ResolvedTheme): void {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}
