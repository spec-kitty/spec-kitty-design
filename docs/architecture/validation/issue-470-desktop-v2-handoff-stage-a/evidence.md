# Issue #470 Stage-A WP02 gate evidence

Date: 2026-09-28
Lane: kitty/mission-desktop-v2-immutable-handoff-develop-01M3JSCM-lane-b
Tested committed WP02 source head: 0f2b46d1ec5ed69ae207f47675e47ef3a955692f

This post-source evidence records the WP02 lane before its independent Spec Kitty review
and mission PR. The report and JSON sidecars are not part of the source contract or
handoff payload. The exact-head CI run below tested source commit 0f2b46d1; this
evidence-only commit is not included in that run and requires its own exact-head CI run
before any claim is made about the report commit. The eventual consolidated PR head must
also be checked before merge.

The exact-head CI run completed at 0f2b46d1. The two additional native commands recorded
below were run while HEAD remained at that source commit and only these three evidence files
were modified in the worktree.

| Planned gate command / evidence | Exact source-head result |
| --- | --- |
| Lint: npm run quality:all | Ran directly at the source commit; exit 0 with 32 existing security-rule warnings and zero errors. Exact-head CI lint-code job 108890837727 also passed its individual enforced lint/style/type/generated checks; it did not invoke the umbrella command literally. |
| Tests: npm test plus focused contract/export suites | Exact-head CI test job 108890837798 ran npm test through the suite-time wrapper: 1,530 tests in 108 files (Node 134, Chromium 698, WebKit 698); all 272 mutation arms and 10 guard self-checks passed. The focused contract/handoff suites passed 24/24 locally. |
| Full cross-browser Playwright suite | Exact-head CI Playwright job 108891169929 passed 2,778 tests; 147 were skipped. |
| Package build: npx nx run-many --target=build --projects=tokens,styles,elements,react | Ran directly at the source commit; exit 0 and built tokens, styles, and elements. Nx reports react has no build target in this checkout. |
| Storybook: npx nx run storybook:storybook:build | Exact-head CI Storybook build job 108890921776 passed through the required budget wrapper, node scripts/build-storybook-with-budget.mjs, which invokes npx nx run storybook:storybook:build --skip-nx-cache; the built index passed contract checks. |
| Axe: node scripts/run-axe-storybook.js | Exact-head CI a11y job 108891169949 passed: all 810 story IDs rendered and scanned, zero timeouts and zero WCAG 2.1 AA violations. The sidecar records all 810 IDs and normalized script-stdout SHA-256. |
| Visual: PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium | Exact-head CI visual job 108891170006 passed 456/456, including all 110 Desktop V2 required states. This is the unfiltered visual gate, not a focused-only substitute. |
| Export: two node scripts/export-desktop-v2-handoff.mjs runs + detached verification | Pass from full source SHA 0f2b46d1ec5ed69ae207f47675e47ef3a955692f: independent export trees were byte-identical with 180 payload files; independent canonical digest over the contract and payload entries was 737a9b58a04e3168e777d0d4e79a8f46380cbddde1f8b97abb120a9481cda8a0. The detached copy passed internal-integrity and independently pinned approved-source verification. |

The current aggregate capture correction covers ten contract states and ten CI-authoritative
PNG baselines: button/light-mode, card/light-mode, notice/light-mode, notice/focus,
notice/dismissible, pill-tag/light-mode, pill-tag/variants, status-indicator/light-mode,
status-indicator/all-tones, and status-indicator/pulsing. The earlier 45 Desktop V2 PNG
refreshes are a separate prior scope; both sets must be explicitly considered in aggregate
mission review. The prior WP01 verdict does not review these ten newer PNG bytes.

The pill-tag/light-mode baseline was stabilized with a document.fonts.ready wait before
measuring aggregate capture bounds. The pre-wait visual run 36407967135 showed retry
dimensions varying between 578x62 and 588x62. After the font-ready change, all three
attempts in run 36409979577 measured 578x62, and only that one CI-derived PNG was updated.
The final exact-source-head visual run 36410886176 passed all 456 tests.

The export gate ran from the tested source SHA using scratch root
/tmp/desktop-v2-wp02-check.JjRJYb. To reproduce it from the repository root, create a
fresh temporary directory and run:

```sh
d1_source_sha=0f2b46d1ec5ed69ae207f47675e47ef3a955692f
d1_expected_digest=737a9b58a04e3168e777d0d4e79a8f46380cbddde1f8b97abb120a9481cda8a0
d1_scratch=$(mktemp -d)
node scripts/export-desktop-v2-handoff.mjs --source-sha "$d1_source_sha" --output "$d1_scratch/export-a"
node scripts/export-desktop-v2-handoff.mjs --source-sha "$d1_source_sha" --output "$d1_scratch/export-b"
diff -qr "$d1_scratch/export-a" "$d1_scratch/export-b"
cp -R "$d1_scratch/export-a" "$d1_scratch/detached-copy"
node scripts/verify-desktop-v2-handoff.mjs --artifact "$d1_scratch/detached-copy" --mode internal
node scripts/verify-desktop-v2-handoff.mjs --artifact "$d1_scratch/detached-copy" --mode approved-source --expected-source-sha "$d1_source_sha" --expected-artifact-digest "$d1_expected_digest"
node -e 'const fs=require("fs"),p=require("path"),h=require("crypto").createHash("sha256");const root=process.argv[1],m=JSON.parse(fs.readFileSync(p.join(root,"manifest.json"),"utf8"));const files=[{path:"contract/source-contract.json",bytes:fs.readFileSync(p.join(root,"contract/source-contract.json"))},...m.files.map(f=>({path:"payload/"+f.path,bytes:fs.readFileSync(p.join(root,"payload",f.path))}))].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);for(const f of files){h.update(f.path+"\0"+f.bytes.length+"\0");h.update(f.bytes);h.update("\0")}console.log(h.digest("hex"))' "$d1_scratch/export-a"
```

Both exports reported 180 payload files and the digest above. The independent digest command
printed 737a9b58a04e3168e777d0d4e79a8f46380cbddde1f8b97abb120a9481cda8a0. Supplemental
checks at the same source head passed: node scripts/check-desktop-v2-contract.mjs
(22 primitive families and 110 independently required states), node
scripts/check-gate-wiring.mjs --selftest (13/13), node scripts/check-gate-wiring.mjs, and
npx vitest run --project node --reporter=default tests/node/desktop-v2-contract.test.ts
tests/node/desktop-v2-handoff.test.ts (24/24). The --require-exportable contract check
continues to fail as intended because the unchanged full tokens.css cannot be redistributed
while Swansea terms remain unresolved; the export uses the checked scoped token derivative
with four Swansea font-face rules/assets excluded and a source map. No full-token rights
waiver is claimed.

Exact-head CI run:
[36410886176](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36410886176),
tested at 0f2b46d1ec5ed69ae207f47675e47ef3a955692f and completed successfully. Relevant
job evidence: [lint-code](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36410886176/job/108890837727),
[test](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36410886176/job/108890837798),
[Storybook build](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36410886176/job/108890921776),
[Playwright](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36410886176/job/108891169929),
[axe](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36410886176/job/108891169949),
[visual](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36410886176/job/108891170006), and
[final gate](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36410886176/job/108901003706).
