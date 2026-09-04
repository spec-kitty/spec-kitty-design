/// <reference types="@spec-kitty/elements/vue" />
/**
 * The generated Vue types, compiled (#81).
 *
 * A `.d.ts` that is never compiled is a claim, not a capability — the same reason #75 ships
 * type-tests for the React wrappers rather than trusting their declarations. This file is
 * type-checked by `nx run vue-consumer-fixture:typecheck`; nothing here runs.
 */
import type { GlobalComponents } from 'vue';

// Every element the manifest declares is reachable from a Vue template's type space.
type Footer = GlobalComponents['sk-site-footer'];
type PillTag = GlobalComponents['sk-pill-tag'];

// Props are typed from the manifest, not `any`.
const legal: Footer['legal'] = '© 2026 Example';
const variant: PillTag['variant'] = 'green';

// @ts-expect-error 'chartreuse' is not one of the declared variants
const bad: PillTag['variant'] = 'chartreuse';

export type { Footer, PillTag };
export { legal, variant, bad };
