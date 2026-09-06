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
import {
  SkActionRow,
  SkCard,
  SkFormInput,
  SkNavPill,
  SkTransitionMatrix,
  type ActionRowActivateDetail,
  type SkCardProps,
  type SkFormInputElement,
  type TransitionMatrixSelectDetail,
} from '../src/index.js';
import type { StatusIndicatorTone, TransitionMatrixProperties } from '@spec-kitty/elements';

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
// TIGHTENED, now that WP01 T004 has landed. `sk-nav-pill.ts`'s `@fires` carries
// `{CustomEvent<{ open: boolean }>}`, the analyzer records it as `events[].type.text`, and the
// generator emits the generic — so `e.detail.open` resolves with no cast. That closes the gap
// the plan called "the single sharpest answer to SC-305": the missing type was our JSDoc, not a
// limitation of the generator.
export const withHandler = <SkNavPill onSkNavPillToggle={(e) => void e.detail.open} />;

// @ts-expect-error the detail is typed now, so a wrong field on it is an error rather than `any`
export const wrongDetail = <SkNavPill onSkNavPillToggle={(e) => void e.detail.opened} />;

// --- transition matrix -------------------------------------------------------------------
const transitionColumns = [
  { id: 'previous', label: 'Previous' },
  { id: 'current', label: 'Current' },
] as const;
const transitionRoutes = [
  {
    id: 'planned-progress',
    label: 'Planned → In progress',
    tone: 'forward',
    group: 'Forward flow',
    values: { previous: 3, current: 5 },
  },
] as const;

export const transitionMatrixAllProps = (
  <SkTransitionMatrix
    columns={transitionColumns}
    routes={transitionRoutes}
    selectedRouteId="planned-progress"
    selectable
    windowLabel="Last 72 hours"
    description="Moves grouped by route and day."
    selectionHint="Select any row to inspect its WPs."
    onSkTransitionMatrixSelect={(event) => {
      const detail: TransitionMatrixSelectDetail = event.detail;
      void detail.routeId.toUpperCase();
      // @ts-expect-error the callback detail is typed rather than `any`
      void event.detail.route;
    }}
  />
);

const transitionMatrixPropertyContract = {
  columns: transitionColumns,
  routes: transitionRoutes,
  selectedRouteId: 'planned-progress',
  selectable: true,
  windowLabel: 'Last 72 hours',
  description: 'Moves grouped by route and day.',
  selectionHint: 'Select any row to inspect its WPs.',
} satisfies TransitionMatrixProperties;
void transitionMatrixPropertyContract;

// @ts-expect-error all seven public fields are known and arbitrary fields stay outside the contract
const transitionMatrixUnknownProperty: TransitionMatrixProperties = { ...transitionMatrixPropertyContract, currentOpenWPs: 50 };
void transitionMatrixUnknownProperty;

const invalidToneRoutes = [
  { id: 'bad-tone', label: 'Bad tone', tone: 'warning', values: { previous: 1, current: 2 } },
] as const;
// @ts-expect-error `warning` is not one of the five transition tones
export const transitionMatrixInvalidTone = <SkTransitionMatrix routes={invalidToneRoutes} />;

const invalidCountRoutes = [
  { id: 'bad-count', label: 'Bad count', tone: 'forward', values: { previous: '3' } },
] as const;
// @ts-expect-error route counts are numbers, not numeric strings
export const transitionMatrixInvalidCount = <SkTransitionMatrix routes={invalidCountRoutes} />;

// @ts-expect-error consumer-authored copy is a string
export const transitionMatrixInvalidCopy = <SkTransitionMatrix description={42} />;

// @ts-expect-error event detail route ids are strings
export const transitionMatrixInvalidDetail: TransitionMatrixSelectDetail = { routeId: 42 };

// --- action row --------------------------------------------------------------------------
export const actionRowAllProps = (
  <SkActionRow
    rowId="sentinel-row"
    selectable
    selected={false}
    onSkActionRowActivate={(event) => {
      const detail: ActionRowActivateDetail = event.detail;
      void detail.id.toUpperCase();
      // @ts-expect-error action-row detail is exactly `{ id }`, not the element prop name
      void event.detail.rowId;
      // @ts-expect-error a second unknown key ensures the detail is not `any`
      void event.detail.routeId;
    }}
  />
);

// @ts-expect-error rowId is a consumer-owned string
export const actionRowInvalidRowId = <SkActionRow rowId={146} />;

// @ts-expect-error selectable is boolean, not a string attribute
export const actionRowInvalidSelectable = <SkActionRow selectable="true" />;

// @ts-expect-error selected is boolean, not a string attribute
export const actionRowInvalidSelected = <SkActionRow selected="false" />;

// --- sk-card: the status axis reaches the wrapper as a UNION, not as `any` (#177) ----------
//
// The generated prop is `SkCardElement["status"]`, so what is proved here is that the element's
// own field type survives generation. It matters because packages/react/src is generated and
// committed: a union that degraded to `any` or `string` would be invisible to every runtime
// gate in this repo, and every one of them would stay green.
export const cardStatus = <SkCard status="danger" variant="purple" />;

// @ts-expect-error "failed" is a domain word, not a tone — the card holds no domain mapping
export const cardStatusDomainWord = <SkCard status="failed" />;

// @ts-expect-error `status` is the six-tone union, not an arbitrary string
export const cardStatusArbitrary = <SkCard status={'anything' as string} />;

// THE ONE VOCABULARY, proved at COMPILE TIME rather than by reading two files side by side.
//
// `sk-card.ts` has to spell its union out inline — build-vue-types.mjs copies the manifest's
// type text verbatim into a vue.d.ts that imports nothing, so a type alias there emits an
// unresolved identifier. These two assignments are what stop that spelling from drifting: they
// hold in BOTH directions, so the card's union cannot gain a tone #146 does not have, and
// cannot lose one it does.
//
// Mutual assignability is also what rules out `any` from the other side: `any` would satisfy
// both lines, but then the two `@ts-expect-error` directives above would go UNUSED, which tsc
// reports as an error in its own right. Neither half proves it alone.
const toneToCard: NonNullable<SkCardProps['status']> = 'recovery' satisfies StatusIndicatorTone;
const cardToTone: StatusIndicatorTone = toneToCard;
void cardToTone;

const everyTone: readonly NonNullable<SkCardProps['status']>[] = [
  'neutral',
  'info',
  'success',
  'attention',
  'danger',
  'recovery',
] satisfies readonly StatusIndicatorTone[];
void everyTone;
