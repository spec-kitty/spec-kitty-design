# Independent Codex review feedback — cycle 2

Reviewed `e988894a714bbf47d77b5aa69436d0c6152ce41c` against
`origin/train/elements-first@7a44c7037569ce149d9a1f1125a7da6f70b47508`.

Verdict: changes requested.

- Add 860/861 Dossier layout-threshold stories and Chromium/Firefox assertions; the existing
  59/60/61 progress fixture is not a shell threshold proof.
- Exercise a supplied safe HTTPS tracker through the public rendered composition, including exact
  navigation and no nested links, while retaining unsafe/missing static fallbacks.
- Prove keyboard traversal, Enter/Space activation, visible reading order, and unclipped focus
  outlines for compact navigation, Mission/document links, and copy controls in Chromium/Firefox.
- Move the breadcrumb destination and completed setup heading/intro into immutable fixture input.
- Align progress documentation with the supplied total/percent contract and native `max=100`.
- Remove the duplicated “Pushed pushed 6 minutes ago” accessible fact phrase.

Full combined findings and reviewer evidence are recorded in
`tasks/WP01-repository-dossier-pattern-proof/review-cycle-2.md`.

Both independent seats were Codex-only. No Claude, Hermes, or `/tk` transport was used.
