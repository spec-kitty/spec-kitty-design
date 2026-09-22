# Codex tasks-correction ruling — WP01, issue #270

## Authority

Issued by: **Codex**, the programme owner / final authority for this repo.
Trigger: post-tasks audit of mission `work-explorer-segmented-choice-styles-01M20C9F`
(runtime at "implement preview" for WP01). Codex **rejected runtime readiness** and issued two
binding corrections that block advancing past `tasks` until applied. This document records the
correction pass that applied them, verbatim, with a full before/after trail.

## Correction 1 (verbatim)

> WP01 frontmatter `agent_profile` is blank. In
> `kitty-specs/work-explorer-segmented-choice-styles-01M20C9F/tasks/WP01-segmented-choice-styles.md`,
> the YAML frontmatter has `agent_profile: ''` (currently blank) alongside `role: implementer`.
> Codex's ruling: the resolved implementer profile for this WP is `frontend-freddy` (a registered
> profile — confirmed present as the `AGENT_PROFILE:frontend-freddy` catalogue entry in
> `.kittify/charter/charter.yaml`, whose capabilities match this WP's styles-only CSS/accessibility
> work per the installed spec-kitty-cli package's built-in pack definition; the catalogue entry's
> `local_path` of `_LIBRARY/agent_profile-frontend-freddy.md` is a declared, not yet materialized,
> path — no `_LIBRARY/*.md` docs are materialized anywhere in this repo, which is normal). Change
> the frontmatter line to: `agent_profile: frontend-freddy`. Do not invent or substitute any other
> profile name. Leave `role: implementer` and every other frontmatter field untouched.

## Correction 2 (verbatim)

> Remove `stylelint.config.mjs` from this WP's editable/owned surface entirely. Codex's ruling: this
> WP must not be permitted to edit `stylelint.config.mjs` at all. The live `stylelint.config.mjs`
> already allowlists exactly the 7 system-color keywords this WP's forced-colors work needs (Canvas,
> CanvasText, Highlight, HighlightText, ButtonText, LinkText, GrayText). T011 must use ONLY those
> already-approved keywords. If a genuinely different keyword turns out to be necessary during
> implementation, the correct behavior is to STOP and escalate to Codex — never to widen
> `stylelint.config.mjs` unilaterally. This mission adds no new token or stylelint-config value.

## Files touched — before → after

### `kitty-specs/work-explorer-segmented-choice-styles-01M20C9F/tasks/WP01-segmented-choice-styles.md`

1. **Frontmatter, `agent_profile` field** (Correction 1)
   - Before: `agent_profile: ''`
   - After: `agent_profile: frontend-freddy`
   - `role: implementer` and all other frontmatter fields left untouched.

2. **Frontmatter, `owned_files:` list** (Correction 2a)
   - Before: list ended with `- expected-stories.json` then `- stylelint.config.mjs`.
   - After: `- stylelint.config.mjs` line removed; list now ends with `- expected-stories.json`.
     Every other entry in the list is unchanged.

3. **`## T011` body, stylelint-editing instruction** (Correction 2b)
   - Before: "If any of the keywords used are not already in `stylelint.config.mjs`'s
     `ignoreValues` array (confirm by diffing against the current list —
     `Canvas`/`CanvasText`/`Highlight`/`HighlightText`/`ButtonText`/`LinkText`/`GrayText` are already
     present, so this is expected to be a no-op), add only the specific new keyword(s) and re-run
     `npx nx run tokens:catalogue`."
   - After: "T011 must use ONLY the seven already-approved system-color keywords (`Canvas`,
     `CanvasText`, `Highlight`, `HighlightText`, `ButtonText`, `LinkText`, `GrayText`) already
     present in `stylelint.config.mjs`'s `ignoreValues` array; this WP does not own
     `stylelint.config.mjs` and must not edit it under any circumstance (Codex correction — see
     `reviews/tasks.ruling.md`), and this explicitly supersedes plan.md's stylelint-editing
     suggestion on this specific point, notwithstanding the Goal section's general 'where this file
     and plan.md disagree, plan.md is authoritative' deference clause — Codex's binding correction
     controls here. If a keyword genuinely not on this list becomes necessary, implementation STOPS
     and escalates to Codex rather than widening stylelint configuration."
   - All other T011 technical content (longhand `-color` properties only, no `border`/`outline`
     shorthand, the `sk-skip-link.css`/`sk-data-table.css`/`sk-context-nav.css` precedent
     references, no `forced-color-adjust: none` anywhere in the file) is unchanged.

