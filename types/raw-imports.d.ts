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
