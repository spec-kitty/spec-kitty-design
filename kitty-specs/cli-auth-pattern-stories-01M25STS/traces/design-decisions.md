# Tracer: design-decisions

One entry per finding: `YYYY-MM-DD · actor · <text>`.

---

2026-09-11 · post-merge-mission-review · sk-button cannot submit a form: a <button> inside sk-button's shadow root does not submit an enclosing form, and its type="button" is hard-coded (packages/elements/src/button/sk-button.ts). The mission's first revision (commit 8d0f2092) composed <sk-button> for all three form actions and would have shipped a canonical pattern whose Approve/Deny/Continue do nothing when copied into Family 5's server-rendered flows. Fixed one commit later (61b38db9, 'fix(storybook): submit CLI Auth's form actions as native buttons, not sk-button') by switching every form action to native <button type="submit" class="sk-button sk-button--*">, composing the public styles-layer class directly. Lesson: any pattern-story mission composing sk-button inside a native <form> must verify submit behavior, not just visual/token composition -- the element/static duality is easy to get backwards.
