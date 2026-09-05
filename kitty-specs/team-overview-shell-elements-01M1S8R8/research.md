# Research: Team overview shell elements

**Mission:** `team-overview-shell-elements-01M1S8R8`
**Issues:** [#145](https://github.com/spec-kitty/spec-kitty-design/issues/145), child of
[#144](https://github.com/spec-kitty/spec-kitty-design/issues/144)
**Inspected train:** `dcf7af26ff8f14d0d8b5a8e45c7eb9d64201e053`
**Research date:** 2026-09-05

## Question and conclusion

The question is how to express the approved Team overview frame as reusable design-system
elements without moving Team Kitty's route, team, identity, timer, navigation or action ownership
into the library.

The repository already has every mechanism needed. Implement four slot-only elements with native
landmark structure, token-only CSS, explicit parts and generated constructed sheets. Extend the
landed `sk-button` through its existing size seam with `icon`, a forwarded `label`, and shadow-root
focus delegation. Add no package, wrapper logic, event vocabulary, store, icon set or static shell
markup catalogue.

## Authority

1. #144 fixes the library/application ownership boundary and prohibits a public Team overview page
   element.
2. #145 fixes the four component names, shell geometry, rail grouping, header slots and narrow
   button extension.
3. The operator-supplied **Team overview — final review v4 approved** image fixes visual geometry
   and account placement at the 1440px product target.
4. ADRs 9–11 and the #76 authoring recipe fix the shadow, generation, accessibility, behavior and
   gate mechanisms.
5. Current train source is authority for #79's button API and shared generated seams.

## Evidence and decisions

### R-01 — #79 is landed and provides the only button seam

Train contains #79 as `70742b8436ca89e09cb6e0416c0830f4bded3289`. The extension belongs in:

- `BUTTON_SIZES`, validation and class composition in `sk-button.markup.ts`;
- the public Lit `size` union in `sk-button.ts`;
- one token-only modifier in `sk-button.css`;
- existing element/static stories and the existing button behavior fixture;
- generated manifest, React and Vue outputs.

`BUTTON_AXES` is explicitly declared rather than derived from sizes. #79 records why: a size-only
generated static form can have no painting tone. An icon additionally needs consumer glyph content,
so adding an automatic `Icon` static export would be less honest, not more complete.

### R-02 — #153 is the exact accessibility antecedent

Current `sk-button` renders its real control inside a shadow root. `aria-label` on the generic host
does not name that control, and `host.focus()` cannot reach it because the root does not delegate
focus. Issue #153 records exactly these two failures and recommends a `label` property forwarded to
the real node plus `delegatesFocus: true`.

The new fixture must use a computed accessible-name matcher on both BUTTON and A branches. Merely
asserting that an attribute exists is insufficient: `sk-nav-pill` previously kept an attribute
assertion green after the owning semantic landmark disappeared. #154's wrapper-wide `tabIndex`
policy is distinct and remains out of scope.

### R-03 — slot-only shells have no useful static form

`sk-transition-matrix` establishes the accepted no-static-form path: CSS exists under styles, the
element authors its Lit template, and no `.markup.ts`, `.html` or styles barrel is invented where
there is no honest data-independent static shape. The four shells are useful only when consumers
supply semantic navigation, title, metadata and main content into multiple slots. A generated empty
frame is not a component example and would expand shared authoring without serving a consumer.

Their CSS still needs four `packages/styles/package.json` subpath exports. Their element modules
must appear in both `packages/elements/src/index.ts` and `elements.ts`; the entry gate proves both
runtime paths.

### R-04 — the shell requires two semantic width tokens

The existing spacing scale contains 40px (`--sk-space-8`) for the icon hit target, but not the
approved 56px and 240px shell columns. Obscuring those values in token arithmetic would make the
public geometry harder to review. Add two semantic layout tokens, with identical values in both
theme blocks, and regenerate the token catalogue. All other component values reuse the existing
surface/foreground/border/spacing/type/focus tokens.

### R-05 — responsive layout must not imply open state

#144 says active/selected/open values are controlled. #145 says CSS owns responsive reflow while
the consumer owns whether navigation is open. Therefore the default narrow mode keeps all supplied
regions in one-column document order. It neither hides a sidebar nor creates a hamburger/drawer.
Team Kitty can apply `hidden` or its own controlled wrapper to a slotted host without the shell
maintaining a competing value.

### R-06 — region semantics live at the narrowest honest boundary

`personal-rail` is always application navigation, so its internal root is a labelled `<nav>`.
`context-sidebar` may contain navigation or generic selected-context content, so its root is a
labelled `<aside>` and the consumer retains any inner `<nav>`. `page-header` owns a `<header>` but
not a heading level; the consumer supplies the actual heading in the title slot. `app-shell` owns
the main landmark and layout boxes.

This avoids false or duplicate landmarks while still giving screen-reader users named regions.

### R-07 — presentational behavior maps only to SC-013 and SC-014

Existing presentational elements register the styling API and constructed-sheet behaviors. For
each new shell:

- SC-013 gets one mutation removing a unique declared part;
- SC-014 gets an empty-style-array mutation and a fresh-sheet identity mutation.

That is 12 arms. Slot assignment, empty slots, native event pass-through, verbatim sync copy,
truncation, responsive bounds and icon accessibility are real regression tests but do not acquire
invented ADR ids. SC-011 includes fallback content; these shells deliberately have none. Button's
new accessible-name/focus/geometry probes likewise do not fit its existing SC-013/SC-014 subjects,
so their red-first evidence is demonstrated directly rather than mislabelled in `mutations.json`.

### R-08 — generated artifacts force serial integration

New component directories are authored independently, but these files collide with parallel #146:

- element entries and styles package exports;
- expected docs/parts/stories;
- behaviors and mutations;
- `custom-elements.json`, React wrappers, Vue declarations and `SIZES.md`;
- the visual Playwright registry.

One final integration WP owns those paths. After all WPs approve, the clean planning target is
refreshed onto newest train while execution lanes stay frozen; canonical `spec-kitty merge` then
consolidates them. Stable generators rerun after consolidation with no further rebase. If train
moves again, the mission stops for rebaseline. Rewriting a claimed execution lane is unsafe because
Spec Kitty 3.2.6rc4 freezes the planning commit SHA.

### R-09 — exact gate ordering matters

#79 records that Nx-cached manifest analysis can make drift evidence false; analyze must use
`--skip-nx-cache`. The size script reads existing dist output and does not build it; all publishable
packages must build before `SIZES.md`. React and Vue generation consume the fresh normalized
manifest. The token catalogue embeds an ISO generation timestamp, so it is generated/committed
once per changed token-source state and checked structurally rather than used as byte-determinism
evidence. CI-generated visual actuals are the only baseline bytes accepted because local font
metrics differ.

## Remaining decisions

No product or architecture decision remains open. A future implementation may tune internal CSS
within the fixed public outcomes, but must stop if it needs a new component, application state,
event, dependency, wrapper mechanism, or a token beyond the two approved layout widths.
