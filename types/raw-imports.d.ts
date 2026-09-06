/**
 * `?raw` imports — Vite's "give me the file as a string" suffix.
 *
 * `fixtures/elements-behaviour/src/sk-card.test.ts` loads the SHIPPED tokens.css this way,
 * deliberately: a test that injects fabricated token values asserts only that sk-card.css
 * dereferences a token, never that @spec-kitty/tokens defines it. That gap was the eighth
 * instance of this programme's certifying-absence class.
 *
 * Without this declaration `tsc` cannot resolve the specifier and the fixture project's
 * typecheck target fails — which it did, silently, because CI ran `nx run elements:typecheck`
 * and the fixture is a SECOND project declaring the same target. The run-many step in
 * ci-quality.yml is the other half of that repair.
 */
declare module '*?raw' {
  const content: string;
  export default content;
}

/**
 * `import.meta.glob` — Vite's build-time directory read.
 *
 * Hand-declared here rather than pulled in by adding `vite/client` to a project's `types`
 * array, for the same reason the `*?raw` declaration above is hand-written: the fixture
 * projects list their `types` explicitly, and widening that list changes what every file in
 * them can reach. This declares exactly the one member used.
 *
 * `fixtures/elements-behaviour/src/sk-page-header.test.ts` uses it to walk an element's own
 * import graph. Without this declaration `tsc` reports TS2339 and the fixture project's
 * typecheck target fails — which `scripts/typecheck-all.mjs` catches, because it enumerates
 * every project declaring the target rather than naming one.
 */
interface ImportMeta {
  glob(
    pattern: string,
    options?: { query?: string; import?: string; eager?: boolean },
  ): Record<string, unknown>;
}
