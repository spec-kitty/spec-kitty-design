# WP01/T001: the traversal was duplicated — and then wasn't

**Status:** superseded by the pre-merge gate on PR #106. Kept because the reasoning it
originally contained was **wrong**, and the record should say so rather than quietly
disappear.

## What this document used to argue

That T001's instruction — *"hoist the traversal into one stringified source injected at
both call sites … pass it as data, not code"* — was self-defeating, because a selector
crosses a `page.evaluate` boundary as data while a traversal is a function, and *"the
only way to send one across is as a source string that the far side must `eval`"*.

**That claim is false, and two independent squad lenses said so.** Playwright serializes
a **function reference** exactly as it serializes an inline arrow. There was never any
need for `eval` or for a stringified source. There is also `page.addInitScript`, which
installs helpers as a page global — a third option the doc's "only way" foreclosed.

The conclusion (keep two copies) happened to be defensible; the argument for it was not.
A doctrine resting on a false premise gets overturned by the first person who notices,
along with whatever correct conclusion it was protecting.

## What the gate then measured, which settled it

The evidence lens drove the shipped code by mutation and found the pairing had **already
failed a second time, in this very PR**: the wait predicate was SATISFYING two shapes the
assertion rejects (`nested-host-empty`, `shadow-empty-block-beside-text`). The wait only
ever checked the render root; the assertion also checks per component host.

Worse, that direction has no signal at all. `waitTimeouts` fires only when the wait is
*stricter* than the assertion. Loosen the wait — `return !!root` — and:

- the self-test stays green, because it never ran that code;
- no timeout is ever recorded;
- every verdict stays correct;
- and #69's "3 of 57, different each run" flake is back.

One line, no detector, no symptom. The "two copies plus detectors" design this document
was defending covered three divergence directions and omitted the only one that matters.

## What actually shipped

One function. `computeRenderVerdict` is passed **by reference** to both `page.evaluate`
(which wants the verdict object) and `waitForFunction` (which wants a boolean, and would
read `{ok:false}` as satisfied — hence the `booleanOnly` argument). No `eval`, no page
global, no stringified source, and nothing left to keep in sync. Equivalence is by
construction, which is what T001 was reaching for even though its prescribed mechanism
was the one #102 got wrong.

The one rule that makes this safe, and the only thing a future editor must respect:
**`computeRenderVerdict` must stay self-contained.** It may close over nothing from its
module; everything arrives through its argument array. A reference to any module-scope
identifier throws a `ReferenceError` inside the browser context, and `waitForFunction`
would swallow it into the wait's catch — which is #102's failure signature reached by a
different road.

## What still is not covered

- `scripts/gate-selftest.mjs` drives both call shapes over every fixture. Since there is
  now one implementation they cannot disagree on logic — but the boolean/object plumbing
  between them can still break, and that loop is what would catch it.
- The self-test now refuses a degenerate shape set (it requires both an expected-render
  and an expected-reject shape), so it can no longer report green over nothing.
- Three single-line mutations that previously survived all 19 shapes now each die to
  exactly one new shape. The mutation space beyond the traversal and host selection —
  the individual `CONTENT_MEDIA_SELECTOR` arms, `BLOCK_CLASS`, `VOID_OR_LEAF` — remains
  unmeasured. A `--changed-scope` mutation run is cheap now that the harness exists.
