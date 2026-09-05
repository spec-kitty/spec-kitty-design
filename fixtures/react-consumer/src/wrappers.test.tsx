/**
 * SC-306 and SC-307 — the generated wrappers in a REAL React render.
 *
 * Everything else in #75 inspects generated TEXT: the drift gate diffs trees, the type-tests
 * compile declarations, the node lane greps for "use client". None of it runs React. A wrapper
 * whose .d.ts is perfect and whose runtime never attaches a listener would pass all of it.
 *
 * That gap is the mission's whole reason for existing. React 19 already scores 16/16 on Custom
 * Elements Everywhere for basic AND advanced interop — properties, attributes and onFooEvent
 * listeners all work natively — so the wrapper's claim is ergonomics, not capability, and an
 * ergonomics claim has to be exercised rather than asserted.
 *
 * The .tsx extension is load-bearing: `fixtures/**\/src/**\/*.test.ts` did NOT match it, and a
 * file matching nothing runs nowhere and is reported by nothing (floor-reporter's arm 1 only
 * catches a declared lane that executed ZERO tests, and this lane is full). vitest.config.mts
 * was widened to `*.test.{ts,tsx}` for this file, and the first test below asserts the widening
 * actually took — otherwise this whole file is a no-op that looks like coverage.
 *
 * WHAT THIS FILE TESTS, AND WHAT IT DELIBERATELY DOES NOT. The tests carrying a behaviours.json
 * id target the WRAPPER's contract: props reach the element, element events reach React
 * handlers. They are not meant to re-assert the ELEMENT's contract, which
 * fixtures/elements-behaviour owns.
 *
 * Honest about how far that got. `[SC-006]` is fully decoupled — it dispatches its own event
 * with a sentinel detail and asserts identity, so it depends on exactly one generated line and
 * nothing about how the element fires. `[SC-002]` is NOT: it awaits `updateComplete` and reads
 * `el.value` back, which runs through Lit's attribute-to-property mapping, so it asserts the
 * wrapper-to-Lit HANDOFF rather than the wrapper alone. Removing `value` from the element's
 * `static properties` would red it as collateral. #126's pre-merge squad caught the docstring
 * claiming more separation than the test achieved; narrowed rather than left overstated.
 *
 * That separation is not tidiness, it is a harness requirement discovered the hard way: the
 * first version drove the element's own hamburger button and asserted real FormData, and
 * suite-selftest.mjs then reported THREE pre-existing element mutations as breaking these tests
 * too — legitimate collateral, because the tests depended on element internals that the element
 * fixture is already the subject for. A behaviour's subject must be able to go red on its OWN
 * mutation and stay green on everyone else's.
 *
 * The end-to-end tests below carry no `[SC-nnn]` bracket at all, and that syntax is the point:
 * suite-selftest.mjs:184 treats ANY test whose name matches /\[SC-\d+\]/ as a behaviour subject
 * for its collateral bound, regardless of whether the id is in behaviours.json. Writing the
 * criterion as `SC-307 end-to-end —` keeps the traceability a reader wants without claiming
 * red-first evidence the test cannot give.
 *
 * The end-to-end tests below carry NO behaviours id for the same reason. They are still worth
 * having — React 19's form handling meeting ElementInternals is a genuine integration risk that
 * neither fixture covers alone — but they are not anyone's red-first evidence.
 *
 * TWO ID NAMESPACES, deliberately both present. `[SC-002]` and `[SC-006]` are behaviours.json
 * ids — form association and event contract — and they are what floor-reporter.mjs's arm 5
 * matches when it checks that each declared subject file carries a passing test for its id.
 * `[SC-306]`/`[SC-307]` are #75's own success criteria. Without the behaviours id this file is
 * deletable in silence: arm 1 only catches a DECLARED lane that executed zero tests, and the
 * browser lane is full of other people's tests.
 */
