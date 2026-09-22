---
work_package_id: "WP01"
title: "Account Front Door pattern stories: fixtures, compositions, proofs, ratchets"
dependencies: []
requirement_refs: ["FR-001", "FR-002", "FR-003", "FR-004", "FR-005", "FR-006", "FR-007", "FR-008", "FR-009", "FR-010", "FR-011", "FR-012", "FR-013", "FR-014", "FR-015", "FR-016", "FR-017", "FR-018", "FR-019", "FR-020", "FR-021", "FR-022", "FR-023", "FR-024", "FR-025", "FR-026", "FR-027", "FR-028", "FR-029", "FR-030", "FR-031", "NFR-001", "NFR-002", "NFR-003", "NFR-004", "NFR-005", "NFR-006", "NFR-007", "NFR-008", "NFR-009", "NFR-010", "NFR-011", "NFR-012", "NFR-013", "C-001", "C-002", "C-003", "C-004", "C-005", "C-006", "C-007", "C-008", "C-009", "C-010", "C-011", "C-012", "C-013", "C-014", "C-015", "C-016", "C-017", "C-018", "C-019", "C-020"]
planning_base_branch: mission/account-front-door-pattern-stories
merge_target_branch: mission/account-front-door-pattern-stories
branch_strategy: "Planning artifacts for this mission were generated on mission/account-front-door-pattern-stories (topology single_branch). During /spec-kitty.implement this WP commits directly on that branch; completed changes merge back into mission/account-front-door-pattern-stories, then that branch's PR targets train/elements-first (C-018), never main."
subtasks: ["T001", "T002", "T003", "T004", "T005", "T006", "T007", "T008", "T009", "T010", "T011"]
phase: "Phase 1 - Account Front Door pattern proof"
history:
  - timestamp: "2026-09-11T00:00:00Z"
    actor: "planner-priti"
    action: "Prompt authored during mission task finalization"
agent_profile: "frontend-freddy"
role: "implementer"
agent: "claude"
model: ""
authoritative_surface: "packages/elements/src/patterns/"
execution_mode: "code_change"
create_intent:
  - "packages/elements/src/patterns/account-front-door.fixture.ts"
  - "packages/elements/src/patterns/account-front-door.stories.ts"
  - "fixtures/elements-behaviour/src/pattern-account-front-door.test.ts"
  - "apps/storybook/src/tests/sk-account-front-door-pattern.spec.ts"
owned_files:
  - "packages/elements/src/patterns/account-front-door.fixture.ts"
  - "packages/elements/src/patterns/account-front-door.stories.ts"
  - "fixtures/elements-behaviour/src/pattern-account-front-door.test.ts"
  - "apps/storybook/src/tests/sk-account-front-door-pattern.spec.ts"
  - "apps/storybook/src/tests/visual.spec.ts"
  - "apps/storybook/src/tests/visual.spec.ts-snapshots/sk-account-front-door-*.png"
  - "expected-stories.json"
  - "docs/design-system/using-components.md"
tags: ["pattern", "storybook", "accessibility", "account-front-door"]
tracker_refs: ["#355", "#352"]
---

# Work Package Prompt: WP01 — Account Front Door pattern stories

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this
work package's `task_type` and `authoritative_surface`.

Read this checkout's `AGENTS.md`/`CLAUDE.md`, the project charter, and this mission's `spec.md` and
`plan.md` in full before editing anything. `plan.md` is long, unusually well-evidenced, and settled
— it is the authoritative contract for this WP, not `spec.md` alone. Where the two disagree,
`plan.md`'s Part 0 reconciliation wins (C-019); the differences are carried into this prompt below
so they do not have to be independently re-derived, but re-verify the dependency table before your
final SHA (T011) because the train moves.

---

## Objective

