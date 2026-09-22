# Pre-acceptance CI finding — Firefox sequential-focus preference

Reviewer: independent Codex debugger seat

Reviewed SHA: `673ae070c1c8d8238f4aef986e321e33e452f347`

Hosted run `34391465762` and its unchanged-head failed-job rerun each passed 1,597 browser
cases with 88 intended skips, but consistently failed the Repository Dossier Firefox keyboard-order
case after `Menu` received focus: the next Tab did not focus the native `Repos` breadcrumb. Each
attempt also reported three unrelated flaky cases that passed their retries.

The reviewer found no product exposure defect. The closed compact navigation is suppressed through
both the public assigned-root contract and the shell's internal presentation, and the existing
focused interaction test proves that exposure independently. The exact test passed 63/63 local
Firefox repetitions, the reviewer passed the actual CI Storybook artifact 50/50, and a fresh build
30/30. Forcing Firefox `accessibility.tabfocus` to controls-only values reproduced the exact
Menu-then-link-skip boundary; the default/all-categories value preserved Menu → Repos.

Required remediation:

- pin the Firefox Playwright project to `accessibility.tabfocus = 7`, so the test lane explicitly
  includes native links and controls instead of inheriting a runner preference;
- keep the native Tab-order assertions unchanged;
- add failure diagnostics for the deep active-element chain and expected element's inert/ARIA
  exposure;
- rerun focused Chromium/Firefox, repository unit/quality/type/build gates, and hosted CI.

Do not add product focus management or replace the keyboard proof with pointer/programmatic focus.
All diagnosis and review work used Codex; no Claude, Hermes, or `/tk` transport was used.
