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
| Operational status | `--sk-status-` | `--sk-status-danger` |
| On-surface foreground | `--sk-on-` | `--sk-on-status-danger`, `--sk-on-tint-mint` |

See [ADR-003](../architecture/decisions/2026-05-01-3-token-schema-naming-convention.md) for the
complete category table and naming rationale.

### A semantic pair spans two categories, and that is not a mistake

`scripts/generate-token-catalogue.js` bins a token by its **prefix** — the first segment after
`--sk-` — and nothing else. So `--sk-status-danger` is catalogued under `status` and its paired
foreground `--sk-on-status-danger` under `on`, beside every other `--sk-on-*` token.

This row used to read `--sk-status-` / `--sk-on-status-` as one category, which is how the pair
*reads* and not how the published artifact is *shaped* (#220). The catalogue is consumed by
Stylelint and by the docs site, so the binning is what a consumer actually sees, and the doc is
the half that moved.

The convention is older than `--sk-status-*`: **`on` is the union of every `--sk-on-*` token,
whatever it pairs with.** `--sk-on-tint-mint` sits there too, away from its own pair
`--sk-surface-tint-mint`, for the same reason. Pairing is a rule about which tokens you must add
together (see *Semantic pairing rule* below); it is not what the `categories` map groups by. When
you add a pair, expect two catalogue entries in two categories — and add both anyway.

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

**Aliases are the cheap way to add a category.** `--sk-status-<tone>` is one `var()` deep: every
one of the twelve resolves to a `--sk-surface-tint-*`, a `--sk-on-tint-*`, `--sk-surface-muted` or
`--sk-fg-muted`, so the category adds meaning, not colour. Reach for that shape first.

This paragraph used to end: *"If a new category needs new colour values, that is a palette decision
and belongs to whoever owns the palette, not to the mission that happened to need it first."* That
sentence forbade what the palette actually does, and #177 violated it in the same commit that made
the alias claim above true one level up. One level further down, *every* `--sk-status-*` surface
has always bottomed out in a hex literal, in both themes — what #177 did was add three new ones
(`--sk-surface-tint-rose` in both themes, `--sk-on-tint-rose` in light). The operator ratified all
three under #217 with the wording, not the values, named as the thing that had to change. The
counts are in
[`docs/design-system/using-tokens.md`](../design-system/using-tokens.md#operational-status-tones).

### Completing a family is not the same as introducing a hue

**Completing an existing family from an existing hue is yours.** **Introducing a hue is not.** The
line between them is a test you can run on your own case:

0. **Is the slot actually empty, and is your hue distinguishable from every member already in the
   family?** A family member exists to fill a *role* the family is missing — rose exists because
   `--sk-status-danger` had nothing to point at. If the role is already filled, or your hue sits on
   top of a member that is already there, you are not completing anything; you are adding a
   near-duplicate, and that is a palette decision. State the role and the hue distance.
1. **Does the family already exist, with a derivation rule its members visibly follow?** You are
   filling a missing slot in a set like `--sk-surface-tint-*` / `--sk-on-tint-*` — not creating the
   set. If you are creating it, stop; a new family is a palette decision.
2. **Does the hue already exist in `--sk-color-*`?** Some brand-colour token already names it. If
   your hue has no `--sk-color-*` entry, you are introducing a hue, and that is not yours whatever
   the family looks like.
3. **Can you derive the value and show the arithmetic?** The new value has to sit inside the band
   the existing members occupy on every axis the family varies — measured, in a stated colour
   space, not eyeballed — and the pair you add with it has to pass AA in both themes.

Question 0 is first because it is the one a reader running the list will otherwise never ask, and
it is the only one that rejects **`--sk-surface-tint-haygold`**: the family exists (1 ✅),
`--sk-color-haygold: #D9B36A` exists (2 ✅), and it derives cleanly (3 ✅) — three yeses for a sixth
tint at hue **39.5°**, which is **6.7°** from butter's 46.2° and fills no role at all. Compare rose,
which sat **46.2°** from its nearest neighbour and filled the empty danger slot. That gap between
6.7 and 46.2 is the whole of question 0, and questions 1–3 cannot see it. Rose's own justification
was never one of them either: it was *no red or danger surface token existed to alias*.

**Four yeses and it is yours to add**, on these conditions: record the derivation and the measured
bands *beside the declaration* rather than in the commit message, add the paired `--sk-on-*` in the
same commit (the *Semantic pairing rule* below), and declare it in **both** theme blocks. Any no and
the decision is not the mission's — file it and say what you measured.

**Worked, in both directions:**

- `--sk-surface-tint-rose` (#177, ratified #217) — **yes, on all four.** The danger role was
  unfilled and the nearest existing member was butter, 46.2° away (0); the family existed with four members following
  one derivation rule (1); the hue existed as `--sk-color-red` (2); and the value was derived in HLS
  at the hue's own angle, 0°, with L and S inside the siblings' bands (3) — the arithmetic is in
  `tokens.css` beside the declaration.
  What forced a literal rather than an alias is worth recording, because it is the shape of the
  case: **no red or danger *surface* token existed to alias.** `--sk-color-blue-bg`,
  `--sk-color-purple-bg` and `--sk-color-green-bg` exist and are byte-identical to
  `--sk-surface-tint-sky`, `-lilac` and `-mint`; there is no `--sk-color-red-bg`, and
  `--sk-color-red` is a **foreground** (#E97373, "validation errors", and the value of
  `--sk-on-tint-rose`). `--sk-status-danger` therefore had nothing to point at.
- **A teal status surface** — **no.** `--sk-surface-tint-*` exists and a derivation rule exists, so
  question 1 passes; but there is no `--sk-color-teal`, so question 2 fails. That is a new hue in
  the brand palette, and it stays out of the mission's hands however badly the mission needs it.

**One thing this test is not, measured rather than assumed:** the tint family was never
all-aliases, and rose is not the first literal in it — it is the **fifth**. Counted in
`tokens.css`, **all five** dark tint surfaces are hex literals (mint `#15241A`, butter `#2A2410`,
lilac `#1E1A2E`, sky `#14202E`, rose `#2B1515`), and in the **light** block all five surfaces and
all five on-tint inks are literals too; only the dark inks are `var(--sk-color-*)`. Three of the
dark surfaces are *byte-identical to* `--sk-color-blue-bg`, `--sk-color-purple-bg` and
`--sk-color-green-bg`, which is not the same as being aliased by them — butter has no
`--sk-color-yellow-bg` at all, and none of the five references a `--sk-color-*` token. A mission
reading "the siblings are aliases, so mine must be too" would be reading something the file does
not say, and one reading it the other way round might "fix" three literals into `var()`s and split
a five-member family into two spellings.

## Semantic pairing rule

If you add a surface token, also add its foreground counterpart.
`--sk-surface-sidebar` must have a paired `--sk-fg-on-sidebar`.

Using a surface token without its paired foreground token is a contract violation
under ADR-003 and will be flagged in component review.
