import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-card.js';
import '../status-indicator/sk-status-indicator.js';

/**
 * <sk-card> — ADR-8 confirmation #1: one CSS source, three consumption paths, no wrapper.
 *
 * Variants are ATTRIBUTES here (`variant="blue"`), not the classes the static layer uses.
 * The adopted stylesheet is byte-identical to packages/styles/src/card/sk-card.css.
 *
 * TWO AXES since #177. `variant` is the brand/decorative axis; `status` is the operational one,
 * carrying the same six tones `sk-status-indicator` owns. A card may set either, both, or
 * neither — but where both are set the RENDERING is precedence, not co-existence: the
 * operational tone supersedes the brand variant's surface and edge entirely. See
 * StatusWithVariant.
 */
const meta: Meta = {
  title: 'Elements/SkCard',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => '<sk-card><p>Card content</p></sk-card>',
};

export default meta;
type Story = StoryObj;

/**
 * The six tones, each labelled by its own slotted text.
 *
 * READ THE TEXT, NOT THE HUE. Every card below is interpretable with the colour removed —
 * that is the Greyscale story's assertion, and it is the reason the label is inside the card
 * rather than in a story caption.
 */
const TONES = ['neutral', 'info', 'success', 'attention', 'danger', 'recovery'] as const;

const LABEL: Record<(typeof TONES)[number], string> = {
  neutral: 'Not started',
  info: 'Collecting evidence',
  success: 'Verification complete',
  attention: 'Review needed',
  danger: 'Delivery blocked',
  recovery: 'Recovering',
};

const toneCard = (tone: (typeof TONES)[number]) => `
  <sk-card status="${tone}">
    <sk-status-indicator tone="${tone}"><span slot="marker">●</span>${LABEL[tone]}</sk-status-indicator>
  </sk-card>
`;

const grid = (body: string, attrs = '') => `
  <div${attrs} style="display:grid;gap:var(--sk-space-4);background:var(--sk-surface-page);padding:var(--sk-space-6);">
    ${body}
  </div>
`;

const allTones = (attrs = '') => grid(TONES.map(toneCard).join(''), attrs);

/** The base card. No status, no variant — the axis is opt-in and this is what "off" looks like. */
export const Default: Story = {};

export const Blue: Story = {
  render: () => '<sk-card variant="blue"><p>Information card</p></sk-card>',
};

export const Purple: Story = {
  render: () => '<sk-card variant="purple"><p>Architecture card</p></sk-card>',
};

export const Inset: Story = {
  render: () => '<sk-card inset><p>Inset card</p></sk-card>',
};

export const StatusNeutral: Story = { render: () => toneCard('neutral') };
export const StatusInfo: Story = { render: () => toneCard('info') };
export const StatusSuccess: Story = { render: () => toneCard('success') };
export const StatusAttention: Story = { render: () => toneCard('attention') };
export const StatusDanger: Story = { render: () => toneCard('danger') };
export const StatusRecovery: Story = { render: () => toneCard('recovery') };

/** All six together, for comparing the scale rather than one tone at a time. */
export const AllStatuses: Story = { render: () => allTones() };

/**
 * ORTHOGONAL AS INPUTS, PRECEDENCE IN RENDERING — and the first row is the proof.
 *
 * An earlier revision of this story set `variant="blue" status="attention"` beside
 * `variant="purple" status="attention"` and claimed it "varies the brand variant at a fixed
 * status". Those two render PIXEL-IDENTICAL, so it varied nothing observable and demonstrated
 * the opposite of what it said. The first row now shows that on purpose, with the third cell
 * naming what it means: while a status is present the operational tone supersedes the brand
 * variant's surface and edge entirely, because `.sk-card--blue` declares only `background` and
 * `border-color` and the status rules declare both, later, at equal specificity.
 *
 * The axes stay orthogonal as INPUTS — both can be set, both reflect, neither errors, both
 * modifiers stay on the node — and the second row shows the variant is not inert in general:
 * remove the status and it paints again.
 *
 * Whether a brand accent SHOULD survive under an operational tone is a design decision and is
 * not this story's to make. Pinned by the precedence test in
 * fixtures/elements-behaviour/src/sk-card.test.ts, which asserts identity rather than
 * difference — deliberately, since difference is exactly what would need deciding first.
 */
