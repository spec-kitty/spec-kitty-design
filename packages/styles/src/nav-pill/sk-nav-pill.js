/* @spec-kitty/html-js — sk-nav-pill toggle behaviour */

/**
 * Toggle the nav drawer open/closed and synchronize the hamburger button's
 * ARIA state. The drawer element MUST have id="sk-nav-drawer".
 *
 * Side effects are limited to:
 *   - toggling the `is-open` class on the drawer
 *   - setting `aria-expanded` on the button
 *   - setting `aria-label` on the button
 *
 * No-ops (returning false) when the button is null/undefined or when no
 * `#sk-nav-drawer` element exists in the document. Never throws.
 *
 * @param {HTMLElement | null} btn - the hamburger button element
 * @returns {boolean} the new open state — true if the drawer is now open,
 *   false if it is now closed (or the call no-op'd)
 */
export function skToggleDrawer(btn) {
  if (!btn) return false;
  const drawer = document.getElementById('sk-nav-drawer');
  if (!drawer) return false;
  const isOpen = drawer.classList.toggle('is-open');
  btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  btn.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  return isOpen;
}
