# Tracer: design-decisions

One entry per finding: `YYYY-MM-DD · actor · <text>`.

---

2026-09-11 · claude · --sk-border-control was nearly aliased to var(--sk-fg-subtle) in the first draft of this mission's spec/plan/tasks/research. A coordinator review rejected the alias before any implementation code existed: --sk-fg-subtle exists to satisfy TEXT contrast at 4.5:1 and had already moved once for that reason alone (#101), so a future text-motivated nudge to it would have silently dropped this border's non-text 3:1 obligation below floor with every existing gate (check-token-breaking-changes.sh computes no contrast) still green. The margin made it concrete, not theoretical: the alias's light-theme value measured only 3.09:1 against --sk-surface-input, 0.09 of headroom. Chosen instead: an independently declared literal per theme, darkened one step further for margin (3.35:1 tightest, up from 3.09:1). Lesson: a token whose whole reason for existing is a stated contrast contract should never alias into a token that moves for an unrelated contrast reason, even inside the same warm-neutral family.
