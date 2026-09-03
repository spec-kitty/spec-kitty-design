# Component Authoring Rules

> **Rewritten for the elements-first architecture (#76).** This file previously required
> `Mobile` and `Desktop` story exports, described Angular-versus-HTML "framework isolation", and
> pointed at `packages/angular/src/lib/stub/` — a package deleted in #102. It also listed four CI
> gates when the recipe's block is far longer. It is the rule loaded for "writing component code", so #77–#79 would
> have inherited every one of those.

## Where a component lives

Since ADR-8 the component **is** a custom element. Two packages, and you author in both:

- `packages/styles/src/<name>/` — `sk-<name>.css`, the CSS source of record.
- `packages/elements/src/<name>/` — `sk-<name>.ts` (the element) and `sk-<name>.markup.ts` (the
  **authored** markup). The static `.html` and the styles-layer module are **generated** from
  that markup module and CI fails if they drift, so never hand-edit them and never hand-write
  markup in a story — render from the generated exports.

`packages/react/` is generated in full. You add nothing there.

**Follow [`docs/contributing/adding-a-component.md`](../../../docs/contributing/adding-a-component.md)**
— it is the maintained recipe and the authority for gates, the markup contract and the
ratchets. This file covers stories and a11y, and repeats the documentation rules below because an
agent loads *this* file to write component code and must not need a second fetch to know that a
doc comment is published. Where the two disagree, the recipe wins.

## Story structure (required)

```typescript
export const Default: Story = {};      // MANDATORY
export const LightMode: Story = {};    // REQUIRED by review — see below
```

Plus one export per meaningful state the component actually has (`Disabled`, `Error`, `Open`,
`Blue`, `Inset` — whatever it owns). Do **not** add `Mobile` and `Desktop` reflexively: two
stories in the repo have them because those components are genuinely responsive, and adding them
elsewhere is story count without coverage.

### `LightMode` is not optional, and it is easy to get wrong

Wrap in `class="sk-light"` — **not** `data-theme="light"`. The token block anchors on
`:root[data-theme="light"], .sk-light`, and `:root` only matches `<html>`, so `data-theme` on a
wrapper element activates nothing (#93).

**No lint catches a missing `LightMode`** — `expected-stories.json` covers only the form
elements today, so this is enforced by review. `sk-nav-pill` currently ships without one, which
makes it a poor model for this rule even though it is the right model for events.

**Verify it renders light styling; do not assume it.** Assert a computed value under both themes
and require them to differ — `fixtures/elements-behaviour/src/sk-card.test.ts` is the only
cross-theme assertion in the repo and the one to copy. A `LightMode` story that renders dark is
the failure this rule exists to catch, and it looks identical to a passing one in a screenshot.

**Do not copy a styles-layer story for this.** Six of the seven wrap in `data-theme="light"`,
which is the inert form; `packages/styles/src/card` is the compliant one.

## a11y requirement

Every story must enable axe-core:

```typescript
parameters: { a11y: { disable: false } }
```

Never `a11y: { disable: true }` in a production story. Waivers go in the story description with
a tracking issue link.

## Documenting the component

**Doc comments on the element are published API.** The manifest analyzer copies each description
into `custom-elements.json`, it propagates onto the attribute, and the React generator copies it
into the prop docs a consumer reads in their editor. So:

- Document every public reactive property and public method. `check-manifest-content.mjs`
  **refuses** a manifest where one has no description — an undocumented property fails CI.
- `@fires` needs a `{Type}`: `@fires {CustomEvent<{ open: boolean }>} sk-<name>-toggle - …`.
  Without it the React handler's `detail` is untyped.
- Declare `@slot`. The analyzer will not infer one from a `<slot>` in the template.
- Terminate a `@csspart` tag before any prose, or the description swallows the rest of the block.
- **Keep rationale in `//`, never in a doc comment.** A `/** */` above a public member ships
  verbatim to consumers; a `//` reaches nobody. The doc comment is for *what*, the `//` for *why*.

Listing the tokens a component uses in `meta.parameters.docs.description.component` is still
useful and still encouraged.

## Register the component in the three ratchets

None is discoverable from the code. The first two always apply; the third only when the
component owns behaviour — nothing detects that it should, so declaring an entry is what creates
the obligation:

| file | what to add |
|---|---|
| `expected-parts.json` | every `@csspart` **and bump `total`**; the test must live under `fixtures/**/src/**/*.test.ts` or `tests/**/*.test.ts` (shrink-only) |
| `expected-docs.json` | a row with the element's attribute and method counts, **and bump `total`** (**exact** equality) |
| `behaviours.json` | a **subject** entry on the ids it owns, plus a `mutations.json` entry naming the same subject file — only if it owns behaviour |

## Reference implementation

`packages/elements/src/card/` is the simplest complete element; `packages/elements/src/nav-pill/`
adds an event; `packages/elements/src/form-input/` adds form association. `sk-stub` is the
deliberate empty case several gates are floored against — read it to see the minimum, not as a
pattern to copy.

## CI gates a new component must pass

The authoritative list is the recipe's §7. It is not duplicated here, because a second copy
drifts. It is materially longer than the four commands this file used to name, and the ones
most likely to reject a first attempt are the manifest content gate, the wrapper drift check, and the
distribution-entry check. Run the recipe's block before opening a PR.
