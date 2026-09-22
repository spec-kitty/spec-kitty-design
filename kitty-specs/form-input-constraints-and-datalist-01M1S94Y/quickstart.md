# Quickstart: verifying form-input-constraints-and-datalist

## Constraint forwarding + merged validity (FR-001/FR-002, SC-001/SC-002)

```html
<form id="f">
  <sk-form-input id="branch" label="Branch" name="branch" required pattern="[a-z0-9/_-]+"></sk-form-input>
  <button type="submit">Go</button>
</form>
<script type="module">
  import '@spec-kitty/elements';
  const el = document.getElementById('branch');
  el.value = 'BAD VALUE'; // fails the pattern
  await el.updateComplete;
  console.assert(el.validity.patternMismatch === true, 'FR-002: UA flag must reach the host');
  document.getElementById('f').addEventListener('submit', (e) => {
    console.assert(false, 'a patternMismatch value must never reach a submit handler');
  });
  document.getElementById('f').requestSubmit(); // must be blocked, not fire `submit`
</script>
```

## `readonly` platform semantics (FR-003, SC-003)

```html
<form id="f2">
  <sk-form-input id="ro" label="Region" name="region" required readonly></sk-form-input>
</form>
<script type="module">
  const el = document.getElementById('ro');
  await el.updateComplete;
  console.assert(el.validity.valid === true, 'SC-003: empty required readonly must not block the form');
  console.assert(new FormData(document.getElementById('f2')).has('region'), 'SC-003: readonly still submits');
</script>
```

## Shadow-root datalist (FR-005, SC-005)

```html
<sk-form-input id="signal" label="Signal" name="signal"></sk-form-input>
<script type="module">
  const el = document.getElementById('signal');
  el.options = [{ value: 'main' }, { value: 'release/2026.09', label: 'Release 2026.09' }];
  await el.updateComplete;
  const input = el.shadowRoot.querySelector('input');
  const datalist = el.shadowRoot.querySelector('datalist');
  console.assert(input.list === datalist, 'SC-005: node identity, not attribute string equality');
</script>
```

## React `ssrSafe` option delivery (NFR-001, SC-006)

Run `npm test -w fixtures/react-consumer` (or the repo's Vitest browser-mode invocation for that
fixture) after adding `fixtures/react-consumer/src/sk-form-input-options.test.tsx`, structured like
the existing `sk-transition-matrix.test.tsx`'s `[SC-010]` test: assert `element.options` is the
exact array identity passed as a React prop, BEFORE `customElements.define('sk-form-input', …)`
runs in that test, and that removing the prop resets to a fresh frozen `[]`.

## Regenerating build artifacts (FR-008, SC-007)

```bash
# from the repository root, after editing sk-form-input.ts / form-control-base.ts
npx nx run elements:analyze                 # cem analyze + node scripts/normalise-manifest.mjs
node scripts/check-manifest-content.mjs     # ENFORCED gate: every doc comment / part present
node scripts/build-react-wrappers.mjs       # regenerate packages/react/src/SkFormInput.*
node scripts/build-react-wrappers.mjs --check
node scripts/build-element-markup.mjs       # regenerate the element-backed static HTML, if any
node scripts/build-elements-css.mjs --check # only if sk-form-input.css changed (unlikely here)
```

`build-styles-only-markup.mjs` regenerates `form-field`'s barrel specifically (#141/#172) and is
unrelated to this mission unless `form-field`'s own files are touched, which they are not.

Each generator's `--check` mode is what CI runs; run it locally before committing to catch drift
before the pipeline does.
