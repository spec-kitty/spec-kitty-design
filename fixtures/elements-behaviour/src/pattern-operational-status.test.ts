/* eslint-disable @nx/enforce-module-boundaries -- #225: this file imports the composition module
   and the element modules it EXERCISES, not the package barrel. The mutation harness selects each
   arm's tests from Vitest's dependency graph, and one barrel import puts every element source in
   every behaviour test's graph — which is what made that filter inert. */
/**
 * [SC-011] THE COMPOSITION FIXTURE'S BEHAVIOURAL HALF (#183 exit criterion, #259).
 *
 * `scripts/check-pattern-composition.mjs` carries the criterion's two NEGATIVE claims — no
 * private shadow-root reach-through, no duplicated component CSS — statically, over the fixture's
 * source. This file carries the POSITIVE one: that the composition actually composes. A gate
 * proving a fixture contains no forbidden construct says nothing about whether the assembled page
 * still works, and an empty file would satisfy it perfectly.
 *
 * THIS IS THE PRECEDENT'S GAP, DELIBERATELY CLOSED. `team-overview.stories.ts` — the only pattern
 * fixture before this one — carries six ratcheted story ids and no behaviour test. A story id
 * proves a story EXISTS at a stable name; it cannot notice that the slot stopped assigning, that
 * the `<dl>` lost its `<dt>`s, or that a gap started interpolating. `mutations.json` carries an
 * SC-011 arm against the composition module, so these assertions are known to go red rather than
 * assumed to.
 *
 * WHY SC-011 AND NOT A NEW ID. `behaviours.json` is the second copy of ADR-11's behaviour
 * catalogue — `tests/node/config-contract.test.ts` transcribes the id list by hand precisely so
 * the registry keeps mirroring the ADR — and ADR-11's items 10 and 11 were each added by a
 * documented amendment written from measured bugs. Minting a twelfth for this fixture would have
 * meant amending the ADR on the strength of a criterion rather than a defect, a weaker warrant
 * than that section sets. The composition's headline claim IS ADR-11 item 4, the slot contract —
 * "content is assigned to the intended slot" — asserted here across a card and a notice rather
 * than on one element, so this file joins SC-011's subjects.
 *
 * THE ARM IS NOT ADR-11'S CANONICAL ONE, and that is worth a line where it is declared. SC-011's
 * canonical mutation is a RENAMED SLOT. This composition's slot belongs to `<sk-card>`, so
 * renaming it would test sk-card's contract rather than the composition's; the registered arm
 * inserts a wrapper between the `<dl>` and its `<dt>`/`<dd>` instead — a different failure mode
 * under the same id, and the one that is actually about assembling from public surfaces.
 * `mutations.json` carries the same note beside the arm.
 *
 * The two UNMARKED assertions below (native disclosure state, the published gap literal) carry no
 * registry id because neither is an ADR-11 behaviour class. They are supporting evidence for the
 * composition and are NOT protected by the mutation harness; the SC-011 arm is.
 *
 * WHY THIS FILE MAY READ `shadowRoot` WHEN THE FIXTURE MAY NOT. Reaching a private root is how a
 * TEST verifies that a public surface produced the right private structure; it is how 30 files in
 * this fixture already work. It is a defect only in the COMPOSITION, which is the artefact whose
 * sufficiency is the claim. `check-pattern-composition.mjs` therefore scopes R1 to
 * `packages/elements/src/patterns/` and says so by name.
 */
import { afterEach, beforeEach, expect, test } from 'vitest';
import { render } from 'lit';
import {
  OPERATIONAL_MODEL,
  renderOperationalStatus,
} from '../../../packages/elements/src/patterns/operational-status.js';
import { isolateThemeStory } from '../../../packages/elements/src/theme-toggle/theme-story-environment.js';
import { installTokenSheet } from './token-sheet.js';
import { assertThemesDiffered, contrast } from './contrast.js';

type Updatable = Element & { updateComplete?: Promise<unknown> };

class SystemPreference implements MediaQueryList {
  readonly media = '(prefers-color-scheme: dark)';
  readonly onchange = null;
  #listeners = new Set<(event: MediaQueryListEvent) => void>();

  constructor(public matches: boolean) {}

  get listenerCount(): number {
    return this.#listeners.size;
  }

  addEventListener(_type: 'change', listener: EventListenerOrEventListenerObject): void {
    this.#listeners.add(listener as (event: MediaQueryListEvent) => void);
  }

  removeEventListener(_type: 'change', listener: EventListenerOrEventListenerObject): void {
    this.#listeners.delete(listener as (event: MediaQueryListEvent) => void);
  }

  addListener(listener: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null): void {
    if (listener) this.#listeners.add(listener);
  }

  removeListener(listener: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null): void {
    if (listener) this.#listeners.delete(listener);
  }

