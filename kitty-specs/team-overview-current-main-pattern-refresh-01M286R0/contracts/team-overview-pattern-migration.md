# Team Overview story contract migration

## Historical contract

Issue #150 and its six Storybook entries documented a Delivery return, Flow health, work-package
inventory, operational dashboard, evidence-route controls, and page-wide sync model. Those entries,
tests, visual cases, and PNGs are historical/deprecated after #383. They are not a current Team
Kitty product contract.

## Current contract

- TO1 projects supplied TeamMoment and admitted-repository facts into Velocity, at most two
  in-flight Missions, repository rows, and at most six passive recent rows.
- TO2 projects exactly six supplied first-run role/state responses with authorization-gated actions.
- Commands use the existing public `sk-copy-field`; links are supplied safe routes; the fixture
  selector and compact-drawer state are design-review consumer scaffolding.
- Team Kitty retains routing, permissions, relay reads, polling, clocks, retention policy,
  TeamMoment/onboarding classification, copy/i18n, clipboard policy, and mutations.

Consumers seeking the old Delivery/Flow dashboard must not treat the new stories as a renamed
surface. Migrate to the current TO1/TO2 evidence or retain the old capture only as dated historical
design documentation.
