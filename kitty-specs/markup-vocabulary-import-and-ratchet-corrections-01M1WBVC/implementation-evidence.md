# Implementation evidence — #216, #219, #220

Mission `markup-vocabulary-import-and-ratchet-corrections-01M1WBVC`, on
`mission/markup-vocabulary-import-and-ratchet-corrections`, based on `train/elements-first@1f95a35`.

## #216 — the generator, and the conversion that proves it

### What changed

`scripts/build-element-markup.mjs` evaluated each `*.markup.ts` from a `data:` URL. A `data:` URL
has no hierarchical base, so **no** import resolved there and the generator said so in a named
error. Per the operator ruling of 2026-09-06 it now imports each module from
`pathToFileURL(src).href` — the module's own path — with two synchronous `module.registerHooks`
hooks:

- `resolve` retargets a relative `.js` specifier that has no file behind it onto its `.ts` sibling.
  This is not optional: every relative import in this repository is written `.js` over a `.ts`
  source, and Node reports `ERR_MODULE_NOT_FOUND` for exactly that, measured before the change.
- `load` runs the already-pinned `esbuild.transformSync` over any `file:` URL ending `.ts`.

esbuild stays the transformer deliberately. Node 22.18+ strips types natively and would work, but
it is erasable-syntax-only and gated on the runner's Node **minor** (`node-version: '22'` resolves
to whatever 22.x is current). The change is *where* a module is evaluated, not *what* understands
the language.

`STATUS_TONES` moved to `packages/elements/src/status-indicator/status-tones.ts`, a leaf with no
imports, re-exported unchanged from `sk-status-indicator.ts`. It had to move: the element imports
`lit` and, through `define.js`, patches `customElements.define` at module scope, so the generator
cannot evaluate anything that reaches it.

`sk-card.markup.ts` now imports `STATUS_TONES` and derives `CARD_STATUSES`. `CardStatus` is aliased
to `StatusIndicatorTone` rather than left as `keyof typeof CARD_STATUSES`, because
`Object.fromEntries` widens keys to `string` and `isCardStatus` would have stopped narrowing.

### The generated markup is unchanged — verbatim

Regenerated cache-free after the conversion:

```
$ node scripts/build-element-markup.mjs        # 10 components, 20 files written
$ git status --short packages/styles
                                               # (no output)
$ diff markup-baseline.md5 markup-after.md5    # md5 of all 62 committed generated files
                                               # (no output)
$ node scripts/build-element-markup.mjs --check
✅ Generated markup is up to date (10 component(s)).
```

The baseline md5 set was taken on `1f95a35` before any edit. 62 files, identical before and after.

### The named failure survives, demonstrated red-first

Three scratch `*.markup.ts` modules, each run through the generator and then deleted:

```
--- unresolvable relative import ---
❌ packages/elements/src/stub/sk-scratchprobe.markup.ts could not be loaded by the generator:
   Cannot find module '…/packages/elements/src/status-indicator/does-not-exist.js' imported from …
   The generator evaluates a *.markup.ts in a bare Node process. It may import a LEAF
   module — one with no imports of its own, e.g. status-indicator/status-tones.ts — and
   it may NOT import anything that needs a browser: every sk-*.ts element reaches `lit`
   and registers a custom element at module scope. Point the import at a leaf, or move
   the shared part into one.
exit=1

--- imports the ELEMENT (needs a browser) ---
❌ packages/elements/src/stub/sk-scratchprobe.markup.ts could not be loaded by the generator:
   CSSStyleSheet is not defined
   … (same guidance) …
exit=1

--- imports the LEAF (the supported case) ---
❌ Generated markup is stale …  packages/styles/src/scratchprobe/sk-scratchprobe.html
```

The third is the success signal: the module loaded, produced output, and the only complaint was
that the (scratch) component's artifacts were not committed.

For contrast, the same relative-import probe against the **pre-fix** generator on `1f95a35`:

