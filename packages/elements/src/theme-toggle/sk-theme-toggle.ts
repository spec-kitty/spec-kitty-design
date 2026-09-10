import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { define } from '../define.js';
import sheet from './sk-theme-toggle.css.js';
import {
  applyResolvedTheme,
  isThemePreference,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemePreference,
  type ThemeStorage,
} from './theme-preference.js';

const preferenceConverter = {
  fromAttribute(value: string | null): ThemePreference {
    return isThemePreference(value) ? value : 'system';
  },
  toAttribute(value: ThemePreference): string {
    return value;
  },
};

const mediaQuery = (): MediaQueryList | undefined => {
  try {
    return typeof globalThis.matchMedia === 'function'
      ? globalThis.matchMedia('(prefers-color-scheme: dark)')
      : undefined;
  } catch {
    return undefined;
  }
};

const storage = (): ThemeStorage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

/**
 * A three-state theme-preference control that resolves System, Light, or Dark on the root.
 *
 * Consumer-supplied labels are required so the package never ships untranslated fallback copy.
 * If any label is absent or blank, the element renders no interactive control. The pre-paint
 * bootstrap is independent of this presentation and continues to provide system-default theming.
 *
 * @element sk-theme-toggle
 * @csspart control - The native fieldset containing the three radio choices.
 * @fires {CustomEvent<{ preference: 'system' | 'light' | 'dark'; theme: 'light' | 'dark' }>} sk-theme-change - Reports a user-selected preference and its resolved root theme.
 */
export class SkThemeToggle extends LitElement {
  static styles = [sheet];

  static properties = {
    preference: { type: String, converter: preferenceConverter, reflect: true },
    label: { type: String },
    systemLabel: { type: String, attribute: 'system-label' },
    lightLabel: { type: String, attribute: 'light-label' },
    darkLabel: { type: String, attribute: 'dark-label' },
  };

  /** Selected preference. Invalid attribute values safely become `system`. */
  declare preference: 'system' | 'light' | 'dark';

  /** Visible legend and accessible name for the preference group. */
  declare label: string;

  /** Visible label for the System choice. */
  declare systemLabel: string;

  /** Visible label for the Light choice. */
  declare lightLabel: string;

  /** Visible label for the Dark choice. */
  declare darkLabel: string;

  #media: MediaQueryList | undefined;
  #listenerMechanism: 'modern' | 'legacy' | undefined;

  constructor() {
    super();
    this.preference = readThemePreference(storage());
    this.label = '';
    this.systemLabel = '';
    this.lightLabel = '';
    this.darkLabel = '';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#applyAndSynchronize();
  }

  override disconnectedCallback(): void {
    this.#stopListening();
    super.disconnectedCallback();
  }

  protected override updated(changes: PropertyValues<this>): void {
    if (changes.has('preference')) this.#applyAndSynchronize();
  }

  #resolvedTheme(): 'light' | 'dark' {
    return resolveTheme(this.preference, this.#media?.matches ?? false);
  }

  #applyAndSynchronize(): void {
    if (!this.isConnected || typeof document === 'undefined') return;
    this.#media ??= mediaQuery();
    applyResolvedTheme(document.documentElement, this.#resolvedTheme());
    if (this.preference === 'system') this.#startListening();
    else this.#stopListening();
  }

  #startListening(): void {
    if (!this.#media || this.#listenerMechanism) return;
    const modern =
      typeof this.#media.addEventListener === 'function' &&
      typeof this.#media.removeEventListener === 'function';
    const legacy =
      typeof this.#media.addListener === 'function' &&
      typeof this.#media.removeListener === 'function';

    try {
      if (modern) {
        this.#media.addEventListener('change', this.#onSystemChange);
        this.#listenerMechanism = 'modern';
      } else if (legacy) {
        this.#media.addListener(this.#onSystemChange);
        this.#listenerMechanism = 'legacy';
      }
    } catch {
      // A static media-query result still provides a safe initial System resolution.
      this.#listenerMechanism = undefined;
    }
  }

  #stopListening(): void {
    const mechanism = this.#listenerMechanism;
    this.#listenerMechanism = undefined;
    if (!this.#media || !mechanism) return;
    try {
      if (mechanism === 'modern') {
        this.#media.removeEventListener('change', this.#onSystemChange);
      } else {
        this.#media.removeListener(this.#onSystemChange);
      }
    } catch {
      // A failed browser cleanup must not make disconnect or a manual preference throw.
    }
  }

  #onSystemChange = (): void => {
    if (this.preference === 'system' && typeof document !== 'undefined') {
      applyResolvedTheme(document.documentElement, this.#resolvedTheme());
    }
  };

  #select = (event: Event): void => {
    const input = event.currentTarget as HTMLInputElement;
    if (!input.checked || !isThemePreference(input.value)) return;
    this.preference = input.value;
    writeThemePreference(storage(), this.preference);
    this.#applyAndSynchronize();
    const themeChangeEvent = new CustomEvent('sk-theme-change', {
      detail: Object.freeze({ preference: this.preference, theme: this.#resolvedTheme() }),
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(themeChangeEvent);
  };

  #hasLabels(): boolean {
    return [this.label, this.systemLabel, this.lightLabel, this.darkLabel]
      .every((value) => value.trim() !== '');
  }

  render() {
    if (!this.#hasLabels()) return nothing;
    const options: readonly [ThemePreference, string][] = [
      ['system', this.systemLabel],
      ['light', this.lightLabel],
      ['dark', this.darkLabel],
    ];
    return html`<fieldset
        part="control"
        class="sk-theme-toggle"
      >
      <legend class="sk-theme-toggle__legend">${this.label}</legend>
      <div class="sk-theme-toggle__choices">
        ${options.map(([value, label]) => html`<label class="sk-theme-toggle__choice">
          <input
              type="radio"
            name="theme-preference"
            value=${value}
            .checked=${this.preference === value}
            @change=${this.#select}
          >
          <span>${label}</span>
        </label>`)}
      </div>
    </fieldset>`;
  }
}

define('sk-theme-toggle', SkThemeToggle);
