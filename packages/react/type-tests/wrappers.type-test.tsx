/**
 * SC-310 — the wrapper's TYPES are the mission's stated value proposition, so they are asserted
 * rather than described. #75's spec claimed "typed refs, typed props" on the strength of a spike
 * that read the generated output by eye; nothing compiled it.
 *
 * `@ts-expect-error` is red-first BY CONSTRUCTION: if the error it names stops occurring, tsc
 * reports "Unused '@ts-expect-error' directive" and this file fails. A plain negative test can
 * rot into a no-op; this one cannot.
 *
 * There is nothing to run. `tsc --noEmit` IS the assertion, via packages/react/project.json's
 * typecheck target — which scripts/typecheck-all.mjs picks up because it derives its project
 * list from `nx show projects --with-target typecheck` rather than naming projects by hand.
 */
import * as React from 'react';
import { SkFormInput, SkNavPill, type SkFormInputElement } from '../src/index.js';

// --- props are typed, and inherited ones are present -----------------------------------
// value/label/required are inheritedFrom FormControlBase with privacy public. FR-004 said for
// every draft that inherited members must NOT become props; implemented literally this line
// would not compile.
export const ok = <SkFormInput value="hello" label="Name" required disabled={false} />;

// @ts-expect-error `required` is boolean, not string
export const wrongType = <SkFormInput required="yes" />;

// @ts-expect-error there is no `flavour` prop on sk-form-input
export const unknownProp = <SkFormInput flavour="strawberry" />;

// @ts-expect-error `error` is a read-only getter and is deliberately NOT a settable prop —
// the generator emits it as one off the shelf, and scripts/build-react-wrappers.mjs strips
// readonly members from the manifest it feeds the generator. If that filter is removed, this
// directive goes unused and the file fails.
export const readonlyProp = <SkFormInput error="boom" />;

// --- refs are typed to the ELEMENT, not to HTMLElement ----------------------------------
export function TypedRef() {
  const ref = React.useRef<SkFormInputElement>(null);
  React.useEffect(() => {
    // The whole point of a typed ref: an element method, resolved without a cast.
    ref.current?.setCustomError('taken');
    // @ts-expect-error no such method on the element
    ref.current?.setCustomErrorTypo('taken');
  }, []);
  return <SkFormInput ref={ref} />;
}

// --- events ------------------------------------------------------------------------------
// WP01 T004 types this event's detail in the element's own @fires JSDoc. Until that lands the
// handler receives a bare CustomEvent, so this asserts only that the handler EXISTS and is
// wired. When WP01 lands, tighten this to read `e.detail.open` and drop the cast.
export const withHandler = (
  <SkNavPill onSkNavPillToggle={(e: CustomEvent) => void (e.detail as { open: boolean }).open} />
);