```
❌ … could not be loaded by the generator:
   Failed to resolve module specifier "../status-indicator/status-tones.js" from
   "data:text/javascript,import%20%7B%20STATUS_TONES%20…": Invalid relative URL or base scheme is
   not hierarchical.
   A *.markup.ts is evaluated from a data: URL and therefore has NO module base — it
   must be a leaf module with no relative imports. …
```

### The parity test is gone because it is unnecessary, not because it was deleted

`fixtures/elements-behaviour/src/sk-card.test.ts` used to assert
`expect(Object.keys(CARD_STATUSES)).toEqual([...STATUS_TONES])` — membership **and** order.

`CARD_STATUSES` is now `Object.fromEntries(STATUS_TONES.map(...))`. There is no second list. The
assertion could only compare a derivation with the array it was derived from, so it can no longer
fail for the reason it was written, and the fork it existed to detect is not representable.

What it *also* asserted — that every value is this block's BEM family — is **kept**, standing on
its own with a non-vacuity floor, because the derivation constrains the keys and not the template
literal. A map deriving its keys from `STATUS_TONES` and its values from another component's block
would satisfy the derivation and still be wrong.

Measured, so "no coverage was lost" is a number and not a claim: **398 tests green before, 398
after** (`git stash -u`, run, pop). One test replaced by one test.

`mutations.json` gains a `$comment` recording that the arm-less boundary its #177 note named — the
fourth time this programme reached a claim with no ADR-11 id — was closed from the other end, and
that the mutation count is unchanged because an arm editing one list would now edit both.

### `sk-notice` needed no conversion — measured

`#216`'s sequencing note said the implementing mission converts **both** `sk-card` and `sk-notice`.
Measured, `sk-notice` was never affected:

- `packages/elements/src/notice/sk-notice.ts:4` already imports `STATUS_TONES` directly.
- It authors no `*.markup.ts` (there is no static form for an announcement-bearing element), so it
  never met the `data:`-URL constraint at all.
- `fixtures/elements-behaviour/src/sk-notice.test.ts` derives its loops from `STATUS_TONES` and
  carries no parity assertion to remove.

Nothing in `packages/elements/src/notice/**` changed in this mission.

### The `build-vue-types.mjs` half REMAINS — measured, not assumed

`#216` records a second, independent constraint: `build-vue-types.mjs` copies an attribute's
manifest `type.text` verbatim into `packages/elements/vue.d.ts`, which imports nothing, so the
element's field annotation cannot be a type alias.

Probed directly after the fix: `sk-card.ts`'s `declare status:` was changed to
`StatusIndicatorTone | undefined`, the manifest regenerated cache-free, and the Vue types rebuilt.

```
packages/elements/vue.d.ts:105:      'status'?: StatusIndicatorTone | undefined;

$ node scripts/check-vue-template-types.mjs
❌ Vue template types:
   packages/elements/vue.d.ts(105,18): error TS2304: Cannot find name 'StatusIndicatorTone'.
```

So the half remains, and the union stays spelled inline. The probe was reverted; `vue.d.ts` is
byte-identical to the committed file. Note the generator *does* emit `import('…')` types — but only
on the `x-spec-kitty-property-only` branch, which attributes do not take. That is where a fix would
start, and it is a change to a second generator's emit strategy with no ruling behind it, so this
mission did not force it.

### Generated artifacts that legitimately changed

| file | change | why |
|---|---|---|
| `packages/elements/custom-elements.json` | `CARD_STATUSES` type text `{ … six literals … }` → `Readonly<Record<StatusIndicatorTone, string>>`, and its `default` becomes the `Object.freeze(Object.fromEntries(...))` expression | the analyzer records the markup module's declaration, and the declaration is now a derivation |
| `packages/elements/SIZES.md` | `dist/index.js` 154640 → 154571 raw bytes, IIFE 171874 → 171797, file count 45 → 46, SRI hash updated | the bundle loses six literal strings and gains one source file. Regenerated after a real `nx run-many --target=build --skip-nx-cache`; the gzip columns are unchanged |

Everything else generated is byte-identical: `packages/react/src` (55 files), `vue.d.ts`, all
element CSS modules, all static markup.

## #219 — one id, and the principle written down

