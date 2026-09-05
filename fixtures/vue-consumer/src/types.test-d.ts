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

// Props are typed from the manifest, not `any`.
const legal: Footer['legal'] = '© 2026 Example';
const variant: PillTag['variant'] = 'green';

// @ts-expect-error 'chartreuse' is not one of the declared variants
const bad: PillTag['variant'] = 'chartreuse';

export type { Footer, PillTag };
export { legal, variant, bad };
