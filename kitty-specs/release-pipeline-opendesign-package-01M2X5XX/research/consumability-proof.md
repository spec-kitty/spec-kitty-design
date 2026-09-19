# Consumability proof — REL4 WP03

**Date**: 2026-09-19 · **Instance**: local OpenDesign 0.21.1 (podman `open-design`, agent `claude`) ·
**Package**: this branch's `opendesign/spec-kitty-train/`, installed as a copy under the id
`spec-kitty-train-rel4` in the instance's user design-systems directory, so the live
`spec-kitty-train` symlink was never touched.

The API token was read from the instance's `.env` into a shell variable at call time. It was never
echoed, logged, written to a file or committed. The four outputs were scanned for it before being
committed here.

## The prompt

The same prompt was sent in all four runs:

> Design a compact settings panel for a developer tool. The user picks exactly one workspace to
> connect from four options (Acme, Acme / Platform, Northwind, Orbital), enters a display name in a
> labelled text field with a short hint, and saves with a primary button. Produce a single static
> HTML page.

It names no component, but it asks for three things the library has: a radio choice group, a form
field, and a primary button.

## Results

| Run | Package | Project | Library-namespace classes | Invented | CSS for the classes used |
|---|---|---|---|---|---|
| 1 `ece117c9` | before the fix | design system only | 13 | **8** | hand-written: applicable rules verbatim — radio group 0/1, form-field 1/5, button 1/6 |
| 2 `2a35a44a` | after the fix | design system only (push) | 22 | **14** | hand-written: applicable rules verbatim — radio group 0/3, form-field 1/6, button 1/5 |
| 3 `c1cf3581` | after the fix | design-system folder **linked** | 15 | **0** | **verbatim**: applicable rules radio group 20/20, form-field 7/7, button 8/8, card 2/2 |
| 4 `0c5321c7` | **final** package (after gate pass 1), manifest honoured | folder **linked** | 14 | **0** | **verbatim**: applicable rules radio group 20/20, form-field 7/7, button 6/6, card 2/2 |

The outputs are in `proof-outputs/`. Runs 3 and 4 rendered in Chromium are
`consumability-proof-linked.png` and `consumability-proof-final.png`.

**Run 4 is the one that proves the package as reviewed.** It ran against the package at `3d015d97`
(after the first review pass): the published `tokens.css`, the rewritten prose, the showcase-first
preview pages. Later review passes changed only action-row's CSS (its page, its section of
`components.html`, and so the derived `components.manifest.json` by one selector) and prose in
`DESIGN.md`/`USAGE.md` (theme selection, a sticky-header sentence, action-row's link and flush forms,
the static-sheet line of the generated region). None of it touches the four components this prompt
exercises. Its copy's `id` matched its folder, so OpenDesign honoured the manifest (see below). The
agent read the same four component pages and copied from them. One difference from run 3: it
declared no `@font-face` and pinned `data-theme="dark"`, letting the `--sk-font-*` stacks fall back
to system fonts. `DESIGN.md`'s prototype rules allow that when fonts cannot travel with a single
file; run 3 had copied the font files into its project instead. Fonts are outside the acceptance
line, and the screenshot shows the fallback.

**Runs 3 and 4 meet the amended acceptance line.** Both use `radio-choice-group`, `form-field`,
`button` and `card` with the library's own element and modifier classes, and both radio groups are
the library's static form (`sk-radio-choice-group__choice`, `__control`, `__label`,
`__secondary-value`). They differ on tokens and fonts, which the line does not measure: run 3
spliced `tokens.css` and the Inter and Falling Sky font files in from the package; run 4 carried
the whole dark `:root` palette and half of each light block — not the whole file, and not the
no-`data-theme` fallback — pinned the dark theme and declared no fonts, so it did not
exercise the published stylesheet's no-`data-theme` fallback.

## How it was measured

`consumability-analyse.mjs <output.html> <package-dir>` does the measuring:

- **Classes.** Every `sk-*` or `is-*` class in the output is looked up in the union of the
  per-component class vocabularies, derived by the generator's own `classVocabulary()` from
  `components/<name>.html`. A class missing from the vocabulary counts as invented.
- **CSS.** A component's rules count only if every class in the rule's selector is used by the
  output. Rules for `:host`, `::slotted` and the light theme were left out, since the dark page cannot
  exercise them. Each counted rule was then searched for, whitespace-normalised, in the output's
  `<style>` blocks. Run 3 copied every applicable rule and most of the rest it did not need: of
  form-field's 14 rules, 9 are in its output verbatim — the 7 applicable ones and two for classes it
  never uses. A missing inapplicable rule is a correct trim, not a loss. For runs 1 and 2 the
  applicable counts are small because a rule selecting an invented class's library counterpart is
  not applicable to an output that never uses it; the invented-class count is the measure there.
  Every class and CSS-rule figure in this document is the analyser's own output, reproducible with
  the command above. The token description of run 4 below is a structural reading, not a count.

It was checked against controls before any conclusion was drawn from it:

