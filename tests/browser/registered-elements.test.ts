import { expect, test } from 'vitest';
import { registeredTags } from '@spec-kitty/elements';
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

test('every form-associated element the package REGISTERS is a subject of all four form behaviours', () => {
  // The candidate set comes from `define()`'s own record, not from behaviours.json.
  //
  // The first version built it from behaviours.json subjects and then filtered by
  // `customElements.get` — deriving the candidate list from the very artifact it was checking.
  // A lens smuggled a second form-associated element registered from an existing element file:
  // invisible to the `sk-*.ts` glob, absent from the manifest, absent from behaviours.json, and
  // therefore never iterated here. Both lanes passed while it was registered and
  // form-associated at runtime.
  expect(registeredTags.length, 'no elements registered — the import did not take effect').toBeGreaterThan(0);

  const formAssociated = registeredTags.filter((tag) => {
    const ctor = customElements.get(tag) as CustomElementConstructor & { formAssociated?: boolean };
    return ctor?.formAssociated === true;
  });

  // A floor, matching the node-lane arm. Without it the loop body never runs if nothing is
  // form-associated, and the test is vacuously green — which is the shape this file exists for.
  expect(
    formAssociated.length,
    'no registered element is form-associated — if one exists, this test has gone blind',
  ).toBeGreaterThan(0);

  for (const tag of formAssociated) {
    for (const id of FORM_BEHAVIOURS) {
      expect(
        subjectsOf(id),
        `<${tag}> is form-associated AT RUNTIME but is not a subject of ${id}. A static check ` +
          `cannot see a flag assigned after class definition, nor an element registered from a ` +
          `file the globs do not match; this one can.`,
      ).toContain(tag);
    }
  }
});