export const StatusWithVariant: Story = {
  render: () => `
    <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:var(--sk-space-4);background:var(--sk-surface-page);padding:var(--sk-space-6);">
      <sk-card variant="blue" status="attention">
        <sk-status-indicator tone="attention"><span slot="marker">●</span>Review needed</sk-status-indicator>
        <p style="margin:var(--sk-space-3) 0 0">variant="blue" status="attention"</p>
      </sk-card>
      <sk-card variant="purple" status="attention">
        <sk-status-indicator tone="attention"><span slot="marker">●</span>Review needed</sk-status-indicator>
        <p style="margin:var(--sk-space-3) 0 0">variant="purple" status="attention"</p>
      </sk-card>
      <sk-card status="attention">
        <sk-status-indicator tone="attention"><span slot="marker">●</span>Review needed</sk-status-indicator>
        <p style="margin:var(--sk-space-3) 0 0">status="attention", no variant — all three of these render identically</p>
      </sk-card>
      <sk-card variant="purple" status="success">
        <sk-status-indicator tone="success"><span slot="marker">●</span>Verification complete</sk-status-indicator>
        <p style="margin:var(--sk-space-3) 0 0">the status is what varies</p>
      </sk-card>
      <sk-card variant="purple">
        <p>variant="purple", no status — the brand variant paints again</p>
      </sk-card>
      <sk-card>
        <p>neither axis</p>
      </sk-card>
    </div>
  `,
};

/**
 * THE MISSION'S PROOF — a status card, with no status-card element.
 *
 * `sk-card[status]` + `sk-status-indicator` (#146) + `.sk-facts` and `.sk-disclosure` (#176).
 * Every part already existed; #177 added only the surface they compose onto.
 *
 * The `<dl>` and the `<details>` are in LIGHT DOM, assigned to the card's default slot. That is
 * not incidental — ADR-10's styles-only ruling records why a wrapper element cannot own them:
 * a shadow root between a `<dl>` and its `<dt>`/`<dd>` severs the list, and `<details>` open
 * state is UA-owned. A `<sk-status-card>` would have had to break one or reimplement the other.
 *
 * Their CSS is loaded by the Storybook preview rather than imported here: packages/elements may
 * not import a stylesheet (ADR-10 §1) and packages/styles may not import an element (module
 * boundaries), so `scope:storybook` is the only layer that can see both. See preview.ts.
 */
export const StatusCardComposition: Story = {
  render: () => `
    <div style="max-width:calc(var(--sk-space-12) * 4);background:var(--sk-surface-page);padding:var(--sk-space-6);">
      <sk-card status="danger">
        <sk-status-indicator tone="danger"><span slot="marker">●</span>Delivery blocked</sk-status-indicator>
        <dl class="sk-facts sk-facts--two-col" style="margin-block-start:var(--sk-space-4);">
          <dt class="sk-facts__term">Owner</dt>
          <dd class="sk-facts__value">Ada Lovelace</dd>
          <dt class="sk-facts__term">Opened</dt>
          <dd class="sk-facts__value">3 days ago</dd>
          <dt class="sk-facts__term">Region</dt>
          <dd class="sk-facts__value">us-east-1</dd>
        </dl>
        <details class="sk-disclosure" style="margin-block-start:var(--sk-space-4);">
          <summary class="sk-disclosure__summary">Detail</summary>
          <div class="sk-disclosure__body">
            <p>The consumer supplies both the tone and the text. The card infers neither.</p>
          </div>
        </details>
      </sk-card>
    </div>
  `,
};

