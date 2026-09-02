# Decision Moment `01M1J6H9ZGY5XN58SGVXZRMK0S`

- **Mission:** `storybook-renderer-and-angular-retirement-01M1HVX4`
- **Origin flow:** `plan`
- **Step id:** `token-contrast-fix`
- **Input key:** `token-contrast-fix`
- **Status:** `resolved`
- **Created:** `2026-09-02T23:16:15.472387+00:00`
- **Resolved:** `2026-09-02T23:16:16.474215+00:00`
- **Resolved by:** `operator`
- **Opened by:** `operator`
- **Other answer:** `false`

## Question

The 8 a11y violations blocking #69 come from --sk-fg-subtle failing WCAG AA (3.45:1 on cards, 3.83:1 on the page). Fixing a design token value was scoped out as an operator decision. Fix in-mission, or defer to #101?

## Options

- Fix in-mission: raise the dark --sk-fg-subtle to the minimum AA-compliant same-hue value
- Defer entirely to #101 and leave #69 blocked
- Merge #69 with the a11y gate red

## Final answer

Fix in-mission: raise the dark --sk-fg-subtle to the minimum AA-compliant same-hue value

## Rationale

Operator, 2026-09-03, answering 'why is 69 parked'. The violations are pre-existing defects #69 REVEALED by removing the axe skip list, not defects it caused, and DIRECTIVE_046 says finish genuinely small remaining items rather than defer. #6E6E78 -> #81818B is the minimum same-hue lightening that clears 4.5:1 (4.51 on cards, 5.01 on the page). Two further defects surfaced while applying it and were fixed under the same authorisation: a missing sk-pill-tag.css import in the card story (1.2:1 black text), and .sk-card setting no colour at all. The light-theme --sk-fg-subtle fails too and is deliberately NOT changed: #93 makes LightMode unrenderable, so the fix could not be verified. It stays with #101.

## Change log

- `2026-09-02T23:16:15.472387+00:00` — opened
- `2026-09-02T23:16:16.474215+00:00` — resolved (final_answer="Fix in-mission: raise the dark --sk-fg-subtle to the minimum AA-compliant same-hue value")