Publish **one Storybook-only pattern family**, `Patterns/Account Front Door`, proving the six
approved Family 6 account/public-front-door compositions from surfaces `train/elements-first`
already ships, native semantic HTML, immutable frozen fixtures, pure display projections and
pattern-local layout. Ship a fixture module, a stories module (20 story ids), a Vitest
fixture-behaviour suite, a Playwright browser suite, CI-harvested visual baselines, one ratchet
entry and one documentation section. **Publish no runtime component** — no auth, account,
front-door, legal-page, recovery, MFA/code-input, email-row, social-provider, error-summary or
password-maintenance element, class family, manifest entry or React wrapper (C-001, C-002).

Deliver in exactly **one** work package and **one** pull request into `train/elements-first`
(C-017, C-018), body carrying `Refs #355` and `Refs #352`, closing neither.

---

## Context: the plan's reconciliation, carried forward verbatim

`spec.md` was authored on 2026-09-10 while every one of its nine named dependencies was unmerged.
`plan.md` Part 0 re-verified `train/elements-first@0a232a01` on 2026-09-11 and found **eight of
nine dependencies had landed** — only `.sk-button--secondary`'s border defect (#155) remains open,
and it was never a composition blocker, only a colour one. **Fifteen of the spec's assumptions
differ from what actually shipped, plus three further corrections the spec could not have known.**
The repository wins in every one (C-019). Do not re-derive these from first principles — read
`plan.md` §0.2 and §0.3 for the full evidence, but implement against the corrected facts below:

- **Public-header floor is 48px** (`--sk-space-9`), not the spec's stated 44px. **Every** action
  composed inside the header must carry `sk-public-header__action` — that class is what carries the
  floor; a composed control without it has no floor at all. At **zero** actions, `__actions`
  (the `<nav>`) is **omitted entirely** from the DOM, never rendered empty.
- **Compact footer links are bare `<a slot="compact-links">`** — direct children of
  `.sk-site-footer__row`, never `<li>` in a `<ul>`, no `<nav>`, no heading. Each must carry **both**
  `sk-site-footer__link` and `sk-site-footer__link--compact` (the sheet pairs the bare class with
  `::slotted()` because the anchor is light-DOM). Zero links emits no scaffolding at all.
- **`sk-theme-toggle` is a custom element**, not the corpus's `<details>` picker — a shadow
  `<fieldset>` of three native radios (System/Light/Dark). All four labels (`label`,
  `system-label`, `light-label`, `dark-label`) are required, or `render()` returns `nothing` and no
  control exists. It is **not inert**: it writes `localStorage` and mutates `documentElement`'s
  `data-theme`/`color-scheme`. Any story composing it **must** carry `meta.beforeEach:
  isolateThemeStory` and mark the control `data-theme-control`, or theme state leaks across stories
  and corrupts every later story's rendering and every later baseline. This is not optional —
  precedent: `packages/elements/src/patterns/operational-status.stories.ts:22,46`.
- **The pattern authors no error colour.** `.sk-form-field--error .sk-form-field__description`
  already resolves `--sk-fg-error`, and `.sk-input[aria-invalid="true"]` already resolves
  `--sk-border-control-invalid`, in both themes, via the already-landed classes. Reaching for
  `--sk-color-red` reintroduces #350's defect. The pattern's only error-coloured rule is on its own
  summary-link class, and `var(--sk-fg-error)` is the only value it may use there.
- **The shipped error exemplar puts `role="alert"` on the field-local span.** Composing that
  **plus** a `role="alert"` summary double-announces every error. The field-local
  `.sk-form-field__description` carries **no** `role`; the summary alone carries `role="alert"`.
- **`sk-boundary-page` owns its actions.** `.sk-boundary-page__action-group > :is(a, button)` pins
  `min-block-size: var(--sk-space-9)` (48px) at specificity (0,1,1), deliberately unbeatable by a
  consumer class. `__action-group` is a **required container present even when empty** — this is
  the frame's contract, not an omission (composition 4's empty action group and composition 5b's
  refusal both rely on this). The submit control sits **outside** the `<form>` and is bound to it
  by `form="…"` — this is the shipped `sk-boundary-page-form-card.html` anatomy and is what gives
  the submit the frame's floor for free.