  dispatchEvent(): boolean {
    return true;
  }
}

const originalMatchMedia = globalThis.matchMedia;

const luminance = (color: string): number => {
  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`cannot measure ${color}`);
  const linear = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
};

const mount = async () => {
  const host = document.createElement('div');
  document.body.append(host);
  render(renderOperationalStatus(OPERATIONAL_MODEL), host);
  for (const element of Array.from(host.querySelectorAll<Updatable>('*'))) {
    if (element.updateComplete) await element.updateComplete;
  }
  return host;
};

const slotOf = (element: Element, name?: string) =>
  element.shadowRoot!.querySelector<HTMLSlotElement>(
    name ? `slot[name="${name}"]` : 'slot:not([name])',
  );

beforeEach(installTokenSheet);

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.removeProperty('color-scheme');
  globalThis.matchMedia = originalMatchMedia;
});

test('the Factory-pattern composition includes the public theme, status-card, and facts surfaces', async () => {
  const host = await mount();

  expect(host.querySelectorAll('sk-theme-toggle[data-theme-control]')).toHaveLength(1);
  expect(host.querySelectorAll('sk-card[status]')).toHaveLength(OPERATIONAL_MODEL.units.length);
  expect(host.querySelectorAll('dl.sk-facts')).toHaveLength(OPERATIONAL_MODEL.units.length);
  expect(host.querySelector('[data-theme-control]')?.getAttribute('label')).toBe('Theme');
});

test('manual light and dark resolve on the root with mutually exclusive luminance and AA contrast', async () => {
  const surfaces = new Map<string, string>();
  const luminances = new Map<string, number>();

  for (const preference of ['dark', 'light'] as const) {
    const host = document.createElement('div');
    document.body.append(host);
    render(renderOperationalStatus(OPERATIONAL_MODEL, { preference }), host);
    for (const element of Array.from(host.querySelectorAll<Updatable>('*'))) {
      if (element.updateComplete) await element.updateComplete;
    }

    const surface = host.querySelector<HTMLElement>('[data-theme-composition]')!;
    const style = getComputedStyle(surface);
    surfaces.set(preference, style.backgroundColor);
    luminances.set(preference, luminance(style.backgroundColor));

    expect(document.documentElement.dataset.theme).toBe(preference);
    expect(document.documentElement.style.colorScheme).toBe(preference);
    expect(contrast(style.color, style.backgroundColor), `${preference} page contrast`)
      .toBeGreaterThanOrEqual(4.5);

    host.remove();
  }

  assertThemesDiffered(surfaces);
  expect(luminances.get('dark')).toBeLessThan(0.5);
  expect(luminances.get('light')).toBeGreaterThan(0.5);
});

test('System follows the media preference and releases its listener on a manual selection', async () => {
  const system = new SystemPreference(true);
  globalThis.matchMedia = () => system;
  const host = document.createElement('div');
  document.body.append(host);

  render(renderOperationalStatus(OPERATIONAL_MODEL, { preference: 'system' }), host);
  const toggle = host.querySelector<Updatable & { preference: string }>('sk-theme-toggle')!;
  await toggle.updateComplete;
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(system.listenerCount).toBe(1);

  toggle.preference = 'light';
  await toggle.updateComplete;
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(system.listenerCount).toBe(0);

  host.remove();
  expect(system.listenerCount).toBe(0);
});

test('the story boundary restores root state and storage after disconnecting its System control', async () => {
  const system = new SystemPreference(false);
  globalThis.matchMedia = () => system;
  document.documentElement.dataset.theme = 'dark';
  document.documentElement.style.colorScheme = 'dark';
  localStorage.setItem('spec-kitty-theme', 'light');

  const cleanup = isolateThemeStory({ parameters: { themePreference: 'system' } });
  const host = document.createElement('div');
  document.body.append(host);
  render(renderOperationalStatus(OPERATIONAL_MODEL, { preference: 'system' }), host);
  const toggle = host.querySelector<Updatable>('sk-theme-toggle')!;
  await toggle.updateComplete;

  expect(document.documentElement.dataset.theme).toBe('light');
  expect(localStorage.getItem('spec-kitty-theme')).toBe('system');
  expect(system.listenerCount).toBe(1);

  cleanup();
  expect(host.querySelector('sk-theme-toggle')).toBeNull();
  expect(system.listenerCount).toBe(0);
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(document.documentElement.style.colorScheme).toBe('dark');
  expect(localStorage.getItem('spec-kitty-theme')).toBe('light');
  localStorage.removeItem('spec-kitty-theme');
});

/**
 * The claim in the criterion's own words: assembled FROM PUBLIC SURFACES. The `<dl>` and the
 * `<details>` are consumer-owned light DOM handed to `<sk-card>`'s default slot — no wrapper
 * element, no subclass, no reach-through — and the proof that this is composition rather than
 * coincidence is that the CARD's own slot reports them as assigned.
 */
