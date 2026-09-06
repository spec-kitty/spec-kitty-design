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
  SkEvidenceChain,
  SkFormInput,
  SkMetric,
  SkNavPill,
  SkNotice,
  SkTransitionMatrix,
  type ActionRowActivateDetail,
  type SkCardProps,
  type SkFormInputElement,
  type SkNoticeProps,
  type TransitionMatrixSelectDetail,
} from '../src/index.js';
import type {
  EvidenceStage,
  NoticeAnnounce,
  SkNoticeDismissDetail,
  StatusIndicatorTone,
  TransitionMatrixProperties,
} from '@spec-kitty/elements';

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

// --- metric and evidence chain -----------------------------------------------------------
export const metricAllProps = (
  <SkMetric
    label="Items processed"
    displayValue="128"
    annotation="Within range"
    tone="success"
    compact
  />
);

// @ts-expect-error metric tones are the generic four-value presentation union
export const metricInvalidTone = <SkMetric label="Items processed" displayValue="128" tone="warning" />;

// @ts-expect-error displayValue is opaque display text, never a number
export const metricInvalidValue = <SkMetric label="Items processed" displayValue={128} />;

const evidenceStages = Object.freeze([
  Object.freeze({ id: 'received', label: 'Items received', displayValue: '128', tone: 'info' as const }),
  Object.freeze({ id: 'reviewed', label: 'Items reviewed', displayValue: '91%' }),
]) satisfies ReadonlyArray<EvidenceStage>;

export const evidenceChainStages = <SkEvidenceChain stages={evidenceStages} />;

const invalidEvidenceTone = Object.freeze([
  Object.freeze({ id: 'bad-tone', label: 'Bad tone', displayValue: '1', tone: 'warning' as const }),
]);
// @ts-expect-error evidence tones use the same generic four-value presentation union
export const evidenceChainInvalidTone = <SkEvidenceChain stages={invalidEvidenceTone} />;

const malformedEvidenceStages = Object.freeze([
  Object.freeze({ id: 'missing-value', label: 'Missing value' }),
]);
// @ts-expect-error every stage requires opaque displayValue text
export const evidenceChainMalformedStage = <SkEvidenceChain stages={malformedEvidenceStages} />;

// --- sk-notice: the tone union AND the dismiss detail reach the wrapper, neither as `any` (#178)

export const noticeTone = <SkNotice tone="danger" announce="assertive" message="The deploy failed" />;

// @ts-expect-error "failed" is a domain word, not a tone — sk-notice holds no domain mapping
export const noticeToneDomainWord = <SkNotice tone="failed" />;

// @ts-expect-error `tone` is the six-tone union, not an arbitrary string
export const noticeToneArbitrary = <SkNotice tone={'anything' as string} />;

// @ts-expect-error `announce` is off | polite | assertive — `loud` is not a politeness
export const noticeAnnounceWrong = <SkNotice announce="loud" />;

// THE ONE VOCABULARY, again at COMPILE TIME — and this is what makes "sk-notice consumes
// STATUS_TONES rather than restating it" checkable rather than a claim in a comment.
//
// sk-notice.ts imports STATUS_TONES for its RUNTIME validation, so there is no second runtime
// copy at all. What it still has to spell out inline is the `tone` FIELD ANNOTATION, because
// build-vue-types.mjs copies the manifest's type text verbatim into a vue.d.ts that imports
// nothing, so a type alias there emits an unresolved identifier (#216 records this as the second,
// independent copy — distinct from the markup-module one, which sk-notice does not have because
// it authors no *.markup.ts). These two assignments are what stop that spelling from drifting:
// they hold in BOTH directions, so the notice's union can neither gain a tone #146 does not have
// nor lose one it does.
//
// `any` would satisfy both lines — but then the three `@ts-expect-error` directives above would
// go UNUSED, which tsc reports as an error in its own right. Neither half proves it alone.
const toneToNotice: NonNullable<SkNoticeProps['tone']> = 'recovery' satisfies StatusIndicatorTone;
const noticeToTone: StatusIndicatorTone = toneToNotice;
void noticeToTone;

const everyNoticeTone: readonly NonNullable<SkNoticeProps['tone']>[] = [
  'neutral',
  'info',
  'success',
  'attention',
  'danger',
  'recovery',
] satisfies readonly StatusIndicatorTone[];
void everyNoticeTone;

// The politeness axis is its OWN vocabulary, not a slice of the tone one, and it is pinned the
// same way so the three levels cannot drift from the element's declared union either.
const everyAnnounce: readonly NonNullable<SkNoticeProps['announce']>[] = [
  'off',
  'polite',
  'assertive',
] satisfies readonly NoticeAnnounce[];
void everyAnnounce;

// --- the dismiss event detail survives generation as a TYPE, not as a bare CustomEvent --------
//
// Without the `{Type}` in the element's `@fires` JSDoc the manifest records `type: None` and the
// generated React handler receives a bare `CustomEvent` whose `detail` is `any` — a degradation
// no runtime gate in this repo can see, because packages/react/src is generated and committed and
// every one of them would stay green.
export const noticeHandler = (
  <SkNotice onSkNoticeDismiss={(event) => void (event.detail satisfies SkNoticeDismissDetail)} />
);

// @ts-expect-error the detail is typed, so a field that is not on it is an error rather than `any`
export const noticeHandlerWrongDetail = <SkNotice onSkNoticeDismiss={(event) => void event.detail.status} />;

// @ts-expect-error the detail's `tone` is the six-tone union, so a domain word is not assignable
export const noticeDetailDomainWord: SkNoticeDismissDetail = { tone: 'failed' };
