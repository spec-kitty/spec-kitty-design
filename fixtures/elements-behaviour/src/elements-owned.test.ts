import { expect, test, vi } from 'vitest';
import { define, SkStub } from '@spec-kitty/elements';

/**
 * The TWO elements-owned behaviours. Their subject is `packages/elements/src`, reached
 * through the alias in vitest.config.mts — so the mutation harness must redirect that
 * alias rather than editing the copied fixture (WP05 guard 10).
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
  // Compared against the class's OWN `static styles`, not a deep relative import of the
  // generated module — that reached across a project boundary and the scope:fixture
  // depConstraint correctly refused it. This is also the better assertion: it is the
  // element's declared sheet that must be the adopted one.
  const declared = (SkStub as unknown as { styles: CSSStyleSheet[] }).styles;
  expect(sr.adoptedStyleSheets.length).toBe(1);
  expect(sr.adoptedStyleSheets[0]).toBe(declared[0]);

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
