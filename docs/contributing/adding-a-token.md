# Adding a design token

Design tokens are CSS custom properties in `packages/tokens/src/tokens.css`.
The token catalogue (`packages/tokens/dist/token-catalogue.json`) is the
machine-readable source of truth for tooling and agents.

## When to add a token

Add a token when a new visual decision needs to be reusable across surfaces.
Do not add tokens for one-off values that are local to a single component.

## Naming convention (ADR-003)

Pattern: `--sk-<category>-<name>`

| Category | Prefix | Examples |
|---|---|---|
| Brand color | `--sk-color-` | `--sk-color-teal` |
| Surface | `--sk-surface-` | `--sk-surface-sidebar` |
| Foreground | `--sk-fg-` | `--sk-fg-on-sidebar` |
| Spacing | `--sk-space-` | `--sk-space-13` |
| Radius | `--sk-radius-` | `--sk-radius-xs` |
| Operational status | `--sk-status-` / `--sk-on-status-` | `--sk-status-danger`, `--sk-on-status-danger` |

See [ADR-003](../architecture/decisions/2026-05-01-3-token-schema-naming-convention.md) for the
complete category table and naming rationale.

## Steps

1. **Add to `packages/tokens/src/tokens.css`** in the correct category block:
   ```css
   /* ── Brand Colors ── */
   --sk-color-teal: #4ECDC4;  /* add after existing colors */
   ```

2. **Regenerate the catalogue**:
   ```bash
   npm run tokens:catalogue
   ```

3. **Verify Stylelint passes** (the new token is now in the allowlist):
   ```bash
   npm run quality:stylelint
   ```

4. **Commit**:
   ```bash
   git commit -m "feat(tokens): add --sk-color-teal"
   ```

5. **Keep the file's own weight in mind.** This step used to read "check file size stays under
   20 KB" with a `wc -c … # < 20480` command beside it. No gate has ever enforced that number,
   and the file passed it long before anyone noticed: it measured 23,857 bytes at
   `train/elements-first@32fa495`, so the instruction had been silently false for some time and
   is corrected here rather than left to be discovered by the next person who runs it. Most of
   the growth is comments — measured rationale beside the values — which is deliberate and is
   not what a consumer downloads once the sheet is minified. Prefer putting a long derivation in
   the block it explains once, not in both theme blocks.

## A new CATEGORY is more than a new token

A new prefix creates a new category in `packages/tokens/dist/token-catalogue.json`, which is a
published artifact. Add the row to the table above in the same commit, and say in
`docs/design-system/using-tokens.md` what the category *means* — a catalogue entry tells a
consumer the token exists and nothing about when to reach for it. `--sk-status-*` (#177) is the
most recent example.

**Aliases are the cheap way to add a category.** `--sk-status-<tone>` resolves entirely to tokens
that already existed; the category adds meaning, not colour. If a new category needs new colour
values, that is a palette decision and belongs to whoever owns the palette, not to the mission
that happened to need it first.

## Semantic pairing rule

If you add a surface token, also add its foreground counterpart.
`--sk-surface-sidebar` must have a paired `--sk-fg-on-sidebar`.

Using a surface token without its paired foreground token is a contract violation
under ADR-003 and will be flagged in component review.