import * as React from 'react';
import { StrictMode, forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { SkNavPill, SkFormInput } from '@spec-kitty/react';

/**
 * REQUIRED BY REACT, and its absence is not silent — it prints
 * "The current testing environment is not configured to support act(...)" on every `act()`
 * call, nine times in a full run. Without it React does not treat `act` as an act scope, so
 * effects and state updates are not guaranteed flushed when `act` returns and every assertion
 * below is racing the scheduler. The tests passed anyway, which is exactly why this is worth
 * setting explicitly rather than leaving to luck.
 */
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function render(ui: React.ReactNode) {
  act(() => root.render(<StrictMode>{ui}</StrictMode>));
}

type PropertyOnlyProbeElement = HTMLElement & {
  structured: ReadonlyArray<Readonly<{ id: string }>>;
};

type PropertyOnlyProbeProps = Readonly<{
  structured?: ReadonlyArray<Readonly<{ id: string }>>;
}>;

// BEGIN GENERATED PROPERTY-ONLY WRAPPER
const propertyOnlyProbeGeneratedSource = "const useIsomorphicLayoutEffect =\n  typeof window !== \"undefined\" ? useLayoutEffect : useEffect;\n\nfunction mergeRefs(target, forwardedRef) {\n  if (!forwardedRef) {\n    return;\n  }\n\n  if (typeof forwardedRef === \"function\") {\n    forwardedRef(target);\n  } else {\n    forwardedRef.current = target;\n  }\n}\n\nfunction createForwardedRefHandler(localRef, forwardedRef) {\n  return (node) => {\n    localRef.current = node;\n    mergeRefs(node, forwardedRef);\n  };\n}\n\nfunction useProperties(targetElement, propName, value, resetValue) {\n  useEffect(() => {\n    const el = targetElement?.current;\n    const nextValue = value === undefined && resetValue ? resetValue() : value;\n    if (!el || nextValue === undefined || el[propName] === nextValue) {\n      return;\n    }\n\n    try {\n      el[propName] = nextValue;\n    } catch (e) {\n      console.warn(e);\n    }\n  }, [targetElement, propName, value]);\n}\n\nfunction useEventListener(targetElement, eventName, eventHandler) {\n  // keep a ref to the latest handler so we don't need to re-register the event listener\n  // whenever the handler changes (avoids duplicate listeners on re-renders)\n  const handlerRef = useRef(eventHandler);\n  handlerRef.current = eventHandler;\n\n  useIsomorphicLayoutEffect(() => {\n    const el = targetElement?.current;\n    if (!el || eventName === undefined) {\n      return;\n    }\n\n    // capture the handler at the time the listener is attached so we can call cancel on it\n    const eventListener = (event) => {\n      const handler = handlerRef.current;\n      if (handler) {\n        handler(event);\n      }\n    };\n\n    el.addEventListener(eventName, eventListener);\n\n    return () => {\n      const handler = handlerRef.current;\n      if (handler?.cancel) {\n        handler.cancel();\n      }\n      el.removeEventListener(eventName, eventListener);\n    };\n  }, [eventName, targetElement?.current]);\n}\n\nconst PropertyOnlyProbe = forwardRef((props, forwardedRef) => {\n  const ref = useRef(null);\n  const {\n    className,\n    exportparts,\n    htmlFor,\n    part,\n    tabIndex,\n    structured,\n    ...restProps\n  } = props;\n\n  /** Waits for the client before loading the custom element */\n  useEffect(() => {\n    loadElements();\n  }, []);\n\n  /** Properties - run whenever a property has changed */\n  useProperties(ref, \"structured\", structured, () => Object.freeze([]));\n\n  return React.createElement(\n    \"sk-property-only-probe\",\n    {\n      ref: createForwardedRefHandler(ref, forwardedRef),\n      ...restProps,\n      class: className,\n      exportparts: exportparts,\n      for: htmlFor ?? props[\"for\"],\n      part: part,\n      tabindex: tabIndex ?? props[\"tabindex\"],\n      style: { ...props.style },\n    },\n    props.children,\n  );\n});\n\nreturn PropertyOnlyProbe;\n";
// END GENERATED PROPERTY-ONLY WRAPPER

const PropertyOnlyProbe = new Function(
  'React',
  'forwardRef',
  'useEffect',
  'useLayoutEffect',
  'useRef',
  'loadElements',
  propertyOnlyProbeGeneratedSource,
)(
  React,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  () => import('@spec-kitty/elements'),
) as React.ForwardRefExoticComponent<
  PropertyOnlyProbeProps & React.RefAttributes<PropertyOnlyProbeElement>
>;

test('[property-only] a synthetic wrapper preserves identity and resets an omitted array prop', () => {
  const first = Object.freeze([{ id: 'first' }]);
  const second = Object.freeze([{ id: 'second' }]);

  render(<PropertyOnlyProbe structured={first} />);
  const element = host.querySelector('sk-property-only-probe') as PropertyOnlyProbeElement;
  expect(element.structured, 'the first value was not assigned before custom-element upgrade').toBe(
    first,
  );
  expect(element.hasAttribute('structured'), 'structured data must never be serialized').toBe(
    false,
  );

  class PropertyOnlyProbeElementClass extends HTMLElement {
    declare structured: PropertyOnlyProbeElement['structured'];

    constructor() {
      super();
      if (!Object.prototype.hasOwnProperty.call(this, 'structured')) {
        this.structured = Object.freeze([]);
      }
    }
  }
  customElements.define('sk-property-only-probe', PropertyOnlyProbeElementClass);
  expect(element.structured, 'custom-element upgrade lost the original identity').toBe(first);
  expect(element.hasAttribute('structured'), 'upgrade created a structured attribute').toBe(false);

  render(<PropertyOnlyProbe structured={second} />);
  expect(element.structured, 'a React rerender did not replace the property identity').toBe(second);
  expect(element.hasAttribute('structured'), 'a rerender serialized structured data').toBe(false);

  render(<PropertyOnlyProbe />);
  expect(element.structured).toEqual([]);
  expect(Object.isFrozen(element.structured), 'the removal reset must be immutable').toBe(true);
  expect(element.structured, 'removal retained the previous consumer array').not.toBe(second);
  expect(element.hasAttribute('structured'), 'removal created a structured attribute').toBe(false);
});

test('SC-306 guard — this file is actually executed by the browser lane', () => {
  // Guards the include glob, not the wrappers — and it is nearly tautological, which is worth
  // saying rather than leaving a reader to find out: if the include narrows, this file does not
  // run, so this assertion does not run either. What actually catches that narrowing is
  // floor-reporter.mjs's arm 5, because behaviours.json names this exact path as the subject for
  // SC-002 and SC-006. This line only catches a rename to `.test.ts` that still collects — which
  // esbuild rejects anyway for a file containing JSX.
  // In the browser lane import.meta.url is a served URL with a query string, so match on the
  // path rather than anchoring at the end.
  expect(new URL(import.meta.url).pathname).toMatch(/\.test\.tsx$/);
});

test('[SC-006] the wrapper subscribes a React handler to the element event', async () => {
  // WRAPPER CONTRACT, and narrowed on purpose. The event is dispatched on the element directly
  // rather than by driving the element's own hamburger: whether sk-nav-pill FIRES correctly, and
  // with what detail shape, is SC-006's ELEMENT subject's job. The first version of this test
  // clicked the real button and asserted `{ open: true }`, and suite-selftest.mjs then reported
  // it as collateral on the SC-007 element mutation (`detail: { open }` -> `detail: { isOpen }`)
  // — correctly, because the test was re-asserting the element's contract through the wrapper.
  //
  // A behaviour's subject must go red on its OWN mutation and stay green on everyone else's.
  // What is under test here is exactly one generated line:
  //   useEventListener(ref, "sk-nav-pill-toggle", props.onSkNavPillToggle)
  const seen: unknown[] = [];
  render(<SkNavPill label="Docs" onSkNavPillToggle={(e: CustomEvent) => seen.push(e.detail)} />);

  const el = host.querySelector('sk-nav-pill') as HTMLElement;
  expect(el, 'the wrapper rendered no custom element').toBeTruthy();

  const sentinel = { from: 'the test, not the element' };
  await act(async () => {
    el.dispatchEvent(
      new CustomEvent('sk-nav-pill-toggle', {
        detail: sentinel,
        bubbles: true,
      }),
    );
  });

  expect(seen, 'the event never reached the React handler').toHaveLength(1);
  // The sentinel proves the wrapper forwarded OUR detail untouched, and keeps this assertion
  // independent of whatever shape the element happens to emit.
  expect(seen[0]).toBe(sentinel);
});

test('[SC-002] the wrapper delivers value to the element', async () => {
  // WRAPPER CONTRACT: the prop must arrive on the element such that `el.value` reads back. That
  // is what makes ElementInternals.setFormValue possible at all; whether the element then
  // submits is the element fixture's SC-002 subject.
  //
  // NOT asserted here, deliberately: that value arrives as a PROPERTY rather than an attribute.
  // The first version of this test did assert that and failed, which turned out to be a real
  // finding about the ssrSafe decision rather than a bug. `value: { type: String }` is NOT
  // reflected (form-control-base's own comment explains why for `disabled`), so the `value`
  // attribute on the node was set by REACT, not by Lit: ssrSafe defers `import(elements)` into
  // a useEffect, so at first render the element is not yet defined and React has no property to
  // assign to. It works here only because Lit maps the `value` attribute back onto the property
  // on upgrade. A prop with no attribute mapping would be silently dropped on first render —
  // guarded by build-react-wrappers.mjs, which now refuses a prop the manifest gives no
  // attribute.
  render(<SkFormInput name="email" label="Email" value="cat@example.com" />);
  const el = host.querySelector('sk-form-input') as HTMLElement & {
    value: string;
    updateComplete: Promise<boolean>;
  };
  expect(el).toBeTruthy();
  await customElements.whenDefined('sk-form-input');
  await el.updateComplete;
  expect(el.value, 'the wrapper did not deliver value to the element').toBe('cat@example.com');
});

test('SC-307 end-to-end — a form-associated wrapper submits inside a React <form>', async () => {
  let submitted: FormData | null = null;
  render(
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitted = new FormData(e.currentTarget);
      }}
    >
      <SkFormInput name="email" label="Email" value="cat@example.com" />
      <button type="submit">Go</button>
    </form>,
  );

  await customElements.whenDefined('sk-form-input');
  const el = host.querySelector('sk-form-input') as HTMLElement & {
    value: string;
    updateComplete: Promise<boolean>;
  };
  expect(el).toBeTruthy();
  await el.updateComplete;
  // The wrapper sets `value` as a PROPERTY. If it had set it as an attribute the element would
  // still look right and ElementInternals.setFormValue would never have been called.
  expect(el.value).toBe('cat@example.com');

  await act(async () => {
    (host.querySelector('button[type=submit]') as HTMLButtonElement).click();
  });

  expect(submitted, 'the form never submitted').not.toBeNull();
  expect(submitted!.get('email')).toBe('cat@example.com');
});

test('SC-307 end-to-end — a required empty wrapper blocks submission', async () => {
  let submits = 0;
  render(
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submits++;
      }}
    >
      <SkFormInput name="email" label="Email" required />
      <button type="submit">Go</button>
    </form>,
  );
  await customElements.whenDefined('sk-form-input');
  await (
    host.querySelector('sk-form-input') as HTMLElement & {
      updateComplete: Promise<boolean>;
    }
  ).updateComplete;
  await act(async () => {
    (host.querySelector('button[type=submit]') as HTMLButtonElement).click();
  });
  // The element's validity must reach the FORM through the wrapper, not just render red.
  expect(submits, 'an invalid required field did not block submission').toBe(0);
});
