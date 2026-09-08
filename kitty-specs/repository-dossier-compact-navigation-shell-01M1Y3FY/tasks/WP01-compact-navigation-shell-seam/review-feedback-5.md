# WP01 adversarial review correction — cycle 5 disposition

- Assigned-root exposure suppression now uses a global lease ledger. Transfer between shells
  preserves the original raw `inert` and `aria-hidden` states, stale owners cannot restore a
  transferred root, and activation or disconnection restores exactly the captured state without
  authoring `aria-hidden="false"`.
- The supported consumer boundary is explicit: exposure state is snapshotted when suppression
  begins; consumers author a new baseline while the root is active, not underneath the shell's
  temporary suppression lease.
- A global event claim lets only the nearest effectively-open nested shell emit one dismissal for
  a composed Escape while leaving ordinary keydown propagation intact.
- Compact CSS now uses logical `max-inline-size: 860px`, matching the ResizeObserver content-box
  measurement in horizontal and vertical writing modes. The unrelated legacy 720px presentation
  remains backward compatible.
- `SkAppShellDismissDetail` and `SkAppShellPresentation` are exported from the package root; Vue's
  generated declaration remains self-contained.
- The dead opacity transition and reduced-motion override were removed. The reduced-motion story
  tests observable controlled close/reopen, focus, and bounded scrolling instead.
- Five mutation arms cover stale-owner restoration, active transfer, nested Escape ownership,
  logical threshold parity, and package-root type export behavior.

Independent Codex proof at `f08e6675280093de1796b237ae56550cdfd1f215` approved the corrections
with no findings. Later train rebases and source regeneration supersede that SHA; final readiness
requires a fresh exact-SHA four-lens Codex review and the external verification matrix.
