# Research: Native context-navigation styles

## Decisions

### R-001 — Preserve a styles-only native contract

**Decision**: Publish `.sk-context-nav` classes for consumer-authored `nav`, section/heading, lists, items, anchors, icons, labels, child lists, empty copy, and overflow links. Do not add a custom element or JavaScript.

**Rationale**: #145 deliberately leaves navigation content and selection with the consumer while `sk-context-sidebar` owns only the complementary landmark/layout shell. #92 showed that inserting hosts between native parents and children can damage semantics. #176 established the repository's styles-only generated-exemplar pattern.

### R-002 — Use `aria-current` as the only current-state hook

**Decision**: Select current link presentation through `[aria-current]:not([aria-current="false"])`; no `.is-current` alias and no route inference. Explicit `aria-current="false"` is a non-current link.

**Rationale**: This preserves native semantics and a single source of truth while keeping URLs, navigation state, and selection logic outside the design library.

### R-003 — Treat nested destinations as ordinary nested lists

**Decision**: Keep `ul > li > a` nesting and use visual indentation/connector treatment only. Do not introduce tree/menu roles, roving tabindex, disclosure state, or extra keyboard behavior.

**Rationale**: These are page links, not an application menu or tree widget. Native list and anchor behavior supplies the correct accessibility model and tab order.

### R-004 — Contain labels without destroying accessible names

**Decision**: Use min-width/overflow-wrap techniques that permit long tokens and prose to stay inside the sidebar. Any visual truncation must leave the full DOM text/accessibility name intact.

**Rationale**: Dossier fixtures contain long repository and Mission labels; issue #256 explicitly requires 240px, 390px, and zoom containment.

### R-005 — Token-only target/state styling

**Decision**: Compose the minimum target from existing spacing/layout tokens and use semantic colour, border, radius, typography, and motion tokens. Forced-colour overrides use platform colour keywords only where the repository convention permits them.

**Rationale**: ADR-9/10 make literal-free token consumption and generated/public artifacts mandatory. The issue forbids an un-tokened 44px literal.

### R-006 — Keep empty/overflow content consumer-authored

**Decision**: Provide presentation hooks only. Empty copy and overflow/management links appear solely when authored by the consumer; the overflow link remains a conventional inline/navigation link, not a CTA.

**Rationale**: The library cannot know admission state, counts, limits, permissions, routes, or product language.

### R-007 — One atomic work package

**Decision**: Implement the stylesheet, authored canonical HTML exemplars, generated TypeScript barrel, stories, tests, ratchets, and documentation as one WP and one PR.

**Rationale**: This is one new styles-only public contract in a single package boundary. Splitting generated publication, behavior evidence, or documentation would expose an incomplete/unguarded contract; there is no independent runtime or data-layer boundary.

## Evidence summary

- Live GitHub #256 is the binding scope and acceptance source; it has no comments or linked implementation PR.
- #92, #145, and #176 are closed and establish native composition, container ownership, and styles-only publication precedents.
- ADR-9/10/11 require token-only authoring, generated artifacts from source, comprehensive stories/tests, and accessible native composition.
- Approved Repository Dossier D1, D2, D4–D8 repeatedly show grouped links, current repository treatment, nested Missions, empty/overflow copy, long-content states, and narrow responsive removal. They do not authorize application logic.
- Current `train/elements-first` source is authoritative over the historical handoff pin.

## Risks and mitigations

- **Generated-file overlap with other Wave A missions**: rebase on the latest train immediately before review/PR delivery, regenerate from authored source, and rerun gates on the exact head.
- **Pseudo-state visual tests can be brittle**: rely on deterministic class/attribute markup and Playwright state emulation where supported; verify native focus behavior in both Chromium and Firefox.
- **Twenty-child and long-token overflow**: assert element and document scroll widths at 240px/390px and zoom, not only screenshots.
- **Styles-only generator drift**: run the current generator and clean-check rather than hand-editing exemplars/barrels.
- **No transition needed**: prefer no motion; only add a precise reduced-motion override if the authored family actually owns a transition.

## Open questions

None requiring product input. Exact existing token choices and repository test locations are implementation decisions to confirm against the current source during planning.
