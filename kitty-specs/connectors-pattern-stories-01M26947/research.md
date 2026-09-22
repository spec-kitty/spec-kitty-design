# Research: Connectors Pattern Stories (#338)

## Method

Every surface named below was verified against the actual train source at this checkout's base
(`train/elements-first@7032cf77`, mission HEAD `df4175d5`), not trusted from the issue body or the
product corpus. Verification commands:

```sh
ls packages/elements/src/ packages/styles/src/
grep -n "@slot\|@csspart\|part=\|@element\|variant\|tone" packages/elements/src/<name>/sk-<name>.ts
```

Dependency state (checked 2026-09-10, `gh issue view`/`gh pr view` against `spec-kitty/spec-kitty-design`):

| Dependency | Issue state | PR | PR state |
|---|---|---|---|
| #336 TKC1 native radio-choice-group | OPEN | none found | — |
| #337 TKC2 native section-navigation | OPEN | none found | — |
| #280 responsive facts-grid extension | OPEN | none found | — |
| #307 static action-row with trailing controls | OPEN | #331 | UNSTABLE |
| #320 sk-button danger-secondary axis | OPEN | none found | — |
| #321 .sk-input/sk-form-input contrast+target-size | OPEN | none found | — |

All six are genuinely open with no mergeable public contract. Nothing here is copied from #331's
branch or from any other unmerged PR.

## Verified public surfaces on the train today