/**
 * FAIL OPEN. `status="failed"` is not a tone — and note that the card does not helpfully decide
 * it means `danger`. It renders the base card, keeps its children, and warns once in the
 * console. It does not throw: a throw inside `render()` makes Lit reject `updateComplete` and
 * paints an EMPTY shadow root with no `<slot>`, so the element silently eats its own light-DOM
 * children. That was measured in #72 and is pinned by
 * fixtures/elements-behaviour/src/sk-card.test.ts.
 */
export const UnknownStatus: Story = {
  render: () => `
    <div style="display:grid;gap:var(--sk-space-4);background:var(--sk-surface-page);padding:var(--sk-space-6);">
      <sk-card status="failed">
        <p>The card still paints, and this content is still here.</p>
      </sk-card>
      <sk-card status="">
        <p>An empty status is ABSENT, not unknown — no class, no warning.</p>
      </sk-card>
    </div>
  `,
};

/**
 * TONE IS NEVER THE ONLY CARRIER OF MEANING.
 *
 * The same six cards as AllStatuses, desaturated in the browser. Every one is still readable
 * and still says what it is, because the meaning is in the slotted indicator's TEXT and the
 * card only supplies a surface and an edge.
 *
 * This is the defect #177 exists to remove, shown as its own absence: at
 * factory-dashboard@1fb95bc the border hue was the sole carrier of "this run failed", and that
 * panel goes blank here.
 */
export const Greyscale: Story = {
  render: () =>
    `<div style="filter:grayscale(1) contrast(1.05);">${allTones()}</div>`,
};

/**
 * FORCED COLORS, as a documented baseline.
 *
 * Under `forced-colors: active` every tone collapses to the system surface — `background`
 * flattens to `Canvas`, so the six tints become one ground and the tone is gone. The card
 * therefore does not depend on `background-color`: the EDGE survives, drawn on the longhand
 * `border-inline-start-color` with `CanvasText`, and the widened inline-start step is what is
 * left distinguishing a status card from a plain one.
 *
 * To see it: emulate forced colors (DevTools → Rendering → Emulate CSS media feature
 * forced-colors, or `page.emulateMedia({ forcedColors: 'active' })`). Nothing here sets
 * `forced-color-adjust: none`, which would freeze a value at its authored colour and is
 * frequently invisible against the forced-colors background.
 */
export const ForcedColors: Story = { render: () => allTones() };

/**
 * LightMode is required of every story by CLAUDE.md §3 — and this mission's exit criteria
 * say to VERIFY it renders light-mode styling rather than assume it.
 *
 * It does, and it is the reason this mission touched tokens. `sk-card.css` used to carry
 * `:root[data-theme="light"] .sk-card--blue` and `.sk-light .sk-card--blue`. Both cross a
 * shadow boundary, so inside <sk-card> both are inert — this story would have rendered
 * DARK borders on a light ground, with no error and no warning. Light-mode variance now
 * lives in `--sk-border-tint-{sky,lilac}` and, since #177, in `--sk-status-*` /
 * `--sk-on-status-*`; a custom property inherits through the boundary where a selector does
 * not.
 *
 * The wrapper carries `class="sk-light"`, not `data-theme="light"`: the token package
 * anchors its light block on `:root[data-theme="light"], .sk-light`, and `:root` only ever
 * matches <html>, so the attribute on a wrapping div activates nothing (#93).
 *
 * EVERY TONE, not a sample. fixtures/elements-behaviour/src/sk-card.test.ts iterates
 * CARD_STATUSES and requires each tone's surface AND edge to differ between the themes, so a
 * tone whose light value was never defined fails there rather than here.
 *
 * Asserted, not eyeballed: the same file reads the computed border colour under both themes
 * and requires them to differ.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    ${grid(
      `<sk-card variant="blue"><p>Information card</p></sk-card>
       <sk-card variant="purple"><p>Architecture card</p></sk-card>`,
      ' class="sk-light"',
    )}
    ${allTones(' class="sk-light"')}
  `,
};
