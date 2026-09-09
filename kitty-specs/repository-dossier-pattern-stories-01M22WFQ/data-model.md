# Presentation Model: Repository Dossier Fixtures and Projections

This mission introduces no persisted or runtime application data model. These entities are immutable Storybook inputs and pure display projections used to prove a public composition.

## Fixture entities

| Entity              | Required facts                                       | Optional facts                     | Invariants                                                                         |
| ------------------- | ---------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| Repository identity | owner/name, local path, inspected branch             | default branch                     | Reused from one source anywhere shown; no discovery.                               |
| Dossier snapshot    | state, commit SHA                                    | recorded time                      | A commit exists only for completed dossier states; no current-time calculation.    |
| Branch comparison   | inspected branch, default branch, merged label/value | none                               | Every value is supplied; no comparison or merge inference establishes truth.       |
| Mission summary     | mission ID, title, state, href                       | progress value/label, affected SHA | Absent for completed-empty; supplied progress value and label agree.               |
| Repository action   | label, href or native button intent, availability    | supporting explanation             | Presence is supplied by the fixture; the story does not execute commands or route. |
| Notice              | tone, heading, body, announcement mode               | dismissibility                     | Indexing uses a stable live region; warnings use existing notice semantics.        |
| Navigation entry    | label, href, current, children                       | unavailable explanation            | Native grouped/nested list; at most one current link; no router state.             |
| Copy datum          | accessible label, exact value                        | visual prefix                      | Clipboard result is owned and announced by `sk-copy-field`.                        |

## State projections

| Projection                  | Supplied truth                                               | Output rules                                                                    |
| --------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| D1 populated desktop        | completed snapshot, repository facts, missions/actions       | Full public composition; repeated facts reuse fixture fields.                   |
| D2 narrow closed/open       | same populated truth plus consumer drawer boolean            | Presentation changes only; no separate mobile data model.                       |
| D4 cross-branch             | distinct inspected/default branches and supplied merged fact | Both branches and merged fact remain explicit; no inferred merge state.         |
| D5 not Spec Kitty           | terminal capability state and explanation                    | No setup guidance, commit, mission rows, progress, or completed-only action.    |
| D6 snapshot affects mission | completed snapshot, one affected mission, one warning        | The same SHA appears in warning/supporting context; no new status surface.      |
| D7 indexing                 | pending capability state and stable message                  | Busy/live meaning; no repository facts, timer, polling, or calculated progress. |
| D8 completed empty          | completed snapshot, real commit, empty missions              | Setup guidance; no fabricated zero row/count/progress.                          |
| LightMode                   | D1 projection plus story theme parameter                     | System proof only; identical semantic content.                                  |
| Long data                   | completed projection with supplied stress strings            | Local wrap/overflow only; no truncation that changes exact copy value.          |
| Threshold proof             | supplied boundary-adjacent value/label pairs                 | Render supplied public progress states; do not derive repository progress.      |

## Validity rules enforced by pure selectors/tests

1. Every object reachable from a fixture is frozen.
2. Repeated repository name, branch, path, mission ID, and SHA values originate from their fixture field.
3. D4 never derives `merged`; it exposes the exact fixture fact.
4. D5 has no commit, mission list, progress, or completed-only action.
5. D6 uses one identical supplied SHA for snapshot and affected-mission context.
6. D7 has no completed repository facts and carries stable busy/live semantics.
7. D8 has a commit and zero missions, but no zero-valued surrogate facts.
8. Progress values and visible labels are supplied together and remain within native `<progress>` bounds.
9. Navigation current state applies only to a real anchor, with grouped/nested native list structure.
10. Copy values are not normalized, shortened, or reconstructed before delegation to `sk-copy-field`.

The story may replace an immutable projection or toggle the controlled drawer boolean. It never fetches, polls, routes, executes, persists, calculates time, or mutates a fixture.
