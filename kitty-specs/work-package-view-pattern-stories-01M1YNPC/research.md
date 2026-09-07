# Research: Work Package overview/detail pattern stories

## Question

Can #214 prove T10/T11 route composition using the public train surfaces without creating a page
component or importing Team Kitty behavior?

## Sources read

| Source | Role | Finding |
|---|---|---|
| GitHub #214 | Binding contract | Storybook render functions and immutable fixtures only; fifteen named overview/detail route states when dark/light are explicit. |
| Epic #208 | Programme authority | T10/T11 approved intent; application owns routing/data/timers/trust/progress inputs; final composition must cover all child surfaces. |
| #178 | Notice predecessor | `sk-notice` owns announced snapshot/retention messages and no timers/application state. |
| #209 | Board predecessor | Native sections/headings/ordered lists; conditional accessible scroller; consumer owns lanes/mobile choice. |
| #210 | Progress predecessor | Native labelled determinate `progress`; consumer supplies all values and text. |
| #211 | Select predecessor | Native light-DOM select/options; consumer owns selected lane and change handling. |
| #212 | Work-item predecessor | Card-layout action row, compact/circular marker, pulsing supplied status, inline empty state; selected is controlled. |
| #213 | Detail predecessor | Native breadcrumbs/prose/timeline and passive check-bullet state; no parsing/order/trust behavior. |
| ADR-9 | Styling boundary | Tokens/parts/documented properties only; no cross-shadow selectors; keep native relationships in one root. |
| ADR-10 | Distribution | Storybook is the only cross-layer composition seam; no duplicated authored component markup or CSS. |
| ADR-11 | Verification | Real browser behavior, axe, cross-browser, visual, and non-vacuous assertions; no render-only behavior tests. |
| Current authoring recipe | Operational gate | Regenerate/check artifacts, run type/quality/behavior/mutation/Storybook/axe, CI visuals authoritative. |
| `team-overview.stories.ts` (#150) | Pattern precedent | Domain fixture/selectors/render helper can live in excluded `*.stories.ts`; Storybook args/spies express controlled intent. |
| Storybook preview | Cross-layer seam | Already loads light-DOM facts/disclosure/empty-state CSS globally; add only the required scoped predecessor styles here. |
| T10/T11 Stitch URLs | Visual intent | Direct unauthenticated requests on 2026-09-07 returned only the generic application/login shell; screen payloads were unavailable. |

## Repository observations

- `packages/elements/tsconfig.lib.json` excludes `src/**/*.stories.ts`; an ordinary fixture/helper
  module under that tree would be emitted and is therefore the wrong place for Team Kitty-shaped
  demo data.
- The current axe ratchet total is 285. Fifteen new user-facing stories make the expected total
  300; the built index is the authority for normalized IDs.
- Native styles required by #214 are not all loaded in Storybook preview today. Elements stories
  cannot import stylesheet files under the module-boundary/no-CSS-in-source rules; preview is the
  sanctioned place.
- The public action-row contract already supplies a native button when `selectable` and emits one
  non-cancelable bubbling/composed `sk-action-row-activate { id }`; selected remains consumer-owned.
- The public workflow-board CSS makes overflow presentation available but deliberately does not
  measure it or add semantics. The story must add the region/name/tabindex triad only in fixtures
  that are known to overflow and must verify that condition live.
- Child stories and CI baselines provide the executable visual vocabulary. #214 must add only
  composition baselines and preserve every legacy PNG byte.

## Options considered

### Separate published fixture/render modules

Rejected. Even without a barrel export, TypeScript emits an ordinary source module into the
published tree. It would turn Team Kitty-shaped pattern data into library output and conflict with
the story-only contract.

### Two unrelated overview/detail fixtures

Rejected. It permits repeated Work Package identity, claim, progress, subtask, and history fields to
drift and cannot prove the epic's single-fixture seam.

### One excluded story module with pure selectors

Selected. It matches #150, remains discoverable by Storybook, is excluded from product builds, and
keeps fixture/selector/render changes reviewable together.

### Wrapper element for the complete route

Rejected by #214 and the predecessor decisions. It would own a new page API and sever or duplicate
the native relationships the styles-only primitives exist to preserve.

## Visual evidence limitation

The exact T10 and T11 IDs are recorded and were requested directly. The response contained their
query identifiers but no screen image, hierarchy, measurements, or export payload without an
authenticated project session. This is not an architectural blocker because #208/#214 transcribe
the required composition/states and the accepted child surfaces constrain the implementation. It
does mean final evidence must say “qualitative intent plus accepted child baselines,” never “pixel
match to an independently exported Stitch frame.”

## Conclusion

Proceed without a new ADR. A single Storybook-only module, the existing preview cross-layer CSS
seam, public predecessor contracts, real built-story browser tests, the axe ratchet, and
CI-authoritative new visual baselines satisfy #214 without widening library ownership.
