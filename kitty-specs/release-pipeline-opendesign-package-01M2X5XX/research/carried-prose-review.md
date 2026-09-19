# Carried prose review — REL4

T005 carried `DESIGN.md` and `USAGE.md` over from the stale `team-kitty-ux` package, which was pinned
to `a9f385d4`. It also required recording, rather than silently fixing, any contradiction between that
prose and the current library. WP01 recorded none. The REL4 pre-merge gate (pass 1, head `cb895670`)
found the contradictions below.

All of them matter because OpenDesign pushes `USAGE.md` and then `DESIGN.md` into every prompt
(`apps/daemon/src/prompts/system.ts:1259-1265`), together with the generated section. When the
authored prose contradicts that section, the agent gets two opposite instructions.

| Carried claim | What the library says | Resolution |
|---|---|---|
| `USAGE.md`: "prefer … truthful `sk-copy-field`"; `DESIGN.md`: "Prefer it" | `copy-field` has no static form; the generated section lists it as not emittable | Rewritten: shadow-DOM-only elements are named as not emittable |
| `USAGE.md`: "Use `sk-app-shell presentation="rail-preserving"`"; `DESIGN.md` §#274 | `app-shell` has no static form | Rewritten: layout tokens still apply; the shell element cannot be emitted |
| `USAGE.md`: start Mission Reading from `packages/elements/src/patterns/mission-reading.stories.ts` | Not in the package; the agent can read only the package | Dropped |
| `DESIGN.md`: `::part()` contract for context sidebar, metric, notice, page header, personal rail, section header | All are shadow-DOM-only elements (site footer excepted) | Dropped; covered by the not-emittable paragraph |
| `DESIGN.md`: "`tokens.css` is a byte-identical copy of `packages/tokens/src/tokens.css`" | The package now ships the *published* stylesheet (`buildTokensCss`) | Rewritten |
| `DESIGN.md`/`USAGE.md`: "Swansea … body copy" | `--sk-font-sans` is Inter. `tokens.css:269-276` records that Swansea was the *documented* body face but never wired to the token | Rewritten to Inter |
| `DESIGN.md`: `components.html` "shows every component's static form" (for the agent) | The agent cannot load it (430 KB, never in the prompt) | Rewritten to point at `components/<name>.html` |
| `USAGE.md`: "all 34 pages", "430 KB" | Derived facts owned by the generated section | Dropped |

## Keeping it fixed

`authoredProseProblems()` in `scripts/build-opendesign-package.mjs` now refuses, per paragraph or list item:

- authored prose that names an excluded `sk-<element>` without saying it cannot be emitted;
- prose that points at a repository path;
- prose that hard-codes a derived count.

Each rule was revert-tested red, and the committed prose passes. The check is lexical and has known
gaps. A qualifier anywhere in the same paragraph or list item exempts every element named there.
Upper-case names, bare repository paths (without backticks or a Markdown link), hyphenated or
spelled-out counts all pass. It also cannot read meaning: a wrong font name or a wrong claim about a
token still gets through. Those parts remain review's job.
