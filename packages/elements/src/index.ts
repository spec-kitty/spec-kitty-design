export { define } from './define.js';
export { SkStub } from './stub/sk-stub.js';
export { SkCard } from './card/sk-card.js';

/**
 * The generated constructed stylesheet, exported so a test can assert PROVENANCE.
 *
 * Asserting `adoptedStyleSheets[0] === Ctor.styles[0]` is a tautology — Lit adopts
 * whatever the class declares, so it holds for any sheet, including a hand-authored one.
 * The real claim is that the adopted sheet is the one generated from
 * @spec-kitty/styles, and that needs this export to be checkable from outside without
 * reaching across a project boundary.
 */
export { default as skStubSheet } from './stub/sk-stub.css.js';
