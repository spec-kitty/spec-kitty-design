# Using tokens

The `@spec-kitty/tokens` package publishes a single CSS file (`tokens.css`) containing all `--sk-*` custom properties. Load it once, then reference tokens anywhere in your stylesheets.

## Installation

### Plain HTML (CDN — no build step required)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@spec-kitty/tokens/dist/tokens.css">
<style>
  .my-heading {
    font-family: var(--sk-font-display);
    color: var(--sk-fg-default);
  }
</style>
```

### npm

```bash
npm install @spec-kitty/tokens
```

### Angular project setup

After installing via npm, register `tokens.css` in your `angular.json` build options so it is bundled with your application:

```json
// angular.json -> projects -> yourApp -> architect -> build -> options
"styles": ["node_modules/@spec-kitty/tokens/dist/tokens.css"]
```

### SCSS global stylesheet

```scss
// Import in your global stylesheet
@import '@spec-kitty/tokens/dist/tokens.css';

.hero-title {
  font-family: var(--sk-font-display);
  font-weight: var(--sk-weight-extrabold);
  color: var(--sk-fg-default);
}
```

## Using `--sk-*` properties

Every token is a CSS custom property prefixed with `--sk-`. Reference tokens directly in any CSS rule:

```css
.card {
  background: var(--sk-surface-card);
  border: var(--sk-border-width-1) solid var(--sk-border-default);
  border-radius: var(--sk-radius-md);
  color: var(--sk-fg-on-card);
}

.cta-button {
  background: var(--sk-color-yellow);
  color: var(--sk-fg-on-primary);
  border-radius: var(--sk-radius-pill);
}
```

Never use hardcoded hex, rgb, or hsl values — the token layer is the single authoritative colour, spacing, and typography source.

## Semantic pairing rule

Every surface token has a paired foreground token. Always use them together to ensure sufficient colour contrast:

| Surface | Use with |
|---|---|
| `--sk-surface-page` | `--sk-fg-default` |
| `--sk-surface-card` | `--sk-fg-on-card` |
| `--sk-color-yellow` (CTAs) | `--sk-fg-on-primary` |
| `--sk-surface-tint-mint` | `--sk-on-tint-mint` |
| `--sk-surface-tint-butter` | `--sk-on-tint-butter` |
| `--sk-surface-tint-lilac` | `--sk-on-tint-lilac` |
| `--sk-surface-tint-sky` | `--sk-on-tint-sky` |
| `--sk-surface-tint-rose` | `--sk-on-tint-rose` |
| `--sk-status-<tone>` | `--sk-on-status-<tone>` |

Mixing an unpaired surface and foreground token is a visual identity violation — it will fail the design review quality gate.

### Operational status tones

`--sk-status-neutral|info|success|attention|danger|recovery` and their `--sk-on-status-*`
foregrounds are **semantic aliases** over the tint family — they add meaning, not colour. Every one
of the twelve is a single `var()` onto a token listed above: the five non-neutral surfaces onto
`--sk-surface-tint-*`, their five inks onto `--sk-on-tint-*`, and the neutral pair onto
`--sk-surface-muted` / `--sk-fg-muted`. The vocabulary is `sk-status-indicator`'s, one tone set for the whole library;
`sk-card`'s `status` attribute is its first other consumer.

**"Resolves to a token above" is true of this layer and not of the one beneath it.** This paragraph
used to say every status token "resolves to a token above", full stop, which reads as though the
chain ends in the brand palette. It does not. Three of the tint values a status token points at are
literals rather than further aliases — `--sk-surface-tint-rose` in both themes and
`--sk-on-tint-rose` in light (#177, ratified under #217) — so `--sk-status-danger` and
`--sk-on-status-danger` bottom out in hex, and in the **light** theme every tint surface and every
on-tint ink is a literal, because the `--sk-color-*-bg` tokens are dark-mode surfaces with no light
counterparts. Nothing about consuming these tokens changes: you still use `--sk-status-<tone>` and
never the value it resolves to. What changes is what you can assume when reading the file — if you
are adding to the family rather than consuming it, the rule is in
[`docs/contributing/adding-a-token.md`](../contributing/adding-a-token.md#completing-a-family-is-not-the-same-as-introducing-a-hue).

Use `--sk-status-<tone>` as a surface and `--sk-on-status-<tone>` as the foreground or edge on
it. Both pass AA in both themes against their own pair and against `--sk-fg-body`; the measured
ratios are recorded beside the declarations in `packages/tokens/src/tokens.css`.

**A tone is presentation, never the message.** Whatever the tone says, the visible text has to
say too — a surface that is the sole carrier of "this failed" disappears in greyscale, in
`forced-colors: active`, and for a reader with a colour-vision deficiency.

That is not a hypothetical for these tokens, and the light theme is the case to hold in mind.
Measured against `--sk-surface-page` (#F8F5EC), **every** light status surface sits between
**1.01:1** and **1.19:1** — attention (#FFF6D9) is the lowest at 1.01, success 1.04, info and
recovery 1.08, danger 1.11, neutral 1.19. These are high-key tints by design and they are doing
almost no work on their own: in light mode the 4px edge and the consumer's own text carry the
axis, and the surface is close to decoration. Dark is only a little stronger (1.25:1 for
attention). Build accordingly.

## Token catalogue reference

The full list of tokens across all 13 categories (colour, surface, foreground, border, spacing, radius, typography, shadow, and more) is available in two places:

- **Machine-readable catalogue**: `packages/tokens/dist/token-catalogue.json` in the repository
- **Interactive reference**: [Storybook — Design Tokens](https://stijn-dejongh.github.io/spec-kitty-design/?path=/docs/design-tokens--docs) — browse tokens by category with live swatches