- **`sk-copy-field` ships English defaults** for `label`, `success-message`, `manual-message`,
  `failure-message`. C-011 forbids a library-authored English default reaching a user-visible
  string — all four must be fixture-supplied on every `<sk-copy-field>` the pattern composes.
- **`.sk-radio-choice-group` anatomy**: `<fieldset class="sk-radio-choice-group">` → `__legend` →
  `__options` → one `<label class="…__choice" for=…>` per choice, containing `__control` (the
  radio), `__label`, and an optional `__secondary-value`. `__choice` is a **three-column grid**
  carrying a 48px floor. A verified/primary pill goes **inside `__label`**, never as a fourth grid
  child — a fourth child creates an implicit column.
- **The 44px corpus trap is wider than `--sm`.** `sk-button.css` declares **no** `min-block-size`
  on `.sk-button` (base ≈42px) **or** `.sk-button--sm` (≈32px); every Family 6 screen re-declares
  both (48px/44px) in its own inline `<style>`, which does not exist in the library sheet. Any
  composition reusing a `.sk-button` of **any** size outside a slot that already supplies a floor
  must pin its own, on its own pattern-local class — following `sk-confirm-dialog.css:165-174`,
  `sk-context-nav.css:44-56`, and `packages/styles/src/action-row/` (#307). **Never restyle
  `.sk-button` itself** (C-005).
- **`.sk-button--danger-secondary` (#320) is a token-for-token match for P20's Remove action.**
  Compose it there directly; it does not carry #155's defect.
- **P24 legitimately keeps its repeat-password field and length help text.** FR-007's
  "no password confirmation, no length promise" prohibitions are **signup-scoped**, not global —
  do not strip these from the password-change/password-set compositions.

## Context: two orchestrator rulings, settled — implement exactly as stated

1. **`Re-send Verification` composes `.sk-button--secondary` bare.** Document the open #155 border
   defect in the pattern's documentation section (T007), where a reader will meet it. Epic #352
   forbids reproducing Family 6's `.front-door-secondary-action` border compensation as a library
   contract — **do not add a pattern-local border override** for this control. (This resolves
   `plan.md`'s `[NEEDS DECISION] D-1` as option (a).)
2. **Composition 6 composes NO `sk-action-row`**, despite issue #355 naming #307. The shipped
   `sk-action-row` anatomy models an identity row (`__marker`/`__title`/`__reference`/`__metadata`/
   `__supporting`/`__tags`/`__trigger`/`__controls`); P20 is a native radio choice group plus a flat
   row of four plain submit buttons with no identity, title or trigger — composing `sk-action-row`
   here would require inventing copy C-011 forbids the library to supply. Use a pattern-local
   `__email-actions` row with its own pattern-local 44px floor instead. (This resolves `plan.md`'s
   `[NEEDS DECISION] D-2` as option (a).)

No further `[NEEDS DECISION]` items were found while authoring this WP. `plan.md` closes every
seam it opens; if you discover a genuine gap during implementation that `plan.md` does not cover,
stop and escalate rather than deciding it silently.

## Scope boundaries

Compose only already-published surfaces: `.sk-public-header`, `sk-site-footer` (compact
presentation), `.sk-boundary-page`, `sk-theme-toggle`, `.sk-radio-choice-group`, `.sk-form-field` /
`.sk-input`, `.sk-button` (`--primary`, `--ghost`, `--secondary`, `--danger-secondary`),
`sk-notice`, `.sk-prose`, `sk-copy-field`, `sk-app-shell`, `sk-page-header`, `.sk-skip-link`,
`.sk-pill-tag`, plus `--sk-*` tokens. Do not create `sk-error-summary` or any auth, account,
front-door, legal-page, recovery, MFA/code-input, email-row, social-provider,
password-maintenance, auth-card, auth-shell or auth-form component under any name (C-002, C-003).
Do not touch any file under `packages/styles/src/` or any non-pattern
`packages/elements/src/<component>/` directory — that is C-004 arm (a), and it is the mission's own
proof that it copied nothing from an unmerged (or freshly merged) dependency branch. Implement no
routing, store, session, auth, CSRF generation, validation, cooldown timing, legal publication,
email delivery, localisation or provider integration (C-014). Exclude profile, personal API keys,
billing, subscriptions, pricing, CMS/blog and terminal-only CLI signup, and keep them excluded
(C-013).

---

## Subtasks

### T001 — Establish the failing contract

**Purpose**: Create `apps/storybook/src/tests/sk-account-front-door-pattern.spec.ts` before the
fixture/stories modules exist, targeting the intended 20 story ids
(`patterns-account-front-door--landing`, `--entry-boundary`, … per `plan.md` §1.5) and the surface
inventory this WP will publish. Run it and record the failure: it must fail because the story/
surface does not exist yet, never because of a missing/broken test harness. This is the red-first
evidence FR-031 and SC-016 require, captured for the PR body.

**Discharges**: FR-031.
**Files**: `apps/storybook/src/tests/sk-account-front-door-pattern.spec.ts` (initial skeleton).

### T002 — The frozen fixture family and pure projection

**Purpose**: Build `account-front-door.fixture.ts` per `plan.md` §1.2/§1.3 — no `lit`, no DOM
import. A `FrontDoorState` union naming all twelve states (ten published + `entry-boundary-providers`
and `terminal-signup-closed` as fixture-only arms per decisions R-1/R-2, preserved from spec.md);
narrow `readonly` interfaces plus shared `PublicChrome`, `RouteActionInventory`, `LinkedError`,
`EmailRecord`, `LegalBlock` records; `deepFreezeAccountFrontDoorFixture()` exported so the behaviour
test asserts the freeze rather than trusting it; `ACCOUNT_FRONT_DOOR_FIXTURES` map authored from
small shared constants so every repeated fact is written once; `projectAccountFrontDoor(fixture)`
— presence/ordering decisions only, no routing/session/network/inference/arithmetic/time;
`fixtureForAccountFrontDoorState(state)` switch accessor.

Make truth constraints **unrepresentable**, not merely untested: `RecoveryOutcomeFixture` has no
`exists`/`found`/`known` field and no projection branch could consume one (FR-014);
`LegalUnavailableFixture` has no `reason` field (FR-018); `SignupFormFixture['fields']` is a fixed
four-tuple with no `passwordRequirements`/`helpText` member, so copying P24's list onto signup is a
compile error (FR-006, FR-007 — signup-scoped only, per the P24 correction above); `EmailRecord` is
`{ address, primary, verified }` plus only the actions the fixture **declares** (FR-020); no
fixture type accepts a token, session, CSRF value, clock or locale (C-014). The legal document is
an ordered, frozen `LegalBlock[]` (`{ kind: 'heading' | 'paragraph' | 'list', … }`), **not** an HTML
string — `unsafeHTML` appears nowhere in this repo and C-011 requires per-string translatability
(this amends SC-008's wording, per `plan.md` §1.4 composition 5: the property proved is identical,
the construct is not).

**Discharges**: FR-006, FR-007, FR-009, FR-014, FR-016, FR-018, FR-020, FR-022, FR-024, C-011,
C-014.
**Files**: `packages/elements/src/patterns/account-front-door.fixture.ts` (NEW).

### T003 — Public chrome, composed once, and the landing composition (P1)

**Purpose**: Build the shared route-aware header/footer/theme-toggle render helpers used by
compositions 1–5, and the first published story, `Landing`. `.sk-skip-link` →
`.sk-public-header` (`__inner`, `__brand`, `__brand-context`, `__actions` as a labelled `<nav>`,
`__action` on **every** action) carrying `Sign in`, `Start free`, and
`<sk-theme-toggle class="sk-public-header__action" data-theme-control>` with all four labels
fixture-supplied → pattern-owned `<main id="main">` with one `<h1>`, a `.sk-button
.sk-button--primary` CTA on its own pattern-local floor class, one `<sk-copy-field>` per install
command with all four message strings fixture-supplied, a native `<ol>` CLI journey whose `<li>`
count equals the fixture's declared step count → `<sk-site-footer presentation="compact">` with
`tagline`/`legal` properties and bare
`<a slot="compact-links" class="sk-site-footer__link sk-site-footer__link--compact">`. Set
`meta.beforeEach = isolateThemeStory` on the stories module now — it is mandatory for every story
that composes the chrome, not just this one.

**Discharges**: FR-001, FR-002, FR-003, FR-004, FR-010, FR-023, FR-025, FR-027, C-011, C-015,
NFR-003.
**Files**: `packages/elements/src/patterns/account-front-door.stories.ts` (chrome helpers +
`Landing` story; NEW).

### T004 — Boundary-framed compositions: entry, validation, recovery, terminal, refusal

**Purpose**: Compose `entry-boundary` (+ the `entry-boundary-providers` fixture-only arm),
`submitted-validation`, `recovery-sent`, `terminal-inactive` (+ the `terminal-signup-closed`
fixture-only arm), and `legal-unavailable` — all framed by `.sk-boundary-page`.

Entry boundary: `<div class="sk-boundary-page sk-boundary-page__stage">` → `__card` →
`<h1 class="…__title">` → `<form id class="sk-boundary-page__body" method action>` holding the
CSRF placeholder (`type="hidden" value="" data-server-owned="true"`, never populated), three
`.sk-form-field` blocks and a required Terms checkbox row authored as a native
`<label><input type="checkbox" required>…</label>` inside a pattern-local row with its own 44px
floor (not `.sk-checkbox-choice-group`, which models a group of choices) → `__action-group` with
the submit authored **outside** the form and bound by `form="…"`. Provider affordances render only
when the fixture supplies them — zero providers means no region and no separator, not an empty one.
Exclude the corpus's honeypot input and JS-gated `disabled` submit (application behaviour, C-014);
the fixture may declare `disabled` as an inert fact, the pattern never toggles it.

Submitted validation: entry boundary plus a consumer-authored
`<div role="alert" tabindex="-1" aria-labelledby="<title id>" data-error-summary>` wrapping a
native `<ul><li><a href="#fieldId">` list, one link per supplied error, and on each invalid field
`.sk-form-field.sk-form-field--error`, `aria-invalid="true"`, `aria-describedby` pointing at a
`.sk-form-field__description` carrying the **same** text as its summary link and **no** `role`.
Focus moves once, to the summary, after an invalid submit; each summary link's activation moves
focus to its field, never navigates. No `sk-error-summary` element anywhere (C-003).

Recovery/terminal: `recovery-sent` renders one frozen outcome sentence with no existence-expressing
branch. `terminal-inactive` renders the supplied heading and sentence inside
`[data-terminal-state]` with **zero** interactive descendants in that region (the page chrome still
carries its own actions — scope the assertion to the region). `__action-group` is present and
empty. The `terminal-signup-closed` (P23) fixture arm is equally actionless but carries a
**different** route inventory (`Sign in` only). No reactivation/appeal/support/retry/
waitlist/reopening-date/notification affordance in either.

Legal unavailable: the boundary frame with one generic refusal and an empty `__action-group`; the
fixture type has no `reason` field, so no absent/draft/restricted/wrong-locale distinction is
representable.

**Discharges**: FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014,
FR-015, FR-016, FR-018, C-003, C-010, C-013.
**Files**: `packages/elements/src/patterns/account-front-door.stories.ts` (boundary render helpers
+ 5 states/stories).

### T005 — Document and authenticated compositions

**Purpose**: Compose `legal-published`, `email-management`, `password-change`, `password-set`.

Legal published: chrome → `<main>` → `<article class="sk-prose">` at **natural page scroll** — no
boundary frame, no inner scroller, no sticky navigation, no library-authored table of contents,
status pill, editor affordance or heading. The prose region renders exactly the supplied
`LegalBlock[]`, in order, and nothing else.

Account maintenance: `<sk-app-shell>` with `<sk-page-header>` in the `page-header` slot and one
`<h1 slot="title">`. Email management: `<form method action>` → `<fieldset
class="sk-radio-choice-group">` → `__legend` → `__options` → one `<label class="…__choice" for=…>`
per address containing `__control` (exactly one `checked`, exclusivity native, not scripted),
`__label` and `__secondary-value`; any verified/primary pill sits **inside `__label`**. Actions
render in the corpus-fixed order make-primary / resend-verification / remove, in a pattern-local
`__email-actions` flex row with its own 44px floor (per orchestrator ruling 2 above — **no**
`sk-action-row`). `Re-send Verification` composes `.sk-button .sk-button--secondary` bare (ruling
1 above — no compensation override). `Remove` composes `.sk-button--danger-secondary`. The cooldown
region renders **only** when the fixture supplies a cooldown fact, as `<sk-notice
announce="polite">` — **absent** from the DOM otherwise (this strengthens FR-021's "hidden and
silent" to "absent and therefore silent," matching the boundary frame's own full-DOM-omission
idiom; do not use `[hidden]`, which is what the corpus does and is not adopted here).

Password maintenance: the same shell with the P24 form. The signup prohibitions (FR-007) do **not**
apply — P24 legitimately carries a repeat-password field and length help text. `password-change`
and `password-set` differ **exactly** by the presence of the current-password field. Neither
presents optional email verification as an access block, and neither exposes a profile,
personal-API-key, billing, subscription or pricing destination.

**Discharges**: FR-017, FR-019, FR-020, FR-021, FR-022, C-013, C-015.
**Files**: `packages/elements/src/patterns/account-front-door.stories.ts` (document + authenticated
render helpers + 4 states/stories).

### T006 — System-condition proof stories

**Purpose**: Add the ten remaining ids per `plan.md` §1.5's story matrix: three `LightMode`-class
ids (`LightMode` on `submitted-validation`, `LegalLightMode` on `legal-published`,
`AccountLightMode` on `email-management` — each wrapped `class="sk-light"`, **never**
`data-theme="light"`, with `parameters.backgrounds.default: 'sk-light'` alongside it),
`ForcedColors` (on `submitted-validation`), `ReducedMotion` (on `entry-boundary`), `Rtl` (on
`email-management`), `Narrow390` (on `landing`), `ShortViewport` (on `entry-boundary`), `Zoom200`
(on `landing`), and `LongStrings` (on the `email-management-cooldown` fixture-only arm, folding the
cooldown proof into the long-strings proof per `plan.md` §1.3's fixture table). This brings the
family to 20 ids total. List every non-story export in `meta.excludeStories`.

**Discharges**: FR-025, FR-026, NFR-002, NFR-004, NFR-005, NFR-013.
**Files**: `packages/elements/src/patterns/account-front-door.stories.ts` (10 proof stories).

### T007 — Register and document

**Purpose**: **Derive the 20 story ids from the built Storybook index before committing them** —
do not hand-write a kebab-case guess (#336's own `$comment` records doing this correctly). Add
`expected-stories.json`'s new `"account-front-door-pattern"` key with all 20 ids plus **one** dated
`$comment` entry naming what was added and why, in the existing append-only log. Re-derive `total`
from the flattened `byElement` set — never carry a literal forward. `expected-parts.json` is **not**
edited (every `::part()` this mission could reach is already recorded — `plan.md` §0.3 item 18). Add
one new "## Account Front Door pattern" section to `docs/design-system/using-components.md` naming
the composed surfaces, the consumer-supplied facts, what it deliberately does **not** do (routing,
session, CSRF, validation, cooldown timing, legal publication, localisation), and the open #155
defect carried by the bare `Re-send Verification` secondary action (orchestrator ruling 1).

**Discharges**: FR-028, SC-001, SC-019, C-016.
**Files**: `expected-stories.json`, `docs/design-system/using-components.md`.

### T008 — Complete the executable evidence

**Purpose**: Fill in `fixtures/elements-behaviour/src/pattern-account-front-door.test.ts`: recursive
`Object.isFrozen` over every fixture; projection purity/repeatability with no mutation and no
side-effect freeze on the caller; one truth-preservation assertion per composition (both provider
arms, both terminal arms, both cooldown arms, both password arms); the tokens-only assertion over
the exported `ACCOUNT_FRONT_DOOR_PATTERN_STYLE_TEXT` string (zero raw colour/length/radius/shadow/
duration/z-index literals) — **demonstrate it failing first** against a deliberately injected raw
literal before trusting it (SC-013); the C-004 arm (b) selector assertion that the pattern's style
text names no dependency-owned class from the authored list (`.sk-public-header*`,
`.sk-boundary-page*`, `.sk-radio-choice-group*`, compact-footer, `sk-theme-toggle` families).

Complete `apps/storybook/src/tests/sk-account-front-door-pattern.spec.ts` (started red in T001):
the navigation-destination sweep (zero Platform/Docs/Pricing/profile/API-key/billing/subscription
matches) across **all 20** stories; exact field-membership + password-count DOM assertions; both
provider-arm assertions; route-aware inventory equality; error-summary linking (dead-anchor
failure, matching `aria-invalid`/`aria-describedby`, zero `sk-error-summary` nodes); terminal action
counts for both P22 and P23 with distinct route inventories; prose-block equality against the
fixture's `LegalBlock[]`; single-checked-radio assertion; fixed action order; cooldown
absent-vs-present; password-field difference; a page-level request listener asserting zero network
beyond the iframe's own load; 44px target-size floor and unclipped focus at 390px/1440px/200%zoom;
equal narrow gutters; accessibility-tree shape (one `h1`, no skipped heading level, correct native
landmarks). The C-004 arm (a) path-allowlist assertion over the mission's diff belongs here or in
review tooling — confirm it runs before T011.

**Discharges**: FR-004, FR-011, FR-012, FR-013, FR-019, FR-020, FR-021, FR-024, FR-026, FR-027,
NFR-001, NFR-003, NFR-004, NFR-005, NFR-006, NFR-007, NFR-008, NFR-013, C-004, C-006, C-007.
**Files**: `fixtures/elements-behaviour/src/pattern-account-front-door.test.ts` (NEW),
`apps/storybook/src/tests/sk-account-front-door-pattern.spec.ts` (completed).

### T009 — Harvest and review CI visual baselines

**Purpose**: Add one case block to `apps/storybook/src/tests/visual.spec.ts` for this family's 20
ids. Push and let CI's Playwright visual-regression job produce the baselines; harvest the PNGs
from that run's artifact into `apps/storybook/src/tests/visual.spec.ts-snapshots/`. **Never** run
`--update-snapshots` locally and never commit a locally-produced baseline (NFR-010, SC-017).
Compare against the Family 6 corpus screens and record discrepancies.

**Discharges**: NFR-010, SC-017.
**Files**: `apps/storybook/src/tests/visual.spec.ts` (EDITED),
`apps/storybook/src/tests/visual.spec.ts-snapshots/*.png` (NEW, CI-harvested).

### T010 — Run the full local gate set

**Purpose**: Execute `plan.md` Part 5's exact sequence from this checkout:

```bash
git fetch origin train/elements-first
git rev-parse origin/train/elements-first
node scripts/check-pattern-composition.mjs --selftest
node scripts/check-pattern-composition.mjs
node scripts/check-story-theme-wrapper.mjs
node scripts/check-behaviour-fixture-imports.mjs
node scripts/check-part-ratchet.mjs
node scripts/typecheck-all.mjs
npm run quality:all
npx vitest run --project node
npx vitest run --project browser fixtures/elements-behaviour/src/pattern-account-front-door.test.ts
npx vitest run
node scripts/build-storybook-with-budget.mjs
node scripts/gate-selftest.mjs
node scripts/run-axe-storybook.js
flock /tmp/sk-design-pw-6006.lock \
  npx playwright test apps/storybook/src/tests/sk-account-front-door-pattern.spec.ts --project=chromium
flock /tmp/sk-design-pw-6006.lock npx playwright test
PROJECTS="$(node scripts/release-graph.mjs --projects)"
npx nx run-many --target=build --projects="$PROJECTS" --skip-nx-cache
node scripts/measure-elements-sizes.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-elements-css.mjs --check
node scripts/check-release-graph.mjs
```

Build **before** `measure-elements-sizes.mjs` (it reads `dist/` and never builds it). Use
`--skip-nx-cache` on every nx gate target. Re-derive the ratchet `total` from the flattened id set
(never carry the literal). Port 6006 is shared with sibling checkouts — always take the `flock`,
never kill a process you did not start.

**Discharges**: NFR-001, NFR-009, NFR-010, NFR-011, NFR-012, SC-010, SC-011, SC-012, SC-013.
**Files**: none (verification only).

### T011 — Rebase onto the current train tip and re-verify on the exact final SHA

**Purpose**: Re-fetch `origin/train/elements-first`; re-check every dependency surface's presence
and every issue/PR state (FR-029) and record the dated re-reconciliation. Rebase this branch onto
the real tip. **PR #409 (`mission/cli-auth-pattern-stories`) is a live sibling pattern mission
contending for `expected-stories.json`, `visual.spec.ts` and the `Patterns/` namespace — expect a
collision and resolve it from authored sources, regenerating anything derived.** Re-derive the
ratchet `total` again after the rebase — it is never carried forward as a literal. Re-run the
entire T010 gate sequence on the exact final SHA. Commit in coherent steps (fixture module →
stories → tests → ratchet+docs → baselines) using `feat(elements):` / `test(elements):` / `docs:`
(unscoped) — `docs(spec)` and `docs(specs)` are **not** valid scopes and red `lint-code` late;
`chore(spec):` remains the anchored exemption for planning artefacts in `kitty-specs/` only. Return
a clean lane, a requirement-evidence map, the final head SHA, and the visual-baseline ledger for
independent squad review. **Never merge or close issues from the implementer seat** — the squad and
operator own acceptance and merge.

**Discharges**: FR-029, SC-015, C-012, C-017, C-018, C-020, SC-020.
**Files**: none (integration and verification only).

---

## Definition of Done

- All 64 FR/NFR/C ids and every SC-001–SC-020 measurable outcome named in `spec.md`, as amended by
  `plan.md` Part 0, are backed by executable or reviewable evidence on one final SHA.
- All 20 story ids are independently discoverable, axe-clean, and composed solely from published
  surfaces and native semantics; both fixture-only arms (`entry-boundary-providers`,
  `terminal-signup-closed`) are proven in the behaviour suite without becoming stories.
- The C-004 diff-boundary is intact: no file under `packages/styles/src/` and no non-pattern
  `packages/elements/src/<component>/` path was touched.
- Visual baselines exist for every published composition, all harvested from a CI Playwright
  artifact, none produced locally.
- The full gate set (composition, ratchet, axe, typecheck, quality, vitest, playwright, sizes,
  react-wrapper, element-markup, elements-css, release-graph) passes on the exact final SHA after
  the T011 rebase.
- The lane is clean (`git status --porcelain` empty) and ready for independent pre-merge squad
  review.
