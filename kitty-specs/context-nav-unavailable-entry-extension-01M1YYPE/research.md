# Research: Context navigation unavailable entries

## Decision summary

The smallest valid extension is two styles-only BEM classes applied to consumer-authored native non-anchor markup. Existing `.sk-context-nav__link` behavior remains untouched. No new token, custom element, script, state model, or framework artifact is required.

## Evidence reviewed

- GitHub #264 and tracker #263 define visible fixed-catalogue absence as navigation state, not loading or error behavior.
- PR #262 merged #256 into `train/elements-first` as `57e1f466`; the train now contains the public grouped/nested `.sk-context-nav` family and no unavailable-entry selector.
- Team Kitty's reviewed M1–M8 family uses native non-anchor rows with `aria-disabled="true"` and visible `Unavailable` copy; all-unavailable/direct-stale states may have no current link.
- Team Kitty `main@29f62da0` was rechecked before planning; changes after the audit pin do not alter the fixed Mission catalogue or unavailable-row contract.
- ADR-9 keeps native light-DOM semantics outside shadow roots; ADR-10 records styles-only native-semantics families; ADR-11 requires real-browser behavior assertions rather than render-only tests.
- #92 demonstrates that interposing a component host breaks list relationships. #145 leaves context navigation/selection with the consumer. #176 establishes the styles-native-semantics precedent.
- The landed CSS uses existing semantic foreground/surface pairs and logical properties. The extension can reuse them without token additions.

## Alternatives rejected

| Alternative | Rejected because |
|---|---|
| Disabled anchor | Retains link semantics/URL and invites activation interception; issue contract requires non-anchor content. |
| Button or custom element | Invents an action and a host/state contract where none exists. |
| `aria-disabled` on list item only | Does not define the visible row anatomy and can leave styled descendant links actionable. |
| Generated annotation via CSS | Hides wording from consumer ownership, is brittle for accessibility/i18n, and violates the optional-verbatim contract. |
| Reuse empty-copy or status component | Unavailability is an item-level navigation state, not a group empty state or live operational status. |
| Modify `.sk-context-nav__link` | Risks current/hover/focus regressions and widens #256's proven anchor contract unnecessarily. |

## Open questions

None. Exact BEM names are resolved by the issue's representative anatomy and repository convention: `.sk-context-nav__unavailable` and `.sk-context-nav__annotation`.