4. **`## T017` gate-sweep code block** (Correction 2c)
   - Before: first line of the fenced block was
     `npx nx run tokens:catalogue                          # only if stylelint.config.mjs changed (T011)`,
     followed by `npm run quality:stylelint ...`.
   - After: that line is deleted; the block now opens directly with `npm run quality:stylelint`.
     Every other line in the block is unchanged, in the same order.

### `kitty-specs/work-explorer-segmented-choice-styles-01M20C9F/lanes.json`

5. **`lanes[0].write_scope` array** (Correction 2d)
   - Before: array's last two entries were `"packages/styles/src/segmented-choice/**"` and
     `"stylelint.config.mjs"`.
   - After: `"stylelint.config.mjs"` entry removed; array now ends with
     `"packages/styles/src/segmented-choice/**"`. JSON re-validated as parseable
     (`python3 -m json.load` check passed). No other field (`computed_at`, `computed_from`,
     `planning_commit_sha`, `predicted_surfaces`, `depends_on_lanes`, `parallel_group`, etc.) was
     touched; no new timestamp was fabricated.

### Sweep for other grants/implications (Correction 2e)

`grep -rn "stylelint.config.mjs" kitty-specs/work-explorer-segmented-choice-styles-01M20C9F/tasks.md kitty-specs/work-explorer-segmented-choice-styles-01M20C9F/tasks/` was run after the edits above.
Result: exactly two hits, both inside the corrected T011 passage in
`WP01-segmented-choice-styles.md` (lines ~315-316), both read-only/ownership-denying references
("already present in `stylelint.config.mjs`'s `ignoreValues`..." and "this WP does not own
`stylelint.config.mjs` and must not edit it..."). No other file, and no other location in either
file, grants or implies edit permission on `stylelint.config.mjs`. No further changes were needed.

## Precedence note

This ruling **supersedes plan.md's stylelint.config.mjs-editing suggestion** for T011 and T017
specifically. The Goal section's general clause — "where this file and plan.md disagree on a
procedural detail, plan.md's IC map is authoritative" — was written to resolve ordinary drafting
disagreements between two design-phase artifacts of equal standing. It does not, and cannot, bind a
later, out-of-band, binding correction issued by Codex as programme owner and final authority after
a post-tasks audit rejection. Codex's correction is not a procedural-detail dispute with plan.md; it
is an authority action overriding what plan.md suggests on this one point. The WP file itself now
states this supersession inline (see T011's rewritten passage above) so an implementer reading only
the WP file, without cross-referencing this ruling, still gets the correct instruction.

`plan.md`, `research.md`, `spec.md`, `data-model.md`, `status.json`, `status.events.jsonl`,
`mission-events.jsonl`, `meta.json`, `acceptance-matrix.json`, `issue-matrix.json`, and every other
file under `reviews/` were **not modified** by this correction pass — they are historical/reviewed/
generated records outside this correction's scope; their own narrative references to
`stylelint.config.mjs` are rationale, not live instructions, and remain as-is.

## "Do NOT touch" invariant verification

All checked by direct inspection/grep after the edits above; none were altered:

- **Exactly one work package (WP01), subtasks T001–T018, no more/fewer/renumbered.** PASSED —
  `tasks.md` has exactly one `### WP` heading (WP01); WP01's frontmatter `subtasks:` list and body
  headings both enumerate exactly T001 through T018, in order, no gaps, no duplicates.
- **No custom element, no JS behavior module, no component state, no `radiogroup`/tab/roving-tabindex
  pattern anywhere in the WP's scope.** PASSED — grep for "custom element", "radiogroup",
  "roving-tabindex" / "roving tabindex" in the WP file returns only negative/non-goal statements
  (e.g. "no custom element", Non-goals section) — no positive instance introducing any of these.
- **The CI visual-regression flow (T018's two-head PR procedure) is intact and unedited.** PASSED —
  T018's 6-step two-head procedure (push → expected first-CI-failure → no local
  `--update-snapshots` → download `visual-regression-diffs` artifact → commit baselines as a second
  head → re-target the Tier-C evidence-post at the final head) is untouched, verbatim from before
  this correction pass.
- **Tier-C manual 200%-zoom validation still assigned to the pre-merge squad, NOT to this WP as an
  implementer subtask; `docs/architecture/validation/issue-270-segmented-choice-zoom/README.md` (or
  its containing directory) still absent from WP01's `create_intent`/`owned_files`.** PASSED — the
  Execution order note and Definition of done still explicitly assign the manual 200%-zoom
  validation to the Tier-C pre-merge squad, not to the T001–T018 numbered sequence. The zoom
  README path appears exactly once in the file, inside the Definition of done's squad-gate
  narrative bullet, and does **not** appear in `create_intent` or `owned_files`. Not added, not
  altered.
- **The mission is still one WP, one lane, one PR landing on `train/elements-first` (never `main`),
  tied to issue #270.** PASSED — `lanes.json` still has exactly one lane (`lane-a`) with
  `wp_ids: ["WP01"]`; WP01's `planning_base_branch` and `merge_target_branch` are both
  `train/elements-first`; `lanes.json`'s `target_branch` is `train/elements-first`; WP01's
  `tracker_refs` still lists `spec-kitty/spec-kitty-design#270` and `#269`, unchanged.

## Post-correction verification

`spec-kitty agent tasks status --mission work-explorer-segmented-choice-styles-01M20C9F --json` was
run after the frontmatter edit. The WP01 entry now reports `"agent_profile": "frontend-freddy"`,
reflecting the corrected frontmatter. `resolved_agent_profile` and `resolved_role` were returned as
empty strings by this status query — the tool does not appear to populate those fields from a
status-only call; this is not evidence against the correction, only a note that resolution may
happen at a later dispatch step, not at status-query time.

## Post-ruling review sweep

Three fresh, independent reviewers — scope-integrity, profile-resolution, gate-consistency — reviewed
commit `d506a75` at its exact head. scope-integrity and profile-resolution both reported clean passes
on substance (no scope drift, no unauthorized edits, both binding corrections applied faithfully).
profile-resolution flagged the exact `_LIBRARY` wording nit addressed above — that Correction 1's
verbatim block read as confirming `_LIBRARY/agent_profile-frontend-freddy.md` exists on disk, when in
fact only the `AGENT_PROFILE:frontend-freddy` catalogue entry in `.kittify/charter/charter.yaml` is
confirmed, with that path declared but not materialized. That nit is fixed by this same commit.

gate-consistency flagged one pre-existing, out-of-scope asymmetry between WP01's `owned_files` and
`lanes.json`'s lane-a `write_scope`: `write_scope` includes
`docs/architecture/validation/issue-270-segmented-choice-zoom/**`, a path absent from WP01's
`owned_files`. This asymmetry predates commit `d506a75` and was not introduced by either binding
correction in this ruling. It must **not** be resolved by editing that path out of `write_scope` —
doing so would reopen the accepted squad-authored manual zoom evidence arrangement, which the
governing correction ruling explicitly forbids reopening. The arrangement is deliberately asymmetric:
the Tier-C pre-merge squad needs lane write-access to commit its own zoom-validation README onto the
shared PR branch, while WP01's implementer-owned `owned_files` correctly excludes that path since it
is squad-, not implementer-, authored output. This is therefore a known, accepted, out-of-scope
condition, not an open defect.
