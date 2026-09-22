---
affected_files: []
cycle_number: 2
mission_slug: work-package-detail-primitives-01M1XTPW
reproduction_command:
reviewed_at: '2026-09-07T15:04:32Z'
reviewer_agent: codex
wp_id: WP01
---

**Severity**: High

**Location**: `packages/styles/src/breadcrumbs/sk-breadcrumbs.css:21`

**Issue**: Exact-head actual-browser screenshots at 100% and 200% show long breadcrumb labels
overpainting adjacent crumbs. `.sk-breadcrumbs__item { min-inline-size: 0 }` lets each flex item
collapse while its unbroken link text paints outside the shrunken item. The list does scroll
locally, so the existing overflow assertion passes despite the visible collision.

**Recommendation**: Keep breadcrumb items from shrinking, add an item-by-item geometry assertion
that adjacent siblings do not overlap, and rerun the wide/narrow/zoom and forced-colour evidence.
