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
| **C2** operating index | Same shell/header family; `sk-card[status]`, `sk-status-indicator` (`danger` for `needs_reauth`/revoked/failed — unblocked), `sk-pill-tag`, `sk-action-row` (Lit `controls` slot — see finding above; treated as blocked per issue text), `sk-notice` (Slack outbound-only framing) | `#307` (issue names it; interactive slot arguably already public — flag for operator) | provider card grid, admin/member projection, health-mix fixture |
| **C3** provider handoff | `sk-notice`, `sk-card`, `sk-status-indicator`, `sk-button` (busy-cue part for waiting state) | none identified for the loading/failure/completing states themselves | waiting/completing/source-exact-failure projection selectors |
| **C4** GitHub App setup failure | `sk-notice` (failure explanation), `sk-page-header`/breadcrumbs (resolved-Team back route), `sk-button` | none identified — the "no-Team boundary variant" is an omission (absent back-link), provable with existing primitives | back-route presence/absence projection |
| **C5** GitLab group selection | `sk-card`, `sk-notice` (validation/refresh-failure), `sk-button` | **`#336`** — exactly-one group choice is the radio-choice-group's defining contract; **`#321`** — any text/validation input in this form inherits the unfixed contrast/target-size defect | populated/no-groups/validation/connected-after-refresh-failure fixture states; announce-only submit interception |
| **C6** installation detail shell | `sk-app-shell`, `sk-page-header`, `sk-card[status]`, `sk-status-indicator`, `sk-copy-field` (installation IDs), `.sk-breadcrumbs` | **`#337`** — the Workspace Scope / Project Routing / Team Accounts sub-navigation is exactly TKC2's contract; **`#280`** — grouped health/installed-by/at facts need the reflowing facts-grid, `.sk-facts` alone only does stacked/two-col | admin/member shell projection, authoritative health variant selectors |
| **C7** workspace scope tab | `.sk-data-table` or `.sk-facts`, `.sk-empty-state`, `sk-notice` (unavailable, stale-after-refresh-failure) | **`#337`** — reached via the same sub-navigation as C6; **`#280`** if scope facts are grouped rather than tabular | populated/empty/unavailable/stale-persisted projection; member admin-only boundary |
| **C8** project routing/admitted repos | `.sk-data-table`, `sk-status-indicator`, `.sk-empty-state`, `sk-confirm-dialog` (hard-purge confirmation — dialog itself unblocked), `sk-form-input`/`.sk-form-select` (Jira rescue state) | **`#337`** (sub-navigation); **`#320`** — the purge confirmation's destructive action needs the danger-secondary button axis (confirm-dialog has no built-in destructive tone); **`#321`** — validation-state form inputs | active/disabled mapping projection, admitted/withdrawn repository states, hard-purge confirm wiring (mutation-free) |
| **C9a** team account links | `.sk-data-table` or `sk-action-row` rows, `sk-status-indicator` (`danger` for `needs_reauth`/revoked — unblocked), `sk-pill-tag` | **`#337`** (sub-navigation); **`#307`** (trailing self-owned unlink control — same finding as C2); **`#320`** if any destructive/revoke-styled button appears | active/unhealthy/unlinked/empty projection; self-owned-mutation-only boundary; explicit no-recovery-route assertion for `needs_reauth`/revoked/failed |
| **C9b** Slack channel selection | `.sk-form-select` or `.sk-data-table` (channel list), `sk-notice` (refusal/rate-limit), `.sk-empty-state` | **`#321`** if a filter/search input is part of the picker | populated/empty/refusal/rate-limit/incomplete-enumeration projection |

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
