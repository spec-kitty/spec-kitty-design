/**
 * <sk-stub> — the behaviours the ELEMENTS package owns rather than the synthetic fixture.
 *
 * Named for its subject, not for its role. It was `elements-owned.test.ts`, and #73's
 * derived subject obligation requires a subject's file to be about the element it names —
 * because a pass-2 lens pointed a new element's subject entry at a file that already
 * carried the id and every gate went green. A role-named file cannot satisfy that rule
 * without special-casing, and the special case is what the rule exists to remove.
 */
import { expect, test, vi } from 'vitest';
import { define, SkStub, skStubSheet } from '@spec-kitty/elements';

/**
 * The TWO elements-owned behaviours. Their subject is `packages/elements/src`, reached
 * through the alias in vitest.config.mts.
 *
 * No alias redirection is needed, contrary to an earlier version of this comment: the
 * harness copies `packages/` into its temp dir and the config resolves its alias against
 * `dirname(import.meta.url)`, so the alias follows the copy. The comment also cited a
 * "guard 10" that does not exist — there are eight numbered guards.
 *
 * SC-013 is NOT here: packages/elements/src contains no `part=` and no `@csspart`, and the
 * manifest declares zero cssParts, so an elements-owned part mutation would have no
 * pattern at all. It is fixture-owned; the manifest-derived arm is WP04's ratchet.
 */

test('[SC-014] the element adopts a constructed sheet BY IDENTITY and injects no <style>', async () => {
  const el = document.createElement('sk-stub');
  document.body.append(el);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  const sr = el.shadowRoot!;

  // IDENTITY, not bytes. CSSStyleSheet has no `cssText` — it is undefined — and the only
  // read-back, cssRules[].cssText, is CSSOM-normalised: comments stripped, shorthands
  // collapsed, colours re-serialised, and normalised DIFFERENTLY per engine on a lane that
  // runs two. Identity is exact and engine-independent.
  // PROVENANCE, not a tautology. Comparing the adopted sheet to the class's own
  // `static styles` holds for ANY sheet — Lit adopts whatever the class declares — so it
  // says nothing about where the CSS came from. This compares against the module
  // GENERATED from @spec-kitty/styles, which is the actual claim, and it is what makes
  // the red-first mutation (swap in a different CSSStyleSheet) meaningful.
  expect(sr.adoptedStyleSheets.length).toBe(1);
  expect(sr.adoptedStyleSheets[0]).toBe(skStubSheet);

  // ADR-11 item 7's second half. kitty-desktop's CSP strips injected <style> elements, so
  // "adopts a sheet" without this proves only half the claim.
  expect(sr.querySelectorAll('style').length).toBe(0);
  el.remove();
});

test('[SC-015] a second define warns, keeps the original constructor, and is silent for the same one', () => {
  const original = customElements.get('sk-stub');
  expect(original).toBe(SkStub);

  // Arm 1 — a DIFFERENT constructor warns.
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  class Impostor extends HTMLElement {}
  define('sk-stub', Impostor);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(String(warn.mock.calls[0]?.[0])).toContain('already registered');

  // Arm 2 — the ORIGINAL survives. Without this, an empty define() body passes arm 1.
  expect(customElements.get('sk-stub')).toBe(original);

  // Arm 3 — the SAME constructor is silent. define() only warns when the ctor differs.
  warn.mockClear();
  define('sk-stub', SkStub as unknown as CustomElementConstructor);
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});
