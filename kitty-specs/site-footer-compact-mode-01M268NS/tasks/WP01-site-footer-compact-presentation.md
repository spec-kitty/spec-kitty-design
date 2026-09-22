---
work_package_id: WP01
title: 'sk-site-footer gains a compact, server-renderable presentation'
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- FR-013
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
- NFR-009
- NFR-010
- NFR-011
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- C-009
- C-010
- C-011
- C-012
- C-013
planning_base_branch: mission/site-footer-compact-mode
merge_target_branch: mission/site-footer-compact-mode
branch_strategy: Planning artifacts for this mission were generated on mission/site-footer-compact-mode. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/site-footer-compact-mode unless the human explicitly redirects the landing branch. The mission branch is separately opened as a PR into train/elements-first per C-012, not by this WP.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
- T009
- T010
- T011
- T012
- T013
- T014
phase: Phase 1 - sk-site-footer compact presentation
history:
- at: '2026-09-10T18:18:28Z'
  actor: system
  action: 'Prompt authored during mission planning for #354'
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/site-footer/
create_intent:
- apps/storybook/src/tests/sk-site-footer-compact.spec.ts
- apps/storybook/src/tests/sk-site-footer-compact-forced-colors.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/site-footer/**
- packages/styles/src/site-footer/**
- packages/react/src/SkSiteFooter.js
- packages/react/src/SkSiteFooter.d.ts
- packages/elements/vue.d.ts
- packages/elements/custom-elements.json
- packages/elements/SIZES.md
- fixtures/elements-behaviour/src/sk-site-footer.test.ts
- fixtures/vue-consumer/src/types.test-d.ts
- apps/storybook/src/tests/sk-site-footer-compact.spec.ts
- apps/storybook/src/tests/sk-site-footer-compact-forced-colors.spec.ts
- expected-docs.json
- expected-stories.json
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – `sk-site-footer` gains a compact, server-renderable presentation

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for
`implement` work against a Lit custom element, its generated static-HTML fan-out, and Playwright
accessibility specs.

**Model routing (C-013)**: this is a delegated implementation seat — use the smaller model. The
larger model is reserved for squad lenses/synthesis, arbiter escalation, and plan-phase architecture,
per the charter's standing order and the elements-first run prompt's "route down" rule.

---

## ⚠️ IMPORTANT: Review Feedback

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_ref` field in the event log (via
  `spec-kitty agent tasks status` or the Activity Log below).
- **You must address all feedback** before your work is complete.
- **Report progress**: as you address each feedback item, update the Activity Log.

---

## Review Feedback

*None yet — this is the initial prompt.*

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `<footer>`, `<nav>`, `<ul>`, `<li>`, `<a>`, `<slot>`, `<hr>`
Use language identifiers in code blocks: ```ts, ```css, ```html, ```bash

---

## Objectives & Success Criteria

Extend `sk-site-footer` — today a single fixed three-column layout (`SITE_FOOTER_VARIANTS = {}`,
`SITE_FOOTER_AXES = {}`) — with one additional, compact, server-renderable presentation, selected by
one new public reactive property `presentation`. Family 6's 23 public/account screens repeat a
much smaller `pagefoot` anatomy the current component cannot express: one brand/tagline/legal text
block and a small native Terms-style link region, with no way to carry a truthful, live `<a>` (the
existing `legal` property is escaped plain text).

**Read `spec.md`, `plan.md`, and `research.md` in full before starting.** `plan.md` is long (976
lines) and settled — its Part 1 (D-1 through D-18) makes every architectural decision this mission
needs, each with its own evidence measured against this checkout. This prompt sequences and scopes
that material into fourteen subtasks. Do not re-open, re-argue, or silently deviate from any
decision D-1…D-18; if you find a genuine gap the plan does not cover, stop and report it rather than
deciding it yourself.

Done means:

- `sk-site-footer` gains **exactly one** new public reactive property (`presentation`) and **exactly
  one** new slot (`compact-links`); **no** new `::part()`.
- The compact presentation renders correctly with zero, one, or several consumer-supplied links, in
  **both** the custom-element path and the generated no-JavaScript static-HTML path, with no `<nav>`,
  no heading, no `<ul>`, and no `<hr>` under any input.
- The existing full three-column presentation is **completely unchanged** — its markup, its classes,
  its parts, its stories, its generated static HTML, and its CI visual-regression baseline are all
  byte/pixel-identical to before this WP.
- Every generated artifact (`sk-site-footer.html`, `index.ts`, `custom-elements.json`, the React
  wrapper, the Vue types, `SIZES.md`) is produced only by its generator and committed — never hand-
  edited.
- `expected-docs.json` and `expected-stories.json` are updated to the exact counts this change obliges;
  `expected-parts.json`, `behaviours.json`, `mutations.json`, and `expected-inert-theme-wrappers.json`
  are **not** touched.
- Nine new stories exist (7 elements-layer, 2 styles-layer) covering: Family 6's one-link shape, zero
  links, several links, no legal line, long/localized content, RTL, and light theme.
- Two new Playwright specs exist, asserting overflow, target size, the live narrow-stack threshold,
  RTL mirroring, keyboard order, forced-colors boundary/affordance.
- `fixtures/elements-behaviour/src/sk-site-footer.test.ts` is extended **in place** (never replaced)
  with landmark-absence, element↔static equivalence, extended no-clock, and base-form-untouched cases.
- The full verification sequence in "Verification (D-15's exact sequence)" below passes, and CI's
  `visual-regression-diffs` artifact reports zero diff for the existing full-presentation baselines.

## Context & Constraints

- **Mission spec**: `kitty-specs/site-footer-compact-mode-01M268NS/spec.md` — read all 6 user
  stories, all 13 FRs, all 11 NFRs, all 13 constraints, the Edge Cases section, and the Cross-mission
  section before starting.
- **Mission plan**: `kitty-specs/site-footer-compact-mode-01M268NS/plan.md` — the authoritative
  source for the API shape (D-1…D-3), the compact anatomy and the Terms-anchor contract (D-4), no-
  empty-landmark mechanism (D-5), element↔static equivalence (D-6), no-clock discipline (D-7),
  responsive stacking and the #309/#310 non-dependency (D-8), forced-colors/reduced-motion/target-
  size (D-9), backward compatibility (D-10), the exact file inventory (D-11), ratchet arithmetic
  (D-12), the CI path-filter finding (D-13), the exact verification sequence (D-15), and named
  implementation constraints (D-16) and risks (D-17). This WP's subtasks map onto D-11's authored/
  generated file split and D-15's exact command sequence.
- **Mission research**: `kitty-specs/site-footer-compact-mode-01M268NS/research.md` — R1 (the
  generator's emission contract, read from source), R2 (the Family 6 corpus anatomy, byte-for-byte),
  R3 (ADR-15/#309/#310, measured), R4 (ratchet arithmetic, read from the live files), R5 (CI wiring),
  R6 (in-repo idioms to copy), R7 (claims checked and disagreements found — the repository wins over
  the issue/spec/brief in each case named there).
- **The component you are extending, not replacing**: `packages/elements/src/site-footer/
  sk-site-footer.markup.ts`, `sk-site-footer.ts`, `packages/styles/src/site-footer/
  sk-site-footer.css`, both story files, and `fixtures/elements-behaviour/src/sk-site-footer.test.ts`
  all already exist. Read all of them in full before editing any of them. The full three-column
  presentation's every existing rule, class, part, story, and test outcome must survive this WP
  completely unchanged.

### The chosen API shape — concrete, not a summary

- **One new public reactive property**: `presentation: 'full' | 'compact' | undefined` (reflect:
  true, type String). Declared as a **non-variant `_AXES` entry** —
  `SITE_FOOTER_AXES = { Compact: { presentation: 'compact', links: PLACEHOLDER_COMPACT_LINKS },
  CompactNoLinks: { presentation: 'compact' } }` — while `SITE_FOOTER_VARIANTS` **stays `{}`**.
  **In-repo precedent to follow exactly**: `sk-check-bullet` keeps `CHECK_BULLET_VARIANTS = {}`
  (`sk-check-bullet.markup.ts:26`) while declaring its own structure-affecting, backward-compatible
  added presentation as `CHECK_BULLET_AXES = { Pending: { state: 'pending' } }` (`:46`), whose own
  option doc states the backward-compatibility contract verbatim: *"Omit for the backward-compatible
  complete presentation."* Copy that shape, including its shared-class-helper pattern
  (`checkBulletClasses(state)`).
- **One shared helper, called by both paths**:
  ```ts
  export function siteFooterClasses(presentation?: string): string {
    return ['sk-site-footer', siteFooterPresentation(presentation).modifier].filter(Boolean).join(' ');
  }
  ```
  The element writes `class=${siteFooterClasses(this.presentation)}` on its own `<footer>`; the
  static form writes the identical string. Every compact CSS rule is therefore an **ordinary root-
  block BEM class selector** (`.sk-site-footer--compact`), matching identically in a shadow root and
  in a document.
- **No `:host([attr])` rule anywhere, of any shape** — not the descendant form, not the bare form,
  not `:host(:is(…))`. **This is what keeps ADR-15's #309/#310 machinery untriggered.** ADR-15 rules
  on a *host-attribute axis inside a host-owned `@container`* (kind 1) and *host-owned
  `container-type`* (kind 2); `sk-site-footer.css` has neither today and this WP must not add either.
  Confirm before finishing: `grep -n 'container-type\|@container\|:host(' packages/styles/src/
  site-footer/sk-site-footer.css` returns only `6::host { display: block; }` — nothing else.
- **No new `::part()`.** The compact presentation reuses `part="footer"` and `part="legal"`; it
  renders neither `part="grid"` nor `part="divider"`. Adding a part costs an `expected-parts.json`
  entry, a `total` bump, and a same-PR literal `::part(<name>)` test case, and nothing in the spec
  requires one. **Decision: none is added.**

### The compact anatomy (verbatim from plan D-4)

```html
<footer part="footer" class="sk-site-footer sk-site-footer--compact">
  <div class="sk-site-footer__row">
    <div class="sk-site-footer__meta">
      <div class="sk-site-footer__brand">                       <!-- only when wordmark is set -->
        <span class="sk-site-footer__wordmark">…</span>
      </div>
      <p class="sk-site-footer__tagline">…</p>                  <!-- only when tagline is set -->
      <p part="legal" class="sk-site-footer__legal">…</p>       <!-- only when legal is non-blank -->
    </div>
    <slot name="compact-links"></slot>                          <!-- element path -->
  </div>
</footer>
```

The static path emits the identical tree, with the slot replaced by the consumer's rendered links:
`<a class="sk-site-footer__link sk-site-footer__link--compact" href="…">…</a>`.

**No wordmark node exists in the corpus** — `.footer-name` is a tagline-ish `<p>`, not a wordmark.
Render the `wordmark` block **only when a consumer supplies `wordmark`**, so a corpus-shaped consumer
(who omits it) gets the corpus tree exactly, and a consumer who wants FR-002's brand block gets it.

### The Terms-anchor contract — concrete, not a summary

- **Element path**: the consumer writes **real DOM**. Nothing is parsed, nothing is interpolated,
  nothing is escaped — no string ever carries markup:
  ```html
  <sk-site-footer presentation="compact" tagline="…" legal="© 2026 Example · Free private beta">
    <a slot="compact-links" class="sk-site-footer__link sk-site-footer__link--compact"
       href="/terms/">Terms</a>
  </sk-site-footer>
  ```
  Zero links: omit the children. Several: write several, in the order wanted — DOM order is render
  order and focus order.
- **Static path**: the consumer passes **structured values**; the module escapes them at the only two
  boundaries that exist — `label` through `text()`, `href` through `attr()`:
  ```ts
  siteFooterStaticHtml({
    presentation: 'compact',
    legal: '© 2026 Example · Free private beta',
    links: [{ label: 'Terms', href: '/terms/' }],
  });
  ```
  **No markup-bearing string is ever accepted.** No injection hole exists: a consumer cannot smuggle
  a tag through `label`, cannot break out of the attribute through `href`.
- **`links` is deliberately NOT in `DEFAULTS`.** `siteFooterStaticHtml` merges `{ ...DEFAULTS,
  ...opts }`; anything in `DEFAULTS` reaches a consumer who omitted it. A default link would put a
  library-authored label and destination into a real consumer footer — forbidden by FR-010 and C-005.
  The placeholder links used by the `_AXES` demo entries live **only in the `_AXES` object**, never in
  `DEFAULTS`, so `siteFooterStaticHtml({ presentation: 'compact' })` renders **zero** links — this is
  exactly the `CompactNoLinks` case.
- **The library supplies no label, no destination, no count, no `rel`, no `target`, and no year — ever.**

### Zero links → no scaffolding, in BOTH paths

There is nothing to be empty, structurally. The compact presentation renders **no** `<nav>`, **no**
heading, and **no** `<ul>` under any input — full stop, not conditionally. The link region is a bare
`<slot>` in the element path (a slot with no assigned nodes and no fallback content contributes
nothing to the accessibility tree and paints nothing) and an empty string in the static path. Assert
this with `querySelectorAll('nav, ul, ol, li, h1, h2, h3, h4, h5, h6, hr').length === 0` over **both**
the shadow tree and the static string parsed into a document, at zero/one/several links.

### Backward compatibility — a hard constraint, not a hope

- `packages/styles/src/site-footer/sk-site-footer.html` stays **byte-identical**. The generator
  writes only `call({}, 'the base form')` into it — no `_VARIANTS`/`_AXES` entry ever reaches this
  file.
- `SkSiteFooterHTML` in `packages/styles/src/site-footer/index.ts` stays **byte-identical**. The two
  new exports (`SkSiteFooterCompactHTML`, `SkSiteFooterCompactNoLinksHTML`) are appended after it, in
  `forms` order — the diff on this file must be **additive only**.
- `render()`'s **full** branch returns the **existing template literal, unedited**. The compact
  branch is a separate private method; nothing in the full path's rendering or its `#column()` helper
  is touched.
- The full presentation's existing stories (`Default`, `WithoutLegal`, `LightMode` on the elements
  layer; `Default`, `LightMode` on the styles layer) keep their existing export names, render
  functions, and wrappers.
- **Every new CSS rule targets a class the full presentation never carries** — `--compact`, `__row`,
  `__meta`, `__link--compact` — and the one line added inside the existing `@media (max-width: 640px)`
  block targets `.sk-site-footer__row`, which the full presentation does not render.
- **New test, added in T009**: `[FR-009] the full presentation's static form is untouched by the
  compact branch` — asserts `siteFooterStaticHtml()` contains exactly two `<nav`, exactly one `<hr`,
  and does **not** contain the string `sk-site-footer--compact`. This must red immediately if the
  compact branch ever leaks into the base form.
- **The mixed-property edge case** (spec Edge Cases) is answered structurally, not left undefined:
  when `presentation === 'compact'`, the element renders no `<nav>`, so `headingOne`/`headingTwo` are
  not read and anything assigned to `column-one`/`column-two` has no slot to land in. Symmetrically,
  `links`/`compact-links` are not read in the full presentation. Pin both directions with one test
  case in T009: `compact ignores the full presentation's headings and column slots, and vice versa`.

### Forced colors, reduced motion, and focus — D-9/D-9a, read carefully

- The compact presentation authors **no** `background`, **no** `box-shadow`, **no** `transition`, **no**
  `animation`, and **no** `color` declaration at all. It is layout only.
- The existing `.sk-site-footer { border-top: 1px solid var(--sk-border-default) }` already survives
  `forced-colors: active` with zero authored CSS — do not add anything to it.
- **No focus-ring CSS is authored, and no reduced-motion guard is added to the pre-existing
  `.sk-site-footer__link` transition.** Both would reach the **frozen** full presentation, because
  `.sk-site-footer__link` is shared by both presentations. The compact links keep the UA's own
  `:focus-visible` ring — the same thing the full presentation ships today. NFR-006/NFR-003 are
  discharged by **asserting** the UA indicator (`getComputedStyle(link).outlineStyle !== 'none'` on
  focus, both normal and `forced-colors: active`, and no clipping ancestor), not by authoring one.
- **The 44px target-size rule is the one place compact CSS must reach the anchors**, and it must be a
  **light-DOM class on the anchor** (`.sk-site-footer__link--compact`), never a descendant selector
  from the root class — a descendant selector matches in the static path but **not** in the element
  path, where the root class sits inside the shadow root and the anchor does not descend from it. Use:
  ```css
  .sk-site-footer__link--compact {
    display: inline-flex;
    align-items: center;
    min-block-size: calc(var(--sk-space-8) + var(--sk-space-1));   /* 40 + 4 = 44px */
    min-inline-size: calc(var(--sk-space-8) + var(--sk-space-1));
    padding-inline: var(--sk-space-2);
  }
  ```
  **Re-verify the 40+4=44 arithmetic against `packages/tokens/src/tokens.css` at implementation
  time, and against the computed `getBoundingClientRect()` in Playwright — never trust this
  paragraph alone.**
- **Hard constraint**: none of `.sk-site-footer--compact`, `.sk-site-footer__row`,
  `.sk-site-footer__meta`, `.sk-site-footer__link--compact`, nor the added line inside the
  `@media (max-width: 640px)` block may contain a `color:` declaration anywhere. The existing AA test
  derives its set of coloured leaves by scanning the sheet for `color:` — a stray `color:` on a new
  element name demands a measurement case that does not otherwise need to exist, and breaks the
  "existing AA test passes untouched" backward-compatibility proof.

### The hard rules (apply throughout, no exceptions)

- **Tokens only** (C-001) — every CSS value is `var(--sk-*)` or `calc()` over `--sk-*` values; no raw
  hex, `rgba()`, px, radius, shadow, motion, or z-index literal.
- **BEM naming** (C-002) — `sk-site-footer__element--modifier`; no new block prefix. New names:
  `.sk-site-footer--compact`, `.sk-site-footer__row`, `.sk-site-footer__meta`,
  `.sk-site-footer__link--compact`.
- **`class="sk-light"`, never `data-theme="light"`** (C-004) for every `LightMode` story.
- **No theme selector in component CSS** (C-003) — no `:root[data-theme="light"]` / `.sk-light …`
  selector inside `sk-site-footer.css`.
- **No clock-derived year** (C-006) — no `Date` reference anywhere; nothing added to `DEFAULTS`; the
  `_AXES` placeholder link labels/`href`s contain **no digits at all**.
- **Generated output is never hand-edited** (C-007) — every generated file listed in "Files touched"
  below is produced only by its named generator and committed as-is.

## Files touched

**Authored (hand-edited):**

| Path | Subtask |
|---|---|
| `packages/elements/src/site-footer/sk-site-footer.markup.ts` | T001 |
| `packages/elements/src/site-footer/sk-site-footer.ts` | T002 |
| `packages/styles/src/site-footer/sk-site-footer.css` | T003 |
| `packages/elements/src/site-footer/sk-site-footer.stories.ts` (+7 exports) | T007 |
| `packages/styles/src/site-footer/sk-site-footer.stories.ts` (+2 exports) | T007 |
| `fixtures/elements-behaviour/src/sk-site-footer.test.ts` (in place) | T009 |
| `apps/storybook/src/tests/sk-site-footer-compact.spec.ts` (new) | T011 |
| `apps/storybook/src/tests/sk-site-footer-compact-forced-colors.spec.ts` (new) | T012 |
| `fixtures/vue-consumer/src/types.test-d.ts` (+2 lines) | T010 |
| `expected-docs.json` | T005 |
| `expected-stories.json` | T008 |

**Generated (never hand-edited; produced by the named generator, committed):**

| Path | Generator |
|---|---|
| `packages/elements/src/site-footer/sk-site-footer.css.js`/`.d.ts` | `scripts/build-elements-css.mjs` |
| `packages/styles/src/site-footer/sk-site-footer.html` (byte-identical) / `index.ts` (additive) | `scripts/build-element-markup.mjs` |
| `packages/elements/custom-elements.json` | `npx nx run elements:analyze --skip-nx-cache` |
| `packages/react/src/SkSiteFooter.js`/`.d.ts` | `scripts/build-react-wrappers.mjs` |
| `packages/elements/vue.d.ts` | `scripts/build-vue-types.mjs` |
| `packages/elements/SIZES.md` | `scripts/measure-elements-sizes.mjs` (after a real build) |

**Must not touch**: `docs/architecture/decisions/**`, `docs/architecture/validation/**`,
`docs/learnings/**`, `apps/demo/**`, `ux_redesign/**` (read-only corpus), the sibling mission
checkouts `../353` and `../355`, `.github/workflows/ci-quality.yml`, `stylelint.config.mjs`,
`suite-budget.json`.

## Environment constraints (read before any Playwright or build run)

1. **`playwright.config.ts` (repo root) hardcodes port 6006, `reuseExistingServer: !CI`.** Sibling
   mission checkouts under `/home/jeroennouws/dev/spec-kitty-design-missions/` may already be serving
   their own Storybook build on that port, and Playwright will silently attach to it. **Before any
   Playwright run**: `ss -ltnp | grep 6006` (or `lsof -i :6006`) and confirm either nothing holds the
   port, or that what holds it is **this checkout's own** `http-server apps/storybook/storybook-
   static`. If something else holds it, stop it or set `CI=1` to force a fresh server. **A green
   Playwright run obtained against a foreign Storybook must never be reported as evidence** — treat it
   as no evidence at all and re-run correctly.
2. **Visual baselines are CI-authoritative.** Never run `--update-snapshots` locally. If a compact
   story needs a new baseline, harvest the PNG from the PR's CI run `visual-regression-diffs`
   artifact — never generate one on the workstation (different font metrics).
3. **`--skip-nx-cache` wherever nx is involved in a `--check` comparison.** A cached `analyze` or
   `build` output can make a `--check` compare a stale artifact against itself and report green over
   a change it never saw.
4. **Never commit a compressed/gzipped byte figure.** `SIZES.md` carries a `min+gzip` column and an
   SRI hash that differ between workstation and CI (zlib output differs; esbuild embeds module-path
   comments that differ across `node_modules` layouts). Regenerate it per T006, inspect the diff, and
   confirm the delta is a plausible small increase from the added CSS/markup — if the local figures
   move in ways a few hundred bytes cannot explain, that is a `node_modules`-layout artifact and CI's
   figure is the one that stands. Never hand-edit the file.
5. **Commit scopes.** Product commits use `feat(elements):` / `feat(styles):` / `fix(elements):` /
   `test(elements):` / `docs:` (unscoped). **`docs(specs)` and `docs(spec)` are NOT valid scopes** and
   will red `lint-code` — the enum lives in `commitlint.config.cjs` and does not include a `spec`/
   `specs` scope; only the anchored `chore(spec): …` message pattern is exempted, for spec-artifact
   commits made via `spec-kitty spec-commit`, not for hand-typed `docs(spec)`/`docs(specs)` messages.

## Branch Strategy

- **Strategy**: single_branch — this mission's target branch IS `mission/site-footer-compact-mode`;
  there is no separate mission-lane branch.
- **Planning base branch**: `mission/site-footer-compact-mode`
- **Merge target branch**: `mission/site-footer-compact-mode`
- The mission branch is later opened as a PR into `train/elements-first`, body using `Refs #354` and
  `Refs #352` — never `Closes`, because GitHub honours closing keywords only on merges into the
  default branch and this PR targets the train. That sequence runs after this WP is done and is not
  this WP's own action, except for T014's own push/CI-confirmation step.

> These fields are populated automatically by `spec-kitty agent mission tasks`.
> Do NOT change them manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T001 – Authored markup module

- **Purpose**: the single authored source everything else flows from — the compact branch of
  `siteFooterStaticHtml`, the `_AXES` declaration, and the shared class helper.
- **Steps**:
  1. Add `SiteFooterLink { label: string; href: string }` and extend the options interface with
     `presentation?: SiteFooterPresentation` (`'full' | 'compact'`) and `links?: readonly
     SiteFooterLink[]`.
  2. Add `siteFooterClasses(presentation?: string): string` per the exact shape in "The chosen API
     shape" above.
  3. Write the compact branch of `siteFooterStaticHtml`: the anatomy in "The compact anatomy" above,
     `wordmark`/`tagline`/`legal` rendered only when set (`(legal ?? '').trim()` non-blank for the
     legal line, matching the existing full-form discipline), `label` through `text()`, `href`
     through `attr()`, **no** `<nav>`/heading/`<ul>`/`<hr>` anywhere in this branch.
  4. Declare `SITE_FOOTER_AXES = { Compact: { presentation: 'compact', links: PLACEHOLDER_COMPACT_
     LINKS }, CompactNoLinks: { presentation: 'compact' } }`. `SITE_FOOTER_VARIANTS` stays `{}`
     (unchanged).
  5. The `_AXES` placeholder links must contain **no digits** in either `label` or `href` (C-006);
     `href` may be `#`.
  6. Add **nothing** to `DEFAULTS`.
  7. Add **no new import** — the module must stay leaf-safe (C-008); `assertLeafImports` refuses a
     bare specifier or a non-leaf target before evaluation, failing the generator with a named error.
  8. Add the consumer-facing `/** */` doc comment for the new options fields (C-009).
- **Files**: `packages/elements/src/site-footer/sk-site-footer.markup.ts` (edit).
- **Parallel?**: No — first subtask; everything else depends on it.

### Subtask T002 – Authored element

- **Purpose**: the public API surface (`presentation` property, `compact-links` slot) and the private
  compact render branch, with the full branch left completely untouched.
- **Steps**:
  1. Add `presentation: { type: String, reflect: true }` to `static properties`, and
     `declare presentation: 'full' | 'compact' | undefined;` with a consumer-facing `/** */` doc
     comment (not maintainer rationale — that stays in `//`), per C-009.
  2. Add `@slot compact-links - the compact presentation's links, as native \`<a>\` elements` to the
     class docblock.
  3. Add a private render method for the compact branch, importing and calling `siteFooterClasses()`
     from the markup module for the root class list.
  4. **Do not touch** `render()`'s existing full branch, its template literal, or `#column()` — copy
     it nowhere, edit it nowhere.
  5. Branch `render()` on `this.presentation === 'compact'` to the new private method; every other
     value (including `undefined` and any unsupported string) falls through to the existing full
     branch unedited.
