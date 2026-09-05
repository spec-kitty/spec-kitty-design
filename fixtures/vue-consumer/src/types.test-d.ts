/// <reference types="@spec-kitty/elements/vue" />
/**
 * The generated Vue types, compiled (#81).
 *
 * TESTED THROUGH THE COMPONENT TYPE, not by indexing a props object.
 *
 * The first version of this file asserted `GlobalComponents['sk-pill-tag']['variant']`. That
 * passed — and proved nothing about a template, because the generated entries were bare props
 * objects, which Volar cannot extract props from at all. A lens compiled a real `.vue` with
 * `vue-tsc` and found `<sk-button variant="chartreuse">` raising no error whatsoever. The
 * declaration was correct and the consumption path was unchecked: a verified guard at the wrong
 * call site.
 *
 * Entries are now `DefineComponent<...>`, so props are reached the way Vue reaches them —
 * `InstanceType<C>['$props']`. `Bad.vue` alongside this file is the end-to-end check under
 * `vue-tsc`; this one keeps a fast `tsc`-only signal on the same contract.
 */
import type { GlobalComponents } from 'vue';

type PropsOf<C> = C extends abstract new (...args: never) => { $props: infer P } ? P : never;

type Footer = PropsOf<GlobalComponents['sk-site-footer']>;
type PillTag = PropsOf<GlobalComponents['sk-pill-tag']>;
type TransitionMatrix = PropsOf<GlobalComponents['sk-transition-matrix']>;

// Props are typed from the manifest, not `any`.
const legal: Footer['legal'] = '© 2026 Example';
const variant: PillTag['variant'] = 'green';
const columns: NonNullable<TransitionMatrix['columns']> = Object.freeze([
  Object.freeze({ id: 'fri-4', label: 'Today · Fri 4' }),
]);
const routes: NonNullable<TransitionMatrix['routes']> = Object.freeze([
  Object.freeze({
    id: 'planned-progress',
    label: 'Planned → In progress',
    tone: 'forward',
    values: Object.freeze({ 'fri-4': 5 }),
  }),
]);

// @ts-expect-error 'chartreuse' is not one of the declared variants
const bad: PillTag['variant'] = 'chartreuse';

// @ts-expect-error a transition column requires consumer-owned visible label text
const badColumn: NonNullable<TransitionMatrix['columns']>[number] = { id: 'fri-4' };

const badRoute: NonNullable<TransitionMatrix['routes']>[number] = {
  id: 'planned-progress',
  label: 'Planned → In progress',
  // @ts-expect-error route tone remains the exported semantic union, never an arbitrary string
  tone: 'warning',
  values: { 'fri-4': 5 },
};

export type { Footer, PillTag, TransitionMatrix };
export { legal, variant, columns, routes, bad, badColumn, badRoute };
