# Pre-accept adversarial review — pass 5

- Reviewed head: `c5337dd9f82e5f1467616f2563f0ac9b177b3794`
- Base: `bab211c9876d85c2c004daf05ef27046bbf0e671`
- Independent read-only Codex lenses: `architect-alphonso`, `designer-dagmar`,
  `debugger-debbie`, and Randy Reducer
- Verdict: **reject**
- High: 1
- Medium: 3 product findings, plus one incomplete exact-head gate

## High 1 — genuine 200% zoom loses composed header content

The committed 200% Chrome capture visibly reduces the eyebrow, title, supporting sentence, and
sync copy to ellipses. The composition selects the page header's intentionally single-line
`density="compact"` presentation, whose public stylesheet applies hidden overflow, no wrapping,
and text ellipsis. The automated zoom test asserts only document overflow and visibility of the
three radio controls, so it stays green while the surrounding composition loses text.

Required disposition: keep the fix local to the #323 operational composition, add a red-first
whole-header text-preservation assertion at the narrow/zoom boundary, and replace the genuine
100%/200% Chrome screenshots and metrics. Do not broaden this into a repository-wide compact
page-header redesign.

## Medium 1 — simultaneous controls can corrupt shared root state

Each `sk-theme-toggle` owns an independent System media listener. Selecting Light or Dark on one
control stops only that instance's listener; a sibling left in System can then process a later OS
change and overwrite `document.documentElement.dataset.theme` while storage and the selected
control still say the manual preference.

Required disposition: coordinate connected controls at the document boundary so one selected
preference is reflected by every connected control and exactly one coherent System lifecycle owns
root updates. Add red-first simultaneous-control coverage for manual override immunity, sibling UI
synchronization, listener ownership, disconnect/reconnect, and overlapping story-session changes.

## Medium 2 — invalid public property assignments bypass System fallback

The attribute converter normalizes invalid strings, but plain JavaScript can assign an invalid
value through the supported `preference` property. The resolver then treats every non-System value
as a concrete theme, which can reflect an invalid attribute, leave all radios unchecked, and write
an invalid root theme.

Required disposition: normalize at the public property boundary and prove a direct invalid
property assignment becomes System without exposing an invalid root, attribute, or selection.

## Medium 3 — the System media query is duplicated across production adapters

The bootstrap and element each spell their own `(prefers-color-scheme: dark)` string, while the
DOM-free contract owns neither the query identity nor its adapter assertions. Existing fakes return
a canned result regardless of the argument, so either production path can drift without a test
turning red.

Required disposition: move the exact query identity into the authoritative DOM-free contract,
consume it from both production adapters, and assert the query passed by both paths. The story
fixture may reuse the same contract without becoming public API.

## Exact-head mutation gate

The isolated idle-host sweep made 252/254 mutations produce the required named red. Two unchanged,
unrelated arms (`sk-bar-chart` SC-006 and `sk-app-shell` SC-012) hung before producing a report.
The shared harness failed closed, as required; this remains an acceptance blocker until a complete
post-remediation exact-head sweep or the authoritative GitHub mutation job passes. No #323 theme
arm failed.

## Verified surfaces

- The architecture lens found zero High/Medium issues in the shared resolver/bootstrap boundary,
  SSR/import safety, generated package surfaces, Factory vocabulary boundary, or rebase union.
- Native fieldset/radio semantics, keyboard operation, labels, textual state, focus,
  forced-colors/system-color deferral, greyscale, luminance/contrast, root resolution, no-JS
  fallback, and single-story cleanup otherwise passed.
- Storage denial, absent/throwing/partial/legacy `matchMedia`, single-instance listener cleanup,
  reconnect, bootstrap byte parity and ordering, event shape, and generated manifest/wrappers
  otherwise passed.
- No dead-code or aesthetic-only compression finding was raised.
