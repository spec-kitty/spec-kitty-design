# Consumability proof — REL4 WP03

**Date**: 2026-09-19 · **Instance**: local OpenDesign 0.21.1 (podman `open-design`, agent `claude`) ·
**Package**: this branch's `opendesign/spec-kitty-train/`, installed as a copy under the id
`spec-kitty-train-rel4` in the instance's user design-systems directory, so the live
`spec-kitty-train` symlink was never touched.

The API token was read from the instance's `.env` into a shell variable at call time. It was never
echoed, logged, written to a file or committed. The three outputs were scanned for it before being
committed here.

## The prompt

The same prompt was sent in all three runs:

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

The outputs are in `proof-outputs/`. Run 3 rendered in Chromium is `consumability-proof-linked.png`.

**Run 3 meets the amended acceptance line.** It uses `radio-choice-group`, `form-field`, `button` and
`card` with the library's own element and modifier classes. Its radio group is the library's static
form (`sk-radio-choice-group__choice`, `__control`, `__label`, `__secondary-value`), and it spliced
`tokens.css` and the Inter and Falling Sky font files in from the package.

## How it was measured

`consumability-analyse.mjs <output.html> <package-dir>` does the measuring:

- **Classes.** Every `sk-*` or `is-*` class in the output is looked up in the union of the
  per-component class vocabularies, derived by the generator's own `classVocabulary()` from
  `components/<name>.html`. A class missing from the vocabulary counts as invented.
- **CSS.** A component's rules count only if every class in the rule's selector is used by the
  output. Rules for `:host`, `::slotted` and the light theme were left out, since the dark page cannot
  exercise them. Each counted rule was then searched for, whitespace-normalised, in the output's
  `<style>` blocks. Run 3 copied exactly those rules and dropped the rest: button 8 of 24,
  form-field 7 of 14, card 2 of 19. That is a correct trim, not a loss. For runs 1 and 2 the
  applicable counts are small because a rule selecting an invented class's library counterpart is
  not applicable to an output that never uses it; the invented-class count is the measure there.
  Every figure in this document is the analyser's own output, reproducible with the command above.

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
   `components.manifest.json` is injected (`apps/daemon/src/prompts/system.ts:1295`): nine generic
   groups, eight selectors each. `components.html` is used only when there is no manifest
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
  which is the only manifest key that puts a file on OpenDesign's pull index and its
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
  `rel4-proof-linked-1789835470`, plus run `b614ebbe`, which was cancelled after it started against a project that was never created.

All of them are instance state and nothing here refers to them. The WP03 report offers their removal.
