# WP01 deviation: the flat-tree traversal is duplicated, not hoisted

**Status:** implemented as described here; needs adjudication at the pre-merge gate.
**Affects:** T001, `scripts/run-axe-storybook.js`.

## What T001 asks for

> Hoist the traversal into one stringified source injected at both call sites — and
> note the lesson from #102, where an `eval`-based hoist made `waitForFunction` throw
> into that same swallowing catch and silently disabled the wait. **Pass it as data,
> not code.**

## Why it was not done

The two halves of the instruction cannot both be satisfied. The render wait and the
render assertion run in two separate browser contexts, reached through two separate
`page.evaluate`/`waitForFunction` serialization boundaries. A *selector* survives that
crossing as data — which is why `CONTENT_MEDIA_SELECTOR` is genuinely hoisted, and
still is. A *traversal* is a function. The only way to send one across is as a source
string that the far side must `eval`, and "pass it as data, not code" has no third
meaning here.

That is not a theoretical objection: it is precisely what #102 did. `eval` throws
inside `waitForFunction`, the throw was swallowed by the existing `.catch`, and the
wait silently became a no-op — measured as a stable 0/0 render-failure count before
and 0-then-4, different stories each run, after. T001 cites this failure and then
prescribes its mechanism.

## What was done instead

The traversal is written out at both sites, and the drift T001 is worried about is
guarded **mechanically** rather than by construction:

1. `scripts/gate-selftest.mjs` imports the gate's own exported `assertStoryRendered`
   and drives it against 19 fixture shapes in a real browser. Six must be rejected.
   Weaken the assertion's traversal and this goes red.
2. A wait that times out is now **fatal** (`process.exit(1)`), not printed. This is
   the direction T001 could not otherwise cover: if the *wait's* copy of the
   traversal is weakened while the assertion's is not, every verdict stays correct
   and the sole symptom is `+RENDER_TIMEOUT_MS` per story. It now fails the build and
   names the stories.

So both copies have a failing detector, which single-sourcing alone would not have
given (a single shared traversal that is wrong is wrong in both places, silently).

## What this does not cover

Nothing asserts the two copies are *textually* identical; they are equivalent by
review plus the two detectors above. If a future change adds a content rule to one
copy only, detector 2 catches it exactly when the wait becomes the stricter of the
two, and detector 1 catches it when the assertion is the one weakened. A rule added
to the *wait* only, making it stricter, is caught as a timeout. A rule added to the
*assertion* only, making it stricter, is the one shape neither detector sees — it
surfaces as a story failing the gate, which is loud but attributed to the story.
