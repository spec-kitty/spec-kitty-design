# Adding a component

> **Rewritten for the elements-first architecture (#72).** This document previously told you
> to run `nx g @nx/angular:component` and to export `Default`, `Mobile`, `Desktop` stories.
> `packages/angular` was deleted in #102, ADR-8 moved behaviour into custom elements, and the
> required theme variant is `LightMode`. Two pre-merge lenses flagged that this file was the
> only doc a new implementer would open and that it was actively wrong.
>
> **Updated again for the React wrapper (#76).** #75 added a fourth package, `packages/react`,
> whose contents are generated; made property and method JSDoc into enforced published API; and
> added eight gates a component must pass that this page did not name. The Angular references
> above are history, kept because they explain what changed — nothing in this repo targets
> Angular.

Components live in **four** packages, and you author in three of them:

| package | holds | you edit it | published |
|---|---|---|---|
| `packages/tokens` | `--sk-*` custom properties — the only place a colour is written | yes | yes |
| `packages/styles` | the `.css` source of record, plus **generated** static HTML | yes | yes |
| `packages/elements` | the custom element, and the **authored** markup module | yes | not yet (#80) |
| `packages/react` | **generated** React wrappers | **never** | not yet (#80) |

`packages/react/src/` is generated from `custom-elements.json` by
`scripts/build-react-wrappers.mjs` and committed. Do not hand-edit it: `--check` regenerates and
fails on any drift, on a file the generator no longer emits, and on a shrunken output set. You
do not add anything there for a new component — get the manifest right and the wrapper follows.

> **This page used to say "There are no wrappers. ADR-8 confirmation #1 requires that none
> exist." That was true when written, and no ADR was violated by its stopping being true.**
> ADR-8 lists **four** validation criteria, unordered. #1 is *"one component ships … into three
> consumption paths … with **no wrapper package in existence**"*; #2 is *"a generated React
> wrapper of that same component passes the conformance matrix … and CI fails if the generated
> output drifts"*. What sequences them is the programme, not the ADR:
> `docs/architecture/elements-first-programme.md` assigns #1 to batch M6 (whose exit records
> "no wrapper in existence") and #2 to M9. #75 was M9. So the old sentence froze a milestone
> rather than stating a rule — and an earlier draft of *this* correction said the ADR itself
> sequenced them, which it does not.

## Steps

### 1. Author the CSS in `packages/styles`

**Give the host a box.** A custom element's UA default is `display: inline`, and `max-width`,
`width`, `margin` and vertical padding do not apply to a non-replaced inline box — so a
consumer's `style="max-width: 640px"` on your element is silently inert. Declare
`:host { display: … }` in the component's `.css`, and make it agree with the static form's own
display: `sk-section-banner` shipped `:host { display: inline-flex }` against a static
`display: flex` for one commit, and the two consumption paths rendered differently.

`:host` is accepted by `check-adopted-css-boundaries.mjs` and is inert in the static path, where
the root element IS the `.sk-<name>` div. #77 found five committed stories whose `max-width` had
never done anything.


`packages/styles/src/<name>/sk-<name>.css`. This is the source of record and the only file
stylelint's `--sk-*` rule can see.

**Never write a theme selector here.** `:root[data-theme="light"] .sk-x` and `.sk-light .sk-x`
both cross a shadow boundary, so both are **inert** once the CSS is adopted by an element —
silently, with no error and no warning, producing a `LightMode` story that renders dark
styling. #72 found and repaired exactly that in `sk-card.css`.

Light-mode variance goes in **tokens**, because a custom property inherits through a shadow
boundary and a selector does not. Reuse the tint family — `--sk-surface-tint-*`,
`--sk-on-tint-*`, `--sk-border-tint-*` — rather than inventing a component-named token.
`:host-context()` is not an escape hatch: Baseline limited, Chromium-only.

### 2. Author the markup ONCE, in `packages/elements`

**Only if the component has a static form.** The module is optional — the generator derives its
work set by glob from the elements that have one, and #72 and #73 both declined it.

The count moves every batch, so it is deliberately not stated here —
`git ls-files 'packages/elements/src/*/*.markup.ts'` is the answer. It was eight of twelve when
#79's batch landed. (This paragraph used to end "`sk-card` is the only one today", which had
gone stale three batches before a lens caught it — on the one page a new implementer opens.)

It **must be a leaf module with no relative imports**: the generator evaluates it from a `data:`
URL, which has no module base, and says so in a named error if you give it one.

**Composing another component's stylesheet.** A component may adopt a sheet it does not author:
`sk-blog-card` does `static styles = [cardSheet, sheet]` so one box is styled by both `sk-card`
and `sk-blog-card` rather than nesting a real `<sk-card>` a shadow root deeper. Two rules if you
do this:

- **Import the sheet by relative path**, never through the package barrel. `check-adopted-css-boundaries.mjs`
  derives the adopted set from those import specifiers and now REJECTS a `static styles` entry it
  cannot trace to one — a sheet the gate cannot see is a sheet ADR-9 Confirmation #1 does not
  cover.
- **The foreign sheet goes first**, and the static path must import the two sheets in the same
  order. The element and the story are two consumption paths of one component; if their cascades
  differ, the component has diverged from itself. Nothing computes a difference today (the two
  sheets deliberately share no declaration), so this is a convention held by an identity-and-order
  assertion, not by a computed style.

`packages/elements/src/<name>/sk-<name>.markup.ts` must export:

- `<NAME>_VARIANTS` — the variant → modifier map the generator derives its exports from;
- `<NAME>_AXES` — the **other** axes, as a map of export-name-suffix to the options producing it
  (`{ Inset: { inset: true } }` for card, **`{}`** for a component with none). Not optional:
  `build-element-markup.mjs` exits with a named error if it is missing;
- `<name>StaticHtml(opts, content?)` — the server-rendered form. **An options object, not
  positionals.** The generator calls `staticHtml({}, content)` and `staticHtml(opts)`;
- `<name>Classes(variant?, …)` — the BEM class list. Not required by the generator; it is the
  element's own render helper.

**The two entry points have deliberately different failure policies, and collapsing them is a
regression this repo has already had — and reverted.** `<name>Classes` **warns and degrades** to
the base class on an unknown variant. The throwing version was tried and measured: Lit rejects
`updateComplete`, `render()` never returns a tree, and `<sk-card variant="typo">` paints an empty
shadow root with no `<slot>` — so the element silently eats its own light-DOM children. `<name>StaticHtml` **throws**, because it runs at build time where a bad variant must not
reach committed output. `sk-card.markup.ts` says so at the definition, and a test in
`fixtures/elements-behaviour/src/sk-card.test.ts` pins it.

> An earlier version of this page fixed the signature at `(variant, inset, content)` and
> attributed the throw to `Classes`. Both were wrong: `inset` is a **card** axis, which is why
> `_AXES` exists (#115/#121), and the throw belongs to `StaticHtml`. Following the old text
> reintroduced a bug #72 had fixed, and the generator would have committed base-class-only HTML
> for every variant while reporting success.

ADR-10 §3: *the element's template is the sole authored source.* `sk-<name>.html` and
`packages/styles/src/<name>/index.ts` are **generated** from this module by
`node scripts/build-element-markup.mjs`, and CI fails if they drift. Do not hand-edit them,
and do not hand-write markup in a story — render from the generated exports.

### 3. Write the element

`packages/elements/src/<name>/sk-<name>.ts`:

- `static styles = [sheet]` from the generated `sk-<name>.css.js` — never `css\`\`` in the
  `.ts`, which `scripts/check-no-css-in-source.mjs` enforces;
- register through `define()` (ADR-10 §5), and carry an **`@element sk-<name>`** JSDoc — the
  manifest analyzer cannot follow the guarded helper, and `check-manifest-content.mjs` fails
  without it;
- declare every `::part()` with `@csspart`, and **terminate the tag before any prose** — the
  description is published API and swallows the rest of the docblock otherwise;
- declare `@slot` for every slot you render. The analyzer will **not** infer one from a
  `<slot>` in the template — `sk-card` shipped without it and nothing noticed until #75;
- type every event: **`@fires {CustomEvent<{ open: boolean }>} sk-<name>-toggle - …`**. Without
  the `{Type}` the manifest records `type: None` and the generated React handler receives a bare
  `CustomEvent` with no detail. #75's plan called that gap the sharpest argument for a wrapper
  package before measuring that it was one line of our own JSDoc;
- **document every public reactive property and public method.** This is not style: the analyzer
  copies each description into `custom-elements.json`, `normalise-manifest.mjs` propagates it
  onto the attribute, and the React generator copies it into the prop docs a consumer reads in
  their editor. `scripts/check-manifest-content.mjs` **refuses** a manifest where any public
  attribute or method has no description, so an undocumented property fails CI;
- export it from `src/index.ts` and side-effect import it in `src/elements.ts`.

**Write the doc comments for a consumer, and keep rationale in `//`.** Everything in a `/** */`
above a public member is published verbatim — into the manifest, into IDE hovers, and into the
React wrapper. #75 had to move four members' prose out after it shipped, including an
809-character review narrative that referenced a getter the wrapper no longer emits. A `//`
comment reaches none of those surfaces, so it is the right home for *why*; the doc comment is
for *what*.

### 4. Record the component in the three ratchets

**Four** files hold the component's surface. None is discoverable from the code:

| file | what to add | what refuses you |
|---|---|---|
| `expected-parts.json` | every `@csspart` **and bump `total`**, in the same PR as a test targeting it. The test must live in `fixtures/**/src/**/*.test.ts` or `tests/**/*.test.ts` — the ratchet scans nowhere else | `check-part-ratchet.mjs` — shrink-only, and it compares `total` |
| `expected-docs.json` | a row with the element's attribute and method counts, **and bump `total`** | `check-manifest-content.mjs` — **exact** equality, so adding a documented property without updating this fails too |
| `behaviours.json` | a **subject** entry on the ids the component owns, plus a matching `mutations.json` entry naming the same subject file — only if it owns behaviour (step 6) | `floor-reporter.mjs` arm 5 and `suite-selftest.mjs` guard 7 — **once declared** |
| `expected-inert-theme-wrappers.json` | nothing, if you write `class="sk-light"`. If you FIX one of the remaining inert `data-theme="light"` wrappers, lower `count` in the same commit | `check-story-theme-wrapper.mjs` — shrink-only, and it fails if you fix one without lowering the count |

**The first two always. `behaviours.json` only when the component owns behaviour, and `expected-inert-theme-wrappers.json` only when you retire one of the remaining inert wrappers.** Nothing detects that
a new component *should* have a behaviour entry — declaring one creates the obligation, and
omitting it is silently green. That is a real gap, not a shortcut: step 6 is where you decide,
and the decision is yours to get right.

And if the component brings a new **package** rather than a new element, that project needs a
`typecheck` target, a `scope:` tag and a `lint` target, or it sits outside `typecheck-all.mjs`
and ESLint's module boundaries entirely. #126 shipped a package with none of the three and #129
had to fix it.

The parts ratchet is shrink-only: parts may be removed, never added silently, and the test must
land in the same PR as the entry. The docs ratchet is **exact** in both directions, because
removing a documented property is an API change and should be a deliberate line rather than a
number that quietly drops.

### 5. Stories

`packages/elements/src/<name>/sk-<name>.stories.ts`, plus the styles-layer story if the
component has a static form. Required variant: **`LightMode`**, wrapped in
`class="sk-light"` — **not** `data-theme="light"`, which activates nothing on a wrapper
because the token block anchors on `:root[data-theme="light"], .sk-light` and `:root` only
matches `<html>` (#93).

Verify LightMode actually renders light styling. Do not assume it: assert the computed value
under both themes and require them to differ.

### 6. Behaviour tests, if it owns behaviour

If the component has form association, events, focus or keyboard handling, add ids to
`behaviours.json` and tests to `fixtures/elements-behaviour/`. Read that fixture's mutation
contract first — every anchor must be unique, single-occurrence and non-inert, with an entry
in `mutations.json`, or `scripts/suite-selftest.mjs` fails the build.

A purely presentational component owns none of them and adds nothing there.

The registry holds **fifteen** ids, fourteen of them applicable. The fifteenth (SC-023,
generation determinism) is declared `applicable: false` because ADR-11 states it as a CI-gate
obligation — `build-react-wrappers.mjs --check` discharges it — and it is in the file so the
registry mirrors the ADR's list rather than being silently short of it. You will not add a
subject for it.

### 7. Run the gates

Every command below was run against this repo when this list was written. A recipe naming a
script that has since been renamed is worse than one naming none, so if any of these fails to
resolve, fix the list rather than working around it.

```bash
# 1. regenerate every committed artifact, then let the drift checks compare
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze                 # rewrites custom-elements.json
node scripts/build-react-wrappers.mjs       # rewrites packages/react/src

# 2. build, then measure — measure-elements-sizes READS dist/ and does not build it
npx nx run-many --target=build --projects=tokens,styles,elements
node scripts/measure-elements-sizes.mjs        # WRITES packages/elements/SIZES.md — commit it

# 3. the drift checks
node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/measure-elements-sizes.mjs --check

# 4. the content and hygiene gates
node scripts/check-manifest-content.mjs
node scripts/check-no-css-in-source.mjs
node scripts/check-elements-entries.mjs
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-element-css-hygiene.mjs
node scripts/check-part-ratchet.mjs
node scripts/check-story-theme-wrapper.mjs            # no NEW inert `data-theme="light"` wrapper
node scripts/check-story-theme-wrapper.mjs --selftest # the gate's own probe table
node scripts/typecheck-all.mjs
npm run quality:all                           # ESLint, Stylelint, HTMLHint — all ENFORCED,
                                              # and named in no other step below

# 5. the gates' own probe tables, and the wiring that keeps them running
node scripts/build-react-wrappers.mjs --selftest
node scripts/check-manifest-content.mjs --selftest
node scripts/check-gate-wiring.mjs

# 6. COMMIT WHAT BLOCKS 1-2 REGENERATED, then confirm nothing is left over.
#    Blocks 1 and 3 are self-confirming: block 3 compares against what block 1 just wrote, so
#    they can never disagree locally. The real signal is an unstaged generated file — which CI
#    sees as drift. Generated-and-committed: the .css.js/.css.d.ts modules, the styles-layer
#    sk-<name>.html and index.ts, custom-elements.json, packages/react/src/**, and SIZES.md.
git add -A && git status --porcelain   # must be empty before you open the PR

# 7. the suites
npm run test
node scripts/suite-selftest.mjs             # slow; one full suite per mutation
npx nx run storybook:storybook:build && node scripts/run-axe-storybook.js
```

**On `measure-elements-sizes.mjs`:** it reads `packages/elements/dist/` and does **not** build
it. Running it without building first records the bytes of whatever `dist/` is on disk, and the
symptom is CI reporting different numbers for the same commit — which looks like
non-reproducibility and is not. Build first.

### 8. Visual baseline

Baselines are **CI-authoritative** — local font metrics differ. Take them from the
`visual-regression-diffs` artifact rather than from a local run.

## Rules

- No hardcoded values — only `--sk-*` tokens (stylelint enforces it).
- No theme selectors in component CSS. Tokens, always.
- No markup authored twice. Generated artifacts are exempt and must be regenerable.
- a11y addon enabled (`a11y: { disable: false }`).
- Never embed mascot illustrations in component files.

## Adding a token

New tokens go in **both** blocks of `packages/tokens/src/tokens.css` (the `:root` default and
the `:root[data-theme="light"], .sk-light` override) and require
`npx nx run tokens:catalogue` — the catalogue is a published artifact, and
`scripts/check-token-breaking-changes.sh` is blind to anything missing from it.
