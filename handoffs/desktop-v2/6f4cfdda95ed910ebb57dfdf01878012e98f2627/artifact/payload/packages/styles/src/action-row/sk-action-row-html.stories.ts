import './sk-action-row.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkActionRowHTML,
  SkActionRowCardHTML,
  SkActionRowFlushHTML,
  SkActionRowLinkHTML,
  SkActionRowCurrentHTML,
  SkActionRowRouteCurrentHTML,
} from './index';

/**
 * Renders from the GENERATED exports (ADR-10 §3, ADR-8 criterion 3) — this file must not
 * hand-author the `.sk-action-row-host` > `.sk-action-row` shape a second time.
 *
 * `scope:styles` may only depend on `scope:tokens` (eslint.config.mjs's `depConstraints`), so
 * this file CANNOT import `actionRowStaticHtml` from `packages/elements/src/action-row/
 * sk-action-row.markup.ts` directly the way a fixture test can — every sibling `*-html.stories.ts`
 * in this package (`sk-button-html`, `sk-feature-card-html`, `sk-data-table-html`, …) already
 * observes this and renders from the generated `./index` exports plus guarded text/structure
 * SWAPS, never a live call. This file follows the same shape. Content-level axes this component's
 * generator cannot express (no mark, no controls, several controls, long content) are produced by
 * a swap against the KNOWN generated base string, each one guarded the same way `sk-button-html`'s
 * `swap()` and `sk-feature-card-html`'s `fill()` are: THROW loudly if the generated markup no
 * longer contains the anchor text, rather than silently returning the string unchanged.
 */

const swap = (markup: string, find: string, put: string, what: string): string => {
  if (!markup.includes(find)) {
    throw new Error(
      `sk-action-row story: generated markup no longer contains ${JSON.stringify(find)} (${what}) — ` +
        `the swap would have silently returned it unchanged. Update this story alongside ` +
        `actionRowStaticHtml()'s default content or ACTION_ROW_AXES.`,
    );
  }
  return markup.replace(find, put);
};

// The exact sub-blocks PLACEHOLDER_CONTENT in sk-action-row.markup.ts produces today. Each is
// removed or replaced through `swap()`, so a change to the module's default content fails this
// file loudly (the thrown error above) instead of silently rendering stale copy.
const MARKER_BLOCK = '<span class="sk-action-row__marker"><span aria-hidden="true">●</span></span>';
const TAGS_BLOCK = '<span class="sk-action-row__tags"><span class="sk-pill-tag">Tag</span></span>';
const METADATA_BLOCK = '<span class="sk-action-row__metadata">2 hours ago</span>';
const SUPPORTING_BLOCK = '<span class="sk-action-row__supporting">Supporting detail about this row.</span>';
const CONTROLS_BLOCK =
  '<div class="sk-action-row__controls"><button type="button" style="color:inherit;font:inherit;background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;">Action</button></div>';
const TITLE_TEXT = '>Row title<';
const REFERENCE_TEXT = '>/path/to/resource<';

const withoutMark = (markup: string) => swap(markup, MARKER_BLOCK, '', 'the marker part');
const withoutTags = (markup: string) => swap(markup, TAGS_BLOCK, '', 'the tags part');
const withoutMetadata = (markup: string) => swap(markup, METADATA_BLOCK, '', 'the metadata part');
const withoutSupporting = (markup: string) => swap(markup, SUPPORTING_BLOCK, '', 'the supporting part');
const withoutControls = (markup: string) => swap(markup, CONTROLS_BLOCK, '', 'the controls region');
const withTitle = (markup: string, text: string) => swap(markup, TITLE_TEXT, `>${text}<`, 'the title');
const withReference = (markup: string, text: string) => swap(markup, REFERENCE_TEXT, `>${text}<`, 'the reference');
// Plain, dependency-free markup — no `sk-button` class, matching PLACEHOLDER_CONTENT's own
// controls in sk-action-row.markup.ts (see that file's comment: `.sk-action-row__controls`
// styles only layout, never colour, so an unstyled `sk-button` class is an inert class name that
// leaves the UA default link colour in place — measured to fail WCAG AA color-contrast against
// the dark surface).
const CONTROL_STYLE = 'color:inherit;font:inherit;background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;';
const withSeveralControls = (markup: string) =>
  swap(
    markup,
    CONTROLS_BLOCK,
    '<div class="sk-action-row__controls">' +
      `<a href="#" style="${CONTROL_STYLE}">Details</a>` +
      `<button type="button" style="${CONTROL_STYLE}">Pin</button>` +
      `<button type="button" style="${CONTROL_STYLE}">Dismiss</button>` +
      '</div>',
    'the controls region',
  );

