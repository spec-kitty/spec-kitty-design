# Spec Kitty train usage

## Read Order

1. Read `DESIGN.md` for visual and behavioral rules.
2. Paste `tokens.css` verbatim into the artifact's first style block.
3. Ground available data and actions in the current product backend.
4. For every component you emit, find it in `DESIGN.md`'s generated section, read its page
   `components/<name>.html`, and copy that page's `<style>` block and markup verbatim. Use only the
   classes listed for it there: the vocabulary is closed, and a class not listed does not exist.
   `components.html` holds all 34 pages at once (430 KB); do not load it into context.
5. For current Team Kitty work, prefer the native `checkbox-choice-group`, compact
   `event-timeline`, route/flush `action-row`, and truthful `sk-copy-field` contracts added
   through train issues #289, #273, #288, and #257.
6. For Mission Reading M1–M8, start from the landed `Patterns/Mission Reading` family in
   `packages/elements/src/patterns/mission-reading.stories.ts` (#292); do not recreate its shell,
   drawer, truth regions, or state fixtures from screenshots.
7. Use `sk-app-shell presentation="rail-preserving"` (#274) when the product requires the personal
   rail to survive through the 1100px shell-relative threshold; keep its controlled drawer and
   dismissal wiring consumer-owned.

## Design Highlights

- Dark-first developer-tool surfaces with a warm cream light theme.
- Falling Sky headings, Swansea/system body copy, and monospace technical facts.
- A 56px personal rail plus 240px context sidebar for desktop Team Kitty shells.
- A source-defined rail-preserving shell mode for intermediate and narrow layouts that must keep
  personal navigation while collapsing only the context sidebar.
- Restrained yellow focus and action emphasis, with semantic status/tint pairs.
- Dense, semantic components that leave product state and behavior to the consumer.
- `sk-copy-field` reports copied/manual/failed outcomes without leaking its supplied value.

## Do

- Preserve every `--sk-*` token name and value.
- Use existing Spec Kitty component contracts before composing a new pattern.
- Pair surfaces with their documented foreground tokens.
- Use native semantics, visible focus, honest states, and responsive reflow.

## Avoid

- Do not translate the token namespace into generic OpenDesign aliases.
- Do not invent routes, fields, timestamps, filters, polling, or calculations.
- Do not use gradients, glass effects, remote dependencies, emoji, or icon fonts.
- Do not infer visual rules from old screenshots when current source disagrees.
