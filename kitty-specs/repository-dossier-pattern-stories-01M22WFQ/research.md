# Research: Repository Dossier Pattern Stories

## Decision summary

The approved Repository Dossier family can be proven in one Storybook pattern module using only the public contracts already merged into `train/elements-first`. One deeply frozen fixture family supplies repository, branch, commit, mission, warning, status, progress, and action-display facts; pure projections choose what each state shows or omits. The mission adds no component, token, package dependency, backend contract, or application behavior.

One work package is the honest architectural boundary. The fixture, renderer, focused interaction/invariant tests, registry changes, documentation, and exact-head visual baselines form one inseparable proof; splitting them would produce either unverified stories or tests with no deliverable surface.

## Evidence reviewed

- Live GitHub issue #255, tracking epic #253, all issue comments/timeline references, and the merged contracts linked through #150, #176-#178, #210, #212-#214, #254, #256, and #257.
- Approved Repository Dossier evidence under `/home/jeroennouws/dev/team-kitty-missions/ux_redesign/repository-dossier/`: `README.md`, `DESIGN.md`, `BACKEND-CAPABILITY-MAP.md`, `SCREEN-MATRIX.md`, `UX-DECISION-REPORT.md`, and dark screens D1, D2, D4, D5, D6, D7, and D8.
- Current `train/elements-first` component contracts, component authoring instructions, charter, ADRs, package scripts, existing pattern stories/tests, visual registry, story ratchet, and composition gate.
- Dependency state at mission start: #212/PR #252 and #213 are merged; #254/PR #268, #256/PR #262, and #257/PR #290 are merged. No temporary substitute is required.

## Binding interpretation

- D1 is the populated desktop reference in default dark mode.
- D2 proves the same information at 390 px with the public controlled compact-navigation seam in both closed and open states. Drawer state is consumer-owned demonstration state only.
- D4's inspected branch, default branch, and merged fact are separately supplied. “Merged” is a fixture-consistency assertion, not a truth-inference API.
- D5 is terminal and not a completed dossier: it has setup guidance but no commit fact or completed-only action.
- D6 ties one supplied snapshot SHA to one supplied affected mission and uses existing action-row supporting/status surfaces rather than a new wrapper or status axis.
- D7 represents indexing with stable notice/live and busy semantics. It provides no timer, polling, spinner logic, or unavailable repository facts.
- D8 is a completed repository with a real commit and zero missions. It uses setup guidance and omits invented zero rows/counts/progress.
- LightMode is a design-system system proof, not approval of the deferred D3 product design.
- Exact clipboard behavior belongs to `sk-copy-field`; the Dossier story supplies values and labels but does not simulate success.

## Public composition map

| Need | Public contract |
|---|---|
| Responsive shell and controlled drawer | `sk-app-shell` compact presentation, consumer `open`, dismiss event, focus return, inert/ARIA behavior |
| Grouped/nested repository navigation | native `nav`/`ul`/`li`/`a` with `.sk-context-nav` classes |
| Repository hierarchy | native breadcrumbs and prose/detail primitives from #213 |
| Facts and tabular content | native `.sk-facts` and `.sk-data-table` families |
| Status cards/meaning | `sk-card` status tone plus `sk-status-indicator` and explicit text |
| Notices and pending state | `sk-notice` with stable announcement modes and `aria-busy` on the owned region |
| Mission/action rows | `sk-action-row` `layout="card"`, supporting slot, entity marker, status indicator, and inline empty state |
| Progress | native labelled `<progress>` with `.sk-progress`; consumer supplies reconciled value and text |
| Exact value copy | `sk-copy-field` |
| Empty guidance | existing inline/regular empty-state primitives and native content |

## Alternatives rejected

| Alternative | Rejected because |
|---|---|
| Publish `sk-repository-dossier` or `sk-mission-row` | Converts a product composition into a design-system API and violates explicit scope. |
| Add a truth/provenance band | Freezes Team Kitty truth policy in the library and duplicates existing notice/fact/status composition. |
| Copy the approved HTML/CSS literally | Bypasses current public contracts, duplicates component styling, and may encode obsolete token values. |
| Compute merged state or progress in the story | Invents application behavior and makes fixture evidence appear authoritative. |
| Use a mutable mock store or polling timer | Adds behavior #255 expressly excludes and makes visual states nondeterministic. |
| Hide missing facts behind zero values | Falsely turns unknown or absent information into measured information. |
| Split stories and evidence into multiple WPs | Creates temporary acceptance gaps and overlapping shared-file edits. |

## Risks and mitigations

- **Dense pattern markup**: use small typed render helpers and projections, keeping every helper story-local and pure.
- **Fixture drift**: recursively freeze fixtures and assert repeated identities and state-specific omissions.
- **A11y hidden by screenshots**: assert native landmarks/headings/lists/progress/code/time, copy and drawer behavior, then run axe for every state.
- **CSS boundary drift**: use only pattern-owned tokenized layout styles and run `check-pattern-composition.mjs` plus its self-test.
- **Generated-file/train conflicts**: fetch/rebase before review, regenerate from source, and approve only the exact rebased SHA.
- **Visual overfitting**: compare content hierarchy and UX intent to each approved image while deferring to current component contracts and tokens.

## Open questions

None. The live issue and landed dependency contracts resolve the composition and ownership boundaries.
