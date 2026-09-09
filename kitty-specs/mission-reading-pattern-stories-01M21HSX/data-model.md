# Presentation model: Mission Reading fixtures and projections

This mission introduces no runtime or persisted application data model. The entities below are immutable Storybook fixture inputs and pure display projections used to prove public composition.

## Fixture entities

| Entity | Required fields | Optional fields | Invariants |
|---|---|---|---|
| Team | name, slug | none | Supplies identity only; no lookup. |
| Repository | owner/name, route | none | Reused by breadcrumb, presence, and back links from one source. |
| Mission | name, number, slug, TLDR | none | Reused by sidebar, header, breadcrumb, and titles from one source. |
| Planning git record | SHA, branch | matching pushed marker | Exactly one SHA and branch in every completed-render story. Pushed time exists only when marker branch and SHA both match. |
| Catalogue entry | key, label, presence, destination kind | href, bounded children | Available entries are anchors. Unavailable entries are non-anchors. `aria-current` requires availability. Ops has no children. |
| Bounded child | label, href | none | Research, Contracts, Checklists, and Other artifacts only when explicitly supplied. No recursion. |
| Document | page key, visible label, native article content | none | Factual committed content only. Loading projects none of these fields. |
| Snapshot annotation | visible heading, explanation | none | Refers to the same planning SHA; carries no second source version. |
| Other artifact | path, href | none | Present and absent collections are exclusive. The approved present set has four entries. |
| Ops record | invocation, action, status | none | These are the only three visible fields; row is passive. |
| Observed moment | Work Package ID, actor, transition, freshness text | none | Labelled observed; not treated as live presence. |
| Reported-live presence | actor, repository, branch, age, freshness text | none | Labelled reported-live/unverified; never joined to a Work Package. |

## Story projection

| Projection | Source | Output rules |
|---|---|---|
| M1 populated Specify | base fixture | Specify is one real current link; absent catalogue entries remain visible non-links; factual document and exact git record render. |
| M2 responsive Specify | same M1 projection | Only presentation changes: 390px compact header and consumer-controlled closed/open drawer. |
| M3 loading | base identity/catalogue/git only | Busy document region, polite status, assistive-hidden geometry; no document facts or actions. |
| M4 canonical page unavailable | catalogue override | Plan becomes unavailable while Specify remains the readable current link. |
| M5 snapshot behind log | base fixture + annotation | Same SHA and branch plus one bounded attention explanation. |
| M6a artifacts present | supplied artifact collection | Other artifacts is current and available; the same four native links appear in sidebar children and main content. |
| M6b artifacts absent | empty artifact collection | Unavailable parent, no children/current link, passive committed empty state. |
| M7a Ops present | supplied Ops collection | Ops is a current terminal anchor; one passive row with exactly three labelled values. |
| M7b Ops absent | empty Ops collection | Unavailable terminal entry, no current link/rows/actions, passive committed empty state. |
| M8 truth regions | factual overview + observed + live arrays | Three separately labelled semantic regions with independent freshness; no inferred cross-tier association. |

## Validity rules enforced by pure selectors

1. Catalogue keys and order match the twelve-entry canonical list.
2. An unavailable entry has no href, current state, or children.
3. Ops always has zero children.
4. At most one available link is current; a stale absent route may have none.
5. A pushed marker renders only when both branch and SHA equal the planning record.
6. Snapshot annotation reuses the planning SHA and cannot introduce another SHA field.
7. Other artifact and Ops present/absent projections agree with their corresponding navigation entries.
8. Ops records expose exactly `invocation`, `action`, and `status`.
9. Observed and reported-live arrays remain separate and share no derived Work Package/person key.

The pattern stores no transitions. Story controls may replace immutable projections or the controlled shell's `open` value, but do not fetch, poll, route, calculate relative time, or mutate fixture data.