| Surface | Package | What's confirmed present |
|---|---|---|
| `sk-app-shell` | elements | slots `personal-rail`, `context-sidebar`, `compact-header`, `compact-navigation`, `page-header`, default; parts `shell/personal/context/compact-header/compact-navigation/content/header/main` |
| `sk-personal-rail` | elements | slots `primary`, `utilities`, `account`, `logout` |
| `sk-context-sidebar` | elements | slots `header`, default, `footer` |
| `sk-page-header` | elements | slots `eyebrow`, `title`, `supporting`, `sync`, `actions` |
| `sk-card` | elements | `variant`, `status` tone (shares `sk-status-indicator`'s vocabulary) |
| `sk-status-indicator` | elements | `tone`: `neutral\|info\|success\|attention\|danger\|recovery` — **`danger` already exists**, so `needs_reauth`/revoked/failed can map to it today with no dependency |
| `sk-pill-tag` | elements | `variant` (green/purple/breaking/yellow) + independent `status` tone (same vocabulary as above) |
| `sk-notice` | elements | `tone` (same vocabulary), `actions` slot, `heading`/`marker` slots, dismiss event |
| `sk-button` | elements | `variant`: `primary\|secondary\|ghost` only — **no `danger`/destructive tone**, confirms #320 is genuinely required for any destructive-styled button |
| `sk-confirm-dialog` | elements | parts `dialog/title/body/actions/cancel/confirm` — the dialog mechanism itself is public and unblocked; only the destructive button treatment inside it (#320) is blocked |
| `sk-copy-field` | elements | parts `field/value/copy-control/status`, `sk-copy-field-result` event |
| `sk-action-row` | elements | slots `marker/title/reference/tags/metadata/supporting/controls`; parts include `controls`; `layout="card"` — **the interactive Lit element already exposes a public `controls` slot today** (see finding below) |
| `.sk-facts` | styles | stacked, compact, and `--two-col` layouts only — **no grouped/reflowing fact-pair grid**; confirms #280 is genuinely required for any grouped facts-grid composition |
| `.sk-data-table` | styles | default, narrow-scrollable, sticky-header exemplars |
| `.sk-empty-state` | styles | inline, with-action, without-action |
| `.sk-context-nav` | styles | grouped/nested sidebar navigation with `aria-current` — **verified NOT a substitute for #337** (see below) |
| `.sk-form-select` | styles | native select incl. optgroups, disabled, required-invalid, long-options |
| `sk-form-input` / `.sk-form-field` | elements/styles | present; #321 fixes a contrast/target-size defect, it does not gate the component's existence |
| `.sk-breadcrumbs` | styles | present, usable for Installation Detail hierarchy |

## Finding: `sk-action-row`'s `controls` slot is already public, ahead of #307/PR #331

Read `packages/elements/src/action-row/sk-action-row.ts` at HEAD: it already renders
`<slot name="controls">` behind `part="controls"`, documented in its JSDoc (`@slot controls -
Independent trailing controls.`). This landed via a prior mission (#288, "native route and flush
modes"), independent of #307.

`packages/styles/src/action-row/` currently holds only `sk-action-row.css` — no `.html` exemplars,
no `-html.stories.ts`. Open PR #331 (UNSTABLE) adds exactly that: the **static, server-rendered,
two-element-wrapper markup form** of `sk-action-row` (`actionRowStaticHtml()`), for no-JS
consumers. It does not touch the interactive element's public slot contract.

Every one of the four pattern-story precedents (`repository-dossier`, `mission-kanban`,
`work-package-view`, and the #259 composition fixture) composes the **interactive Lit elements**
in Storybook, not the static HTML string exports. If #338 stories follow that same precedent, a
row with trailing controls (e.g. a reconnect/disconnect action beside a linked-account or a
provider row) is **not actually blocked by #307/PR #331** for the JS-rendered Storybook
composition — only the no-JS static form is.

**This is recorded as a measured finding, not acted on unilaterally.** The issue explicitly names
#307 among the six hard dependencies, and the operator may have reasons (consistency once the
static form lands, or an intent to also prove the static form) not visible from source alone. FR
entries below keep `#307` blocked exactly where the issue's "Dependencies" section names it, but
this finding is surfaced for the operator's disposition in the report.

## Finding: `.sk-context-nav` is not a substitute for #337 (TKC2 section-navigation)

`.sk-context-nav` (`packages/styles/src/context-nav/`) is a grouped/nested navigation family —
current-item, parent/child structure, "unavailable" annotations, overflow — built for the
personal-rail/context-sidebar tree, not for a flat strip of sibling routes. Epic #335 and #338 both
describe TKC2 as "a native, anchor-based section navigation strip for sibling routes... without tab
semantics" — the Installation Detail sub-navigation between Workspace Scope / Project Routing /
Team Accounts (C6→C7/C8/C9a), which DESIGN.md's Visual Rules section calls "native links and
current-location semantics" for "tabs." No existing family provides a sibling-route strip with
`aria-current="page"` outside a nested tree. Confirmed absent: `find . -iname "*section-nav*"`
returns nothing under `packages/`. #337 is genuinely required wherever the Installation Detail
sub-navigation appears (C6, C7, C8, C9a).

## Finding: no radio-choice-group family exists (TKC1, #336)

`find . -iname "*radio-choice*"` returns nothing. `packages/styles/src/checkbox-choice-group/`
exists (#277, multi-select) and is explicitly a *distinct* contract per the epic body. No
exactly-one native radio-group family exists on the train. #336 is genuinely required wherever the
issue calls for an exactly-one submitted choice — concretely, C5's GitLab group selection.

## Canvas → surface → dependency map

| Canvas | Composes (verified public, unblocked) | Blocked dependency, and for what | Pattern-owned |
|---|---|---|---|
| **C1** setup index | `sk-app-shell`, `sk-personal-rail`, `sk-context-sidebar`, `sk-page-header`, `sk-card`, `sk-notice` (server-configuration-gap explanations), `.sk-empty-state`, `sk-button` (primary/secondary/ghost only — no dead/destructive action needed here) | none identified | provider card grid layout, admin-empty projection selectors |
| **C2** operating index | Same shell/header family; `sk-card[status]`, `sk-status-indicator` (`danger` for `needs_reauth`/revoked/failed — unblocked), `sk-pill-tag`, `sk-action-row` (Lit `controls` slot — public today), `sk-notice` (Slack outbound-only framing) | **none — `#307` dropped 2026-09-10, see Dependency reconciliation below** | provider card grid, admin/member projection, health-mix fixture |
| **C3** provider handoff | `sk-notice`, `sk-card`, `sk-status-indicator`, `sk-button` (busy-cue part for waiting state) | none identified for the loading/failure/completing states themselves | waiting/completing/source-exact-failure projection selectors |
| **C4** GitHub App setup failure | `sk-notice` (failure explanation), `sk-page-header`/breadcrumbs (resolved-Team back route), `sk-button` | none identified — the "no-Team boundary variant" is an omission (absent back-link), provable with existing primitives | back-route presence/absence projection |
| **C5** GitLab group selection | `sk-card`, `sk-notice` (validation/refresh-failure), `sk-button` | **`#336`** — exactly-one group choice is the radio-choice-group's defining contract, unchanged hard block; **`#321`** — reported degraded-not-hard 2026-09-10, pending ruling (today's `.sk-input` already tells validation-state facts truthfully; only the border-contrast/target-size floor would need a later reshoot) | populated/no-groups/validation/connected-after-refresh-failure fixture states; announce-only submit interception |
| **C6** installation detail shell | `sk-app-shell`, `sk-page-header`, `sk-card[status]`, `sk-status-indicator`, `sk-copy-field` (installation IDs), `.sk-breadcrumbs`, `.sk-facts` (stacked, narrowed) | **`#337`** — the Workspace Scope / Project Routing / Team Accounts sub-navigation is exactly TKC2's contract. `#280` dropped 2026-09-10 — see Dependency reconciliation below; grouped-reflow presentation deferred as a follow-up | admin/member shell projection, authoritative health variant selectors |
| **C7** workspace scope tab | `.sk-data-table`, `.sk-facts` (stacked, narrowed, shared header), `.sk-empty-state`, `sk-notice` (unavailable, stale-after-refresh-failure) | **`#337`** — reached via the same sub-navigation as C6. `#280` dropped 2026-09-10 — C7's own tab-unique content (`scope-stats`, `scope-table`) never needed it | populated/empty/unavailable/stale-persisted projection; member admin-only boundary |
| **C8** project routing/admitted repos | `.sk-data-table`, `sk-status-indicator`, `.sk-empty-state`, `sk-confirm-dialog` (hard-purge confirmation — dialog itself unblocked), `sk-form-input`/`.sk-form-select` (Jira rescue state) | **`#337`** (sub-navigation, unchanged); **`#320`** and **`#321`** — both reported degraded-not-hard 2026-09-10, pending ruling (`sk-button--secondary` inside `sk-confirm-dialog`'s `confirm` part, and today's `.sk-input`, both already tell C8 truthfully; both would need a later reshoot) | active/disabled mapping projection, admitted/withdrawn repository states, hard-purge confirm wiring (mutation-free) |
| **C9a** team account links | `sk-action-row` rows (public `controls` slot), `sk-status-indicator` (`danger` for `needs_reauth`/revoked — unblocked), `sk-pill-tag` | **`#337`** (sub-navigation, unchanged); **`#320`** for the self-unlink button's destructive treatment — reported degraded-not-hard 2026-09-10, pending ruling (`sk-button--secondary` already tells it truthfully). `#307` dropped 2026-09-10 — same finding as C2 | active/unhealthy/unlinked/empty projection; self-owned-mutation-only boundary; explicit no-recovery-route assertion for `needs_reauth`/revoked/failed |
| **C9b** Slack channel selection | `.sk-form-select` or `.sk-data-table` (channel list), `sk-notice` (refusal/rate-limit), `.sk-empty-state` | **`#321`** if a filter/search input is part of the picker — reported degraded-not-hard 2026-09-10, pending ruling, conditional on whether the corpus C9b markup actually includes a free-text filter | populated/empty/refusal/rate-limit/incomplete-enumeration projection |

## Surfaces the issue/epic name that could not be verified as already existing

None of the issue's named "existing surfaces to reuse" were false — every one of `sk-app-shell`,
`sk-personal-rail`, `sk-context-sidebar`, `.sk-context-nav`, `sk-page-header`, `.sk-skip-link`,
`sk-card`, `sk-status-indicator`, `sk-pill-tag`, `sk-notice`, `.sk-facts`, `.sk-empty-state`,
`.sk-data-table`, `sk-button`, `.sk-form-field`, `.sk-form-select`, `sk-confirm-dialog` was found on
disk. The only surfaces named that do **not** yet exist are exactly the six named dependencies
(#336 radio-choice-group, #337 section-navigation, #280 facts-grid extension, #307 static
action-row form, #320 danger-secondary button, #321 input contrast/target-size) — the issue is
accurate about what's missing; nothing else in its surface list is aspirational.

## The #259 composition-boundary gate — what it enforces, precisely

`scripts/check-pattern-composition.mjs`, invoked as `node scripts/check-pattern-composition.mjs
--selftest` then `node scripts/check-pattern-composition.mjs` (also wired into `ci-quality.yml`
lines 264/266 as two `[ENFORCED]` steps). Scans
`packages/elements/src/patterns/**/*.{ts,tsx,js,mjs,cjs,css}` (comment-stripped via esbuild, not
regex) for four rule families:

- **R1 — no private-root reach**: `.shadowRoot`, `.renderRoot` (Lit's public alias — the most
  likely accidental hit), `attachShadow(`, `getRootNode(`, the property named as a string/bracket
  access, `::shadow`/`/deep/`/`>>>`, plus runtime CSS injection (`createElement('style')`,
  `insertRule(`, `replaceSync(`).
- **R2 — `::part()` discipline**: every `::part(name)` used must resolve to a real element and be
  recorded in `expected-parts.json` (shrink-only ratchet); an undeclared part is treated as private.
- **R3 — no duplicated component CSS**, in four spellings: selecting a class a `packages/styles`
  sheet owns; a bare unscoped `sk-*` type selector; a bare native-tag selector restyling a
  library-owned class with the class left off; `@import`. Using an owned class in *markup* stays
  legal; writing CSS *for* it does not. A fixture-scoped type selector (`.my-fixture dt {}`) stays
  legal.
- **R4 — floors**: refuses to report green over zero fixtures, zero owned classes, an unreadable
  `expected-parts.json`, an unparsable file, an empty parsed stylesheet, or fewer than
  `MIN_COMPOSED_TAGS` (3) distinct composed `sk-` tags.

Explicitly out of scope, by the gate's own documented limits: `fixtures/elements-behaviour/` and
`tests/browser/` (which legitimately read `.shadowRoot` to *verify* structure), `style="…"` inline
attributes, overriding a `--sk-*` token (the documented public styling API, not duplication),
SK-D01 token-only enforcement (a neighbouring gate's job), and any directory other than
`packages/elements/src/patterns/` — a fixture placed elsewhere is outside this gate entirely.
Consequence for #338: every C1-C9b fixture/renderer **must** live under
`packages/elements/src/patterns/` to be covered by the gate at all, matching all four precedents.

## Pattern-story precedent shape (from `repository-dossier-pattern-stories-01M22WFQ`, the closest
analog: multi-state, multi-canvas, one immutable fixture family, native-semantics-heavy)

- One `.stories.ts` module under `packages/elements/src/patterns/` holds: typed fixture shape,
  a recursive-freeze helper, pure projection functions, small story-local render helpers, and the
  Storybook `Meta`/`StoryObj` exports — no package-level export, no new custom element.
- Composition is exclusively public elements (slots/parts/attributes) + native HTML + documented
  CSS families (`.sk-facts`, `.sk-data-table`, `.sk-empty-state`, etc.) + pattern-local
  `sk-<pattern>-pattern` BEM-prefixed tokenized layout CSS.
  The only mutable state permitted is consumer-owned demonstration state (e.g. a controlled
  drawer's `open` boolean) — everything else is a pure projection from a frozen fixture.
  No client-side truth inference, arithmetic, timers, polling, or route logic.
- One work package per mission (`WP01-<pattern>-pattern-proof.md`), because fixture + renderer +
  focused browser/consistency tests + visual baselines + doc note are one inseparable proof;
  splitting them produces an unverifiable partial PR.
- Verification stack per mission: focused Playwright/behaviour assertions (native structure,
  fixture-consistency invariants, interaction semantics), axe over every story, the composition gate
  + selftest, `expected-stories.json`/story-ratchet update, visual baselines (harvested from CI, per
  the programme brief's "visual baselines are CI-authoritative" trap — never locally
  `--update-snapshots`), and a consumer-doc ownership note in
  `docs/design-system/using-components.md`.

## What #338 adds beyond precedent, and why each is its own FR (see spec.md)

The issue's "Truth and ownership assertions" section states boundaries that are *absences* — no
picker, no inbound Slack, no tombstone-lift, no recovery route for danger-tone health states — which
a fixture that merely renders cannot fail to violate. Each becomes its own testable FR in spec.md
(assert the control/route/affordance is *not present*, not merely that nothing bad happened to be
clicked), per the same falsifiability reasoning that produced the #259 gate itself.

## Decision: nothing here invents a local substitute

No CSS, markup, or behavior from #331 (PR, action-row static form), #336/#337 (no PR exists), or
any other unmerged branch was read from a working tree or copied. All verification above reads
`train/elements-first` HEAD in this checkout only. Where a canvas's composition genuinely requires
a named dependency, the map above records it; nothing is forked or faked to appear unblocked.

## Dependency reconciliation — 2026-09-10 (orchestrator ruling, not an operator decision)

**What the live #338 issue body claims.** Its "Dependencies and parallelization" section names six
hard dependencies for final implementation and baselines: #336, #337, #280, #307, #320, #321.

**What was measured, with citations, and what the orchestrator ruled from that evidence:**

1. **#280 (responsive facts-grid extension) — dropped as a hard dependency of #338.**
   `gh issue view 280` shows it is filed for `mission: work-package-detail-facts-grid`, part of
   epic **#279** (Work Package Detail), not #335/#338 — #338 cites it opportunistically. Measured
   against the train: `packages/styles/src/facts/sk-facts.css:8-30` (stacked `.sk-facts`) already
   renders C6's and C7's shared six-pair installation-facts group
   (`screens/C6-installation-detail-dark.html:972-978`,
   `screens/C7-workspace-scope-dark.html:997-1003`) truthfully — every fact present, none fabricated
   or omitted. `.sk-facts--two-col` (`sk-facts.css:36-47`) was explicitly rejected as the narrowing
   target: it has no `min-width:0`/`overflow-wrap` declared on its value track, an untested overflow
   risk stacked `.sk-facts` does not carry. **Mission does instead**: C6/C7 compose the shared
   installation-facts group via stacked `.sk-facts`; the lost four/two/one-column grouped-reflow
   presentation is recorded as a named follow-up candidate in `plan.md`, not filed as a GitHub issue
   by this mission. No 390px/root-overflow/gutter clause is broken by this narrowing.

2. **#307 (static action-row with trailing controls) — dropped from C2 and C9a.**
   `packages/elements/src/action-row/sk-action-row.ts:161-198` shows the interactive element already
   renders `<slot name="controls">` behind `part="controls"`; `packages/styles/src/action-row/
   sk-action-row.css:188,226,253` shows `.sk-action-row__controls` is already styled in the shipped
   stylesheet. `gh pr view 331` confirms PR #331 adds only `actionRowStaticHtml()` and the
   `.sk-action-row-host` no-JS wrapper contract — nothing the interactive element's `controls` slot
   depends on. The corpus's own real markup for a trailing self-unlink control
   (`screens/C6-installation-detail-dark.html:1050`) is a native `<form method="post" action="…">`
   sibling of the trigger — exactly what the public `controls` slot already accepts. The mutation-
   free-forms requirement (FR-018) is satisfied by an ordinary `submit` listener with
   `preventDefault()`, independent of which action-row form is used. **Mission does instead**: C2
   and C9a's trailing controls compose the already-public interactive `sk-action-row` today.

3. **#336, #337 remain live hard blocks** — no substitute exists on the train for either (verified:
   `find . -iname "*radio-choice*"` and `*section-nav*"` both return nothing under `packages/`), and
   `.sk-context-nav` was confirmed a different, nested-tree contract, not a section-navigation strip.

4. **#320 and #321 — reported, not yet ruled on** (both have owned PRs in flight — #341, #320; #339,
   #321 — so the stakes are sequencing, not survival). Measured: `sk-button.css:11-97` confirms only
   `primary`/`secondary`/`ghost` exist; DESIGN.md's own visual rule says destructive actions stay
   **secondary**, not danger-toned, so `sk-button--secondary` inside `sk-confirm-dialog`'s `confirm`
   part tells C8/C9a truthfully today. `sk-form-field.css:32-64` and `sk-form-input.css:65-88` show
   `[aria-invalid="true"]` already sets `border-color: var(--sk-color-red)` on both consumption
   paths independent of #321, and the computed control height (padding + line content + border, from
   `tokens.css:199,220,236-237`) already clears both the axe 2.5.8 24px floor and the 44/48px
   precedent #321 wants to make contractual — though this is a token computation, not a rendered
   measurement. `run-axe-storybook.js:9` requests only `wcag2a + wcag2aa` (WCAG 2.0), which excludes
   1.4.11 Non-text Contrast (a 2.1 addition) — corroborated by `#155` (OPEN, the identical
   `--sk-border-default` weakness on `sk-button--secondary`) shipping unflagged in two already-merged
   pattern stories (`work-explorer.stories.ts`, `mission-kanban.stories.ts`). Both read as
   **degraded, not hard** on the evidence — but both would need a **visual-baseline reshoot** once
   their respective PRs merge, which argues for sequencing the baseline-harvest step after landing
   rather than narrowing spec.md/plan.md now. Kept as active blocks in spec.md/plan.md pending the
   orchestrator's explicit disposition of this finding — not silently acted on.

**What was NOT done**: the FR/IC blocked-on markers for #336, #337, #320, #321 were left exactly as
the issue states (or, for #320/#321, reported but not narrowed); only #280 and #307's markers were
changed, and only after this dated record was written, per instruction to record the conflict rather
than silently edit the dependency list as though the issue had always said this.
