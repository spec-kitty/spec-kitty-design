import { LitElement, html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { define } from '../define.js';
import sheet from './sk-theme-toggle.css.js';
import {
  applyResolvedTheme,
  isThemePreference,
  readThemePreference,
  resolveTheme,
  THEME_DARK_SCHEME_QUERY,
  THEME_STORAGE_KEY,
  writeThemePreference,
  type ResolvedTheme,
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
      ? globalThis.matchMedia(THEME_DARK_SCHEME_QUERY)
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
 * Whether storage can currently answer a read. A denied `localStorage` getter throws here in
 * `storage()` already; this additionally catches a `Storage` instance that throws from
 * `getItem` itself (both are exercised by the theme fixture) without treating "no stored key" as
 * denial — that case is a normal, readable miss. The DOM-free contract's `readThemePreference`
 * deliberately collapses both into System, so this is the only place the two are told apart.
 */
const canReadStorage = (store: ThemeStorage | undefined): boolean => {
  if (!store) return false;
  try {
    store.getItem(THEME_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};

/** How a connected control is told the document's preference without publishing it again. */
type ThemeControl = (preference: ThemePreference) => void;

/**
 * One document's theme state: the preference every connected control shows, the root it resolves
 * onto, and the only System listener.
 *
 * The root and the OS listener are document-global, so they have one owner. Per-control listeners
 * were the defect this replaces: a sibling left in System kept its own listener after another
 * control chose Light or Dark, and overwrote that manual root theme on the next OS change. Module
 * scope holds only a WeakMap of these, so importing the element stays DOM-free — the WeakMap key
 * ties a dormant coordinator's lifetime to the document, not to how many controls are connected.
 *
 * A dormant document — briefly zero connected controls — keeps its preference AND the stored value
 * it last read or saved (`#stored`). A control joining an empty document re-reads storage at that
 * moment, never the value it read when it was constructed, and adopts what it reads only when that
 * differs from `#stored`: a fresh page, or another script's same-tab write. When storage cannot be
 * read, or still holds exactly what the page last saw, it has nothing newer to say and the page's
 * own preference resumes. That is what keeps a choice storage refused to save (quota, private
 * mode) or to read across an SPA header remount. Two defects precede this rule: deleting the
 * coordinator on the last disconnect lost a denied-storage choice outright, and trusting any
 * readable storage lost a choice whose write had failed, because the stale stored value won.
 */
class DocumentTheme {
  readonly #document: Document;
  readonly #controls = new Set<ThemeControl>();
  #preference: ThemePreference = 'system';
  /** The stored preference this document last read or saved; `undefined` until one is known. */
  #stored: ThemePreference | undefined;
  #media: MediaQueryList | undefined;
  #listenerMechanism: 'modern' | 'legacy' | undefined;

  constructor(document: Document) {
    this.#document = document;
  }

  get resolved(): ResolvedTheme {
    return resolveTheme(this.#preference, this.#media?.matches ?? false);
  }

  /**
   * Register a connected control and return the preference it must show.
   *
   * One assigned a preference while disconnected always sets the document's preference. A control
   * joining a still-populated document always adopts the live, sibling-synchronized preference —
   * a stronger signal than storage. A control joining an EMPTY document resumes the document as
   * the class comment describes, and re-queries `matchMedia`, so a dormant System remount resolves
   * against the environment's current state rather than whatever `MediaQueryList` the last connect
   * captured.
   */
  connect(control: ThemeControl, preference: ThemePreference, assigned: boolean): ThemePreference {
    const wasEmpty = this.#controls.size === 0;
    if (wasEmpty) this.#media = mediaQuery();
    this.#controls.add(control);
    this.#publish(assigned ? preference : wasEmpty ? this.#resume() : this.#preference, control);
    return this.#preference;
  }

  /** The preference an empty document resumes with: storage only when it has changed. */
  #resume(): ThemePreference {
    const store = storage();
    if (!canReadStorage(store)) return this.#preference;
    const stored = readThemePreference(store);
    if (stored === this.#stored) return this.#preference;
    this.#stored = stored;
    return stored;
  }

  /** Save a user selection's settled preference, remembering it only if storage kept it. */
  persist(preference: ThemePreference): void {
    if (writeThemePreference(storage(), preference)) this.#stored = preference;
  }

  /** The last control's disconnect releases the System listener but keeps the preference. */
  disconnect(control: ThemeControl): void {
    this.#controls.delete(control);
    if (this.#controls.size === 0) this.#stopListening();
  }

  select(control: ThemeControl, preference: ThemePreference): void {
    this.#publish(preference, control);
  }

  #publish(preference: ThemePreference, source: ThemeControl): void {
    this.#preference = preference;
    for (const control of this.#controls) if (control !== source) control(preference);
    applyResolvedTheme(this.#document.documentElement, this.resolved);
    if (preference === 'system') this.#startListening();
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
    if (this.#preference === 'system') {
      applyResolvedTheme(this.#document.documentElement, this.resolved);
    }
  };
}

const documentThemes = new WeakMap<Document, DocumentTheme>();

const documentThemeFor = (document: Document): DocumentTheme => {
  let theme = documentThemes.get(document);
  if (!theme) {
    theme = new DocumentTheme(document);
    documentThemes.set(document, theme);
  }
  return theme;
};

/**
 * A three-state theme-preference control that resolves System, Light, or Dark on the root.
 *
 * Consumer-supplied labels are required so the package never ships untranslated fallback copy.
 * If any label is absent or blank, the element renders no interactive control. The pre-paint
 * bootstrap is independent of this presentation and continues to provide system-default theming.
 *
 * Every control connected to one document shows one shared preference: a choice on any of them
 * selects it on all of them, and exactly one System listener exists while that preference is
 * System. A control connecting alongside another control adopts the page's current preference. A
 * control connecting alone re-reads storage and adopts it if it changed since the page last read
 * or saved it; otherwise, or when storage cannot be read, the page's own last preference resumes.
 * Either is skipped for a control given an explicit `preference` before connecting, which always
 * wins.
 *
 * @element sk-theme-toggle
 * @csspart control - The native fieldset containing the three radio choices.
 * @fires {CustomEvent<{ preference: 'system' | 'light' | 'dark'; theme: 'light' | 'dark' }>} sk-theme-change - Reports a user-selected preference and its resolved root theme.
 */
export class SkThemeToggle extends LitElement {
  static styles = [sheet];

  static properties = {
    preference: { type: String, converter: preferenceConverter, reflect: true, noAccessor: true },
    label: { type: String },
    systemLabel: { type: String, attribute: 'system-label' },
    lightLabel: { type: String, attribute: 'light-label' },
    darkLabel: { type: String, attribute: 'dark-label' },
  };

  /** Visible legend and accessible name for the preference group. */
  declare label: string;

  /** Visible label for the System choice. */
  declare systemLabel: string;

  /** Visible label for the Light choice. */
  declare lightLabel: string;

  /** Visible label for the Dark choice. */
  declare darkLabel: string;

  #preference: ThemePreference = 'system';
  #assignedWhileDisconnected = false;
  #documentTheme: DocumentTheme | undefined;

  constructor() {
    super();
    this.preference = readThemePreference(storage());
    this.#assignedWhileDisconnected = false;
    this.label = '';
    this.systemLabel = '';
    this.lightLabel = '';
    this.darkLabel = '';
  }

  /** Selected preference. Invalid attribute and property values safely become `system`. */
  get preference(): 'system' | 'light' | 'dark' {
    return this.#preference;
  }

  set preference(value: 'system' | 'light' | 'dark') {
    const next = isThemePreference(value) ? value : 'system';
    const previous = this.#preference;
    this.#preference = next;
    if (this.#documentTheme) this.#documentTheme.select(this.#show, next);
    else this.#assignedWhileDisconnected = true;
    this.requestUpdate('preference', previous);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#documentTheme = documentThemeFor(this.ownerDocument);
    this.#show(this.#documentTheme.connect(
      this.#show,
      this.#preference,
      this.#assignedWhileDisconnected,
    ));
    this.#assignedWhileDisconnected = false;
  }

  override disconnectedCallback(): void {
    this.#documentTheme?.disconnect(this.#show);
    this.#documentTheme = undefined;
    super.disconnectedCallback();
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    // Lit suppresses reflection while it converts an attribute, so an invalid string that became
    // System would stay on an already-rendered host. Request the reflection that was skipped.
    if (name === 'preference' && value !== null && !isThemePreference(value)) {
      this.requestUpdate('preference', value);
    }
  }

  #show = (preference: ThemePreference): void => {
    const previous = this.#preference;
    if (previous === preference) return;
    this.#preference = preference;
    this.requestUpdate('preference', previous);
  };

  #resolvedTheme(): 'light' | 'dark' {
    return this.#documentTheme?.resolved ?? resolveTheme(this.#preference, false);
  }

  #select = (event: Event): void => {
    const input = event.currentTarget as HTMLInputElement;
    if (!input.checked || !isThemePreference(input.value)) return;
    this.preference = input.value;
    const themeChangeEvent = new CustomEvent('sk-theme-change', {
      detail: Object.freeze({ preference: this.preference, theme: this.#resolvedTheme() }),
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(themeChangeEvent);
    // Saved after dispatch: a synchronous handler may have reassigned `preference` to reject the
    // choice, and the next load must restore what the page settled on, not the rejected value.
    documentThemeFor(this.ownerDocument).persist(this.preference);
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
            .checked=${live(this.preference === value)}
            @change=${this.#select}
          >
          <span>${label}</span>
        </label>`)}
      </div>
    </fieldset>`;
  }
}

define('sk-theme-toggle', SkThemeToggle);