- **Negative control.** Run 1, analysed by hand beforehand, reports 8 invented classes.
- **Positive control.** The package's own `components/radio-choice-group.html` reports 0 invented
  and 20/20 rules verbatim.

## What run 1 found, and why

Run 1 met the acceptance line as first written, "emits at least one library component". It used
`sk-radio-choice-group`, `sk-form-field`, `sk-input` and `sk-button`. It also invented
`sk-radio-choice__input`, `sk-field-label` and 6 other classes, and wrote its own CSS for all of them,
so it was not usable as a design library. The run's own transcript, read against OpenDesign's source
at `c5ae6292c4`, gave the cause:

1. **The prompt never contains the components.** `DESIGN.md`, `USAGE.md` and `tokens.css` are
   injected verbatim. For components, only `summarizeComponentsManifestForPrompt()` of
   `components.manifest.json` is injected (`apps/daemon/src/prompts/system.ts:1295`): the generic
   groups it detects, at most eight selectors each. For this package that is seven groups, two of
   them empty, so about forty selectors for 34 components. `components.html` is used only when there is no manifest
   (`:1299`), and at 430 KB it would not fit.
2. **The agent cannot open the design-system folder.** Its sandbox allowed the project directory,
   `/app/skills` and the built-in `/app/design-systems`. The user design-systems directory is not
   among them, and its `grep` there was refused.

What it had was `DESIGN.md`'s list of component names, so it produced the right blocks with
guessed internals.

## The fix, and what run 2 showed about it

The generator now emits:

- **`components/<name>.html`**, one per component (34), each holding that component's CSS and every
  static form it has, at 1–31 KB apiece. They are declared as `preview.pages` in `manifest.json`,
  the manifest key that lists each page by name on OpenDesign's pull index and its
  `tools design-systems read` allowlist.
- **A closed class vocabulary per component** in `DESIGN.md`'s generated region, which is pushed into
  every prompt.

**Run 2 proves the vocabulary alone is not enough.** The agent saw it: its first command listed a
`components/` directory, and it searched for `radio-choice-group.html`, both of which only the new
`DESIGN.md` and `USAGE.md` mention. It still could not open either, and it invented 14 classes,
including a whole `sk-settings-panel` block. Run 2 is why `docs/opendesign-package.md` says the
package does not work as a design library without file access, rather than claiming the vocabulary
rescues it.

**Run 3 is the same prompt with the folder linked** (`metadata.linkedDirs`, which OpenDesign passes to
the agent as a read-only `--add-dir`). The agent read the four component pages it needed and copied
from them.

## A limit of runs 1 to 3, found at review

OpenDesign ignores a package's `manifest.json` unless its `id` equals the directory name
(`index.ts:4104`). The copy was installed as `spec-kitty-train-rel4` with the package's own
`id: spec-kitty-train`, so for runs 1, 2 and 3 **the manifest was discarded**. There was no pull
index and no preview-page wiring from it. `USAGE.md` and `components.manifest.json` were still read,
under their default names.

Run 3's result does not depend on the manifest: the linked folder is read-only file access, and the
agent opened the pages directly. That the preview pages reach the pull index was then shown from
source (the architect lens ran OpenDesign's own `buildDesignSystemPullIndex` over the manifest: 35
entries under the matching name, none under the other), not by a run. Run 4 closes that gap: its
copy has the `id` rewritten to `spec-kitty-train-rel4` (the only difference from the package), and
the instance's API then reports the manifest with all 35 preview pages — recorded, trimmed and
without the token, in `run4-od-design-system-api.json`. The same refresh also showed `metadata.json`'s
dual ownership live: before it, OpenDesign had written `"projectId": "ds-spec-kitty-train-rel4"`
into the copy's `metadata.json`.

Run 4 also departed from `DESIGN.md` in one way worth recording: the prototype rules say to paste
`tokens.css` unchanged, and it carried a subset (the dark palette, half of each light block, no fallback)
while pinning `data-theme="dark"`. That is the agent's judgment for a single-theme artifact, not a
package defect, and the acceptance line does not measure tokens.

The docs now state that the folder or symlink must be named `spec-kitty-train`.

## Consequences for the instance

- **Link the folder.** Use the package from a project with `/app/.od/design-systems/spec-kitty-train`
  as a linked folder. The docs say so.
- **The pull tool is refused here.** The local instance runs Claude Code with
  `--permission-mode acceptEdits`, which denies `"$OD_NODE_BIN" "$OD_BIN" …` without prompting, so
  `tools design-systems read` cannot work on it. Runs 1 and 3 both hit this when they tried to
  render a preview image with the same binary; run 2 never tried it. Loosening that wrapper is the operator's call and is not
  part of this mission.

## Proof artifacts left on the instance

- **The package copy.** `design-systems/spec-kitty-train-rel4`.
- **The projects.** `rel4-proof-1789834936`, `rel4-proof-push-1789835470`,
  `rel4-proof-linked-1789835470`, `rel4-proof-final-1789837159`, plus run `b614ebbe`, which was cancelled after it started against a project that was never created.

All of them are instance state and nothing here refers to them. The WP03 report offers their removal.
