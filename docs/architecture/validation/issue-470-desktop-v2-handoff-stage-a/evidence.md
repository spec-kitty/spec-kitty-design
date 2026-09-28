# Issue #470 Stage-A WP02 gate evidence

Date: 2026-09-28
Lane: `kitty/mission-desktop-v2-immutable-handoff-develop-01M3JSCM-lane-b`
Tested committed WP02 source head: `f6873680ed3ff8f5ff5e939a5339e2ba436c6ce7`

This is post-source evidence for the WP02 lane before its independent Spec Kitty review and
mission PR. The report and sidecars are not part of the source contract or handoff payload.
The eventual consolidated PR head must be checked again before merge; this report does not
claim a later PR-head run.

| Gate / check | Exact-head result |
| --- | --- |
| `npm run quality:all` | Pass at `f6873680`; zero lint errors. Existing component/fixture security-rule warnings remain non-failing. |
| `npm test` | Pass at `f6873680`: 831 tests in 60 files, with non-empty Node (133) and Chromium browser (698) lanes. The focused handoff suite passes 16/16, including manifest-only provenance, rights, role, and family tamper regressions. |
| `npx nx run-many --target=build --projects=tokens,styles,elements,react` | Exit 0 at `f6873680`; tokens, styles, and elements build. Nx reports that `react` has no `build` target in this checkout. |
| `npx nx run storybook:storybook:build` | Pass at `f6873680`; the contract checker resolves all required story IDs in the built index. |
| `node scripts/run-axe-storybook.js` | Pass at `f6873680`: all 810 story IDs rendered and scanned, zero timeout/unloaded stories and zero WCAG 2.1 AA violations. `axe-story-results.json` records the exact 810 IDs and raw runner-log SHA-256 `31e64beb6ac3c770c71b5394e93acea374a719cedd95b5f7553a12d682152808`. The same 810/810 result passed the CI a11y job in run `36400118254`. |
| `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium` | Pass at `f6873680` in CI run `36400118254`, visual-regression job `108856403060`: 456/456 tests passed, including all 110 Desktop V2 required states. `visual-mapping-results.json` records the 110 family/state/story mappings and committed snapshot path format. This is the unfiltered visual gate, not a focused-only substitute. |
| Two exports and copied offline verification | Pass from full source SHA `f6873680ed3ff8f5ff5e939a5339e2ba436c6ce7`: two complete artifact trees are byte-identical, each with 180 payload files. An independent canonical digest calculation over 181 contract/payload entries matches both manifests: `ed3a17b01574f412108bb0a8010c1530f8a89832dc4ee957edac81ea09162f3d`. A detached copy passes both internal-integrity and approved-source modes with caller-supplied SHA/digest pins. |

The export gate is reproducible from this checkout with these commands (each `mktemp -d`
creates only a new `/tmp` directory):

```sh
d1_source_sha=f6873680ed3ff8f5ff5e939a5339e2ba436c6ce7
d1_expected_digest=ed3a17b01574f412108bb0a8010c1530f8a89832dc4ee957edac81ea09162f3d
d1_export_one=$(mktemp -d)
d1_export_two=$(mktemp -d)
d1_detached=$(mktemp -d)
node scripts/export-desktop-v2-handoff.mjs --source-sha "$d1_source_sha" --output "$d1_export_one/artifact"
node scripts/export-desktop-v2-handoff.mjs --source-sha "$d1_source_sha" --output "$d1_export_two/artifact"
diff -qr "$d1_export_one/artifact" "$d1_export_two/artifact"
cp -a "$d1_export_one/artifact" "$d1_detached/artifact"
node scripts/verify-desktop-v2-handoff.mjs --artifact "$d1_detached/artifact" --mode internal
node scripts/verify-desktop-v2-handoff.mjs --artifact "$d1_detached/artifact" --mode approved-source --expected-source-sha "$d1_source_sha" --expected-artifact-digest "$d1_expected_digest"
node -e 'const fs=require("fs"),p=require("path"),h=require("crypto").createHash("sha256");const root=process.argv[1],m=JSON.parse(fs.readFileSync(p.join(root,"manifest.json"),"utf8"));const files=[{path:"contract/source-contract.json",bytes:fs.readFileSync(p.join(root,"contract/source-contract.json"))},...m.files.map(f=>({path:"payload/"+f.path,bytes:fs.readFileSync(p.join(root,"payload",f.path))}))].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);for(const f of files){h.update(f.path+"\0"+f.bytes.length+"\0");h.update(f.bytes);h.update("\0")}console.log(h.digest("hex"))' "$d1_export_one/artifact"
```

The independent digest command above printed `ed3a17b01574f412108bb0a8010c1530f8a89832dc4ee957edac81ea09162f3d`.
The exact-head CI job logs provide independent runner evidence for
[lint](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36400118254/job/108855967885),
[test (1,529 tests across Node, Chromium and WebKit)](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36400118254/job/108855968161),
[Storybook/build](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36400118254/job/108856067933),
[axe (810 stories)](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36400118254/job/108856403124), and
[visual (456 tests)](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36400118254/job/108856403060).
The [full Playwright job](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36400118254/job/108856403010)
also exited successfully: 2,777 passed, 147 skipped, and one WebKit case that passed on
retry. The retry is recorded as a flake, not hidden as an uninterrupted pass.

Supplemental checks at the same source head: `node scripts/check-desktop-v2-contract.mjs`
passes 22 primitive families and 110 independently required states; `node scripts/check-gate-wiring.mjs`
passes. `node scripts/check-desktop-v2-contract.mjs --require-exportable` fails as intended:
the unchanged full `tokens.css` cannot be redistributed while Swansea terms are unresolved.
The export uses the checked scoped token derivative with four Swansea font-face rules/assets
excluded and a source map. No full-token rights waiver is claimed.

The prior Fedora visual run and the CI-authoritative snapshot refresh are historical diagnostics,
not the current gate result. The refreshed Desktop V2 baselines were checked against CI actuals
and visually reviewed before this exact-head 456/456 CI run. Reviewer Renata's independent
verifier review at `f6873680` also confirmed that the previously accepted manifest-only
path, license, role, and family tampering now fails without rejecting a clean 180-file export.
The 45 refreshed Desktop V2 PNG baselines were committed in the WP02 lane after WP01 approval,
although WP01 T003 owns visual-gap closure. They must be included explicitly in the aggregate
mission PR review; this report does not treat the prior WP01 verdict as review of those new bytes.

CI run: https://github.com/spec-kitty/spec-kitty-design/actions/runs/36400118254
The run completed successfully at `f6873680`; all enforced jobs and the final
[gate job](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36400118254/job/108865516386)
passed. This is WP02 source-head evidence; after this report is committed, the actual
aggregate mission PR head still requires its own gate run and review.
