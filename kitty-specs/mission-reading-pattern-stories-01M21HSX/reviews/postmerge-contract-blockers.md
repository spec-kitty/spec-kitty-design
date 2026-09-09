# Post-merge contract audit — issue #265

**Verdict:** REJECT

**Reviewed tree:** accepted head `b87d6b6e3975f8a1e393f1a6e803694e97c52cae`, byte-identical to squash merge `858ea6d7848923f39bc2ee0c1fd6eb82a207ad93`

## Blocking findings

1. **HIGH — M3 live status is inside the busy subtree.** The approved M3 artifact requires the polite status outside the `aria-busy="true"` fragment so assistive technology does not defer its announcement. Render the status as a sibling and add a browser assertion constraining that relationship.
2. **HIGH — M3 omits the reviewed stable loading geometry.** Restore the token-derived `calc(var(--sk-space-12) * 4)` minimum block size and add a rendered geometry assertion derived from the token. Regenerate and review the M3 visual baseline.
3. **MEDIUM — matching-marker pushed time has no rendered caller.** Route an explicitly matching marker through one coherent story, then prove the rendered Pushed row appears only there while an unsupplied route remains absent.
4. **LOW — #265 story-ratchet provenance is stale.** Correct the narrative from the obsolete 381 → 395 integration state to the final pre-merge 391 → 405 state without changing the executable 405-story ratchet.

## Re-review contract

- Preserve the Storybook-only, public-composition boundary and all prohibited-scope exclusions.
- Run the focused three-engine Mission Reading suite, composition and theme gates, Storybook build, all-story axe, and visual regression.
- Review regenerated visual evidence at the exact corrective head.
- Rebase onto the latest `train/elements-first`; any head change invalidates CI and review evidence.