const frame = (body: string, width = 720) => `
  <div style="box-sizing:border-box;width:${width}px;max-width:100%;background:var(--sk-surface-page);padding:var(--sk-space-6);">
    ${body}
  </div>
`;

const list = (bodies: string[]) => `
  <ul style="list-style:none;margin:0;padding:0;display:grid;gap:var(--sk-space-2);">
    ${bodies.map((b) => `<li>${b}</li>`).join('')}
  </ul>
`;

const meta: Meta = {
  title: 'Primitives/SkActionRow (HTML)',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'The static, server-renderable form (#307). `.sk-action-row-host` > `.sk-action-row` — ' +
          'ADR-15\'s two-element wrapper, never a single-element collapse. The wrapper\'s CSS now ' +
          'SHIPS, generated by #309: a static consumer links ' +
          '`@spec-kitty/styles/action-row/static/sk-action-row.static.css` INSTEAD of ' +
          '`sk-action-row.css`, never in addition to it. What that file does not reproduce is ' +
          '`:host`\'s cascade position — a ruled limit, ADR-15\'s 2026-09-11 amendment (#375): to ' +
          'override a wrapper declaration a consumer needs specificity strictly higher than the ' +
          'generated rule declaring it, or the same specificity in a later stylesheet. This ' +
          'Storybook canvas still authors the host block locally in the docs below, because a ' +
          'story in `scope:styles` links no package stylesheet of its own.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** One row, self-contained (FR-015 — Family 4's T4 single-row fragment swap: this IS that
 *  fragment, rendered with no surrounding collection markup and no script). */
export const Default: Story = { render: () => frame(SkActionRowHTML) };

/** Several rows, the shape a Django/Jekyll/Hugo template author actually emits. */
export const Collection: Story = {
  render: () =>
    frame(
      list([
        withTitle(withReference(SkActionRowHTML, 'spec-kitty/e2e-team-landing'), 'team-landing-pivots'),
        withTitle(withReference(SkActionRowFlushHTML, 'spec-kitty/design-system'), 'design-system-refresh'),
        withTitle(withReference(SkActionRowLinkHTML, 'spec-kitty/invitations'), 'pending-invitation'),
      ]),
    ),
};

/** The static (non-route, non-interactive) trigger div — FR-009. */
export const StaticTrigger: Story = { render: () => frame(SkActionRowHTML) };

/** The native `<a>` route trigger — FR-008. There is no static `<button>` trigger (FR-010): a
 *  server-rendered page has no listener to receive `sk-action-row-activate`. */
export const Route: Story = { render: () => frame(SkActionRowLinkHTML) };

/** `aria-current="true"` on the row (non-route) — present, and correctly never `"false"` when
 *  absent (see `Default` above, which carries no `aria-current` at all). */
export const Current: Story = { render: () => frame(SkActionRowCurrentHTML) };

/** `aria-current="page"` on the anchor (route) — `.sk-action-row` itself carries no
 *  `aria-current="true"` in this case (FR-011, Acceptance Scenario 2). */
export const RouteCurrent: Story = { render: () => frame(SkActionRowRouteCurrentHTML) };

/** `.sk-action-row--flush` — the bordered card surface is replaced by the passthrough
 *  presentation; compare against `Default` above for the restored bordered case (FR-012). */
export const Flush: Story = { render: () => frame(SkActionRowFlushHTML) };

/** `.sk-action-row--card` compact layout. */
export const Card: Story = { render: () => frame(SkActionRowCardHTML, 360) };

/** No mark supplied — the `.sk-action-row__marker` wrapper is entirely ABSENT, not an empty
 *  shell (FR-013). */
export const WithoutMark: Story = { render: () => frame(withoutMark(SkActionRowHTML)) };

/** No metadata, tags or supporting content supplied — each optional wrapper is entirely absent;
 *  only the mandatory title (and the marker, tags and reference below the identity line are
 *  optional too) remains. */
export const Sparse: Story = {
  render: () => frame(withoutSupporting(withoutTags(withoutMetadata(withoutMark(SkActionRowHTML))))),
};

/** One trailing control (the default/base shape — see `Default` above) vs. several. */
export const SeveralControls: Story = { render: () => frame(withSeveralControls(SkActionRowHTML)) };

/** No trailing action at all — `.sk-action-row__controls` does not exist in the DOM, not merely
 *  hidden (FR-014). */
export const WithoutControls: Story = { render: () => frame(withoutControls(SkActionRowHTML)) };

/** Route mode WITH trailing controls beside it — the sibling relationship FR-006/FR-007 freeze,
 *  on the one trigger shape most likely to tempt nesting them inside the anchor. */
