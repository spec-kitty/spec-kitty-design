import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-pill-tag.js';

/**
 * <sk-pill-tag> — #79's primitives batch, plus #302's operational status-tone axis.
 *
 * `variant` is colour, `shape` is size, and they are independent — which is the point of
 * folding the old `.sk-eyebrow-pill` in as a shape rather than leaving it a second component:
 * a tinted eyebrow is now expressible and was not before.
 *
 * `status` is a THIRD axis, added by #302: the same six operational tones
 * `sk-status-indicator` owns (`neutral`, `info`, `success`, `attention`, `danger`, `recovery`),
 * one vocabulary shared with `sk-card`'s equivalent axis (#177). While a status is present it
 * SUPERSEDES the brand variant's surface entirely — see BrandWithStatus. Tone is decoration
 * only: it adds no role, no accessible-name contribution, and this component holds no domain
 * mapping (a consumer's Private/Active/Revoked labels are theirs to supply as slotted text, not
 * this library's — C-007).
 */
const meta: Meta = {
  title: 'Elements/SkPillTag',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => '<sk-pill-tag>v1.0.0</sk-pill-tag>',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Green: Story = { render: () => '<sk-pill-tag variant="green">SemVer</sk-pill-tag>' };
export const Purple: Story = { render: () => '<sk-pill-tag variant="purple">Skills Pack</sk-pill-tag>' };
export const Breaking: Story = { render: () => '<sk-pill-tag variant="breaking">Breaking</sk-pill-tag>' };
export const Yellow: Story = { render: () => '<sk-pill-tag variant="yellow">Schema Gate</sk-pill-tag>' };

export const Eyebrow: Story = {
  render: () => '<sk-pill-tag shape="eyebrow">For software teams adopting agentic coding</sk-pill-tag>',
};

/** The two axes compose — this combination did not exist before #79. */
export const TintedEyebrow: Story = {
  render: () => '<sk-pill-tag shape="eyebrow" variant="purple">Skills Pack preview</sk-pill-tag>',
};

export const AllVariants: Story = {
  render: () => `
    <div style="display:flex; gap:var(--sk-space-3); align-items:center; flex-wrap:wrap;">
      <sk-pill-tag>v1.0.0</sk-pill-tag>
      <sk-pill-tag variant="breaking">Breaking</sk-pill-tag>
      <sk-pill-tag variant="green">SemVer</sk-pill-tag>
      <sk-pill-tag variant="purple">Skills Pack</sk-pill-tag>
      <sk-pill-tag variant="yellow">Schema Gate</sk-pill-tag>
    </div>
  `,
};

// ---- Operational status tones (#302) --------------------------------------------------------

/** The six tones, each labelled by its own slotted text — READ THE TEXT, NOT THE HUE. Every pill
 *  below is interpretable with the colour removed; that is what makes tone decoration rather
 *  than the carrier of meaning (FR-010). Labels are illustrative copy, generic rather than
 *  Team Kitty's domain vocabulary (C-007) — the same way the variant stories above use
 *  "SemVer"/"Breaking" rather than a consumer's own terms. */
const TONES = ['neutral', 'info', 'success', 'attention', 'danger', 'recovery'] as const;

const LABEL: Record<(typeof TONES)[number], string> = {
  neutral: 'Not started',
  info: 'In review',
  success: 'Active',
  attention: 'Needs attention',
  danger: 'Revoked',
  recovery: 'Recovering',
};

const tonePill = (tone: (typeof TONES)[number]) =>
  `<sk-pill-tag status="${tone}">${LABEL[tone]}</sk-pill-tag>`;

const grid = (body: string, attrs = '') => `
  <div${attrs} style="display:flex;gap:var(--sk-space-3);align-items:center;flex-wrap:wrap;background:var(--sk-surface-page);padding:var(--sk-space-6);">
    ${body}
  </div>
`;

export const StatusNeutral: Story = { render: () => grid(tonePill('neutral')) };
export const StatusInfo: Story = { render: () => grid(tonePill('info')) };
export const StatusSuccess: Story = { render: () => grid(tonePill('success')) };
export const StatusAttention: Story = { render: () => grid(tonePill('attention')) };
export const StatusDanger: Story = { render: () => grid(tonePill('danger')) };
export const StatusRecovery: Story = { render: () => grid(tonePill('recovery')) };

/** All six together, for comparing the scale rather than one tone at a time. Also the
 *  "no-modifier-plus-status" baseline the issue's required-stories list names: none of these
 *  pills sets `variant` or `shape`. */
export const AllStatuses: Story = { render: () => grid(TONES.map(tonePill).join('')) };

/**
 * BRAND × STATUS, ONE COMPOSED GRID covering every combination rather than one story per pair
 * (documented as such per the task brief) — the precedence claim is the same regardless of
 * which brand variant is paired with which tone, so one representative row per axis makes the
 * point without combinatorial story sprawl.
 *
 * `.sk-pill-tag--purple` sets exactly `background`/`color`; each `.sk-pill-tag--status-<tone>`
 * rule sets both too, at equal specificity, authored AFTER the variant rules — so the status
 * wins by source order and the variant contributes nothing to those two properties while a
 * status is set. Pinned by the precedence test in
 * fixtures/elements-behaviour/src/sk-pill-tag.test.ts, which asserts identity rather than
 * difference.
 */
export const BrandWithStatus: Story = {
  render: () => `
    <div style="display:grid;grid-template-columns:repeat(3, max-content);gap:var(--sk-space-4);align-items:center;background:var(--sk-surface-page);padding:var(--sk-space-6);">
      <sk-pill-tag variant="green" status="danger">Revoked</sk-pill-tag>
      <sk-pill-tag variant="purple" status="danger">Revoked</sk-pill-tag>
      <sk-pill-tag status="danger">Revoked — all three render identically</sk-pill-tag>
      <sk-pill-tag variant="purple" status="success">Active</sk-pill-tag>
      <sk-pill-tag variant="purple">Skills Pack — no status, the brand paints again</sk-pill-tag>
      <sk-pill-tag>Neither axis</sk-pill-tag>
    </div>
  `,
};

/** The eyebrow SIZE axis and the status COLOUR axis are disjoint declarations, so both survive
 *  together — mirrors TintedEyebrow's proof for `variant`, for `status` instead. */
export const EyebrowWithStatus: Story = {
  render: () => '<sk-pill-tag shape="eyebrow" status="attention">Needs attention</sk-pill-tag>',
};

/** A long label must not lose its surface/foreground pairing or overflow illegibly. */
export const LongLabel: Story = {
  render: () =>
    `<div style="max-width: 240px;background:var(--sk-surface-page);padding:var(--sk-space-6);">
      <sk-pill-tag status="attention">This label is intentionally long enough to wrap across more than one line inside a narrow container</sk-pill-tag>
    </div>`,
};

/** No physical (`left`/`right`) property is introduced by this axis — `background`/`color` are
 *  direction-agnostic, so the pill needs no logical-property rewrite to sit correctly in an RTL
 *  document. */
export const Rtl: Story = {
  render: () => grid(`<div dir="rtl">${TONES.map(tonePill).join('')}</div>`),
};

/** No fixed pixel dimensions are introduced by the status axis; token-based spacing and
 *  font-size keep scaling normally. A fixed narrow container simulates the effect of 200%
 *  browser zoom without depending on a Storybook viewport addon parameter. */
export const Zoom200: Story = {
  render: () => `
    <div style="max-width: 180px;background:var(--sk-surface-page);padding:var(--sk-space-4);display:flex;flex-direction:column;gap:var(--sk-space-3);align-items:flex-start;">
      ${TONES.map(tonePill).join('')}
    </div>
  `,
};

/**
 * FAIL OPEN. `status="rogue"` is not a tone, and the tag does not helpfully guess one. It
 * renders the base tag, keeps its slotted label, and warns once in the console — it does not
 * throw, which would blank the shadow root and eat the slotted content (the same regression
 * `sk-card`'s #72 measured). `status=""` is separately shown as ABSENT, not unknown.
 */
export const UnknownStatus: Story = {
  render: () => `
    <div style="display:flex;gap:var(--sk-space-4);background:var(--sk-surface-page);padding:var(--sk-space-6);">
      <sk-pill-tag status="rogue">Still renders, still slotted</sk-pill-tag>
      <sk-pill-tag status="">An empty status is ABSENT, not unknown</sk-pill-tag>
    </div>
  `,
};

/**
 * FORCED COLORS — the comparison, not a second copy of AllStatuses. Under
 * `forced-colors: active` every tone collapses to the system surface — `background` flattens to
 * `Canvas`, so the six tints become one ground and the tone is gone. What survives is the
 * `border` each `.sk-pill-tag--status-<tone>` rule adds ONLY inside this media query — this
 * component has no border outside it. The base pill (marked `data-forced-colors-base`) is
 * included so the comparison is visible rather than merely described.
 *
 * Asserted, not eyeballed: `apps/storybook/src/tests/elements-load.spec.ts` loads this story
 * under `page.emulateMedia({ forcedColors: 'active' })` in both colour schemes and requires
 * every status pill's computed border-width to be non-zero where the base pill's stays `0px`.
 */
export const ForcedColors: Story = {
  render: () => grid(`
    <sk-pill-tag data-forced-colors-base>No status — the width the six below are measured against</sk-pill-tag>
    ${TONES.map(tonePill).join('')}
  `),
};

/**
 * LightMode is required of every story (CLAUDE.md §3), wrapped in `class="sk-light"` — never
 * `data-theme="light"`, which activates nothing on a wrapper because the token block anchors on
 * `:root[data-theme="light"], .sk-light` and `:root` only ever matches `<html>` (#93).
 *
 * At least one status tone is included per #302's own exit criteria: verified, not assumed —
 * fixtures/elements-behaviour/src/sk-pill-tag.test.ts asserts every tone's surface resolves
 * differently between the two themes.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display:flex; gap:var(--sk-space-3); flex-wrap:wrap;">
      <sk-pill-tag>v1.0.0</sk-pill-tag>
      <sk-pill-tag variant="green">SemVer</sk-pill-tag>
      <sk-pill-tag variant="purple">Skills Pack</sk-pill-tag>
      <sk-pill-tag shape="eyebrow">Eyebrow on light</sk-pill-tag>
      <sk-pill-tag status="success">Active</sk-pill-tag>
      <sk-pill-tag status="danger">Revoked</sk-pill-tag>
    </div>
  `,
};
