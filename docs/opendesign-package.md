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
| `tokens.css` | yes | the stylesheet `@spec-kitty/tokens` publishes (`buildTokensCss` over the source), including its no-`data-theme` system fallback |
| `fonts/` | yes | the 40 font files `tokens.css` references, plus the Inter licence |
| `components.html` | yes | every static form the library ships, one section per component, CSS inlined |
| `components/<name>.html` | yes | one component's CSS and static forms — the page OpenDesign's agent actually reads; declared as a preview page, which lists it by name on OpenDesign's pull index |
| `components.manifest.json` | yes | derived by OpenDesign's own `extractComponentsManifest()`. At discovery OpenDesign reads this file verbatim and summarises it into every prompt, so it must be exactly what its extractor produces |
| `DESIGN.md` | partly | authored prose for OpenDesign's agent; the section between the `GENERATED` markers lists every component with its page and its **closed class vocabulary**, and what cannot be emitted |
| `USAGE.md` | no | authored read-order for OpenDesign's agent. The build refuses authored prose that recommends a non-emittable element, points at a repository path, or hard-codes a derived count. The check is lexical, per paragraph or list item: a "cannot be emitted" anywhere in the same item exempts it, and bare paths, upper-case names or spelled-out counts pass, so review still reads the prose |

**What it cannot emit.** Components with no static form — the shadow-DOM-only custom elements, and two
`boundary-page` forms that compose `<sk-entity-marker>` — are named in `DESIGN.md`'s generated section
with the reason, so OpenDesign's agent knows they exist and does not invent markup for them.

**What OpenDesign's agent actually sees.** Its prompt carries `DESIGN.md`, `USAGE.md` and
`tokens.css` verbatim, but for components only a short summary of `components.manifest.json`: the
generic groups it detects (seven for this package, two of them empty), at most eight selectors
each. `components.html` is never put in the prompt, and at 430 KB
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

**The folder or symlink must be named `spec-kitty-train`.** OpenDesign ignores `manifest.json`
unless its `id` equals the directory name (`index.ts:4104`). Under any other name the system still
lists and still works through a linked folder, but silently loses the manifest: no pull index and
no preview pages (`USAGE.md` is still read, under its default name).

## Refreshing it after a release

The package is always current in this repository; the instance is only as current as the clone it
points into. That clone going unpulled is exactly how the previous package ended up pinned to a stale
commit. After a train merge or a release:

```sh
git -C <the mounted clone> fetch origin
git -C <the mounted clone> checkout --detach origin/train/elements-first
```

**`metadata.json` has two owners.** The generator writes it (`status: "published"`), and OpenDesign
writes its own claim into the same file through the symlink when a project links the system
(`projectId`, `workspaceId`). A checkout carries that local edit across as long as this repository
has not changed `metadata.json` too; if it has, the checkout (and a `git pull`, equally) refuses. Then
copy the two instance fields, run `git -C <the mounted clone> checkout -- opendesign/spec-kitty-train/metadata.json`,
check out again, and add the fields back. The generator only ever emits the fields OpenDesign reads,
so that should be rare.

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

**OpenDesign's own kit view shows the component pages unstyled.** It serves each page from
`/api/design-systems/<id>/static?path=…`, where the page's `../tokens.css` link does not resolve, and
fonts are not on its static allowlist. The pages render correctly from the linked folder and from
this repository, which is where agents and people read them; `components.html` inlines everything
and is what OpenDesign's Library card shows.

**Projects keep their own copy.** An OpenDesign project created from the design system (for example
`ds-spec-kitty-train`) holds a copy of its files; refreshing the design system does not update it.

## How it was proven consumable

REL4 (#396) ran real generations on a local OpenDesign 0.21.1 instance against this package, with
the same prompt: before and after the fix, with and without the folder linked. The prompts, the
outputs, how they were measured and the components used are recorded in
`kitty-specs/release-pipeline-opendesign-package-01M2X5XX/research/consumability-proof.md`.
