# Research: Team overview pattern story

## Sources read

- GitHub #150 complete body and dependency list.
- ADR-9, ADR-10, ADR-11.
- `docs/contributing/adding-a-component.md`, rewritten by #76.
- Current public sources/stories for app-shell, personal-rail, context-sidebar, page-header, card,
  evidence-chain, bar-chart, transition-matrix, metric, grid, action-row, status-indicator,
  entity-marker, button, pill-tag, and nav-pill.
- Storybook discovery/config, story ratchet, axe runner, visual suite, and existing Team overview
  shell tests.
- Supplied approved Team overview screenshot and the Stitch project URL.

## Dependency result

At planning base `2bbbd7b7c2287d1c664902b0d8c4f7e353205c7c`, #79 and #145–#149 are
closed and their canonical merge commits are ancestors of `train/elements-first`. #76 is also
landed. Historical PR heads for squash-style merges are not always ancestors; their canonical merge
commits are. Parent #144 and tracker #125 remain open but do not block #150.

## Story placement

`apps/storybook/.storybook/main.ts` discovers `packages/**/*.stories.ts[x]`, not TypeScript
stories under `apps/storybook/src`. `packages/elements/tsconfig.lib.json` excludes
`src/**/*.stories.ts` from the publishable build. A story at
`packages/elements/src/patterns/team-overview.stories.ts` is therefore both discoverable and
non-publishable. An ordinary fixture `.ts` beside it would be emitted, so the fixture and selectors
stay in the story module.

## Public-surface sufficiency

The landed elements expose every required composition seam:

- shell slots for personal rail, context sidebar, page header, and main content;
- rail slots for primary, utilities, account, and logout;
- controlled structured properties on evidence-chain, bar-chart, and transition-matrix;
- consumer-owned slots on card, grid, action-row, button, pill-tag, and navigation elements;
- non-cancelable bubbling/composed intent events for row, bar, and route activation;
- presentational metric and grid projections.

No missing reusable component contract was found. No child edit is justified at planning time.

## Arithmetic finding

The reusable #148 component story uses `320 + 510 + 440 + 604 = 1,874`; those values are
illustrative component data and cannot represent #150's full attributed coverage of €1,674. The
composition uses `320 + 410 + 340 + 604 = 1,674`. It keeps four ordered buckets and a visibly
dominant final bucket while satisfying the binding integrity rule.

Moves and items remain separate:

- route cell totals reduce to 62 moves;
- status inventory `12 + 21 + 13 + 4` reduces to 50 open WPs.

## Story-name finding

The repo guide requires a `Default` export; #150 requires a story presented as `ApprovedDark`.
One `Default` export with `name: 'ApprovedDark'` satisfies both without a byte-identical duplicate.
The expected ratchet grows by six stories, not seven. Built `index.json` confirms final IDs.

## Visual authority

The supplied screenshot is available as the page reference. Anonymous HTTP access to the Stitch
project returns the Stitch application shell without project content, so the named clean-v4 export
cannot be reacquired from that route. Final evidence must record the supplied capture hash and use
#149's approved Flow-health baseline for the clean matrix comparison. It must not claim an
unavailable second export was downloaded.

## Verification implication

This pattern owns no element behavior, so it adds no behavior/mutation registry subject. Its proof
belongs in story interaction assertions, Playwright semantic/layout/event tests, the story/axe
ratchet, and CI-authoritative visual baselines. All generated package outputs are expected to remain
unchanged after regeneration.

