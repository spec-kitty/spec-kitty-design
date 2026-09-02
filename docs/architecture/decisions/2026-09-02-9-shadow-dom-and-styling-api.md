# ADR 9 (2026-09-02): Shadow DOM, the Styling API, and Label Ownership

**Date:** 2026-09-02
**Status:** Proposed
**Deciders:** MOES-Media (operator session, 2026-09-02)
**Technical Story:** ADR-8 negative consequence — "shadow DOM ends class-based overriding … a styling API must be designed deliberately"; SP-3 and SP-5, both run before this record was written

---

## Context and Problem Statement

ADR-8 puts component internals inside shadow roots. Two things then need deciding, and both fail silently if left to discovery during implementation:

1. **What consumers may style, and how.** The current public surface is BEM classes — `sk-card__title` — that consumers target directly. A shadow root ends that.
2. **Who owns a form control's label.** ADR-8 framed this as "shadow DOM versus light DOM for the form components". SP-5 shows that framing is wrong: the fault line is label *ownership*, and one shadow arrangement passes while another fails.

## Decision Drivers

* The charter's accessibility gate is absolute — axe-core, zero WCAG 2.1 AA violations — and its second-highest recorded risk is an accessibility regression reaching a public surface.
* SK-D01 requires every value to come from a `--sk-*` token; custom properties are the one thing that crosses a shadow boundary unimpeded.
* Consumers must be able to adapt components without forking them.
* Whatever is decided has to be checkable by the manifest and the conformance suite, not by review alone.

## Decision Outcome

### 1. Shadow DOM for every component

Open shadow roots. The `sk-*` BEM class names become **internal implementation detail** and are no longer public API.

### 2. The styling API is exactly three things

* **Tokens, primarily.** `--sk-*` custom properties inherit through the boundary. Proven in SP-3: a card inside a shadow root resolved `--sk-surface-card`, `--sk-radius-lg` and `--sk-space-7` from the host document with no plumbing.
* **`::part()`, declared.** Every part is named in the component's docs and appears in `custom-elements.json`. Adding a part is an API addition; removing or renaming one is a breaking change.
* **Per-component custom properties**, documented, for knobs that are not global tokens.

Anything not on that list is internal. `stylelint`'s `selector-class-pattern` still applies to classes inside a shadow root, so internal classes keep the `sk-` prefix even though they are no longer public — a rule this ADR keeps deliberately rather than relaxes, to avoid two naming conventions in one file.

### 3. No selector may cross the shadow boundary

**This is the rule that would otherwise be rediscovered nine times.** Component CSS may not rely on an ancestor outside its own root.

Demonstrated in SP-3 against the real `packages/html-js/src/card/sk-card.css`: it expresses light mode as `:root[data-theme="light"] .sk-card--blue`. Rendered inside a shadow root and with `data-theme="light"` set on `<html>`, the border colour **did not change** — the descendant selector cannot match across the boundary. No error, no warning, just the dark value in light mode. Because the charter requires a `LightMode` story per component, this failure mode produces a LightMode story rendering dark-mode styling, visible only if a visual baseline happens to cover it.

`:host-context()` is **not** the escape hatch: Baseline *limited*, Chromium-only, absent from Firefox and Safari.

**Theme variance therefore moves into tokens.** This is not a workaround — it is what SK-D01 already requires. The offending selectors exist only because the file hardcodes `rgba()` channel values, which its own comment documents as a deviation from the token rule. Repairing the deviation removes the need for the selector.

Blast radius, measured: **1 of 14** component CSS files uses a cross-boundary theme selector (`sk-card.css`). Twelve hardcoded `rgba()` occurrences across the package need auditing on the same pass.

### 4. Label ownership: the element owns both label and control, and is form-associated

SP-5 built four arrangements as real elements and ran axe over them:

| Arrangement | axe | Submits a value |
|---|---|---|
| **A** — light DOM, element renders label + control into itself | pass | yes |
| **B** — shadow root owns both label and control; label text is a property | **pass** | **no**, unless form-associated |
| **C** — consumer supplies `<label>` in light DOM, control in shadow | **fail** — `label @ sk-input-slotted,#c-ctl` | — |
| **D** — form-associated host labelled by a light-DOM `<label for="host-id">` | **fail** — `label @ #d-host,#d-ctl` | yes |

Two findings, neither of which was safe to assume:

* **C and D both fail the accessibility gate.** axe resolves `aria-labelledby` from the *attribute* and scopes ID lookups to `getRootNode()`, so no cross-root reference resolves. D answers the specific question SP-5 was raised for: labelling the *host* does not label the inner control — axe flags `#d-ctl` inside the shadow root as unnamed.
* **B passes axe but submits nothing.** An `<input>` inside a shadow root does not participate in an outer form. In the probe the form produced keys `["a", "d"]` — A's native input and D's `setFormValue` — while B contributed nothing at all.

**Therefore: arrangement B, plus `static formAssociated = true` and `ElementInternals`.** It is the only combination that both passes the gate and submits. The label becomes a component API (`label="Email address"`) rather than consumer markup — which suits the Django, Jekyll and Hugo consumers, who are composing from attributes anyway.

Reference Target, the standards fix that would make C viable, is Baseline *limited* and Chromium-only as of 2026-08-25. It is a future simplification to revisit, not a mechanism to plan against.

### Consequences

#### Positive

* The token layer becomes the primary styling API rather than one of two, which is what SK-D01 always wanted.
* The cross-boundary rule is mechanically checkable — a lint rule can reject `:root`, `html`, `body` and `:host-context()` in component CSS.
* Label-as-property removes an entire class of consumer error: there is no `for`/`id` pair to get wrong.

#### Negative

* `sk-card.css` needs its light-mode selectors converted to tokens before it can be an element, which means new token pairs in `@spec-kitty/tokens` — a tokens-package change that must precede or accompany that component's batch.
* Consumers lose arbitrary class-based overrides and gain only what `::part()` and the documented custom properties expose. Under-exposing parts is now a support burden; over-exposing them freezes internals.
* Label text as a property is harder to translate for consumers whose i18n pipeline works on markup rather than attributes.

#### Neutral

* `LightMode` stories keep working: `data-theme` reaches the component through inherited custom properties, which is the mechanism SP-3 proved — provided rule 3 is followed.

### Confirmation

1. A lint rule rejects `:root`, `html`, `body` and `:host-context()` in `packages/elements` CSS, with a red-first test.
2. Every `::part()` in `custom-elements.json` is present and targetable from outside, verified by the conformance suite (ADR-11, item 6).
3. A form-associated element built to arrangement B submits its value in a native form **and** reports zero axe violations — both asserted, since SP-5 shows either can hold without the other.
4. `sk-card` renders correct light-mode styling with no selector referencing an ancestor outside its own root.

## More Information

* Evidence: SP-3 (`adoptedStyleSheets: 1`, `styleElements: 0`, tokens resolved through the boundary, theme selector proven inert) and SP-5 (four arrangements, three engines requested, axe run per arrangement).
* Related: ADR-8 (base layer), ADR-10 (distribution), ADR-11 (conformance items 6 and 7 verify this ADR's declarations), SK-D01 (token authority).
* MDN, *Reflected attributes § Reflected element references*: a target element must be in the same DOM as the referencing element, or a parent DOM; elements in child or peer shadow DOMs are out of scope.
