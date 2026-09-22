/**
 * WCAG relative-luminance contrast, for tests that assert a real computed pairing.
 *
 * ONE COPY. This formula was written out twice — byte-identical — in sk-pill-tag.test.ts and
 * sk-check-bullet.test.ts, and three lenses flagged the duplication in the same pass. Two
 * independent implementations of one spec formula drift, and a drifted copy fails PERMISSIVELY:
 * it reports a passing ratio for a pairing that does not pass. Unlike a `*.markup.ts` module,
 * fixtures are not leaf modules — they already share `./token-sheet.js` — so there is no reason
 * for a second copy.
 *
 * Accepts the `rgb()` / `rgba()` strings `getComputedStyle` returns.
 */
export function contrast(fg: string, bg: string): number {
  const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = (c: string) => {
    const parts = c.match(/[\d.]+/g);
    // REFUSE A TRANSLUCENT SURFACE rather than scoring it as opaque. `getComputedStyle` returns
    // `rgba(0, 0, 0, 0)` for an unset background, and the old code sliced off the alpha and
    // measured pure black — which fails PERMISSIVELY in the direction that matters: a white ink
    // on "nothing" reads 21:1 and passes. A lens flagged that the docstring advertised rgba()
    // support while silently discarding the channel that makes it meaningful.
    if (parts && parts.length > 3 && Number(parts[3]) !== 1) {
      throw new Error(
        `contrast() was given ${c}, which is not opaque. Alpha is discarded by the WCAG formula, ` +
          `so measuring it would score a colour that is not what renders — most likely the ` +
          `surface under test was never painted. Paint it, or composite it yourself first.`,
      );
    }
    const [r, g, b] = parts!.slice(0, 3).map((n) => channel(Number(n) / 255));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const [a, z] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a! + 0.05) / (z! + 0.05);
}

/**
 * Assert that a both-themes loop actually saw two themes.
 *
 * THE HOLE THIS CLOSES, which two lenses found in the same arm: a loop over `['dark','light']`
 * that only asserts a ratio per theme passes just as happily when the light iteration silently
 * renders the DARK palette. Delete `.sk-light` from the `:root[data-theme="light"], .sk-light`
 * selector in tokens.css and the light arm measures #8FCB8F on #0D0E11 = 10.21:1 — green, while
 * every light page is back to the 1.73:1 the arm exists to catch. A second dark arm wearing a
 * light label.
 *
 * `sk-card.test.ts` and `sk-grid.test.ts` already assert the two themes differ by literal value;
 * the contrast arms did not.
 */
export function assertThemesDiffered(seen: Map<string, string>): void {
  // A FLOOR FIRST. `new Set(values).size === seen.size` is trivially true for a map with one
  // entry and for an EMPTY one, so a loop that visited one theme — or none — passed the guard
  // that exists precisely because the loop cannot be trusted. That is a green line over an
  // empty set, inside the helper written to refuse green lines over empty sets; a lens caught
  // it. Every caller loops a literal two-element array today, so nothing was live.
  if (seen.size < 2) {
    throw new Error(
      `assertThemesDiffered saw ${seen.size} theme(s); it needs at least two to compare. The ` +
        `loop that fills this map did not run over both themes.`,
    );
  }
  const values = new Set(seen.values());
  if (values.size === seen.size) return;
  throw new Error(
    `the themes did not resolve different surfaces — ${[...seen]
      .map(([theme, bg]) => `${theme}=${bg}`)
      .join(', ')}. A light arm measuring the dark palette passes for the wrong reason.`,
  );
}