export const RouteWithControls: Story = { render: () => frame(SkActionRowLinkHTML) };

/** Long, unbroken identifiers and a long reference contain locally with no document-level
 *  horizontal overflow, at a narrow (≤400px) width (NFR-004, edge case). */
export const LongContentNarrow: Story = {
  render: () =>
    frame(
      withTitle(
        withReference(
          SkActionRowHTML,
          'spec-kitty/a-very-long-unbroken-reference-without-a-natural-break',
        ),
        'A long consumer-supplied title remains readable',
      ),
      360,
    ),
};

/**
 * The same long content at desktop width, side by side with the narrow rendering above via
 * Storybook's own story list — the reflow this pair demonstrates VISUALLY is the same boundary
 * `fixtures/elements-behaviour/src/sk-action-row.test.ts`'s reflow-parity test MEASURES against
 * the shadow form. A live `<sk-action-row>` cannot be embedded on this canvas to overlay the two
 * forms directly: this package (`scope:styles`) may only depend on `scope:tokens`
 * (eslint.config.mjs), so the shadow element — `scope:elements` — is out of reach from here. The
 * quantitative parity proof lives in the test, which is not a `scope:styles`-constrained module.
 */
export const LongContentDesktop: Story = {
  render: () =>
    frame(
      withTitle(
        withReference(
          SkActionRowHTML,
          'spec-kitty/a-very-long-unbroken-reference-without-a-natural-break',
        ),
        'A long consumer-supplied title remains readable',
      ),
      960,
    ),
};

/** `dir="rtl"` — the wrapper and row use only logical properties (`margin-inline-*`,
 *  `padding-inline-*`), the same ones `sk-action-row.css` already uses for the shadow form, so no
 *  LTR-only assumption is newly introduced by this static markup. */
export const RTL: Story = {
  render: () => `
    <div dir="rtl" style="box-sizing:border-box;width:720px;max-width:100%;background:var(--sk-surface-page);padding:var(--sk-space-6);">
      ${SkActionRowHTML}
    </div>
  `,
};

/**
 * 200% zoom simulation with the long-content fixture (NFR-004). Storybook cannot script a real
 * browser zoom from a `render:` function; the accepted in-repo proxy — used by this component's
 * own shadow-form stories and by sibling `-html.stories.ts` files — is a narrow, fixed-width
 * frame forcing the same relative crowding a 200% zoom produces at a normal viewport. The actual
 * "no document-level horizontal overflow" assertion is measured in the fixture test, not here.
 */
export const Zoom200: Story = {
  render: () =>
    frame(
      withTitle(
        withReference(
          SkActionRowHTML,
          'spec-kitty/a-very-long-unbroken-reference-without-a-natural-break',
        ),
        'A long consumer-supplied title remains readable at 200% zoom',
      ),
      320,
    ),
};

/**
 * Forced-colors documentation. The recolouring itself is inherited unchanged from the shared,
 * unmodified `sk-action-row.css` — its `@media (forced-colors: active)` block already exists and
 * this mission edits neither the block nor the sheet (C-003). This story exists so the static
 * form's `aria-current` row is visible in the same before/after shape the shadow form's own
 * `ForcedColors` story already uses; the behavioural assertion lives in
 * `apps/storybook/src/tests/elements-load.spec.ts`.
 */
export const ForcedColors: Story = {
  render: () =>
    frame(`
      <div data-forced-colors-comparison style="display:grid;gap:var(--sk-space-4);">
        <div>
          <p style="margin:0 0 var(--sk-space-2);color:var(--sk-fg-muted);">Current, bordered</p>
          ${SkActionRowCurrentHTML}
        </div>
        <div>
          <p style="margin:0 0 var(--sk-space-2);color:var(--sk-fg-muted);">Current, route</p>
          ${SkActionRowRouteCurrentHTML}
        </div>
      </div>
    `),
};

/**
 * Reduced motion documentation. The row's background/border-color transition is inherited
 * unchanged from `sk-action-row.css`'s existing `@media (prefers-reduced-motion: reduce)` block
 * (FR-022) — nothing here is new CSS. The "does not animate" assertion is measured in the
 * fixture test against the real computed `transitionDuration`, not against this static canvas.
 */
export const ReducedMotion: Story = { render: () => frame(SkActionRowHTML) };

/** `class="sk-light"`, NOT `data-theme="light"` — the attribute form activates nothing on a
 *  wrapper (#93). Required variant per `docs/contributing/adding-a-component.md` §5. */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="box-sizing:border-box;width:720px;max-width:100%;background:var(--sk-surface-page);padding:var(--sk-space-6);">
      ${SkActionRowHTML}
    </div>
  `,
};
