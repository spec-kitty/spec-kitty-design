# Spec Kitty train usage

## Read Order

1. Read `DESIGN.md` for visual and behavioral rules.
2. Paste `tokens.css` verbatim into the artifact's first style block.
3. Ground available data and actions in the current product backend.
4. For every component you emit, find it in `DESIGN.md`'s generated section, read its page
   `components/<name>.html`, and copy that page's `<style>` block and markup verbatim. Use only the
   classes listed for it there: the vocabulary is closed, and a class not listed does not exist.
   `components.html` holds every page at once and is far too large to load into context.
5. Emit only components that have a page. The generated section also names the shadow-DOM-only
   elements (the app shell, headers, metrics, notices, the copy field, charts, the confirm dialog):
   they cannot be emitted here, so leave them out or mark where one belongs, never approximate them.
6. For current Team Kitty work, prefer `checkbox-choice-group`, the compact `event-timeline`, and
   `action-row` (see `DESIGN.md` for its link and flush forms, which its page does not show).

## Design Highlights

- Dark-first developer-tool surfaces with a warm cream light theme.
- Falling Sky headings, Inter body copy and UI, and monospace technical facts.
- A 56px personal rail plus 240px context sidebar for desktop Team Kitty shells (layout tokens;
  the shell element itself cannot be emitted).
- Restrained yellow focus and action emphasis, with semantic status/tint pairs.
- Dense, semantic components that leave product state and behavior to the consumer.

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
