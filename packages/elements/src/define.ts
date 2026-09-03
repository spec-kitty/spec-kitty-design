/**
 * Guarded custom-element registration (ADR-10 §5).
 *
 * `customElements.define` throws on a duplicate tag name. That is reachable in
 * ordinary use — the ESM and IIFE artifacts on one page, two copies of the bundle
 * behind different import specifiers, or a consumer that already registered the
 * tag — and a throw there takes down the whole page, not just the second copy.
 * So: warn and no-op.
 *
 * KNOWN INTERACTION WITH THE MANIFEST (#70 / WP05). The Custom Elements Manifest
 * analyzer cannot follow this indirection. Measured with analyzer 0.11.0:
 *
 *   customElements.define('sk-stub', SkStub)  -> manifest names the element "sk-stub"
 *   define('sk-stub', SkStub)                 -> element gets NO definition, and this
 *                                                module emits one named literally "tag"
 *
 * ADR-11 generates the React wrapper FROM that manifest, so a wrong manifest
 * propagates into generated code. Every element therefore carries an explicit
 * `@element <tag>` JSDoc annotation, and WP05's CI check asserts the manifest
 * contains no definition named "tag". Do not remove either without replacing the
 * other.
 */
export function define(tag: string, ctor: CustomElementConstructor): void {
  const existing = customElements.get(tag);
  if (existing) {
    if (existing !== ctor) {
      console.warn(
        `[@spec-kitty/elements] <${tag}> is already registered by a different ` +
          `constructor; keeping the existing registration. This usually means two ` +
          `copies of the package are loaded (for example the ESM and IIFE artifacts ` +
          `on the same page).`
      );
    }
    return;
  }
  customElements.define(tag, ctor);
}