- **Files**: `packages/elements/src/site-footer/sk-site-footer.ts` (edit).
- **Parallel?**: No — depends on T001 (imports `siteFooterClasses`).

### Subtask T003 – CSS

- **Purpose**: the compact layout, its narrow stacking (reusing the sheet's existing threshold), and
  the light-DOM target-size rule — token-only, colour-free, BEM.
- **Steps**:
  1. Add `.sk-site-footer--compact`, `.sk-site-footer__row`, `.sk-site-footer__meta` rules — layout
     only (`display: flex`, `align-items`, `justify-content: space-between`, `gap: var(--sk-space-*)`
     — the corpus's own `.row-between` idiom). No physical `left`/`right`/`margin-left`/`margin-right`/
     `text-align` — RTL (FR-013) must mirror automatically via logical/flex properties alone.
  2. Add `.sk-site-footer__link--compact` per the exact rule in "Forced colors, reduced motion, and
     focus" above. Re-verify the 44px arithmetic against `packages/tokens/src/tokens.css` before
     committing to it.
  3. Add **one line** inside the sheet's **existing** `@media (max-width: 640px) { … }` block:
     `.sk-site-footer__row { flex-direction: column; align-items: flex-start; }`. Do **not** introduce
     a new breakpoint or a new documented threshold (D-8/NFR-011 — the existing 640px figure is
     reused, live-asserted at 639px/641px by T011, not newly declared).
  4. Confirm **zero** `color:` declaration anywhere in the new rules or the added media-block line
     (hard constraint above).
  5. Confirm **zero** `container-type`, `@container`, or `:host([attr])` anywhere in the file after
     your edit: `grep -n 'container-type\|@container\|:host(' packages/styles/src/site-footer/
     sk-site-footer.css` must show only the existing `:host { display: block; }`.
- **Files**: `packages/styles/src/site-footer/sk-site-footer.css` (edit).
- **Parallel?**: No — depends on T001/T002 for the exact class names.

### Subtask T004 – Regenerate the generated fan-out

- **Purpose**: produce every derived artifact from T001–T003's authored source, with no hand-editing,
  and prove the full presentation's generated forms are untouched.
- **Steps**:
  1. `node scripts/build-elements-css.mjs`
  2. `node scripts/build-element-markup.mjs`
  3. `npx nx run elements:analyze --skip-nx-cache` (rewrites `custom-elements.json`)
  4. `node scripts/build-react-wrappers.mjs` (rewrites `packages/react/src/SkSiteFooter.{js,d.ts}` —
     **flat**, not `packages/react/src/site-footer/**`; the repository wins over any brief stating
     otherwise)
  5. `node scripts/build-vue-types.mjs` (rewrites `packages/elements/vue.d.ts`)
  6. Confirm `packages/styles/src/site-footer/sk-site-footer.html` is **byte-identical** to before
     this WP (`git diff` on it shows nothing).
  7. Confirm `packages/styles/src/site-footer/index.ts`'s diff is **purely additive** — the existing
     `SkSiteFooterHTML` line unchanged, two new lines appended.
  8. Confirm `custom-elements.json`'s diff is additions only — one attribute, one slot, one member on
     the existing `sk-site-footer` declaration; nothing renamed or removed.
- **Files**: the six generated paths listed in "Files touched" (all regenerated).
- **Parallel?**: No — depends on T001, T002, and T003 together (the generator reads the whole module).

### Subtask T005 – `expected-docs.json` ratchet

- **Purpose**: keep the exact-equality manifest-content gate green against the regenerated manifest.
- **Steps**:
  1. Re-read the **live** `expected-docs.json` on this checkout's current branch tip before editing —
     do not trust the `5→6`/`133→134` figures below if the base has moved since planning (R9); apply
     **+1** to whatever the live per-element row and the live `total` actually say.
  2. Set `sk-site-footer.attributes` to the new count (expected: **6**, from **5**). `properties` and
     `methods` stay unchanged (`presentation` is a reflected attribute, not `attribute: false`; no new
     public method is added).
  3. Give `presentation` a non-empty consumer-facing description in the manifest source (T002) — the
     gate fails on `attr.description` otherwise.
  4. Bump the file's `total` by exactly the same delta as the per-element change.
  5. Run `node scripts/check-manifest-content.mjs` and confirm it passes.
- **Files**: `expected-docs.json` (edit).
- **Parallel?**: No — depends on T004 (the manifest must exist to be compared against).

### Subtask T006 – Build, then measure `SIZES.md`

- **Purpose**: NFR-010 — the committed size figure must reflect a real build of `dist/`, not a stale
  one. `measure-elements-sizes.mjs` **reads** `dist/` and does **not** build it.
- **Steps**:
  1. `npx nx run-many --target=build --projects=tokens,styles,elements --skip-nx-cache`
  2. `node scripts/measure-elements-sizes.mjs` (writes `packages/elements/SIZES.md`)
  3. `git diff packages/elements/SIZES.md` and confirm the delta is a plausible small increase
     explained by the added CSS/markup — see "Environment constraints" item 4 if it is not.
- **Files**: `packages/elements/SIZES.md` (generated, committed).
- **Parallel?**: No — depends on T004 (needs the regenerated sources to build from). Independent of
  T005.

### Subtask T007 – Author the nine stories

- **Purpose**: Storybook demonstration and acceptance-evidence surface for every required compact
  scenario, per plan D-12's planned story set.
- **Steps**:
  1. Elements layer (`packages/elements/src/site-footer/sk-site-footer.stories.ts`), 7 new exports:
     `Compact` (Family 6 one-link shape, default dark, consumer-supplied year in `legal`),
     `CompactNoLinks` (FR-005 zero links), `CompactSeveralLinks` (FR-004 several links, consumer
     order), `CompactWithoutLegal` (no legal line, no divider), `CompactLongContent` (NFR-001/FR-011
     max-length localized strings), `CompactRtl` (FR-013, `dir="rtl"` ancestor), `CompactLightMode`
     (C-004/NFR-005, wraps `class="sk-light"`).
  2. Styles layer (`packages/styles/src/site-footer/sk-site-footer.stories.ts`), 2 new exports:
     `Compact` (FR-008 no-JavaScript static form, rendered from `SkSiteFooterCompactHTML`),
     `CompactLightMode` (C-004 on the static path).
  3. Every `LightMode` export wraps `class="sk-light"`, never `data-theme="light"` (C-004).
  4. Do not touch any existing story export.
- **Files**: both `sk-site-footer.stories.ts` files (edit).
- **Parallel?**: No — depends on T004 (stories render the generated static exports and exercise the
  new element property).

### Subtask T008 – Build Storybook, read story ids, edit `expected-stories.json`

- **Purpose**: SC-003/SC-006 — every new story id must be present in both the built Storybook and the
  shrink-only ratchet, or `run-axe-storybook.js` fails by name.
- **Steps**:
  1. `npx nx run storybook:storybook:build --skip-nx-cache`
  2. Read the exact new ids out of the build:
     `node -e "console.log(Object.keys(require('./apps/storybook/storybook-static/index.json').entries).filter(i=>i.includes('sitefooter')).join('\n'))"`
     — **do not hand-derive ids from this prompt's prose.**
  3. Add the 7 elements-layer ids to `byElement["sk-site-footer"]`.
  4. Add a **new** key `"sk-site-footer (static path)"` with the 2 styles-layer ids — precedent:
     `"sk-card (static path)": [...]`.
  5. Raise `total` by exactly the count of ids added (9).
  6. `node scripts/run-axe-storybook.js` and confirm it passes with zero WCAG 2.1 AA violations across
     every required compact story.
- **Files**: `expected-stories.json` (edit).
- **Parallel?**: `[P]` with T009/T010 — depends on T007 only.

### Subtask T009 – Extend `sk-site-footer.test.ts` in place

- **Purpose**: make every structural acceptance claim a gate, not a review opinion. **Do not create a
  new fixture file** — extending the existing subject file keeps `(SC-id, subject)` pairs in
  `behaviours.json` unchanged and leaves `suite-selftest.mjs` guards 7/9 satisfied.
- **Steps**:
  1. `compact renders no landmark, no heading and no list — at zero, one and several links`: for each
     of the three cases, over both the element's shadow tree and the static string parsed into a
     document, `querySelectorAll('nav, ul, ol, li, h1, h2, h3, h4, h5, h6, hr').length === 0`.
  2. `compact draws no divider, with or without a legal line`: `partOf(el, 'divider') === null` in
     both paths.
  3. `[FR-007] the compact element and the compact static form are the same component`: Vitest
     **browser mode on the Playwright provider**, three fixtures (zero/one/three links), identical
     `wordmark`/`tagline`/`legal`/link content, fixed container width. Serialise both trees to a
     normalised signature (`tagName + sorted class list + part attribute`, depth-first, the element
     path's `<slot>` replaced by `assignedElements()`) and assert `toEqual`. Compare
     `getBoundingClientRect()` width/height/x/y relative to each root, and computed `display`/
     `flex-direction`/`justify-content`/`align-items` of the row — compared against **each other**,
     never against a number written in this prompt or the plan.
  4. Extend the existing `the generated form does not read the clock` test to iterate
     `Object.values(SITE_FOOTER_AXES)` rather than the base form alone — `expect(form, '…').not.toMatch(/\d{4}/)`
     for every emitted form.
  5. `[FR-009] the full presentation's static form is untouched by the compact branch`: assert
     `siteFooterStaticHtml()` contains exactly two `<nav`, exactly one `<hr`, and does **not** contain
     `sk-site-footer--compact`.
  6. `compact ignores the full presentation's headings and column slots, and vice versa` — the
     mixed-property case, both directions.
  7. Run the existing `every ink meets AA in BOTH themes` test unchanged and confirm it still passes
     with **no new case required** — if it demands one, a `color:` declaration leaked into a compact
     rule; go fix T003, don't add a case here.
  8. Import site-footer modules directly (e.g. `SITE_FOOTER_AXES` from `site-footer/
     sk-site-footer.markup.js`), never `@spec-kitty/elements` — `scripts/check-behaviour-fixture-
     imports.mjs` fails on that specifier under `fixtures/elements-behaviour/src/`.
- **Files**: `fixtures/elements-behaviour/src/sk-site-footer.test.ts` (edit in place).
- **Parallel?**: `[P]` with T008/T010 — depends on T004 only.

### Subtask T010 – Vue type-level assertion

- **Purpose**: prove the generated Vue prop carries the literal union, not a bare `string`.
- **Steps**:
  1. Add two lines to `fixtures/vue-consumer/src/types.test-d.ts` asserting `Footer['presentation']`
     (or the generated equivalent name) accepts `'full'`/`'compact'`/`undefined` and rejects an
     invalid literal — mirror the existing `sk-app-shell` lines (`:45-50`), including a
     `@ts-expect-error` negative case.
- **Files**: `fixtures/vue-consumer/src/types.test-d.ts` (edit).
- **Parallel?**: `[P]` with T008/T009 — depends on T004 (the Vue types must already carry the new prop).

### Subtask T011 – Playwright spec: overflow, target size, narrow stack, RTL, keyboard

- **Purpose**: NFR-001, NFR-002, NFR-006, NFR-011, FR-011, FR-012, FR-013 — every acceptance claim
  that can only be measured in a real browser.
- **Steps**:
  1. New file `apps/storybook/src/tests/sk-site-footer-compact.spec.ts`.
  2. Overflow: for the `CompactLongContent` story, at 390px viewport and under 200% zoom emulation,
     assert `document.documentElement.scrollWidth <= document.documentElement.clientWidth` — idiom of
     `sk-app-shell-compact-navigation.spec.ts`.
  3. Target size: for every native link in the required compact stories, assert a computed interactive
     box ≥44 CSS px in both dimensions at 390px, via `getBoundingClientRect()`.
  4. Narrow stack: assert the live transition occurs at the sheet's existing threshold, with an
     **exact-boundary pair** — 639px (stacked) and 641px (not stacked) — not merely "eventually
     stacks." Confirm DOM/focus order is unchanged across the transition.
  5. RTL: mount `CompactRtl` inside a `dir="rtl"` ancestor and assert logical stacking/alignment
     mirror correctly with no fixed left/right geometry contradicting the reading direction.
  6. Keyboard: Tab repeatedly through the compact presentation and assert focus visits every supplied
     link in DOM order with a visible, unclipped indicator (`outlineStyle !== 'none'`, no clipping
     ancestor).
- **Files**: `apps/storybook/src/tests/sk-site-footer-compact.spec.ts` (new).
- **Parallel?**: `[P]` with T012 — depends on T008 (needs built story URLs/ids).

### Subtask T012 – Playwright spec: forced colors

- **Purpose**: NFR-003, NFR-006 under `forced-colors: active`.
- **Steps**:
  1. New file `apps/storybook/src/tests/sk-site-footer-compact-forced-colors.spec.ts`, following the
     idiom of `sk-copy-field-forced-colors.spec.ts` / `sk-notice-forced-colors.spec.ts`:
     `page.emulateMedia({ forcedColors: 'active' })`.
  2. Assert the footer's top boundary (`border-top`) remains visible.
  3. Assert every link's focus outline remains visible and unclipped by any ancestor's `overflow` or
     fixed block size.
- **Files**: `apps/storybook/src/tests/sk-site-footer-compact-forced-colors.spec.ts` (new).
- **Parallel?**: `[P]` with T011 — depends on T008.

### Subtask T013 – Full local verification gate matrix

- **Purpose**: confirm the whole WP is internally consistent before pushing, using every gate this
  host can run — the exact sequence from `plan.md` D-15, in order.
- **Steps** (see "Verification (D-15's exact sequence)" below for the literal commands):
  1. Re-run every drift `--check` (build-elements-css, build-element-markup, build-react-wrappers,
     build-vue-types, `git diff --exit-code -- custom-elements.json`, measure-elements-sizes --check).
  2. Content/hygiene gates: `check-manifest-content.mjs`, `check-no-css-in-source.mjs`,
     `check-elements-entries.mjs`, `check-adopted-css-boundaries.mjs`, `check-element-css-hygiene.mjs`,
     `check-part-ratchet.mjs`, `check-story-theme-wrapper.mjs` (+ `--selftest`),
     `check-behaviour-fixture-imports.mjs`, `typecheck-all.mjs`, `npm run quality:all`.
  3. Gate self-tests and wiring: `build-react-wrappers.mjs --selftest`,
     `check-manifest-content.mjs --selftest`, `check-gate-wiring.mjs`.
  4. **Before any Playwright command in this step**, confirm the port-6006 server under test is this
     checkout's own build (Environment constraints item 1).
  5. Suites: `npm run test`, `node scripts/suite-selftest.mjs`.
  6. Storybook/axe/Playwright: full local Playwright lane (`npx playwright test`), plus the two new
     specs individually.
  7. `git add -A && git status --porcelain` — must be **empty**.
- **Files**: none new — verification only.
- **Parallel?**: No — depends on everything before it.

### Subtask T014 – Rebase, push, confirm CI, PR

- **Purpose**: NFR-008/SC-012 — the visual baseline is CI-authoritative; this WP is not done until CI
  confirms it, and the pre-merge squad (tier C) has run.
- **Steps**:
  1. `git fetch origin && git log --oneline -1 origin/train/elements-first`; rebase onto the current
     tip if it has moved since dispatch (design phases go stale — re-fetch before implementing).
  2. Rerun the full gate matrix (T013) against the new head.
  3. Push and confirm CI is green.
  4. Confirm the `visual-regression-diffs` artifact reports **zero diff** for the existing full-
     presentation baselines; if a **new** compact baseline is needed, harvest the PNG from that CI
     artifact — never a local `--update-snapshots`.
  5. Confirm `expected-parts.json`, `behaviours.json`, `mutations.json`, and
     `expected-inert-theme-wrappers.json` are still byte-identical to before this WP (they are **not**
     obliged by this mission — D-12).
  6. Run the pre-merge adversarial squad against the final head SHA before requesting review, per
     C-011 (tier C, pre-merge only — never skipped regardless of tier).
  7. Open (or update) the PR from `mission/site-footer-compact-mode` into `train/elements-first`,
     body using `Refs #354` and `Refs #352` — **never** `Closes` (C-012).
- **Files**: none new — verification and PR only.
- **Parallel?**: No — depends on T013.

## Verification (D-15's exact sequence)

Run in this order; every command resolves in this checkout.

```bash
# 0. Start from a real base.
git fetch origin && git log --oneline -1 origin/train/elements-first

# 1. Regenerate every committed artifact from the authored source (T004)
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze --skip-nx-cache
node scripts/build-react-wrappers.mjs
node scripts/build-vue-types.mjs

# 2. BUILD, then measure (T006) — measure-elements-sizes.mjs READS dist/ and does not build it
npx nx run-many --target=build --projects=tokens,styles,elements --skip-nx-cache
node scripts/measure-elements-sizes.mjs

# 3. The drift checks — expect zero diff except the two new appended lines in index.ts
node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-vue-types.mjs --check
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/measure-elements-sizes.mjs --check

# 4. Content and hygiene gates
node scripts/check-manifest-content.mjs
node scripts/check-no-css-in-source.mjs
node scripts/check-elements-entries.mjs
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-element-css-hygiene.mjs
node scripts/check-part-ratchet.mjs
node scripts/check-story-theme-wrapper.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
node scripts/check-behaviour-fixture-imports.mjs
node scripts/typecheck-all.mjs
npm run quality:all

# 5. Gate self-tests and wiring
node scripts/build-react-wrappers.mjs --selftest
node scripts/check-manifest-content.mjs --selftest
node scripts/check-gate-wiring.mjs

# 6. Nothing left unstaged
git add -A && git status --porcelain     # must be empty

# 7. The suites
npm run test
node scripts/suite-selftest.mjs

# 8. Storybook, axe, Playwright — CONFIRM PORT 6006 IS THIS CHECKOUT'S OWN SERVER FIRST
ss -ltnp | grep 6006   # confirm nothing foreign holds it, or set CI=1
npx nx run storybook:storybook:build --skip-nx-cache
node scripts/run-axe-storybook.js
node -e "console.log(Object.keys(require('./apps/storybook/storybook-static/index.json').entries).filter(i=>i.includes('sitefooter')).join('\n'))"
npx playwright test apps/storybook/src/tests/sk-site-footer-compact.spec.ts
npx playwright test apps/storybook/src/tests/sk-site-footer-compact-forced-colors.spec.ts
npx playwright test

# 9. Visual regression — CI-AUTHORITATIVE. Do NOT run --update-snapshots locally.
#    Read the result from CI's `visual-regression-diffs` artifact on the PR.
```

Expected exit codes: every command above exits **0**. `git status --porcelain` at step 6 must print
**nothing**. Step 9 has no local exit code at all — it is read from the CI artifact, never executed
on the workstation.

## Risks (carried from plan.md D-17 — do not re-derive, apply these mitigations)

| # | Risk | Mitigation |
|---|---|---|
| R1 | A `color:` declaration slips into a new compact rule; the existing AA test demands a case for a leaf with no distinct ink. | Hard constraint in T003/T009; `npm run test` reds immediately with a named message. |
| R2 | The 44px target-floor arithmetic turns out wrong against the live token file. | Playwright (T011) asserts the **computed** box, not the CSS; re-verify against `tokens.css` at implementation time. |
| R3 | A local visual-regression run creates/updates a baseline with workstation font metrics. | Forbidden outright (Environment constraints item 2); step 9 routes to CI's artifact only. |
| R4 | Playwright silently reuses a sibling mission's Storybook on port 6006. | Environment constraints item 1: check the port before every run; `CI=1` forces a fresh server. |
| R5 | `expected-docs.json`'s `total` is bumped without the per-element row, or vice versa. | `check-manifest-content.mjs` checks both; T005 states the exact figures, re-derived live. |
| R6 | Story ids are hand-derived and mismatch Storybook's own index. | T008 reads ids from `storybook-static/index.json` before editing the ratchet. |
| R7 | The compact branch leaks into the base static form. | T009's `[FR-009]` test; `build-element-markup.mjs --check` is a byte comparison. |
| R8 | A reviewer reads the compact `presentation` attribute as ADR-15 kind 1 and asks for the #309 wrapper. | D-8's three-part answer; checkable in one `grep` (see "The chosen API shape"). |
| R9 | The branch's base moved; `133→134` is stale by PR time. | T014 step 1 re-fetches; T005 re-reads the live total before applying +1. |
| R10 | `nx` serves a cached `analyze` output over a manifest that was never regenerated. | `--skip-nx-cache` on analyze/build steps (Environment constraints item 3). |
| R11 | D-4a is read as an unauthorized departure from #77. | It is not — see "Settled decisions" in `tasks.md`; it is confirmed by direct corpus verification and not escalated further. If ever revisited, L1's cost is recorded there (`6→7`, `total +2`). |

## Out of scope (plan.md D-18 — a diff touching any of these is a defect in this WP)

Second footer component; any change to the full three-column contract's markup/classes/parts/
stories/pixels/`aria-label`/link transition/divider rule; any ADR; any #309/#310 work (no generated
host wrapper, no `container-type` anywhere); any i18n or English default; any date arithmetic; any
new `::part()`; any CI path-filter edit; any `stylelint.config.mjs` edit; any `suite-budget.json`
edit; an authored focus ring or reduced-motion guard on the shared `.sk-site-footer__link` rule; any
touch to `../353`, `../355`, or `ux_redesign/**`.

## Activity Log

*To be filled in by the implementer as work proceeds.*
