# Implementation ruling: publish the segmented-choice surface

**Decision:** Codex approved a bounded WP01 ownership correction on 2026-09-08 before either
distribution file was edited. Add `packages/styles/package.json` and
`packages/styles/src/index.ts` to WP01 `owned_files` and lane-a `write_scope`, then make exactly
these two source changes:

1. Add `"./segmented-choice/*": "./dist/segmented-choice/*"` to the `@spec-kitty/styles`
   package export map.
2. Add `export * from './segmented-choice/index';` to the styles package root barrel.

No other package, export, or root-barrel change is approved by this ruling.

## Triggering evidence

After the in-scope component directory, generated component barrel, stories, tests, ratchet, and
docs were authored, the repository's release gate was run from the WP lane:

```text
$ node scripts/check-release-graph.mjs
packages:    elements, react, styles, tokens
publishable: @spec-kitty/tokens, @spec-kitty/styles, @spec-kitty/elements, @spec-kitty/react
buildable:   tokens, styles, elements
  @spec-kitty/tokens: 37 files, 3816.1 KiB packed (gzipped; varies by machine)
  @spec-kitty/styles: 201 files, 92.5 KiB packed (gzipped; varies by machine)
  @spec-kitty/elements: 49 files, 151.5 KiB packed (gzipped; varies by machine)
  @spec-kitty/react: 60 files, 22.1 KiB packed (gzipped; varies by machine)

❌ 1 release-graph problem(s):

  - @spec-kitty/styles: component "segmented-choice" has no subpath export — its CSS is unreachable
```

The command exited 1. The root barrel also omitted the generated segmented-choice fixture exports.

## Rationale and rejected alternatives

Issue #270 and WP01 bind the outcome to a shipped `@spec-kitty/styles` public surface. A component
that exists only in the source tree but has no package subpath is not shipped, and its documented
CSS import fails at the package boundary. The root barrel is the repository's established public
route for generated styles-only fixture exports.

- **Leave the component unexported:** rejected because it fails the live release-graph gate and
  makes the CSS unreachable to package consumers.
- **Document or rely on a private/internal import:** rejected because it would promise an
  unexported path, bypass the package's public contract, and conflict with existing adjacent
  component conventions.

This correction does not add behavior, state, elements, wrappers, router logic, or domain logic.
It closes only the two distribution seams required by the already-approved styles-only surface.

## Generated size-report ownership correction

Codex approved a second bounded ownership correction on 2026-09-08 before the generated report
was touched. Add only `packages/elements/SIZES.md` to WP01 `owned_files` and lane-a
`write_scope`, because the user explicitly requires regeneration of every applicable size report
and the new styles-only component changes the published styles package file count and unpacked
size. The report must be produced only by the canonical `measure-elements-sizes.mjs` generator
under the official Node 22 container; it must never be hand-edited.

The triggering check was:

```text
$ node scripts/measure-elements-sizes.mjs --check
Size report is stale. Run: node scripts/measure-elements-sizes.mjs

Differences:
  @spec-kitty/styles: 189 files / 456.3 KiB -> 201 files / 471.3 KiB
```

The local runtime additionally proposed a 30 KiB to 31 KiB gzip-only change for the unchanged
IIFE bundle while its raw and minified byte counts remained identical. That unrelated value is
not approved. The generated report may be committed only if the official Node 22/zlib run leaves
all unrelated element rows and SRI values byte-identical and limits the diff to styles-derived
row, count, or prose values that truly depend on the new published files. Otherwise this report
remains blocked for a CI-authoritative artifact; no manual repair is permitted.

The official container resolved to Node `v22.23.2` and zlib `1.3.1-e00f703`. This host's
`docker` command is Podman `5.8.4`; its rootless user mapping rejected the literal Docker
`--user 1000:1000` command with `EACCES`, so the same official image and command were rerun with
Podman's required `--userns=keep-id`. The resulting diff changes only the styles row from 189
files / 456.3 KiB to 201 files / 471.3 KiB. Every element row and SRI value is byte-identical,
and the same container's `--check` reports the file up to date.

## Implementer test-first evidence

The component was implemented in the binding T001–T017 order. These were the two intentional RED
checkpoints captured before state styling was added.

### T001 source-contract RED

```text
$ npx playwright test apps/storybook/src/tests/sk-segmented-choice.spec.ts \
    --grep "source and distribution contract" --project=chromium
  2 failed
    the authored stylesheet and generated barrel expose exactly the public class family
    consumer documentation includes the segmented-choice ownership contract
  2 passed
```

The absence assertions passed while the missing public stylesheet/barrel and documentation failed,
which is the intended pre-implementation boundary. The docs assertion stayed red until T015 by the
WP's prescribed order.

### T009 live-state RED

The repository Playwright configuration was temporarily mirrored on isolated port 6270 because an
unrelated checkout already owned the canonical reusable port 6006. Against the built first-pass,
structural-only CSS, the captured run was:

```text
$ npx playwright test apps/storybook/src/tests/sk-segmented-choice.spec.ts \
    --config=playwright.issue270.config.ts
  5 failed
    consumer documentation includes the segmented-choice ownership contract
    pressed state differs from an unpressed sibling by a non-colour cue
    hover, active, focus-visible, and disabled states remain non-colour distinct
    forced colors keeps selected, focus-visible, and disabled indicators load-bearing
    the 1024px narrow story meets 44px targets without inflating default density
  18 passed
```

Those are the intended T009 failures: documentation remained deferred, and the structural CSS did
not yet differentiate state, strengthen forced-colors cues, or apply the narrow target-size rule.
T010–T011 then supplied only those missing declarations.

### Final GREEN and environment boundary

After T015 and the exact 1024px Narrow-story correction, the isolated final run completed with:

```text
$ npx playwright test apps/storybook/src/tests/sk-segmented-choice.spec.ts \
    --config=playwright.issue270.config.ts
Running 48 tests using 1 worker
  6 skipped
  42 passed (18.1s)
```

The six skips are deliberate: five browser-independent source-contract cases run once on Chromium,
and Playwright forced-colors emulation is Chromium-owned. Every shared live-semantic test passed on
Chromium and Firefox. WebKit cannot start on this host because its system libraries are absent; the
CI-owned canonical matrix remains authoritative. The temporary isolated config was deleted before
commit. The literal canonical command was also attempted but reused the unrelated Storybook already
listening on 6006 and therefore timed out on missing #270 story ids; that checkout/process was not
touched.

The final Storybook/axe gate found all 336 ratcheted ids, rendered 445/445 stories, and reported zero
WCAG 2.1 AA violations. The concrete T016 no-op commands each returned grep exit 1 with no matches:

```text
exit_codes grep=1 element_dir=1 demo=1
```

No local visual baseline was generated. T018's first push, CI-authoritative PNG pull, second
`styles`-scoped commit, real 200% browser-zoom evidence, and exact-head Tier-C independent review
remain programme-owner/reviewer work after this implementer handoff.

## Finalizer branch-strategy correction

The tasks finalizer had replaced the accepted train-only delivery rule with generic text allowing a
human redirect and a dependency-specific base. Codex identified this known finalizer hazard after
the initial implementation commit and approved restoring the binding mission contract before
handoff: lane-a was cut from the then-latest `origin/train/elements-first` at
`a78445552e42cb6bbde4e1d2e497137bc30c9dee`, contains the accepted planning artifacts, and must
deliver exactly one WP and one PR back to `train/elements-first`. The planning branch is never
pushed, and `main` is never a target. This governance-only correction changes no implementation
source or public contract.
