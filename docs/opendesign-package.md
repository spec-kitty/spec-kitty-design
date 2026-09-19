# The OpenDesign package

`opendesign/spec-kitty-train/` is this library packaged as an [OpenDesign](https://github.com/nexu-io/open-design)
design system: the tokens, the fonts, and a **components fixture** that lets an OpenDesign generation
emit real Spec Kitty components instead of approximating them. It is **generated** from the library by
`scripts/build-opendesign-package.mjs` and committed, and CI fails any pull request that leaves it stale.

It replaces the hand-maintained package that used to live in `spec-kitty/team-kitty-ux` under
`open-design-systems/spec-kitty-train/`. That copy shipped tokens only and was pinned to `a9f385d`,
168 lines of `tokens.css` behind the library. It is superseded by this one.

## What is in it

| File | Generated? | What it is |
|---|---|---|
| `manifest.json` | yes | OpenDesign project manifest (`od-design-system-project/v1`), validated by OpenDesign's own validator |
| `metadata.json` | yes | `status: "published"`. **Without it OpenDesign lists the system but refuses to let a project use it** (`DESIGN_SYSTEM_NOT_PUBLISHED`) |
| `tokens.css` | yes | byte-identical copy of `packages/tokens/src/tokens.css` |
| `fonts/` | yes | the font files `tokens.css` references |
| `components.html` | yes | every static form the library ships, one section per component, CSS inlined |
| `components/<name>.html` | yes | one component's CSS and static forms — the page OpenDesign's agent actually reads; declared as a preview page so it is on OpenDesign's pull index |
| `components.manifest.json` | yes | derived by OpenDesign's own `extractComponentsManifest()`, so an OpenDesign import rewrites it with identical bytes |
| `DESIGN.md` | partly | authored prose for OpenDesign's agent; the section between the `GENERATED` markers lists every component with its page and its **closed class vocabulary**, and what cannot be emitted |
| `USAGE.md` | no | authored read-order for OpenDesign's agent |

**What it cannot emit.** Components with no static form — the shadow-DOM-only custom elements, and two
`boundary-page` forms that compose `<sk-entity-marker>` — are named in `DESIGN.md`'s generated section
with the reason, so OpenDesign's agent knows they exist and does not invent markup for them.

**What OpenDesign's agent actually sees.** Its prompt carries `DESIGN.md`, `USAGE.md` and
`tokens.css` verbatim, but for components only a short summary of `components.manifest.json` — nine
generic groups, eight selectors each. `components.html` is never put in the prompt, and at 430 KB
it could not be. That is why the class vocabulary lives in `DESIGN.md` and each component has its
own page: without them, the first proof run emitted the right component blocks with invented
elements (`sk-radio-choice__input` for the library's `sk-radio-choice-group__control`) and
hand-written CSS.

## Regenerating

```sh
node scripts/build-opendesign-package.mjs          # write the package
node scripts/build-opendesign-package.mjs --check  # CI: fail on any drift
```

Change a component's static form, its CSS, or a token, and `--check` fails until you regenerate and
commit. Edit `DESIGN.md` only outside the `GENERATED` markers — the generator preserves that prose and
rewrites the region between them.

## Installing it into a self-hosted OpenDesign

**Do not use `od design-systems import local`.** It is for converting a *source codebase* into a
design system: it scans the folder and generates its own `DESIGN.md`, its own `tokens.css` normalised
to OpenDesign's generic schema, and its own generic `components.html`, discarding every file here.

OpenDesign instead **discovers** prepared packages placed in its user design-systems directory, and
reads them verbatim. The local instance does this with a symlink:

```
<open-design data volume>/design-systems/spec-kitty-train
    -> /workspace/spec-kitty-design/opendesign/spec-kitty-train
```

where `/workspace/spec-kitty-design` is a clone of this repository mounted into the container. The
system then appears in OpenDesign as `user:spec-kitty-train`.

## Refreshing it after a release

The package is always current in this repository; the instance is only as current as the clone it
points into. That clone going unpulled is exactly how the previous package ended up pinned to a stale
commit. After a train merge or a release:

```sh
git -C <the mounted clone> fetch origin
git -C <the mounted clone> checkout --detach origin/train/elements-first
```

A detached checkout rather than `git pull`, because OpenDesign may annotate `metadata.json` inside the
design-system folder when a project claims it, which would make a pull refuse to fast-forward. The
annotation is instance state, not a change to keep.

## Using it in a project: link the folder

An agent can only copy a component's CSS and markup if it can **read** `components/<name>.html`.
OpenDesign offers two ways, and a self-hosted instance may block one of them:

- **Link the design-system folder into the project** (recommended). In the project's working
  directories, add `/app/.od/design-systems/spec-kitty-train` — the Home composer's folder picker,
  or `metadata.linkedDirs` when creating a project through the API. OpenDesign gives the agent
  read-only access to it (`--add-dir`); nothing is imported or copied.
- **The pull tool**, `"$OD_NODE_BIN" "$OD_BIN" tools design-systems read --path components/<name>.html`.
  It needs the agent to be allowed to run that command. The local instance runs Claude Code with
  `--permission-mode acceptEdits`, which refuses it non-interactively — so there, only the linked
  folder works.

**Without either, the package does not work as a design library.** The class vocabulary in
`DESIGN.md` is in the prompt, and it is not enough: in the proof's push-only run the agent saw it,
looked for the component pages, could not open them, and invented 14 of its 22 library-namespace
classes and all of its component CSS. With the folder linked, the same prompt produced 0 invented
classes and copied the radio group's CSS verbatim.

**Projects keep their own copy.** An OpenDesign project created from the design system (for example
`ds-spec-kitty-train`) holds a copy of its files; refreshing the design system does not update it.

## How it was proven consumable

REL4 (#396) ran one real generation on a local OpenDesign 0.21.1 instance against this package. The
prompt, the output, and the library components it used are recorded in
`kitty-specs/release-pipeline-opendesign-package-01M2X5XX/research/consumability-proof.md`.
