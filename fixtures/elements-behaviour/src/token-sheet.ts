/**
 * Loads the REAL @spec-kitty/tokens sheet into the document, for tests that assert computed
 * values.
 *
 * WHY THE REAL SHEET. An earlier version of sk-card.test.ts injected fabricated token values,
 * which meant it asserted only that a component's CSS DEREFERENCES a token — never that the
 * token package DEFINES it. A lens measured the consequence: deleting the two light-block
 * declarations from tokens.css killed light mode for every real card and the suite stayed
 * green. Three test files now depend on this, and the reason travels with the helper.
 *
 * WHY THIS IS NOT A vitest `setupFiles` ENTRY. sk-nav-pill, sk-form-input, sk-form-textarea
 * and sk-stub deliberately do NOT load the token sheet, and a global setup would silently
 * change their computed styles. The per-file import keeps that opt-in explicit.
 */
let current: HTMLStyleElement | undefined;

export async function installTokenSheet(): Promise<void> {
  const { default: tokensCss } = await import('@spec-kitty/tokens/tokens.css?raw');
  document.body.innerHTML = '';
  current?.remove();
  const style = document.createElement('style');
  style.textContent = tokensCss;
  document.head.append(style);
  current = style;
}