test('[SC-011] the light-DOM fact block and disclosure are assigned to the card default slot', async () => {
  const host = await mount();
  const card = host.querySelector('sk-card[data-unit="north"]')!;
  const assigned = slotOf(card)!.assignedElements();

  expect(assigned).toContain(host.querySelector('dl[data-facts="north"]'));
  expect(assigned).toContain(host.querySelector('details[data-detail="north"]'));
  // And the indicator, which is an ELEMENT composed into the same slot rather than a class.
  expect(assigned.some((el) => el.tagName.toLowerCase() === 'sk-status-indicator')).toBe(true);
});

/**
 * THE #92 / ADR-9 FAILURE MODE, asserted rather than trusted.
 *
 * A shadow root between a `<dl>` and its `<dt>`/`<dd>` severs the list: the definition-list
 * relationship is a PARENT-CHILD one, and slotting does not re-parent. That is the measured
 * reason #177 refused to build a `<sk-status-card>` wrapper and #176 shipped `.sk-facts` as a
 * styles-only primitive instead. If a later mission "tidies" the fact block into an element, this
 * is the assertion that reds.
 */
test('[SC-011] every dt and dd is still a direct child of the dl across the slot boundary', async () => {
  const host = await mount();
  const list = host.querySelector('dl[data-facts="north"]')!;
  const terms = Array.from(list.children).filter((el) => el.tagName === 'DT');
  const values = Array.from(list.children).filter((el) => el.tagName === 'DD');
  const expected = OPERATIONAL_MODEL.units.find((unit) => unit.id === 'north')!.facts;

  expect(terms).toHaveLength(expected.length);
  expect(values).toHaveLength(expected.length);
  expect(list.querySelectorAll('dt, dd')).toHaveLength(expected.length * 2);
  expect(terms.map((el) => el.textContent?.trim())).toEqual(expected.map((f) => f.term));
});

/**
 * `<details>` open state is UA-owned. The composition uses the native control, so it toggles
 * without a line of JavaScript from the library or from the fixture — which is the whole reason
 * #176 shipped a class and not an element.
 */
test('the composed disclosure toggles through native semantics alone', async () => {
  const host = await mount();
  const details = host.querySelector<HTMLDetailsElement>('details[data-detail="north"]')!;
  const summary = details.querySelector<HTMLElement>('summary')!;

  expect(details.open).toBe(false);
  summary.click();
  expect(details.open).toBe(true);
  summary.click();
  expect(details.open).toBe(false);
});

/**
 * #178's live region, reached through the public `heading` slot and asserted INSIDE the region —
 * the distinction #228 was filed for. A heading rendered outside the live region is seen and
 * never heard.
 */
test('[SC-011] the consumer heading is inside the notice live region', async () => {
  const host = await mount();
  const notice = host.querySelector('sk-notice[data-banner]')!;
  const region = notice.shadowRoot!.querySelector('[role="status"], [role="alert"]')!;
  const heading = slotOf(notice, 'heading')!.assignedElements()[0];

  expect(heading?.textContent?.trim()).toBe(OPERATIONAL_MODEL.banner!.heading);
  expect(region.contains(slotOf(notice, 'heading')!)).toBe(true);
});

/**
 * #179's contract, exercised FROM A COMPOSITION rather than from its own story: a missing
 * interval is a published "No data" and never an interpolation. Unmarked, per the file header:
 * this is not an ADR-11 behaviour class, and it is here because a composition that quietly
 * interpolated would look entirely correct while lying about coverage.
 */
test('an interval with no observation publishes the literal and is never interpolated', async () => {
  const host = await mount();
  const chart = host.querySelector('sk-time-series-chart[data-series]') as Updatable;
  await chart.updateComplete;

  const north = OPERATIONAL_MODEL.series.find((datum) => datum.id === 'north')!;
  const missing = north.points.filter((point) => point.value === null);
  expect(missing.length).toBeGreaterThan(0);

  const published = Array.from(chart.shadowRoot!.querySelectorAll('[part="value"]')).map((cell) =>
    cell.textContent?.trim(),
  );

  // EXACT, not a count. Asserting only "there are three 'No data' cells" passes just as happily
  // over a table that publishes them in the WRONG intervals, which is what an interpolation that
  // shifts the series would produce. The expected sequence is derived from the model, so the
  // assertion compares the published table against the data the consumer supplied rather than
  // against a transcription of what the element currently emits.
  const expected = OPERATIONAL_MODEL.series.flatMap((datum) =>
    datum.points.map((point) => (point.value === null ? 'No data' : point.displayValue)),
  );
  expect(published).toEqual(expected);
  expect(published.filter((text) => text === 'No data')).toHaveLength(missing.length);
});
