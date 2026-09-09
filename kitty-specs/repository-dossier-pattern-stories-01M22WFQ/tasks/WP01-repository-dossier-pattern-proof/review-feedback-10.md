# Pre-acceptance CI finding — native breadcrumb overflow stop

Reviewer: Codex implementation seat from hosted diagnostic evidence

Reviewed SHA: `a480576d9f73d10cf549f82c5f1e87fea7bd2efb`

Hosted run `34396523142` retained the Firefox focus diagnostics added after review feedback 9. The
failure identified the deep active-element chain as the native breadcrumb `<ol>`, while the expected
`Repos` link had `tabIndex: 0` and no inert or `aria-hidden` ancestor. Firefox exposed the list as a
sequential focus stop because its public breadcrumb recipe owns horizontal overflow at 390 px.

Required remediation:

- preserve real Tab and Shift+Tab input;
- allow the native breadcrumb list before its child links only when it is the actual active element
  and `scrollWidth > clientWidth` proves it is a genuine overflow container;
- require the focused overflow list's outline to remain visible and contained;
- continue through the exact `Repos`, document, Mission, and copy-control sequence rather than
  compensating with unverified absolute Tab counts;
- keep the Firefox all-focus-categories preference and failure diagnostics, which remain useful
  cross-runner normalization and evidence.

Do not add product focus management, force programmatic focus, skip unexpected controls, or weaken
the native-link assertions. No Claude, Hermes, or `/tk` transport was used.
