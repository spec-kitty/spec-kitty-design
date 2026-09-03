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
/**
 * Every tag this package has registered, in registration order.
 *
 * `define()` is the single registration funnel for every shipped element — verified: no direct
 * `customElements.define` exists outside the test fixtures. So this is the only enumeration of
 * the package's own elements that cannot be evaded, and there is no DOM API that offers one.
 *
 * It exists because `tests/browser/registered-elements.test.ts` originally built its candidate
 * list from `behaviours.json` — the artifact it was checking. A lens smuggled a second
 * form-associated element registered from an existing element file and it was invisible to
 * BOTH lanes: absent from the `sk-*.ts` glob, absent from the manifest, and absent from the
 * candidate list, so the runtime backstop iterated right past it.
 */
export const registeredTags: string[] = [];

/**
 * Record from the PLATFORM entry point, not from this module's own function.
 *
 * The first version pushed inside `define()` and justified itself with "verified: no direct
 * `customElements.define` exists outside the test fixtures" — a point-in-time grep with nothing
 * keeping it true. A pass-2 lens defeated it with one character of indirection:
 *
 *     (customElements as unknown as Record<string, Function>)["define"]("sk-smuggled", Ctor);
 *
 * A literal `customElements.define(…)` call IS caught, indirectly: the manifest analyzer sees
 * it, the manifest changes, and `git diff --exit-code` or config-contract's tag-set equality
 * reds. Computed member access is invisible to all of it — the lens measured that element
 * registered and form-associated at runtime with the manifest byte-identical, 80/80 tests
 * green, and all seven static gates passing.
 *
 * So the array is populated by wrapping `customElements.define` itself. There is no way to
 * register an element without going through it, which is what "unevadable" has to mean.
 * `registeredTags` is then a genuine record rather than a claim about developer discipline.
 */
const nativeDefine = customElements.define.bind(customElements);
customElements.define = function patchedDefine(
  tag: string,
  ctor: CustomElementConstructor,
  options?: ElementDefinitionOptions,
): void {
  nativeDefine(tag, ctor, options);
  // AFTER the native call, so a tag that throws (duplicate, invalid name) is not recorded as
  // registered. Moving this above would make the array claim tags that never registered.
  registeredTags.push(tag);
} as typeof customElements.define;

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
