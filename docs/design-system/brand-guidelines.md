# Brand guidelines

This document is the consumer-facing reference for building Spec Kitty-branded interfaces. It covers voice, colour, typography, iconography, and the mascot usage policy.

---

## Voice

The Spec Kitty brand voice is composed, direct, and concrete. It avoids hype, filler words, and exclamatory punctuation.

### Rules

- **Sentence case** for all headings and labels. Never title case.
- **No emoji** on any surface — not in docs, not in UI, not in commit messages.
- **No exclamation marks.** The brand voice is calm and credible, not exclamatory.
- **Concrete outcomes over abstract claims.** Lead with what the user can achieve, not a vague benefit.
- **POV:** Spec Kitty (third-person product) with "you/your team" for the reader. Rarely "we". Never "I".

### Wrong and correct examples

| Situation | Wrong | Correct |
|---|---|---|
| Headline | "Bring Structure To AI-Assisted Delivery" | "Bring structure to AI-assisted delivery" |
| Feature benefit | "Our AI-powered workflow engine optimises your delivery pipeline." | "Developers spend time building, not being blocked on finalized requirements." |
| CTA label | "GET STARTED NOW!" | "Get started" |
| Status message | "All checks passed! " | "All checks passed." |
| Canonical term | "Create a feature spec and break it into tasks." | "Create a Spec and break it into Work Packages." |

### Canonical product nouns

Always capitalise these when referring to Spec Kitty concepts; never capitalise them when used generically:

`Specs`, `Plans`, `Work Packages`, `Missions`, `Decision Moments`, `Charter`, `Doctrine`

---

## Colour palette

Dark mode is the default surface. The page background is `--sk-surface-page` (#0A0A0B).

### Brand accent colours

| Token | Hex | Use case |
|---|---|---|
| `--sk-color-yellow` | #F5C518 | Primary CTAs, active indicators, focus rings, the mascot's bow tie |
| `--sk-color-yellow-soft` | — | Subtle yellow tint backgrounds |
| `--sk-color-haygold` | — | Secondary warm accent |
| `--sk-color-green` | — | Success states |
| `--sk-color-red` | — | Error states only |
| `--sk-color-blue` | — | Informational states |
| `--sk-color-purple` | — | Decorative tint panels |
| `--sk-color-sage` | — | Neutral-warm accent |

Yellow is the primary accent. Use it sparingly: primary CTAs, active nav indicators, focus rings. Never use it for body text or decorative borders.

### Dark surface scale

| Token | Purpose |
|---|---|
| `--sk-surface-page` | Base page background |
| `--sk-surface-hero` | Hero section surface |
| `--sk-surface-card` | Card and panel background |
| `--sk-surface-input` | Form input background |
| `--sk-surface-pill` | Pill/tag background |
| `--sk-surface-muted` | Subdued surface for secondary sections |

Sections use flat dark surfaces differentiated by tint, not gradient. No `linear-gradient()` on section backgrounds.

### Tint panels

Four tint variants are available for feature cards and content panels:

| Surface token | Foreground token |
|---|---|
| `--sk-surface-tint-mint` | `--sk-on-tint-mint` |
| `--sk-surface-tint-butter` | `--sk-on-tint-butter` |
| `--sk-surface-tint-lilac` | `--sk-on-tint-lilac` |
| `--sk-surface-tint-sky` | `--sk-on-tint-sky` |

### Semantic pairing rule

Always pair a surface token with its designated foreground token. See [Using tokens — Semantic pairing rule](using-tokens.md#semantic-pairing-rule) for the full table.

---

## Typography

The Spec Kitty type system uses three typefaces, each with a defined role.

| Typeface | Role | Token |
|---|---|---|
| Falling Sky | Headlines, display text, marketing copy | `--sk-font-display` |
| Swansea | Editorial prose, body text, UI labels | `--sk-font-body` |
| JetBrains Mono | Code blocks, terminal output, token names | `--sk-font-mono` |

### Usage guidance

- **Falling Sky** is for high-impact headings only. Do not use it for body copy or UI labels.
- **Swansea** is the default reading typeface. Use it for all paragraph text, form labels, and navigation.
- **JetBrains Mono** is for inline code spans and fenced code blocks. It is the only acceptable typeface for displaying `--sk-*` token names in documentation.

### Type scale

Reference the full type scale — font sizes, weights, and line heights — in the [Storybook Typography page](https://stijn-dejongh.github.io/spec-kitty-design/?path=/docs/design-tokens-typography--docs).

### Eyebrow and stat labels

Eyebrow labels and stat captions use ALL-CAPS monospace with wide letter spacing. Apply `--sk-font-mono` and `letter-spacing: var(--sk-tracking-wide)`.

---

## Iconography

Spec Kitty uses Lucide-style stroke icons throughout the interface.

- **Style:** 2px stroke weight, rounded line caps and joins.
- **Colour:** Icons inherit the foreground token of their context. Use `--sk-fg-muted` for secondary icons, `--sk-fg-default` for primary icons, and `--sk-color-yellow` for active or highlighted icons.
- **No emoji.** Emoji are not used anywhere in the interface, documentation, or commit messages. Use a stroke icon instead.
- **Size:** Icons should align with the surrounding text baseline. Common sizes are 16px (inline) and 20px (standalone).

The icon reference is available in the [Storybook Icons page](https://stijn-dejongh.github.io/spec-kitty-design/?path=/docs/design-tokens-brand--docs).

---

## Mascot policy

The Spec Kitty mascot is a bespectacled cat rendered in a watercolour illustration style.

**Policy C-101:** The mascot is for supporting materials only. It appears in:

- Marketing pages and landing sites
- Documentation (including this guide)
- Slide decks and presentations
- Social media and promotional assets

The mascot must never be embedded in software packages (`@spec-kitty/tokens`, `@spec-kitty/angular`, `@spec-kitty/styles`) or shipped as a dependency of consumer projects. It is a brand illustration asset, not a UI component.

The canonical master illustration is a 1024x1024 PNG. Do not scale it below 64px or use it as a favicon without the approved favicon crop.
