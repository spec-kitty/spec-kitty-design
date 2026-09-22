# Decision Moment `01M1HXC6WQC90NK940WN2BXR9K`

- **Mission:** `storybook-renderer-and-angular-retirement-01M1HVX4`
- **Origin flow:** `plan`
- **Step id:** `lightmode-exit-criterion`
- **Input key:** `lightmode-exit-criterion`
- **Status:** `resolved`
- **Created:** `2026-09-02T20:36:11.287769+00:00`
- **Resolved:** `2026-09-02T20:36:27.055883+00:00`
- **Resolved by:** `operator`
- **Opened by:** `operator`
- **Other answer:** `false`

## Question

ADR-13 confirmation #3 and issue #69's exit criteria require LightMode variants to render correctly, but #93 shows every LightMode story already renders dark: :root[data-theme=light] cannot match the wrapper div the stories set the attribute on. Certify, fix, or scope out?

## Options

- Scope LightMode out of #69 exit criteria; #93 owns the fix
- Fold the #93 selector fix into #69
- Accept dark rendering as the LightMode reference

## Final answer

Scope LightMode out of #69 exit criteria; #93 owns the fix

## Rationale

Operator decision, 2026-09-02. #69 is a builder swap; the #93 selector defect is a separate concern, and coupling them means one failure masks the other. No LightMode visual baseline exists (all 7 snapshots are -default/-with-ribbon), so nothing is frozen into the baseline set either way. #69 must NOT claim 'LightMode intact' at merge; ADR-13 confirmation #3 is unsatisfiable until #93 is fixed.

## Change log

- `2026-09-02T20:36:11.287769+00:00` — opened
- `2026-09-02T20:36:27.055883+00:00` — resolved (final_answer="Scope LightMode out of #69 exit criteria; #93 owns the fix")