`expected-stories.json` before: **180** ids, prefixes exactly `elements` and `primitives`.
(An earlier reading of this file gave 160 — that is the figure its own last `$comment` note leaves
a reader with, and it is three missions stale. Counted, not read.)

Added: `components-card--statuses-greyscale`, under a `sk-card (static path)` key. Total 180 → 181.

Why that id and no other: `kitty-specs/card-status-tone-axis-01M1VJNY/implementation-evidence.md`
names `Greyscale` **and** `StatusesGreyscale` as its proof that a status tone is never the sole
carrier of meaning. #177 ratcheted the element-layer half; the static half was outside — and the
static path is the no-JavaScript consumer ADR-10 §3 exists to serve.

Verified against a real build rather than an export name:

```
apps/storybook/storybook-static/index.json — 336 entries
components-card--statuses-greyscale: present, type "story"
declared 181 == "total" 181, missing []
with that entry removed from the index: missing ['components-card--statuses-greyscale']
```

The `$comment` now states the scope that replaces the exhausted one — the elements, plus any story
a mission has named as acceptance evidence — and the principle: **a story cited as proof is
ratcheted in the same commit that cites it.**

**Not the whole `packages/styles` catalogue.** #219 raises that as an open question and it is a
larger scope decision than a follow-up mission should take. The sweep that bounds the narrow fix:
`kitty-specs/` holds exactly **one** `implementation-evidence.md` today, and it cites exactly one
styles-layer story. There is no backlog of cited-but-unratcheted stories behind this one.

## #220 — the doc moves, the artifact does not

Measured from the generated catalogue: the generator bins by prefix only, and the real categories
are `--sk-status-` → `status` and `--sk-on-` → `on` (11 tokens: five `--sk-on-tint-*`, six
`--sk-on-status-*`).

`docs/contributing/adding-a-token.md`'s single `--sk-status-` / `--sk-on-status-` row becomes two
rows naming the real categories, plus a short section stating the convention: `on` is the union of
every `--sk-on-*` token whatever it pairs with, which is why `--sk-on-tint-mint` already sits away
from its own pair `--sk-surface-tint-mint`; pairing says which tokens you must add together, and is
not what `categories` groups by.

This is #220's **option 2**, taken deliberately. Option 1 (bin by pair) changes a published
artifact that Stylelint and the docs site consume; per the mission brief that belongs to the
operator, not to a follow-up. `packages/tokens/dist/token-catalogue.json` is untouched.

## Gate results, run locally before the PR

`build-element-markup --check`, `build-elements-css --check`, `build-styles-only-markup --check`,
`build-react-wrappers --check`, `build-vue-types --check`, `check-vue-template-types`,
`check-vue-packed-types`, `check-manifest-content`, `check-elements-entries`,
`check-adopted-css-boundaries`, `check-element-css-hygiene`, `check-no-css-in-source`,
`check-part-ratchet`, `check-story-theme-wrapper`, `check-gate-wiring`, `check-adr-index`,
`check-llms-adr-surface`, `check-commitlint-config`, `check-release-graph`, `check-offline-load`,
`gate-selftest`, `measure-elements-sizes --check`, `typecheck-all` (5 projects),
`nx run-many --target=lint --all --skip-nx-cache`, `quality:stylelint`, `quality:htmlhint`,
`npm test` (398 tests, 39 files), `run-axe-storybook` — all green.

## Not done, deliberately

- **The whole styles catalogue is not opted into the ratchet.** #219 asks the question; the
  operator answers it.
- **The catalogue binner is not changed.** #220's option 1/3 alter a published artifact.
- **`build-vue-types.mjs` is not changed.** The constraint is confirmed to remain; forcing it was
  explicitly out of scope.
- **The three duplicated escaping helpers are not merged.** #163 owns that, and it is now unblocked
  by this change — the comments justifying each copy said the generator made sharing impossible,
  and they have been corrected to say it no longer does.
- **The suite-time ceiling is untouched** at 881.9s; #225 carries the ruling that funds the
  filtered-suite redesign.
