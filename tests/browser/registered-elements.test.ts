import { expect, test } from 'vitest';
import '@spec-kitty/elements';
import registry from '../../behaviours.json';

/**
 * RUNTIME TRUTH about every registered element, which is the only unevadable source.
 *
 * `tests/node/config-contract.test.ts` enforces that any element declaring
 * `static formAssociated` is a subject of SC-002…SC-005. It derives that from
 * `custom-elements.json`, because a source-text regex sees nothing when the flag is inherited
 * and `Object.prototype.hasOwnProperty.call(Subclass, 'formAssociated')` is `false` — both
 * measured by a pre-plan lens.
 *
 * The manifest arm is much better than either, and it is still evadable. A lens demonstrated
 * two routes:
 *
 *   (SkFormInput as unknown as { formAssociated: boolean }).formAssociated = true;
 *       — post-hoc assignment; the class body is empty, so the manifest records nothing
 *   static get formAssociated() { return true; }
 *       — recorded as a member with NO `default`, so an arm keyed on `default === "true"` misses
 *
 * The second is closed by keying on the member NAME. The first cannot be closed by any static
 * analysis, because the assignment happens at runtime. So this file asks the runtime.
 *
 * It lives in `tests/browser/` rather than in the behaviour fixture because it is an ALL-TAGS
 * loop, and `config-contract.test.ts` requires a behaviour subject's file to be about the one
 * element it names. The node lane has no `customElements`.
 */

const subjectsOf = (id: string): string[] =>
  (registry.behaviours.find((b) => b.id === id)?.subjects ?? []).map((s) => s.name);

const FORM_BEHAVIOURS = ['SC-002', 'SC-003', 'SC-004', 'SC-005'] as const;

test('every form-associated element that is REGISTERED is a subject of all four form behaviours', () => {
  // The tags the elements package actually registers, read from the registry the browser keeps.
  const tags = (registry.behaviours ?? [])
    .flatMap((b) => b.subjects ?? [])
    .map((s) => s.name)
    .filter((n) => n.startsWith('sk-'));
  const registered = [...new Set(tags)].filter((t) => customElements.get(t));
  expect(registered.length, 'no registered elements found — the import did not take effect').toBeGreaterThan(0);

  for (const tag of registered) {
    const ctor = customElements.get(tag) as (CustomElementConstructor & { formAssociated?: boolean });
    if (ctor.formAssociated !== true) continue;
    for (const id of FORM_BEHAVIOURS) {
      expect(
        subjectsOf(id),
        `<${tag}> is form-associated AT RUNTIME but is not a subject of ${id}. A static check ` +
          `cannot see a flag assigned after class definition; this one can.`,
      ).toContain(tag);
    }
  }
});
